/* ══════════════════════════════════════════════════════════
   AetherIDE — Utility Functions v2
   + SyntaxHighlighter
   ══════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// Syntax Highlighter
// ══════════════════════════════════════
const SyntaxHighlighter = {

    rules: {
        javascript: [
            { pattern: /(\/\/.*)/g, className: 'syntax-comment' },
            { pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'syntax-comment' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*?`)/g, className: 'syntax-string' },
            { pattern: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|delete|void|null|undefined|true|false)\b/g, className: 'syntax-keyword' },
            { pattern: /\b(\d+\.?\d*)\b/g, className: 'syntax-number' },
            { pattern: /\b([A-Z]\w*)\b/g, className: 'syntax-variable' },
            { pattern: /\b(\w+)(?=\s*\()/g, className: 'syntax-function' },
            { pattern: /([\+\-\*\/\=\!\<\>\&\|\?\:\%\~\^])/g, className: 'syntax-operator' },
        ],
        typescript: null, // js ile aynı
        html: [
            { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, className: 'syntax-comment' },
            { pattern: /(&lt;\/?)([\w-]+)/g, replace: '$1<span class="syntax-tag">$2</span>' },
            { pattern: /\b([\w-]+)(=)/g, replace: '<span class="syntax-attribute">$1</span>$2' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, className: 'syntax-string' },
        ],
        css: [
            { pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'syntax-comment' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, className: 'syntax-string' },
            { pattern: /([\.\#][\w\-]+)/g, className: 'syntax-variable' },
            { pattern: /\b([\w-]+)(?=\s*:)/g, className: 'syntax-property' },
            { pattern: /\b(\d+\.?\d*(px|em|rem|vh|vw|%|s|ms|deg|fr)?)\b/g, className: 'syntax-number' },
            { pattern: /(@[\w-]+)/g, className: 'syntax-keyword' },
            { pattern: /(:[\w-]+)/g, className: 'syntax-function' },
        ],
        python: [
            { pattern: /(#.*)/g, className: 'syntax-comment' },
            { pattern: /(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;)/g, className: 'syntax-comment' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, className: 'syntax-string' },
            { pattern: /\b(def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|in|not|and|or|is|lambda|yield|raise|pass|break|continue|True|False|None|self|async|await|global|nonlocal)\b/g, className: 'syntax-keyword' },
            { pattern: /\b(\d+\.?\d*)\b/g, className: 'syntax-number' },
            { pattern: /\b(\w+)(?=\s*\()/g, className: 'syntax-function' },
            { pattern: /(@\w+)/g, className: 'syntax-variable' },
        ],
        json: [
            { pattern: /(&quot;[^&]*?&quot;)\s*:/g, className: 'syntax-property' },
            { pattern: /:\s*(&quot;[^&]*?&quot;)/g, className: 'syntax-string' },
            { pattern: /\b(\d+\.?\d*)\b/g, className: 'syntax-number' },
            { pattern: /\b(true|false|null)\b/g, className: 'syntax-keyword' },
        ],
        sql: [
            { pattern: /(--.*)/g, className: 'syntax-comment' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, className: 'syntax-string' },
            { pattern: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INTO|VALUES|SET|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|DISTINCT|UNION|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|CASCADE|COUNT|SUM|AVG|MIN|MAX|IN|EXISTS|BETWEEN|LIKE|IS)\b/gi, className: 'syntax-keyword' },
            { pattern: /\b(\d+\.?\d*)\b/g, className: 'syntax-number' },
        ],
        bash: [
            { pattern: /(#.*)/g, className: 'syntax-comment' },
            { pattern: /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, className: 'syntax-string' },
            { pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|in|echo|exit|export|source|local|readonly|declare|unset|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|chmod|chown|sudo)\b/g, className: 'syntax-keyword' },
            { pattern: /(\$\w+|\$\{[^}]+\})/g, className: 'syntax-variable' },
        ],
    },

    highlight(code, language) {
        if (!code) return '';

        // Önce HTML escape
        let html = Utils.escapeHtml(code);

        // Dil kurallarını bul
        let rules = this.rules[language?.toLowerCase()];
        if (language === 'ts' || language === 'typescript') rules = this.rules.javascript;
        if (language === 'js') rules = this.rules.javascript;
        if (language === 'py') rules = this.rules.python;
        if (language === 'sh' || language === 'shell') rules = this.rules.bash;
        if (language === 'htm') rules = this.rules.html;

        if (!rules) return html;

        // Token bazlı highlighting — çakışmaları önle
        const tokens = [];
        
        for (const rule of rules) {
            const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
            let match;
            
            while ((match = regex.exec(html)) !== null) {
                if (rule.replace) {
                    // Özel replace kuralı (HTML tag'leri gibi)
                    continue;
                }
                tokens.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    className: rule.className,
                });
            }
        }

        // Çakışmaları temizle — öncelik: comment > string > keyword > diğerleri
        const priority = {
            'syntax-comment': 0,
            'syntax-string': 1,
            'syntax-keyword': 2,
            'syntax-number': 3,
            'syntax-function': 4,
            'syntax-variable': 5,
            'syntax-property': 6,
            'syntax-operator': 7,
            'syntax-tag': 8,
            'syntax-attribute': 9,
        };

        tokens.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return (priority[a.className] || 99) - (priority[b.className] || 99);
        });

        // Çakışan token'ları kaldır
        const filtered = [];
        let lastEnd = 0;

        for (const token of tokens) {
            if (token.start >= lastEnd) {
                filtered.push(token);
                lastEnd = token.end;
            }
        }

        // Token'ları uygula (sondan başa)
        for (let i = filtered.length - 1; i >= 0; i--) {
            const t = filtered[i];
            html = html.substring(0, t.start) +
                   `<span class="${t.className}">${t.text}</span>` +
                   html.substring(t.end);
        }

        return html;
    },
};


const Utils = {

    _toastHistory: [],
    _toastMaxVisible: 4,

    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // Duplicate kontrolü — aynı mesaj 2 saniye içinde tekrar gelmesin
        const now = Date.now();
        const recentDupe = this._toastHistory.find(t =>
            t.message === message && t.type === type && (now - t.time) < 2000
        );
        if (recentDupe) return;

        // History temizle (5 sn'den eski olanları sil)
        this._toastHistory = this._toastHistory.filter(t => (now - t.time) < 5000);
        this._toastHistory.push({ message, type, time: now });

        // Çok fazla toast varsa eskilerini kaldır
        const existing = container.querySelectorAll('.toast:not(.toast-out)');
        if (existing.length >= this._toastMaxVisible) {
            const oldest = existing[0];
            oldest.classList.add('toast-out');
            setTimeout(() => oldest.remove(), 250);
        }

        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons({ nodes: [toast] });

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatTime(date) {
        const d = date instanceof Date ? date : new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    },

    truncate(str, maxLen = 40) {
        if (!str) return '';
        return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
    },

    sanitizeFilename(filename) {
        if (!filename || typeof filename !== 'string') return 'untitled.txt';
        let safe = filename
            .replace(/['"<>&`]/g, '')                // XSS vektörleri
            .replace(/javascript\s*:/gi, '')          // javascript: protocol
            .replace(/on\w+\s*=/gi, '')               // onerror=, onclick= vb.
            .replace(/data\s*:/gi, '')                // data: protocol
            .replace(/vbscript\s*:/gi, '')            // vbscript: protocol
            .replace(/[\x00-\x1f\x7f]/g, '')         // kontrol karakterleri
            .replace(/\.\.+/g, '.')                   // path traversal (.. → .)
            .replace(/\/{2,}/g, '/')                  // çift slash
            .trim();
        if (!safe || safe === '.' || safe === '/') safe = 'untitled.txt';
        if (safe.length > 255) safe = safe.substring(0, 255);
        return safe;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    autoResize(textarea) {
        if (!textarea) return;
        // Textarea türüne göre max yükseklik belirle
        let maxH = 140;
        if (textarea.classList.contains('sandbox-input')) maxH = 120;
        else if (textarea.classList.contains('settings-textarea')) maxH = 250;
        else if (textarea.classList.contains('settings-textarea-sm')) maxH = 200;

        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, maxH);
        textarea.style.height = newHeight + 'px';

        // Max'a ulaştıysa scroll göster
        textarea.style.overflowY = textarea.scrollHeight > maxH ? 'auto' : 'hidden';
    },

    updateCharCounter(counterId, current, max) {
        const counter = document.getElementById(counterId);
        if (!counter) return;

        const ratio = current / max;

        if (current === 0) {
            counter.classList.remove('visible', 'warning', 'danger');
            return;
        }

        // %60'tan sonra göster
        if (ratio < 0.6) {
            counter.classList.remove('visible', 'warning', 'danger');
            return;
        }

        counter.classList.add('visible');
        counter.textContent = `${current.toLocaleString()} / ${max.toLocaleString()}`;

        if (ratio >= 0.95) {
            counter.classList.remove('warning');
            counter.classList.add('danger');
        } else if (ratio >= 0.8) {
            counter.classList.remove('danger');
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning', 'danger');
        }
    },

    initCharCounters() {
        const counters = [
            { inputId: 'system-prompt-input', counterId: 'system-prompt-counter', max: 10000 },
            { inputId: 'enhancer-prompt-input', counterId: 'enhancer-prompt-counter', max: 5000 },
            { inputId: 'sandbox-direct-system-prompt', counterId: 'sandbox-direct-sp-counter', max: 10000 },
            { inputId: 'sandbox-sbs-system-prompt', counterId: 'sandbox-sbs-sp-counter', max: 10000 },
        ];

        for (const c of counters) {
            const input = document.getElementById(c.inputId);
            if (input) {
                input.addEventListener('input', () => {
                    Utils.updateCharCounter(c.counterId, input.value.length, c.max);
                });
                Utils.updateCharCounter(c.counterId, input.value.length, c.max);
            }
        }
    },

    // Token tahmini (~4 karakter = 1 token)
    estimateTokens(text) {
        if (!text) return 0;
        const charCount = text.length;
        const wordCount = text.split(/\s+/).filter(w => w).length;
        // Ortalama: karakterlerin 1/4'ü + kelime sayısının 1.3 katı arası
        const estimate = Math.ceil((charCount / 4 + wordCount * 1.3) / 2);
        if (estimate > 1000) return (estimate / 1000).toFixed(1) + 'k';
        return estimate;
    },

    // ── Prompt Enhancer ──
    async enhancePrompt(text) {
        if (!text.trim()) return text;

        const settings = Storage.getSettings();
        const model = settings.promptEnhancer?.customModel || App.currentModel;

        if (!model) {
            Utils.toast('No model selected for prompt enhancement', 'warning');
            return text;
        }

        const enhanceSystemPrompt = settings.promptEnhancer?.customPrompt ||
            `You are a prompt enhancement specialist. Take the user's rough prompt and improve it to be:
- More specific and detailed
- Better structured
- Include edge cases and requirements
- Maintain the original intent

CRITICAL RULES:
1. Return ONLY the enhanced prompt text, nothing else.
2. Do NOT add any prefixes like "Enhanced prompt:", "Here's the improved version:", etc.
3. Do NOT add any explanations, notes, or commentary.
4. Do NOT wrap the prompt in quotes or markdown.
5. Do NOT truncate or cut off the prompt — write it COMPLETELY.
6. The enhanced prompt should be a single, complete, ready-to-use prompt.`;

        try {
            const result = await API.sendMessage(
                [{ role: 'user', content: `Enhance this prompt. Return ONLY the enhanced version, nothing else:\n\n${text}` }],
                model,
                {
                    systemPrompt: enhanceSystemPrompt,
                    maxTokens: 1024,
                    temperature: 0.6,
                    stream: false,
                }
            );

            let enhanced = '';

            if (result?.content) {
                enhanced = result.content.trim();
            } else if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) { enhanced += chunk; }
                enhanced = enhanced.trim();
            }

            if (!enhanced || enhanced.length < text.length * 0.5) {
                // Çok kısa veya boş geldiyse orijinali koru
                return text;
            }

            // Yaygın prefix'leri temizle
            enhanced = enhanced
                .replace(/^(Enhanced prompt|Here'?s?( the)?( improved| enhanced)?( version| prompt)?)\s*[:：\-]\s*/i, '')
                .replace(/^["'`]+|["'`]+$/g, '')
                .trim();

            return enhanced || text;
        } catch (e) {
            Utils.toast('Prompt enhancement failed: ' + e.message, 'error');
        }

        return text;
    },

    // ── Markdown Parser (kullanıcı mesajları) ──
    parseMarkdown(text) {
        if (!text) return '';

        let html = Utils.escapeHtml(text);

        html = html.replace(/```\s*(\w*?)(?:\s*:\s*([^\n]*?))?\s*\n([\s\S]*?)```/g, (match, lang, filename, code) => {
            const langLabel = lang || 'code';
            const displayName = filename?.trim()
                ? `<i data-lucide="file-code" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${filename.trim()}`
                : langLabel;

            const highlighted = SyntaxHighlighter.highlight(code.trim(), langLabel);

            return `<div class="code-block-header">
                        <span class="code-block-lang">${displayName}</span>
                        <button class="code-block-copy" onclick="Utils.copyCode(this)">
                            <i data-lucide="copy"></i> Copy
                        </button>
                    </div>
                    <pre><code class="language-${langLabel}">${highlighted}</code></pre>`;
        });

        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Headings
        html = html.replace(/^######\s+(.+)$/gm, '<h6 class="md-heading md-h6">$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="md-heading md-h5">$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4 class="md-heading md-h4">$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-heading md-h3">$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-heading md-h2">$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-heading md-h1">$1</h1>');

        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr class="md-hr">');

        // Lists
        html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="md-li">$1</li>');
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li md-li-ordered">$1</li>');

        // Blockquote
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

        // Details/Summary
        html = html.replace(/&lt;details&gt;&lt;summary&gt;(.*?)&lt;\/summary&gt;/g, '<details><summary>$1</summary>');
        html = html.replace(/&lt;\/details&gt;/g, '</details>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Clean trailing <br> after block elements
        html = html.replace(/(<\/h[1-6]>)<br>/g, '$1');
        html = html.replace(/(<hr class="md-hr">)<br>/g, '$1');
        html = html.replace(/(<\/li>)<br>/g, '$1');
        html = html.replace(/(<\/blockquote>)<br>/g, '$1');
        html = html.replace(/(<\/pre>)<br>/g, '$1');
        html = html.replace(/(<\/details>)<br>/g, '$1');

        return html;
    },

    // ── AI Mesajları Markdown (dosya kartları + highlighting) ──
    parseMarkdownWithFileCards(text, isStreaming = false) {
        if (!text) return '';

        let html = Utils.escapeHtml(text);

        // Tamamlanmış kod blokları
        html = html.replace(/```\s*(\w*?)(?:\s*:\s*([^\n]*?))?\s*\n([\s\S]*?)```/g, (match, lang, filename, code) => {
            const langLabel = lang || 'code';
            const trimmedCode = code?.trim() || '';
            const lines = trimmedCode.split('\n').length;
            const chars = trimmedCode.length;

            // [DELETED] marker kontrolü
            const isDeleteMarker = /^\s*(?:\/\/|\/\*|#|<!--|--|%)\s*\[DELETED\]\s*(?:\*\/|-->)?\s*$/i.test(trimmedCode);
            if (isDeleteMarker && filename?.trim()) {
                let fname = filename.trim().replace(/^\.\//, '').replace(/^\//, '');
                fname = Utils.sanitizeFilename ? Utils.sanitizeFilename(fname) : fname;
                const iconName = Utils.getFileIcon(langLabel);
                return `<div class="file-card file-card-deleted">
                            <div class="file-card-icon"><i data-lucide="trash-2"></i></div>
                            <div class="file-card-info">
                                <span class="file-card-status">Removed</span>
                                <span class="file-card-name">${Utils.escapeHtml(fname)}</span>
                            </div>
                            <div class="file-card-action"><i data-lucide="x"></i></div>
                        </div>`;
            }

            if (filename?.trim()) {
                let fname = filename.trim().replace(/^\.\//, '').replace(/^\//, '');
                // Dosya adını Editor.files ile aynı şekilde normalize et
                fname = Utils.sanitizeFilename ? Utils.sanitizeFilename(fname) : fname;
                const iconName = fname.includes('/') ? 'folder' : Utils.getFileIcon(langLabel);
                const displayFname = fname.includes('/') ? `<span style="color:var(--text-tertiary);font-size:0.65rem;">${Utils.escapeHtml(fname.substring(0, fname.lastIndexOf('/') + 1))}</span>${Utils.escapeHtml(fname.split('/').pop())}` : Utils.escapeHtml(fname);
                // Dosya daha önce var mıydı? Snapshot varsa ona bak (stream sırasında doğru sonuç verir)
                let exists = false;
                if (Chat._preStreamFiles) {
                    exists = Chat._preStreamFiles.has(fname) ||
                             [...Chat._preStreamFiles].some(f => f.split('/').pop() === fname.split('/').pop());
                } else {
                    const existingFile = Editor.files.find(f => {
                        const normF = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                        return normF === fname || normF.split('/').pop() === fname.split('/').pop();
                    });
                    exists = !!existingFile;
                }
                const statusLabel = exists ? 'Updated' : 'Created';
                const statusClass = exists ? 'file-card-updated' : 'file-card-created';
                const safeFname = fname.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                return `<div class="file-card ${statusClass}" onclick="Utils.openFileInEditor('${safeFname}')">
                            <div class="file-card-icon"><i data-lucide="${iconName}"></i></div>
                            <div class="file-card-info">
                                <span class="file-card-status">${statusLabel}</span>
                                <span class="file-card-name">${displayFname}</span>
                            </div>
                            <div class="file-card-action"><i data-lucide="arrow-right"></i></div>
                        </div>`;
            } else {
                if (lines <= 10) {
                    const highlighted = SyntaxHighlighter.highlight(trimmedCode, langLabel);
                    return `<div class="code-block-header">
                                <span class="code-block-lang">${langLabel}</span>
                                <button class="code-block-copy" onclick="Utils.copyCode(this)">
                                    <i data-lucide="copy"></i> Copy
                                </button>
                            </div>
                            <pre><code class="language-${langLabel}">${highlighted}</code></pre>`;
                } else {
                    const autoName = `output.${Utils.getExtension(langLabel)}`;
                    const iconName = Utils.getFileIcon(langLabel);
                    let exists = false;
                    if (Chat._preStreamFiles) {
                        exists = Chat._preStreamFiles.has(autoName) ||
                                 [...Chat._preStreamFiles].some(f => f.split('/').pop() === autoName.split('/').pop());
                    } else {
                        const existingFile = Editor.files.find(f => {
                            const normF = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                            return normF === autoName || normF.split('/').pop() === autoName.split('/').pop();
                        });
                        exists = !!existingFile;
                    }
                    const statusLabel = exists ? 'Updated' : 'Created';
                    const statusClass = exists ? 'file-card-updated' : 'file-card-created';
                    const safeAutoName = autoName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    return `<div class="file-card ${statusClass}" onclick="Utils.openFileInEditor('${safeAutoName}')">
                                <div class="file-card-icon"><i data-lucide="${iconName}"></i></div>
                                <div class="file-card-info">
                                    <span class="file-card-status">${statusLabel}</span>
                                    <span class="file-card-name">${autoName}</span>
                                </div>
                                <div class="file-card-action"><i data-lucide="arrow-right"></i></div>
                            </div>`;
                }
            }
        });

        // Devam eden bloklar (sadece stream sırasında göster)
        if (isStreaming) {
            html = html.replace(/```\s*(\w*?)(?:\s*:\s*([^\n]*?))?\s*\n([\s\S]*)$/g, (match, lang, filename, code) => {
                const langLabel = lang || 'code';
                const fname = filename?.trim() || '';
                let displayName = fname || `output.${Utils.getExtension(langLabel)}`;
                if (displayName.startsWith('./')) displayName = displayName.slice(2);
                if (displayName.startsWith('/')) displayName = displayName.slice(1);
                displayName = Utils.sanitizeFilename ? Utils.sanitizeFilename(displayName) : displayName;
                const iconName = Utils.getFileIcon(langLabel);

                let exists = false;
                if (Chat._preStreamFiles) {
                    exists = Chat._preStreamFiles.has(displayName) ||
                             [...Chat._preStreamFiles].some(f => f.split('/').pop() === displayName.split('/').pop());
                } else {
                    const existingFile = Editor.files.find(f => {
                        const normF = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                        return normF === displayName || normF.split('/').pop() === displayName.split('/').pop();
                    });
                    exists = !!existingFile;
                }
                const writingLabel = exists ? 'Updating...' : 'Creating...';
                const writingClass = exists ? 'file-card-updating' : 'file-card-creating';
                return `<div class="file-card writing ${writingClass}" data-file="${Utils.escapeHtml(displayName)}">
                            <div class="file-card-icon"><i data-lucide="${iconName}"></i></div>
                            <div class="file-card-info">
                                <span class="file-card-status">${writingLabel}</span>
                                <span class="file-card-name">${Utils.escapeHtml(displayName)}</span>
                            </div>
                            <div class="file-card-writing-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>`;
            });
        } else {
            // Stream bitti, kapanmamış code block varsa normal code olarak göster
            html = html.replace(/```\s*(\w*?)(?:\s*:\s*([^\n]*?))?\s*\n([\s\S]*)$/g, (match, lang, filename, code) => {
                const langLabel = lang || 'code';
                const trimmedCode = code?.trim() || '';
                if (!trimmedCode) return '';
                const fname = filename?.trim() || '';
                let displayName = fname || `output.${Utils.getExtension(langLabel)}`;
                if (displayName.startsWith('./')) displayName = displayName.slice(2);
                if (displayName.startsWith('/')) displayName = displayName.slice(1);
                displayName = Utils.sanitizeFilename ? Utils.sanitizeFilename(displayName) : displayName;
                const iconName = Utils.getFileIcon(langLabel);
                let exists = false;
                if (Chat._preStreamFiles) {
                    exists = Chat._preStreamFiles.has(displayName) ||
                             [...Chat._preStreamFiles].some(f => f.split('/').pop() === displayName.split('/').pop());
                } else {
                    const existingFile = Editor.files.find(f => {
                        const normF = f.filename.replace(/^\.\//, '').replace(/^\//, '');
                        return normF === displayName || normF.split('/').pop() === displayName.split('/').pop();
                    });
                    exists = !!existingFile;
                }
                const statusLabel = exists ? 'Updated' : 'Created';
                const statusClass = exists ? 'file-card-updated' : 'file-card-created';
                const safeDisplayName = displayName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                return `<div class="file-card ${statusClass}" onclick="Utils.openFileInEditor('${safeDisplayName}')">
                            <div class="file-card-icon"><i data-lucide="${iconName}"></i></div>
                            <div class="file-card-info">
                                <span class="file-card-status">${statusLabel}</span>
                                <span class="file-card-name">${Utils.escapeHtml(displayName)}</span>
                            </div>
                            <div class="file-card-action"><i data-lucide="arrow-right"></i></div>
                        </div>`;
            });
        }

        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Headings
        html = html.replace(/^######\s+(.+)$/gm, '<h6 class="md-heading md-h6">$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="md-heading md-h5">$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4 class="md-heading md-h4">$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-heading md-h3">$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-heading md-h2">$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-heading md-h1">$1</h1>');

        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr class="md-hr">');

        // Lists
        html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="md-li">$1</li>');
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li md-li-ordered">$1</li>');

        // Blockquote
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

        // Details/Summary
        html = html.replace(/&lt;details&gt;&lt;summary&gt;(.*?)&lt;\/summary&gt;/g, '<details><summary>$1</summary>');
        html = html.replace(/&lt;\/details&gt;/g, '</details>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Clean trailing <br> after block elements
        html = html.replace(/(<\/h[1-6]>)<br>/g, '$1');
        html = html.replace(/(<hr class="md-hr">)<br>/g, '$1');
        html = html.replace(/(<\/li>)<br>/g, '$1');
        html = html.replace(/(<\/blockquote>)<br>/g, '$1');
        html = html.replace(/(<\/pre>)<br>/g, '$1');
        html = html.replace(/(<\/details>)<br>/g, '$1');
        html = html.replace(/(<\/div>)<br>/g, '$1');

        return html;
    },

    getFileIcon(language, filename) {
        // Klasör içindeki dosya için folder ikonu kullanma, dosya ikonunu kullan
        const map = {
            html: 'globe', htm: 'globe',
            css: 'palette', scss: 'palette', sass: 'palette', less: 'palette',
            javascript: 'file-code', js: 'file-code',
            typescript: 'file-code', ts: 'file-code', tsx: 'file-code', jsx: 'file-code',
            python: 'terminal', py: 'terminal',
            json: 'braces', java: 'coffee',
            cpp: 'cpu', c: 'cpu', 'c++': 'cpu', h: 'cpu',
            rust: 'settings', rs: 'settings',
            go: 'arrow-right-circle', ruby: 'diamond', rb: 'diamond',
            php: 'server', swift: 'smartphone',
            kotlin: 'smartphone', kt: 'smartphone',
            sql: 'database', bash: 'terminal', sh: 'terminal', shell: 'terminal',
            md: 'file-text', markdown: 'file-text',
            xml: 'file-code', svg: 'image',
            yaml: 'file-text', yml: 'file-text',
        };
        return map[language?.toLowerCase()] || 'file';
    },

    formatFileSize(charCount) {
        if (charCount < 1024) return `${charCount} chars`;
        return `${(charCount / 1024).toFixed(1)} KB`;
    },

    openFileInEditor(filename) {
        // HTML entity'lerini geri çöz (escapeHtml'den gelenler)
        const decoded = filename
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'");

        // Normalize: ./ ve / prefix temizle + sanitize
        let normalizedTarget = decoded.replace(/^\.\//, '').replace(/^\//, '').trim();
        if (Utils.sanitizeFilename) {
            normalizedTarget = Utils.sanitizeFilename(normalizedTarget);
        }

        // 1. Tam eşleşme
        let fileIndex = Editor.files.findIndex(f => {
            const norm = f.filename.replace(/^\.\//, '').replace(/^\//, '');
            return norm === normalizedTarget;
        });

        // 2. Case-insensitive eşleşme
        if (fileIndex < 0) {
            const lowerTarget = normalizedTarget.toLowerCase();
            fileIndex = Editor.files.findIndex(f => {
                const norm = f.filename.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
                return norm === lowerTarget;
            });
        }

        // 3. Fuzzy: sadece dosya adıyla eşleştir (klasör yolu farklı olabilir)
        if (fileIndex < 0) {
            const targetBase = normalizedTarget.includes('/') ? normalizedTarget.split('/').pop() : normalizedTarget;
            const lowerBase = targetBase.toLowerCase();
            fileIndex = Editor.files.findIndex(f => {
                const fBase = f.filename.includes('/') ? f.filename.split('/').pop() : f.filename;
                return fBase.toLowerCase() === lowerBase;
            });
        }

        // 4. Kısmi eşleşme: dosya adı içerme kontrolü
        if (fileIndex < 0) {
            const lowerTarget = normalizedTarget.toLowerCase();
            fileIndex = Editor.files.findIndex(f => {
                return f.filename.toLowerCase().includes(lowerTarget) ||
                       lowerTarget.includes(f.filename.toLowerCase());
            });
        }

        // 5. Sanitize sonrası eşleştir (parseMarkdownWithFileCards sanitize uyguluyor)
        if (fileIndex < 0) {
            const sanitizedTarget = Utils.sanitizeFilename(normalizedTarget).toLowerCase();
            fileIndex = Editor.files.findIndex(f => {
                const sanitizedFile = Utils.sanitizeFilename(f.filename.replace(/^\.\//, '').replace(/^\//, '')).toLowerCase();
                return sanitizedFile === sanitizedTarget ||
                       sanitizedFile.split('/').pop() === sanitizedTarget.split('/').pop();
            });
        }

        if (fileIndex >= 0) {
            Editor.switchTab(fileIndex);
            if (window.innerWidth <= 768) {
                App.showMobilePanel('code');
            }
            Utils.toast(`Opened ${Editor.files[fileIndex].filename}`, 'info', 1500);
        } else {
            // Debug: hangi dosyalar var göster
            console.warn(`[AetherIDE] File not found: "${normalizedTarget}". Available files:`, Editor.files.map(f => f.filename));
            Utils.toast(`File "${decoded}" not found in editor`, 'warning', 2000);
        }
    },

    copyCode(button) {
        const pre = button.closest('.code-block-header')?.nextElementSibling;
        if (!pre) return;

        const code = pre.textContent;
        const onSuccess = () => {
            const original = button.innerHTML;
            button.innerHTML = '<i data-lucide="check"></i> Copied!';
            if (window.lucide) lucide.createIcons({ nodes: [button] });
            setTimeout(() => {
                button.innerHTML = original;
                if (window.lucide) lucide.createIcons({ nodes: [button] });
            }, 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).then(onSuccess).catch(() => {
                Utils.fallbackCopyText(code) ? onSuccess() : Utils.toast('Copy failed', 'error');
            });
        } else {
            Utils.fallbackCopyText(code) ? onSuccess() : Utils.toast('Copy failed', 'error');
        }
    },

    fallbackCopyText(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) {
            return false;
        }
    },

    detectLanguage(code) {
        if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
        if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'javascript';
        if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
        if (code.includes('{') && code.includes(':') && code.includes(';') && !code.includes('function')) return 'css';
        if (code.includes('public class') || code.includes('System.out')) return 'java';
        if (code.includes('#include') || code.includes('int main')) return 'cpp';
        return 'plaintext';
    },

    extractCodeBlocks(text) {
        const blocks = [];
        if (!text) return blocks;

        // Debug: gelen metnin ilk kod bloğu formatını logla
        const debugMatch = text.match(/```[^\n]{0,100}/);
        if (debugMatch) {
            console.log('[extractCodeBlocks] First code fence:', JSON.stringify(debugMatch[0]));
        } else {
            console.log('[extractCodeBlocks] No ``` found in text, length:', text.length);
        }

        // Daha kapsamlı regex:
        // - Dil adından sonra : veya boşluk+: ile dosya adı
        // - Dosya adında harf, rakam, nokta, tire, alt çizgi, slash olabilir
        // - ``` sonrası boşluk toleransı
        // - Satır sonu \r\n ve \n desteği
        // Daha toleranslı regex:
        // - Dil: 1+ word char
        // - Dosya adı: : veya boşluk sonrası, satır sonuna kadar
        // - Kod: ``` kapanışına kadar
        // - Dosya adı opsiyonel
        // match[2] = :ile gelen dosya adı (güvenilir)
        // match[3] = boşlukla gelen dosya adı — sadece dosya uzantısı içeren pattern'ler yakalanır
        //            (örn: "styles.css" evet, "Example usage" hayır)
        // İki aşamalı regex: önce strict (greedy dil + zorunlu newline), başarısızsa fallback
        const primaryRegex = /```\s*(\w+)(?:\s*[:]\s*([^\n\r]+?)|\s+([\w.\/\-]+\.[\w]{1,10}))?\s*\n([\s\S]*?)```/g;
        const fallbackRegex = /```\s*(\w+)(?:\s*[:]\s*([^\n\r]+?))?\s*?\n?([\s\S]*?)```/g;

        // Primary'yi test et
        const primaryTest = new RegExp(primaryRegex.source, primaryRegex.flags);
        const hasPrimaryMatch = primaryTest.test(text);

        let activeRegex, useFallback = false;
        if (hasPrimaryMatch) {
            activeRegex = new RegExp(primaryRegex.source, primaryRegex.flags);
        } else {
            activeRegex = fallbackRegex;
            useFallback = true;
            console.log('[extractCodeBlocks] Primary regex failed, using fallback');
        }

        let match;
        let fileIndex = 0;
        const seenFiles = new Map();

        while ((match = activeRegex.exec(text)) !== null) {
            let language = (match[1] || '').trim().toLowerCase();
            let filename, code;
            if (useFallback) {
                // Fallback: match[2] = dosya adı, match[3] = kod
                filename = (match[2] || '').trim();
                code = match[3] || '';
            } else {
                // Primary: match[2] = :ile gelen, match[3] = boşlukla gelen, match[4] = kod
                filename = (match[2] || match[3] || '').trim();
                code = match[4] || '';
            }

            // Sondaki boşlukları temizle ama yapıyı koru
            code = code.replace(/\s+$/, '');

            if (!code || code.trim().length === 0) continue;

            // Dil alias'larını normalize et
            const langAliases = {
                'js': 'javascript', 'ts': 'typescript', 'py': 'python',
                'rb': 'ruby', 'sh': 'bash', 'shell': 'bash',
                'htm': 'html', 'yml': 'yaml', 'kt': 'kotlin',
                'rs': 'rust', 'cs': 'csharp', 'md': 'markdown',
                'jsx': 'javascript', 'tsx': 'typescript',
                'scss': 'css', 'sass': 'css', 'less': 'css',
            };
            if (langAliases[language]) language = langAliases[language];

            // Dosya adı temizleme
            if (filename) {
                // Baştaki ./ veya / temizle
                filename = filename.replace(/^\.\//, '').replace(/^\//, '');
                // Geçersiz karakterleri temizle (slash'i koru — klasör yolu)
                filename = filename.replace(/[<>"|?*]/g, '');
                // Çift slash temizle
                filename = filename.replace(/\/\//g, '/');
                // Sondaki slash temizle
                filename = filename.replace(/\/$/, '');
                // Boşlukları trim et
                filename = filename.trim();
            }

            // Dosya adı yoksa otomatik oluştur
            if (!filename) {
                fileIndex++;
                const ext = Utils.getExtension(language);

                // Eğer tek dosyalık basit bir bloksa, dile göre mantıklı isim ver
                if (language === 'html') filename = fileIndex === 1 ? 'index.html' : `page${fileIndex}.html`;
                else if (language === 'css') filename = fileIndex === 1 ? 'styles.css' : `styles${fileIndex}.css`;
                else if (language === 'javascript') filename = fileIndex === 1 ? 'script.js' : `script${fileIndex}.js`;
                else if (language === 'python') filename = fileIndex === 1 ? 'main.py' : `script${fileIndex}.py`;
                else filename = `file${fileIndex}.${ext}`;
            }

            // Dosya adı validasyonu — en az bir nokta ve uzantı olmalı
            if (!filename.includes('.')) {
                const ext = Utils.getExtension(language);
                filename = filename + '.' + ext;
            }

            // Sadece uzantı gelmiş olabilir (örn ".js") — düzelt
            if (filename.startsWith('.') && !filename.includes('/')) {
                const ext = filename.slice(1);
                fileIndex++;
                filename = `file${fileIndex}.${ext}`;
            }

            // Aynı dosya tekrar geldiyse güncelle (son hali geçerli)
            seenFiles.set(filename, {
                language: language || Utils.detectLanguage(code),
                filename: filename,
                code: code,
            });
        }

        // Map'ten array'e çevir (sırayı koru) + dosya adı sanitization
        for (const [, block] of seenFiles) {
            block.filename = Utils.sanitizeFilename(block.filename);
            blocks.push(block);
        }

        return blocks;
    },

    getExtension(language) {
        const map = {
            javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
            python: 'py', py: 'py', html: 'html', css: 'css',
            java: 'java', cpp: 'cpp', 'c++': 'cpp', c: 'c',
            rust: 'rs', go: 'go', ruby: 'rb', php: 'php',
            swift: 'swift', kotlin: 'kt', json: 'json',
            yaml: 'yaml', yml: 'yml', sql: 'sql',
            bash: 'sh', shell: 'sh', sh: 'sh',
            markdown: 'md', md: 'md', xml: 'xml', svg: 'svg',
            plaintext: 'txt', text: 'txt', '': 'txt',
        };
        return map[language?.toLowerCase()] || 'txt';
    },

    // ── Kullanıcı dostu hata mesajları ──
    friendlyError(rawError) {
        const msg = typeof rawError === 'string' ? rawError : (rawError?.message || String(rawError));

        const patterns = [
            { match: /no endpoints found/i, friendly: 'This model is currently unavailable. It may be restricted by your privacy settings or temporarily offline.', tip: 'Try a different model, or check your provider\'s privacy settings.' },
            { match: /rate limit/i, friendly: 'You\'re sending requests too quickly. Please wait a moment.', tip: 'Wait 10-30 seconds and try again.' },
            { match: /quota|insufficient.*funds|billing/i, friendly: 'Your API account has run out of credits or quota.', tip: 'Check your API provider dashboard and add credits.' },
            { match: /invalid.*api.*key|unauthorized|401/i, friendly: 'Your API key is invalid or expired.', tip: 'Go to Settings and update your API key.' },
            { match: /forbidden|403/i, friendly: 'Access denied. Your API key may not have permission for this model.', tip: 'Check if your API plan supports this model.' },
            { match: /not found|404/i, friendly: 'The selected model was not found.', tip: 'The model ID may be incorrect. Try selecting a different model.' },
            { match: /timeout|timed?\s*out|ETIMEDOUT/i, friendly: 'The request took too long and timed out.', tip: 'Try again, or use a faster model.' },
            { match: /network|fetch|ERR_NETWORK|Failed to fetch/i, friendly: 'Network error — couldn\'t reach the API server.', tip: 'Check your internet connection and try again.' },
            { match: /context.*length|too.*long|max.*tokens.*exceeded/i, friendly: 'The conversation is too long for this model.', tip: 'Start a new chat, or use a model with a larger context window.' },
            { match: /content.*filter|safety|blocked/i, friendly: 'The response was blocked by the AI\'s safety filter.', tip: 'Try rephrasing your request.' },
            { match: /overloaded|capacity|503|529/i, friendly: 'The AI server is currently overloaded.', tip: 'Wait a minute and try again, or switch to a different model.' },
            { match: /500|internal.*server/i, friendly: 'The AI provider is experiencing internal issues.', tip: 'This is on their end. Try again in a few minutes.' },
            { match: /model.*not.*available|does not exist/i, friendly: 'This model is not available right now.', tip: 'Try a different model from the list.' },
            { match: /JSON|parse|unexpected token/i, friendly: 'Received an unexpected response from the API.', tip: 'Try again. If it persists, try a different model.' },
        ];

        for (const p of patterns) {
            if (p.match.test(msg)) {
                return { friendly: p.friendly, tip: p.tip, raw: msg };
            }
        }

        return { friendly: 'Something went wrong while communicating with the AI.', tip: 'Try again, or switch to a different model.', raw: msg };
    },

    slugify(text) {
        return (text || 'project')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 40) || 'project';
    },

    formatErrorMessage(rawError) {
        const err = this.friendlyError(rawError);
        const errorId = 'err_' + Date.now().toString(36);
        return `**⚠️ ${err.friendly}**

💡 *${err.tip}*

<details><summary>🔍 Show technical details</summary>

\`\`\`
${err.raw}
\`\`\`

</details>`;
    },
};
