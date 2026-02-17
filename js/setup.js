/* ══════════════════════════════════════════════════════════
   AetherIDE — Setup Wizard
   3-step onboarding for first-time users
   ══════════════════════════════════════════════════════════ */

const SetupWizard = {

    currentStep: 1,
    totalSteps: 3,

    shouldShow() {
        return !Storage.get('setup_completed', false);
    },

    show() {
        if (!this.shouldShow()) return;

        const overlay = document.createElement('div');
        overlay.id = 'setup-overlay';
        overlay.className = 'setup-overlay';
        overlay.innerHTML = `
            <div class="setup-card">
                <div class="setup-progress">
                    <div class="setup-progress-step active" data-step="1"></div>
                    <div class="setup-progress-step" data-step="2"></div>
                    <div class="setup-progress-step" data-step="3"></div>
                </div>

                <div class="setup-content">
                    <!-- Step 1: Welcome & Modes -->
                    <div class="setup-step active" data-step="1">
                        <div class="setup-icon purple">
                            <i data-lucide="zap"></i>
                        </div>
                        <div class="setup-title">Welcome to AetherIDE</div>
                        <div class="setup-desc">
                            Your AI-powered code editor. Build entire projects by just describing what you want.
                        </div>
                        <div class="setup-features">
                            <div class="setup-feature">
                                <i data-lucide="zap"></i>
                                <div class="setup-feature-text">
                                    <strong>Direct Mode</strong> — Instant code generation. Describe it, get it.
                                </div>
                            </div>
                            <div class="setup-feature">
                                <i data-lucide="clipboard-list"></i>
                                <div class="setup-feature-text">
                                    <strong>Planner Mode</strong> — AI creates a plan first. Review & approve before coding.
                                </div>
                            </div>
                            <div class="setup-feature">
                                <i data-lucide="users"></i>
                                <div class="setup-feature-text">
                                    <strong>Team Mode</strong> — 3 AI agents (Designer, PM, Developer) collaborate on your project.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Customization -->
                    <div class="setup-step" data-step="2">
                        <div class="setup-icon cyan">
                            <i data-lucide="layout"></i>
                        </div>
                        <div class="setup-title">Make It Yours</div>
                        <div class="setup-desc">
                            Customize your workspace to match your workflow. Everything can be changed later in Settings.
                        </div>
                        <div class="setup-features">
                            <div class="setup-feature">
                                <i data-lucide="layout"></i>
                                <div class="setup-feature-text">
                                    <strong>Layouts</strong> — Choose between Default, VSCode, or Cursor-style layouts from Settings.
                                </div>
                            </div>
                            <div class="setup-feature">
                                <i data-lucide="palette"></i>
                                <div class="setup-feature-text">
                                    <strong>Themes</strong> — Switch between Dark, Aether, and Midnight themes.
                                </div>
                            </div>
                            <div class="setup-feature">
                                <i data-lucide="key"></i>
                                <div class="setup-feature-text">
                                    <strong>API Key</strong> — Bring your own key from OpenRouter, Google Gemini, or OpenAI. It never leaves your browser.
                                </div>
                            </div>
                            <div class="setup-feature">
                                <i data-lucide="sparkles"></i>
                                <div class="setup-feature-text">
                                    <strong>Prompt Enhancer</strong> — AI improves your prompts automatically for better results.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Name & Privacy -->
                    <div class="setup-step" data-step="3">
                        <div class="setup-icon green">
                            <i data-lucide="user-circle"></i>
                        </div>
                        <div class="setup-title">Almost There!</div>
                        <div class="setup-desc">
                            Tell us what to call you, and review our privacy commitment.
                        </div>

                        <div class="setup-name-group">
                            <label class="setup-name-label">What should we call you?</label>
                            <input type="text" class="setup-name-input" id="setup-name-input" placeholder="Enter your name..." maxlength="30" autocomplete="off" spellcheck="false">
                            <div class="setup-name-preview" id="setup-name-preview" style="display:none;">
                                Messages will show as: <span id="setup-name-display">You</span>
                            </div>
                        </div>

                        <div class="setup-privacy">
                            <h4>Privacy Policy & Terms</h4>
                            <p>
                                <strong>Your data stays with you.</strong> AetherIDE is a 100% client-side application. We do not operate any backend servers or databases.
                            </p>
                            <p style="margin-top:6px;">
                                • <strong>API Keys:</strong> Stored exclusively in your browser's localStorage. They are sent directly to your chosen AI provider (OpenRouter, Google, or OpenAI) and never pass through our systems.<br>
                                • <strong>Chat History:</strong> All conversations, code, and settings are stored locally in your browser. Nothing is transmitted to us.<br>
                                • <strong>No Tracking:</strong> We do not use analytics, cookies, or any form of user tracking.<br>
                                • <strong>No Accounts:</strong> No sign-up, no login, no personal data collection.<br>
                                • <strong>Open & Transparent:</strong> All code runs in your browser and can be inspected at any time.
                            </p>
                            <p style="margin-top:6px;">
                                By using AetherIDE, you acknowledge that your API usage is subject to the terms of your chosen AI provider. We are not responsible for API costs or provider policies.
                            </p>
                        </div>

                        <div class="setup-privacy-check">
                            <input type="checkbox" id="setup-privacy-agree">
                            <label for="setup-privacy-agree">I have read and agree to the Privacy Policy & Terms</label>
                        </div>
                    </div>
                </div>

                <div class="setup-footer">
                    <button class="setup-skip" id="setup-skip-btn">Skip</button>
                    <div class="setup-footer-right">
                        <button class="setup-back" id="setup-back-btn" style="display:none;">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <button class="setup-next" id="setup-next-btn">
                            Next
                            <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) lucide.createIcons({ nodes: [overlay] });

        this.bindSetupEvents();
    },

    bindSetupEvents() {
        document.getElementById('setup-next-btn')?.addEventListener('click', () => this.next());
        document.getElementById('setup-back-btn')?.addEventListener('click', () => this.back());
        document.getElementById('setup-skip-btn')?.addEventListener('click', () => this.complete());

        const nameInput = document.getElementById('setup-name-input');
        nameInput?.addEventListener('input', () => {
            const preview = document.getElementById('setup-name-preview');
            const display = document.getElementById('setup-name-display');
            if (nameInput.value.trim()) {
                preview.style.display = 'flex';
                display.textContent = nameInput.value.trim();
            } else {
                preview.style.display = 'none';
            }
        });

        const agreeCheckbox = document.getElementById('setup-privacy-agree');
        agreeCheckbox?.addEventListener('change', () => {
            this.updateNextButton();
        });
    },

    next() {
        if (this.currentStep === this.totalSteps) {
            this.complete();
            return;
        }

        // Step 3 validasyonu
        if (this.currentStep === 2) {
            // Step 3'e geçerken bir şey kontrol etmeye gerek yok
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
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
        });

        // Progress
        document.querySelectorAll('.setup-progress-step').forEach(bar => {
            const stepNum = parseInt(bar.dataset.step);
            bar.classList.remove('active', 'done');
            if (stepNum === this.currentStep) bar.classList.add('active');
            else if (stepNum < this.currentStep) bar.classList.add('done');
        });

        // Back button
        const backBtn = document.getElementById('setup-back-btn');
        if (backBtn) backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';

        // Next button text
        this.updateNextButton();

        // Re-init icons for new step
        const overlay = document.getElementById('setup-overlay');
        if (overlay && window.lucide) lucide.createIcons({ nodes: [overlay] });
    },

    updateNextButton() {
        const nextBtn = document.getElementById('setup-next-btn');
        if (!nextBtn) return;

        if (this.currentStep === this.totalSteps) {
            const agreed = document.getElementById('setup-privacy-agree')?.checked;
            nextBtn.innerHTML = `Get Started <i data-lucide="check"></i>`;
            nextBtn.disabled = !agreed;
        } else {
            nextBtn.innerHTML = `Next <i data-lucide="arrow-right"></i>`;
            nextBtn.disabled = false;
        }

        if (window.lucide) lucide.createIcons({ nodes: [nextBtn] });
    },

    complete() {
        // Save name
        const nameInput = document.getElementById('setup-name-input');
        const userName = nameInput?.value?.trim() || '';
        if (userName) {
            Storage.set('user_display_name', userName);
        }

        // Mark as completed
        Storage.set('setup_completed', true);

        // Remove overlay
        const overlay = document.getElementById('setup-overlay');
        if (overlay) {
            overlay.style.animation = 'setupFadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        }

        // Apply name if set
        if (userName) {
            Utils.toast(`Welcome, ${userName}! 👋`, 'success', 3000);
        } else {
            Utils.toast('Welcome to AetherIDE! ⚡', 'success', 2000);
        }
    },
};

// Fade out animation
const setupFadeOutStyle = document.createElement('style');
setupFadeOutStyle.textContent = `
    @keyframes setupFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(setupFadeOutStyle);