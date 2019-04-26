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
      const queryString = new URLSearchParams(iosDeviceInfo);
      var deviceInfo = {}
      queryString.forEach(function(val,key){
        if(key === 'appVersion') {
          deviceInfo[key] = Number(val)
        }
        else {
          deviceInfo[key] = val
        }
      })
      localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo))
    },
    getIosInfo: function () {
      return localStorage.getItem('deviceInfo');
    },
    getInfo: function () {
      if (!this.getName()) {
        return false
      }
      if (this.getName() === 'Android') {
        let deviceInfo;
        try {
          deviceInfo = getDeviceInfomation();
          localStorage.setItem('deviceInfo', deviceInfo);
        } catch (e) {
          sendExceptionObject(e, `Catch Type 3: AndroidInterface.getDeviceId in native.getInfo()`, []);

          deviceInfo = JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 10,
            osVersion: '',
            id: '',
          })
          localStorage.setItem('deviceInfo', deviceInfo);
        }
        return deviceInfo
      }
      return this.getIosInfo();
    }
  }
}();

function isNewDay(){
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

function getDeviceInfomation() {
  return JSON.stringify({
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion())
  })
}

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

function backNav() {
  history.back();
}


window.addEventListener("load", function () {
  firebase.initializeApp(appKey.getKeys())
  if (appKey.getMode() === 'production') {
    if (!native.getInfo()) {
      redirect();
      return;
    }
  }
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('sw.js').then(function (registeration) {
  //     console.log('sw registered with scope :', registeration.scope);
  //   }, function (err) {
  //     console.log('sw registeration failed :', err);
  //   });
  // }
  new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))

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
  
  if (!window.Worker && !window.indexedDB) {
    //TODO: show view instead of dialog
    return;
  }
  startApp(true)
})


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


function startApp(start) {
 
  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById('start-loader').classList.add('hidden')
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }

    if (!localStorage.getItem('error')) {
      localStorage.setItem('error', JSON.stringify({}));
    }

    if (start) {
      const req = window.indexedDB.open(auth.uid, 4);
      let db;
      req.onupgradeneeded = function (evt) {
        db = req.result;

        db.onerror = function () {
          handleError({
            message: `${db.error.message} from startApp on upgradeneeded`
          })
          return;
        }
        
        if(!evt.oldVersion) {
          createObjectStores(db, auth.uid)
        }
        else {

          if(evt.oldVersion < 4) {
            const subscriptionStore = req.transaction.objectStore('subscriptions')
            subscriptionStore.createIndex('status','status');
          }
        }
       
      }

      req.onsuccess = function () {
        db = req.result;
        document.getElementById("main-layout-app").style.display = 'block'
        localStorage.setItem('dbexist', auth.uid);
        resetScroll();
        listView();
        requestCreator('now', {
          device: native.getInfo(),
          from: '',
          registerToken: native.getFCMToken()
        })

        runAppChecks()
        if(native.getName !== 'Android') {
          webkit.messageHandlers.locationService.postMessage('start');
        }
        else {
          manageLocation().then(console.log).catch(function (error) {
            handleError(error)
          })
        }
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
  subscriptions.createIndex('status','status')
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
    console.log(error)
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
    if (!e.detail) return;
    isEmployeeOnLeave().then(function (onLeave) {
      if (onLeave) return
      if (history.state[0] !== 'listView') return;

      getUniqueOfficeCount().then(function (offices) {
        if(!offices.length) return;

        const checkInDialog = new Dialog('Check-In Reminder','Do you want to create a Check-In ?').create();
        checkInDialog.open()
        checkInDialog.listen('MDCDialog:closed', function (evt) {
          console.log(evt)
          if (evt.detail.action !== 'accept') return;
          if (!isLocationStatusWorking()) return;

          if (offices.length === 1) {
            createTempRecord(offices[0], 'check-in');
            return;
          }
          selectorUI({
            store: 'subscriptions'
          })
        })
        resetScroll();
        listView();
      })

    }).catch(handleError)
  }, true);
}

function getUniqueOfficeCount() {

  return new Promise(function (resolve, reject) {
   
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    let offices = []
    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['activity']);
      const activityStore = tx.objectStore('activity').index('office');
      activityStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return;
        offices.push(cursor.value.office)
        cursor.continue()
      }
      tx.oncomplete = function () {
        return resolve(offices);
      }
      tx.onerror = function () {
       return reject({
          message: tx.error.message,
          body: JSON.stringify(tx.error)
        })
      }
    }
    req.onerror = function () {
      return reject({
        message: req.error.message
      })
    }
  })
}