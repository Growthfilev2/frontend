const appKey = new AppKeys();
let progressBar;
let snackBar;
let ui;
let drawer;
let topAppBar;

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
      queryString.forEach(function (val, key) {
        if (key === 'appVersion') {
          deviceInfo[key] = Number(val)
        } else {
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

function isNewDay(set) {
  var today = localStorage.getItem('today');
  if (!today) {
    set ? localStorage.setItem('today', moment().format('YYYY-MM-DD')) : ''
    return true;
  }
  const isSame = moment(moment().format('YYYY-MM-DD')).isSame(moment(today));
  if (isSame) {
    return false;
  } else {
    set ? localStorage.setItem('today', moment().format('YYYY-MM-DD')) : ''
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
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'))
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));

  drawer = new mdc.drawer.MDCDrawer(document.querySelector('.mdc-drawer'));

  if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('sw.js').then(function (registeration) {
    //   console.log('sw registered with scope :', registeration.scope);
    // }, function (err) {
    //   console.log('sw registeration failed :', err);
    // });
  }
  // new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))

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
    const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
    incompatibleDialog.open();
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
 
  if (!ui) {
    ui = new firebaseui.auth.AuthUI(firebase.auth())
  }

  ui.start(document.getElementById('login-container'), firebaseUiConfig());
}


function startApp(start) {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById('start-loader').classList.add('hidden')
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
    if (!localStorage.getItem('error') || isNewDay()) {
      localStorage.setItem('error', JSON.stringify({}));
    };


    if (start) {
      const req = window.indexedDB.open(auth.uid, 5);
      let db;
      req.onupgradeneeded = function (evt) {
        db = req.result;
        db.onerror = function () {
          handleError({
            message: `${db.error.message} from startApp on upgradeneeded`
          })
          return;
        }

        if (!evt.oldVersion) {
          createObjectStores(db, auth.uid)
        } else {
          if (evt.oldVersion < 4) {
            const subscriptionStore = req.transaction.objectStore('subscriptions')
            subscriptionStore.createIndex('status', 'status');
          }
          if (evt.oldVersion < 5) {
            var tx = req.transaction;

            const mapStore = tx.objectStore('map');
            mapStore.createIndex('bounds', ['latitude', 'longitude']);
          
            const childrenStore = tx.objectStore('children')
            childrenStore.createIndex('officeTemplate', ['office', 'template']);
            childrenStore.createIndex('userDetails', 'employee');

            childrenStore.index('template').openCursor('employee').onsuccess = function(event){
                const cursor = event.target.result;
                if(!cursor) {
                  console.log("finished modiying children")
                  return;
                }
                cursor.value.employee = cursor.value.attachment['Employee Contact'].value
                cursor.update(cursor.value)
                cursor.continue();
            };
        
            tx.oncomplete = function(){

              console.log("finsihed backlog")
            }
          }
        }
      }

      req.onsuccess = function () {
        console.log("run app")
        db = req.result;
        document.getElementById("main-layout-app").style.display = 'block'
        localStorage.setItem('dbexist', auth.uid);
        ga('set', 'userId', JSON.parse(native.getInfo()).id)
        console.log(document.cookie);
        
        // resetScroll();
        // mapView();
        profileView()
        requestCreator('now', {
          device: native.getInfo(),
          from: '',
          registerToken: native.getFCMToken()
        });
        // runAppChecks()
        // manageLocation().then(console.log).catch(handleError)

      }
      req.onerror = function () {
        handleError({
          message: `${req.error.message} from startApp`
        })
      }
    }
  })
}

function queryChildren(template) {
  return new Promise(function (resolve, reject) {
    const auth = firebase.auth().currentUser
    const req = indexedDB.open(auth.uid);
    const result = [];
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children']);
      const store = tx.objectStore('children');
      const index = store.index('template')
      index.openCursor(template).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        result.push(cursor.value)
        cursor.continue();
      }
      tx.oncomplete = function () {
        return resolve(result)
      }
      tx.onerror = function () {
        return reject({
          message: tx.error.message,
          body: ''
        })
      }
    }
  })
}

function getEmployeeDetails(self, office) {
  return new Promise(function (resolve, reject) {
    const auth = firebase.auth().currentUser
    const req = indexedDB.open(auth.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children']);
      const store = tx.objectStore('children');
      let index;
      let range;

      if (office) {
        index = store.index('officeTemplate')
        range = IDBKeyRange.only([office, 'employee'])
      } else {
        index = store.index('templateStatus')
        range = IDBKeyRange.bound(['employee', 'CONFIRMED'], ['employee', 'PENDING']);
      }


      const getEmployee = index.getAll(range);

      getEmployee.onsuccess = function (event) {
        return resolve(event.target.result)
      }
      getEmployee.onerror = function () {
        return reject({
          message: getEmployee.error
        })
      }

      // index.openCursor(range).onsuccess = function (event) {
      //   const cursor = event.target.result;
      //   if (!cursor) return;
      //   results.push(cursor.value)
      //   cursor.continue();
      // }

    }

  })
}

function isEmployeeOnLeave() {
  TODO // without getting office names
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const result = []
      const db = req.result;
      const tx = db.transaction(['calendar']);
      const store = tx.objectStore('calendar');
      const index = store.index('leave');
      

      getUniqueOfficeCount().then(function(offices) {
          offices.forEach(function(office){
            result[office] = false;
          })

          index.openCursor(1).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            
            if (moment().isBetween(cursor.value.start, cursor.value.end, null, '[]')) {
              result[cursor.value.office]  = true
              cursor.continue()
              return;
            };

            cursor.value.leave = 0
            const updateReq = cursor.update(cursor.value)
            updateReq.onsuccess = function(){
              result[cursor.value.office]  = false
            }
            cursor.continue()
          }
      })

      tx.oncomplete = function () {
        resolve(result)
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
  subscriptions.createIndex('status', 'status')
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
    autoIncrement: true,
  })

  map.createIndex('activityId', 'activityId')
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('nearby', ['status', 'hidden'])
  map.createIndex('byOffice', ['office', 'location'])
  map.createIndex('bounds', ['latitude', 'longitude'])

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('userDetails', 'employee');

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

function createCheckInData() {
  return new Promise(function (resolve, reject) {

    getUniqueOfficeCount().then(function (offices) {
      console.log(offices);
      const prom = [];

      if (!offices.length) return;

      offices.forEach(function (office) {
        prom.push(getSubscription(office, 'check-in'))

      })
      Promise.all(prom).then(function (result) {
        if (!result.length) return;
        const filtered = result.filter(function (set) {
          return set != undefined;
        });

        return resolve({
          data: filtered,
          offices: offices
        })


      }).catch(function (error) {
        reject(error)
      })
    });
  })
}



function checkInDialog(result, location) {
  let dialog
  let radioListInit;
  const offices = result.offices;
  const filtered = result.data;

  if (offices.length == 1) {
    checkMapStoreForNearByLocation(offices[0], location).then(function (nearBy) {
      requestCreator('create', setVenueForCheckIn(nearBy, filtered[0]));
    });
    return;
  }

  const ul = createElement('ul', {
    className: 'mdc-list',
  })
  ul.setAttribute('role', 'radiogroup')
  filtered.forEach(function (data, idx) {
    ul.appendChild(radioList({
      labelText: data.office,
      index: idx,
      value: data,
    }))
  })
  radioListInit = new mdc.list.MDCList(ul)
  radioListInit.singleSelection = true;

  dialog = new Dialog('Check-In Reminder', ul).create();
  dialog.listen('MDCDialog:opened', function (evt) {
    radioListInit.layout();
    radioListInit.listElements.map(function (el) {
      return new mdc.ripple.MDCRipple.attachTo(el)
    })
  })

  dialog.listen('MDCDialog:closed', function (evt) {


    if (evt.detail.action !== 'accept') return;

    const rawValue = document.getElementById('list-radio-item-' + radioListInit.selectedIndex).value
    if (!rawValue) return;
    const value = JSON.parse(rawValue)

    checkMapStoreForNearByLocation(value.office, location).then(function (result) {

      requestCreator('create', setVenueForCheckIn(result, value));
    })
  })
  dialog.open();

}

function setVenueForCheckIn(venueData, value) {
  const venue = {
    geopoint: {
      latitude: '',
      longitude: ''
    },
    address: '',
    location: '',
    venueDescriptor: value.venue[0]
  }
  if (!venueData.length) {
    value.venue = [venue]
    value.share = [];
    return [value];

  }
  venue.location = venueData[0].location;
  venue.address = venueData[0].address;
  venue.geopoint.latitude = venueData[0].latitude;
  venue.geopoint.longitude = venueData[0].longitude;
  value.venue = [venue]
  value.share = [];
  console.log(value)
  return [value]
}


function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    let offices = []
    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['children']);
      const childrenStore = tx.objectStore('children').index('userDetails');
      childrenStore.openCursor(firebase.auth().currentUser.phoneNumber).onsuccess = function (event) {
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

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      const results = [];
      const db = req.result;
      const tx = db.transaction(['map'])
      const store = tx.objectStore('map')
      const index = store.index('byOffice')
      const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
      index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.location) {
          cursor.continue();
          return;
        }
        if (!cursor.value.latitude || !cursor.value.longitude) {
          cursor.continue();
          return;
        }

        const distanceBetweenBoth = calculateDistanceBetweenTwoPoints(cursor.value, currentLocation);

        if (isLocationLessThanThreshold(distanceBetweenBoth)) {

          results.push(cursor.value);
        }
        cursor.continue();
      }
      tx.oncomplete = function () {
        const filter = {};
        results.forEach(function (value) {
          filter[value.location] = value;
        })
        const array = [];
        Object.keys(filter).forEach(function (locationName) {
          array.push(filter[locationName])
        })
        const nearest = array.sort(function (a, b) {
          return a.accuracy - b.accuracy
        })
        resolve(nearest)
      }
      tx.onerror = function () {
        reject(tx.error)
      }
    }
  })
}