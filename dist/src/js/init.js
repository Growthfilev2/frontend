<<<<<<< HEAD
firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
});

=======
>>>>>>> development
var native = function () {
  return {
    setFCMToken: function setFCMToken(token) {
      localStorage.setItem('token', token);
    },
    getFCMToken: function getFCMToken() {
      return localStorage.getItem('token');
    },
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
          requestCreator('instant', JSON.stringify({
            message: e.message
          }));
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

var app = function () {
  return {

    today: function today(format) {
      if (!format) return moment();
      return moment().format(format);
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

    isNewDay: function isNewDay(auth) {
      var today = localStorage.getItem('today');

      if (today === "null" || today == null) {
        localStorage.setItem('today', moment().format('YYYY-MM-DD'));
        return true;
      }
      return !moment(moment().format('YYYY-MM-DD')).isSame(moment(today));
    },
    isCurrentTimeNearStart: function isCurrentTimeNearStart(emp) {
      var startTime = emp.attachment['Daily Start Time'].value;
      var format = 'hh:mm:ss';
      var offsetStartBefore = moment(startTime, format).subtract(15, 'minutes');
      var offsetStartAfter = moment(startTime, format).add(15, 'minutes');
      return moment().isBetween(offsetStartBefore, offsetStartAfter, null, '[]');
    },
    isCurrentTimeNearEnd: function isCurrentTimeNearEnd(emp) {

      var endTime = emp.attachment['Daily End Time'].value;
      var format = 'hh:mm:ss';
      var offsetEndBefore = moment(endTime, format).subtract(15, 'minutes');
      var offsetEndAfter = moment(endTime, format).add(15, 'minutes');

      return moment().isBetween(offsetEndBefore, offsetEndAfter, null, '[]');
    }
  };
}();

window.addEventListener('load', function () {
  var title = 'Device Incompatibility';
  var message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version';
  if (!window.Worker && !window.indexedDB) {
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
    try {
      Android.notification(JSON.stringify(messageData));
    } catch (e) {
      requestCreator('instant', JSON.stringify({
        message: e.message
      }));
      appDialog(message);
    }
    return;
  }

  firebase.initializeApp({
    apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
    authDomain: "growthfilev2-0.firebaseapp.com",
    databaseURL: "https://growthfilev2-0.firebaseio.com",
    projectId: "growthfilev2-0",
    storageBucket: "growthfilev2-0.appspot.com",
    messagingSenderId: "1011478688238"
  });

  moment.updateLocale('en', {
    calendar: {
      lastDay: '[yesterday]',
      sameDay: 'LT',
      nextDay: '[Tomorrow at] LT',
      lastWeek: 'dddd',
      nextWeek: 'dddd [at] LT',
      sameElse: 'L'
    },
    longDateFormat: {
      LT: "h:mm A",
      LTS: "h:mm:ss A",
      L: "DD/MM/YY"
    },

    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  });

  window.onerror = function (msg, url, lineNo, columnNo, error) {
    var errorJS = {
      message: {
        msg: error.message,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        stack: error.stack,
        name: error.name,
        device: native.getInfo()
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

  window.onpopstate = function (event) {

    if (!event.state) return;
    if (event.state[0] === 'listView') {
      window[event.state[0]]();
      return;
    }
    window[event.state[0]](event.state[1], false);
  };

  layoutGrid();

  startApp();
});

window.addEventListener('onMessage', function _onMessage(e) {
  requestCreator('Null', false);
});

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

  var alertDom = document.createElement('div');
  alertDom.id = 'alert--box';
  headerDiv.appendChild(createHeader('app-main-header'));
  layoutInner.appendChild(headerDiv);
  layoutInner.appendChild(currentPanel);
  layoutInner.appendChild(snackbar);
  layout.appendChild(layoutInner);
  layout.appendChild(alertDom);
  document.body.innerHTML = layout.outerHTML;
  imageViewDialog();
}

function createCheckInDialog() {

  var aside = document.createElement('aside');
  aside.className = 'mdc-dialog mdc-dialog--open hidden';
  aside.id = 'suggest-checkIn-dialog';

  var surface = document.createElement('div');
  surface.className = 'mdc-dialog__surface';
  surface.style.width = '90%';
  surface.style.height = 'auto';

  var header = document.createElement('header');
  header.className = 'mdc-dialog__header';
  var headerText = document.createElement('h2');
  headerText.className = 'mdc-dialog__header__title';
  headerText.textContent = 'New Location Detected';
  header.appendChild(headerText);
  var section = document.createElement('section');
  section.className = 'mdc-dialog__body';
  section.textContent = 'Growthfile detected a new location. Do you want to create a check-in ?';

  var footer = document.createElement('footer');
  footer.className = 'mdc-dialog__footer';

  var ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept';
  ok.textContent = 'Okay';
  ok.style.backgroundColor = '#3498db';

  var canel = document.createElement('button');
  canel.type = 'button';
  canel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel';
  canel.textContent = 'Cancel';
  canel.style.backgroundColor = '#3498db';

  footer.appendChild(canel);
  footer.appendChild(ok);

  surface.appendChild(header);
  surface.appendChild(section);
  surface.appendChild(footer);
  aside.appendChild(surface);

  var backdrop = document.createElement('div');
  backdrop.className = 'mdc-dialog__backdrop';
  aside.appendChild(backdrop);
  return aside;
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

function getEmployeeDetails() {
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser;
    var req = indexedDB.open(auth.uid);
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['children']);
      var store = tx.objectStore('children');
      var details = void 0;
      var phoneNumberEmp = auth.phoneNumber;
      var range = IDBKeyRange.bound(['employee', 'CONFIRMED'], ['employee', 'PENDING']);

      store.index('templateStatus').openCursor(range).onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.attachment['Employee Contact'].value !== auth.phoneNumber) {
          cursor.continue();
          return;
        }

        details = cursor.value;
        cursor.continue();
      };
      tx.oncomplete = function () {
        resolve(details);
      };
    };
  });
}

function isEmployeeOnLeave() {
  return new Promise(function (resolve, reject) {

    getEmployeeDetails().then(function (empDetails) {

      if (!empDetails) {
        return resolve({ onLeave: false });
      }

      empDetails.onLeave = false;
      var req = indexedDB.open(firebase.auth().currentUser.uid);
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction(['calendar']);
        var store = tx.objectStore('calendar');
        var range = IDBKeyRange.bound(['leave', 'CONFIRMED', empDetails.office], ['leave', 'PENDING', empDetails.office]);

        store.index('onLeave').openCursor(range).onsuccess = function (event) {

          var cursor = event.target.result;
          if (!cursor) return;

          if (moment(moment().format('YYYY-MM-DD')).isBetween(cursor.value.start, cursor.value.end, null, '[]')) {
            empDetails.onLeave = true;
            return;
          }
          cursor.continue();
        };
        tx.oncomplete = function () {
          resolve(empDetails);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
  });
}

function idbVersionLessThan3(auth) {
  return new Promise(function (resolve, reject) {

    var req = indexedDB.open(auth.uid, 3);
    var db = void 0;
    var reset = {
      value: false,
      version: ''
    };
    req.onupgradeneeded = function (evt) {
      switch (evt.oldVersion) {
        case 1:
          reset.value = true;
          reset.version = 1;
          break;
        case 2:
          value = false;
          reset.version = 2;
          var calendar = req.transaction.objectStore('calendar');
          calendar.createIndex('onLeave', ['template', 'status', 'office']);
          var children = req.transaction.objectStore('children');
          children.createIndex('templateStatus', ['template', 'status']);
          var map = req.transaction.objectStore('map');
          map.createIndex('byOffice', ['office', 'location']);
          break;
        case 3:
          value = false;
          reset.version = 3;
          break;
        default:
          reset.value = true;
          reset.version = '';
      }
    };
    req.onsuccess = function () {
      db = req.result;
      db.close();
      resolve(reset);
    };
    req.onerror = function () {
      reject({
        error: req.error.message,
        device: native.getInfo()
      });
    };
  });
}

function createNewIndex() {}

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
  document.getElementById("main-layout-app").style.display = 'block';
  idbVersionLessThan3(auth).then(function (reset) {
    if (localStorage.getItem('dbexist')) {
      from = 1;
      if (reset.value) {
        resetApp(auth, from);
        return;
      }

      requestCreator('now', {
        device: native.getInfo(),
        from: '',
        registerToken: native.getFCMToken()
      });

      openListWithChecks();

      return;
    }

    resetApp(auth, 0);
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify({
      message: error
    }));
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
      from: from,
      registerToken: native.getFCMToken()
    });
  }).catch(function (error) {
    snacks(error.message);
    requestCreator('instant', JSON.stringify({
      message: error
    }));
  });
}

<<<<<<< HEAD
function startInitializatioOfList(auth) {
  localStorage.removeItem('clickedActivity');
  setInterval(function () {
    manageLocation();
  }, 5000);
  app.isNewDay(auth).then(function (isNew) {
    suggestCheckIn(isNew).then(function () {
      requestCreator('now', {
        device: native.getInfo(),
        from: ''
      });
      listView({ urgent: isNew, nearby: false });
    });
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify({ message: error }));
=======
function runAppChecks(emp) {
  // suggest check in false

  window.addEventListener('locationChanged', function _locationChanged(e) {

    var dataObject = {
      urgent: false,
      nearby: false,
      checkin: false
    };

    if (emp.onLeave) {
      dataObject.checkin = false;
    }

    var changed = e.detail;
    var newDay = app.isNewDay();

    if (changed) {
      dataObject.nearby = true;
      dataObject.checkin = true;
      if (newDay) {
        dataObject.urgent = true;
      }
      startInitializatioOfList(dataObject);
      return;
    }

    if (newDay) {
      dataObject.urgent = true;
      dataObject.checkin = true;
      startInitializatioOfList(dataObject);
      return;
    };

    if (app.isCurrentTimeNearStart(emp)) {
      var hasAlreadyCheckedIn = localStorage.getItem('dailyStartTimeCheckIn');
      if (hasAlreadyCheckedIn == null) {
        localStorage.setItem('dailyStartTimeCheckIn', true);
        localStorage.removeItem('dailyEndTimeCheckIn');
        dataObject.checkin = true;
        startInitializatioOfList(dataObject);
      }
      return;
    }

    if (app.isCurrentTimeNearEnd(emp)) {
      var _hasAlreadyCheckedIn = localStorage.getItem('dailyEndTimeCheckIn');
      if (_hasAlreadyCheckedIn == null) {
        localStorage.setItem('dailyEndTimeCheckIn', true);
        localStorage.removeItem('dailyStartTimeCheckIn');
        dataObject.checkin = true;
        startInitializatioOfList(dataObject);
      }
      return;
    }

    return;
  }, true);
}

function startInitializatioOfList(data) {
  console.log(data);
  suggestCheckIn(data.checkin).then(function () {
    localStorage.removeItem('clickedActivity');
    if (history.state[0] === 'listView' || !history.state) {
      listView({
        urgent: data.urgent,
        nearby: data.nearby
      });
    }
  });
}

function openListWithChecks() {
  manageLocation();
  setInterval(function () {
    manageLocation();
  }, 5000);

  listView();
  isEmployeeOnLeave().then(function (emp) {
    runAppChecks(emp);
  });
}

function getFcmTokenFromAndroid(token) {
  return new Promise(function (resolve, reject) {
    var token = fcm.getToken();
    resolve(token);
>>>>>>> development
  });
}