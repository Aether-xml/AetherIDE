/* ══════════════════════════════════════════════════════════
   AetherIDE — Theme Manager
   ══════════════════════════════════════════════════════════ */

const ThemeManager = {

    current: 'dark',

    init() {
        const settings = Storage.getSettings();
        this.apply(settings.theme || 'dark');
    },

    apply(theme) {
        this.current = theme;
        document.documentElement.setAttribute('data-theme', theme);

        // Tema butonlarını güncelle
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        // Meta theme-color güncelle
        const colors = {
            dark: '#0D0F13',
            aether: '#0A0D14',
            midnight: '#080A0E',
        };

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = colors[theme] || colors.dark;
    },

    toggle() {
        const themes = ['dark', 'aether', 'midnight'];
        const currentIndex = themes.indexOf(this.current);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.apply(nextTheme);

        const settings = Storage.getSettings();
        settings.theme = nextTheme;
        Storage.saveSettings(settings);

        Utils.toast(`Theme: ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`, 'info', 1500);
    },
};


/* ══════════════════════════════════════════════════════════
   AetherIDE — Layout Manager v2
   VSCode / Cursor layout düzenleri (Desktop only)
   ══════════════════════════════════════════════════════════ */

const LayoutManager = {

    current: 'default',

    init() {
        const settings = Storage.getSettings();
        this.apply(settings.layout || 'default');

        // Ekran boyutu değişince mobilde layout'u sıfırla
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.remove('layout-vscode', 'layout-cursor');
            } else if (this.current !== 'default') {
                document.body.classList.remove('layout-vscode', 'layout-cursor');
                document.body.classList.add('layout-' + this.current);
            }
        });
    },

    apply(layout) {
        this.current = layout;

        // Tüm layout class'larını kaldır
        document.body.classList.remove('layout-vscode', 'layout-cursor');

        // Mobilde layout uygulamana
        if (window.innerWidth <= 768) return;

        if (layout === 'vscode' || layout === 'cursor') {
            document.body.classList.add('layout-' + layout);
        }

        // Layout butonlarını güncelle
        document.querySelectorAll('.layout-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === layout);
        });
    },
};