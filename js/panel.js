function listView () {
  removeDom('activity--list')
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

    activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
      let cursor = event.target.result

      if (!cursor) {
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
  metaTextContainer.textContent = `${new Date(data.timestamp).getHours()} : ${new Date(data.timestamp).getMinutes()}`

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text')
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
    const mapRecords = []

    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')

    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'map'
      rootObjectStore.put(record)
    }

    const mdcMapDrawer = mdc
      .drawer
      .MDCTemporaryDrawer
      .attachTo(document.getElementById('map-drawer'))
    // open map drawer

    mdcMapDrawer.open = true

    document.getElementById('close-map--drawer').addEventListener('click', function () {
      const db = req.result
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')

      rootObjectStore.get(dbName).onsuccess = function (event) {
        const record = event.target.result
        record.view = 'default'
        rootObjectStore.put(record)
      }
      mdcMapDrawer.open = false
    })

    const mapObjectStore = db.transaction('map').objectStore('map')
    const mapLocationIndex = mapObjectStore.index('location')

    mapLocationIndex.openCursor().onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) {
        mapRecords.push({
          location: 'your location',

          geopoint: {
            '_latitude': 28.6667,
            '_longitude': 77.2167
          }
        })
        initMap(dbName, mapRecords)
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
    const activityObjectStore = db.transaction('activity').objectStore('activity')

    for (let i = 0; i < markers.length; i++) {
      // marker.customInfo is the activityId related to a marker
      // if marker is in current bound area and activityId is not undefined then get the activityId related to that marker and get the record for that activityId
      if (bounds.contains(markers[i].getPosition()) && markers[i].customInfo) {
        activityObjectStore.openCursor(markers[i].customInfo).onsuccess = function (event) {
          const cursor = event.target.result

          if (!cursor) return

          // call listViewUI to render listView
          listViewUI(cursor.value, 'list-view--map')
        }
      }
    }
  }
}

function calendarView (dbName) {
  const mdcCalendarDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('calendar-drawer'))

  mdcCalendarDrawer.open = true
  removeDom('calendar-view--container')

  // open IDB
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const calendarTx = db.transaction(['calendar'], 'readonly')
    const calendarObjectStore = calendarTx.objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')

    calendarDateIndex.openCursor().onsuccess = function (event) {
      const cursor = event.target.result

      if (cursor) {
        calendarViewUI(db, cursor.value)
        cursor.continue()
      } else {
        document.querySelectorAll('.activity--row li').forEach(function (li) {
          li.classList.add('calendar-activity--list-item')
        })
      }
    }
  }

  req.onerror = function (event) {
    console.log(event.target.result)
  }
}

function calendarViewUI (db, data) {
  const commonDate = data.date.toDateString()
  const commonParsedDate = Date.parse(commonDate)

  if (!document.getElementById(commonParsedDate)) {
    const dateDiv = document.createElement('div')
    dateDiv.id = commonParsedDate
    dateDiv.className = 'date-container mdc-elevation--z1'

    const dateCol = document.createElement('div')
    dateCol.className = 'date-col'

    const borderCol = document.createElement('div')
    borderCol.className = 'border--circle-date'

    const dateSpan = document.createElement('span')
    dateSpan.textContent = commonDate.split(' ')[2]
    dateSpan.className = 'mdc-typography--headline5'

    const monthSpan = document.createElement('span')
    monthSpan.className = 'month-row mdc-list-item__secondary-text mdc-typography--subtitle2'
    monthSpan.textContent = commonDate.split(' ')[1]

    borderCol.appendChild(dateSpan)
    borderCol.appendChild(monthSpan)

    dateCol.appendChild(borderCol)

    const activityRow = document.createElement('div')
    activityRow.className = 'activity--row'
    activityRow.id = `row-${commonParsedDate}`

    dateDiv.appendChild(dateCol)
    dateDiv.appendChild(activityRow)

    document.getElementById('calendar-view--container').appendChild(dateDiv)
    getActivity(db, data, `row-${commonParsedDate}`)
    return
  }

  getActivity(db, data, `row-${commonParsedDate}`)
}

function getActivity (db, data, target) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  activityObjectStore.openCursor(data.activityId).onsuccess = function (event) {
    const cursor = event.target.result

    listViewUI(cursor.value, target)
  }
}

function profileView (user) {
  const mdcProfileDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('profile-drawer'))

  mdcProfileDrawer.open = true

  showProfilePicture()

  inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)
  toggleIconData('edit--email', 'email')
  changeDisplayName(user)
  changePhoneNumber(user)
}

function toggleIconData (icon, inputFieldSelector) {
  const iconEl = document.getElementById(icon)

  var toggleButton = new mdc.iconButton.MDCIconButtonToggle(iconEl)
  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function ({
    detail
  }) {
    if (!detail.isOn) {
      const key = this.dataset.toggleOffLabel
      const text = getInputText(inputFieldSelector).value
      handleFieldInput(key, text)
    }
  })
}

function handleFieldInput (key, value) {
  const user = firebase.auth().currentUser

  if (key === 'displayName') {
    user.updateProfile({
      key: value
    }).then(displayNameUpdated).catch(authUpdatedError)
  }

  if (key === 'updateEmail') {
    reauthUser()

    user.updateEmail(value).then(emailUpdateSuccess).catch(authUpdatedError)
  }
}

function emailUpdateSuccess () {
  console.log('done')
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
  // document.getElementById('user-profile--image').src = user.photoURL
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

  toggleIconData('edit--name', 'displayName')
}

function reauthUser () {
  const applicationVerifier = new firebase.auth.RecaptchaVerifier('reauth-recaptcha')
  const provider = new firebase.auth.PhoneAuthProvider()
  const userPhoneNumber = firebase.auth().currentUser.phoneNumber
  console.log(userPhoneNumber)
  provider.verifyPhoneNumber(userPhoneNumber, applicationVerifier).then(generateVerificationId)
}

function generateVerificationId (verificationId) {
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

  document.getElementById('email--change-container').appendChild(otpDiv)

  document.querySelector('.getOtp').addEventListener('click', function () {
    const otp = getInputText('reauth-otp').value
    const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp)
    generateCredential(credential)
  })
}

function generateCredential (credential) {
  console.log(credential)
  const user = firebase.auth().currentUser
  user.reauthenticateAndRetrieveDataWithCredential(credential).then().catch(handleReauthError)
}

function handleReauthError (error) {
  console.log(error)
}

function changePhoneNumber (user) {
  // document.getElementById('updatePhone').addEventListener('click', function () {
  //   const newCountryCode = getInputText('current-country--code').value
  //   const newPhoneNumber = getInputText('current-phone--number').value
  //   const currentCountryCode = getInputText('new-country--code').value
  //   const currentPhoneNumber = getInputText('new-phone--number').value

  //   if (verifyCurrentPhoneNumber(user.phoneNumber) && verifyCurrentPhoneNumber()) {
  //   }
  // })
}

function verifyNewPhoneNumber () {
  const expression = /^\+[1-9]\d{5,14}$/
  return regex.test(expression)
}

function verifyCurrentPhoneNumber (currentNumber) {
  if (currentCountryCode.concat(currentPhoneNumber) !== currentNumber) {
    return false
  }
  return true
}

function removeDom (selector) {
  const target = document.getElementById(selector)
  while (target.lastChild) {
    target.removeChild(target.lastChild)
  }
}
