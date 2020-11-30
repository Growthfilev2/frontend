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
      scope: '/v3/'
    }).then(function (reg) {
      var reloadCounter = 0;
      reg.addEventListener('updatefound', function () {
        // A wild service worker has appeared in reg.installing!
        var newWorker = reg.installing; // newWorker.state;
        // "installing" - the install event has fired, but not yet complete
        // "installed"  - install complete
        // "activating" - the activate event has fired, but not yet complete
        // "activated"  - fully active
        // "redundant"  - discarded. Either failed install, or it's been
        //                replaced by a newer version

        newWorker.addEventListener('statechange', function (e) {
          // newWorker.state has changed
          if (newWorker.state === "installing") {
            console.log("new worker is installing");
          }

          if (newWorker.state === "installed") {
            console.log("new worker is installed");
          }

          if (newWorker.state === "activating") {
            console.log("new worker is activating");
          }

          if (newWorker.state === "activated") {
            if (reloadCounter >= 1) return;
            reloadCounter++;
            console.log("new worker is activate");
            firebase.auth().onAuthStateChanged(function (user) {
              if (user) {
                if (window.location.search && new URLSearchParams(window.location.search).has('action')) {
                  deepLink = new URLSearchParams(window.location.search);
                }

                loadApp();
                return;
              }

              redirect("/login.html".concat(deepLink ? "?".concat(deepLink.toString()) : ''));
            });
          }
        });
      });

      if (reg.installing) {
        console.log("sw installing");
      }

      if (reg.waiting) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
        console.log("sw will update");
      }

      if (reg.active) {
        console.log("sw is active");
        firebase.auth().onAuthStateChanged(function (user) {
          console.log("auth started");

          if (user) {
            if (window.location.search && new URLSearchParams(window.location.search).has('action')) {
              deepLink = new URLSearchParams(window.location.search);
            }

            loadApp();
            return;
          }

          redirect("/login.html".concat(deepLink ? "?".concat(deepLink.toString()) : ''));
        });
      }
    })["catch"](function (error) {
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
/** To be removed in next ios release */


function parseDynamicLink(link) {
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
  startApp(); // checkNetworkValidation();
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
          cursor["continue"]();
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
    regulator().then(console.log)["catch"](function (error) {
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

  var deviceInfo = _native.getInfo();

  return new Promise(function (resolve, reject) {
    var prom;
    loadScreen('loading');

    if (appKey.getMode() === 'dev' && window.location.hostname === 'localhost') {
      prom = Promise.resolve();
    } else {
      prom = requestCreator('fcmToken', {
        token: _native.getFCMToken()
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
      if (window.location.hostname === 'localhost' && appKey.getMode() === 'dev') return Promise.resolve();
      if (JSON.parse(localStorage.getItem('deviceInfo'))) return Promise.resolve();
      return requestCreator('device', deviceInfo);
    }).then(function () {
      localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
    })["catch"](reject);
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
          loadScreen('loading-data');
          console.log("sending read 0");
          console.log(navigator.serviceWorker.controller);
          firebase.auth().currentUser.getIdToken().then(function (token) {
            fetch("".concat(appKey.getBaseUrl(), "read1?from=0"), {
              method: 'GET',
              body: null,
              headers: {
                'Content-type': 'application/json',
                'Authorization': "Bearer ".concat(token)
              }
            }).then(function (response) {
              console.log("read status", response.status);

              if (!response.status || response.status >= 226 || !response.ok) {
                throw response;
              }

              return response.json();
            }).then(function (res) {
              if (res.hasOwnProperty('success') && !res.success) {
                snacks('Try again later');
                handleError({
                  message: 'read 0 error',
                  body: JSON.stringify(res)
                });
                return;
              }

              navigator.serviceWorker.controller.postMessage({
                type: 'read',
                readResponse: res
              });

              navigator.serviceWorker.onmessage = function (event) {
                console.log('message from worker', event.data);

                if (event.data.type === 'error') {
                  handleError(event.data);
                  snacks('Try again later');
                  return;
                }

                handleCheckin(geopoint);
              };
            })["catch"](function (err) {
              console.log("read err", err);
              handleError({
                message: err.message,
                body: JSON.stringify(err)
              });

              if (typeof err.text === "function") {
                err.text().then(function (errorMessage) {
                  console.log(JSON.parse(errorMessage));
                });
              }
            });
          });
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
  if (!auth.displayName) return redirect("/profile_edit.html?askPhoto=1&new_user=".concat(isNewUser()));
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
        })["catch"](reject);
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