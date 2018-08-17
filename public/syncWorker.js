const VERSION = 'V1';
const CACHE_FILES = [

    'css/theme.css',
    'css/conversation.css',
    'css/material-components-web.css',
    'js/init.js',
    'js/conversation.js',
    'js/panel.js',
    'js/services.js',
    'js/apiHandler.js',
    'js/material-components-web.js',
    'external/firebase-app.js',
    'external/firebasejs/5.2.0/firebase-auth.js',
    'external/firebasejs/5.2.0/firebase-storage.js',
    '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500',
    '//fonts.googleapis.com/icon?family=Material+Icons'
]


self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(VERSION)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(keys.map(function(key, i){
                if(key !== VERSION){
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function(res){ 
               return res || fetch(event.request)
            
        }).catch(console.log)
    )
});


