/* eslint-env worker */
// import firebase app script because there is no native support of firebase inside web workers

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')

// Backend API Url
const apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'

/** reinitialize the firebase app */

firebase.initializeApp({
  apiKey: 'AIzaSyBgbeCmkuveYZwqKp43KNvlEgwumxRroVY',
  authDomain: 'growthfilev2-0.firebaseapp.com',
  databaseURL: 'https://growthfilev2-0.firebaseio.com',
  projectId: 'growthfilev2-0',
  storageBucket: 'growthfilev2-0.appspot.com'
})

// get Device time
function getTime () {
  return Date.now()
}

// dictionary object with key as the worker's onmessage event data and value as
// function name
const requestFunctionCaller = {
  initializeIDB: initializeIDB

}

function requestHandlerResponse (code, message, dbName) {
  self.postMessage({
    code: code,
    msg: message,
    dbName: dbName
  })
}

// when worker receives the request body from the main thread
self.onmessage = function (event) {
  firebase.auth().onAuthStateChanged(function (auth) {
    if (!auth) {
      requestHandlerResponse(404, 'firebase auth not completed', null)
      return void (0)
    }

    requestFunctionCaller[event.data.type](auth, event.data.body)
    updateIDB()
  })
}

// Performs XMLHTTPRequest for the API's.

function http (method, url, data) {
  return new Promise(function (resolve, reject) {
    firebase
      .auth()
      .currentUser
      .getIdToken()
      .then(function (idToken) {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url)

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status > 226) return reject(xhr)

            resolve(JSON.parse(xhr.responseText))
          }
        }

        xhr.send(data || null)
      }).catch(console.log)
  })
}

/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */
function initializeIDB (auth) {
  // onAuthStateChanged is added because app is reinitialized
  var auth = firebase.auth().currentUser
  console.log(auth)

  const request = indexedDB.open(auth.uid, 2)

  request.onerror = function (event) {
    console.log(event)
  }

  request.onupgradeneeded = function () {
    const db = request.result

    const activity = db.createObjectStore('activity', {
      keyPath: 'activityId'
    })

    activity.createIndex('timestamp', 'timestamp')

    const users = db.createObjectStore('users', {
      keyPath: 'mobile'
    })
    users.createIndex('isUpdated', 'isUpdated')

    const addendum = db.createObjectStore('addendum', {
      keyPath: 'addendumId'
    })

    addendum.createIndex('activityId', 'activityId')

    const subscriptions = db.createObjectStore('subscriptions', {
      autoIncrement: true
    })

    subscriptions.createIndex('office', 'office')
    subscriptions.createIndex('template', 'template')

    const calendar = db.createObjectStore('calendar', {
      autoIncrement: true
    })

    calendar.createIndex('date', 'date')
    calendar.createIndex('activityId', 'activityId')
    calendar.createIndex('isUpdated', 'isUpdated')
    const map = db.createObjectStore('map', {
      autoIncrement: true
    })
    map.createIndex('activityId', 'activityId')
    map.createIndex('location', 'location')

    const attachment = db.createObjectStore('attachment', {
      keyPath: 'activityId'
    })

    attachment.createIndex('template', 'template')
    attachment.createIndex('office', 'office')

    const root = db.createObjectStore('root', {
      keyPath: 'uid'
    })

    // add defaultFromTime value here in order to load it only once
    root.put({
      fromTime: 0,
      uid: auth.uid
    })
  }

  request.onsuccess = function (event) {
    // when Object stores are created, send a response back to requestCreator
    requestHandlerResponse(200, 'IDB initialized successfully', request.result.name)
  }
}

function updateMap (db, activity) {
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

        location: newVenue.location,
        geopoint: newVenue.geopoint,
        address: newVenue.address,
        activityId: activity.activityId,
        venueDescriptor: newVenue.venueDescriptor

      })
    })
  }
  mapTx.onerror = errorDeletingRecord
}

function errorDeletingRecord (event) {
  console.log(event.target.error)
}

function transactionError (event) {
  console.log(event.target.error)
}

function updateCalendar (db, activity) {
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
    const calendarActivityIndex = calendarObjectStore.index('activityId')
    const calendarIsUpdatedIndex = calendarObjectStore.index('isUpdated')

    activity.schedule.forEach(function (schedule) {
      const startTime = new Date(schedule.startTime)
      const endTime = new Date(schedule.endTime)

      calendarObjectStore.add({
        isUpdated: 0,
        activityId: activity.activityId,
        scheduleName: schedule.name,
        date: {
          start: startTime,
          end: endTime
        }
      })
    })

    calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) return

      let record = cursor.value

      for (let currentDate = record.date.start; currentDate <= record.date.end; currentDate.setDate(currentDate.getDate() + 1)) {
        calendarObjectStore.add({
          isUpdated: 1,
          activityId: record.activityId,
          scheduleName: record.scheduleName,
          date: currentDate
        })
      }
      cursor.continue()
    }

    calendarIsUpdatedIndex.openCursor(0).onsuccess = function (event) {
      const cursor = event.target.result

      if (cursor) {
        let deleteRecordReq = cursor.delete()
        deleteRecordReq.onerror = errorDeletingRecord
        cursor.continue()
      }
    }
  }

  calendarTx.onerror = transactionError
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function putAttachment (db, record) {
  const attachmentObjectStore = db.transaction('attachment', 'readwrite').objectStore('attachment')

  attachmentObjectStore.put({
    activityId: record.activityId,
    status: record.status,
    template: record.template,
    office: record.office,
    attachment: record.attachment
  })
}

// if an assignee's phone number is present inside the users object store then
// return else  call the users api to get the profile info for the number
function putAssignessInStore (db, assigneeArray) {
  assigneeArray.forEach(function (assignee) {
    const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')

    usersObjectStore.openCursor(assignee).onsuccess = function (event) {
      const cursor = event.target.result
      if (cursor) return

      usersObjectStore.add({
        mobile: assignee,
        isUpdated: 0
      })
    }
  })
}

function readNonUpdatedAssignee (db) {
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
          url: fullReadUserString
        })
        return
      }

      const assigneeFormat = `%2B${cursor.value.mobile}&q=`
      assigneeString += `${assigneeFormat.replace('+', '')}`
      cursor.continue()
    }
  })
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore (successUrl) {
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
        console.log(cursor.value)

        if (!cursor) return
        if (!userProfile[cursor.primaryKey].displayName) return

        if (!userProfile[cursor.primaryKey].photoURL) return

        const record = cursor.value

        record.photoURL = userProfile[cursor.primaryKey].photoURL
        record.displayName = userProfile[cursor.primaryKey].displayName
        record.isUpdated = USER_UPDATED
        console.log(record)
        usersObjectStore.put(record)
        cursor.continue()
      }
    }).catch(console.log)
}

function updateSubscription (db, subscription) {
  const subscriptionObjectStore = db
    .transaction('subscriptions', 'readwrite')
    .objectStore('subscriptions')

  const templateIndex = subscriptionObjectStore.index('template')

  templateIndex.get(subscription.template).onsuccess = function (templateEvent) {
    if (!templateEvent.target.result) {
      subscriptionObjectStore.add(subscription)
      return
    }

    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (subscription.office !== cursor.value.office) return
      subscriptionObjectStore.delete(cursor.primaryKey)
    }

    subscriptionObjectStore.add(subscription)
  }
}

// after getting the responseText from the read api , insert addendum into the
// corresponding object store. for each activity present inside the activities
// array in response perform the put operations. for each template present
// inside the templates array in response perform the updat subscription logic.
// after every operation is done, update the root object sotre's from time value
// with the uptoTime received from response.

function successResponse (read) {
  const user = firebase.auth().currentUser

  const request = indexedDB.open(user.uid)

  request.onsuccess = function () {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    const activityObjectStore = db.transaction('activity', 'readwrite').objectStore('activity')

    read.addendum.forEach(function (addendum) {
      addendumObjectStore.add(addendum)
    })

    read.activities.forEach(function (activity) {
      // put activity in activity object store

      activityObjectStore.put(activity)

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

    rootObjectStore.put({

      // fromTime: Date.parse(read.upto),
      fromTime: Date.parse(read.upto),
      uid: user.uid
    })

    readNonUpdatedAssignee(db).then(updateUserObjectStore, notUpdateUserObjectStore)

    // after the above operations are done , send a response message back to the requestCreator(main thread).

    requestHandlerResponse(200, 'IDB updated successfully', db.name)
  }
}

function notUpdateUserObjectStore (errorUrl) {
  console.log(errorUrl)
}

function updateIDB () {
  console.log('run update idb')
  const user = firebase.auth().currentUser
  const req = indexedDB.open(user.uid)

  req.onsuccess = function () {
    const db = req.result
    // open root object store to read fromTime value.
    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root')

    rootObjectStore.get(user.uid).onsuccess = function (root) {
      http(

        'GET',
        `${apiUrl}read?from=${root.target.result.fromTime}`

      )
        .then(function (response) {
          console.log(response)

          successResponse(response)
        })
        .catch(console.log)
    }
  }
}
