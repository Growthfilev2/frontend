(function () {
  const CACHE_NAME = 'V68'
  const urlsToCache = [
    'https://www.gstatic.com/firebasejs/5.4.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/5.4.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/5.2.0/firebase-storage.js',
    'external/material-css.css',
    'external/material-js.js',
    'js/init.js',
    'js/panel.js',
    'css/theme.css',
    'css/conversation.css',
    'css/material-components-web.css',
    'js/conversation.js',
    'js/services.js',
    '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500',
    '//fonts.googleapis.com/icon?family=Material+Icons',
    'index.html',
    'img/change_number.png',
    'img/empty-user.png'
  ]

  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(function (cache) {
          console.log('Opened cache')
          cache.addAll(urlsToCache)
        })
    )
  })

  self.addEventListener('fetch', function (event) {
    console.log('fetch started')
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          // Cache hit - return response

          if (response) {
            console.log(response)
            return response
          }

          // IMPORTANT: Clone the request. A request is a stream and
          // can only be consumed once. Since we are consuming this
          // once by cache and once by the browser for fetch, we need
          // to clone the response.
          var fetchRequest = event.request.clone()

          return fetch(fetchRequest).then(
            function (response) {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                console.log(response)
                return response
              }

              // IMPORTANT: Clone the response. A response is a stream
              // and because we want the browser to consume the response
              // as well as the cache consuming the response, we need
              // to clone it so we have two streams.
              var responseToCache = response.clone()
              //
              caches.open(CACHE_NAME)
                .then(function (cache) {
                  cache.put(event.request, responseToCache)
                })

              return response
            }
          )
        })
    )
  })

  self.addEventListener('activate', function (event) {
    // const deleteOldCache = ['V2']
    event.waitUntil(
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            console.log(cacheName)
            if (CACHE_NAME !== cacheName && cacheName.startsWith('V')) {
              return caches.delete(cacheName)
            }
          })
        )
      })
    )
  })
})()
