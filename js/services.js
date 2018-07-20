function iconEditable () {

}

function getInputText (selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelect (objectStore, selector, inputField, id) {
  const objectStoreName = objectStore.objectStore.name

  objectStore.openCursor(null, 'prev').onsuccess = function (event) {
    const cursor = event.target.result

    if (!cursor) return

    assigneeListUI(cursor, `${selector}--container`)
    document.querySelector(`[data-contact="${cursor.primaryKey}"]`).addEventListener('click', function () {
      getInputText(inputField).value = this.dataset.contact
    })
    cursor.continue()
  }
  const updateSelector = document.createElement('button')
  updateSelector.classList.add('mdc-button')
  updateSelector.dataset.id = id
  updateSelector.textContent = 'Add'
  switch (objectStoreName) {
    case 'users':
      if (document.querySelector('[data-type="users"]')) return

      updateSelector.dataset.type = 'users'

      document.getElementById('share--container').insertBefore(updateSelector, document.getElementById(selector))

      document.querySelector(`[data-type="users"]`)
        .addEventListener('click', function () {
          updateSelectorObjectStore(this.dataset, inputField, objectStoreName).then(addContact).catch(errorUpdatingSelectorObjectStore)
        })
      break
    case 'map':
      updateSelector.dataset.type = 'map'
      document.querySelector(`[data-type="${updateSelector.dataset.type}"]`)
        .addEventListener('click', function () {
          updateSelectorObjectStore(this.dataset, inputField, objectStoreName)
        })
      break
    case 'subscription':
      updateSelector.dataset.type = 'update'
      document.querySelector(`[data-type="${updateSelector.dataset.type}"]`)
        .addEventListener('click', function () {
          updateSelectorObjectStore(this.dataset, inputField, objectStoreName)
        })
      break
  }
  console.log(updateSelector)

  document.getElementById(inputField).addEventListener('input', function () {
    const dbName = firebase.auth().currentUser.uid
    const req = window.indexedDB.open(dbName)
    document.querySelectorAll('[data-contact]').forEach(function (list) {
      list.style.display = 'none'
    })

    req.onsuccess = function () {
      const db = req.result
      const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName)

      const boundKeyRange = IDBKeyRange
        .bound(
          getInputText(inputField).value,
          `${getInputText(inputField).value}\uffff`
        )
      objectStore.openCursor(boundKeyRange).onsuccess = function (event) {
        const cursor = event.target.result
        console.log(cursor)

        if (!cursor) return

        document.querySelector(`[data-contact="${cursor.primaryKey}"]`).style.display = 'block'
        cursor.continue()
      }
    }
  })
}

function fetchCurrentTime () {
  return Date.now()
}

function fetchCurrentLocation () {
  return new Promise(function (resolve) {
    navigator.geolocation.getCurrentPosition(function (position) {
      resolve({
        'latitude': position.coords.latitude,
        'longitude': position.coords.longitude
      })
    })
  })
}

function inputFile (selector) {
  return document.getElementById(selector)
}
let offset

function requestCreator (requestType, requestBody) {
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

function onSuccessMessage (response) {
  const IDB_VERSION = 1

  console.log(response)

  const req = window.indexedDB.open(response.data.dbName)

  console.log(req)

  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root').objectStore('root')
    rootObjectStore.get(response.data.dbName).onsuccess = function (event) {
      const currentView = event.target.result.view
      console.log(currentView)
      switch (currentView) {
        case 'default':
          listView()
          conversation(event.target.result.id)
          handleTimeout()
          break
        case 'map':
          mapView(response.data.dbName)
          handleTimeout()

          break
        case 'calendar':
          calendarView(response.data.dbName)
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
          listView()
          conversation(event.target.result.id)
          handleTimeout()
      }
    }
  }
}

function onErrorMessage (error) {
  console.log(error)
  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  })
}

function handleTimeout () {
  const TIME_OUT_VALUE = 60000
  clearTimeout(offset)

  offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
}
