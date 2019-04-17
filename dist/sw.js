// new version of service worker is installed. Hello This is a new file

var CACHE_NAME = 'gf-53'
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll([
                '/',
                'external/js/material.js',
                'external/css/material.min.css',
                'css/bundle.css',
                'js/bundle.min.js',
                'js/apiHandler.js',
                'img/placeholder.png',
                'img/empty-user.jpg',
                'img/empty-user-big.jpg',
                'offline.html'
            ])
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
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})
self.addEventListener('fetch', function (event) {
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        console.log(event.request.url)
        event.respondWith(
            fetch(event.request.url).catch(error => {
                // Return the offline page
                return caches.match('offline.html');
            })
        );
    } else {
        event.respondWith(
            caches.open(CACHE_NAME).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    if (response)  return response
                    return fetch(event.request).then(function (response) {
                            if(event.request.method === 'GET') {
                                cache.put(event.request, response.clone());
                            }
                            return response;
                    })
                })
            })
        )
    }
})

