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
      'signInSuccess': function(user, credential, redirectUrl) {
        if (value) {
          updateEmail(user, value)
          return
        }

        // no redirect
        return false
      },
      'signInFailure': function(error) {
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

  // DOM element to insert firebaseui login UI
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

  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  document.body.innerHTML = layout.outerHTML
  imageViewDialog()
}

function imageViewDialog(){

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
  if (window.Worker && window.indexedDB) {

    layoutGrid()
    if (localStorage.getItem('dbexist')) {
      requestCreator('initializeIDB', {
        firstTime: false
      })
      listView(localStorage.getItem('dbexist'))
    } else {
      requestCreator('initializeIDB', {
        firstTime: true
      })
    }
  } else {
    console.log("cannot run in this mode")
    firebase.auth().signOut().catch(signOutError)
  }
}


function handleViewFromHistory(backFromAndroid) {

  if (backFromAndroid && history.state[0] === 'listView') {
    UserCanExitApp()
    return;
  }

  window.history.go(-1)
  window.onpopstate = function(event) {
    const views = {
      listView: listView,
      conversation: conversation,
      updateCreateActivity: updateCreateActivity,
      Confirmed: filterActivities,
      Pending:filterActivities,
      Cancelled:filterActivities,
      Incoming:sortByCreator,
      Outgoing:sortByCreator,
      Urgent:sortByDates,
      Nearby:sortActivitiesByLocation
    }

    if(!event.state) return
    if(event.state[0] === 'Confirmed' || event.state[0] === 'Pending' || event.state[0] === 'Cancelled' ||  event.state[0] === 'Outgoing' ||  event.state[0] === 'Incoming' ||  event.state[0] === 'Urgent' ||  event.state[0] === 'Nearby') {
      const req = indexedDB.open(event.state[1])
      req.onsuccess = function(){
        const db = req.result
        views[event.state[0]](event.state[0],db);
      }
    }
    else {
      views[event.state[0]](event.state[1]);
    }
  }
}

function UserCanExitApp() {
  FetchHistory.stateView(true)
}



document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

var xDown = null;
var yDown = null;

function getTouches(evt) {
  return evt.touches
}

function handleTouchStart(evt) {
    xDown = getTouches(evt)[0].clientX;
    yDown = getTouches(evt)[0].clientY;
};

function handleTouchMove(evt) {
    if ( ! xDown || ! yDown ) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff < 0 ) {
          androidSwiper(true)
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;
};
