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
            if (window.lucide) lucide.createIcons();
        }
    },

    close() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.style.display = 'none';
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

        // Model listesini güncelle
        App.populateModels();

        if (currentKey) this.checkApiKey(currentKey, this.currentProvider);

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
