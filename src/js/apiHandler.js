importScripts('../external/js/moment.min.js');
const apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'


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
  removeFromOffice:removeFromOffice
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
    fetchServerTime(event.data.body, event.data.user).then(putServerTime).then(updateIDB).catch(console.log);
    return
  }

  if (event.data.type === 'instant') {
    instant(event.data.body, event.data.user)
    return
  }

  if (event.data.type === 'Null') {
    updateIDB({
      user: event.data.user
    });
    return;
  }

  if (event.data.type === 'backblaze') {
    getUrlFromPhoto(event.data.body, event.data.user)
    return;
  }

  requestFunctionCaller[event.data.type](event.data.body, event.data.user).then(function (backToList) {
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

function fetchServerTime(body, user) {
  currentDevice = body.device;

  const parsedDeviceInfo = JSON.parse(currentDevice);

  return new Promise(function (resolve) {
    const url = `${apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}&registrationToken=${body.registerToken}`
    const httpReq = {
      method: 'GET',
      url: url,
      body: null,
      token: user.token
    }

    http(httpReq).then(function (response) {
      console.log(response)
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


      resolve({
        ts: response.timestamp,
        user: user,
      })
    }).catch(sendApiFailToMainThread)
  })
}

function instant(error, user) {


  const req = {
    method: 'POST',
    url: `${apiUrl}services/logs`,
    body: error,
    token: user.token
  }
  
  http(req).then(function (response) {
    console.log(response)
  }).catch(console.log)
}


/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */


function fetchRecord(uid, id) {
  return new Promise(function (resolve) {

    const req = indexedDB.open(uid)
    req.onsuccess = function (event) {
      const db = req.result
      const objStore = db.transaction('activity').objectStore('activity')
      objStore.get(id).onsuccess = function (event) {

        resolve(event.target.result)
      }
    }
  })
}


function putServerTime(data) {

  return new Promise(function (resolve, reject) {
    const request = indexedDB.open(data.user.uid);
    request.onerror = function () {
      reject(request.error.message)
    }

    request.onsuccess = function () {
      const db = request.result
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(data.user.uid).onsuccess = function (event) {
        const record = event.target.result
        record.serverTime = data.ts - Date.now()
        rootObjectStore.put(record)
      }
      rootTx.oncomplete = function () {
        resolve({
          user: data.user,
          ts: data.ts
        })
      }
    }
  })
}



function comment(body, auth) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'POST',
      url: `${apiUrl}activities/comment`,
      body: JSON.stringify(body),
      token: auth.token
    }
    http(req).then(function () {

      resolve(true)
    }).catch(sendApiFailToMainThread)
  })
}

function statusChange(body, user) {

  return new Promise(function (resolve, reject) {
    fetchRecord(user.uid, body.activityId).then(function (originalRecord) {
      const req = {
        method: 'PATCH',
        url: `${apiUrl}activities/change-status`,
        body: JSON.stringify(body),
        token: user.token
      }
      http(req).then(function (success) {
        instantUpdateDB(body, 'status', user).then(function () {
          resolve(true)
        }).catch(console.log)
      }).catch(sendApiFailToMainThread)
    })
  })
}


function share(body, user) {
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'PATCH',
      url: `${apiUrl}activities/share`,
      body: JSON.stringify(body),
      token: user.token
    }
    http(req)
      .then(function (success) {
        instantUpdateDB(body, 'share', user).then(function () {
          resolve(true)
        })
      })
      .catch(sendApiFailToMainThread)
  })
}




function update(body, user) {
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'PATCH',
      url: `${apiUrl}activities/update`,
      body: JSON.stringify(body),
      token: user.token
    }
    http(req)
      .then(function (success) {
        instantUpdateDB(body, 'update', user).then(function () {
          resolve(true)
        })
      })
      .catch(sendApiFailToMainThread)
  })
}

function create(body, user) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    const req = {
      method: 'POST',
      url: `${apiUrl}activities/create`,
      body: JSON.stringify(body),
      token: user.token
    }
    http(req)
      .then(function (success) {
        resolve(true)
      })
      .catch(sendApiFailToMainThread)
  })
}

function removeFromOffice(param){
  removeActivity(param).then(function(response){
    return removeFromListAndChildren(response)
  }).then(function(response){
    return removeFromMapAndCalendar(response);
  }).then(function(response) {
    return removeFromSubscriptions(response)
  }).catch(function(error){
    throw new Error(error);
  }).catch(function(error){
    console.log(error);
    instant(JSON.stringify({message:Error}))
  })
}




function removeActivity(param){
  return new Promise (function(resolve,reject){

    const req = indexedDB.open(param.user.uid);
    req.onsuccess = function(){
      const db =req.result;
      const tx =db.transaction(['activity'],'readwrite')
      const store = tx.objectStore('activity');
      const index = store.index('office');
      const ids  = [];

      index.openCursor(param.body.office).onsuccess = function(event){
        const cursor = event.target.result;
        if(!cursor) return;
        ids.push(cursor.value.activityId);
        const deleteReq = cursor.delete();

        deleteReq.onsuccess = function(){

          cursor.continue();
        }
      }
      tx.oncomplete = function(){
        resolve({param:param,ids:ids})
      }
      tx.onerror = function(){
        reject({message:tx.error.message})
      }
    }
    req.onerror = function(){
      reject({message:req.error.message})
    }
  })
}

function removeFromListAndChildren(response){
  return new Promise(function(resolve,reject){

    const req = indexedDB.open(response.param.user.uid);
    req.onsuccess = function(){
      const db = req.result;
      const tx = db.transaction(['list','children'],'readwrite');
      const listStore = tx.objectStore('list');
      const childrenStore  = tx.objectStore('children');
      response.ids.forEach(function(id){
          const deleteReqList = listStore.delete(id);
          const deleteReqChildren = childrenStore.delete(id);
      })
      tx.oncomplete = function(){
        resolve(response)
      }
      tx.onerror = function(){
        reject({message:tx.error.message})
      }
    }
    req.onerror = function(){
      reject({message:req.error.message})
    }
  })
}

function removeFromMapAndCalendar(response){
  return new Promise(function(resolve,reject){

    const req = indexedDB.open(Response.param.user.uid);
    req.onsuccess = function(){
      const db = req.result;
      const tx = db.transaction(['map','calendar'],'readwrite');
      const map = tx.objectStore('map');
      const calendar = tx.objectStore('calendar');
      
      deleteByIndex(map,response.ids);
      deleteByIndex(calendar,response.ids);
      tx.oncomplete = function(){
        resolve(response)    
      }
      tx.onerror = function(){
        reject({message:tx.error.message})
      }
    }
    req.onerror = function(){
      reject({message:req.error.message})
    }
  })
}

function removeFromSubscriptions(response) {
  return new Promise(function(resolve,reject){

    const req = indexedDB.open(response.param.user.uid)
    req.onsuccess = function(){
      const db = req.result;
      const tx = db.transaction(['subscriptions'],'readwrite');
      const store = tx.objectStore('subscriptions');
      const index = store.index('office')
      index.openCursor(response.body.office).onsuccess = function(event){
        const cursor = event.target.result;
        if(!cursor) return;
        const deleteReq = cursor.delete();
        cursor.continue()
      }
      tx.oncomplete = function(){
        
      }
    }
  })
  }

function getUrlFromPhoto(body, user) {

  const req = {
    method: 'POST',
    url: `${apiUrl}services/images`,
    body: JSON.stringify(body),
    token: user.token
  }

  http(req).then(function (url) {
    requestHandlerResponse('backblazeRequest', 200);
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
              '_latitude': data.venue[i].geopoint['_latitude'],
              '_longitude': data.venue[i].geopoint['_longitude']
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
        deleteRecordReq.onerror = function(){
          instant({message:deleteRecordReq.error.message})
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
            location: newVenue.location.toLowerCase(),
            template: activity.template,
            address: newVenue.address.toLowerCase(),
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
        recordDeleteReq.onerror = function(){
          instant({message:recordDeleteReq.error.message})
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

// if an assignee's phone number is present inside the users object store then
// return else  call the users api to get the profile info for the number
function putAssignessInStore(assigneeArray, param) {
  const req = indexedDB.open(param.user.uid);
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['users'], 'readwrite');
    const store = tx.objectStore('users');
    assigneeArray.forEach(function (assignee) {
      store.get(assignee).onsuccess = function (event) {
        if (!event.target.result) {
          store.put({
            mobile: assignee,
            displayName: '',
            photoURL: ''
          })
        }
      }
    })
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

      instant({message:transaction.error.message})
    }

  }
}


function deleteByIndex(store, activitiesToRemove) {
  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) return;

    if (activitiesToRemove.indexOf(cursor.key) > -1) {
      cursor.delete()
    }
    cursor.continue()
  }

}


function updateSubscription(db, templates, param) {
  return new Promise(function (resolve, reject) {
    if (!templates.length) {
      resolve(true)
      return
    }
    const req = indexedDB.open(param.user.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions'], 'readwrite')
      const subscriptionObjectStore = tx.objectStore('subscriptions');
      const templateIndex = subscriptionObjectStore.index('template');
      templates.forEach(function (subscription) {

        templateIndex.openCursor(subscription.template).onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {

            if (subscription.office === cursor.value.office) {
              cursor.update(subscription);
            } else {
              cursor.put(subscription)
            }
            cursor.continue()
          } else {
            subscriptionObjectStore.put(subscription)
          }
        }
      })

      tx.oncomplete = function () {
        resolve(true)
      }
      tx.onerror = function () {
        reject({
          message: `${tx.error.message}`
        });
      }
    }
  })
}

function deleteTemplateInSubscription(subscription) {

}

function createListStore(activity, counter, param) {
  return new Promise(function (resolve, reject) {

    const req = indexedDB.open(param.user.uid);
    req.onsuccess = function () {
      const db = req.result;
      const userTx = db.transaction(['users']);
      
      const usersStore = userTx.objectStore('users');
   
      const requiredData = {
        'activityId': activity.activityId,
        'secondLine': '',
        'count': counter[activity.activityId],
        'timestamp': activity.timestamp,
        'creator': {
          number: activity.creator,
          photo: ''
        },
        'activityName': activity.activityName,
        'status': activity.status
      }
      usersStore.get(activity.creator).onsuccess = function (event) {
        const record = event.target.result;
        if (record) {
          requiredData.creator.photo = record.photoURL
        }
      }
      userTx.oncomplete = function(){
        const listTX = db.transaction(['list'],'readwrite');
        const listStore = listTX.objectStore('list');
        listStore.get(activity.activityId).onsuccess = function(listEvent){
          const record = listEvent.target.result;
          if(!record) {
            requiredData.createdTime = activity.timestamp;
          }
          else {
            requiredData.createdTime  = record.createdTime
          }
          listStore.put(requiredData);
        }
        listTX.oncomplete = function(){
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

     if(addendum.isComment) {
       let key = addendum.activityId 
       counter[key] = (counter[key] || 0) + 1
      }
      addendumObjectStore.add(addendum)
    })

    removeActivityFromDB(db, removeActivitiesForUser, param)
    removeUserFromAssigneeInActivity(db, removeActivitiesForOthers, param);

    for (let index = read.activities.length; index--;) {
      const activity = read.activities[index];
      if (activity.canEdit) {
        activity.editable = 1
        activityObjectStore.put(activity)
      } else {
        activity.editable = 0
        activityObjectStore.put(activity)
      }

      updateMap(activity, param);
      updateCalendar(activity, param)
      putAssignessInStore(activity.assignees, param);
      putAttachment(activity, param)

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
      updateSubscription(db, read.templates, param).then(function () {
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



    createUsersApiUrl(db, param.user).then(updateUserObjectStore).catch(function (error) {
      instant(JSON.stringify(error), param.user);
    })
  }
}


function createUsersApiUrl(db, user) {
  return new Promise(function (resolve) {
    const tx = db.transaction(['users'], 'readwrite');
    const usersObjectStore = tx.objectStore('users');

    let assigneeString = ''

    const defaultReadUserString = `${apiUrl}services/users?q=`
    let fullReadUserString = ''

    usersObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) return

      const assigneeFormat = `%2B${cursor.value.mobile}&q=`
      assigneeString += `${assigneeFormat.replace('+', '')}`
      cursor.continue()
    }
    tx.oncomplete = function () {
      fullReadUserString = `${defaultReadUserString}${assigneeString}`

      resolve({
        db: db,
        url: fullReadUserString,
        user: user
      })

    }
    tx.onerror = function () {
      reject({
        message: tx.error.message
      })
    }
  })
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore(requestPayload) {
  const req = {
    method: 'GET',
    url: requestPayload.url,
    data: null,
    token: requestPayload.user.token
  }
  http(req)
    .then(function (userProfile) {
      if (!Object.keys(userProfile).length) {
        return;
      }

      const tx = requestPayload.db.transaction(['users'], 'readwrite');
      const usersObjectStore = tx.objectStore('users');
      usersObjectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return;
        if (!userProfile.hasOwnProperty(cursor.primaryKey)) return

        if (userProfile[cursor.primaryKey].displayName && userProfile[cursor.primaryKey].photoURL) {
          const record = cursor.value
          record.photoURL = userProfile[cursor.primaryKey].photoURL
          record.displayName = userProfile[cursor.primaryKey].displayName
          usersObjectStore.put(record)
        }

        cursor.continue()
      }
      tx.oncomplete = function () {

      }
      tx.onerror = function () {
        instant(JSON.stringify({
          message: `${tx.error.message}`
        }), param.user)
      }

    }).catch(function (error) {
      console.log(error);
    })

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
      req.onerror = function () {
        reject({
          message: req.error.message
        })
      }
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


function updateIDB(param) {
  const req = indexedDB.open(param.user.uid)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['root']);
    const rootObjectStore = tx.objectStore('root');
    let record;
    let time;

    rootObjectStore.get(param.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime
    }

    tx.oncomplete = function () {
      const req = {
        method: 'GET',
        url: `${apiUrl}read?from=${time}`,
        data: null,
        token: param.user.token
      }

      http(req)
        .then(function (response) {
          if (!response) return;
          requestHandlerResponse('android-stop-refreshing', 200)
          successResponse(response, param)
        }).catch(sendApiFailToMainThread)
    }
  }
}