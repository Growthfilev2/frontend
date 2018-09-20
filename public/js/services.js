let offset

function loader() {
  const div = document.createElement('div')
  div.className = 'loader'
  return div
}

function successDialog() {

  const aside = document.createElement('aside')
  aside.className = 'mdc-dialog mdc-dialog--open success--dialog'
  aside.id = 'success--dialog'

  const surface = document.createElement('div')
  surface.className = 'mdc-dialog__surface round--surface'

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body'

  const div = document.createElement('div')
  div.className = 'success--container'

  const icon = document.createElement('i')
  icon.className = 'material-icons success--check'
  icon.textContent = 'check'

  div.appendChild(icon)
  section.appendChild(div)
  surface.appendChild(section)
  aside.appendChild(surface)
  if (!document.querySelector('#success--dialog')) {
    document.body.appendChild(aside)
  }

  const successDialog = new mdc.dialog.MDCDialog(document.querySelector('#success--dialog'))
  successDialog.show()
  setTimeout(function() {
    successDialog.close()
  }, 3000)
}

function snacks(message) {
  const snack = document.createElement('div')
  snack.className = 'mdc-snackbar'
  snack.setAttribute('aria-live', 'assertive')
  snack.setAttribute('aria-atomic', 'true')
  snack.setAttribute('aria-hidden', 'true')

  const snackbarText = document.createElement('div')
  snackbarText.className = 'mdc-snackbar__text'

  const snackbarAction = document.createElement('div')
  snackbarAction.className = 'mdc-snackbar__action-wrapper'

  const button = document.createElement('button')
  button.className = 'mdc-snackbar__action-button'

  snackbarAction.appendChild(button)

  snack.appendChild(snackbarText)
  snack.appendChild(snackbarAction)
  document.getElementById('snackbar-container').innerHTML = snack.outerHTML

  const data = {
    message: message,
    actionText: 'Ok',
    timeout: 3000,
    actionHandler: function() {
      console.log('okay')
    }
  }

  const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'))

  snackbar.show(data)
}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime
}

function fetchCurrentLocation() {
  return new Promise(function(resolve) {
    navigator.geolocation.getCurrentPosition(function(position) {
      resolve({
        'latitude': position.coords.latitude,
        'longitude': position.coords.longitude
      })
    })
  })
}

function sendCurrentViewNameToAndroid(viewName) {
  Fetchview.startConversation(viewName)
}

function inputFile(selector) {
  return document.getElementById(selector)
}

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
    if (requestBody.hasOwnProperty('firstTime')) {
      requestGenerator.body = requestBody
      apiHandler.postMessage(requestGenerator)
    } else {
      fetchCurrentLocation().then(function(geopoints) {
        const dbName = firebase.auth().currentUser.uid
        const req = indexedDB.open(dbName)
        req.onsuccess = function() {
          const db = req.result;
          const rootObjectStore = db.transaction('root').objectStore('root')
          rootObjectStore.get(dbName).onsuccess = function(event) {

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
  }

  // handle the response from apiHandler when operation is completed

  apiHandler.onmessage = loadViewFromRoot
  apiHandler.onerror = onErrorMessage
}

function loadViewFromRoot(response) {

  if (response.data.type === 'notification') {
    successDialog()
    return
  }

  // only for development
  if (response.data.type === 'error') {
    snacks(response.data.msg)
    return;
  }

  if (response.data.type === 'loggedOut') {
    document.getElementById("main-layout-app").style.display = 'none'
    userSignedOut()
    return;
  }

  if (response.data.type === 'setLocalStorage') {
    document.getElementById("main-layout-app").style.display = 'block'

    localStorage.setItem('dbexist', response.data.dbName);
    return;
  }



  const req = window.indexedDB.open(firebase.auth().currentUser.uid)

  req.onsuccess = function() {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')

    if (response.data.type === 'updateAssigneeList') {
      console.log("only update assingee list")
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      //here dbName is activityId
      activityObjectStore.get(response.data.dbName.id).onsuccess = function(event) {
        const record = event.target.result

        readNameAndImageFromNumber([response.data.dbName.number], db)
      }
      return
    }

    if (response.data.type === 'updateStatusView') {
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      activityObjectStore.get(response.data.dbName.id).onsuccess = function(event) {
        const record = event.target.result;
        if (response.data.staus !== 'CANCELLED') {
          statusChange(db, record.activityId)
        }
      }
      return
    }

    if(!history.state) {
      setTimeout(function(){
        window["listView"]()
      },2000)
    }
    else {
      if(history.state[0] === 'updateCreateActivity') return
      window[history.state[0]](history.state[1],false)
      handleTimeout()
    }
    //  else {
    //   console.log("yahan tak chak raha hai")
    //   rootObjectStore.get(response.data.dbName).onsuccess = function(event) {
    //     const record = event.target.result
    //     let currentView = record.view
    //     if (response.data.type === 'create-success') {
    //       currentView = 'list'
    //     }
    //
    //     switch (currentView) {
    //       case 'list':
    //         listView(response.data.dbName)
    //         handleTimeout()
    //         break
    //
    //       case 'conversation':
    //         conversation(event.target.result.id)
    //         handleTimeout()
    //         break
    //       case 'profile':
    //         handleTimeout()
    //         break;
    //       case 'updateCreateActivity':
    //         handleTimeout()
    //         break;
    //       default:
    //         record.currentView = 'list'
    //         rootObjectStore.put(record)
    //         listView(response.data.dbName)
    //         handleTimeout()
    //     }
    //   }
    // }
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
  const TIME_OUT_VALUE = 300
  const offset = setTimeout(function() {
    requestCreator('Null')
  }, TIME_OUT_VALUE)
  if (offset) {
    clearTimeout(offset)
  }
}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector))
}
