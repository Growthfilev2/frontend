function iconEditable () {

}

function getInputText (selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelect () {

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

const responseFunctionCaller = {
  map: map,
  calendar : calendar,
  default : app
}
function app(data){
  listView()
  if (!data.id) return
  conversation(data.id)

}
function map (data) {
  mapView(data.dbName)
}
function calendar(data){
  calendarView(data.dbName)
}

function onSuccessMessage (response) {
  const IDB_VERSION = 1

  console.log(response)

  const req = window.indexedDB.open(response.data.handler.dbName)

  console.log(req)

  req.onsuccess = function () {
 
    const db = req.result
    const rootObjectStore = db.transaction('root').objectStore('root')
    rootObjectStore.get(response.data.handler.dbName).onsuccess = function (event) {
      console.log(event.target.result)
      responseFunctionCaller[event.target.result.view](response.data.handler)
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
