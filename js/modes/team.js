/* ══════════════════════════════════════════════════════════
   AetherIDE — Team Mode v2 (Beta)
   Dinamik model atama, hidden system prompts, mod kilidi
   ══════════════════════════════════════════════════════════ */

const TeamMode = {

    phase: 'idle',
    discussionLog: [],
    agreedPlan: '',
    discussionRounds: 3,

    // ── Her role özel gizli sistem promptları ──
    HIDDEN_SYSTEM_PROMPTS: {
        designer: `You are the DESIGNER agent in AetherIDE's Team Mode.
Your expertise: UI/UX design, visual aesthetics, accessibility, responsive layouts, color theory, typography.
Your responsibilities:
- Create beautiful, modern, user-friendly interfaces
- Ensure responsive design across all devices
- Choose appropriate color schemes, fonts, spacing
- Consider accessibility (ARIA, contrast ratios, keyboard navigation)
- Design intuitive user flows and interactions
- Write clean, well-structured CSS/SCSS
You collaborate with PM and Developer. Be constructive, creative, and practical.
When writing code, ONLY write CSS/style-related files using the format: \`\`\`css:filename.css`,

        pm: `You are the PROJECT MANAGER agent in AetherIDE's Team Mode.
Your expertise: Project architecture, file structure, HTML structure, planning, coordination.
Your responsibilities:
- Design clear project architecture and file structure
- Create well-organized HTML with semantic elements
- Coordinate between Designer and Developer
- Ensure all files reference each other correctly
- Break complex projects into manageable components
- Make decisive architectural choices
- Write clean, semantic HTML
You are the team leader. Be organized, clear, and decisive.
When writing code, ONLY write HTML/structure files using the format: \`\`\`html:filename.html`,

        developer: `You are the DEVELOPER agent in AetherIDE's Team Mode.
Your expertise: JavaScript, TypeScript, logic, algorithms, APIs, state management, interactivity.
Your responsibilities:
- Write clean, efficient, bug-free JavaScript
- Implement all interactive features and logic
- Handle events, state, DOM manipulation
- Integrate with Designer's CSS classes and PM's HTML structure
- Add error handling and edge cases
- Write performant, maintainable code
You make things work. Be practical, thorough, and solution-oriented.
When writing code, ONLY write JS/logic files using the format: \`\`\`javascript:filename.js`,
    },

    // ── Rol için model ID al ──
    getModelForRole(role) {
        const settings = Storage.getSettings();
        const roleModel = settings.teamModels?.[role];
        // Rol modeli atanmışsa onu kullan, yoksa ana modeli kullan
        return (roleModel && roleModel.trim()) ? roleModel : App.currentModel;
    },

    // ── Mod kilidi kontrolü ──
    isActive() {
        return this.phase !== 'idle';
    },

    async send(chat, model) {
        if (this.phase === 'coding') {
            await this.executeCode(chat, model);
            return;
        }

        this.phase = 'discussing';
        this.discussionLog = [];
        this.agreedPlan = '';

        Chat.setGenerating(true);
        this.showTeamAgents(true);

        const userRequest = chat.messages[chat.messages.length - 1]?.content || '';

        try {
            Chat.addAssistantMessage(
                '👥 **Team is discussing your request...**\nDesigner, PM, and Developer are collaborating behind the scenes.',
                'assistant'
            );

            for (let round = 1; round <= this.discussionRounds; round++) {
                // Designer
                this.setAgentActive('designer');
                this.updateDiscussionStatus(`Round ${round}/${this.discussionRounds} — Designer is thinking...`);
                const designerModel = this.getModelForRole('designer');
                const designerResponse = await this.runDiscussionAgent('designer', userRequest, designerModel, round);
                this.discussionLog.push({ agent: 'designer', round, content: designerResponse });

                // PM
                this.setAgentActive('pm');
                this.updateDiscussionStatus(`Round ${round}/${this.discussionRounds} — PM is reviewing...`);
                const pmModel = this.getModelForRole('pm');
                const pmResponse = await this.runDiscussionAgent('pm', userRequest, pmModel, round);
                this.discussionLog.push({ agent: 'pm', round, content: pmResponse });

                // Developer
                this.setAgentActive('developer');
                this.updateDiscussionStatus(`Round ${round}/${this.discussionRounds} — Developer is evaluating...`);
                const devModel = this.getModelForRole('developer');
                const devResponse = await this.runDiscussionAgent('developer', userRequest, devModel, round);
                this.discussionLog.push({ agent: 'developer', round, content: devResponse });
            }

            // PM plan sunar
            this.setAgentActive('pm');
            this.updateDiscussionStatus('PM is preparing the final plan...');

            const pmModel = this.getModelForRole('pm');
            const finalPlan = await this.generateFinalPlan(userRequest, pmModel);
            this.agreedPlan = finalPlan;
            this.phase = 'proposing';

            this.removeDiscussionStatus();
            this.clearAgentActive();

            const discussionSummary = this.formatDiscussionSummary();
            Chat.addAssistantMessage(discussionSummary + '\n\n' + finalPlan, 'pm');
            this.showApprovalActions(true);

        } catch (error) {
            this.phase = 'idle';
            this.clearAgentActive();
            this.removeDiscussionStatus();
            Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
            const friendly = Utils.friendlyError(error.message);
            Utils.toast(friendly.friendly, 'error');
        } finally {
            Chat.setGenerating(false);
        }
    },

    async runDiscussionAgent(agentType, userRequest, model, round) {
        const previousDiscussion = this.discussionLog
            .map(d => `[${d.agent.toUpperCase()} - Round ${d.round}]: ${d.content}`)
            .join('\n\n');

        const existingFiles = Editor.files.length > 0
            ? `\n\nEXISTING PROJECT FILES: ${Editor.files.map(f => f.filename).join(', ')}\nThe user may want modifications to these existing files.`
            : '';

        const prompts = {
            designer: `USER REQUEST: ${userRequest}${existingFiles}

${previousDiscussion ? `PREVIOUS DISCUSSION:\n${previousDiscussion}\n\n` : ''}

ROUND ${round}/${this.discussionRounds}:
${round === 1
    ? '- Share your initial UI/UX vision: layout, colors, typography, user flow\n- Identify potential design challenges\n- Suggest a visual approach'
    : '- Respond to PM and Developer\'s points\n- Refine your design based on feedback\n- Find common ground'}

Keep response under 150 words. Be constructive.`,

            pm: `USER REQUEST: ${userRequest}${existingFiles}

${previousDiscussion ? `PREVIOUS DISCUSSION:\n${previousDiscussion}\n\n` : ''}

ROUND ${round}/${this.discussionRounds}:
${round === 1
    ? '- Analyze request, break into components\n- Suggest architecture and file structure\n- Identify priorities and risks'
    : '- Consider Designer and Developer inputs\n- Refine architecture\n- Resolve disagreements\n- Work toward unified plan'}

Keep response under 150 words. Be organized.`,

            developer: `USER REQUEST: ${userRequest}${existingFiles}

${previousDiscussion ? `PREVIOUS DISCUSSION:\n${previousDiscussion}\n\n` : ''}

ROUND ${round}/${this.discussionRounds}:
${round === 1
    ? '- Evaluate technical feasibility\n- Suggest technologies and approach\n- Identify implementation challenges'
    : '- Respond to Designer UI requirements\n- Respond to PM architecture\n- Propose solutions\n- Converge on approach'}

Keep response under 150 words. Be practical.`,
        };

        const messages = [{ role: 'user', content: prompts[agentType] }];

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.HIDDEN_SYSTEM_PROMPTS[agentType],
                temperature: 0.8,
                maxTokens: 600,
                stream: false,
            });

            let content = '';
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) { content += chunk; }
            } else if (result?.content) {
                content = result.content;
            }

            // Boş veya çok kısa yanıt kontrolü
            if (!content || content.trim().length < 10) {
                content = `[${agentType}] I agree with the current direction. Let's proceed.`;
            }

            return content.trim();
        } catch (error) {
            console.error(`Discussion agent ${agentType} error:`, error);
            if (error.name === 'AbortError') throw error;
            return `[${agentType}] I'm ready to contribute. Let's move forward with the plan.`;
        }
    },

    async generateFinalPlan(userRequest, model) {
        const fullDiscussion = this.discussionLog
            .map(d => `[${d.agent.toUpperCase()} - Round ${d.round}]: ${d.content}`)
            .join('\n\n');

        const prompt = `Your team (Designer, PM, Developer) has finished discussing.

USER REQUEST: ${userRequest}

FULL TEAM DISCUSSION:
${fullDiscussion}

Create the FINAL UNIFIED PLAN. You MUST write the COMPLETE plan — do NOT cut off or truncate.

FORMAT:

📋 **Team Plan**

**🎨 Design Decisions:**
• [Key design choices]

**🏗️ Architecture:**
• [File structure and tech choices]

**📝 Implementation Steps:**
1. [Step 1]
2. [Step 2]
...

**📁 Files to Create:**
• [filename.ext] — [purpose]

**⏱️ Estimated Complexity:** [Low/Medium/High]

End with: "**Do you approve this plan?** We're ready to start coding!"

IMPORTANT: Write the COMPLETE plan. Do not stop early.`;

        const messages = [{ role: 'user', content: prompt }];

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.HIDDEN_SYSTEM_PROMPTS.pm + '\n\nYou are now presenting the final agreed plan to the user. Be clear, confident, and COMPLETE. Do NOT truncate your response.',
                maxTokens: 2500,
                temperature: 0.6,
                stream: false,
            });

            let content = '';
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) { content += chunk; }
            } else if (result?.content) {
                content = result.content;
            }

            if (!content || content.trim().length < 50) {
                return '📋 **Team Plan**\n\nThe team has reviewed your request and is ready to implement it. Please approve to start coding.';
            }

            return content.trim();
        } catch (error) {
            console.error('Final plan generation error:', error);
            if (error.name === 'AbortError') throw error;
            return '📋 **Team Plan**\n\nThe team has discussed your request. Please approve to start coding, or describe what you\'d like to change.';
        }
    },

    buildFileContext() {
        if (Editor.files.length === 0) return '';

        let context = '\n\n--- CURRENT PROJECT FILES ---\n';
        context += `Total files: ${Editor.files.length}\n`;

        for (const file of Editor.files) {
            const lines = file.code.split('\n').length;
            const chars = file.code.length;
            const preview = chars > 2500
                ? file.code.substring(0, 2500) + '\n... (truncated, full file has ' + lines + ' lines)'
                : file.code;
            context += `\n📄 ${file.filename} (${file.language}, ${lines} lines):\n\`\`\`${file.language}:${file.filename}\n${preview}\n\`\`\`\n`;
        }

        context += '--- END PROJECT FILES ---\n\n';
        context += `RULES: When modifying existing files, output the COMPLETE file. NEVER skip lines or use placeholders. Files can include folder paths like src/components/App.js\n`;

        return context;
    },

    async executeCode(chat, model) {
        Chat.setGenerating(true);
        this.showApprovalActions(false);
        this.showTeamAgents(true);

        const userRequest = chat.messages.find(m => m.role === 'user')?.content || '';
        const fullDiscussion = this.discussionLog
            .map(d => `[${d.agent.toUpperCase()}]: ${d.content}`)
            .join('\n\n');

        try {
            // Designer
            this.setAgentActive('designer');
            Chat.addAssistantMessage('🎨 **Designer** is creating styles...', 'designer');
            const designerModel = this.getModelForRole('designer');
            const designCode = await this.runCodingAgent('designer', userRequest, designerModel, fullDiscussion);

            // Stream mesajını temizle ve final mesajı ekle
            const streamMsg1 = document.getElementById('stream-message');
            if (streamMsg1) streamMsg1.remove();

            if (designCode) {
                Chat.addAssistantMessage(designCode, 'designer');
                Editor.updateCode(designCode);
            } else {
                Chat.addAssistantMessage('🎨 Designer completed (no CSS files needed).', 'designer');
            }

            // PM
            this.setAgentActive('pm');
            Chat.addAssistantMessage('📊 **PM** is building the structure...', 'pm');
            const pmModel = this.getModelForRole('pm');
            const pmCode = await this.runCodingAgent('pm', userRequest, pmModel, fullDiscussion, designCode);

            const streamMsg2 = document.getElementById('stream-message');
            if (streamMsg2) streamMsg2.remove();

            if (pmCode) {
                Chat.addAssistantMessage(pmCode, 'pm');
                Editor.updateCode(pmCode);
            } else {
                Chat.addAssistantMessage('📊 PM completed (no HTML files needed).', 'pm');
            }

            // Developer
            this.setAgentActive('developer');
            Chat.addAssistantMessage('💻 **Developer** is writing the logic...', 'developer');
            const devModel = this.getModelForRole('developer');
            const devCode = await this.runCodingAgent('developer', userRequest, devModel, fullDiscussion, designCode, pmCode);

            const streamMsg3 = document.getElementById('stream-message');
            if (streamMsg3) streamMsg3.remove();

            if (devCode) {
                Chat.addAssistantMessage(devCode, 'developer');
                Editor.updateCode(devCode);
            } else {
                Chat.addAssistantMessage('💻 Developer completed (no JS files needed).', 'developer');
            }

            this.clearAgentActive();
            Chat.addAssistantMessage(
                '✅ **Team coding complete!** All agents have finished.\n\nCheck the **Code** panel to see all generated files.',
                'assistant'
            );

            this.phase = 'idle';

        } catch (error) {
            this.clearAgentActive();
            Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
            const friendly = Utils.friendlyError(error.message);
            Utils.toast(friendly.friendly, 'error');
            this.phase = 'idle';
        } finally {
            Chat.setGenerating(false);
        }
    },

    async runCodingAgent(agentType, userRequest, model, discussion, prevCode1 = '', prevCode2 = '') {
        const basePrompt = Storage.getSettings().systemPrompt;
        const fileContext = this.buildFileContext();

        const roleContext = {
            designer: `Based on the team discussion, create or update the CSS/style files.
Make it beautiful and responsive.
${fileContext ? '\nExisting project files are provided below — update them if needed, or create new ones.' : ''}

IMPORTANT: Use the exact format \`\`\`css:filename.css for EVERY file you create.
Write COMPLETE files — never skip any code.`,

            pm: `Based on the team discussion, create or update the HTML structure files.
Reference the CSS files the designer created.
${fileContext ? '\nExisting project files are provided below — update them if needed, or create new ones.' : ''}

Designer's output:
${prevCode1}

IMPORTANT: Use the exact format \`\`\`html:filename.html for EVERY file you create.
Write COMPLETE files — never skip any code.
Make sure to link CSS files correctly.`,

            developer: `Based on the team discussion, create or update the JavaScript files.
Make everything functional.
${fileContext ? '\nExisting project files are provided below — update them if needed, or create new ones.' : ''}

Designer's CSS:
${prevCode1}

PM's HTML:
${prevCode2}

IMPORTANT: Use the exact format \`\`\`javascript:filename.js for EVERY file you create.
Write COMPLETE files — never skip any code.
Make sure to reference the correct HTML elements and CSS classes.`,
        };

        const prompt = `${roleContext[agentType]}

USER REQUEST: ${userRequest}

TEAM DISCUSSION SUMMARY:
${discussion}
${fileContext}

Write your code files now. Use the format \`\`\`language:filename.ext for each file. Write complete, production-ready code.`;

        const messages = [{ role: 'user', content: prompt }];

        const combinedSystemPrompt = this.HIDDEN_SYSTEM_PROMPTS[agentType] + '\n\n' + basePrompt;

        let content = '';

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: combinedSystemPrompt,
                maxTokens: 8192,
                temperature: 0.5,
            });

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let lastEditorUpdate = 0;
                for await (const chunk of result) {
                    content += chunk;
                    Chat.updateStreamMessage(content);

                    // Editörü stream sırasında güncelle
                    const now = Date.now();
                    if (content.includes('```') && now - lastEditorUpdate > 600) {
                        Editor.updateCode(content);
                        lastEditorUpdate = now;
                    }
                }
            } else if (result?.content) {
                content = result.content;
            }

            // Son güncelleme — stream bittikten sonra editörü kesin güncelle
            if (content && content.includes('```')) {
                Editor.updateCode(content);
            }

            return content.trim();
        } catch (error) {
            console.error(`Coding agent ${agentType} error:`, error);
            if (error.name === 'AbortError') throw error;
            // Partial content varsa kullan
            if (content && content.includes('```')) {
                Editor.updateCode(content);
                return content.trim();
            }
            return '';
        }
    },

    formatDiscussionSummary() {
        if (this.discussionLog.length === 0) return '';

        let summary = '**💬 Team Discussion** *(click to expand)*\n\n';
        summary += '<details><summary>View internal discussion</summary>\n\n';

        let currentRound = 0;
        for (const entry of this.discussionLog) {
            if (entry.round !== currentRound) {
                currentRound = entry.round;
                summary += `**--- Round ${currentRound} ---**\n\n`;
            }
            const icons = { designer: '🎨', pm: '📊', developer: '💻' };
            const names = { designer: 'Designer', pm: 'PM', developer: 'Developer' };
            summary += `${icons[entry.agent]} **${names[entry.agent]}:** ${entry.content}\n\n`;
        }

        summary += '</details>\n\n---\n\n';
        return summary;
    },

    // ── UI Helpers ──

    showTeamAgents(show) {
        const el = document.getElementById('team-agents');
        if (el) el.style.display = show ? 'flex' : 'none';
    },

    setAgentActive(agent) {
        document.querySelectorAll('.agent-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.agent === agent);
        });
    },

    clearAgentActive() {
        document.querySelectorAll('.agent-chip').forEach(chip => {
            chip.classList.remove('active');
        });
    },

    updateDiscussionStatus(text) {
        let statusEl = document.getElementById('team-discussion-status');
        if (!statusEl) {
            const container = document.getElementById('messages-container');
            if (!container) return;
            statusEl = document.createElement('div');
            statusEl.id = 'team-discussion-status';
            statusEl.className = 'team-discussion-status';
            container.appendChild(statusEl);
        }

        statusEl.innerHTML = `
            <div class="discussion-status-inner">
                <div class="discussion-dots"><span></span><span></span><span></span></div>
                <span class="discussion-status-text">${text}</span>
            </div>
        `;
        Chat.scrollToBottom(false);
    },

    removeDiscussionStatus() {
        const el = document.getElementById('team-discussion-status');
        if (el) el.remove();
    },

    showApprovalActions(show) {
        const actions = document.getElementById('planner-actions');
        if (!actions) return;

        actions.style.display = show ? 'flex' : 'none';

        if (show) {
            document.getElementById('plan-approve-btn').onclick = () => {
                this.phase = 'coding';
                this.showApprovalActions(false);
                if (Chat.currentChat) {
                    Chat.currentChat.messages.push({
                        role: 'user',
                        content: '✅ Plan approved! Team, please start coding.',
                        timestamp: new Date().toISOString(),
                    });
                    Chat.renderMessages();
                    Chat.forceScrollToBottom();
                    this.executeCode(Chat.currentChat, App.currentModel);
                }
            };

            document.getElementById('plan-modify-btn').onclick = () => {
                this.showApprovalActions(false);
                this.phase = 'idle';
                const input = document.getElementById('message-input');
                if (input) {
                    input.placeholder = 'Tell the team what to change...';
                    input.focus();
                }
                Utils.toast('Describe what to change — team will re-discuss', 'info');
            };

            document.getElementById('plan-reject-btn').onclick = () => {
                this.showApprovalActions(false);
                this.phase = 'idle';
                this.discussionLog = [];
                this.agreedPlan = '';
                Chat.addAssistantMessage('Plan rejected. Please describe what you want differently.', 'pm');
                Utils.toast('Plan rejected', 'info');
            };
        }
    },
};
