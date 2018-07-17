// Initialize the firebase application

firebase.initializeApp({

  apiKey: 'AIzaSyBgbeCmkuveYZwqKp43KNvlEgwumxRroVY',
  authDomain: 'growthfilev2-0.firebaseapp.com',
  databaseURL: 'https://growthfilev2-0.firebaseio.com',
  projectId: 'growthfilev2-0',
  storageBucket: 'growthfilev2-0.appspot.com'

})

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
        defaultCountry: 'IN'
      }
    ]
  }
}

firebase.auth().onAuthStateChanged(function (auth) {
  // if user is signed in then run userIsSigned fn else run userSignedOut fn
  auth ? userSignedIn(auth) : userSignedOut()
})

// when user is signed in call requestCreator function inside services.js
function userSignedIn (auth) {
  document.querySelector('.app').style.display = 'block'

  if (window.Worker && window.indexedDB) {
    // requestCreator is present inside service.js
    const req = window.indexedDB.open(auth.uid)
    req.onsuccess = function () {
      const db = req.result
      if (Object.keys(db.objectStoreNames).length === 0) {
        console.log('done')
        requestCreator('initializeIDB')
        return;
      } else {
        console.log('no')
        const rootTx = db.transaction(['root'], 'readwrite')
        const rootObjectStore = rootTx.objectStore('root')
        rootObjectStore.get(auth.uid).onsuccess = function (event) {
          const record = event.target.result
          record.view = 'default'
          rootObjectStore.put(record)
          rootTx.oncomplete = function () {
            
            listView()
            conversation(event.target.result.id)
            requestCreator('initializeIDB')
          }
        }
      }
    }
    return
  }

  firebase.auth().signOut().catch(signOutError)
}

// When user is signed out
function userSignedOut () {
  document.querySelector('.app').style.display = 'none'

  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  // DOM element to insert firebaseui login UI
  ui.start('#login-container', firebaseUiConfig())
}

function signOutError (error) {
  // handler error with snackbar
}
