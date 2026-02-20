/* ══════════════════════════════════════════════════════════
   AetherIDE — Team Mode v3 (Beta)
   Gelişmiş agent iletişimi, tasarım odaklı, entegre kodlama
   ══════════════════════════════════════════════════════════ */

const TeamMode = {

    phase: 'idle',
    discussionLog: [],
    agreedPlan: '',
    discussionRounds: 3,

    // ═══ GELİŞMİŞ ROL SİSTEM PROMPTLARI ═══
    HIDDEN_SYSTEM_PROMPTS: {
        designer: `You are the DESIGNER agent in AetherIDE's collaborative Team Mode.

═══ YOUR IDENTITY ═══
You are a world-class UI/UX designer with expertise in:
- Modern web design trends (glassmorphism, neumorphism, gradients, micro-interactions)
- Color theory and palette creation (complementary, analogous, triadic schemes)
- Typography hierarchy and font pairing
- Spacing systems (4px/8px grid, consistent rem units)
- CSS architecture (custom properties, BEM-like naming, utility patterns)
- Animation and motion design (easing curves, meaningful transitions)
- Responsive design (mobile-first, fluid typography, container queries)
- Accessibility (WCAG AA contrast, focus states, reduced motion)
- Design systems and component libraries

═══ YOUR RESPONSIBILITIES ═══
- Create visually stunning, modern interfaces that feel premium
- Define the complete design system: colors, typography, spacing, shadows, borders
- Write production-quality CSS with smooth transitions on ALL interactive elements
- Ensure responsive layouts that work from 320px to 2560px
- Add micro-animations: hover effects, entrance animations, loading states
- Use CSS custom properties (--vars) for ALL design tokens
- Consider dark/light theme compatibility
- Design empty states, loading states, error states, success states
- Ensure accessibility: proper contrast, focus rings, semantic color usage

═══ CODE FORMAT ═══
ONLY write CSS/style files using: \`\`\`css:filename.css
Write COMPLETE files — never use placeholders or skip code.
Use CSS custom properties for all colors, spacing, and design tokens.

═══ COLLABORATION ═══
- Listen to PM's architecture decisions and Developer's technical constraints
- Be specific: give exact hex colors, exact pixel values, exact font names
- When disagreeing, explain WHY with design principles
- Always consider implementation feasibility`,

        pm: `You are the PROJECT MANAGER agent in AetherIDE's collaborative Team Mode.

═══ YOUR IDENTITY ═══
You are a senior technical PM and solutions architect with expertise in:
- Web application architecture and design patterns
- Semantic HTML5 and document structure
- Project organization and file structure
- Component-based thinking
- Integration coordination between design and development
- Requirements analysis and scope management
- Performance and SEO best practices

═══ YOUR RESPONSIBILITIES ═══
- Design the project architecture: file structure, component hierarchy, data flow
- Write clean, semantic HTML with proper document structure
- Ensure all files reference each other correctly (CSS links, JS scripts, assets)
- Coordinate between Designer and Developer to ensure seamless integration
- Make decisive architectural choices and justify them
- Include proper meta tags, viewport settings, favicon references
- Use semantic elements: header, nav, main, section, article, aside, footer
- Add ARIA labels, roles, and accessibility attributes
- Include proper loading order: CSS in head, JS before closing body
- Plan for scalability and maintainability

═══ CODE FORMAT ═══
ONLY write HTML/structure files using: \`\`\`html:filename.html
Write COMPLETE files — never use placeholders or skip code.
Ensure all CSS and JS files are properly linked.

═══ COLLABORATION ═══
- You are the team coordinator — resolve conflicts between Designer and Developer
- Reference Designer's CSS class names and custom properties in your HTML
- Provide clear element IDs and data attributes for Developer's JavaScript
- Be organized and systematic in your approach`,

        developer: `You are the DEVELOPER agent in AetherIDE's collaborative Team Mode.

═══ YOUR IDENTITY ═══
You are a senior full-stack JavaScript developer with expertise in:
- Modern ES6+ JavaScript (modules, async/await, destructuring, spread)
- DOM manipulation and event handling (delegation, custom events)
- State management patterns (pub/sub, observer, store patterns)
- API integration and data handling
- Error handling and defensive programming
- Performance optimization (debouncing, throttling, RAF, virtual scrolling)
- Browser APIs (IntersectionObserver, ResizeObserver, Web Storage, Fetch)
- Animation (CSS transitions trigger, Web Animations API, GSAP patterns)
- Security (XSS prevention, input sanitization, CSP awareness)

═══ YOUR RESPONSIBILITIES ═══
- Write clean, efficient, bug-free JavaScript that brings the UI to life
- Implement ALL interactive features, event handlers, and business logic
- Handle ALL edge cases: empty data, network errors, invalid input, race conditions
- Use proper error handling with try/catch and user-friendly error messages
- Write modular, reusable code with clear function separation
- Add JSDoc comments for all functions
- Implement smooth animations and transitions via JS when CSS alone isn't enough
- Ensure keyboard navigation and accessibility from JS side
- Add form validation, input sanitization, and security measures
- Optimize performance: efficient selectors, batch DOM updates, lazy loading

═══ CODE FORMAT ═══
ONLY write JS/logic files using: \`\`\`javascript:filename.js
Write COMPLETE files — never use placeholders or skip code.
Reference the exact CSS classes and HTML element IDs from Designer and PM.

═══ COLLABORATION ═══
- Study Designer's CSS classes and PM's HTML structure carefully
- Use the exact IDs, classes, and data attributes from the HTML
- Trigger CSS transitions/animations by adding/removing classes
- When disagreeing on approach, propose alternatives with reasoning
- Handle ALL states the Designer mentioned (loading, empty, error, success)`,
    },

    // ═══ TARTIŞMA PROMPTLARI ═══
    DISCUSSION_PROMPTS: {
        designer: {
            round1: `As the Designer, share your creative vision:

🎨 **Visual Direction:**
- Overall aesthetic and mood (modern, minimal, playful, corporate, etc.)
- Color palette: primary, secondary, accent, background, text colors (give HEX codes)
- Typography: font families, size scale, weight hierarchy
- Spacing system: base unit and scale

🖼️ **Layout Strategy:**
- Page layout approach (CSS Grid areas, Flexbox patterns)
- Responsive breakpoints and adaptation strategy
- Key UI components and their visual treatment

✨ **Polish & Delight:**
- Micro-interactions and hover effects planned
- Entrance/exit animations
- Loading and transition states

⚠️ **Design Concerns:**
- Potential accessibility issues to watch for
- Complex UI elements that need careful implementation`,

            roundN: `Review the PM and Developer's feedback, then:
- Refine your design based on their technical input
- Resolve any design conflicts
- Provide specific CSS implementation details for complex components
- Confirm final color codes, spacing values, and animation timings
- Address any accessibility concerns raised`,
        },
        pm: {
            round1: `As the PM, define the project architecture:

🏗️ **Architecture:**
- File structure with clear responsibilities
- Component hierarchy and relationships
- Data flow between components

📄 **HTML Structure:**
- Key semantic sections and their purposes
- Important element IDs and class naming conventions
- Forms, interactive areas, and their structure

🔗 **Integration Points:**
- How CSS files will be organized and linked
- Where JS scripts will be loaded and initialized
- Asset references and CDN dependencies

📋 **Priorities:**
- Must-have vs nice-to-have features
- Implementation order recommendation
- Risk areas that need careful attention`,

            roundN: `Consider Designer's visual direction and Developer's technical input:
- Finalize the HTML structure incorporating design requirements
- Confirm element IDs and data attributes Developer needs
- Resolve any architecture disagreements
- Ensure the structure supports all planned interactions
- Confirm file organization and naming conventions`,
        },
        developer: {
            round1: `As the Developer, evaluate technical implementation:

💻 **Technical Approach:**
- JavaScript patterns and architecture to use
- State management strategy
- Event handling approach (delegation vs direct)

⚙️ **Key Features:**
- Core functionality breakdown
- API integrations or data sources needed
- Complex algorithms or logic required

🛡️ **Robustness:**
- Edge cases to handle
- Error handling strategy
- Input validation requirements
- Performance considerations

🔌 **Integration Needs:**
- CSS classes/IDs needed from Designer/PM
- DOM structure requirements
- Events and callbacks between components`,

            roundN: `Review Designer's design system and PM's architecture:
- Confirm you can implement the planned interactions
- Request specific CSS classes or HTML structure if needed
- Suggest alternatives for technically complex designs
- Finalize the event handling and state management approach
- Address performance concerns for planned animations`,
        },
    },

    // ═══ MODEL ATAMA ═══
    getModelForRole(role) {
        const settings = Storage.getSettings();
        const roleModel = settings.teamModels?.[role];
        return (roleModel && roleModel.trim()) ? roleModel : App.currentModel;
    },

    isActive() {
        return this.phase !== 'idle';
    },

    // ═══ ANA GÖNDERİM ═══
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
                '👥 **Team Discussion Started**\n\n🎨 Designer, 📊 PM, and 💻 Developer are collaborating on your request.\n\n*Each agent brings their expertise to create the best solution...*',
                'assistant'
            );

            for (let round = 1; round <= this.discussionRounds; round++) {
                const agents = ['designer', 'pm', 'developer'];
                const statusLabels = {
                    designer: 'Designer is crafting the visual vision',
                    pm: 'PM is architecting the structure',
                    developer: 'Developer is evaluating the approach',
                };

                for (const agent of agents) {
                    this.setAgentActive(agent);
                    this.updateDiscussionStatus(`Round ${round}/${this.discussionRounds} — ${statusLabels[agent]}...`);

                    const agentModel = this.getModelForRole(agent);
                    const response = await this.runDiscussionAgent(agent, userRequest, agentModel, round);
                    this.discussionLog.push({ agent, round, content: response });
                }
            }

            // PM final plan sunar
            this.setAgentActive('pm');
            this.updateDiscussionStatus('PM is synthesizing the final plan from team discussion...');

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

            if (error.name === 'AbortError') {
                Utils.toast('Team discussion stopped', 'info');
            } else {
                Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
                const friendly = Utils.friendlyError(error.message);
                Utils.toast(friendly.friendly, 'error');
            }
        } finally {
            Chat.setGenerating(false);
        }
    },

    // ═══ TARTIŞMA AGENT'I ═══
    async runDiscussionAgent(agentType, userRequest, model, round) {
        const previousDiscussion = this.discussionLog
            .map(d => {
                const icons = { designer: '🎨', pm: '📊', developer: '💻' };
                const names = { designer: 'Designer', pm: 'PM', developer: 'Developer' };
                return `${icons[d.agent]} **${names[d.agent]}** (Round ${d.round}):\n${d.content}`;
            })
            .join('\n\n---\n\n');

        const existingFiles = Editor.files.length > 0
            ? `\n\n═══ EXISTING PROJECT FILES ═══\n${Editor.files.map(f => `• ${f.filename} (${f.language}, ${f.code.split('\n').length} lines)`).join('\n')}\nThe user may want modifications to these existing files.\n`
            : '';

        // Round'a göre doğru prompt'u seç
        const roundKey = round === 1 ? 'round1' : 'roundN';
        const rolePrompt = this.DISCUSSION_PROMPTS[agentType][roundKey];

        const prompt = `═══ USER REQUEST ═══
${userRequest}
${existingFiles}
${previousDiscussion ? `═══ TEAM DISCUSSION SO FAR ═══\n\n${previousDiscussion}\n\n` : ''}
═══ YOUR TURN (Round ${round}/${this.discussionRounds}) ═══
${rolePrompt}

Be specific, give concrete details (exact colors, exact patterns, exact element names).
Keep response under 250 words but make every word count.`;

        const messages = [{ role: 'user', content: prompt }];

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.HIDDEN_SYSTEM_PROMPTS[agentType],
                temperature: 0.75,
                maxTokens: 1000,
                stream: false,
            });

            let content = '';
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) { content += chunk; }
            } else if (result?.content) {
                content = result.content;
            }

            if (!content || content.trim().length < 20) {
                content = `I align with the team's direction. My key contribution: focusing on ${agentType === 'designer' ? 'visual polish and accessibility' : agentType === 'pm' ? 'clean architecture and integration' : 'robust implementation and error handling'}.`;
            }

            return content.trim();
        } catch (error) {
            console.error(`Discussion agent ${agentType} error:`, error);
            if (error.name === 'AbortError') throw error;
            return `Ready to contribute my ${agentType} expertise. Let's proceed with the plan.`;
        }
    },

    // ═══ FİNAL PLAN ═══
    async generateFinalPlan(userRequest, model) {
        const fullDiscussion = this.discussionLog
            .map(d => {
                const names = { designer: 'Designer', pm: 'PM', developer: 'Developer' };
                return `[${names[d.agent]} - Round ${d.round}]: ${d.content}`;
            })
            .join('\n\n');

        const existingFiles = Editor.files.length > 0
            ? `\nExisting files: ${Editor.files.map(f => f.filename).join(', ')}\n`
            : '';

        const prompt = `The team has completed ${this.discussionRounds} rounds of discussion. Create the FINAL UNIFIED PLAN.

═══ USER REQUEST ═══
${userRequest}
${existingFiles}
═══ COMPLETE TEAM DISCUSSION ═══
${fullDiscussion}

═══ YOUR TASK ═══
Synthesize everything into a comprehensive, actionable plan. You MUST include ALL of these sections:

📋 **Team Plan**

**🎨 Design System:**
• Color palette (primary, secondary, accent, bg, text — with HEX codes from Designer)
• Typography (fonts, sizes, weights — from Designer)
• Spacing and layout approach
• Key animations and transitions planned

**🏗️ Architecture & File Structure:**
\`\`\`
project/
├── index.html
├── styles.css
├── script.js
└── (other files)
\`\`\`
• Each file's responsibility

**📝 Implementation Plan:**
1. Designer creates: [specific CSS files and what they contain]
2. PM creates: [specific HTML files and structure]
3. Developer creates: [specific JS files and functionality]

**🔗 Integration Contract:**
• Key CSS class names Designer will create
• Key HTML element IDs PM will provide
• Key JS functions Developer will implement
• How files reference each other

**⚡ Features & Interactions:**
• [Feature 1]: how it works end-to-end
• [Feature 2]: how it works end-to-end

**⏱️ Estimated Complexity:** [Low / Medium / High]

End with: "**Do you approve this plan?** The team is ready to start coding!"

CRITICAL: Write the COMPLETE plan. Do NOT truncate or cut off. Every section must be filled.`;

        const messages = [{ role: 'user', content: prompt }];

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.HIDDEN_SYSTEM_PROMPTS.pm + '\n\nYou are presenting the final agreed plan. Be thorough, specific, and COMPLETE. Include exact color codes, exact file names, exact class names. Do NOT truncate.',
                maxTokens: 4096,
                temperature: 0.5,
                stream: false,
            });

            let content = '';
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) { content += chunk; }
            } else if (result?.content) {
                content = result.content;
            }

            if (!content || content.trim().length < 100) {
                return '📋 **Team Plan**\n\nThe team has reviewed your request and agreed on an approach. Please approve to start coding, or describe what you\'d like to change.';
            }

            return content.trim();
        } catch (error) {
            console.error('Final plan generation error:', error);
            if (error.name === 'AbortError') throw error;
            return '📋 **Team Plan**\n\nThe team has discussed your request. Please approve to start coding, or describe what you\'d like to change.';
        }
    },

    // ═══ FILE CONTEXT ═══
    buildFileContext() {
        if (Editor.files.length === 0) return '';

        let context = '\n\n═══ CURRENT PROJECT FILES ═══\n';
        context += `Total files: ${Editor.files.length}\n`;

        for (const file of Editor.files) {
            const lines = file.code.split('\n').length;
            const chars = file.code.length;
            const preview = chars > 3000
                ? file.code.substring(0, 3000) + '\n... (truncated, full file has ' + lines + ' lines)'
                : file.code;
            context += `\n📄 ${file.filename} (${file.language}, ${lines} lines):\n\`\`\`${file.language}:${file.filename}\n${preview}\n\`\`\`\n`;
        }

        context += '═══ END PROJECT FILES ═══\n\n';
        context += `RULES: When modifying existing files, output the COMPLETE file. NEVER skip lines or use placeholders.\n`;

        return context;
    },

    // ═══ KOD YAZMA AŞAMASI ═══
    async executeCode(chat, model) {
        Chat.setGenerating(true);
        this.showApprovalActions(false);
        this.showTeamAgents(true);

        const userRequest = chat.messages.find(m => m.role === 'user')?.content || '';
        const fullDiscussion = this.discussionLog
            .map(d => `[${d.agent.toUpperCase()}]: ${d.content}`)
            .join('\n\n');

        // Mevcut dosyaları kaydet — rollback için
        const previousFiles = JSON.parse(JSON.stringify(Editor.files));

        try {
            // ═══ 1. DESIGNER — CSS ═══
            this.setAgentActive('designer');
            Chat.addAssistantMessage('🎨 **Designer** is crafting the styles and visual system...', 'designer');

            const designerModel = this.getModelForRole('designer');
            const designCode = await this.runCodingAgent('designer', userRequest, designerModel, fullDiscussion, '', '');

            const streamMsg1 = document.getElementById('stream-message');
            if (streamMsg1) streamMsg1.remove();

            if (designCode && designCode.includes('```')) {
                Chat.addAssistantMessage(designCode, 'designer');
                Editor.updateCode(designCode);
            } else {
                Chat.addAssistantMessage('🎨 Designer completed — styles integrated.', 'designer');
            }

            // Designer'ın oluşturduğu CSS dosyalarını topla
            const cssFiles = Editor.files
                .filter(f => f.language === 'css' || f.filename.endsWith('.css'))
                .map(f => `\`\`\`css:${f.filename}\n${f.code}\n\`\`\``)
                .join('\n\n');

            // ═══ 2. PM — HTML ═══
            this.setAgentActive('pm');
            Chat.addAssistantMessage('📊 **PM** is building the HTML structure...', 'pm');

            const pmModel = this.getModelForRole('pm');
            const pmCode = await this.runCodingAgent('pm', userRequest, pmModel, fullDiscussion, cssFiles, '');

            const streamMsg2 = document.getElementById('stream-message');
            if (streamMsg2) streamMsg2.remove();

            if (pmCode && pmCode.includes('```')) {
                Chat.addAssistantMessage(pmCode, 'pm');
                Editor.updateCode(pmCode);
            } else {
                Chat.addAssistantMessage('📊 PM completed — structure ready.', 'pm');
            }

            // PM'in oluşturduğu HTML dosyalarını topla
            const htmlFiles = Editor.files
                .filter(f => f.language === 'html' || f.filename.endsWith('.html'))
                .map(f => `\`\`\`html:${f.filename}\n${f.code}\n\`\`\``)
                .join('\n\n');

            // ═══ 3. DEVELOPER — JS ═══
            this.setAgentActive('developer');
            Chat.addAssistantMessage('💻 **Developer** is implementing the logic and interactions...', 'developer');

            const devModel = this.getModelForRole('developer');
            const devCode = await this.runCodingAgent('developer', userRequest, devModel, fullDiscussion, cssFiles, htmlFiles);

            const streamMsg3 = document.getElementById('stream-message');
            if (streamMsg3) streamMsg3.remove();

            if (devCode && devCode.includes('```')) {
                Chat.addAssistantMessage(devCode, 'developer');
                Editor.updateCode(devCode);
            } else {
                Chat.addAssistantMessage('💻 Developer completed — logic implemented.', 'developer');
            }

            // ═══ TAMAMLANDI ═══
            this.clearAgentActive();

            const fileList = Editor.files.map(f => `• \`${f.filename}\` (${f.language})`).join('\n');
            Chat.addAssistantMessage(
                `✅ **Team coding complete!**\n\n**Files created/updated:**\n${fileList}\n\n💡 *Check the Code panel to preview. Click Preview to see it live!*`,
                'assistant'
            );

            this.phase = 'idle';

        } catch (error) {
            this.clearAgentActive();

            if (error.name === 'AbortError') {
                Utils.toast('Team coding stopped — partial progress saved', 'warning');
            } else {
                Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
                const friendly = Utils.friendlyError(error.message);
                Utils.toast(friendly.friendly, 'error');
            }
            this.phase = 'idle';
        } finally {
            Chat.setGenerating(false);
        }
    },

    // ═══ KODLAMA AGENT'I ═══
    async runCodingAgent(agentType, userRequest, model, discussion, cssContext = '', htmlContext = '') {
        const basePrompt = Storage.getSettings().systemPrompt;
        const fileContext = this.buildFileContext();

        const roleInstructions = {
            designer: `═══ YOUR TASK: CREATE CSS FILES ═══
Based on the team discussion, create ALL CSS/style files.

Apply these design principles:
- Use CSS custom properties for ALL design tokens (colors, spacing, fonts, shadows)
- Smooth transitions (0.2-0.3s ease) on ALL interactive elements
- Hover effects: subtle scale, shadow elevation, color shifts
- Focus states: visible focus rings with accent color
- Entrance animations: fadeIn, slideUp for content
- Responsive: mobile-first with min-width breakpoints
- Modern CSS: Grid for layout, Flexbox for alignment, clamp() for fluid sizing
- Professional shadows, gradients, and border-radius
- Loading, empty, error state styles
- Accessibility: reduced-motion media query, sufficient contrast

${fileContext}

IMPORTANT: Use \`\`\`css:filename.css format. Write COMPLETE files.`,

            pm: `═══ YOUR TASK: CREATE HTML FILES ═══
Based on the team discussion, create ALL HTML files.

The Designer has created these CSS files — reference them correctly:
${cssContext || '(No CSS files yet — create standalone HTML)'}

Apply these principles:
- Semantic HTML5: header, nav, main, section, article, aside, footer
- Proper meta tags, viewport, charset, title
- Link all CSS files in <head>
- Load JS files before </body>
- ARIA labels and roles on interactive elements
- Proper form structure with labels and validation attributes
- Clear element IDs and data attributes for JavaScript
- Include CDN links for icons (Lucide/Font Awesome) if needed
- Meaningful class names matching Designer's CSS

${fileContext}

IMPORTANT: Use \`\`\`html:filename.html format. Write COMPLETE files.
Ensure CSS files are linked: <link rel="stylesheet" href="styles.css">`,

            developer: `═══ YOUR TASK: CREATE JAVASCRIPT FILES ═══
Based on the team discussion, create ALL JavaScript files.

The Designer created these CSS files:
${cssContext || '(No CSS files)'}

The PM created these HTML files:
${htmlContext || '(No HTML files)'}

CRITICAL — Study the HTML structure above and use the EXACT element IDs, classes, and data attributes.

Apply these principles:
- Modern ES6+: const/let, arrow functions, async/await, destructuring
- DOM ready: wrap in DOMContentLoaded or use defer
- Event delegation where appropriate
- Proper error handling with try/catch
- Input validation and sanitization
- Debounce scroll/resize handlers
- RequestAnimationFrame for visual updates
- Add/remove CSS classes to trigger Designer's transitions
- Handle ALL states: loading, empty, error, success
- Clean up: no memory leaks, remove unused listeners
- JSDoc comments for functions
- No console.log pollution

${fileContext}

IMPORTANT: Use \`\`\`javascript:filename.js format. Write COMPLETE files.`,
        };

        const prompt = `═══ USER REQUEST ═══
${userRequest}

═══ TEAM DISCUSSION SUMMARY ═══
${discussion}

═══ AGREED PLAN ═══
${this.agreedPlan}

${roleInstructions[agentType]}

Write your code now. Make it production-ready and impressive.`;

        const messages = [{ role: 'user', content: prompt }];
        const combinedSystemPrompt = this.HIDDEN_SYSTEM_PROMPTS[agentType] + '\n\n' + basePrompt;

        let content = '';

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt: combinedSystemPrompt,
                maxTokens: 16384,
                temperature: 0.4,
            });

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let lastEditorUpdate = 0;
                for await (const chunk of result) {
                    if (!chunk) continue;
                    content += chunk;
                    Chat.updateStreamMessage(content);

                    const now = Date.now();
                    if (content.includes('```') && now - lastEditorUpdate > 500) {
                        Editor.updateCode(content);
                        lastEditorUpdate = now;
                    }
                }
            } else if (result?.content) {
                content = result.content;
            }

            if (content && content.includes('```')) {
                Editor.updateCode(content);
            }

            return content.trim();
        } catch (error) {
            console.error(`Coding agent ${agentType} error:`, error);
            if (error.name === 'AbortError') throw error;
            if (content && content.includes('```')) {
                Editor.updateCode(content);
                return content.trim();
            }
            return '';
        }
    },

    // ═══ TARTIŞMA ÖZETİ ═══
    formatDiscussionSummary() {
        if (this.discussionLog.length === 0) return '';

        let summary = '**💬 Team Discussion Complete** *(click to expand)*\n\n';
        summary += '<details><summary>📝 View full team discussion</summary>\n\n';

        let currentRound = 0;
        for (const entry of this.discussionLog) {
            if (entry.round !== currentRound) {
                currentRound = entry.round;
                summary += `\n**━━━ Round ${currentRound}/${this.discussionRounds} ━━━**\n\n`;
            }
            const icons = { designer: '🎨', pm: '📊', developer: '💻' };
            const names = { designer: 'Designer', pm: 'PM', developer: 'Developer' };
            summary += `${icons[entry.agent]} **${names[entry.agent]}:**\n${entry.content}\n\n`;
        }

        summary += '</details>\n\n---\n\n';
        return summary;
    },

    // ═══ UI HELPERS ═══

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
                        content: '✅ Plan approved! Team, start coding.',
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
                Utils.toast('Describe changes — team will re-discuss', 'info');
            };

            document.getElementById('plan-reject-btn').onclick = () => {
                this.showApprovalActions(false);
                this.phase = 'idle';
                this.discussionLog = [];
                this.agreedPlan = '';
                Chat.addAssistantMessage('Plan rejected. Describe your vision differently and the team will start fresh.', 'pm');
                Utils.toast('Plan rejected', 'info');
            };
        }
    },
};
