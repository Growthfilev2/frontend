function listView () {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)
  
  req.onerror = function (event) {
    console.log(event)
  }
  
  req.onsuccess = function () {
    const db = req.result
    const activityStoreTx = db.transaction('activity')
    const activityObjectStore = activityStoreTx.objectStore('activity')
    const activityObjectStoreIndex = activityObjectStore.index('timestamp')
    removeDom('activity--list')
    // document.getElementById('activity--list').style.display ='none'
    activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
      let cursor = event.target.result

      if (!cursor) {
        // document.getElementById('activity--list').style.display ='block'

        console.log('all enteries displayed')

        return
      }

      listViewUI(cursor.value, 'activity--list')

      cursor.continue()
    }
  }
}

function listViewUI (data, target) {
  const li = document.createElement('li')
  
  li.classList.add('mdc-list-item', 'activity--list-item')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id)')

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  leftTextContainer.textContent = data.title

  const leftTextSecondaryContainer = document.createElement('span')
  leftTextSecondaryContainer.classList.add('mdc-list-item__secondary-text')
  leftTextSecondaryContainer.textContent = data.office

  leftTextContainer.appendChild(leftTextSecondaryContainer)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')
  metaTextContainer.textContent = moment(data.timestamp).calendar()

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', `${data.status}`)
  metaTextActivityStatus.textContent = data.status
  metaTextContainer.appendChild(metaTextActivityStatus)
  li.innerHTML += leftTextContainer.outerHTML + metaTextContainer.outerHTML

  document.getElementById(target).appendChild(li)
}

const drawerIcons = ['map-drawer--icon', 'calendar-drawer--icon', 'profile-drawer--icon']
drawerIcons.forEach(function (selector) {
  document.getElementById(selector).addEventListener('click', function () {
    const user = firebase.auth().currentUser
    switch (selector) {
      case 'map-drawer--icon':
        mapView(user.uid)
        break

      case 'calendar-drawer--icon':
        calendarView(user.uid)
        break
      case 'profile-drawer--icon':
        profileView(user)
    }
  })
})

function mapView (dbName) {
  // initialize mdc instance for map drawer
  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')

    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'map'
      rootObjectStore.put(record)
      rootTx.oncomplete = fetchMapData
    }
  }
}

function fetchMapData () {
  const mdcMapDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('map-drawer'))
  // open map drawer

  mdcMapDrawer.open = true
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const mapObjectStore = db.transaction('map').objectStore('map')
    const mapTimestampIndex = mapObjectStore.index('timestamp')

    document.getElementById('close-map--drawer').addEventListener('click', function () {
      loadDefaultView(db, mdcMapDrawer)
    })

    const mapRecords = []

    mapTimestampIndex.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) {
        fetchCurrentLocation().then(function (geopoints) {
          mapRecords.push({
            location: 'your location',

            geopoint: {
              '_latitude': geopoints.latitude,
              '_longitude': geopoints.longitude
            }
          })
          initMap(dbName, mapRecords)
        })
        return
      }

      mapRecords.push(cursor.value)
      cursor.continue()
    }
  }
}

function initMap (dbName, mapRecord) {
  // user current geolocation  is set as map center
  const centerGeopoints = mapRecord[mapRecord.length - 1]

  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: new google.maps.LatLng(
      centerGeopoints.geopoint['_latitude'],
      centerGeopoints.geopoint['_longitude']
    ),

    streetViewControl: false,
    mapTypeControl: false,
    rotateControl: false,
    fullscreenControl: false,

    mapTypeId: google.maps.MapTypeId.ROADMAP
  })

  displayMarkers(dbName, map, mapRecord)
}

function displayMarkers (dbName, map, locationData) {
  let bounds = new google.maps.LatLngBounds()

  const allMarkers = []

  for (let i = 0; i < locationData.length; i++) {
    // create marker
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(locationData[i].geopoint['_latitude'], locationData[i].geopoint['_longitude']),
      icon: i === locationData.length - 1 ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' : '',
      title: locationData[i].location,
      customInfo: locationData[i].activityId
    })

    // set bounds to extend to a marker
    bounds.extend(marker.getPosition())

    // set marker to map
    marker.setMap(map)

    // push marker to allMarkers array
    allMarkers.push(marker)
  }

  // fit all markers to default view of map
  map.fitBounds(bounds)

  // add zoom_changed listener on map ,so that when zoom changes, markers will give the acitivtyId attached to them
  google.maps.event.addListener(map, 'zoom_changed', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })

  // add drag_end listener on map ,so that when draggins is done , markers will give the acitivtyId attached to them

  google.maps.event.addListener(map, 'dragend', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })
}

function generateActivityFromMarker (dbName, map, markers) {
  removeDom('list-view--map')

  let bounds = map.getBounds()

  // open IndexedDB
  let req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result

    for (let i = 0; i < markers.length; i++) {
      // marker.customInfo is the activityId related to a marker
      // if marker is in current bound area and activityId is not undefined then get the activityId related to that marker and get the record for that activityId
      if (bounds.contains(markers[i].getPosition()) && markers[i].customInfo) {
        const activityObjectStore = db.transaction('activity').objectStore('activity')
        activityObjectStore.get(markers[i].customInfo).onsuccess = function (event) {
          const record = event.target.result
          listViewUI(record, 'list-view--map')
        }
      }
    }
  }
}

function calendarView (dbName) {
  // open IDB
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')

    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'calendar'
      rootObjectStore.put(record)
      rootTx.oncomplete = fetchCalendarData
    }
  }

  req.onerror = function (event) {
    console.log(event.target.result)
  }
}

function fetchCalendarData () {
  removeDom('beforeToday')
  removeDom('afterToday')
  const mdcCalendarDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('calendar-drawer'))

  mdcCalendarDrawer.open = true

  const dbName = firebase.auth().currentUser.uid
  const request = window.indexedDB.open(dbName)

  request.onsuccess = function () {
    const db = request.result
    const calendarObjectStore = db.transaction('calendar', 'readonly').objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')

    document.getElementById('close-calendar--drawer').addEventListener('click', function () {
      loadDefaultView(db, mdcCalendarDrawer)
    })

    const today = moment().format('YYYY-MM-DD')

    calendarDateIndex.get(today).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        calendarViewUI('afterToday', db, {
          date: today
        })
      }
      insertDatesAfterToday(db, calendarDateIndex, today)
    }
  }
  request.onerror = function (event) {
    console.log(event)
  }
}

function insertDatesAfterToday (db, calendarDateIndex, today) {
  const lowerKeyRange = IDBKeyRange.lowerBound(today)
  calendarDateIndex.openCursor(lowerKeyRange).onsuccess = function (event) {
    const cursor = event.target.result
    if (cursor) {
      // console.log(cursor.value)

      calendarViewUI('afterToday', db, cursor.value)
      cursor.continue()
    } else {
      document.querySelectorAll('.activity--row li').forEach(function (li) {
        li.classList.add('calendar-activity--list-item')
      })
      const cont = document.getElementById('afterToday')
      insertDatesBeforeToday(db, calendarDateIndex, today)
      document.getElementById('calendar-view--container').scrollTop = cont.offsetTop - 50
    }
  }
}

function insertDatesBeforeToday (db, calendarDateIndex, today) {
  const upperKeyRange = IDBKeyRange.upperBound(today, true)

  calendarDateIndex.openCursor(upperKeyRange).onsuccess = function (event) {
    const cursor = event.target.result
    if (cursor) {
      // console.log(cursor.value)
      calendarViewUI('beforeToday', db, cursor.value)
      cursor.continue()
    } else {
      document.querySelectorAll('.activity--row li').forEach(function (li) {
        li.classList.add('calendar-activity--list-item')
      })
      const cont = document.getElementById('afterToday')

      document.getElementById('calendar-view--container').scrollTop = cont.offsetTop - 50
    }
  }
}

function calendarViewUI (target, db, data) {
  if (!document.getElementById(data.date)) {
    const dateDiv = document.createElement('div')
    dateDiv.id = data.date
    dateDiv.className = 'date-container mdc-elevation--z1'

    const dateCol = document.createElement('div')
    dateCol.className = 'date-col'

    const borderCol = document.createElement('div')
    borderCol.className = 'border--circle-date'

    const dateSpan = document.createElement('span')
    dateSpan.textContent = moment(data.date).format('DD')
    dateSpan.className = 'mdc-typography--headline5'

    const monthSpan = document.createElement('span')
    monthSpan.className = 'month-row mdc-list-item__secondary-text mdc-typography--subtitle2'
    monthSpan.textContent = moment(data.date).format('MMMM')

    borderCol.appendChild(dateSpan)
    borderCol.appendChild(monthSpan)

    dateCol.appendChild(borderCol)

    const activityRow = document.createElement('div')
    activityRow.className = 'activity--row'

    dateDiv.appendChild(dateCol)
    dateDiv.appendChild(activityRow)
    document.getElementById(target).appendChild(dateDiv)
    getActivity(db, data)
    return
  }
  getActivity(db, data)
}

function getActivity (db, data) {
  if (data.hasOwnProperty('activityId')) {
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    activityObjectStore.get(data.activityId).onsuccess = function (event) {
      const record = event.target.result
      listViewUI(record, data.date)
      // if(cursor.value.activityId === data.activityId) {
      // }
    }
  }
}

function profileView (user) {
  const mdcProfileDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('profile-drawer'))

  mdcProfileDrawer.open = true
  document.getElementById('close-profile--drawer').addEventListener('click', function () {
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      loadDefaultView(db, mdcProfileDrawer)
    }
  })
  showProfilePicture()

  inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)

  changeDisplayName(user)
  changeEmailAddress(user)
  document.getElementById('change-link').addEventListener('click', phoneNumberDialog)
}

function toggleIconData (icon, inputField) {
  const iconEl = document.getElementById(icon)

  var toggleButton = new mdc.iconButton.MDCIconButtonToggle(iconEl)
  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function ({
    detail
  }) {
    if (!detail.isOn) {
      inputField['input_'].disabled = true
      inputField['input_'].style.borderBottom = 'none'
      const key = this.dataset.toggleOffLabel
      const text = inputField.value
      handleFieldInput(key, text)
    } else {
      console.log(inputField)
      inputField['input_'].style.borderBottom = '1px solid rgba(0,0,0,.42)'
      inputField['input_'].disabled = false
    }
  })
}

function handleFieldInput (key, value) {
  const user = firebase.auth().currentUser
  console.log(typeof value)
  if (key === 'displayName') {
    user.updateProfile({
      [key]: value
    }).then(function () {
      console.log(user)
    }).catch(authUpdatedError)
  }

  if (key === 'updateEmail') {
    reauthUser(value)
  }
}

function readUploadedFile (event) {
  const file = event.target.files[0]

  const reader = new FileReader()

  if (file) {
    reader.readAsDataURL(file)
    processImage(file)
  }
}

function processImage (image) {
  const metadata = {
    contentType: 'image/jpeg'
  }

  const uid = firebase.auth().currentUser.uid
  const storageRef = firebase.storage().ref(`ProfileImage/${uid}`)
  const uploadTask = storageRef.put(image, metadata)

  uploadTask.on(
    firebase.storage.TaskEvent.STATE_CHANGED,
    snapshotHandler,
    storageErrorHandler,
    storageSuccessHandler
  )

  function snapshotHandler (snapshot) {
    if (firebase.storage.TaskState.RUNNING) {
      console.log('running')
      // show gola
    }
  }

  function storageErrorHandler (error) {
    if (error.code === 'storage/unknown') {
      console.log(error)
    }
    console.log(error)
  }

  function storageSuccessHandler () {
    uploadTask.snapshot.ref.getDownloadURL().then(updateAuth)
  }
}

function updateAuth (url) {
  const user = firebase.auth().currentUser
  user.updateProfile({
    photoURL: url
  }).then(showProfilePicture).catch(authUpdatedError)
}

function showProfilePicture () {
  // remove gola
  // preview image on profile drawer and toolbar in list view
  const user = firebase.auth().currentUser
  document.getElementById('user-profile--image').src = user.photoURL
}

function authUpdatedError (error) {
  console.log(error)
}

function changeDisplayName (user) {
  const displayNameField = getInputText('displayName')

  if (!user.displayName) {
    displayNameField['input_'].placeholder = 'choose a user name'
  } else {
    displayNameField.value = user.displayName
  }

  toggleIconData('edit--name', displayNameField)
}

function changeEmailAddress (user) {
  const emailField = getInputText('email')
  if (!user.email) {
    emailField['input_'].placeholder = 'set an email address'
  } else {
    emailField.value = user.email
  }

  toggleIconData('edit--email', emailField)
}

function reauthUser (email) {
  const applicationVerifier = new firebase.auth.RecaptchaVerifier('reauth-recaptcha')
  const provider = new firebase.auth.PhoneAuthProvider()
  const userPhoneNumber = firebase.auth().currentUser.phoneNumber
  provider.verifyPhoneNumber(userPhoneNumber, applicationVerifier).then(function (verificationId) {
    generateVerificationId(verificationId, email)
  })
}

function generateVerificationId (verificationId, email) {
  removeDom('reauth-recaptcha')

  const otpDiv = document.createElement('div')
  otpDiv.classList.add('mdc-text-field')
  otpDiv.id = 'reauth-otp'
  const otpInput = document.createElement('input')
  otpInput.classList.add('mdc-text-field__input')
  const submitButtonOtp = document.createElement('button')
  submitButtonOtp.textContent = 'submit'
  submitButtonOtp.classList.add('mdc-button', 'getOtp')
  otpDiv.appendChild(otpInput)
  otpDiv.appendChild(submitButtonOtp)

  document.getElementById('reauth-otp--container').appendChild(otpDiv)

  document.querySelector('.getOtp').addEventListener('click', function () {
    const otp = getInputText('reauth-otp').value
    const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp)
    generateCredential(credential, email)
  })
}

function generateCredential (credential, email) {
  removeDom('reauth-otp--container')
  console.log(credential)
  const user = firebase.auth().currentUser
  user.reauthenticateAndRetrieveDataWithCredential(credential).then(function () {
    updateEmail(user, email)
  }).catch(handleReauthError)
}

function updateEmail (user, email) {
  user.updateEmail(email).then(emailUpdateSuccess).catch(authUpdatedError)
}

function emailUpdateSuccess () {
  const user = firebase.auth().currentUser
  user.sendEmailVerification().then(emailVerificationSuccess).catch(emailVerificationError)
}

function emailVerificationSuccess () {
  console.log('email verified')
}

function emailVerificationError (error) {
  console.log(error)
}

function handleReauthError (error) {
  console.log(error)
}

function phoneNumberDialog (event) {
  const mdcDialog = new mdc.dialog.MDCDialog(document.getElementById('change-number-dialog'))

  mdcDialog.listen('MDCDialog:accept', changePhoneNumber)
  mdcDialog.listen('MDCDialog:cancel', function () {
    console.log('canceled')
  })

  mdcDialog.lastFocusedTarget = event.target
  mdcDialog.show()
}

function changePhoneNumber () {
  const currentcountryDiv = document.createElement('div')
  currentcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-2')
  const currentCountryInput = document.createElement('input')
  currentCountryInput.classList.add('mdc-text-field__input')
  currentcountryDiv.id = 'current-country--code'
  currentcountryDiv.appendChild(currentCountryInput)

  const currentNumberDiv = document.createElement('div')
  currentNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-10')
  currentNumberDiv.id = 'current-phone--number'
  const currentNumberInput = document.createElement('input')
  currentNumberInput.classList.add('mdc-text-field__input')
  currentNumberDiv.appendChild(currentNumberInput)

  const newcountryDiv = document.createElement('div')
  newcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-2')
  newcountryDiv.id = 'new-country--code'
  const newCountryInput = document.createElement('input')
  newCountryInput.classList.add('mdc-text-field__input')
  newcountryDiv.appendChild(newCountryInput)

  const newNumberDiv = document.createElement('div')
  newNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-10')
  newNumberDiv.id = 'new-phone--number'
  const newNumberInput = document.createElement('input')
  newNumberInput.classList.add('mdc-text-field__input')
  newNumberDiv.appendChild(newNumberInput)

  const submit = document.createElement('button')
  submit.classList.add('mdc-button')
  submit.id = 'updatePhone'
  submit.textContent = 'submit'

  const cancel = document.createElement('button')
  cancel.classList.add('mdc-button')
  cancel.id = 'cancelUpdate'
  cancel.textContent = 'cancel'

  document.getElementById('phone-number--change-container').innerHTML = currentcountryDiv.outerHTML + currentNumberDiv.outerHTML + newcountryDiv.outerHTML + newNumberDiv.outerHTML
  document.getElementById('submit-action').innerHTML = submit.outerHTML + cancel.outerHTML

  document.getElementById('updatePhone').addEventListener('click', function (e) {
    console.log(e)

    if (verifyCurrentPhoneNumber() && verifyNewPhoneNumber()) {
      const reqBody = {
        'phoneNumber': newPhoneNumber()
      }
      requestCreator('updateUserNumber', reqBody)
    }
  })

  document.getElementById('cancelUpdate').addEventListener('click', function (event) {
    removeDom('phone-number--change-container')
    removeDom('submit-action')
  })
}

function newPhoneNumber () {
  const newCountryCode = getInputText('new-country--code').value
  const newNumber = getInputText('new-phone--number').value
  return newCountryCode.concat(newNumber)
}

function verifyNewPhoneNumber () {
  const expression = /^\+[1-9]\d{5,14}$/
  return expression.test(newPhoneNumber())
}

function verifyCurrentPhoneNumber () {
  const currentCountryCode = getInputText('current-country--code').value
  const currentNumber = getInputText('current-phone--number').value
  const numberInAuth = firebase.auth().currentUser.phoneNumber

  console.log(currentCountryCode.concat(currentNumber))
  if (currentCountryCode.concat(currentNumber) === numberInAuth) {
    return true
  }
  return false
}

function loadDefaultView (db, drawer) {
  const rootTx = db.transaction(['root'], 'readwrite')
  const rootObjectStore = rootTx.objectStore('root')
  const dbName = firebase.auth().currentUser.uid
  rootObjectStore.get(dbName).onsuccess = function (event) {
    const record = event.target.result
    record.view = 'main'
    rootObjectStore.put(record)
    rootTx.oncomplete = function () {
      listView()
      conversation(record.id)
      drawer.open = false
    }
  }
}

function removeDom (selector) {
  const target = document.getElementById(selector)
  target.innerHTML = ''
  // while (target.lastChild) {
  //   target.removeChild(target.lastChild)
  // }
}
