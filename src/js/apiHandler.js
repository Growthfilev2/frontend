// import firebase app script because there is no native support of firebase inside web workers
importScripts('../external/js/moment.min.js')

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js')
// Backend API Url
const apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'

let deviceInfo;
/** reinitialize the firebase app */

// get Device time
function getTime() {
  return Date.now()
}

firebase.initializeApp({
  apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
  authDomain: "growthfilev2-0.firebaseapp.com",
  databaseURL: "https://growthfilev2-0.firebaseio.com",
  projectId: "growthfilev2-0",
  storageBucket: "growthfilev2-0.appspot.com",
  messagingSenderId: "1011478688238"
})


// dictionary object with key as the worker's onmessage event data and value as
// function name
const requestFunctionCaller = {
  comment: comment,
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  Null: Null,
  now: fetchServerTime,
}


function requestHandlerResponse(type, code, message, params) {
  self.postMessage({
    type: type,
    code: code,
    msg: message,
    params: params
  })
}

function createLog(body) {

  return JSON.stringify(body)
}


// when worker receives the request body from the main thread
self.onmessage = function (event) {
  
  
  firebase.auth().onAuthStateChanged(function (auth) {

    if (event.data.type === 'now') {
      fetchServerTime(event.data.body).then(initializeIDB).then(updateIDB).catch(console.log)
      return
    }
    if (event.data.type === 'instant') {
      instant(event.data.body)
      return
    }
    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(function (error) {
      console.log(error)
    })
  })
}


// Performs XMLHTTPRequest for the API's.

function http(method, url, data) {
  return new Promise(function (resolve, reject) {
    firebase
      .auth()
      .currentUser
      .getIdToken(false)
      .then(function (idToken) {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url, true)

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)

        xhr.onreadystatechange = function () {
          // console.log(xhr.status)
          if (xhr.readyState === 4) {
            // console.log(xhr.status)
            if (!xhr.status) {
              requestHandlerResponse('android-stop-refreshing', 400, 'true')
              return;
            }

            if (xhr.status > 226) {
              const errorObject = JSON.parse(xhr.response)
              requestHandlerResponse('error', errorObject.code, errorObject.message)
              return reject({
                res: JSON.parse(xhr.response),
                url: url,
                data: data,
                device: currentDevice
              })
            }
            xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success')
          }
        }

        xhr.send(data || null)
      }).catch(function (error) {

        instant(createLog(error))
      })
  })
}

function fetchServerTime(info) {
  currentDevice = info.device;
  const parsedDeviceInfo = JSON.parse(currentDevice);

  console.log(typeof parsedDeviceInfo.appVersion)
  return new Promise(function (resolve) {
    http(
      'GET',
      `${apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}`
    ).then(function (response) {
      console.log(response)
      if (response.updateClient) {
        console.log("please update device")
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
        fromTime: info.from
      })
    }).catch(function (error) {
      instant(createLog(error))
    })
  })
}

function instant(error) {
  console.log(error)
  http(
    'POST',
    `${apiUrl}services/logs`,
    error
  ).then(function (response) {
    console.log(response)
  }).catch(console.log)
}


/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */


function fetchRecord(dbName, id) {
  return new Promise(function (resolve) {

    const req = indexedDB.open(dbName)
    req.onsuccess = function (event) {
      const db = req.result
      const objStore = db.transaction('activity').objectStore('activity')
      objStore.get(id).onsuccess = function (event) {

        resolve(event.target.result)
      }
    }
  })
}


function initializeIDB(data) {
  console.log("init db")
  // onAuthStateChanged is added because app is reinitialized
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser

    const request = indexedDB.open(auth.uid, 2)


    request.onerror = function () {
      console.log(request.error)
      reject(request.error)
    }

    request.onupgradeneeded = function (evt) {
      console.log(evt);
      createObjectStores(request, auth, data.fromTime);
    }

    request.onsuccess = function () {
      const rootTx = request.result.transaction(['root'], 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(auth.uid).onsuccess = function (event) {
        const record = event.target.result
        record.serverTime = data.ts - Date.now()
        rootObjectStore.put(record)
      }
      rootTx.oncomplete = function () {
        requestHandlerResponse('manageLocation');
        resolve({
          dbName: auth.uid,
          swipe: 'false'
        })
      }
    }
  })
}

function createObjectStores(request, auth, fromTime) {
  console.log(fromTime)
  const db = request.result;

  const activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  })

  activity.createIndex('timestamp', 'timestamp')
  activity.createIndex('office', 'office')
  activity.createIndex('hidden', 'hidden')

  const list = db.createObjectStore('list', {
    keyPath: 'activityId'
  })
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');


  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')

  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')

  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])

  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('urgent', ['status', 'hidden'])

  const map = db.createObjectStore('map', {
    autoIncrement: true
  })

  map.createIndex('activityId', 'activityId')
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('nearby', ['status', 'hidden'])

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');

  const root = db.createObjectStore('root', {
    keyPath: 'uid'
  })

  root.put({
    uid: auth.uid,
    fromTime: fromTime,
    location: ''
  })

}

function comment(body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'POST',
      `${apiUrl}activities/comment`,
      JSON.stringify(body)
    ).then(function () {
      // requestHandlerResponse('notification', 200, 'comment added successfully', firebase.auth().currentUser.uid)
      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      })
    }).catch(function (error) {

      instant(createLog(error))

    })
  })
}

function statusChange(body) {
  console.log(body)
  const dbName = firebase.auth().currentUser.uid

  return new Promise(function (resolve, reject) {
    fetchRecord(dbName, body.activityId).then(function (originalRecord) {
      http(
        'PATCH',
        `${apiUrl}activities/change-status`,
        JSON.stringify(body),
        originalRecord
      ).then(function (success) {
        instantUpdateDB(dbName, body, 'status')

        requestHandlerResponse('notification', 200, 'status changed successfully', dbName)

        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      }).catch(function (error) {
        instant(createLog(error))

      })
    })
  })

}


function share(body) {
  const dbName = firebase.auth().currentUser.uid


  return new Promise(function (resolve, reject) {

    http(
        'PATCH',
        `${apiUrl}activities/share`,
        JSON.stringify(body))
      .then(function (success) {
        instantUpdateDB(dbName, body, 'share')
        requestHandlerResponse('notification', 200, 'assignne added successfully', dbName)
        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function (error) {
        instant(createLog(error))
      })

  })
}


function Null(swipe) {
  console.log(swipe)
  return new Promise(function (resolve, reject) {
    const user = firebase.auth().currentUser
    if (!user) {
      requestHandlerResponse('android-stop-refreshing')
      reject(null)
      return
    }
    if (swipe === "true") {
      console.log(JSON.parse(swipe))
      requestHandlerResponse('reset-offset')
    }
    console.log("Null Ran")
    resolve({
      dbName: user.uid,
      swipe: swipe
    })
  })
}

function update(body) {
  const dbName = firebase.auth().currentUser.uid
  console.log(body)

  return new Promise(function (resolve, reject) {
    http(
        'PATCH',
        `${apiUrl}activities/update`,
        JSON.stringify(body)
      )
      .then(function (success) {
        instantUpdateDB(dbName, body, 'update')
        requestHandlerResponse('notification', 200, 'activity update successfully', dbName)

        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function (error) {

        instant(createLog(error))
      })
  })

}

function create(body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
        'POST',
        `${apiUrl}activities/create`,
        JSON.stringify(body)
      )
      .then(function (success) {
        requestHandlerResponse('notification', 200, 'activity created successfully', firebase.auth().currentUser.uid)

        requestHandlerResponse('redirect-to-list', 200, '', firebase.auth().currentUser.uid)
        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function (error) {
        console.log(error)
        instant(createLog(error))
      })
  })
}


function instantUpdateDB(dbName, data, type) {
  console.log(data)
  const req = indexedDB.open(dbName)
  req.onsuccess = function (event) {
    const db = req.result
    const objStoreTx = db.transaction(['activity'], 'readwrite')
    const objStore = objStoreTx.objectStore('activity')
    objStore.get(data.activityId).onsuccess = function (event) {
      const record = event.target.result
      record.editable = 0


      if (type === 'share') {
        data.share.forEach(function(number){
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
        requestHandlerResponse('redirect-to-list', 200, '')
    }
  }
}


function updateMap(activity) {

  const req = indexedDB.open(firebase.auth().currentUser.uid);
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
        deleteRecordReq.onerror = errorDeletingRecord
      }
    }

    mapTx.oncomplete = function () {
      const mapTx = db.transaction(['map'], 'readwrite')
      const mapObjectStore = mapTx.objectStore('map')

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
    mapTx.onerror = errorDeletingRecord
  }
}

function errorDeletingRecord(event) {
  console.log(event.target.error)
}

function transactionError(event) {
  console.log(event.target.error)
}


function updateCalendar(activity) {

  const req = indexedDB.open(firebase.auth().currentUser.uid);
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
        recordDeleteReq.onerror = errorDeletingRecord
        cursor.continue()
      }
    }
    calendarTx.oncomplete = function () {
      const calendarTx = db.transaction(['calendar'], 'readwrite')
      const calendarObjectStore = calendarTx.objectStore('calendar')

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
      calendarTx.onerror = transactionError
    }
  }

}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment(db, activity) {
  const chidlrenObjectStore = db.transaction('children', 'readwrite').objectStore('children')

  chidlrenObjectStore.put({
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment
  })
}

// if an assignee's phone number is present inside the users object store then
// return else  call the users api to get the profile info for the number
function putAssignessInStore(db, assigneeArray) {

  assigneeArray.forEach(function (assignee) {
    const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')
    usersObjectStore.openCursor(assignee).onsuccess = function (event) {
      const cursor = event.target.result
      if (cursor) return
      usersObjectStore.add({
        mobile: assignee,
        isUpdated: 0,
        displayName: ''
      })
    }
  })
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

function removeActivityFromDB(db, myActivities) {
  if (!myActivities.length) return;
  const transaction = db.transaction(['activity', 'list', 'children'], 'readwrite')
  const activityObjectStore = transaction.objectStore('activity');
  const listStore = transaction.objectStore('list');
  const chidlrenObjectStore = transaction.objectStore('children');
  myActivities.forEach(function (id) {
    const deleteReqActivity = activityObjectStore.delete(id);
    const deleteReqList = listStore.delete(id);
    const deleteReqChildren = chidlrenObjectStore.delete(id);
    deleteReqActivity.onerror = function () {
      instant(createLog(deleteReqActivity.error))
    }
    deleteReqList.onerror = function () {
      instant(createLog(deleteReqList.error))
    }
    deleteReqChildren.onerror = function () {
      instant(createLog(deleteReqChildren.error))
    }
  })

  transaction.oncomplete = function () {
    mapAndCalendarRemovalRequest(activitiesToRemove)
  }
}

function mapAndCalendarRemovalRequest(activitiesToRemove) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
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
      console.log(transaction.error)
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
  store.onerror = function () {
    instant(createLog(store.error))
  }
}




function createUsersApiUrl(db) {
  return new Promise(function (resolve) {
    const tx = db.transaction(['users'], 'readwrite');
    const usersObjectStore = tx.objectStore('users');
    const isUpdatedIndex = usersObjectStore.index('isUpdated')
    const NON_UPDATED_USERS = 0
    let assigneeString = ''

    const defaultReadUserString = `${apiUrl}services/users?q=`
    let fullReadUserString = ''

    isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) return
      const assigneeFormat = `%2B${cursor.value.mobile}&q=`
      assigneeString += `${assigneeFormat.replace('+', '')}`
      cursor.continue()
    }
    tx.oncomplete = function () {
      fullReadUserString = `${defaultReadUserString}${assigneeString}`
      if (assigneeString) {

        resolve({
          db: db,
          url: fullReadUserString,
        })
      }
    }

  })
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore(successUrl) {

  http(
      'GET',
      successUrl.url
    )
    .then(function (userProfile) {
      console.log(userProfile)
      if (!Object.keys(userProfile).length) return
      const tx = successUrl.db.transaction(['users'], 'readwrite');
      const usersObjectStore = tx.objectStore('users');
      const isUpdatedIndex = usersObjectStore.index('isUpdated')
      const USER_NOT_UPDATED = 0
      const USER_UPDATED = 1

      isUpdatedIndex.openCursor(USER_NOT_UPDATED).onsuccess = function (event) {
        const cursor = event.target.result

        if (!cursor) return;

        if (!userProfile.hasOwnProperty(cursor.primaryKey)) return

        if (userProfile[cursor.primaryKey].displayName && userProfile[cursor.primaryKey].photoURL) {
          const record = cursor.value
          record.photoURL = userProfile[cursor.primaryKey].photoURL
          record.displayName = userProfile[cursor.primaryKey].displayName
          record.isUpdated = USER_UPDATED
          console.log(record)
          usersObjectStore.put(record)
        }
        cursor.continue()
      }
      tx.oncomplete = function () {
        console.log("all users updated")
      }

    }).catch(function (error) {
      instant(createLog(error))
    })

}

function findSubscriptionCount(db) {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction(['subscriptions'], 'readwrite');
    const subscriptionObjectStore = tx.objectStore('subscriptions');
    const request = subscriptionObjectStore.count();
    request.onsuccess = function () {
      resolve(request.result)
    }
    request.onerror = function () {
      reject(request.error)
    }
  })
}

function updateSubscription(db, subscription) {

  findSubscriptionCount(db).then(function (count) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions'], 'readwrite')
      const subscriptionObjectStore = tx.objectStore('subscriptions');
      const templateIndex = subscriptionObjectStore.index('template');
      if (!count) {
        subscriptionObjectStore.put(subscription)
        return;
      }
      templateIndex.openCursor(subscription.template).onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {

          if (subscription.office === cursor.value.office) {

            cursor.delete()
          }
          cursor.continue()
        }
      }

      tx.oncomplete = function () {
        const req = indexedDB.open(firebase.auth().currentUser.uid)
        req.onsuccess = function () {
          const db = req.result;
          const store = db.transaction('subscriptions', 'readwrite').objectStore('subscriptions')
          store.put(subscription);
        }
      }
    }

  }).catch(console.log)
}

function createListStore(activity,counter) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function(){
  const db = req.result;
  const listTx = db.transaction(['list'], 'readwrite');
  const listStore = listTx.objectStore('list');
  
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

    listStore.put(requiredData);
    listTx.oncomplete = function () {
      console.log("done")
    }
  }
}


function updateListStoreWithCreatorImage(counter) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {

      const db = req.result
      const transaction = db.transaction(['list', 'users'], 'readwrite')
      const listStore = transaction.objectStore('list');
      const userStore = transaction.objectStore('users');
  
      listStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        const creator = cursor.value.creator;

        if (creator.number === firebase.auth().currentUser.phoneNumber) {
          creator.photo = firebase.auth().currentUser.photoURL;
          listStore.put(cursor.value)
        } else {
          userStore.get(creator.number).onsuccess = function (userEvent) {
            const record = userEvent.target.result;
            if (record) {
              creator.photo = record.photoURL;
              listStore.put(cursor.value);
            }
          }
        }   
        cursor.continue();
      }

      transaction.oncomplete = function () {
        resolve(true);
      }

      transaction.onerror = function () {
        reject(transaction.error);
      }
    }
  })
}

function successResponse(read, swipeInfo) {
  console.log(swipeInfo)
  const user = firebase.auth().currentUser

  const request = indexedDB.open(user.uid)
  const removeActivitiesForUser = []
  const removeActivitiesForOthers = []
  request.onsuccess = function () {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const rootObjectStoreTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootObjectStoreTx.objectStore('root')
    const activitytx = db.transaction(['activity'], 'readwrite')
    const activityObjectStore = activitytx.objectStore('activity')

    let counter = {}


    //testing
    read.addendum.forEach(function (addendum) {
      if (addendum.unassign) {

        if (addendum.user == firebase.auth().currentUser.phoneNumber) {
          removeActivitiesForUser.push(addendum.activityId)
        } else {
          removeActivitiesForOthers.push({
            id: addendum.activityId,
            user: addendum.user
          })
        }
      }
      let key = addendum.activityId
      counter[key] = (counter[key] || 0) + 1
      addendumObjectStore.add(addendum)
    })

    removeActivityFromDB(db, removeActivitiesForUser);
    removeUserFromAssigneeInActivity(db, removeActivitiesForOthers);



    read.activities.forEach(function (activity) {
      // put activity in activity object store

      if (activity.canEdit) {
        activity.editable = 1
        activityObjectStore.put(activity)
      } else {
        activity.editable = 0
        activityObjectStore.put(activity)
      }
      if (activity.hidden === 0) {
        createListStore(activity,counter)
      }

      updateMap(activity)

      updateCalendar(activity)
      // put each assignee (number) in the users object store

      putAssignessInStore(db, activity.assignees)
      // put attachemnt in the attachment object store
      putAttachment(db, activity)
    })


    read.templates.forEach(function (subscription) {
      updateSubscription(db, subscription)
    })

    rootObjectStore.get(user.uid).onsuccess = function (event) {
      createUsersApiUrl(db).then(updateUserObjectStore);
      getUniqueOfficeCount().then(setUniqueOffice).catch(console.log);

      const record = event.target.result
      record.fromTime = read.upto
      rootObjectStore.put(record);

      updateListStoreWithCreatorImage(counter).then(function () {
        requestHandlerResponse('updateIDB', 200, swipeInfo);
      })
    }
  }
}


function getUniqueOfficeCount() {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)

  let offices = []
  return new Promise(function (resolve, reject) {
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
      req.onerror = function (event) {
        reject(event.error)
      }
    }
  })
}

function setUniqueOffice(offices) {
  const dbName = firebase.auth().currentUser.uid
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
      console.log("all offices are set")
    }
  }
}

function updateIDB(param) {

  const req = indexedDB.open(param.dbName)
  console.log(param.dbName);
  console.log(param.swipe);


  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root');
    
    console.log(rootObjectStore)
    rootObjectStore.get(param.dbName).onsuccess = function (root) {
      console.log(root)
      http(
          'GET',
          `${apiUrl}read?from=${root.target.result.fromTime}`
        )
        .then(function (response) {
          if (!response) return;
     
          successResponse(response, param.swipe)
        })
        .catch(function (error) {

          instant(createLog(error));
        })
    }
    
  }
}