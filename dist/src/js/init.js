firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
});

var native = function () {
  return {
    setName: function setName(device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function getName() {
      return localStorage.getItem('deviceType');
    },
    setIosInfo: function setIosInfo(iosDeviceInfo) {
      var splitByName = iosDeviceInfo.split("&");
      var deviceInfo = {
        baseOs: splitByName[0],
        deviceBrand: splitByName[1],
        deviceModel: splitByName[2],
        appVersion: Number(splitByName[3]),
        osVersion: splitByName[4],
        id: splitByName[5],
        initConnection: splitByName[6]
      };

      localStorage.setItem('iosUUID', JSON.stringify(deviceInfo));
    },
    getIosInfo: function getIosInfo() {
      return localStorage.getItem('iosUUID');
    },
    getInfo: function getInfo() {
      if (!this.getName()) {
        return JSON.stringify({
          'id': '123',
          'appVersion': 4,
          'baseOs': 'macOs'
        });
      }
      if (this.getName() === 'Android') {
        try {
          return AndroidId.getDeviceId();
        } catch (e) {
          requestCreator('instant', JSON.stringify({ message: e.message }));
          return JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 4,
            osVersion: '',
            id: ''
          });
        }
      }
      return this.getIosInfo();
    }
  };
}();

window.onerror = function (msg, url, lineNo, columnNo, error) {
  var errorJS = {
    message: {
      msg: error.message,
      url: url,
      lineNo: lineNo,
      columnNo: columnNo,
      stack: error.stack,
      name: error.name,
      device: native.getInfo(),
      state: history.state ? history.state[0] :''
    }
  };
  requestCreator('instant', JSON.stringify(errorJS));
};

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
});

window.addEventListener('load', function () {
  if (!window.Worker && !window.indexedDB) {
    var title = 'Device Incompatibility';
    var message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version';
    var messageData = {
      title: title,
      message: message,
      cancelable: false,
      button: {
        text: '',
        show: false,
        clickAction: {
          redirection: {
            value: false,
            text: ''
          }
        }
      }
    };
    Android.notification(JSON.stringify(messageData));
    return;
  }

  moment.updateLocale('en', {
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

  layoutGrid();

  startApp();
});

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'listView') {
    window[event.state[0]]();
    return;
  }
  window[event.state[0]](event.state[1], false);
};

function backNav() {
  history.back();
}

function firebaseUiConfig(value) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function signInSuccessWithAuthResult(authResult) {

        if (value) {
          updateEmail(authResult.user, value);
        } else {
          init(authResult.user);
        }
        return false;
      },
      uiShown: function uiShown() {}
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'normal', // 'invisible' or 'compact'
        badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
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

  headerDiv.appendChild(createHeader('app-main-header'));
  layoutInner.appendChild(headerDiv);
  layoutInner.appendChild(currentPanel);
  layoutInner.appendChild(snackbar);
  layout.appendChild(layoutInner);
  document.body.innerHTML = layout.outerHTML;
  imageViewDialog();
}

function createHeader(id) {

  var header = document.createElement('header');
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1';
  header.id = id;

  var row = document.createElement('div');
  row.className = 'mdc-top-app-bar__row';

  var sectionStart = document.createElement('section');
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start';

  var leftUI = document.createElement('div');
  leftUI.id = id + 'view-type';
  leftUI.className = 'view-type';
  sectionStart.appendChild(leftUI);

  var sectionEnd = document.createElement('div');
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end';

  var rightUI = document.createElement('div');
  rightUI.id = id + 'action-data';

  rightUI.className = 'action-data';

  sectionEnd.appendChild(rightUI);
  row.appendChild(sectionStart);
  row.appendChild(sectionEnd);
  header.appendChild(row);
  return header;
}

function drawerDom() {
  var div = document.createElement('div');
  div.id = 'drawer-parent';

  var aside = document.createElement('aside');
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography';

  var nav = document.createElement('nav');
  nav.className = 'mdc-drawer__drawer';

  var header = document.createElement('header');
  header.className = 'mdc-drawer__header drawer--header';

  var headerContent = document.createElement('div');
  headerContent.className = 'mdc-drawer__header-content';

  var ImageDiv = document.createElement('div');
  ImageDiv.className = 'drawer--header-div';
  ImageDiv.onclick = function () {
    profileView(true);
  };
  var headerIcon = document.createElement('img');
  headerIcon.className = 'drawer-header-icon';

  headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg';

  var headerDetails = document.createElement('div');
  headerDetails.className = 'header--details';

  var name = document.createElement('div');
  name.className = 'mdc-typography--subtitle';
  name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber;

  headerDetails.appendChild(name);

  ImageDiv.appendChild(headerIcon);
  headerContent.appendChild(ImageDiv);
  headerContent.appendChild(headerDetails);
  header.appendChild(headerContent);

  var navContent = document.createElement('nav');

  navContent.className = 'mdc-drawer__content mdc-list filter-sort--list';

  nav.appendChild(header);
  nav.appendChild(navContent);
  aside.appendChild(nav);
  div.appendChild(aside);
  document.body.appendChild(div);
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

function startApp() {
  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none';
      userSignedOut();
      return;
    }
    if (localStorage.getItem('dbexist')) {
      init(auth);
    }
  });
}
// new day suggest
// if location changes
var app = function () {
  return {
    today: function today() {
      return moment().format("DD/MM/YYYY");
    },
    tomorrow: function tomorrow() {
      return moment(this.today()).add(1, 'day');
    },
    getLastLocationTime: function getLastLocationTime() {
      return new Promise(function (resolve, reject) {
        getRootRecord().then(function (rootRecord) {
          resolve(rootRecord.location.lastLocationTime);
        }).catch(function (error) {
          reject(error);
        });
      });
    },
    isNewDay: function isNewDay() {
      return new Promise(function (resolve, reject) {
        app.getLastLocationTime().then(function (time) {
          if (moment(time).isSame(moment(), 'day')) {
            resolve(false);
          } else {
            resolve(true);
          }
        }).catch(function (error) {
          reject(error);
        });
      });
    }
  };
}();

function idbVersionLessThan2(auth) {
  return new Promise(function (resolve, reject) {
    var value = false;
    var req = indexedDB.open(auth.uid, 2);
    var db = void 0;
    req.onupgradeneeded = function (evt) {
      if (evt.oldVersion === 1) {
        value = true;
      } else {
        value = false;
      }
    };
    req.onsuccess = function () {
      db = req.result;
      db.close();
      resolve(value);
    };
    req.onerror = function () {
      reject({ error: req.error, device: native.getInfo() });
    };
  });
}

function removeIDBInstance(auth) {

  return new Promise(function (resolve, reject) {
    var failure = {
      message: 'Please Restart The App',
      error: '',
      device: native.getInfo()
    };

    var req = indexedDB.deleteDatabase(auth.uid);
    req.onsuccess = function () {
      resolve(true);
    };
    req.onblocked = function () {
      failure.error = 'Couldnt delete DB because it is busy.App was openend when new code transition took place';
      reject(failure);
    };
    req.onerror = function () {
      failure.error = req.error;
      reject(failure);
    };
  });
}

function init(auth) {

  drawerDom();
  document.getElementById("main-layout-app").style.display = 'block';

  idbVersionLessThan2(auth).then(function (lessThanTwo) {

    if (localStorage.getItem('dbexist')) {
      from = 1;
      if (lessThanTwo) {
        resetApp(auth, from);
      } else {
        startInitializatioOfList(auth);
      }
      return;
    }

    resetApp(auth, 0);
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify({ message: error }));
  });
}

function resetApp(auth, from) {
  removeIDBInstance(auth).then(function () {
    localStorage.removeItem('dbexist');
    history.pushState(null, null, null);
    document.getElementById('growthfile').appendChild(loader('init-loader'));

    setTimeout(function () {
      snacks('Growthfile is Loading. Please Wait');
    }, 1000);

    requestCreator('now', {
      device: native.getInfo(),
      from: from
    });
  }).catch(function (error) {
    snacks(error.message);
    requestCreator('instant', JSON.stringify({ message: error }));
  });
}

function startInitializatioOfList(auth) {
  localStorage.removeItem('clickedActivity');
  app.isNewDay(auth).then(function (isNew) {
    setInterval(function () {
      manageLocation();
    }, 5000);

    requestCreator('now', {
      device: native.getInfo(),
      from: ''
    });

    suggestCheckIn(isNew).then(function () {
      listView({ urgent: isNew, nearby: isNew });
    }).catch(function (error) {
      requestCreator('instant', JSON.stringify({ message: error }));
    });
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify({ message: error }));
  });
}