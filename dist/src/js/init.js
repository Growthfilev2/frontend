firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
});

window.addEventListener('load', function () {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    var errorJS = {
      message: {
        msg: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error
      }
    };

    requestCreator('instant', errorJS);
  };

  startApp();
});

function firebaseUiConfig(value) {

  return {
    'callbacks': {
      'signInSuccess': function signInSuccess(user, credential, redirectUrl) {
        if (value) {
          updateEmail(user, value);
          return;
        }

        // no redirect
        return false;
      },
      'signInFailure': function signInFailure(error) {
        return handleUIError(error);
      }
    },
    'signInFlow': 'popup',
    'signInOptions': [{
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,

      recaptchaParameters: {
        type: 'image',
        size: 'invisible',
        badge: 'bottomleft'
      },
      defaultCountry: 'IN'
    }]
  };
}

function userSignedOut() {
  var login = document.createElement('div');
  login.id = 'login-container';
  document.body.appendChild(login);

  var ui = new firebaseui.auth.AuthUI(firebase.auth() || '');
  ui.start('#login-container', firebaseUiConfig());
}

function layoutGrid() {
  var layout = document.createElement('div');
  layout.classList.add('mdc-layout-grid', 'mdc-typography', 'app');
  layout.id = "main-layout-app";
  var layoutInner = document.createElement('div');
  layoutInner.className = 'mdc-layout-grid__inner cell-space';

  var headerDiv = document.createElement('div');
  headerDiv.id = 'header';
  var currentPanel = document.createElement('div');
  currentPanel.id = 'app-current-panel';
  currentPanel.className = 'mdc-layout-grid__cell--span-12';

  var snackbar = document.createElement('div');
  snackbar.id = 'snackbar-container';

  var drawerDiv = document.createElement('div');
  drawerDiv.className = 'drawer--cont';

  layoutInner.appendChild(headerDiv);
  layoutInner.appendChild(currentPanel);
  layoutInner.appendChild(snackbar);
  layout.appendChild(layoutInner);
  document.body.innerHTML = layout.outerHTML;
  imageViewDialog();
}

function imageViewDialog() {

  var aside = document.createElement('aside');

  aside.id = 'viewImage--dialog-component';
  aside.className = 'mdc-dialog';
  aside.role = 'alertdialog';

  var dialogSurface = document.createElement('div');
  dialogSurface.className = 'mdc-dialog__surface';

  var section = document.createElement('section');
  section.className = 'mdc-dialog__content';

  var image = document.createElement("img");
  image.src = '';
  image.style.width = '100%';
  section.appendChild(image);

  dialogSurface.appendChild(section);

  aside.appendChild(dialogSurface);
  var backdrop = document.createElement('div');
  backdrop.className = 'mdc-dialog__backdrop';
  aside.appendChild(backdrop);

  document.body.appendChild(aside);
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

  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
});

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
});

function startApp() {
  if (localStorage.getItem('iosUUID')) {
    localStorage.setItem('deviceType', 'Ios');
  } else {
    localStorage.setItem('deviceType', 'Android');
  }

  layoutGrid();
  if (!window.Worker && !window.indexedDB) {
    var device = '';
    if (localStorage.getItem('deviceType') === 'Android') {
      device = AndroidId.getDeviceId();
    } else {
      device = localStorage.getItem('iosUUID');
    }
    handleUncompatibility(device);
    return;
  }

  if (localStorage.getItem('deviceType') === 'Android') {
    if (parseInt(AndroidId.getDeviceId().split("&")[3]) <= 5) {
      handleUncompatibility(AndroidId.getDeviceId());
      return;
    }
  }

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none';
      userSignedOut();
      return;
    }

    console.log(auth);
    document.getElementById("main-layout-app").style.display = 'block';
    if (localStorage.getItem('dbexist')) {
      listView(true);
      if (localStorage.getItem('deviceType') === 'Android') {

        requestCreator('now', AndroidId.getDeviceId());
        manageLocation();
        return;
      }
      requestCreator('now', localStorage.getItem('iosUUID'));
      manageLocation();
      return;
    }

    console.log(auth);
    document.getElementById('app-current-panel').appendChild(loader('init-loader'));
    localStorage.setItem('dbexist', auth.uid);

    if (localStorage.getItem('deviceType') === 'Android') {
      requestCreator('now', AndroidId.getDeviceId());
    } else {
      requestCreator('now', localStorage.getItem('iosUUID'));
    }
    return;
  });
}

function extractVersion(device) {
  return device.split("&")[3];
}

function handleUncompatibility(device) {
  var dialogMsg = '';
  localStorage.getItem('deviceType') === 'Ios' ? dialogMsg = 'Please upgrade your Ios version to use GrowthfileNew' : dialogMsg = "Please upgrade your Android version from " + extractVersion(device) + " to 6.0 use GrowthfileNew";
  console.log(dialogMsg);

  commonDialog(dialogMsg);
}

window.onpopstate = function (event) {

  if (!event.state) return;

  if (event.state[0] !== 'listView' && event.state[0] !== 'conversation' && event.state[0] !== 'updateCreateActivity') {
    var req = indexedDB.open(localStorage.getItem('dbexist'));
    req.onsuccess = function () {
      var db = req.result;
      window[event.state[0]](event.state[1], db, false);
    };
  } else if (event.state[0] === 'listView') {
    window[event.state[0]](true);
  } else {
    window[event.state[0]](event.state[1], false);
  }
};

function backNav() {

  history.back();
}

function UserCanExitApp() {
  FetchHistory.stateView(true);
}