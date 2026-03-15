/* ══════════════════════════════════════════════════════════
   AetherIDE — Direct Mode v2
   ══════════════════════════════════════════════════════════ */

const DirectMode = {

    buildFileContext() {
        if (Editor.files.length === 0) return '';

        // Dosyaları öncelik sırasına göre sırala
        const prioritized = this._prioritizeFiles(Editor.files);
        const totalChars = Editor.files.reduce((sum, f) => sum + f.code.length, 0);

        // Token bütçesi: toplam karakter sayısına göre ayarla
        // ~4 karakter = 1 token, modellerin context limiti genelde 128K token
        // Context'e max ~200K karakter ayıralım (dosyalar için)
        const MAX_CONTEXT_CHARS = 200000;

        let context = '\n\n══════ CURRENT PROJECT FILES ══════\n';
        context += `Project: ${Editor.files.length} files, ${(totalChars / 1024).toFixed(1)}KB total\n`;

        // Dosya listesi özeti (her zaman tam liste göster)
        context += '\nFile index:\n';
        for (const file of Editor.files) {
            const lines = file.code.split('\n').length;
            context += `  • ${file.filename} (${file.language}, ${lines} lines)\n`;
        }
        context += '\n';

        let usedChars = 0;

        for (const { file, priority } of prioritized) {
            const lines = file.code.split('\n').length;
            const chars = file.code.length;

            // Bütçe kontrolü
            const remaining = MAX_CONTEXT_CHARS - usedChars;

            if (remaining <= 0) {
                context += `\n⚠️ ${file.filename} — content omitted (context budget exceeded). Request this file specifically if you need to modify it.\n`;
                continue;
            }

            let fileContent;

            if (chars <= remaining) {
                // Tam dosya sığıyor
                fileContent = file.code;
            } else if (remaining > 2000) {
                // Kısmi: başını ve sonunu göster
                const halfBudget = Math.floor(remaining / 2) - 100;
                fileContent = file.code.substring(0, halfBudget)
                    + `\n\n/* ... ${lines - Math.floor(halfBudget / 40)} lines omitted — request full file if modifying this section ... */\n\n`
                    + file.code.substring(file.code.length - halfBudget);
            } else {
                context += `\n⚠️ ${file.filename} (${lines} lines) — content omitted for context budget. Request this file if needed.\n`;
                continue;
            }

            context += `\n📄 ${file.filename} [${file.language}, ${lines} lines, ${priority} priority]:\n\`\`\`${file.language}:${file.filename}\n${fileContent}\n\`\`\`\n`;
            usedChars += fileContent.length;
        }

        context += '══════ END PROJECT FILES ══════\n\n';

        context += `MODIFICATION RULES:
1. Output the COMPLETE file when modifying — every single line, no placeholders.
2. NEVER use "// rest remains same", "// ...", "/* existing code */", or any abbreviation.
3. Use format: \`\`\`language:filename.ext — the system auto-detects create vs update.
4. Preserve existing functionality, style, and conventions unless asked to change them.
5. When adding features, integrate properly — don't break existing imports, references, or event bindings.
6. When a file's content was omitted above, ask the user to provide it or work with what's visible.
7. To delete a file, output ONLY: // [DELETED] as the file content.
8. When merging/restructuring, explicitly delete removed files with the deletion marker.\n`;

        return context;
    },

    /**
     * Dosyaları AI context'i için önceliklendir
     * Aktif dosya, HTML, hata ile ilgili dosyalar önce gelir
     */
    _prioritizeFiles(files) {
        const errorRelated = new Set();

        // Console hatalarından ilgili dosyaları bul
        if (Editor.consoleLogs) {
            const errors = Editor.consoleLogs.filter(l => l.type === 'error');
            for (const err of errors) {
                const related = Editor._findRelatedFile(err.message);
                if (related) {
                    // "_findRelatedFile" bazen " (DOM selector issue...)" ekliyor, temizle
                    const cleanName = related.split(' (')[0];
                    errorRelated.add(cleanName);
                }
            }
        }

        // Son kullanıcı mesajından bahsedilen dosyaları bul
        const mentionedFiles = new Set();
        if (Chat.currentChat?.messages?.length > 0) {
            const lastUserMsg = [...Chat.currentChat.messages].reverse().find(m => m.role === 'user');
            if (lastUserMsg) {
                for (const file of files) {
                    const basename = file.filename.split('/').pop();
                    if (lastUserMsg.content.toLowerCase().includes(basename.toLowerCase())) {
                        mentionedFiles.add(file.filename);
                    }
                }
            }
        }

        const activeFilename = Editor.currentFile?.filename;

        return files.map(file => {
            let priority = 'normal';
            let score = 50; // base score

            // Aktif dosya en yüksek öncelik
            if (file.filename === activeFilename) {
                priority = 'high';
                score = 100;
            }
            // Hata ile ilgili dosyalar
            else if (errorRelated.has(file.filename)) {
                priority = 'high';
                score = 95;
            }
            // Kullanıcının bahsettiği dosyalar
            else if (mentionedFiles.has(file.filename)) {
                priority = 'high';
                score = 90;
            }
            // HTML dosyaları (yapısal öncelik)
            else if (file.language === 'html' || file.filename.endsWith('.html')) {
                priority = 'high';
                score = 80;
            }
            // JS dosyaları (mantık önceliği)
            else if (file.language === 'javascript' || file.filename.endsWith('.js')) {
                score = 70;
            }
            // CSS dosyaları
            else if (file.language === 'css' || file.filename.endsWith('.css')) {
                score = 60;
            }
            // Config dosyaları düşük öncelik
            else if (/\.(json|yaml|yml|toml|env|config)$/i.test(file.filename)) {
                priority = 'low';
                score = 30;
            }
            // Markdown/text düşük
            else if (/\.(md|txt|log)$/i.test(file.filename)) {
                priority = 'low';
                score = 20;
            }

            // Küçük dosyalar bonus (kolay context)
            if (file.code.length < 1000) score += 5;
            // Çok büyük dosyalar penalty
            if (file.code.length > 10000) score -= 10;

            return { file, priority, score };
        }).sort((a, b) => b.score - a.score);
    },

    async send(chat, model) {
        Chat.setGenerating(true);

        const fileContext = this.buildFileContext();
        const settings = Storage.getSettings();

        let systemPrompt = settings.systemPrompt || '';
        if (fileContext) {
            systemPrompt += fileContext;
        }

        // Mesajları API formatına çevir (görseller dahil)
        const messages = [];
        for (const m of chat.messages) {
            if (m.role === 'user' || m.role === 'assistant') {
                const msg = {
                    role: m.role,
                    content: m.content,
                };
                // Görselleri aktar
                if (m.images && m.images.length > 0) {
                    msg.images = m.images;
                }
                messages.push(msg);
            }
        }

        // Mesaj yoksa uyar ve çık
        if (messages.length === 0) {
            Chat.addAssistantMessage('No message to process. Please type something.');
            Chat.setGenerating(false);
            return;
        }

        let streamTimeout = null;
        let stuckCheckInterval = null;
        const STREAM_TIMEOUT_MS = 45000;
        const STUCK_CHECK_MS = 10000;
        let fullContent = '';

        const resetStreamTimeout = () => {
            if (streamTimeout) clearTimeout(streamTimeout);
            streamTimeout = setTimeout(() => {
                console.warn('Stream timeout — aborting');
                API.abort();
                Utils.toast('Response timed out — try again or use a faster model', 'warning');
            }, STREAM_TIMEOUT_MS);
        };

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt,
            });

            if (!result) {
                Chat.addAssistantMessage(Utils.formatErrorMessage('No response received from the AI. The server may be down or the model unavailable.'));
                return;
            }

            if (result.aborted) {
                Utils.toast('Generation stopped', 'info');
                return;
            }

            // Stream response
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let lastCodeUpdate = 0;
                let lastChunkTime = Date.now();
                let lastContentLength = 0;

                resetStreamTimeout();

                // Takılma kontrolü
                stuckCheckInterval = setInterval(() => {
                    const now = Date.now();
                    if (now - lastChunkTime > STUCK_CHECK_MS && fullContent.length === lastContentLength && fullContent.length > 0) {
                        console.warn('Stream appears stuck — aborting');
                        clearInterval(stuckCheckInterval);
                        API.abort();
                    }
                    lastContentLength = fullContent.length;
                }, 5000);

                try {
                    for await (const chunk of result) {
                        if (!chunk) continue;
                        fullContent += chunk;
                        lastChunkTime = Date.now();
                        resetStreamTimeout();

                        Chat.updateStreamMessage(fullContent);

                        // Editörü throttled güncelle — daha hızlı
                        const now = Date.now();
                        if (fullContent.includes('```') && now - lastCodeUpdate > 400) {
                            Editor.updateCode(fullContent);
                            lastCodeUpdate = now;
                        }
                    }
                } catch (streamError) {
                    if (streamError.name === 'AbortError') {
                        // Abort edildi — mevcut içeriği kaydet
                        if (fullContent.trim()) {
                            Utils.toast('Stream interrupted — partial content saved', 'warning');
                        } else {
                            Utils.toast('Generation stopped', 'info');
                        }
                    } else {
                        console.error('Stream iteration error:', streamError);
                        if (!fullContent.trim()) {
                            Chat.addAssistantMessage(Utils.formatErrorMessage(`Stream failed: ${streamError.message}`));
                            if (streamTimeout) clearTimeout(streamTimeout);
                            if (stuckCheckInterval) clearInterval(stuckCheckInterval);
                            return;
                        }
                        // fullContent varsa aşağıda kaydedilecek
                    }
                }

                if (streamTimeout) clearTimeout(streamTimeout);
                if (stuckCheckInterval) clearInterval(stuckCheckInterval);

                if (fullContent.trim()) {
                    Chat.addAssistantMessage(fullContent);
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                }
                // Boş stream — non-stream olarak tekrar dene
                else {
                    console.warn('Stream returned empty — retrying without stream');
                    try {
                        const retryResult = await API.sendMessage(messages, model, {
                            systemPrompt,
                            stream: false,
                        });
                        if (retryResult && retryResult.content) {
                            Chat.addAssistantMessage(retryResult.content);
                            if (retryResult.content.includes('```')) {
                                Editor.updateCode(retryResult.content);
                            }
                        } else {
                            Chat.addAssistantMessage('**Error:** No response from AI. Try a different model.');
                        }
                    } catch (retryError) {
                        if (retryError.name !== 'AbortError') {
                            Chat.addAssistantMessage(Utils.formatErrorMessage(retryError.message));
                        }
                    }
                }

            // Non-stream response
            } else if (result && result.content) {
                fullContent = result.content;
                Chat.addAssistantMessage(result.content);
                if (result.content.includes('```')) {
                    Editor.updateCode(result.content);
                }

            // Beklenmeyen response formatı
            } else {
                console.warn('Unexpected API result format:', result);
                Chat.addAssistantMessage(Utils.formatErrorMessage('Unexpected response format from the API.'));
            }

        } catch (error) {
            if (streamTimeout) clearTimeout(streamTimeout);
            if (stuckCheckInterval) clearInterval(stuckCheckInterval);

            if (error.name === 'AbortError') {
                if (fullContent.trim()) {
                    Chat.addAssistantMessage(fullContent);
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                }
                // Toast zaten _stopHandler'da gösteriliyor
            } else {
                console.error('DirectMode error:', error);
                const errorMsg = error.message || String(error);
                Chat.addAssistantMessage(Utils.formatErrorMessage(errorMsg));
                const friendlyErr = Utils.friendlyError(errorMsg);
                Utils.toast(friendlyErr.friendly, 'error');
            }
        } finally {
            if (streamTimeout) clearTimeout(streamTimeout);
            if (stuckCheckInterval) clearInterval(stuckCheckInterval);
            Chat.setGenerating(false);
        }
    },
};
