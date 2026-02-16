/* ══════════════════════════════════════════════════════════
   AetherIDE — OpenRouter API Manager v2
   ══════════════════════════════════════════════════════════ */

const API = {

    BASE_URL: 'https://openrouter.ai/api/v1',
    abortController: null,

    // Güncellenmiş model listesi (Free + Thinking modeller dahil)
    POPULAR_MODELS: [
        // ── Free Models ──
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', price: 'Free', category: 'free' },
        { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528 (Free)', price: 'Free', category: 'free' },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', price: 'Free', category: 'free' },
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B (Free)', price: 'Free', category: 'free' },
        { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B v2 (Free)', price: 'Free', category: 'free' },
        { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash (Free)', price: 'Free', category: 'free' },
        { id: 'z-ai/glm-4-5-air:free', name: 'GLM 4.5 Air (Free)', price: 'Free', category: 'free' },
        { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large Preview (Free)', price: 'Free', category: 'free' },
        { id: 'arcee-ai/trinity-mini:free', name: 'Trinity Mini (Free)', price: 'Free', category: 'free' },
        { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B (Free)', price: 'Free', category: 'free' },

        // ── Thinking Models ──
        { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', price: '$$', category: 'thinking' },

        // ── Premium Models ──
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', price: '$$', category: 'premium' },
        { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', price: '$$$', category: 'premium' },
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', price: '$$$', category: 'premium' },
        { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', price: '$', category: 'premium' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', price: '$$$', category: 'premium' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', price: '$', category: 'premium' },
        { id: 'openai/o3-mini', name: 'o3 Mini', price: '$$', category: 'premium' },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', price: '$', category: 'premium' },
        { id: 'deepseek/deepseek-chat-v3', name: 'DeepSeek V3', price: '$', category: 'premium' },
        { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', price: '$$', category: 'premium' },
        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', price: '$', category: 'premium' },
        { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', price: '$$', category: 'premium' },
        { id: 'qwen/qwen3-30b-a3b', name: 'Qwen3 30B', price: '$', category: 'premium' },
        { id: 'mistralai/mistral-large', name: 'Mistral Large', price: '$$', category: 'premium' },
        { id: 'x-ai/grok-3-mini-beta', name: 'Grok 3 Mini', price: '$$', category: 'premium' },
    ],

    getApiKey() {
        const settings = Storage.getSettings();
        return settings.apiKey || '';
    },

    hasApiKey() {
        return this.getApiKey().length > 0;
    },

    updateConnectionStatus(status) {
        const dot = document.querySelector('#connection-status .status-dot');
        if (!dot) return;
        dot.className = 'status-dot';
        if (status === 'online') dot.classList.add('online');
        else if (status === 'error') dot.classList.add('error');
        else dot.classList.add('offline');
    },

    async validateApiKey(apiKey) {
        try {
            const response = await fetch(`${this.BASE_URL}/models`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (response.ok) {
                this.updateConnectionStatus('online');
                return { valid: true };
            } else {
                this.updateConnectionStatus('error');
                return { valid: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            return { valid: false, error: error.message };
        }
    },

    async fetchModels() {
        const apiKey = this.getApiKey();
        if (!apiKey) return this.POPULAR_MODELS;
        try {
            const response = await fetch(`${this.BASE_URL}/models`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (response.ok) {
                const data = await response.json();
                this.updateConnectionStatus('online');
                return data.data || this.POPULAR_MODELS;
            }
        } catch (e) {
            console.warn('Could not fetch models:', e);
        }
        return this.POPULAR_MODELS;
    },

    async sendMessage(messages, model, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key not set. Go to Settings to add your OpenRouter API key.');
        }

        this.abortController = new AbortController();
        const settings = Storage.getSettings();

        const systemMessage = {
            role: 'system',
            content: options.systemPrompt || settings.systemPrompt,
        };

        const body = {
            model: model,
            messages: [systemMessage, ...messages],
            stream: options.stream !== undefined ? options.stream : (settings.streamResponse !== false),
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
        };

        try {
            const response = await fetch(`${this.BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'AetherIDE',
                },
                body: JSON.stringify(body),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.updateConnectionStatus('error');
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            this.updateConnectionStatus('online');

            if (body.stream && response.body) {
                try {
                    return this.handleStream(response);
                } catch (streamError) {
                    console.warn('Stream failed, falling back:', streamError);
                }
            }

            const data = await response.json();
            return {
                content: data.choices?.[0]?.message?.content || '',
                model: data.model,
                usage: data.usage,
                stream: false,
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return { content: '', aborted: true, stream: false };
            }
            this.updateConnectionStatus('error');
            throw error;
        }
    },

    async *handleStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    const data = trimmed.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) yield content;
                    } catch (e) { /* skip */ }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    },
};