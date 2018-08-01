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
    rootTx.oncomplete = findUniqueOffice().then(function (unique) {
      console.log(unique)
      fetchDataForActivityList(db, unique)
    }).catch(console.log)
  }
}

function fetchDataForActivityList (db, uniqueOffice) {
  const activityStoreTx = db.transaction('activity')
  const activityObjectStore = activityStoreTx.objectStore('activity')
  const activityObjectStoreIndex = activityObjectStore.index('timestamp')

  const subscriptionObjectStore = db.transaction(['subscriptions']).objectStore('subscriptions')
  const subscriptionCount = subscriptionObjectStore.count()
  let activityCount = 0

  activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
    let cursor = event.target.result

    if (!cursor) {
      console.log(subscriptionCount.result)
      if (!subscriptionCount.result) return
      const fab = document.createElement('button')
      fab.className = 'mdc-fab create-activity'
      fab.setAttribute('aria-label', 'Add')
      const span = document.createElement('span')
      span.className = 'mdc-fab_icon material-icons'
      span.textContent = 'add'
      fab.appendChild(span)
      document.getElementById('activity--list').appendChild(fab)
      document.querySelector('.create-activity').addEventListener('click', createActivity)
      return
    }
    activityCount++

    createActivityList(cursor.value, 'activity--list', activityCount, uniqueOffice)

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

function createActivityList (data, target, count, uniqueOffice) {
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

  if (uniqueOffice) {
    const leftTextSecondaryContainer = document.createElement('span')
    leftTextSecondaryContainer.classList.add('mdc-list-item__secondary-text')
    leftTextSecondaryContainer.textContent = data.office
    leftTextContainer.appendChild(leftTextSecondaryContainer)
  }

  const leftTextTemplateContainer = document.createElement('span')
  leftTextTemplateContainer.className = 'mdc-list-item__secondary-text secondary--text-template'
  leftTextTemplateContainer.textContent = data.template

  leftTextContainer.appendChild(leftTextTemplateContainer)

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
  if (document.querySelector(`#${target} ${activitySelector}`)) {
    console.log('yes')
    console.log(target)
    document.querySelector(`${activitySelector} > .mdc-list-item__text  .mdc-list-item__secondary-text`).textContent = data.office
    document.querySelector(`${activitySelector} > .mdc-list-item__text  .secondary--text-template`).textContent = data.template
    document.querySelector(`${activitySelector} > .mdc-list-item__text .mdc-primary__custom-text`).textContent = data.title
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-meta__custom-text`).textContent = moment(data.timestamp).calendar()
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-list-item__secondary-text 
    `).textContent = data.status
    document.querySelector(`${activitySelector} > .mdc-list-item__meta .mdc-list-item__secondary-text 
    `).className = `mdc-list-item__secondary-text ${data.status}`

    if (!count) return true

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
  // let bounds = new google.maps.LatLngBounds()
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
    // bounds.extend(marker.getPosition())

    // set marker to map
    marker.setMap(map)

    // push marker to allMarkers array
    allMarkers.push(marker)
  }

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
        findUniqueOffice().then(function (unique) {
          const activityObjectStore = db.transaction('activity').objectStore('activity')
          activityObjectStore.get(markers[i].customInfo).onsuccess = function (event) {
            const record = event.target.result
            activityCount++
            console.log(record)
            console.log(unique)
            createActivityList(record, 'list-view--map', activityCount, '')
          }
        }).catch(console.log)
      }
    }
    // google.maps.event.clearListeners(map, 'idle')
  }
}

function calendarView (dbName) {
  // open IDB
  createCalendarPanel()
  backIconHeader('close-calendar--drawer')
  document.getElementById('close-calendar--drawer').addEventListener('click', listView)

  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')

    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'calendar'
      rootObjectStore.put(record)
      rootTx.oncomplete = function (){
        fetchCalendarData()
     
      }
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
  beforeDiv.style.display = 'none'
  const afterDiv = document.createElement('div')
  afterDiv.id = 'afterToday'

  calendarView.appendChild(beforeDiv)
  calendarView.appendChild(afterDiv)
  // if(document.getElementById('beforeToday') || document.getElementById('afterToday')) {
  //   return
  // }
  document.getElementById('app-current-panel').innerHTML = calendarView.outerHTML

}

function fetchCalendarData () {


  const dbName = firebase.auth().currentUser.uid
  const request = window.indexedDB.open(dbName)

  request.onsuccess = function () {
    const db = request.result
    const calendarObjectStore = db.transaction('calendar', 'readonly').objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')

    const today = moment().format('YYYY-MM-DD')
    console.log(today)

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
      
        insertDatesBeforeToday(db, calendarDateIndex, today) 
 
      
    }
  }
}

function insertDatesBeforeToday (db, calendarDateIndex, today ) {
  const upperKeyRange = IDBKeyRange.upperBound(today, true)
  calendarDateIndex.openCursor(upperKeyRange).onsuccess = function (event) {
    const cursor = event.target.result
    if (cursor) {
      calendarViewUI('beforeToday', db, cursor.value)
      cursor.continue()
    } else {
      document.getElementById('beforeToday').style.display = 'block'
      console.log(document.getElementById('afterToday').children.length)
      if(document.getElementById('afterToday').children.length <= 1){
        setTimeout(function(){

          document.documentElement.scrollTop = document.documentElement.offsetHeight
        },300)
        return
      }
      document.documentElement.scrollTop = document.getElementById('beforeToday').offsetHeight
    }
  }
}

function calendarViewUI (target, db, data) {
  
  if (!document.getElementById(data.date)) {
    const dateDiv = document.createElement('div')
    dateDiv.id = data.date
    data.date === moment().format('YYYY-MM-DD') ? dateDiv.style.borderTop = '5px solid #6abbf9' : ''
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
    document.getElementById(target).innerHTML += dateDiv.outerHTML

    getActivity(db, data)
    return
  }
  getActivity(db, data)
}
let count = 0
function getActivity (db, data) {
  // console.log(count)
  if (data.hasOwnProperty('activityId')) {
    findUniqueOffice().then(function (unique) {
      const activityObjectStore = db.transaction('activity').objectStore('activity')
      activityObjectStore.get(data.activityId).onsuccess = function (event) {
        const record = event.target.result
        createActivityList(record, `activity--row${data.date}`,'' , unique)
      }
    }).catch(console.log)
  }
}

function profileView (user, firstTimeLogin) {
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
        createProfileHeader()
        createProfilePanel()
        disableInputs()
        document.getElementById('close-profile--panel').addEventListener('click', listView)
        showProfilePicture()

        inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)

        changeDisplayName(user)
        changeEmailAddress(user)
      }
    }
  }
}

function createProfileHeader () {
  const iconCont = document.createElement('div')
  iconCont.className = 'profile--toolbar-icon'

  const icon = document.createElement('i')
  icon.className = 'material-icons'
  icon.textContent = 'more_vert'

  

  iconCont.appendChild(icon)

  const backSpan = document.createElement('span')
  backSpan.id = 'close-profile--panel'

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  header(backSpan.outerHTML, iconCont.outerHTML)
  handleChangeNumberMenu()
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
  fileInput.accept = 'accept="image/png,image/jpeg'

  const profileImgCont = document.createElement('div')
  profileImgCont.id = 'profile--image-container'
  profileImgCont.className = 'profile-container--main'

  const profileImg = document.createElement('img')
  profileImg.id = 'user-profile--image'

  // profileImg.src =''

  const overlay = document.createElement('div')
  overlay.className = 'insert-overlay'

  profileImgCont.appendChild(profileImg)
  profileImgCont.appendChild(overlay)
  profileImgCont.appendChild(uploadBtn)
  profileImgCont.appendChild(fileInput)

  const nameChangeCont = document.createElement('div')
  nameChangeCont.id = 'name--change-container'

 

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

  nameChangeCont.appendChild(createInput('displayName','Name'))
  nameChangeCont.appendChild(toggleBtnName)

  const emailCont = document.createElement('div')
  emailCont.id = 'email--change-container'

 

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

  emailCont.appendChild(createInput('email','Email'))
  emailCont.appendChild(toggleBtnEmail)

  const refreshAuth = document.createElement('div')
  refreshAuth.id = 'ui-auth'
  refreshAuth.className = ''

  const changeNumCont = document.createElement('div')
  changeNumCont.id = 'change--number-container'

  const mainChange = document.createElement('div')
  mainChange.id = 'phone-number--change-container'
  mainChange.className = 'mdc-layout-grid__inner'

  changeNumCont.appendChild(mainChange)
  // changeNumCont.appendChild(submitCont)

  profileView.appendChild(profileImgCont)
  profileView.appendChild(nameChangeCont)
  profileView.appendChild(emailCont)
  profileView.appendChild(refreshAuth)
  profileView.appendChild(changeNumCont)
 
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
    if (value === firebase.auth().currentUser.email) {
      snacks('This email address already exists')
      return
    }
    console.log(timeDiff(firebase.auth().currentUser.metadata.lastSignInTime))
    if (timeDiff(firebase.auth().currentUser.metadata.lastSignInTime) <= 5) {
      console.log('less than 5')
      updateEmail(firebase.auth().currentUser, value)
    } else {
      newSignIn(value)
    }
  }
}

function newSignIn (value) {
  const login = document.createElement('div')
  login.id = 'refresh-login'
  login.className = 'mdc-elevation--z3'

  document.getElementById('ui-auth').innerHTML = login.outerHTML

  // document.querySelector('.app').style.display = 'none'

  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  // DOM element to insert firebaseui login UI
  ui.start('#refresh-login', firebaseUiConfig(value))
  setTimeout(function () {
    document.querySelector('.firebaseui-id-phone-number').value = firebase.auth().currentUser.phoneNumber
    document.querySelector('.firebaseui-id-phone-number').disabled = true
    document.querySelector('.firebaseui-label').remove()

  }, 300)
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
      if (document.querySelector('#profile--image-container .loader')) return

      document.querySelector('.insert-overlay').classList.add('middle')
      document.getElementById('profile--image-container').appendChild(loader())
      document.querySelector('#profile--image-container .loader').classList.add('profile--loader')
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
  }).then(removeLoader).catch(authUpdatedError)
}

function removeLoader () {
  document.querySelector('.insert-overlay').classList.remove('middle')
  const container = document.getElementById('profile--image-container')
  container.children[0].classList.add('reset-opacity')

  container.removeChild(container.lastChild)
  showProfilePicture()
}

function showProfilePicture () {
  const user = firebase.auth().currentUser
  document.getElementById('user-profile--image').src = user.photoURL
}

function authUpdatedError (error) {
  switch (error.code) {
    case 'auth/email-already-in-use' :
      snacks(error.message)
  }
}

function changeDisplayName (user) {
  const displayNameField = getInputText('displayName')

  if (user.displayName) {
    displayNameField.value = user.displayName
  } 

  toggleIconData('edit--name', displayNameField)
}

function changeEmailAddress (user) {
  const emailField = getInputText('email')
  if (user.email) {
    emailField.value = user.email
  } 
  
  toggleIconData('edit--email', emailField)
}

function updateEmail (user, email) {
  console.log(email)
  user.updateEmail(email).then(emailUpdateSuccess).catch(authUpdatedError)
}

function emailUpdateSuccess () {
  const user = firebase.auth().currentUser
  console.log(user)
  user.sendEmailVerification().then(emailVerificationSuccess).catch(emailVerificationError)
}

function emailVerificationSuccess () {
  snacks('Verification link has been send to your email address')
}

function emailVerificationError (error) {
  snacks(error.message)
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
  document.getElementById('edit--name').disabled = false
  document.getElementById('edit--email').disabled = false
  document.querySelector('#profile--image-container .mdc-fab').style.transform = 'translate(-50%, -50%)'
}

function disableInputs () {
  getInputText('displayName')['input_'].disabled = true
  getInputText('email')['input_'].disabled = true


}

function changePhoneNumber () {
  header('', '')
  const changeNumberDiv = document.createElement('div')
  changeNumberDiv.className = 'mdc-card mdc-top-app-bar--fixed-adjust mdc-layout-grid__inner change--number-UI'

  const oldNumberInfo = document.createElement('p')
  oldNumberInfo.textContent = 'Please enter your old country code and phone number'
  oldNumberInfo.className = 'mdc-layout-grid__cell--span-12'

  const currentcountryDiv = document.createElement('div')
  currentcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-1')
  currentcountryDiv.id = 'current-country--code'

  const currentCountryInput = document.createElement('input')
  currentCountryInput.classList.add('mdc-text-field__input')
  currentCountryInput.maxLength = 4
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  currentcountryDiv.appendChild(currentCountryInput)
  currentcountryDiv.appendChild(ripple)

  const currentNumberDiv = document.createElement('div')
  currentNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-3')
  currentNumberDiv.id = 'current-phone--number'

  const currentNumberInput = document.createElement('input')
  currentNumberInput.maxLength = 14
  currentNumberInput.classList.add('mdc-text-field__input')
  const numberRipple = document.createElement('div')
  numberRipple.className = 'mdc-line-ripple'

  currentNumberDiv.appendChild(currentNumberInput)
  currentNumberDiv.appendChild(numberRipple)

  const newNumberInfo = document.createElement('p')
  newNumberInfo.textContent = 'Please enter your new country code and phone number'
  newNumberInfo.className = 'mdc-layout-grid__cell--span-12'

  const newcountryDiv = document.createElement('div')
  newcountryDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-1')
  newcountryDiv.id = 'new-country--code'
  const newCountryInput = document.createElement('input')
  newCountryInput.classList.add('mdc-text-field__input')
  newCountryInput.maxLength = 4
  const newCountryInputRipple = document.createElement('div')
  newCountryInputRipple.className = 'mdc-line-ripple'
  newcountryDiv.appendChild(newCountryInput)
  newcountryDiv.appendChild(newCountryInputRipple)

  const newNumberDiv = document.createElement('div')
  newNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-3')
  newNumberDiv.id = 'new-phone--number'
  const newNumberInput = document.createElement('input')
  newNumberInput.classList.add('mdc-text-field__input')
  newNumberInput.maxLength = 14
  const newNumberInputRipple = document.createElement('div')
  newNumberInputRipple.className = 'mdc-line-ripple'
  newNumberDiv.appendChild(newNumberInput)
  newNumberDiv.appendChild(newNumberInputRipple)

  const actions = document.createElement('div')
  actions.id = 'submit-action'
  actions.className = 'mdc-layout-grid__cell--span-12'
  const submit = document.createElement('button')
  submit.classList.add('mdc-button', 'mdc-ripple-upgraded')
  submit.id = 'updatePhone'
  submit.textContent = 'submit'

  const cancel = document.createElement('button')
  cancel.classList.add('mdc-button', 'mdc-ripple-upgraded')
  cancel.id = 'cancelUpdate'
  cancel.textContent = 'cancel'
  actions.appendChild(cancel)
  actions.appendChild(submit)

  changeNumberDiv.innerHTML = oldNumberInfo.outerHTML + currentcountryDiv.outerHTML + currentNumberDiv.outerHTML + newNumberInfo.outerHTML + newcountryDiv.outerHTML + newNumberDiv.outerHTML + actions.outerHTML

  document.getElementById('app-current-panel').innerHTML = changeNumberDiv.outerHTML

  document.getElementById('submit-action').innerHTML = submit.outerHTML + cancel.outerHTML

  getInputText('new-country--code').value = firebase.auth().currentUser.phoneNumber.substr(0, 3)
  getInputText('new-phone--number').value = ''
  getInputText('current-country--code').value = firebase.auth().currentUser.phoneNumber.substr(0, 3)
  getInputText('current-phone--number').value = ''

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
    profileView(firebase.auth().currentUser, '')
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
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1'

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

function backIconHeader (id, firstTimeLogin) {
  const backSpan = document.createElement('span')
  backSpan.id = id
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'

  if (firstTimeLogin) {
    backIcon.textContent = 'arrow_forward'
    backSpan.appendChild(backIcon)

    header('', backSpan.outerHTML)
    return
  }
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  header(backSpan.outerHTML)
}

function removeDom (selector) {
  const target = document.getElementById(selector)
  target.innerHTML = ''
}

function findUniqueOffice () {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let officeCount = 0
  return new Promise(function (resolve, reject) {
    req.onsuccess = function () {
      const db = req.result
      const activityOfficeIndex = db.transaction('activity').objectStore('activity').index('office')
      activityOfficeIndex.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {
          if (officeCount === 1) {
            resolve(false)
            return
          }

          resolve(true)
          return
        }
        officeCount++
        cursor.continue()
      }
    }
    req.onerror = function (event) {
      reject(event.error)
    }
  })
}

function snacks (message) {
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
    timeout: 40000,
    actionHandler: function () {
      console.log('okay')
    }
  }

  const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'))

  snackbar.show(data)
}

function timeDiff (lastSignInTime) {
  const currentDate = moment().format('YYY-MM-DD HH:mm')
  const authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm')

  return moment(currentDate).diff(moment(authSignInTime), 'minutes')
}

function handleChangeNumberMenu () {

  const div = document.createElement('div')
  div.className = 'mdc-menu mdc-menu--animating-open'
  div.id = 'change-number--menu'
  const ul = document.createElement('ul')
  ul.className = 'mdc-menu__items mdc-list'
  ul.setAttribute('aria-hidden', 'true')
  ul.setAttribute('role', 'menu')

  const li = document.createElement('li')
  li.className = 'mdc-list-item'
  li.setAttribute('role', 'menuitem')
  li.setAttribute('tabindex', '0')
  li.textContent = 'change number'
  li.id = 'change--span'
  ul.appendChild(li)
  div.appendChild(ul)
  document.querySelector('.mdc-top-app-bar__section--align-end').classList.add('mdc-menu-anchor')
  document.querySelector('.mdc-top-app-bar__section--align-end').appendChild(div)

  // Instantiation
  var menuEl = document.querySelector('#change-number--menu')
  var menu = new mdc.menu.MDCMenu(menuEl)
  var menuButtonEl = document.querySelector('.profile--toolbar-icon')

  // Toggle menu open
  menuButtonEl.addEventListener('click', function () {
    menu.open = !menu.open
  })

  // Listen for selected item
  menuEl.addEventListener('MDCMenu:selected', function (evt) {
    phoneNumberDialog(evt)
  })

  // Set Anchor Corner to Bottom End
  // menu.setAnchorCorner('Corner.BOTTOM_END')

  // Turn off menu open animations
  menu.quickOpen = false
}
