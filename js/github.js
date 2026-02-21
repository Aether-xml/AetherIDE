/* ══════════════════════════════════════════════════════════
   AetherIDE — GitHub Integration v1
   Client-side GitHub API · Personal Access Token
   ══════════════════════════════════════════════════════════ */

const GitHub = {

    API_BASE: 'https://api.github.com',

    // ── Token Yönetimi ──

    getToken() {
        const settings = Storage.getSettings();
        return settings.githubToken || '';
    },

    hasToken() {
        return !!this.getToken().trim();
    },

    async validateToken() {
        const token = this.getToken();
        if (!token) return { valid: false, error: 'No token configured' };

        try {
            const res = await this._request('GET', '/user');
            return {
                valid: true,
                user: res.login,
                name: res.name || res.login,
                avatar: res.avatar_url,
            };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    },

    // ── Repo İşlemleri ──

    async listRepos() {
        const repos = await this._request('GET', '/user/repos', null, {
            sort: 'updated',
            per_page: 30,
            affiliation: 'owner',
        });
        return repos.map(r => ({
            name: r.name,
            fullName: r.full_name,
            private: r.private,
            url: r.html_url,
            defaultBranch: r.default_branch,
            updatedAt: r.updated_at,
        }));
    },

    async createRepo(name, options = {}) {
        const body = {
            name: name,
            description: options.description || 'Created with AetherIDE',
            private: options.isPrivate !== false,
            auto_init: false,
        };

        try {
            const res = await this._request('POST', '/user/repos', body);
            return {
                success: true,
                name: res.name,
                fullName: res.full_name,
                url: res.html_url,
                defaultBranch: res.default_branch || 'main',
            };
        } catch (e) {
            if (e.message.includes('422') || e.message.includes('name already exists')) {
                return { success: false, error: 'Repository name already exists' };
            }
            throw e;
        }
    },

    async repoExists(owner, repo) {
        try {
            await this._request('GET', `/repos/${owner}/${repo}`);
            return true;
        } catch (e) {
            if (e.message.includes('404')) return false;
            throw e;
        }
    },

    // ── Push İşlemi (Git Data API) ──

    async pushFiles(owner, repo, files, commitMessage, branch = 'main') {
        if (!files || files.length === 0) {
            throw new Error('No files to push');
        }

        // Dosya boyutu kontrolü
        const totalSize = files.reduce((sum, f) => sum + (f.code?.length || 0), 0);
        if (totalSize > 10 * 1024 * 1024) {
            throw new Error('Total file size exceeds 10MB limit');
        }

        let baseSha = null;
        let baseTreeSha = null;

        // 1. Mevcut branch'in son commit'ini al (varsa)
        try {
            const ref = await this._request('GET', `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
            baseSha = ref.object.sha;
            const commit = await this._request('GET', `/repos/${owner}/${repo}/git/commits/${baseSha}`);
            baseTreeSha = commit.tree.sha;
        } catch (e) {
            // Repo boş — ilk commit olacak
            baseSha = null;
            baseTreeSha = null;
        }

        // 2. Her dosya için blob oluştur
        const treeItems = [];
        for (const file of files) {
            if (!file.code && file.code !== '') continue;

            const blob = await this._request('POST', `/repos/${owner}/${repo}/git/blobs`, {
                content: file.code,
                encoding: 'utf-8',
            });

            treeItems.push({
                path: file.filename.replace(/^\.\//, '').replace(/^\//, ''),
                mode: '100644',
                type: 'blob',
                sha: blob.sha,
            });
        }

        if (treeItems.length === 0) {
            throw new Error('No valid files to commit');
        }

        // 3. Tree oluştur
        const treeBody = { tree: treeItems };
        if (baseTreeSha) treeBody.base_tree = baseTreeSha;

        const tree = await this._request('POST', `/repos/${owner}/${repo}/git/trees`, treeBody);

        // 4. Commit oluştur
        const commitBody = {
            message: commitMessage,
            tree: tree.sha,
            author: {
                name: 'AetherIDE',
                email: 'aetheride@users.noreply.github.com',
                date: new Date().toISOString(),
            },
        };
        if (baseSha) commitBody.parents = [baseSha];

        const commit = await this._request('POST', `/repos/${owner}/${repo}/git/commits`, commitBody);

        // 5. Branch ref'ini güncelle veya oluştur
        try {
            if (baseSha) {
                await this._request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
                    sha: commit.sha,
                    force: false,
                });
            } else {
                await this._request('POST', `/repos/${owner}/${repo}/git/refs`, {
                    ref: `refs/heads/${branch}`,
                    sha: commit.sha,
                });
            }
        } catch (e) {
            // Force push dene (branch koruma yoksa)
            if (baseSha) {
                await this._request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
                    sha: commit.sha,
                    force: true,
                });
            } else {
                throw e;
            }
        }

        return {
            success: true,
            commitSha: commit.sha,
            commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
            repoUrl: `https://github.com/${owner}/${repo}`,
            filesCount: treeItems.length,
        };
    },

    // ── Tam Push Akışı (UI'dan çağrılır) ──

    async pushProject(options = {}) {
        const {
            repoName,
            commitMessage = 'Update from AetherIDE',
            isPrivate = true,
            createNew = false,
        } = options;

        if (!this.hasToken()) {
            throw new Error('GitHub token not configured. Go to Settings to add it.');
        }

        if (!repoName || !repoName.trim()) {
            throw new Error('Repository name is required');
        }

        const files = Editor.files;
        if (!files || files.length === 0) {
            throw new Error('No files in the project to push');
        }

        // Token doğrula ve kullanıcı adını al
        const validation = await this.validateToken();
        if (!validation.valid) {
            throw new Error('Invalid GitHub token: ' + validation.error);
        }

        const owner = validation.user;
        const safeName = this._sanitizeRepoName(repoName);

        // Repo var mı kontrol et
        const exists = await this.repoExists(owner, safeName);

        if (!exists) {
            // Yeni repo oluştur
            const createResult = await this.createRepo(safeName, {
                description: this._generateDescription(),
                isPrivate: isPrivate,
            });

            if (!createResult.success) {
                throw new Error(createResult.error || 'Failed to create repository');
            }

            // GitHub'ın repo'yu hazırlaması için kısa bekleme
            await this._sleep(1500);
        }

        // Dosyaları push et
        const result = await this.pushFiles(owner, safeName, files, commitMessage);

        return {
            ...result,
            isNewRepo: !exists,
            repoName: safeName,
            owner: owner,
        };
    },

    // ── Yardımcı Metodlar ──

    async _request(method, path, body = null, params = null) {
        const token = this.getToken();
        if (!token) throw new Error('GitHub token not configured');

        let url = this.API_BASE + path;
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += '?' + searchParams.toString();
        }

        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };

        const fetchOptions = { method, headers };

        if (body) {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
            let errorMsg = `GitHub API error: ${res.status}`;
            try {
                const errorBody = await res.json();
                if (errorBody.message) errorMsg = errorBody.message;
                if (errorBody.errors) {
                    const details = errorBody.errors.map(e => e.message || e.code).join(', ');
                    if (details) errorMsg += ` (${details})`;
                }
            } catch (e) { /* JSON parse hatası — raw status kullan */ }

            // Kullanıcı dostu hata mesajları
            if (res.status === 401) {
                throw new Error('GitHub token is invalid or expired. Update it in Settings.');
            }
            if (res.status === 403) {
                if (errorMsg.includes('rate limit')) {
                    throw new Error('GitHub API rate limit exceeded. Wait a few minutes and try again.');
                }
                throw new Error('GitHub token lacks required permissions. Ensure it has "repo" scope.');
            }
            if (res.status === 404) {
                throw new Error(`Not found: ${path} — ${errorMsg}`);
            }
            if (res.status === 422) {
                throw new Error(errorMsg);
            }

            throw new Error(errorMsg);
        }

        // 204 No Content
        if (res.status === 204) return null;

        return await res.json();
    },

    _sanitizeRepoName(name) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100) || 'aetheride-project';
    },

    _generateDescription() {
        const title = Chat.currentChat?.title;
        if (title && title !== 'New Chat') {
            return `${title} — Built with AetherIDE`;
        }
        return 'Built with AetherIDE';
    },

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ── Push Modal UI ──

    showPushModal() {
        if (!this.hasToken()) {
            Utils.toast('Add your GitHub token in Settings first', 'warning');
            Settings.open();
            return;
        }

        if (Editor.files.length === 0) {
            Utils.toast('No files to push', 'warning');
            return;
        }

        // Mevcut modal varsa kaldır
        const existing = document.getElementById('github-push-modal');
        if (existing) existing.remove();

        const defaultName = Chat.currentChat?.title
            ? Utils.slugify(Chat.currentChat.title)
            : 'aetheride-project';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'github-push-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width:460px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="flex-shrink:0;">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Push to GitHub
                    </h2>
                    <button class="modal-close" onclick="document.getElementById('github-push-modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding:16px 20px;">
                    <div class="settings-group" style="margin-bottom:14px;">
                        <label class="settings-label" style="margin-bottom:6px;">
                            Repository Name
                        </label>
                        <input type="text" id="gh-repo-name" class="settings-input"
                               value="${defaultName}" placeholder="my-project"
                               maxlength="100" autocomplete="off" spellcheck="false">
                    </div>

                    <div class="settings-group" style="margin-bottom:14px;">
                        <label class="settings-label" style="margin-bottom:6px;">
                            Commit Message
                        </label>
                        <input type="text" id="gh-commit-msg" class="settings-input"
                               value="Update from AetherIDE" placeholder="Describe your changes..."
                               maxlength="200" autocomplete="off">
                    </div>

                    <div class="settings-group" style="margin-bottom:14px;">
                        <div class="settings-toggle-row">
                            <div class="settings-toggle-info">
                                <i data-lucide="lock" class="settings-label-icon"></i>
                                <div>
                                    <label class="settings-label">Private Repository</label>
                                    <p class="settings-desc">Only you can see this repo</p>
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="gh-private-toggle" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="gh-file-summary" style="
                        padding:10px 14px;
                        background:var(--bg-tertiary);
                        border:1px solid var(--border-primary);
                        border-radius:var(--radius-md);
                        margin-bottom:14px;
                        font-size:0.78rem;
                        color:var(--text-secondary);
                    ">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                            <i data-lucide="files" style="width:14px;height:14px;color:var(--accent-primary);"></i>
                            <strong>${Editor.files.length} file${Editor.files.length > 1 ? 's' : ''}</strong> will be pushed
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-tertiary);line-height:1.5;">
                            ${Editor.files.map(f => f.filename).join(', ')}
                        </div>
                    </div>

                    <div id="gh-push-status" style="display:none;margin-bottom:14px;"></div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn secondary" onclick="document.getElementById('github-push-modal').remove()">
                        Cancel
                    </button>
                    <button class="modal-btn primary" id="gh-push-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="flex-shrink:0;">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Push
                    </button>
                </div>
            </div>
        `;

        document.getElementById('app').appendChild(modal);
        if (window.lucide) lucide.createIcons({ nodes: [modal] });

        // Events
        document.getElementById('gh-push-btn').addEventListener('click', () => this._executePush());

        // Enter ile push
        document.getElementById('gh-repo-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._executePush();
        });
        document.getElementById('gh-commit-msg').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._executePush();
        });

        // Overlay tıkla kapat
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Focus
        setTimeout(() => document.getElementById('gh-repo-name')?.focus(), 100);
    },

    async _executePush() {
        const repoName = document.getElementById('gh-repo-name')?.value?.trim();
        const commitMsg = document.getElementById('gh-commit-msg')?.value?.trim() || 'Update from AetherIDE';
        const isPrivate = document.getElementById('gh-private-toggle')?.checked !== false;
        const pushBtn = document.getElementById('gh-push-btn');
        const statusEl = document.getElementById('gh-push-status');

        if (!repoName) {
            Utils.toast('Please enter a repository name', 'warning');
            return;
        }

        // UI: loading state
        if (pushBtn) {
            pushBtn.disabled = true;
            pushBtn.innerHTML = `
                <div class="thinking-dots-bar" style="margin:0;">
                    <span></span><span></span><span></span>
                </div>
                Pushing...
            `;
        }

        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
                            background:rgba(108,99,255,0.06);border:1px solid rgba(108,99,255,0.15);
                            border-radius:var(--radius-md);font-size:0.78rem;color:var(--text-secondary);">
                    <div class="thinking-dots-bar"><span></span><span></span><span></span></div>
                    Connecting to GitHub...
                </div>
            `;
        }

        try {
            const result = await this.pushProject({
                repoName,
                commitMessage: commitMsg,
                isPrivate,
            });

            // Başarılı
            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
                                background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.15);
                                border-radius:var(--radius-md);font-size:0.78rem;color:var(--accent-success);">
                        <i data-lucide="check-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
                        <div>
                            <strong>${result.isNewRepo ? 'Repository created' : 'Code pushed'} successfully!</strong>
                            <div style="margin-top:4px;">
                                <a href="${result.repoUrl}" target="_blank" rel="noopener"
                                   style="color:var(--accent-primary);font-weight:600;">
                                    Open ${result.owner}/${result.repoName} →
                                </a>
                            </div>
                            <div style="font-size:0.68rem;color:var(--text-tertiary);margin-top:2px;">
                                ${result.filesCount} file${result.filesCount > 1 ? 's' : ''} · ${result.commitSha.substring(0, 7)}
                            </div>
                        </div>
                    </div>
                `;
                if (window.lucide) lucide.createIcons({ nodes: [statusEl] });
            }

            if (pushBtn) {
                pushBtn.innerHTML = `<i data-lucide="check"></i> Done`;
                pushBtn.style.background = 'var(--accent-success)';
                if (window.lucide) lucide.createIcons({ nodes: [pushBtn] });
            }

            Utils.toast(`Pushed ${result.filesCount} files to GitHub!`, 'success');

            // 3 saniye sonra modal'ı kapat
            setTimeout(() => {
                const modal = document.getElementById('github-push-modal');
                if (modal) modal.remove();
            }, 3000);

        } catch (error) {
            console.error('GitHub push error:', error);

            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
                                background:rgba(255,82,82,0.06);border:1px solid rgba(255,82,82,0.15);
                                border-radius:var(--radius-md);font-size:0.78rem;color:var(--accent-error);">
                        <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0;"></i>
                        <div>
                            <strong>Push failed</strong>
                            <div style="margin-top:2px;color:var(--text-secondary);">${Utils.escapeHtml(error.message)}</div>
                        </div>
                    </div>
                `;
                if (window.lucide) lucide.createIcons({ nodes: [statusEl] });
            }

            if (pushBtn) {
                pushBtn.disabled = false;
                pushBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="flex-shrink:0;">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    Retry
                `;
            }

            Utils.toast('Push failed: ' + error.message, 'error');
        }
    },
};