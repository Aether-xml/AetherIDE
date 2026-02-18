/* ══════════════════════════════════════════════════════════
   AetherIDE — Setup Wizard v2 (Premium)
   ══════════════════════════════════════════════════════════ */

const SetupWizard = {

    currentStep: 1,
    totalSteps: 3,
    selectedLayout: 'default',
    selectedTheme: 'dark',
    selectedProvider: 'openrouter',
    selectedAvatarColor: 'purple',

    shouldShow() {
        return !Storage.get('setup_completed', false);
    },

    show() {
        if (!this.shouldShow()) return;

        const overlay = document.createElement('div');
        overlay.id = 'setup-overlay';
        overlay.className = 'setup-overlay';
        overlay.innerHTML = this.buildHTML();

        document.body.appendChild(overlay);
        if (window.lucide) lucide.createIcons({ nodes: [overlay] });
        this.bindEvents();
    },

    buildHTML() {
        return `
        <div class="setup-card">
            <div class="setup-progress">
                <div class="setup-progress-step active" data-step="1"></div>
                <div class="setup-progress-step" data-step="2"></div>
                <div class="setup-progress-step" data-step="3"></div>
            </div>
            <div class="setup-step-label">
                <span class="active" data-step="1">Welcome</span>
                <span data-step="2">Customize</span>
                <span data-step="3">You</span>
            </div>

            <div class="setup-content">

                <!-- ═══ STEP 1: Welcome ═══ -->
                <div class="setup-step active" data-step="1">
                    <div class="setup-welcome-logo">
                        <div class="setup-logo-wrap">
                            <div class="setup-logo-glow"></div>
                            <img src="assets/icons/icon-512.png" alt="AetherIDE" class="setup-logo-img">
                        </div>
                        <div class="setup-welcome-title">Welcome to AetherIDE</div>
                        <div class="setup-welcome-sub">Code at the speed of thought</div>
                    </div>

                    <div class="setup-modes">
                        <div class="setup-mode-card">
                            <div class="setup-mode-icon mode-direct"><i data-lucide="zap"></i></div>
                            <div class="setup-mode-info">
                                <div class="setup-mode-name">Direct Mode</div>
                                <div class="setup-mode-desc">Instant code generation. Describe what you want and get production-ready code immediately.</div>
                            </div>
                        </div>
                        <div class="setup-mode-card">
                            <div class="setup-mode-icon mode-planner"><i data-lucide="clipboard-list"></i></div>
                            <div class="setup-mode-info">
                                <div class="setup-mode-name">Planner Mode</div>
                                <div class="setup-mode-desc">AI analyzes and creates a plan first. Review, modify, or approve before any code is written.</div>
                            </div>
                        </div>
                        <div class="setup-mode-card">
                            <div class="setup-mode-icon mode-team"><i data-lucide="users"></i></div>
                            <div class="setup-mode-info">
                                <div class="setup-mode-name">Team Mode <span class="beta-badge">BETA</span></div>
                                <div class="setup-mode-desc">3 AI agents — Designer, PM, Developer — discuss and collaboratively build your project.</div>
                            </div>
                        </div>
                    </div>

                    <div class="setup-diff">
                        <i data-lucide="shield-check"></i>
                        <div class="setup-diff-text">
                            <strong>100% client-side.</strong> Your API keys and data never leave your browser.
                        </div>
                    </div>
                </div>

                <!-- ═══ STEP 2: Customize ═══ -->
                <div class="setup-step" data-step="2">
                    <div class="setup-header">
                        <div class="setup-icon cyan"><i data-lucide="settings"></i></div>
                        <div class="setup-header-text">
                            <div class="setup-title">Customize Your Workspace</div>
                            <div class="setup-subtitle">All settings can be changed later anytime.</div>
                        </div>
                    </div>

                    <div class="setup-section">
                        <div class="setup-section-title">Layout</div>
                        <div class="setup-layouts">
                            <button class="setup-layout-btn active" data-layout="default">
                                <div class="setup-layout-preview">
                                    <div class="slp-sidebar"></div>
                                    <div class="slp-chat"></div>
                                    <div class="slp-code"></div>
                                </div>
                                <span class="setup-layout-name">Default</span>
                            </button>
                            <button class="setup-layout-btn" data-layout="vscode">
                                <div class="setup-layout-preview">
                                    <div class="slp-sidebar"></div>
                                    <div class="slp-code"></div>
                                    <div class="slp-chat"></div>
                                </div>
                                <span class="setup-layout-name">VSCode</span>
                            </button>
                            <button class="setup-layout-btn" data-layout="cursor">
                                <div class="setup-layout-preview">
                                    <div class="slp-activity"></div>
                                    <div class="slp-sidebar-sm"></div>
                                    <div class="slp-code"></div>
                                    <div class="slp-chat"></div>
                                </div>
                                <span class="setup-layout-name">Cursor</span>
                            </button>
                        </div>
                    </div>

                    <div class="setup-section">
                        <div class="setup-section-title">Theme</div>
                        <div class="setup-themes">
                            <button class="setup-theme-btn active" data-theme="dark">
                                <i data-lucide="moon"></i>
                                <span class="setup-theme-name">Dark</span>
                            </button>
                            <button class="setup-theme-btn" data-theme="aether">
                                <i data-lucide="zap"></i>
                                <span class="setup-theme-name">Aether</span>
                            </button>
                            <button class="setup-theme-btn" data-theme="midnight">
                                <i data-lucide="stars"></i>
                                <span class="setup-theme-name">Midnight</span>
                            </button>
                            <button class="setup-theme-btn" data-theme="nord">
                                <i data-lucide="snowflake"></i>
                                <span class="setup-theme-name">Nord</span>
                            </button>
                            <button class="setup-theme-btn" data-theme="sunset">
                                <i data-lucide="sunset"></i>
                                <span class="setup-theme-name">Sunset</span>
                            </button>
                            <button class="setup-theme-btn" data-theme="ocean">
                                <i data-lucide="waves"></i>
                                <span class="setup-theme-name">Ocean</span>
                            </button>
                        </div>
                    </div>

                    <div class="setup-section">
                        <div class="setup-section-title">API Provider</div>
                        <div class="setup-providers">
                            <button class="setup-provider-btn active" data-provider="openrouter">
                                <i data-lucide="cloud"></i>
                                <div>
                                    <div class="setup-provider-name">OpenRouter</div>
                                    <div class="setup-provider-hint">200+ models</div>
                                </div>
                            </button>
                            <button class="setup-provider-btn" data-provider="gemini">
                                <i data-lucide="sparkles"></i>
                                <div>
                                    <div class="setup-provider-name">Gemini</div>
                                    <div class="setup-provider-hint">Google AI</div>
                                </div>
                            </button>
                            <button class="setup-provider-btn" data-provider="openai">
                                <i data-lucide="brain"></i>
                                <div>
                                    <div class="setup-provider-name">OpenAI</div>
                                    <div class="setup-provider-hint">GPT models</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div class="setup-section">
                        <div class="setup-section-title">API Key <span style="font-weight:400;color:var(--text-disabled);text-transform:none;letter-spacing:0;">(optional, can add later)</span></div>
                        <div class="setup-api-group">
                            <input type="password" class="setup-api-input" id="setup-api-key" placeholder="sk-or-v1-..." autocomplete="off">
                        </div>
                        <div class="setup-api-hint">
                            <i data-lucide="lock"></i>
                            Stored locally, never sent to our servers.
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" id="setup-api-docs-link">Get key →</a>
                        </div>
                    </div>

                    <div class="setup-pills">
                        <div class="setup-pill"><i data-lucide="sparkles"></i> Prompt Enhancer</div>
                        <div class="setup-pill"><i data-lucide="eye"></i> Live Preview</div>
                        <div class="setup-pill"><i data-lucide="terminal"></i> Console</div>
                        <div class="setup-pill"><i data-lucide="download"></i> Export Files</div>
                        <div class="setup-pill"><i data-lucide="message-circle"></i> Sandbox</div>
                    </div>
                </div>

                <!-- ═══ STEP 3: Personalization ═══ -->
                <div class="setup-step" data-step="3">
                    <div class="setup-header">
                        <div class="setup-icon green"><i data-lucide="user-circle"></i></div>
                        <div class="setup-header-text">
                            <div class="setup-title">Almost There!</div>
                            <div class="setup-subtitle">Personalize your experience.</div>
                        </div>
                    </div>

                    <div class="setup-name-section">
                        <label class="setup-name-label">
                            <i data-lucide="at-sign"></i>
                            What should we call you?
                        </label>
                        <input type="text" class="setup-name-input" id="setup-name-input" placeholder="Enter your name..." maxlength="30" autocomplete="off" spellcheck="false">
                    </div>

                    <div class="setup-avatar-section">
                        <div class="setup-avatar-label">Avatar color</div>
                        <div class="setup-avatar-colors">
                            <div class="setup-avatar-color active" data-color="purple"></div>
                            <div class="setup-avatar-color" data-color="cyan"></div>
                            <div class="setup-avatar-color" data-color="green"></div>
                            <div class="setup-avatar-color" data-color="pink"></div>
                            <div class="setup-avatar-color" data-color="orange"></div>
                            <div class="setup-avatar-color" data-color="red"></div>
                        </div>
                    </div>

                    <div class="setup-live-preview">
                        <div class="setup-preview-label">Preview</div>
                        <div class="setup-preview-msg">
                            <div class="setup-preview-avatar" id="setup-preview-avatar" style="background:rgba(108,99,255,0.12);color:#6C63FF;">
                                <i data-lucide="user"></i>
                            </div>
                            <div class="setup-preview-bubble">
                                <div class="setup-preview-name" id="setup-preview-name" style="color:#6C63FF;">You</div>
                                <div class="setup-preview-text">Build me a responsive landing page</div>
                            </div>
                        </div>
                    </div>

                    <div class="setup-privacy-section">
                        <div class="setup-privacy-title">
                            <i data-lucide="shield-check"></i>
                            Privacy Policy & Terms
                        </div>
                        <div class="setup-privacy-box">
                            <details class="setup-privacy-item">
                                <summary>API Keys & Data Storage</summary>
                                <p>All API keys are stored exclusively in your browser's localStorage. They are sent directly to your chosen AI provider (OpenRouter, Google, or OpenAI) and never pass through our systems.</p>
                            </details>
                            <details class="setup-privacy-item">
                                <summary>Chat History & Code</summary>
                                <p>All conversations, generated code, files, and settings are stored locally in your browser. Nothing is transmitted to any server we operate.</p>
                            </details>
                            <details class="setup-privacy-item">
                                <summary>No Tracking & No Accounts</summary>
                                <p>We do not use analytics, cookies, or any form of user tracking. No sign-up, no login, no personal data collection required.</p>
                            </details>
                            <details class="setup-privacy-item">
                                <summary>Third-Party API Usage</summary>
                                <p>By using AetherIDE, you acknowledge that your API usage is subject to the terms and pricing of your chosen AI provider. We are not responsible for API costs or provider policies.</p>
                            </details>
                            <details class="setup-privacy-item">
                                <summary>Open & Transparent</summary>
                                <p>AetherIDE is a static web application. All code runs in your browser and can be inspected, audited, and verified at any time.</p>
                            </details>
                        </div>

                        <div class="setup-agree-row" id="setup-agree-row">
                            <input type="checkbox" id="setup-privacy-agree">
                            <label for="setup-privacy-agree">I have read and agree to the Privacy Policy & Terms</label>
                        </div>
                    </div>
                </div>

            </div>

            <div class="setup-footer">
                <button class="setup-skip" id="setup-skip-btn">Skip</button>
                <div class="setup-footer-right">
                    <button class="setup-back" id="setup-back-btn" style="display:none;">
                        <i data-lucide="arrow-left"></i> Back
                    </button>
                    <button class="setup-next" id="setup-next-btn">
                        Next <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>`;
    },

    bindEvents() {
        document.getElementById('setup-next-btn')?.addEventListener('click', () => this.next());
        document.getElementById('setup-back-btn')?.addEventListener('click', () => this.back());
        document.getElementById('setup-skip-btn')?.addEventListener('click', () => this.complete(true));

        // Layout
        document.querySelectorAll('.setup-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setup-layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedLayout = btn.dataset.layout;
                LayoutManager.apply(this.selectedLayout);
            });
        });

        // Theme
        document.querySelectorAll('.setup-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setup-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTheme = btn.dataset.theme;
                ThemeManager.apply(this.selectedTheme);
            });
        });

        // Provider
        document.querySelectorAll('.setup-provider-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setup-provider-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedProvider = btn.dataset.provider;
                this.updateProviderUI();
            });
        });

        // Name input → live preview
        document.getElementById('setup-name-input')?.addEventListener('input', (e) => {
            this.updatePreview();
        });

        // Avatar colors
        document.querySelectorAll('.setup-avatar-color').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.setup-avatar-color').forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                this.selectedAvatarColor = el.dataset.color;
                this.updatePreview();
            });
        });

        // Privacy checkbox
        const agreeRow = document.getElementById('setup-agree-row');
        const agreeCheckbox = document.getElementById('setup-privacy-agree');

        agreeRow?.addEventListener('click', (e) => {
            if (e.target !== agreeCheckbox) {
                agreeCheckbox.checked = !agreeCheckbox.checked;
            }
            agreeRow.classList.toggle('checked', agreeCheckbox.checked);
            this.updateNextButton();
        });

        agreeCheckbox?.addEventListener('change', () => {
            agreeRow?.classList.toggle('checked', agreeCheckbox.checked);
            this.updateNextButton();
        });
    },

    updateProviderUI() {
        const input = document.getElementById('setup-api-key');
        const docsLink = document.getElementById('setup-api-docs-link');
        const config = API.PROVIDERS[this.selectedProvider];

        if (input && config) {
            input.placeholder = config.keyPlaceholder;
        }
        if (docsLink && config) {
            docsLink.href = config.docsUrl;
        }
    },

    updatePreview() {
        const nameInput = document.getElementById('setup-name-input');
        const previewName = document.getElementById('setup-preview-name');
        const previewAvatar = document.getElementById('setup-preview-avatar');

        const name = nameInput?.value?.trim() || 'You';

        const colorMap = {
            purple: { bg: 'rgba(108,99,255,0.12)', fg: '#6C63FF' },
            cyan: { bg: 'rgba(0,217,255,0.08)', fg: '#00D9FF' },
            green: { bg: 'rgba(0,230,118,0.08)', fg: '#00E676' },
            pink: { bg: 'rgba(224,64,251,0.08)', fg: '#E040FB' },
            orange: { bg: 'rgba(255,179,0,0.08)', fg: '#FFB300' },
            red: { bg: 'rgba(255,82,82,0.08)', fg: '#FF5252' },
        };

        const colors = colorMap[this.selectedAvatarColor] || colorMap.purple;

        if (previewName) {
            previewName.textContent = name;
            previewName.style.color = colors.fg;
        }

        if (previewAvatar) {
            previewAvatar.style.background = colors.bg;
            previewAvatar.style.color = colors.fg;
            previewAvatar.style.borderColor = colors.fg + '40';
        }
    },

    next() {
        if (this.currentStep === this.totalSteps) {
            this.complete(false);
            return;
        }
        this.currentStep++;
        this.updateUI();
    },

    back() {
        if (this.currentStep <= 1) return;
        this.currentStep--;
        this.updateUI();
    },

    updateUI() {
        // Steps
        document.querySelectorAll('.setup-step').forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === this.currentStep);
        });

        // Progress bars
        document.querySelectorAll('.setup-progress-step').forEach(bar => {
            const s = parseInt(bar.dataset.step);
            bar.classList.remove('active', 'done');
            if (s === this.currentStep) bar.classList.add('active');
            else if (s < this.currentStep) bar.classList.add('done');
        });

        // Step labels
        document.querySelectorAll('.setup-step-label span').forEach(label => {
            const s = parseInt(label.dataset.step);
            label.classList.remove('active', 'done');
            if (s === this.currentStep) label.classList.add('active');
            else if (s < this.currentStep) label.classList.add('done');
        });

        // Back button
        const backBtn = document.getElementById('setup-back-btn');
        if (backBtn) backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';

        // Next button
        this.updateNextButton();

        // Re-init icons
        const overlay = document.getElementById('setup-overlay');
        if (overlay && window.lucide) lucide.createIcons({ nodes: [overlay] });
    },

    updateNextButton() {
        const nextBtn = document.getElementById('setup-next-btn');
        if (!nextBtn) return;

        if (this.currentStep === this.totalSteps) {
            const agreed = document.getElementById('setup-privacy-agree')?.checked;
            nextBtn.innerHTML = `<i data-lucide="rocket"></i> Get Started`;
            nextBtn.disabled = !agreed;
            nextBtn.classList.toggle('finish', !!agreed);
        } else {
            nextBtn.innerHTML = `Next <i data-lucide="arrow-right"></i>`;
            nextBtn.disabled = false;
            nextBtn.classList.remove('finish');
        }

        if (window.lucide) lucide.createIcons({ nodes: [nextBtn] });
    },

    complete(skipped) {
        if (!skipped) {
            // Validate step 3
            const agreed = document.getElementById('setup-privacy-agree')?.checked;
            if (!agreed) {
                Utils.toast('Please agree to the Privacy Policy to continue', 'warning');
                return;
            }
        }

        // Save name
        const nameInput = document.getElementById('setup-name-input');
        const userName = nameInput?.value?.trim() || '';
        if (userName) {
            Storage.set('user_display_name', userName);
        }

        // Save avatar color
        Storage.set('user_avatar_color', this.selectedAvatarColor);

        // Save settings from step 2
        const apiKey = document.getElementById('setup-api-key')?.value?.trim() || '';
        const settings = Storage.getSettings();

        settings.layout = this.selectedLayout;
        settings.theme = this.selectedTheme;
        settings.apiProvider = this.selectedProvider;

        if (apiKey) {
            if (!settings.apiKeys) settings.apiKeys = {};
            settings.apiKeys[this.selectedProvider] = apiKey;
            settings.apiKey = apiKey;
        }

        Storage.saveSettings(settings);

        // Apply
        ThemeManager.apply(this.selectedTheme);
        LayoutManager.apply(this.selectedLayout);

        if (apiKey) {
            API.updateConnectionStatus('online');
            Settings.currentProvider = this.selectedProvider;
        }

        // Mark as completed
        Storage.set('setup_completed', true);

        // Confetti!
        if (!skipped) {
            this.showConfetti();
        }

        // Remove overlay
        const overlay = document.getElementById('setup-overlay');
        if (overlay) {
            overlay.style.animation = 'setupFadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 350);
        }

        // Toast
        if (!skipped && userName) {
            Utils.toast(`Welcome, ${userName}! 🚀`, 'success', 3000);
        } else if (!skipped) {
            Utils.toast('Welcome to AetherIDE! ⚡', 'success', 2500);
        }
    },

    showConfetti() {
        const container = document.createElement('div');
        container.className = 'setup-confetti';
        document.body.appendChild(container);

        const colors = ['#6C63FF', '#00D9FF', '#00E676', '#E040FB', '#FFB300', '#FF5252'];

        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.8 + 's';
            piece.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
            piece.style.width = (4 + Math.random() * 6) + 'px';
            piece.style.height = (4 + Math.random() * 6) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 3500);
    },
};
