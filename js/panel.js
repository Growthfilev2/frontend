function listView () {
  listPanel()
  creatListHeader()

  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)

  req.onerror = function (event) {
    console.log(event)
  }

  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'list'
      rootObjectStore.put(record)
    }
    rootTx.oncomplete = fetchDataForActivityList(db)
  }
}

function fetchDataForActivityList (db) {
  const activityStoreTx = db.transaction('activity')
  const activityObjectStore = activityStoreTx.objectStore('activity')
  const activityObjectStoreIndex = activityObjectStore.index('timestamp')
  let activityCount = 0

  activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
    let cursor = event.target.result

    if (!cursor) {
      const fab = document.createElement('button')
      fab.className = 'mdc-fab create-activity'
      fab.setAttribute('aria-label', 'Add')
      const span = document.createElement('span')
      span.className = 'mdc-fab_icon material-icons'
      span.textContent = 'add'
      fab.appendChild(span)
      document.getElementById('activity--list').appendChild(fab)
      return
    }
    activityCount++
    createActivityList(cursor.value, 'activity--list', activityCount)

    cursor.continue()
  }
}

function listPanel () {
  if (document.getElementById('activity-list-main')) return

  const listCard = document.createElement('div')
  listCard.className = 'mdc-card panel-card mdc-top-app-bar--fixed-adjust'
  listCard.id = 'activity-list-main'
  const listUl = document.createElement('ul')
  listUl.className = 'mdc-list mdc-list--two-line mdc-list--avatar-list'
  listUl.id = 'activity--list'

  listCard.appendChild(listUl)

  document.getElementById('app-current-panel').innerHTML = listCard.outerHTML
}

function creatListHeader () {
  const parentIconDiv = document.createElement('div')
  parentIconDiv.className = 'drawer--icons'

  const profileIconDiv = document.createElement('div')
  profileIconDiv.id = 'profile-panel--icon'

  const profileImg = document.createElement('img')
  profileImg.className = 'profile--icon-small'
  profileImg.src = firebase.auth().currentUser.photoURL

  profileIconDiv.innerHTML = profileImg.outerHTML

  const mapIconCont = document.createElement('div')
  mapIconCont.id = 'map-panel--icon'

  const mapSpan = document.createElement('span')
  const locationIcon = document.createElement('i')
  locationIcon.className = 'material-icons'
  locationIcon.textContent = 'location_on'

  mapSpan.innerHTML = locationIcon.outerHTML
  mapIconCont.innerHTML = mapSpan.outerHTML

  const calendarIconCont = document.createElement('div')
  calendarIconCont.id = 'calendar-panel--icon'

  const calendarSpan = document.createElement('span')
  const calendarIcon = document.createElement('i')
  calendarIcon.className = 'material-icons'
  calendarIcon.textContent = 'today'

  calendarSpan.innerHTML = calendarIcon.outerHTML
  calendarIconCont.innerHTML = calendarSpan.outerHTML

  parentIconDiv.appendChild(mapIconCont)
  parentIconDiv.appendChild(calendarIconCont)

  header(profileIconDiv.outerHTML, parentIconDiv.outerHTML)
  const drawerIcons = ['map-panel--icon', 'calendar-panel--icon', 'profile-panel--icon']
  drawerIcons.forEach(function (selector) {
    console.log(document.getElementById('map-panel--icon'))
    document.getElementById(selector).addEventListener('click', function () {
      const user = firebase.auth().currentUser
      switch (selector) {
        case 'map-panel--icon':
          mapView(user.uid)
          break

        case 'calendar-panel--icon':
          calendarView(user.uid)
          break
        case 'profile-panel--icon':
          profileView(user)
      }
    })
  })
}

function createActivityList (data, target, count) {
  if (changeExistingActivities(data, target, count)) return

  const li = document.createElement('li')

  li.classList.add('mdc-list-item', 'activity--list-item')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id)')

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const customText = document.createElement('span')
  customText.className = 'mdc-primary__custom-text'

  customText.textContent = data.title
  leftTextContainer.appendChild(customText)

  const leftTextSecondaryContainer = document.createElement('span')
  leftTextSecondaryContainer.classList.add('mdc-list-item__secondary-text')
  leftTextSecondaryContainer.textContent = data.office

  leftTextContainer.appendChild(leftTextSecondaryContainer)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')

  const timeCustomText = document.createElement('span')
  timeCustomText.className = 'mdc-meta__custom-text'
  timeCustomText.textContent = moment(data.timestamp).calendar()

  metaTextContainer.appendChild(timeCustomText)

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', `${data.status}`)
  metaTextActivityStatus.textContent = data.status
  metaTextContainer.appendChild(metaTextActivityStatus)
  li.innerHTML += leftTextContainer.outerHTML + metaTextContainer.outerHTML

  document.getElementById(target).innerHTML += li.outerHTML
}

function changeExistingActivities (data, target, count) {
  const activitySelector = `[data-id="${data.activityId}"]`

  if (document.querySelector(activitySelector)) {
    document.querySelector(`${activitySelector} > .mdc-list-item__text  .mdc-list-item__secondary-text`).textContent = data.office
    document.querySelector(`${activitySelector} > .mdc-list-item__text .mdc-primary__custom-text`).textContent = data.title
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-meta__custom-text`).textContent = moment(data.timestamp).calendar()
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-list-item__secondary-text 
    `).textContent = data.status
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-list-item__secondary-text 
    `).className = `mdc-list-item__secondary-text ${data.status}`

    if (!count) return false

    document.getElementById(target).insertBefore(document.querySelector(activitySelector), document.getElementById(target)[count])
    return true
  }
  return false
}

function mapView (dbName) {
  console.log(dbName)
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
  createMapPanel()
  backIconHeader('close-map--drawer')

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const mapObjectStore = db.transaction('map').objectStore('map')
    const mapTimestampIndex = mapObjectStore.index('timestamp')

    document.getElementById('close-map--drawer').addEventListener('click', listView)

    const mapRecords = []

    mapTimestampIndex.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) {
        fetchCurrentLocation().then(function (geopoints) {
          console.log('s')
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

function createMapPanel () {
  const mapParent = document.createElement('div')
  mapParent.id = 'map-view--container'
  mapParent.className = 'mdc-top-app-bar--fixed-adjust'

  const mapList = document.createElement('div')
  mapList.id = 'list-view--map'
  const map = document.createElement('div')
  map.id = 'map'
  mapParent.appendChild(map)

  mapParent.appendChild(mapList)
  document.getElementById('app-current-panel').innerHTML = mapParent.outerHTML
}

function initMap (dbName, mapRecord) {
  console.log('amp')
  // user current geolocation  is set as map center
  const centerGeopoints = mapRecord[mapRecord.length - 1]
  console.log(document.getElementById('map'))
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
  console.log(locationData)
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
  // google.maps.event.addListener(map, 'zoom_changed', function (e) {
  //   generateActivityFromMarker(dbName, map, allMarkers)
  // })

  // add drag_end listener on map ,so that when draggins is done , markers will give the acitivtyId attached to them

  // google.maps.event.addListener(map, 'dragend', function (e) {
  //   console.log(e)
  //   generateActivityFromMarker(dbName, map, allMarkers)
  // })

  google.maps.event.addListener(map, 'idle', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })
}

function generateActivityFromMarker (dbName, map, markers) {
  removeDom('list-view--map')
  console.log(markers)

  let bounds = map.getBounds()

  // open IndexedDB
  let req = window.indexedDB.open(dbName)
  let activityCount = 0
  req.onsuccess = function () {
    const db = req.result

    for (let i = 0; i < markers.length; i++) {
      // marker.customInfo is the activityId related to a marker
      // if marker is in current bound area and activityId is not undefined then get the activityId related to that marker and get the record for that activityId
      if (bounds.contains(markers[i].getPosition()) && markers[i].customInfo) {
        const activityObjectStore = db.transaction('activity').objectStore('activity')
        activityObjectStore.get(markers[i].customInfo).onsuccess = function (event) {
          const record = event.target.result
          activityCount++
          createActivityList(record, 'list-view--map', activityCount)
        }
      }
    }
    // google.maps.event.clearListeners(map, 'idle')
  }
}

function calendarView (dbName) {
  // open IDB
  createCalendarPanel()
  backIconHeader('close-calendar--drawer')

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

function createCalendarPanel () {
  const calendarView = document.createElement('div')
  calendarView.id = 'calendar-view--container'
  calendarView.className = 'mdc-top-app-bar--fixed-adjust'
  const beforeDiv = document.createElement('div')
  beforeDiv.id = 'beforeToday'
  const afterDiv = document.createElement('div')
  afterDiv.id = 'afterToday'

  calendarView.appendChild(beforeDiv)
  calendarView.appendChild(afterDiv)
  document.getElementById('app-current-panel').innerHTML = calendarView.outerHTML
}

function fetchCalendarData () {
  removeDom('beforeToday')
  removeDom('afterToday')

  const dbName = firebase.auth().currentUser.uid
  const request = window.indexedDB.open(dbName)

  document.getElementById('close-calendar--drawer').addEventListener('click', listView)
  request.onsuccess = function () {
    const db = request.result
    const calendarObjectStore = db.transaction('calendar', 'readonly').objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')

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
      calendarViewUI('afterToday', db, cursor.value)
      cursor.continue()
    } else {
      document.querySelectorAll('.activity--row li').forEach(function (li) {
        li.classList.add('calendar-activity--list-item')
      })
      const parent = document.getElementById('calendar-view--container')
      const lastScrollHeight = parent.scrollHeight
      insertDatesBeforeToday(db, calendarDateIndex, today, lastScrollHeight)
    }
  }
}

function insertDatesBeforeToday (db, calendarDateIndex, today, lastScrollHeight) {
  const upperKeyRange = IDBKeyRange.upperBound(today, true)
  calendarDateIndex.openCursor(upperKeyRange).onsuccess = function (event) {
    const cursor = event.target.result
    if (cursor) {
      // console.log(cursor.value)
      calendarViewUI('beforeToday', db, cursor.value)
      cursor.continue()
    } else {
      const parent = document.getElementById('calendar-view--container')
      document.documentElement.scrollTop = parent.scrollHeight - lastScrollHeight

      document.querySelectorAll('.activity--row li').forEach(function (li) {
        li.classList.add('calendar-activity--list-item')
      })
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
    activityRow.id = `activity--row${data.date}`

    dateDiv.appendChild(dateCol)
    dateDiv.appendChild(activityRow)
    document.getElementById(target).appendChild(dateDiv)

    getActivity(db, data)
    return
  }
  getActivity(db, data)
}

function getActivity (db, data) {
  // console.log(count)
  if (data.hasOwnProperty('activityId')) {
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    activityObjectStore.get(data.activityId).onsuccess = function (event) {
      const record = event.target.result
      createActivityList(record, `activity--row${data.date}`)
    }
  }
}

function profileView (user) {
  const dbName = firebase.auth().currentUser.uid

  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'profile'
      rootObjectStore.put(record)
      rootTx.oncomplete = function () {
        backIconHeader('close-profile--panel')
        createProfilePanel()

        document.getElementById('close-profile--panel').addEventListener('click', listView)
        showProfilePicture()

        inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)

        changeDisplayName(user)
        changeEmailAddress(user)
        document.getElementById('change-link').addEventListener('click', phoneNumberDialog)
      }
    }
  }
}

function createProfilePanel () {
  const profileView = document.createElement('div')
  profileView.id = 'profile-view--container'
  profileView.className = 'mdc-top-app-bar--fixed-adjust'

  const uploadBtn = document.createElement('button')
  uploadBtn.className = 'mdc-fab'

  const label = document.createElement('label')
  label.setAttribute('for', 'uploadProfileImage')
  const btnText = document.createElement('span')
  btnText.className = 'mdc-fab__icon material-icons'
  btnText.textContent = 'add_a_photo'

  label.appendChild(btnText)
  uploadBtn.appendChild(label)

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.style.display = 'none'
  fileInput.id = 'uploadProfileImage'

  const profileImgCont = document.createElement('div')
  profileImgCont.id = 'profile--image-container'

  const profileImg = document.createElement('img')
  profileImg.id = 'user-profile--image'

  // profileImg.src =''

  profileImgCont.appendChild(profileImg)
  profileImgCont.appendChild(uploadBtn)
  profileImgCont.appendChild(fileInput)

  const nameChangeCont = document.createElement('div')
  nameChangeCont.id = 'name--change-container'

  const nameTextField = document.createElement('div')
  nameTextField.className = 'mdc-text-field mdc-button--dense'
  nameTextField.id = 'displayName'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.className = 'mdc-text-field__input'
  nameInput.disabled = true
  nameInput.style.borderBottom = 'none'

  nameTextField.appendChild(nameInput)

  const toggleBtnName = document.createElement('button')
  toggleBtnName.className = 'mdc-icon-button material-icons'
  toggleBtnName.id = 'edit--name'

  toggleBtnName.setAttribute('aria-hidden', 'true')
  toggleBtnName.setAttribute('aria-pressed', 'false')
  toggleBtnName.setAttribute('data-toggle-on-content', 'check')
  toggleBtnName.setAttribute('data-toggle-on-label', 'check')
  toggleBtnName.setAttribute('data-toggle-off-content', 'edit')
  toggleBtnName.setAttribute('data-toggle-off-label', 'displayName')

  toggleBtnName.textContent = 'edit'

  nameChangeCont.appendChild(nameTextField)
  nameChangeCont.appendChild(toggleBtnName)

  const emailCont = document.createElement('div')
  emailCont.id = 'email--change-container'

  const emailTextField = document.createElement('div')
  emailTextField.className = 'mdc-text-field mdc-button--dense'
  emailTextField.id = 'email'

  const emailInput = document.createElement('input')
  emailInput.className = 'mdc-text-field__input'
  emailInput.type = 'text'
  emailInput.style.borderBottom = 'none'

  emailTextField.appendChild(emailInput)

  const toggleBtnEmail = document.createElement('button')
  toggleBtnEmail.className = 'mdc-icon-button material-icons'
  toggleBtnEmail.id = 'edit--email'
  toggleBtnEmail.setAttribute('aria-hidden', 'true')
  toggleBtnEmail.setAttribute('aria-pressed', 'false')
  toggleBtnEmail.setAttribute('data-toggle-on-content', 'check')
  toggleBtnEmail.setAttribute('data-toggle-on-label', 'check')
  toggleBtnEmail.setAttribute('data-toggle-off-content', 'edit')
  toggleBtnEmail.setAttribute('data-toggle-off-label', 'updateEmail')

  toggleBtnEmail.textContent = 'email'

  const reauthCont = document.createElement('div')
  reauthCont.id = 'reauth-recaptcha'
  reauthCont.className = 'reauthCont'

  const otpCont = document.createElement('div')
  otpCont.id = 'reauth-otp--container'

  emailCont.appendChild(emailTextField)
  emailCont.appendChild(toggleBtnEmail)
  emailCont.appendChild(reauthCont)
  emailCont.appendChild(otpCont)

  const changeNumCont = document.createElement('div')
  changeNumCont.id = 'change--number-container'

  const changeNumberText = document.createElement('div')
  changeNumberText.className = 'change--span'
  const infoText = document.createElement('span')
  infoText.className = 'info--span-number'

  const info = document.createElement('span')
  info.id = 'change-link'
  info.textContent = 'click here '
  // first append

  infoText.textContent = 'to change your number'
  changeNumberText.appendChild(info)
  changeNumberText.appendChild(infoText)

  const mainChange = document.createElement('div')
  mainChange.id = 'phone-number--change-container'
  mainChange.className = 'mdc-layout-grid__inner'

  const submitCont = document.createElement('div')
  submitCont.id = 'submit-action'

  changeNumCont.appendChild(mainChange)
  changeNumCont.appendChild(submitCont)

  profileView.appendChild(profileImgCont)
  profileView.appendChild(nameChangeCont)
  profileView.appendChild(emailCont)
  profileView.appendChild(changeNumCont)
  profileView.appendChild(changeNumberText)
  document.getElementById('app-current-panel').innerHTML = profileView.outerHTML
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
  console.log(event)
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

function createConfirmDialog () {
  const aside = document.createElement('aside')

  aside.id = 'change-number-dialog'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'
  aside.setAttribute('aria-labelledby', 'change-number-dialog-label')
  aside.setAttribute('ariadescribedby', 'change-number-dialog-description')

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const dialogHeader = document.createElement('header')
  dialogHeader.className = 'mdc-dialog__header'
  const heading = document.createElement('h2')
  heading.id = 'change-number-dialog-label'
  heading.className = 'mdc-dialog__header__title'
  heading.textContent = 'Are you sure you want to change your number'

  dialogHeader.appendChild(heading)

  const section = document.createElement('section')
  section.textContent = 'lorem ipsum'
  section.className = 'mdc-dialog__body'
  section.id = 'change-number-dialog-description'

  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'

  const decline = document.createElement('button')
  decline.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel'
  decline.type = 'button'
  decline.textContent = 'Cancel'

  const accept = document.createElement('button')
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept'
  accept.type = 'button'
  accept.textContent = 'Agree'

  footer.appendChild(decline)
  footer.appendChild(accept)

  dialogSurface.appendChild(dialogHeader)
  dialogSurface.appendChild(section)
  dialogSurface.appendChild(footer)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)
}
function phoneNumberDialog (event) {
  createConfirmDialog()
  const mdcDialog = new mdc.dialog.MDCDialog(document.getElementById('change-number-dialog'))

  mdcDialog.listen('MDCDialog:accept', changePhoneNumber)
  mdcDialog.listen('MDCDialog:cancel', resetInputs)

  mdcDialog.lastFocusedTarget = event.target
  mdcDialog.show()
}

function resetInputs () {
  document.getElementsByClassName('change--span')[0].style.display = 'block'
  document.getElementById('edit--name').disabled = false
  document.getElementById('edit--email').disabled = false
  document.querySelector('#profile--image-container .mdc-fab').style.transform = 'translate(-50%, -50%)'
}

function disableInputs () {
  document.getElementsByClassName('change--span')[0].style.display = 'none'
  document.getElementById('edit--name').disabled = true
  document.getElementById('edit--email').disabled = true
  document.querySelector('#profile--image-container .mdc-fab').style.transform = 'translate(-190%, -50%)'
}
function changePhoneNumber () {
  disableInputs()

  const currentcountryDiv = document.createElement('div')
  currentcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-1')
  currentcountryDiv.id = 'current-country--code'
  const currentCountryInput = document.createElement('input')
  currentCountryInput.classList.add('mdc-text-field__input')
  currentCountryInput.maxLength = 4
  currentcountryDiv.appendChild(currentCountryInput)

  const currentNumberDiv = document.createElement('div')
  currentNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-3')
  currentcountryDiv.id = 'current-phone--number'

  const currentNumberInput = document.createElement('input')
  currentNumberInput.maxLength = 14
  currentNumberInput.classList.add('mdc-text-field__input')
  currentNumberDiv.appendChild(currentNumberInput)

  const newcountryDiv = document.createElement('div')
  newcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-1')
  newcountryDiv.id = 'new-country--code'
  const newCountryInput = document.createElement('input')
  newCountryInput.classList.add('mdc-text-field__input')
  newCountryInput.maxLength = 4
  newcountryDiv.appendChild(newCountryInput)

  const newNumberDiv = document.createElement('div')
  newNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-3')
  newNumberDiv.id = 'new-phone--number'
  const newNumberInput = document.createElement('input')
  newNumberInput.classList.add('mdc-text-field__input')
  newNumberInput.maxLength = 14
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
    resetInputs()
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

const header = function (contentStart, contentEnd) {
  const header = document.createElement('header')
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed'

  const row = document.createElement('div')
  row.className = 'mdc-top-app-bar__row'

  const sectionStart = document.createElement('section')
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start'

  const leftUI = document.createElement('div')
  leftUI.id = 'view-type'
  leftUI.innerHTML = contentStart

  sectionStart.appendChild(leftUI)

  const sectionEnd = document.createElement('div')
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end'

  const rightUI = document.createElement('div')
  rightUI.id = 'action-data'
  if (contentEnd) {
    rightUI.innerHTML = contentEnd
  }
  sectionEnd.appendChild(rightUI)
  row.appendChild(sectionStart)
  row.appendChild(sectionEnd)
  header.innerHTML = row.outerHTML
  document.getElementById('header').innerHTML = header.outerHTML
}

function backIconHeader (id) {
  const backSpan = document.createElement('span')
  backSpan.id = id
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  header(backSpan.outerHTML)
}

function removeDom (selector) {
  const target = document.getElementById(selector)
  target.innerHTML = ''
}
