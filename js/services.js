function iconEditable () {

}

function getInputText (selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelect (objectStore) {
  objectStore.openCursor().onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) return

    assigneeListUI()
  }
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
  // getGeoLocation method will be added later
  const requestGenerator = {
    type: requestType,
    body: requestBody

  }

  // spawn a new worker called apiHandler.

  const apiHandler = new Worker('js/apiHandler.js')

  // post the requestGenerator object to the apiHandler to perform IDB and api
  // operations
  console.log(requestGenerator)
  apiHandler.postMessage(requestGenerator)

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
  const TIME_OUT_VALUE = 600000
  clearTimeout(offset)

  offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
}
