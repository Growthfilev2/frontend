
function loader() {
  const div = document.createElement('div')
  div.className = 'loader'
  return div
}

function progressBar() {
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

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}


function inputSelect(objectStore, selector, inputFields, activityRecord) {
  let dataCount = 0
  let input = ''
  let autocomplete = ''
  if(inputFields.main === 'location-text-field') {
    let input = document.getElementById('location-text-field').querySelector('.mdc-text-field__input');
    autocomplete =  new google.maps.places.Autocomplete(input);
  }
        
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
        if (objectStore.name === 'children') return
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
        console.log(activityRecord.template);
 
        if (cursor.value.template === activityRecord.template && cursor.value.office === activityRecord.office && status != 'CANCELLED') {
            // if(!cursor.value.attachment.hasOwnProperty('Name')) return
            console.log(cursor.value)
            dataCount++
            childrenNames(cursor, selector, inputFields.main)
        }

        if(dataCount == 0) {
          document.getElementById('children-name').querySelector('.mdc-dialog__footer__button--accept').disabled = true
        }
          break;
      }
      cursor.continue()
    }
  }
  // console.log(isMapPinPresent)
  
  document.getElementById(inputFields.main).addEventListener('input', function () {

    if(inputFields.main === 'location-text-field') {
        if(getInputText('location-text-field').value == '') {
          document.getElementById('location--container').style.marginTop = '0px'
          return
        }
        else {

          document.getElementById('location--container').style.marginTop = '150px'
          document.getElementById('location--container')
          initializeAutocomplete(autocomplete)
          return;
        }
    }
    

    document.getElementById(selector).innerHTML = ''

    const dbName = firebase.auth().currentUser.uid
    const req = window.indexedDB.open(dbName)

    req.onsuccess = function () {
      const db = req.result
      let indexMain
      if (objectStore.name === 'subscriptions' || objectStore.name === 'map' || objectStore.name === 'children') {
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

function fetchRecordsForBothIndexs(objectStore, event, selector, inputFields, activityRecord) {

  const cursor = event.target.result

  if (!cursor) {
    if (objectStore.name === 'subscriptions') return

    if (objectStore.name === 'children') return
    if (!activityRecord) return

    activityRecord.assignees.forEach(function (people) {
      if (document.querySelector(`[data-phone-num="${people}"]`)) {
        document.querySelector(`[data-phone-num="${people}"]`).remove()
      }
    })
  }


  switch (objectStore.name) {
  
    case 'users':
      console.log(cursor.value)
      assigneeListUI(cursor, selector, inputFields.main)

      break
    case 'subscriptions':
      console.log(inputFields.main)
      officeTemplateCombo(cursor, selector, inputFields.main)

      break
    case 'children':
      if (cursor.value.template === activityRecord.template && cursor.value.office === activityRecord.office && status != 'CANCELLED') {
        if (!cursor.value.attachment.hasOwnProperty('Name')) return
        childrenNames(cursor, selector, inputFields.main)
      }
      break;
  }

  cursor.continue()
}


function initializeAutocomplete(autocomplete) {


  autocomplete.addListener('place_changed', function () {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }
     document.getElementById('location--container').style.marginTop = '0px'

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    document.getElementById('location-text-field').dataset.location = place.name
    document.getElementById('location-text-field').dataset.address = address
    document.getElementById('location-text-field').dataset.inputlat = place.geometry.location.lat()
    document.getElementById('location-text-field').dataset.inputlon = place.geometry.location.lng()

    console.log(address)
    console.log(place)
  })
}





function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime
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




function locationServices() {

  const locationHandler = new Worker('js/locationHandler.js');

  setInterval(function () {
    fetchCurrentLocation().then(function (geopoints) {
      locationHandler.postMessage(geopoints);
    })
  }, 500)


  locationHandler.onmessage = handleLocationCorrection
  locationHandler.onerror = handleLocationError

}


function handleLocationCorrection(msg) {
  // console.log(msg.data)
  if (!msg.data.value) {

    //   snacks(`value : ${msg.data.value} ,  count : ${msg.data.count}`)
    return;
  };

  snacks(`latitude : ${msg.data.stream.lat}  longitude: ${msg.data.stream.lon} , ${msg.data.count}`)

  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')

    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.location = msg.data
      rootObjectStore.put(record)
    }
  }
}

function handleLocationError(err) {
  console.log(err)
}

function sendCurrentViewNameToAndroid(viewName) {
  // Fetchview.startConversation(viewName)
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
      const dbName = firebase.auth().currentUser.uid
      const req = indexedDB.open(dbName)
      req.onsuccess = function () {
        const db = req.result;
        const rootObjectStore = db.transaction('root').objectStore('root')
        rootObjectStore.get(dbName).onsuccess = function (event) {

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

function loadViewFromRoot(response) {
  console.log(response)

  if (response.data.type === 'notification') return
  if(response.data.type === 'error') {
    snacks(response.data.msg)
    return;
  }

  console.log(response.data.dbName)
  const req = window.indexedDB.open(response.data.dbName)

  req.onsuccess = function () {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')

    rootObjectStore.get(response.data.dbName).onsuccess = function (event) {
      const record = event.target.result
      let currentView = record.view
      if(response.data.type === 'create-success') {
        currentView = 'list'
      }

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
        case 'create':
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

function onErrorMessage(error) {
  console.log(error)
  console.log(error.message)
  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  })
}


function handleTimeout() {
  console.log('load now')
  const TIME_OUT_VALUE = 10000
  const offset = setTimeout(function () {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
  if (offset) {
    clearTimeout(offset)
  }
}
