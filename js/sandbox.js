/* ══════════════════════════════════════════════════════════
   AetherIDE — Sandbox Area v3
   Chat history, split settings, improved streaming
   ══════════════════════════════════════════════════════════ */

const Sandbox = {

    currentTab: 'direct',
    directMessages: [],
    sbsMessages: [],
    sbsResponsesA: [],
    sbsResponsesB: [],
    isGenerating: false,
    _betaShown: false,

    // Sohbet geçmişi
    directChatId: null,
    sbsChatId: null,

    // Ayrık ayarlar
    settings: {
        direct: {
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 4096,
            stream: true,
        },
        sbs: {
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 4096,
            stream: false, // SBS default stream off (daha stabil)
        },
        saveHistory: false,
    },

    init() {
        this.loadSettings();
        this.loadHistory();
        this.bindEvents();
        this.populateModelSelects();
    },

    bindEvents() {
        // Aç/kapa
        document.getElementById('sandbox-btn')?.addEventListener('click', () => this.open());
        document.getElementById('sandbox-close')?.addEventListener('click', () => this.close());

        document.getElementById('sandbox-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'sandbox-modal') this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('sandbox-modal');
                if (modal && modal.style.display !== 'none') this.close();
            }
        });

        // Tab toggle
        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.stab));
        });

        // ── Direct Mode ──
        const directInput = document.getElementById('sandbox-direct-input');
        const directSend = document.getElementById('sandbox-direct-send');

        directInput?.addEventListener('input', () => {
            Utils.autoResize(directInput);
            directSend.disabled = !directInput.value.trim();
        });

        directInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendDirect();
            }
        });

        directSend?.addEventListener('click', () => this.sendDirect());

        document.getElementById('sandbox-direct-clear')?.addEventListener('click', () => {
            this.directMessages = [];
            this.directChatId = null;
            this.saveHistory();
            this.renderDirectMessages();
            this.renderSandboxHistory();
            Utils.toast('Chat cleared', 'info', 1500);
        });

        // ── Side by Side ──
        const sbsInput = document.getElementById('sandbox-sbs-input');
        const sbsSend = document.getElementById('sandbox-sbs-send');

        sbsInput?.addEventListener('input', () => {
            Utils.autoResize(sbsInput);
            sbsSend.disabled = !sbsInput.value.trim();
        });

        sbsInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendSideBySide();
            }
        });

        sbsSend?.addEventListener('click', () => this.sendSideBySide());

        document.getElementById('sandbox-sbs-clear')?.addEventListener('click', () => {
            this.sbsMessages = [];
            this.sbsResponsesA = [];
            this.sbsResponsesB = [];
            this.sbsChatId = null;
            this.saveHistory();
            this.renderSbsMessages();
            this.renderSandboxHistory();
            Utils.toast('Chat cleared', 'info', 1500);
        });

        // Model header güncelle
        document.getElementById('sandbox-sbs-model-a')?.addEventListener('change', (e) => {
            const name = e.target.options[e.target.selectedIndex]?.text || 'Model A';
            document.getElementById('sandbox-sbs-name-a').textContent = name;
        });

        document.getElementById('sandbox-sbs-model-b')?.addEventListener('change', (e) => {
            const name = e.target.options[e.target.selectedIndex]?.text || 'Model B';
            document.getElementById('sandbox-sbs-name-b').textContent = name;
        });

        // ── Settings ──
        // Direct settings
        document.getElementById('sandbox-direct-temperature')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-direct-temp-value').textContent = e.target.value;
        });
        document.getElementById('sandbox-direct-max-tokens')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-direct-tokens-value').textContent = e.target.value;
        });

        // SBS settings
        document.getElementById('sandbox-sbs-temperature')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-sbs-temp-value').textContent = e.target.value;
        });
        document.getElementById('sandbox-sbs-max-tokens')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-sbs-tokens-value').textContent = e.target.value;
        });

        document.getElementById('sandbox-settings-save')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('sandbox-settings-reset')?.addEventListener('click', () => this.resetSettings());
    },

    // ══════════════════════════════════════
    // Settings
    // ══════════════════════════════════════

    loadSettings() {
        const saved = Storage.get('sandbox_settings_v2', null);
        if (saved) {
            this.settings = { ...this.settings, ...saved };
            if (saved.direct) this.settings.direct = { ...this.settings.direct, ...saved.direct };
            if (saved.sbs) this.settings.sbs = { ...this.settings.sbs, ...saved.sbs };
        } else {
            // Eski format migration
            const oldSaved = Storage.get('sandbox_settings', null);
            if (oldSaved) {
                this.settings.direct = {
                    systemPrompt: oldSaved.systemPrompt || '',
                    temperature: oldSaved.temperature || 0.7,
                    maxTokens: oldSaved.maxTokens || 4096,
                    stream: oldSaved.stream !== false,
                };
                this.settings.sbs = {
                    systemPrompt: oldSaved.systemPrompt || '',
                    temperature: oldSaved.temperature || 0.7,
                    maxTokens: oldSaved.maxTokens || 4096,
                    stream: false,
                };
                this.settings.saveHistory = oldSaved.saveHistory || false;
                Storage.remove('sandbox_settings');
            }
        }
        this.applySettingsToUI();
    },

    applySettingsToUI() {
        const d = this.settings.direct;
        const s = this.settings.sbs;

        // Direct
        const dp = document.getElementById('sandbox-direct-system-prompt');
        if (dp) dp.value = d.systemPrompt || '';
        const dt = document.getElementById('sandbox-direct-temperature');
        if (dt) dt.value = d.temperature;
        const dtv = document.getElementById('sandbox-direct-temp-value');
        if (dtv) dtv.textContent = d.temperature;
        const dmk = document.getElementById('sandbox-direct-max-tokens');
        if (dmk) dmk.value = d.maxTokens;
        const dmkv = document.getElementById('sandbox-direct-tokens-value');
        if (dmkv) dmkv.textContent = d.maxTokens;
        const ds = document.getElementById('sandbox-direct-stream-toggle');
        if (ds) ds.checked = d.stream !== false;

        // SBS
        const sp = document.getElementById('sandbox-sbs-system-prompt');
        if (sp) sp.value = s.systemPrompt || '';
        const st = document.getElementById('sandbox-sbs-temperature');
        if (st) st.value = s.temperature;
        const stv = document.getElementById('sandbox-sbs-temp-value');
        if (stv) stv.textContent = s.temperature;
        const smk = document.getElementById('sandbox-sbs-max-tokens');
        if (smk) smk.value = s.maxTokens;
        const smkv = document.getElementById('sandbox-sbs-tokens-value');
        if (smkv) smkv.textContent = s.maxTokens;
        const ss = document.getElementById('sandbox-sbs-stream-toggle');
        if (ss) ss.checked = s.stream === true;

        // Global
        const save = document.getElementById('sandbox-save-toggle');
        if (save) save.checked = this.settings.saveHistory === true;
    },

    saveSettings() {
        this.settings = {
            direct: {
                systemPrompt: document.getElementById('sandbox-direct-system-prompt')?.value?.trim() || '',
                temperature: parseFloat(document.getElementById('sandbox-direct-temperature')?.value) || 0.7,
                maxTokens: parseInt(document.getElementById('sandbox-direct-max-tokens')?.value) || 4096,
                stream: document.getElementById('sandbox-direct-stream-toggle')?.checked !== false,
            },
            sbs: {
                systemPrompt: document.getElementById('sandbox-sbs-system-prompt')?.value?.trim() || '',
                temperature: parseFloat(document.getElementById('sandbox-sbs-temperature')?.value) || 0.7,
                maxTokens: parseInt(document.getElementById('sandbox-sbs-max-tokens')?.value) || 4096,
                stream: document.getElementById('sandbox-sbs-stream-toggle')?.checked === true,
            },
            saveHistory: document.getElementById('sandbox-save-toggle')?.checked === true,
        };

        Storage.set('sandbox_settings_v2', this.settings);
        Utils.toast('Sandbox settings saved!', 'success', 2000);
        this.switchTab('direct');
    },

    resetSettings() {
        this.settings = {
            direct: { systemPrompt: '', temperature: 0.7, maxTokens: 4096, stream: true },
            sbs: { systemPrompt: '', temperature: 0.7, maxTokens: 4096, stream: false },
            saveHistory: false,
        };
        Storage.remove('sandbox_settings_v2');
        this.applySettingsToUI();
        Utils.toast('Settings reset to defaults', 'info', 2000);
    },

    getSystemPrompt(mode) {
        const s = mode === 'sbs' ? this.settings.sbs : this.settings.direct;
        return s.systemPrompt || 'You are a helpful AI assistant. Have a natural conversation. Be friendly, concise, and helpful.';
    },

    // ══════════════════════════════════════
    // Chat History
    // ══════════════════════════════════════

    loadHistory() {
        if (!this.settings.saveHistory) return;

        const history = Storage.get('sandbox_history', null);
        if (!history) return;

        if (history.direct) {
            this.directMessages = history.direct.messages || [];
            this.directChatId = history.direct.id || null;
        }
        if (history.sbs) {
            this.sbsMessages = history.sbs.messages || [];
            this.sbsResponsesA = history.sbs.responsesA || [];
            this.sbsResponsesB = history.sbs.responsesB || [];
            this.sbsChatId = history.sbs.id || null;
        }
    },

    saveHistory() {
        if (!this.settings.saveHistory) return;

        const history = {
            direct: {
                id: this.directChatId,
                messages: this.directMessages,
                updatedAt: new Date().toISOString(),
            },
            sbs: {
                id: this.sbsChatId,
                messages: this.sbsMessages,
                responsesA: this.sbsResponsesA,
                responsesB: this.sbsResponsesB,
                updatedAt: new Date().toISOString(),
            },
        };

        Storage.set('sandbox_history', history);
    },

    getSandboxChats() {
        return Storage.get('sandbox_chat_list', []);
    },

    saveSandboxChat(type, title) {
        const chats = this.getSandboxChats();
        const id = Utils.generateId();

        const chat = {
            id,
            type, // 'direct' | 'sbs'
            title: Utils.truncate(title, 30),
            createdAt: new Date().toISOString(),
            data: type === 'direct'
                ? { messages: [...this.directMessages] }
                : { messages: [...this.sbsMessages], responsesA: [...this.sbsResponsesA], responsesB: [...this.sbsResponsesB] },
        };

        chats.unshift(chat);
        if (chats.length > 30) chats.length = 30;
        Storage.set('sandbox_chat_list', chats);

        if (type === 'direct') this.directChatId = id;
        else this.sbsChatId = id;

        this.renderSandboxHistory();
        return id;
    },

    loadSandboxChat(chatId) {
        const chats = this.getSandboxChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        if (chat.type === 'direct') {
            this.directMessages = chat.data.messages || [];
            this.directChatId = chat.id;
            this.switchTab('direct');
            this.renderDirectMessages();
        } else {
            this.sbsMessages = chat.data.messages || [];
            this.sbsResponsesA = chat.data.responsesA || [];
            this.sbsResponsesB = chat.data.responsesB || [];
            this.sbsChatId = chat.id;
            this.switchTab('sidebyside');
            this.renderSbsMessages();
        }

        this.renderSandboxHistory();
    },

    deleteSandboxChat(chatId) {
        let chats = this.getSandboxChats();
        chats = chats.filter(c => c.id !== chatId);
        Storage.set('sandbox_chat_list', chats);

        if (this.directChatId === chatId) {
            this.directMessages = [];
            this.directChatId = null;
            this.renderDirectMessages();
        }
        if (this.sbsChatId === chatId) {
            this.sbsMessages = [];
            this.sbsResponsesA = [];
            this.sbsResponsesB = [];
            this.sbsChatId = null;
            this.renderSbsMessages();
        }

        this.renderSandboxHistory();
        Utils.toast('Chat deleted', 'info', 1500);
    },

    renderSandboxHistory() {
        const container = document.getElementById('sandbox-history-list');
        if (!container) return;

        const chats = this.getSandboxChats();

        if (chats.length === 0) {
            container.innerHTML = `<div class="sandbox-history-empty">No saved chats</div>`;
            return;
        }

        let html = '';
        for (const chat of chats) {
            const isActive = chat.id === this.directChatId || chat.id === this.sbsChatId;
            const typeIcon = chat.type === 'direct' ? 'message-square' : 'columns';
            const typeLabel = chat.type === 'direct' ? 'Direct' : 'SBS';
            html += `
                <div class="sandbox-history-item ${isActive ? 'active' : ''}" onclick="Sandbox.loadSandboxChat('${chat.id}')">
                    <i data-lucide="${typeIcon}" class="sandbox-history-icon"></i>
                    <div class="sandbox-history-info">
                        <span class="sandbox-history-title">${Utils.escapeHtml(chat.title)}</span>
                        <span class="sandbox-history-type">${typeLabel}</span>
                    </div>
                    <button class="sandbox-history-delete" onclick="event.stopPropagation(); Sandbox.deleteSandboxChat('${chat.id}')" title="Delete">×</button>
                </div>
            `;
        }

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [container] });
    },

    // ══════════════════════════════════════
    // Model selects
    // ══════════════════════════════════════

    populateModelSelects() {
        const selects = ['sandbox-direct-model', 'sandbox-sbs-model-a', 'sandbox-sbs-model-b'];
        const models = API.POPULAR_MODELS;

        selects.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            while (select.options.length > 1) select.remove(1);

            const categories = { free: '🆓 Free', thinking: '🧠 Thinking', premium: '⭐ Premium', latest: '🔥 Latest', stable: '✅ Stable', flagship: '🏆 Flagship', reasoning: '🧠 Reasoning', legacy: '📦 Legacy', available: '📋 Available' };
            const grouped = {};

            models.forEach(m => {
                const cat = m.category || 'premium';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(m);
            });

            for (const [cat, catModels] of Object.entries(grouped)) {
                const group = document.createElement('optgroup');
                group.label = categories[cat] || cat;
                catModels.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = m.name;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }

            if (App.currentModel) select.value = App.currentModel;
        });

        // SBS model isimlerini güncelle
        this.updateSbsModelNames();
    },

    updateSbsModelNames() {
        const selectA = document.getElementById('sandbox-sbs-model-a');
        const selectB = document.getElementById('sandbox-sbs-model-b');
        const nameA = document.getElementById('sandbox-sbs-name-a');
        const nameB = document.getElementById('sandbox-sbs-name-b');

        if (selectA && nameA) {
            const idx = selectA.selectedIndex;
            nameA.textContent = idx > 0 ? selectA.options[idx].text : 'Model A';
        }
        if (selectB && nameB) {
            const idx = selectB.selectedIndex;
            nameB.textContent = idx > 0 ? selectB.options[idx].text : 'Model B';
        }
    },

    // ══════════════════════════════════════
    // Open/Close
    // ══════════════════════════════════════

    open() {
        const modal = document.getElementById('sandbox-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateModelSelects();
            this.applySettingsToUI();
            this.renderSandboxHistory();
            this.renderDirectMessages();
            this.renderSbsMessages();
            if (window.lucide) lucide.createIcons();

            if (!this._betaShown) {
                this._betaShown = true;
                Utils.toast('Sandbox is in Beta — some features may be unstable', 'warning', 4000);
            }
        }
    },

    close() {
        if (this.isGenerating) {
            API.abort();
            this.isGenerating = false;
        }
        this.saveHistory();
        const modal = document.getElementById('sandbox-modal');
        if (modal) modal.style.display = 'none';
    },

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.stab === tab);
        });

        document.getElementById('sandbox-direct-view')?.classList.toggle('active', tab === 'direct');
        document.getElementById('sandbox-sbs-view')?.classList.toggle('active', tab === 'sidebyside');
        document.getElementById('sandbox-settings-view')?.classList.toggle('active', tab === 'settings');
    },

    // ══════════════════════════════════════
    // Direct Mode
    // ══════════════════════════════════════

    async sendDirect() {
        const input = document.getElementById('sandbox-direct-input');
        const text = input?.value?.trim();
        if (!text || this.isGenerating) return;

        const model = document.getElementById('sandbox-direct-model')?.value;
        if (!model) { Utils.toast('Select a model first', 'warning'); return; }
        if (!API.hasApiKey()) { Utils.toast('Add your API key in Settings', 'warning'); return; }

        this.directMessages.push({ role: 'user', content: text });
        input.value = '';
        Utils.autoResize(input);
        document.getElementById('sandbox-direct-send').disabled = true;

        // İlk mesajsa geçmişe kaydet
        if (this.directMessages.length === 1) {
            this.saveSandboxChat('direct', text);
        }

        this.renderDirectMessages();
        this.setGenerating(true, 'direct');

        try {
            const messages = this.directMessages.map(m => ({ role: m.role, content: m.content }));
            const ds = this.settings.direct;

            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.getSystemPrompt('direct'),
                temperature: ds.temperature,
                maxTokens: ds.maxTokens,
                stream: ds.stream,
            });

            let fullContent = '';

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    fullContent += chunk;
                    this.updateDirectStream(fullContent);
                }
            } else if (result?.content) {
                fullContent = result.content;
            } else if (result?.aborted) {
                Utils.toast('Stopped', 'info', 1500);
            }

            if (fullContent) {
                this.directMessages.push({ role: 'assistant', content: fullContent });
                this.updateSandboxChatData('direct');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.directMessages.push({ role: 'assistant', content: `Error: ${error.message}` });
            }
        } finally {
            this.setGenerating(false, 'direct');
            this.renderDirectMessages();
            this.saveHistory();
        }
    },

    renderDirectMessages() {
        const container = document.getElementById('sandbox-direct-messages');
        if (!container) return;

        if (this.directMessages.length === 0) {
            container.innerHTML = `
                <div class="sandbox-empty">
                    <i data-lucide="message-circle" class="sandbox-empty-icon"></i>
                    <p>Start a conversation</p>
                    <span class="sandbox-empty-hint">Chat freely — no code generation rules here</span>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [container] });
            return;
        }

        let html = '';
        for (const msg of this.directMessages) {
            const isUser = msg.role === 'user';
            const tokens = Utils.estimateTokens(msg.content);
            html += `
                <div class="sandbox-msg ${isUser ? 'sandbox-msg-user' : 'sandbox-msg-ai'}">
                    <div class="message-avatar ${isUser ? 'user' : 'assistant'}">
                        <i data-lucide="${isUser ? 'user' : 'bot'}"></i>
                    </div>
                    <div class="sandbox-msg-content">
                        <div class="sandbox-msg-name">
                            ${isUser ? (Storage.getUserName() || 'You') : 'AI'}
                            <span class="sandbox-token-badge" title="Estimated tokens">~${tokens} tok</span>
                        </div>
                        <div class="sandbox-msg-text">${Utils.parseMarkdown(msg.content)}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [container] });
        container.scrollTop = container.scrollHeight;
    },

    updateDirectStream(content) {
        const container = document.getElementById('sandbox-direct-messages');
        if (!container) return;

        let streamEl = document.getElementById('sandbox-direct-stream');
        if (!streamEl) {
            streamEl = document.createElement('div');
            streamEl.id = 'sandbox-direct-stream';
            streamEl.className = 'sandbox-msg sandbox-msg-ai';
            streamEl.innerHTML = `
                <div class="message-avatar assistant">
                    <i data-lucide="bot"></i>
                </div>
                <div class="sandbox-msg-content">
                    <div class="sandbox-msg-name">AI</div>
                    <div class="sandbox-msg-text" id="sandbox-direct-stream-text"></div>
                </div>
            `;
            container.appendChild(streamEl);
            if (window.lucide) lucide.createIcons({ nodes: [streamEl] });
        }

        const textEl = document.getElementById('sandbox-direct-stream-text');
        if (textEl) textEl.innerHTML = Utils.parseMarkdown(content);
        container.scrollTop = container.scrollHeight;
    },

    // ══════════════════════════════════════
    // Side by Side Mode
    // ══════════════════════════════════════

    async sendSideBySide() {
        const input = document.getElementById('sandbox-sbs-input');
        const text = input?.value?.trim();
        if (!text || this.isGenerating) return;

        const modelA = document.getElementById('sandbox-sbs-model-a')?.value;
        const modelB = document.getElementById('sandbox-sbs-model-b')?.value;

        if (!modelA || !modelB) { Utils.toast('Select both models', 'warning'); return; }
        if (modelA === modelB) { Utils.toast('Select two different models to compare', 'warning'); return; }
        if (!API.hasApiKey()) { Utils.toast('Add your API key in Settings', 'warning'); return; }

        this.sbsMessages.push({ role: 'user', content: text });
        input.value = '';
        Utils.autoResize(input);
        document.getElementById('sandbox-sbs-send').disabled = true;

        // İlk mesajsa geçmişe kaydet
        if (this.sbsMessages.length === 1) {
            this.saveSandboxChat('sbs', text);
        }

        // Model isimlerini güncelle
        this.updateSbsModelNames();

        this.renderSbsMessages();
        this.setGenerating(true, 'sbs');

        const ss = this.settings.sbs;
        const sysPrompt = this.getSystemPrompt('sbs');

        const buildHistory = (responses) => {
            const history = [];
            let respIdx = 0;
            for (const msg of this.sbsMessages) {
                history.push({ role: 'user', content: msg.content });
                if (respIdx < responses.length) {
                    history.push({ role: 'assistant', content: responses[respIdx] });
                    respIdx++;
                }
            }
            return history;
        };

        try {
            const [resultA, resultB] = await Promise.all([
                this.fetchSbsResponse(buildHistory(this.sbsResponsesA), modelA, sysPrompt, 'a'),
                this.fetchSbsResponse(buildHistory(this.sbsResponsesB), modelB, sysPrompt, 'b'),
            ]);

            this.sbsResponsesA.push(resultA || 'No response');
            this.sbsResponsesB.push(resultB || 'No response');

            this.updateSandboxChatData('sbs');
        } catch (error) {
            if (error.name !== 'AbortError') {
                Utils.toast('Error: ' + error.message, 'error');
            }
        } finally {
            this.setGenerating(false, 'sbs');
            this.renderSbsMessages();
            this.saveHistory();
        }
    },

    async fetchSbsResponse(messages, model, systemPrompt, side) {
        const ss = this.settings.sbs;

        const result = await API.sendMessage(messages, model, {
            systemPrompt,
            temperature: ss.temperature,
            maxTokens: ss.maxTokens,
            stream: ss.stream,
        });

        let content = '';
        if (result && typeof result[Symbol.asyncIterator] === 'function') {
            for await (const chunk of result) {
                content += chunk;
                this.updateSbsStream(side, content);
            }
        } else if (result?.content) {
            content = result.content;
        }

        return content;
    },

    renderSbsMessages() {
        const containerA = document.getElementById('sandbox-sbs-messages-a');
        const containerB = document.getElementById('sandbox-sbs-messages-b');
        if (!containerA || !containerB) return;

        // Model isimlerini güncelle
        this.updateSbsModelNames();

        if (this.sbsMessages.length === 0) {
            const nameA = document.getElementById('sandbox-sbs-name-a')?.textContent || 'Model A';
            const nameB = document.getElementById('sandbox-sbs-name-b')?.textContent || 'Model B';
            const emptyHtml = (label) => `
                <div class="sandbox-empty">
                    <i data-lucide="bot" class="sandbox-empty-icon"></i>
                    <p>${label}</p>
                </div>
            `;
            containerA.innerHTML = emptyHtml(nameA);
            containerB.innerHTML = emptyHtml(nameB);
            if (window.lucide) {
                lucide.createIcons({ nodes: [containerA] });
                lucide.createIcons({ nodes: [containerB] });
            }
            return;
        }

        const nameA = document.getElementById('sandbox-sbs-name-a')?.textContent || 'Model A';
        const nameB = document.getElementById('sandbox-sbs-name-b')?.textContent || 'Model B';

        let htmlA = '';
        let htmlB = '';
        let responseIndex = 0;

        for (const msg of this.sbsMessages) {
            const userTokens = Utils.estimateTokens(msg.content);
            const sbsUserName = Storage.getUserName() || 'You';
            const userHtml = `
                <div class="sandbox-msg sandbox-msg-user">
                    <div class="message-avatar user">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="sandbox-msg-content">
                        <div class="sandbox-msg-name">
                            ${sbsUserName}
                            <span class="sandbox-token-badge">~${userTokens} tok</span>
                        </div>
                        <div class="sandbox-msg-text">${Utils.parseMarkdown(msg.content)}</div>
                    </div>
                </div>
            `;
            htmlA += userHtml;
            htmlB += userHtml;

            if (this.sbsResponsesA[responseIndex]) {
                const tokA = Utils.estimateTokens(this.sbsResponsesA[responseIndex]);
                htmlA += `
                    <div class="sandbox-msg sandbox-msg-ai">
                        <div class="message-avatar assistant sbs-a">
                            <i data-lucide="bot"></i>
                        </div>
                        <div class="sandbox-msg-content">
                            <div class="sandbox-msg-name">
                                ${Utils.escapeHtml(nameA)}
                                <span class="sandbox-token-badge">~${tokA} tok</span>
                            </div>
                            <div class="sandbox-msg-text">${Utils.parseMarkdown(this.sbsResponsesA[responseIndex])}</div>
                        </div>
                    </div>
                `;
            }

            if (this.sbsResponsesB[responseIndex]) {
                const tokB = Utils.estimateTokens(this.sbsResponsesB[responseIndex]);
                htmlB += `
                    <div class="sandbox-msg sandbox-msg-ai">
                        <div class="message-avatar assistant sbs-b">
                            <i data-lucide="bot"></i>
                        </div>
                        <div class="sandbox-msg-content">
                            <div class="sandbox-msg-name">
                                ${Utils.escapeHtml(nameB)}
                                <span class="sandbox-token-badge">~${tokB} tok</span>
                            </div>
                            <div class="sandbox-msg-text">${Utils.parseMarkdown(this.sbsResponsesB[responseIndex])}</div>
                        </div>
                    </div>
                `;
            }

            responseIndex++;
        }

        containerA.innerHTML = htmlA;
        containerB.innerHTML = htmlB;
        if (window.lucide) {
            lucide.createIcons({ nodes: [containerA] });
            lucide.createIcons({ nodes: [containerB] });
        }
        containerA.scrollTop = containerA.scrollHeight;
        containerB.scrollTop = containerB.scrollHeight;
    },

    updateSbsStream(side, content) {
        const containerId = side === 'a' ? 'sandbox-sbs-messages-a' : 'sandbox-sbs-messages-b';
        const container = document.getElementById(containerId);
        if (!container) return;

        const modelName = side === 'a'
            ? (document.getElementById('sandbox-sbs-name-a')?.textContent || 'Model A')
            : (document.getElementById('sandbox-sbs-name-b')?.textContent || 'Model B');

        let streamEl = document.getElementById(`sandbox-sbs-stream-${side}`);
        if (!streamEl) {
            streamEl = document.createElement('div');
            streamEl.id = `sandbox-sbs-stream-${side}`;
            streamEl.className = 'sandbox-msg sandbox-msg-ai';
            streamEl.innerHTML = `
                <div class="message-avatar assistant sbs-${side}">
                    <i data-lucide="bot"></i>
                </div>
                <div class="sandbox-msg-content">
                    <div class="sandbox-msg-name">${Utils.escapeHtml(modelName)}</div>
                    <div class="sandbox-msg-text" id="sandbox-sbs-stream-text-${side}"></div>
                </div>
            `;
            container.appendChild(streamEl);
            if (window.lucide) lucide.createIcons({ nodes: [streamEl] });
        }

        const textEl = document.getElementById(`sandbox-sbs-stream-text-${side}`);
        if (textEl) textEl.innerHTML = Utils.parseMarkdown(content);
        container.scrollTop = container.scrollHeight;
    },

    // Geçmiş chat datasını güncelle
    updateSandboxChatData(type) {
        const chats = this.getSandboxChats();
        const id = type === 'direct' ? this.directChatId : this.sbsChatId;
        if (!id) return;

        const idx = chats.findIndex(c => c.id === id);
        if (idx < 0) return;

        if (type === 'direct') {
            chats[idx].data = { messages: [...this.directMessages] };
        } else {
            chats[idx].data = {
                messages: [...this.sbsMessages],
                responsesA: [...this.sbsResponsesA],
                responsesB: [...this.sbsResponsesB],
            };
        }

        Storage.set('sandbox_chat_list', chats);
    },

    // ── Generating state ──
    setGenerating(generating, mode) {
        this.isGenerating = generating;

        const btnId = mode === 'direct' ? 'sandbox-direct-send' : 'sandbox-sbs-send';
        const inputId = mode === 'direct' ? 'sandbox-direct-input' : 'sandbox-sbs-input';
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);

        if (generating) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="sandbox-loading"><span></span><span></span><span></span></div>';
            }
            if (input) input.disabled = true;
        } else {
            if (btn) {
                btn.innerHTML = '<i data-lucide="arrow-up"></i>';
                btn.disabled = !input?.value?.trim();
            }
            if (input) {
                input.disabled = false;
                input.focus();
            }

            document.getElementById('sandbox-direct-stream')?.remove();
            document.getElementById('sandbox-sbs-stream-a')?.remove();
            document.getElementById('sandbox-sbs-stream-b')?.remove();
        }

        if (window.lucide) lucide.createIcons();
    },
};
