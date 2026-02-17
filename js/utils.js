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

    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

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
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
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

IMPORTANT: Return ONLY the enhanced prompt, nothing else. No explanations, no prefixes like "Enhanced prompt:".`;

        try {
            const result = await API.sendMessage(
                [{ role: 'user', content: `Enhance this prompt:\n\n${text}` }],
                model,
                {
                    systemPrompt: enhanceSystemPrompt,
                    maxTokens: 500,
                    temperature: 0.7,
                    stream: false,
                }
            );

            if (result?.content) return result.content.trim();
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let content = '';
                for await (const chunk of result) { content += chunk; }
                return content.trim() || text;
            }
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

            if (filename?.trim()) {
                let fname = filename.trim().replace(/^\.\//, '').replace(/^\//, '');
                const iconName = Utils.getFileIcon(langLabel);
                const exists = Editor.files.some(f => f.filename === fname);
                const statusLabel = exists ? 'Updated' : 'Created';
                const statusClass = exists ? 'file-card-updated' : 'file-card-created';
                return `<div class="file-card ${statusClass}" onclick="Utils.openFileInEditor('${Utils.escapeHtml(fname)}')">
                            <div class="file-card-icon"><i data-lucide="${iconName}"></i></div>
                            <div class="file-card-info">
                                <span class="file-card-status">${statusLabel}</span>
                                <span class="file-card-name">${Utils.escapeHtml(fname)}</span>
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
                    const exists = Editor.files.some(f => f.filename === autoName);
                    const statusLabel = exists ? 'Updated' : 'Created';
                    const statusClass = exists ? 'file-card-updated' : 'file-card-created';
                    return `<div class="file-card ${statusClass}" onclick="Utils.openFileInEditor('${autoName}')">
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

        // Devam eden bloklar (stream sırasında)
        html = html.replace(/```\s*(\w*?)(?:\s*:\s*([^\n]*?))?\s*\n([\s\S]*)$/g, (match, lang, filename, code) => {
            const langLabel = lang || 'code';
            const fname = filename?.trim() || '';
            const lineCount = (code?.trim() || '').split('\n').length;
            let displayName = fname || `output.${Utils.getExtension(langLabel)}`;
            // Baştaki ./ temizle
            if (displayName.startsWith('./')) displayName = displayName.slice(2);
            const iconName = Utils.getFileIcon(langLabel);

            const exists = Editor.files.some(f => f.filename === displayName);
            const writingLabel = exists ? 'Updating...' : 'Creating...';
            const writingClass = exists ? 'file-card-updating' : 'file-card-creating';
            return `<div class="file-card writing ${writingClass}">
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

    getFileIcon(language) {
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
        const fileIndex = Editor.files.findIndex(f => f.filename === filename);
        if (fileIndex >= 0) {
            Editor.switchTab(fileIndex);
            if (window.innerWidth <= 768) {
                App.showMobilePanel('code');
            }
            Utils.toast(`Opened ${filename}`, 'info', 1500);
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

        // Daha kapsamlı regex:
        // - Dil adından sonra : veya boşluk+: ile dosya adı
        // - Dosya adında harf, rakam, nokta, tire, alt çizgi, slash olabilir
        // - ``` sonrası boşluk toleransı
        // - Satır sonu \r\n ve \n desteği
        const regex = /```\s*(\w+?)(?:\s*:\s*([^\n\r]+?))?\s*[\r\n]+([\s\S]*?)```/g;
        let match;
        let fileIndex = 0;
        const seenFiles = new Map(); // Aynı dosya birden fazla gelirse son halini al

        while ((match = regex.exec(text)) !== null) {
            let language = (match[1] || '').trim().toLowerCase();
            let filename = (match[2] || '').trim();
            let code = match[3] || '';

            // Sondaki boşlukları temizle ama yapıyı koru
            code = code.replace(/\s+$/, '');

            if (!code || code.length < 3) continue;

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
                // Geçersiz karakterleri temizle
                filename = filename.replace(/[<>"|?*]/g, '');
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

            // Aynı dosya tekrar geldiyse güncelle (son hali geçerli)
            seenFiles.set(filename, {
                language: language || Utils.detectLanguage(code),
                filename: filename,
                code: code,
            });
        }

        // Map'ten array'e çevir (sırayı koru)
        for (const [, block] of seenFiles) {
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
};
