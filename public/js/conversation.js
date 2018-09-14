function conversation(id,pushState) {

  if(pushState) {
    history.pushState(['conversation', id], null, null)
  }

  if (!id) return
  const currentUser = firebase.auth().currentUser

  const req = window.indexedDB.open(currentUser.uid)

  req.onsuccess = function() {
    const db = req.result

    const rootTx = db.transaction('root', 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(currentUser.uid).onsuccess = function(event) {
      const record = event.target.result
      record.id = id
      record.view = 'conversation'
      rootObjectStore.put(record)
      rootTx.oncomplete = function() {
        fetchAddendumForComment(id, currentUser)
      }
    }
  }
}

function fetchAddendumForComment(id, user) {
  const req = window.indexedDB.open(user.uid)
  req.onsuccess = function() {
    const db = req.result
    const addendumIndex = db.transaction('addendum', 'readonly').objectStore('addendum').index('activityId')
    const rootTx = db.transaction('root', 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(user.uid).onsuccess = function(event) {
      createHeaderContent(db, id, event.target.result.hasMultipleOffice)
    }
    commentPanel(id)
    sendCurrentViewNameToAndroid('conversation')
    let commentDom = ''
    addendumIndex.openCursor(id).onsuccess = function(event) {
      const cursor = event.target.result
      if (!cursor) {
        document.getElementById('chat-container').innerHTML = commentDom
        document.querySelector('.activity--chat-card-container').scrollTop = document.querySelector('.activity--chat-card-container').scrollHeight
        return
      }
      createComment(db, cursor.value, user).then(function(comment) {
        commentDom += comment
      })
      cursor.continue()
    }
  }
}

function commentPanel(id) {
  if (document.querySelector('.activity--chat-card-container')) {
    return
  }
  const commentPanel = document.createElement('div')
  commentPanel.className = 'activity--chat-card-container  mdc-top-app-bar--fixed-adjust panel-card'

  const chatCont = document.createElement('div')
  chatCont.id = 'chat-container'
  chatCont.className = 'mdc-card reverser-parent'
  const userCommentCont = document.createElement('div')
  userCommentCont.className = 'user-comment--container'

  const commentCont = document.createElement('div')
  commentCont.className = 'comment--container'

  const inputField = document.createElement('div')
  inputField.className = 'input--text-padding mdc-text-field mdc-text-field--dense'
  inputField.id = 'write--comment'

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input comment-field mdc-elevation--z6'
  input.type = 'text'

  inputField.innerHTML = input.outerHTML
  commentCont.innerHTML = inputField.outerHTML

  const sendButton = document.createElement('div')
  sendButton.className = 'send--container'
  sendButton.id = 'send-message'

  const btn = document.createElement('button')
  btn.classList.add('mdc-fab', 'mdc-fab--mini')
  btn.id = 'send-chat--input'

  const btnIcon = document.createElement('span')
  btnIcon.classList.add('mdc-fac__icon', 'material-icons')
  btnIcon.textContent = 'send'
  btn.innerHTML = btnIcon.outerHTML
  sendButton.innerHTML = btn.outerHTML

  userCommentCont.appendChild(commentCont)
  userCommentCont.appendChild(sendButton)
  commentPanel.appendChild(chatCont)

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + userCommentCont.outerHTML
  document.getElementById('send-chat--input').onclick = function() {
    const reqBody = {
      'activityId': id,
      'comment': getInputText('write--comment').value
    }

    requestCreator('comment', reqBody)
    getInputText('write--comment').value = ''
  }

}

function createComment(db, addendum, currentUser) {
  // console.log(addendum)
  return new Promise(function(resolve) {
    if (document.getElementById(addendum.addendumId)) {
      resolve(document.getElementById(addendum.addendumId).outerHTML)
    }

    let commentBox = document.createElement('div')

    commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')

    currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment', 'secondary-color-light') : commentBox.classList.add('other-user--comment', 'mdc-theme--primary-bg')
    commentBox.id = addendum.addendumId

    let textContainer = document.createElement('div')
    textContainer.classList.add('talktext')

    let user = document.createElement('p')
    user.classList.add('user-name--comment')
    readNameFromNumber(db, addendum.user).then(function(nameOrNumber) {
      // console.log(nameOrNumber)
      user.textContent = nameOrNumber

      let comment = document.createElement('p')
      comment.classList.add('comment')
      comment.textContent = addendum.comment

      let commentInfo = document.createElement('span')
      commentInfo.style.width = '100%'
      const datespan = document.createElement('span')
      datespan.textContent = moment(addendum.timestamp).calendar()
      datespan.classList.add('comment-date')

      const link = document.createElement('a')
      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))
      link.href = `https://maps.google.com/?q=${addendum.location['_latitude']},${addendum.location['_longitude']}`
      mapIcon.dataset.latitude = addendum.location['_latitude']
      mapIcon.dataset.longitude = addendum.location['_longitude']
      link.appendChild(mapIcon)

      commentInfo.appendChild(datespan)
      commentInfo.appendChild(link)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)

      commentBox.appendChild(textContainer)
      resolve(commentBox.outerHTML)
    }).catch(console.log)
  })
}

function readNameFromNumber(db, number) {
  return new Promise(function(resolve, reject) {
    // if (number === firebase.auth().currentUser.phoneNumber) return resolve(firebase.auth().currentUser.displayName)
    const usersObjectStore = db.transaction('users').objectStore('users')
    usersObjectStore.get(number).onsuccess = function(event) {
      const record = event.target.result
      if (!record) return resolve(number)
      if (!record.displayName) {
        resolve(number)
        return
      }
      return resolve(record.displayName)
    }
    usersObjectStore.get(number).onerror = function(event) {
      reject(event)
    }
  })
}

function createHeaderContent(db, id, unique) {


  const activityObjectStore = db.transaction('activity').objectStore('activity')
  const leftDiv = document.createElement('div')
  // leftDiv.style.display = 'inline-flex'

  const backDiv = document.createElement('div')
  backDiv.className = 'back-icon'
  backDiv.id = 'back-conv'
  backDiv.style.float = 'left'
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons back-icon--large'
  backIcon.textContent = 'arrow_back'

  backDiv.appendChild(backIcon)


  activityObjectStore.get(id).onsuccess = function(event) {



    const record = event.target.result
    getImageFromNumber(db, record.creator).then(function(uri) {


      const creatorImg = document.createElement("img")
      creatorImg.className = 'header--icon-creator'
      creatorImg.src = uri
      backDiv.appendChild(creatorImg);

      const primarySpan = document.createElement('div')
      primarySpan.className = 'mdc-list-item__text comment-header-primary mdc-typography--subtitle2'
      primarySpan.textContent = record.activityName


      const secondarySpan = document.createElement('span')
      secondarySpan.className = 'mdc-list-item__secondary-text'
      secondarySpan.textContent = 'Click here to see Details'

      primarySpan.appendChild(secondarySpan)

      leftDiv.appendChild(backDiv)
      leftDiv.appendChild(primarySpan)

      createFunctionalHeader(leftDiv, record)

      document.getElementById('back-conv').addEventListener('click', function() {
        reinitCount(db, id)
        // listView(db.name)
        handleViewFromHistory()
      })

      document.querySelector('.comment-header-primary').addEventListener('click', function() {
        // fillActivityDetailPage(id)
        updateCreateActivity(record)
      })


    })

  }
}

function reinitCount(db, id) {

  const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
  activityCount.get(id).onsuccess = function(event) {
    const record = event.target.result
    record.count = 0
    activityCount.put(record)
  }
}

function createFunctionalHeader(leftDiv, record) {
  const rightDiv = document.createElement('div')
  rightDiv.className = 'status--cont'
  const currentStat = document.createElement('span')
  currentStat.textContent = record.status
  currentStat.className = 'current-status'
  currentStat.id = 'change--status'

  const iconMenu = document.createElement('i')
  iconMenu.className = 'material-icons status--icon'
  if (record.status === 'PENDING') {
    iconMenu.style.marginTop = '4px'
    iconMenu.textContent = 'maximize'
  }
  if (record.status === 'CONFIRMED') {
    iconMenu.textContent = 'check'
  }

  if (record.status === 'CANCELLED') {
    iconMenu.textContent = 'clear'
  }
  currentStat.appendChild(iconMenu)
  rightDiv.appendChild(currentStat)

  header(leftDiv.outerHTML, rightDiv.outerHTML)
  if (record.canEdit) {

    document.getElementById('header').appendChild(createSimpleMenu(record.status))
    document.querySelector('#header').classList.add('mdc-menu-anchor')

    // Instantiation
    var menuEl = document.querySelector('.mdc-menu--status')
    var menu = new mdc.menu.MDCMenu(menuEl)
    var menuButtonEl = document.querySelector('#change--status')

    // Toggle menu open
    menuButtonEl.addEventListener('click', function() {
      menu.open = !menu.open
    })
    console.log(menu)
    // Listen for selected item
    menuEl.addEventListener('MDCMenu:selected', function(evt) {
      const statusObj = {
        status: evt.detail.item.textContent.toUpperCase(),
        activityId: record.activityId
      }
      requestCreator('statusChange', statusObj)
    })

    // Set Anchor Corner to Bottom End
    // menu.setAnchorCorner('Corner.BOTTOM_END')

    // Turn off menu open animations
    menu.quickOpen = false
  }
}

function getImageFromNumber(db, number) {
  return new Promise(function(resolve) {
    const userObjStore = db.transaction('users').objectStore('users')
    userObjStore.get(number).onsuccess = function(event) {
      resolve(event.target.result.photoURL || './img/empty-user.jpg')
    }
  })
}

function selectorUI(evt, data) {
  console.log(data)
  const aside = document.createElement('aside')

  aside.id = 'dialog--component'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const searchIcon = document.createElement('span')
  searchIcon.className = 'material-icons'
  searchIcon.textContent = 'search'
  searchIcon.id = 'selector--search'

  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons dialog--header-back'
  backSpan.textContent = 'arrow_back'


  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable mdc-top-app-bar--fixed-adjust'

  const ul = document.createElement('ul')
  ul.id = 'data-list--container'
  ul.className = 'mdc-list '

  section.appendChild(ul)
  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'



  const accept = document.createElement('button')
  accept.className = 'mdc-fab mdc-dialog__footer__button mdc-dialog__footer__button--accept selector-send'
  accept.type = 'button'
  const acceptIcon = document.createElement('span')
  acceptIcon.className = 'mdc-fab__icon material-icons'
  acceptIcon.textContent = 'send'
  accept.appendChild(acceptIcon)

  footer.appendChild(accept)

  dialogSurface.appendChild(header(backSpan.outerHTML, searchIcon.outerHTML, 'selector'))
  dialogSurface.appendChild(section)
  dialogSurface.appendChild(footer)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)

  document.querySelector('.dialog--header-back').addEventListener('click', function(e) {
    removeDialog(e)
  })

  initializeSelectorWithData(evt, data)
}

function removeDialog(evt) {
  console.log(evt)
  if (document.getElementById('dialog--component')) {
    if (evt && evt.target.dataset.type === 'back-list') {
      resetSelectorUI()
    } else {
      document.getElementById('dialog--component').remove();
      document.getElementById('growthfile').classList.remove('mdc-dialog-scroll-lock')
    }
  }
}

function initializeSelectorWithData(evt, data) {
  console.log(data)
  //init dialog
  const dialog = new mdc.dialog.MDCDialog(document.querySelector('#dialog--component'))
  let activityRecord = data.record
  let selectorStore;
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    if (data.store === 'map') {
      const objectStore = db.transaction(data.store).objectStore(data.store)
      selectorStore = objectStore.index('location')
      fillMapInSelector(selectorStore, activityRecord, dialog, data)
    }
    if (data.store === 'subscriptions') {
      const selectorStore = db.transaction(data.store).objectStore(data.store)
      fillSubscriptionInSelector(selectorStore, activityRecord, dialog, data)
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      fillUsersInSelector(selectorStore, activityRecord, dialog, data)
    }

    if (data.store === 'children') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      fillChildrenInSelector(selectorStore, activityRecord, dialog, data)
    }
  }
  // show dialog
  dialog.lastFocusedTarget = evt.target;
  dialog.show();

}

function fillUsersInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  const alreadyPresntAssigness = {}
  const usersInRecord = activityRecord.assignees

  usersInRecord.forEach(function(user) {
    alreadyPresntAssigness[user] = ''
  })

  console.log(data)

  selectorStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return

    const userRecord = cursor.value
    if (data.attachment.present) {
      ul.appendChild(createSimpleAssigneeLi(userRecord, true))
    }
    if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
      ul.appendChild(createSimpleAssigneeLi(userRecord, true))
    }

    cursor.continue()
  }

  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('users', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {

    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    console.log(radio)

    if (data.attachment.present) {
      console.log("run")
      updateDomFromIDB(activityRecord, {
        hash: '',
        key: data.attachment.key
      }, {
        primary: JSON.parse(radio.value)
      })
      removeDialog()
      return;
    }
    if (activityRecord.hasOwnProperty('create')) {
      updateDomFromIDB(activityRecord, {
        hash: 'addOnlyAssignees',
        // key: data.attachment.key
      }, {
        primary: JSON.parse(radio.value)
      })
      removeDialog()
      return
    }

    const reqBody = {
      'activityId': activityRecord.activityId,
      'share': [JSON.parse(radio.value)]
    }
    requestCreator('share', reqBody)
    removeDialog()
    return

  }

}

function fillMapInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  selectorStore.openCursor(null, 'nextunique').onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return
    if (cursor.value.location) {
      ul.appendChild(createVenueLi(cursor.value, false, activityRecord, true));
    }
    cursor.continue()
  }
  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('map', activityRecord, data)
  })
  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    console.log(selectedField)
    updateDomFromIDB(activityRecord, {
      hash: 'venue',
      key: data.key
    }, {
      primary: selectedField.location,
      secondary: {
        address: selectedField.address,
        geopoint: selectedField.geopoint
      },

    })
    removeDialog()
  }
}

function fillChildrenInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  console.log(data)
  selectorStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return;

    if (cursor.value.template === data.attachment.template && cursor.value.office === data.attachment.office && data.attachment.status != 'CANCELLED') {
      ul.appendChild(createSimpleLi('children', cursor.value.attachment.Name.value))
    }
    cursor.continue()
  }

  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('users', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    updateDomFromIDB(activityRecord, {
      hash: 'children',
      key: data.attachment.key
    }, {
      primary: selectedField.name
    })
    removeDialog()
  }
}

function fillSubscriptionInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  const grp = document.createElement('div')
  grp.className = 'mdc-list-group'
  const officeIndex = selectorStore.index('office')
  officeIndex.openCursor(null, 'nextunique').onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return
    console.log(cursor.value)


    const headline3 = document.createElement('h3')
    headline3.className = 'mdc-list-group__subheader subheader--group-small'
    headline3.textContent = cursor.value.office

    const ul = document.createElement('ul')
    ul.className = 'mdc-list'
    ul.setAttribute('aria-orientation', 'vertical')

    grp.appendChild(headline3)
    grp.appendChild(ul)

    officeIndex.openCursor(cursor.value.office).onsuccess = function(event) {
      const officeCursor = event.target.result
      if (!officeCursor) return
      if(officeCursor.value.template !== 'subscription') {
      ul.appendChild(createGroupList(cursor.value.office, officeCursor.value.template))
    }
      officeCursor.continue()
    }

  cursor.continue()
  }
  ul.appendChild(grp)

  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('users', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    createTempRecord(selectedField.office, selectedField.template, data)
    removeDialog()
  }

}

function createTempRecord(office, template, data) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const selectorStore = db.transaction('subscriptions').objectStore('subscriptions')
    const officeTemplateCombo = selectorStore.index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    officeTemplateCombo.get(range).onsuccess = function(event) {
      const selectedCombo = event.target.result
      const bareBonesVenue = {}
      const bareBonesVenueArray = []
      const bareBonesSchedule = {}
      const bareBonesScheduleArray = []
      selectedCombo.venue.forEach(function(venue) {
        bareBonesVenue.venueDescriptor = venue
        bareBonesVenue.location = ''
        bareBonesVenue.address = ''
        bareBonesVenue.geopoint = {
          '_latitude': '',
          '_longitude': ''
        }
        bareBonesVenueArray.push(bareBonesVenue)
      })

      selectedCombo.schedule.forEach(function(schedule) {
        bareBonesSchedule.name = schedule
        bareBonesSchedule.startTime = ''
        bareBonesSchedule.endTime = ''
        bareBonesScheduleArray.push(bareBonesSchedule)
      })


      const bareBonesRecord = {
        office: selectedCombo.office,
        template: selectedCombo.template,
        venue: bareBonesVenueArray,
        schedule: bareBonesScheduleArray,
        attachment: selectedCombo.attachment,
        timestamp: Date.now(),
        canEdit: true,
        assignees: [],
        activityName: selectedCombo.template.toUpperCase(),
        create: true
      }


      updateCreateActivity(bareBonesRecord)
    }
  }
}



function hasAnyValueInChildren(office, template, status) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  return new Promise(function(resolve) {

    req.onsuccess = function() {
      const db = req.result
      const childrenStore = db.transaction('children').objectStore('children')
      let count = 0;
      let result = false
      childrenStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result
        if (!cursor) {
          if (count === 0) {
            result = false
            resolve(result)
          } else {
            result = true
            resolve(result)
          }
          return
        }
        if (cursor.value.template === template && cursor.value.office === office && status != 'CANCELLED') {
          count++
        }
        cursor.continue()
      }

    }
  })
}

function updateDomFromIDB(activityRecord, attr, data) {


  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function(event) {

      let updatedActivity = activityRecord;

    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    if (attr.hash === 'venue') {

      updatedActivity = updateVenue(updatedActivity, attr, data)

      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-primary]`).textContent = data.primary
      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-secondary]`).textContent = data.secondary.address
      if (!activityRecord.hasOwnProperty('create')) {
        activityStore.put(updatedActivity)
      }
      return
    }
    //for create
    if (attr.hash === 'addOnlyAssignees') {
      activityRecord.assignees.push(data.primary)
      console.log(activityRecord)
      readNameAndImageFromNumber([data.primary], db)
      return
    }



    updatedActivity.attachment[attr.key].value = data.primary



    if (!activityRecord.hasOwnProperty('create')) {
      activityStore.put(updatedActivity)
    }
    if (attr.hash === 'weekday') return
    if (!attr.hasOwnProperty('key')) return
    document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-primary]`).textContent = data.primary
    if (data.hasOwnProperty('secondary')) {
      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-secondary]`).textContent = data.secondary.address
    }
  }

}

function updateVenue(updatedActivity, attr, data) {

  updatedActivity.venue.forEach(function(field) {
    if (field.venueDescriptor === attr.key) {
      field.location = data.primary
      field.address = data.secondary.address
      field.geopoint['_latitude'] = data.secondary.geopoint['_latitude']
      field.geopoint['_longitude'] = data.secondary.geopoint['_longitude']
      console.log(field)
    }
  })
  return updatedActivity
}

function convertKeyToId(key) {
  return key.replace(/\s/g, '-')
}

function convertIdToKey(id) {
  return id.replace(/-/g, ' ')
}

function updateCreateContainer(record) {

  const leftHeaderContent = document.createElement('div')
  leftHeaderContent.style.display = 'inline-flex'
  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons'
  backSpan.textContent = 'arrow_back'
  backSpan.id = 'backToConv'
  backSpan.style.paddingLeft = '10px'

  const activityName = document.createElement('span')
  activityName.textContent = record.activityName

  activityName.style.paddingLeft = '10px'
  activityName.style.fontSize = '19px'

  leftHeaderContent.appendChild(backSpan)
  leftHeaderContent.appendChild(activityName)
  header(leftHeaderContent.outerHTML, '')


  document.getElementById('backToConv').addEventListener('click', function() {
    handleViewFromHistory()
  })



  const container = document.createElement('div')
  container.className = 'mdc-top-app-bar--fixed-adjust update-create--activity'

  const TOTAL_LIST_TYPES = ['office', 'venue', 'schedule', 'attachment', 'assignees']

  const LIST_LENGTH = 5
  let i = 0;
  for (i; i < LIST_LENGTH; i++) {
    const containerList = document.createElement('ul')
    containerList.className = 'mdc-list custom--list-margin';

    switch (TOTAL_LIST_TYPES[i]) {
      case 'office':
        containerList.classList.remove('custom--list-margin')
        break;
      case 'venue':
      case 'assignees':
        containerList.classList.add('mdc-list--two-line', 'mdc-list--avatar-list')
        break;
    };

    containerList.id = TOTAL_LIST_TYPES[i] + '--list'
    container.appendChild(containerList)
  }
  if (record.canEdit) {

    const updateBtn = document.createElement('button')
    updateBtn.className = 'mdc-fab send--activity-fab'
    updateBtn.setAttribute('aria-label', 'Send')
    updateBtn.id = 'send-activity'
    const sendIcon = document.createElement('span')
    sendIcon.className = 'mdc-fab__icon material-icons'
    sendIcon.textContent = 'send'
    updateBtn.appendChild(sendIcon)
    container.appendChild(updateBtn)
  }
  return container
}

function updateCreateActivity(record) {
  console.log(history.state[0])

  history.pushState(['updateCreateActivity', record.activityId], null, null)

  //open indexedDB
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function(event) {
      const root = event.target.result
      root.view = 'updateCreateActivity'
      rootObjectStore.put(root)
    }

    // create base container for activity update/create
    const appView = document.getElementById('app-current-panel')
    appView.innerHTML = updateCreateContainer(record).outerHTML

    const officeSection = document.getElementById('office--list')
    officeSection.appendChild(createSimpleLi('Office', {
      office: record.office,
      ts: record.timestamp,
      showLabel: true
    }))

    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function() {
        sendActivity(record)
      })
    }

    createVenueSection(record)

    const scheduleSection = document.getElementById('schedule--list')
    scheduleSection.appendChild(createScheduleTable({
      canEdit: record.canEdit,
      schedules: record.schedule
    }))
    const attachmentSection = document.getElementById('attachment--list')
    // canEdit, office, template
    attachmentSection.appendChild(createAttachmentContainer(record))
    if (document.querySelector('.mdc-select')) {
      const select = new mdc.select.MDCSelect(document.querySelector('.mdc-select'));
      console.log(select)
      select.listen('change', () => {
        updateDomFromIDB(record, {
          hash: 'weekday',
          key: select['root_'].dataset.value
        }, {
          primary: select.value
        })
      });
    }

    createAssigneeList(db, record, true)
  }
}

function createSimpleLi(key, data) {

  const listItem = document.createElement('li')
  listItem.className = 'mdc-list-item mdc-ripple-upgraded'


  const listItemLabel = document.createElement('span')
  listItemLabel.className = 'detail--static-text'
  const listItemMeta = document.createElement('span')

  const dataVal = document.createElement('span')

  if (key === 'Office') {
    dataVal.className = 'data--value-list'
    dataVal.textContent = data.office
    listItemLabel.textContent = key
    listItem.appendChild(listItemLabel)
    listItem.appendChild(dataVal)
    listItemMeta.className = 'mdc-list-item__meta'
    listItemMeta.setAttribute('aria-hidden', 'true')
    listItemMeta.textContent = moment(data.ts).calendar()
    listItem.appendChild(listItemMeta)
  }
  if (key === 'children') {
    const metaInput = document.createElement('span')
    metaInput.className = 'mdc-list-item__meta'
    metaInput.appendChild(createRadioInput())


    listItem.textContent = data
    listItem.appendChild(metaInput)
    listItem.onclick = function() {

      checkRadioInput(this, {
        name: data
      })
    }
  }

  return listItem
}

function createGroupList(office, template) {

  const li = document.createElement('li')
  li.className = 'mdc-list-item'

  const span = document.createElement('span')
  span.className = 'mdc-list-item__text'
  span.textContent = template.toUpperCase()

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta'
  metaInput.appendChild(createRadioInput())
  li.onclick = function() {
    checkRadioInput(this, {
      office: office,
      template: template
    })
  }
  li.appendChild(span)
  li.appendChild(metaInput)
  return li
}

function createVenueSection(record) {
  console.log(record)
  const venueSection = document.getElementById('venue--list')

  record.venue.forEach(function(venue) {
    venueSection.appendChild(createVenueLi(venue, true, record))
  })

  if (record.venue.length === 0) {
    document.getElementById('venue--list').style.display = 'none'
  }
}

function createVenueLi(venue, showVenueDesc, record, showMetaInput) {
  const listItem = document.createElement('li')
  listItem.className = 'mdc-list-item mdc-ripple-upgraded'
  listItem.id = convertKeyToId(venue.venueDescriptor)

  const textSpan = document.createElement('a')
  textSpan.className = 'mdc-list-item__text link--span'

  const primarySpan = document.createElement('span')
  primarySpan.className = 'mdc-list-item__primary-text'

  const selectorIcon = document.createElement('span')
  selectorIcon.className = 'mdc-list-item__meta'
  const addLocation = document.createElement('label')
  addLocation.className = 'mdc-fab add--assignee-icon attachment-selector-label'
  const locationBtnSpan = document.createElement('span')
  locationBtnSpan.className = 'mdc-fab__icon material-icons'
  locationBtnSpan.textContent = 'add_location'
  addLocation.appendChild(locationBtnSpan)

  if (showVenueDesc) {
    const listItemLabel = document.createElement('span')
    listItemLabel.className = 'detail--static-text'
    listItemLabel.textContent = venue.venueDescriptor

    const dataValue = document.createElement('span')
    dataValue.className = 'data--value-list'
    dataValue.textContent = venue.location
    dataValue.dataset.primary = ''

    primarySpan.appendChild(listItemLabel)
    primarySpan.appendChild(dataValue)
    textSpan.appendChild(primarySpan)
    textSpan.href = `https://maps.google.com/?q=${venue.geopoint['_latitude']},${venue.geopoint['_longitude']}`

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true')
      selectorIcon.appendChild(addLocation)
      addLocation.onclick = function(evt) {
        selectorUI(evt, {
          record: record,
          store: 'map',
          attachment: {
            present: false
          },
          key: venue.venueDescriptor
        })
      }
    }
  } else {
    primarySpan.textContent = venue.location
    textSpan.appendChild(primarySpan)

  }

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta material-icons'

  if (showMetaInput) {

    metaInput.appendChild(createRadioInput())
    listItem.onclick = function() {
      console.log(venue)
      checkRadioInput(this, {
        location: venue.location,
        address: venue.address,
        geopoint: {
          '_latitude':venue.latitude,
          '_longitude':venue.longitude
        },
        venueDesc: venue.venueDescriptor
      })
    }
  }

  const secondaryText = document.createElement('span')
  secondaryText.className = 'mdc-list-item__secondary-text'
  secondaryText.textContent = venue.address
  secondaryText.dataset.secondary = ''
  textSpan.appendChild(secondaryText)
  listItem.appendChild(textSpan)
  if (showMetaInput) {
    listItem.appendChild(metaInput)
  } else {
    listItem.appendChild(selectorIcon)
  }
  return listItem
}

function createScheduleTable(data) {

  if (!data.schedules.length) {
    document.getElementById('schedule--list').style.display = 'none'
    return document.createElement('span')
  }

  const table = document.createElement('table')
  table.className = 'schedule--show-table activity--detail--section'
  const trMain = document.createElement('tr')
  trMain.className = 'row-main'
  const th0 = document.createElement('th')
  const th1 = document.createElement('th')
  th1.className = 'detail--static-text schedule-label'
  const th2 = document.createElement('th')
  th2.className = 'detail--static-text schedule-label'

  th0.textContent = ''
  th1.textContent = 'Start Time'
  th2.textContent = 'End Time'
  trMain.appendChild(th0)
  trMain.appendChild(th1)
  trMain.appendChild(th2)

  table.appendChild(trMain)
  data.schedules.forEach(function(schedule) {

    const tr = document.createElement('tr')
    const td0 = document.createElement('td')
    td0.className = 'detail--static-text'

    const td1 = document.createElement('td')

    td1.className = `schedule--time`
    td1.dataset.start = `${schedule.name}-startDate`
    // const td1Input = document.createElement('input')

    const td2 = document.createElement('td')
    td2.className = `schedule--time`
    td2.dataset.end = `${schedule.name}-endDate`
    td0.textContent = schedule.name

    const timeTr = document.createElement('tr')
    const spaceTd = document.createElement('td')

    const tdStartTime = document.createElement('td')
    tdStartTime.className = `schedule--time`
    tdStartTime.dataset.start = `${schedule.name}-startTime`
    const tdEndTime = document.createElement('td')
    tdEndTime.className = `schedule--time`
    tdEndTime.dataset.end = `${schedule.name}-endTime`

    td1.appendChild(createTimeInput(schedule.startTime ? moment(schedule.startTime).format('YYYY-MM-DD') : '', data.canEdit, {
      type: 'date',
      simple: true
    }))
    td2.appendChild(createTimeInput(schedule.endTime ? moment(schedule.endTime).format('YYYY-MM-DD') : '', data.canEdit, {
      type: 'date',
      simple: true
    }))

    tdStartTime.appendChild(createTimeInput(schedule.startTime ? moment(schedule.startTime).format('hh:mm') : '', data.canEdit, {
      type: 'time',
      simple: true
    }))
    tdEndTime.appendChild(createTimeInput(schedule.endTime ? moment(schedule.endTime).format('hh:mm') : '', data.canEdit, {
      type: 'time',
      simple: true
    }))

    tr.appendChild(td0)
    tr.appendChild(td1)
    tr.appendChild(td2)
    timeTr.appendChild(spaceTd)
    timeTr.appendChild(tdStartTime)
    timeTr.appendChild(tdEndTime)

    table.appendChild(tr)
    table.appendChild(timeTr)
  })
  return table
}

function createAttachmentContainer(data) {
  // attachment,canEdit, office, template

  const availTypes = {
    'phoneNumber': '',
    'weekday': '',
    'HH:MM': '',
    'string': '',
    'base64': ''
  }
  //
  // if (document.getElementById('attachment-container')) {
  //   document.getElementById('attachment-container').remove()
  // }
  const attachCont = document.createElement('div')
  attachCont.id = 'attachment-container'

  Object.keys(data.attachment).forEach(function(key) {

    const div = document.createElement('div')
    div.className = `attachment-field ${data.attachment[key].type}`
    div.id = convertKeyToId(key)

    if (data.canEdit) {
      div.classList.add('editable--true')
    }

    const label = document.createElement('span')
    label.className = 'label--text'
    label.textContent = key

    if (data.attachment[key].type === 'string') {

      div.appendChild(label)
      div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key))
    }

    if (data.attachment[key].type === 'phoneNumber') {

      const addButton = document.createElement('label')
      addButton.className = 'mdc-fab add--assignee-icon attachment-selector-label'
      const span = document.createElement('span')
      span.className = 'mdc-fab__icon material-icons'
      span.textContent = 'person_add'
      addButton.appendChild(span)

      const dataVal = document.createElement('span')
      dataVal.className = 'data--value-list'
      dataVal.dataset.primary = ''
      if (data.canEdit) {
        div.appendChild(addButton)
        addButton.onclick = function(evt) {
          selectorUI(evt, {
            record: data,
            store: 'users',
            attachment: {
              present: true,
              key: key
            }
          })
        }
      }
      div.appendChild(label)

      dataVal.textContent = data.attachment[key].value
      div.appendChild(dataVal)
    }

    if (data.attachment[key].type == 'HH:MM') {
      div.appendChild(label)
      div.appendChild(createTimeInput(data.attachment[key].value, data.canEdit, {
        simple: false,
        type: 'time'
      }))
    }

    if (data.attachment[key].type === 'weekday') {
      div.appendChild(label)
      div.appendChild(createSelectMenu(key,data.attachment[key].value,data.canEdit))

    }

    if (data.attachment[key].type === 'base64') {

      const addCamera = document.createElement('label')
      addCamera.className = 'mdc-fab attachment-selector-label add--assignee-icon'
      addCamera.id = 'start-camera'


      const span = document.createElement('span')
      span.className = 'mdc-fab__icon material-icons'
      span.textContent = 'add_a_photo'
      addCamera.appendChild(span)
      div.appendChild(label)

      const imagePreview = document.createElement('div')
      imagePreview.className = 'image-preview--attachment'
      imagePreview.dataset.photoKey = key
      div.appendChild(imagePreview)
      if (data.canEdit) {

        div.appendChild(addCamera)
        addCamera.onclick = function(){
          readCameraFile()
        }
      }
    }

    if (!availTypes.hasOwnProperty(data.attachment[key].type)) {

      const addButtonName = document.createElement('label')
      addButtonName.className = 'mdc-fab add--assignee-icon attachment-selector-label'
      const spanName = document.createElement('span')
      spanName.className = 'mdc-fab__icon material-icons'
      spanName.textContent = 'add'
      addButtonName.appendChild(spanName)
      div.appendChild(label)
      const valueField = document.createElement('span')
      valueField.textContent = data.attachment[key].value
      valueField.className = 'data--value-list'
      div.appendChild(valueField)
      // div.appendChild(createInput(key, data.attachment[key].type, 'attachment', true))
      if (data.canEdit) {
        hasAnyValueInChildren(data.office, data.attachment[key].type, data.status).then(function(hasValue) {
          if (hasValue) {
            console.log(hasValue)
            div.appendChild(addButtonName);
            addButtonName.onclick = function(evt) {
              valueField.dataset.primary = ''
              selectorUI(evt, {
                record: data,
                store: 'children',
                attachment: {
                  present: true,
                  key: key,
                  office: data.office,
                  template: data.attachment[key].type,
                  status: data.status
                }
              })
            }
          }
        })

      }
    }
    attachCont.appendChild(div)

  })

  return attachCont
}

function createAssigneeList(db, record, showLabel) {
  if (showLabel) {

    const labelAdd = document.createElement('li')
    labelAdd.className = 'mdc-list-item'

    const labelTextSpan = document.createElement('span')
    labelTextSpan.className = 'mdc-list-item__text'
    const labelText = document.createElement('span')
    labelText.className = 'mdc-list-item__primary-text detail--static-text'
    labelText.textContent = 'Assignees'

    labelTextSpan.appendChild(labelText)

    const labelButton = document.createElement('span')
    labelButton.className = 'mdc-list-item__meta'
    const addButton = document.createElement('div')
    addButton.className = 'mdc-fab add--assignee-icon'
    addButton.onclick = function(evt) {
      selectorUI(evt, {
        record: record,
        store: 'users',
        attachment: {
          present: false
        }
      })
    }
    const span = document.createElement('span')
    span.className = 'mdc-fab__icon material-icons'
    span.textContent = 'person_add'
    addButton.appendChild(span)
    labelButton.appendChild(addButton)

    labelAdd.appendChild(labelTextSpan)
    if (record.canEdit) {
      labelAdd.appendChild(labelButton)
    }

    document.getElementById('assignees--list').appendChild(labelAdd)
  }
  readNameAndImageFromNumber(record.assignees, db)
}

function readNameAndImageFromNumber(assignees, db) {
  const userObjStore = db.transaction('users').objectStore('users')
  assignees.forEach(function(assignee) {
    userObjStore.get(assignee).onsuccess = function(event) {
      const userRecord = event.target.result

      document.getElementById('assignees--list').appendChild(createSimpleAssigneeLi(userRecord))
    }
  })
}

function createSimpleAssigneeLi(userRecord, showMetaInput) {
  const assigneeLi = document.createElement('li')
  assigneeLi.classList.add('mdc-list-item', 'assignee-li')
  if (!userRecord) return assigneeLi
  assigneeLi.dataset.value = userRecord.mobile
  const photoGraphic = document.createElement('img')
  photoGraphic.classList.add('mdc-list-item__graphic')

  if (!userRecord.photoURL) {
    photoGraphic.src = './img/empty-user.jpg'
  } else {
    photoGraphic.src = userRecord.photoURL
  }

  const assigneeListText = document.createElement('span')
  assigneeListText.classList.add('mdc-list-item__text')
  const assigneeName = document.createElement('span')
  assigneeName.className = 'mdc-list-item__primary-text'

  const assigneeListTextSecondary = document.createElement('span')
  assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text')

  if (!userRecord.displayName) {
    assigneeName.textContent = userRecord.mobile
  } else {
    assigneeName.textContent = userRecord.displayName
    assigneeListTextSecondary.textContent = userRecord.mobile
  }

  assigneeListText.appendChild(assigneeName)
  assigneeListText.appendChild(assigneeListTextSecondary)

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta material-icons'
  if (showMetaInput) {

    metaInput.appendChild(createRadioInput())
    assigneeLi.onclick = function() {
      checkRadioInput(this, assigneeLi.dataset.value)
    }
  }
  assigneeLi.appendChild(photoGraphic)
  assigneeLi.appendChild(assigneeListText)
  assigneeLi.appendChild(metaInput)
  return assigneeLi
}

function createRadioInput() {
  const div = document.createElement("div")
  div.className = 'mdc-radio radio-control-selector'
  const input = document.createElement('input')
  input.className = 'mdc-radio__native-control'
  input.type = 'radio'
  input.name = 'radio'

  const radioBckg = document.createElement('div')
  radioBckg.className = 'mdc-radio__background'

  const outerRadio = document.createElement('div')
  outerRadio.className = 'mdc-radio__outer-circle'

  const innerRadio = document.createElement("div")
  innerRadio.className = 'mdc-radio__inner-circle'
  radioBckg.appendChild(outerRadio)
  radioBckg.appendChild(innerRadio)

  div.appendChild(input)
  div.appendChild(radioBckg)
  return div

}

function checkRadioInput(inherit, value) {
  const parent = inherit
  const radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'))
  radio['root_'].classList.add('radio-selected')
  radio.checked = true
  radio.value = JSON.stringify(value)
  console.log(radio.value)
}

function setFilePath(str) {
  const imageFieldInput = document.querySelector('.image-preview--attachment').children[0]
  const img = document.createElement('img')
  img.src = `data:image/jpeg;base64,${str}`
  img.className = 'profile-container--main attachment-picture'
  document.querySelector('.image-preview--attachment').appendChild(img)

}

function readCameraFile() {
  FetchCameraForAttachment.startCamera()
}

function sendActivity(record) {

  if (record.hasOwnProperty('create')) {
    insertInputsIntoActivity(record)
    return
  }

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function(event) {
    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    activityStore.get(record.activityId).onsuccess = function(event) {
      const record = event.target.result
      insertInputsIntoActivity(record, activityStore)
    }
  }
}

function concatDateWithTime(date, time) {
  const dateConcat = moment(date  + " " + time)
  return moment(dateConcat).valueOf()
}

function insertInputsIntoActivity(record, activityStore) {
  const allStringTypes = document.querySelectorAll('.string')
  for (var i = 0; i < allStringTypes.length; i++) {
    record.attachment[convertIdToKey(allStringTypes[i].id)].value = allStringTypes[i].querySelector('.mdc-text-field__input').value
    console.log(convertIdToKey(allStringTypes[i].id))
  }
  const imagesInAttachments = document.querySelectorAll('.image-preview--attachment')

  for(let i=0;i<imagesInAttachments.length;i++){
    record.attachment[convertIdToKey(imagesInAttachments[i].id)].value = imagesInAttachments[i].querySelector(img).src
  }

  console.log(record.attachment)

  let sd;
  let st;
  let ed;
  let et
  let allow = true;
  for (var i = 0; i < record.schedule.length; i++) {

     sd = document.querySelector(`[data-start="${record.schedule[i].name}-startDate"] input`)
     st = document.querySelector(`[data-start="${record.schedule[i].name}-startTime"] input`)
     ed = document.querySelector(`[data-end="${record.schedule[i].name}-endDate"] input`)
     et = document.querySelector(`[data-end="${record.schedule[i].name}-endTime"] input`)

     if (sd.value !== "" && ed.value == "") {
       snacks('Add a valid End Date')
       allow = false
     }

     if (ed.value !== "" && sd.value == "") {
       snacks('Add a valid Start Date')
       allow = false

     }

     if (sd.value && ed.value && moment(ed.value).valueOf() < moment(sd.value).valueOf()) {
       snacks('End Date cannot be before Start Date')
       allow = false
     }

     if(allow){
       record.schedule[i].startTime = concatDateWithTime(sd.value, st.value) || ''
       record.schedule[i].endTime = concatDateWithTime(ed.value, et.value)  || ''
     }
  }

  for (var i = 0; i < record.venue.length; i++) {
        record.venue[i].geopoint = {
          latitude : record.venue[i].geopoint['_latitude'],
          longitude : record.venue[i].geopoint['_longitude']
        }
  }




  const requiredObject = {
    venue: record.venue,
    schedule: record.schedule,
    attachment: record.attachment
  }

  if (!record.hasOwnProperty('create')) {
    requiredObject.activityId = record.activityId
    requestCreator('update',requiredObject)

    return
  }

  requiredObject.office = record.office
  requiredObject.template = record.template
  requiredObject.share = record.assignees
  console.log(requiredObject)

  requestCreator('create',requiredObject)
}

function initSearchForSelectors(type, record, attr) {
  searchBarUI()
  if (type === 'map') {
    let input = document.getElementById('search--bar-selector')
    const options = {
      componentRestrictions: {
        country: "in"
      }
    }
    autocomplete = new google.maps.places.Autocomplete(input, options);
    initializeAutocompleteGoogle(autocomplete, record, attr)
  }

}

function searchBarUI() {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#action-data")
  actionCont.className = 'search--cont'

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.add('search-field-transform')
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = 'white'
  if (!document.getElementById('search--bar--field')) {

    actionCont.appendChild(createSimpleInput('', true, true))

  } else {
    document.getElementById('search--bar--field').style.display = 'block'
  }
  document.getElementById('selector--search').style.display = 'none'
  document.querySelector('.selector-send').style.display = 'none'
  dialogEl.querySelector('#view-type span').dataset.type = 'back-list'
  document.getElementById('data-list--container').style.display = 'none'
}

function resetSelectorUI() {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#action-data")
  dialogEl.querySelector('#view-type span').dataset.type = ''

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.remove('search-field-transform')
  actionCont.querySelector('#search--bar--field').classList.remove('field-input')
  actionCont.classList.remove('search--cont')
  document.getElementById('selector--search').style.display = 'block'
  document.querySelector('.selector-send').style.display = 'block'
  document.querySelector('#search--bar--field').style.display = 'none'
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = '#eeeeee'
  document.getElementById('data-list--container').style.display = 'block'

}

function initializeAutocompleteGoogle(autocomplete, record, attr) {

  autocomplete.addListener('place_changed', function() {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }
    //  document.getElementById('location--container').style.marginTop = '0px'

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }
    const selectedAreaAttributes = {
      primary: place.name,
      secondary: {
        address: address,
        geopoint: {
          '_latitude': place.geometry.location.lat(),
          '_longitude': place.geometry.location.lng()
        }
      }
    }
    updateDomFromIDB(record, {
      hash: 'venue',
      key: attr.key
    }, selectedAreaAttributes)
    removeDialog()

    // document.getElementById('location-text-field').dataset.location = place.name
    // document.getElementById('location-text-field').dataset.address = address
    // document.getElementById('location-text-field').dataset.inputlat = place.geometry.location.lat()
    // document.getElementById('location-text-field').dataset.inputlon = place.geometry.location.lng()

    console.log(address)
    console.log(place)
  })
}

function createSimpleInput(value, canEdit, withIcon, key) {

  if (!canEdit) {
    const onlyText = document.createElement('span')
    onlyText.className = 'data--value-list'
    onlyText.textContent = value
    return onlyText
  }

  const textField = document.createElement('div')
  if (key && key.length < 15) {

    textField.className = 'mdc-text-field data--value-list'
  } else {
    textField.className = 'mdc-text-field data--value-list-small'
  }

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  input.style.paddingTop = '0px'


  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  input.value = value
  if (withIcon) {

    textField.id = 'search--bar--field'
    input.id = 'search--bar-selector'
    textField.classList.add('field-input')

  }
  textField.appendChild(input)
  textField.appendChild(ripple)
  const jsTField = new mdc.textField.MDCTextField.attachTo(textField)
  return textField
}

function createTimeInput(value, canEdit, attr) {
  if (!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    attr.type === 'date' ? simeplText.textContent = moment(value).calendar() : simeplText.textContent = value

    return simeplText
  }
  console.log(canEdit)

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-time'
  input.type = attr.type
  input.style.borderBottom = 'none'

  attr.type === 'date' ? input.value = moment(value).format('YYYY-MM-DD') : input.value = value
  if (attr.type === 'time') {
    textField.classList.add('data--value-list')
    input.style.width = '90%'
  }
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'


  textField.appendChild(input)
  textField.appendChild(ripple)
  if (attr.simple) {
    input.classList.remove('mdc-text-field__input')
    return input
  }
  return textField
}

function createSelectMenu(key,value,canEdit) {
  if(!canEdit) {
    const span = document.createElement('span')
    span.className = 'data--value-list'
    span.textContent = value
    return span
  }
  const div = document.createElement('div')
  div.className = 'mdc-select data--value-list'
  div.style.height = '32%;'
  div.id = convertKeyToId(key)
  div.dataset.value = key
  div.dataset.primary = ''
  const select = document.createElement('select')
  select.className = 'mdc-select__native-control'
  select.style.paddingTop = '0px';
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  for (var i = 0; i < weekdays.length; i++) {

    const option = document.createElement('option')
    option.value = weekdays[i]
    option.textContent = weekdays[i]

    select.appendChild(option)
  }
  const label = document.createElement('label')
  label.className = 'mdc-floating-label'
  label.textContent = ''

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'
  div.appendChild(label)
  div.appendChild(select)
  div.appendChild(ripple)
  return div
}
