firebase.initializeApp({
  apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
  authDomain: "growthfilev2-0.firebaseapp.com",
  databaseURL: "https://growthfilev2-0.firebaseio.com",
  projectId: "growthfilev2-0",
  storageBucket: "growthfilev2-0.appspot.com",
  messagingSenderId: "1011478688238"
})

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
        return JSON.stringify({
          'id': '123',
          'appVersion': 4,
          'baseOs': 'macOs'
        })
      }
      if (this.getName() === 'Android') {
        try {
          return AndroidId.getDeviceId();
        } catch (e) {
          requestCreator('instant', JSON.stringify({
            message: e.message
          }))
          return JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 4,
            osVersion: '',
            id: '',
          })
        }
      }
      return this.getIosInfo();
    }
  }
}();


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

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
})



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

  layoutGrid()

  startApp()

})

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'listView') {
    window[event.state[0]]()
    return;
  }
  window[event.state[0]](event.state[1], false)
}

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
      uiShown: function () {

      }
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
  headerText.textContent = 'New Location Detected'
  header.appendChild(headerText)
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
// new day suggest
// if location changes
let app = function () {
  return {

    today: function () {
      return moment();
    },
    format: function () {
      return this.today().format("DD/MM/YYYY")
    },
    tomorrow: function () {
      return moment(this.today()).add(1, 'day');
    },
    getLastLocationTime: function () {
      return new Promise(function (resolve, reject) {
        getRootRecord().then(function (rootRecord) {
          resolve(rootRecord.location.lastLocationTime);
        }).catch(function (error) {
          reject(error)
        })
      })
    },
    isNewDay: function (auth) {
      return new Promise(function (resolve, reject) {

        app.getLastLocationTime().then(function (time) {
          if (moment(time).isSame(this.today(), 'day')) {
            resolve(false);
          } else {
            resolve(true);
          }
        }).catch(function (error) {
          reject(error)
        })
      })
    },

    isCurrentTimeNearStart: function (startTime) {

      const offsetStartBefore = moment(startTime).subtract(15, 'minutes')
      const offsetStartAfter = moment(startTime).add(15, 'minutes');

      if (this.today().isBetween(offsetStartBefore, offsetStartAfter, null, '[]')) {
        return true
      }
      return false
    },
    isCurrentTimeNearEnd: function (endTime) {
      const offsetEndBefore = moment(endTime).subtract(15, 'minutes');
      const offsetEndAfter = moment(endTime).add(15, 'minutes');
      if (this.today().isBetween(offsetEndBefore, offsetEndAfter, null, '[]')) {
        return true
      }
      return false
    }
  }
}();

function getEmployeeDetails() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children']);
      const store = tx.objectStore('childrend');
      let details;
      store.index('template').openCursor('employee').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.status !== 'CONFIRMED') {
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
  getEmployeeDetails().then(function (empDetails) {

    empDetails.onLeave = false
    const req = indexedDB.open(auth);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['calendar']);
      const store = tx.objectStore('calendar');
      store.index('activityId').openCursor(empDetails.activityId, 'next').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.office !== empDetails.office) {
          cursor.continue();
          return;
        }

        if (cursor.value.template !== 'leave') {
          cursor.continue();
          return;
        }

        if (cursor.value.status !== 'CONFIRMED') {
          cursor.continue();
          return;
        }

        if (this.today().isBetween(cursor.value.start, cursor.value.end, null, '[]')) {
          empDetails.onLeave = true
          return;
        }
        cursor.continue()
      }
      tx.oncomplete = function () {
        resolve(isOnLeave)
      }
      tx.onerror = function () {
        reject(tx.error)
      }
    }
    req.onerror = function () {
      reject(req.error)
    }
  })
}


function idbVersionLessThan2(auth) {
  return new Promise(function (resolve, reject) {
    let value = false;
    const req = indexedDB.open(auth.uid, 2);
    let db;
    req.onupgradeneeded = function (evt) {
      if (evt.oldVersion === 1) {
        value = true
      } else {
        value = false;
      }
    }
    req.onsuccess = function () {
      db = req.result;
      db.close();
      resolve(value)
    }
    req.onerror = function () {
      reject({
        error: req.error,
        device: native.getInfo()
      })
    }
  })
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

  document.getElementById("main-layout-app").style.display = 'block'

  idbVersionLessThan2(auth).then(function (lessThanTwo) {

    if (localStorage.getItem('dbexist')) {
      from = 1;
      if (lessThanTwo) {
        resetApp(auth, from);
      } else {
        openListWithChecks()
      }
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
      from: from
    });

  }).catch(function (error) {
    snacks(error.message);
    requestCreator('instant', JSON.stringify({
      message: error
    }));
  })
}

function runAppChecks(auth) {
  return new Promise(function (resolve, reject) {
    isEmployeeOnLeave().then(function (emp) {
      // suggest check in false
      let dataObject = {
        urgent: false,
        nearby: false,
        checkin: false
      }
      if (emp.onLeave) {
          dataObject.checkin = false
      }

      window.addEventListener('locationChanged', function _listener(e) {
        const changed = e.detail;
        app.isNewDay().then(function (newDay) {

          if (changed) {
            dataObject.nearby = true;
            dataObject.checkin = true;
            if (newDay) {
              dataObject.urgent = true
            }
            return resolve(dataObject)
          }
          if (newDay) {
            dataObject.urgent = true
            if (isCurrentTimeNearStart(emp) || isCurrentTimeNearEnd(emp)) {
              dataObject.checkin = true
            }
          }
          return resolve(dataObject)
        })
      }, true);
    })
  }).catch(function(error){
    reject(error)
  })
}

function startInitializatioOfList(data) {
  suggestCheckIn(data.checkin).then(function () {
    localStorage.removeItem('clickedActivity');
    requestCreator('now', {
      device: native.getInfo(),
      from: ''
    });
    listView({
      urgent: data.urgent,
      nearby: data.nearby
    });
   
  })
}

function openListWithChecks(){
  manageLocation();
  setInterval(function () {
    manageLocation();
  }, 5000);       

  runAppChecks(auth).then(startInitializatioOfList).catch(function (error) {
    requestCreator('instant', JSON.stringify({
      message: JSON.stringify(error)
    }))
    return {checkin:false,urgent:false,nearby:false}
  }).then(startInitializatioOfList)
}