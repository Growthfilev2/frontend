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
  const req = window.indexedDB.open(auth.uid)

  if (window.Worker && window.indexedDB) {
    // requestCreator is present inside service.js
    requestCreator('initializeIDB')
    // listView is present inside panel.js
    req.onsuccess = dbOpenSuccess
    req.onerror = dbOpenError

    return
  }

  firebase.auth().signOut().catch(signOutError)
}

function dbOpenSuccess (idbSuccess) {
  const db = idbSuccess.target.result
  if (Object.values(db.objectStoreNames).indexOf('activity') === -1) return
  listView(db.name)
}

function dbOpenError (error) {
  console.log(error)
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
