const API = {

    abortController: null,

    // ── Provider Tanımları ──
    PROVIDERS: {
        openrouter: {
            id: 'openrouter',
            name: 'OpenRouter',
            icon: 'cloud',
            baseUrl: 'https://openrouter.ai/api/v1',
            keyPlaceholder: 'sk-or-v1-...',
            description: 'Access 200+ models from one API key',
            docsUrl: 'https://openrouter.ai/keys',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AetherIDE',
            }),
            modelsEndpoint: '/models',
            chatEndpoint: '/chat/completions',
        },
        gemini: {
            id: 'gemini',
            name: 'Google Gemini',
            icon: 'sparkles',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            keyPlaceholder: 'AIza...',
            description: 'Direct access to Google Gemini models',
            docsUrl: 'https://aistudio.google.com/apikey',
            headers: () => ({ 'Content-Type': 'application/json' }),
            modelsEndpoint: null,
            chatEndpoint: null,
        },
        openai: {
            id: 'openai',
            name: 'OpenAI',
            icon: 'brain',
            baseUrl: 'https://api.openai.com/v1',
            keyPlaceholder: 'sk-...',
            description: 'Direct access to GPT models',
            docsUrl: 'https://platform.openai.com/api-keys',
            headers: (apiKey) => ({
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }),
            modelsEndpoint: '/models',
            chatEndpoint: '/chat/completions',
        },
        puter: {
            id: 'puter',
            name: 'Puter (Free)',
            icon: 'globe',
            baseUrl: null,
            keyPlaceholder: '',
            description: 'Free AI — no API key required',
            docsUrl: 'https://docs.puter.com/tutorials/free-unlimited-ai',
            headers: () => ({}),
            modelsEndpoint: null,
            chatEndpoint: null,
            noKeyRequired: true,
        },
    },

    // ── Provider-specific Model Listeleri ──
    PROVIDER_MODELS: {
        openrouter: [
            // 🆓 Free Models
            { id: 'cohere/north-mini-code:free', name: 'North Mini Code', price: 'Free', category: 'free' },
            { id: 'nvidia/nemotron-3.5-content-safety:free', name: 'Nemotron 3.5 Safety', price: 'Free', category: 'free', vision: true },
            { id: 'nvidia/nemotron-3-ultra:free', name: 'Nemotron 3 Ultra', price: 'Free', category: 'free' },
            { id: 'nvidia/nemotron-3-nano-omni:free', name: 'Nemotron 3 Nano Omni', price: 'Free', category: 'free', vision: true },
            { id: 'poolside/laguna-xs-2:free', name: 'Laguna XS.2', price: 'Free', category: 'free' },
            { id: 'poolside/laguna-m-1:free', name: 'Laguna M.1', price: 'Free', category: 'free' },
            { id: 'google/gemma-4-26b-a4b:free', name: 'Gemma 4 26B A4B', price: 'Free', category: 'free', vision: true },
            { id: 'google/gemma-4-31b:free', name: 'Gemma 4 31B', price: 'Free', category: 'free', vision: true },
            { id: 'nvidia/nemotron-3-super:free', name: 'Nemotron 3 Super', price: 'Free', category: 'free' },
            { id: 'liquid/lfm2.5-1.2b-thinking:free', name: 'LFM2.5 1.2B Thinking', price: 'Free', category: 'free' },
            { id: 'liquid/lfm2.5-1.2b-instruct:free', name: 'LFM2.5 1.2B Instruct', price: 'Free', category: 'free' },
            { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B', price: 'Free', category: 'free' },
            { id: 'nvidia/nemotron-nano-12b-2-vl:free', name: 'Nemotron Nano 12B VL', price: 'Free', category: 'free', vision: true },

            // 🧠 Thinking Models
            { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', price: '$$', category: 'thinking' },

            // ⭐ Premium Models
            { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash', price: '$$', category: 'premium', vision: true },
            { id: 'google/gemini-3.1-pro', name: 'Gemini 3.1 Pro', price: '$$$', category: 'premium', vision: true },
            { id: 'google/gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', price: '$', category: 'premium', vision: true },
            { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', price: '$$', category: 'premium', vision: true },
            { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', price: '$$$', category: 'premium', vision: true },
            { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', price: '$$$', category: 'premium', vision: true },
            { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', price: '$', category: 'premium', vision: true },
            { id: 'openai/gpt-4o', name: 'GPT-4o', price: '$$$', category: 'premium', vision: true },
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', price: '$', category: 'premium', vision: true },
            { id: 'openai/o3-mini', name: 'o3 Mini', price: '$$', category: 'premium' },
            { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', price: '$', category: 'premium' },
            { id: 'deepseek/deepseek-chat-v3', name: 'DeepSeek V3', price: '$', category: 'premium' },
            { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', price: '$$', category: 'premium' },
            { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', price: '$', category: 'premium' },
            { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', price: '$$', category: 'premium' },
            { id: 'qwen/qwen3-30b-a3b', name: 'Qwen3 30B', price: '$', category: 'premium' },
            { id: 'mistralai/mistral-large', name: 'Mistral Large', price: '$$', category: 'premium' },
            { id: 'x-ai/grok-4.3', name: 'Grok 4.3', price: '$$', category: 'premium' },
            { id: 'x-ai/grok-4.20-reasoning', name: 'Grok 4.20 Reasoning', price: '$$$', category: 'premium' },
            { id: 'qwen/qwen3.5-397b-a17b', name: 'Qwen3.5 397B', price: '$$$', category: 'premium' },
            { id: 'qwen/qwen3.5-plus-02-15', name: 'Qwen3.5 Plus', price: '$$', category: 'premium' },
            { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', price: '$$$', category: 'premium', vision: true },
        ],
        gemini: [
            { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', price: '$$', category: 'latest', vision: true },
            { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', price: '$$$', category: 'latest', vision: true },
            { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', price: '$', category: 'latest', vision: true },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', price: '$$$', category: 'latest', vision: true },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', price: '$$', category: 'latest', vision: true },
            { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', price: '$', category: 'latest', vision: true },
        ],
        openai: [
            { id: 'gpt-4o', name: 'GPT-4o', price: '$$$', category: 'flagship', vision: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: '$', category: 'flagship', vision: true },
            { id: 'o3-mini', name: 'o3 Mini', price: '$$', category: 'reasoning', reasoning: true },
            { id: 'o4-mini', name: 'o4 Mini', price: '$$', category: 'reasoning', reasoning: true },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy)', price: '$', category: 'legacy' },
        ],
        puter: [
            { id: 'gpt-4o', name: 'GPT-4o', price: 'Free', category: 'free', vision: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: 'Free', category: 'free', vision: true },
            { id: 'gpt-4.1', name: 'GPT-4.1', price: 'Free', category: 'free', vision: true },
            { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', price: 'Free', category: 'free', vision: true },
            { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', price: 'Free', category: 'free', vision: true },
            { id: 'o4-mini', name: 'o4 Mini', price: 'Free', category: 'free' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', price: 'Free', category: 'free', vision: true },
            { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', price: 'Free', category: 'free', vision: true },
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', price: 'Free', category: 'free', vision: true },
            { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', price: 'Free', category: 'free', vision: true },
            { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', price: 'Free', category: 'free', vision: true },
            { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', price: 'Free', category: 'free', vision: true },
            { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', price: 'Free', category: 'free', vision: true },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', price: 'Free', category: 'free', vision: true },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', price: 'Free', category: 'free', vision: true },
            { id: 'deepseek-chat', name: 'DeepSeek V3', price: 'Free', category: 'free' },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1', price: 'Free', category: 'free' },
            { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', price: 'Free', category: 'free' },
            { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', price: 'Free', category: 'free' },
            { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B', price: 'Free', category: 'free' },
            { id: 'mistralai/Mistral-Small-24B-Instruct-2501', name: 'Mistral Small 24B', price: 'Free', category: 'free' },
            { id: 'grok-4.3', name: 'Grok 4.3', price: 'Free', category: 'free' },
            { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', price: 'Free', category: 'free', vision: true },
            { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6', price: 'Free', category: 'free', vision: true },
            { id: 'openai/gpt-5.2', name: 'GPT-5.2', price: 'Free', category: 'free' },
            { id: 'openai/gpt-5.2-chat', name: 'GPT-5.2 Chat', price: 'Free', category: 'free' },
            { id: 'openai/gpt-5.2-codex', name: 'GPT-5.2 Codex', price: 'Free', category: 'free' },
            { id: 'openai/gpt-5.2-pro', name: 'GPT-5.2 Pro', price: 'Free', category: 'free' },
            { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', price: 'Free', category: 'free' },
            { id: 'z-ai/glm-5', name: 'GLM 5', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-max-thinking', name: 'Qwen3 Max Thinking', price: 'Free', category: 'free' },
        ],
    },

    // Eski uyumluluk
    get POPULAR_MODELS() {
        return this.getModelsForCurrentProvider();
    },

    getCurrentProvider() {
        const settings = Storage.getSettings();
        return settings.apiProvider || 'openrouter';
    },

    getProviderConfig(providerId) {
        return this.PROVIDERS[providerId || this.getCurrentProvider()];
    },

    getModelsForCurrentProvider() {
        return this.PROVIDER_MODELS[this.getCurrentProvider()] || this.PROVIDER_MODELS.openrouter;
    },

    getApiKey() {
        const settings = Storage.getSettings();
        const provider = this.getCurrentProvider();
        return settings.apiKeys?.[provider] || settings.apiKey || '';
    },

    hasApiKey() {
        // Puter provider'ı API key gerektirmez
        if (this.getCurrentProvider() === 'puter') return true;
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

    async validateApiKey(apiKey, providerId) {
        const pid = providerId || this.getCurrentProvider();
        const provider = this.getProviderConfig(pid);
        if (!provider) return { valid: false, error: 'Unknown provider' };

        // Puter API key gerektirmez
        if (pid === 'puter') {
            const puterReady = typeof puter !== 'undefined' && puter.ai;
            if (puterReady) {
                this.updateConnectionStatus('online');
                return { valid: true };
            }
            this.updateConnectionStatus('error');
            return { valid: false, error: 'Puter SDK not loaded. Refresh the page.' };
        }

        try {
            if (pid === 'gemini') {
                const response = await fetch(`${provider.baseUrl}/models?key=${apiKey}`);
                if (response.ok) { this.updateConnectionStatus('online'); return { valid: true }; }
                this.updateConnectionStatus('error');
                return { valid: false, error: `HTTP ${response.status}` };
            }

            const response = await fetch(`${provider.baseUrl}${provider.modelsEndpoint}`, {
                headers: provider.headers(apiKey),
            });
            if (response.ok) { this.updateConnectionStatus('online'); return { valid: true }; }
            this.updateConnectionStatus('error');
            return { valid: false, error: `HTTP ${response.status}` };
        } catch (error) {
            this.updateConnectionStatus('error');
            return { valid: false, error: error.message };
        }
    },

    async fetchModels() {
        const apiKey = this.getApiKey();
        const provider = this.getCurrentProvider();
        if (!apiKey) return this.getModelsForCurrentProvider();

        try {
            const config = this.getProviderConfig();
            if (provider === 'gemini') {
                const response = await fetch(`${config.baseUrl}/models?key=${apiKey}`);
                if (response.ok) {
                    this.updateConnectionStatus('online');
                    const data = await response.json();
                    return (data.models || []).map(m => ({
                        id: m.name?.replace('models/', '') || m.name,
                        name: m.displayName || m.name,
                        price: '', category: 'available',
                    }));
                }
            } else {
                const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
                    headers: config.headers(apiKey),
                });
                if (response.ok) {
                    const data = await response.json();
                    this.updateConnectionStatus('online');
                    return data.data || this.getModelsForCurrentProvider();
                }
            }
        } catch (e) { console.warn('Could not fetch models:', e); }
        return this.getModelsForCurrentProvider();
    },

    async sendMessage(messages, model, options = {}) {
        const apiKey = this.getApiKey();
        const provider = this.getCurrentProvider();
        if (provider !== 'puter' && !apiKey) throw new Error('API key not set. Go to Settings to add your API key.');
        if (!model) throw new Error('No model selected. Please select a model first.');
        if (!messages || messages.length === 0) throw new Error('No messages to send.');

        console.log(`[API] Sending to ${provider} | model: ${model} | messages: ${messages.length}`);
        this.abortController = new AbortController();

        if (provider === 'puter') return this._sendPuter(messages, model, options);
        if (provider === 'gemini') return this._sendGemini(messages, model, apiKey, options);
        return this._sendOpenAICompat(messages, model, apiKey, options);
    },

    async _sendOpenAICompat(messages, model, apiKey, options = {}) {
        const config = this.getProviderConfig();
        const settings = Storage.getSettings();

        const shouldStream = options.stream !== undefined ? options.stream : (settings.streamResponse !== false);
        const systemMessage = { role: 'system', content: options.systemPrompt || settings.systemPrompt };

        // Vision: görselli mesajları OpenAI vision formatına çevir
        const formattedMessages = messages.map(msg => {
            if (msg.images && msg.images.length > 0) {
                const content = [
                    { type: 'text', text: msg.content },
                    ...msg.images.map(img => ({
                        type: 'image_url',
                        image_url: {
                            url: img.base64,
                            detail: 'auto',
                        },
                    })),
                ];
                return { role: msg.role, content };
            }
            return { role: msg.role, content: msg.content };
        });

        // Reasoning modeller özel parametreler gerektirir
        const isReasoningModel = /^(o1|o3|o4)(-mini|-preview)?$/.test(model) ||
            model.includes('/o1') || model.includes('/o3') || model.includes('/o4');

        const body = {
            model,
            messages: [systemMessage, ...formattedMessages],
            stream: isReasoningModel ? false : shouldStream,
        };

        // Reasoning modeller temperature ve max_tokens desteklemiyor
        if (isReasoningModel) {
            body.max_completion_tokens = options.maxTokens || 16384;
            // reasoning modeller system role'ü desteklemeyebilir — developer role'üne çevir
            if (body.messages[0]?.role === 'system') {
                body.messages[0].role = 'developer';
            }
        } else {
            body.temperature = options.temperature || 0.7;
            body.max_tokens = options.maxTokens || 4096;
        }

        // Stream için SSE options — sadece OpenRouter'da ve reasoning olmayan modellerde
        if (!isReasoningModel && shouldStream && this.getCurrentProvider() === 'openrouter') {
            // Bazı OpenRouter modelleri stream_options desteklemiyor, bu yüzden eklemeyelim
            // OpenRouter zaten varsayılan olarak SSE formatında stream eder
        }

        try {
            const response = await fetch(`${config.baseUrl}${config.chatEndpoint}`, {
                method: 'POST',
                headers: config.headers(apiKey),
                body: JSON.stringify(body),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.updateConnectionStatus('error');
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            this.updateConnectionStatus('online');

            // Gerçekten stream istenip istenmediğini kontrol et (reasoning modellerde zorla kapatılmış olabilir)
            const actuallyStreaming = !isReasoningModel && shouldStream;

            if (actuallyStreaming && response.body) {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('text/event-stream') || contentType.includes('stream') || contentType.includes('octet-stream')) {
                    return this.handleStream(response);
                }
                // Body stream olarak gelmiş olabilir
                return this.handleStream(response);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '';

            // Non-stream yanıt boyut limiti (500KB)
            if (content.length > 512000) {
                console.warn(`[AetherIDE] Response content truncated from ${(content.length / 1024).toFixed(1)}KB to 500KB`);
                content = content.substring(0, 512000) + '\n\n⚠️ *Response truncated — exceeded 500KB limit.*';
            }

            return { content, model: data.model, usage: data.usage, stream: false };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { content: '', aborted: true, stream: false };
            }
            this.updateConnectionStatus('error');
            throw error;
        }
    },

    async _sendGemini(messages, model, apiKey, options = {}) {
        const settings = Storage.getSettings();
        const systemPrompt = options.systemPrompt || settings.systemPrompt;
        const stream = options.stream !== undefined ? options.stream : (settings.streamResponse !== false);

        const contents = messages.map(msg => {
            const parts = [{ text: msg.content }];

            // Gemini vision: görselleri inlineData olarak ekle
            if (msg.images && msg.images.length > 0) {
                for (const img of msg.images) {
                    // base64 data URL'den raw base64'e çevir
                    const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
                    parts.push({
                        inlineData: {
                            mimeType: img.type || 'image/png',
                            data: base64Data,
                        },
                    });
                }
            }

            return {
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts,
            };
        });

        // Gemini 2.5 modelleri yüksek output token destekler
        const isGemini25 = model.includes('2.5') || model.includes('2.0');
        const defaultMaxTokens = isGemini25 ? 65536 : 8192;

        const body = {
            contents,
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || defaultMaxTokens,
            },
        };

        const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}${stream ? '&alt=sse' : ''}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.updateConnectionStatus('error');
                throw new Error(errorData.error?.message || `Gemini Error: ${response.status}`);
            }

            this.updateConnectionStatus('online');

            if (stream && response.body) return this._handleGeminiStream(response);

            const data = await response.json();
            let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Non-stream yanıt boyut limiti (500KB)
            if (content.length > 512000) {
                console.warn(`[AetherIDE] Gemini response content truncated from ${(content.length / 1024).toFixed(1)}KB to 500KB`);
                content = content.substring(0, 512000) + '\n\n⚠️ *Response truncated — exceeded 500KB limit.*';
            }

            return { content, model, stream: false };
        } catch (error) {
            if (error.name === 'AbortError') return { content: '', aborted: true, stream: false };
            this.updateConnectionStatus('error');
            throw error;
        }
    },

    async *_handleGeminiStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const MAX_STREAM_SIZE = 512000; // 500KB
        let totalStreamSize = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Stream boyut limiti kontrolü
                totalStreamSize += value.length;
                if (totalStreamSize > MAX_STREAM_SIZE) {
                    console.warn('[AetherIDE] Gemini stream response truncated at 500KB');
                    yield '\n\n⚠️ *Response truncated — exceeded 500KB stream limit.*';
                    try { reader.cancel(); } catch(e) {}
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (!trimmed.startsWith('data:')) continue;

                    const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                    if (!data || data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield text;

                        const finishReason = parsed.candidates?.[0]?.finishReason;
                        if (finishReason === 'STOP') return;
                    } catch (e) {
                        // Parçalı JSON — skip, sonraki satırda tamamlanacak
                    }
                }
            }

            // Kalan buffer
            if (buffer.trim()) {
                const lines = buffer.trim().split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                    if (!data || data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield text;
                    } catch (e) { /* skip */ }
                }
            }
        } finally {
            try { reader.releaseLock(); } catch (e) {}
        }
    },

    async *handleStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const MAX_STREAM_SIZE = 512000; // 500KB
        let totalStreamSize = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (!value || value.length === 0) continue;

                // Stream boyut limiti kontrolü
                totalStreamSize += value.length;
                if (totalStreamSize > MAX_STREAM_SIZE) {
                    console.warn('[AetherIDE] Stream response truncated at 500KB');
                    yield '\n\n⚠️ *Response truncated — exceeded 500KB stream limit.*';
                    try { reader.cancel(); } catch(e) {}
                    return;
                }

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();

                    if (!trimmed || trimmed.startsWith(':')) continue;

                    if (!trimmed.startsWith('data:')) continue;

                    const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);

                    if (!data || data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);

                        // Error in stream
                        if (parsed.error) {
                            console.error('Stream error:', parsed.error);
                            return;
                        }

                        // Delta content (streaming)
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                            continue;
                        }

                        // Full message (bazı modeller böyle döner)
                        const fullContent = parsed.choices?.[0]?.message?.content;
                        if (fullContent) {
                            yield fullContent;
                            return;
                        }

                        // Finish reason
                        const finishReason = parsed.choices?.[0]?.finish_reason;
                        if (finishReason && finishReason !== 'null') {
                            return;
                        }
                    } catch (parseError) {
                        // Parçalı JSON — bir sonraki satırla birleşecek
                        // Buffer'a geri koymuyoruz, kaybolursa sorun değil
                        // çünkü SSE her satır bağımsızdır
                    }
                }
            }

            // Kalan buffer'ı işle
            if (buffer.trim()) {
                const lines = buffer.trim().split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                    if (!data || data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
                        if (content) yield content;
                    } catch (e) { /* skip */ }
                }
            }
        } finally {
            try { reader.releaseLock(); } catch (e) {}
        }
    },

    // ── Puter AI ──

    async _sendPuter(messages, model, options = {}) {
        if (typeof puter === 'undefined' || !puter.ai) {
            throw new Error('Puter SDK not loaded. Please refresh the page.');
        }

        const settings = Storage.getSettings();
        const systemPrompt = options.systemPrompt || settings.systemPrompt || '';
        const shouldStream = options.stream !== undefined ? options.stream : (settings.streamResponse !== false);

        // Mesajları Puter formatına çevir (OpenAI vision uyumlu)
        const puterMessages = [];
        if (systemPrompt) {
            puterMessages.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
            if (msg.images && msg.images.length > 0) {
                const content = [
                    { type: 'text', text: msg.content },
                    ...msg.images.map(img => ({
                        type: 'image_url',
                        image_url: { url: img.base64 },
                    })),
                ];
                puterMessages.push({ role: msg.role, content });
            } else {
                puterMessages.push({ role: msg.role, content: msg.content });
            }
        }

        try {
            if (shouldStream) {
                return this._handlePuterStream(puterMessages, model);
            }

            // Non-stream
            const response = await puter.ai.chat(puterMessages, {
                model: model,
                stream: false,
            });

            this.updateConnectionStatus('online');

            // Puter yanıt formatı
            let content = '';
            if (typeof response === 'string') {
                content = response;
            } else if (response?.message?.content) {
                content = response.message.content;
            } else if (response?.text) {
                content = response.text;
            } else if (response?.content) {
                content = response.content;
            }

            if (content.length > 512000) {
                content = content.substring(0, 512000) + '\n\n⚠️ *Response truncated — exceeded 500KB limit.*';
            }

            return { content, model, stream: false };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { content: '', aborted: true, stream: false };
            }
            this.updateConnectionStatus('error');
            throw new Error(error.message || 'Puter AI request failed');
        }
    },

    async *_handlePuterStream(messages, model) {
        if (typeof puter === 'undefined' || !puter.ai) {
            throw new Error('Puter SDK not loaded');
        }

        let totalSize = 0;
        const MAX_STREAM_SIZE = 512000;

        try {
            const response = await puter.ai.chat(messages, {
                model: model,
                stream: true,
            });

            this.updateConnectionStatus('online');

            // Puter stream bir async iterable döner
            if (response && typeof response[Symbol.asyncIterator] === 'function') {
                for await (const chunk of response) {
                    // Abort kontrolü
                    if (!this.abortController) return;

                    let text = '';
                    if (typeof chunk === 'string') {
                        text = chunk;
                    } else if (chunk?.text) {
                        text = chunk.text;
                    } else if (chunk?.message?.content) {
                        text = chunk.message.content;
                    } else if (chunk?.delta?.content) {
                        text = chunk.delta.content;
                    } else if (chunk?.choices?.[0]?.delta?.content) {
                        text = chunk.choices[0].delta.content;
                    }

                    if (text) {
                        totalSize += text.length;
                        if (totalSize > MAX_STREAM_SIZE) {
                            yield '\n\n⚠️ *Response truncated — exceeded 500KB stream limit.*';
                            return;
                        }
                        yield text;
                    }
                }
            } else if (response) {
                // Stream desteklenmedi — tek seferde döndü
                let content = '';
                if (typeof response === 'string') {
                    content = response;
                } else if (response?.message?.content) {
                    content = response.message.content;
                } else if (response?.text) {
                    content = response.text;
                }
                if (content) yield content;
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            this.updateConnectionStatus('error');
            throw error;
        }
    },

    abort() {
        if (this.abortController) {
            const controller = this.abortController;
            this.abortController = null;
            try { controller.abort(); } catch(e) {}
        }
    },
};
