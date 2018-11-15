firebase.initializeApp({
  apiKey: "AIzaSyBgbeCmkuveYZwqKp43KNvlEgwumxRroVY",
  authDomain: "growthfilev2-0.firebaseapp.com",
  databaseURL: "https://growthfilev2-0.firebaseio.com",
  projectId: "growthfilev2-0",
  storageBucket: "growthfilev2-0.appspot.com",
  messagingSenderId: "1011478688238"
})

window.addEventListener('load', function() {
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
  
    requestCreator('instant',errorJS)
  }

	
  //  if ('serviceWorker' in navigator) {
  //    console.log('webview started')
  //    initSW()
  //  } else {
  //   console.log("direct run")
  //    startApp()
  //  }

  //  startApp()
 
})

function initSW() {
  navigator.serviceWorker.register('/syncWorker.js').then(function(registration) {
    registration.addEventListener('updatefound', function() {
       // If updatefound is fired, it means that there's
       // a new service worker being installed.
      var installingWorker = registration.installing;
      console.log('A new service worker is being installed:',
        installingWorker);

      // You can listen for changes to the installing service worker's
      // state via installingWorker.onstatechange
    });

    startApp()
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  }, function(err) {
  //   // registration failed :(
    console.log('ServiceWorker registration failed: ', err);
  });

}


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
  if(localStorage.getItem('iosUUID')) {
    localStorage.setItem('deviceType', 'Ios')
  }
  else {
    localStorage.setItem('deviceType','Android')
  }

  layoutGrid()
  if (!window.Worker && !window.indexedDB) {
    let device  =''
    if(localStorage.getItem('deviceType') === 'Android') {
      device = AndroidId.getDeviceId()
    }
    else {
      device = localStorage.getItem('iosUUID')
    }
    handleUncompatibility(device)
    return
}


if(localStorage.getItem('deviceType') === 'Android') {
    if(parseInt(AndroidId.getDeviceId().split("&")[3]) <= 5) {
      handleUncompatibility(AndroidId.getDeviceId())
      return
    }
}



 
  firebase.auth().onAuthStateChanged(function (auth) {

    if(!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }
    
    console.log(auth)
    document.getElementById("main-layout-app").style.display = 'block'
    if (localStorage.getItem('dbexist')) {
      listView(true)
      if(localStorage.getItem('deviceType') === 'Android') {
       
        requestCreator('now',AndroidId.getDeviceId())
        manageLocation()
        return
      }
      requestCreator('now',localStorage.getItem('iosUUID'))
      manageLocation()
      return
    }
    
    console.log(auth)
    document.getElementById('app-current-panel').appendChild(loader('init-loader'))
    localStorage.setItem('dbexist', auth.uid)

    if(localStorage.getItem('deviceType') === 'Android') {
      requestCreator('now',AndroidId.getDeviceId())
    }
    else {
      requestCreator('now',localStorage.getItem('iosUUID'))
    }
    return
  })
}

function extractVersion(device){
  return device.split("&")[3];
}

function handleUncompatibility(device){
  let dialogMsg = '';
  localStorage.getItem('deviceType') === 'Ios' ? dialogMsg = 'Please upgrade your Ios version to use GrowthfileNew' : dialogMsg = `Please upgrade your Android version from ${extractVersion(device)} to 6.0 use GrowthfileNew`
  console.log(dialogMsg)
  
  commonDialog(dialogMsg)
  
  // if (localStorage.getItem('deviceType') === 'Ios'){
  //   requestCreator('instant',{
  //     message:{
  //       msg : "Ios phone not compatible",
  //       identifier : localStorage.getItem('iosUUID')
  //     }
  //   })
  // }
  // else {
  //   requestCreator('instant',{
  //     message: {
  //       msg : "Android phone not compatible",
  //       identifier : 'AndroidId.getDeviceId()'
  //     }
  //   })
  // }
  
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
