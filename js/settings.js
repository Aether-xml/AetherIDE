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

        // Provider seçimi
        document.querySelectorAll('.provider-option').forEach(btn => {
            btn.addEventListener('click', () => this.switchProvider(btn.dataset.provider));
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

        document.querySelectorAll('.layout-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === (settings.layout || 'default'));
        });

        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === (settings.theme || 'dark'));
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
            version: 'v1.4.5',
            date: '2025-07-15',
            changes: [
                { type: 'new', text: 'Setup wizard for first-time users' },
                { type: 'new', text: 'User display name & avatar color' },
                { type: 'new', text: 'Folder structure support for files' },
                { type: 'new', text: 'Sandbox response timer' },
                { type: 'new', text: 'Console re-run button' },
                { type: 'new', text: 'Changelog in settings' },
                { type: 'improved', text: 'Live preview updates in real-time during code generation' },
                { type: 'improved', text: 'Friendly error messages with technical details toggle' },
                { type: 'improved', text: 'Stronger file modification prompts — AI writes complete files' },
                { type: 'fixed', text: 'File cards stuck on "Creating..." after completion' },
                { type: 'fixed', text: 'Mobile tab switching causing page refresh' },
                { type: 'fixed', text: 'Typing indicator sometimes not showing' },
            ],
        },
        {
            version: 'v1.4.4',
            date: '2025-07-14',
            changes: [
                { type: 'new', text: 'Multi-provider support (OpenRouter, Gemini, OpenAI)' },
                { type: 'new', text: 'Prompt enhancer with custom model/prompt' },
                { type: 'new', text: 'Planner mode with Flash & Pro speeds' },
                { type: 'new', text: 'Team mode with Designer, PM, Developer agents' },
                { type: 'new', text: 'Sandbox with side-by-side model comparison' },
                { type: 'new', text: 'Layout system (Default, VSCode, Cursor)' },
                { type: 'improved', text: 'Mobile-first responsive design' },
                { type: 'improved', text: 'Stream response handling' },
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

        const models = API.getModelsForCurrentProvider();
        const settings = Storage.getSettings();

        // Mevcut seçenekleri temizle (ilk option hariç)
        while (select.options.length > 1) select.remove(1);

        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            select.appendChild(opt);
        });

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
        };

        Storage.saveSettings(settings);
        ThemeManager.apply(settings.theme);
        LayoutManager.apply(settings.layout);

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
        LayoutManager.apply('default');
        Utils.toast('Settings reset to default', 'info');
    },
};
