const appKey = new AppKeys();
let ui;
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
        return JSON.stringify({
          baseOs: this.getName(),
          deviceBrand: '',
          deviceModel: '',
          appVersion: 7,
          osVersion: '',
          id: '',
        })
      }
      if (this.getName() === 'Android')  return getDeviceInfomation();
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
      if (!today) {
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
    }
  }
}();

function getDeviceInfomation() {
  try {
    return {
      'id': AndroidInterface.getId(),
      'deviceBrand': AndroidInterface.getDeviceBrand(),
      'deviceModel': AndroidInterface.getDeviceMode(),
      'osVersion': AndroidInterface.getOsVersion(),
      'baseOs': AndroidInterface.getBaseOs(),
      'radioVersion': AndroidInterface.getRadioVersion(),
      'appVersion': AndroidInterface.getAppVersion()
    }
  } catch (e) {
    return JSON.parse(AndroidInterface.getDeviceId());
  }
}

window.addEventListener('load', function () {

  layoutGrid()


  firebase.initializeApp(appKey.getKeys())

  const title = 'Device Incompatibility'
  const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
  if (!window.Worker && !window.indexedDB) {
    try {
      AndroidInterface.showDialog(title, message);
    } catch (e) {
      const span = document.createElement('span')
      span.textContent = message;
      span.className = 'mdc-typography--body1'

      sendExceptionObject(e, 'Catch Type 1: AndroidInterface.showDialog at window.onload', [title, message])
      document.getElementById('dialog-container').innerHTML = dialog({
        id: 'device-incompatibility-dialog',
        headerText: title,
        content: span
      }).outerHTML
      const incompatibilityDialog = new mdc.dialog.MDCDialog(document.getElementById('device-incompatibility-dialog'))
      incompatibilityDialog.show()
    }
    return
  }

  moment.updateLocale('en', {
    calendar: {
      lastDay: '[yesterday]',
      sameDay: 'hh:mm',
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

  window.onpopstate = function (event) {

    if (!event.state) return;
    if (event.state[0] !== 'listView') return window[event.state[0]](event.state[1], false)

    const originalCount = scroll_namespace.count;
    if (originalCount) {
      scroll_namespace.size = originalCount
    }
    scroll_namespace.count = 0;
    window[event.state[0]]()
  }

  startApp(true)
})


function backNav() {
  history.back();
}

function resetScroll() {
  scroll_namespace.count = 0;
  scroll_namespace.size = 20;
  scroll_namespace.skip = false;
}

function firebaseUiConfig(value) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        if (value) {
          if (document.querySelector('#updateEmailDialog')) {
            document.querySelector('#updateEmailDialog').remove();
          }
          updateEmail(authResult.user, value);
          return false;
        }
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
        defaultNationalNumber: value ? firebase.auth().currentUser.phoneNumber : '',
      }
    ]

  };
}



function userSignedOut() {
  const login = document.createElement('div')
  login.id = 'login-container'
  document.body.appendChild(login)
  if (!ui) {
    ui = new firebaseui.auth.AuthUI(firebase.auth())
  }

  ui.start('#login-container', firebaseUiConfig());
}

function layoutGrid() {
  const layout = document.createElement('div')
  layout.classList.add('mdc-layout-grid', 'mdc-typography', 'app')
  layout.id = "main-layout-app"
  const layoutInner = document.createElement('div')
  layoutInner.className = 'mdc-layout-grid__inner cell-space'

  const currentPanel = document.createElement('div')
  currentPanel.id = 'app-current-panel'
  currentPanel.className = 'mdc-layout-grid__cell--span-12'

  const snackbar = document.createElement('div')
  snackbar.id = 'snackbar-container'

  const dialogContainer = document.createElement('div')
  dialogContainer.id = 'dialog-container'

  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  layout.appendChild(dialogContainer)
  document.getElementById('growthfile').innerHTML = layout.outerHTML
  new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
}

function startApp(start) {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    if (appKey.getMode() === 'production') {
      if (!native.getInfo()) {
        redirect();
        return;
      }
    }

    if (!localStorage.getItem('error')) {
      localStorage.setItem('error', JSON.stringify({}));
    }

    if (start) {
      const req = indexedDB.open(auth.uid, 3);
      let db;
      req.onupgradeneeded = function (evt) {
        db = req.result;

        db.onerror = function () {
          handleError({
            message: `${db.error.message} from startApp on upgradeneeded`
          })
          return;
        }
        createObjectStores(db, auth.uid)
      }

      req.onsuccess = function () {
        document.getElementById("main-layout-app").style.display = 'block'
        localStorage.setItem('dbexist', auth.uid);
        let getInstantLocation = false;
        if (native.getName() !== 'Android') {
          try {
            webkit.messageHandlers.startLocationService.postMessage('start fetchin location');

          } catch (e) {
            sendExceptionObject(e, 'Catch Type 2: webkit.messageHandlers.startLocationService', ['start fetchin location'])
            getInstantLocation = true

          }
        } else {
          getInstantLocation = true
        }
        resetScroll();
        listView();
        requestCreator('now', {
          device: JSON.stringify(native.getInfo()),
          from: '',
          registerToken: native.getFCMToken()
        })
        runAppChecks()

        if (!getInstantLocation) return;
        manageLocation().then(console.log).catch(function (error) {
          handleError(error)
        })
      }
      req.onerror = function () {
        handleError({
          message: `${req.error.message} from startApp`
        })
      }
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
      tx.onerror = function () {
        reject({
          message: `${tx.error.message} from getEmployeeDetails`
        })
      }
    }
    req.onerror = function () {
      reject({
        message: `${req.error.message} from getEmployeeDetails`
      })
    }
  })
}

function isEmployeeOnLeave() {
  return new Promise(function (resolve, reject) {

    getEmployeeDetails().then(function (empDetails) {

      if (!empDetails) {
        return resolve(false);
      }

      empDetails.onLeave = false
      const req = indexedDB.open(firebase.auth().currentUser.uid);
      req.onsuccess = function () {
        const db = req.result;
        const tx = db.transaction(['calendar']);
        const store = tx.objectStore('calendar');
        const range = IDBKeyRange.bound(['leave', 'CONFIRMED', empDetails.office], ['leave', 'PENDING', empDetails.office]);
        let onLeave = false;
        store.index('onLeave').openCursor(range).onsuccess = function (event) {

          const cursor = event.target.result;
          if (!cursor) return;

          if (moment(moment().format('YYYY-MM-DD')).isBetween(cursor.value.start, cursor.value.end, null, '[]')) {
            onLeave = true
            return;
          }
          cursor.continue()
        }
        tx.oncomplete = function () {
          resolve(onLeave)
        }
        tx.onerror = function () {
          reject({
            message: `${tx.error.message} from isEmployeeOnLeave`
          })
        }
      }
      req.onerror = function () {
        reject({
          message: `${req.error.message} from isEmployeeOnLeave`
        });
      }

    }).catch(function (error) {
      reject(error)
    })
  })
}


function createObjectStores(db, uid) {

  const activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  })

  activity.createIndex('timestamp', 'timestamp')
  activity.createIndex('office', 'office')
  activity.createIndex('hidden', 'hidden')

  const list = db.createObjectStore('list', {
    keyPath: 'activityId'
  })
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')

  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')

  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])

  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('urgent', ['status', 'hidden']),
    calendar.createIndex('onLeave', ['template', 'status', 'office']);

  const map = db.createObjectStore('map', {
    autoIncrement: true
  })

  map.createIndex('activityId', 'activityId')
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('nearby', ['status', 'hidden'])
  map.createIndex('byOffice', ['office', 'location'])

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);

  const root = db.createObjectStore('root', {
    keyPath: 'uid'
  });

  root.put({
    uid: uid,
    fromTime: 0,
    location: ''
  })
}

function redirect() {
  firebase.auth().signOut().then(function () {
    window.location = 'https://www.growthfile.com';
  }).catch(function (error) {
    window.location = 'https://www.growthfile.com';
    handleError({
      message: `${error} from redirect`
    })
  });
}


function initLocation() {
  manageLocation().then(console.log).catch(function (error) {
    handleError(error)
  });
}

function runAppChecks() {
  window.addEventListener('suggestCheckIn', function _suggestCheckIn(e) {

    isEmployeeOnLeave().then(function (onLeave) {
      if (onLeave) return
      if (e.detail) {
        if (history.state[0] === 'listView') {
          try {
            getRootRecord().then(function (record) {

              if (!record.offices) return;
              if (!record.offices.length) return;
              const offices = record.offices
              const message = document.createElement('h1')
              message.className = 'mdc-typography--body1 mt-10'
              message.textContent = 'Do you want to create a Check-In ?'
              document.getElementById('dialog-container').innerHTML = dialog({
                id: 'suggest-checkIn-dialog',
                headerText: 'Check-In Reminder',
                content: message,
                showCancel: true,
                showAccept: true
              }).outerHTML
              const checkInDialog = document.querySelector('#suggest-checkIn-dialog');
              var initCheckInDialog = new mdc.dialog.MDCDialog(checkInDialog);
              initCheckInDialog.show();
              initCheckInDialog.listen('MDCDialog:accept', function (evt) {
                if (!isLocationStatusWorking()) return;

                if (offices.length === 1) {
                  createTempRecord(offices[0], 'check-in', {
                    suggestCheckIn: true
                  });
                  return;
                }
                selectorUI({
                  record: '',
                  store: 'subscriptions',
                  suggestCheckIn: true
                })
              });
              initCheckInDialog.listen('MDCDialog:cancel', function () {
                checkInDialog.remove();
              })
              resetScroll();
              listView();
            })
          } catch (e) {
            console.log(e)
          }
        }
      }
    }).catch(handleError)
  }, true);
}