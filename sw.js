const CACHE_NAME = 'aetheride-v4';
const ASSETS = [
    '/',
    '/index.html',
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
    '/js/settings.js',
    '/js/app.js',
    '/js/modes/direct.js',
    '/js/modes/planner.js',
    '/js/modes/team.js',
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
