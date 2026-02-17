const CACHE_NAME = 'aetheride-v1.4.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/editor.html',
    '/404.html',
    '/manifest.json',
    '/css/main.css',
    '/css/sidebar.css',
    '/css/editor.css',
    '/css/chat.css',
    '/css/modal.css',
    '/css/responsive.css',
    '/js/utils.js',
    '/js/storage.js',
    '/js/themes.js',
    '/js/api.js',
    '/js/editor.js',
    '/js/chat.js',
    '/js/sandbox.js',
    '/js/settings.js',
    '/js/app.js',
    '/js/modes/direct.js',
    '/js/modes/planner.js',
    '/js/modes/team.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
];

// CDN kaynakları — network-first
const CDN_PATTERNS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
];

// API istekleri — asla cache'leme
const API_PATTERNS = [
    'openrouter.ai',
    'generativelanguage.googleapis.com',
    'api.openai.com',
];

// ── Install ──
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate — eski cache'leri temizle ──
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch ──
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // API istekleri — network only
    if (API_PATTERNS.some(p => url.hostname.includes(p))) {
        e.respondWith(fetch(e.request));
        return;
    }

    // CDN kaynakları — network first, fallback cache
    if (CDN_PATTERNS.some(p => url.hostname.includes(p))) {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    return response;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Statik dosyalar — cache first, fallback network
    e.respondWith(
        caches.match(e.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    // Sadece başarılı GET isteklerini cache'le
                    if (response.ok && e.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback — navigation istekleri için
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});

// ── Background Sync (gelecek için hazırlık) ──
self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
