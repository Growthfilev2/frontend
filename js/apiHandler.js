/* eslint-env worker */
// import firebase app script because there is no native support of firebase inside web workers

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')

// Backend API Url
const apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'

/** reinitialize the firebase app */

firebase.initializeApp({
  apiKey: 'AIzaSyB0D7Ln4r491ESzGA28rs6oQ_3C6RDeP-s',
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

// when worker receives the request body from the main thread
self.onmessage = function (event) {
  firebase.auth().onAuthStateChanged(function (auth) {
    if (!auth) {
      self.postMessage({
        code: 404,
        msg: 'firebase auth not readable',
        dbName: null
      })
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

        xhr.open(method, url, true)

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

    const map = db.createObjectStore('map', {
      keyPath: 'activityId', autoIncrement: true
    })
    map.createIndex('location', 'location')
    // map.createIndex('activityId', 'activityId')

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

    self.postMessage({
      code: 200,
      msg: 'IDB initialized successfully',
      dbName: auth.uid
    })
  }
}

function putMap (db, activity, removeVenue) {
  console.log('put map')
  const mapTx = db.transaction(['map'], 'readwrite')
  const mapObjectStore = mapTx.objectStore('map')

  removeVenue.forEach(function (oldVenue) {
    mapObjectStore.get(activity.activityId).onsuccess = function (event) {
      const record = event.target.result

      if (record) {
        mapObjectStore.delete(activity.activityId)

        console.log(activity.activityId)
      }
    }
  })
  mapTx.oncomplete = function () {
    const mapTx = db.transaction(['map'], 'readwrite')
    const mapObjectStore = mapTx.objectStore('map')
    activity.venue.forEach(function (newVenue) {
      mapObjectStore.add({

        location: newVenue.location,
        geopoint: newVenue.geopoint,
        address: newVenue.address,
        activityId: activity.activityId

      })
    })
  }
}

function putDates (db, activity, removeSchedule) {
  console.log('put dates')
  // 31st dec 2038
  let min = new Date('2038-12-31')
  // 1st Jan 2000
  let max = new Date('2000-01-1')

  removeSchedule.forEach(function (oldSchedule) {
    const startTime = new Date(oldSchedule.startTime)
    const endTime = new Date(oldSchedule.endTime)
    if (min > startTime) {
      min = startTime
    }
    if (max < endTime) {
      max = endTime
    }
  })

  activity.schedule.forEach(function (newSchedule) {
    const startTime = new Date(newSchedule.startTime)
    const endTime = new Date(newSchedule.endTime)

    if (min > startTime) {
      min = startTime
    }
    if (max < endTime) {
      max = endTime
    }
  })

  const calendarTx = db.transaction(['calendar'], 'readwrite')
  const calendarObjectStore = calendarTx.objectStore('calendar')

  const calendarActivityIndex = calendarObjectStore.index('activityId')

  calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
    // console.log(activity.activityId)
    const cursor = event.target.result
    if (cursor) {
      console.log(cursor)
      cursor.delete()
      cursor.continue()
    }
  }

  calendarTx.oncomplete = function () {
    const calendarTx = db.transaction(['calendar'], 'readwrite')
    const calendarObjectStore = calendarTx.objectStore('calendar')

    for (let currentDate = min; currentDate <= max; currentDate.setDate(currentDate.getDate() + 1)) {
      activity.schedule.forEach(function (schedule) {
        if (currentDate >= new Date(schedule.startTime) && currentDate <= new Date(schedule.endTime)) {
          calendarObjectStore.add({
            date: currentDate.toDateString(),
            activityId: activity.activityId
          })
          // console.log('record added')
        }
      })
    }
  }

  calendarTx.onerror = function (event) {
    self.postMessage({
      code: 404,
      msg: event.error,
      dbName: db.name
    })
  }
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

    usersObjectStore.openCursor().onsuccess = function (event) {
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

  return new Promise(function (resolve, reject) {
    isUpdatedIndex.openCursor(NON_UPDATED_USERS).onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) {
        reject({
          code: 304,
          msg: 'User object store not modified',
          dbName: db.name
        })
        return
      }

      const assigneeFormat = `%2B${cursor.value.mobile}&q=`
      assigneeString += `${assigneeFormat.replace('+', '')}`
      fullReadUserString = `${defaultReadUserString}${assigneeString}`
      cursor.continue()

      console.log(fullReadUserString)
      resolve({
        db: db,
        url: fullReadUserString
      })
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

        if (!cursor) return

        usersObjectStore.put({

          mobile: cursor.primaryKey,
          photoURL: userProfile[cursor.primaryKey].photoURL,
          displayName: userProfile[cursor.primaryKey].displayName,
          isUpdated: USER_UPDATED
        })
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

    let venue, schedule

    read.activities.forEach(function (activity) {
      activityObjectStore.get(activity.activityId).onsuccess = function (event) {
        const oldActivity = event.target.result

        if (oldActivity) {
          venue = oldActivity.venue

          schedule = oldActivity.schedule
        } else {
          venue = []
          schedule = []
        }
        putMap(db, activity, venue)

        putDates(db, activity, schedule)
      }

      // put attachemnt in the attachment object store
      putAttachment(db, activity)

      // put each assignee (number) in the users object store
      putAssignessInStore(db, activity.assignees)

      // put activity in activity object store
      activityObjectStore.put(activity)
    })

    read.templates.forEach(function (subscription) {
      updateSubscription(db, subscription)
    })

    rootObjectStore.put({
      fromTime: Date.parse(new Date(read.upto)),
      uid: user.uid
    })

    readNonUpdatedAssignee(db).then(updateUserObjectStore, notUpdateUserObjectStore)

    // after the above operations are done , send a response message back to the requestCreator(main thread).
    self.postMessage({
      success: true,
      msg: 'IDB updated successfully',
      dbName: user.uid
    })
  }
}

function notUpdateUserObjectStore (errorUrl) {
  console.log(errorUrl)
}

function updateIDB () {
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
