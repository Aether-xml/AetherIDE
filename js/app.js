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
        console.log('⚡ AetherIDE v1.4.3 initializing...');

        ThemeManager.init();
        LayoutManager.init();
        Settings.init();
        Editor.init();
        FileTree.init();
        Chat.init();
        Sandbox.init();

        this.bindEvents();
        this.loadState();
        this.initModelSelector();
        this.initConsoleListener();
        Utils.initCharCounters();

        // Prompt enhancer butonunu ayarlara göre gizle/göster
        const enhancerSettings = Storage.getSettings();
        const enhanceBtn = document.getElementById('enhance-btn');
        if (enhanceBtn && enhancerSettings.promptEnhancer?.enabled === false) {
            enhanceBtn.style.display = 'none';
        }

        if (API.hasApiKey()) {
            API.updateConnectionStatus('online');
        }

        console.log('⚡ AetherIDE ready!');

        // Show setup wizard for first-time users
        SetupWizard.show();
    },

    // Console mesajlarını dinle (iframe'den)
    initConsoleListener() {
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'aetheride-console') {
                // Origin kontrolü — sadece kendi preview iframe'imizden kabul et
                const previewFrame = document.getElementById('preview-iframe');
                if (previewFrame && event.source !== previewFrame.contentWindow) {
                    return; // Dış kaynaktan gelen mesajı reddet
                }

                Editor.addConsoleLog(
                    event.data.logType || 'log',
                    event.data.message || '',
                    'preview'
                );
            }
        });
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

        // Planner speed toggle
        document.querySelectorAll('.planner-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.planner-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                PlannerMode.speed = btn.dataset.speed;

                const speedNames = { flash: 'Flash ⚡', pro: 'Pro 🧠' };
                Utils.toast(`Planner: ${speedNames[btn.dataset.speed]}`, 'info', 1500);
            });
        });

        // Prompt Enhancer
        document.getElementById('enhance-btn')?.addEventListener('click', () => this.enhanceCurrentPrompt());

        // Klavye kısayolları
        document.addEventListener('keydown', (e) => {
            const sandboxModal = document.getElementById('sandbox-modal');
            const settingsModal = document.getElementById('settings-modal');
            const isSandboxOpen = sandboxModal && sandboxModal.style.display !== 'none';
            const isSettingsOpen = settingsModal && settingsModal.style.display !== 'none';

            // Ctrl+Enter — Mesaj gönder
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (isSandboxOpen) {
                    if (Sandbox.currentTab === 'direct') Sandbox.sendDirect();
                    else if (Sandbox.currentTab === 'sidebyside') Sandbox.sendSideBySide();
                } else if (!isSettingsOpen) {
                    Chat.sendMessage();
                }
                return;
            }

            // Ctrl+N — Yeni chat
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (!isSandboxOpen && !isSettingsOpen) {
                    Chat.newChat();
                }
                return;
            }

            // Ctrl+, — Ayarlar
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                if (isSettingsOpen) Settings.close();
                else Settings.open();
                return;
            }

            // Ctrl+B — Sidebar toggle
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (window.innerWidth <= 768) {
                    sidebar?.classList.toggle('open');
                    overlay?.classList.toggle('visible');
                }
                return;
            }

            // Ctrl+Shift+S — Sandbox toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (isSandboxOpen) Sandbox.close();
                else Sandbox.open();
                return;
            }

            // Ctrl+Shift+P — Preview toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                if (!isSandboxOpen && !isSettingsOpen) {
                    Editor.togglePreview();
                }
                return;
            }

            // Ctrl+Shift+C — Copy code
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                if (!isSandboxOpen && !isSettingsOpen && Editor.currentCode) {
                    if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(Editor.currentCode).then(() => {
                            Utils.toast('Code copied!', 'success');
                        }).catch(() => Editor.fallbackCopy(Editor.currentCode));
                    } else {
                        Editor.fallbackCopy(Editor.currentCode);
                    }
                }
                return;
            }

            // Ctrl+L — Chat input'a odaklan
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                if (!isSandboxOpen && !isSettingsOpen) {
                    const input = document.getElementById('message-input');
                    if (input) input.focus();
                }
                return;
            }

            // Ctrl+/ — Kısayol listesi
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.showShortcutsHelp();
                return;
            }

            // Escape — modal kapatma
            if (e.key === 'Escape') {
                if (isSandboxOpen) { Sandbox.close(); return; }
                if (isSettingsOpen) { Settings.close(); return; }
                return;
            }

            // DevTools caydırıcı — F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
            ) {
                e.preventDefault();
                e.stopPropagation();
                Utils.toast('🔒 Developer tools are disabled', 'warning', 2000);
                return;
            }
        });

        // Sağ tık engeli
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            Utils.toast('🔒 Right-click is disabled', 'warning', 1500);
        });
    },

    showShortcutsHelp() {
        const shortcuts = [
            'Ctrl+Enter — Send message',
            'Ctrl+N — New chat',
            'Ctrl+, — Settings',
            'Ctrl+L — Focus input',
            'Ctrl+B — Toggle sidebar (mobile)',
            'Ctrl+Shift+S — Toggle Sandbox',
            'Ctrl+Shift+P — Toggle Preview',
            'Ctrl+Shift+C — Copy code',
            'Ctrl+/ — Show shortcuts',
        ].join('\n');

        Utils.toast('Keyboard Shortcuts:\n' + shortcuts, 'info', 6000);
    },

    // ── Prompt Enhancer ──
    async enhanceCurrentPrompt() {
        const input = document.getElementById('message-input');
        if (!input || !input.value.trim() || this.isEnhancing) return;

        const settings = Storage.getSettings();
        if (settings.promptEnhancer?.enabled === false) {
            Utils.toast('Prompt enhancer is disabled. Enable it in Settings.', 'info');
            return;
        }

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

                if (enhanceBtn) {
                    enhanceBtn.classList.remove('enhancing');
                    enhanceBtn.classList.add('enhanced');
                    setTimeout(() => enhanceBtn.classList.remove('enhanced'), 1000);
                }

                Utils.toast('✨ Prompt enhanced!', 'success', 1500);
            } else {
                Utils.toast('Prompt is already good!', 'info', 1500);
            }
        } catch (e) {
            Utils.toast('Enhancement failed: ' + e.message, 'error');
        } finally {
            this.isEnhancing = false;
            if (enhanceBtn) {
                enhanceBtn.classList.remove('enhancing');
                enhanceBtn.disabled = false;
            }
        }
    },

    // ── Mode Ayarla ──
    setMode(mode) {
        if (!Modes[mode]) return;

        // Team mode aktifken geçişi engelle
        if (this.currentMode === 'team' && TeamMode.isActive() && mode !== 'team') {
            Utils.toast('Cannot switch modes while Team is active. Wait for completion or start a new chat.', 'warning', 4000);
            return;
        }

        // Planner coding fazındayken geçişi engelle
        if (this.currentMode === 'planner' && PlannerMode.phase === 'coding' && mode !== 'planner') {
            Utils.toast('Cannot switch modes while Planner is coding.', 'warning', 3000);
            return;
        }

        // Aktif sohbet modundan farklı moda geçişi engelle
        if (Chat.currentChat && Chat.currentChat.messages.length > 0 && Chat.currentChat.mode) {
            if (Chat.currentChat.mode !== mode) {
                const currentModeName = Chat.currentChat.mode.charAt(0).toUpperCase() + Chat.currentChat.mode.slice(1);
                const newModeName = mode.charAt(0).toUpperCase() + mode.slice(1);
                Utils.toast(`This chat uses ${currentModeName} mode. Start a new chat for ${newModeName}.`, 'warning', 4000);
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

        // UI öğelerini güncelle
        const plannerEl = document.getElementById('planner-actions');
        const teamEl = document.getElementById('team-agents');
        const plannerSpeedEl = document.getElementById('planner-speed-section');
        if (plannerEl) plannerEl.style.display = 'none';
        if (teamEl) teamEl.style.display = mode === 'team' ? 'flex' : 'none';
        if (plannerSpeedEl) plannerSpeedEl.style.display = mode === 'planner' ? 'block' : 'none';

        // Thinking display gizle
        const thinkingDisplay = document.getElementById('planner-thinking-display');
        if (thinkingDisplay) thinkingDisplay.style.display = 'none';

        // State reset
        if (mode !== 'planner' && PlannerMode) {
            PlannerMode.phase = 'planning';
            PlannerMode.currentPlan = null;
            PlannerMode.thinkingContent = '';
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

            // Escape ile kapat
            if (e.key === 'Escape') {
                wrapper.classList.remove('open');
            }
        });

        const lastModel = Storage.getLastModel();
        if (lastModel) {
            this.selectModel(lastModel);
        } else {
            // Model seçilmemişse thinking toggle'ı gizle
            this.updateThinkingToggleVisibility('');
        }
    },

    populateModels(filter = '') {
        const optionsEl = document.getElementById('model-options');
        if (!optionsEl) return;

        let models = API.POPULAR_MODELS;
        let html = '';

        if (filter) {
            const lowerFilter = filter.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(lowerFilter) ||
                m.id.toLowerCase().includes(lowerFilter)
            );

            if (models.length === 0 && filter.includes('/')) {
                html = `
                    <div class="select-option custom-model-option"
                         onclick="App.selectModel('${Utils.escapeHtml(filter)}'); document.getElementById('model-select-wrapper').classList.remove('open');">
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
        const categories = {};
        const categoryLabels = {
            free: '🆓 Free Models',
            thinking: '🧠 Thinking Models',
            premium: '⭐ Premium Models',
            latest: '🔥 Latest',
            stable: '✅ Stable',
            flagship: '🏆 Flagship',
            reasoning: '🧠 Reasoning',
            legacy: '📦 Legacy',
            available: '📋 Available',
        };

        models.forEach(m => {
            const cat = m.category || 'premium';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(m);
        });

        for (const [key, catModels] of Object.entries(categories)) {
            if (catModels.length === 0) continue;

            html += `<div class="select-category-label">${categoryLabels[key] || key}</div>`;
            html += catModels.map(m => `
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
        this.updateThinkingToggleVisibility(modelId);

        if (API.hasApiKey()) {
            API.updateConnectionStatus('online');
        }
    },

    // Thinking toggle'ı sadece destekleyen modellerde göster
    updateThinkingToggleVisibility(modelId) {
        const thinkingToggleRow = document.getElementById('thinking-toggle')?.closest('.toggle-option');
        if (!thinkingToggleRow) return;

        const id = (modelId || '').toLowerCase();
        const isThinkingModel =
            id.includes('thinking') ||
            id.includes('think') ||
            id.includes('-r1') ||
            id.includes('r1-') ||
            id.includes('deepseek-reasoner') ||
            id.includes('o1-') ||
            id.includes('o1') === (id.endsWith('o1') || id.includes('o1-')) ||
            id.includes('o3-') ||
            id.includes('o4-') ||
            id.includes('qwq') ||
            id.includes('qwen3-max-thinking') ||
            id.includes('reasoning') ||
            (id.includes('/o1') || id.includes('/o3') || id.includes('/o4'));

        // Daha kesin kontrol
        const thinkingPatterns = [
            /thinking/i,
            /[\/-]r1[\/-]|[\/-]r1$/i,
            /deepseek-reasoner/i,
            /\bo[134]-/i,
            /\bo[134]$/i,
            /\bqwq\b/i,
            /reasoning/i,
        ];

        const isThinking = thinkingPatterns.some(p => p.test(modelId));

        if (isThinking) {
            thinkingToggleRow.style.display = '';
        } else {
            thinkingToggleRow.style.display = 'none';
            // Thinking kapalıyken toggle'ı da kapat
            const toggle = document.getElementById('thinking-toggle');
            if (toggle) toggle.checked = false;
        }
    },

    _currentMobilePanel: 'chat',

    showMobilePanel(panel) {
        if (this._currentMobilePanel === panel) return;
        this._currentMobilePanel = panel;

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

            Editor.renderCode();
        }

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
        const container = document.getElementById('split-container');

        if (!resizer || !chatPanel || !codePanel || !container) return;

        let isResizing = false;
        let savedChatFlex = null;
        let savedCodeFlex = null;
        let startX = 0;
        let startChatWidth = 0;
        let startCodeWidth = 0;

        const MIN_PANEL_PX = 280; // Minimum panel genişliği (piksel)

        const doResize = (e) => {
            if (!isResizing) return;
            e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const rect = container.getBoundingClientRect();
            const containerWidth = rect.width;

            // Resizer genişliğini çıkar
            const resizerWidth = resizer.offsetWidth || 6;
            const usableWidth = containerWidth - resizerWidth;

            const isReversed = document.body.classList.contains('layout-vscode') ||
                               document.body.classList.contains('layout-cursor');

            // Mouse pozisyonunu container'a göre hesapla
            let mousePos = clientX - rect.left;

            // Sidebar genişliğini hesaba katma (container zaten sidebar hariç)
            // Piksel bazlı min/max sınırları
            const minPx = MIN_PANEL_PX;
            const maxPx = usableWidth - MIN_PANEL_PX;

            if (isReversed) {
                // VSCode/Cursor: Code | Resizer | Chat
                // mousePos = code panel genişliği
                const codePx = Math.max(minPx, Math.min(maxPx, mousePos));
                const chatPx = usableWidth - codePx;

                const codePercent = (codePx / containerWidth) * 100;
                const chatPercent = (chatPx / containerWidth) * 100;

                codePanel.style.flex = `0 0 ${codePercent}%`;
                codePanel.style.maxWidth = 'none';
                chatPanel.style.flex = `0 0 ${chatPercent}%`;
                chatPanel.style.maxWidth = 'none';
            } else {
                // Default: Chat | Resizer | Code
                // mousePos = chat panel genişliği
                const chatPx = Math.max(minPx, Math.min(maxPx, mousePos));
                const codePx = usableWidth - chatPx;

                const chatPercent = (chatPx / containerWidth) * 100;
                const codePercent = (codePx / containerWidth) * 100;

                chatPanel.style.flex = `0 0 ${chatPercent}%`;
                chatPanel.style.maxWidth = 'none';
                codePanel.style.flex = `0 0 ${codePercent}%`;
                codePanel.style.maxWidth = 'none';
            }

            // Iframe ve diğer etkileşimli elementleri devre dışı bırak
            const iframe = document.getElementById('preview-iframe');
            if (iframe) iframe.style.pointerEvents = 'none';

            // Code editor'deki seçimi engelle
            const codeEditor = document.getElementById('code-editor');
            if (codeEditor) codeEditor.style.pointerEvents = 'none';
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            const iframe = document.getElementById('preview-iframe');
            if (iframe) iframe.style.pointerEvents = '';

            const codeEditor = document.getElementById('code-editor');
            if (codeEditor) codeEditor.style.pointerEvents = '';

            savedChatFlex = chatPanel.style.flex;
            savedCodeFlex = codePanel.style.flex;

            // Resize sonrası editörü yeniden render et (satır numaraları vb.)
            if (Editor.currentCode) {
                requestAnimationFrame(() => Editor.renderCode());
            }
        };

        const startResize = (e) => {
            // Mobilde çalışmasın
            if (window.innerWidth <= 768) return;

            isResizing = true;
            resizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            startX = e.touches ? e.touches[0].clientX : e.clientX;
            startChatWidth = chatPanel.offsetWidth;
            startCodeWidth = codePanel.offsetWidth;

            e.preventDefault();
        };

        resizer.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

        resizer.addEventListener('touchstart', startResize, { passive: false });
        document.addEventListener('touchmove', doResize, { passive: false });
        document.addEventListener('touchend', stopResize);

        // Window resize — mobil geçişte temizle, desktop'ta koru
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth <= 768) {
                chatPanel.style.flex = '';
                chatPanel.style.maxWidth = '';
                codePanel.style.flex = '';
                codePanel.style.maxWidth = '';
            } else if (savedChatFlex && savedCodeFlex) {
                chatPanel.style.flex = savedChatFlex;
                codePanel.style.flex = savedCodeFlex;
            }
        }, 200));

        // Double click — reset
        resizer.addEventListener('dblclick', () => {
            chatPanel.style.flex = '';
            chatPanel.style.maxWidth = '';
            codePanel.style.flex = '';
            codePanel.style.maxWidth = '';
            savedChatFlex = null;
            savedCodeFlex = null;
            Utils.toast('Panels reset to default', 'info', 1500);
        });
    },

    loadState() {
        const lastMode = Storage.getLastMode();
        if (lastMode) {
            // Aktif chat varsa ve mesaj varsa chat'in modunu kullan, yoksa son modu kullan
            const chatMode = Chat.currentChat?.mode;
            const hasMessages = Chat.currentChat?.messages?.length > 0;
            const targetMode = (hasMessages && chatMode) ? chatMode : lastMode;
            this.setMode(targetMode);
        }

        // Font size uygula
        const settings = Storage.getSettings();
        if (settings.fontSize) {
            document.documentElement.style.setProperty('--editor-font-size', settings.fontSize + 'px');
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
