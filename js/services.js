function loader () {
  const div = document.createElement('div')
  div.className = 'loader'
  return div
}

function progressBar () {
  const div = document.createElement('div')
  div.className = 'mdc-linear-progress mdc-linear-progress--indeterminate'
  div.role = 'progressbar'
  const bufferDots = document.createElement('div')
  bufferDots.className = 'mdc-linear-progress__buffering-dots'
  const buffer = document.createElement('div')
  buffer.className = 'mdc-linear-progress__buffer'
  const primary = document.createElement('div')
  primary.className = 'mdc-linear-progress__bar mdc-linear-progress__primary-bar'

  const primaryInner = document.createElement('span')
  primaryInner.className = 'mdc-linear-progress__bar-inner'

  primary.appendChild(primaryInner)
  const secondary = document.createElement('div')
  secondary.className = 'mdc-linear-progress__bar mdc-linear-progress__secondary-bar'

  const secondaryInner = document.createElement('span')
  secondaryInner.className = 'mdc-linear-progress__bar-inner'

  secondary.appendChild(secondaryInner)
  div.appendChild(bufferDots)
  div.appendChild(buffer)
  div.appendChild(primary)
  div.appendChild(secondary)
  return div
}

function getInputText (selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelect (objectStore, selector, inputFields, activityRecord) {
  // getInputText(inputFields.location).value = ''
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)
  let primaryObjectStore = ''

  req.onsuccess = function () {
    const db = req.result

    if (objectStore.name === 'subscriptions' || objectStore.name === 'map' || objectStore.name === 'children') {
      primaryObjectStore = db.transaction(objectStore.name).objectStore(objectStore.name)
    } else {
      primaryObjectStore = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indexThree)
    }

    primaryObjectStore.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        if (objectStore.name === 'map') return
        if (objectStore.name === 'subscriptions') return
        if(objectStore.name === 'children') return
        if (!activityRecord) return

        activityRecord.assignees.forEach(function (people) {
          document.querySelector(`[data-phone-num="${people}"]`).remove()
        })
        return
      }
      switch (objectStore.name) {
        case 'map':
          console.log(selector)
          locationUI(cursor, selector, inputFields)
          break

        case 'users':

          assigneeListUI(cursor, selector, inputFields.main)

          break

        case 'subscriptions':
          officeTemplateCombo(cursor, selector, inputFields.main)

          break
        case 'children':
        if(cursor.value.template === activityRecord.template  && cursor.value.office === activityRecord.office && status != 'CANCELLED') {
        childrenNames(cursor,selector,inputFields.main)
        }
        break;
      }
      cursor.continue()
    }
  }

  document.getElementById(inputFields.main).addEventListener('input', function () {
    document.getElementById(selector).innerHTML = ''
    const dbName = firebase.auth().currentUser.uid
    const req = window.indexedDB.open(dbName)

    req.onsuccess = function () {
      const db = req.result
      let indexMain
      if (objectStore.name === 'subscriptions' || objectStore.name === 'map') {
        indexMain = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indexone)
      } else {
        indexMain = db.transaction(objectStore.name).objectStore(objectStore.name)
      }
      const indexSecondary = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indextwo)

      const boundKeyRange = IDBKeyRange
        .bound(
          getInputText(inputFields.main).value.toLowerCase(),
          `${getInputText(inputFields.main).value.toLowerCase()}\uffff`
        )

      indexMain.openCursor(boundKeyRange).onsuccess = function (event) {
        fetchRecordsForBothIndexs(objectStore, event, selector, inputFields, activityRecord)
      }
      console.log(boundKeyRange)
      if (boundKeyRange.upper === '\uffff') return
      indexSecondary.openCursor(boundKeyRange).onsuccess = function (event) {
        fetchRecordsForBothIndexs(objectStore, event, selector, inputFields, activityRecord)
      }
    }
  })
}

function fetchRecordsForBothIndexs (objectStore, event, selector, inputFields, activityRecord) {
  const cursor = event.target.result
  if (!cursor) {
    if (objectStore.name === 'subscriptions') return
    if (objectStore.name === 'map') return
    if(objectStore.name === 'children') return
    if (!activityRecord) return

    activityRecord.assignees.forEach(function (people) {
      if (document.querySelector(`[data-phone-num="${people}"]`)) {
        document.querySelector(`[data-phone-num="${people}"]`).remove()
      }
    })
  }

  switch (objectStore.name) {
    case 'map':
      locationUI(cursor, selector, inputFields)
      break
    case 'users':
      console.log(cursor.value)
      assigneeListUI(cursor, selector, inputFields.main)

      break
    case 'subscriptions':
      console.log(inputFields.main)
      officeTemplateCombo(cursor, selector, inputFields.main)

      break
      case 'children':
      if(cursor.value.template === activityRecord.template  && cursor.value.office === activityRecord.office && status != 'CANCELLED') {
        childrenNames(cursor,selector,inputFields.main)
      }
      break;
  }

  cursor.continue()
}

function fetchCurrentTime (serverTime) {
    return Date.now() + serverTime
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

function sendCurrentViewNameToAndroid(viewName){
  // Fetchview.startConversation(viewName)
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
      const dbName = firebase.auth().currentUser.uid
        const req = indexedDB.open(dbName)
        req.onsuccess = function(){
          const db = req.result;
          const rootObjectStore = db.transaction('root').objectStore('root')
          rootObjectStore.get(dbName).onsuccess = function(event){
              
        requestBody['timestamp'] = fetchCurrentTime(event.target.result.serverTime)
        requestBody['geopoint'] = geopoints
        requestGenerator.body = requestBody
        // post the requestGenerator object to the apiHandler to perform IDB and api
        // operations
        
        apiHandler.postMessage(requestGenerator)     
      } 
    }
    })
  }

  // handle the response from apiHandler when operation is completed

  apiHandler.onmessage = loadViewFromRoot
  apiHandler.onerror = onErrorMessage
}

function loadViewFromRoot (response) {
  console.log(response)

  if (response.data.type === 'notification') return

  console.log(response.data.dbName)
  const req = window.indexedDB.open(response.data.dbName)

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
        handleTimeout()
        profileView(firebase.auth().currentUser)
        break

        case 'calendar':
          calendarView(response.data.dbName)
          handleTimeout()
          break


        case 'detail':
          handleTimeout()
          fillActivityDetailPage(record.id)
          break
        case 'edit-activity':
        handleTimeout()
        break;
        case 'create' :
        handleTimeout()
        break;  
  
        default:
          record.currentView = 'list'
          rootObjectStore.put(record)
          listView()
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
  console.log('load now')
  const TIME_OUT_VALUE = 10000
  const offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)  
        if(offset){
          clearTimeout(offset)
        }
}

