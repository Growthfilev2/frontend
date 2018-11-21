var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// import firebase app script because there is no native support of firebase inside web workers


importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js');
// Backend API Url
var apiUrl = 'https://us-central1-growthfile-207204.cloudfunctions.net/api/';

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

function createLog(message, body) {
  var logs = {
    message: message,
    body: body
  };
  return JSON.stringify(logs);
}

firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
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
    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(console.log);
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
        if (xhr.readyState === 4) {
          if (xhr.status > 226) {
            var errorObject = JSON.parse(xhr.response);

            requestHandlerResponse('error', errorObject.code, errorObject.message);

            return reject(JSON.parse(xhr.response));
            // return reject(xhr)
          }

          if (!xhr.responseText) return resolve('success');
          resolve(JSON.parse(xhr.responseText));
        }
      };

      xhr.send(data || null);
    }).catch(function (error) {
      console.log(error.message);
      instant(createLog(error.message));
    });
  });
}

function fetchServerTime(deviceInfo) {

  var parsedDeviceInfo = JSON.parse(deviceInfo);

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

        var alertData = JSON.stringify({ title: title, message: message, cancelable: false, button: button });
        requestHandlerResponse('update-app', 200, alertData, '');
        return;
      }

      if (response.revokeSession) {
        requestHandlerResponse('revoke-session', 200);
        return;
      }

      resolve(response.timestamp);
    }).catch(function (error) {
      instant(createLog(error.message, deviceInfo));
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

function initializeIDB(serverTime) {
  console.log("init db");
  // onAuthStateChanged is added because app is reinitialized
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser;

    var request = indexedDB.open(auth.uid);

    request.onerror = function (event) {
      reject(event.error);
    };

    request.onupgradeneeded = function () {
      var db = request.result;
      var activity = db.createObjectStore('activity', {
        keyPath: 'activityId'
      });

      activity.createIndex('timestamp', 'timestamp');
      activity.createIndex('office', 'office');

      activity.createIndex('hidden', 'hidden');

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
      // addendum.createIndex('timestamp', 'timestamp')

      var activityCount = db.createObjectStore('activityCount', {
        keyPath: 'activityId'
      });
      activityCount.createIndex('count', 'count');

      var subscriptions = db.createObjectStore('subscriptions', {
        autoIncrement: true
      });

      subscriptions.createIndex('office', 'office');
      subscriptions.createIndex('template', 'template');
      subscriptions.createIndex('officeTemplate', ['office', 'template']);

      var calendar = db.createObjectStore('calendar', {
        autoIncrement: true
      });

      // calendar.createIndex('date', 'date')
      calendar.createIndex('activityId', 'activityId');
      // calendar.createIndex('isUpdated', 'isUpdated')
      calendar.createIndex('timestamp', 'timestamp');
      calendar.createIndex('start', 'start');
      calendar.createIndex('end', 'end');
      calendar.createIndex('range', ['start', 'end']);

      var map = db.createObjectStore('map', {
        autoIncrement: true
      });
      map.createIndex('activityId', 'activityId');
      map.createIndex('location', 'location');

      map.createIndex('latitude', 'latitude');
      map.createIndex('longitude', 'longitude');
      map.createIndex('range', ['latitude', 'longitude']);
      map.createIndex('distance', 'distance');

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
        fromTime: 0,
        provider: '',
        latitude: '',
        longitude: '',
        accuracy: '',
        lastLocationTime: ''
      });
      requestHandlerResponse('manageLocation');
    };

    request.onsuccess = function () {

      var rootTx = request.result.transaction('root', 'readwrite');
      var rootObjectStore = rootTx.objectStore('root');
      rootObjectStore.get(auth.uid).onsuccess = function (event) {
        var record = event.target.result;
        record.serverTime = serverTime - Date.now();
        rootObjectStore.put(record);
      };
      rootTx.oncomplete = function () {
        resolve({ dbName: auth.uid, swipe: 'false' });
      };
    };
  });
}

function comment(body) {
  console.log(body);
  return new Promise(function (resolve, reject) {
    http('POST', apiUrl + 'activities/comment', JSON.stringify(body)).then(function () {
      // requestHandlerResponse('notification', 200, 'comment added successfully', firebase.auth().currentUser.uid)
      resolve({ dbName: firebase.auth().currentUser.uid, swipe: 'false' });
    }).catch(function (error) {

      instant(createLog(error.message));
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

        resolve({ dbName: firebase.auth().currentUser.uid, swipe: 'false' });
      }).catch(function (error) {
        instant(createLog(error.message));
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
      resolve({ dbName: firebase.auth().currentUser.uid, swipe: 'false' });
    }).catch(function (error) {
      instant(createLog(error.message, body));
    });
  });
}

function Null(swipe) {
  console.log(swipe);
  return new Promise(function (resolve, reject) {
    var user = firebase.auth().currentUser;
    if (!user) {
      reject(null);
      return;
    }
    if (swipe === "true") {
      console.log(JSON.parse(swipe));
      requestHandlerResponse('reset-offset');
    }
    console.log("Null Ran");
    resolve({ dbName: user.uid, swipe: swipe });
  });
}

function update(body) {
  var dbName = firebase.auth().currentUser.uid;
  console.log(body);

  return new Promise(function (resolve, reject) {
    http('PATCH', apiUrl + 'activities/update', JSON.stringify(body)).then(function (success) {
      instantUpdateDB(dbName, body, 'update');
      requestHandlerResponse('notification', 200, 'activity update successfully', dbName);

      resolve({ dbName: firebase.auth().currentUser.uid, swipe: 'false' });
    }).catch(function (error) {

      instant(createLog(error.message, body));
    });
  });
}

function create(body) {
  console.log(body);
  return new Promise(function (resolve, reject) {
    http('POST', apiUrl + 'activities/create', JSON.stringify(body)).then(function (success) {
      requestHandlerResponse('notification', 200, 'activity created successfully', firebase.auth().currentUser.uid);

      requestHandlerResponse('redirect-to-list', 200, 'activity created successfully', firebase.auth().currentUser.uid);
      resolve({ dbName: firebase.auth().currentUser.uid, swipe: 'false' });
    }).catch(function (error) {
      instant(createLog(error.message, body));
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
        requestHandlerResponse('redirect-to-list', 200, 'activity status changed');
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

function updateMap(db, activity) {
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
        venueDescriptor: newVenue.venueDescriptor

      });
    });
  };
  mapTx.onerror = errorDeletingRecord;
}

function errorDeletingRecord(event) {
  console.log(event.target.error);
}

function transactionError(event) {
  console.log(event.target.error);
}

function updateCalendar(db, activity) {
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
    // const calendarActivityIndex = calendarObjectStore.index('activityId')
    // const calendarIsUpdatedIndex = calendarObjectStore.index('isUpdated')

    activity.schedule.forEach(function (schedule) {
      var startTime = moment(schedule.startTime).toDate();
      var endTime = moment(schedule.endTime).toDate();

      // isUpdated: 0,
      // date: {
      //   start: startTime,
      //   end: endTime
      // },
      calendarObjectStore.add({
        activityId: activity.activityId,
        scheduleName: schedule.name,
        timestamp: activity.timestamp,
        template: activity.template,
        hidden: activity.hidden,
        start: moment(startTime).format('YYYY-MM-DD'),
        end: moment(endTime).format('YYYY-MM-DD')
      });
    });

    //calendarActivityIndex.openCursor(activity.activityId).onsuccess = function(event) {
    //   const cursor = event.target.result
    //
    //   if (!cursor) return
    //
    //   let record = cursor.value
    //
    //   for (let currentDate = record.date.start; currentDate <= record.date.end; currentDate.setDate(currentDate.getDate() + 1)) {
    //     calendarObjectStore.add({
    //       isUpdated: 1,
    //       activityId: record.activityId,
    //       scheduleName: record.scheduleName,
    //       timestamp: record.timestamp,
    //       date: moment(currentDate).format('YYYY-MM-DD'),
    //       template: record.template,
    //       hidden: record.hidden
    //     })
    //   }
    //   cursor.continue()
    // }

    // calendarIsUpdatedIndex.openCursor(0).onsuccess = function(event) {
    //   const cursor = event.target.result
    //
    //   if (cursor) {
    //     let deleteRecordReq = cursor.delete()
    //     deleteRecordReq.onerror = errorDeletingRecord
    //     cursor.continue()
    //   }
    // }
  };

  calendarTx.onerror = transactionError;
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
  if (assigneeArray.indexOf(firebase.auth().currentUser.phoneNumber) == -1) {
    removeActivityFromDB(db);
    return;
  }
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

function removeActivityFromDB(db) {
  var activitiesToRemove = [];
  var activityObjectStore = db.transaction('activity', 'readwrite').objectStore('activity');
  var myNumber = firebase.auth().currentUser.phoneNumber;
  activityObjectStore.openCursor().onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      removeActivityFromKeyPath(activitiesToRemove, 'activityCount');
      return;
    }

    if (cursor.value.assignees.indexOf(myNumber) == -1) {
      activitiesToRemove.push(cursor.value.activityId);
      cursor.delete();
    }
    cursor.continue();
  };
}

function removeActivityFromKeyPath(activitiesToRemove, store) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var objectStore = db.transaction(store, 'readwrite').objectStore(store);
    activitiesToRemove.forEach(function (id) {
      objectStore.delete(id);
    });

    if (store === 'activityCount') {
      removeActivityFromCalendar(activitiesToRemove, db);
    }
  };
}

function removeActivityFromCalendar(activitiesToRemove, db) {
  var calendarObjectStore = db.transaction('calendar', 'readwrite').objectStore('calendar').index('activityId');
  var count = 0;
  activitiesToRemove.forEach(function (id) {
    count++;
    calendarObjectStore.openCursor(id).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        if (count === activitiesToRemove.length) {
          removeActivityFromMap(activitiesToRemove);
          return;
        }
        return;
      }
      cursor.delete();
      cursor.continue();
    };
  });
}

function removeActivityFromMap(activitiesToRemove) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  var count = 0;
  req.onsuccess = function () {
    var db = req.result;
    var mapObjectStore = db.transaction('map', 'readwrite').objectStore('map').index('activityId');
    activitiesToRemove.forEach(function (id) {
      count++;
      mapObjectStore.openCursor(id).onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {
          if (count === activitiesToRemove.length) {
            removeActivityFromKeyPath(activitiesToRemove, 'children');
            removeActivityFromAddendum(activitiesToRemove);
            return;
          }
          return;
        }
        cursor.delete();
        cursor.continue();
      };
    });
  };
}

function removeActivityFromAddendum(activitiesToRemove) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum').index('activityId');
    activitiesToRemove.forEach(function (id) {
      addendumObjectStore.openCursor(id).onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };
    });
  };
}

function createUsersApiUrl(db) {
  var usersObjectStore = db.transaction('users', 'readwrite').objectStore('users');
  var isUpdatedIndex = usersObjectStore.index('isUpdated');
  var NON_UPDATED_USERS = 0;
  var assigneeString = '';

  var defaultReadUserString = apiUrl + 'services/users?q=';
  var fullReadUserString = '';

  return new Promise(function (resolve) {

    isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function (event) {
      var cursor = event.target.result;

      if (!cursor) {
        fullReadUserString = '' + defaultReadUserString + assigneeString;
        if (assigneeString) {

          resolve({
            db: db,
            url: fullReadUserString
          });
        }
        return;
      }
      var assigneeFormat = '%2B' + cursor.value.mobile + '&q=';
      assigneeString += '' + assigneeFormat.replace('+', '');
      cursor.continue();
    };
  });
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore(successUrl) {
  http('GET', successUrl.url).then(function (userProfile) {
    console.log(userProfile);
    if (!Object.keys(userProfile).length) return;
    var usersObjectStore = successUrl.db.transaction('users', 'readwrite').objectStore('users');
    var isUpdatedIndex = usersObjectStore.index('isUpdated');
    var USER_NOT_UPDATED = 0;
    var USER_UPDATED = 1;

    isUpdatedIndex.openCursor(USER_NOT_UPDATED).onsuccess = function (event) {
      var cursor = event.target.result;

      if (!cursor) {
        // requestHandlerResponse('notification', 200, 'user object store modified', successUrl.db.name)
        return;
      }
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
  }).catch(function (error) {
    instant(createLog(error.message));
  });
}

function updateSubscription(db, subscription) {
  var subscriptionObjectStore = db.transaction('subscriptions', 'readwrite').objectStore('subscriptions');

  var templateIndex = subscriptionObjectStore.index('template');

  templateIndex.get(subscription.template).onsuccess = function (templateEvent) {
    if (!templateEvent.target.result) {
      subscriptionObjectStore.add(subscription);
      return;
    }

    templateIndex.openCursor(subscription.template).onsuccess = function (event) {
      var cursor = event.target.result;
      if (subscription.office !== cursor.value.office) {
        subscriptionObjectStore.add(subscription);
        return;
      }
      cursor.delete();
      subscriptionObjectStore.add(subscription);
    };
  };
}

// after getting the responseText from the read api , insert addendum into the
// corresponding object store. for each activity present inside the activities
// array in response perform the put operations. for each template present
// inside the templates array in response perform the updat subscription logic.
// after every operation is done, update the root object sotre's from time value
// with the uptoTime received from response.

var firstTime = 0;

function successResponse(read, swipeInfo) {
  console.log(swipeInfo);
  var user = firebase.auth().currentUser;

  var request = indexedDB.open(user.uid);

  request.onsuccess = function () {
    var db = request.result;
    var addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum');
    var rootObjectStoreTx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootObjectStoreTx.objectStore('root');
    var activitytx = db.transaction(['activity'], 'readwrite');
    var activityObjectStore = activitytx.objectStore('activity');
    var activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount');
    var counter = {};
    firstTime++;
    read.addendum.forEach(function (addendum) {
      var key = addendum.activityId;
      counter[key] = (counter[key] || 0) + 1;
      addendumObjectStore.add(addendum);
    });

    Object.keys(counter).forEach(function (count) {
      activityCount.put({
        activityId: count,
        count: counter[count]
      });
    });
    var activityPar = [];
    read.activities.forEach(function (activity) {
      // put activity in activity object store
      if (activity.canEdit) {
        activity.editable = 1;
        activityObjectStore.put(activity);
      } else {
        activity.editable = 0;
        activityObjectStore.put(activity);
      }

      activityPar.push(activity.activityId);

      updateMap(db, activity);

      updateCalendar(db, activity);

      // put each assignee (number) in the users object store

      putAssignessInStore(db, activity.assignees);

      // put attachemnt in the attachment object store

      putAttachment(db, activity);
    });

    read.templates.forEach(function (subscription) {
      updateSubscription(db, subscription);
    });

    rootObjectStore.get(user.uid).onsuccess = function (event) {
      var record = event.target.result;
      getUniqueOfficeCount(record.fromTime, swipeInfo).then(setUniqueOffice).catch(console.log);

      record.fromTime = read.upto;
      rootObjectStore.put(record);
      createUsersApiUrl(db).then(updateUserObjectStore);

      if (record.fromTime !== 0) {
        // setTimeout(function(){
        requestHandlerResponse('updateIDB', 200, swipeInfo);
        // },)
      }
    };
  };
}

function getUniqueOfficeCount(firstTime, swipeInfo) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  var officeCount = 0;
  var offices = [];
  return new Promise(function (resolve, reject) {
    req.onsuccess = function () {
      var db = req.result;
      var activityStore = db.transaction('activity').objectStore('activity').index('office');
      activityStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {
          resolve({
            dbName: dbName,
            count: officeCount,
            allOffices: offices,
            firstTime: firstTime,
            swipe: swipeInfo
          });
          return;
        }
        offices.push(cursor.value.office);
        officeCount++;
        cursor.continue();
      };
    };
    req.onerror = function (event) {
      console.log("error in 1007 bitch");
      reject(event.error);
    };
  });
}

function setUniqueOffice(data) {
  var req = indexedDB.open(data.dbName);
  var offices = {
    'hasMultipleOffice': '',
    'allOffices': data.allOffices
  };
  req.onsuccess = function () {
    var db = req.result;
    var rootObjectStore = db.transaction('root', 'readwrite').objectStore('root');
    rootObjectStore.get(data.dbName).onsuccess = function (event) {
      var record = event.target.result;
      if (data.count === 1) {
        offices.hasMultipleOffice = 0;
        record.offices = offices;
        rootObjectStore.put(record);
        if (data.firstTime === 0) {
          requestHandlerResponse('updateIDB', 200, data.swipe);
        }
        return;
      }
      offices.hasMultipleOffice = 1;
      record.offices = offices;
      rootObjectStore.put(record);
      if (data.firstTime === 0) {
        requestHandlerResponse('updateIDB', 200, data.swipe);
      }
    };
  };
}

function updateIDB(param) {

  var req = indexedDB.open(param.dbName);

  req.onsuccess = function () {
    var db = req.result;
    var rootObjectStore = db.transaction('root', 'readonly').objectStore('root');
    console.log(rootObjectStore);
    rootObjectStore.get(param.dbName).onsuccess = function (root) {
      console.log(root);
      http('GET', apiUrl + 'read?from=' + root.target.result.fromTime).then(function (response) {
        console.log(response);
        successResponse(response, param.swipe);
      }).catch(function (error) {
        instant(createLog(error.message, root.target.result.fromTime));
      });
    };
  };
}
