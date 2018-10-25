// "use strict";

/* eslint-env worker */
// import firebase app script because there is no native support of firebase inside web workers


importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js')
// Backend API Url
const apiUrl = 'https://us-central1-growthfile-207204.cloudfunctions.net/api/'

/** reinitialize the firebase app */

firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
})



// get Device time
function getTime() {
  return Date.now()
}

// dictionary object with key as the worker's onmessage event data and value as
// function name
const requestFunctionCaller = {
  initializeIDB: initializeIDB,
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

function createLog(message, body) {
  const logs = {
    message: message,
    body: body
  }
  return logs
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
    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(console.log)

  })
}

// Performs XMLHTTPRequest for the API's.

function http(method, url, data) {
  return new Promise(function (resolve, reject) {
    firebase
      .auth()
      .currentUser
      .getIdToken()
      .then(function (idToken) {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url, true)

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status > 226) {
              const errorObject = JSON.parse(xhr.response)

              requestHandlerResponse('error', errorObject.code, errorObject.message)

              return reject(JSON.parse(xhr.response))
              // return reject(xhr)
            }
            if (!xhr.responseText) return resolve('success')
            resolve(JSON.parse(xhr.responseText))
          }
        }

        xhr.send(data || null)
      }).catch(function (error) {
        instant(createLog(error.message))
      })
  })
}

function fetchServerTime(deviceInfo) {
  deviceInfo = JSON.parse(deviceInfo).split("&")
  const deviceObject = {
    deviceId: deviceInfo[0],
    brand: deviceInfo[1],
    model: deviceInfo[2],
    os: deviceInfo[3]
  }

  return new Promise(function (resolve) {
    http(
      'GET',
      `${apiUrl}now?deviceId=${deviceObject.deviceId}`
    ).then(function (response) {
      if (response.revokeSession) {
        firebase.auth().signOut().then(function () {
          const req = indexedDB.deleteDatabase(firebase.auth().currentUser.uid)
          req.onsuccess = function () {
            requestHandlerResponse('removeLocalStorage')
          }
          req.onerror = function () {
            instant(createLog(error))
          }
        }, function (error) {
          instant(createLog(error))
        })
        return
      }
      resolve(response.timestamp)
    }).catch(function (error) {
      instant(createLog(error.message, deviceObject))
    })
  })
}

function instant(error) {

  http(
    'POST',
    `${apiUrl}services/logs`,
    JSON.stringify(error)
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


function initializeIDB(serverTime) {
  console.log("init db")
  // onAuthStateChanged is added because app is reinitialized
  // let hasFirstView = true
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser

    const request = indexedDB.open(auth.uid)

    request.onerror = function (event) {
      reject(event.error)
    }

    request.onupgradeneeded = function () {
      const db = request.result
      hasFirstView = false
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

      const map = db.createObjectStore('map', {
        autoIncrement: true
      })
      map.createIndex('activityId', 'activityId')
      map.createIndex('location', 'location')
      // map.createIndex('address', 'address')
      // map.createIndex('office', 'office')
      // map.createIndex('timestamp', 'timestamp')
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
        view: 'list'
      })
    }

    request.onsuccess = function () {

      const rootTx = request.result.transaction('root', 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(auth.uid).onsuccess = function (event) {
        const record = event.target.result
        record.serverTime = serverTime - Date.now()
        rootObjectStore.put(record)
      }
      rootTx.oncomplete = function () {
        resolve(auth.uid)
      }

    }
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
      resolve(firebase.auth().currentUser.uid)
    }).catch(function (error) {

      instant(createLog(error.message))

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

        resolve(
          firebase.auth().currentUser.uid
        )
      }).catch(function (error) {
        instant(createLog(error.message))

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
        resolve(
          firebase.auth().currentUser.uid
        )
      })
      .catch(function (error) {
        instant(createLog(error.message, body))
      })

  })
}


function Null(swipe) {
  return new Promise(function (resolve, reject) {
    const user = firebase.auth().currentUser
    if (!user) {
      reject(null)
      return
    }
    if(swipe && swipe === "true") {
      console.log(JSON.parse(swipe))
      requestHandlerResponse('reset-offset')
    }
    console.log("Null Ran")
    resolve(user.uid)
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

        resolve(firebase.auth().currentUser.uid)
      })
      .catch(function (error) {
        instant(createLog(error.message, body))
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

        requestHandlerResponse('redirect-to-list', 200, 'activity created successfully', firebase.auth().currentUser.uid)
        resolve(firebase.auth().currentUser.uid)
      })
      .catch(function (error) {
        instant(createLog(error.message, body))
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

      // if (type === 'remove') {
      //   const index = record.assignees.indexOf(data.remove)
      //   record.assignees.splice(index, 1)
      //   objStore.put(record)
      // }
      if (type === 'share') {
        record.assignees.push(data.share[0])
        objStore.put(record)
        console.log(record)
      }
      if (type === 'update') {

        const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')
        activityStore.get(data.activityId).onsuccess = function (event) {
          const record = event.target.result
          const updateData = data

          for (var i = 0; i < record.venue.length; i++) {
            record.venue[i].geopoint = {
              '_latitude': data.venue[i].geopoint['_latitude'],
              '_longitude': data.venue[i].geopoint['_longitude']
            }
          }
          activityStore.put(record)
        }
      }
      if (type === 'status') {

        record[type] = data[type]
        objStore.put(record)
      }

    }
    objStoreTx.oncomplete = function () {

      if (type === 'status' || type === 'update') {
        requestHandlerResponse('redirect-to-list', 200, 'activity status changed')
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

function resetInstantDB(resetBody) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const objStore = db.transaction('activity', 'readwrite').objectStore('activity')
    // const objStore = objStoreTx.objectStore('activity')
    //
    console.log(resetBody)
    objStore.get(resetBody.activityId).onsuccess = function (event) {
      let record = event.target.result
      console.log(record)
      record = resetBody
      console.log(record)
      objStore.put(record)
      requestHandlerResponse('updateIDB', 200, 'activity updated to default state', dbName)
    }

    // objStoreTx.oncomplete = function(){
    // }
  }
}

function updateMap(db, activity) {
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

      })
    })

  }
  mapTx.onerror = errorDeletingRecord
}

function errorDeletingRecord(event) {
  console.log(event.target.error)
}

function transactionError(event) {
  console.log(event.target.error)
}

function updateCalendar(db, activity) {
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
    // const calendarActivityIndex = calendarObjectStore.index('activityId')
    // const calendarIsUpdatedIndex = calendarObjectStore.index('isUpdated')

    activity.schedule.forEach(function (schedule) {
      const startTime = moment(schedule.startTime).toDate()
      const endTime = moment(schedule.endTime).toDate()

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
      })
    })

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

  }

  calendarTx.onerror = transactionError
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
  if (assigneeArray.indexOf(firebase.auth().currentUser.phoneNumber) == -1) {
    removeActivityFromDB(db)
    return
  }
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

function removeActivityFromDB(db) {
  const activitiesToRemove = []
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  const myNumber = firebase.auth().currentUser.phoneNumber
  activityObjectStore.openCursor().onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      removeActivityFromKeyPath(activitiesToRemove, 'activityCount')
      return
    }

    if (cursor.value.assignees.indexOf(myNumber) == -1) {
      activitiesToRemove.push(cursor.value.activityId)
      cursor.delete()
    }
    cursor.continue()
  }

}

function removeActivityFromKeyPath(activitiesToRemove, store) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const activityStore = db.transaction(store).objectStore(store)
    activitiesToRemove.forEach(function (id) {
      activityStore.delete(id)
    })

    if (store === 'activityCount') {
      removeActivityFromCalendar(activitiesToRemove, db)

    }
  }
}

function removeActivityFromCalendar(activitiesToRemove, db) {
  const calendarObjectStore = db.transaction('calendar').objectStore('calendar').index('activityId')
  let count = 0
  activitiesToRemove.forEach(function (id) {
    count++
    calendarObjectStore.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        if (count === activitiesToRemove.length) {
          removeActivityFromMap(activitiesToRemove)
          return
        }
        return
      }
      cursor.delete()
      cursor.continue()
    }
  })
}

function removeActivityFromMap(activitiesToRemove) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let count = 0
  req.onsuccess = function () {
    const db = req.result
    const mapObjectStore = db.transaction('map').objectStore('map').index('activityId')
    activitiesToRemove.forEach(function (id) {
      count++
      mapObjectStore.openCursor(id).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {
          if (count === activitiesToRemove.length) {
            removeActivityFromKeyPath(activitiesToRemove, 'children')
            removeActivityFromAddendum(activitiesToRemove)
            return
          }
          return
        }
        cursor.delete()
        cursor.continue()
      }
    })
  }
}

function removeActivityFromAddendum(activitiesToRemove) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const addendumObjectStore = db.transaction('addendum').objectStore('addendum').index('activityId')
    activitiesToRemove.forEach(function (id) {
      addendumObjectStore.openCursor(id).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return
        cursor.delete()
        cursor.continue()
      }
    })
  }
}

function updateOneUser(db){
  const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')

}

function createUsersApiUrl(db) {
  const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')
  const isUpdatedIndex = usersObjectStore.index('isUpdated')
  const NON_UPDATED_USERS = 0
  let assigneeString = ''

  const defaultReadUserString = `${apiUrl}services/users/read?q=`
  let fullReadUserString = ''

  return new Promise(function (resolve) {
 

      isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function (event) {
        const cursor = event.target.result
        
        if (!cursor) {
          fullReadUserString = `${defaultReadUserString}${assigneeString}`
          console.log(fullReadUserString)
          resolve({
            db: db,
            url: fullReadUserString,
          })
          return
        }
        console.log(cursor.value.mobile)
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
  .then(function (userProfile) {
    console.log(userProfile)

    const usersObjectStore = successUrl.db.transaction('users', 'readwrite').objectStore('users')
    const isUpdatedIndex = usersObjectStore.index('isUpdated')
    const USER_NOT_UPDATED = 0
    const USER_UPDATED = 1

      isUpdatedIndex.openCursor(USER_NOT_UPDATED).onsuccess = function (event) {
        const cursor = event.target.result
        
        if (!cursor) {
          // requestHandlerResponse('notification', 200, 'user object store modified', successUrl.db.name)
          return
        }
        
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
    
    }).catch(console.log)
  }
  
  function updateSubscription(db, subscription) {
    const subscriptionObjectStore = db
    .transaction('subscriptions', 'readwrite')
    .objectStore('subscriptions')

  const templateIndex = subscriptionObjectStore.index('template')

  templateIndex.get(subscription.template).onsuccess = function (templateEvent) {
    if (!templateEvent.target.result) {
      subscriptionObjectStore.add(subscription)
      return
    }


    templateIndex.openCursor(subscription.template).onsuccess = function (event) {
      const cursor = event.target.result
      if (subscription.office !== cursor.value.office) {
        subscriptionObjectStore.add(subscription)
        return;
      }
      cursor.delete()
      subscriptionObjectStore.add(subscription)
    }

  }
}

// after getting the responseText from the read api , insert addendum into the
// corresponding object store. for each activity present inside the activities
// array in response perform the put operations. for each template present
// inside the templates array in response perform the updat subscription logic.
// after every operation is done, update the root object sotre's from time value
// with the uptoTime received from response.

let firstTime = 0;

function successResponse(read) {
  console.log('start success')
  const user = firebase.auth().currentUser

  const request = indexedDB.open(user.uid)

  request.onsuccess = function () {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const rootObjectStoreTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootObjectStoreTx.objectStore('root')
    const activitytx = db.transaction(['activity'], 'readwrite')
    const activityObjectStore = activitytx.objectStore('activity')
    const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
    const activityAndRoot = db.transaction(['activity', 'root'])
    let counter = {}
    firstTime++
    read.addendum.forEach(function (addendum) {
      let key = addendum.activityId
      counter[key] = (counter[key] || 0) + 1
      addendumObjectStore.add(addendum)
    })

    Object.keys(counter).forEach(function (count) {
      activityCount.put({
        activityId: count,
        count: counter[count]
      })
    })
    const activityPar = []
    read.activities.forEach(function (activity) {
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


    read.templates.forEach(function (subscription) {
      updateSubscription(db, subscription)
    })






    rootObjectStore.get(user.uid).onsuccess = function (event) {
      const record = event.target.result
      getUniqueOfficeCount(record.fromTime).then(setUniqueOffice).catch(console.log)

      record.fromTime = Date.parse(read.upto)
      rootObjectStore.put(record)
      if (record.fromTime !== 0) {
        requestHandlerResponse('updateIDB', 200);
      }
    }
    createUsersApiUrl(db).then(updateUserObjectStore, notUpdateUserObjectStore)
  }
}


function notUpdateUserObjectStore(errorUrl) {
  console.log(errorUrl)
}

function getUniqueOfficeCount(firstTime) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let officeCount = 0
  let offices = []
  return new Promise(function (resolve, reject) {
    req.onsuccess = function () {
      const db = req.result
      const subscriptionOffice = db.transaction('subscriptions').objectStore('subscriptions').index('office')
      subscriptionOffice.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {
          resolve({
            dbName: dbName,
            count: officeCount,
            allOffices: offices,
            firstTime: firstTime
          })
          return
        }
        offices.push(cursor.value.office)
        officeCount++
        cursor.continue()
      }
    }
    req.onerror = function (event) {
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
  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(data.dbName).onsuccess = function (event) {
      const record = event.target.result
      if (data.count === 1) {
        offices.hasMultipleOffice = 0
        record.offices = offices
        rootObjectStore.put(record)
        if (data.firstTime === 0) {

          requestHandlerResponse('updateIDB', 200, 'update successfull')
        }

        return
      }
      offices.hasMultipleOffice = 1
      record.offices = offices
      rootObjectStore.put(record)
      if (data.firstTime === 0) {
        requestHandlerResponse('updateIDB', 200, 'update successfull')
      }

    }
  }
}

function updateIDB(dbName) {
  console.log(dbName)

  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root')

    rootObjectStore.get(dbName).onsuccess = function (root) {
      http(
          'GET',
          `${apiUrl}read?from=${root.target.result.fromTime}`
        )
        .then(function (response) {

          successResponse(response)
        })
        .catch(function (error) {
          instant(createLog(error.message, root.target.result.fromTime));

        })
    }
  }
}
