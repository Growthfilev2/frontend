importScripts('../external/js/moment.min.js');

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
  console.log(event)
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
      requestHandlerResponse('notification', 200, 'status changed successfully');
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

        if (!xhr.status) {
          requestHandlerResponse('android-stop-refreshing', 400)
          return;
        }


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
  console.log(body)
  return new Promise(function (resolve) {
  currentDevice = body.device;
  const parsedDeviceInfo = JSON.parse(currentDevice);
  let url = `${meta.apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}&deviceBrand=${parsedDeviceInfo.deviceBrand}&deviceModel=${parsedDeviceInfo.deviceModel}&registrationToken=${body.registerToken}`
  const req = indexedDB.open(meta.user.uid);
    
  req.onsuccess = function(){
    const db = req.result;
    const tx = db.transaction(['root'],'readwrite');
    const rootStore = tx.objectStore('root');
    
    rootStore.get(meta.user.uid).onsuccess = function(event){
      const record = event.target.result;
      if(!record) return;
      if(!record.hasOwnProperty('officesRemoved')) return;
      if(record.officesRemoved) {
          record.officesRemoved.forEach(function(office){
            
            url = url + `&removeFromOffice=${office.replace(' ','%20')}`
          });
          delete record.officesRemoved;
          rootStore.put(record);
      }
    }
    
    tx.oncomplete = function(){ 

        const httpReq = {
          method: 'GET',
          url: url,
          body: null,
          token: meta.user.token
        }
    
        http(httpReq).then(function (response) {
         
          if (response.updateClient) {
            const title = 'Message';
            const message = 'There is a New version of your app available';
    
            const button = {
              text: 'Update',
              show: true,
              clickAction: {
                redirection: {
                  text: 'com.growthfile.growthfileNew',
                  value: true
                }
              }
            }
    
            const alertData = JSON.stringify({
              title: title,
              message: message,
              cancelable: false,
              button: button
            })
            requestHandlerResponse('update-app', 200, alertData, '')
            return
          }
    
          if (response.revokeSession) {
            requestHandlerResponse('revoke-session', 200);
            return
          };
          if(response.hasOwnProperty('removeFromOffice')){
            if(Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
              removeFromOffice(response.removeFromOffice,meta.user)
            }
          }

          resolve({
            ts: response.timestamp,
            meta: meta,
          })
          
        }).catch(sendApiFailToMainThread)
      }
      tx.onerror = function(){
        console.log(tx.error)
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
  createReq.forEach(function(requestBody){
    const req = {
      method: 'POST',
      url: `${meta.apiUrl}activities/create`,
      body: JSON.stringify(requestBody),
      token: meta.user.token
    }
    promiseArray.push(http(req))
  })
  return new Promise(function (resolve, reject) {
    if(!promiseArray.length) return;
    Promise.all(promiseArray).then(function(){
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
        requestHandlerResponse('removed-from-office',200,response.offices);
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


function updateMap(activity, param) {

  const req = indexedDB.open(param.user.uid);
  req.onsuccess = function () {
    const db = req.result;
    const mapTx = db.transaction(['map'], 'readwrite')
    const mapObjectStore = mapTx.objectStore('map')
    const mapActivityIdIndex = mapObjectStore.index('activityId')
    mapActivityIdIndex.openCursor(activity.activityId).onsuccess = function (event) {
      const cursor = event.target.result
      if (cursor) {
        let deleteRecordReq = cursor.delete()
        cursor.continue()
        deleteRecordReq.onerror = function () {
          instant({
            message: deleteRecordReq.error.message
          })
        }
      }
    }


    mapTx.oncomplete = function () {
      const mapTxAdd = db.transaction(['map'], 'readwrite')
      const mapObjectStore = mapTxAdd.objectStore('map')
      if (activity.template !== 'check-in') {

        activity.venue.forEach(function (newVenue) {
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
      }
      mapTxAdd.onerror = function () {
        instant(JSON.stringify({
          message: `${mapTxAdd.error.message}`
        }), param.user)
      }
    }
    mapTx.onerror = function () {
      instant(JSON.stringify({
        message: `${mapTx.error.message}`
      }), param.user)
    }
  }
}

function updateCalendar(activity, param) {

  const req = indexedDB.open(param.user.uid);
  req.onsuccess = function () {
    const db = req.result;
    const calendarTx = db.transaction(['calendar'], 'readwrite')
    const calendarObjectStore = calendarTx.objectStore('calendar')
    const calendarActivityIndex = calendarObjectStore.index('activityId')

    calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
      // console.log(activity.activityId)
      const cursor = event.target.result
      if (cursor) {
        let recordDeleteReq = cursor.delete()
        recordDeleteReq.onerror = function () {
          instant({
            message: recordDeleteReq.error.message
          })
        }
        cursor.continue()
      }
    }
    calendarTx.oncomplete = function () {
      const calendarTxAdd = db.transaction(['calendar'], 'readwrite')
      const calendarObjectStore = calendarTxAdd.objectStore('calendar')

      activity.schedule.forEach(function (schedule) {
        const startTime = moment(schedule.startTime).toDate()
        const endTime = moment(schedule.endTime).toDate()

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
        })
      })
      calendarTx.onerror = function () {
        instant(JSON.stringify({
          message: `${calendarTx.error.message}`
        }), param.user)
      }
    }
  }
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment(activity, param) {

  const req = indexedDB.open(param.user.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['children'], 'readwrite')
    const store = tx.objectStore('children')
    const commonSet = {
      activityId: activity.activityId,
      status: activity.status,
      template: activity.template,
      office: activity.office,
      attachment: activity.attachment,
    }
    store.put(commonSet)

    tx.onerror = function () {
      instant(JSON.stringify({
        message: `${tx.error.message}`
      }), param.user)
    }
  }
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



function updateSubscription(templates, param) {
  return new Promise(function(resolve,reject){

    const req = indexedDB.open(param.user.uid);
    req.onsuccess = function () {
      const db = req.result;
      const deletTx = db.transaction(['subscriptions'], 'readwrite')
      const deleteSubStore = deletTx.objectStore('subscriptions');
      const deletIndex = deleteSubStore.index('officeTemplate');
      templates.forEach(function (subscription) {
        deletIndex.openCursor([subscription.office, subscription.template]).onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            const deleteReq = cursor.delete();
            deleteReq.onsuccess = function () {
             console.log('deleted')
            }
          } 
        }
      })

      deletTx.oncomplete = function () {
         const addReq = indexedDB.open(param.user.uid)
         addReq.onsuccess = function(){
           const addDb = addReq.result;
           const addTx = addDb.transaction(['subscriptions'],'readwrite');
           const addStore = addTx.objectStore('subscriptions')
         
           templates.forEach(function(subscription){

             addStore.put(subscription)
             console.log('added')
           })
           addTx.oncomplete = function(){
             resolve(true)
           }
           addTx.onerror = function(){
             reject(addTx.error.message)
           }
         }
      }
      deletTx.onerror = function(){
        reject({message:tx.error.message})
      }
    }
  })
}
  

function createListStore(activity, counter, param) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(param.user.uid);
    req.onsuccess = function () {
      const db = req.result;

      const userTx = db.transaction(['users'],'readwrite');

      const usersStore = userTx.objectStore('users');

      let requiredData = {
        'activityId': activity.activityId,
        'secondLine': '',
        'count': counter[activity.activityId],
        'timestamp': activity.timestamp,
        'activityName': activity.activityName,
        'status': activity.status
      }

      if(typeof activity.creator === "string") {
        requiredData.creator = {
          number:activity.creator,
          photo:''
        }
      }
      if(typeof activity.creator === 'object'){
        requiredData.creator = {
          number: activity.creator.phoneNumber,
          photo: activity.creator.photoURL,
        }
      }

      activity.assignees.forEach(function(assigneeData){
        const record = {
          mobile:assigneeData.phoneNumber,
          displayName:assigneeData.displayName,
          photoURL:assigneeData.photoURL
        }
        usersStore.put(record)
      })

      userTx.oncomplete = function () {
        const listTX = db.transaction(['list'], 'readwrite');
        const listStore = listTX.objectStore('list');
        listStore.get(activity.activityId).onsuccess = function (listEvent) {
          const record = listEvent.target.result;
          if (!record) {
            requiredData.createdTime = activity.timestamp;
          } else {
            requiredData.createdTime = record.createdTime
          }
          listStore.put(requiredData);
        }
        listTX.oncomplete = function () {
          resolve(true)
        }
      }

    }
  })
}

function successResponse(read, param) {
  const request = indexedDB.open(param.user.uid)
  const removeActivitiesForUser = []
  const removeActivitiesForOthers = []
  request.onsuccess = function () {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const activitytx = db.transaction(['activity', 'addendum'], 'readwrite')
    const activityObjectStore = activitytx.objectStore('activity')
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

    for (let index = read.activities.length; index--;) {
      let activity = read.activities[index];
    
      activity.canEdit ? activity.editable ==1 : activity.editable == 0;
      activityObjectStore.put(activity)
      updateMap(activity, param);
      updateCalendar(activity, param);
    
      putAttachment(activity, param);

      if (activity.hidden === 0) {
        createListStore(activity, counter, param).then(function () {

          if (read.activities.length >= 20) {
            if ((read.activities.length - index) <= 20) {
              requestHandlerResponse('initFirstLoad', 200, {
                activity: [activity]
              });
            }
          } else {
            requestHandlerResponse('initFirstLoad', 200, {
              activity: [activity]
            });
          }
        })
      }
    }


    updateRoot(param, read).then(function () {
      updateSubscription(read.templates, param).then(function () {
        requestHandlerResponse('initFirstLoad', 200, {
          template: true
        })
      }).catch(function (error) {

        instant(JSON.stringify(error), param.user)
        requestHandlerResponse('initFirstLoad', 200, {
          template: true
        });
      })
    })

    getUniqueOfficeCount(param).then(function (offices) {
      setUniqueOffice(offices, param).then(console.log).catch(function (error) {
        instant(JSON.stringify(error), param.user)
      })
    }).catch(function (error) {
      instant(JSON.stringify(error), param.user)
    });


  }
}

function updateRoot(param, read) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(param.user.uid)
    req.onsuccess = function () {
      const db = req.result;
      const rootTx = db.transaction(['root'], 'readwrite');
      const store = rootTx.objectStore('root')
      store.get(param.user.uid).onsuccess = function (event) {
        const record = event.target.result;
        record.fromTime = read.upto
        store.put(record);
      }
      rootTx.oncomplete = function () {
        resolve(true)
      }
      rootTx.onerror = function () {
        reject(rootTx.error.message);
      }
    }
  })
}


function getUniqueOfficeCount(param) {

  return new Promise(function (resolve, reject) {
    const dbName = param.user.uid
    const req = indexedDB.open(dbName)
    let offices = []
    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['activity']);
      const activityStore = tx.objectStore('activity').index('office');
      activityStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return;
        offices.push(cursor.value.office)
        cursor.continue()
      }
      tx.oncomplete = function () {
        resolve(offices);
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

function setUniqueOffice(offices, param) {
  return new Promise(function (resolve, reject) {

    const dbName = param.user.uid;
    const req = indexedDB.open(dbName)

    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['root'], 'readwrite')
      const rootObjectStore = tx.objectStore('root');
      rootObjectStore.get(dbName).onsuccess = function (event) {
        const record = event.target.result
        record.offices = offices
        rootObjectStore.put(record)
      };

      tx.oncomplete = function () {
        resolve(true)
      }
      tx.onerror = function () {
        reject({
          message: tx.error.message
        })
      }
    }
  })
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
          requestHandlerResponse('android-stop-refreshing', 200)
          successResponse(response,meta)
        }).catch(sendApiFailToMainThread)
    }
  }
}