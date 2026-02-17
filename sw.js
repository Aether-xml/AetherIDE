const CACHE_NAME = 'aetheride-v1.3.1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/editor.html',
    '/app',
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

const CDN_PATTERNS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
];

const API_PATTERNS = [
    'openrouter.ai',
    'generativelanguage.googleapis.com',
    'api.openai.com',
];

// Install
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate — eski cache temizle
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // API — network only
    if (API_PATTERNS.some(p => url.hostname.includes(p))) {
        e.respondWith(fetch(e.request));
        return;
    }

    // Root ve /app — network first
    if (url.pathname === '/' || url.pathname === '/app' || url.pathname === '/app/') {
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

    // CDN — network first
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

    // Static — cache first
    e.respondWith(
        caches.match(e.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    if (response.ok && e.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                });
            })
            .catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Skip waiting mesajı
self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting') self.skipWaiting();
});
