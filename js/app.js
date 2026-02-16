/* ══════════════════════════════════════════════════════════
   AetherIDE — Main Application v2
   Mod kilidi, Prompt Enhancer, Panel animasyonları
   ══════════════════════════════════════════════════════════ */

const Modes = {
    direct: DirectMode,
    planner: PlannerMode,
    team: TeamMode,
};

const App = {

    currentMode: 'direct',
    currentModel: '',
    isEnhancing: false,

    init() {
        console.log('⚡ AetherIDE v1.2.0 initializing...');

        ThemeManager.init();
        LayoutManager.init();
        Settings.init();
        Editor.init();
        Chat.init();
        Sandbox.init();

        this.bindEvents();
        this.loadState();
        this.initModelSelector();

        if (API.hasApiKey()) {
            API.updateConnectionStatus('online');
        }

        console.log('⚡ AetherIDE ready!');
    },

    bindEvents() {
        // Mode butonları
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
        });

        // Mobil menü
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.add('open');
            document.getElementById('sidebar-overlay')?.classList.add('visible');
        });

        document.getElementById('sidebar-close-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('visible');
        });

        document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('visible');
        });

        // Mobil tab bar
        document.getElementById('tab-chat')?.addEventListener('click', () => this.showMobilePanel('chat'));
        document.getElementById('tab-code')?.addEventListener('click', () => this.showMobilePanel('code'));

        // Panel resizer
        this.initResizer();

        // Thinking toggle
        document.getElementById('thinking-toggle')?.addEventListener('change', (e) => {
            const text = e.target.checked ? 'On' : 'Off';
            const statusEl = document.getElementById('statusbar-thinking');
            if (statusEl) statusEl.innerHTML = `<i data-lucide="brain" class="statusbar-icon"></i> ${text}`;
            if (window.lucide && statusEl) lucide.createIcons({ nodes: [statusEl] });
        });

        // Prompt Enhancer
        document.getElementById('enhance-btn')?.addEventListener('click', () => this.enhanceCurrentPrompt());
    },

    // ── Prompt Enhancer ──
    async enhanceCurrentPrompt() {
        const input = document.getElementById('message-input');
        if (!input || !input.value.trim() || this.isEnhancing) return;

        if (!API.hasApiKey()) {
            Utils.toast('API key required for prompt enhancement', 'warning');
            return;
        }

        const model = App.currentModel;
        if (!model) {
            Utils.toast('Select a model first', 'warning');
            return;
        }

        this.isEnhancing = true;
        const enhanceBtn = document.getElementById('enhance-btn');
        if (enhanceBtn) {
            enhanceBtn.classList.add('enhancing');
            enhanceBtn.disabled = true;
        }

        try {
            const enhanced = await Utils.enhancePrompt(input.value.trim());
            if (enhanced && enhanced !== input.value.trim()) {
                input.value = enhanced;
                Utils.autoResize(input);
                document.getElementById('send-btn').disabled = false;
                Utils.toast('Prompt enhanced!', 'success', 1500);
            }
        } catch (e) {
            Utils.toast('Enhancement failed', 'error');
        } finally {
            this.isEnhancing = false;
            if (enhanceBtn) {
                enhanceBtn.classList.remove('enhancing');
                enhanceBtn.disabled = false;
            }
        }
    },

    // ── Mode Ayarla (Mod kilidi dahil) ──
    setMode(mode) {
        if (!Modes[mode]) return;

        // Team mode aktifken diğer modlara geçişi engelle
        if (this.currentMode === 'team' && TeamMode.isActive() && mode !== 'team') {
            Utils.toast('Cannot switch modes while Team is active. Wait for completion or start a new chat.', 'warning', 4000);
            return;
        }

        // Planner coding fazındayken geçişi engelle
        if (this.currentMode === 'planner' && PlannerMode.phase === 'coding' && mode !== 'planner') {
            Utils.toast('Cannot switch modes while Planner is coding.', 'warning', 3000);
            return;
        }

        // Aktif sohbet varsa ve mesaj varsa, mod değişimini engelle
        if (Chat.currentChat && Chat.currentChat.messages.length > 0 && Chat.currentChat.mode) {
            if (Chat.currentChat.mode !== mode) {
                Utils.toast(`This chat was started in ${Chat.currentChat.mode.charAt(0).toUpperCase() + Chat.currentChat.mode.slice(1)} mode. Start a new chat to use ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode.`, 'warning', 4000);
                return;
            }
        }

        this.currentMode = mode;
        Storage.setLastMode(mode);

        // Butonları güncelle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Topbar güncelle
        const modeNames = { direct: 'Direct', planner: 'Planner', team: 'Team' };
        const modeIcons = { direct: 'zap', planner: 'clipboard-list', team: 'users' };

        const modeDisplay = document.getElementById('current-mode-display');
        if (modeDisplay) {
            modeDisplay.innerHTML = `
                <i data-lucide="${modeIcons[mode]}" class="topbar-mode-icon"></i>
                <span class="current-mode-name">${modeNames[mode]}</span>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [modeDisplay] });
        }

        // Statusbar
        const statusMode = document.getElementById('statusbar-mode');
        if (statusMode) {
            statusMode.innerHTML = `<i data-lucide="${modeIcons[mode]}" class="statusbar-icon"></i> ${modeNames[mode]}`;
            if (window.lucide) lucide.createIcons({ nodes: [statusMode] });
        }

        // Planner/Team UI
        const plannerEl = document.getElementById('planner-actions');
        const teamEl = document.getElementById('team-agents');
        if (plannerEl) plannerEl.style.display = 'none';
        if (teamEl) teamEl.style.display = mode === 'team' ? 'flex' : 'none';

        // State reset
        if (mode !== 'planner' && PlannerMode) {
            PlannerMode.phase = 'planning';
            PlannerMode.currentPlan = null;
        }

        // Placeholder güncelle
        const placeholders = {
            direct: 'What do you want to build?',
            planner: 'Describe your project for planning...',
            team: 'Describe your project for the team...',
        };
        const input = document.getElementById('message-input');
        if (input) input.placeholder = placeholders[mode] || placeholders.direct;

        // Mobilde sidebar kapat
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('visible');
    },

    // Model seçici
    initModelSelector() {
        const wrapper = document.getElementById('model-select-wrapper');
        const btn = document.getElementById('model-select-btn');
        const dropdown = document.getElementById('model-dropdown');
        const searchInput = document.getElementById('model-search');

        if (!wrapper || !btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('open');
            if (wrapper.classList.contains('open')) {
                searchInput?.focus();
                this.populateModels();
            }
        });

        document.addEventListener('click', () => {
            wrapper.classList.remove('open');
        });

        dropdown?.addEventListener('click', (e) => e.stopPropagation());

        searchInput?.addEventListener('input', () => {
            this.populateModels(searchInput.value);
        });

        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    const existing = API.POPULAR_MODELS.find(m =>
                        m.id.toLowerCase() === query.toLowerCase() ||
                        m.name.toLowerCase() === query.toLowerCase()
                    );

                    if (existing) {
                        this.selectModel(existing.id);
                    } else {
                        this.selectModel(query);
                        Utils.toast(`Custom model: ${query}`, 'info', 2000);
                    }

                    searchInput.value = '';
                    wrapper.classList.remove('open');
                }
            }
        });

        const lastModel = Storage.getLastModel();
        if (lastModel) {
            this.selectModel(lastModel);
        }
    },

    populateModels(filter = '') {
        const optionsEl = document.getElementById('model-options');
        if (!optionsEl) return;

        let models = API.POPULAR_MODELS;
        let html = '';

        if (filter) {
            models = models.filter(m =>
                m.name.toLowerCase().includes(filter.toLowerCase()) ||
                m.id.toLowerCase().includes(filter.toLowerCase())
            );

            if (models.length === 0 && filter.includes('/')) {
                html = `
                    <div class="select-option custom-model-option"
                         onclick="App.selectModel('${Utils.escapeHtml(filter)}')">
                        <span class="custom-model-label">
                            <i data-lucide="plus-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></i>
                            Use: ${Utils.escapeHtml(filter)}
                        </span>
                        <span class="select-option-price">Custom</span>
                    </div>
                `;
            }
        }

        // Kategoriye göre grupla
        const categories = {
            free: { label: '🆓 Free Models', models: [] },
            thinking: { label: '🧠 Thinking Models', models: [] },
            premium: { label: '⭐ Premium Models', models: [] },
        };

        models.forEach(m => {
            const cat = m.category || 'premium';
            if (categories[cat]) {
                categories[cat].models.push(m);
            } else {
                categories.premium.models.push(m);
            }
        });

        for (const [key, cat] of Object.entries(categories)) {
            if (cat.models.length === 0) continue;

            html += `<div class="select-category-label">${cat.label}</div>`;
            html += cat.models.map(m => `
                <div class="select-option ${m.id === this.currentModel ? 'selected' : ''}"
                     onclick="App.selectModel('${m.id}')">
                    <span>${m.name}</span>
                    <span class="select-option-price">${m.price || ''}</span>
                </div>
            `).join('');
        }

        if (!filter) {
            html += `
                <div class="select-option-hint">
                    Type a model ID (e.g. provider/model-name) and press Enter
                </div>
            `;
        }

        optionsEl.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [optionsEl] });
    },

    filterModels(query) {
        this.populateModels(query);
    },

    selectModel(modelId) {
        if (!modelId) return;

        this.currentModel = modelId;
        Storage.setLastModel(modelId);

        const model = API.POPULAR_MODELS.find(m => m.id === modelId);
        const name = model?.name || modelId.split('/').pop() || modelId;

        const valueEl = document.querySelector('#model-select-btn .select-value');
        if (valueEl) valueEl.textContent = name;

        const modelDisplay = document.getElementById('current-model-display');
        if (modelDisplay) modelDisplay.textContent = name;

        document.getElementById('model-select-wrapper')?.classList.remove('open');

        const searchInput = document.getElementById('model-search');
        if (searchInput) searchInput.value = '';

        this.populateModels();
    },

    // Mobil panel geçişi (animasyonlu)
    showMobilePanel(panel) {
        const chatPanel = document.getElementById('chat-panel');
        const codePanel = document.getElementById('code-panel');
        const tabChat = document.getElementById('tab-chat');
        const tabCode = document.getElementById('tab-code');

        if (!chatPanel || !codePanel) return;

        if (panel === 'chat') {
            chatPanel.style.display = 'flex';
            chatPanel.classList.add('panel-enter');
            codePanel.style.display = 'none';
            codePanel.classList.remove('panel-enter');
            tabChat?.classList.add('active');
            tabCode?.classList.remove('active');
        } else {
            chatPanel.style.display = 'none';
            chatPanel.classList.remove('panel-enter');
            codePanel.style.display = 'flex';
            codePanel.classList.add('panel-enter');
            tabChat?.classList.remove('active');
            tabCode?.classList.add('active');
        }

        // Animasyonu temizle
        setTimeout(() => {
            chatPanel.classList.remove('panel-enter');
            codePanel.classList.remove('panel-enter');
        }, 300);
    },

    // Panel resizer
    initResizer() {
        const resizer = document.getElementById('panel-resizer');
        const chatPanel = document.getElementById('chat-panel');
        const codePanel = document.getElementById('code-panel');

        if (!resizer || !chatPanel || !codePanel) return;

        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const container = document.getElementById('split-container');
            const rect = container.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            const clamped = Math.max(25, Math.min(75, percent));
            chatPanel.style.flex = `0 0 ${clamped}%`;
            codePanel.style.flex = `0 0 ${100 - clamped}%`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    },

    loadState() {
        const lastMode = Storage.getLastMode();
        if (lastMode) this.setMode(lastMode);
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
