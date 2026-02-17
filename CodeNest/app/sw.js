// Service Worker for PyMobile Pro
const CACHE_NAME = 'pymobile-v13';

// 1. App Shell (Local Files) - Precache these immediately
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './css/themes.css',
    './css/error.css',
    './js/ui.js',
    './js/tailwindcss.js',
    './js/settings.js',
    './js/cm-theme.js',
    './script.js',
    './py-worker.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/screenshot-mobile.png',
    './assets/screenshot-desktop.png'
];

// 2. Install Event: Cache App Shell
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

// 3. Activate Event: Clean old caches
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

// 4. Fetch Event: Cache First Strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Strategy: Cache First, Network Fallback
    // This applies to ALL requests: App Shell, Pyodide, CodeMirror, Tailwind, FontAwesome
    // Ensure we handle chrome-extension or other schemes gracefully
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached response
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Check if valid response
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }

                // Explicitly log caching of Python wheels for verification
                if (event.request.url.endsWith('.whl')) {
                    console.log('[SW] Caching Python Wheel:', event.request.url);
                }

                // If it is a CDN asset or part of our app, cache it dynamically
                // We cache basically everything successful to ensure offline support for Pyodide chunks
                // This includes Python packages (.whl) from files.pythonhosted.org
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Offline and not in cache?
                // Could return a fallback page here if we had one
                console.log('[SW] Fetch failed (offline): ', event.request.url);
            });
        })
    );
});
