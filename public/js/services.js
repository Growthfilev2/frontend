function handleImageError(img) {
  img.onerror = null;
  img.src = './img/empty-user.jpg';

  const req = window.indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const usersObjectStoreTx = db.transaction('users', 'readwrite')
    const usersObjectStore = usersObjectStoreTx.objectStore('users')
    usersObjectStore.get(img.dataset.number).onsuccess = function (event) {
      const record = event.target.result
      if (record.isUpdated == 0) return
        record.isUpdated = 0
        usersObjectStore.put(record)
    }
  }

  return true
}

function handleImageErrorAttachment(img) {
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
  setTimeout(function () {
    document.getElementById('success--dialog').remove()
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }, 1200)
}

function mockLocationDialog(resolve) {
  if (!document.getElementById('mock-location')) {

    const aside = document.createElement('aside')
    aside.className = 'mdc-dialog mdc-dialog--open'
    aside.id = 'mock-location'

    const surface = document.createElement('div')
    surface.className = 'mdc-dialog__surface'
    surface.style.width = '90%'
    surface.style.height = 'auto'

    const section = document.createElement('section')
    section.className = 'mdc-dialog__body mock-main-body'
    section.textContent = 'There seems to a Mock Location Application in your device which is preventing Growthfile from locating you. Please turn off all mock location applications and try again later.'

    const footer = document.createElement('footer')
    footer.className = 'mdc-dialog__footer mock-footer'

    const ok = document.createElement('button')
    ok.type = 'button'
    ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel'
    ok.textContent = 'Ok'
    ok.id = 'cancel-mock-dialog'
    ok.style.backgroundColor = '#3498db'

    footer.appendChild(ok)



    const warningText = document.createElement('section')
    warningText.className = 'mdc-typography--subtitle2 mdc-dialog__body warning-body'

    const continueAnyway = document.createElement('span')
    continueAnyway.className = 'continue-link'
    continueAnyway.textContent = 'Proceed anyway '
    continueAnyway.onclick = function () {
      resolve({
        latitude: '',
        longitude: ''
      })
      document.querySelector('#mock-location').remove()
    }

    warningText.appendChild(continueAnyway)

    const warningTextNode = document.createTextNode(' This activity will not be recorded in any of the reports.')
    warningText.appendChild(warningTextNode)


    surface.appendChild(section)
    surface.appendChild(footer)
    surface.appendChild(warningText)
    aside.appendChild(surface)
    document.body.appendChild(aside)
  }
  const mockDialog = new mdc.dialog.MDCDialog(document.querySelector('#mock-location'))
  mockDialog.show()
}

function enableGps() {
  if (!document.getElementById('enable-gps')) {

    const aside = document.createElement('aside')
    aside.className = 'mdc-dialog mdc-dialog--open'
    aside.id = 'enable-gps'

    const surface = document.createElement('div')
    surface.className = 'mdc-dialog__surface'
    surface.style.width = '90%'
    surface.style.height = 'auto'

    const section = document.createElement('section')
    section.className = 'mdc-dialog__body mock-main-body'
    section.textContent = 'Please Enable GPS on your phone'

    const footer = document.createElement('footer')
    footer.className = 'mdc-dialog__footer mock-footer'

    const ok = document.createElement('button')
    ok.type = 'button'
    ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel'
    ok.textContent = 'Ok'
    ok.id = ''
    ok.style.backgroundColor = '#3498db'

    footer.appendChild(ok)

    surface.appendChild(section)
    surface.appendChild(footer)
    aside.appendChild(surface)
    document.body.appendChild(aside)

  }

  const gpsDialog = new mdc.dialog.MDCDialog(document.querySelector('#enable-gps'))
  gpsDialog.show()
}

function progressBar() {
  const div = document.createElement('div')
  div.className = 'mdc-linear-progress mdc-linear-progress--indeterminate progress--update'
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

function snacks(message, type) {
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
    actionText: type ? type.btn : 'OK',
    timeout: 10000,
    actionHandler: function () {

      if (type) {
        requestCreator('statusChange', {
          activityId: type.id,
          status: 'PENDING'
        })
      }

    }
  }

  const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'))

  snackbar.show(data)
}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime
}

function geolocationApi(method, url, data) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()

    xhr.open(method, url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          resolve({
            'latitude': result.location.lat,
            'longitude': result.location.lng,
            'accuracy': result.accuracy,
            'provider': 'Cellular',
            'lastLocationTime': Date.now()
          })
        } else {
          reject(xhr.statusText)
        }
      }
    }
    if (!data) {
      resolve(undefined)
    } else {
      console.log(data)
      xhr.send(data)
    }
  }).catch(function (error) {
    return error
  })
}

function manageLocation() {
  const apiKey = 'AIzaSyCtyIm3PBorFtIfRSjl1JtE4RlYXVx6U6c'
  let CelllarJson;
  try {
    CelllarJson = Towers.getCellularData()
    console.log(CelllarJson)
  } catch (e) {
    requestCreator('instant', {
      message: e.message
    })
    CelllarJson = false
  }

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const rootStore = db.transaction('root', 'readwrite').objectStore('root')
    rootStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
      return new Promise(function (resolve) {

        const record = event.target.result
        // if(moment(record.lastLocationTime - Date.now()).format('m') < 30) return
        if (CelllarJson) {

          geoFetchPromise = geolocationApi('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + apiKey, CelllarJson)
        } else {
          geoFetchPromise = {
            'latitude': '',
            'longitude': '',
            'accuracy': 999999,

          }
        }

        navigatorFetchPromise = locationInterval(record.provider)
        Promise.all([geoFetchPromise, navigatorFetchPromise]).then(function (geoData) {
          const removeFalseData = geoData.filter(function (el) {
            return el !== undefined
          })

          const mostAccurate = sortedByAccuracy(removeFalseData)

          updateLocationInRoot(mostAccurate)

        }).catch(function (error) {
          requestCreator('instant', {
            message: error
          })
        })

      })
    }

  }
}


function locationInterval(provider) {

  const stabalzied = []
  let count = 0
  let geo = {
    'latitude': '',
    'longitude': '',
    'accuracy': '',
    'lastLocationTime': ''
  }
  let lowAccuracy;
  let mockTimeout;

  return new Promise(function (resolve, reject) {
    if (provider === 'Mock') {
      resolve(undefined)
      return
    }


    if (!mockTimeout) {

      mockTimeout = setTimeout(function () {

        if (geo.latitude === '' && geo.longitude === '') {
          clearInterval(myInterval)
          clearTimeout(mockTimeout)
          resolve({
            'latitude': '',
            'longitude': '',
            'accuracy': -1,
            'provider': 'Mock',
            'lastLocationTime': 0
          })
          return
        }
      }, 10000)

    }

    let myInterval = setInterval(function () {
      navigator.geolocation.getCurrentPosition(function (position) {
        if (position) {


          if (stabalzied.length == 0) {
            stabalzied.push({
              'latitude': position.coords.latitude,
              'longitude': position.coords.longitude,
              'accuracy': position.coords.accuracy,
              'lastLocationTime': Date.now()
            })
            return
          }
          if (stabalzied[0].latitude.toFixed(3) === position.coords.latitude.toFixed(3) && stabalzied[0].longitude.toFixed(3) === position.coords.longitude.toFixed(3)) {
            ++count
            if (count < 3) {
              stabalzied.push({
                'latitude': position.coords.latitude,
                'longitude': position.coords.longitude,
                'accuracy': position.coords.accuracy,
                'lastLocationTime': Date.now()
              })
            }
            if (count == 3) {
              if (stabalzied[2].accuracy < 350) {

                clearInterval(myInterval);
                geo.latitude = stabalzied[2].latitude,
                  geo.longitude = stabalzied[2].longitude,
                  geo.accuracy = stabalzied[2].accuracy,
                  geo.provider = 'HTML5',
                  geo.lastLocationTime = stabalzied[2].lastLocationTime
                resolve(geo)
                return
              }
            }
            if (!lowAccuracy) {
              console.log("time out for low accurate location")

              lowAccuracy = setTimeout(function () {

                const mostAccurate = sortedByAccuracy(stabalzied)
                geo.latitude = mostAccurate.latitude,
                  geo.longitude = mostAccurate.longitude,
                  geo.accuracy = mostAccurate.accuracy
                geo.provider = 'HTML5'
                geo.lastLocationTime = mostAccurate.lastLocationTime
                clearInterval(myInterval);
                resolve(geo)
                return
              }, 2500)

            }

          }

        }

      }, function (error) {
        reject(error)
      })

    }, 500)


  }).catch(function (error) {
    return error
  })
}


function sortedByAccuracy(geoData) {
  let result = geoData.sort(function (a, b) {
    return a.accuracy - b.accuracy
  })
  return result[0]
}

function updateLocationInRoot(finalLocation) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const rootStore = db.transaction('root', 'readwrite').objectStore('root')
    rootStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.latitude = finalLocation.latitude
      record.longitude = finalLocation.longitude
      record.accuracy = finalLocation.accuracy
      record.provider = finalLocation.provider
      record.lastLocationTime = finalLocation.timestamp
      rootStore.put(record)
    }
  }
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
  } else if (requestType === 'instant' || requestType === 'now' || requestType === 'Null') {
    if (requestBody) {
      requestGenerator.body = JSON.stringify(requestBody)
    }
    apiHandler.postMessage(requestGenerator)
  } else {
    if (offset) {
      clearTimeout(offset)
      offset = null
    }
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result;
      const rootTx = db.transaction('root', 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')

      rootObjectStore.get(dbName).onsuccess = function (event) {
        const record = event.target.result

        const geopoints = {
          'latitude': record.latitude,
          'longitude': record.longitude,
          'accuracy': record.accuracy
        }
        requestBody['timestamp'] = fetchCurrentTime(record.serverTime)
        requestBody['geopoint'] = geopoints
        requestGenerator.body = requestBody
        apiHandler.postMessage(requestGenerator)
      }
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

  if (response.data.type === 'removeLocalStorage') {
    localStorage.removeItem('dbexist')
    return
  }
  if (response.data.type === 'manageLocation') {
    manageLocation()
    return
  }

  // only for development
  if (response.data.type === 'error') {
    if (document.querySelector('header .mdc-linear-progress')) {
      document.querySelector('header .mdc-linear-progress').remove()
    }
    if (document.querySelector('.loader')) {
      document.querySelector('.loader').remove()
    }
    if (document.querySelector('.delete-activity')) {
      document.querySelector('.delete-activity').style.display = 'block';
    }
    if (document.querySelector('.undo-delete-loader')) {
      document.querySelector('.undo-delete-loader').style.display = 'block';
    }

    // requestCreator('instant',{code:response.data.code,msg:response.data.msg})

    snacks(response.data.msg)
    return;
  }

  if (response.data.type === 'create-success') {
    listView()
    return;
  }

  if (response.data.type === 'reset-offset') {
    if (offset) {
      console.log("removing offset")
      clearTimeout(offset)
      offset = null
    }
    return
  }

  const req = window.indexedDB.open(firebase.auth().currentUser.uid)

  req.onsuccess = function () {
    const db = req.result

    if (response.data.type === 'updateAssigneesList') {
      console.log("only update assingee list")
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      //here dbName is activityId

      activityObjectStore.get(response.data.params.id).onsuccess = function (event) {
        const record = event.target.result
        // toggleActionables(record.editable)

        readNameAndImageFromNumber([response.data.params.number], db)
      }
      history.pushState(['listView'], null, null)
      return
    }


    if (response.data.type === 'redirect-to-list') {
      history.pushState(['listView'], null, null)
      return
    }


    // updateIDB

    if (!history.state) {
      window["listView"](true)
      return
    }



    if (history.state[0] === 'updateCreateActivity') {
      toggleActionables(history.state[1].activityId)
      handleTimeout()
      return
    }

    console.log("running view in state")
    window[history.state[0]](history.state[1], false)
    handleTimeout()
  }
}

function onErrorMessage(error) {

  const logs = {
    message: error.message,
    body: {
      'line-number': error.lineno,
      'file': error.filename
    }
}

  requestCreator('instant', logs)

  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  })

}

function handleTimeout() {

  offset = setTimeout(function () {
    requestCreator('Null')
    manageLocation();
  }, 30000)

}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector))
}