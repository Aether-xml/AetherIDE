/* ══════════════════════════════════════════════════════════
   AetherIDE — Chat Manager v2
   Console context desteği eklendi
   ══════════════════════════════════════════════════════════ */

const Chat = {

    currentChat: null,
    isGenerating: false,

    init() {
        this.bindEvents();
        this.loadLastChat();
        this.initScrollDetection();
    },

    bindEvents() {
        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('message-input');

        sendBtn?.addEventListener('click', () => this.sendMessage());

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input?.addEventListener('input', () => {
            Utils.autoResize(input);
            sendBtn.disabled = !input.value.trim();
        });

        document.getElementById('new-chat-btn')?.addEventListener('click', () => {
            this.newChat();
        });

        document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
            if (this.currentChat) {
                this.currentChat.messages = [];
                Storage.saveChat(this.currentChat);
                this.renderMessages();
                Utils.toast('Chat cleared', 'info');
            }
        });

        document.querySelectorAll('.welcome-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.dataset.prompt;
                if (prompt && input) {
                    input.value = prompt;
                    Utils.autoResize(input);
                    sendBtn.disabled = false;
                    input.focus();
                }
            });
        });
    },

    newChat() {
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

        // Welcome sayfasını göster
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

        document.getElementById('send-btn').disabled = true;

        // Mobilde sidebar kapat
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('visible');

        return chat;
    },

    // Welcome sayfasını göster
    showWelcome() {
        const container = document.getElementById('messages-container');
        const welcome = document.getElementById('welcome-message');
        if (!container) return;

        container.innerHTML = '';

        if (welcome) {
            // Welcome element'i klonla (DOM'dan kaldırılmış olabilir)
            welcome.style.display = 'flex';
            container.appendChild(welcome);
            if (window.lucide) lucide.createIcons({ nodes: [welcome] });
        } else {
            // Welcome element yoksa yeniden oluştur
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
                    if (prompt && input) {
                        input.value = prompt;
                        Utils.autoResize(input);
                        document.getElementById('send-btn').disabled = false;
                        input.focus();
                    }
                });
            });
        }
    },

    loadLastChat() {
        const lastId = Storage.getActiveChatId();
        if (lastId) {
            const chat = Storage.getChat(lastId);
            if (chat) {
                this.currentChat = chat;
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
            App.setMode(chat.mode);
        }

        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('visible');
    },

    deleteChatById(chatId) {
        Storage.deleteChat(chatId);

        if (this.currentChat?.id === chatId) {
            this.currentChat = null;
            Storage.setActiveChatId(null);
            this.renderMessages();
        }

        this.renderHistory();
        Utils.toast('Chat deleted', 'info');
    },

    async sendMessage() {
        const input = document.getElementById('message-input');
        let text = input?.value?.trim();

        if (!text || this.isGenerating) return;

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

        // Console context'i mesaja ekle (hata varsa)
        const consoleContext = Editor.getConsoleContext();
        const hasErrors = Editor.consoleLogs.some(l => l.type === 'error');
        
        let enrichedText = text;
        if (hasErrors && consoleContext) {
            enrichedText = text + '\n\n' + consoleContext;
        }

        const userMessage = {
            role: 'user',
            content: enrichedText,
            displayContent: text, // UI'da gösterilecek temiz metin
            timestamp: new Date().toISOString(),
        };

        this.currentChat.messages.push(userMessage);

        if (this.currentChat.messages.length === 1) {
            this.currentChat.title = Utils.truncate(text, 35);
        }

        input.value = '';
        Utils.autoResize(input);
        document.getElementById('send-btn').disabled = true;

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
        });

        Storage.saveChat(this.currentChat);
        this.renderMessages();
        this.scrollToBottom(false);
    },

    renderMessages() {
        const container = document.getElementById('messages-container');
        const welcome = document.getElementById('welcome-message');
        if (!container) return;

        if (!this.currentChat || this.currentChat.messages.length === 0) {
            this.showWelcome();
            return;
        }

        if (welcome) welcome.style.display = 'none';

        let html = '';

        for (const msg of this.currentChat.messages) {
            const isUser = msg.role === 'user';
            const agentType = msg.agentType || (isUser ? 'user' : 'assistant');

            const avatarIcons = {
                user: 'user', assistant: 'bot',
                designer: 'palette', pm: 'kanban', developer: 'code-2',
            };

            const avatarNames = {
                user: 'You', assistant: 'AetherIDE',
                designer: 'Designer', pm: 'Project Manager', developer: 'Developer',
            };

            // UI'da gösterilecek metni kullan (console context olmadan)
            const displayText = msg.displayContent || msg.content;

            let bodyContent;
            if (!isUser) {
                bodyContent = Utils.parseMarkdownWithFileCards(displayText);
            } else {
                bodyContent = Utils.parseMarkdown(displayText);
            }

            html += `
                <div class="message">
                    <div class="message-avatar ${agentType}">
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

    updateStreamMessage(content) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        let streamMsg = document.getElementById('stream-message');

        if (!streamMsg) {
            const typing = document.getElementById('typing-message');
            if (typing) typing.remove();

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

        const body = document.getElementById('stream-body');
        if (body) {
            body.innerHTML = Utils.parseMarkdownWithFileCards(content, true);
            if (window.lucide) lucide.createIcons({ nodes: [body] });
        }

        this.scrollToBottom(false);
    },

    setGenerating(generating) {
        this.isGenerating = generating;

        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('message-input');
        const indicator = document.getElementById('thinking-indicator');

        if (generating) {
            this.userScrolledUp = false;
            if (sendBtn) {
                sendBtn.innerHTML = '<i data-lucide="square"></i>';
                sendBtn.disabled = false;
                sendBtn.onclick = () => {
                    API.abort();
                    this.setGenerating(false);
                };
            }
            if (input) input.disabled = true;
            if (indicator) indicator.style.display = 'flex';

            // Typing indicator'ı hemen ekle
            this.showTypingIndicator();
        } else {
            if (sendBtn) {
                sendBtn.innerHTML = '<i data-lucide="arrow-up"></i>';
                sendBtn.disabled = !input?.value?.trim();
                sendBtn.onclick = () => Chat.sendMessage();
            }
            if (input) {
                input.disabled = false;
                input.focus();
            }
            if (indicator) indicator.style.display = 'none';

            // Typing ve stream mesajlarını temizle
            const typing = document.getElementById('typing-message');
            if (typing) typing.remove();
            const streamMsg = document.getElementById('stream-message');
            if (streamMsg) streamMsg.remove();
        }

        if (window.lucide && sendBtn) lucide.createIcons({ nodes: [sendBtn] });
    },

    showTypingIndicator() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Zaten varsa ekleme
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
};
