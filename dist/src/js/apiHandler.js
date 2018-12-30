var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// import firebase app script because there is no native support of firebase inside web workers

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js');
// Backend API Url
var apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/';
var deviceInfo = void 0;
/** reinitialize the firebase app */

// get Device time
function getTime() {
  return Date.now();
}

// dictionary object with key as the worker's onmessage event data and value as
// function name
var requestFunctionCaller = {
  comment: comment,
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  Null: Null,
  now: fetchServerTime
};

function requestHandlerResponse(type, code, message, params) {
  self.postMessage({
    type: type,
    code: code,
    msg: message,
    params: params
  });
}

function createLog(body) {

  return JSON.stringify(body);
}

firebase.initializeApp({
  apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
  authDomain: "growthfilev2-0.firebaseapp.com",
  databaseURL: "https://growthfilev2-0.firebaseio.com",
  projectId: "growthfilev2-0",
  storageBucket: "growthfilev2-0.appspot.com",
  messagingSenderId: "1011478688238"
});

// when worker receives the request body from the main thread
self.onmessage = function (event) {
  firebase.auth().onAuthStateChanged(function (auth) {

    if (event.data.type === 'now') {
      fetchServerTime(event.data.body).then(initializeIDB).then(updateIDB).catch(console.log);
      return;
    }
    if (event.data.type === 'instant') {
      instant(event.data.body);
      return;
    }
    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(function (error) {
      console.log(error);
    });
  });
};

// Performs XMLHTTPRequest for the API's.

function http(method, url, data) {
  return new Promise(function (resolve, reject) {
    firebase.auth().currentUser.getIdToken().then(function (idToken) {
      var xhr = new XMLHttpRequest();

      xhr.open(method, url, true);

      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

      xhr.onreadystatechange = function () {
        // console.log(xhr.status)
        if (xhr.readyState === 4) {
          // console.log(xhr.status)
          if (!xhr.status) {
            requestHandlerResponse('android-stop-refreshing', 400, 'true');
            return;
          }

          if (xhr.status > 226) {
            var errorObject = JSON.parse(xhr.response);
            requestHandlerResponse('error', errorObject.code, errorObject.message);
            return reject({
              res: JSON.parse(xhr.response),
              url: url,
              data: data,
              device: currentDevice
            });
          }
          xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success');
        }
      };

      xhr.send(data || null);
    }).catch(function (error) {

      instant(createLog(error));
    });
  });
}

function fetchServerTime(info) {
  currentDevice = info.device;
  var parsedDeviceInfo = JSON.parse(currentDevice);

  console.log(_typeof(parsedDeviceInfo.appVersion));
  return new Promise(function (resolve) {
    http('GET', apiUrl + 'now?deviceId=' + parsedDeviceInfo.id + '&appVersion=' + parsedDeviceInfo.appVersion + '&os=' + parsedDeviceInfo.baseOs).then(function (response) {
      console.log(response);
      if (response.updateClient) {
        console.log("please update device");
        var title = 'Message';
        var message = 'There is a New version of your app available';

        var button = {
          text: 'Update',
          show: true,
          clickAction: {
            redirection: {
              text: 'com.growthfile.growthfileNew',
              value: true
            }
          }
        };

        var alertData = JSON.stringify({
          title: title,
          message: message,
          cancelable: false,
          button: button
        });
        requestHandlerResponse('update-app', 200, alertData, '');
        return;
      }

      if (response.revokeSession) {
        requestHandlerResponse('revoke-session', 200);
        return;
      };

      resolve({
        ts: response.timestamp,
        fromTime: info.from
      });
    }).catch(function (error) {
      instant(createLog(error));
    });
  });
}

function instant(error) {
  console.log(error);
  http('POST', apiUrl + 'services/logs', error).then(function (response) {
    console.log(response);
  }).catch(console.log);
}

/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */

function fetchRecord(dbName, id) {
  return new Promise(function (resolve) {

    var req = indexedDB.open(dbName);
    req.onsuccess = function (event) {
      var db = req.result;
      var objStore = db.transaction('activity').objectStore('activity');
      objStore.get(id).onsuccess = function (event) {

        resolve(event.target.result);
      };
    };
  });
}

function initializeIDB(data) {
  console.log("init db");
  // onAuthStateChanged is added because app is reinitialized
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser;

    var request = indexedDB.open(auth.uid, 2);

    request.onerror = function () {
      console.log(request.error);
      reject(request.error);
    };

    request.onupgradeneeded = function (evt) {
      console.log(evt);
      createObjectStores(request, auth, data.fromTime);
    };

    request.onsuccess = function () {
      var rootTx = request.result.transaction(['root'], 'readwrite');
      var rootObjectStore = rootTx.objectStore('root');
      rootObjectStore.get(auth.uid).onsuccess = function (event) {
        var record = event.target.result;
        record.serverTime = data.ts - Date.now();
        rootObjectStore.put(record);
      };
      rootTx.oncomplete = function () {
        requestHandlerResponse('manageLocation');
        resolve({
          dbName: auth.uid,
          swipe: 'false'
        });
      };
    };
  });
}

function createObjectStores(request, auth, fromTime) {
  console.log(fromTime);
  var db = request.result;

  var activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  });

  activity.createIndex('timestamp', 'timestamp');
  activity.createIndex('office', 'office');
  activity.createIndex('hidden', 'hidden');

  var list = db.createObjectStore('list', {
    keyPath: 'activityId'
  });
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');

  var users = db.createObjectStore('users', {
    keyPath: 'mobile'
  });

  users.createIndex('displayName', 'displayName');
  users.createIndex('isUpdated', 'isUpdated');
  users.createIndex('count', 'count');

  var addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  });

  addendum.createIndex('activityId', 'activityId');

  var subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  });

  subscriptions.createIndex('office', 'office');
  subscriptions.createIndex('template', 'template');
  subscriptions.createIndex('officeTemplate', ['office', 'template']);

  var calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  });

  calendar.createIndex('activityId', 'activityId');
  calendar.createIndex('timestamp', 'timestamp');
  calendar.createIndex('start', 'start');
  calendar.createIndex('end', 'end');
  calendar.createIndex('urgent', ['status', 'hidden']);

  var map = db.createObjectStore('map', {
    autoIncrement: true
  });

  map.createIndex('activityId', 'activityId');
  map.createIndex('location', 'location');
  map.createIndex('latitude', 'latitude');
  map.createIndex('longitude', 'longitude');
  map.createIndex('nearby', ['status', 'hidden']);

  var children = db.createObjectStore('children', {
    keyPath: 'activityId'
  });

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');

  var root = db.createObjectStore('root', {
    keyPath: 'uid'
  });

  root.put({
    uid: auth.uid,
    fromTime: fromTime,
    location: ''
  });
}

function comment(body) {
  console.log(body);
  return new Promise(function (resolve, reject) {
    http('POST', apiUrl + 'activities/comment', JSON.stringify(body)).then(function () {
      // requestHandlerResponse('notification', 200, 'comment added successfully', firebase.auth().currentUser.uid)
      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      });
    }).catch(function (error) {

      instant(createLog(error));
    });
  });
}

function statusChange(body) {
  console.log(body);
  var dbName = firebase.auth().currentUser.uid;

  return new Promise(function (resolve, reject) {
    fetchRecord(dbName, body.activityId).then(function (originalRecord) {
      http('PATCH', apiUrl + 'activities/change-status', JSON.stringify(body), originalRecord).then(function (success) {
        instantUpdateDB(dbName, body, 'status');

        requestHandlerResponse('notification', 200, 'status changed successfully', dbName);

        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        });
      }).catch(function (error) {
        instant(createLog(error));
      });
    });
  });
}

function share(body) {
  var dbName = firebase.auth().currentUser.uid;

  return new Promise(function (resolve, reject) {

    http('PATCH', apiUrl + 'activities/share', JSON.stringify(body)).then(function (success) {
      instantUpdateDB(dbName, body, 'share');
      requestHandlerResponse('notification', 200, 'assignne added successfully', dbName);
      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      });
    }).catch(function (error) {
      instant(createLog(error));
    });
  });
}

function Null(swipe) {
  console.log(swipe);
  return new Promise(function (resolve, reject) {
    var user = firebase.auth().currentUser;
    if (!user) {
      requestHandlerResponse('android-stop-refreshing');
      reject(null);
      return;
    }
    if (swipe === "true") {
      console.log(JSON.parse(swipe));
      requestHandlerResponse('reset-offset');
    }
    console.log("Null Ran");
    resolve({
      dbName: user.uid,
      swipe: swipe
    });
  });
}

function update(body) {
  var dbName = firebase.auth().currentUser.uid;
  console.log(body);

  return new Promise(function (resolve, reject) {
    http('PATCH', apiUrl + 'activities/update', JSON.stringify(body)).then(function (success) {
      instantUpdateDB(dbName, body, 'update');
      requestHandlerResponse('notification', 200, 'activity update successfully', dbName);

      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      });
    }).catch(function (error) {

      instant(createLog(error));
    });
  });
}

function create(body) {
  console.log(body);
  return new Promise(function (resolve, reject) {
    http('POST', apiUrl + 'activities/create', JSON.stringify(body)).then(function (success) {
      requestHandlerResponse('notification', 200, 'activity created successfully', firebase.auth().currentUser.uid);

      requestHandlerResponse('redirect-to-list', 200, '', firebase.auth().currentUser.uid);
      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      });
    }).catch(function (error) {
      console.log(error);
      instant(createLog(error));
    });
  });
}

function instantUpdateDB(dbName, data, type) {
  console.log(data);
  var req = indexedDB.open(dbName);
  req.onsuccess = function (event) {
    var db = req.result;
    var objStoreTx = db.transaction(['activity'], 'readwrite');
    var objStore = objStoreTx.objectStore('activity');
    objStore.get(data.activityId).onsuccess = function (event) {
      var record = event.target.result;
      record.editable = 0;

      if (type === 'share') {
        record.assignees.push(data.share[0]);
        objStore.put(record);
        console.log(record);
      }
      if (type === 'update') {

        // const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')
        // activityStore.get(data.activityId).onsuccess = function (event) {
        //   const record = event.target.result
        //   const updateData = data
        record.schedule = data.schedule;
        record.attachment = data.attachment;
        for (var i = 0; i < record.venue.length; i++) {
          record.venue[i].geopoint = {
            '_latitude': data.venue[i].geopoint['_latitude'],
            '_longitude': data.venue[i].geopoint['_longitude']
          };
        }
        objStore.put(record);
      }
      if (type === 'status') {

        record[type] = data[type];
        objStore.put(record);
      }
    };
    objStoreTx.oncomplete = function () {

      if (type === 'status' || type === 'update') {
        requestHandlerResponse('redirect-to-list', 200, '');
      }
      if (type === 'share') {

        requestHandlerResponse('updateAssigneesList', 200, 'update user', {
          id: data.activityId,
          number: data.share[0]
        });
      }
    };
  };
}

function updateMap(activity) {

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var mapTx = db.transaction(['map'], 'readwrite');
    var mapObjectStore = mapTx.objectStore('map');
    var mapActivityIdIndex = mapObjectStore.index('activityId');
    mapActivityIdIndex.openCursor(activity.activityId).onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        var deleteRecordReq = cursor.delete();
        cursor.continue();
        deleteRecordReq.onerror = errorDeletingRecord;
      }
    };

    mapTx.oncomplete = function () {
      var mapTx = db.transaction(['map'], 'readwrite');
      var mapObjectStore = mapTx.objectStore('map');

      activity.venue.forEach(function (newVenue) {
        mapObjectStore.add({
          activityId: activity.activityId,
          latitude: newVenue.geopoint['_latitude'],
          longitude: newVenue.geopoint['_longitude'],
          location: newVenue.location.toLowerCase(),
          template: activity.template,
          address: newVenue.address.toLowerCase(),
          venueDescriptor: newVenue.venueDescriptor,
          status: activity.status,
          office: activity.office,
          hidden: activity.hidden
        });
      });
    };
    mapTx.onerror = errorDeletingRecord;
  };
}

function errorDeletingRecord(event) {
  console.log(event.target.error);
}

function transactionError(event) {
  console.log(event.target.error);
}

function updateCalendar(activity) {

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var calendarTx = db.transaction(['calendar'], 'readwrite');
    var calendarObjectStore = calendarTx.objectStore('calendar');
    var calendarActivityIndex = calendarObjectStore.index('activityId');

    calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
      // console.log(activity.activityId)
      var cursor = event.target.result;
      if (cursor) {
        var recordDeleteReq = cursor.delete();
        recordDeleteReq.onerror = errorDeletingRecord;
        cursor.continue();
      }
    };
    calendarTx.oncomplete = function () {
      var calendarTx = db.transaction(['calendar'], 'readwrite');
      var calendarObjectStore = calendarTx.objectStore('calendar');

      activity.schedule.forEach(function (schedule) {
        var startTime = moment(schedule.startTime).toDate();
        var endTime = moment(schedule.endTime).toDate();

        calendarObjectStore.add({
          activityId: activity.activityId,
          scheduleName: schedule.name,
          timestamp: activity.timestamp,
          template: activity.template,
          hidden: activity.hidden,
          start: moment(startTime).format('YYYY-MM-DD'),
          end: moment(endTime).format('YYYY-MM-DD'),
          status: activity.status,
          office: activity.office
        });
      });
      calendarTx.onerror = transactionError;
    };
  };
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment(db, activity) {
  var chidlrenObjectStore = db.transaction('children', 'readwrite').objectStore('children');

  chidlrenObjectStore.put({
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment
  });
}

// if an assignee's phone number is present inside the users object store then
// return else  call the users api to get the profile info for the number
function putAssignessInStore(db, assigneeArray) {

  assigneeArray.forEach(function (assignee) {
    var usersObjectStore = db.transaction('users', 'readwrite').objectStore('users');
    usersObjectStore.openCursor(assignee).onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) return;
      usersObjectStore.add({
        mobile: assignee,
        isUpdated: 0,
        displayName: ''
      });
    };
  });
}

function removeUserFromAssigneeInActivity(db, userActivityId) {
  if (!userActivityId.length) return;
  var activityTx = db.transaction(['activity'], 'readwrite');
  var activityObjectStore = activityTx.objectStore('activity');
  userActivityId.forEach(function (data) {
    activityObjectStore.get(data.id).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) return;
      var indexOfUser = record.assignees.indexOf(data.user);
      if (indexOfUser > -1) {
        record.assignees.splice(indexOfUser, 1);
        activityObjectStore.put(record);
      }
    };
  });

  activityTx.oncomplete = function () {
    console.log('user removed from assignee in activity where he once was if that activity existed');
  };
}

function removeActivityFromDB(db, myActivities) {
  if (!myActivities.length) return;
  var transaction = db.transaction(['activity', 'list', 'children'], 'readwrite');
  var activityObjectStore = transaction.objectStore('activity');
  var listStore = transaction.objectStore('list');
  var chidlrenObjectStore = transaction.objectStore('children');
  myActivities.forEach(function (id) {
    var deleteReqActivity = activityObjectStore.delete(id);
    var deleteReqList = listStore.delete(id);
    var deleteReqChildren = chidlrenObjectStore.delete(id);
    deleteReqActivity.onerror = function () {
      instant(createLog(deleteReqActivity.error));
    };
    deleteReqList.onerror = function () {
      instant(createLog(deleteReqList.error));
    };
    deleteReqChildren.onerror = function () {
      instant(createLog(deleteReqChildren.error));
    };
  });

  transaction.oncomplete = function () {
    mapAndCalendarRemovalRequest(activitiesToRemove);
  };
}

function mapAndCalendarRemovalRequest(activitiesToRemove) {

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var tx = db.transaction(['calendar', 'map'], 'readwrite');
    var calendarObjectStore = tx.objectStore('calendar').index('activityId');
    var mapObjectStore = tx.objectStore('map').index('activityId');

    deleteByIndex(calendarObjectStore, activitiesToRemove);
    deleteByIndex(mapObjectStore, activitiesToRemove);
    tx.oncomplete = function () {
      console.log("activity is removed from all stores");
    };
    tx.onerror = function () {
      console.log(transaction.error);
    };
  };
}

function deleteByIndex(store, activitiesToRemove) {
  store.openCursor().onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;

    if (activitiesToRemove.indexOf(cursor.key) > -1) {
      cursor.delete();
    }
    cursor.continue();
  };
  store.onerror = function () {
    instant(createLog(store.error));
  };
}

function createUsersApiUrl(db) {
  return new Promise(function (resolve) {
    var tx = db.transaction(['users'], 'readwrite');
    var usersObjectStore = tx.objectStore('users');
    var isUpdatedIndex = usersObjectStore.index('isUpdated');
    var NON_UPDATED_USERS = 0;
    var assigneeString = '';

    var defaultReadUserString = apiUrl + 'services/users?q=';
    var fullReadUserString = '';

    isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function (event) {
      var cursor = event.target.result;

      if (!cursor) return;
      var assigneeFormat = '%2B' + cursor.value.mobile + '&q=';
      assigneeString += '' + assigneeFormat.replace('+', '');
      cursor.continue();
    };
    tx.oncomplete = function () {
      fullReadUserString = '' + defaultReadUserString + assigneeString;
      if (assigneeString) {

        resolve({
          db: db,
          url: fullReadUserString
        });
      }
    };
  });
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore(successUrl) {

  http('GET', successUrl.url).then(function (userProfile) {
    console.log(userProfile);
    if (!Object.keys(userProfile).length) return;
    var tx = successUrl.db.transaction(['users'], 'readwrite');
    var usersObjectStore = tx.objectStore('users');
    var isUpdatedIndex = usersObjectStore.index('isUpdated');
    var USER_NOT_UPDATED = 0;
    var USER_UPDATED = 1;

    isUpdatedIndex.openCursor(USER_NOT_UPDATED).onsuccess = function (event) {
      var cursor = event.target.result;

      if (!cursor) return;

      if (!userProfile.hasOwnProperty(cursor.primaryKey)) return;

      if (userProfile[cursor.primaryKey].displayName && userProfile[cursor.primaryKey].photoURL) {
        var record = cursor.value;
        record.photoURL = userProfile[cursor.primaryKey].photoURL;
        record.displayName = userProfile[cursor.primaryKey].displayName;
        record.isUpdated = USER_UPDATED;
        console.log(record);
        usersObjectStore.put(record);
      }
      cursor.continue();
    };
    tx.oncomplete = function () {
      console.log("all users updated");
    };
  }).catch(function (error) {
    instant(createLog(error));
  });
}

function findSubscriptionCount(db) {
  return new Promise(function (resolve, reject) {

    var tx = db.transaction(['subscriptions'], 'readwrite');
    var subscriptionObjectStore = tx.objectStore('subscriptions');
    var request = subscriptionObjectStore.count();
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

function updateSubscription(db, subscription) {

  findSubscriptionCount(db).then(function (count) {
    var req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['subscriptions'], 'readwrite');
      var subscriptionObjectStore = tx.objectStore('subscriptions');
      var templateIndex = subscriptionObjectStore.index('template');
      if (!count) {
        subscriptionObjectStore.put(subscription);
        return;
      }
      templateIndex.openCursor(subscription.template).onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {

          if (subscription.office === cursor.value.office) {

            cursor.delete();
          }
          cursor.continue();
        }
      };

      tx.oncomplete = function () {
        var req = indexedDB.open(firebase.auth().currentUser.uid);
        req.onsuccess = function () {
          var db = req.result;
          var store = db.transaction('subscriptions', 'readwrite').objectStore('subscriptions');
          store.put(subscription);
        };
      };
    };
  }).catch(console.log);
}

function createListStore(db, activity) {

  var transaction = db.transaction(['list', 'root'], 'readwrite');
  var store = transaction.objectStore('list');
  var requiredData = {
    'activityId': activity.activityId,
    'secondLine': '',
    'count': '',
    'timestamp': activity.timestamp,
    'creator': {
      number: activity.creator,
      photo: ''
    },
    'activityName': activity.activityName,
    'status': activity.status
  };

  store.put(requiredData);

  transaction.oncomplete = function () {
    console.log("done");
  };
}

function updateListStoreWithCount(counter) {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      var db = req.result;
      var transaction = db.transaction(['list', 'users'], 'readwrite');
      var listStore = transaction.objectStore('list');
      var userStore = transaction.objectStore('users');
      console.log(counter);
      Object.keys(counter).forEach(function (id) {
        listStore.get(id).onsuccess = function (event) {
          var record = event.target.result;
          if (!record) {
            console.log(" no record found");
          } else {
            record.count = counter[id];
            listStore.put(record);
          }
        };
      });

      listStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        var creator = cursor.value.creator;

        if (creator.number === firebase.auth().currentUser.phoneNumber) {
          creator.photo = firebase.auth().currentUser.photoURL;
          listStore.put(cursor.value);
        } else {
          userStore.get(creator.number).onsuccess = function (userEvent) {
            var record = userEvent.target.result;
            if (record) {
              creator.photo = record.photoURL;
              listStore.put(cursor.value);
            }
          };
        }
        cursor.continue();
      };

      transaction.oncomplete = function () {
        resolve(true);
      };

      transaction.onerror = function () {
        reject(transaction.error);
      };
    };
  });
}

function successResponse(read, swipeInfo) {
  console.log(swipeInfo);
  var user = firebase.auth().currentUser;

  var request = indexedDB.open(user.uid);
  var removeActivitiesForUser = [];
  var removeActivitiesForOthers = [];
  request.onsuccess = function () {
    var db = request.result;
    var addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum');
    var rootObjectStoreTx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootObjectStoreTx.objectStore('root');
    var activitytx = db.transaction(['activity'], 'readwrite');
    var activityObjectStore = activitytx.objectStore('activity');

    var counter = {};

    //testing
    read.addendum.forEach(function (addendum) {
      if (addendum.unassign) {

        if (addendum.user == firebase.auth().currentUser.phoneNumber) {
          removeActivitiesForUser.push(addendum.activityId);
        } else {
          removeActivitiesForOthers.push({
            id: addendum.activityId,
            user: addendum.user
          });
        }
      }
      var key = addendum.activityId;
      counter[key] = (counter[key] || 0) + 1;
      addendumObjectStore.add(addendum);
    });

    removeActivityFromDB(db, removeActivitiesForUser);
    removeUserFromAssigneeInActivity(db, removeActivitiesForOthers);

    read.activities.forEach(function (activity) {
      // put activity in activity object store

      if (activity.canEdit) {
        activity.editable = 1;
        activityObjectStore.put(activity);
      } else {
        activity.editable = 0;
        activityObjectStore.put(activity);
      }
      if (activity.hidden === 0) {
        createListStore(db, activity);
      }

      updateMap(activity);

      updateCalendar(activity);
      // put each assignee (number) in the users object store

      putAssignessInStore(db, activity.assignees);
      // put attachemnt in the attachment object store
      putAttachment(db, activity);
    });

    read.templates.forEach(function (subscription) {
      updateSubscription(db, subscription);
    });

    rootObjectStore.get(user.uid).onsuccess = function (event) {
      createUsersApiUrl(db).then(updateUserObjectStore);
      getUniqueOfficeCount().then(setUniqueOffice).catch(console.log);

      var record = event.target.result;
      record.fromTime = read.upto;
      rootObjectStore.put(record);

      updateListStoreWithCount(counter).then(function () {
        requestHandlerResponse('updateIDB', 200, swipeInfo);
      });
    };
  };
}

function getUniqueOfficeCount() {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);

  var offices = [];
  return new Promise(function (resolve, reject) {
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['activity']);
      var activityStore = tx.objectStore('activity').index('office');
      activityStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        offices.push(cursor.value.office);
        cursor.continue();
      };
      tx.oncomplete = function () {
        resolve(offices);
      };
      req.onerror = function (event) {
        reject(event.error);
      };
    };
  });
}

function setUniqueOffice(offices) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);

  req.onsuccess = function () {
    var db = req.result;
    var tx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = tx.objectStore('root');
    rootObjectStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;
      record.offices = offices;
      rootObjectStore.put(record);
    };

    tx.oncomplete = function () {
      console.log("all offices are set");
    };
  };
}

function updateIDB(param) {

  var req = indexedDB.open(param.dbName);
  console.log(param.dbName);
  console.log(param.swipe);

  req.onsuccess = function () {
    var db = req.result;
    var rootObjectStore = db.transaction('root', 'readonly').objectStore('root');

    console.log(rootObjectStore);
    rootObjectStore.get(param.dbName).onsuccess = function (root) {
      console.log(root);
      http('GET', apiUrl + 'read?from=' + root.target.result.fromTime).then(function (response) {
        if (!response) return;
        successResponse(response, param.swipe);
      }).catch(function (error) {

        instant(createLog(error));
      });
    };
  };
}