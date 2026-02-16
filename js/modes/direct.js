/* ══════════════════════════════════════════════════════════
   AetherIDE — Direct Mode v2
   Fix: Selamlamalara kod yazmaz, bağlama uygun cevap verir
   ══════════════════════════════════════════════════════════ */

const DirectMode = {

    async send(chat, model) {
        Chat.setGenerating(true);

        const messages = chat.messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        // Stream timeout — takılmayı önle
        let streamTimeout = null;
        const STREAM_TIMEOUT_MS = 30000; // 30 saniye sessizlik = timeout

        const resetStreamTimeout = () => {
            if (streamTimeout) clearTimeout(streamTimeout);
            streamTimeout = setTimeout(() => {
                console.warn('Stream timeout — aborting');
                API.abort();
            }, STREAM_TIMEOUT_MS);
        };

        try {
            const result = await API.sendMessage(messages, model);

            // Stream response
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let fullContent = '';
                let lastCodeUpdate = 0;

                resetStreamTimeout();

                for await (const chunk of result) {
                    fullContent += chunk;
                    resetStreamTimeout();

                    Chat.updateStreamMessage(fullContent);

                    // Editörü throttled güncelle (her 500ms'de bir)
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
            }
            // Normal response
            else if (result && result.content) {
                Chat.addAssistantMessage(result.content);
                if (result.content.includes('```')) {
                    Editor.updateCode(result.content);
                }
            }
            // Aborted
            else if (result && result.aborted) {
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
