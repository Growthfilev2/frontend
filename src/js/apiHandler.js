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
}

function requestHandlerResponse(type, code, message, params) {
  self.postMessage({
    type: type,
    code: code,
    msg: message,
    params: params
  })
}


function sendApiFailToMainThread(error) {
  requestHandlerResponse('apiFail', error.code, error);
}

self.onmessage = function (event) {
  if (event.data.type === 'now') {
    fetchServerTime(event.data.body, event.data.meta).then(putServerTime).then(updateIDB).catch(console.log);
    return
  }

  if (event.data.type === 'instant') {
    instant(event.data.body, event.data.meta)
    return
  }

  if (event.data.type === 'Null') {
    updateIDB(event.data.meta);
    return;
  }

  if (event.data.type === 'backblaze') {
    getUrlFromPhoto(event.data.body, event.data.meta)
    return;
  }

  requestFunctionCaller[event.data.type](event.data.body, event.data.meta).then(function (backToList) {
    if (backToList) {
      // if(event.data.body[0].template ==='check-in') {

      //   return;
      // }
      if(event.data.type ==='create' && event.data.body[0].template ==='customer') {
        requestHandlerResponse('notification', 200, 'status changed successfully',true);
      }
      else {
        requestHandlerResponse('notification', 200, 'status changed successfully',false);
      }
    }
  }).catch(function (error) {
    console.log(error)
  })
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

function fetchServerTime(body, meta) {
  return new Promise(function (resolve) {
    currentDevice = body.device;
    const parsedDeviceInfo = JSON.parse(currentDevice);
    let url = `${meta.apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}&deviceBrand=${parsedDeviceInfo.deviceBrand}&deviceModel=${parsedDeviceInfo.deviceModel}&registrationToken=${body.registerToken}`
    const req = indexedDB.open(meta.user.uid);

    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['root'], 'readwrite');
      const rootStore = tx.objectStore('root');

      rootStore.get(meta.user.uid).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        if (!record.hasOwnProperty('officesRemoved')) return;
        if (record.officesRemoved) {
          record.officesRemoved.forEach(function (office) {

            url = url + `&removeFromOffice=${office.replace(' ','%20')}`
          });
          delete record.officesRemoved;
          rootStore.put(record);
        }
      }

      tx.oncomplete = function () {

        const httpReq = {
          method: 'GET',
          url: url,
          body: null,
          token: meta.user.token
        }

        http(httpReq).then(function (response) {

          if (response.updateClient) {
            requestHandlerResponse('update-app', 200)
            return
          }

          if (response.revokeSession) {
            requestHandlerResponse('revoke-session', 200);
            return
          };
          if (response.hasOwnProperty('removeFromOffice')) {
            if (Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
              removeFromOffice(response.removeFromOffice, meta.user)
            }
          }

          resolve({
            ts: response.timestamp,
            meta: meta,
          })

        }).catch(sendApiFailToMainThread)
      }

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
    const request = indexedDB.open(data.meta.user.uid);
    request.onerror = function () {
      reject(request.error.message)
    }

    request.onsuccess = function () {
      const db = request.result
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(data.meta.user.uid).onsuccess = function (event) {
        const record = event.target.result
        record.serverTime = data.ts - Date.now()
        rootObjectStore.put(record)
      }
      rootTx.oncomplete = function () {
        resolve(data.meta)
      }
    }
  })
}



function comment(body, meta) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'POST',
      url: `${meta.apiUrl}activities/comment`,
      body: JSON.stringify(body),
      token: meta.user.token
    }
    http(req).then(function () {

      resolve(true)
    }).catch(sendApiFailToMainThread)
  })
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
      instantUpdateDB(body, 'status', meta.user).then(function () {
        resolve(true)
      }).catch(console.log)
    }).catch(sendApiFailToMainThread)
  })
}


function share(body, meta) {
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'PATCH',
      url: `${meta.apiUrl}activities/share`,
      body: JSON.stringify(body),
      token: meta.user.token
    }
    http(req)
      .then(function (success) {
        resolve(true)
      })
      .catch(sendApiFailToMainThread)
  })
}




function update(body, meta) {
  return new Promise(function (resolve, reject) {
    // if(body.template === 'tour plan') {
    //   if(body.customerRecord) {
    //     if(!body.customerRecord.attachment.Name.value) {
    //       delete body.customerRecord;
    //     }
    //   }
    // }
    const req = {
      method: 'PATCH',
      url: `${meta.apiUrl}activities/update`,
      body: JSON.stringify(body),
      token: meta.user.token
    }

    http(req)
      .then(function (success) {

        instantUpdateDB(body, 'update', meta.user).then(function () {
          resolve(true)
        })
      })
      .catch(sendApiFailToMainThread)
  })
}

function create(createReq, meta) {
  console.log(createReq)
  const promiseArray = [];
  createReq.forEach(function (requestBody) {
    const req = {
      method: 'POST',
      url: `${meta.apiUrl}activities/create`,
      body: JSON.stringify(requestBody),
      token: meta.user.token
    }
    promiseArray.push(http(req))
  })
  return new Promise(function (resolve, reject) {
    if (!promiseArray.length) return;
    Promise.all(promiseArray).then(function () {
      resolve(true)
    }).catch(sendApiFailToMainThread)
  })
}

function removeFromOffice(offices, user) {

  removeActivity(offices, user).then(function (response) {
    return removeFromListAndChildren(response)
  }).then(function (response) {
    return removeFromMapAndCalendar(response);
  }).then(function (response) {
    return removeFromSubscriptions(response);
  }).catch(function (error) {
    instant(JSON.stringify({
      message: error
    }))
  })
}




function removeActivity(offices, user) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(user.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['activity'], 'readwrite')
      const store = tx.objectStore('activity');
      const index = store.index('office');
      const ids = [];
      offices.forEach(function (office) {
        index.openCursor(office).onsuccess = function (event) {
          const cursor = event.target.result;
          if (!cursor) return;
          ids.push(cursor.value.activityId);
          const deleteReq = cursor.delete();
          deleteReq.onsuccess = function () {
            cursor.continue();
          }
        }
      })
      tx.oncomplete = function () {
        resolve({
          offices: offices,
          ids: ids,
          user: user
        })
      }
      tx.onerror = function () {
        reject({
          message: tx.error.message
        })
      }
    }
    req.onerror = function () {
      reject({
        message: req.error.message
      })
    }
  })
}

function removeFromListAndChildren(response) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(response.user.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['list', 'children'], 'readwrite');
      const listStore = tx.objectStore('list');
      const childrenStore = tx.objectStore('children');
      response.ids.forEach(function (id) {
        const deleteReqList = listStore.delete(id);
        const deleteReqChildren = childrenStore.delete(id);

      })
      tx.oncomplete = function () {
        resolve(response)
      }
      tx.onerror = function () {
        reject({
          message: tx.error.message
        })
      }
    }
    req.onerror = function () {
      reject({
        message: req.error.message
      })
    }
  })
}

function removeFromMapAndCalendar(response) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(response.user.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['map', 'calendar'], 'readwrite');
      const map = tx.objectStore('map').index('activityId')
      const calendar = tx.objectStore('calendar').index('activityId')

      deleteByIndex(map, response.ids);
      deleteByIndex(calendar, response.ids);
      tx.oncomplete = function () {
        resolve(response)
      }
      tx.onerror = function () {
        reject({
          message: tx.error.message
        })
      }
    }
    req.onerror = function () {
      reject({
        message: req.error.message
      })
    }
  })
}

function removeFromSubscriptions(response) {

  const req = indexedDB.open(response.user.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['subscriptions'], 'readwrite');
    const store = tx.objectStore('subscriptions');
    const index = store.index('office');
    response.offices.forEach(function (office) {
      index.openCursor(office).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        const deleteReq = cursor.delete();
        deleteReq.onsuccess = function () {
          cursor.continue()
        }

      }
    })

    tx.oncomplete = function () {
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(response.user.uid).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        record.officesRemoved = response.offices
        rootStore.put(record)
      }
      rootTx.oncomplete = function () {
        requestHandlerResponse('removed-from-office', 200, response.offices);
      }

      rootTx.onerror = function () {
        instant({
          message: rootTx.error.message
        })
      }
    }
    tx.onerror = function () {
      instant({
        message: tx.error.message
      })
    }
  }
}

function getUrlFromPhoto(body, meta) {

  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/images`,
    body: JSON.stringify(body),
    token: meta.user.token
  }

  http(req).then(function (url) {
    requestHandlerResponse('notification', 200);
  }).catch(sendApiFailToMainThread)
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


function updateMap(activity, tx) {

  if (activity.template === 'check-in') return;
  const mapObjectStore = tx.objectStore('map')
  const mapActivityIdIndex = mapObjectStore.index('activityId')
  mapActivityIdIndex.openCursor(activity.activityId).onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      console.log("start adding");
      activity.venue.forEach(function (newVenue) {
        console.log("adding " + activity.activityId, "location " + newVenue.location)
        mapObjectStore.add({
          activityId: activity.activityId,
          latitude: newVenue.geopoint['_latitude'],
          longitude: newVenue.geopoint['_longitude'],
          location: newVenue.location,
          template: activity.template,
          address: newVenue.address,
          venueDescriptor: newVenue.venueDescriptor,
          status: activity.status,
          office: activity.office,
          hidden: activity.hidden
        })
      })
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

function putAttachment(activity, tx,param) {

  const store = tx.objectStore('children');
  const commonSet = {
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment,
  };
  
  const myNumber = param.user.phoneNumber

  if(activity.template === 'employee') {
    commonSet.employee = activity.attachment['Employee Contact'].value
    if(activity.attachment['First Supervisor'].value === myNumber || activity.attachment['Second Supervisor'].value === myNumber) {
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

function successResponse(read, param) {
  const request = indexedDB.open(param.user.uid)
  const removeActivitiesForUser = []
  const removeActivitiesForOthers = []
  request.onsuccess = function () {
    const db = request.result
    const updateTx = db.transaction(['map', 'calendar', 'children', 'list', 'subscriptions', 'activity', 'addendum','root','users'], 'readwrite');
    const addendumObjectStore = updateTx.objectStore('addendum')
    const activityObjectStore = updateTx.objectStore('activity');
    const userStore = updateTx.objectStore('users')
    let counter = {};

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

      if (addendum.isComment) {
        let key = addendum.activityId
        counter[key] = (counter[key] || 0) + 1
      }
      addendumObjectStore.add(addendum)
    })

    removeActivityFromDB(db, removeActivitiesForUser, param)
    removeUserFromAssigneeInActivity(db, removeActivitiesForOthers, param);
    read.activities.slice().reverse().forEach(function (activity) {
      activity.canEdit ? activity.editable == 1 : activity.editable == 0;
      activityObjectStore.put(activity);
 
      updateMap(activity, updateTx);
      updateCalendar(activity, updateTx);
      putAttachment(activity, updateTx,param);
      if (activity.hidden === 0) {
        createListStore(activity, counter, updateTx)
      };
      activity.assignees.forEach(function(user){
        userStore.put({
          displayName: user.displayName,
          mobile: user.phoneNumber,
          photoURL: user.photoURL
        })
      })
    })

    read.templates.forEach(function (subscription) {
      updateSubscription(subscription, updateTx)

    })
    updateRoot(read,updateTx,param.user.uid);

    updateTx.oncomplete = function () {
      if(read.fromTime) {
        requestHandlerResponse('initFirstLoad', 200)
      }
      console.log("all completed");
    }

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

function updateIDB(meta) {

  const req = indexedDB.open(meta.user.uid)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['root']);
    const rootObjectStore = tx.objectStore('root');
    let record;
    let time;

    rootObjectStore.get(meta.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime
    }

    tx.oncomplete = function () {
      const req = {
        method: 'GET',
        url: `${meta.apiUrl}read?from=${time}`,
        data: null,
        token: meta.user.token
      }

      http(req)
        .then(function (response) {
          if (!response) return;
          successResponse(response, meta)
        }).catch(sendApiFailToMainThread)
    }
  }
}