function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-auth.js');
importScripts('js/config.js');
var userAuth;
var meta;
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log(user);
    userAuth = user;
  }
});
var files = ['/v3/', 'offline.html', 'error-404.html', 'index.html', 'css/app.css', 'js/core.js', 'js/config.js', 'js/init.js', 'js/checkin.js', 'js/login.js', 'external/js/intl-utils.js', 'external/js/intlTelInput.min.js', 'external/js/moment.min.js', 'external/img/flags.png', 'external/img/flags@2x.png', 'external/css/intlTelInput.css'];
var staticCacheName = 'pages-cache-v520'; // Listen for install event, set callback

self.addEventListener('install', function (event) {
  // Perform some task
  console.log('Service worker installed', event);
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    console.log("there is a change");
    return cache.addAll(files);
  }));
});
self.addEventListener('activate', function (event) {
  console.log('Activating new service worker...');
  var cacheAllowlist = [staticCacheName];
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.map(function (cacheName) {
      if (cacheAllowlist.indexOf(cacheName) === -1) {
        return caches["delete"](cacheName);
      }
    }));
  }));
});
self.addEventListener('fetch', function (event) {
  event.respondWith(caches.match(event.request).then(function (response) {
    if (response) {
      console.log('Found ', event.request.url, ' in cache');
      return response;
    } // console.log('Network request for ', event.request.url);


    return fetch(event.request).then(function (fetchResponse) {
      if (fetchResponse.status === 404) {
        return caches.match('error-404.html');
      }

      if (fetchResponse.headers.has('content-type') && matchContentType(fetchResponse.headers.get('content-type'), event.request.url)) {
        console.log('caching', event.request.url, fetchResponse.headers.has('content-type') ? fetchResponse.headers.get('content-type') : '');
        return caches.open(staticCacheName).then(function (cache) {
          cache.put(event.request.url, fetchResponse.clone());
          return fetchResponse;
        });
      }

      return fetchResponse;
    });
  })["catch"](function (error) {
    console.error(error);
    return caches.match('offline.html');
  }));
});

var matchContentType = function matchContentType(contentType, u) {
  console.log(u, contentType);
  return contentType.match(/^text\/css|application\/javascript|text\/javascript|font\/|image\/*/i);
};

self.addEventListener('message', function (event) {
  console.log(userAuth);

  if (event.data && event.data.type === 'read') {
    // do something
    console.log('SW REC message', event.data);
    userAuth.getIdToken().then(function (token) {
      console.log(token);
      var b = {
        meta: {
          user: {
            token: token,
            uid: userAuth.uid,
            displayName: userAuth.displayName,
            photoURL: userAuth.photoURL,
            phoneNumber: userAuth.phoneNumber
          },
          apiUrl: 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'
        }
      };
      handleRead(b).then(function (res) {
        self.clients.matchAll({
          includeUncontrolled: true,
          type: 'window'
        }).then(function (clients) {
          if (clients && clients.length) {
            // Send a response - the clients
            // array is ordered by last focused
            clients[0].postMessage(res);
          }
        });
      })["catch"](console.error);
    });
  }
});
/**
 * send message back to main thread
 * @param {object} response 
 * @param {string} id 
 */

var sendSuccessRequestToMainThread = function sendSuccessRequestToMainThread(response, id) {
  self.postMessage({
    response: response,
    success: true,
    id: id
  });
};
/**
 * sends error body to main thread to show api rejection messages
 * or to handle in view. if it's not an api rejection but js execution error in this file itself
 * then log the error and pass to main thread.
 * @param {object} error 
 */


var sendErrorRequestToMainThread = function sendErrorRequestToMainThread(error) {
  var errorObject = {
    message: error.message,
    body: error,
    apiRejection: false,
    success: false,
    id: error.id,
    requestType: error.requestType,
    stack: error.stack || ''
  };

  if (error.code) {
    errorObject.apiRejection = true;
  } else {
    instant(JSON.stringify(errorObject), meta);
  }

  self.postMessage(errorObject);
};

var handleRead = function handleRead(data) {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(data.meta.user.uid);

    req.onsuccess = function () {
      var db = req.result;
      updateIDB({
        payload: data,
        db: db
      }).then(resolve)["catch"](reject);
    };
  });
};

function removeActivity(offices, tx) {
  var names = ['activity', 'children', 'map', 'calendar', 'subscriptions'];
  names.forEach(function (name) {
    var index = tx.objectStore(name).index('office');
    offices.forEach(function (office) {
      removeByIndex(index, office);
    });
  });
}

function updateAttendance() {
  var attendanceData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var store = arguments.length > 1 ? arguments[1] : undefined;
  attendanceData.forEach(function (value) {
    if (!value.id) return;
    value.editable = 1;
    store.put(value);
  });
}

function updateReimbursements() {
  var reimbursementData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var store = arguments.length > 1 ? arguments[1] : undefined;
  reimbursementData.forEach(function (value) {
    if (!value.id) return;
    store.put(value);
  });
}

function updatePayments() {
  var paymentData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var store = arguments.length > 1 ? arguments[1] : undefined;
  paymentData.forEach(function (value) {
    if (!value.id) return;
    store.put(value);
  });
}

function updateCalendar(activity, tx) {
  var calendarObjectStore = tx.objectStore('calendar');
  var calendarActivityIndex = calendarObjectStore.index('activityId');

  calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
    var cursor = event.target.result;

    if (!cursor) {
      if (!Array.isArray(activity.schedule)) return;
      activity.schedule.forEach(function (schedule) {
        if (_typeof(schedule) !== 'object') return;
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

    var recordDeleteReq = cursor["delete"]();
    cursor["continue"]();

    recordDeleteReq.onsuccess = function () {
      console.log("remove calendar");
    };

    recordDeleteReq.onerror = function () {
      instant(JSON.stringify({
        message: recordDeleteReq.error.message
      }), meta);
    };
  };
}

function putMap(location, updateTx) {
  if (!location.activityId) return;
  var mapObjectStore = updateTx.objectStore('map');
  mapObjectStore.put(location);
}

function putAttachment(activity, tx, param) {
  if (!activity.activityId) return;
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
    if (activity.attachment.hasOwnProperty('Employee Contact')) {
      commonSet.employee = activity.attachment['Employee Contact'].value;
    }

    if (activity.attachment.hasOwnProperty('Phone Number')) {
      commonSet.employee = activity.attachment['Phone Number'].value;
    }

    if (activity.attachment.hasOwnProperty('First Supervisor') && activity.attachment['First Supervisor'].value === myNumber) {
      commonSet.team = 1;
    }
  }

  store.put(commonSet);
}

function removeUserFromAssigneeInActivity(addendum, updateTx) {
  var addendumIndex = updateTx.objectStore('addendum').index('user');
  removeByIndex(addendumIndex, addendum.user);
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
  var chidlrenObjectStore = updateTx.objectStore('children');
  activityObjectStore["delete"](id);
  chidlrenObjectStore["delete"](id);
  ['calendar', 'map', 'addendum'].forEach(function (name) {
    var index = updateTx.objectStore(name).index('activityId');
    removeByIndex(index, id);
  });
}

function putSubscription(subscription, tx) {
  var store = tx.objectStore('subscriptions');
  store.put(subscription);
}

function successResponse(read, param, db, resolve, reject) {
  var updateTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity', 'addendum', 'root', 'users', 'attendance', 'reimbursement', 'payment'], 'readwrite');
  var addendumObjectStore = updateTx.objectStore('addendum');
  var activityObjectStore = updateTx.objectStore('activity');
  var userStore = updateTx.objectStore('users');
  var attendaceStore = updateTx.objectStore('attendance');
  var reimbursementStore = updateTx.objectStore('reimbursement');
  var paymentStore = updateTx.objectStore('payment');
  var counter = {};
  var userTimestamp = {};
  var addendumIds = {};
  read.addendum.forEach(function (addendum) {
    if (!addendum.hasOwnProperty('user')) return;

    if (addendum.unassign) {
      if (addendum.user == param.user.phoneNumber) {
        removeActivityFromDB(addendum.activityId, updateTx);
      } else {
        removeUserFromAssigneeInActivity(addendum, updateTx);
      }

      ;
    }

    ;
    addendumObjectStore.put(addendum);
  });
  read.locations.forEach(function (location) {
    putMap(location, updateTx);
  });
  console.log(userTimestamp);
  console.log(counter);
  updateAttendance(read.attendances, attendaceStore);
  updateReimbursements(read.reimbursements, reimbursementStore);
  updatePayments(read.payments, paymentStore);
  read.activities.forEach(function (activity) {
    if (!activity.activityId) return;
    activity.canEdit ? activity.editable == 1 : activity.editable == 0;

    if (activity.template === 'duty') {
      handleDutyActivity(activity, updateTx);
    } else {
      activityObjectStore.put(activity);
    }

    updateCalendar(activity, updateTx);
    putAttachment(activity, updateTx, param);

    addendumObjectStore.index('activityId').getAll(activity.activityId).onsuccess = function (e) {
      var addendums = e.target.result || [];
      var lastAddendum = addendums.sort(function (a, b) {
        return b.timestamp - a.timestamp;
      })[0];
      updateUserStore(lastAddendum, activity.assignees, param, userStore);
    };
  });

  function updateUserStore(lastAddendum, assignees, param, userStore) {
    var promise = Promise.resolve();
    assignees.forEach(function (assignee) {
      promise = promise.then(function () {
        return setAddendumForUser(userStore, assignee, lastAddendum, param);
      });
    });
    return promise;
  }

  function setAddendumForUser(userStore, assignee, lastAddendum, param) {
    return new Promise(function (resolve, reject) {
      userStore.get(assignee.phoneNumber).onsuccess = function (e) {
        var user = e.target.result || {};
        user.displayName = assignee.displayName;
        user.mobile = assignee.phoneNumber;
        user.photoURL = assignee.photoURL;
        user.NAME_SEARCH = assignee.displayName.toLowerCase();

        if (lastAddendum) {
          if (user.mobile !== param.user.phoneNumber) {
            console.log('increment count');

            if (user.count) {
              user.count += 1;
            } else {
              user.count = 1;
            }
          }

          user.timestamp = lastAddendum.timestamp;
          user.comment = lastAddendum.comment;
          lastAddendum.key = param.user.phoneNumber + assignee.phoneNumber;
          addendumObjectStore.put(lastAddendum);
        }

        userStore.put(user).onsuccess = function () {
          resolve(true);
        };
      };
    });
  }

  function handleDutyActivity(activity, updateTx) {
    var store = updateTx.objectStore('activity');

    store.get(activity.activityId).onsuccess = function (e) {
      var record = e.target.result;

      if (!record) {
        store.put(activity);
        return;
      }

      activity.timer = record.timer;
      store.put(activity);
    };
  }

  if (read.products) {
    read.products.forEach(function (product) {
      putAttachment(product, updateTx, param);
    });
  }

  read.templates.forEach(function (subscription) {
    if (!subscription.activityId) {
      instant(JSON.stringify({
        message: 'activityId missing from template object',
        body: subscription
      }), param);
      return;
    }

    putSubscription(subscription, updateTx);
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

function updateUserStore(userStore, phoneNumber, currentAddendum, user) {
  userStore.get(phoneNumber).onsuccess = function (event) {
    var userRecord = event.target.result || {
      count: 0,
      displayName: '',
      photoURL: '',
      mobile: phoneNumber,
      comment: '',
      timestamp: '',
      NAME_SEARCH: user.displayName.toLowerCase()
    };
    userRecord.comment = currentAddendum.comment;
    userRecord.timestamp = currentAddendum.timestamp;
    userRecord.mobile = user.phoneNumber;
    userRecord.displayName = user.displayName;

    if (!userRecord.photoURL) {
      userRecord.photoURL = user.photoURL;
    }

    userRecord.NAME_SEARCH = user.displayName.toLowerCase();

    if (currentAddendum.isComment) {
      if (!counter[phoneNumber]) return userStore.put(userRecord);
    }

    if (userRecord.count) {
      userRecord.count += counter[phoneNumber];
    } else {
      userRecord.count = counter[phoneNumber];
    }

    userStore.put(userRecord);
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
    var record;
    var time;

    rootObjectStore.get(config.payload.meta.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime;
    };

    tx.oncomplete = function () {
      var req = {
        method: 'GET',
        url: "".concat(config.payload.meta.apiUrl, "read1?from=").concat(time),
        data: null,
        token: config.payload.meta.user.token
      };
      http(req).then(function (response) {
        console.log('read completed');
        return successResponse(response, config.payload.meta, config.db, resolve, reject);
      })["catch"](function (error) {
        return reject(error);
      });
    };
  });
}

; // Performs XMLHTTPRequest for the API's.

function http(request) {
  return new Promise(function (resolve, reject) {
    return fetch(request.url, {
      method: request.method,
      body: null,
      headers: {
        'Content-type': 'application/json',
        'Authorization': "Bearer ".concat(request.token)
      }
    }).then(function (response) {
      if (!response.status || response.status >= 226 || !response.ok) {
        throw response;
      }

      return response.json();
    }).then(function (res) {
      if (res.hasOwnProperty('success') && !res.success) {
        reject(res);
        return;
      }

      resolve(res);
    })["catch"](function (err) {
      if (typeof err.text === "function") {
        err.text().then(function (errorMessage) {
          reject(JSON.parse(errorMessage));
        });
      }
    });
  });
}

function removeFromOffice(offices, meta, db) {
  return new Promise(function (resolve, reject) {
    var deleteTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity'], 'readwrite');

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

function removeByIndex(index, range) {
  index.openCursor(range).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;
    cursor["delete"]();
    cursor["continue"]();
  };
}