/* ══════════════════════════════════════════════════════════
   AetherIDE — Direct Mode v2
   ══════════════════════════════════════════════════════════ */

const DirectMode = {

    buildFileContext() {
        if (Editor.files.length === 0) return '';

        let context = '\n\n--- CURRENT PROJECT FILES ---\n';
        for (const file of Editor.files) {
            const preview = file.code.length > 2000
                ? file.code.substring(0, 2000) + '\n... (truncated)'
                : file.code;
            context += `\n📄 ${file.filename} (${file.language}):\n\`\`\`${file.language}:${file.filename}\n${preview}\n\`\`\`\n`;
        }
        context += '--- END PROJECT FILES ---\n';
        context += '\nIMPORTANT: When modifying existing files, output the COMPLETE updated file content using the same ```language:filename format. Do not skip unchanged parts. Do not use comments like "// rest of code remains same". Always write the full file.\n';
        return context;
    },

    async send(chat, model) {
        Chat.setGenerating(true);

        const fileContext = this.buildFileContext();
        const settings = Storage.getSettings();

        let systemPrompt = settings.systemPrompt || '';
        if (fileContext) {
            systemPrompt += fileContext;
        }

        // Mesajları API formatına çevir
        const messages = [];
        for (const m of chat.messages) {
            if (m.role === 'user' || m.role === 'assistant') {
                messages.push({
                    role: m.role,
                    content: m.content,
                });
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
            }, STREAM_TIMEOUT_MS);
        };

        try {
            const result = await API.sendMessage(messages, model, {
                systemPrompt,
            });

            // result kontrolü — null/undefined/aborted
            if (!result) {
                Chat.addAssistantMessage('**Error:** No response received from AI. Please try again.');
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

                        // Editörü throttled güncelle
                        const now = Date.now();
                        if (fullContent.includes('```') && now - lastCodeUpdate > 800) {
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
                            Chat.addAssistantMessage(`**Error:** Stream failed: ${streamError.message}`);
                            return;
                        }
                    }
                }

                if (streamTimeout) clearTimeout(streamTimeout);
                if (stuckCheckInterval) clearInterval(stuckCheckInterval);

                if (fullContent.trim()) {
                    Chat.addAssistantMessage(fullContent);
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                } else {
                    Chat.addAssistantMessage('**Error:** Empty response from AI. Please try again.');
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
                Chat.addAssistantMessage('**Error:** Unexpected response format. Please try again or switch models.');
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
                    Utils.toast('Stream interrupted — partial content saved', 'warning');
                } else {
                    Utils.toast('Generation stopped', 'info');
                }
            } else {
                console.error('DirectMode error:', error);
                Chat.addAssistantMessage(`**Error:** ${error.message}`);
                Utils.toast(error.message, 'error');
            }
        } finally {
            if (streamTimeout) clearTimeout(streamTimeout);
            if (stuckCheckInterval) clearInterval(stuckCheckInterval);
            Chat.setGenerating(false);
        }
    },
};
