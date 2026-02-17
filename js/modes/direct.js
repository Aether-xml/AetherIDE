/* ══════════════════════════════════════════════════════════
   AetherIDE — Direct Mode v2
   Fix: Selamlamalara kod yazmaz, bağlama uygun cevap verir
   ══════════════════════════════════════════════════════════ */

const DirectMode = {

    // Mevcut dosya bağlamını oluştur
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

        // Dosya bağlamını ekle
        const fileContext = this.buildFileContext();
        const settings = Storage.getSettings();

        let systemPrompt = settings.systemPrompt || '';
        if (fileContext) {
            systemPrompt += fileContext;
        }

        const messages = chat.messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        let streamTimeout = null;
        const STREAM_TIMEOUT_MS = 30000;

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

            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let fullContent = '';
                let lastCodeUpdate = 0;

                resetStreamTimeout();

                for await (const chunk of result) {
                    fullContent += chunk;
                    resetStreamTimeout();

                    Chat.updateStreamMessage(fullContent);

                    const now = Date.now();
                    if (fullContent.includes('```') && now - lastCodeUpdate > 500) {
                        Editor.updateCode(fullContent);
                        lastCodeUpdate = now;
                    }
                }

                if (streamTimeout) clearTimeout(streamTimeout);

                if (fullContent) {
                    Chat.addAssistantMessage(fullContent);
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                }
            } else if (result && result.content) {
                Chat.addAssistantMessage(result.content);
                if (result.content.includes('```')) {
                    Editor.updateCode(result.content);
                }
            } else if (result && result.aborted) {
                Utils.toast('Generation stopped', 'info');
            }

        } catch (error) {
            if (streamTimeout) clearTimeout(streamTimeout);
            if (error.name === 'AbortError') {
                Utils.toast('Generation stopped', 'info');
            } else {
                Chat.addAssistantMessage(`**Error:** ${error.message}`);
                Utils.toast(error.message, 'error');
            }
        } finally {
            if (streamTimeout) clearTimeout(streamTimeout);
            Chat.setGenerating(false);
        }
    },
};
