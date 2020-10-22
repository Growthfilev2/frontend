var dom_root = document.getElementById('app-current-panel'); // const appKey = new AppKeys();

var progressBar;
var db;
var snackBar;
var appTabBar;
var potentialAlternatePhoneNumbers;
var deepLink;
var firebaseAnalytics;
var serverTimeUpdated = false;
window.addEventListener('load', function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {
      scope: '/'
    }).then(function (reg) {
      console.log('Registration succeeded. Scope is ' + reg.scope);
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          if (window.location.search && new URLSearchParams(window.location.search).has('action')) {
            deepLink = new URLSearchParams(window.location.search);
          }

          loadApp();
          return;
        }

        redirect("/login".concat(deepLink ? "?".concat(deepLink.toString()) : ''));
      });
    }).catch(function (error) {
      // registration failed
      console.log('Registration failed with ' + error);
    });
  }
});
/**
 * long dynamic link intercepted by device containing query parameters
 * @param {string} link 
 */

function getDynamicLink(link) {
  var url = new URL(link);
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
    img.src = url;
  });
}

var loadApp = function loadApp() {
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));

  if (!window.Worker && !window.indexedDB) {
    var incompatibleDialog = new Dialog('App Incompatiblity', 'OnDuty is incompatible with this device').create();
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
    }, checkNetworkValidation);
    return;
  }

  startApp();
}

var loadScreen = function loadScreen(id) {
  document.querySelectorAll('.transitions .app-init-screens').forEach(function (el) {
    if (el.id === id) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
};

var removeScreen = function removeScreen() {
  document.querySelector('.transitions').remove();
};

function startApp() {
  var dbName = firebase.auth().currentUser.uid;
  var req = window.indexedDB.open(dbName, DB_VERSION);

  req.onupgradeneeded = function (evt) {
    db = req.result;

    db.onerror = function () {
      handleError({
        message: "".concat(db.error.message)
      });
      return;
    };

    switch (evt.oldVersion) {
      case 0:
        createObjectStores(db, dbName);
        break;

      case 30:
        createSubscriptionObjectStore(db);
        createMapObjectStore(db);
        createCalendarObjectStore(db);
        break;

      case 31:
        var addendumStore = req.transaction.objectStore('addendum');

        if (!addendumStore.indexNames.contains('timestamp')) {
          addendumStore.createIndex('timestamp', 'timestamp');
        }

        break;

      case 32:
        var userStore = req.transaction.objectStore('users');

        userStore.openCursor().onsuccess = function (e) {
          var cursor = e.target.result;
          if (!cursor) return;
          delete cursor.value.count;
          userStore.put(cursor.value);
          cursor.continue();
        };

      default:
        console.log('version upgrade');
        break;
    }
  };

  req.onsuccess = function () {
    console.log("request success");
    db = req.result;
    console.log("run app");
    regulator().then(console.log).catch(function (error) {
      if (error.type === 'geolocation') return handleLocationError(error);
      console.log(error);
      contactSupport();
    });
  };

  req.onerror = function () {
    handleError({
      message: "".concat(req.error.name),
      body: JSON.stringify(req.error.message)
    });
  };
}

function getDeepLink() {
  // return new URLSearchParams('?office=Puja Capital&utm_campaign=share_link&action=get-subscription');
  if (deepLink) return deepLink;
  if (isNewUser()) return new URLSearchParams('?utm_source=organic');
  return null;
}

function regulator() {
  var queryLink = getDeepLink();
  var deviceInfo = native.getInfo();
  return new Promise(function (resolve, reject) {
    var prom;
    loadScreen('loading');

    if (appKey.getMode() === 'dev') {
      prom = Promise.resolve();
    } else {
      prom = requestCreator('fcmToken', {
        token: native.getFCMToken()
      });
    }

    ;
    prom.then(function () {
      if (!queryLink) return Promise.resolve();

      if (queryLink.get('action') === 'get-subscription') {
        loadScreen('adding-to-office');
        document.querySelector('#adding-to-office .loading-text--headline').textContent = 'Adding you to ' + queryLink.get('office');
      }

      ;
      return requestCreator('acquisition', {
        source: queryLink.get('utm_source'),
        medium: queryLink.get('utm_medium'),
        campaign: queryLink.get('utm_campaign'),
        office: queryLink.get('office')
      });
    }).then(function () {
      loadScreen('connecting');
      return requestCreator('now');
    }).then(function () {
      serverTimeUpdated = true;
      loadScreen('verifying');
      return appLocation(3);
    }).then(function (geopoint) {
      handleCheckin(geopoint);
      if (window.location.hostname === 'localhost') return Promise.resolve();
      if (JSON.parse(localStorage.getItem('deviceInfo'))) return Promise.resolve();
      return requestCreator('device', deviceInfo);
    }).then(function () {
      localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
    }).catch(reject);
  });
}

function contactSupport() {
  var div = createElement('div', {
    style: 'position:fixed;bottom:1rem;width:100%;text-align:center'
  });
  div.innerHTML = "\n  \n  <p class='mdc-typography--headline6 mb-10 mt-0'>Having trouble ? </p>\n  <a class='mdc-typography--subtitle2 mdc-theme--primary' href=\"https://wa.me/918595422858\">Contact support</a>\n  ";
  dom_root.appendChild(div);
}

function handleCheckin(geopoint, noUser) {
  var queryLink = getDeepLink();
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
      };
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      mapView(geopoint);
      return;
    }

    if (!shouldCheckin(geopoint, checkInSubs)) return initProfileView();

    if (Object.keys(checkInSubs).length) {
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      return mapView(geopoint);
    }

    var storeNames = ['activity', 'addendum', 'children', 'subscriptions', 'map', 'attendance', 'reimbursement', 'payment'];
    Promise.all([firebase.auth().currentUser.getIdTokenResult(), checkIDBCount(storeNames)]).then(function (result) {
      getRootRecord().then(function (record) {
        if (record.fromTime == 0) {
          loadScreen('loading-data'); // serviceWorkerRequestCreator(null).then((res)=>{

          navigator.serviceWorker.controller.postMessage({
            type: 'read'
          }); // })

          navigator.serviceWorker.onmessage = function (event) {
            console.log('message from worker', event.data);
            handleCheckin(geopoint);
          };

          return;
        }

        if (isAdmin(result[0]) || result[1]) return initProfileView();
        return noOfficeFoundScreen();
      });
    });
  });
}

function noOfficeFoundScreen() {
  var content = "\n      <div class='message-screen mdc-layout-grid'>\n      <div class='icon-container'>\n        <div class='mdc-theme--primary icons'>\n          <i class='material-icons'>help_outline</i>\n        </div>\n      </div>\n      <div class='text-container'>\n        <h3 class='mdc-typography--headline5 headline mt-0'>No office found </h3>\n        <p class='mdc-typography--body1'>\n          No office found in OnDuty. Please contact your administrator\n        </p>\n      </div>\n    </div>\n  ";
  dom_root.innerHTML = content;
}

function initProfileView() {
  var auth = firebase.auth().currentUser;
  if (!auth.displayName) return redirect("/profile_edit?askPhoto=1&new_user=".concat(isNewUser()));
  redirect('/home');
}

var isNewUser = function isNewUser() {
  var metaData = firebase.auth().currentUser.metadata;
  return metaData.creationTime === metaData.lastSignInTime;
};

function checkEmptyIdProofs(record) {
  if (!record.idProof) return true;
  var keys = Object.keys(record.idProof);
  var isEmpty = false;
  keys.forEach(function (key) {
    if (!record.idProof[key].number || !record.idProof[key].front || !record.idProof[key].back) {
      isEmpty = true;
      return;
    }
  });
  return isEmpty;
}

function getProfileInformation() {
  return new Promise(function (resolve, reject) {
    var record;
    getRootRecord().then(function (record) {
      if (!record.aadhar || !record.pan || !record.linkedAccounts) {
        requestCreator('profile').then(function (response) {
          var dbName = firebase.auth().currentUser.uid;
          var rootTx = db.transaction('root', 'readwrite');
          var store = rootTx.objectStore('root');

          store.get(dbName).onsuccess = function (event) {
            record = event.target.result;
            delete record.idProof;
            record.linkedAccounts = response.linkedAccounts;
            record.pan = response.pan;
            record.aadhar = response.aadhar;
            store.put(record);
          };

          rootTx.oncomplete = function () {
            return resolve(record);
          };
        }).catch(reject);
        return;
      }

      return resolve(record);
    });
  });
}

function showReLoginDialog(heading, contentText) {
  var content = "<h3 class=\"mdc-typography--headline6 mdc-theme--primary\">".concat(contentText, "</h3>");
  var dialog = new Dialog(heading, content).create();
  dialog.open();
  dialog.buttons_[1].textContent = 'RE-LOGIN';
  return dialog;
}

function areObjectStoreValid(names) {
  var stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum'];

  for (var index = 0; index < stores.length; index++) {
    var el = stores[index];

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
    var tx = db.transaction(['children']);
    var store = tx.objectStore('children');
    var index = store.index(indexName);
    var getEmployee = index.getAll(range);

    getEmployee.onsuccess = function (event) {
      var result = event.target.result;
      console.log(result);
      return resolve(result);
    };

    getEmployee.onerror = function () {
      return reject({
        message: getEmployee.error,
        body: ''
      });
    };
  });
}

function createObjectStores(db, uid) {
  var activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  });
  activity.createIndex('timestamp', 'timestamp');
  activity.createIndex('office', 'office');
  activity.createIndex('hidden', 'hidden');
  activity.createIndex('template', 'template');
  activity.createIndex('status', 'status');
  var users = db.createObjectStore('users', {
    keyPath: 'mobile'
  });
  users.createIndex('displayName', 'displayName');
  users.createIndex('isUpdated', 'isUpdated');
  users.createIndex('count', 'count');
  users.createIndex('mobile', 'mobile');
  users.createIndex('timestamp', 'timestamp');
  users.createIndex('NAME_SEARCH', 'NAME_SEARCH');
  var addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  });
  addendum.createIndex('activityId', 'activityId');
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key');
  addendum.createIndex('timestamp', 'timestamp');
  addendum.createIndex('KeyTimestamp', ['timestamp', 'key']);
  createSubscriptionObjectStore(db);
  createCalendarObjectStore(db);
  createMapObjectStore(db);
  var children = db.createObjectStore('children', {
    keyPath: 'activityId'
  });
  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice', ['employee', 'office']);
  children.createIndex('team', 'team');
  children.createIndex('teamOffice', ['team', 'office']);
  createReportObjectStores(db);
  createRootObjectStore(db, uid, 0);
}

function createCalendarObjectStore(db) {
  if (db.objectStoreNames.contains('calendar')) {
    db.deleteObjectStore('calendar');
  }

  var calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  });
  calendar.createIndex('activityId', 'activityId');
  calendar.createIndex('timestamp', 'timestamp');
  calendar.createIndex('start', 'start');
  calendar.createIndex('end', 'end');
  calendar.createIndex('templateOffice', ['template', 'office']);
}

function createSubscriptionObjectStore(db) {
  if (db.objectStoreNames.contains('subscriptions')) {
    db.deleteObjectStore('subscriptions');
  }

  var subscriptions = db.createObjectStore('subscriptions', {
    keyPath: 'activityId'
  });
  subscriptions.createIndex('office', 'office');
  subscriptions.createIndex('template', 'template');
  subscriptions.createIndex('officeTemplate', ['office', 'template']);
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status']);
  subscriptions.createIndex('templateStatus', ['template', 'status']);
  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('report', 'report');
}

function createMapObjectStore(db) {
  if (db.objectStoreNames.contains('map')) {
    db.deleteObjectStore('map');
  }

  var map = db.createObjectStore('map', {
    keyPath: 'activityId'
  });
  map.createIndex('location', 'location');
  map.createIndex('latitude', 'latitude');
  map.createIndex('longitude', 'longitude');
  map.createIndex('byOffice', ['office', 'location']);
  map.createIndex('bounds', ['latitude', 'longitude']);
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
}

function createReportObjectStores(db) {
  if (!db.objectStoreNames.contains('attendance')) {
    var attendance = db.createObjectStore('attendance', {
      keyPath: 'id'
    });
    attendance.createIndex('key', 'key');
    attendance.createIndex('date', 'date');
    attendance.createIndex('month', 'month');
    attendance.createIndex('office', 'office');
    attendance.createIndex('attendance', 'attendance');
  }

  if (!db.objectStoreNames.contains('payment')) {
    var payments = db.createObjectStore('payment', {
      keyPath: 'id'
    });
    payments.createIndex('key', 'key');
    payments.createIndex('date', 'date');
    payments.createIndex('month', 'month');
    payments.createIndex('year', 'year');
    payments.createIndex('status', 'status');
    payments.createIndex('office', 'office');
  }

  if (!db.objectStoreNames.contains('reimbursement')) {
    var reimbursements = db.createObjectStore('reimbursement', {
      keyPath: 'id'
    });
    reimbursements.createIndex('key', 'key');
    reimbursements.createIndex('date', 'date');
    reimbursements.createIndex('month', 'month');
    reimbursements.createIndex('year', 'year');
    reimbursements.createIndex('office', 'office');
  }
}

function createRootObjectStore(db, uid, fromTime) {
  var root = db.createObjectStore('root', {
    keyPath: 'uid'
  });
  root.put({
    uid: uid,
    fromTime: fromTime,
    location: ''
  });
}

function getCheckInSubs() {
  return new Promise(function (resolve) {
    var checkInSubs = {};
    var tx = db.transaction('subscriptions');

    tx.objectStore('subscriptions').index('templateStatus').openCursor(IDBKeyRange.bound(['check-in', 'CONFIRMED'], ['check-in', 'PENDING'])).onsuccess = function (event) {
      var cursor = event.target.result;
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
        checkInSubs[cursor.value.office] = cursor.value;
      }

      cursor.continue();
    };

    tx.oncomplete = function () {
      delete checkInSubs['xanadu'];
      return resolve(checkInSubs);
    };
  });
}

;

function checkIDBCount(storeNames) {
  return new Promise(function (resolve, reject) {
    var totalCount = 0;
    var tx = db.transaction(storeNames);
    storeNames.forEach(function (name) {
      if (!db.objectStoreNames.contains(name)) return;
      var store = tx.objectStore(name);
      var req = store.count();

      req.onsuccess = function () {
        totalCount += req.result;
      };
    });

    tx.oncomplete = function () {
      return resolve(totalCount);
    };

    tx.onerror = function () {
      return reject({
        message: tx.error.message,
        body: tx.error
      });
    };
  });
}

function fillVenueInSub(sub, venue) {
  var vd = sub.venue[0];
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
  var oldState = JSON.parse(localStorage.getItem('ApplicationState'));
  if (!oldState) return true;
  if (!oldState.lastCheckInCreated) return true;
  var isOlder = isLastLocationOlderThanThreshold(oldState.lastCheckInCreated, 300);
  var hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldState.location, geopoint));

  if (isOlder || hasChangedLocation) {
    return true;
  }

  ApplicationState = oldState;
  return false;
}

function failureScreen(error, callback) {
  dom_root.innerHTML = "\n    <div class=\"center-abs location-not-found\">\n    <i class='material-icons mdc-theme--secondary'>".concat(error.icon || 'location_off', "</i>\n    <p class='mdc-typography--headline5'>\n    ").concat(error.title, "\n    </p>\n    <p class='mdc-typography--body1'>\n    ").concat(error.message, "\n    </p>\n    <button class=\"mdc-button mdc-theme--primary-bg\" id='try-again'>\n    <span class=\"mdc-button__label mdc-theme--on-primary\">RETRY</span>\n    </button>\n    </div>");
  document.getElementById('try-again').addEventListener('click', function (evt) {
    document.querySelector('.center-abs.location-not-found').classList.add('hidden');
    callback();
  });
}

function mapView(location) {
  ApplicationState.location = location; // progressBar.close();

  var latLng = {
    lat: location.latitude,
    lng: location.longitude
  };
  console.log(latLng);
  var offsetBounds = new GetOffsetBounds(location, 1);
  loadNearByLocations({
    north: offsetBounds.north(),
    south: offsetBounds.south(),
    east: offsetBounds.east(),
    west: offsetBounds.west()
  }, location).then(function (nearByLocations) {
    if (!nearByLocations.length) return createUnkownCheckIn(location);
    if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
    loadLocationsCard(nearByLocations, location);
  });
}

function createUnkownCheckIn(geopoint) {
  // document.getElementById("app-header").classList.add('hidden')
  var offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;

  if (offices.length == 1) {
    generateRequestForUnknownCheckin(offices[0], geopoint);
    return;
  }

  var officeCard = bottomCard('Choose office');
  offices.forEach(function (office) {
    var li = createList({
      primaryText: office,
      meta: 'navigate_next'
    });
    officeCard.ul.appendChild(li);
  });
  new mdc.list.MDCList(officeCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index);
    var selectedOffice = offices[evt.detail.index];
    generateRequestForUnknownCheckin(selectedOffice, geopoint);
    officeCard.card.classList.add('hidden');
  });
  dom_root.appendChild(officeCard.card);
}

function generateRequestForUnknownCheckin(office, geopoint) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };
  loadScreen('checkin');
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in';
  getRootRecord().then(function (rootRecord) {
    var timestamp = fetchCurrentTime(rootRecord.serverTime);
    var copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];
    copy.timestamp = timestamp;
    requestCreator('create', fillVenueInSub(copy, ''), geopoint).then(function () {
      removeScreen();
      successDialog('Check-In Created');
      ApplicationState.venue = '';
      ApplicationState.selectedOffice = office;
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      initProfileView();
    }).catch(function (error) {
      console.log(error); // progressBar.close()

      var queryLink = getDeepLink();

      if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === "No subscription found for the template: 'check-in' with the office '".concat(queryLink.get('office'), "'")) {
        if (retries.subscriptionRetry <= 2) {
          setTimeout(function () {
            retries.subscriptionRetry++;
            generateRequestForUnknownCheckin(office, geopoint, retries);
          }, 5000);
        }

        return;
      }

      if (error.message === 'Invalid check-in') {
        handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
          ApplicationState.location = newGeopoint;
          retries.invalidRetry++;
          generateRequestForUnknownCheckin(office, newGeopoint, retries);
        });
        return;
      }

      ;
    });
  });
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
    });
    return;
  }

  try {
    webkit.messageHandlers.locationService.postMessage('start');
    window.addEventListener('iosLocation', function _iosLocation(e) {
      callback(e.detail);
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

var bottomCard = function bottomCard(heading, listTwoLine) {
  var card = createElement('div', {
    className: 'mdc-card mdc-elevation--z16 mdc-card--outlined bottom-card'
  });
  card.appendChild(createElement('h1', {
    className: 'mdc-typography--headline6',
    textContent: heading
  }));
  var ul = createElement('ul', {
    className: 'mdc-list pt-0'
  });

  if (listTwoLine) {
    ul.classList.add('mdc-list--two-line', 'mdc-list--avatar-list');
  }

  card.appendChild(ul);
  return {
    ul: ul,
    card: card
  };
};

function loadLocationsCard(venues, geopoint) {
  ApplicationState.knownLocation = true;
  var locationCard = bottomCard('Choose duty location', true);
  venues.map(function (venue) {
    locationCard.ul.appendChild(createList({
      icon: 'location_on',
      primaryText: venue.location,
      secondaryText: venue.office,
      meta: 'navigate_next'
    }));
  });
  new mdc.list.MDCList(locationCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index);
    var selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue, geopoint);
    locationCard.card.classList.add('hidden'); // return;
  });
  dom_root.appendChild(locationCard.card);
}

;

function createKnownCheckIn(selectedVenue, geopoint) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };
  console.log(selectedVenue);
  var copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]));
  copy.share = []; // progressBar.open()

  loadScreen('checkin');
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in at ' + selectedVenue.location; // return

  requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {
    removeScreen();
    successDialog('Check-In Created');
    ApplicationState.venue = selectedVenue;
    ApplicationState.selectedOffice = selectedVenue.office;
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initProfileView();
  }).catch(function (error) {
    console.log(error); // progressBar.close()

    var queryLink = getDeepLink();

    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === "No subscription found for the template: 'check-in' with the office '".concat(queryLink.get('office'), "'")) {
      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++;
          createKnownCheckIn(selectedVenue, geopoint, retries);
        }, 5000);
      }

      return;
    }

    ;

    if (error.message === 'Invalid check-in') {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++;
        createKnownCheckIn(selectedVenue, newGeopoint, retries);
      });
      return;
    }

    ;
  });
}

function snapView(selector) {
  document.querySelector(selector).innerHTML = "\n  <div class='snap-container'>\n  <h6 class='mdc-typography--headline5 text-center'>\n    Create a photo check-in\n  </h6>\n  <div class='landing-page-container text-center'>\n    <button class=\"mdc-fab mdc-fab--extended mdc-theme--primary-bg mdc-theme--on-primary\">\n      <div class=\"mdc-fab__ripple\"></div>\n      <span class=\"material-icons mdc-fab__icon\">camera</span>\n      <span class=\"mdc-fab__label\">Take photo</span>\n    </button>\n  </div>\n  </div>\n  ";
  document.querySelector('.snap-container .mdc-fab').addEventListener('click', openCamera);
  openCamera();
}

function openCamera() {
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return;
  }

  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {
  var retries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };
  var url = "data:image/jpg;base64,".concat(base64);
  dom_root.innerHTML = "\n  <div class='image-container'>\n    <div id='snap' class=\"snap-bckg\">\n      <div class=\"form-meta snap-form\">\n        <div class=\"mdc-text-field mdc-text-field--no-label mdc-text-field--textarea\" id='snap-textarea'>\n            <textarea\n            class=\"mdc-text-field__input  snap-text mdc-theme--on-primary\" rows=\"1\" cols=\"100\"></textarea></div>\n            <button id='snap-submit' class=\"mdc-fab app-fab--absolute  snap-fab mdc-theme--primary-bg  mdc-ripple-upgraded\"\n          style=\"z-index: 9;\">\n          <svg class=\"mdc-button__icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path d=\"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z\"/><path d=\"M0 0h24v24H0z\" fill=\"none\"/></svg>\n        </button>\n      </div>\n    </div>\n  </div>\n  ";
  var backIcon = "<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>\n        <span class=\"mdc-top-app-bar__title\">Upload photo</span>\n        ";
  var header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden');
  var content = document.getElementById('snap');
  var textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'));
  var submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'));
  textarea.focus();
  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px';
    this.style.height = this.scrollHeight + "px";

    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = this.scrollHeight - 20 + "px";
    }
  });
  var image = new Image();

  image.onload = function () {
    var orientation = getOrientation(image);
    content.style.backgroundImage = "url(".concat(url, ")");

    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain';
    }
  };

  image.src = url;
  submit.root_.addEventListener('click', function () {
    var textValue = textarea.value;
    sendPhotoCheckinRequest({
      sub: ApplicationState.officeWithCheckInSubs[ApplicationState.selectedOffice],
      base64: url,
      retries: retries,
      textValue: textValue,
      knownLocation: true
    });
  });
}

function sendPhotoCheckinRequest(request) {
  var url = request.base64;
  var textValue = request.textValue;
  var retries = request.retries;
  var sub = JSON.parse(JSON.stringify(request.sub));
  sub.attachment.Photo.value = url || '';
  sub.attachment.Comment.value = textValue;
  sub.share = [];
  history.back();
  requestCreator('create', fillVenueInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {
    successDialog('Photo uploaded');
  }).catch(function (error) {
    var queryLink = getDeepLink();

    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === "No subscription found for the template: 'check-in' with the office '".concat(queryLink.get('office'), "'")) {
      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++;

          if (request.knownLocation) {
            createKnownCheckIn(ApplicationState.venue, geopoint, retries);
          } else {
            createUnkownCheckIn(sub.office, geopoint, retries);
          }
        }, 5000);
      }

      return;
    }

    if (error.message === 'Invalid check-in') {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++;
        setFilePath(base64, retries);
      });
      return;
    }

    ;
  });
}

function mdcDefaultSelect(data, label, id, option) {
  var template = "<div class=\"mdc-select\" id=".concat(id, ">\n  <i class=\"mdc-select__dropdown-icon\"></i>\n  <select class=\"mdc-select__native-control\">\n  <option disabled selected></option>\n  ").concat(data.map(function (value) {
    return " <option value='".concat(value, "'>\n    ").concat(value, "\n    </option>");
  }).join(""), "\n").concat(option, "\n\n  </select>\n  <label class='mdc-floating-label'>").concat(label, "</label>\n  <div class=\"mdc-line-ripple\"></div>\n</div>");
  return template;
}

function mdcSelectVenue(venues, label, id) {
  var template = "<div class=\"mdc-select\" id=".concat(id, ">\n  <i class=\"mdc-select__dropdown-icon\"></i>\n  <select class=\"mdc-select__native-control\">\n  <option disabled selected value=").concat(JSON.stringify('0'), "></option>\n  <option value=").concat(JSON.stringify('1'), ">UNKNOWN LOCATION</option>\n\n  ").concat(venues.map(function (value) {
    return " <option value='".concat(JSON.stringify(value), "'>\n    ").concat(value.location, "\n    </option>");
  }).join(""), "\n  \n</select>\n  <label class='mdc-floating-label'>").concat(label, "</label>\n  <div class=\"mdc-line-ripple\"></div>\n</div>");
  return template;
}

function getOrientation(image) {
  if (image.width > image.height) return 'landscape';
  if (image.height > image.width) return 'potrait';
  if (image.width == image.height) return 'square';
}

function loadNearByLocations(o, location) {
  return new Promise(function (resolve, reject) {
    var result = [];
    var tx = db.transaction(['map']);
    var store = tx.objectStore('map');
    var index = store.index('bounds');
    var idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);

    index.openCursor(idbRange).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      if (!ApplicationState.officeWithCheckInSubs[cursor.value.office]) {
        cursor.continue();
        return;
      }

      ;

      if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(location, cursor.value))) {
        cursor.continue();
        return;
      }

      result.push(cursor.value);
      cursor.continue();
    };

    tx.oncomplete = function () {
      return resolve(result);
    };
  });
}