// Service Worker for CodeNest PWA IDE
const CACHE_NAME = 'codenest-v1';

// App Shell: Core files for offline start
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './script.js',
    './js/db.js',
    './js/tailwindcss.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // Monaco Loader
    'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js'
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching App Shell');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Cache valid responses
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                         cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline handling
                    // console.log('[SW] Fetch failed (offline): ', event.request.url);
                });

                // Return cached response immediately if available, else wait for network
                return cachedResponse || fetchPromise;
            });
        })
    );
});
