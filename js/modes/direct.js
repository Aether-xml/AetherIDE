/* ══════════════════════════════════════════════════════════
   AetherIDE — Direct Mode v2
   ══════════════════════════════════════════════════════════ */

const DirectMode = {

    buildFileContext() {
        if (Editor.files.length === 0) return '';

        let context = '\n\n--- CURRENT PROJECT FILES ---\n';
        context += `Total files: ${Editor.files.length}\n`;

        for (const file of Editor.files) {
            const lines = file.code.split('\n').length;
            const chars = file.code.length;
            const preview = chars > 3000
                ? file.code.substring(0, 3000) + '\n... (truncated, full file has ' + lines + ' lines)'
                : file.code;
            context += `\n📄 ${file.filename} (${file.language}, ${lines} lines, ${chars} chars):\n\`\`\`${file.language}:${file.filename}\n${preview}\n\`\`\`\n`;
        }

        context += '--- END PROJECT FILES ---\n\n';
        context += `CRITICAL RULES FOR MODIFYING EXISTING FILES:
1. When updating a file, you MUST output the COMPLETE file content — every single line.
2. NEVER use placeholders like "// rest of code remains same", "// ...", "/* existing code */", or "// unchanged".
3. NEVER skip, abbreviate, or summarize any part of the code.
4. Use the exact format: \`\`\`language:filename.ext
5. If you only need to change 2 lines in a 200-line file, you must still output all 200 lines.
6. For new files, use the same format. The system will auto-detect create vs update.
7. Files can include folder paths like: \`\`\`javascript:src/utils/helpers.js
8. Maintain the same coding style, indentation, and conventions as the existing code.
9. Preserve all existing functionality unless explicitly asked to remove it.
10. When adding features, integrate them properly with existing code — don't break imports, references, or event bindings.

ERROR FIXING RULES (when console errors are present):
11. READ the console errors carefully — they show the exact error message, line info, and stack trace.
12. Identify the ROOT CAUSE, not just the symptom. Trace the error back to its origin.
13. Check for: typos in variable/function names, missing DOM elements, incorrect selectors, undefined variables, timing issues (DOM not ready), missing event listeners, incorrect file references.
14. When fixing, explain briefly WHAT caused the error and HOW you fixed it before the code block.
15. If multiple errors exist, fix ALL of them in one response — don't leave any behind.
16. After fixing, make sure the fix doesn't break other functionality.
17. If an error mentions a specific line number, pay extra attention to that area and its surrounding code.
18. Common patterns: "X is not defined" → check spelling and scope; "Cannot read property of null" → element doesn't exist or script runs before DOM; "Unexpected token" → syntax error, check brackets/quotes.\n`;

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
                Chat.addAssistantMessage(Utils.formatErrorMessage(error.message));
                const friendly = Utils.friendlyError(error.message);
                Utils.toast(friendly.friendly, 'error');
            }
        } finally {
            if (streamTimeout) clearTimeout(streamTimeout);
            if (stuckCheckInterval) clearInterval(stuckCheckInterval);
            Chat.setGenerating(false);
        }
    },
};
