/* eslint-env worker */
// import firebase app script because there is no native support of firebase inside web workers

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js')
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
  initializeIDB: initializeIDB,
  comment: comment,
  statusChange: statusChange,
  removeAssignee: removeAssignee,
  share: share,
  updateUserNumber: updateUserNumber,
  update: update,
  create: create,
  Null: Null
}

function requestHandlerResponse (type, code, message, dbName) {
  self.postMessage({
    type: type,
    code: code,
    msg: message,
    dbName: dbName
  })
}

// when worker receives the request body from the main thread
self.onmessage = function (event) {
  firebase.auth().onAuthStateChanged(function (auth) {
    if (!auth) {
      // requestHandlerResponse(404, 'firebase auth not completed', null)
      return void (0)
    }

    requestFunctionCaller[event.data.type](event.data.body).then(updateIDB).catch(console.log)
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
            console.log(xhr)
            if (!xhr.responseText) return resolve('success')
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
  // onAuthStateChanged is added because app is reinitialized
  return new Promise(function (resolve, reject) {
    var auth = firebase.auth().currentUser
    console.log(auth)

    const request = indexedDB.open(auth.uid, 2)

    request.onerror = function (event) {
      reject(event.error)
    }

    request.onupgradeneeded = function () {
      console.log(request)
      const db = request.result

      const activity = db.createObjectStore('activity', {
        keyPath: 'activityId'
      })

      activity.createIndex('timestamp', 'timestamp')
      activity.createIndex('office','office')
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

      const subscriptions = db.createObjectStore('subscriptions', {
        autoIncrement: true
      })

      subscriptions.createIndex('office', 'office')
      subscriptions.createIndex('template', 'template')
      subscriptions.createIndex('officeTemplate', ['office', 'template'])

      const calendar = db.createObjectStore('calendar', {
        autoIncrement: true
      })

      calendar.createIndex('date', 'date')
      calendar.createIndex('activityId', 'activityId')
      calendar.createIndex('isUpdated', 'isUpdated')
      calendar.createIndex('timestamp', 'timestamp')

      const map = db.createObjectStore('map', {
        autoIncrement: true
      })
      map.createIndex('activityId', 'activityId')
      map.createIndex('location', 'location')
      map.createIndex('address', 'address')
      map.createIndex('office', 'office')
      map.createIndex('timestamp', 'timestamp')
      map.createIndex('count', 'count')

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
        uid: auth.uid,
        fromTime: 0
      })
    }

    request.onsuccess = function () {
      console.log('request success')
      resolve(
        auth.uid
      )
    }
  })
}

function comment (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'POST',
      `${apiUrl}activities/comment`,
      JSON.stringify(body)
    ).then(function () {
      requestHandlerResponse('notification', 200, 'comment added successfully', firebase.auth().currentUser.uid)
      resolve(firebase.auth().currentUser.uid)
    }).catch(function (error) {
      reject(error)
    })
  })
}

function statusChange (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'PATCH',
      `${apiUrl}activities/change-status`,
      JSON.stringify(body)
    )
      .then(function () {
        requestHandlerResponse('notification', 200, 'status changed successfully', firebase.auth().currentUser.uid)

        resolve(
          firebase.auth().currentUser.uid
        )
      }).catch(function (error) {
        reject(error)
      })
  })
}

function removeAssignee (body) {
  return new Promise(function (resolve, reject) {
    http(
      'PATCH',
      `${apiUrl}activities/remove`,
      JSON.stringify(body)
    )
      .then(function () {
        requestHandlerResponse('notification', 200, 'assignee removed successfully', firebase.auth().currentUser.uid)

        resolve(
          firebase.auth().currentUser.uid
        )
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function share (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'PATCH',
      `${apiUrl}activities/share`,
      JSON.stringify(body)

    )
      .then(function (success) {
        requestHandlerResponse('notification', 200, 'assignne added successfully', firebase.auth().currentUser.uid)
        resolve(
          firebase.auth().currentUser.uid
        )
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function updateUserNumber (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'PATCH',
      `${apiUrl}services/users/update`,
      JSON.stringify(body)
    )
      .then(function (success) {
        requestHandlerResponse('notification', 200, 'number updated successfully', firebase.auth().currentUser.uid)

        resolve(firebase.auth().currentUser.uid)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function Null () {
  return new Promise(function (resolve, reject) {
    const user = firebase.auth().currentUser
    if (!user) {
      reject(null)
      return
    }
    resolve(user.uid)
  })
}

function update (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'PATCH',
      `${apiUrl}activities/update`,
      JSON.stringify(body)
    )
      .then(function (success) {
        requestHandlerResponse('notification', 200, 'activity update  successfully', firebase.auth().currentUser.uid)

        resolve(firebase.auth().currentUser.uid)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function create (body) {
  console.log(body)
  return new Promise(function (resolve, reject) {
    http(
      'POST',
      `${apiUrl}activities/create`,
      JSON.stringify(body)
    )
      .then(function (success) {
        requestHandlerResponse('notification', 200, 'activity created successfully', firebase.auth().currentUser.uid)
        resolve(firebase.auth().currentUser.uid)
      })
      .catch(function (error) {
        reject(error)
      })
  })
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

        location: newVenue.location.toLowerCase(),
        geopoint: newVenue.geopoint,
        address: newVenue.address.toLowerCase(),
        activityId: activity.activityId,
        venueDescriptor: newVenue.venueDescriptor,
        office: activity.office,
        count: 0,
        timestamp: activity.timestamp
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
      const startTime = moment(schedule.startTime).toDate()
      const endTime = moment(schedule.endTime).toDate()

      calendarObjectStore.add({
        isUpdated: 0,
        activityId: activity.activityId,
        scheduleName: schedule.name,
        timestamp: activity.timestamp,
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
          timestamp: record.timestamp,
          date: moment(currentDate).format('YYYY-MM-DD')
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

function putAttachment (db, activity) {
  const attachmentObjectStore = db.transaction('attachment', 'readwrite').objectStore('attachment')

  attachmentObjectStore.put({
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment
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
        isUpdated: 0,
        count: 0,
        displayName: ''
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

        if (!cursor) {
          requestHandlerResponse(200, 'user object store modified', successUrl.db.name)
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
  console.log(read)
  console.log('start success')
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
      console.log(activity)
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

    rootObjectStore.get(user.uid).onsuccess = function (event) {
      const record = event.target.result
      record.fromTime = Date.parse(read.upto)

      rootObjectStore.put(record)
    }

    readNonUpdatedAssignee(db).then(updateUserObjectStore, notUpdateUserObjectStore)

    // after the above operations are done , send a response message back to the requestCreator(main thread).

    requestHandlerResponse('updateIDB', 200, 'IDB updated successfully', user.uid)
  }
}

function notUpdateUserObjectStore (errorUrl) {
  console.log(errorUrl)
}

function updateIDB (dbName) {
  console.log(dbName)
  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    console.log(db)

    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root')

    rootObjectStore.get(dbName).onsuccess = function (root) {
      http(

        'GET',
        `${apiUrl}read?from=${root.target.result.fromTime}`

      )
        .then(function (response) {
          console.log(response)
          const dummy = {
            'addendum': [],
            'activities': [

              {
                'canEdit': true,
                'status': 'CONFIRMED',
                'schedule': [{
                  'endTime': '2018-06-28T10:04:51.699Z',
                  'startTime': '2018-06-28T09:25:32.304Z',
                  'name': 'Shift Timing'
                }],
                'venue': [{
                  'venueDescriptor': 'Base Location',
                  'geopoint': {
                    '_latitude': 28.5728858,
                    '_longitude': 77.2185796
                  },
                  'address': '141 B, Second Floor Shahpurjat, Shahpur Jat, Siri Fort, New Delhi, Delhi 110049',
                  'location': 'DUMMY SQUARE'
                },
                {
                  'venueDescriptor': 'Residence',
                  'geopoint': {
                    '_latitude': 28.5545653,
                    '_longitude': 77.3328355
                  },
                  'address': 'Sector 44, A Block, C Block, Sector 44, Noida, Uttar Pradesh 201303',
                  'location': 'Lodge Residence'
                }
                ],
                'timestamp': '2018-06-28T09:25:32.304Z',
                'template': 'employee',
                'title': 'employee',
                'description': 'Employee created for dummy office',
                'office': 'dummy',
                'assignees': [
                  '+918080808080',
                  '+918178135274',
                  '+919090909090',
                  '+919090909091'
                ],
                'attachment': {
                  'Base Location': {
                    'geopoint': {
                      '_latitude': 28.5728858,
                      '_longitude': 77.2185796
                    },
                    'address': '141 B, Second Floor Shahpurjat, Shahpur Jat, Siri Fort, New Delhi, Delhi 110049',
                    'location': 'DUMMY SQUARE'
                  },
                  'Residence': {
                    'geopoint': {
                      '_latitude': 28.5545653,
                      '_longitude': 77.3328355
                    },
                    'address': 'Sector 44, A Block, C Block, Sector 44, Noida, Uttar Pradesh 201303',
                    'location': 'Lodge Residence'
                  },
                  'department': 'Marketing',
                  'name': 'dummy',
                  'Shift Timing': {
                    'endTime': '2018-06-28T10:04:51.699Z',
                    'startTime': '2018-06-28T09:25:32.304Z'
                  },
                  'supervisorOne': '+919090909090',
                  'supervisorTwo': '+919090909091',
                  'code': '12345'
                },
                'activityId': 'WmZ9x7Uo8p9OJJd62MtY'
              },

              {
                'canEdit': false,
                'status': 'PENDING',
                'schedule': [{
                  'endTime': '2018-06-28T10:04:51.699Z',
                  'startTime': '2018-06-28T09:25:32.304Z',
                  'name': 'Trial Period'
                }],
                'venue': [{
                  'location': 'DUMMY SQUARE',
                  'venueDescriptor': 'Head Office',
                  'geopoint': {
                    '_latitude': 28.5728858,
                    '_longitude': 77.2185796
                  },
                  'address': '141 B, Second Floor Shahpurjat, Shahpur Jat, Siri Fort, New Delhi, Delhi 110049'
                }],
                'timestamp': '2018-07-20T07:09:09.597Z',
                'template': 'office',
                'title': 'office',
                'description': 'Creating an office with the name Dummy.',
                'office': 'dummy',
                'assignees': [
                  '+918010101923'
                ],
                'attachment': {
                  'Head Office': {
                    'location': 'DUMMY SQUARE',
                    'geopoint': {
                      '_latitude': 28.5728858,
                      '_longitude': 77.2185796
                    },
                    'address': '141 B, Second Floor Shahpurjat, Shahpur Jat, Siri Fort, New Delhi, Delhi 110049'
                  },
                  'name': 'dummy',
                  'Trial Period': {
                    'startTime': '2018-06-28T09:25:32.304Z',
                    'endTime': '2018-06-28T10:04:51.699Z'
                  },
                  'gstNumber': 'AAAA99999',
                  'paymentReference': '123456789'
                },
                'activityId': '1bL0YzwSxFmIvz4SFvxK'
              }

            ],
            'templates': [{
              'schedule': [
                'when'
              ],
              'venue': [
                'where'
              ],
              'template': 'plan',
              'attachment': {},
              'office': 'personal'
            },
            {
              'schedule': [
                'Shift Timing'
              ],
              'venue': [
                'Base Location',
                'Residence'
              ],
              'template': 'Employee',
              'attachment': {
                'department': 'string',
                'supervisorOne': 'phoneNumber',
                'name': 'string',
                'supervisorTwo': 'phoneNumber',
                'code': 'string',
                'phoneNumber': 'phoneNumber'
              },
              'office': 'dummy'
            }
            ],
            'from': '1970-01-01T00:00:00.090Z',
            'upto': '2018-07-24T08:05:59.938Z'
          }
          if (dummy.from === response.upto) {
            requestHandlerResponse('updateIDB', 200, 'IDB updated successfully', dbName)
            return
          }
          successResponse(response)
        })

        .catch(console.log)
    }
  }
}
