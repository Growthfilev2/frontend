firebase.initializeApp({
  apiKey: "AIzaSyCadBqkHUJwdcgKT11rp_XWkbQLFAy80JQ",
    authDomain: "growthfilev2-0.firebaseapp.com",
    databaseURL: "https://growthfilev2-0.firebaseio.com",
    projectId: "growthfilev2-0",
    storageBucket: "growthfilev2-0.appspot.com",
    messagingSenderId: "1011478688238"
})

window.onerror = function(msg,url,lineNo,columnNo,error){
  const errorJS  = {
    message : {
      msg : msg,
      url :url,
      lineNo:lineNo,
      columnNo :columnNo,
      error:error
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



window.addEventListener('load', function() {
  if (!window.Worker && !window.indexedDB) {
    const title = 'Device Incompatibility'
    const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
    updateApp.notification({title:title,message:message})
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

let native = function(){
  return {
    setName : function(device){
      localStorage.setItem('deviceType',device);
    },
    getName : function(){
      return localStorage.getItem('deviceType');
    },
    setIosInfo : function(iosDeviceInfo){
      localStorage.setItem('iosUUID',iosDeviceInfo)
    },
    getIosInfo : function(){
      return localStorage.getItem('iosUUID');
    },
    getInfo : function(){
      if(this.getName === 'Android'){
        return AndroidId.getDeviceId();
      }
      return this.getIosInfo();
    }
  }
}();

function checkIndexedDbSanitization() {
  return new Promise(function(resolve){
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function(){
      const totalObjectStores = 9
      const db =req.result;
      if(Object.keys(db.objectStoreNames).length < totalObjectStores) {
        resolve(false)    
      }
      else {
        resolve(true)
      }
    }    
  })
}

function revokeSession(){
  firebase.auth().signOut().then(function () {
    const req = indexedDB.deleteDatabase(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      localStorage.removeItem('dbexist')
    }
    req.onerror = function () {
      instant(createLog(error))
    }
  }, function (error) {
    instant(createLog(error))
  })
}


function startApp() {
  
  fisrebase.auth().onAuthStateChanged(function (auth) {

    if(!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    document.getElementById("main-layout-app").style.display = 'block'

    checkIndexedDbSanitization().then(init)

  })
}



function init(idbSanitized){

  if(!idbSanitized) {
    revokeSession()
    return
  }

  /** When app has been initialzied before 
   * render list view first, then perform app sync and mange location
  */
  
  if (localStorage.getItem('dbexist')) {
    listView(true)
    requestCreator('now',native.getInfo())
    manageLocation()
    return
  }
  
  /** when app initializes for the first time */
  document.getElementById('app-current-panel').appendChild(loader('init-loader'))
  localStorage.setItem('dbexist', auth.uid)
  requestCreator('now',native.getInfo())
  return

}

