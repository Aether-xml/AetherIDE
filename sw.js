// ══════════════════════════════════════════════════════════
// AetherIDE Service Worker v1.5.2
// Network-first for HTML/JS/CSS, cache for assets only
// ══════════════════════════════════════════════════════════

const CACHE_VERSION = 'aetheride-v1.5.3';

// Sadece değişmeyen asset'leri cache'le
const STATIC_ASSETS = [
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    '/manifest.json',
];

// API istekleri — asla cache'leme
const API_PATTERNS = [
    'openrouter.ai',
    'generativelanguage.googleapis.com',
    'api.openai.com',
];

// Asla cache'lenmemesi gereken dosyalar
const NO_CACHE_PATTERNS = [
    '/js/',
    '/css/',
    '/index.html',
    '/editor.html',
    '/app',
    '/sw.js',
];

// ── Install — minimal cache, hemen aktive ol ──
self.addEventListener('install', (e) => {
    console.log('[SW] Installing v1.5.2...');
    e.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => {
                console.log('[SW] Install complete, skipping waiting');
                return self.skipWaiting();
            })
    );
});

// ── Activate — TÜM eski cache'leri sil ──
self.addEventListener('activate', (e) => {
    console.log('[SW] Activating v1.5.2...');
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_VERSION) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming all clients');
            return self.clients.claim();
        })
    );
});

// ── Fetch — Network-first for everything except static assets ──
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Sadece GET isteklerini işle
    if (e.request.method !== 'GET') return;

    // API istekleri — network only, cache'leme
    if (API_PATTERNS.some(p => url.hostname.includes(p))) {
        return;
    }

    // Chrome extension isteklerini atla
    if (url.protocol === 'chrome-extension:') return;

    // HTML/JS/CSS dosyaları — HER ZAMAN network-first
    const isAppFile = NO_CACHE_PATTERNS.some(p => url.pathname.includes(p)) ||
                      url.pathname === '/' ||
                      e.request.mode === 'navigate';

    if (isAppFile) {
        e.respondWith(
            fetch(e.request, { cache: 'no-cache' })
                .then(response => {
                    return response;
                })
                .catch(() => {
                    // Offline — navigation için fallback
                    if (e.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // Statik asset'ler (ikonlar, manifest) — cache-first
    e.respondWith(
        caches.match(e.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                });
            })
            .catch(() => {
                return new Response('Offline', { status: 503, statusText: 'Offline' });
            })
    );
});

// ── Message handler — skipWaiting desteği ──
self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting' || (e.data && e.data.type === 'SKIP_WAITING')) {
        console.log('[SW] Skip waiting triggered');
        self.skipWaiting();
    }
});
