let offset

function handleImageError(img){
  img.onerror = null;
  img.src = './img/empty-user.jpg';
  return true
}
function handleImageErrorAttachment(img){
  img.onerror = null;
  img.src = './img/placeholder.png';
  return true
}
function loader(nameClass) {
  const div = document.createElement('div')
  div.className = 'loader ' + nameClass
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

  const icon = document.createElement('div')
  icon.className = 'success--check'

  div.appendChild(icon)
  section.appendChild(div)
  surface.appendChild(section)
  aside.appendChild(surface)
  document.body.appendChild(aside)

  const successDialog = new mdc.dialog.MDCDialog(document.querySelector('#success--dialog'))
  successDialog.show()
  setTimeout(function() {
    document.getElementById('success--dialog').remove()
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }, 1200)
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
function snacks(message,type) {
  const snack = document.createElement('div')
  snack.className = 'mdc-snackbar'
  snack.setAttribute('aria-live', 'assertive')
  snack.setAttribute('aria-atomic', 'true')
  snack.setAttribute('aria-hidden', 'true')

  const snackbarText = document.createElement('div')
  snackbarText.className = 'mdc-snackbar__text mdc-typography--subtitle2'

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
    actionText: type ? type : 'OK',
    timeout: 10000,
    actionHandler: function() {
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

    if(response.data.type === 'updateList') {
      const activityObjectStore = db.transaction('activity').objectStore('activity');
      const append = true;
      activityObjectStore.index('timestamp').openCursor(null,'prev').onsuccess = function(event){
        const cursor = event.target.result;
        if(!cursor) return
        if(response.data.params.indexOf(cursor.value.activityId) > -1) {

          createActivityList(db,cursor.value,append).then(function(dom){
            
          })
        }
        cursor.continue()
      }
      
      
      return
    }

    if (response.data.type === 'updateAssigneeList') {
      console.log("only update assingee list")
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      //here dbName is activityId
      activityObjectStore.get(response.data.dbName.id).onsuccess = function(event) {
        const record = event.target.result
        // toggleActionables(record.editable)

        readNameAndImageFromNumber([response.data.dbName.number], db)
      }
      return
    }


    if (response.data.type === 'toggleDetailActions') {
       toggleActionables(response.data.params.editable)
      return
    }

    if(response.data.type === 'create-success') {
      
      listView()
      return;
    }

    if(response.data.type === 'delete-succes') {
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      activityObjectStore.get(response.data.dbName.id).onsuccess = function(event){
        const record = event.target.result
        snacks(`${record.activityName} has been deleted`,'Undo')
        listView()
        return;
      }
    }


 
    if(!history.state) {
      setTimeout(function(){
        window["listView"]()
      },5000)
    }
    else {
      if(history.state[0] === 'updateCreateActivity') {
        toggleActionables(history.state[1].activityId)
        return
      }     
      window[history.state[0]](history.state[1],false)
      handleTimeout()
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
