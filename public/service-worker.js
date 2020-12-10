const CACHE_NAME = 'budgeit-cache-v1';
const DATA_CACHE_NAME = 'budgeit-data-cache-v1';

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
    "./js/index.js",
    "./js/idb.js",
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('installing cache: ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keysList) {
            return Promise.all(
                keysList.map(key => {
                    if(key !== CACHE_NAME && key!== DATA_CACHE_NAME) {
                        console.log('deleting cache: ' + key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    if(e.request.url.includes('/api')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then(cache => {
                    return fetch(e.request)
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(e.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(error => {
                            return cache.match(e.request);
                        });
                })
                .catch(error => console.log(error))
        );
        return;
    }

    e.respondWith(
        fetch(e.request).catch(function() {
            return caches.match(e.request).then(function(response) {
                if(response) {
                    return response;
                } else if(e.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            });
        })
    );
})