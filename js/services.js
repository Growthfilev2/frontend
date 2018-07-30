
function loader(){
const div = document.createElement('div')
div.className ='loader'
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

    if (objectStore.name === 'subscriptions') {
      primaryObjectStore = db.transaction(objectStore.name).objectStore(objectStore.name)
    } else {
      primaryObjectStore = db.transaction(objectStore.name).objectStore(objectStore.name).index(objectStore.indexThree)
    }

    primaryObjectStore.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        if (objectStore.name === 'map') return
        if (objectStore.name === 'subscriptions') return
        if (!activityRecord) return

        activityRecord.assignees.forEach(function (people) {
          document.querySelector(`[data-phone-num="${people}"]`).remove()
        })

        // if (document.querySelector('[data-type="users"]')) return
   

    
            // updateSelectorObjectStore(this.dataset, inputFields.main, objectStore.name).then(addContact).catch(errorUpdatingSelectorObjectStore)

        return
      }
      switch (objectStore.name) {
        case 'map':
          console.log(selector)
          locationUI(cursor, selector, inputFields)
          break

        case 'users':
          assigneeListUI(cursor, selector,inputFields.main)
          
          break
          
          case 'subscriptions':
          officeTemplateCombo(cursor, selector)
          dataElement('office', cursor.value.office).addEventListener('click', function () {
            console.log(this.dataset.office)
            console.log(this.dataset.template)
            document.querySelector('.activity--office').textContent = this.dataset.office
            document.querySelector('.activity--template').textContent = this.dataset.template
            getSelectedSubscriptionData(this.dataset.office, this.dataset.template)
            document.getElementById(selector).innerHTML = ''
          })
          break
        }
        cursor.continue()
      }
    }
    console.log(inputFields.main)
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
          fetchRecordsForBothIndexs(objectStore, event, selector, inputFields)
        }
        console.log(boundKeyRange)
        if(boundKeyRange.upper === '\uffff') return
        indexSecondary.openCursor(boundKeyRange).onsuccess = function (event) {
        fetchRecordsForBothIndexs(objectStore, event, selector, inputFields)
      }
    }
  })
}

function fetchRecordsForBothIndexs (objectStore, event, selector, inputFields) {
  const cursor = event.target.result
  if (!cursor) {
    if (objectStore.name === 'users') {
      activityRecord.assignees.forEach(function (people) {
        document.querySelector(`[data-phone-num="${people}"]`).remove()
      })
      return
    }
    if (objectStore.name === 'subscriptions') return
    if(objectStore.name === 'map') return
   
    // const link = document.createElement('a')
    // link.textContent = 'google maps'
    // link.href = '#'
    // link.id = 'find-new-location'
    // if (!document.getElementById('find-new-location')) {
    //   // document.getElementById(selector).appendChild(link)
    // }
    // return
  }

  switch (objectStore.name) {
    case 'map':
      locationUI(cursor, selector, inputFields)
      break
    case 'users':
    console.log(cursor.value)
      assigneeListUI(cursor, selector,inputFields.main)
   
      break
    case 'subscriptions':
      console.log(cursor.value)
      officeTemplateCombo(cursor, selector)
      
      dataElement('office', cursor.value.office).addEventListener('click', function () {
        console.log(this.dataset.office)
        console.log(this.dataset.template)
        document.querySelector('.activity--office').textContent = this.dataset.office
        document.querySelector('.activity--template').textContent = this.dataset.template
        getSelectedSubscriptionData(this.dataset.office, this.dataset.template)
        document.getElementById(selector).innerHTML = ''
      })
      break
  }

  cursor.continue()
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
          profileView(firebase.auth().currentUser)
          handleTimeout()
          break
        case 'calendar':
          calendarView(response.data.dbName)
          handleTimeout()
          break

        case 'detail':
        handleTimeout()
          fillActivityDetailPage(record.id)
          break

        default:
          record.currentView = 'profile'
          rootObjectStore.put(record)
          profileView(firebase.auth().currentUser,true)
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
  const TIME_OUT_VALUE = 600000
  clearTimeout(offset)

  offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
}
