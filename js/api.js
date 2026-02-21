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
            { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro Exp (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528 (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 0324 (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-r1-distill-llama-70b:free', name: 'DeepSeek R1 Distill 70B (Free)', price: 'Free', category: 'free' },
            { id: 'deepseek/deepseek-r1-distill-qwen-14b:free', name: 'DeepSeek R1 Distill 14B (Free)', price: 'Free', category: 'free' },
            { id: 'moonshotai/kimi-k2:free', name: 'Kimi K2 (Free)', price: 'Free', category: 'free' },
            { id: 'moonshotai/kimi-dev-72b:free', name: 'Kimi Dev 72B (Free)', price: 'Free', category: 'free' },
            { id: 'moonshotai/kimi-vl-a3b-thinking:free', name: 'Kimi VL Thinking (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen3 235B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen3 30B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-14b:free', name: 'Qwen3 14B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-8b:free', name: 'Qwen3 8B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen3-4b:free', name: 'Qwen3 4B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen2.5 VL 72B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen2.5-vl-32b-instruct:free', name: 'Qwen2.5 VL 32B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen2.5 Coder 32B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen2.5 72B (Free)', price: 'Free', category: 'free' },
            { id: 'qwen/qwq-32b:free', name: 'QwQ 32B (Free)', price: 'Free', category: 'free' },
            { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', price: 'Free', category: 'free' },
            { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 11B Vision (Free)', price: 'Free', category: 'free' },
            { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', price: 'Free', category: 'free' },
            { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B (Free)', price: 'Free', category: 'free' },
            { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', name: 'Nemotron Ultra 253B (Free)', price: 'Free', category: 'free' },
            { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-3n-e2b-it:free', name: 'Gemma 3n E2B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-3n-e4b-it:free', name: 'Gemma 3n E4B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B (Free)', price: 'Free', category: 'free' },
            { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small 3.2 24B (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/mistral-nemo:free', name: 'Mistral Nemo (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', price: 'Free', category: 'free' },
            { id: 'mistralai/devstral-small-2505:free', name: 'Devstral Small (Free)', price: 'Free', category: 'free' },
            { id: 'microsoft/mai-ds-r1:free', name: 'MAI DS R1 (Free)', price: 'Free', category: 'free' },
            { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B (Free)', price: 'Free', category: 'free' },
            { id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', name: 'Dolphin 3.0 R1 (Free)', price: 'Free', category: 'free' },
            { id: 'cognitivecomputations/dolphin3.0-mistral-24b:free', name: 'Dolphin 3.0 (Free)', price: 'Free', category: 'free' },
            { id: 'tencent/hunyuan-a13b-instruct:free', name: 'Hunyuan A13B (Free)', price: 'Free', category: 'free' },
            { id: 'rekaai/reka-flash-3:free', name: 'Reka Flash 3 (Free)', price: 'Free', category: 'free' },
            { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', price: 'Free', category: 'free' },
            { id: 'sarvamai/sarvam-m:free', name: 'Sarvam M (Free)', price: 'Free', category: 'free' },
            { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera (Free)', price: 'Free', category: 'free' },
            { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera (Free)', price: 'Free', category: 'free' },
            { id: 'nousresearch/deephermes-3-llama-3-8b-preview:free', name: 'DeepHermes 3 8B (Free)', price: 'Free', category: 'free' },
            { id: 'shisa-ai/shisa-v2-llama3.3-70b:free', name: 'Shisa V2 70B (Free)', price: 'Free', category: 'free' },
            { id: 'arliai/qwq-32b-arliai-rpr-v1:free', name: 'QwQ 32B ArliAI (Free)', price: 'Free', category: 'free' },
            { id: 'agentica-org/deepcoder-14b-preview:free', name: 'DeepCoder 14B (Free)', price: 'Free', category: 'free' },
            { id: 'featherless/qwerky-72b:free', name: 'Qwerky 72B (Free)', price: 'Free', category: 'free' },

            // 🧠 Thinking Models
            { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', price: '$$', category: 'thinking' },

            // ⭐ Premium Models
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
            { id: 'qwen/qwen3.5-397b-a17b', name: 'Qwen3.5 397B', price: '$$$', category: 'premium' },
            { id: 'qwen/qwen3.5-plus-02-15', name: 'Qwen3.5 Plus', price: '$$', category: 'premium' },
            { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', price: '$$$', category: 'premium' },
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
        puter: [
            { id: 'gpt-4o', name: 'GPT-4o', price: 'Free', category: 'free' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: 'Free', category: 'free' },
            { id: 'gpt-4.1', name: 'GPT-4.1', price: 'Free', category: 'free' },
            { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', price: 'Free', category: 'free' },
            { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', price: 'Free', category: 'free' },
            { id: 'o4-mini', name: 'o4 Mini', price: 'Free', category: 'free' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', price: 'Free', category: 'free' },
            { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', price: 'Free', category: 'free' },
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', price: 'Free', category: 'free' },
            { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', price: 'Free', category: 'free' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', price: 'Free', category: 'free' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', price: 'Free', category: 'free' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', price: 'Free', category: 'free' },
            { id: 'deepseek-chat', name: 'DeepSeek V3', price: 'Free', category: 'free' },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1', price: 'Free', category: 'free' },
            { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', price: 'Free', category: 'free' },
            { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', price: 'Free', category: 'free' },
            { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B', price: 'Free', category: 'free' },
            { id: 'mistralai/Mistral-Small-24B-Instruct-2501', name: 'Mistral Small 24B', price: 'Free', category: 'free' },
            { id: 'grok-3-mini', name: 'Grok 3 Mini', price: 'Free', category: 'free' },
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
        const body = {
            model,
            messages: [systemMessage, ...messages],
            stream: shouldStream,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
        };

        // Stream için SSE format'ını zorla (bazı modeller bunu gerektirir)
        if (shouldStream) {
            body.stream_options = { include_usage: false };
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

            if (shouldStream && response.body) {
                // Content-Type kontrolü — bazı API'ler stream beklenmedik şekilde text/event-stream dönebilir
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('text/event-stream') || contentType.includes('stream')) {
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

        // Mesajları Puter formatına çevir
        const puterMessages = [];
        if (systemPrompt) {
            puterMessages.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
            puterMessages.push({ role: msg.role, content: msg.content });
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
