/* ══════════════════════════════════════════════════════════
   AetherIDE — Chat Manager v2
   Console context desteği eklendi
   ══════════════════════════════════════════════════════════ */

const Chat = {

    currentChat: null,
    isGenerating: false,
    _lastSendTime: 0,
    SEND_COOLDOWN: 1000,
    MAX_MESSAGES_PER_CHAT: 200,

    // Typewriter state
    _typewriterQueue: '',
    _typewriterRendered: '',
    _typewriterTimer: null,
    _typewriterActive: false,
    TYPING_SPEEDS: { slow: 18, normal: 8, fast: 2 },

    init() {
        this.bindEvents();
        this.loadLastChat();
        this.initScrollDetection();
    },

    bindEvents() {
        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('message-input');

        // Send click handler'ı sakla — setGenerating'de kullanılacak
        Chat._sendClickHandler = () => Chat.sendMessage();
        sendBtn?.addEventListener('click', Chat._sendClickHandler);

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input?.addEventListener('input', () => {
            // Karakter sınırı kontrolü
            const MAX_LENGTH = 50000;
            if (input.value.length > MAX_LENGTH) {
                input.value = input.value.substring(0, MAX_LENGTH);
                Utils.toast(`Maximum ${(MAX_LENGTH / 1000).toFixed(0)}K characters allowed`, 'warning', 2000);
            }
            Utils.autoResize(input);
            if (sendBtn) sendBtn.disabled = !input.value.trim();

            // Karakter sayacı güncelle
            Utils.updateCharCounter('main-char-counter', input.value.length, MAX_LENGTH);
        });

        document.getElementById('new-chat-btn')?.addEventListener('click', () => {
            this.newChat();
        });

        // Welcome kartları showWelcome() içinde dinamik oluşturulur ve
        // orada event listener eklenir — burada duplicate binding yapmıyoruz
    },

    newChat() {
        // Aktif typewriter'ı durdur
        this._stopTypewriter();

        // Zaten boş sohbet varsa sadece odaklan
        if (this.currentChat && this.currentChat.messages.length === 0) {
            const input = document.getElementById('message-input');
            if (input) input.focus();
            Utils.toast('You already have an empty chat', 'info', 1500);
            return this.currentChat;
        }

        // Team mode aktifken yeni chat → mod kilidini sıfırla
        if (App.currentMode === 'team' && TeamMode.isActive()) {
            TeamMode.phase = 'idle';
            TeamMode.discussionLog = [];
            TeamMode.agreedPlan = '';
            TeamMode.clearAgentActive();
            TeamMode.removeDiscussionStatus();
        }

        // Planner reset
        if (App.currentMode === 'planner') {
            PlannerMode.phase = 'planning';
            PlannerMode.currentPlan = null;
            PlannerMode.thinkingContent = '';
            const actions = document.getElementById('planner-actions');
            if (actions) actions.style.display = 'none';
            const thinkingDisplay = document.getElementById('planner-thinking-display');
            if (thinkingDisplay) thinkingDisplay.style.display = 'none';
        }

        const chat = {
            id: Utils.generateId(),
            title: 'New Chat',
            mode: App.currentMode,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.currentChat = chat;
        Storage.setActiveChatId(chat.id);

        this.showWelcome();
        this.renderHistory();

        // Console temizle
        Editor.clearConsole();

        // Editor dosyalarını ve preview'i temizle
        Editor.files = [];
        Editor.activeFileIndex = 0;
        Editor.renderTabs();
        Editor.renderCode();

        // Preview kapat ve iframe temizle
        const previewContainer = document.getElementById('preview-container');
        const editorWrapper = document.getElementById('code-editor-wrapper');
        if (previewContainer) previewContainer.style.display = 'none';
        if (editorWrapper) editorWrapper.style.display = 'block';
        Editor.previewVisible = false;

        const refreshBtn = document.getElementById('refresh-preview-btn');
        if (refreshBtn) refreshBtn.style.display = 'none';

        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) previewBtn.style.display = 'none';

        const iframe = document.getElementById('preview-iframe');
        if (iframe) iframe.srcdoc = '';

        // Mobil file count badge temizle
        const tabCode = document.getElementById('tab-code');
        if (tabCode) {
            const badge = tabCode.querySelector('.file-count-badge');
            if (badge) badge.remove();
        }

        // Status bar sıfırla
        const linesEl = document.getElementById('statusbar-lines');
        if (linesEl) linesEl.textContent = '0 lines';

        const input = document.getElementById('message-input');
        if (input) {
            input.value = '';
            input.focus();
        }

        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) sendBtn.disabled = true;

        // Mobilde sidebar kapat
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('visible');

        return chat;
    },

    showWelcome() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        container.innerHTML = `
            <div class="welcome-message" id="welcome-message" style="display:flex;">
                <div class="welcome-logo-wrap">
                    <div class="welcome-glow"></div>
                    <img src="assets/icons/icon-192.png" alt="AetherIDE" class="welcome-logo-img">
                </div>
                <h2 class="welcome-title">AetherIDE</h2>
                <p class="welcome-subtitle">Code at the speed of thought</p>
                <div class="welcome-cards">
                    <button class="welcome-card" data-prompt="Build me a responsive landing page with modern design">
                        <i data-lucide="globe" class="card-lucide-icon"></i>
                        <span class="card-text">Landing page</span>
                    </button>
                    <button class="welcome-card" data-prompt="Create a todo app with local storage">
                        <i data-lucide="check-square" class="card-lucide-icon"></i>
                        <span class="card-text">Todo app</span>
                    </button>
                    <button class="welcome-card" data-prompt="Write a Python script that scrapes website data">
                        <i data-lucide="terminal" class="card-lucide-icon"></i>
                        <span class="card-text">Python script</span>
                    </button>
                    <button class="welcome-card" data-prompt="Design a REST API with Express.js">
                        <i data-lucide="server" class="card-lucide-icon"></i>
                        <span class="card-text">REST API</span>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons({ nodes: [container] });

        // Welcome kartlarına event ekle
        container.querySelectorAll('.welcome-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.dataset.prompt;
                const input = document.getElementById('message-input');
                const sendBtn = document.getElementById('send-btn');
                if (prompt && input) {
                    input.value = prompt;
                    Utils.autoResize(input);
                    if (sendBtn) sendBtn.disabled = false;
                    input.focus();
                }
            });
        });
    },

    loadLastChat() {
        const lastId = Storage.getActiveChatId();
        if (lastId) {
            const chat = Storage.getChat(lastId);
            if (chat) {
                this.currentChat = chat;

                // Dosyaları sohbetten geri yükle
                Editor.files = [];
                Editor.activeFileIndex = 0;

                if (chat.messages && chat.messages.length > 0) {
                    for (const msg of chat.messages) {
                        if (msg.role === 'assistant' && msg.content) {
                            const blocks = Utils.extractCodeBlocks(msg.content);
                            for (const block of blocks) {
                                // Dosya boyutu limiti
                                if (block.code && block.code.length > Editor.MAX_FILE_SIZE) {
                                    block.code = block.code.substring(0, Editor.MAX_FILE_SIZE);
                                }
                                const existingIndex = Editor.files.findIndex(f => f.filename === block.filename);
                                if (existingIndex >= 0) {
                                    Editor.files[existingIndex] = block;
                                } else {
                                    // Dosya sayısı limiti
                                    if (Editor.files.length >= Editor.MAX_FILES) continue;
                                    Editor.files.push(block);
                                }
                            }
                        }
                    }
                }

                Editor.renderTabs();
                Editor.renderCode();
                Editor.updateStatusBar();
                Editor.updatePreviewButton();

                // Mobil file badge güncelle
                const tabCode = document.getElementById('tab-code');
                if (tabCode) {
                    let badge = tabCode.querySelector('.file-count-badge');
                    if (Editor.files.length > 0) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'file-count-badge';
                            tabCode.appendChild(badge);
                        }
                        badge.textContent = Editor.files.length;
                    } else if (badge) {
                        badge.remove();
                    }
                }

                this.renderMessages();
                this.renderHistory();
                return;
            }
        }
        this.renderHistory();
    },

    loadChat(chatId) {
        const chat = Storage.getChat(chatId);
        if (!chat) return;

        this.currentChat = chat;
        Storage.setActiveChatId(chatId);
        this.renderMessages();
        this.renderHistory();

        // Sohbetin modunu yükle
        if (chat.mode && Modes[chat.mode]) {
            // Önce mod kilidini bypass et (loadChat'te geçiş her zaman izinli)
            const prevMode = App.currentMode;
            App.currentMode = chat.mode;
            Storage.setLastMode(chat.mode);
            
            // UI'ı güncelle
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === chat.mode);
            });

            const modeNames = { direct: 'Direct', planner: 'Planner', team: 'Team' };
            const modeIcons = { direct: 'zap', planner: 'clipboard-list', team: 'users' };

            const modeDisplay = document.getElementById('current-mode-display');
            if (modeDisplay) {
                modeDisplay.innerHTML = `
                    <i data-lucide="${modeIcons[chat.mode]}" class="topbar-mode-icon"></i>
                    <span class="current-mode-name">${modeNames[chat.mode]}</span>
                `;
                if (window.lucide) lucide.createIcons({ nodes: [modeDisplay] });
            }

            // Status bar removed — skip statusbar-mode update

            // Planner/Team UI
            const plannerEl = document.getElementById('planner-actions');
            const teamEl = document.getElementById('team-agents');
            const plannerSpeedEl = document.getElementById('planner-speed-section');
            if (plannerEl) plannerEl.style.display = 'none';
            if (teamEl) teamEl.style.display = chat.mode === 'team' ? 'flex' : 'none';
            if (plannerSpeedEl) plannerSpeedEl.style.display = chat.mode === 'planner' ? 'block' : 'none';
        }

        // Sohbetteki dosyaları editöre geri yükle
        Editor.files = [];
        Editor.activeFileIndex = 0;

        if (chat.messages && chat.messages.length > 0) {
            for (const msg of chat.messages) {
                if (msg.role === 'assistant' && msg.content) {
                    const blocks = Utils.extractCodeBlocks(msg.content);
                    for (const block of blocks) {
                        // Dosya boyutu limiti
                        if (block.code && block.code.length > Editor.MAX_FILE_SIZE) {
                            block.code = block.code.substring(0, Editor.MAX_FILE_SIZE);
                        }
                        const existingIndex = Editor.files.findIndex(f => f.filename === block.filename);
                        if (existingIndex >= 0) {
                            Editor.files[existingIndex] = block;
                        } else {
                            // Dosya sayısı limiti
                            if (Editor.files.length >= Editor.MAX_FILES) continue;
                            Editor.files.push(block);
                        }
                    }
                }
            }
        }

        Editor.renderTabs();
        Editor.renderCode();
        Editor.updateStatusBar();
        Editor.updatePreviewButton();

        // Preview kapat
        const previewContainer = document.getElementById('preview-container');
        const editorWrapper = document.getElementById('code-editor-wrapper');
        if (previewContainer) previewContainer.style.display = 'none';
        if (editorWrapper) editorWrapper.style.display = 'block';
        Editor.previewVisible = false;

        const refreshBtn = document.getElementById('refresh-preview-btn');
        if (refreshBtn) refreshBtn.style.display = 'none';

        // Mobil file badge güncelle
        const tabCode = document.getElementById('tab-code');
        if (tabCode) {
            let badge = tabCode.querySelector('.file-count-badge');
            if (Editor.files.length > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'file-count-badge';
                    tabCode.appendChild(badge);
                }
                badge.textContent = Editor.files.length;
            } else if (badge) {
                badge.remove();
            }
        }

        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('visible');
    },

    deleteChatById(chatId) {
        Storage.deleteChat(chatId);

        if (this.currentChat?.id === chatId) {
            this.currentChat = null;
            Storage.setActiveChatId(null);
            this.showWelcome();

            // Editor temizle
            Editor.files = [];
            Editor.activeFileIndex = 0;
            Editor.renderTabs();
            Editor.renderCode();
            Editor.updateStatusBar();

            // Preview kapat
            const previewContainer = document.getElementById('preview-container');
            const editorWrapper = document.getElementById('code-editor-wrapper');
            if (previewContainer) previewContainer.style.display = 'none';
            if (editorWrapper) editorWrapper.style.display = 'block';
            Editor.previewVisible = false;
            const refreshBtn = document.getElementById('refresh-preview-btn');
            if (refreshBtn) refreshBtn.style.display = 'none';
            const previewBtn = document.getElementById('preview-btn');
            if (previewBtn) previewBtn.style.display = 'none';

            // Mobil file count badge temizle
            const tabCode = document.getElementById('tab-code');
            if (tabCode) {
                const badge = tabCode.querySelector('.file-count-badge');
                if (badge) badge.remove();
            }
        }

        this.renderHistory();
        Utils.toast('Chat deleted', 'info');
    },

    async sendMessage() {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        let text = input?.value?.trim();

        if (!text || this.isGenerating) return;

        // Rate limit kontrolü (1 saniye)
        const now = Date.now();
        if (now - this._lastSendTime < this.SEND_COOLDOWN) {
            Utils.toast('⏳ Please wait before sending another message', 'warning', 1500);
            return;
        }
        this._lastSendTime = now;

        // Chat mesaj limiti kontrolü (200)
        if (this.currentChat && this.currentChat.messages && this.currentChat.messages.length >= this.MAX_MESSAGES_PER_CHAT) {
            Utils.toast('⚠️ Chat message limit reached (200). Please start a new chat.', 'warning');
            return;
        }

        // Input boyut sınırı (50K karakter — maxlength backup)
        const MAX_INPUT_LENGTH = 50000;
        if (text.length > MAX_INPUT_LENGTH) {
            text = text.substring(0, MAX_INPUT_LENGTH);
            Utils.toast(`Message truncated to ${(MAX_INPUT_LENGTH / 1000).toFixed(0)}K characters`, 'warning', 3000);
        }

        if (text.replace(/[^\w]/g, '').length === 0) {
            Utils.toast('Please type a meaningful message', 'warning', 2000);
            return;
        }

        if (!API.hasApiKey()) {
            Utils.toast('Please add your API key in Settings', 'warning');
            return;
        }

        const model = App.currentModel;
        if (!model) {
            Utils.toast('Please select a model first', 'warning');
            return;
        }

        if (!this.currentChat) {
            this.newChat();
        }

        // Console context'i mesaja ekle
        let enrichedText = text;
        const hasErrors = Editor.consoleLogs.some(l => l.type === 'error');
        const hasWarnings = Editor.consoleLogs.some(l => l.type === 'warn');
        const isFixRequest = /\b(fix|error|bug|broken|crash|not working|doesn'?t work|issue|problem|wrong|fail)\b/i.test(text);

        if (hasErrors || (hasWarnings && isFixRequest) || isFixRequest) {
            const consoleContext = Editor.getConsoleContext();
            if (consoleContext) {
                enrichedText = text + '\n\n' + consoleContext;
            }
        }

        const userMessage = {
            role: 'user',
            content: enrichedText,
            displayContent: text,
            timestamp: new Date().toISOString(),
        };

        this.currentChat.messages.push(userMessage);

        if (this.currentChat.messages.filter(m => m.role === 'user').length === 1) {
            this.currentChat.title = Utils.truncate(text, 35);
        }

        if (input) {
            input.value = '';
            Utils.autoResize(input);
        }
        if (sendBtn) sendBtn.disabled = true;

        this.renderMessages();
        this.forceScrollToBottom();

        try {
            await Modes[App.currentMode].send(this.currentChat, model);
        } catch (error) {
            this.addAssistantMessage(`Error: ${error.message}`);
            Utils.toast(error.message, 'error');
        }

        this.currentChat.updatedAt = new Date().toISOString();
        Storage.saveChat(this.currentChat);
        this.renderHistory();
    },

    addAssistantMessage(content, agentType = 'assistant') {
        if (!this.currentChat) return;

        this.currentChat.messages.push({
            role: 'assistant',
            content: content,
            agentType: agentType,
            timestamp: new Date().toISOString(),
            completed: true,
        });

        // Kod blokları varsa editörü güncelle
        if (content) {
            if (content.includes('```')) {
                Editor.updateCode(content);
            }
        }

        Storage.saveChat(this.currentChat);

        // Typewriter efekti: stream bittikten sonra son mesajı efektli göster
        // Sadece stream response'larda çalışır (non-stream zaten anında gelir)
        // Stream sırasında zaten updateStreamMessage gösteriyor, typewriter sadece
        // non-stream veya stream-sonrası final render için kullanılır
        if (this._isTypingEnabled() && !this._typewriterWasStreaming && agentType === 'assistant') {
            // Önceki mesajları normal render et (son mesaj hariç)
            this._renderMessagesExceptLast();
            this._startTypewriter(content);
        } else {
            this._typewriterWasStreaming = false;
            this.renderMessages();
            this.scrollToBottom(false);
        }
    },

    _renderMessagesExceptLast() {
        const container = document.getElementById('messages-container');
        if (!container || !this.currentChat) return;

        const messages = this.currentChat.messages;
        if (messages.length === 0) return;

        const allButLast = messages.slice(0, -1);
        const welcome = document.getElementById('welcome-message');
        if (welcome) welcome.style.display = 'none';

        let html = '';
        for (const msg of allButLast) {
            const isUser = msg.role === 'user';
            const at = msg.agentType || (isUser ? 'user' : 'assistant');
            const avatarIcons = { user: 'user', assistant: 'bot', designer: 'palette', pm: 'kanban', developer: 'code-2' };
            const userName = Storage.getUserName() || 'You';
            const userColor = Storage.getUserAvatarColor() || 'purple';
            const avatarNames = { user: userName, assistant: 'AetherIDE', designer: 'Designer', pm: 'Project Manager', developer: 'Developer' };
            const displayText = msg.displayContent || msg.content;
            const bodyContent = !isUser ? Utils.parseMarkdownWithFileCards(displayText, false) : Utils.parseMarkdown(displayText);
            const avatarStyle = (isUser && userColor !== 'purple') ? ` data-avatar-color="${userColor}"` : '';

            html += `
                <div class="message">
                    <div class="message-avatar ${at}"${avatarStyle}>
                        <i data-lucide="${avatarIcons[at] || 'bot'}"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${avatarNames[at] || 'AI'}</span>
                            <span class="message-time">${Utils.formatTime(msg.timestamp)}</span>
                        </div>
                        <div class="message-body">${bodyContent}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [container] });
    },

    renderMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        if (!this.currentChat || this.currentChat.messages.length === 0) {
            this.showWelcome();
            return;
        }

        // Welcome gizle
        const welcome = document.getElementById('welcome-message');
        if (welcome) welcome.style.display = 'none';

        let html = '';

        for (const msg of this.currentChat.messages) {
            const isUser = msg.role === 'user';
            const agentType = msg.agentType || (isUser ? 'user' : 'assistant');

            const avatarIcons = {
                user: 'user', assistant: 'bot',
                designer: 'palette', pm: 'kanban', developer: 'code-2',
            };

            const userName = Storage.getUserName() || 'You';
            const userColor = Storage.getUserAvatarColor() || 'purple';
            const avatarNames = {
                user: userName, assistant: 'AetherIDE',
                designer: 'Designer', pm: 'Project Manager', developer: 'Developer',
            };

            const displayText = msg.displayContent || msg.content;

            let bodyContent;
            if (!isUser) {
                const isCompleted = msg.completed !== false;
                bodyContent = Utils.parseMarkdownWithFileCards(displayText, !isCompleted);
            } else {
                bodyContent = Utils.parseMarkdown(displayText);
            }

            const avatarStyle = (isUser && userColor !== 'purple') ? ` data-avatar-color="${userColor}"` : '';
            html += `
                <div class="message">
                    <div class="message-avatar ${agentType}"${avatarStyle}>
                        <i data-lucide="${avatarIcons[agentType] || 'bot'}"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${avatarNames[agentType] || 'AI'}</span>
                            <span class="message-time">${Utils.formatTime(msg.timestamp)}</span>
                        </div>
                        <div class="message-body">${bodyContent}</div>
                    </div>
                </div>
            `;
        }

        if (this.isGenerating) {
            html += `
                <div class="message" id="typing-message">
                    <div class="message-avatar assistant">
                        <i data-lucide="bot"></i>
                    </div>
                    <div class="message-content">
                        <div class="typing-indicator">
                            <div class="typing-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [container] });
    },

    _lastStreamUpdate: 0,
    _streamUpdatePending: null,

    updateStreamMessage(content) {
        // Stream aktif — typewriter'ı devre dışı bırak (stream zaten kendi efektini yapıyor)
        this._typewriterWasStreaming = true;

        const container = document.getElementById('messages-container');
        if (!container) return;

        let streamMsg = document.getElementById('stream-message');

        if (!streamMsg) {
            // Typing indicator'ı kaldır
            const typing = document.getElementById('typing-message');
            if (typing) typing.remove();

            const userName = Storage.getUserName() || 'You';
            const div = document.createElement('div');
            div.className = 'message';
            div.id = 'stream-message';
            div.innerHTML = `
                <div class="message-avatar assistant">
                    <i data-lucide="bot"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">AetherIDE</span>
                        <span class="message-time">${Utils.formatTime(new Date())}</span>
                    </div>
                    <div class="message-body" id="stream-body"></div>
                </div>
            `;
            container.appendChild(div);
            if (window.lucide) lucide.createIcons({ nodes: [div] });

            // İlk chunk geldiğinde hemen render et — gecikme olmasın
            this._renderStreamBody(content);
            this._lastStreamUpdate = Date.now();
            this.scrollToBottom(false);
            return;
        }

        const now = Date.now();
        if (now - this._lastStreamUpdate < 80) {
            if (this._streamUpdatePending) cancelAnimationFrame(this._streamUpdatePending);
            this._streamUpdatePending = requestAnimationFrame(() => {
                this._renderStreamBody(content);
            });
            return;
        }

        this._lastStreamUpdate = now;
        this._renderStreamBody(content);
    },

    _renderStreamBody(content) {
        const body = document.getElementById('stream-body');
        if (!body) return;

        const newHtml = Utils.parseMarkdownWithFileCards(content, true);

        // Mevcut kartların durumunu kaydet (animasyon tekrarını önle)
        const existingCards = new Set();
        body.querySelectorAll('.file-card').forEach(card => {
            const name = card.querySelector('.file-card-name');
            if (name) existingCards.add(name.textContent.trim());
        });

        body.innerHTML = newHtml;

        // Daha önce var olan kartların animasyonunu kaldır
        body.querySelectorAll('.file-card').forEach(card => {
            const name = card.querySelector('.file-card-name');
            if (name && existingCards.has(name.textContent.trim())) {
                card.style.animation = 'none';
            }
        });

        const newCards = body.querySelectorAll('.file-card:not([data-icons-init])');
        if (newCards.length > 0) {
            newCards.forEach(c => c.setAttribute('data-icons-init', '1'));
            if (window.lucide) lucide.createIcons({ nodes: Array.from(newCards) });
        }

        this.scrollToBottom(false);
    },

    _stopHandler: null,

    setGenerating(generating) {
        this.isGenerating = generating;

        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('message-input');
        const indicator = document.getElementById('thinking-indicator');

        // Eski stop handler'ı temizle
        if (this._stopHandler && sendBtn) {
            sendBtn.removeEventListener('click', this._stopHandler);
            this._stopHandler = null;
        }

        if (generating) {
            this.userScrolledUp = false;
            // Typing indicator'ı hemen göster
            this.showTypingIndicator();

            if (sendBtn) {
                sendBtn.innerHTML = '<i data-lucide="square"></i>';
                sendBtn.disabled = false;

                // Yeni stop handler oluştur
                this._stopHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Sadece bir kez çalışsın
                    if (!this.isGenerating) return;
                    API.abort();
                    this.setGenerating(false);
                    Utils.toast('Generation stopped', 'info');
                };
                sendBtn.addEventListener('click', this._stopHandler);
                // onclick'i temizle — addEventListener kullanıyoruz
                sendBtn.onclick = null;
            }
            if (input) input.disabled = true;
            if (indicator) indicator.style.display = 'flex';
        } else {
            if (sendBtn) {
                sendBtn.innerHTML = '<i data-lucide="arrow-up"></i>';
                sendBtn.disabled = !input?.value?.trim();
                sendBtn.onclick = null;

                // Send handler'ı geri koy — önce kaldır, sonra ekle (duplicate önleme)
                sendBtn.removeEventListener('click', Chat._sendClickHandler);
                sendBtn.addEventListener('click', Chat._sendClickHandler);
            }
            if (input) {
                input.disabled = false;
                input.focus();
            }
            if (indicator) indicator.style.display = 'none';

            const typing = document.getElementById('typing-message');
            if (typing) typing.remove();
            const streamMsg = document.getElementById('stream-message');
            if (streamMsg) streamMsg.remove();

            if (Chat._streamUpdatePending) {
                cancelAnimationFrame(Chat._streamUpdatePending);
                Chat._streamUpdatePending = null;
            }
            Chat._lastStreamUpdate = 0;

            // Typewriter temizliği
            if (Chat._typewriterActive) {
                Chat._skipTypewriter();
            }
        }

        if (window.lucide && sendBtn) lucide.createIcons({ nodes: [sendBtn] });
    },

    showTypingIndicator() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        if (document.getElementById('typing-message')) return;

        const div = document.createElement('div');
        div.className = 'message';
        div.id = 'typing-message';
        div.innerHTML = `
            <div class="message-avatar assistant">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
        if (window.lucide) lucide.createIcons({ nodes: [div] });
        this.scrollToBottom(false);
    },

    userScrolledUp: false,

    initScrollDetection() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        container.addEventListener('scroll', () => {
            if (this.isGenerating) {
                const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                this.userScrolledUp = distanceFromBottom > 100;
            }
        }, { passive: true });
    },

    scrollToBottom(force = false) {
        const container = document.getElementById('messages-container');
        if (!container) return;
        if (this.userScrolledUp && !force) return;

        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    },

    forceScrollToBottom() {
        this.userScrolledUp = false;
        const container = document.getElementById('messages-container');
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    },

    renderHistory() {
        const historyEl = document.getElementById('chat-history');
        if (!historyEl) return;

        const chats = Storage.getChats().filter(c => c.messages && c.messages.length > 0);

        if (chats.length === 0) {
            historyEl.innerHTML = `
                <div class="empty-history">
                    <i data-lucide="message-square" class="empty-lucide-icon"></i>
                    <span class="empty-text">No conversations yet</span>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [historyEl] });
            return;
        }

        let html = '';
        for (const chat of chats) {
            const isActive = chat.id === this.currentChat?.id;
            html += `
                <div class="chat-history-item ${isActive ? 'active' : ''}" 
                     onclick="Chat.loadChat('${chat.id}')">
                    <span>${Utils.escapeHtml(chat.title)}</span>
                    <button class="delete-chat" onclick="event.stopPropagation(); Chat.deleteChatById('${chat.id}')" title="Delete">
                        ×
                    </button>
                </div>
            `;
        }

        historyEl.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [historyEl] });
    },

    // ═══ Typewriter Engine ═══

    _isTypingEnabled() {
        const settings = Storage.getSettings();
        return settings.typingEffect?.enabled === true;
    },

    _getTypingSpeed() {
        const settings = Storage.getSettings();
        const speed = settings.typingEffect?.speed || 'normal';
        return this.TYPING_SPEEDS[speed] || this.TYPING_SPEEDS.normal;
    },

    _startTypewriter(fullContent) {
        this._stopTypewriter();

        this._typewriterQueue = fullContent;
        this._typewriterRendered = '';
        this._typewriterActive = true;

        const container = document.getElementById('messages-container');
        if (!container) return;

        // Typing indicator kaldır
        const typing = document.getElementById('typing-message');
        if (typing) typing.remove();

        // Stream mesaj elementi oluştur
        let streamMsg = document.getElementById('stream-message');
        if (!streamMsg) {
            const div = document.createElement('div');
            div.className = 'message';
            div.id = 'stream-message';
            div.innerHTML = `
                <div class="message-avatar assistant">
                    <i data-lucide="bot"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">AetherIDE</span>
                        <span class="message-time">${Utils.formatTime(new Date())}</span>
                    </div>
                    <div class="message-body" id="stream-body"></div>
                </div>
            `;
            container.appendChild(div);
            if (window.lucide) lucide.createIcons({ nodes: [div] });
        }

        this._typewriterTick();
    },

    _typewriterTick() {
        if (!this._typewriterActive) return;

        const remaining = this._typewriterQueue.substring(this._typewriterRendered.length);
        if (remaining.length === 0) {
            this._typewriterActive = false;
            return;
        }

        // Akıllı chunk boyutu — kod bloğu/tag içindeyse daha büyük parçalar al
        let chunkSize = 1;
        const nextChar = remaining[0];

        // Markdown/HTML tag'inin ortasındaysa tamamını al
        if (nextChar === '<') {
            const tagEnd = remaining.indexOf('>');
            if (tagEnd > 0) chunkSize = tagEnd + 1;
        }
        // Kod bloğu açılış/kapanış — ``` satırını komple al
        else if (remaining.startsWith('```')) {
            const lineEnd = remaining.indexOf('\n');
            chunkSize = lineEnd > 0 ? lineEnd + 1 : remaining.length;
        }
        // Escape sequence
        else if (nextChar === '&') {
            const semiEnd = remaining.indexOf(';');
            if (semiEnd > 0 && semiEnd < 8) chunkSize = semiEnd + 1;
        }
        // Boşluk/newline — hızlı geç
        else if (nextChar === ' ' || nextChar === '\n' || nextChar === '\r' || nextChar === '\t') {
            // Ardışık boşlukları tek seferde al
            let i = 0;
            while (i < remaining.length && (remaining[i] === ' ' || remaining[i] === '\n' || remaining[i] === '\r' || remaining[i] === '\t')) i++;
            chunkSize = Math.max(1, i);
        }

        this._typewriterRendered += remaining.substring(0, chunkSize);

        // Body'yi güncelle
        const body = document.getElementById('stream-body');
        if (body) {
            const parsed = Utils.parseMarkdownWithFileCards(this._typewriterRendered, true);
            body.innerHTML = parsed;

            // Yeni file card ikonlarını init et
            const newCards = body.querySelectorAll('.file-card:not([data-icons-init])');
            if (newCards.length > 0) {
                newCards.forEach(c => c.setAttribute('data-icons-init', '1'));
                if (window.lucide) lucide.createIcons({ nodes: Array.from(newCards) });
            }
        }

        this.scrollToBottom(false);

        const delay = this._getTypingSpeed();
        this._typewriterTimer = setTimeout(() => this._typewriterTick(), delay);
    },

    _stopTypewriter() {
        this._typewriterActive = false;
        if (this._typewriterTimer) {
            clearTimeout(this._typewriterTimer);
            this._typewriterTimer = null;
        }
        this._typewriterQueue = '';
        this._typewriterRendered = '';
    },

    _skipTypewriter() {
        // Kalan içeriği anında göster
        if (!this._typewriterActive) return;

        this._typewriterActive = false;
        if (this._typewriterTimer) {
            clearTimeout(this._typewriterTimer);
            this._typewriterTimer = null;
        }

        // Tamamını render et
        const body = document.getElementById('stream-body');
        if (body && this._typewriterQueue) {
            const parsed = Utils.parseMarkdownWithFileCards(this._typewriterQueue, false);
            body.innerHTML = parsed;

            const newCards = body.querySelectorAll('.file-card:not([data-icons-init])');
            if (newCards.length > 0) {
                newCards.forEach(c => c.setAttribute('data-icons-init', '1'));
                if (window.lucide) lucide.createIcons({ nodes: Array.from(newCards) });
            }
        }

        this._typewriterQueue = '';
        this._typewriterRendered = '';
        this.scrollToBottom(false);
    },
};
