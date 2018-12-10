// import firebase app script because there is no native support of firebase inside web workers

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

firebase.initializeApp({
  apiKey: "AIzaSyCoGolm0z6XOtI_EYvDmxaRJV_uIVekL_w",
  authDomain: "growthfilev2-0.firebaseapp.com",
  databaseURL: "https://growthfilev2-0.firebaseio.com",
  projectId: "growthfilev2-0",
  storageBucket: "growthfilev2-0.appspot.com",
  messagingSenderId: "1011478688238"
})


// when worker receives the request body from the main thread
self.onmessage = function(event) {
  firebase.auth().onAuthStateChanged(function(auth) {

    if (event.data.type === 'now') {
      fetchServerTime(event.data.body).then(initializeIDB).then(updateIDB).catch(console.log)
      return
    }
    if (event.data.type === 'instant') {
      instant(event.data.body)
      return
    }
    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(console.log)
  })
}


// Performs XMLHTTPRequest for the API's.

function http(method, url, data) {
  return new Promise(function(resolve, reject) {
    firebase
      .auth()
      .currentUser
      .getIdToken()
      .then(function(idToken) {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url, true)

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)

        xhr.onreadystatechange = function() {
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
      }).catch(function(error) {

        instant(createLog(error))
      })
  })
}

function fetchServerTime(deviceInfo) {
  currentDevice = deviceInfo;
  const parsedDeviceInfo = JSON.parse(deviceInfo);

  console.log(typeof parsedDeviceInfo.appVersion)
  return new Promise(function(resolve) {
    http(
      'GET',
      `${apiUrl}now?deviceId=${parsedDeviceInfo.id}&appVersion=${parsedDeviceInfo.appVersion}&os=${parsedDeviceInfo.baseOs}`
    ).then(function(response) {
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
      }

      resolve(response.timestamp)
    }).catch(function(error) {
      instant(createLog(error))
    })
  })
}

function instant(error) {
  console.log(error)
  // http(
  //   'POST',
  //   `${apiUrl}services/logs`,
  //   error
  // ).then(function (response) {
  //   console.log(response)
  // }).catch(console.log)
}


/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */


function fetchRecord(dbName, id) {
  return new Promise(function(resolve) {

    const req = indexedDB.open(dbName)
    req.onsuccess = function(event) {
      const db = req.result
      const objStore = db.transaction('activity').objectStore('activity')
      objStore.get(id).onsuccess = function(event) {

        resolve(event.target.result)
      }
    }
  })
}


function initializeIDB(serverTime) {
  console.log("init db")
  // onAuthStateChanged is added because app is reinitialized
  return new Promise(function(resolve, reject) {
    var auth = firebase.auth().currentUser

    const request = indexedDB.open(auth.uid)


    request.onerror = function(event) {
      reject(event.error)
    }


    request.onupgradeneeded = function(evt) {
      console.log(evt)
      const db = request.result
      const activity = db.createObjectStore('activity', {
        keyPath: 'activityId'
      })

      activity.createIndex('timestamp', 'timestamp')
      activity.createIndex('office', 'office')

      activity.createIndex('hidden', 'hidden')

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
      // addendum.createIndex('timestamp', 'timestamp')

      const activityCount = db.createObjectStore('activityCount', {
        keyPath: 'activityId'
      })
      activityCount.createIndex('count', 'count')

      const subscriptions = db.createObjectStore('subscriptions', {
        autoIncrement: true
      })

      subscriptions.createIndex('office', 'office')
      subscriptions.createIndex('template', 'template')
      subscriptions.createIndex('officeTemplate', ['office', 'template'])

      const calendar = db.createObjectStore('calendar', {
        autoIncrement: true
      })

      // calendar.createIndex('date', 'date')
      calendar.createIndex('activityId', 'activityId')
      // calendar.createIndex('isUpdated', 'isUpdated')
      calendar.createIndex('timestamp', 'timestamp')
      calendar.createIndex('start', 'start')
      calendar.createIndex('end', 'end')
      calendar.createIndex('range', ['start', 'end'])
      calendar.createIndex('status', 'PENDING')

      const map = db.createObjectStore('map', {
        autoIncrement: true
      })
      map.createIndex('activityId', 'activityId')
      map.createIndex('location', 'location')

      map.createIndex('latitude', 'latitude')
      map.createIndex('longitude', 'longitude')
      map.createIndex('range', ['latitude', 'longitude'])
      map.createIndex('distance', 'distance')

      const children = db.createObjectStore('children', {
        keyPath: 'activityId'
      })

      children.createIndex('template', 'template')
      children.createIndex('office', 'office')

      const root = db.createObjectStore('root', {
        keyPath: 'uid'
      })


      root.put({
        uid: auth.uid,
        fromTime: 0,
        provider: '',
        latitude: '',
        longitude: '',
        accuracy: '',
        lastLocationTime: ''
      })
      requestHandlerResponse('manageLocation')
    }

    request.onsuccess = function() {

      const rootTx = request.result.transaction('root', 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(auth.uid).onsuccess = function(event) {
        const record = event.target.result
        record.serverTime = serverTime - Date.now()
        rootObjectStore.put(record)
      }
      rootTx.oncomplete = function() {
        resolve({
          dbName: auth.uid,
          swipe: 'false'
        })
      }

    }
  })
}

function comment(body) {
  console.log(body)
  return new Promise(function(resolve, reject) {
    http(
      'POST',
      `${apiUrl}activities/comment`,
      JSON.stringify(body)
    ).then(function() {
      // requestHandlerResponse('notification', 200, 'comment added successfully', firebase.auth().currentUser.uid)
      resolve({
        dbName: firebase.auth().currentUser.uid,
        swipe: 'false'
      })
    }).catch(function(error) {

      instant(createLog(error))

    })
  })
}

function statusChange(body) {
  console.log(body)
  const dbName = firebase.auth().currentUser.uid

  return new Promise(function(resolve, reject) {
    fetchRecord(dbName, body.activityId).then(function(originalRecord) {
      http(
        'PATCH',
        `${apiUrl}activities/change-status`,
        JSON.stringify(body),
        originalRecord
      ).then(function(success) {
        instantUpdateDB(dbName, body, 'status')

        requestHandlerResponse('notification', 200, 'status changed successfully', dbName)

        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      }).catch(function(error) {
        instant(createLog(error))

      })
    })
  })

}


function share(body) {
  const dbName = firebase.auth().currentUser.uid


  return new Promise(function(resolve, reject) {

    http(
        'PATCH',
        `${apiUrl}activities/share`,
        JSON.stringify(body))
      .then(function(success) {
        instantUpdateDB(dbName, body, 'share')
        requestHandlerResponse('notification', 200, 'assignne added successfully', dbName)
        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function(error) {
        instant(createLog(error))
      })

  })
}


function Null(swipe) {
  console.log(swipe)
  return new Promise(function(resolve, reject) {
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

  return new Promise(function(resolve, reject) {
    http(
        'PATCH',
        `${apiUrl}activities/update`,
        JSON.stringify(body)
      )
      .then(function(success) {
        instantUpdateDB(dbName, body, 'update')
        requestHandlerResponse('notification', 200, 'activity update successfully', dbName)

        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function(error) {

        instant(createLog(error))
      })
  })

}

function create(body) {
  console.log(body)
  return new Promise(function(resolve, reject) {
    http(
        'POST',
        `${apiUrl}activities/create`,
        JSON.stringify(body)
      )
      .then(function(success) {
        requestHandlerResponse('notification', 200, 'activity created successfully', firebase.auth().currentUser.uid)

        requestHandlerResponse('redirect-to-list', 200, '', firebase.auth().currentUser.uid)
        resolve({
          dbName: firebase.auth().currentUser.uid,
          swipe: 'false'
        })
      })
      .catch(function(error) {
        console.log(error)
        instant(createLog(error))
      })
  })
}


function instantUpdateDB(dbName, data, type) {
  console.log(data)
  const req = indexedDB.open(dbName)
  req.onsuccess = function(event) {
    const db = req.result
    const objStoreTx = db.transaction(['activity'], 'readwrite')
    const objStore = objStoreTx.objectStore('activity')
    objStore.get(data.activityId).onsuccess = function(event) {
      const record = event.target.result
      record.editable = 0


      if (type === 'share') {
        record.assignees.push(data.share[0])
        objStore.put(record)
        console.log(record)
      }
      if (type === 'update') {

        // const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')
        // activityStore.get(data.activityId).onsuccess = function (event) {
        //   const record = event.target.result
        //   const updateData = data
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
    objStoreTx.oncomplete = function() {

      if (type === 'status' || type === 'update') {
        requestHandlerResponse('redirect-to-list', 200, '')
      }
      if (type === 'share') {

        requestHandlerResponse('updateAssigneesList', 200, 'update user', {
          id: data.activityId,
          number: data.share[0]
        })
      }

    }
  }
}

function updateMapWithNoStatus(db, activity) {
  return new Promise(function(resolve, reject) {
    const mapTx = db.transaction(['map'], 'readwrite')
    const mapObjectStore = mapTx.objectStore('map')

    const resultsWithoutStatus = []
    mapObjectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status) {
        cursor.continue();
        return;
      }
      if (cursor.value.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.hidden) {
        cursor.continue();
        return;
      }

      resultsWithoutStatus.push(cursor.value);
      cursor.delete();
      cursor.continue();
    }

    mapTx.oncomplete = function() {
      const activityTx = db.transaction(['activity'], 'readwrite');
      const activityStore = activityTx.objectStore('activity');
      console.log(resultsWithoutStatus);
      resultsWithoutStatus.forEach(function(data) {
        activityStore.get(data.activityId).onsuccess = function(event) {
          const record = event.target.result;
          if (record) {
            const transaction = db.transaction(['map'], 'readwrite');
            const mapObjectStore = transaction.objectStore('map');
            data.status = record.status;
            data.hidden = record.hidden;
            data.office = record.office;
            mapObjectStore.put(data);
          }
        }
      });
      activityTx.oncomplete = function() {
        resolve(true)
      }
    }
  })
}


function updateMap(db, activity) {
  updateMapWithNoStatus(db, activity).then(function() {
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function() {
      const db = req.result;
      const mapTx = db.transaction(['map'], 'readwrite')
      const mapObjectStore = mapTx.objectStore('map')
      const mapActivityIdIndex = mapObjectStore.index('activityId')
      mapActivityIdIndex.openCursor(activity.activityId).onsuccess = function(event) {
        const cursor = event.target.result
        if (cursor) {

          let deleteRecordReq = cursor.delete()
          cursor.continue()
          deleteRecordReq.onerror = errorDeletingRecord
        }
      }

      mapTx.oncomplete = function() {
        const mapTx = db.transaction(['map'], 'readwrite')
        const mapObjectStore = mapTx.objectStore('map')

        activity.venue.forEach(function(newVenue) {
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
  }).catch(console.log)
}

function errorDeletingRecord(event) {
  console.log(event.target.error)
}

function transactionError(event) {
  console.log(event.target.error)
}

function updateCalendarWithNoStatus(db, activity) {
  return new Promise(function(resolve, reject) {
    const calTx = db.transaction(['calendar'], 'readwrite')
    const calendarObjectStore = calTx.objectStore('calendar')

    const resultsWithoutStatus = []
    calendarObjectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (cursor.value.status) {
        cursor.continue();
        return;
      }
      if (cursor.value.office) {
        cursor.continue();
        return;
      }

      resultsWithoutStatus.push(cursor.value);
      cursor.delete();
      cursor.continue();
    }

    calTx.oncomplete = function() {
      const activityTx = db.transaction(['activity'], 'readwrite');
      const activityStore = activityTx.objectStore('activity');
      console.log(resultsWithoutStatus);
      resultsWithoutStatus.forEach(function(data) {
        activityStore.get(data.activityId).onsuccess = function(event) {
          const record = event.target.result;
          if (record) {
            const transaction = db.transaction(['calendar'], 'readwrite');
            const calendarStore = transaction.objectStore('calendar');
            data.status = record.status;
            data.office = record.office;
            calendarStore.put(data);
          }
        }
      });
      activityTx.oncomplete = function() {
        resolve(true)
      }
    }
  })
}

function updateCalendar(db, activity) {
  updateCalendarWithNoStatus(db, activity).then(function() {
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function() {
      const db = req.result;
      const calendarTx = db.transaction(['calendar'], 'readwrite')
      const calendarObjectStore = calendarTx.objectStore('calendar')
      const calendarActivityIndex = calendarObjectStore.index('activityId')

      calendarActivityIndex.openCursor(activity.activityId).onsuccess = function(event) {
        // console.log(activity.activityId)
        const cursor = event.target.result
        if (cursor) {
          let recordDeleteReq = cursor.delete()
          recordDeleteReq.onerror = errorDeletingRecord
          cursor.continue()
        }
      }
      calendarTx.oncomplete = function() {
        const calendarTx = db.transaction(['calendar'], 'readwrite')
        const calendarObjectStore = calendarTx.objectStore('calendar')

        activity.schedule.forEach(function(schedule) {
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
  }).catch(console.log)
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

  assigneeArray.forEach(function(assignee) {
    const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')
    usersObjectStore.openCursor(assignee).onsuccess = function(event) {
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
  const activityTx = db.transaction('activity', 'readwrite')
  const activityObjectStore = activityTx.objectStore('activity')
  userActivityId.forEach(function(data) {
    activityObjectStore.get(data.id).onsuccess = function(event) {
      const record = event.target.result;
      if (!record) {
        console.log('acitvity does not exist')
        return;
      } else {
        const indexOfUser = record.assignees.indexOf(data.user)
        if (indexOfUser > -1) {
          record.assignees.splice(indexOfUser, 1)
        }
        activityObjectStore.put(record)
      }
    }
  })
  activityTx.oncomplete = function() {
    console.log('user removed from assignee in activity where he once was if that activity existed')
  }
}

function removeActivityFromDB(db, myActivities) {
  if (!myActivities.length) return;
  const activityTx = db.transaction('activity', 'readwrite')
  const activityObjectStore = activityTx.objectStore('activity')
  let deleteReq;
  myActivities.forEach(function(id) {
    deleteReq = activityObjectStore.delete(id)
    deleteReq.onsuccess = function(event) {
      console.log(event)
      console.log('record removed')
    }
  })

  activityTx.oncomplete = function() {
    console.log('all activities removed')
    removeActivityFromKeyPath(myActivities)
  }

}

function removeActivityFromKeyPath(activitiesToRemove) {

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let countDeleteReq;
  let childrenDeleteReq;
  req.onsuccess = function() {
    const db = req.result
    const tx = db.transaction(['activityCount', 'children'], 'readwrite')
    const activityCountObjectStore = tx.objectStore('activityCount');
    const chidlrenObjectStore = tx.objectStore('children');

    activitiesToRemove.forEach(function(id) {
      activityCountObjectStore.delete(id);
      chidlrenObjectStore.delete(id);
    })

    tx.oncomplete = function() {
      mapAndCalendarRemovalRequest(activitiesToRemove)
    }
  }
}

function mapAndCalendarRemovalRequest(activitiesToRemove) {


  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function() {
    const db = req.result;

    const tx = db.transaction(['calendar', 'map'], 'readwrite')
    const calendarObjectStore = tx.objectStore('calendar').index('activityId')
    const mapObjectStore = tx.objectStore('map').index('activityId')

    const calendarRemoval = deleteByIndex(calendarObjectStore, activitiesToRemove)
    const mapRemoval = deleteByIndex(mapObjectStore, activitiesToRemove)

    Promise.all([calendarRemoval, mapRemoval]).then(function(message) {}).catch(function(error) {
      instant(JSON.stringify({
        message: error
      }))
    })
  }
}


function deleteByIndex(store, activitiesToRemove) {
  return new Promise(function(resolve, reject) {
    store.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if (!cursor) {
        resolve('all records removed')
        return
      }

      if (activitiesToRemove.indexOf(cursor.key) > -1) {
        cursor.delete()
      }
      cursor.continue()
    }


    store.onerror = function(event) {
      reject(event)
    }

  })
}




function createUsersApiUrl(db) {
  const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')
  const isUpdatedIndex = usersObjectStore.index('isUpdated')
  const NON_UPDATED_USERS = 0
  let assigneeString = ''

  const defaultReadUserString = `${apiUrl}services/users?q=`
  let fullReadUserString = ''

  return new Promise(function(resolve) {


    isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function(event) {
      const cursor = event.target.result

      if (!cursor) {
        fullReadUserString = `${defaultReadUserString}${assigneeString}`
        if (assigneeString) {

          resolve({
            db: db,
            url: fullReadUserString,
          })
        }
        return
      }
      const assigneeFormat = `%2B${cursor.value.mobile}&q=`
      assigneeString += `${assigneeFormat.replace('+', '')}`
      cursor.continue()
    }

  })
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore(successUrl) {
  http(
      'GET',
      successUrl.url
    )
    .then(function(userProfile) {
      console.log(userProfile)
      if (!Object.keys(userProfile).length) return
      const usersObjectStore = successUrl.db.transaction('users', 'readwrite').objectStore('users')
      const isUpdatedIndex = usersObjectStore.index('isUpdated')
      const USER_NOT_UPDATED = 0
      const USER_UPDATED = 1

      isUpdatedIndex.openCursor(USER_NOT_UPDATED).onsuccess = function(event) {
        const cursor = event.target.result

        if (!cursor) {
          // requestHandlerResponse('notification', 200, 'user object store modified', successUrl.db.name)
          return
        }
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

    }).catch(function(error) {
      instant(createLog(error))
    })
}

function findSubscriptionCount(db) {
  return new Promise(function(resolve, reject) {

    const tx = db.transaction(['subscriptions'], 'readwrite');
    const subscriptionObjectStore = tx.objectStore('subscriptions');
    const request = subscriptionObjectStore.count();
    request.onsuccess = function() {
      resolve(request.result)
    }
    request.onerror = function() {
      reject(request.error)
    }
  })
}

function updateSubscription(db, subscription) {

  findSubscriptionCount(db).then(function(count) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function() {
      const db = req.result;
      const tx = db.transaction(['subscriptions'], 'readwrite')
      const subscriptionObjectStore = tx.objectStore('subscriptions');
      const templateIndex = subscriptionObjectStore.index('template');
      if (!count) {
        subscriptionObjectStore.put(subscription)
        return;
      }
      templateIndex.openCursor(subscription.template).onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {

          if (subscription.office === cursor.value.office) {

            cursor.delete()
          }
          cursor.continue()
        }
      }

      tx.oncomplete = function() {
        const req = indexedDB.open(firebase.auth().currentUser.uid)
        req.onsuccess = function() {
          const db = req.result;
          const store = db.transaction('subscriptions', 'readwrite').objectStore('subscriptions')
          store.put(subscription);
        }
      }
    }

  }).catch(console.log)



}

// after getting the responseText from the read api , insert addendum into the
// corresponding object store. for each activity present inside the activities
// array in response perform the put operations. for each template present
// inside the templates array in response perform the updat subscription logic.
// after every operation is done, update the root object sotre's from time value
// with the uptoTime received from response.

let firstTime = 0;

function successResponse(read, swipeInfo) {
  console.log(swipeInfo)
  const user = firebase.auth().currentUser

  const request = indexedDB.open(user.uid)
  const removeActivitiesForUser = []
  const removeActivitiesForOthers = []
  request.onsuccess = function() {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const rootObjectStoreTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootObjectStoreTx.objectStore('root')
    const activitytx = db.transaction(['activity'], 'readwrite')
    const activityObjectStore = activitytx.objectStore('activity')
    const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
    let counter = {}
    firstTime++

    //testing


    read.addendum.forEach(function(addendum) {
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

    Object.keys(counter).forEach(function(count) {
      activityCount.put({
        activityId: count,
        count: counter[count]
      })
    })
    const activityPar = []
    read.activities.forEach(function(activity) {
      // put activity in activity object store
      if (activity.canEdit) {
        activity.editable = 1
        activityObjectStore.put(activity)
      } else {
        activity.editable = 0
        activityObjectStore.put(activity)
      }

      activityPar.push(activity.activityId)

      updateMap(db, activity)

      updateCalendar(db, activity)

      // put each assignee (number) in the users object store

      putAssignessInStore(db, activity.assignees)

      // put attachemnt in the attachment object store

      putAttachment(db, activity)
    })


    read.templates.forEach(function(subscription) {
      updateSubscription(db, subscription)
    })

    rootObjectStore.get(user.uid).onsuccess = function(event) {
      const record = event.target.result
      getUniqueOfficeCount(record.fromTime, swipeInfo).then(setUniqueOffice).catch(console.log)

      record.fromTime = read.upto
      rootObjectStore.put(record)
      createUsersApiUrl(db).then(updateUserObjectStore)

      if (record.fromTime !== 0) {
        // setTimeout(function(){
        requestHandlerResponse('updateIDB', 200, swipeInfo);
        // },)
      }
    }
  }
}


function getUniqueOfficeCount(firstTime, swipeInfo) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let officeCount = 0
  let offices = []
  return new Promise(function(resolve, reject) {
    req.onsuccess = function() {
      const db = req.result
      const activityStore = db.transaction('activity').objectStore('activity').index('office')
      activityStore.openCursor(null, 'nextunique').onsuccess = function(event) {
        const cursor = event.target.result
        if (!cursor) {
          resolve({
            dbName: dbName,
            count: officeCount,
            allOffices: offices,
            firstTime: firstTime,
            swipe: swipeInfo
          })
          return
        }
        offices.push(cursor.value.office)
        officeCount++
        cursor.continue()
      }
    }
    req.onerror = function(event) {
      console.log("error in 1007 bitch")
      reject(event.error)
    }
  })
}

function setUniqueOffice(data) {
  const req = indexedDB.open(data.dbName)
  const offices = {
    'hasMultipleOffice': '',
    'allOffices': data.allOffices
  }
  req.onsuccess = function() {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(data.dbName).onsuccess = function(event) {
      const record = event.target.result
      if (data.count === 1) {
        offices.hasMultipleOffice = 0
        record.offices = offices
        rootObjectStore.put(record)
        if (data.firstTime === 0) {
          setTimeout(function() {
            requestHandlerResponse('updateIDB', 200, data.swipe)
          }, 1000)
        }
        return
      }
      offices.hasMultipleOffice = 1
      record.offices = offices
      rootObjectStore.put(record)
      if (data.firstTime === 0) {
        setTimeout(function() {
          requestHandlerResponse('updateIDB', 200, data.swipe)
        }, 1000)
      }
    }
  }
}

function updateIDB(param) {

  const req = indexedDB.open(param.dbName)
  console.log(param.dbName);
  console.log(param.swipe);


  req.onsuccess = function() {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root')
    console.log(rootObjectStore)
    rootObjectStore.get(param.dbName).onsuccess = function(root) {
      console.log(root)
      http(
          'GET',
          `${apiUrl}read?from=${root.target.result.fromTime}`
        )
        .then(function(response) {
          if (!response) return;
          successResponse(response, param.swipe)
        })
        .catch(function(error) {

          instant(createLog(error));
        })
    }
  }
}
