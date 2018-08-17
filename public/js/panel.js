function listView() {
  listPanel()
  creatListHeader()
  document.body.style.backgroundColor = 'white'

  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)

  req.onerror = function (event) {
    console.log(event)
  }

  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    let hasMultipleOffice = ''
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.view = 'list'
      hasMultipleOffice = record.hasMultipleOffice
      rootObjectStore.put(record)
      rootTx.oncomplete =  fetchDataForActivityList(db,hasMultipleOffice)
    }
 
     
   
  }
  sendCurrentViewNameToAndroid('listView')
}

function fetchDataForActivityList(db, uniqueOffice) {
  let activityDom = ''
  const activityStoreTx = db.transaction('activity')
  const activityObjectStore = activityStoreTx.objectStore('activity')
  const activityObjectStoreIndex = activityObjectStore.index('timestamp')

  const subscriptionObjectStore = db.transaction(['subscriptions']).objectStore('subscriptions')
  const subscriptionCount = subscriptionObjectStore.count()

  activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
    let cursor = event.target.result

    if (!cursor) {
      document.getElementById('activity--list').innerHTML = activityDom
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

    createActivityList(db, cursor.value, uniqueOffice).then(function (li) {
      activityDom += li
    })

    cursor.continue()
  }
}

function listPanel() {
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

function creatListHeader() {
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

function createActivityList(db, data, uniqueOffice) {
  return new Promise(function (resolve) {
    const activityCount = db.transaction('activityCount', 'readonly').objectStore('activityCount')

    activityCount.get(data.activityId).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        resolve(activityListUI(data, uniqueOffice, 0))
      } else {
        resolve(activityListUI(data, uniqueOffice, record.count))
      }
    }
  })
}

function activityListUI(data, uniqueOffice, count) {
  const li = document.createElement('li')

  if (count !== 0) {
    li.classList.add('mdc-list-item', 'activity--list-item', 'count-active', 'mdc-elevation--z1')
  } else {
    li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1')
  }

  li.dataset.id = data.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id)')
  mdc.ripple.MDCRipple.attachTo(li);
  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const customText = document.createElement('span')

  customText.className = 'mdc-primary__custom-text'

  customText.textContent = data.activityName

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

  const countDiv = document.createElement('div')

  const countSpan = document.createElement(
    'span'
  )
  countSpan.textContent = count
  countSpan.className = 'count mdc-meta__custom-text'
  countDiv.appendChild(countSpan)

  metaTextContainer.appendChild(countDiv)
  metaTextContainer.appendChild(metaTextActivityStatus)

  li.innerHTML += leftTextContainer.outerHTML + metaTextContainer.outerHTML
  return li.outerHTML
}



function mapView(dbName) {
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
  sendCurrentViewNameToAndroid('map')
}

function fetchMapData() {
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

function createMapPanel() {
  const mapParent = document.createElement('div')
  mapParent.id = 'map-view--container'
  mapParent.className = 'mdc-top-app-bar--fixed-adjust'

  const mapList = document.createElement('ul')
  mapList.id = 'list-view--map'
  mapList.className ='mdc-list mdc-list--two-line mdc-list--avatar-list'
  const map = document.createElement('div')
  map.id = 'map'
  mapParent.appendChild(map)

  mapParent.appendChild(mapList)
  document.getElementById('app-current-panel').innerHTML = mapParent.outerHTML
}

function initMap(dbName, mapRecord) {
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

  // setTimeout(function(){

  displayMarkers(dbName, map, mapRecord)
  // },200)
}

function displayMarkers(dbName, map, locationData) {
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

    marker.setMap(map)
    allMarkers.push(marker)
  }

  google.maps.event.addListener(map, 'idle', function () {
    setTimeout(function () {
      generateActivityFromMarker(dbName, map, allMarkers)
    }, 300)
  })

}

function generateActivityFromMarker(dbName, map, markers) {
  const markerActivityId = []
  let bounds = map.getBounds()
  // open IndexedDB
  for (let i = 0; i < markers.length; i++) {
    if (map.getBounds().contains(markers[i].getPosition()) && markers[i].customInfo) {
      markerActivityId.push(markers[i].customInfo)
    }
  }
  displayMapActivity(dbName, markerActivityId)
}

function displayMapActivity(dbName, markerActivityId) {
  let req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    let mapActivityDom = ''
    let unique = ''
    const rootObjectStore = db.transaction('root').objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function(event){
      unique = event.target.result.hasMultipleOffice
    }
    const setMarker = [...new Set(markerActivityId)]
    console.log(setMarker)
      setMarker.forEach(function (id) {
        console.log(id)
        const activityObjectStore = db.transaction('activity').objectStore('activity')
        
        activityObjectStore.get(id).onsuccess = function (event) {
          const record = event.target.result
          
            createActivityList(db, record, unique).then(function (li) {
              mapActivityDom += li
            })
        }
      })
    setTimeout(function () {
      document.getElementById('list-view--map').innerHTML = mapActivityDom
    }, 50)
  }
}

function calendarView(dbName) {
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
      rootTx.oncomplete = function () {
        fetchCalendarData()
      }
    }
  }
  sendCurrentViewNameToAndroid('calendar')
  req.onerror = function (event) {
    console.log(event.target.result)
  }
}

function createCalendarPanel() {
  const calendarView = document.createElement('div')
  calendarView.id = 'calendar-view--container'
  calendarView.className = 'mdc-top-app-bar--fixed-adjust'
  const beforeDiv = document.createElement('div')
  beforeDiv.id = 'beforeToday'
  beforeDiv.style.display = 'none'
  beforeDiv.className = 'start-calendar-transition'
  const afterDiv = document.createElement('div')
  afterDiv.id = 'afterToday'
  afterDiv.className = 'start-calendar-transition'

  calendarView.appendChild(progressBar())

  calendarView.appendChild(beforeDiv)
  calendarView.appendChild(afterDiv)
  document.getElementById('app-current-panel').innerHTML = calendarView.outerHTML
}

function fetchCalendarData() {
  const dbName = firebase.auth().currentUser.uid
  const request = window.indexedDB.open(dbName)

  request.onsuccess = function () {
    const db = request.result
    const calendarObjectStore = db.transaction('calendar', 'readonly').objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')
    const today = moment().format('YYYY-MM-DD')
    console.log(today)
    const rootObjectStore = db.transaction('root').objectStore('root')
    let unique = ''
    rootObjectStore.get(dbName).onsuccess = function (event) {
      unique = event.target.result.hasMultipleOffice
    }

    calendarDateIndex.get(today).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        
          const req = indexedDB.open(firebase.auth().currentUser.uid)
          req.onsuccess = function () {
            const db = req.result
            calendarViewUI('afterToday', db, {
              date: today
            },unique)
          }
     
      }
      insertDatesAfterToday(db,calendarDateIndex,today)
    }
  }

  request.onerror = function (event) {
    console.log(event)
  }
}

function insertDatesAfterToday(db,calendarDateIndex,today) {
  const rootObjectStore = db.transaction('root').objectStore('root')
  let unique= ''
  rootObjectStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
    unique = event.target.result.hasMultipleOffice
  }
      const lowerKeyRange = IDBKeyRange.lowerBound(today)
      calendarDateIndex.openCursor(lowerKeyRange).onsuccess = function (event) {
        const cursor = event.target.result
        if (cursor) {
          calendarViewUI('afterToday', db, cursor.value, unique)
          cursor.continue()
        } else {
          insertDatesBeforeToday(db, calendarDateIndex, today, unique)
        }
      }
    }
 
function insertDatesBeforeToday(db, calendarDateIndex, today, unique) {

  const upperKeyRange = IDBKeyRange.upperBound(today, true)
  calendarDateIndex.openCursor(upperKeyRange).onsuccess = function (event) {
    const cursor = event.target.result
    if (cursor) {

      calendarViewUI('beforeToday', db, cursor.value, unique)
      cursor.continue()

    } else {
      document.getElementById('beforeToday').style.display = 'block'

      setTimeout(function () {
        if (document.getElementById('afterToday').children.length <= 1) {
          document.documentElement.scrollTop = document.documentElement.offsetHeight
        } else {
          document.documentElement.scrollTop = document.getElementById('beforeToday').offsetHeight
        }
        document.getElementById('beforeToday').classList.remove('start-calendar-transition')
        document.getElementById('afterToday').classList.remove('start-calendar-transition')
        document.querySelector('.mdc-linear-progress').classList.add('mdc-linear-progress--closed')
      }, 800)
    }
  }
}


function calendarViewUI(target, db, data, unique) {
  console.log(unique)
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
    activityRow.className = 'activity-row--date'
    dateDiv.appendChild(dateCol)
    dateDiv.appendChild(activityRow)
    document.getElementById(target).innerHTML += dateDiv.outerHTML

    getActivity(db, data, unique)
    return
  }
  getActivity(db, data, unique)
}

function getActivity(db, data, unique) {
  if (!data.hasOwnProperty('activityId')) return
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  activityObjectStore.get(data.activityId).onsuccess = function (event) {
    const record = event.target.result
    
    createActivityList(db, record, unique).then(function (li) {
      if (document.getElementById(`activity--row${data.date}`).querySelector(`[data-id="${data.activityId}"]`)) return
      document.getElementById(`activity--row${data.date}`).innerHTML += li
    })
  }
}

function profileView(user, firstTimeLogin) {
  document.body.style.backgroundColor = '#eeeeee'
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
  sendCurrentViewNameToAndroid('profile')
}

function createProfileHeader() {
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

function createProfilePanel() {
  const profileView = document.createElement('div')
  profileView.id = 'profile-view--container'
  profileView.className = 'mdc-top-app-bar--fixed-adjust mdc-theme--background'

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
  nameChangeCont.className = 'profile-psuedo-card'

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

  nameChangeCont.appendChild(createInput('displayName', 'Name'))
  nameChangeCont.appendChild(toggleBtnName)

  const emailCont = document.createElement('div')
  emailCont.id = 'email--change-container'
  emailCont.className = 'profile-psuedo-card'

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

  emailCont.appendChild(createInput('email', 'Email'))
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

function toggleIconData(icon, inputField) {
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
      inputField['lineRipple_'].deactivate()

    } else {
      console.log(inputField)
      inputField['input_'].style.borderBottom = '1px solid rgba(0,0,0,.42)'
      inputField['input_'].disabled = false
      inputField['lineRipple_'].activate()
    }
  })
}

function handleFieldInput(key, value) {
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

function newSignIn(value) {
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

function readUploadedFile(event) {
  console.log(event)
  const file = event.target.files[0]

  const reader = new FileReader()

  if (file) {
    reader.readAsDataURL(file)
    processImage(file)
  }
}

function processImage(image) {
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

  function snapshotHandler(snapshot) {
    if (firebase.storage.TaskState.RUNNING) {
      if (document.querySelector('#profile--image-container .loader')) return

      document.querySelector('.insert-overlay').classList.add('middle')
      document.getElementById('profile--image-container').appendChild(loader())
      document.querySelector('#profile--image-container .loader').classList.add('profile--loader')
      // show gola
    }
  }

  function storageErrorHandler(error) {
    if (error.code === 'storage/unknown') {
      console.log(error)
    }
    console.log(error)
  }

  function storageSuccessHandler() {
    uploadTask.snapshot.ref.getDownloadURL().then(updateAuth)
  }
}

function updateAuth(url) {
  const user = firebase.auth().currentUser
  user.updateProfile({
    photoURL: url
  }).then(removeLoader).catch(authUpdatedError)
}

function removeLoader() {
  document.querySelector('.insert-overlay').classList.remove('middle')
  const container = document.getElementById('profile--image-container')
  container.children[0].classList.add('reset-opacity')

  container.removeChild(container.lastChild)
  showProfilePicture()
}

function showProfilePicture() {
  const user = firebase.auth().currentUser
  document.getElementById('user-profile--image').src = user.photoURL
}

function authUpdatedError(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      snacks(error.message)
  }
}

function changeDisplayName(user) {
  const displayNameField = getInputText('displayName')

  if (user.displayName) {
    displayNameField.value = user.displayName
  }

  toggleIconData('edit--name', displayNameField)
}

function changeEmailAddress(user) {
  const emailField = getInputText('email')
  if (user.email) {
    emailField.value = user.email
  }

  toggleIconData('edit--email', emailField)
}

function updateEmail(user, email) {
  console.log(email)
  user.updateEmail(email).then(emailUpdateSuccess).catch(authUpdatedError)
}

function emailUpdateSuccess() {
  const user = firebase.auth().currentUser
  console.log(user)
  user.sendEmailVerification().then(emailVerificationSuccess).catch(emailVerificationError)
}

function emailVerificationSuccess() {
  snacks('Verification link has been send to your email address')
}

function emailVerificationError(error) {
  snacks(error.message)
}

function handleReauthError(error) {
  console.log(error)
}

function createConfirmView() {
  const backSpan = document.createElement('span')
  backSpan.id = 'back-profile'

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  const nextSpan = document.createElement('span')
  nextSpan.id = 'change-number-view'
  nextSpan.className = 'mdc-typography--headline6'
  const nextIcon = document.createElement('i')
  nextIcon.className = 'material-icons change--number-check'
  nextIcon.textContent = 'check'
  nextSpan.textContent = 'NEXT'

  nextSpan.appendChild(nextIcon)

  header(backSpan.outerHTML, nextSpan.outerHTML)

  const div = document.createElement('div')
  div.className = 'verfication--image-layout mdc-top-app-bar--fixed-adjust'
  div.id = 'confirm--number-change'

  const img = document.createElement('img')
  img.src = './img/change_number.png'
  img.className = 'change-number--info'
  div.appendChild(img)
  document.getElementById('app-current-panel').innerHTML = div.outerHTML
  document.getElementById('change-number-view').addEventListener('click', changePhoneNumber)
  document.getElementById('back-profile').addEventListener('click', profileView)
}

function disableInputs() {
  getInputText('displayName')['input_'].disabled = true
  getInputText('email')['input_'].disabled = true
}

function changePhoneNumber() {
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
  currentCountryInput.classList.add('mdc-text-field__input', 'phoneNumber')
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
  currentNumberInput.classList.add('mdc-text-field__input', 'phoneNumber')
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
  newCountryInput.classList.add('mdc-text-field__input', 'phoneNumber')
  newCountryInput.maxLength = 4
  const newCountryInputRipple = document.createElement('div')
  newCountryInputRipple.className = 'mdc-line-ripple'
  newcountryDiv.appendChild(newCountryInput)
  newcountryDiv.appendChild(newCountryInputRipple)

  const newNumberDiv = document.createElement('div')
  newNumberDiv.classList.add('mdc-text-field', 'mdc-layout-grid__cell--span-3')
  newNumberDiv.id = 'new-phone--number'
  const newNumberInput = document.createElement('input')
  newNumberInput.classList.add('mdc-text-field__input', 'phoneNumber')
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

  const allInputFields = document.querySelectorAll('.phoneNumber');

  [...allInputFields].forEach(function (input) {
    console.log(input)
    input.addEventListener('input', handleIllegalNumberInput)
  })

  document.getElementById('updatePhone').addEventListener('click', function (e) {
    if (verifyCurrentPhoneNumber() && verifyPhoneNumber()) {
      const reqBody = {
        'phoneNumber': newPhoneNumber()
      }
      requestCreator('updateUserNumber', reqBody)
    } else {
      snacks('Please enter correct phone number')
    }
  })

  document.getElementById('cancelUpdate').addEventListener('click', function (event) {
    profileView(firebase.auth().currentUser, '')
  })
}

function newPhoneNumber() {
  const newCountryCode = getInputText('new-country--code').value
  const newNumber = getInputText('new-phone--number').value
  return newCountryCode.concat(newNumber)
}

function verifyPhoneNumber() {
  const expression = /^\+[1-9]\d{5,14}$/
  return expression.test(newPhoneNumber())
}

function handleIllegalNumberInput(value) {
  const exp = /^\+[1-9]\d{1,3}$/
  if (!exp.test(evt.target.value)) {
    evt.target.value = evt.target.value.replace(/[^+0-9]/g, '')
  }
}

function verifyCurrentPhoneNumber() {
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

function backIconHeader(id, firstTimeLogin) {
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

function removeDom(selector) {
  const target = document.getElementById(selector)
  target.innerHTML = ''
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
    timeout: 40000,
    actionHandler: function () {
      console.log('okay')
    }
  }

  const snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'))

  snackbar.show(data)
}

function timeDiff(lastSignInTime) {
  const currentDate = moment().format('YYY-MM-DD HH:mm')
  const authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm')

  return moment(currentDate).diff(moment(authSignInTime), 'minutes')
}

function handleChangeNumberMenu() {
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
    createConfirmView(evt)
  })

  // Set Anchor Corner to Bottom End
  // menu.setAnchorCorner('Corner.BOTTOM_END')

  // Turn off menu open animations
  menu.quickOpen = false
}
