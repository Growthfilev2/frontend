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

      if (this.getName() === 'Android') {
        try {
          return AndroidInterface.getDeviceId();
        } catch (e) {
          sendExceptionObject(e, `Catch Type 3: AndroidInterface.getDeviceId in native.getInfo()`, []);

          return JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 7,
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


window.addEventListener('load', function () {
  layoutGrid()
  
  firebase.initializeApp({
    apiKey: "AIzaSyCadBqkHUJwdcgKT11rp_XWkbQLFAy80JQ",
    authDomain: "growthfilev2-0.firebaseapp.com",
    databaseURL: "https://growthfilev2-0.firebaseio.com",
    projectId: "growthfilev2-0",
    storageBucket: "growthfilev2-0.appspot.com",
    messagingSenderId: "1011478688238"
  })



  const title = 'Device Incompatibility'
  const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
  if (!window.Worker && !window.indexedDB) {
    try {
      AndroidInterface.showDialog(title, message);
    } catch (e) {
      const span = document.createElement('span')
      span.textContent = message;
      span.className = 'mdc-typography--headline6'

      sendExceptionObject(e, 'Catch Type 1: AndroidInterface.showDialog at window.onload', [title, message])
      document.getElementById('dialog-container').innerHTML = dialog({id:'device-incompatibility-dialog',headerText:title,content:span}).outerHTML
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
    if (event.state[0] === 'listView') {
      const originalCount = scroll_namespace.count;
      if (originalCount) {
        scroll_namespace.size = originalCount
      }

      scroll_namespace.count = 0;
      window[event.state[0]]()
      return;
    }
    window[event.state[0]](event.state[1], false)
  }
  
  startApp(true)
})


function backNav() {
  history.back();
}

function firebaseUiConfig(value) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        if (value) {
          document.querySelector('#updateEmailDialog').remove();
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

  const headerDiv = document.createElement('div')
  headerDiv.id = 'header'
  const currentPanel = document.createElement('div')
  currentPanel.id = 'app-current-panel'
  currentPanel.className = 'mdc-layout-grid__cell--span-12'

  const snackbar = document.createElement('div')
  snackbar.id = 'snackbar-container'

  const dialogContainer = document.createElement('div')
  dialogContainer.id = 'dialog-container'
  headerDiv.appendChild(createHeader('app-main-header'))

  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  layout.appendChild(dialogContainer)
  document.body.innerHTML = layout.outerHTML
 

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




function startApp(start) {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
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

        listView();
        requestCreator('now', {
          device: native.getInfo(),
          from: '',
          registerToken: native.getFCMToken()
        })
        runAppChecks()

        if (!getInstantLocation) return;
        manageLocation().then(function (location) {
          if (location.latitude && location.longitude) {
            updateLocationInRoot(location);
          }
        }).catch(function (error) {
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
  manageLocation().then(function (location) {
    if (location.latitude && location.longitude) {
      updateLocationInRoot(location)
    }
  }).catch(function (error) {
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
              if (!record) return;
              if (!record.offices) return;
              if (!record.offices.length) return;
              const offices = record.offices
              const message = document.createElement('h1')
              message.className = 'mdc-typography--headline6 mt-10'
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
              initCheckInDialog.listen('MDCDialog:cancel',function(){
                checkInDialog.remove();
              })
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