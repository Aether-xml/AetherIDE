/* ══════════════════════════════════════════════════════════
   AetherIDE — File Tree v1
   Klasör yapısı, sağ tık menü, drag & drop ready
   ══════════════════════════════════════════════════════════ */

const FileTree = {

    visible: false,
    expandedFolders: new Set(),
    contextTarget: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Toggle butonu
        document.getElementById('filetree-toggle-btn')?.addEventListener('click', () => {
            this.toggle();
        });

        // Context menü dışına tıklayınca kapat
        document.addEventListener('click', (e) => {
            const ctx = document.getElementById('filetree-context-menu');
            if (ctx && !ctx.contains(e.target)) {
                ctx.remove();
            }
        });

        // Escape ile context menüyü kapat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const ctx = document.getElementById('filetree-context-menu');
                if (ctx) ctx.remove();
            }
        });
    },

    toggle() {
        this.visible = !this.visible;
        const panel = document.getElementById('filetree-panel');
        const toggleBtn = document.getElementById('filetree-toggle-btn');

        if (panel) {
            panel.style.display = this.visible ? 'flex' : 'none';
        }

        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.visible);
        }

        if (this.visible) {
            this.render();
        }
    },

    show() {
        if (!this.visible) this.toggle();
        else this.render();
    },

    hide() {
        if (this.visible) this.toggle();
    },

    // ── Dosyaları ağaç yapısına dönüştür ──
    buildTree(files) {
        const root = { name: '', type: 'folder', children: {}, files: [] };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const parts = file.filename.split('/');

            if (parts.length === 1) {
                // Kök dosya
                root.files.push({ ...file, index: i });
            } else {
                // Klasör yapısı
                let current = root;
                for (let p = 0; p < parts.length - 1; p++) {
                    const folderName = parts[p];
                    if (!current.children[folderName]) {
                        current.children[folderName] = {
                            name: folderName,
                            type: 'folder',
                            path: parts.slice(0, p + 1).join('/'),
                            children: {},
                            files: [],
                        };
                    }
                    current = current.children[folderName];
                }
                current.files.push({ ...file, index: i });
            }
        }

        return root;
    },

    // ── Render ──
    render() {
        const container = document.getElementById('filetree-content');
        if (!container) return;

        if (Editor.files.length === 0) {
            container.innerHTML = `
                <div class="filetree-empty">
                    <i data-lucide="folder-open" style="width:24px;height:24px;opacity:0.2;"></i>
                    <span>No files yet</span>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ nodes: [container] });
            return;
        }

        const tree = this.buildTree(Editor.files);
        let html = this._renderNode(tree, 0);

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons({ nodes: [container] });

        // Aktif dosyayı highlight et
        this._highlightActive();
    },

    _renderNode(node, depth) {
        let html = '';

        // Klasörleri önce render et (alfabetik)
        const folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
        for (const folder of folders) {
            const isExpanded = this.expandedFolders.has(folder.path);
            const itemCount = this._countItems(folder);
            const paddingLeft = 12 + (depth * 16);

            html += `<div class="filetree-folder ${isExpanded ? 'expanded' : ''}" 
                         data-path="${Utils.escapeHtml(folder.path)}"
                         style="padding-left:${paddingLeft}px;"
                         onclick="FileTree.toggleFolder('${Utils.escapeHtml(folder.path)}')"
                         oncontextmenu="FileTree.showFolderContext(event, '${Utils.escapeHtml(folder.path)}')">
                        <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" class="filetree-arrow"></i>
                        <i data-lucide="${isExpanded ? 'folder-open' : 'folder'}" class="filetree-folder-icon"></i>
                        <span class="filetree-name">${Utils.escapeHtml(folder.name)}</span>
                        <span class="filetree-count">${itemCount}</span>
                    </div>`;

            if (isExpanded) {
                html += `<div class="filetree-folder-content">`;
                html += this._renderNode(folder, depth + 1);
                html += `</div>`;
            }
        }

        // Dosyaları render et (alfabetik)
        const files = [...node.files].sort((a, b) => {
            const nameA = a.filename.split('/').pop();
            const nameB = b.filename.split('/').pop();
            return nameA.localeCompare(nameB);
        });

        for (const file of files) {
            const fileName = file.filename.split('/').pop();
            const icon = Utils.getFileIcon(file.language, file.filename);
            const isActive = file.index === Editor.activeFileIndex;
            const paddingLeft = 12 + (depth * 16);

            html += `<div class="filetree-file ${isActive ? 'active' : ''}" 
                         data-index="${file.index}"
                         data-filename="${Utils.escapeHtml(file.filename)}"
                         style="padding-left:${paddingLeft}px;"
                         onclick="FileTree.openFile(${file.index})"
                         oncontextmenu="FileTree.showFileContext(event, ${file.index})">
                        <i data-lucide="${icon}" class="filetree-file-icon"></i>
                        <span class="filetree-name">${Utils.escapeHtml(fileName)}</span>
                        <span class="filetree-meta">${file.language}</span>
                    </div>`;
        }

        return html;
    },

    _countItems(folder) {
        let count = folder.files.length;
        for (const child of Object.values(folder.children)) {
            count += this._countItems(child);
        }
        return count;
    },

    _highlightActive() {
        const container = document.getElementById('filetree-content');
        if (!container) return;

        container.querySelectorAll('.filetree-file').forEach(el => {
            const idx = parseInt(el.dataset.index);
            el.classList.toggle('active', idx === Editor.activeFileIndex);
        });
    },

    // ── Actions ──
    toggleFolder(path) {
        if (this.expandedFolders.has(path)) {
            this.expandedFolders.delete(path);
        } else {
            this.expandedFolders.add(path);
        }
        this.render();
    },

    openFile(index) {
        Editor.switchTab(index);
        this._highlightActive();

        // Mobilde code panel'e geç
        if (window.innerWidth <= 768) {
            App.showMobilePanel('code');
        }
    },

    // ── Context Menu ──
    showFileContext(e, fileIndex) {
        e.preventDefault();
        e.stopPropagation();
        this.contextTarget = fileIndex;

        const file = Editor.files[fileIndex];
        if (!file) return;

        this._removeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'filetree-context-menu';
        menu.className = 'filetree-context-menu';
        menu.innerHTML = `
            <div class="filetree-ctx-item" onclick="FileTree.renameFile(${fileIndex})">
                <i data-lucide="pencil"></i>
                <span>Rename</span>
            </div>
            <div class="filetree-ctx-item" onclick="FileTree.duplicateFile(${fileIndex})">
                <i data-lucide="copy"></i>
                <span>Duplicate</span>
            </div>
            <div class="filetree-ctx-item" onclick="FileTree.downloadFile(${fileIndex})">
                <i data-lucide="download"></i>
                <span>Download</span>
            </div>
            <div class="filetree-ctx-separator"></div>
            <div class="filetree-ctx-item danger" onclick="FileTree.deleteFile(${fileIndex})">
                <i data-lucide="trash-2"></i>
                <span>Delete</span>
            </div>
        `;

        this._positionContextMenu(menu, e);
        document.body.appendChild(menu);
        if (window.lucide) lucide.createIcons({ nodes: [menu] });
    },

    showFolderContext(e, folderPath) {
        e.preventDefault();
        e.stopPropagation();

        this._removeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'filetree-context-menu';
        menu.className = 'filetree-context-menu';
        menu.innerHTML = `
            <div class="filetree-ctx-item" onclick="FileTree.collapseAll()">
                <i data-lucide="minimize-2"></i>
                <span>Collapse All</span>
            </div>
            <div class="filetree-ctx-item" onclick="FileTree.expandAll()">
                <i data-lucide="maximize-2"></i>
                <span>Expand All</span>
            </div>
            <div class="filetree-ctx-separator"></div>
            <div class="filetree-ctx-item danger" onclick="FileTree.deleteFolder('${Utils.escapeHtml(folderPath)}')">
                <i data-lucide="trash-2"></i>
                <span>Delete Folder</span>
            </div>
        `;

        this._positionContextMenu(menu, e);
        document.body.appendChild(menu);
        if (window.lucide) lucide.createIcons({ nodes: [menu] });
    },

    _positionContextMenu(menu, e) {
        const x = e.clientX;
        const y = e.clientY;

        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '9999';

        // Ekran dışına taşmasını engelle
        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (x - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (y - rect.height) + 'px';
            }
        });
    },

    _removeContextMenu() {
        const existing = document.getElementById('filetree-context-menu');
        if (existing) existing.remove();
    },

    // ── File Operations ──
    renameFile(index) {
        this._removeContextMenu();
        const file = Editor.files[index];
        if (!file) return;

        const newName = prompt('Rename file:', file.filename);
        if (!newName || newName.trim() === '' || newName.trim() === file.filename) return;

        const trimmed = newName.trim().replace(/^\.\//, '').replace(/^\//, '');

        // Aynı isimde dosya var mı kontrol et
        const exists = Editor.files.some((f, i) => i !== index && f.filename === trimmed);
        if (exists) {
            Utils.toast('A file with this name already exists', 'warning');
            return;
        }

        Editor.files[index].filename = trimmed;

        // Dil uzantıdan güncelle
        const ext = trimmed.split('.').pop().toLowerCase();
        const extToLang = {
            js: 'javascript', ts: 'typescript', py: 'python',
            html: 'html', htm: 'html', css: 'css',
            json: 'json', md: 'markdown', sql: 'sql',
            sh: 'bash', rb: 'ruby', go: 'go', rs: 'rust',
            java: 'java', cpp: 'cpp', c: 'c', php: 'php',
        };
        if (extToLang[ext]) {
            Editor.files[index].language = extToLang[ext];
        }

        Editor.renderTabs();
        Editor.renderCode();
        Editor.updatePreviewButton();
        this.render();
        Utils.toast(`Renamed to ${trimmed}`, 'success', 1500);
    },

    duplicateFile(index) {
        this._removeContextMenu();
        const file = Editor.files[index];
        if (!file) return;

        const parts = file.filename.split('.');
        const ext = parts.pop();
        const baseName = parts.join('.');
        let newName = `${baseName}-copy.${ext}`;
        let counter = 1;

        while (Editor.files.some(f => f.filename === newName)) {
            counter++;
            newName = `${baseName}-copy${counter}.${ext}`;
        }

        Editor.files.push({
            filename: newName,
            language: file.language,
            code: file.code,
        });

        Editor.activeFileIndex = Editor.files.length - 1;
        Editor.renderTabs();
        Editor.renderCode();
        Editor.updateStatusBar();
        Editor.updatePreviewButton();
        this.render();
        Utils.toast(`Duplicated as ${newName}`, 'success', 1500);
    },

    downloadFile(index) {
        this._removeContextMenu();
        const file = Editor.files[index];
        if (!file) return;

        const blob = new Blob([file.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename.split('/').pop();
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast(`Downloaded ${file.filename}`, 'success', 1500);
    },

    deleteFile(index) {
        this._removeContextMenu();
        const file = Editor.files[index];
        if (!file) return;

        if (!confirm(`Delete "${file.filename}"?`)) return;

        Editor.files.splice(index, 1);

        if (Editor.activeFileIndex >= Editor.files.length) {
            Editor.activeFileIndex = Math.max(0, Editor.files.length - 1);
        }

        Editor.renderTabs();
        Editor.renderCode();
        Editor.updateStatusBar();
        Editor.updatePreviewButton();
        this.render();
        Utils.toast(`Deleted ${file.filename}`, 'info', 1500);
    },

    deleteFolder(folderPath) {
        this._removeContextMenu();

        const filesInFolder = Editor.files.filter(f => f.filename.startsWith(folderPath + '/'));
        if (filesInFolder.length === 0) return;

        if (!confirm(`Delete folder "${folderPath}" and its ${filesInFolder.length} file(s)?`)) return;

        Editor.files = Editor.files.filter(f => !f.filename.startsWith(folderPath + '/'));

        if (Editor.activeFileIndex >= Editor.files.length) {
            Editor.activeFileIndex = Math.max(0, Editor.files.length - 1);
        }

        this.expandedFolders.delete(folderPath);

        Editor.renderTabs();
        Editor.renderCode();
        Editor.updateStatusBar();
        Editor.updatePreviewButton();
        this.render();
        Utils.toast(`Deleted folder ${folderPath}`, 'info', 1500);
    },

    expandAll() {
        this._removeContextMenu();
        const tree = this.buildTree(Editor.files);
        this._collectFolderPaths(tree, this.expandedFolders);
        this.render();
    },

    collapseAll() {
        this._removeContextMenu();
        this.expandedFolders.clear();
        this.render();
    },

    _collectFolderPaths(node, set) {
        for (const folder of Object.values(node.children)) {
            set.add(folder.path);
            this._collectFolderPaths(folder, set);
        }
    },
};