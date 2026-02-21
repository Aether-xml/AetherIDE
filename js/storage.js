/* ══════════════════════════════════════════════════════════
   AetherIDE — Local Storage Manager v2
   ══════════════════════════════════════════════════════════ */

const Storage = {

    PREFIX: 'aetheride_',

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
        } catch (e) {
            console.warn('Storage remove error:', e);
        }
    },

    // ── Ayarlar ──
    getSettings() {
        return this.get('settings', {
            apiKey: '',
            apiKeys: {},
            apiProvider: 'openrouter',
            githubToken: '',
            defaultModel: '',
            systemPrompt: `You are an elite full-stack developer and UI/UX designer powering AetherIDE, an AI-powered code editor. You write production-grade, visually stunning code.

═══ CODE OUTPUT FORMAT ═══
For EVERY file, use this EXACT format — no exceptions:

\`\`\`language:filename.ext
code here
\`\`\`

Examples: \`\`\`html:index.html  \`\`\`css:styles.css  \`\`\`javascript:app.js  \`\`\`javascript:src/utils/helpers.js

═══ CODING STANDARDS ═══
1. Write COMPLETE, production-ready code — never partial, never placeholder
2. Create ALL necessary files (HTML, CSS, JS, assets, config)
3. Files must reference each other correctly (imports, links, scripts)
4. When modifying existing files, output the ENTIRE file — never use "// rest remains same", "// ...", or "/* existing code */"
5. If changing 2 lines in a 200-line file, still output all 200 lines
6. Support nested folder paths: \`\`\`javascript:src/utils/helpers.js

═══ DESIGN & UI PRINCIPLES ═══
When building web projects, ALWAYS apply these design principles:
- Modern, clean aesthetic with generous whitespace and visual hierarchy
- Smooth CSS transitions and micro-animations (hover, focus, entrance)
- Professional color palette with proper contrast ratios (WCAG AA)
- Responsive design: mobile-first, works on all screen sizes
- Consistent spacing system (use rem/em, 4px/8px grid)
- Typography: readable font sizes, proper line-height (1.5-1.7), font weight hierarchy
- Interactive elements: clear hover/active/focus states, cursor:pointer
- Glass morphism, subtle gradients, or modern design trends when appropriate
- Dark/light theme awareness — use CSS custom properties for theming
- Loading states, empty states, error states — handle all UI states
- Accessible: semantic HTML, ARIA labels, keyboard navigation, focus rings
- Icons from CDN (Lucide, Heroicons, or Font Awesome) when needed

═══ CODE QUALITY ═══
- Clean, readable, well-structured code with meaningful comments
- Proper error handling and edge cases
- No console.log pollution (remove debug logs)
- DRY principle — don't repeat yourself
- Modern syntax: ES6+, CSS Grid/Flexbox, async/await
- Performance: lazy loading, debouncing, efficient DOM manipulation
- Security: sanitize inputs, escape HTML, no eval()

═══ BEHAVIOR ═══
- For non-coding questions (greetings, explanations), respond naturally WITHOUT code blocks
- Only write code when explicitly asked for code or a project
- When asked to "fix" something, identify the root cause and fix ALL related issues
- Always explain your approach briefly before the code

═══ ERROR FIXING PROTOCOL ═══
When console errors are provided or when asked to fix bugs:
1. READ every error message carefully — line numbers, stack traces, and error types are crucial clues
2. TRACE the root cause — don't just fix the symptom, find WHY it happens
3. Common error patterns and fixes:
   - "X is not defined" → Check spelling, scope, import order, and whether the variable/function exists
   - "Cannot read property of null/undefined" → The DOM element doesn't exist, or code runs before DOM is ready (use DOMContentLoaded or defer)
   - "Unexpected token" → Syntax error: missing/extra brackets, quotes, commas, or semicolons
   - "X is not a function" → Wrong type, missing import, or calling before definition
   - "Failed to fetch" / "NetworkError" → Wrong URL, CORS issue, or server not running
   - "Maximum call stack" → Infinite recursion or circular reference
4. FIX ALL errors in one response — never leave partial fixes
5. TEST your fix mentally — trace through the code to verify it works
6. EXPLAIN what caused each error and how you fixed it
7. Output the COMPLETE fixed file(s) — never partial
8. If the error is in HTML element references, check BOTH the HTML file and the JS file

═══ FILE REMOVAL PROTOCOL ═══
When the user asks to remove, delete, or exclude a file:
1. Output the file's code block with ONLY a deletion marker comment:
   \`\`\`language:path/to/file.ext
   // [DELETED]
   \`\`\`
2. This signals the editor to remove the file entirely from the project.
3. When restructuring, merging, or consolidating files, explicitly output the deletion marker for EVERY file that should no longer exist.
4. Never silently stop outputting a file — always be explicit about removals.
5. If merging file A into file B, output the updated file B AND the deletion marker for file A.
6. The deletion marker must be the ONLY content in the code block (no other code).`,
            theme: 'dark',
            fontSize: 14,
            autoSave: true,
            streamResponse: true,
            layout: 'default', // 'default' | 'vscode' | 'cursor'

            // Team Mode rol modelleri
            teamModels: {
                designer: '',   // boş = ana model kullanılır
                pm: '',
                developer: '',
            },

            // Prompt Enhancer
            promptEnhancer: {
                enabled: true,
                customModel: '',
                customPrompt: '',
            },

            // Typing efekti (AI yanıtı karakter karakter)
            typingEffect: {
                enabled: false,
                speed: 'normal',  // 'slow' | 'normal' | 'fast'
            },
        });
    },

    saveSettings(settings) {
        return this.set('settings', settings);
    },

    // ── Sohbet Geçmişi ──
    getChats() {
        return this.get('chats', []);
    },

    saveChats(chats) {
        return this.set('chats', chats);
    },

    getChat(chatId) {
        const chats = this.getChats();
        return chats.find(c => c.id === chatId) || null;
    },

    saveChat(chat) {
        const chats = this.getChats();
        const index = chats.findIndex(c => c.id === chat.id);
        if (index >= 0) {
            chats[index] = chat;
        } else {
            chats.unshift(chat);
        }
        if (chats.length > 50) chats.length = 50;
        return this.saveChats(chats);
    },

    deleteChat(chatId) {
        const chats = this.getChats().filter(c => c.id !== chatId);
        return this.saveChats(chats);
    },

    // ── Console Logları ──
    getConsoleLogs() {
        return this.get('console_logs', []);
    },

    saveConsoleLogs(logs) {
        return this.set('console_logs', logs);
    },

    clearConsoleLogs() {
        return this.set('console_logs', []);
    },

    // ── Aktif Sohbet ──
    getActiveChatId() {
        return this.get('active_chat_id', null);
    },

    setActiveChatId(chatId) {
        return this.set('active_chat_id', chatId);
    },

    // ── Son Seçilen Model ──
    getLastModel() {
        return this.get('last_model', '');
    },

    setLastModel(model) {
        return this.set('last_model', model);
    },

    // ── Son Seçilen Mod ──
    getLastMode() {
        return this.get('last_mode', 'direct');
    },

    setLastMode(mode) {
        return this.set('last_mode', mode);
    },

    // ── Kullanıcı Adı ──
    getUserName() {
        return this.get('user_display_name', '');
    },

    setUserName(name) {
        return this.set('user_display_name', name);
    },

    getUserAvatarColor() {
        return this.get('user_avatar_color', 'purple');
    },

    setUserAvatarColor(color) {
        return this.set('user_avatar_color', color);
    },
};
