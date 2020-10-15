const dom_root = document.getElementById('app-current-panel');
// const appKey = new AppKeys();
let progressBar;
var db;
let snackBar;
let appTabBar;
var potentialAlternatePhoneNumbers;

var deepLink;

var firebaseAnalytics;
var serverTimeUpdated = false;

var isNewUser = false;

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {
        scope: '/'
      })
      .then(reg => {
        console.log('Registration succeeded. Scope is ' + reg.scope);
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
      
            if(window.location.search && new URLSearchParams(window.location.search).has('action')) {
              deepLink = new URLSearchParams(window.location.search);
            }
            loadApp()
            return
          }
          redirect(`/login.html${deepLink ? `?${deepLink.toString()}`:''}`);
        })
      }).catch((error) => {
        // registration failed
        console.log('Registration failed with ' + error);
      });
  }
})


/**
 * long dynamic link intercepted by device containing query parameters
 * @param {string} link 
 */

function getDynamicLink(link) {
  const url = new URL(link);
  deepLink = new URLSearchParams(url.search);
}

/**
 * 
 * @param {string} componentValue 
 * package name of app through thich link was shared
 */
function linkSharedComponent(componentValue) {
  console.log(componentValue);
  logFirebaseAnlyticsEvent('share', {
    method: componentValue,
    content_type: 'text'
  });
}




/**
 * 
 * @param {Event} source 
 *  load placeholder user image if image url fails to load 
 */
function imgErr(source) {
  source.onerror = '';
  source.src = './img/empty-user.jpg';
  return true;
}



function preloadImages(urls) {
  urls.forEach(function (url) {
    var img = new Image();
    img.src = url
  })
}



const loadApp = () => {

  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));

  if (!window.Worker && !window.indexedDB) {
    const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile  is incompatible with this device').create();
    incompatibleDialog.open();
    return;
  }

  localStorage.setItem('error', JSON.stringify({}));
  localStorage.removeItem('storedLinks');
  checkNetworkValidation();
};



function checkNetworkValidation() {
  if (!navigator.onLine) {
    failureScreen({
      message: 'You Are Currently Offline. Please Check Your Internet Connection',
      icon: 'wifi_off',
      title: 'BROKEN INTERNET CONNECTION'
    }, checkNetworkValidation)
    return;
  }
  startApp();
}



const loadScreen = (id) => {
  document.querySelectorAll('.transitions .app-init-screens').forEach(el => {
    if (el.id === id) {
      el.classList.remove('hidden')
    } else {
      el.classList.add('hidden')
    }
  })
}

const removeScreen = () => {
  document.querySelector('.transitions').remove();
}



function startApp() {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName, DB_VERSION);
  req.onupgradeneeded = function (evt) {
    db = req.result;
    db.onerror = function () {
      handleError({
        message: `${db.error.message}`,
      })
      return;
    };
    switch (evt.oldVersion) {
      case 0:
        createObjectStores(db, dbName)
        break;
      case 30:
        createSubscriptionObjectStore(db);
        createMapObjectStore(db);
        createCalendarObjectStore(db);
        break;
      case 31:
        const addendumStore = req.transaction.objectStore('addendum');
        if (!addendumStore.indexNames.contains('timestamp')) {
          addendumStore.createIndex('timestamp', 'timestamp');
        }
        break;
      case 32:
        const userStore = req.transaction.objectStore('users');
        userStore.openCursor().onsuccess = function (e) {
          const cursor = e.target.result;
          if (!cursor) return;
          delete cursor.value.count;
          userStore.put(cursor.value)
          cursor.continue();
        }
      default:
        console.log('version upgrade');
        break;
    }
  }

  req.onsuccess = function () {
    console.log("request success")
    db = req.result;
    console.log("run app")
    regulator()
      .then(console.log).catch(function (error) {
        if (error.type === 'geolocation') return handleLocationError(error)
        console.log(error)
        contactSupport()
      })
  };

  req.onerror = function () {
    handleError({
      message: `${req.error.name}`,
      body: JSON.stringify(req.error.message)
    })
  }

}


function getDeepLink() {
  // return new URLSearchParams('?office=Puja Capital&utm_campaign=share_link&action=get-subscription');
  if (deepLink) return deepLink
  if (isNewUser) return new URLSearchParams('?utm_source=organic')
  return null;
}

function regulator() {
  const queryLink = getDeepLink();
  const deviceInfo = native.getInfo();

  return new Promise(function (resolve, reject) {
    var prom;
    loadScreen('loading');

    if (appKey.getMode() === 'dev' && window.location.host === 'localhost:5000') {
      prom = Promise.resolve();
    } else {
      prom = requestCreator('fcmToken', {
        token: native.getFCMToken()
      })
    };

    prom.then(function () {
        if (!queryLink) return Promise.resolve();

        if (queryLink.get('action') === 'get-subscription') {
          loadScreen('adding-to-office');
          document.querySelector('#adding-to-office .loading-text--headline').textContent = 'Adding you to ' + queryLink.get('office');
        };

        return requestCreator('acquisition', {
          source: queryLink.get('utm_source'),
          medium: queryLink.get('utm_medium'),
          campaign: queryLink.get('utm_campaign'),
          office: queryLink.get('office')
        })
      })
      .then(function () {
        loadScreen('connecting');
        return requestCreator('now');
      })
      .then(function () {
        serverTimeUpdated = true
        loadScreen('verifying');
        return appLocation(3)
      })
      .then(function (geopoint) {
        handleCheckin(geopoint);
        if (window.location.host === 'localhost:5000' && appKey.getMode() === 'dev') return Promise.resolve();

        if (JSON.parse(localStorage.getItem('deviceInfo'))) return Promise.resolve();
        return requestCreator('device', deviceInfo);
      })
      .then(function () {
        localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
      })
      .catch(reject)
  })
}

function contactSupport() {
  const div = createElement('div', {
    style: 'position:fixed;bottom:1rem;width:100%;text-align:center'
  })
  div.innerHTML = `
  
  <p class='mdc-typography--headline6 mb-10 mt-0'>Having trouble ? </p>
  <a class='mdc-typography--subtitle2 mdc-theme--primary' href="https://wa.me/918595422858">Contact support</a>
  `
  dom_root.appendChild(div)

}




function handleCheckin(geopoint, noUser) {

  const queryLink = getDeepLink();

  getCheckInSubs().then(function (checkInSubs) {

    if (queryLink && queryLink.get('action') === 'get-subscription') {
      checkInSubs[queryLink.get('office')] = {
        attachment: {
          Comment: {
            type: 'string',
            value: ''
          },
          Photo: {
            type: 'base64',
            value: ''
          }
        },
        template: 'check-in',
        office: queryLink.get('office'),
        schedule: [],
        venue: ['Check-In Location'],
        status: 'PENDING'
      }
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      mapView(geopoint)
      return
    }

    if (!shouldCheckin(geopoint, checkInSubs)) return initProfileView();

    if (Object.keys(checkInSubs).length) {
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      return mapView(geopoint)
    }

    const storeNames = ['activity', 'addendum', 'children', 'subscriptions', 'map', 'attendance', 'reimbursement', 'payment']
    Promise.all([firebase.auth().currentUser.getIdTokenResult(), checkIDBCount(storeNames)]).then(function (result) {
      getRootRecord().then(function (record) {
        if (record.fromTime == 0) {
          loadScreen('loading-data')
          // serviceWorkerRequestCreator(null).then((res)=>{
          navigator.serviceWorker.controller.postMessage({
            type: 'read'
          })
          // })
          navigator.serviceWorker.onmessage = (event) => {
            console.log('message from worker', event.data);
            handleCheckin(geopoint)
          };
          return
        }
        if (isAdmin(result[0]) || result[1]) return initProfileView();
        return noOfficeFoundScreen();
      })

    })

  });
}

function noOfficeFoundScreen() {
  const content = `
      <div class='message-screen mdc-layout-grid'>
      <div class='icon-container'>
        <div class='mdc-theme--primary icons'>
          <i class='material-icons'>help_outline</i>
        </div>
      </div>
      <div class='text-container'>
        <h3 class='mdc-typography--headline5 headline mt-0'>No office found </h3>
        <p class='mdc-typography--body1'>
          Please contact your administrator
        </p>
      </div>
    </div>
  `
  dom_root.innerHTML = content;

}


function initProfileView() {
  const auth = firebase.auth().currentUser;
  if (auth.displayName) return redirect('/profile.html');
  redirect('/home.html');
}


function checkEmptyIdProofs(record) {
  if (!record.idProof) return true;
  const keys = Object.keys(record.idProof);
  let isEmpty = false;
  keys.forEach(function (key) {
    if (!record.idProof[key].number || !record.idProof[key].front || !record.idProof[key].back) {
      isEmpty = true;
      return;
    }
  })
  return isEmpty;
}

function getProfileInformation() {
  return new Promise(function (resolve, reject) {
    let record;

    getRootRecord().then(function (record) {
      if (!record.aadhar || !record.pan || !record.linkedAccounts) {
        requestCreator('profile').then(function (response) {
          const dbName = firebase.auth().currentUser.uid;
          const rootTx = db.transaction('root', 'readwrite');
          const store = rootTx.objectStore('root');
          store.get(dbName).onsuccess = function (event) {
            record = event.target.result;
            delete record.idProof;
            record.linkedAccounts = response.linkedAccounts;
            record.pan = response.pan;
            record.aadhar = response.aadhar;
            store.put(record);
          }
          rootTx.oncomplete = function () {
            return resolve(record)
          }
        }).catch(reject)
        return
      }
      return resolve(record)
    });
  })
}






function showReLoginDialog(heading, contentText) {
  const content = `<h3 class="mdc-typography--headline6 mdc-theme--primary">${contentText}</h3>`
  const dialog = new Dialog(heading, content).create();
  dialog.open();
  dialog.buttons_[1].textContent = 'RE-LOGIN';
  return dialog;


}


function areObjectStoreValid(names) {
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum', ]
  for (let index = 0; index < stores.length; index++) {
    const el = stores[index];
    if (!names.contains(el)) {
      return {
        'not-present': el,
        isValid: false
      };
    }
  }
  return {
    'not-present': '',
    isValid: true
  };
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
        message: getEmployee.error,
        body: ''
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
  activity.createIndex('status', 'status')

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')
  users.createIndex('mobile', 'mobile')
  users.createIndex('timestamp', 'timestamp')
  users.createIndex('NAME_SEARCH', 'NAME_SEARCH')
  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key');
  addendum.createIndex('timestamp', 'timestamp');
  addendum.createIndex('KeyTimestamp', ['timestamp', 'key'])


  createSubscriptionObjectStore(db)
  createCalendarObjectStore(db);
  createMapObjectStore(db)

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

  createReportObjectStores(db)
  createRootObjectStore(db, uid, 0)
}

function createCalendarObjectStore(db) {
  if (db.objectStoreNames.contains('calendar')) {
    db.deleteObjectStore('calendar')
  }
  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('templateOffice', ['template', 'office']);

}

function createSubscriptionObjectStore(db) {
  if (db.objectStoreNames.contains('subscriptions')) {
    db.deleteObjectStore('subscriptions')
  }
  const subscriptions = db.createObjectStore('subscriptions', {
    keyPath: 'activityId'
  })
  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status'])
  subscriptions.createIndex('templateStatus', ['template', 'status'])
  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('report', 'report');
}

function createMapObjectStore(db) {
  if (db.objectStoreNames.contains('map')) {
    db.deleteObjectStore('map')
  }
  const map = db.createObjectStore('map', {
    keyPath: 'activityId'
  })
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('byOffice', ['office', 'location'])
  map.createIndex('bounds', ['latitude', 'longitude'])
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
}


function createReportObjectStores(db) {
  if (!db.objectStoreNames.contains('attendance')) {

    const attendance = db.createObjectStore('attendance', {
      keyPath: 'id',
    })
    attendance.createIndex('key', 'key')
    attendance.createIndex('date', 'date')
    attendance.createIndex('month', 'month')
    attendance.createIndex('office', 'office')
    attendance.createIndex('attendance', 'attendance');
  }
  if (!db.objectStoreNames.contains('payment')) {

    const payments = db.createObjectStore('payment', {
      keyPath: 'id'
    })

    payments.createIndex('key', 'key')
    payments.createIndex('date', 'date')
    payments.createIndex('month', 'month')
    payments.createIndex('year', 'year')
    payments.createIndex('status', 'status')
    payments.createIndex('office', 'office')
  }
  if (!db.objectStoreNames.contains('reimbursement')) {

    const reimbursements = db.createObjectStore('reimbursement', {
      keyPath: 'id'
    });
    reimbursements.createIndex('key', 'key')
    reimbursements.createIndex('date', 'date')
    reimbursements.createIndex('month', 'month')
    reimbursements.createIndex('year', 'year')
    reimbursements.createIndex('office', 'office')
  }

}


function createRootObjectStore(db, uid, fromTime) {
  const root = db.createObjectStore('root', {
    keyPath: 'uid'
  });
  root.put({
    uid: uid,
    fromTime: fromTime,
    location: ''
  })
}





function getCheckInSubs() {
  return new Promise(function (resolve) {
    const checkInSubs = {};
    const tx = db.transaction('subscriptions');
    tx.objectStore('subscriptions')
      .index('templateStatus')
      .openCursor(IDBKeyRange.bound(['check-in', 'CONFIRMED'], ['check-in', 'PENDING']))
      .onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (!cursor.value.attachment || !cursor.value.venue || !cursor.value.schedule) {
          cursor.continue();
          return;
        }
        if (checkInSubs[cursor.value.office]) {
          if (checkInSubs[cursor.value.office].timestamp <= cursor.value.timestamp) {
            checkInSubs[cursor.value.office] = cursor.value;
          }
        } else {
          checkInSubs[cursor.value.office] = cursor.value
        }
        cursor.continue();
      }
    tx.oncomplete = function () {
      delete checkInSubs['xanadu'];
      return resolve(checkInSubs)
    }
  })
};


function checkIDBCount(storeNames) {
  return new Promise(function (resolve, reject) {
    let totalCount = 0;
    const tx = db.transaction(storeNames)
    storeNames.forEach(function (name) {
      if (!db.objectStoreNames.contains(name)) return;
      const store = tx.objectStore(name)
      const req = store.count();
      req.onsuccess = function () {
        totalCount += req.result
      }
    })
    tx.oncomplete = function () {
      return resolve(totalCount)
    }
    tx.onerror = function () {
      return reject({
        message: tx.error.message,
        body: tx.error
      })
    }
  })
}


function fillVenueInSub(sub, venue) {
  const vd = sub.venue[0];
  sub.venue = [{
    geopoint: {
      latitude: venue.latitude || '',
      longitude: venue.longitude || ''
    },
    location: venue.location || '',
    address: venue.address || '',
    venueDescriptor: vd
  }];
  return sub;
}


function reloadPage() {
  window.location.reload(true);
}


function shouldCheckin(geopoint, checkInSubs) {
  ApplicationState.officeWithCheckInSubs = checkInSubs;
  const oldState = JSON.parse(localStorage.getItem('ApplicationState'))
  if (!oldState) return true
  if (!oldState.lastCheckInCreated) return true
  const isOlder = isLastLocationOlderThanThreshold(oldState.lastCheckInCreated, 300)
  const hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldState.location, geopoint))
  if (isOlder || hasChangedLocation) {
    return true
  }
  ApplicationState = oldState;
  return false
}



function failureScreen(error, callback) {

  dom_root.innerHTML = `
    <div class="center-abs location-not-found">
    <i class='material-icons mdc-theme--secondary'>${error.icon || 'location_off'}</i>
    <p class='mdc-typography--headline5'>
    ${error.title}
    </p>
    <p class='mdc-typography--body1'>
    ${error.message}
    </p>
    <button class="mdc-button mdc-theme--primary-bg" id='try-again'>
    <span class="mdc-button__label mdc-theme--on-primary">RETRY</span>
    </button>
    </div>`
  document.getElementById('try-again').addEventListener('click', function (evt) {
    document.querySelector('.center-abs.location-not-found').classList.add('hidden')
    callback();
  })
}

function handleLocationError(error) {
  let alertDialog;
  switch (error.message) {
    case 'THRESHOLD EXCEED':
      handleCheckin(error.body.geopoint)
      break;

    case 'BROKEN INTERNET CONNECTION':

      alertDialog = new Dialog(error.message, 'Please Check Your Internet Connection').create();
      alertDialog.open();
      break;

    case 'TURN ON YOUR WIFI':

      alertDialog = new Dialog(error.message, 'Enabling Wifi Will Help Growthfile Accurately Detect Your Location').create();
      alertDialog.open();
      break;

    default:
      handleError({
        message: error.message,
        body: {
          reason: error.body || error,
          stack: error.stack || ''
        }
      })

      alertDialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
      alertDialog.open();
      break;
  }
}

function mapView(location) {

  ApplicationState.location = location
  // progressBar.close();

  const latLng = {
    lat: location.latitude,
    lng: location.longitude
  }
  console.log(latLng)
  const offsetBounds = new GetOffsetBounds(location, 1);

  loadNearByLocations({
    north: offsetBounds.north(),
    south: offsetBounds.south(),
    east: offsetBounds.east(),
    west: offsetBounds.west()
  }, location).then(function (nearByLocations) {

    if (!nearByLocations.length) return createUnkownCheckIn(location)
    if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
    loadLocationsCard(nearByLocations, location)
  })
}

function createUnkownCheckIn(geopoint) {
  // document.getElementById("app-header").classList.add('hidden')
  const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;
  if (offices.length == 1) {
    generateRequestForUnknownCheckin(offices[0], geopoint)
    return
  }
  const officeCard = bottomCard('Choose office');

  offices.forEach(function (office) {
    const li = createList({
      primaryText: office,
      meta: 'navigate_next'
    });
    officeCard.ul.appendChild(li);
  })

  new mdc.list.MDCList(officeCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    const selectedOffice = offices[evt.detail.index];
    generateRequestForUnknownCheckin(selectedOffice, geopoint)
    officeCard.card.classList.add('hidden')
  })
  dom_root.appendChild(officeCard.card);
}


function generateRequestForUnknownCheckin(office, geopoint, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  loadScreen('checkin');
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in'
  getRootRecord().then(function (rootRecord) {
    const timestamp = fetchCurrentTime(rootRecord.serverTime)

    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];
    copy.timestamp = timestamp

    requestCreator('create', fillVenueInSub(copy, ''), geopoint).then(function () {
      removeScreen()
      successDialog('Check-In Created')
      ApplicationState.venue = ''
      ApplicationState.selectedOffice = office;
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      initProfileView();

    }).catch(function (error) {
      console.log(error)
      // progressBar.close()
      const queryLink = getDeepLink();

      if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

        if (retries.subscriptionRetry <= 2) {
          setTimeout(function () {
            retries.subscriptionRetry++
            generateRequestForUnknownCheckin(office, geopoint, retries)
          }, 5000)
        }
        return
      }

      if (error.message === 'Invalid check-in') {

        handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
          ApplicationState.location = newGeopoint;
          retries.invalidRetry++
          generateRequestForUnknownCheckin(office, newGeopoint, retries);
        });
        return
      };

    })

  })
}


function handleInvalidCheckinLocation(retry, callback) {
  if (retry) return reloadPage();

  if (native.getName() === 'Android') {
    handleGeoLocationApi().then(callback).catch(function (error) {
      handleError({
        message: 'Geolocation failed to get data for retry attempt at invalid checkin',
        body: error
      });
      failureScreen({
        message: 'There was a problem in detecting your location.',
        icon: 'location_off',
        title: 'Failed To Detect Location'
      }, reloadPage);
    })
    return;
  }
  try {

    webkit.messageHandlers.locationService.postMessage('start');
    window.addEventListener('iosLocation', function _iosLocation(e) {
      callback(e.detail)
      window.removeEventListener('iosLocation', _iosLocation, true);
    }, true);
  } catch (e) {

    failureScreen({
      message: 'There was a problem in detecting your location.',
      icon: 'location_off',
      title: 'Failed To Detect Location'
    }, reloadPage);
  }
}


const bottomCard = (heading, listTwoLine) => {
  const card = createElement('div', {
    className: 'mdc-card mdc-elevation--z16 mdc-card--outlined bottom-card'
  })
  card.appendChild(createElement('h1', {
    className: 'mdc-typography--headline6',
    textContent: heading
  }))
  const ul = createElement('ul', {
    className: 'mdc-list pt-0'
  })
  if (listTwoLine) {
    ul.classList.add('mdc-list--two-line', 'mdc-list--avatar-list')
  }
  card.appendChild(ul);

  return {
    ul,
    card
  }
}

function loadLocationsCard(venues, geopoint) {

  ApplicationState.knownLocation = true;
  const locationCard = bottomCard('Choose duty location', true);

  venues.map(function (venue) {
    locationCard.ul.appendChild(createList({
      icon: 'location_on',
      primaryText: venue.location,
      secondaryText: venue.office,
      meta: 'navigate_next'
    }))
  })

  new mdc.list.MDCList(locationCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    const selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue, geopoint);
    locationCard.card.classList.add('hidden')
    // return;
  })
  dom_root.appendChild(locationCard.card);

};

function createKnownCheckIn(selectedVenue, geopoint, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  console.log(selectedVenue)

  const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]))
  copy.share = []
  // progressBar.open()
  loadScreen('checkin')
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in at ' + selectedVenue.location;

  // return
  requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {
    removeScreen()
    successDialog('Check-In Created')
    ApplicationState.venue = selectedVenue;
    ApplicationState.selectedOffice = selectedVenue.office;
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initProfileView()
  }).catch(function (error) {
    console.log(error)
    // progressBar.close()
    const queryLink = getDeepLink();

    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++
          createKnownCheckIn(selectedVenue, geopoint, retries);
        }, 5000)
      }
      return
    };

    if (error.message === 'Invalid check-in') {

      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++
        createKnownCheckIn(selectedVenue, newGeopoint, retries);
      });
      return
    };
  })
}

function snapView(selector) {
  document.querySelector(selector).innerHTML = `
  <div class='snap-container'>
  <h6 class='mdc-typography--headline5 text-center'>
    Create a photo check-in
  </h6>
  <div class='landing-page-container text-center'>
    <button class="mdc-fab mdc-fab--extended mdc-theme--primary-bg mdc-theme--on-primary">
      <div class="mdc-fab__ripple"></div>
      <span class="material-icons mdc-fab__icon">camera</span>
      <span class="mdc-fab__label">Take photo</span>
    </button>
  </div>
  </div>
  `;

  document.querySelector('.snap-container .mdc-fab').addEventListener('click', openCamera)
  openCamera();
}

function openCamera() {
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}


function setFilePath(base64, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  const url = `data:image/jpg;base64,${base64}`
  dom_root.innerHTML = `
  <div class='image-container'>
    <div id='snap' class="snap-bckg">
      <div class="form-meta snap-form">
        <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
            <textarea
            class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100"></textarea></div>
            <button id='snap-submit' class="mdc-fab app-fab--absolute  snap-fab mdc-theme--primary-bg  mdc-ripple-upgraded"
          style="z-index: 9;">
          <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
        </button>
      </div>
    </div>
  </div>
  `
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">Upload photo</span>
        `
  const header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden');
  const content = document.getElementById('snap')
  const textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'))
  const submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'))


  textarea.focus();
  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px'
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = (this.scrollHeight - 20) + "px";
    }
  });

  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;

  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;
    sendPhotoCheckinRequest({
      sub: ApplicationState.officeWithCheckInSubs[ApplicationState.selectedOffice],
      base64: url,
      retries: retries,
      textValue: textValue,
      knownLocation: true
    })
  })
}


function sendPhotoCheckinRequest(request) {
  const url = request.base64;
  const textValue = request.textValue;
  const retries = request.retries;
  const sub = JSON.parse(JSON.stringify(request.sub))
  sub.attachment.Photo.value = url || ''
  sub.attachment.Comment.value = textValue;
  sub.share = []
  history.back();
  requestCreator('create', fillVenueInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {
    successDialog('Photo uploaded');

  }).catch(function (error) {
    const queryLink = getDeepLink();
    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++
          if (request.knownLocation) {
            createKnownCheckIn(ApplicationState.venue, geopoint, retries);
          } else {
            createUnkownCheckIn(sub.office, geopoint, retries);
          }
        }, 5000)
      }
      return
    }

    if (error.message === 'Invalid check-in') {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++
        setFilePath(base64, retries);
      });
      return
    };
  });
}

function mdcDefaultSelect(data, label, id, option) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  <option disabled selected></option>
  ${data.map(function(value){
    return ` <option value='${value}'>
    ${value}
    </option>`
}).join("")}
${option}

  </select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}


function mdcSelectVenue(venues, label, id) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  <option disabled selected value=${JSON.stringify('0')}></option>
  <option value=${JSON.stringify('1')}>UNKNOWN LOCATION</option>

  ${venues.map(function(value){
    return ` <option value='${JSON.stringify(value)}'>
    ${value.location}
    </option>`
  }).join("")}
  
</select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}



function getOrientation(image) {
  if (image.width > image.height) return 'landscape'
  if (image.height > image.width) return 'potrait'
  if (image.width == image.height) return 'square'
}





function loadNearByLocations(o, location) {
  return new Promise(function (resolve, reject) {

    const result = []

    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);

    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!ApplicationState.officeWithCheckInSubs[cursor.value.office]) {
        cursor.continue();
        return;
      };
      if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(location, cursor.value))) {
        cursor.continue();
        return;
      }
      result.push(cursor.value)
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(result);
    }
  })
}