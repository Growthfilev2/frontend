
function listView(pushState) {
  // document.body.style.backgroundColor = 'white'

  if(document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  }
  
  
  if(pushState){    
    history.pushState(['listView'], null, null)
  }
  
  listPanel()

  const dbName = localStorage.getItem('dbexist');

  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result;
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootStore = rootTx.objectStore('root')
    rootStore.get(dbName).onsuccess = function (event) {
      const officeRecord = event.target.result
      
      if (!document.querySelector('.mdc-drawer--temporary')) {
        initMenu(db, officeRecord.offices)
      }

      creatListHeader('Recent')
      fetchDataForActivityList(db,['E3ci1cJBt3aORhBz37Bb','Hf7MWyNILYy9rRFns98L'])
    }
  }
}

function fetchDataForActivityList(db) {
  let activityDom = ''
  const ul = document.getElementById('activty--list')
  const activityStoreTx = db.transaction('activity')
  const activityObjectStore = activityStoreTx.objectStore('activity')
  const activityVisibleIndex = activityObjectStore.index('timestamp')
  const currOffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice
  activityVisibleIndex.openCursor(null, 'prev').onsuccess = function (event) {
    let cursor = event.target.result
    if (!cursor) {
          let yOffset = window.pageYOffset
          setTimeout(function(){
              appendActivityListToDom(activityDom, true)
              createActivityIcon(db)
              scrollToActivity(yOffset)
           },100)
      return
    }

    
    if (currOffice === 'all') {
      if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.status !== 'CANCELLED')  {
        createActivityList(db, cursor.value).then(function (li) {
          activityDom += li
        })
      }
    }
    
     else if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.office === currOffice && cursor.value.status !== 'CANCELLED') {

        createActivityList(db, cursor.value).then(function (li) {

            activityDom += li
          })
    }

    cursor.continue()
  }
}

function createActivityList(db, data,append) {
  return new Promise(function(resolve){
    getCount(db, data.activityId).then(function (count) {
      getCommentUndUser(db,  data.activityId, data.creator).then(function (meta) {
        getCreatorDetails(db, meta).then(function(metaWiwthData){
          metaWiwthData.count = count
            resolve(activityListUI(data,metaWiwthData,append))
        })
      })
    })
  })
}

function getCount(db, id) {
  return new Promise(function (resolve) {
    const activityCount = db.transaction('activityCount', 'readonly').objectStore('activityCount')
    activityCount.get(id).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        resolve(0)
      } else {
        resolve(record.count)
      }
    }
  })
}

function getCommentUndUser(db, id, creator) {
  const meta = {
    creator: creator,
    comment: '',
    commentUser: ''
  }

  return new Promise(function (resolve) {

    const addendumObjStore = db.transaction('addendum').objectStore('addendum').index('activityId')

    addendumObjStore.openCursor(id, 'prev').onsuccess = function (addendumstore) {
      const addendumCursor = addendumstore.target.result;
      if (!addendumCursor) {
        resolve(meta)
      } else if (addendumCursor.value.isComment) {
        meta.comment = addendumCursor.value.comment
        readNameFromNumber(db, addendumCursor.value.user).then(function (nameOrNum) {
          meta.commentUser = nameOrNum
          resolve(meta)
        })
      } else {
        meta.comment = addendumCursor.value.comment
        resolve(meta)
      }

    }

  })
}

function getCreatorDetails(db, meta) {

  return new Promise(function (resolve) {

    const userObjStore = db.transaction('users').objectStore('users')
    if (meta.creator === firebase.auth().currentUser.phoneNumber) {
      meta.creator = {photo:firebase.auth().currentUser.photoURL || './img/empty-user.jpg',number:firebase.auth().currentUser.phoneNumber}
      resolve(meta)
    } else {
      userObjStore.get(meta.creator).onsuccess = function (userstore) { 
        meta.creator = {photo: userstore.target.result.photoURL || './img/empty-user.jpg',number:userstore.target.result.mobile}
        resolve(meta)
      }
    }
  })
}


function activityListUI(data, metaData,append) {

  const li = document.createElement('li')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', `localStorage.setItem('clickedActivity',this.dataset.id);conversation(this.dataset.id,true)`)

  const creator = document.createElement("img")
  creator.dataset.number = metaData.creator.number
  creator.className = 'mdc-list-item__graphic material-icons'
  creator.setAttribute('onerror',`handleImageError(this)`)
  creator.src = metaData.creator.photo

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const activityNameText = document.createElement('span')

  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold'

  activityNameText.textContent = data.activityName
  const lastComment = document.createElement('span')
  lastComment.className = 'mdc-list-item__secondary-text'
  if (metaData.commentUser) {

    lastComment.textContent = `${metaData.commentUser} : ${metaData.comment}`
  } else {
    lastComment.textContent = `${metaData.comment}`
  }

  leftTextContainer.appendChild(activityNameText)
  leftTextContainer.appendChild(lastComment)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')
  if (metaData.count !== 0) {

    const countDiv = document.createElement('div')

    const countSpan = document.createElement(
      'span'
    )
    countSpan.textContent = metaData.count
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
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', 'status-in-activity', `${data.status}`)
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

  if(append){

    li.appendChild(creator)
    li.appendChild(leftTextContainer)
    li.appendChild(metaTextContainer)
    return li
  }

  li.innerHTML += creator.outerHTML + leftTextContainer.outerHTML + metaTextContainer.outerHTML
  return li.outerHTML
}

function appendActivityListToDom(activityDom, hasHeaderAndCard, headerName) {
  if (!hasHeaderAndCard) {
    listPanel()
    creatListHeader(headerName, !hasHeaderAndCard)
  }
  document.getElementById('activity--list').innerHTML = activityDom

}

function createActivityIcon(db) {
  const subscriptionObjectStore = db.transaction(['subscriptions']).objectStore('subscriptions')
  const subscriptionCount = subscriptionObjectStore.count()
  subscriptionCount.onsuccess = function () {
    if (subscriptionCount.result) {
      const fab = document.createElement('button')
      fab.className = 'mdc-fab create-activity'
      fab.setAttribute('aria-label', 'Add')
      const span = document.createElement('span')
      span.className = 'mdc-fab_icon material-icons'
      span.textContent = 'add'
      fab.appendChild(span)
      document.getElementById('activity--list').appendChild(fab)
      document.querySelector('.create-activity').addEventListener('click', function (evt) {
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

function creatListHeader(headerName, backIcon) {
  const parentIconDiv = document.createElement('div')
  parentIconDiv.className = 'drawer--icons'

  const menuIcon = document.createElement('span')
  menuIcon.id = 'menu--panel'
  const icon = document.createElement('i')
  icon.className = 'material-icons'
  if (backIcon) {
    icon.textContent = 'keyboard_backspace'
  } else {

    icon.textContent = 'menu'
  }

  const menuSpan = document.createElement('span')
  menuSpan.className = 'current--selcted-filter'
  headerName === 'Cancelled' ? menuSpan.textContent = 'Trash' : menuSpan.textContent = headerName

  menuIcon.appendChild(icon)
  menuIcon.appendChild(menuSpan)

  parentIconDiv.appendChild(menuIcon)

  const searchIcon = document.createElement('span')
  searchIcon.id = 'search--panel'
  const sicon = document.createElement('i')
  sicon.className = 'material-icons'
  sicon.textContent = 'search'
  searchIcon.appendChild(sicon);


  header(parentIconDiv.outerHTML, '', 'list')


  let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));

  document.getElementById('menu--panel').addEventListener('click', function () {
    if (backIcon) {
      backNav()
      return
    }

    drawer.open = true
    sendCurrentViewNameToAndroid('drawer')

  })

}

function scrollToActivity(yOffset){
  if (localStorage.getItem('clickedActivity')) {
    document.querySelector(`[data-id="${localStorage.getItem('clickedActivity')}"]`).scrollIntoView({behavior:"instant",block:"center","inline":"center"})
    localStorage.removeItem('clickedActivity')
    return
  }
  
  if(yOffset == 0) {
    localStorage.removeItem('clickedActivity')
    window.scrollTo(0,0)
    return
  }

  if(yOffset > 0) {
    window.scrollTo(0,yOffset);
  }

}

function initMenu(db, officeRecord) {

  const filters = [{
      type: 'Incoming',
      icon: 'call_received'
    }, {
      type: 'Outgoing',
      icon: 'call_made'
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
      type: 'Pending',
      icon: ''
    }, {
      type: 'Cancelled',
      icon: 'delete'
    }
  ]

  const aside = document.createElement('aside')
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography'
  if(officeRecord) {
    aside.dataset.currentOffice = officeRecord.allOffices[0]

  }
  else {
    aside.dataset.currentOffice = 'all'
  }

  const nav = document.createElement('nav')
  nav.className = 'mdc-drawer__drawer'

  const header = document.createElement('header')
  header.className = 'mdc-drawer__header drawer--header'

  const headerContent = document.createElement('div')
  headerContent.className = 'mdc-drawer__header-content'

  const ImageDiv = document.createElement('div')
  ImageDiv.className = 'drawer--header-div'
  ImageDiv.onclick = function () {
    profileView(true)

  }
  const headerIcon = document.createElement('img')
  headerIcon.className = 'drawer-header-icon'

  headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
  headerIcon.setAttribute('onerror','handleImageError(this)');

  const headerDetails = document.createElement('div')
  headerDetails.className = 'header--details'

  const name = document.createElement('div')
  name.className = 'mdc-typography--subtitle'
  name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber


  const officeName = document.createElement('div')
  if (!officeRecord) {
    officeName.textContent = ''
  } else {
    officeName.textContent = officeRecord.allOffices[0]
  }

  officeName.className = 'mdc-typography--caption current--office-name'

  const changeOfficeIon = document.createElement('div')
  headerDetails.appendChild(changeOfficeIon)

  headerDetails.appendChild(name)
  headerDetails.appendChild(officeName)

  if (officeRecord && officeRecord.hasMultipleOffice) {
    changeOfficeIon.className = 'material-icons'
    changeOfficeIon.style.float = 'right'
    changeOfficeIon.textContent = 'arrow_drop_down'
    changeOfficeIon.onclick = function () {
      if(document.querySelector('.office-selection-lists')) return;

      createOfficeSelectionUI(officeRecord.allOffices, db)
    }
  }

  ImageDiv.appendChild(headerIcon)
  headerContent.appendChild(ImageDiv)
  headerContent.appendChild(headerDetails)
  header.appendChild(headerContent)

  const navContent = document.createElement('nav')

  navContent.className = 'mdc-drawer__content mdc-list filter-sort--list'

  if (officeRecord && officeRecord.hasMultipleOffice) {
    const all = document.createElement('div')
    all.className = 'mdc-list-item mdc-list-item--activated'

    const i = document.createElement('i')
    i.className = 'material-icons mdc-list-item__graphic drawer--icons'
    i.setAttribute('aria-hidden', 'true')
    i.textContent = 'all_inbox'
    const textSpan = document.createElement('span')
    textSpan.textContent = 'All offices'
    all.onclick = function () {
      let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      allOffices('All Offices', db, true)

      drawer.open = false
    }
    all.appendChild(i)
    all.appendChild(textSpan)
    navContent.appendChild(all)
  }

  filters.forEach(function (filter) {

    const a = document.createElement('div')
    a.className = 'mdc-list-item mdc-list-item--activated'

    const i = document.createElement('i')
    i.className = 'material-icons mdc-list-item__graphic drawer--icons'
    i.setAttribute('aria-hidden', 'true')
    i.textContent = filter.icon
    const textSpan = document.createElement('span')
    filter.type === 'Cancelled' ? textSpan.textContent = 'Trash' :textSpan.textContent = filter.type

    a.appendChild(i)
    a.appendChild(textSpan)
    a.onclick = function () {

      window.scrollTo(0,0)  
      if (filter.type === 'Pending' || filter.type === 'Cancelled') {
        filterActivities(filter.type, db, true)
      
      }
      if (filter.type === 'Incoming' || filter.type === 'Outgoing') {
        sortByCreator(filter.type, db, true)
      }
      if (filter.type === 'Urgent') {
        sortByDates(filter.type, db, true)
      }
      if (filter.type === 'Nearby') {
        sortByLocation(filter.type, db, true)
      }
      if (filter.type === 'Recent') {
        listView()
      }

      let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      drawer.open = false
      sendCurrentViewNameToAndroid('listView')
      document.querySelector('.current--selcted-filter').textContent = filter.type

    }

    navContent.appendChild(a)
  })
  nav.appendChild(header)
  nav.appendChild(navContent)
  aside.appendChild(nav)
  document.body.appendChild(aside)

}



function createOfficeSelectionUI(allOffices, db) {

  document.querySelector('.filter-sort--list').classList.add('hidden');
  const navContent = document.createElement('nav')

  navContent.className = 'mdc-drawer__content mdc-list office-selection-lists'
  document.querySelector('.mdc-drawer__drawer').appendChild(navContent)

  allOffices.forEach(function (office) {
    if (office === document.querySelector(".mdc-drawer--temporary").dataset.currentOffice) return
    if(document.querySelector('.different-office-link')) return;
    const a = document.createElement('div')
    a.className = 'mdc-list-item mdc-list-item--activated different-office-link'
    const textSpan = document.createElement('span')
    textSpan.textContent = office
    a.appendChild(textSpan)
    a.onclick = function () {
      document.querySelector('.filter-sort--list').classList.remove('hidden');
      navContent.remove()
      const drawer = new mdc.drawer.MDCTemporaryDrawer.attachTo(document.querySelector('.mdc-drawer--temporary'))
      drawer['root_'].dataset.currentOffice = office
      document.querySelector('.current--office-name').textContent = office
      listView()
      drawer.open = false;
    }
    navContent.appendChild(a)
  })
}



function allOffices(type, db, pushState) {
  if (pushState) {

    history.pushState(["allOffices", type], null, null)
  }

  const activityStore = db.transaction('activity').objectStore('activity').index('timestamp')
  let activityDom = ''
  activityStore.openCursor(null, 'prev').onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      appendActivityListToDom(activityDom, false, type)
      createActivityIcon(db)
      return
    }

    if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.status !== 'CANCELLED') {
      createActivityList(db, cursor.value).then(function (li) {

        activityDom += li
      })
    }
    cursor.continue()
  }
}

function filterActivities(type, db, pushState) {
  if (pushState) {

    history.pushState(["filterActivities", type], null, null)
  }
  else {
    history.replaceState(["filterActivities", type], null, null)

  }


  const activityStore = db.transaction('activity').objectStore('activity').index('timestamp')
  const Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice

  let activityDom = ''
  activityStore.openCursor(null, 'prev').onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      let yOffset = window.pageYOffset
      appendActivityListToDom(activityDom, false, type)
      createActivityIcon(db)
      scrollToActivity(yOffset)


      return
    }


    if (cursor.value.status === type.toUpperCase() && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
      createActivityList(db, cursor.value,).then(function (li) {

        activityDom += li
      })
    }
    cursor.continue()
  }
}

function sortByCreator(type, db, pushState) {

  if (pushState) {
    history.pushState(["sortByCreator", type], null, null)
  }
  else {
    history.replaceState(["sortByCreator", type], null, null)
  }

  const activityStore = db.transaction('activity').objectStore('activity').index('timestamp')
  const Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice

  let activityDom = ''
  const me = firebase.auth().currentUser.phoneNumber
  activityStore.openCursor(null, 'prev').onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      let yOffset = window.pageYOffset 
      appendActivityListToDom(activityDom, false, type)
      createActivityIcon(db)
     scrollToActivity(yOffset)
      return
    }
    if (type === 'Incoming') {
      if (cursor.value.creator !== me && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.status !== 'CANCELLED') {
        createActivityList(db, cursor.value).then(function (li) {

          activityDom += li
        })
      }
    }
    if (type === 'Outgoing') {
      if (cursor.value.creator === me && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.status !== 'CANCELLED') {
        createActivityList(db, cursor.value).then(function (li) {
          activityDom += li
        })
      }
    }

    cursor.continue()
  }
}

function sortByDates(type, db, pushState) {
  if (pushState) {
    history.pushState(["sortByDates", type], null, null)
  }
  else {
    history.replaceState(["sortByDates", type], null, null)

  }
  const Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice


  const today = moment().format('YYYY-MM-DD')
  const sortingOrder = {
    HIGH: [],
    LOW: []
  }
  const calendar = db.transaction('calendar').objectStore('calendar').index('range')
  calendar.openCursor().onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      sortingOrder['HIGH'].sort(function (a, b) {
        return moment(b.start).valueOf() - moment(a.start).valueOf()
      })
      sortingOrder['LOW'].sort(function (a, b) {
        return moment(b.end).valueOf() - moment(a.end).valueOf()
      })

      generateActivitiesByDate(sortingOrder)
      return
    }

    if (today >= cursor.value.start && today <= cursor.value.end && cursor.value.office === Curroffice && cursor.value.status !== 'CANCELLED') {
      sortingOrder['HIGH'].push(cursor.value)
    } else {
      sortingOrder['LOW'].push(cursor.value)
    }

    cursor.continue()
  }

}

function generateActivitiesByDate(sortingOrder) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let activityDom = ''
  req.onsuccess = function () {
    const db = req.result
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    sortingOrder['HIGH'].forEach(function (record) {
      activityObjectStore.get(record.activityId).onsuccess = function (event) {
        const activity = event.target.result
        createActivityList(db, activity).then(function (li) {

          activityDom += li
        })
      }
    })
    sortingOrder['LOW'].forEach(function (record) {
      activityObjectStore.get(record.activityId).onsuccess = function (event) {
        const activity = event.target.result
        createActivityList(db, activity).then(function (li) {
          activityDom += li
        })
      }
    })

    setTimeout(function () {
      let yOffset = window.pageYOffset
      appendActivityListToDom(activityDom, false, 'Urgent')
      createActivityIcon(db)
      scrollToActivity(yOffset)
    }, 600)


  }
}

function sortByLocation(type, db, pushState) {
  if (pushState) {
    history.pushState(['sortByLocation', type], null, null)
  }
  else {
    history.replaceState(['sortByLocation',type],null,null)
  }
  const dbName = firebase.auth().currentUser.uid
  const nearestLocationHandler = new Worker('js/nearestLocationHandler.js')

    nearestLocationHandler.postMessage({
    
      dbName: dbName
    })

  nearestLocationHandler.onmessage = function (records) {
    sortActivitiesByLocation(db, records.data)
  }
  nearestLocationHandler.onerror = locationSortError


}

function sortActivitiesByLocation(db, distanceArr) {
  let activityDom = ''
  const Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice

  const activityObjectStore = db.transaction('activity').objectStore('activity')
  for (var i = 0; i < distanceArr.length; i++) {

    activityObjectStore.get(distanceArr[i].activityId).onsuccess = function (event) {
      if (event.target.result.office === Curroffice && event.target.result !== 'CANCELLED') {

        createActivityList(db, event.target.result).then(function (li) {
          activityDom += li
        })
      }
    }

  }
  setTimeout(function () {
    let yOffset = window.pageYOffset
    appendActivityListToDom(activityDom, false, 'Nearby')
    createActivityIcon(db)
    scrollToActivity(yOffset)

  }, 500)
}

function locationSortError(error) {
  console.log(error)
}

function profileView(pushState) {
  if (pushState) {
    history.pushState(['profileView'], null, null)
  }

  const drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'))
  drawer.open = false;

  document.body.style.backgroundColor = '#eeeeee'
  const user = firebase.auth().currentUser
  const dbName = user.uid
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
        document.getElementById('close-profile--panel').addEventListener('click', function () {
          backNav()
        })

        showProfilePicture(firebase.auth().currentUser.photoURL)

        inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)

        changeDisplayName(user)
        changeEmailAddress(user)
      }
    }
  }
  sendCurrentViewNameToAndroid('profile')
}

function createProfileHeader() {

  const backSpan = document.createElement('span')
  backSpan.id = 'close-profile--panel'
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'


  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)
  header(backSpan.outerHTML)


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

  profileImg.src = firebase.auth().currentUser.photoURL;
  profileImg.id = 'user-profile--image'
  profileImg.setAttribute('onerror','handleImageError(this)');

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
    }).then(function () {
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
    cacheControl: 'public,max-age=31536000',
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
   
    console.log(error)
    const log = {
      message : error
    }
    requestCreator('instant',log)
  }

  function storageSuccessHandler() {
    uploadTask.snapshot.ref.getDownloadURL().then(updateAuth)
  }
}

function updateAuth(url) {
  console.log(url)
  const user = firebase.auth().currentUser
  user.updateProfile({
    photoURL: url
  }).then(function () {
    removeLoader(url)
  }).catch(authUpdatedError)
}

function removeLoader(url) {
  document.querySelector('.insert-overlay').classList.remove('middle')
  const container = document.getElementById('profile--image-container')
  container.children[0].classList.add('reset-opacity')

  container.removeChild(container.lastChild)
  showProfilePicture(url)
}

function showProfilePicture(url) {
  const user = firebase.auth().currentUser
  document.getElementById('user-profile--image').src = url || '../img/empty-user.jpg'
  document.querySelector('.drawer-header-icon').src = url  || '../img/empty-user.jpg'
}

function authUpdatedError(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      snacks(error.message)
  }
}

function changeDisplayName(user) {
  const displayNameField = getInputText('#displayName')

  if (user.displayName) {
    displayNameField.value = user.displayName
  }

  toggleIconData('edit--name', displayNameField)
}

function changeEmailAddress(user) {
  const emailField = getInputText('#email')
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


function disableInputs() {
  getInputText('#displayName')['input_'].disabled = true
  getInputText('#email')['input_'].disabled = true
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

let handleMutations = function(mutationList,observer) {
  mutationList.forEach(function(mutation){
    console.log(mutation)
    if(mutation.target.classList.contains('mdc-drawer-scroll-lock')) {
      mutation.target.style.overflow = 'hidden'
    }
    else {
      mutation.target.style.overflow = 'scroll'

    }
  })
}
let observer = new MutationObserver(handleMutations);
observer.observe(document.body,{
  attributes: true,
  characterData: true,
  attributeOldValue: true,
  characterDataOldValue: true
})



