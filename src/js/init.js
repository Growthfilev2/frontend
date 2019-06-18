const appKey = new AppKeys();
let progressBar;
let snackBar;
let ui;
let send;
let change;
let next;
let emailInit;
var db;
let isCheckInCreated;
let drawer;
let navList;
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

  if (event.state[0] === 'homeView') {
    window[event.state[0]](selectedSubs);
    return
  }
  window[event.state[0]]();
}




window.addEventListener("load", function () {
  firebase.initializeApp(appKey.getKeys())
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'))
  drawer = new mdc.drawer.MDCDrawer(document.querySelector('.mdc-drawer'));
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
  navList = new mdc.list.MDCList(document.getElementById('nav-list'))
  navList.singleSelection = true;
  navList.listen('MDCList:action', function (evt) {
    console.log(evt)
    const state = navList.listElements[evt.detail.index].dataset.state
    if (state === 'homeView') {
      window[state](selectedSubs)
      return
    }
    window[state]()

  })

  drawer.listen('MDCDrawer:opened', function (evt) {
    document.querySelector(".mdc-drawer__header .mdc-drawer__title").textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber;
    document.querySelector(".mdc-drawer__header img").src = firebase.auth().currentUser.photoURL || '../src/img/empty-user.jpg'
    document.querySelector(".mdc-drawer__header img").onclick = function () {
      profileView();

    }
  })



  if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('sw.js').then(function (registeration) {
    //   console.log('sw registered with scope :', registeration.scope);
    // }, function (err) {
    //   console.log('sw registeration failed :', err);
    // });
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

  if (!window.Worker && !window.indexedDB) {
    const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
    incompatibleDialog.open();
    return;
  }
  startApp(true)
})

// function firebaseUiConfig()


function firebaseUiConfig(value, redirect) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        document.getElementById('dialog-container').innerHTML = ''

        if (redirect) {
          emailFlow(firebase.auth().currentUser, value).then(function () {
            snacks('Verification Link has Been Send To you Email Address');
            emailInit.foundation_.setDisabled(true);
            change.root_.classList.remove('hidden');
            next.root_.classList.remove('hidden');
            new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress')).close();
          }).catch(function (error) {
            new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress')).close();
            if (error.code === 'auth/too-many-requests') {
              mapView();
              snacks('You Can Also Update Your Email Address From Your Profile')
              return;
            }
            send.root_.classList.remove('hidden');
            snacks(error.message)

          })
          return false
        }
        if (value) {
          updateEmail(authResult.user, value);
          return false;
        }

      },
      signInFailure: function (error) {
        return handleUIError(error)
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
          size: 'invisible', // 'invisible' or 'compact'
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
      // document.getElementById('start-loader').classList.add('hidden')
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
      const req = window.indexedDB.open(auth.uid, 12);

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

          }
          if (evt.oldVersion < 6) {
            var tx = req.transaction;
            const childrenStore = tx.objectStore('children')
            childrenStore.createIndex('officeTemplate', ['office', 'template']);

            childrenStore.createIndex('employees', 'employee');
            childrenStore.createIndex('employeeOffice', ['employee', 'office'])
            childrenStore.createIndex('team', 'team')
            childrenStore.createIndex('teamOffice', ['team', 'office'])
            const myNumber = firebase.auth().currentUser.phoneNumber;

            childrenStore.index('template').openCursor('employee').onsuccess = function (event) {
              const cursor = event.target.result;
              if (!cursor) {
                console.log("finished modiying children")
                return;
              }
              cursor.value.employee = cursor.value.attachment['Employee Contact'].value
              if (cursor.value.attachment['First Supervisor'].value === myNumber || cursor.value.attachment['Second Supervisor'].value === myNumber) {
                cursor.value.team = 1
              }
              cursor.update(cursor.value)
              cursor.continue();
            };

            tx.oncomplete = function () {

              console.log("finsihed backlog")
            }
          }
          if (evt.oldVersion < 7) {
            var tx = req.transaction;
            const mapStore = tx.objectStore('map')
            mapStore.createIndex('office', 'office');
            mapStore.createIndex('status', 'status');
            mapStore.createIndex('selection', ['office', 'status', 'location']);
          }
          if (evt.oldVersion < 8) {
            var tx = req.transaction;
            const listStore = tx.objectStore('list')
            const calendar = tx.objectStore('calendar')

            listStore.createIndex('office', 'office');
            calendar.createIndex('office', 'office')
          }
          if (evt.oldVersion < 9) {
            var tx = req.transaction;
            const userStore = tx.objectStore('users');
            userStore.createIndex('mobile', 'mobile');

            const addendumStore = tx.objectStore('addendum');
            addendumStore.createIndex('user', 'user');
            addendumStore.createIndex('timestamp', 'timestamp')
          }
          if (evt.oldVersion <= 10) {
            var tx = req.transaction;
            const subscriptionStore = tx.objectStore('subscriptions')
            subscriptionStore.createIndex('count', 'count');
          }
          if (evt.oldVersion <= 11) {
            var tx = req.transaction;
            const userStore = tx.objectStore('users')
            userStore.createIndex('timestamp', 'timestamp')
          }
        };
      }
      req.onsuccess = function () {
        db = req.result;
        db.transaction('addendum', 'readwrite').objectStore('addendum').put({
          activityId: '1',
          addendumId: "90",
          comment: "Hello",
          timestamp: 1560864769859,
          user: "+919654564390"
      })
        if (!areObjectStoreValid(db.objectStoreNames)) {
          db.close();
          console.log(auth)
          const deleteIDB = indexedDB.deleteDatabase(auth.uid);
          deleteIDB.onsuccess = function () {
            window.location.reload();
          }
          deleteIDB.onblocked = function () {
            snacks('Please Re-Install The App')
          }
          deleteIDB.onerror = function () {
            snacks('Please Re-Install The App')
          }
          return;
        }
        const startLoad = document.querySelector('#start-load')
        startLoad.classList.remove('hidden');
        console.log("run app")
        document.getElementById("main-layout-app").style.display = 'block'
        // localStorage.setItem('dbexist', auth.uid);
        ga('set', 'userId', JSON.parse(native.getInfo()).id)

        const texts = ['Loading Growthfile', 'Getting Your Data', 'Creating Profile', 'Please Wait']

        let index = 0;
        var interval = setInterval(function () {
          if (index == texts.length - 1) {
            clearInterval(interval)
          }
          startLoad.querySelector('p').textContent = texts[index]
          index++;
        }, index + 1 * 1000);
        // mapView()

        requestCreator('now', {
          device: native.getInfo(),
          from: '',
          registerToken: native.getFCMToken()
        }).then(function (response) {
          if (response.updateClient) {
            updateApp()
            return
          }
          if (response.revokeSession) {
            revokeSession();
            return
          };
          getRootRecord().then(function (rootRecord) {
            if (!rootRecord.fromTime) {
              requestCreator('Null').then(checkForRecipient).catch(console.log)
              return;
            }
            checkForRecipient();
            requestCreator('Null').then(console.log).catch(console.log)
          })
        }).catch(console.log)
      }
      req.onerror = function () {
        handleError({
          message: `${req.error.message} from startApp`
        })
      }
    }
  })
}


function checkForRecipient() {
  const auth = firebase.auth().currentUser;
  getEmployeeDetails(IDBKeyRange.bound(['recipient', 'CONFIRMED'], ['recipient', 'PENDING']), 'templateStatus').then(function (result) {
    if (!result.length) return mapView();
    if (!auth.email || !auth.emailVerified) return userDetails(result, auth);
    return mapView();
  })
}

function areObjectStoreValid(names) {
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum']

  for (let index = 0; index < stores.length; index++) {
    const el = stores[index];
    if (!names.contains(el)) return false;
  }
  return true;

}

function getEmployeeDetails(range, indexName) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['children']);
    const store = tx.objectStore('children');
    const index = store.index(indexName)
    const getEmployee = index.getAll(range);

    getEmployee.onsuccess = function (event) {
      const result = event.target.result;

      console.log(result);

      return resolve(result)
    }
    getEmployee.onerror = function () {
      return reject({
        message: getEmployee.error
      })
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
  activity.createIndex('template', 'template');

  const list = db.createObjectStore('list', {
    keyPath: 'activityId'
  })
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');
  list.createIndex('office', 'office');

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')
  users.createIndex('mobile', 'mobile')
  users.createIndex('timestamp', 'timestamp')
  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')
  addendum.createIndex('user', 'user');

  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('count', 'count');
  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('office', 'office')
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
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
  map.createIndex('selection', ['office', 'status', 'location']);

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice', ['employee', 'office'])
  children.createIndex('team', 'team')
  children.createIndex('teamOffice', ['team', 'office'])
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
  if (!venueData) {
    value.venue = [venue]
    value.share = [];
    return value;

  }
  venue.location = venueData.location;
  venue.address = venueData.address;
  venue.geopoint.latitude = venueData.latitude;
  venue.geopoint.longitude = venueData.longitude;
  value.venue = [venue]
  value.share = [];
  console.log(value)
  return value
}


function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    let offices = []
    const tx = db.transaction(['children']);
    const childrenStore = tx.objectStore('children').index('employees');
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
  })
}

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {

    const results = [];
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

  })
}