function iconEditable() {

}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelectMap(objectStore, selector, inputFields, activityRecord) {
  // getInputText(inputFields.location).value = ''
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const primaryObjectStore = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indexThree)

    primaryObjectStore.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {

        if (objectStore.name === 'map') return
        if (objectStore.name === 'subscription') return

        activityRecord.assignees.forEach(function (people) {
          document.querySelector(`[data-contact="${people}"]`).remove()
        })

        if (document.querySelector('[data-type="users"]')) return
        const updateSelector = document.createElement('button')
        updateSelector.classList.add('mdc-button')
        updateSelector.dataset.id = activityRecord.activityId
        updateSelector.textContent = 'Add'


        updateSelector.dataset.type = 'users'
        document.getElementById('share--container').insertBefore(updateSelector, document.getElementById(selector))

        document.querySelector(`[data-type="users"]`)
          .addEventListener('click', function () {
            updateSelectorObjectStore(this.dataset, inputFields.main, objectStore.name).then(addContact).catch(errorUpdatingSelectorObjectStore)
          })

        return;
      }
      switch (objectStore.name) {
        case 'map':
          locationUI(cursor, selector, inputFields)

          break
        case 'users':
          assigneeListUI(cursor, selector)

          dataElement('contact', cursor.primaryKey).addEventListener('click', function () {
            getInputText(inputFields.main).value = this.dataset.contact
          })

          break
      }


      cursor.continue()
    }
  }

  document.getElementById(inputFields.main).addEventListener('input', function () {
    const dbName = firebase.auth().currentUser.uid
    const req = window.indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      const indexMain = db.transaction(objectStore.name).objectStore(objectStore.name)
      const indexSecondary = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indextwo)

      const boundKeyRange = IDBKeyRange
        .bound(
          getInputText(inputFields.main).value.toLowerCase(),
          `${getInputText(inputFields.main).value.toLowerCase()}\uffff`
        )
      document.getElementById(selector).innerHTML = ''

      indexMain.openCursor(boundKeyRange).onsuccess = function (event) {
        console.log(event)
        fetchRecordsForBothIndexs(objectStore, event, selector, inputFields)
      }
      indexSecondary.openCursor(boundKeyRange).onsuccess = function (event) {
        console.log(event)

        fetchRecordsForBothIndexs(objectStore, event, selector, inputFields)
      }
    }
  })
}

function fetchRecordsForBothIndexs(objectStore, event, selector, inputFields) {

  const cursor = event.target.result
  if (!cursor) {

    if (objectStore.name === 'users') return
    if (objectStore.name === 'subscription') return

    const link = document.createElement('a')
    link.textContent = 'google maps'
    link.href = '#'
    link.id = 'find-new-location'
    if (!document.getElementById('find-new-location')) {
      // document.getElementById(selector).appendChild(link)
    }
    return
  }

  switch (objectStore.name) {
    case 'map':
      locationUI(cursor, selector, inputFields)
      break
    case 'users':
      console.log(cursor)
      assigneeListUI(cursor, selector)
      dataElement('contact', cursor.primaryKey).addEventListener('click', function () {
        getInputText(inputFields.main).value = this.dataset.contact
      })
      break
  }

  cursor.continue()

}

// function inputSelect (objectStore, selector, inputField, activityRecord) {
//   getInputText(inputField).value = ''

//   const objectStoreName = objectStore

//   const updateSelector = document.createElement('button')
//   updateSelector.classList.add('mdc-button')
//   updateSelector.dataset.id = activityRecord.activityId
//   updateSelector.textContent = 'Add'

//   const dbName = firebase.auth().currentUser.uid
//   const req = window.indexedDB.open(dbName)

//   req.onsuccess = function () {
//     const db = req.result
//     const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName)

//     objectStore.openCursor(null, 'prev').onsuccess = function (event) {
//       const cursor = event.target.result
//       if (!cursor) {
//         activityRecord.venue.forEach(function (venue) {
//           document.querySelector(`[data-location="${venue.location}"]`).remove()
//         })
//         return
//       }
//       switch (objectStoreName) {
//         case 'users':

//           assigneeListUI(cursor, `${selector}--container`)

//           dataElement(cursor.primaryKey).addEventListener('click', function () {
//             getInputText(inputField).value = this.dataset.contact
//           })

//           if (document.querySelector('[data-type="users"]')) return

//           updateSelector.dataset.type = 'users'

//           document.getElementById('share--container').insertBefore(updateSelector, document.getElementById(selector))
//           document.querySelector(`[data-type="users"]`)
//             .addEventListener('click', function () {
//               updateSelectorObjectStore(this.dataset, inputField, objectStoreName).then(addContact).catch(errorUpdatingSelectorObjectStore)
//             })


//           break

//         case 'map':

//           updateSelector.dataset.type = 'map'
//           locationUI(cursor, selector)
//           console.log(cursor)
//           dataElement(cursor.value.location).addEventListener('click', function () {
//             getInputText(inputField).value = this.dataset.location
//             getInputText(document.getElementById(inputField).nextSibling.id).value = this.dataset.address
//             getInputText(inputField)['input_'].dataset.location = this.dataset.location
//             getInputText(inputField)['input_'].dataset.inputAddress = this.dataset.address
//             getInputText(inputField)['input_'].dataset.inputlat = this.dataset.lat
//             getInputText(inputField)['input_'].dataset.inputlon = this.dataset.lon
//             getInputText(inputField)['input_'].dataset.inputDescrip = this.dataset.desc

//             document.getElementById('location--search').style.display = 'none'
//           })

//           // document.querySelector(`[data-location="${updateSelector.dataset.type}"]`)
//           //   .addEventListener('click', function () {
//           //     updateSelectorObjectStore(this.dataset, inputField, objectStoreName)
//           //   })

//           break
//         case 'subscription':
//           updateSelector.dataset.type = 'update'
//           document.querySelector(`[data-type="${updateSelector.dataset.type}"]`)
//             .addEventListener('click', function () {
//               updateSelectorObjectStore(this.dataset, inputField, objectStoreName)
//             })
//           break
//       }

//       cursor.continue()
//     }
//   }

//   document.getElementById(inputField).addEventListener('input', function () {
//     const dbName = firebase.auth().currentUser.uid
//     const req = window.indexedDB.open(dbName)
//     document.getElementById('location--search').style.display = 'block'

//     document.querySelectorAll('[data-location]').forEach(function (list) {
//       list.style.display = 'none'
//     })

//     req.onsuccess = function () {
//       const db = req.result
//       const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName).index('location')

//       const boundKeyRange = IDBKeyRange
//         .bound(
//           getInputText(inputField).value,
//           `${getInputText(inputField).value}\uffff`
//         )
//       objectStore.openCursor(boundKeyRange).onsuccess = function (event) {
//         const cursor = event.target.result
//         console.log(cursor)
//         if (!cursor) return
//         if (dataElement(cursor.value.location)) {
//           dataElement(cursor.value.location).style.display = 'block'
//         }
//         cursor.continue()
//       }
//     }
//   })
// }

function fetchCurrentTime() {
  return Date.now()
}

function fetchCurrentLocation() {
  return new Promise(function (resolve) {
    navigator.geolocation.getCurrentPosition(function (position) {
      resolve({
        'latitude': position.coords.latitude,
        'longitude': position.coords.longitude
      })
    })
  })
}

function inputFile(selector) {
  return document.getElementById(selector)
}
let offset

function requestCreator(requestType, requestBody) {
  // A request generator body with type of request to perform and the body/data to send to the api handler.
  // spawn a new worker called apiHandler.

  const apiHandler = new Worker('js/apiHandler.js')

  const requestGenerator = {
    type: requestType,
    body: ''
  }

  if (!requestBody) {
    apiHandler.postMessage(requestGenerator)
  } else {
    fetchCurrentLocation().then(function (geopoints) {
      requestBody['timestamp'] = fetchCurrentTime()
      requestBody['geopoint'] = geopoints
      requestGenerator.body = requestBody
      // post the requestGenerator object to the apiHandler to perform IDB and api
      // operations

      apiHandler.postMessage(requestGenerator)
    })
  }

  // handle the response from apiHandler when operation is completed

  apiHandler.onmessage = onSuccessMessage
  apiHandler.onerror = onErrorMessage
}

function onSuccessMessage(response) {
  if (response.data.type !== 'updateIDB') return
  console.log(response)

  const req = window.indexedDB.open(response.data.dbName)

  console.log(req)

  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(response.data.dbName).onsuccess = function (event) {
      const record = event.target.result
      const currentView = record.view

      switch (currentView) {
        case 'list':
          listView()
          handleTimeout()
          break

        case 'conversation':
          conversation(event.target.result.id)
          handleTimeout()
          break
        case 'map':
          mapView(response.data.dbName)
          handleTimeout()
          break
        case 'profile':
          // profileView()
          handleTimeout()
          break
        case 'calendar':
          calendarView(response.data.dbName)
          handleTimeout()
          break

        case 'detail':
          fillActivityDetailPage(record.id)
          handleTimeout()
          break
        case 'share':
          const activityObjectStore = db.transaction('activity').objectStore('activity')
          activityObjectStore.get(event.target.result.id).onsuccess = function (activityEvent) {
            console.log(activityEvent)
            renderShareDrawer(activityEvent.target.result)
            handleTimeout()
          }
          break
        default:
          record.currentView = 'list'
          rootObjectStore.put(record)
          listView()
          handleTimeout()
      }
    }
  }
}

function onErrorMessage(error) {
  console.log(error)
  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  })
}

function handleTimeout() {
  const TIME_OUT_VALUE = 600000
  clearTimeout(offset)

  offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
}