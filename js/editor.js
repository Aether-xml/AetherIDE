/* ══════════════════════════════════════════════════════════
   AetherIDE — Code Editor v2 (Multi-File + Terminal + Console)
   ══════════════════════════════════════════════════════════ */

const Editor = {

    files: [],
    activeFileIndex: 0,
    previewVisible: false,
    consoleVisible: false,
    consoleLogs: [],

    // Güvenlik limitleri
    MAX_FILES: 50,
    MAX_FILE_SIZE: 512000,        // 500KB
    MAX_CONSOLE_RATE: 30,         // saniyede max log
    _consoleLogTimestamps: [],

    get currentFile() {
        return this.files[this.activeFileIndex] || null;
    },

    get currentCode() {
        return this.currentFile?.code || '';
    },

    get currentLanguage() {
        return this.currentFile?.language || 'plaintext';
    },

    init() {
        this.bindEvents();
        // Başlangıçta preview butonunu gizle (dosya yok)
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) previewBtn.style.display = 'none';
        const refreshBtn = document.getElementById('refresh-preview-btn');
        if (refreshBtn) refreshBtn.style.display = 'none';
    },

    bindEvents() {
        document.getElementById('copy-code-btn')?.addEventListener('click', () => {
            if (!this.currentCode) {
                Utils.toast('No code to copy', 'warning');
                return;
            }
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(this.currentCode).then(() => {
                    Utils.toast('Code copied!', 'success');
                }).catch(() => this.fallbackCopy(this.currentCode));
            } else {
                this.fallbackCopy(this.currentCode);
            }
        });

        document.getElementById('download-code-btn')?.addEventListener('click', () => {
            this.downloadCurrent();
        });

        document.getElementById('preview-btn')?.addEventListener('click', () => {
            this.togglePreview();
        });

        document.getElementById('refresh-preview-btn')?.addEventListener('click', () => {
            this.refreshPreview();
        });

        document.getElementById('console-btn')?.addEventListener('click', () => {
            this.toggleConsole();
        });

        document.getElementById('console-refresh-btn')?.addEventListener('click', () => {
            this.consoleRerun();
        });

        document.getElementById('console-clear-btn')?.addEventListener('click', () => {
            this.clearConsole();
        });

        document.getElementById('terminal-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                const command = input.value.trim();
                if (command) {
                    this.executeTerminalCommand(command);
                    input.value = '';
                }
            }
        });
    },

    _lastEditorUpdate: 0,
    _editorUpdatePending: null,
    _lastPreviewUpdate: 0,
    _previewUpdatePending: null,

    updateCode(aiResponse) {
        const blocks = Utils.extractCodeBlocks(aiResponse);
        if (blocks.length === 0) {
            console.log('[Editor] No code blocks extracted from response');
            return;
        }
        console.log('[Editor] Extracted blocks:', blocks.map(b => b.filename));

        let hasChanges = false;
        let changedFiles = [];

        let fileLimitWarned = false;

        for (const block of blocks) {
            if (!block.code || block.code.trim().length === 0) continue;

            // Dosya boyutu kontrolü (500KB)
            if (block.code.length > this.MAX_FILE_SIZE) {
                const originalKB = (block.code.length / 1024).toFixed(1);
                console.warn(`[AetherIDE] File "${block.filename}" truncated from ${originalKB}KB to 500KB`);
                block.code = block.code.substring(0, this.MAX_FILE_SIZE) +
                    `\n/* ⚠️ AetherIDE: Content truncated at 500KB (original: ${originalKB}KB) */`;
                Utils.toast(`⚠️ ${block.filename} truncated (${originalKB}KB exceeds 500KB limit)`, 'warning');
            }

            const normalizedName = block.filename.replace(/^\.\//, '').replace(/^\//, '');

            const existingIndex = this.files.findIndex(f => {
                const existingNorm = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                return existingNorm === normalizedName;
            });

            if (existingIndex >= 0) {
                const existingCode = this.files[existingIndex].code;
                if (existingCode !== block.code) {
                    this.files[existingIndex] = {
                        filename: normalizedName,
                        language: block.language || this.files[existingIndex].language,
                        code: block.code,
                    };
                    hasChanges = true;
                    changedFiles.push(normalizedName);
                }
            } else {
                // Maksimum dosya limiti kontrolü (50)
                if (this.files.length >= this.MAX_FILES) {
                    if (!fileLimitWarned) {
                        fileLimitWarned = true;
                        console.warn(`[AetherIDE] File limit reached (${this.MAX_FILES}). Extra files skipped.`);
                        Utils.toast(`⚠️ Maximum ${this.MAX_FILES} file limit reached. Extra files skipped.`, 'warning');
                    }
                    continue;
                }
                this.files.push({
                    filename: normalizedName,
                    language: block.language,
                    code: block.code,
                });
                hasChanges = true;
                changedFiles.push(normalizedName);
                this.activeFileIndex = this.files.length - 1;
            }
        }

        if (!hasChanges) return;

        if (this.activeFileIndex >= this.files.length) {
            this.activeFileIndex = this.files.length - 1;
        }
        if (this.activeFileIndex < 0) this.activeFileIndex = 0;

        // Editör UI — throttled (300ms)
        const now = Date.now();
        if (now - this._lastEditorUpdate < 300) {
            if (this._editorUpdatePending) cancelAnimationFrame(this._editorUpdatePending);
            this._editorUpdatePending = requestAnimationFrame(() => {
                this._renderEditorUI();
            });
        } else {
            this._lastEditorUpdate = now;
            this._renderEditorUI();
        }

        // Live preview — throttled (600ms), sadece ilgili dosyalar değiştiyse
        if (this.previewVisible) {
            const hasPreviewRelevant = changedFiles.some(f =>
                f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js')
            );
            if (hasPreviewRelevant) {
                this._schedulePreviewUpdate();
            }
        }
    },

    _schedulePreviewUpdate() {
        const now = Date.now();
        if (now - this._lastPreviewUpdate < 600) {
            if (this._previewUpdatePending) clearTimeout(this._previewUpdatePending);
            this._previewUpdatePending = setTimeout(() => {
                this._lastPreviewUpdate = Date.now();
                this._liveUpdatePreview();
            }, 600);
        } else {
            this._lastPreviewUpdate = now;
            this._liveUpdatePreview();
        }
    },

    _liveUpdatePreview() {
        if (!this.previewVisible) return;
        const iframe = document.getElementById('preview-iframe');
        if (!iframe) return;

        const htmlFile = this.files.find(f =>
            f.language === 'html' || f.filename.endsWith('.html')
        );
        if (!htmlFile) return;

        // Aynı togglePreview mantığını kullan ama sessizce
        this._renderPreviewContent(iframe);
    },

    _renderEditorUI() {
        this.renderTabs();
        this.renderCode();
        this.updateStatusBar();
        this.updatePreviewButton();

        // File tree açıksa güncelle
        if (FileTree.visible) {
            FileTree.render();
        }

        // File tree header count güncelle
        const countEl = document.getElementById('filetree-count');
        if (countEl) {
            countEl.textContent = this.files.length > 0 ? `${this.files.length} file${this.files.length > 1 ? 's' : ''}` : '';
        }

        const tabCode = document.getElementById('tab-code');
        if (tabCode && this.files.length > 0) {
            let badge = tabCode.querySelector('.file-count-badge');
            if (badge) {
                badge.textContent = this.files.length;
            } else {
                const b = document.createElement('span');
                b.className = 'file-count-badge';
                b.textContent = this.files.length;
                tabCode.appendChild(b);
            }
        }
    },

    updatePreviewButton() {
        const previewBtn = document.getElementById('preview-btn');
        if (!previewBtn) return;

        const hasHtml = this.files.some(f =>
            f.language === 'html' || f.filename.endsWith('.html')
        );

        previewBtn.style.display = hasHtml ? 'inline-flex' : 'none';

        // HTML dosyası yoksa preview'i kapat
        if (!hasHtml && this.previewVisible) {
            const previewContainer = document.getElementById('preview-container');
            const editorWrapper = document.getElementById('code-editor-wrapper');
            if (previewContainer) previewContainer.style.display = 'none';
            if (editorWrapper) editorWrapper.style.display = 'block';
            this.previewVisible = false;
            const refreshBtn = document.getElementById('refresh-preview-btn');
            if (refreshBtn) refreshBtn.style.display = 'none';
        }
    },

    renderTabs() {
        const tabsEl = document.getElementById('code-tabs');
        if (!tabsEl) return;

        if (this.files.length === 0) {
            tabsEl.innerHTML = `
                <button class="code-tab active" data-tab="output">
                    <i data-lucide="file-code" class="tab-lucide-icon"></i>
                    <span>Output</span>
                </button>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [tabsEl] });
            return;
        }

        const langIcons = {
            html: 'globe', css: 'palette',
            javascript: 'file-code', js: 'file-code',
            typescript: 'file-code', ts: 'file-code',
            python: 'terminal', py: 'terminal',
            json: 'braces', java: 'coffee',
            cpp: 'cpu', c: 'cpu',
            rust: 'settings', go: 'arrow-right-circle',
            ruby: 'diamond', php: 'server',
            swift: 'smartphone', kotlin: 'smartphone',
            sql: 'database', bash: 'terminal', sh: 'terminal',
            md: 'file-text', markdown: 'file-text',
            xml: 'file-code', svg: 'image',
            yaml: 'file-text', yml: 'file-text',
        };

        let html = '';
        this.files.forEach((file, index) => {
            const isActive = index === this.activeFileIndex;
            const icon = langIcons[file.language] || 'file';
            // Klasör yolundan sadece dosya adını göster, tooltip'te tam yol
            const displayName = file.filename.includes('/') ? file.filename.split('/').pop() : file.filename;
            const folderPrefix = file.filename.includes('/') ? file.filename.substring(0, file.filename.lastIndexOf('/') + 1) : '';
            html += `
                <button class="code-tab ${isActive ? 'active' : ''}"
                        onclick="Editor.switchTab(${index})"
                        title="${Utils.escapeHtml(file.filename)}">
                    <i data-lucide="${icon}" class="tab-lucide-icon"></i>
                    ${folderPrefix ? `<span class="tab-folder-prefix">${Utils.escapeHtml(folderPrefix)}</span>` : ''}
                    <span>${Utils.escapeHtml(displayName)}</span>
                </button>
            `;
        });

        tabsEl.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [tabsEl] });

        requestAnimationFrame(() => {
            const activeTab = tabsEl.querySelector('.code-tab.active');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        });
    },

    switchTab(index) {
        if (index < 0 || index >= this.files.length) return;
        this.activeFileIndex = index;
        this.renderTabs();
        this.renderCode();
        this.updateStatusBar();

        // File tree highlight güncelle
        if (FileTree.visible) {
            FileTree._highlightActive();
        }

        // Preview açıksa kapat
        if (this.previewVisible) {
            const previewContainer = document.getElementById('preview-container');
            const editorWrapper = document.getElementById('code-editor-wrapper');
            if (previewContainer) previewContainer.style.display = 'none';
            if (editorWrapper) editorWrapper.style.display = 'block';
            this.previewVisible = false;

            const refreshBtn = document.getElementById('refresh-preview-btn');
            if (refreshBtn) refreshBtn.style.display = 'none';
        }
    },

    renderCode() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        if (!this.currentCode) {
            editor.innerHTML = `
                <div class="empty-editor">
                    <i data-lucide="code-2" class="empty-editor-icon"></i>
                    <p class="empty-editor-text">Code will appear here</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [editor] });
            return;
        }

        // Font size uygula
        const settings = Storage.getSettings();
        const fontSize = settings.fontSize || 14;

        const highlighted = SyntaxHighlighter.highlight(this.currentCode, this.currentLanguage);
        const highlightedLines = highlighted.split('\n');

        let html = `<div class="code-display" style="font-size: ${fontSize}px;">`;
        highlightedLines.forEach((line, i) => {
            html += `<div class="line">
                <span class="line-number">${i + 1}</span>
                <span class="line-content">${line || ' '}</span>
            </div>`;
        });
        html += '</div>';
        editor.innerHTML = html;
    },

    // ── Console ──
    toggleConsole() {
        this.consoleVisible = !this.consoleVisible;
        const consolePanel = document.getElementById('console-panel');
        if (consolePanel) {
            consolePanel.style.display = this.consoleVisible ? 'flex' : 'none';
        }

        // Console açıldığında en alta scroll
        if (this.consoleVisible) {
            this.renderConsole();
        }
    },

    clearConsole() {
        this.consoleLogs = [];
        this._consoleLogTimestamps = [];
        Storage.clearConsoleLogs();
        const output = document.getElementById('console-output');
        if (output) output.innerHTML = '<div class="console-empty">Console cleared</div>';

        // Auto-fix banner'ı kaldır
        const banner = document.getElementById('auto-fix-banner');
        if (banner) banner.remove();

        if (this._autoFixTimeout) {
            clearTimeout(this._autoFixTimeout);
            this._autoFixTimeout = null;
        }
    },

    consoleRerun() {
        this.clearConsole();
        if (this.previewVisible) {
            this.refreshPreview();
            this.addConsoleLog('info', 'Preview re-executed', 'system');
        } else {
            // Preview kapalıysa aç ve çalıştır
            this.togglePreview();
            this.addConsoleLog('info', 'Preview started', 'system');
        }
    },

    addConsoleLog(type, message, source = '') {
        // Rate limiting: saniyede max 30 log
        const now = Date.now();
        this._consoleLogTimestamps = this._consoleLogTimestamps.filter(t => now - t < 1000);
        if (this._consoleLogTimestamps.length >= this.MAX_CONSOLE_RATE) {
            if (this._consoleLogTimestamps.length === this.MAX_CONSOLE_RATE) {
                this.consoleLogs.push({
                    type: 'warn',
                    message: '[AetherIDE] Console output rate limited (30 logs/sec). Some logs may be dropped.',
                    source: 'system',
                    timestamp: new Date().toISOString(),
                });
                if (this.consoleVisible) this.renderConsole();
            }
            return;
        }
        this._consoleLogTimestamps.push(now);

        const entry = {
            type,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
            source,
            timestamp: new Date().toISOString(),
        };

        // Duplicate kontrolü — aynı hata mesajı 1sn içinde tekrar gelmesin
        if (type === 'error' || type === 'warn') {
            const isDupe = this.consoleLogs.some(l =>
                l.type === type &&
                l.message === entry.message &&
                (new Date(entry.timestamp) - new Date(l.timestamp)) < 1000
            );
            if (isDupe) return;
        }

        this.consoleLogs.push(entry);

        if (this.consoleLogs.length > 200) {
            this.consoleLogs = this.consoleLogs.slice(-200);
        }

        // Sadece console görünürse render et
        if (this.consoleVisible) {
            this.renderConsole();
        }

        // Hata geldiğinde auto-fix butonu göster
        if (type === 'error' && this.files.length > 0) {
            this._showAutoFixHint();
        }
    },

    _autoFixTimeout: null,

    _showAutoFixHint() {
        // Zaten generating ise gösterme
        if (Chat.isGenerating) return;

        // Debounce — birden fazla hata gelirse tek sefer göster
        if (this._autoFixTimeout) clearTimeout(this._autoFixTimeout);
        this._autoFixTimeout = setTimeout(() => {
            const errorCount = this.consoleLogs.filter(l => l.type === 'error').length;
            if (errorCount > 0) {
                this._renderAutoFixButton(errorCount);
            }
        }, 1500);
    },

    _renderAutoFixButton(errorCount) {
        // Mevcut butonu kaldır
        const existing = document.getElementById('auto-fix-banner');
        if (existing) existing.remove();

        const container = document.getElementById('input-area');
        if (!container) return;

        const banner = document.createElement('div');
        banner.id = 'auto-fix-banner';
        banner.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            margin-bottom: 6px;
            background: rgba(255, 82, 82, 0.08);
            border: 1px solid rgba(255, 82, 82, 0.2);
            border-radius: 10px;
            font-size: 0.78rem;
            color: var(--accent-error);
            animation: msgIn 0.25s ease;
        `;

        banner.innerHTML = `
            <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
            <span style="flex:1;color:var(--text-secondary);">
                ${errorCount} console error${errorCount > 1 ? 's' : ''} detected
            </span>
            <button id="auto-fix-btn" style="
                padding: 5px 14px;
                background: rgba(255, 82, 82, 0.12);
                border: 1px solid rgba(255, 82, 82, 0.25);
                border-radius: 6px;
                color: var(--accent-error);
                font-size: 0.72rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
            ">
                <i data-lucide="wrench" style="width:12px;height:12px;"></i>
                Auto Fix
            </button>
            <button id="auto-fix-dismiss" style="
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                color: var(--text-tertiary);
                cursor: pointer;
                flex-shrink: 0;
                background: none;
                border: none;
            ">
                <i data-lucide="x" style="width:12px;height:12px;"></i>
            </button>
        `;

        container.insertBefore(banner, container.firstChild);
        if (window.lucide) lucide.createIcons({ nodes: [banner] });

        // Auto Fix tıklama
        document.getElementById('auto-fix-btn')?.addEventListener('click', () => {
            banner.remove();
            this._triggerAutoFix();
        });

        // Dismiss
        document.getElementById('auto-fix-dismiss')?.addEventListener('click', () => {
            banner.remove();
        });
    },

    _triggerAutoFix() {
        const errors = this.consoleLogs.filter(l => l.type === 'error');
        if (errors.length === 0) return;

        const errorSummary = errors
            .slice(-5)
            .map(e => `• ${e.message}`)
            .join('\n');

        const fixPrompt = `Fix the following console errors in my code:\n\n${errorSummary}\n\nAnalyze the errors, find the root cause, and fix all of them. Output the complete fixed file(s).`;

        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        if (input) {
            input.value = fixPrompt;
            Utils.autoResize(input);
            if (sendBtn) sendBtn.disabled = false;

            // Otomatik gönder
            setTimeout(() => Chat.sendMessage(), 100);
        }
    },

    renderConsole() {
        const output = document.getElementById('console-output');
        if (!output) return;

        if (this.consoleLogs.length === 0) {
            output.innerHTML = '<div class="console-empty">No console output</div>';
            return;
        }

        let html = '';
        for (const log of this.consoleLogs) {
            const typeClass = `console-${log.type}`;
            const time = Utils.formatTime(log.timestamp);
            html += `<div class="console-entry ${typeClass}">
                <span class="console-time">${time}</span>
                <span class="console-type">[${log.type.toUpperCase()}]</span>
                <span class="console-msg">${Utils.escapeHtml(log.message)}</span>
                ${log.source ? `<span class="console-source">${Utils.escapeHtml(log.source)}</span>` : ''}
            </div>`;
        }

        output.innerHTML = html;
        output.scrollTop = output.scrollHeight;
    },

    getConsoleContext() {
        if (this.consoleLogs.length === 0) return '';

        const errors = this.consoleLogs.filter(l => l.type === 'error');
        const warnings = this.consoleLogs.filter(l => l.type === 'warn');
        const recent = this.consoleLogs.slice(-30);

        let context = '\n\n--- CONSOLE OUTPUT (Auto-captured from Live Preview) ---\n';
        context += `Summary: ${errors.length} error(s), ${warnings.length} warning(s), ${this.consoleLogs.length} total log(s)\n\n`;

        // Hataları önce ve ayrı göster
        if (errors.length > 0) {
            context += '🔴 ERRORS:\n';
            for (const err of errors) {
                context += `  [ERROR] ${err.message}`;
                if (err.source) context += ` (source: ${err.source})`;
                context += '\n';

                // Hatanın ilgili olduğu dosyayı bulmaya çalış
                const relatedFile = this._findRelatedFile(err.message);
                if (relatedFile) {
                    context += `  → Likely related to: ${relatedFile}\n`;
                }
            }
            context += '\n';
        }

        // Uyarıları göster
        if (warnings.length > 0) {
            context += '🟡 WARNINGS:\n';
            for (const warn of warnings.slice(-5)) {
                context += `  [WARN] ${warn.message}\n`;
            }
            context += '\n';
        }

        // Son logları göster (hata ve uyarı hariç, tekrarları kaldır)
        const infoLogs = recent.filter(l => l.type !== 'error' && l.type !== 'warn');
        if (infoLogs.length > 0) {
            context += 'RECENT LOGS:\n';
            const seen = new Set();
            for (const log of infoLogs.slice(-10)) {
                const key = `${log.type}:${log.message}`;
                if (seen.has(key)) continue;
                seen.add(key);
                context += `  [${log.type.toUpperCase()}] ${log.message}\n`;
            }
            context += '\n';
        }

        context += '--- END CONSOLE ---\n';
        context += '\nIMPORTANT: When fixing errors, analyze the error message carefully, find the root cause in the relevant file, and output the COMPLETE fixed file.\n';

        return context;
    },

    _findRelatedFile(errorMessage) {
        if (!errorMessage || this.files.length === 0) return null;

        const msg = errorMessage.toLowerCase();

        // Dosya adı geçiyor mu kontrol et
        for (const file of this.files) {
            const baseName = file.filename.split('/').pop().toLowerCase();
            if (msg.includes(baseName)) return file.filename;
        }

        // Hata türüne göre dosya tahmin et
        if (msg.includes('syntaxerror') || msg.includes('unexpected token')) {
            // Genelde JS hatası
            const jsFile = this.files.find(f => f.language === 'javascript' || f.filename.endsWith('.js'));
            if (jsFile) return jsFile.filename;
        }

        if (msg.includes('is not defined') || msg.includes('is not a function') || msg.includes('cannot read prop')) {
            const jsFile = this.files.find(f => f.language === 'javascript' || f.filename.endsWith('.js'));
            if (jsFile) return jsFile.filename;
        }

        if (msg.includes('queryselector') || msg.includes('getelementby') || msg.includes('null')) {
            // DOM hatası — HTML veya JS olabilir
            const jsFile = this.files.find(f => f.language === 'javascript' || f.filename.endsWith('.js'));
            if (jsFile) return jsFile.filename + ' (DOM selector issue — check HTML element IDs/classes too)';
        }

        return null;
    },

    // ── Terminal ──
    executeTerminalCommand(command) {
        this.addConsoleLog('info', `$ ${command}`, 'terminal');

        const cmd = command.toLowerCase().trim();
        const commands = {
            'clear': () => { this.clearConsole(); },
            'cls': () => { this.clearConsole(); },
            'help': () => {
                this.addConsoleLog('info', 'Available commands:\n  clear — Clear console\n  help — Show commands\n  files — List files\n  pwd — Current directory\n  run — Run preview\n  refresh — Clear console & re-run preview\n  errors — Show all errors\n  fix — Auto-fix errors with AI\n  echo <text> — Print text\n  cat <file> — Show file content\n  version — Show version');
            },
            'files': () => {
                if (this.files.length === 0) {
                    this.addConsoleLog('info', 'No files loaded');
                } else {
                    const list = this.files.map(f => `  ${f.filename} (${f.language}, ${f.code.length} chars)`).join('\n');
                    this.addConsoleLog('info', `Files (${this.files.length}):\n${list}`);
                }
            },
            'pwd': () => {
                this.addConsoleLog('info', '/aetheride/workspace');
            },
            'run': () => {
                this.togglePreview();
                this.addConsoleLog('info', 'Running preview...');
            },
            'refresh': () => {
                this.consoleRerun();
            },
            'rerun': () => {
                this.consoleRerun();
            },
            'version': () => {
                this.addConsoleLog('info', 'AetherIDE v1.4.8');
            },
            'errors': () => {
                const errors = this.consoleLogs.filter(l => l.type === 'error');
                if (errors.length === 0) {
                    this.addConsoleLog('info', '✅ No errors detected');
                } else {
                    this.addConsoleLog('info', `🔴 ${errors.length} error(s):\n${errors.map(e => '  • ' + e.message).join('\n')}`);
                }
            },
            'fix': () => {
                const errors = this.consoleLogs.filter(l => l.type === 'error');
                if (errors.length === 0) {
                    this.addConsoleLog('info', '✅ No errors to fix');
                } else {
                    this.addConsoleLog('info', `🔧 Sending ${errors.length} error(s) to AI for fixing...`);
                    this._triggerAutoFix();
                }
            },
        };

        if (commands[cmd]) {
            commands[cmd]();
        } else if (command.startsWith('echo ')) {
            this.addConsoleLog('log', command.slice(5));
        } else if (command.startsWith('cat ')) {
            const filename = command.slice(4).trim();
            const file = this.files.find(f => f.filename === filename);
            if (file) {
                this.addConsoleLog('log', file.code);
            } else {
                this.addConsoleLog('error', `File not found: ${filename}`);
            }
        } else {
            this.addConsoleLog('warn', `Command not found: ${command}. Type 'help' for available commands.`);
        }
    },

    fallbackCopy(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            ok ? Utils.toast('Code copied!', 'success') : Utils.toast('Copy failed', 'error');
        } catch (e) {
            Utils.toast('Copy not supported', 'error');
        }
    },

    downloadCurrent() {
        if (!this.currentFile) {
            Utils.toast('No code to download', 'warning');
            return;
        }
        const blob = new Blob([this.currentCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.filename;
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast(`Downloaded ${this.currentFile.filename}`, 'success');
    },

downloadAll() {
    if (this.files.length === 0) {
        Utils.toast('No files to download', 'warning');
        return;
    }

    try {
        const zip = ZipExport.create();

        for (const file of this.files) {
            zip.addFile(file.filename, file.code);
        }

        const projectName = Chat.currentChat?.title
            ? Utils.slugify(Chat.currentChat.title)
            : 'aetheride-project';

        zip.download(projectName + '.zip');
        Utils.toast(`Downloaded ${this.files.length} files as ZIP`, 'success');
    } catch (e) {
        console.error('ZIP export failed:', e);
        // Fallback: eski yöntem
        this.files.forEach((file, index) => {
            setTimeout(() => {
                const blob = new Blob([file.code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.filename;
                a.click();
                URL.revokeObjectURL(url);
            }, index * 500);
        });
        Utils.toast(`Downloading ${this.files.length} files individually...`, 'warning');
    }
},

    refreshPreview() {
        if (!this.previewVisible) return;
        const iframe = document.getElementById('preview-iframe');
        if (iframe) {
            this._renderPreviewContent(iframe);
        }
        Utils.toast('Preview refreshed', 'info', 1500);
    },

    togglePreview() {
        const previewContainer = document.getElementById('preview-container');
        const editorWrapper = document.getElementById('code-editor-wrapper');
        const iframe = document.getElementById('preview-iframe');
        const refreshBtn = document.getElementById('refresh-preview-btn');

        if (!previewContainer || !editorWrapper) return;

        this.previewVisible = !this.previewVisible;

        if (refreshBtn) refreshBtn.style.display = this.previewVisible ? 'inline-flex' : 'none';

        if (!this.previewVisible) {
            previewContainer.style.display = 'none';
            editorWrapper.style.display = 'block';
            return;
        }

        if (this.files.length === 0) {
            Utils.toast('No code to preview', 'warning');
            this.previewVisible = false;
            if (refreshBtn) refreshBtn.style.display = 'none';
            return;
        }

        const hasHtml = this.files.some(f =>
            f.language === 'html' || f.filename.endsWith('.html')
        );

        if (!hasHtml) {
            Utils.toast('Preview requires an HTML file', 'warning');
            this.previewVisible = false;
            if (refreshBtn) refreshBtn.style.display = 'none';
            return;
        }

        previewContainer.style.display = 'block';
        editorWrapper.style.display = 'none';

        if (iframe) {
            this._renderPreviewContent(iframe);
        }
    },

    _buildPreviewHTML() {
        const htmlFile = this.files.find(f =>
            f.language === 'html' || f.filename.endsWith('.html')
        );

        if (!htmlFile) return null;

        let htmlContent = htmlFile.code;

        // CSS dosyalarını inline et
        this.files.forEach(f => {
            if (f.language === 'css' || f.filename.endsWith('.css')) {
                const baseName = f.filename.includes('/') ? f.filename.split('/').pop() : f.filename;
                let escapedBase;
                try {
                    escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                } catch(e) {
                    escapedBase = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
                }
                let linkRegex;
                try {
                    linkRegex = new RegExp(
                        `<link[^>]*href=["'](?:[^"']*[/])?${escapedBase}["'][^>]*/?>`, 'gi'
                    );
                } catch(e) {
                    // Regex oluşturulamazsa fallback: </head> öncesine ekle
                    if (htmlContent.includes('</head>')) {
                        htmlContent = htmlContent.replace('</head>', `<style>\n${f.code}\n</style>\n</head>`);
                    }
                    return;
                }
                const replaced = htmlContent.replace(linkRegex, `<style>\n${f.code}\n</style>`);

                if (replaced !== htmlContent) {
                    htmlContent = replaced;
                } else {
                    if (htmlContent.includes('</head>')) {
                        htmlContent = htmlContent.replace('</head>', `<style>\n${f.code}\n</style>\n</head>`);
                    } else if (htmlContent.includes('<body')) {
                        htmlContent = htmlContent.replace(/<body/i, `<style>\n${f.code}\n</style>\n<body`);
                    }
                }
            }
        });

        // JS dosyalarını inline et
        this.files.forEach(f => {
            if (f.language === 'javascript' || f.language === 'js' || f.filename.endsWith('.js')) {
                const baseName = f.filename.includes('/') ? f.filename.split('/').pop() : f.filename;
                let escapedBase;
                try {
                    escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                } catch(e) {
                    escapedBase = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
                }
                let scriptRegex;
                try {
                    scriptRegex = new RegExp(
                        `<script[^>]*src=["'](?:[^"']*[/])?${escapedBase}["'][^>]*>\\s*</script>`, 'gi'
                    );
                } catch(e) {
                    if (htmlContent.includes('</body>')) {
                        htmlContent = htmlContent.replace('</body>', `<script>\n${f.code}\n</script>\n</body>`);
                    } else {
                        htmlContent += `\n<script>\n${f.code}\n</script>`;
                    }
                    return;
                }
                const replaced = htmlContent.replace(scriptRegex, `<script>\n${f.code}\n</script>`);

                if (replaced !== htmlContent) {
                    htmlContent = replaced;
                } else {
                    if (htmlContent.includes('</body>')) {
                        htmlContent = htmlContent.replace('</body>', `<script>\n${f.code}\n</script>\n</body>`);
                    } else {
                        htmlContent += `\n<script>\n${f.code}\n</script>`;
                    }
                }
            }
        });

        return htmlContent;
    },

    _getConsoleCaptureScript() {
        return `
<script>
(function() {
    // ═══ AetherIDE Preview Safety Guards ═══

    // setInterval koruması — max 50 aktif interval
    var _origSetInterval = window.setInterval;
    var _intervalCount = 0;
    var _maxIntervals = 50;
    window.setInterval = function() {
        if (_intervalCount >= _maxIntervals) {
            console.warn('[AetherIDE Guard] Too many setInterval calls (' + _maxIntervals + ' limit). Blocked.');
            return -1;
        }
        _intervalCount++;
        var args = Array.prototype.slice.call(arguments);
        if (args.length >= 2 && typeof args[1] === 'number' && args[1] < 10) {
            args[1] = 10;
        }
        return _origSetInterval.apply(window, args);
    };
    var _origClearInterval = window.clearInterval;
    window.clearInterval = function(id) {
        if (id !== -1) _intervalCount = Math.max(0, _intervalCount - 1);
        return _origClearInterval.call(window, id);
    };

    // setTimeout flood koruması — saniyede max 200
    var _origSetTimeout = window.setTimeout;
    var _timeoutBurst = 0;
    var _maxTimeoutBurst = 200;
    _origSetInterval(function() { _timeoutBurst = 0; }, 1000);
    window.setTimeout = function() {
        _timeoutBurst++;
        if (_timeoutBurst > _maxTimeoutBurst) {
            if (_timeoutBurst === _maxTimeoutBurst + 1) {
                console.warn('[AetherIDE Guard] setTimeout flood detected (' + _maxTimeoutBurst + '/sec limit). Blocking excess calls.');
            }
            return -1;
        }
        return _origSetTimeout.apply(window, arguments);
    };

    // requestAnimationFrame flood koruması — saniyede max 120
    var _origRAF = window.requestAnimationFrame;
    var _rafCount = 0;
    var _rafLimit = 120;
    _origSetInterval(function() { _rafCount = 0; }, 1000);
    if (_origRAF) {
        window.requestAnimationFrame = function(cb) {
            _rafCount++;
            if (_rafCount > _rafLimit) {
                if (_rafCount % 120 === 1) {
                    console.warn('[AetherIDE Guard] requestAnimationFrame flood detected. Throttling.');
                }
                return -1;
            }
            return _origRAF.call(window, cb);
        };
    }

    // ═══ Console Capture ═══
    var origConsole = {};
    var msgCount = 0;
    var MAX_MESSAGES = 200;

    function formatArg(a, depth) {
        depth = depth || 0;
        if (depth > 3) return '[...]';
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'string') return a;
        if (typeof a === 'number' || typeof a === 'boolean') return String(a);
        if (a instanceof Error) return a.name + ': ' + a.message + (a.stack ? '\\n' + a.stack.split('\\n').slice(0, 3).join('\\n') : '');
        if (Array.isArray(a)) {
            if (a.length > 20) return '[Array(' + a.length + ') ' + a.slice(0, 5).map(function(x) { return formatArg(x, depth + 1); }).join(', ') + ', ...]';
            return '[' + a.map(function(x) { return formatArg(x, depth + 1); }).join(', ') + ']';
        }
        if (a instanceof HTMLElement) return '<' + a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (a.className ? '.' + String(a.className).split(' ').join('.') : '') + '>';
        if (typeof a === 'object') {
            try {
                var keys = Object.keys(a);
                if (keys.length > 10) return '{Object with ' + keys.length + ' keys: ' + keys.slice(0, 5).join(', ') + ', ...}';
                return JSON.stringify(a, null, 0);
            } catch(e) { return String(a); }
        }
        if (typeof a === 'function') return '[Function: ' + (a.name || 'anonymous') + ']';
        return String(a);
    }

    function sendToParent(logType, message, source) {
        if (msgCount >= MAX_MESSAGES) return;
        msgCount++;
        try {
            window.parent.postMessage({
                type: 'aetheride-console',
                logType: logType,
                message: String(message).substring(0, 2000),
                source: source || ''
            }, '*');
        } catch(e) {}
    }

    ['log', 'error', 'warn', 'info', 'debug'].forEach(function(type) {
        origConsole[type] = console[type];
        console[type] = function() {
            var args = Array.prototype.slice.call(arguments);
            var msg = args.map(function(a) { return formatArg(a); }).join(' ');
            origConsole[type].apply(console, arguments);
            sendToParent(type === 'debug' ? 'log' : type, msg);
        };
    });

    // console.assert
    var origAssert = console.assert;
    console.assert = function(condition) {
        if (!condition) {
            var args = Array.prototype.slice.call(arguments, 1);
            var msg = 'Assertion failed: ' + (args.length > 0 ? args.map(function(a) { return formatArg(a); }).join(' ') : '(no message)');
            sendToParent('error', msg);
        }
        if (origAssert) origAssert.apply(console, arguments);
    };

    // console.table
    var origTable = console.table;
    console.table = function(data) {
        if (Array.isArray(data)) {
            sendToParent('log', '[Table] ' + JSON.stringify(data.slice(0, 10)));
        } else {
            sendToParent('log', '[Table] ' + formatArg(data));
        }
        if (origTable) origTable.apply(console, arguments);
    };

    // Global error handler — gelişmiş stack trace
    window.addEventListener('error', function(e) {
        var msg = (e.message || 'Unknown error');
        var location = '';
        if (e.filename) {
            var fname = e.filename;
            // Inline script için dosya adı temizle
            if (fname.includes('srcdoc')) fname = 'inline-script';
            location = ' at ' + fname;
            if (e.lineno) location += ':' + e.lineno;
            if (e.colno) location += ':' + e.colno;
        }

        var stack = '';
        if (e.error && e.error.stack) {
            var stackLines = e.error.stack.split('\\n').slice(0, 4);
            stack = '\\nStack: ' + stackLines.join('\\n  ');
        }

        sendToParent('error', msg + location + stack, 'runtime');
    });

    // Unhandled promise rejection — gelişmiş
    window.addEventListener('unhandledrejection', function(e) {
        var msg = 'Unhandled Promise Rejection: ';
        if (e.reason instanceof Error) {
            msg += e.reason.message;
            if (e.reason.stack) {
                msg += '\\nStack: ' + e.reason.stack.split('\\n').slice(0, 3).join('\\n  ');
            }
        } else if (typeof e.reason === 'string') {
            msg += e.reason;
        } else if (e.reason) {
            try { msg += JSON.stringify(e.reason); } catch(ex) { msg += String(e.reason); }
        } else {
            msg += 'Unknown reason';
        }
        sendToParent('error', msg, 'promise');
    });

    // Resource loading errors (CSS, JS, images)
    window.addEventListener('error', function(e) {
        if (e.target && e.target !== window) {
            var tag = e.target.tagName;
            var src = e.target.src || e.target.href || '';
            if (tag && src) {
                sendToParent('error', 'Failed to load ' + tag.toLowerCase() + ': ' + src, 'resource');
            }
        }
    }, true);

    // Performance — sayfa yüklenme süresi
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (window.performance && performance.timing) {
                var loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                if (loadTime > 0) {
                    sendToParent('info', 'Page loaded in ' + loadTime + 'ms', 'performance');
                }
            }
        }, 100);
    });
})();
</script>`;
    },

    _injectConsoleCapture(htmlContent) {
        const consoleCapture = this._getConsoleCaptureScript();
        if (htmlContent.includes('<head>')) {
            return htmlContent.replace('<head>', '<head>' + consoleCapture);
        } else if (htmlContent.includes('<head ')) {
            return htmlContent.replace(/<head\s/i, '<head>' + consoleCapture + '</head><head ');
        } else if (htmlContent.includes('<html>')) {
            return htmlContent.replace('<html>', '<html><head>' + consoleCapture + '</head>');
        } else if (htmlContent.includes('<html ')) {
            return htmlContent.replace(/<html([^>]*)>/i, '<html$1><head>' + consoleCapture + '</head>');
        }
        return consoleCapture + htmlContent;
    },

    _renderPreviewContent(iframe) {
        const htmlContent = this._buildPreviewHTML();

        if (htmlContent) {
            // Eski içeriği temizle, sonra yeni yükle
            iframe.srcdoc = '';
            // Bir frame bekle ki browser eski srcdoc'u flush etsin
            requestAnimationFrame(() => {
                iframe.srcdoc = this._injectConsoleCapture(htmlContent);
            });
        } else {
            const escaped = Utils.escapeHtml(this.currentCode || '');
            iframe.srcdoc = `<pre style="font-family:'JetBrains Mono',monospace;padding:20px;background:#1e1e1e;color:#d4d4d4;margin:0;height:100vh;overflow:auto;white-space:pre-wrap;word-break:break-all;">${escaped}</pre>`;
        }
    },

    updateStatusBar() {
        // Status bar removed — no-op
    },
};
