/* ══════════════════════════════════════════════════════════
   AetherIDE — Planner Mode v2
   ══════════════════════════════════════════════════════════ */

const PlannerMode = {

    currentPlan: null,
    phase: 'planning',

    async send(chat, model) {
        if (this.phase === 'coding') {
            await this.executePlan(chat, model);
            return;
        }

        Chat.setGenerating(true);

        const systemPrompt = `You are an expert programmer and planner. The user wants you to plan before coding.

PHASE: PLANNING
- Analyze the user's request carefully
- Create a detailed step-by-step plan
- Format your plan clearly with numbered steps
- Do NOT write any code yet
- Ask the user to approve, modify, or reject the plan

Start your response with "📋 **Plan:**" and end with asking for approval.`;

        const messages = chat.messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const result = await API.sendMessage(messages, model, { systemPrompt });
            let fullContent = '';

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    fullContent += chunk;
                    Chat.updateStreamMessage(fullContent);
                }
            } else if (result && result.content) {
                fullContent = result.content;
            }

            if (fullContent) {
                this.currentPlan = fullContent;
                this.phase = 'reviewing';
                Chat.addAssistantMessage(fullContent);
                this.showPlanActions(true);
            }
        } catch (error) {
            Chat.addAssistantMessage(`**Error:** ${error.message}`);
            Utils.toast(error.message, 'error');
        } finally {
            Chat.setGenerating(false);
        }
    },

    async executePlan(chat, model) {
        Chat.setGenerating(true);
        this.showPlanActions(false);

        const systemPrompt = Storage.getSettings().systemPrompt +
            '\n\nThe user approved a plan. Now implement it completely. Write ALL the code needed.';

        const messages = chat.messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const result = await API.sendMessage(messages, model, { systemPrompt });
            let fullContent = '';

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    fullContent += chunk;
                    Chat.updateStreamMessage(fullContent);
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                }
            } else if (result && result.content) {
                fullContent = result.content;
            }

            if (fullContent) {
                Chat.addAssistantMessage(fullContent);
                if (fullContent.includes('```')) {
                    Editor.updateCode(fullContent);
                }
            }

            this.phase = 'planning';
            this.currentPlan = null;
        } catch (error) {
            Chat.addAssistantMessage(`**Error:** ${error.message}`);
            Utils.toast(error.message, 'error');
        } finally {
            Chat.setGenerating(false);
        }
    },

    showPlanActions(show) {
        const actions = document.getElementById('planner-actions');
        if (!actions) return;

        actions.style.display = show ? 'flex' : 'none';

        if (show) {
            document.getElementById('plan-approve-btn').onclick = () => {
                this.phase = 'coding';
                this.showPlanActions(false);
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
                this.phase = 'planning';
                this.currentPlan = null;
                Chat.addAssistantMessage('Plan rejected. Please describe what you want differently.');
                Utils.toast('Plan rejected', 'info');
            };
        }
    },
};