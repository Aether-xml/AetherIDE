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
    },

    // ── Provider-specific Model Listeleri ──
    PROVIDER_MODELS: {
        openrouter: [
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
            { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', price: '$$', category: 'thinking' },
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
        gemini: [
            { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', price: '$$', category: 'latest' },
            { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', price: '$$$', category: 'latest' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', price: '$', category: 'stable' },
            { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', price: 'Free', category: 'stable' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', price: '$', category: 'stable' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', price: '$$', category: 'stable' },
        ],
        openai: [
            { id: 'gpt-4o', name: 'GPT-4o', price: '$$$', category: 'flagship' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: '$', category: 'flagship' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', price: '$$$', category: 'flagship' },
            { id: 'o3-mini', name: 'o3 Mini', price: '$$', category: 'reasoning' },
            { id: 'o1-mini', name: 'o1 Mini', price: '$$', category: 'reasoning' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', price: '$', category: 'legacy' },
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
        if (!apiKey) throw new Error('API key not set. Go to Settings to add your API key.');
        if (!model) throw new Error('No model selected. Please select a model first.');
        if (!messages || messages.length === 0) throw new Error('No messages to send.');

        this.abortController = new AbortController();

        if (provider === 'gemini') return this._sendGemini(messages, model, apiKey, options);
        return this._sendOpenAICompat(messages, model, apiKey, options);
    },

    async _sendOpenAICompat(messages, model, apiKey, options = {}) {
        const config = this.getProviderConfig();
        const settings = Storage.getSettings();

        const systemMessage = { role: 'system', content: options.systemPrompt || settings.systemPrompt };
        const body = {
            model,
            messages: [systemMessage, ...messages],
            stream: options.stream !== undefined ? options.stream : (settings.streamResponse !== false),
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
        };

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

            if (body.stream && response.body) {
                return this.handleStream(response);
            }

            const data = await response.json();
            return { content: data.choices?.[0]?.message?.content || '', model: data.model, usage: data.usage, stream: false };
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

        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const body = {
            contents,
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            generationConfig: { temperature: options.temperature || 0.7, maxOutputTokens: options.maxTokens || 4096 },
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
            return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', model, stream: false };
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

        try {
            while (true) {
                let readResult;
                try {
                    readResult = await reader.read();
                } catch (readError) {
                    console.warn('Gemini stream read error:', readError.message);
                    break;
                }

                const { done, value } = readResult;
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // SSE formatı
                    if (trimmed.startsWith('data: ') || trimmed.startsWith('data:')) {
                        const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                        if (data === '[DONE]' || data === '') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) yield text;

                            // Finish reason kontrolü
                            const finishReason = parsed.candidates?.[0]?.finishReason;
                            if (finishReason === 'STOP') return;
                        } catch (e) {
                            // Parçalı JSON — buffer'a geri koy
                            buffer = trimmed + '\n' + buffer;
                        }
                    }
                }
            }

            // Kalan buffer
            if (buffer.trim()) {
                const remaining = buffer.trim();
                if (remaining.startsWith('data: ')) {
                    try {
                        const parsed = JSON.parse(remaining.slice(6));
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield text;
                    } catch (e) { /* skip */ }
                }
            }
        } finally {
            try { reader.releaseLock(); } catch (e) { /* already released */ }
        }
    },

    async *handleStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let retryCount = 0;
        const MAX_RETRIES = 3;
        let totalYielded = 0;
        let emptyChunkCount = 0;
        const MAX_EMPTY_CHUNKS = 50;

        try {
            while (true) {
                let readResult;
                try {
                    const readPromise = reader.read();
                    // 30 saniye read timeout
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Stream read timeout')), 30000)
                    );
                    readResult = await Promise.race([readPromise, timeoutPromise]);
                } catch (readError) {
                    if (readError.message === 'Stream read timeout') {
                        console.warn('Stream read timeout — ending stream');
                        break;
                    }
                    retryCount++;
                    if (retryCount > MAX_RETRIES) throw readError;
                    console.warn(`Stream read error (retry ${retryCount}):`, readError.message);
                    continue;
                }

                const { done, value } = readResult;
                if (done) break;

                retryCount = 0;

                // Boş chunk kontrolü
                if (!value || value.length === 0) {
                    emptyChunkCount++;
                    if (emptyChunkCount > MAX_EMPTY_CHUNKS) {
                        console.warn('Too many empty chunks — ending stream');
                        break;
                    }
                    continue;
                }
                emptyChunkCount = 0;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();

                    if (!trimmed || trimmed.startsWith(':')) continue;
                    if (!trimmed.startsWith('data: ') && !trimmed.startsWith('data:')) continue;

                    const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);

                    if (data === '[DONE]' || data === '') continue;

                    try {
                        const parsed = JSON.parse(data);

                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            totalYielded += content.length;
                            yield content;
                            continue;
                        }

                        const finishReason = parsed.choices?.[0]?.finish_reason;
                        if (finishReason === 'stop' || finishReason === 'end_turn' || finishReason === 'length') {
                            return;
                        }

                        const fullContent = parsed.choices?.[0]?.message?.content;
                        if (fullContent) {
                            yield fullContent;
                            return;
                        }

                        // Error response in stream
                        if (parsed.error) {
                            console.error('Stream error:', parsed.error);
                            return;
                        }
                    } catch (parseError) {
                        // Parçalı JSON — buffer'a geri koy ama sonsuz döngüyü önle
                        if (buffer.length < 10000) {
                            buffer = trimmed + '\n' + buffer;
                        }
                    }
                }

                // Buffer çok büyüdüyse temizle (memory leak önleme)
                if (buffer.length > 50000) {
                    console.warn('Stream buffer overflow — clearing');
                    buffer = '';
                }
            }

            // Kalan buffer
            if (buffer.trim()) {
                const remaining = buffer.trim();
                if (remaining.startsWith('data: ')) {
                    const data = remaining.slice(6);
                    if (data !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
                            if (content) yield content;
                        } catch (e) { /* skip */ }
                    }
                }
            }
        } finally {
            try { reader.releaseLock(); } catch (e) { /* already released */ }
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
