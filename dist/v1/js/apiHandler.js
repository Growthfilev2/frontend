importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js');

var deviceInfo = void 0;
var currentDevice = void 0;
var meta = void 0;

function getTime() {
  return Date.now();
}

var requestFunctionCaller = {
  dm: comment,
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  backblaze: backblaze,
  updateAuth: updateAuth
};

function sendSuccessRequestToMainThread(response, success) {
  self.postMessage({
    response: response,
    success: true
  });
}

function sendErrorRequestToMainThread(error) {
  console.log(error);
  var errorObject = {
    response: {
      message: error.message,
      apiRejection: false
    },
    success: false
  };
  if (error.stack) {
    errorObject.response.stack = error.stack;
  };

  if (error.code) {
    errorObject.response.apiRejection = true;
  } else {
    instant(JSON.stringify(errorObject.response), meta);
  }

  self.postMessage(errorObject);
}

self.onmessage = function (event) {
  meta = event.data.meta;

  var req = indexedDB.open(event.data.meta.user.uid);
  req.onsuccess = function () {
    var db = req.result;

    if (event.data.type === 'now') {
      var rootRecord = '';
      fetchServerTime(event.data.body, event.data.meta, db).then(function (response) {
        var rootTx = db.transaction(['root'], 'readwrite');
        var rootObjectStore = rootTx.objectStore('root');
        rootObjectStore.get(event.data.meta.user.uid).onsuccess = function (event) {
          rootRecord = event.target.result;
          rootRecord.serverTime = response.timestamp - Date.now();
          rootObjectStore.put(rootRecord);
        };
        rootTx.oncomplete = function () {
          if (response.removeFromOffice) {
            if (Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
              removeFromOffice(response.removeFromOffice, event.data.meta, db).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread);
            };
            return;
          };
          self.postMessage({
            response: response,
            success: true
          });
        };
      }).catch(sendErrorRequestToMainThread);

      return;
    }

    if (event.data.type === 'instant') {
      instant(event.data.body, event.data.meta);
      return;
    }

    if (event.data.type === 'Null') {
      updateIDB({
        meta: event.data.meta,
        db: db
      }).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread);
      return;
    }

    requestFunctionCaller[event.data.type](event.data.body, event.data.meta).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread);
  };
  req.onerror = function () {};
};

// Performs XMLHTTPRequest for the API's.

function http(request) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + request.token);

    xhr.onreadystatechange = function () {

      if (xhr.readyState === 4) {

        if (!xhr.status || xhr.status > 226) {
          var errorObject = JSON.parse(xhr.response);
          var apiFailBody = {
            res: JSON.parse(xhr.response),
            url: request.url,
            data: request.data,
            device: currentDevice,
            message: errorObject.message,
            code: errorObject.code
          };
          return reject(apiFailBody);
        }
        xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success');
      }
    };

    xhr.send(request.body || null);
  });
}

function fetchServerTime(body, meta, db) {
  return new Promise(function (resolve, reject) {
    currentDevice = body.device;
    var parsedDeviceInfo = JSON.parse(currentDevice);
    var url = meta.apiUrl + 'now?deviceId=' + parsedDeviceInfo.id + '&appVersion=' + parsedDeviceInfo.appVersion + '&os=' + parsedDeviceInfo.baseOs + '&deviceBrand=' + parsedDeviceInfo.deviceBrand + '&deviceModel=' + parsedDeviceInfo.deviceModel + '&registrationToken=' + body.registerToken;
    var tx = db.transaction(['root'], 'readwrite');
    var rootStore = tx.objectStore('root');

    rootStore.get(meta.user.uid).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) return;
      if (record.officesRemoved) {
        record.officesRemoved.forEach(function (office) {
          url = url + ('&removeFromOffice=' + office.replace(' ', '%20'));
        });
        delete record.officesRemoved;
      }
      if (record.venuesSet) {
        url = url + "&venues=true";
        delete record.venuesSet;
      }
      rootStore.put(record);
    };
    tx.oncomplete = function () {

      var httpReq = {
        method: 'GET',
        url: url,
        body: null,
        token: meta.user.token
      };

      http(httpReq).then(resolve).catch(reject);
    };
  });
}

function instant(error, meta) {

  var req = {
    method: 'POST',
    url: meta.apiUrl + 'services/logs',
    body: error,
    token: meta.user.token
  };
  http(req).then(function (response) {
    console.log(response);
  }).catch(console.log);
}

/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */

function putServerTime(data) {
  console.log(data);
  return new Promise(function (resolve, reject) {
    var rootTx = data.db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootTx.objectStore('root');
    rootObjectStore.get(data.meta.user.uid).onsuccess = function (event) {
      var record = event.target.result;
      record.serverTime = data.ts - Date.now();
      rootObjectStore.put(record);
    };
    rootTx.oncomplete = function () {
      resolve({
        meta: data.meta,
        db: data.db
      });
    };
  });
}

function comment(body, meta) {
  console.log(body);
  var req = {
    method: 'POST',
    url: meta.apiUrl + 'dm',
    body: JSON.stringify(body),
    token: meta.user.token
  };
  return http(req);
}

function statusChange(body, meta) {

  var req = {
    method: 'PATCH',
    url: meta.apiUrl + 'activities/change-status',
    body: JSON.stringify(body),
    token: meta.user.token
  };
  return http(req);
}

function share(body, meta) {

  var req = {
    method: 'PATCH',
    url: meta.apiUrl + 'activities/share',
    body: JSON.stringify(body),
    token: meta.user.token
  };
  return http(req);
}

function update(body, meta) {
  var req = {
    method: 'PATCH',
    url: meta.apiUrl + 'activities/update',
    body: JSON.stringify(body),
    token: meta.user.token
  };
  return http(req);
}

function create(requestBody, meta) {

  var req = {
    method: 'POST',
    url: meta.apiUrl + 'activities/create',
    body: JSON.stringify(requestBody),
    token: meta.user.token
  };
  return http(req);
}

function removeFromOffice(offices, meta, db) {
  return new Promise(function (resolve, reject) {

    var deleteTx = db.transaction(['map', 'calendar', 'children', 'list', 'subscriptions', 'activity'], 'readwrite');
    deleteTx.oncomplete = function () {

      var rootTx = db.transaction(['root'], 'readwrite');
      var rootStore = rootTx.objectStore('root');
      rootStore.get(meta.user.uid).onsuccess = function (event) {
        var record = event.target.result;
        if (!record) return;
        record.officesRemoved = offices;
        rootStore.put(record);
      };
      rootTx.oncomplete = function () {
        console.log("run read after removal");
        resolve({
          response: 'Office Removed',
          success: true
        });
      };
      rootTx.onerror = function (error) {

        reject({
          response: error,
          success: false
        });
      };
    };

    deleteTx.onerror = function () {
      console.log(tx.error);
    };

    removeActivity(offices, deleteTx);
  });
}

function removeActivity(offices, tx) {
  var activityIndex = tx.objectStore('activity').index('office');
  var listIndex = tx.objectStore('list').index('office');
  var childrenIndex = tx.objectStore('children').index('office');
  var mapindex = tx.objectStore('map').index('office');
  var calendarIndex = tx.objectStore('calendar').index('office');
  var subscriptionIndex = tx.objectStore('subscriptions').index('office');

  offices.forEach(function (office) {
    removeByIndex(activityIndex, office);
    removeByIndex(listIndex, office);
    removeByIndex(childrenIndex, office);
    removeByIndex(mapindex, office);
    removeByIndex(calendarIndex, office);
    removeByIndex(subscriptionIndex, office);
  });
}

function removeByIndex(index, range) {
  index.openCursor(range).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;
    var deleteReq = cursor.delete();
    deleteReq.onsuccess = function () {
      cursor.continue();
    };
  };
}

function updateAuth(body, meta) {
  var req = {
    method: 'POST',
    url: 'http://growthfile.com/json?action=update-auth',
    body: JSON.stringify(body),
    token: meta.user.token
  };

  return http(req);
}

function backblaze(body, meta) {

  var req = {
    method: 'POST',
    url: meta.apiUrl + 'services/images',
    body: JSON.stringify(body),
    token: meta.user.token
  };

  return http(req);
}

function instantUpdateDB(data, type, user) {
  return new Promise(function (resolve, reject) {

    var idbRequest = indexedDB.open(user.uid);

    idbRequest.onsuccess = function () {
      var db = idbRequest.result;
      var objStoreTx = db.transaction(['activity'], 'readwrite');
      var objStore = objStoreTx.objectStore('activity');
      objStore.get(data.activityId).onsuccess = function (event) {
        var record = event.target.result;
        record.editable = 0;

        if (type === 'share') {
          data.share.forEach(function (number) {
            record.assignees.push(number);
          });
          objStore.put(record);
        }
        if (type === 'update') {
          record.schedule = data.schedule;
          record.attachment = data.attachment;
          for (var i = 0; i < record.venue.length; i++) {
            record.venue[i].geopoint = {
              '_latitude': data.venue[i].geopoint['latitude'],
              '_longitude': data.venue[i].geopoint['longitude']
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
        resolve(true);
      };
      objStoreTx.onerror = function () {
        reject(true);
      };
    };
  });
}

function updateMap(venue, tx) {

  var mapObjectStore = tx.objectStore('map');
  var mapActivityIdIndex = mapObjectStore.index('activityId');
  if (!venue.activityId) return;
  mapActivityIdIndex.openCursor(venue.activityId).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      mapObjectStore.add(venue);
      return;
    }

    var deleteRecordReq = cursor.delete();
    deleteRecordReq.onsuccess = function () {
      // console.log("deleted " + cursor.value.activityId)
      cursor.continue();
    };
    deleteRecordReq.onerror = function () {
      instant({
        message: deleteRecordReq.error.message,
        meta: meta
      });
    };
  };
}

function updateCalendar(activity, tx) {

  var calendarObjectStore = tx.objectStore('calendar');
  var calendarActivityIndex = calendarObjectStore.index('activityId');

  calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      activity.schedule.forEach(function (schedule) {
        var startTime = schedule.startTime;
        var endTime = schedule.endTime;
        var record = {
          activityId: activity.activityId,
          scheduleName: schedule.name,
          timestamp: activity.timestamp,
          template: activity.template,
          hidden: activity.hidden,
          start: schedule.startTime,
          end: schedule.endTime,
          status: activity.status,
          office: activity.office
        };
        calendarObjectStore.add(record);
      });
      return;
    }

    var recordDeleteReq = cursor.delete();
    recordDeleteReq.onsuccess = function () {
      console.log("remove calendar");

      cursor.continue();
    };
    recordDeleteReq.onerror = function () {
      instant({
        message: recordDeleteReq.error.message,
        meta: meta
      });
    };
  };
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment(activity, tx, param) {

  var store = tx.objectStore('children');
  var commonSet = {
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment
  };

  var myNumber = param.user.phoneNumber;

  if (activity.template === 'employee') {
    commonSet.employee = activity.attachment['Employee Contact'].value;
    if (activity.attachment['First Supervisor'].value === myNumber || activity.attachment['Second Supervisor'].value === myNumber) {
      commonSet.team = 1;
    }
  }

  store.put(commonSet);
}

function removeUserFromAssigneeInActivity(addendum, updateTx) {
  var addendumStore = updateTx.objectStore('addendum').index('user');
  removeByIndex(addendumStore, addendum.user);
  var activityObjectStore = updateTx.objectStore('activity');
  activityObjectStore.get(addendum.activityId).onsuccess = function (event) {
    var record = event.target.result;
    if (!record) return;

    var indexOfUser = record.assignees.findIndex(function (assignee) {
      return assignee.phoneNumber === addendum.user;
    });

    if (indexOfUser > -1) {
      record.assignees.splice(indexOfUser, 1);

      activityObjectStore.put(record);
    }
  };
}

function removeActivityFromDB(id, updateTx) {
  if (!id) return;

  var activityObjectStore = updateTx.objectStore('activity');
  var listStore = updateTx.objectStore('list');
  var chidlrenObjectStore = updateTx.objectStore('children');
  var calendarObjectStore = updateTx.objectStore('calendar').index('activityId');
  var mapObjectStore = updateTx.objectStore('map').index('activityId');
  var addendumStore = updateTx.objectStore('addendum').index('activityId');

  activityObjectStore.delete(id);
  listStore.delete(id);
  chidlrenObjectStore.delete(id);
  removeByIndex(calendarObjectStore, id);
  removeByIndex(mapObjectStore, id);
  removeByIndex(addendumStore, id);
}

function updateSubscription(subscription, tx) {
  var store = tx.objectStore('subscriptions');
  var index = store.index('officeTemplate');
  index.openCursor([subscription.office, subscription.template]).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      store.put(subscription);
      return;
    }
    var deleteReq = cursor.delete();
    deleteReq.onsuccess = function () {
      console.log('deleted');
      cursor.continue();
    };
  };
}

function createListStore(activity, tx) {

  var requiredData = {
    'activityId': activity.activityId,

    'timestamp': activity.timestamp,
    'activityName': activity.activityName,
    'status': activity.status
  };
  var listStore = tx.objectStore('list');
  listStore.get(activity.activityId).onsuccess = function (listEvent) {

    var record = listEvent.target.result;
    if (!record) {
      requiredData.createdTime = activity.timestamp;
    } else {
      requiredData.createdTime = record.createdTime;
    }
    listStore.put(requiredData);
  };
}

function successResponse(read, param, db, resolve, reject) {

  var updateTx = db.transaction(['map', 'calendar', 'children', 'list', 'subscriptions', 'activity', 'addendum', 'root', 'users'], 'readwrite');
  var addendumObjectStore = updateTx.objectStore('addendum');
  var activityObjectStore = updateTx.objectStore('activity');
  var userStore = updateTx.objectStore('users');
  var counter = {};
  var userTimestamp = {};

  read.addendum.forEach(function (addendum) {
    if (addendum.unassign) {
      if (addendum.user == param.user.phoneNumber) {
        removeActivityFromDB(addendum.activityId, updateTx);
      } else {
        removeUserFromAssigneeInActivity(addendum, updateTx);
      }
    };

    if (addendum.isComment) {
      if (addendum.assignee === param.user.phoneNumber) {
        addendum.key = param.user.phoneNumber + addendum.user;
        userTimestamp[addendum.user] = addendum;
        counter[addendum.user] ? counter[addendum.user] + 1 : counter[addendum.user] = 1;
      } else {
        addendum.key = param.user.phoneNumber + addendum.assignee;
        userTimestamp[addendum.assignee] = addendum;
      }
      addendumObjectStore.add(addendum);
    } else {
      userTimestamp[addendum.user] = addendum;
      if (addendum.user !== param.user.phoneNumber) {
        counter[addendum.user] ? counter[addendum.user] + 1 : counter[addendum.user] = 1;
      }
    }
  });

  read.locations.forEach(function (location) {
    updateMap(location, updateTx);
  });

  read.activities.slice().reverse().forEach(function (activity) {
    activity.canEdit ? activity.editable == 1 : activity.editable == 0;

    activityObjectStore.put(activity);

    updateCalendar(activity, updateTx);
    putAttachment(activity, updateTx, param);

    console.log(activity.assignees);
    activity.assignees.forEach(function (user) {
      userStore.get(user.phoneNumber).onsuccess = function (event) {
        var selfRecord = event.target.result;
        if (!selfRecord) {
          selfRecord = {};
        };
        selfRecord.mobile = user.phoneNumber;
        selfRecord.displayName = user.displayName;
        selfRecord.photoURL = user.photoURL;
        selfRecord.NAME_SEARCH = user.displayName.toLowerCase();
        if (!selfRecord.timestamp) {
          selfRecord.timestamp = '';
        }
        userStore.put(selfRecord);
      };
    });
  });

  Object.keys(userTimestamp).forEach(function (number) {
    var currentAddendum = userTimestamp[number];
    var activityId = currentAddendum.activityId;
    console.log(counter);

    if (activityId) {
      // if is system generated
      activityObjectStore.get(activityId).onsuccess = function (activityEvent) {
        var record = activityEvent.target.result;
        if (!record) return;
        record.assignees.forEach(function (user) {
          currentAddendum.key = param.user.phoneNumber + user.phoneNumber;
          addendumObjectStore.put(currentAddendum);
          if (number === param.user.phoneNumber) {
            userStore.get(user.phoneNumber).onsuccess = function (event) {
              var selfRecord = event.target.result;
              if (!selfRecord) return;
              selfRecord.comment = currentAddendum.comment;
              selfRecord.timestamp = currentAddendum.timestamp;
              if (selfRecord.count) {
                selfRecord.count += counter[number];
              } else {
                selfRecord.count = counter[number];
              }
              userStore.put(selfRecord);
            };
            return;
          }
          if (number === user.phoneNumber) {
            userStore.get(number).onsuccess = function (event) {
              var userRecord = event.target.result;
              if (!userRecord) return;
              userRecord.comment = currentAddendum.comment;
              userRecord.timestamp = currentAddendum.timestamp;
              if (userRecord.count) {
                userRecord.count += counter[number];
              } else {
                userRecord.count = counter[number];
              }
              userStore.put(userRecord);
            };
            return;
          }
        });
      };
      return;
    }

    userStore.get(number).onsuccess = function (event) {
      var userRecord = event.target.result;
      if (userRecord) {
        userRecord.comment = currentAddendum.comment;
        userRecord.timestamp = currentAddendum.timestamp;
        if (!counter[number]) return userStore.put(userRecord);

        if (userRecord.count) {
          userRecord.count += counter[number];
        } else {
          userRecord.count = counter[number];
        }
        userStore.put(userRecord);
      }
    };
  });

  read.templates.forEach(function (subscription) {
    updateSubscription(subscription, updateTx);
  });
  updateRoot(read, updateTx, param.user.uid);
  updateTx.oncomplete = function () {
    console.log("all completed");
    return resolve(read);
  };
  updateTx.onerror = function () {
    return reject(updateTx.error);
  };
}

function updateRoot(read, tx, uid) {
  var store = tx.objectStore('root');
  store.get(uid).onsuccess = function (event) {
    var record = event.target.result;
    record.fromTime = read.upto;
    console.log('start adding upto');
    store.put(record);
  };
}

function updateIDB(config) {
  return new Promise(function (resolve, reject) {

    var tx = config.db.transaction(['root']);
    var rootObjectStore = tx.objectStore('root');
    var record = void 0;
    var time = void 0;

    rootObjectStore.get(config.meta.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime;
    };

    tx.oncomplete = function () {
      var req = {
        method: 'GET',
        url: config.meta.apiUrl + 'read?from=' + time,
        data: null,
        token: config.meta.user.token
      };

      http(req).then(function (response) {
        return successResponse(response, config.meta, config.db, resolve, reject);
      }).catch(function (error) {
        return reject(error);
      });
    };
  });
}
