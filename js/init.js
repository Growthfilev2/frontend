/*
Initialize the application with firebase app and firebase UI config parameters.
The app first checks if the application is opened in a private browsing mode or not.
If it is, then an infoText is generated in the DOM to notify the user. If not,
then it checks the IDB and Web Worker support. If both are available then User
is taken to login screen if not already logged in. if either or both a.ka. IDB &
Web Worker are not supported then infoText is generated in the DOM to notify the
user.
*/

// detect if private browsing mode is enabled or not.

(function () {
  function retry (isDone, next) {
    let currentTrial = 0
    let isTimeout = false
    const maxRetry = 50

    const id = window.setInterval(
      function () {
        if (isDone()) {
          window.clearInterval(id)
          next(isTimeout)
        }
        if (currentTrial++ > maxRetry) {
          window.clearInterval(id)
          isTimeout = true
          next(isTimeout)
        }
      },
      10
    )
  }

  function isIE10OrLater (userAgent) {
    const ua = userAgent.toLowerCase()
    if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
      return false
    }
    const match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua)
    if (match && parseInt(match[1], 10) >= 10) {
      return true
    }
    const edge = /edge/.exec(ua)
    if (edge && edge[0] === 'edge') {
      return true
    }
    return false
  }

  function detectPrivateMode (callback) {
    let isPrivate

    if (window.webkitRequestFileSystem) {
      window.webkitRequestFileSystem(
        window.TEMPORARY, 1,
        function () {
          isPrivate = false
        },
        function (e) {
          console.log(e)
          isPrivate = true
        }
      )
    } else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
      let db
      try {
        db = window.indexedDB.open('test')
      } catch (e) {
        isPrivate = true
      }

      if (typeof isPrivate === 'undefined') {
        retry(
          function isDone () {
            return db.readyState === 'done'
          },
          function next (isTimeout) {
            if (!isTimeout) {
              isPrivate = !db.result
            }
          }
        )
      }
    } else if (isIE10OrLater(window.navigator.userAgent)) {
      isPrivate = false
      try {
        if (!window.indexedDB) {
          isPrivate = true
        }
      } catch (e) {
        isPrivate = true
      }
    } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
      try {
        window.localStorage.setItem('test', 1)
      } catch (e) {
        isPrivate = true
      }

      if (typeof isPrivate === 'undefined') {
        isPrivate = true
        window.localStorage.removeItem('test')
      }
    }

    retry(
      function isDone () {
        return typeof isPrivate !== 'undefined'
      },
      function next (isTimeout) {
        callback(isPrivate)
      }
    )
  }

  detectPrivateMode(
    function (isPrivate) {
      if (!isPrivate) {
        checkIDBAndWorkerSupport()
        return
      }

      const privateModeDiv = document.createElement('div')
      privateModeDiv.classList.add('private-mode--error')
      privateModeDiv.innerHTML = 'This application doesnt work in private browsing mode'
      document.body.innerHTML = privateModeDiv.outerHTML
    }

  )
})()

// check IndexedDB and web worker support;
function checkIDBAndWorkerSupport () {
  const WORKER_SUPPORT = !!window.Worker

  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {
    READ_WRITE: 'readwrite'
  }
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

  if (!window.indexedDB && !WORKER_SUPPORT) {
    const supportedBrowsersDiv = document.createElement('div')
    supportedBrowsersDiv.classList.add('supported-browsers')

    const infoTextSpan = document.createElement('span')
    const infoText = document.createTextNode('Please use one of these browsers to run this application')
    infoTextSpan.classList.add('info-text')
    infoTextSpan.appendChild(infoText)
    supportedBrowsersDiv.appendChild(infoTextSpan)

    const browsersContainer = document.createElement('div')
    browsersContainer.classList.add('browser-support')
    supportedBrowsersDiv.appendChild(browsersContainer)
    document.body.innerHTML = supportedBrowsersDiv.outerHTML
    return
  }

  firebase.auth().onAuthStateChanged(function (auth) {
    // if user is signed in then run userIsSigned fn else run userSignedOut fn
    auth ? userIsSigned(auth) : userSignedOut()
  })
}

// when user is signed in call requestCreator function inside services.js
function userIsSigned (auth) {
  document.querySelector('.app').style.display = 'block'

  requestCreator('init')
}

// When user is signed out
function userSignedOut () {
  document.querySelector('.app').style.display = 'none'
  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  // DOM element to insert firebaseui login UI
  ui.start('#login-container', firebaseUiConfig())
}

// firebase config object

const config = {
  apiKey: 'AIzaSyB0D7Ln4r491ESzGA28rs6oQ_3C6RDeP-s',
  authDomain: 'growthfilev2-0.firebaseapp.com',
  databaseURL: 'https://growthfilev2-0.firebaseio.com',
  projectId: 'growthfilev2-0',
  storageBucket: 'growthfilev2-0.appspot.com'
}

// Initialize the firebase application

firebase.initializeApp(config)

// firebaseUI login config object
function firebaseUiConfig () {
  return {
    'callbacks': {
      'signInSuccess': function (user, credential, redirectUrl) {
        // Do not redirect
        return false
      },
      'signInFailure': function (error) {
        return handleUIError(error)
      }
    },
    'signInFlow': 'popup',
    'signInOptions': [

      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          type: 'image',
          size: 'normal',
          badge: 'bottomleft'
        },
        defaultCountry: 'IN',
        defaultNationalNumber: ''
      }

    ]
  }
}
