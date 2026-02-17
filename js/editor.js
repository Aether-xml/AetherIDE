/* ══════════════════════════════════════════════════════════
   AetherIDE — Code Editor v2 (Multi-File + Terminal + Console)
   ══════════════════════════════════════════════════════════ */

const Editor = {

    files: [],
    activeFileIndex: 0,
    previewVisible: false,
    consoleVisible: false,
    consoleLogs: [],

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

    updateCode(aiResponse) {
        const blocks = Utils.extractCodeBlocks(aiResponse);
        if (blocks.length === 0) return;

        let hasChanges = false;

        for (const block of blocks) {
            if (!block.code || block.code.trim().length === 0) continue;

            // Dosya adını normalize et (case-sensitive ama path normalize)
            const normalizedName = block.filename.replace(/^\.\//, '').replace(/^\//, '');

            const existingIndex = this.files.findIndex(f => {
                const existingNorm = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                return existingNorm === normalizedName;
            });

            if (existingIndex >= 0) {
                // Sadece içerik değiştiyse güncelle
                const existingCode = this.files[existingIndex].code;
                if (existingCode !== block.code) {
                    this.files[existingIndex] = {
                        filename: normalizedName,
                        language: block.language || this.files[existingIndex].language,
                        code: block.code,
                    };
                    hasChanges = true;
                }
            } else {
                this.files.push({
                    filename: normalizedName,
                    language: block.language,
                    code: block.code,
                });
                hasChanges = true;

                // Yeni dosya eklendiğinde o dosyaya geç
                this.activeFileIndex = this.files.length - 1;
            }
        }

        if (!hasChanges) return;

        // Güvenli index kontrolü
        if (this.activeFileIndex >= this.files.length) {
            this.activeFileIndex = this.files.length - 1;
        }
        if (this.activeFileIndex < 0) this.activeFileIndex = 0;

        const now = Date.now();
        if (now - this._lastEditorUpdate < 500) {
            if (this._editorUpdatePending) cancelAnimationFrame(this._editorUpdatePending);
            this._editorUpdatePending = requestAnimationFrame(() => {
                this._renderEditorUI();
            });
            return;
        }

        this._lastEditorUpdate = now;
        this._renderEditorUI();
    },

    _renderEditorUI() {
        this.renderTabs();
        this.renderCode();
        this.updateStatusBar();

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
            html += `
                <button class="code-tab ${isActive ? 'active' : ''}"
                        onclick="Editor.switchTab(${index})"
                        title="${Utils.escapeHtml(file.filename)}">
                    <i data-lucide="${icon}" class="tab-lucide-icon"></i>
                    <span>${Utils.escapeHtml(file.filename)}</span>
                </button>
            `;
        });

        tabsEl.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [tabsEl] });

        // Aktif tab'ı görünür yap (scroll)
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
        Storage.clearConsoleLogs();
        const output = document.getElementById('console-output');
        if (output) output.innerHTML = '<div class="console-empty">Console cleared</div>';
    },

    addConsoleLog(type, message, source = '') {
        const entry = {
            type,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
            source,
            timestamp: new Date().toISOString(),
        };

        this.consoleLogs.push(entry);

        if (this.consoleLogs.length > 200) {
            this.consoleLogs = this.consoleLogs.slice(-200);
        }

        // Sadece console görünürse render et
        if (this.consoleVisible) {
            this.renderConsole();
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

        const recent = this.consoleLogs.slice(-20);
        let context = '\n\n--- CONSOLE OUTPUT ---\n';
        for (const log of recent) {
            context += `[${log.type.toUpperCase()}] ${log.message}\n`;
        }
        context += '--- END CONSOLE ---\n';
        return context;
    },

    // ── Terminal ──
    executeTerminalCommand(command) {
        this.addConsoleLog('info', `$ ${command}`, 'terminal');

        const cmd = command.toLowerCase().trim();
        const commands = {
            'clear': () => { this.clearConsole(); },
            'cls': () => { this.clearConsole(); },
            'help': () => {
                this.addConsoleLog('info', 'Available commands:\n  clear — Clear console\n  help — Show commands\n  files — List files\n  pwd — Current directory\n  run — Run preview\n  echo <text> — Print text\n  version — Show version');
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
            'version': () => {
                this.addConsoleLog('info', 'AetherIDE v1.4.3');
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
        Utils.toast(`Downloading ${this.files.length} files...`, 'success');
    },

    refreshPreview() {
        if (!this.previewVisible) return;
        this.previewVisible = false;
        this.togglePreview();
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
            return;
        }

        previewContainer.style.display = 'block';
        editorWrapper.style.display = 'none';

        if (iframe) {
            const htmlFile = this.files.find(f =>
                f.language === 'html' || f.filename.endsWith('.html')
            );

            if (htmlFile) {
                let htmlContent = htmlFile.code;

                // CSS dosyalarını inline et
                this.files.forEach(f => {
                    if (f.language === 'css' || f.filename.endsWith('.css')) {
                        // <link> tag'ını <style> ile değiştir
                        const escapedFilename = f.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const linkRegex = new RegExp(
                            `<link[^>]*href=["'](?:\\./)?${escapedFilename}["'][^>]*/?>`, 'gi'
                        );
                        const replaced = htmlContent.replace(linkRegex, `<style>\n${f.code}\n</style>`);

                        if (replaced !== htmlContent) {
                            htmlContent = replaced;
                        } else {
                            // Link tag bulunamadıysa head'e ekle
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
                        const escapedFilename = f.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const scriptRegex = new RegExp(
                            `<script[^>]*src=["'](?:\\./)?${escapedFilename}["'][^>]*>\\s*</script>`, 'gi'
                        );
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

                // Console capture script
                const consoleCapture = `
<script>
(function() {
    var origConsole = {};
    ['log', 'error', 'warn', 'info'].forEach(function(type) {
        origConsole[type] = console[type];
        console[type] = function() {
            var args = Array.prototype.slice.call(arguments);
            var msg = args.map(function(a) {
                if (a === null) return 'null';
                if (a === undefined) return 'undefined';
                if (typeof a === 'object') {
                    try { return JSON.stringify(a); } catch(e) { return String(a); }
                }
                return String(a);
            }).join(' ');
            origConsole[type].apply(console, arguments);
            try {
                window.parent.postMessage({
                    type: 'aetheride-console',
                    logType: type,
                    message: msg
                }, '*');
            } catch(e) {}
        };
    });

    window.addEventListener('error', function(e) {
        try {
            window.parent.postMessage({
                type: 'aetheride-console',
                logType: 'error',
                message: (e.message || 'Unknown error') + ' at ' + (e.filename || '') + ':' + (e.lineno || '')
            }, '*');
        } catch(ex) {}
    });

    window.addEventListener('unhandledrejection', function(e) {
        try {
            var msg = 'Unhandled Promise: ';
            if (e.reason && e.reason.message) msg += e.reason.message;
            else if (typeof e.reason === 'string') msg += e.reason;
            else msg += 'Unknown';
            window.parent.postMessage({
                type: 'aetheride-console',
                logType: 'error',
                message: msg
            }, '*');
        } catch(ex) {}
    });
})();
</script>`;

                // Console capture'ı <head> sonrasına ekle
                if (htmlContent.includes('<head>')) {
                    htmlContent = htmlContent.replace('<head>', '<head>' + consoleCapture);
                } else if (htmlContent.includes('<head ')) {
                    htmlContent = htmlContent.replace(/<head\s/i, '<head>' + consoleCapture + '</head><head ');
                } else if (htmlContent.includes('<html>')) {
                    htmlContent = htmlContent.replace('<html>', '<html><head>' + consoleCapture + '</head>');
                } else if (htmlContent.includes('<html ')) {
                    htmlContent = htmlContent.replace(/<html([^>]*)>/i, '<html$1><head>' + consoleCapture + '</head>');
                } else {
                    htmlContent = consoleCapture + htmlContent;
                }

                iframe.srcdoc = htmlContent;
            } else {
                // HTML dosyası yoksa mevcut kodu göster
                const escaped = Utils.escapeHtml(this.currentCode);
                iframe.srcdoc = `<pre style="font-family:'JetBrains Mono',monospace;padding:20px;background:#1e1e1e;color:#d4d4d4;margin:0;height:100vh;overflow:auto;white-space:pre-wrap;word-break:break-all;">${escaped}</pre>`;
            }
        }
    },

    updateStatusBar() {
        const linesEl = document.getElementById('statusbar-lines');
        if (linesEl && this.currentCode) {
            const lines = this.currentCode.split('\n').length;
            linesEl.textContent = `${lines} lines`;
        } else if (linesEl) {
            linesEl.textContent = '0 lines';
        }
    },
};
