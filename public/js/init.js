

firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
})


function firebaseUiConfig(value) {

  return {
    'callbacks': {
      'signInSuccess': function (user, credential, redirectUrl) {
        if (value) {
          updateEmail(user, value)
          return
        }

        // no redirect
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
          size: 'invisible',
          badge: 'bottomleft'
        },
        defaultCountry: 'IN'
      }
    ]
  }
}

function userSignedOut() {
  const login = document.createElement('div')
  login.id = 'login-container'
  document.body.appendChild(login)

  const ui = new firebaseui.auth.AuthUI(firebase.auth() || '')
  ui.start('#login-container', firebaseUiConfig())


}

function layoutGrid() {
  const layout = document.createElement('div')
  layout.classList.add('mdc-layout-grid', 'mdc-typography', 'app')
  layout.id = "main-layout-app"
  const layoutInner = document.createElement('div')
  layoutInner.className = 'mdc-layout-grid__inner cell-space'

  const headerDiv = document.createElement('div')
  headerDiv.id = 'header'
  const currentPanel = document.createElement('div')
  currentPanel.id = 'app-current-panel'
  currentPanel.className = 'mdc-layout-grid__cell--span-12'

  const snackbar = document.createElement('div')
  snackbar.id = 'snackbar-container'

  const drawerDiv = document.createElement('div')
  drawerDiv.className = 'drawer--cont'

  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  document.body.innerHTML = layout.outerHTML
  imageViewDialog()
}

function imageViewDialog() {

  const aside = document.createElement('aside')

  aside.id = 'viewImage--dialog-component'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const section = document.createElement('section')
  section.className = 'mdc-dialog__content'

  const image = document.createElement("img")
  image.src = ''
  image.style.width = '100%'
  section.appendChild(image)

  dialogSurface.appendChild(section)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)

  document.body.appendChild(aside)
}


moment.locale('en', {
  calendar: {
    lastDay: '[yesterday]',
    sameDay: 'LT',
    nextDay: '[Tomorrow at] LT',
    lastWeek: 'dddd',
    nextWeek: 'dddd [at] LT',
    sameElse: 'L'
  },

  months: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
  ]
})

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
})


function startApp() {
  
  layoutGrid()

  if (!window.Worker && !window.indexedDB) {
    firebase.auth().signOut().catch(signOutError)
    return
  }

  firebase.auth().onAuthStateChanged(function (auth) {
    
    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    document.getElementById("main-layout-app").style.display = 'block'
    if (localStorage.getItem('dbexist')) {
     listView(true)
      if(localStorage.getItem('deviceType') === 'Android') {
        requestCreator('now',AndroidId.getDeviceId())
        manageLocation()
        return
      }

      requestCreator('now','ios-testing')
      // requestCreator('now',localStorage.getItem('iosUUID'))
      manageLocation()
      return
    }

    document.getElementById('app-current-panel').appendChild(loader('init-loader'))
    localStorage.setItem('dbexist', auth.uid)
    let deviceInfo = ''
    try {
      deviceInfo = AndroidId.getDeviceId()
      requestCreator('now',deviceInfo)
      localStorage.setItem('deviceType','Android')
    } catch(e){
      localStorage.setItem('deviceType','Ios')
      // requestCreator('now',localStorage.getItem('iosUUID'))
      requestCreator('now','ios-testing')

      } 
    return
  })
}


window.onpopstate = function (event) {
  
  if (!event.state) return;

  if (event.state[0] !== 'listView' && event.state[0] !== 'conversation' && event.state[0] !== 'updateCreateActivity') {
    const req = indexedDB.open(localStorage.getItem('dbexist'))
    req.onsuccess = function () {
      const db = req.result
      window[event.state[0]](event.state[1], db, false);
    }
  } 
  
  else if (event.state[0] === 'listView') {
    window[event.state[0]](true)
  }
  
  else {
    window[event.state[0]](event.state[1], false)
  }

}

function backNav() {
  history.back();
}

function UserCanExitApp() {
  FetchHistory.stateView(true)
}
