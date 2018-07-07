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
  if (firebase) {
    requestFunctionCaller[event.data.type](event.data.body)
  }
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
function initializeIDB () {
  console.log('init db')
  // onAuthStateChanged is added because app is reinitialized
  firebase.auth().onAuthStateChanged(function (auth) {
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
        keyPath: 'date'
      })
      calendar.createIndex('activityId', 'activities.activityId')

      const map = db.createObjectStore('map', {
        keyPath: 'location'
      })

      map.createIndex('activityId', 'activities.activityId')

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
      // when Object stores are created, call the updateIDB() to update the data
      // in IDB
      updateIDB()
    }
  })
}

function putMap (db, id, removeVenue, addVenue) {
  const mapObjectStore = db.transaction('map', 'readwrite').objectStore('map')
  const mapIndex = mapObjectStore.index('activityId')

  const activitiesObject = {}

  removeVenue.forEach(function (oldVenue) {
    mapIndex.get(id).onsuccess = function (event) {
      const record = event.target.result

      if (record) {
        record.activities.activityId = ''
        mapObjectStore.put(record)
      }
    }
  })

  addVenue.forEach(function (newVenue) {
    activitiesObject['activityId'] = id

    mapObjectStore.put({
      location: newVenue.location,
      geopoint: newVenue.geopoint,
      address: newVenue.address,
      activities: activitiesObject
    })
  })
}

function puDates (db, id, removeSchedule, addSchedule) {
  const tempDates = []

  const minMax = {}

  const calendarObjectStore = db.transaction('calendar', 'readwrite').objectStore('calendar')
  const calendarIndex = calendarObjectStore.index('activityId')
  removeSchedule.forEach(function (oldSchedule) {
    // parse each date into UTC
    tempDates.push(Date.parse(oldSchedule.startTime))
    tempDates.push(Date.parse(oldSchedule.endTime))
  })

  addSchedule.forEach(function (newSchedule) {
    tempDates.push(Date.parse(newSchedule.startTime))
    tempDates.push(Date.parse(newSchedule.endTime))
  })

  minMax['min'] = Math.min(...tempDates)
  minMax['max'] = Math.max(...tempDates)

  eachDateInRange(minMax, function (date) {
    addSchedule.forEach(function (newSchedule) {
      console.log(date)
      console.log(new Date(newSchedule.startTime))
      console.log(new Date(newSchedule.endTime))

      if (date >= new Date(newSchedule.startTime) && date <= new Date(newSchedule.endTime)) {
        calendarObjectStore.put({

          date: date,
          activities: {
            activityId: id
          }
        })
      }

      calendarIndex.get(id).onsuccess = function (event) {
        const record = event.target.result

        if (record) {
          delete record.activities.activityId
          calendarObjectStore.put(record)
        }
      }
    })
  })
}

function eachDateInRange (minMax, block) {
  const start = minMax.min
  const end = minMax.max
  for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
    block.call(null, new Date(currentDate))
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
      cursor = event.target.result
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
      if (cursor) {
        const assigneeFormat = `%2B${cursor.value.mobile}&q=`
        assigneeString += `${assigneeFormat.replace('+', '')}`
        fullReadUserString = `${defaultReadUserString}${assigneeString}`
        cursor.continue()
      } else {
        console.log(fullReadUserString)
        resolve(fullReadUserString)
      }
    }
  })
}

// query users object store to get all non updated users and call users-api to fetch their details and update the corresponding record

function updateUserObjectStore (db, userProfileRead) {
  http(
    'GET',
    userProfileRead
  )
    .then(function (userProfile) {
      console.log(userProfile)

      const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')

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

    read.activities.forEach(function (activity) {
      activityObjectStore.get(activity.activityId).onsuccess = function (event) {
        const oldActivity = event.target.result

        putMap(db, activity.activityId, oldActivity ? oldActivity.venue : [], activity.venue)
        puDates(db, activity.activityId, oldActivity ? oldActivity.schedule : [], activity.schedule)
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

    readNonUpdatedAssignee(db).then(function (profileApiString) {
      console.log(profileApiString)
      // updateUserObjectStore(db, profileApiString)
    })

    // after the above operations are done , send a response message back to the requestCreator(main thread).
    const responseObject = {
      success: true,
      msg: 'IDB updated successfully',
      value: user.uid
    }
    self.postMessage(responseObject)
  }
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
