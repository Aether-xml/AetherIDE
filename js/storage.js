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
        localStorage.removeItem(this.PREFIX + key);
    },

    // ── Ayarlar ──
    getSettings() {
        return this.get('settings', {
            apiKey: '',
            apiKeys: {},
            apiProvider: 'openrouter',
            defaultModel: '',
            systemPrompt: `You are an expert programmer powering AetherIDE, an AI-powered code editor.

IMPORTANT RULES FOR CODE OUTPUT:
1. You can create MULTIPLE files in a single response
2. For each file, use this EXACT format:

\`\`\`language:filename.ext
code here
\`\`\`

EXAMPLES:
\`\`\`html:index.html
<!DOCTYPE html>
<html>...</html>
\`\`\`

\`\`\`css:styles.css
body { margin: 0; }
\`\`\`

\`\`\`javascript:app.js
console.log("hello");
\`\`\`

3. Always use the format \`\`\`language:filename to specify files
4. Create as many files as needed for the project
5. Write clean, well-commented, production-ready code
6. Include ALL necessary files (HTML, CSS, JS, etc.)
7. Make sure files reference each other correctly
8. If the user asks for a single file, still use the filename format
9. For non-coding questions (greetings, explanations, etc.), respond naturally WITHOUT code blocks
10. Only write code when the user explicitly asks for code or a project
11. When modifying existing files, ALWAYS write the COMPLETE file — never skip lines, never use "// rest remains same"
12. Files can have folder paths like: \`\`\`javascript:src/utils/helpers.js
13. Support nested folder structures when creating project files`,
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
                customModel: '',  // boş = aktif model kullanılır
                customPrompt: '', // boş = varsayılan prompt kullanılır
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
