importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js');

let deviceInfo;
let currentDevice;

// get Device time
function getTime() {
  return Date.now()
}

// dictionary object with key as the worker's onmessage event data and value as
// function name

const requestFunctionCaller = {
  comment: comment,
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  backblaze: backblaze,
}

function sendSuccessRequestToMainThread(response, success) {
  self.postMessage({
    response: response,
    success: true
  })
}



function sendErrorRequestToMainThread(error) {
  self.postMessage({
    response: error,
    success: false
  })
}

self.onmessage = function (event) {

  const req = indexedDB.open(event.data.meta.user.uid);
  req.onsuccess = function () {
    const db = req.result

    if (event.data.type === 'now') {
      let rootRecord = ''
      fetchServerTime(event.data.body, event.data.meta, db).then(function (response) {
        const rootTx = db.transaction(['root'], 'readwrite')
        const rootObjectStore = rootTx.objectStore('root')
        rootObjectStore.get(event.data.meta.user.uid).onsuccess = function (event) {
          rootRecord = event.target.result
          rootRecord.serverTime = response.timestamp - Date.now()
          rootObjectStore.put(rootRecord)
        }
        rootTx.oncomplete = function () {
          if (response.venues) {
            const tx = db.transaction('map', 'readwrite')
            response.venues.forEach(function (venue) {
              updateMap(venue, tx)
            })
            tx.oncomplete = function () {
              rootRecord.venues = true
              db.transaction('root','readwrite').objectStore('root').put(rootRecord)
              sendSuccessRequestToMainThread('venues-set')
            }
            tx.onerror = function () {
              sendErrorRequestToMainThread(tx.error)
            }
            return;
          }
          if (response.removeFromOffice) {
            if (Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
              removeFromOffice(response.removeFromOffice, event.data.meta, db).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread)
            };
            return;
          };

          self.postMessage({
            response: response,
            success: true
          })
        }

      })

      return
    }

    if (event.data.type === 'instant') {
      instant(event.data.body, event.data.meta)
      return
    }

    if (event.data.type === 'Null') {
      updateIDB({
        meta: event.data.meta,
        db: db
      }).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread)
      return;
    }

    requestFunctionCaller[event.data.type](event.data.body, event.data.meta).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread)
  }
  req.onerror = function () {

  }

}

// Performs XMLHTTPRequest for the API's.

function http(request) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(request.method, request.url, true)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Authorization', `Bearer ${request.token}`)

    xhr.onreadystatechange = function () {

      if (xhr.readyState === 4) {

        if (!xhr.status) return;

        if (xhr.status > 226) {
          const errorObject = JSON.parse(xhr.response)
          const apiFailBody = {
            res: JSON.parse(xhr.response),
            url: request.url,
            data: request.data,
            device: currentDevice,
            message: errorObject.message,
            code: errorObject.code
          }
          return reject(apiFailBody)
        }
        xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success')
      }
    }

    xhr.send(request.body || null)
  })
}

function fetchServerTime(body, meta, db) {
  return new Promise(function (resolve,reject) {
    currentDevice = body.device;
    const parsedDeviceInfo = JSON.parse(currentDevice);
    let url = `${meta.apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}&deviceBrand=${parsedDeviceInfo.deviceBrand}&deviceModel=${parsedDeviceInfo.deviceModel}&registrationToken=${body.registerToken}`
    const tx = db.transaction(['root'], 'readwrite');
    const rootStore = tx.objectStore('root');

    rootStore.get(meta.user.uid).onsuccess = function (event) {
      const record = event.target.result;
      if (!record) return;
      if (record.officesRemoved) {
        record.officesRemoved.forEach(function (office) {
          url = url + `&removeFromOffice=${office.replace(' ','%20')}`
        });
        delete record.officesRemoved;
      }
      if (record.venuesSet) {
        url = url + "&venues=true"
        delete record.venuesSet;
      }
      rootStore.put(record);
    }
    tx.oncomplete = function () {

      const httpReq = {
        method: 'GET',
        url: url,
        body: null,
        token: meta.user.token
      }

      http(httpReq).then(resolve).catch(reject)

    }
  })
}

function instant(error, meta) {

  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/logs`,
    body: error,
    token: meta.user.token
  }
  http(req).then(function (response) {
    console.log(response)
  }).catch(console.log)
}


/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */




function putServerTime(data) {
  console.log(data)
  return new Promise(function (resolve, reject) {
    const rootTx = data.db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(data.meta.user.uid).onsuccess = function (event) {
      const record = event.target.result
      record.serverTime = data.ts - Date.now()
      rootObjectStore.put(record)
    }
    rootTx.oncomplete = function () {
      resolve({
        meta: data.meta,
        db: data.db
      })
    }
  })
}



function comment(body, meta) {
  console.log(body)
  // return new Promise(function (resolve, reject) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}activities/comment`,
    body: JSON.stringify(body),
    token: meta.user.token
  }
  return http(req)

  // http(req).then(function () {

  //   resolve(true)
  // }).catch(sendApiFailToMainThread)
  // })
}

function statusChange(body, meta) {

  return new Promise(function (resolve, reject) {
    const req = {
      method: 'PATCH',
      url: `${meta.apiUrl}activities/change-status`,
      body: JSON.stringify(body),
      token: meta.user.token
    }
    http(req).then(function (success) {
      resolve(true)

      // instantUpdateDB(body, 'status', meta.user).then(function () {
      // }).catch(console.log)
    }).catch(sendApiFailToMainThread)
  })
}


function share(body, meta) {

  // return new Promise(function (resolve, reject) {
  const req = {
    method: 'PATCH',
    url: `${meta.apiUrl}activities/share`,
    body: JSON.stringify(body),
    token: meta.user.token
  }
  return http(req)

  http(req)
    .then(function (success) {
      resolve(true)
    })
    .catch(sendApiFailToMainThread)
  // })
}




function update(body, meta) {
  // return new Promise(function (resolve, reject) {
  const req = {
    method: 'PATCH',
    url: `${meta.apiUrl}activities/update`,
    body: JSON.stringify(body),
    token: meta.user.token
  }

  return http(req)
  // .then(function (success) {

  //   resolve(true)

  // instantUpdateDB(body, 'update', meta.user).then(function () {
  // })
  // })
  // .catch(sendApiFailToMainThread)
  // })
}

function create(requestBody, meta) {
  // console.log(createReq)
  // const promiseArray = [];
  // createReq.forEach(function (requestBody) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}activities/create`,
    body: JSON.stringify(requestBody),
    token: meta.user.token
  }
  return http(req)
  //   promiseArray.push(http(req))
  // })
  // return new Promise(function (resolve, reject) {
  //   if (!promiseArray.length) return;
  //   Promise.all(promiseArray).then(function () {
  //     resolve(true)
  //   }).catch(sendApiFailToMainThread)
  // })
}

function removeFromOffice(offices, meta, db) {
  return new Promise(function (resolve, reject) {

    const deleteTx = db.transaction(['map', 'calendar', 'children', 'list', 'subscriptions', 'activity'], 'readwrite');
    deleteTx.oncomplete = function () {

      const rootTx = db.transaction(['root'], 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(meta.user.uid).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        record.officesRemoved = offices
        rootStore.put(record)
      }
      rootTx.oncomplete = function () {
        console.log("run read after removal")
        resolve({
          response: 'Office Removed',
          success: true
        })

      }
      rootTx.onerror = function (error) {

        reject({
          response: error,
          success: false
        })
      }

    };

    deleteTx.onerror = function () {
      console.log(tx.error)
    }

    removeActivity(offices, deleteTx)


  })
}




function removeActivity(offices, tx) {
  const activityIndex = tx.objectStore('activity').index('office');
  const listIndex = tx.objectStore('list').index('office')
  const childrenIndex = tx.objectStore('children').index('office')
  const mapindex = tx.objectStore('map').index('office')
  const calendarIndex = tx.objectStore('calendar').index('office')
  const subscriptionIndex = tx.objectStore('subscriptions').index('office');

  offices.forEach(function (office) {
    removeByIndex(activityIndex, office)
    removeByIndex(listIndex, office)
    removeByIndex(childrenIndex, office)
    removeByIndex(mapindex, office)
    removeByIndex(calendarIndex, office)
    removeByIndex(subscriptionIndex, office)
  })

}

function removeByIndex(index, range) {
  index.openCursor(range).onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) return;
    const deleteReq = cursor.delete();
    deleteReq.onsuccess = function () {
      cursor.continue();
    }
  }
}

function backblaze(body, meta) {

  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/images`,
    body: JSON.stringify(body),
    token: meta.user.token
  }

  return http(req)
}

function instantUpdateDB(data, type, user) {
  return new Promise(function (resolve, reject) {

    const idbRequest = indexedDB.open(user.uid);

    idbRequest.onsuccess = function () {
      const db = idbRequest.result
      const objStoreTx = db.transaction(['activity'], 'readwrite')
      const objStore = objStoreTx.objectStore('activity')
      objStore.get(data.activityId).onsuccess = function (event) {
        const record = event.target.result
        record.editable = 0;

        if (type === 'share') {
          data.share.forEach(function (number) {
            record.assignees.push(number);
          })
          objStore.put(record)
        }
        if (type === 'update') {
          record.schedule = data.schedule;
          record.attachment = data.attachment
          for (var i = 0; i < record.venue.length; i++) {
            record.venue[i].geopoint = {
              '_latitude': data.venue[i].geopoint['latitude'],
              '_longitude': data.venue[i].geopoint['longitude']
            }
          }
          objStore.put(record)

        }
        if (type === 'status') {

          record[type] = data[type]
          objStore.put(record)
        }

      }
      objStoreTx.oncomplete = function () {
        resolve(true)
      }
      objStoreTx.onerror = function () {
        reject(true);
      }
    }
  })
}


function updateMap(venue, tx) {

  const mapObjectStore = tx.objectStore('map')
  const mapActivityIdIndex = mapObjectStore.index('activityId')
  mapActivityIdIndex.openCursor(venue.activityId).onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      console.log("start adding");
      console.log("adding " + venue.activityId, "location " + venue.location)
      mapObjectStore.add(venue);
      console.log("finished adding to map")
      return;
    }

    let deleteRecordReq = cursor.delete()
    deleteRecordReq.onsuccess = function () {
      console.log("deleted " + cursor.value.activityId)
      cursor.continue()
    }
    deleteRecordReq.onerror = function () {
      instant({
        message: deleteRecordReq.error.message
      })
    }
  }
}

function updateCalendar(activity, tx) {

  const calendarObjectStore = tx.objectStore('calendar')
  const calendarActivityIndex = calendarObjectStore.index('activityId')

  calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      activity.schedule.forEach(function (schedule) {
        const startTime = schedule.startTime;
        const endTime = schedule.endTime;
        const record = {
          activityId: activity.activityId,
          scheduleName: schedule.name,
          timestamp: activity.timestamp,
          template: activity.template,
          hidden: activity.hidden,
          start: schedule.startTime,
          end: schedule.endTime,
          status: activity.status,
          office: activity.office
        }
        calendarObjectStore.add(record)
      });
      return;
    }

    let recordDeleteReq = cursor.delete()
    recordDeleteReq.onsuccess = function () {
      console.log("remove calendar")

      cursor.continue()
    }
    recordDeleteReq.onerror = function () {
      instant({
        message: recordDeleteReq.error.message
      })
    }
  }
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment(activity, tx, param) {

  const store = tx.objectStore('children');
  const commonSet = {
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment,
  };

  const myNumber = param.user.phoneNumber

  if (activity.template === 'employee') {
    commonSet.employee = activity.attachment['Employee Contact'].value
    if (activity.attachment['First Supervisor'].value === myNumber || activity.attachment['Second Supervisor'].value === myNumber) {
      commonSet.team = 1
    }
  }

  store.put(commonSet)

}

function removeUserFromAssigneeInActivity(db, userActivityId) {
  if (!userActivityId.length) return;
  const activityTx = db.transaction(['activity'], 'readwrite')
  const activityObjectStore = activityTx.objectStore('activity')
  userActivityId.forEach(function (data) {
    activityObjectStore.get(data.id).onsuccess = function (event) {
      const record = event.target.result;
      if (!record) return;
      const indexOfUser = record.assignees.indexOf(data.user)
      if (indexOfUser > -1) {
        record.assignees.splice(indexOfUser, 1)
        activityObjectStore.put(record)
      }
    }
  })

  activityTx.oncomplete = function () {
    console.log('user removed from assignee in activity where he once was if that activity existed')
  }
}

function removeActivityFromDB(db, myActivities, param) {
  if (!myActivities.length) return;
  const transaction = db.transaction(['activity', 'list', 'children'], 'readwrite')
  const activityObjectStore = transaction.objectStore('activity');
  const listStore = transaction.objectStore('list');
  const chidlrenObjectStore = transaction.objectStore('children');
  myActivities.forEach(function (id) {
    activityObjectStore.delete(id);
    listStore.delete(id);
    chidlrenObjectStore.delete(id);
  })

  transaction.oncomplete = function () {
    mapAndCalendarRemovalRequest(activitiesToRemove, param)
  }
}

function mapAndCalendarRemovalRequest(activitiesToRemove, param) {

  const req = indexedDB.open(param.user.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['calendar', 'map'], 'readwrite')
    const calendarObjectStore = tx.objectStore('calendar').index('activityId')
    const mapObjectStore = tx.objectStore('map').index('activityId')

    deleteByIndex(calendarObjectStore, activitiesToRemove)
    deleteByIndex(mapObjectStore, activitiesToRemove)
    tx.oncomplete = function () {
      console.log("activity is removed from all stores")
    }
    tx.onerror = function () {

      instant({
        message: transaction.error.message
      })
    }

  }
}


function deleteByIndex(store, activitiesToRemove) {
  activitiesToRemove.forEach(function (id) {
    store.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      const deleteReq = cursor.delete();
      deleteReq.onsuccess = function () {
        cursor.continue()
      }
    }
  })
}



function updateSubscription(subscription, tx) {
  let count = 0;
  const store = tx.objectStore('subscriptions');
  const index = store.index('officeTemplate');
  index.openCursor([subscription.office, subscription.template]).onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) {
      subscription.count = count;
      store.put(subscription)
      return;
    }
    if (cursor.value.count) {
      count = cursor.value.count;
    }

    const deleteReq = cursor.delete();
    deleteReq.onsuccess = function () {
      console.log('deleted')
      cursor.continue();
    }
  }



}


function createListStore(activity, counter, tx) {

  const requiredData = {
    'activityId': activity.activityId,
    'count': counter[activity.activityId],
    'timestamp': activity.timestamp,
    'activityName': activity.activityName,
    'status': activity.status
  }
  const listStore = tx.objectStore('list');
  listStore.get(activity.activityId).onsuccess = function (listEvent) {

    const record = listEvent.target.result;
    if (!record) {
      requiredData.createdTime = activity.timestamp;
    } else {
      requiredData.createdTime = record.createdTime
    }
    listStore.put(requiredData);
  }

}

function successResponse(read, param, db, resolve, reject) {
  const removeActivitiesForUser = []
  const removeActivitiesForOthers = []
  const updateTx = db.transaction(['map', 'calendar', 'children', 'list', 'subscriptions', 'activity', 'addendum', 'root', 'users'], 'readwrite');
  const addendumObjectStore = updateTx.objectStore('addendum')
  const activityObjectStore = updateTx.objectStore('activity');
  const userStore = updateTx.objectStore('users')
  let counter = {};
  let userTimestamp = {}

  read.addendum.forEach(function (addendum) {
    if (addendum.unassign) {
      if (addendum.user == param.user.phoneNumber) {
        removeActivitiesForUser.push(addendum.activityId)
      } else {
        removeActivitiesForOthers.push({
          id: addendum.activityId,
          user: addendum.user
        })
      }
    }



    // if (addendum.isComment) {
      let key = addendum.activityId
      // userTimestamp[key] = (userTimestamp[key] || 0) + 1;
      userTimestamp[addendum.user] = {
        ts: addendum.timestamp,
        comment: addendum.comment
      }
    // }
    addendumObjectStore.add(addendum)
  })

  removeActivityFromDB(db, removeActivitiesForUser, param)
  removeUserFromAssigneeInActivity(db, removeActivitiesForOthers, param);

  read.activities.slice().reverse().forEach(function (activity) {
    activity.canEdit ? activity.editable == 1 : activity.editable == 0;
    activityObjectStore.put(activity);


    updateCalendar(activity, updateTx);
    putAttachment(activity, updateTx, param);
    if (activity.hidden === 0) {
      createListStore(activity, counter, updateTx)
    };
    activity.assignees.forEach(function (user) {
      const ob = { displayName: user.displayName,
        mobile: user.phoneNumber,
        photoURL: user.photoURL
      }
      if(userTimestamp[user.phoneNumber]) {
        ob.timestamp = userTimestamp[user.phoneNumber].ts
        ob.comment = userTimestamp[user.phoneNumber].comment
      }
      userStore.put(ob)
    })
  })

  read.templates.forEach(function (subscription) {
    updateSubscription(subscription, updateTx)

  })
  updateRoot(read, updateTx, param.user.uid);
  updateTx.oncomplete = function () {
    console.log("all completed");
    return resolve(true)
  }
  updateTx.onerror = function () {
    return reject(updateTx.error)
  }
}

function updateRoot(read, tx, uid) {
  const store = tx.objectStore('root')
  store.get(uid).onsuccess = function (event) {
    const record = event.target.result;
    record.fromTime = read.upto;
    console.log('start adding upto')
    store.put(record);
  }
}

function updateIDB(config) {
  return new Promise(function (resolve, reject) {

    const tx = config.db.transaction(['root']);
    const rootObjectStore = tx.objectStore('root');
    let record;
    let time;

    rootObjectStore.get(config.meta.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime
    }

    tx.oncomplete = function () {
      const req = {
        method: 'GET',
        url: `${config.meta.apiUrl}read?from=${time}`,
        data: null,
        token: config.meta.user.token
      }

      http(req)
        .then(function (response) {

          return successResponse(response, config.meta, config.db, resolve, reject);

        }).catch(function (error) {
          return reject(error)
        })
    }
  })
}