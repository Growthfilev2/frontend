function listView(dbName) {
  // sendCurrentViewNameToAndroid('listView')

  history.pushState(['listView', dbName], null, null)
  listPanel()

  document.body.style.backgroundColor = 'white'
  if (!dbName) {
    dbName = firebase.auth().currentUser.uid
  }

  const req = window.indexedDB.open(dbName)
  req.onerror = function(event) {
    console.log(event)
  }

  req.onsuccess = function() {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    let hasMultipleOffice = ''
    let allOffices = ''
    rootObjectStore.get(dbName).onsuccess = function(event) {
      const record = event.target.result
      record.view = 'list'
      hasMultipleOffice = record.offices.hasMultipleOffice
      allOffices = record.offices.allOffices
      rootObjectStore.put(record)
      rootTx.oncomplete = function() {
        if (!document.querySelector('.mdc-drawer--temporary')) {
          initMenu(db, {
            multipleOffice: hasMultipleOffice,
            offices: allOffices
          })
        }
        creatListHeader()
        fetchDataForActivityList(db)
      }
    }
  }
}

function fetchDataForActivityList(db) {
  console.log("fetch for list")
  let activityDom = ''
  const activityStoreTx = db.transaction('activity')
  const activityObjectStore = activityStoreTx.objectStore('activity')

  const activityVisibleIndex = activityObjectStore.index('timestamp')

  activityVisibleIndex.openCursor(null, 'prev').onsuccess = function(event) {
    let cursor = event.target.result
    if (!cursor) {
        appendActivityListToDom(activityDom)
        createActivityIcon(db)
        return
    }

    if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
      createActivityList(db, cursor.value).then(function(li) {
        activityDom += li
      })
    }
    cursor.continue()
  }
}

function createActivityList(db, data) {

  return new Promise(function(resolve) {
    const activityCount = db.transaction('activityCount', 'readonly').objectStore('activityCount')
    const metaData = {
      src: '',
      lastComment: {
        user: '',
        comment: ''
      }
    }

    activityCount.get(data.activityId).onsuccess = function(event) {
      const record = event.target.result

      const userObjStore = db.transaction('users').objectStore('users')
      userObjStore.get(data.creator).onsuccess = function(userstore) {
        const addendumObjStore = db.transaction('addendum').objectStore('addendum').index('activityId')

        addendumObjStore.openCursor(data.activityId, 'prev').onsuccess = function(addendumstore) {
          const addendumCursor = addendumstore.target.result;
          if (addendumCursor) {
            metaData.src = userstore.target.result.photoURL
            readNameFromNumber(db, addendumCursor.value.user).then(function(nameOrNum) {
              if (addendumCursor.value.isComment === 1) {
                metaData.lastComment.user = nameOrNum
              }

              metaData.lastComment.comment = addendumCursor.value.comment

              if (!record) {
                resolve(activityListUI(data, 0, metaData))
              } else {
                resolve(activityListUI(data, record.count, metaData))
              }
            })
          }
        }
      }
    }
  })
}

function activityListUI(data, count, metaData) {

  const li = document.createElement('li')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id,true)')

  const creator = document.createElement('img')
  creator.className = 'mdc-list-item__graphic material-icons'
  creator.src = metaData.src || 'img/empty-user.jpg'

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const activityNameText = document.createElement('span')

  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold'

  activityNameText.textContent = data.activityName
  const lastComment = document.createElement('span')
  lastComment.className = 'mdc-list-item__secondary-text'
  if (metaData.lastComment.user) {

    lastComment.textContent = `${metaData.lastComment.user} : ${metaData.lastComment.comment}`
  } else {
    lastComment.textContent = `${metaData.lastComment.comment}`

  }
  leftTextContainer.appendChild(activityNameText)
  leftTextContainer.appendChild(lastComment)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')
  if (count !== 0) {

    const countDiv = document.createElement('div')

    const countSpan = document.createElement(
      'span'
    )
    countSpan.textContent = count
    countSpan.className = 'count mdc-meta__custom-text'
    countDiv.appendChild(countSpan)
    li.classList.add('mdc-list-item', 'activity--list-item', 'count-active', 'mdc-elevation--z1')
    metaTextContainer.appendChild(countDiv)
  } else {

    const timeCustomText = document.createElement('div')
    timeCustomText.className = 'mdc-meta__custom-text'
    timeCustomText.style.width = '80px';
    timeCustomText.style.fontSize = '14px';
    timeCustomText.textContent = moment(data.timestamp).calendar()
    li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1')
    metaTextContainer.appendChild(timeCustomText)
  }

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', `${data.status}`)
  const statusIcon = document.createElement('i')
  statusIcon.className = 'material-icons'

  const cancelIcon = document.createElement('i')
  cancelIcon.classList.add('status-cancel', 'material-icons')
  cancelIcon.appendChild(document.createTextNode('clear'))

  const confirmedIcon = document.createElement('i')
  confirmedIcon.classList.add('status-confirmed', 'material-icons')
  confirmedIcon.appendChild(document.createTextNode('check'))

  if (data.status === 'CONFIRMED') {
    metaTextActivityStatus.appendChild(confirmedIcon)
  }
  if (data.status === 'CANCELLED') {
    metaTextActivityStatus.appendChild(cancelIcon)
  }

  metaTextContainer.appendChild(metaTextActivityStatus)

  li.innerHTML += creator.outerHTML + leftTextContainer.outerHTML + metaTextContainer.outerHTML
  return li.outerHTML
}

function appendActivityListToDom(activityDom) {
  document.getElementById('activity--list').innerHTML = activityDom
}

function createActivityIcon(db) {
  const subscriptionObjectStore = db.transaction(['subscriptions']).objectStore('subscriptions')
  const subscriptionCount = subscriptionObjectStore.count()
  subscriptionCount.onsuccess = function() {
    if (subscriptionCount.result) {
      const fab = document.createElement('button')
      fab.className = 'mdc-fab create-activity'
      fab.setAttribute('aria-label', 'Add')
      const span = document.createElement('span')
      span.className = 'mdc-fab_icon material-icons'
      span.textContent = 'add'
      fab.appendChild(span)
      document.getElementById('activity--list').appendChild(fab)
      document.querySelector('.create-activity').addEventListener('click', function(evt) {
        selectorUI(evt, {
          record: '',
          store: 'subscriptions',
        })
      })
    }
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

  const menuIcon = document.createElement('span')
  menuIcon.id = 'menu--panel'
  const icon = document.createElement('i')
  icon.className = 'material-icons'
  icon.textContent = 'menu'

  const menuSpan = document.createElement('span')
  menuSpan.className = 'current--selcted-filter'
  menuSpan.textContent = 'Recent'

  menuIcon.appendChild(icon)
  menuIcon.appendChild(menuSpan)

  parentIconDiv.appendChild(menuIcon)

  const searchIcon = document.createElement('span')
  searchIcon.id = 'search--panel'
  const sicon = document.createElement('i')
  sicon.className = 'material-icons'
  sicon.textContent = 'search'
  searchIcon.appendChild(sicon);


  header(parentIconDiv.outerHTML, searchIcon.outerHTML, 'list')
  let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
  // console.log(drawer)
  document.getElementById('menu--panel').addEventListener('click', function() {

    drawer.open = true
  })

}

function initMenu(db, officeRecord) {
  console.log(officeRecord)
  const filters = [{
      type: 'Incoming',
      icon: 'call_made'
    }, {
      type: 'Outgoing',
      icon: 'call_received'
    },
    {
      type: 'Urgent',
      icon: 'star_rate'
    }, {
      type: 'Recent',
      icon: 'watch_later'
    }, {
      type: 'Nearby',
      icon: 'near_me'
    },
    {
      type: 'Confirmed',
      icon: 'check'
    }, {
      type: 'Pending',
      icon: 'maximize'
    }, {
      type: 'Cancelled',
      icon: 'clear'
    }
  ]


  const aside = document.createElement('aside')
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography'

  const nav = document.createElement('nav')
  nav.className = 'mdc-drawer__drawer'

  const header = document.createElement('header')
  header.className = 'mdc-drawer__header drawer--header'

  const headerContent = document.createElement('div')
  headerContent.className = 'mdc-drawer__header-content'

  const ImageDiv = document.createElement('div')
  ImageDiv.className = 'drawer--header-div'
  ImageDiv.onclick = function() {
    profileView()

  }
  const headerIcon = document.createElement('img')
  headerIcon.className = 'drawer-header-icon'
  setTimeout(function() {

    headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
  }, 2000)


  const headerDetails = document.createElement('div')
  headerDetails.className = 'header--details'

  const name = document.createElement('div')
  name.className = 'mdc-typography--subtitle'
  setTimeout(function() {
    name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber

  }, 2000)


  const officeName = document.createElement('div')
  officeName.textContent = officeRecord.offices[0]
  officeName.className = 'mdc-typography--caption'

  const changeOfficeIon = document.createElement('i')

  headerDetails.appendChild(name)
  headerDetails.appendChild(officeName)

  if (officeRecord.hasMultipleOffice) {
    changeOfficeIon.className = 'material-icons'
    changeOfficeIon.textContent = 'arrow_drop_down'
    headerDetails.appendChild(changeOfficeIon)
    changeOfficeIon.onclick = function() {
      createOfficeSelectionUI(officeRecord.offices)
    }
  }

  ImageDiv.appendChild(headerIcon)
  headerContent.appendChild(ImageDiv)
  headerContent.appendChild(headerDetails)
  header.appendChild(headerContent)

  const navContent = document.createElement('nav')

  navContent.className = 'mdc-drawer__content mdc-list'

  if (officeRecord.hasMultipleOffice) {
    const all = document.createElement('a')
    all.className = 'mdc-list-item mdc-list-item--activated'
    all.href = '#'

    const i = document.createElement('i')
    i.className = 'material-icons mdc-list-item__graphic drawer--icons'
    i.setAttribute('aria-hidden', 'true')
    i.textContent = 'all_inbox'
    const textSpan = document.createElement('span')
    textSpan.textContent = 'All offices'

    a.appendChild(i)
    a.appendChild(textSpan)
    navContent.appendChild(a)
  }

  filters.forEach(function(filter) {

    const a = document.createElement('a')
    a.className = 'mdc-list-item mdc-list-item--activated'
    a.href = '#'

    const i = document.createElement('i')
    i.className = 'material-icons mdc-list-item__graphic drawer--icons'
    i.setAttribute('aria-hidden', 'true')
    i.textContent = filter.icon
    const textSpan = document.createElement('span')
    textSpan.textContent = filter.type

    a.appendChild(i)
    a.appendChild(textSpan)
    a.onclick = function() {
      if (filter.type === 'Confirmed' || filter.type === 'Pending' || filter.type === 'Cancelled') {
        filterActivities(filter.type, db, officeRecord)
      }
      if (filter.type === 'Incoming' || filter.type === 'Outgoing') {
        sortByCreator(filter.type, db, officeRecord)
      }
      if (filter.type === 'Urgent') {
        sortByDates(filter.type, db, officeRecord)
      }
      if (filter.type === 'Nearby') {
        sortByLocation(filter.type, officeRecord)
      }
      if (filter.type === 'Recent') {
        listView(firebase.auth().currentUser.uid)
      }
      let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      drawer.open = false
      document.querySelector('.current--selcted-filter').textContent = filter.type
    }

    navContent.appendChild(a)
  })
  nav.appendChild(header)
  nav.appendChild(navContent)
  aside.appendChild(nav)
  document.body.appendChild(aside)
}

function createOfficeSelectionUI(allOffices) {
  document.getElementById('mdc-drawer__content mdc-list').innerHTML = ''
  const dbName = firebase.auth().currentUser.uid
  allOffices.forEach(function(office) {
    const a = document.createElement('a')
    a.className = 'mdc-list-item mdc-list-item--activated'
    a.href = '#'

    const textSpan = document.createElement('span')
    textSpan.textContent = office
    a.appendChild(textSpan)
    a.onclick = function() {
      listView(dbName)
    }
    document.getElementById('mdc-drawer__content mdc-list').appendChild(a)
  })

}

function filterActivities(type, db, hasMultipleOffice) {
  const activityStore = db.transaction('activity').objectStore('activity').index('timestamp')

  let activityDom = ''
  activityStore.openCursor(null, 'prev').onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) {
      appendActivityListToDom(activityDom)
      createActivityIcon(db)
      return
    }
    if (cursor.value.status === type.toUpperCase() && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
      createActivityList(db, cursor.value, hasMultipleOffice).then(function(li) {

        activityDom += li
      })
    }
    cursor.continue()
  }
}

function sortByCreator(type, db, hasMultipleOffice) {
  const activityStore = db.transaction('activity').objectStore('activity').index('timestamp')

  let activityDom = ''
  const me = firebase.auth().currentUser.phoneNumber
  activityStore.openCursor(null, 'prev').onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) {
      appendActivityListToDom(activityDom)
      createActivityIcon(db)
      return
    }
    if (type === 'Incoming') {
      if (cursor.value.creator !== me && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
        createActivityList(db, cursor.value, hasMultipleOffice).then(function(li) {

          activityDom += li
        })
      }
    }
    if (type === 'Outgoing') {
      if (cursor.value.creator === me && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
        createActivityList(db, cursor.value, hasMultipleOffice).then(function(li) {

          activityDom += li
        })
      }
    }

    cursor.continue()
  }
}

function sortByDates(type, db, hasMultipleOffice) {
  const activityDom = ''
  const today = moment().format('YYYY-MM-DD')
  const sortingOrder = {
    HIGH: [],
    LOW: []
  }
  const calendar = db.transaction('calendar').objectStore('calendar').index('range')
  calendar.openCursor().onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) {
      sortingOrder['HIGH'].sort(function(a, b) {
        return moment(b.start).valueOf() - moment(a.start).valueOf()
      })
      sortingOrder['LOW'].sort(function(a, b) {
        return moment(b.end).valueOf() - moment(a.end).valueOf()
      })

      generateActivitiesByDate(sortingOrder, hasMultipleOffice)
      return
    }
    if (today >= cursor.value.start && today <= cursor.value.end) {
      sortingOrder['HIGH'].push(cursor.value)
    } else {
      sortingOrder['LOW'].push(cursor.value)
    }
    cursor.continue()
  }

}

function generateActivitiesByDate(sortingOrder, hasMultipleOffice) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let activityDom = ''
  req.onsuccess = function() {
    const db = req.result
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    sortingOrder['HIGH'].forEach(function(record) {
      activityObjectStore.get(record.activityId).onsuccess = function(event) {
        const activity = event.target.result
        createActivityList(db, activity, hasMultipleOffice).then(function(li) {

          activityDom += li
        })
      }
    })
    sortingOrder['LOW'].forEach(function(record) {
      activityObjectStore.get(record.activityId).onsuccess = function(event) {
        const activity = event.target.result
        createActivityList(db, activity, hasMultipleOffice).then(function(li) {
          activityDom += li
        })
      }
    })

    setTimeout(function() {
      appendActivityListToDom(activityDom)
      createActivityIcon(db)
    }, 1000)


  }
}

function sortByLocation(type, hasMultipleOffice) {

  const dbName = firebase.auth().currentUser.uid

  const nearestLocationHandler = new Worker('js/nearestLocationHandler.js')

  nearestLocationHandler.onmessage = function(message) {
    sortActivitiesByLocation(hasMultipleOffice)
  }
  nearestLocationHandler.onerror = locationSortError


  fetchCurrentLocation().then(function(coords) {
    nearestLocationHandler.postMessage({
      geopoint: {
        lat: coords.latitude,
        lng: coords.longitude
      },
      dbName: dbName
    })
  })

}

function sortActivitiesByLocation(hasMultipleOffice) {
  let activityDom = ''
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const mapObjectStore = db.transaction('map').objectStore('map').index('distance')

    mapObjectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result
      if (!cursor) {
        appendActivityListToDom(activityDom)
        createActivityIcon(db)
        return
      }
      if (cursor.value.hasOwnProperty('distance')) {
        const activityStore = db.transaction('activity').objectStore('activity')
        activityStore.get(cursor.value.activityId).onsuccess = function(event) {
          const record = event.target.result
          createActivityList(db, record, hasMultipleOffice).then(function(li) {
            activityDom += li
          })
        }
      }
      cursor.continue()
    }

  }

}

function locationSortError(error) {
  console.log(error)
}

function profileView() {

  history.replaceState(['profileView'], null, null)

  const drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary '))
  drawer.open = false;

  document.body.style.backgroundColor = '#eeeeee'
  const user = firebase.auth().currentUser
  const dbName = user.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function(event) {
      const record = event.target.result
      record.view = 'profile'
      rootObjectStore.put(record)
      rootTx.oncomplete = function() {
        createProfileHeader()
        createProfilePanel()
        disableInputs()
        document.getElementById('close-profile--panel').addEventListener('click', function() {
          // listView(dbName)
          handleViewFromHistory()
        })
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
  fileInput.accept = 'accept="image/png,image/jpeg;capture=camera'
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

  nameChangeCont.appendChild(createInputForProfile('displayName', 'Name'))
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

  emailCont.appendChild(createInputForProfile('email', 'Email'))
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
  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function({
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
      openAndroidKeyboard.startKeyboard()
      inputField['input_'].focus()
    }
  })
}

function handleFieldInput(key, value) {
  const user = firebase.auth().currentUser
  console.log(typeof value)
  if (key === 'displayName') {
    user.updateProfile({
      [key]: value
    }).then(function() {
      successDialog()
    }).catch(authUpdatedError)
  }

  if (key === 'updateEmail') {
    if (value === firebase.auth().currentUser.email) {
      snacks('This email address already exists')
      return
    }
    if (timeDiff(firebase.auth().currentUser.metadata.lastSignInTime) <= 5) {
      console.log('less than 5')
      updateEmail(firebase.auth().currentUser, value)
    } else {
      newSignIn(value)
    }
  }
}

function timeDiff(lastSignInTime) {
  const currentDate = moment().format('YYY-MM-DD HH:mm')
  const authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm')

  return moment(currentDate).diff(moment(authSignInTime), 'minutes')
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
  setTimeout(function() {
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
  document.getElementById('user-profile--image').src = user.photoURL || '../img/empty-user.jpg'
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
  successDialog()
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
  img.src = '../img/change_number.png'
  img.className = 'change-number--info'
  div.appendChild(img)
  document.getElementById('app-current-panel').innerHTML = div.outerHTML
  document.getElementById('change-number-view').addEventListener('click', changePhoneNumber)
  document.getElementById('back-profile').addEventListener('click', function() {
    profileView()
  })
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

  document.getElementById('cancelUpdate').addEventListener('click', function(event) {
    profileView()
  })

  getInputText('new-country--code').value = firebase.auth().currentUser.phoneNumber.substr(0, 3)
  getInputText('new-phone--number').value = ''
  getInputText('current-country--code').value = firebase.auth().currentUser.phoneNumber.substr(0, 3)
  getInputText('current-phone--number').value = ''

  const allInputFields = document.querySelectorAll('.phoneNumber')

  for (let i = 0; i < allInputFields.length; i++) {
    input.addEventListener('input', handleIllegalNumberInput)
  }
  document.getElementById('updatePhone').addEventListener('click', function(e) {
    if (verifyCurrentPhoneNumber() && verifyPhoneNumber()) {
      const reqBody = {
        'phoneNumber': newPhoneNumber()
      }
      requestCreator('updateUserNumber', reqBody)
    } else {
      snacks('Please enter correct phone number')
    }
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

function header(contentStart, contentEnd, headerType) {

  const header = document.createElement('header')
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1'
  if (headerType === 'list') {
    header.classList.add('header-list--gray')
  }
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
  if (headerType === 'selector') {
    return header
  } else {
    document.getElementById('header').innerHTML = header.outerHTML
  }
}

function backIconHeader(id) {
  const backSpan = document.createElement('span')
  backSpan.id = id
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'

  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  header(backSpan.outerHTML)
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
  menuButtonEl.addEventListener('click', function() {
    menu.open = !menu.open
  })

  // Listen for selected item
  menuEl.addEventListener('MDCMenu:selected', function(evt) {
    createConfirmView(evt)
  })

  menu.quickOpen = false
}


function createInputForProfile(key, type, classtype) {
  const mainTextField = document.createElement('div')
  mainTextField.className = `mdc-text-field mdc-text-field--dense ${classtype} attachment--text-field`

  mainTextField.dataset.key = key
  mainTextField.dataset.type = type
  mainTextField.id = key.replace(/\s/g, '')
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'

  if (type && key === 'displayName') {
    mainInput.placeholder = 'Your Name'
  }
  if (type && key === 'email') {
    mainInput.placeholder = 'Your Email'
  }

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  mainTextField.appendChild(mainInput)
  mainTextField.appendChild(ripple)
  return mainTextField
}
