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
            planPrompt: `You are an expert full-stack developer and planner.

IMPORTANT: If the user's message is a greeting, casual question, or non-coding conversation (like "hello", "how are you", "what can you do", "thanks", etc.), respond naturally and conversationally WITHOUT creating a plan. Only create a plan when the user explicitly asks for a project, feature, or code.

When the user DOES request a project or code, analyze their request and create a clear, actionable plan.

RULES:
- Create a concise step-by-step plan with numbered steps
- Include a brief file structure overview
- Mention key design choices (colors, layout approach)
- Be efficient and direct — no unnecessary detail
- Do NOT write any code yet
- End by asking the user to approve, modify, or reject

Start with "📋 **Plan:**"`,
            codePrompt: `The user approved the plan. Implement it completely with high-quality, production-ready code.
- Write ALL files needed — complete, no placeholders
- Modern design with smooth transitions and responsive layout
- Use the format \`\`\`language:filename.ext for every file
- Clean code with proper error handling
- Accessible and performant`,
            temperature: 0.7,
            maxTokens: 4096,
        },
        pro: {
            planPrompt: `You are a world-class software architect, senior full-stack engineer, and UI/UX design expert with 15+ years of experience building production applications.

IMPORTANT: If the user's message is a greeting, casual question, or non-coding conversation (like "hello", "how are you", "what can you do", "thanks", etc.), respond naturally and conversationally WITHOUT creating a plan or using thinking tags. Only create a detailed plan when the user explicitly asks for a project, feature, or code.

When the user DOES request a project or code, create a meticulously crafted plan:

═══ THINKING PHASE ═══
First, wrap your deep analysis in <thinking>...</thinking> tags. Inside, you MUST:

🧠 PROBLEM ANALYSIS:
- Deconstruct the user's request into core requirements vs nice-to-haves
- Identify implicit requirements the user didn't mention but expects
- Define the target audience and use cases

🏗️ ARCHITECTURE DECISIONS:
- Evaluate 2-3 possible approaches with pros/cons
- Choose the best approach and justify WHY
- Consider scalability, maintainability, and performance
- Plan the data flow and state management strategy

🎨 DESIGN STRATEGY:
- Define the visual identity: color palette, typography, spacing system
- Plan the layout structure and responsive breakpoints
- Identify key UI components and their interaction patterns
- Plan micro-animations and transitions for polish
- Consider accessibility (WCAG AA) from the start
- Think about empty states, loading states, error states

⚠️ RISK ANALYSIS:
- Identify potential edge cases and failure points
- Plan error handling strategy
- Consider browser compatibility concerns
- Note any performance bottlenecks

═══ PLAN PRESENTATION ═══
After thinking, present a clean, actionable plan:

📋 **Plan:**

**1. Project Overview**
- One-paragraph summary of what will be built
- Key features list

**2. Architecture & File Structure**
\`\`\`
project/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
\`\`\`
- Explain each file's responsibility

**3. Design System**
- Color palette with hex codes
- Typography choices
- Spacing and layout grid
- Key UI components

**4. Implementation Phases**
- Phase 1: Core structure and layout
- Phase 2: Functionality and interactivity
- Phase 3: Polish, animations, and responsive design
- Phase 4: Error handling and edge cases

**5. Technical Highlights**
- Key algorithms or patterns to use
- Performance optimizations planned
- Accessibility features

**6. Potential Challenges**
- Known risks and mitigation strategies

End with: "Would you like to **approve** this plan, **modify** anything, or **reject** and start fresh?"

═══ RULES ═══
- Do NOT write any code — planning only
- Be specific, not vague — give exact colors, exact component names, exact file names
- Think like a senior engineer presenting to a team lead
- Quality and thoroughness over speed
- Every decision should have a reason`,
            codePrompt: `The user approved the plan. Now implement it with EXCEPTIONAL quality. You are writing code that should look and feel like a top-tier production application.

═══ IMPLEMENTATION STANDARDS ═══

🏗️ STRUCTURE:
- Follow the exact file structure from the approved plan
- Each file must be complete — no placeholders, no shortcuts
- Use the format \`\`\`language:filename.ext for every file
- Proper separation of concerns (HTML structure, CSS styling, JS logic)

🎨 DESIGN EXECUTION:
- Implement the exact design system from the plan (colors, typography, spacing)
- Use CSS custom properties (--variable) for all design tokens
- Smooth transitions on ALL interactive elements (0.2-0.3s ease)
- Subtle entrance animations for content (fadeIn, slideUp)
- Hover effects: scale, shadow, color transitions
- Focus states: visible focus rings for accessibility
- Responsive: mobile-first, test at 320px, 768px, 1024px, 1440px
- Use CSS Grid for layouts, Flexbox for component alignment
- Professional gradients, shadows, and border-radius
- Loading skeletons or spinners where appropriate
- Empty state illustrations or messages

💻 CODE QUALITY:
- Modern ES6+: const/let, arrow functions, template literals, destructuring, async/await
- Meaningful variable and function names (not x, temp, data)
- JSDoc comments for functions
- Modular code: separate concerns into functions
- Event delegation where appropriate
- Debounce scroll/resize handlers
- RequestAnimationFrame for visual updates
- Proper error boundaries and try/catch blocks
- Input validation and sanitization
- No memory leaks: clean up event listeners and intervals

📱 RESPONSIVE DESIGN:
- Mobile-first media queries
- Touch-friendly tap targets (min 44px)
- Proper viewport meta tag
- Flexible images and media
- Hamburger menu or bottom navigation for mobile
- No horizontal scroll on any device

♿ ACCESSIBILITY:
- Semantic HTML5 elements (header, nav, main, section, article, footer)
- ARIA labels on interactive elements
- Alt text on images
- Keyboard navigation support
- Skip to content link
- Color contrast ratio ≥ 4.5:1
- Focus management for modals/dialogs

🚀 PERFORMANCE:
- Minimal DOM manipulation — batch updates
- CSS containment where beneficial
- Lazy loading for images/heavy content
- Efficient selectors
- No layout thrashing

Write code that would impress a senior engineer during code review.`,
            temperature: 0.3,
            maxTokens: 16384,
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
                const errorMsg = error.message || String(error);
                Chat.addAssistantMessage(Utils.formatErrorMessage(errorMsg));
                const friendlyErr = Utils.friendlyError(errorMsg);
                Utils.toast(friendlyErr.friendly, 'error');
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
8. Preserve all existing functionality unless explicitly asked to remove it.

FILE REMOVAL RULES:
9. When the user asks to remove/delete a file, output ONLY the deletion marker:
    \`\`\`language:filename.ext
    // [DELETED]
    \`\`\`
10. When merging or restructuring files, output the deletion marker for every file that should no longer exist.
11. Never silently drop files — always be explicit about removals.\n`;

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
                const errorMsg = error.message || String(error);
                Chat.addAssistantMessage(Utils.formatErrorMessage(errorMsg));
                const friendlyErr = Utils.friendlyError(errorMsg);
                Utils.toast(friendlyErr.friendly, 'error');
            }
            this.phase = 'planning';
            this.currentPlan = null;
            this.thinkingContent = '';
            this.showThinkingDisplay(false);
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
