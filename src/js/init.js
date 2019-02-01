let native = function () {
  return {
    setFCMToken: function (token) {
      localStorage.setItem('token', token)
    },
    getFCMToken: function () {
      return localStorage.getItem('token')
    },
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },
    setIosInfo: function (iosDeviceInfo) {
      const splitByName = iosDeviceInfo.split("&")
      const deviceInfo = {
        baseOs: splitByName[0],
        deviceBrand: splitByName[1],
        deviceModel: splitByName[2],
        appVersion: Number(splitByName[3]),
        osVersion: splitByName[4],
        id: splitByName[5],
        initConnection: splitByName[6]
      }

      localStorage.setItem('iosUUID', JSON.stringify(deviceInfo))
    },
    getIosInfo: function () {
      return localStorage.getItem('iosUUID');
    },
    getInfo: function () {
      if (!this.getName()) {
        return false;
      }
      
      if (this.getName() === 'Android') {
        try {
          return AndroidInterface.getDeviceId();
        } catch (e) {
          requestCreator('instant', JSON.stringify({
            message: e.message
          }))
          return JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 5,
            osVersion: '',
            id: '',
          })
        }
      }
      return this.getIosInfo();
    }
  }
}();

let app = function () {
  return {

    today: function (format) {
      if (!format) return moment();
      return moment().format(format);
    },

    tomorrow: function () {
      return moment(this.today()).add(1, 'day');
    },
    isNewDay: function (auth) {
      var today = localStorage.getItem('today');
      if (today === "null" || today == null) {
        localStorage.setItem('today', moment().format('YYYY-MM-DD'));
        return true;
      }
      const isSame = moment(moment().format('YYYY-MM-DD')).isSame(moment(today));
      if (isSame) {
        return false;
      } else {
        localStorage.setItem('today', moment().format('YYYY-MM-DD'))
        return true
      }
    },
    isCurrentTimeNearStart: function (emp) {
      const startTime = emp.attachment['Daily Start Time'].value
      const format = 'hh:mm'
      const offsetStartBefore = moment(startTime, format).subtract(15, 'minutes')
      const offsetStartAfter = moment(startTime, format).add(15, 'minutes');
      return moment().isBetween(offsetStartBefore, offsetStartAfter, null, '[]')
    },
    isCurrentTimeNearEnd: function (emp) {
      const endTime = emp.attachment['Daily End Time'].value
      const format = 'hh:mm'
      const offsetEndBefore = moment(endTime, format).subtract(15, 'minutes');
      const offsetEndAfter = moment(endTime, format).add(15, 'minutes');
      return moment().isBetween(offsetEndBefore, offsetEndAfter, null, '[]')
    }
  }
}();


window.addEventListener('load', function () {

  const title = 'Device Incompatibility'
  const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
  if (!window.Worker && !window.indexedDB) {
    const messageData = {
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
    }
    try {
      Android.notification(JSON.stringify(messageData))
    } catch (e) {
      requestCreator('instant', JSON.stringify({
        message: e.message
      }))
      appDialog(message);
    }
    return
  }



  firebase.initializeApp({
    apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
    authDomain: "growthfilev2-0.firebaseapp.com",
    databaseURL: "https://growthfilev2-0.firebaseio.com",
    projectId: "growthfilev2-0",
    storageBucket: "growthfilev2-0.appspot.com",
    messagingSenderId: "1011478688238"
  })


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
      L: "DD/MM/YY",
    },

    months: [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ]

  })

  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorJS = {
      message: {
        msg: error.message,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        stack: error.stack,
        name: error.name,
        device: native.getInfo(),
      }
    }
    requestCreator('instant', JSON.stringify(errorJS))
  }

  window.onpopstate = function (event) {

    if (!event.state) return;
    if (event.state[0] === 'listView') {
      document.getElementById('growthfile').appendChild(loader('init-loader'))
      const originalCount = scroll_namespace.count;
      scroll_namespace.size = originalCount
      scroll_namespace.count = 0;
      window[event.state[0]]()
      return;
    }
    window[event.state[0]](event.state[1], false)
  }
  layoutGrid()
  startApp()
})


window.addEventListener('onMessage', function _onMessage(e) {
  requestCreator('Null', false)
})

function backNav() {
  history.back();
}

function firebaseUiConfig(value) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        if (value) {
          updateEmail(authResult.user, value);
        } else {
          init(authResult.user);
        }
        return false;
      },
      signInFailure: function (error) {

        return handleUIError(error)
      },
      uiShown: function () {}
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
        defaultCountry: 'IN',
      }
    ]

  };
}

function userSignedOut() {
  const login = document.createElement('div')
  login.id = 'login-container'
  document.body.appendChild(login)

  const ui = new firebaseui.auth.AuthUI(firebase.auth() || '')
  ui.start('#login-container', firebaseUiConfig());

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

  const alertDom = document.createElement('div')
  alertDom.id = 'alert--box'
  headerDiv.appendChild(createHeader('app-main-header'))
  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  layout.appendChild(alertDom)
  document.body.innerHTML = layout.outerHTML
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

  const header = document.createElement('header');
  header.className = 'mdc-dialog__header'
  const headerText = document.createElement('h2')
  headerText.className = 'mdc-dialog__header__title'
  headerText.textContent = 'Reminder'
  header.appendChild(headerText)
  var section = document.createElement('section');
  section.className = 'mdc-dialog__body';
  section.textContent = 'Check-in ?';

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

  surface.appendChild(header)
  surface.appendChild(section);
  surface.appendChild(footer);
  aside.appendChild(surface);

  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop);
  return aside

}

function createHeader(id) {

  const header = document.createElement('header')
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1'
  header.id = id

  const row = document.createElement('div')
  row.className = 'mdc-top-app-bar__row'

  const sectionStart = document.createElement('section')
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start'

  const leftUI = document.createElement('div')
  leftUI.id = id + 'view-type'
  leftUI.className = 'view-type'
  sectionStart.appendChild(leftUI)

  const sectionEnd = document.createElement('div')
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end'

  const rightUI = document.createElement('div')
  rightUI.id = id + 'action-data'

  rightUI.className = 'action-data'

  sectionEnd.appendChild(rightUI)
  row.appendChild(sectionStart)
  row.appendChild(sectionEnd)
  header.appendChild(row)
  return header
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

  var footer = document.createElement('footer');
  footer.className = 'mdc-dialog__footer';

  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel';
  cancel.textContent = 'cancel';
  cancel.style.backgroundColor = '#3498db';

  footer.appendChild(cancel)
  dialogSurface.appendChild(footer)
  aside.appendChild(dialogSurface)

  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)

  document.body.appendChild(aside)
}

function startApp() {
  
  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    if (localStorage.getItem('dbexist')) {
      init(auth)
    }
  })
}


function getEmployeeDetails() {
  return new Promise(function (resolve, reject) {
    const auth = firebase.auth().currentUser
    const req = indexedDB.open(auth.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children']);
      const store = tx.objectStore('children');
      let details;
      const phoneNumberEmp = auth.phoneNumber;
      const range = IDBKeyRange.bound(['employee', 'CONFIRMED'], ['employee', 'PENDING']);

      store.index('templateStatus').openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.attachment['Employee Contact'].value !== auth.phoneNumber) {
          cursor.continue();
          return;
        }

        details = cursor.value
        cursor.continue();
      }
      tx.oncomplete = function () {
        resolve(details);
      }
    }
  })
}

function isEmployeeOnLeave() {
  return new Promise(function (resolve, reject) {

    getEmployeeDetails().then(function (empDetails) {

      if (!empDetails) {
        return resolve(false)
      }

      empDetails.onLeave = false
      const req = indexedDB.open(firebase.auth().currentUser.uid);
      req.onsuccess = function () {
        const db = req.result;
        const tx = db.transaction(['calendar']);
        const store = tx.objectStore('calendar');
        const range = IDBKeyRange.bound(['leave', 'CONFIRMED', empDetails.office], ['leave', 'PENDING', empDetails.office]);

        store.index('onLeave').openCursor(range).onsuccess = function (event) {

          const cursor = event.target.result;
          if (!cursor) return;

          if (moment(moment().format('YYYY-MM-DD')).isBetween(cursor.value.start, cursor.value.end, null, '[]')) {
            empDetails.onLeave = true
            return;
          }
          cursor.continue()
        }
        tx.oncomplete = function () {
          resolve(empDetails)
        }
        tx.onerror = function () {
          reject(tx.error)
        }
      }
      req.onerror = function () {
        reject(req.error)
      }

    })
  })
}

function idbVersionLessThan3(auth) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(auth.uid, 3);
    let db;
    let reset = {
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
          const calendar = req.transaction.objectStore('calendar');
          calendar.createIndex('onLeave', ['template', 'status', 'office']);
          const children = req.transaction.objectStore('children');
          children.createIndex('templateStatus', ['template', 'status']);
          const map = req.transaction.objectStore('map');
          map.createIndex('byOffice', ['office', 'location']);

          break;
        case 3:
          value = false;
          reset.version = 3
          break;
        default:
          reset.value = true;
          reset.version = ''
      }
    }
    req.onsuccess = function () {
      db = req.result;
      db.close();
      resolve(reset)
    }
    req.onerror = function () {
      reject({
        error: req.error.message,
        device: native.getInfo()
      })
    }
  })
}

function createNewIndex() {

}

function removeIDBInstance(auth) {

  return new Promise(function (resolve, reject) {
    const failure = {
      message: 'Please Restart The App',
      error: '',
      device: native.getInfo()
    };

    const req = indexedDB.deleteDatabase(auth.uid)
    req.onsuccess = function () {
      resolve(true)
    }
    req.onblocked = function () {
      failure.error = 'Couldnt delete DB because it is busy.App was openend when new code transition took place';
      reject(failure)
    }
    req.onerror = function () {
      failure.error = req.error
      reject(failure)
    }
  })
}

function init(auth) {
  // if(!native.getName()) {
  //   redirect();
  //   return
  // }
  document.getElementById("main-layout-app").style.display = 'block'
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
      })
      openListWithChecks()
      return;
    }
    resetApp(auth, 0)
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
    document.getElementById('growthfile').appendChild(loader('init-loader'))

    setTimeout(function () {
      snacks('Growthfile is Loading. Please Wait');
    }, 1000)
 
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
  })
}


function runAppChecks() {
  // suggest check in false

  window.addEventListener('locationChanged', function _locationChanged(e) {
    isEmployeeOnLeave().then(function (emp) {

      var dataObject = {
        urgent: false,
        nearby: false,
      };
      if (emp) {
        dataObject['checkin'] = !emp.onLeave
      } else {
        dataObject['checkin'] = false
      }


      var changed = e.detail;
      var newDay = app.isNewDay();
      if (changed && newDay) {
        dataObject.nearby = true;
        dataObject.urgent = true;
        startInitializatioOfList(dataObject);
        return;
      }

      if (changed) {
        dataObject.nearby = true;
        startInitializatioOfList(dataObject);
        return;
      }

      if (newDay) {
        dataObject.urgent = true;
        localStorage.removeItem('dailyStartTimeCheckIn');
        localStorage.removeItem('dailyEndTimeCheckIn');
        startInitializatioOfList(dataObject);
        return;
      };

      if (!emp) return

      if (app.isCurrentTimeNearStart(emp)) {
        const hasAlreadyCheckedIn = localStorage.getItem('dailyStartTimeCheckIn');
        if (hasAlreadyCheckedIn == null) {
          localStorage.setItem('dailyStartTimeCheckIn', true);
          if (!emp.onLeave) {
            dataObject.checkin = true;
          }
          startInitializatioOfList(dataObject);
        }
        return;
      }

      if (app.isCurrentTimeNearEnd(emp)) {
        const hasAlreadyCheckedIn = localStorage.getItem('dailyEndTimeCheckIn');
        if (hasAlreadyCheckedIn == null) {
          localStorage.setItem('dailyEndTimeCheckIn', true);
          if (!emp.onLeave) {
            dataObject.checkin = true;
          }
          startInitializatioOfList(dataObject);
        }
        return;
      }
      return;
    })
  }, true);
}

function startInitializatioOfList(data) {
  suggestCheckIn(data.checkin).then(function () {
    localStorage.removeItem('clickedActivity');
    if (history.state[0] === 'listView' || !history.state) {
      listView({
        urgent: data.urgent,
        nearby: data.nearby
      });
    }
  })
}


function openListWithChecks() {
  listView({urgent:false,nearby:false});
  runAppChecks();
  setInterval(function(){
  manageLocation().then(function (location) {
    updateLocationInRoot(location).then(locationUpdationSuccess).catch(locationError);
  }).catch(locationError);
  },5000);
}