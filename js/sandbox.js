/* ══════════════════════════════════════════════════════════
   AetherIDE — Sandbox Area v2
   Direct chat + Side by Side + Settings
   ══════════════════════════════════════════════════════════ */

const Sandbox = {

    currentTab: 'direct',
    directMessages: [],
    sbsMessages: [],
    sbsResponsesA: [],
    sbsResponsesB: [],
    isGenerating: false,
    _betaShown: false,

    // Sandbox ayarları
    settings: {
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 4096,
        stream: true,
        saveHistory: false,
    },

    init() {
        this.loadSettings();
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
            this.renderDirectMessages();
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
            this.renderSbsMessages();
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
        document.getElementById('sandbox-temperature')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-temp-value').textContent = e.target.value;
        });

        document.getElementById('sandbox-max-tokens')?.addEventListener('input', (e) => {
            document.getElementById('sandbox-tokens-value').textContent = e.target.value;
        });

        document.getElementById('sandbox-settings-save')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('sandbox-settings-reset')?.addEventListener('click', () => this.resetSettings());
    },

    // ── Settings ──
    loadSettings() {
        const saved = Storage.get('sandbox_settings', null);
        if (saved) {
            this.settings = { ...this.settings, ...saved };
        }
        this.applySettingsToUI();
    },

    applySettingsToUI() {
        const s = this.settings;
        const prompt = document.getElementById('sandbox-system-prompt');
        if (prompt) prompt.value = s.systemPrompt || '';

        const temp = document.getElementById('sandbox-temperature');
        if (temp) { temp.value = s.temperature; }
        const tempVal = document.getElementById('sandbox-temp-value');
        if (tempVal) tempVal.textContent = s.temperature;

        const tokens = document.getElementById('sandbox-max-tokens');
        if (tokens) { tokens.value = s.maxTokens; }
        const tokensVal = document.getElementById('sandbox-tokens-value');
        if (tokensVal) tokensVal.textContent = s.maxTokens;

        const stream = document.getElementById('sandbox-stream-toggle');
        if (stream) stream.checked = s.stream !== false;

        const save = document.getElementById('sandbox-save-toggle');
        if (save) save.checked = s.saveHistory === true;
    },

    saveSettings() {
        this.settings = {
            systemPrompt: document.getElementById('sandbox-system-prompt')?.value?.trim() || '',
            temperature: parseFloat(document.getElementById('sandbox-temperature')?.value) || 0.7,
            maxTokens: parseInt(document.getElementById('sandbox-max-tokens')?.value) || 4096,
            stream: document.getElementById('sandbox-stream-toggle')?.checked !== false,
            saveHistory: document.getElementById('sandbox-save-toggle')?.checked === true,
        };

        Storage.set('sandbox_settings', this.settings);
        Utils.toast('Sandbox settings saved!', 'success', 2000);
        this.switchTab('direct');
    },

    resetSettings() {
        this.settings = {
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 4096,
            stream: true,
            saveHistory: false,
        };
        Storage.remove('sandbox_settings');
        this.applySettingsToUI();
        Utils.toast('Settings reset to defaults', 'info', 2000);
    },

    getSystemPrompt() {
        return this.settings.systemPrompt || 'You are a helpful AI assistant. Have a natural conversation. Be friendly, concise, and helpful.';
    },

    // ── Model selects ──
    populateModelSelects() {
        const selects = ['sandbox-direct-model', 'sandbox-sbs-model-a', 'sandbox-sbs-model-b'];
        const models = API.POPULAR_MODELS;

        selects.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            while (select.options.length > 1) select.remove(1);

            const categories = { free: '🆓 Free', thinking: '🧠 Thinking', premium: '⭐ Premium' };
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
    },

    // ── Open/Close ──
    open() {
        const modal = document.getElementById('sandbox-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateModelSelects();
            this.applySettingsToUI();
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

        this.renderDirectMessages();
        this.setGenerating(true, 'direct');

        try {
            const messages = this.directMessages.map(m => ({ role: m.role, content: m.content }));

            const result = await API.sendMessage(messages, model, {
                systemPrompt: this.getSystemPrompt(),
                temperature: this.settings.temperature,
                maxTokens: this.settings.maxTokens,
                stream: this.settings.stream,
            });

            let fullContent = '';

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    fullContent += chunk;
                    this.updateDirectStream(fullContent);
                }
            } else if (result?.content) {
                fullContent = result.content;
            }

            if (fullContent) {
                this.directMessages.push({ role: 'assistant', content: fullContent });
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.directMessages.push({ role: 'assistant', content: `Error: ${error.message}` });
            }
        } finally {
            this.setGenerating(false, 'direct');
            this.renderDirectMessages();
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
                            ${isUser ? 'You' : 'AI'}
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

        this.renderSbsMessages();
        this.setGenerating(true, 'sbs');

        const sysPrompt = this.getSystemPrompt();

        // Her model için kendi mesaj geçmişini oluştur
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

        } catch (error) {
            if (error.name !== 'AbortError') {
                Utils.toast('Error: ' + error.message, 'error');
            }
        } finally {
            this.setGenerating(false, 'sbs');
            this.renderSbsMessages();
        }
    },

    async fetchSbsResponse(messages, model, systemPrompt, side) {
        const result = await API.sendMessage(messages, model, {
            systemPrompt,
            temperature: this.settings.temperature,
            maxTokens: this.settings.maxTokens,
            stream: false,
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

        if (this.sbsMessages.length === 0) {
            const emptyHtml = (label) => `
                <div class="sandbox-empty">
                    <i data-lucide="bot" class="sandbox-empty-icon"></i>
                    <p>${label}</p>
                </div>
            `;
            containerA.innerHTML = emptyHtml('Model A');
            containerB.innerHTML = emptyHtml('Model B');
            if (window.lucide) {
                lucide.createIcons({ nodes: [containerA] });
                lucide.createIcons({ nodes: [containerB] });
            }
            return;
        }

        let htmlA = '';
        let htmlB = '';
        let responseIndex = 0;

        for (const msg of this.sbsMessages) {
            const userTokens = Utils.estimateTokens(msg.content);
            const userHtml = `
                <div class="sandbox-msg sandbox-msg-user">
                    <div class="message-avatar user">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="sandbox-msg-content">
                        <div class="sandbox-msg-name">
                            You
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
                                AI
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
                                AI
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
                    <div class="sandbox-msg-name">AI</div>
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

            // Stream elementlerini temizle
            document.getElementById('sandbox-direct-stream')?.remove();
            document.getElementById('sandbox-sbs-stream-a')?.remove();
            document.getElementById('sandbox-sbs-stream-b')?.remove();
        }

        if (window.lucide) lucide.createIcons();
    },
};
