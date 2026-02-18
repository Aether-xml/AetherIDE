/* ══════════════════════════════════════════════════════════
   AetherIDE — Theme Manager v2
   Gelişmiş tema sistemi, özel renkler, accent seçimi
   ══════════════════════════════════════════════════════════ */

const ThemeManager = {

    current: 'dark',

    // ── Tema tanımları ──
    THEMES: {
        dark: {
            id: 'dark',
            name: 'Dark',
            icon: 'moon',
            description: 'Classic dark theme',
            colors: {
                '--bg-primary': '#0D0F13',
                '--bg-secondary': '#12151A',
                '--bg-tertiary': '#181B22',
                '--bg-elevated': '#1E222A',
                '--bg-hover': '#252932',
                '--bg-active': '#2D323C',
                '--border-primary': '#1F2329',
                '--border-secondary': '#2A303A',
                '--text-primary': '#E4E7EB',
                '--text-secondary': '#9DA5B4',
                '--text-tertiary': '#636D7E',
                '--text-disabled': '#4A5162',
            },
            meta: '#0D0F13',
        },
        aether: {
            id: 'aether',
            name: 'Aether',
            icon: 'zap',
            description: 'Deep purple vibes',
            colors: {
                '--bg-primary': '#0A0D14',
                '--bg-secondary': '#0F1219',
                '--bg-tertiary': '#141820',
                '--bg-elevated': '#1A1F2A',
                '--bg-hover': '#212736',
                '--bg-active': '#2A3142',
                '--border-primary': '#1C2133',
                '--border-secondary': '#283048',
                '--text-primary': '#E2E6F0',
                '--text-secondary': '#98A0B8',
                '--text-tertiary': '#5D6680',
                '--text-disabled': '#404A62',
            },
            meta: '#0A0D14',
        },
        midnight: {
            id: 'midnight',
            name: 'Midnight',
            icon: 'stars',
            description: 'True black OLED',
            colors: {
                '--bg-primary': '#000000',
                '--bg-secondary': '#0A0A0E',
                '--bg-tertiary': '#101014',
                '--bg-elevated': '#16161C',
                '--bg-hover': '#1E1E26',
                '--bg-active': '#262630',
                '--border-primary': '#18181E',
                '--border-secondary': '#222230',
                '--text-primary': '#E0E0E8',
                '--text-secondary': '#9898A8',
                '--text-tertiary': '#5C5C6E',
                '--text-disabled': '#3E3E4E',
            },
            meta: '#000000',
        },
        nord: {
            id: 'nord',
            name: 'Nord',
            icon: 'snowflake',
            description: 'Arctic, clean & calm',
            colors: {
                '--bg-primary': '#2E3440',
                '--bg-secondary': '#3B4252',
                '--bg-tertiary': '#434C5E',
                '--bg-elevated': '#4C566A',
                '--bg-hover': '#545E73',
                '--bg-active': '#5E6A82',
                '--border-primary': '#434C5E',
                '--border-secondary': '#4C566A',
                '--text-primary': '#ECEFF4',
                '--text-secondary': '#D8DEE9',
                '--text-tertiary': '#8892A8',
                '--text-disabled': '#616E88',
            },
            meta: '#2E3440',
        },
        sunset: {
            id: 'sunset',
            name: 'Sunset',
            icon: 'sunset',
            description: 'Warm orange tones',
            colors: {
                '--bg-primary': '#1A1210',
                '--bg-secondary': '#201814',
                '--bg-tertiary': '#28201A',
                '--bg-elevated': '#302620',
                '--bg-hover': '#3A2E26',
                '--bg-active': '#44362E',
                '--border-primary': '#2E2420',
                '--border-secondary': '#3E322A',
                '--text-primary': '#F0E6DC',
                '--text-secondary': '#BCA898',
                '--text-tertiary': '#7A6A5E',
                '--text-disabled': '#564A40',
            },
            meta: '#1A1210',
        },
        ocean: {
            id: 'ocean',
            name: 'Ocean',
            icon: 'waves',
            description: 'Deep sea blues',
            colors: {
                '--bg-primary': '#0A1220',
                '--bg-secondary': '#0E1828',
                '--bg-tertiary': '#142030',
                '--bg-elevated': '#1A283A',
                '--bg-hover': '#223248',
                '--bg-active': '#2A3C54',
                '--border-primary': '#1A2638',
                '--border-secondary': '#24344A',
                '--text-primary': '#E0EAF4',
                '--text-secondary': '#8AA4C0',
                '--text-tertiary': '#506880',
                '--text-disabled': '#3A5068',
            },
            meta: '#0A1220',
        },
    },

    // ── Accent renk seçenekleri ──
    ACCENTS: {
        purple: {
            '--accent-primary': '#6C63FF',
            '--accent-primary-hover': '#7B73FF',
            '--accent-primary-glow': 'rgba(108, 99, 255, 0.12)',
        },
        blue: {
            '--accent-primary': '#3B82F6',
            '--accent-primary-hover': '#5193F7',
            '--accent-primary-glow': 'rgba(59, 130, 246, 0.12)',
        },
        cyan: {
            '--accent-primary': '#06B6D4',
            '--accent-primary-hover': '#22D3EE',
            '--accent-primary-glow': 'rgba(6, 182, 212, 0.12)',
        },
        green: {
            '--accent-primary': '#10B981',
            '--accent-primary-hover': '#34D399',
            '--accent-primary-glow': 'rgba(16, 185, 129, 0.12)',
        },
        rose: {
            '--accent-primary': '#F43F5E',
            '--accent-primary-hover': '#FB7185',
            '--accent-primary-glow': 'rgba(244, 63, 94, 0.12)',
        },
        amber: {
            '--accent-primary': '#F59E0B',
            '--accent-primary-hover': '#FBBF24',
            '--accent-primary-glow': 'rgba(245, 158, 11, 0.12)',
        },
    },

    currentAccent: 'purple',

    init() {
        const settings = Storage.getSettings();
        this.apply(settings.theme || 'dark');
        this.applyAccent(settings.accentColor || 'purple');
    },

    apply(themeId) {
        const theme = this.THEMES[themeId];
        if (!theme) return;

        this.current = themeId;
        document.documentElement.setAttribute('data-theme', themeId);

        // CSS custom properties uygula
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(theme.colors)) {
            root.style.setProperty(prop, value);
        }

        // Meta theme-color güncelle
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme.meta;

        // Tema butonlarını güncelle
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeId);
        });

        // Statusbar rengini temaya göre ayarla (midnight için farklı)
        if (themeId === 'midnight') {
            document.documentElement.style.setProperty('--statusbar-bg', '#16161C');
        } else {
            document.documentElement.style.removeProperty('--statusbar-bg');
        }
    },

    applyAccent(accentId) {
        const accent = this.ACCENTS[accentId];
        if (!accent) return;

        this.currentAccent = accentId;
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(accent)) {
            root.style.setProperty(prop, value);
        }

        // Statusbar arka planını accent'e göre güncelle
        const statusbar = document.getElementById('statusbar');
        if (statusbar) {
            statusbar.style.background = accent['--accent-primary'];
        }

        // Accent butonlarını güncelle
        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.accent === accentId);
        });
    },

    getThemeList() {
        return Object.values(this.THEMES);
    },

    getAccentList() {
        return Object.entries(this.ACCENTS).map(([id, colors]) => ({
            id,
            color: colors['--accent-primary'],
        }));
    },

    toggle() {
        const themes = Object.keys(this.THEMES);
        const currentIndex = themes.indexOf(this.current);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.apply(nextTheme);

        const settings = Storage.getSettings();
        settings.theme = nextTheme;
        Storage.saveSettings(settings);

        const theme = this.THEMES[nextTheme];
        Utils.toast(`Theme: ${theme.name}`, 'info', 1500);
    },
};


/* ══════════════════════════════════════════════════════════
   AetherIDE — Layout Manager v2
   ══════════════════════════════════════════════════════════ */

const LayoutManager = {

    current: 'default',

    init() {
        const settings = Storage.getSettings();
        this.apply(settings.layout || 'default');

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
        document.body.classList.remove('layout-vscode', 'layout-cursor');
        if (window.innerWidth <= 768) return;
        if (layout === 'vscode' || layout === 'cursor') {
            document.body.classList.add('layout-' + layout);
        }
        document.querySelectorAll('.layout-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === layout);
        });
    },
};
