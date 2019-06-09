// Service Worker Version 28

var CACHE_NAME = 'gf-28'
const cacheToAdd = [
    '/v1/',
    '/v1/external/js/firebase-app.js',
    '/v1/external/js/firebase-auth.js',
    '/v1/external/js/firebaseui.js',
    '/v1/external/js/material.min.js',
    '/v1/external/css/material.min.css',
    '/v1/external/css/firebaseui.css',
    '/v1/external/fonts/font.woff2',
    '/v1/external/css/material-icons.css',
    '/v1/css/bundle.css',
    '/v1/js/bundle.min.js',
    '/v1/js/apiHandler.js',
    '/v1/img/placeholder.png',
    '/v1/img/empty-user.jpg',
    '/v1/img/empty-user-big.jpg',
    '/v1/img/favicon.png',
    '/v1/offline.html',
    'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
]
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(cacheToAdd)
        })
    )
})

self.addEventListener('activate', function (event) {
    const whiteListed = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (whiteListed.indexOf(cacheName) === -1) {
                        console.log('cache to delete' + cacheName)
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})
self.addEventListener('fetch', function (event) {

    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        console.log(event.request.url);
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            }).catch(error => {
                // Return the offline page
                return caches.match('offline.html');
            })
        );
    } else {
        event.respondWith(
            caches.open(CACHE_NAME).then(function (cache) {
                console.log(event.request)
                return cache.match(event.request).then(function (response) {
                    
                    return response || fetch(event.request);
                })

            })
        )
    }
})