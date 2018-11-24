firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
})

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorJS = {
    message: {
      msg: msg,
      url: url,
      lineNo: lineNo,
      columnNo: columnNo,
      error: error
    }
  }

  requestCreator('instant', JSON.stringify(errorJS))
}


// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
})



window.addEventListener('load', function () {
  if (!window.Worker && !window.indexedDB) {
    const title = 'Device Incompatibility'
    const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
    const messageData = {
      title: title,
      message: message,
      cancelable: false,
      button: {
        text: '',
        show: false,
        clickAction:{
          redirection:{
            value:false,
            text:''
          }
        }
      }
    }
    Android.notification(JSON.stringify(messageData))
    return
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

  layoutGrid()

  startApp()

})

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'listView') {
    window[event.state[0]](true)
    return;
  }

  if (event.state[0] !== 'listView' && event.state[0] !== 'conversation' && event.state[0] !== 'updateCreateActivity') {
    const req = indexedDB.open(localStorage.getItem('dbexist'))
    req.onsuccess = function () {
      const db = req.result
      window[event.state[0]](event.state[1], db, false);
    }
    return;
  } 
  
  window[event.state[0]](event.state[1], false)
}

function backNav() {
  history.back();
}

function firebaseUiConfig(value) {

  return {
    'callbacks': {
      'signInSuccess': function (user) {
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

let native = function () {
  return {
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },
    setIosInfo: function (iosDeviceInfo) {
      const splitByName = iosDeviceInfo.split("&")
      const deviceInfo = {
        baseOs:splitByName[0],
        deviceBrand:splitByName[1],
        deviceModel:splitByName[2],
        appVersion:Number(splitByName[3]),
        osVersion:splitByName[4],
        id:splitByName[5],
        initConnection:splitByName[6]
      }
      
      localStorage.setItem('iosUUID', JSON.stringify(deviceInfo))
    },
    getIosInfo: function () {
      return localStorage.getItem('iosUUID');
    },
    getInfo: function () {
      if(!this.getName()) {
        return JSON.stringify({
          'id':'123',
          'appVersion':2,
          'baseOs':'macOs'
        })
      }
      if (this.getName() === 'Android') {
        return AndroidId.getDeviceId();
      }
      return this.getIosInfo();
    }
  } 
}();




function removeIDBInstance(auth) {


  return new Promise(function (resolve, reject) {

      const req = indexedDB.deleteDatabase(auth.uid)
      req.onsuccess = function () {
       
        resolve(true)
      }
      req.onerror = function () {
        reject(req.error)
      }
      
  })
}

function startApp() {
  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    document.getElementById("main-layout-app").style.display = 'block'
    init(auth);
  })
}

function init(auth) {

  /** When app has been initialzied before 
   * render list view first, then perform app sync and mange location
   */

  if (localStorage.getItem('dbexist')) {
    listView(true)
    requestCreator('now', native.getInfo())
    manageLocation()
    return
  }
  
  document.getElementById('growthfile').appendChild(loader('init-loader'))
  /** when app initializes for the first time */
  console.log("initialzie idb")
  const deviceInfo = JSON.parse(native.getInfo());

 
  removeIDBInstance(auth).then(function(isRemoved){
    if(isRemoved){
      requestCreator('now', native.getInfo())
    }
  }).catch(function(error){
    console.log(error)
  })
  return
}

