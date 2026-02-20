const Settings = {

    currentProvider: 'openrouter',

    init() {
        this.bindEvents();
        this.loadSettings();
    },

    bindEvents() {
        document.getElementById('settings-btn')?.addEventListener('click', () => this.open());
        document.getElementById('settings-close')?.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('settings-modal');
                if (modal && modal.style.display !== 'none') this.close();
            }
        });

        document.getElementById('settings-save')?.addEventListener('click', () => this.save());
        document.getElementById('settings-reset')?.addEventListener('click', () => this.reset());

        document.getElementById('settings-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') this.close();
        });

        document.getElementById('toggle-key-visibility')?.addEventListener('click', () => {
            const input = document.getElementById('api-key-input');
            const icon = document.getElementById('key-eye-icon');
            if (input.type === 'password') {
                input.type = 'text';
                icon?.setAttribute('data-lucide', 'eye');
            } else {
                input.type = 'password';
                icon?.setAttribute('data-lucide', 'eye-off');
            }
            if (window.lucide) lucide.createIcons();
        });

        document.getElementById('font-size-range')?.addEventListener('input', (e) => {
            document.getElementById('font-size-value').textContent = e.target.value + 'px';
        });

        document.querySelectorAll('.layout-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.layout-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ThemeManager.apply(btn.dataset.theme);
            });
        });

        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.accent-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ThemeManager.applyAccent(btn.dataset.accent);
            });
        });

        // Provider seçimi
        document.querySelectorAll('.provider-option').forEach(btn => {
            btn.addEventListener('click', () => this.switchProvider(btn.dataset.provider));
        });

        // Typing efekti toggle
        document.getElementById('typing-effect-toggle')?.addEventListener('change', (e) => {
            const speedRow = document.getElementById('typing-speed-row');
            if (speedRow) speedRow.style.display = e.target.checked ? 'flex' : 'none';
        });
    },

    switchProvider(providerId) {
        const config = API.PROVIDERS[providerId];
        if (!config) return;

        // Mevcut key'i kaydet
        const currentKey = document.getElementById('api-key-input')?.value?.trim() || '';
        const settings = Storage.getSettings();
        if (!settings.apiKeys) settings.apiKeys = {};
        if (this.currentProvider && currentKey) {
            settings.apiKeys[this.currentProvider] = currentKey;
        }
        Storage.saveSettings(settings);

        this.currentProvider = providerId;

        document.querySelectorAll('.provider-option').forEach(b => {
            b.classList.toggle('active', b.dataset.provider === providerId);
        });

        const label = document.getElementById('api-key-label');
        if (label) label.textContent = `${config.name} API Key`;

        const input = document.getElementById('api-key-input');
        if (input) {
            input.placeholder = config.keyPlaceholder;
            input.value = settings.apiKeys?.[providerId] || '';
        }

        const docsLink = document.getElementById('api-key-docs-link');
        if (docsLink) { docsLink.href = config.docsUrl; docsLink.textContent = 'Get key →'; }

        const status = document.getElementById('api-key-status');
        if (status) { status.textContent = ''; status.className = 'api-key-status'; }

        const savedKey = settings.apiKeys?.[providerId] || '';
        if (savedKey && input) {
            input.value = savedKey;
            this.checkApiKey(savedKey, providerId);
        }

        // Default model listesini provider'a göre güncelle
        this.populateDefaultModel();
    },

    loadSettings() {
        const settings = Storage.getSettings();

        this.currentProvider = settings.apiProvider || 'openrouter';
        document.querySelectorAll('.provider-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.provider === this.currentProvider);
        });

        const config = API.PROVIDERS[this.currentProvider];
        if (config) {
            const label = document.getElementById('api-key-label');
            if (label) label.textContent = `${config.name} API Key`;

            const input = document.getElementById('api-key-input');
            if (input) {
                input.placeholder = config.keyPlaceholder;
                input.value = settings.apiKeys?.[this.currentProvider] || settings.apiKey || '';
            }

            const docsLink = document.getElementById('api-key-docs-link');
            if (docsLink) docsLink.href = config.docsUrl;
        }

        const fontSize = document.getElementById('font-size-range');
        if (fontSize) {
            fontSize.value = settings.fontSize || 14;
            document.getElementById('font-size-value').textContent = (settings.fontSize || 14) + 'px';
        }

        const autoSave = document.getElementById('auto-save-toggle');
        if (autoSave) autoSave.checked = settings.autoSave !== false;

        const stream = document.getElementById('stream-toggle');
        if (stream) stream.checked = settings.streamResponse !== false;

        const systemPrompt = document.getElementById('system-prompt-input');
        if (systemPrompt && settings.systemPrompt) systemPrompt.value = settings.systemPrompt;

        const teamDesigner = document.getElementById('team-designer-model');
        if (teamDesigner) teamDesigner.value = settings.teamModels?.designer || '';
        const teamPm = document.getElementById('team-pm-model');
        if (teamPm) teamPm.value = settings.teamModels?.pm || '';
        const teamDev = document.getElementById('team-developer-model');
        if (teamDev) teamDev.value = settings.teamModels?.developer || '';

        const enhancerToggle = document.getElementById('enhancer-enabled-toggle');
        if (enhancerToggle) enhancerToggle.checked = settings.promptEnhancer?.enabled !== false;
        const enhancerModel = document.getElementById('enhancer-model-input');
        if (enhancerModel) enhancerModel.value = settings.promptEnhancer?.customModel || '';
        const enhancerPrompt = document.getElementById('enhancer-prompt-input');
        if (enhancerPrompt) enhancerPrompt.value = settings.promptEnhancer?.customPrompt || '';

        // Typing efekti
        const typingToggle = document.getElementById('typing-effect-toggle');
        if (typingToggle) typingToggle.checked = settings.typingEffect?.enabled === true;

        const typingSpeed = document.getElementById('typing-speed-select');
        if (typingSpeed) typingSpeed.value = settings.typingEffect?.speed || 'normal';

        // Speed select'i toggle'a göre gizle/göster
        const typingSpeedRow = document.getElementById('typing-speed-row');
        if (typingSpeedRow) typingSpeedRow.style.display = settings.typingEffect?.enabled ? 'flex' : 'none';

        document.querySelectorAll('.layout-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === (settings.layout || 'default'));
        });

        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === (settings.theme || 'dark'));
        });

        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.accent === (settings.accentColor || 'purple'));
        });

        const currentKey = settings.apiKeys?.[this.currentProvider] || settings.apiKey || '';
        if (currentKey) this.checkApiKey(currentKey, this.currentProvider);
    },

    async checkApiKey(key, providerId) {
        const status = document.getElementById('api-key-status');
        if (!status) return;

        status.textContent = 'Checking...';
        status.className = 'api-key-status';

        const result = await API.validateApiKey(key, providerId || this.currentProvider);

        if (result.valid) {
            status.textContent = '✓ Valid API key';
            status.className = 'api-key-status valid';
        } else {
            status.textContent = '✗ Invalid: ' + (result.error || 'Unknown error');
            status.className = 'api-key-status invalid';
        }
    },

    open() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadSettings();
            this.populateDefaultModel();
            this.renderChangelog();
            if (window.lucide) lucide.createIcons();
        }
    },

    CHANGELOG: [
        {
            version: 'v1.5.2',
            date: '2025-07-26',
            changes: [
                { type: 'new', text: 'Character counter on input fields (shows at 60% capacity)' },
                { type: 'new', text: 'Input length limits — 50K main chat, 30K sandbox, 10K system prompts' },
                { type: 'new', text: 'Source protection — right-click & DevTools deterrents' },
                { type: 'new', text: 'Text selection protection across the interface' },
                { type: 'improved', text: 'Prompt Enhancer button now hides when disabled in settings' },
                { type: 'improved', text: 'Accent color properly resets to purple on settings reset' },
                { type: 'improved', text: 'Setup wizard privacy checkbox with animated icon toggle' },
                { type: 'improved', text: 'Textarea max-height enforced via CSS — prevents resize abuse' },
                { type: 'fixed', text: 'Files not appearing in Code tab after AI generation' },
                { type: 'fixed', text: 'File card click not opening the file in editor' },
                { type: 'fixed', text: 'File card animations glitching during streaming' },
                { type: 'fixed', text: 'Accent color not resetting on settings reset' },
            ],
        },
        {
            version: 'v1.5.1',
            date: '2025-07-22',
            changes: [
                { type: 'new', text: 'Thinking mode toggle for supported models' },
                { type: 'new', text: 'Planner thinking display — see AI reasoning in real-time' },
                { type: 'new', text: '6 accent color options (Purple, Blue, Cyan, Green, Rose, Amber)' },
                { type: 'improved', text: 'Status bar shows current mode, thinking state, and version' },
                { type: 'improved', text: 'Model selector with search and category grouping' },
                { type: 'improved', text: 'Better keyboard shortcuts (Ctrl+/ for shortcut list)' },
                { type: 'fixed', text: 'Stream message rendering lag on long responses' },
                { type: 'fixed', text: 'Preview iframe not refreshing on code update' },
            ],
        },
        {
            version: 'v1.5.0',
            date: '2025-07-18',
            changes: [
                { type: 'new', text: 'Sandbox mode — direct chat without code generation rules' },
                { type: 'new', text: 'Side-by-Side model comparison in Sandbox' },
                { type: 'new', text: 'Sandbox settings — temperature, max tokens, stream toggle' },
                { type: 'new', text: 'Sandbox chat history with save/load support' },
                { type: 'new', text: 'Response timer showing generation duration' },
                { type: 'improved', text: 'Token estimation displayed on messages' },
                { type: 'improved', text: 'Sandbox model selects auto-populate from provider' },
                { type: 'fixed', text: 'Side-by-Side panels not scrolling independently on mobile' },
            ],
        },
        {
            version: 'v1.4.5',
            date: '2025-07-15',
            changes: [
                { type: 'new', text: 'Setup wizard for first-time users' },
                { type: 'new', text: 'User display name & avatar color personalization' },
                { type: 'new', text: 'Folder structure support in file tree' },
                { type: 'new', text: 'Console re-run button for quick preview refresh' },
                { type: 'new', text: 'Changelog section in settings' },
                { type: 'improved', text: 'Live preview updates in real-time during code generation' },
                { type: 'improved', text: 'Friendly error messages with expandable technical details' },
                { type: 'improved', text: 'Stronger file modification prompts — AI writes complete files' },
                { type: 'fixed', text: 'File cards stuck on "Creating..." after stream completion' },
                { type: 'fixed', text: 'Mobile tab switching causing unexpected page refresh' },
                { type: 'fixed', text: 'Typing indicator sometimes not appearing' },
            ],
        },
        {
            version: 'v1.4.0',
            date: '2025-07-12',
            changes: [
                { type: 'new', text: 'Multi-provider support — OpenRouter, Google Gemini, OpenAI' },
                { type: 'new', text: 'Prompt Enhancer with custom model and prompt options' },
                { type: 'new', text: 'Planner mode with Flash (fast) & Pro (deep thinking) speeds' },
                { type: 'new', text: 'Team mode — Designer, PM, Developer agents collaborate' },
                { type: 'new', text: 'Layout system — Default, VSCode, and Cursor layouts' },
                { type: 'new', text: 'Auto-fix button when console errors are detected' },
                { type: 'improved', text: 'Mobile-first responsive design overhaul' },
                { type: 'improved', text: 'Stream response handling with 80ms throttled rendering' },
                { type: 'improved', text: 'Code block syntax highlighting for 10+ languages' },
            ],
        },
        {
            version: 'v1.3.0',
            date: '2025-07-08',
            changes: [
                { type: 'new', text: 'Live preview with iframe sandbox for HTML/CSS/JS' },
                { type: 'new', text: 'Console panel capturing logs, errors, and warnings from preview' },
                { type: 'new', text: 'Terminal emulator with built-in commands (help, files, cat, run)' },
                { type: 'new', text: 'ZIP export — download all project files as a single archive' },
                { type: 'new', text: 'File tree explorer with expand/collapse and folder grouping' },
                { type: 'improved', text: 'CSS and JS files auto-inlined into HTML for preview' },
                { type: 'improved', text: 'Console duplicate detection within 1-second window' },
                { type: 'fixed', text: 'Preview not loading when HTML file has no <head> tag' },
                { type: 'fixed', text: 'ZIP export failing on files with special characters in names' },
            ],
        },
        {
            version: 'v1.2.0',
            date: '2025-07-04',
            changes: [
                { type: 'new', text: 'Multi-file support — tabs, file switching, per-file rendering' },
                { type: 'new', text: '6 themes — Dark, Aether, Midnight, Nord, Sunset, Ocean' },
                { type: 'new', text: 'PWA support — install as desktop/mobile app' },
                { type: 'new', text: 'Chat history with save, load, and delete' },
                { type: 'improved', text: 'Code extraction regex handles edge cases and auto-naming' },
                { type: 'improved', text: 'Split panel resizer with double-click reset and touch support' },
                { type: 'fixed', text: 'Tab overflow on many files causing layout break' },
                { type: 'fixed', text: 'Chat history not persisting after browser refresh' },
            ],
        },
        {
            version: 'v1.0.0',
            date: '2025-06-28',
            changes: [
                { type: 'new', text: 'Initial release of AetherIDE' },
                { type: 'new', text: 'Direct mode — instant AI code generation' },
                { type: 'new', text: 'OpenRouter API integration with 200+ models' },
                { type: 'new', text: 'Syntax highlighted code editor with line numbers' },
                { type: 'new', text: 'Single-file download and clipboard copy' },
                { type: 'new', text: 'Dark theme with responsive mobile layout' },
                { type: 'new', text: 'Streaming responses with real-time rendering' },
            ],
        },
    ],

    renderChangelog() {
        const container = document.getElementById('changelog-list');
        if (!container) return;

        const typeIcons = { new: '✨', improved: '⚡', fixed: '🔧' };
        const typeColors = { new: 'var(--accent-success)', improved: 'var(--accent-secondary)', fixed: 'var(--accent-warning)' };

        let html = '';
        for (const release of this.CHANGELOG) {
            html += `<div class="changelog-release">
                <div class="changelog-version-row">
                    <span class="changelog-version">${release.version}</span>
                    <span class="changelog-date">${release.date}</span>
                </div>
                <div class="changelog-items">`;

            for (const change of release.changes) {
                html += `<div class="changelog-item">
                    <span class="changelog-type" style="color:${typeColors[change.type] || 'var(--text-tertiary)'}">
                        ${typeIcons[change.type] || '•'}
                    </span>
                    <span class="changelog-text">${change.text}</span>
                </div>`;
            }

            html += `</div></div>`;
        }

        container.innerHTML = html;
    },

    close() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.style.display = 'none';
    },

    // Default model select'i doldur
    populateDefaultModel() {
        const select = document.getElementById('default-model-select');
        if (!select) return;

        // Aktif provider'a göre modelleri al
        const models = API.PROVIDER_MODELS[this.currentProvider] || API.PROVIDER_MODELS.openrouter;
        const settings = Storage.getSettings();

        // Mevcut seçenekleri temizle (ilk option hariç)
        while (select.options.length > 1) select.remove(1);

        // Kategoriye göre grupla
        const categories = {};
        models.forEach(m => {
            const cat = m.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(m);
        });

        const categoryLabels = {
            free: '🆓 Free', thinking: '🧠 Thinking', premium: '⭐ Premium',
            latest: '🔥 Latest', stable: '✅ Stable', flagship: '🏆 Flagship',
            reasoning: '🧠 Reasoning', legacy: '📦 Legacy', available: '📋 Available',
        };

        for (const [cat, catModels] of Object.entries(categories)) {
            const group = document.createElement('optgroup');
            group.label = categoryLabels[cat] || cat;
            catModels.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = `${m.name} ${m.price ? '(' + m.price + ')' : ''}`;
                group.appendChild(opt);
            });
            select.appendChild(group);
        }

        if (settings.defaultModel) {
            select.value = settings.defaultModel;
        }
    },

    save() {
        const currentKey = document.getElementById('api-key-input')?.value?.trim() || '';
        const oldSettings = Storage.getSettings();
        const apiKeys = oldSettings.apiKeys || {};
        apiKeys[this.currentProvider] = currentKey;

        const settings = {
            apiKey: currentKey,
            apiKeys: apiKeys,
            apiProvider: this.currentProvider,
            defaultModel: document.getElementById('default-model-select')?.value || '',
            systemPrompt: document.getElementById('system-prompt-input')?.value || oldSettings.systemPrompt || '',
            theme: document.querySelector('.theme-option.active')?.dataset.theme || 'dark',
            accentColor: document.querySelector('.accent-option.active')?.dataset.accent || 'purple',
            fontSize: parseInt(document.getElementById('font-size-range')?.value) || 14,
            autoSave: document.getElementById('auto-save-toggle')?.checked !== false,
            streamResponse: document.getElementById('stream-toggle')?.checked !== false,
            layout: document.querySelector('.layout-option.active')?.dataset.layout || 'default',
            teamModels: {
                designer: document.getElementById('team-designer-model')?.value?.trim() || '',
                pm: document.getElementById('team-pm-model')?.value?.trim() || '',
                developer: document.getElementById('team-developer-model')?.value?.trim() || '',
            },
            promptEnhancer: {
                enabled: document.getElementById('enhancer-enabled-toggle')?.checked !== false,
                customModel: document.getElementById('enhancer-model-input')?.value?.trim() || '',
                customPrompt: document.getElementById('enhancer-prompt-input')?.value?.trim() || '',
            },
            typingEffect: {
                enabled: document.getElementById('typing-effect-toggle')?.checked === true,
                speed: document.getElementById('typing-speed-select')?.value || 'normal',
            },
        };

        Storage.saveSettings(settings);
        ThemeManager.apply(settings.theme);
        ThemeManager.applyAccent(settings.accentColor || 'purple');
        LayoutManager.apply(settings.layout);

        // Prompt enhancer butonu gizle/göster
        const enhanceBtn = document.getElementById('enhance-btn');
        if (enhanceBtn) {
            enhanceBtn.style.display = settings.promptEnhancer?.enabled !== false ? 'inline-flex' : 'none';
        }

        // Font size uygula
        document.documentElement.style.setProperty('--editor-font-size', settings.fontSize + 'px');

        // Model listesini provider değişikliğine göre güncelle
        Sandbox.populateModelSelects();

        // API key varsa bağlantı durumunu güncelle
        if (currentKey) {
            this.checkApiKey(currentKey, this.currentProvider);
            API.updateConnectionStatus('online');
        }

        // Default model varsa ve aktif model yoksa, onu seç
        if (settings.defaultModel && !App.currentModel) {
            App.selectModel(settings.defaultModel);
        }

        this.close();
        Utils.toast('Settings saved!', 'success');
    },

    reset() {
        Storage.remove('settings');
        this.currentProvider = 'openrouter';
        this.loadSettings();
        ThemeManager.apply('dark');
        ThemeManager.applyAccent('purple');
        LayoutManager.apply('default');

        // Accent butonlarını güncelle
        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.accent === 'purple');
        });

        // Font size sıfırla
        document.documentElement.style.setProperty('--editor-font-size', '14px');

        // Typing efekti sıfırla
        const typingToggle = document.getElementById('typing-effect-toggle');
        if (typingToggle) typingToggle.checked = false;
        const typingSpeedRow = document.getElementById('typing-speed-row');
        if (typingSpeedRow) typingSpeedRow.style.display = 'none';
        const typingSpeed = document.getElementById('typing-speed-select');
        if (typingSpeed) typingSpeed.value = 'normal';

        Utils.toast('Settings reset to default', 'info');
    },
};
