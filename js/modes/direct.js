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

        try {
            const result = await API.sendMessage(messages, model);

            // Stream response
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                let fullContent = '';

                for await (const chunk of result) {
                    fullContent += chunk;
                    Chat.updateStreamMessage(fullContent);

                    // Sadece kod bloğu varsa editörü güncelle
                    if (fullContent.includes('```')) {
                        Editor.updateCode(fullContent);
                    }
                }

                if (fullContent) {
                    Chat.addAssistantMessage(fullContent);
                    // Son halinde kod varsa editörü güncelle
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
            Chat.addAssistantMessage(`**Error:** ${error.message}`);
            Utils.toast(error.message, 'error');
        } finally {
            Chat.setGenerating(false);
        }
    },
};