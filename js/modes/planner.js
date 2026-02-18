/* ══════════════════════════════════════════════════════════
   AetherIDE — Planner Mode v3
   Flash (hızlı) & Pro (derin düşünme) modları
   ══════════════════════════════════════════════════════════ */

const PlannerMode = {

    currentPlan: null,
    phase: 'planning', // planning | reviewing | coding
    speed: 'flash',    // flash | pro
    thinkingContent: '',
    thinkingCollapsed: false,

    // ── Flash vs Pro ayarları ──
    SPEED_CONFIG: {
        flash: {
            planPrompt: `You are an expert programmer and planner. Analyze the user's request and create a clear plan.

RULES:
- Create a concise step-by-step plan
- Use numbered steps
- Be efficient and direct
- Do NOT write any code yet
- End by asking the user to approve, modify, or reject

Start with "📋 **Plan:**"`,
            codePrompt: `The user approved the plan. Implement it completely. Write ALL the code needed.`,
            temperature: 0.7,
            maxTokens: 4096,
        },
        pro: {
            planPrompt: `You are a senior software architect and expert programmer. The user wants a deeply thought-out plan.

RULES:
- Think through the problem step by step in a <thinking> block first
- Consider multiple approaches and pick the best one
- Analyze edge cases, potential issues, and scalability
- Create a comprehensive, detailed plan with clear reasoning
- Include architecture decisions and why you chose them
- Suggest file structure with explanations
- Estimate complexity and potential challenges
- Do NOT write any code yet
- End by asking the user to approve, modify, or reject

FORMAT:
1. First, wrap your reasoning in <thinking>...</thinking> tags
2. Then present the clean plan starting with "📋 **Plan:**"

Think deeply. Quality over speed.`,
            codePrompt: `The user approved a carefully thought-out plan. Now implement it with the highest quality.
- Write clean, well-documented, production-ready code
- Handle edge cases
- Add proper error handling
- Follow best practices
- Include comments explaining complex logic`,
            temperature: 0.3,
            maxTokens: 8192,
        },
    },

    getConfig() {
        return this.SPEED_CONFIG[this.speed] || this.SPEED_CONFIG.flash;
    },

    async send(chat, model) {
        if (this.phase === 'coding') {
            await this.executePlan(chat, model);
            return;
        }

        Chat.setGenerating(true);
        this.thinkingContent = '';

        const config = this.getConfig();
        const fileContext = this.buildFileContext();

        const planPrompt = fileContext
            ? config.planPrompt + '\n\n' + fileContext
            : config.planPrompt;

        // Mesajları filtrele
        const messages = [];
        for (const m of chat.messages) {
            if (m.role === 'user' || m.role === 'assistant') {
                messages.push({ role: m.role, content: m.content });
            }
        }

        if (messages.length === 0) {
            Chat.addAssistantMessage('No message to process. Please type something.');
            Chat.setGenerating(false);
            return;
        }

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: planPrompt,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
            });

            if (!result) {
                Chat.addAssistantMessage(Utils.formatErrorMessage('No response received from the AI.'));
                Chat.setGenerating(false);
                return;
            }

            if (result.aborted) {
                Utils.toast('Generation stopped', 'info');
                Chat.setGenerating(false);
                return;
            }

            let fullContent = '';

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                try {
                    for await (const chunk of result) {
                        if (!chunk) continue;
                        fullContent += chunk;

                        if (this.speed === 'pro') {
                            this.processThinking(fullContent);
                        }

                        Chat.updateStreamMessage(this.getDisplayContent(fullContent));
                    }
                } catch (streamError) {
                    if (streamError.name !== 'AbortError') {
                        console.error('Planner stream error:', streamError);
                    }
                    if (!fullContent.trim()) {
                        Chat.addAssistantMessage(`**Error:** Stream failed: ${streamError.message}`);
                        Chat.setGenerating(false);
                        return;
                    }
                }
            } else if (result && result.content) {
                fullContent = result.content;
                if (this.speed === 'pro') {
                    this.processThinking(fullContent);
                }
            }

            if (fullContent.trim()) {
                this.currentPlan = fullContent;
                this.phase = 'reviewing';

                const displayContent = this.getDisplayContent(fullContent);
                Chat.addAssistantMessage(displayContent);

                if (this.speed === 'pro' && this.thinkingContent) {
                    this.showThinkingDisplay(true);
                }

                this.showPlanActions(true);
            } else {
                Chat.addAssistantMessage('**Error:** Empty response from AI. Please try again.');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                Utils.toast('Generation stopped', 'info');
            } else {
                Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
                const friendly = Utils.friendlyError(error.message);
                Utils.toast(friendly.friendly, 'error');
            }
        } finally {
            Chat.setGenerating(false);
        }
    },

    buildFileContext() {
        if (Editor.files.length === 0) return '';

        let context = '\n\n--- CURRENT PROJECT FILES ---\n';
        context += `Total files: ${Editor.files.length}\n`;

        for (const file of Editor.files) {
            const lines = file.code.split('\n').length;
            const chars = file.code.length;
            const preview = chars > 3000
                ? file.code.substring(0, 3000) + '\n... (truncated, full file has ' + lines + ' lines)'
                : file.code;
            context += `\n📄 ${file.filename} (${file.language}, ${lines} lines, ${chars} chars):\n\`\`\`${file.language}:${file.filename}\n${preview}\n\`\`\`\n`;
        }

        context += '--- END PROJECT FILES ---\n\n';
        context += `CRITICAL RULES FOR MODIFYING EXISTING FILES:
1. When updating a file, you MUST output the COMPLETE file content — every single line.
2. NEVER use placeholders like "// rest of code remains same", "// ...", "/* existing code */", or "// unchanged".
3. NEVER skip, abbreviate, or summarize any part of the code.
4. Use the exact format: \`\`\`language:filename.ext
5. If you only need to change 2 lines in a 200-line file, you must still output all 200 lines.
6. Files can include folder paths like: \`\`\`javascript:src/utils/helpers.js
7. Maintain the same coding style and conventions as the existing code.
8. Preserve all existing functionality unless explicitly asked to remove it.\n`;

        return context;
    },

    async executePlan(chat, model) {
        Chat.setGenerating(true);
        this.showPlanActions(false);
        this.showThinkingDisplay(false);
        this.thinkingContent = '';

        const config = this.getConfig();
        const basePrompt = Storage.getSettings().systemPrompt;
        const fileContext = this.buildFileContext();

        const systemPrompt = basePrompt + '\n\n' + config.codePrompt + fileContext;

        const messages = [];
        for (const m of chat.messages) {
            if (m.role === 'user' || m.role === 'assistant') {
                messages.push({ role: m.role, content: m.content });
            }
        }

        let fullContent = '';

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
            });

            if (!result) {
                Chat.addAssistantMessage(Utils.formatErrorMessage('No response received from the AI.'));
                this.phase = 'planning';
                this.currentPlan = null;
                Chat.setGenerating(false);
                return;
            }

            if (result.aborted) {
                Utils.toast('Generation stopped', 'info');
                this.phase = 'planning';
                this.currentPlan = null;
                Chat.setGenerating(false);
                return;
            }

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let lastCodeUpdate = 0;

                try {
                    for await (const chunk of result) {
                        if (!chunk) continue;
                        fullContent += chunk;

                        if (this.speed === 'pro') {
                            this.processThinking(fullContent);
                        }

                        Chat.updateStreamMessage(this.getDisplayContent(fullContent));

                        const now = Date.now();
                        if (fullContent.includes('```') && now - lastCodeUpdate > 800) {
                            Editor.updateCode(fullContent);
                            lastCodeUpdate = now;
                        }
                    }
                } catch (streamError) {
                    if (streamError.name !== 'AbortError') {
                        console.error('Planner executePlan stream error:', streamError);
                    }
                }
            } else if (result && result.content) {
                fullContent = result.content;
            }

            if (fullContent.trim()) {
                const displayContent = this.getDisplayContent(fullContent);
                Chat.addAssistantMessage(displayContent);

                if (fullContent.includes('```')) {
                    Editor.updateCode(fullContent);
                }

                if (this.speed === 'pro' && this.thinkingContent) {
                    this.showThinkingDisplay(true);
                }
            } else {
                Chat.addAssistantMessage('**Error:** Empty response. Please try again.');
            }

            this.phase = 'planning';
            this.currentPlan = null;
        } catch (error) {
            if (error.name === 'AbortError') {
                if (fullContent.trim()) {
                    Chat.addAssistantMessage(this.getDisplayContent(fullContent));
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                    Utils.toast('Stream interrupted — partial content saved', 'warning');
                } else {
                    Utils.toast('Generation stopped', 'info');
                }
            } else {
                Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
                const friendly = Utils.friendlyError(error.message);
                Utils.toast(friendly.friendly, 'error');
            }
            this.phase = 'planning';
            this.currentPlan = null;
        } finally {
            Chat.setGenerating(false);
        }
    },

    // ── Thinking bloğunu işle ──
    processThinking(content) {
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)(<\/thinking>|$)/);
        if (thinkingMatch) {
            this.thinkingContent = thinkingMatch[1].trim();
            this.updateThinkingUI();
        }
    },

    // ── Thinking bloğunu mesajdan çıkar ──
    getDisplayContent(content) {
        // <thinking>...</thinking> bloğunu kaldır
        let display = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        // Kapanmamış thinking bloğunu da kaldır (stream sırasında)
        display = display.replace(/<thinking>[\s\S]*$/g, '').trim();
        return display;
    },

    // ── Thinking UI ──
    updateThinkingUI() {
        const textEl = document.getElementById('thinking-text');
        if (textEl && this.thinkingContent) {
            textEl.innerHTML = Utils.parseMarkdown(this.thinkingContent);
            if (window.lucide) lucide.createIcons({ nodes: [textEl] });
        }
    },

    showThinkingDisplay(show) {
        const el = document.getElementById('planner-thinking-display');
        if (!el) return;

        el.style.display = show ? 'block' : 'none';

        if (show) {
            this.updateThinkingUI();

            // Collapse toggle
            const collapseBtn = document.getElementById('thinking-collapse-btn');
            if (collapseBtn) {
                collapseBtn.onclick = () => {
                    this.thinkingCollapsed = !this.thinkingCollapsed;
                    const content = document.getElementById('thinking-content');
                    if (content) {
                        content.style.display = this.thinkingCollapsed ? 'none' : 'block';
                    }
                    const icon = collapseBtn.querySelector('[data-lucide]');
                    if (icon) {
                        icon.setAttribute('data-lucide', this.thinkingCollapsed ? 'chevron-right' : 'chevron-down');
                        if (window.lucide) lucide.createIcons({ nodes: [collapseBtn] });
                    }
                };
            }
        }
    },

    // ── Plan Actions ──
    showPlanActions(show) {
        const actions = document.getElementById('planner-actions');
        if (!actions) return;

        actions.style.display = show ? 'flex' : 'none';

        if (show) {
            document.getElementById('plan-approve-btn').onclick = () => {
                this.phase = 'coding';
                this.showPlanActions(false);
                this.showThinkingDisplay(false);
                if (Chat.currentChat) {
                    Chat.currentChat.messages.push({
                        role: 'user',
                        content: '✅ Plan approved. Please implement it now.',
                        timestamp: new Date().toISOString(),
                    });
                    Chat.renderMessages();
                    Chat.forceScrollToBottom();
                    this.executePlan(Chat.currentChat, App.currentModel);
                }
            };

            document.getElementById('plan-modify-btn').onclick = () => {
                this.showPlanActions(false);
                this.phase = 'planning';
                const input = document.getElementById('message-input');
                if (input) {
                    input.placeholder = 'Describe what to change in the plan...';
                    input.focus();
                }
            };

            document.getElementById('plan-reject-btn').onclick = () => {
                this.showPlanActions(false);
                this.showThinkingDisplay(false);
                this.phase = 'planning';
                this.currentPlan = null;
                this.thinkingContent = '';
                Chat.addAssistantMessage('Plan rejected. Please describe what you want differently.');
                Utils.toast('Plan rejected', 'info');
            };
        }
    },
};
