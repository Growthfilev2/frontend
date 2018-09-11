function conversation(id) {
  if (history.state) {

    if (history.state[0] === 'conversation') {

      history.replaceState(['conversation', id], null, null)
    } else {
      history.pushState(['conversation', id], null, null)
    }
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

function fillActivityDetailPage(id) {
  if (history.state) {

    if (history.state[0] === 'fillActivityDetailPage') {
      history.replaceState(['fillActivityDetailPage', id], null, null)
    } else {
      history.pushState(['fillActivityDetailPage', id], null, null)
    }
  }

  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')

    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function(event) {
      const record = event.target.result
      record.id = id
      record.view = 'detail'
      rootObjectStore.put(record)
    }

    rootTx.oncomplete = function() {
      const req = window.indexedDB.open(dbName)

      req.onsuccess = function() {
        const db = req.result
        const activityObjectStore = db.transaction('activity').objectStore('activity')

        activityObjectStore.get(id).onsuccess = function(event) {
          const record = event.target.result
          console.log(record)
          createActivityDetailHeader(record, 'edit')
          document.getElementById('back-detail').addEventListener('click', function() {
            // conversation(id)
            handleViewFromHistory()
          })


          updateActivityPanel(db, record)
          // displayActivityDetail(db, record)
          fetchAssigneeData(db, record, 'assignee--list')
        }
      }
    }
  }
  sendCurrentViewNameToAndroid('detail')
}

function createActivityDetailHeader(record, value) {
  const leftDiv = document.createElement('div')

  const backSpan = document.createElement('span')
  backSpan.className = 'back-icon'
  // if (value === 'edit') {
  //   backSpan.id = 'back-detail'
  // }
  // if (value === 'create') {
  backSpan.id = 'back-list'
  // }

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  const activityName = document.createElement('span')
  activityName.className = 'display-activity-name'
  activityName.textContent = record.activityName

  // const cancel = document.createElement('i')
  // cancel.className = 'material-icons'
  // cancel.id = 'cancel-update'
  // cancel.dataset.id = record.activityId
  // cancel.textContent = 'clear'
  // cancel.style.color = 'gray'
  // cancel.style.display = 'none'

  leftDiv.appendChild(backSpan)
  leftDiv.appendChild(activityName)
  // leftDiv.appendChild(cancel)

  if (!record.canEdit) {
    //no mdc fab
    // header(leftDiv.outerHTML)
    return
  }

  // const rigthDiv = document.createElement('div')
  //
  // const toggleBtnName = document.createElement('button')
  // toggleBtnName.className = 'mdc-icon-button material-icons'
  // toggleBtnName.id = `${value}-activity`
  // toggleBtnName.dataset.id = record.activityId
  //
  // toggleBtnName.setAttribute('aria-hidden', 'true')
  // toggleBtnName.setAttribute('aria-pressed', 'false')
  //
  // if (value === 'edit') {
  //   toggleBtnName.setAttribute('data-toggle-on-content', 'check')
  //   toggleBtnName.setAttribute('data-toggle-on-label', 'check')
  //   toggleBtnName.setAttribute('data-toggle-off-content', 'edit')
  //   toggleBtnName.setAttribute('data-toggle-off-label', 'editActivity')
  //
  //   toggleBtnName.textContent = 'edit'
  // }
  // if (value === 'create') {
  //   toggleBtnName.setAttribute('data-toggle-on-content', 'check')
  //   toggleBtnName.setAttribute('data-toggle-on-label', 'check')
  //   toggleBtnName.setAttribute('data-toggle-off-content', 'check')
  //   toggleBtnName.setAttribute('data-toggle-off-label', 'createActivity')
  //
  //   toggleBtnName.textContent = 'check'
  // }
  //
  //
  // rigthDiv.appendChild(toggleBtnName)
  header(leftDiv.outerHTML)
  // if (value === 'edit') {
  //   toggleActivityHeader(`${value}-activity`, '.activity-detail-page', value, record)
  // }
  // if (value === 'create') {
  //   toggleActivityHeader(`${value}-activity`, '#create-activity--container', value)
  // }
}
//
// function displayActivityDetail(db, record) {
//   const detail = document.createElement('div')
//   detail.className = 'mdc-top-app-bar--fixed-adjust activity-detail-page'
//   detail.innerHTML = sectionDiv('Office', record.office) +
//   sectionDiv('Template', record.template) +
//   availableStatus(record) + displaySchedule(record.schedule) + displayVenue(record.venue) + displayAttachmentCont(record.attachment) + renderAssigneeList(record, 'assignee--list')
//   document.getElementById('app-current-panel').innerHTML = detail.outerHTML;
//
//
//   const venueLi = document.querySelectorAll('.venue--list');
//
//   for (let index = 0; index < venueLi.length; index++) {
//     venueLi[index].addEventListener('click', expandVenueList)
//   }
//
//   if (document.getElementById('select-pending')) {
//     document.getElementById('select-pending').addEventListener('click', function () {
//       updateStatus('PENDING', record.activityId)
//     })
//   }
//   if (document.getElementById('select-confirmed')) {
//     document.getElementById('select-confirmed').addEventListener('click', function () {
//       updateStatus('CONFIRMED', record.activityId)
//     })
//   }
//   if (document.getElementById('select-cancel')) {
//     document.getElementById('select-cancel').addEventListener('click', function () {
//       updateStatus('CANCELLED', record.activityId)
//     })
//   }
//
//
//   if (!record.canEdit) return
//   initShareButton(record, db)
// }
//
//

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
      selectorStore = objectStore.index(objectStore.indexNames[3])
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
  console.log(attr)
  console.log(data)
  //venue
  // console.log(updatedActivity)
  // console.log(attr)
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
  activityName.className = 'data--value-list'
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

  const textSpan = document.createElement('span')
  textSpan.className = 'mdc-list-item__text'

  const primarySpan = document.createElement('span')
  primarySpan.className = 'mdc-list-item__primary-text'

  const selectorIcon = document.createElement('span')
  selectorIcon.className = 'mdc-list-item__meta material-icons'
  const addLocation = document.createElement('label')
  addLocation.className = 'mdc-fab add--assignee-icon attachment-selector-label'
  const locationBtnSpan = document.createElement('span')
  locationBtnSpan.className = 'mdc-fab__icon material-icons'
  locationBtnSpan.textContent = 'location_add'
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

      checkRadioInput(this, {
        location: venue.location,
        address: venue.address,
        geopoint: venue['geopoint'],
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

    td1.appendChild(createTimeInput(schedule.startTime ? moment(schedule.startTime).calendar() : '', data.canEdit, {
      type: 'date',
      simple: true
    }))

    td2.appendChild(createTimeInput(schedule.endTime ? moment(schedule.endTime).calendar() : '', data.canEdit, {
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
      div.appendChild(createSelectMenu(key))

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

      const imagePreview = document.createElement('img')
      imagePreview.className = 'image-preview--attachment'
      imagePreview.src = data.attachment[key].value
      div.appendChild(imagePreview)
      if (data.canEdit) {

        div.appendChild(addCamera)
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
        // renderTemplateNameSelector(evt, {
        //   template: data.attachment[key].type,
        //   office: data.office
        // }, key)
      }
    }
    attachCont.appendChild(div)

  })

  if (document.getElementById('start-camera')) {
    document.getElementById('start-camera').addEventListener('click', readCameraFile)
  }
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
  // if (target === 'assignee--list') {
  //   assigneeLi.dataset.assignee = userRecord.primaryKey
  // } else {
  //   assigneeLi.dataset.name = userRecord.value.displayName
  //   assigneeLi.dataset.phoneNum = userRecord.primaryKey
  // }


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
  console.log(inherit)
  const parent = inherit

  const radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'))
  radio['root_'].classList.add('radio-selected')
  radio.checked = true
  radio.value = JSON.stringify(value)
  console.log(radio.value)
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
  const dateConcat = moment(date + " " + time)
  return moment(dateConcat).valueOf()
}

function insertInputsIntoActivity(record, activityStore) {
  const allStringTypes = document.querySelectorAll('.string')
  for (var i = 0; i < allStringTypes.length; i++) {
    record.attachment[convertIdToKey(allStringTypes[i].id)].value = allStringTypes[i].querySelector('.mdc-text-field__input').value
    console.log(convertIdToKey(allStringTypes[i].id))
  }

  console.log(record.attachment)

  for (var i = 0; i < record.schedule.length; i++) {

    const sd = document.querySelector(`[data-start="${record.schedule[i].name}-startDate"] input`)
    const st = document.querySelector(`[data-start="${record.schedule[i].name}-startTime"] input`)
    const ed = document.querySelector(`[data-end="${record.schedule[i].name}-endDate"] input`)
    const et = document.querySelector(`[data-end="${record.schedule[i].name}-endTime"] input`)
    record.schedule[i].startTime = concatDateWithTime(sd.value, st.value)
    record.schedule[i].endTime = concatDateWithTime(ed.value, et.value)
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
    for (var i = 0; i < record.venue.length; i++) {
          record.venue[i].geopoint = {
            '_latitude' : record.venue[i].geopoint['latitude'],
            '_longitude' : record.venue[i].geopoint['longitude']

          }
    }
    activityStore.put(record)

    console.log(requiredObject)

    return
  }
  requiredObject.office = record.office
  requiredObject.template = record.template
  requiredObject.share = record.assignees
  requestCreator('create',requiredObject)
  console.log(requiredObject)
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
// function updateActivityPanel(db, record) {

//   history.pushState(['updateActivityPanel'],null,null)
//
//   const rootTx = db.transaction('root', 'readwrite')
//   const rootObjectStore = rootTx.objectStore('root')
//   rootObjectStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
//     const record = event.target.result
//     record.view = 'edit-activity'
//     rootObjectStore.put(record)
//   }
//   rootTx.oncomplete = function () {
//     // document.getElementById('back-detail').remove()
//     // document.querySelector('.display-activity-name').remove()
//     // document.getElementById('cancel-update').style.display = 'block'
//     // document.getElementById('cancel-update').addEventListener('click', function () {
//     //   cancelUpdate(record.activityId)
//     // })
//
//     const detail = document.createElement('div')
//     detail.className = 'mdc-top-app-bar--fixed-adjust activity-detail-page'
//     detail.innerHTML = sectionDiv('Office' , {office:record.office,activityTimestamp:record.timestamp}) +showVenue(record.venue)+showSchedule(record.schedule) + updateAttachmentCont()
//
//     document.getElementById('app-current-panel').innerHTML = detail.outerHTML;
//
//     const mapSelectType = document.querySelectorAll('.map-select-type')
//     for (let index = 0; index < mapSelectType.length; index++) {
//       const element = mapSelectType[index];
//       element.addEventListener('click', function (evt) {
//         console.log(evt)
//         renderLocationScreen(evt, record, evt.target.parentElement.nextSibling.id, evt.target.parentElement.nextSibling.nextSibling.id)
//       })
//
//     }
//
//     createAttachmentContainer(record.attachment, 'update--attachment-cont', record.canEdit, true)
//   }
//
// }

function initShareButton(record, db) {
  document.getElementById('share-btn').addEventListener('click', function(evt) {
    if (!db) {
      renderShareScreen(evt, '', '')
      return
    }
    renderShareScreen(evt, record, '')
    // const usersObjectStore = db.transaction('users').objectStore('users')
    // record.assignees.forEach(function (number) {
    //   usersObjectStore.get(number).onsuccess = function (event) {
    //     const result = event.target.result
    //     if (!result) {
    //       const reqBody = {
    //         'activityId': record.activityId,
    //         'number': [number]
    //       }
    //       requestCreator('share', reqBody)
    //     }
    //
    //     // renderLocationScreen(evt,'','')
    //
    //   }
    // })
  })
}

function toggleActivityHeader(toggleId, containerClass, type, record) {

  var toggleButton = new mdc.iconButton.MDCIconButtonToggle(document.getElementById(toggleId))
  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function({
    detail
  }) {
    if (!detail.isOn) {
      checkInValidInputs(type, containerClass)
      console.log("no")
    } else {
      if (type === 'create') {
        checkInValidInputs(type, containerClass)
      } else {
        console.log(record)
        makeFieldsEditable(record)
      }
    }
  })
}

function checkInValidInputs(type) {
  let allow = true
  document.getElementById('app-current-panel').querySelectorAll('[required]').forEach(function(elemnt) {
    console.log(elemnt.value)
    if (elemnt.value.trim() !== '' && allow === true) {
      allow = true
    } else {

      allow = false
    }
  })
  if (!allow) {
    snacks('Please fill are required Inputs')
    return
  }
  createUpdateReqBody(event, type)
}


function activityTitle(title) {
  const container = document.createElement('div')
  container.className = 'activity--title-container activity--detail--section'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--title-input'

  const label = document.createElement('label')
  label.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  label.textContent = 'Activity Name'


  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  const input = document.createElement('input')
  input.required = true
  input.minLength = 1
  input.maxLength = 120

  input.className = 'mdc-text-field__input'

  input.type = 'text'
  if (title) {
    input.setAttribute('value', title)
  }

  textField.appendChild(input)
  textField.appendChild(label)
  textField.appendChild(ripple)

  container.appendChild(textField)
  mdc.textField.MDCTextField.attachTo(textField)
  return container.outerHTML
}

function sectionDiv(key, content, type) {

  const cont = document.createElement('div')
  cont.className = `activity--${key.replace(' ','')}-container activity--detail--section`

  const label = document.createElement('label')
  label.textContent = key

  label.className = 'detail--static-text mdc-typography--subtitle2'
  cont.appendChild(label)

  console.log(type)

  const span = document.createElement('span')
  span.className = `activity--${key.replace(' ','')} activity--update--text`
  span.textContent = content

  if (type === 'base64') {
    const img = document.createElement('img')
    img.className = `activity--${key.replace(' ','')} activity--update--text`
    img.src = content
    cont.appendChild(img)
  }

  if (type === 'Office') {
    const timestampField = document.createElement('span')
    timestampField.textContent = content.activityTimestamp
    span.appendChild(timestampField)
    cont.appendChild(span)
  } else {
    // const span = document.createElement('span')
    // span.className = `activity--${key.replace(' ','')} activity--update--text`
    // span.textContent = content
    cont.appendChild(span)
  }

  return cont.outerHTML
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

  // const icon = document.createElement('i')

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  input.style.paddingTop = '0px'


  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  input.value = value
  if (withIcon) {
    // icon.className = 'material-icons mdc-text-field__icon search-icon-input'
    // icon.textContent = 'arrow_back'
    // icon.id = 'search--close'
    textField.id = 'search--bar--field'
    input.id = 'search--bar-selector'
    textField.classList.add('field-input')
    // icon.onclick = function(){
    //   resetSelectorUI()
    // }
    // textField.appendChild(icon)
  }
  textField.appendChild(input)
  textField.appendChild(ripple)
  const jsTField = new mdc.textField.MDCTextField.attachTo(textField)
  return textField
}

function createTimeInput(value, canEdit, attr) {
  if (!canEdit) {
    const simeplText = document.createElement('span')
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
    input.style.width = '100%'
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

function displayAttachmentCont(attachment) {
  const div = document.createElement('div')
  div.id = 'update--attachment-cont'
  div.className = 'attachment--cont-update'
  Object.keys(attachment).forEach(function(key) {

    div.innerHTML += sectionDiv(key, attachment[key].value, attachment[key].type)
  })
  return div.outerHTML
}

function createSimpleMenu(status) {
  const div = document.createElement("div")
  div.className = 'mdc-menu mdc-menu--status'
  div.setAttribute('tabindex', '-1')

  const ul = document.createElement('ul')
  ul.className = 'mdc-menu__items'
  ul.setAttribute('role', 'menu')
  ul.setAttribute('aria-hidden', 'true')
  const statuses = []
  if(status === 'CONFIRMED') {
      statuses.push('Pending','Cancelled')
  }
  if(status === 'PENDING') {
    statuses.push('confirmed','Cancelled')
  }
  if(status === 'CANCELLED') {
    statuses.push('Confirmed','Pending')
  }

  statuses.forEach(function(status) {
    const li = document.createElement('li')
    li.className = 'mdc-list-item'
    li.setAttribute('role', 'menuitem')
    li.setAttribute('tabindex', '0')
    const span = document.createElement('span')
    span.className = 'mdc-list-item__text'
    span.textContent = status
    li.appendChild(span)
    ul.appendChild(li)
  })
  div.appendChild(ul)

  return div

}

function makeFieldsEditable(record) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function() {
    const db = req.result
    updateActivityPanel(db, record)
  }
}

function cancelUpdate(id) {
  fillActivityDetailPage(id)
}

function availableStatus(record) {
  const statusCont = document.createElement('div')
  statusCont.id = 'activity--status-container'
  statusCont.className = 'activity--detail--section activity--detail--section-status'
  const currentStatus = document.createElement('div')
  currentStatus.className = 'current-status'
  currentStatus.textContent = record.status
  statusCont.appendChild(currentStatus)
  currentStatus.classList.add(record.status)

  if (!record.canEdit) return statusCont.outerHTML

  const avalStatus = document.createElement('div')
  avalStatus.id = 'available-status'

  const pendingIcon = document.createElement('i')
  pendingIcon.classList.add('status-pending', 'material-icons')
  pendingIcon.appendChild(document.createTextNode('priority_high'))
  pendingIcon.id = 'select-pending'

  const cancelIcon = document.createElement('i')
  cancelIcon.classList.add('status-cancel', 'material-icons')
  cancelIcon.appendChild(document.createTextNode('clear'))
  cancelIcon.id = 'select-cancel'

  const confirmedIcon = document.createElement('i')
  confirmedIcon.classList.add('status-confirmed', 'material-icons')
  confirmedIcon.appendChild(document.createTextNode('check'))

  confirmedIcon.id = 'select-confirmed'

  if (record.status === 'PENDING') {
    avalStatus.appendChild(
      cancelIcon
    )
    avalStatus.appendChild(
      confirmedIcon
    )
  }
  if (record.status === 'CANCELLED') {
    avalStatus.appendChild(
      pendingIcon
    )
    avalStatus.appendChild(
      confirmedIcon
    )
  }
  if (record.status === 'CONFIRMED') {
    avalStatus.appendChild(
      cancelIcon
    )
    avalStatus.appendChild(
      pendingIcon
    )
  }
  statusCont.appendChild(avalStatus)

  return statusCont.outerHTML
}

function updateStatus(status, id) {
  const reqBody = {
    'activityId': id,
    'status': status,
  }

  requestCreator('statusChange', reqBody)

}

function showSchedule(schedules) {
  const scheduleCont = document.createElement('div')
  scheduleCont.className = 'activity--schedule-container activity--detail--section'
  const spanDiv = document.createElement('div')
  spanDiv.className = 'schedule--text'

  const scheduleList = document.createElement('div')
  scheduleList.id = 'schedule--list'
  console.log(scheduleList)
  scheduleCont.appendChild(spanDiv)

  schedules.forEach((schedule) => {
    showScheduleUI(schedule, scheduleList)
  })

  scheduleCont.appendChild(scheduleList)
  return scheduleCont.outerHTML
}

function showScheduleUI(schedule, scheduleList) {
  console.log(scheduleList)

  const scheduleLi = document.createElement('div')
  scheduleLi.classList.add('schedule--list')

  const scheduleName = document.createElement('span')
  scheduleName.classList.add('schedule-name--list', 'detail--static-text', 'mdc-typography--subtitle2')
  scheduleName.dataset.value = schedule.name
  scheduleName.innerHTML = schedule.name

  const br = document.createElement('br')

  const startTimeInputs = document.createElement('div')
  startTimeInputs.className = 'startTimeInputs'

  const scheduleStartDate = document.createElement('div')
  scheduleStartDate.classList.add('mdc-text-field', 'startDate')

  const scheduleStartDateInput = document.createElement('input')
  scheduleStartDateInput.type = 'date'
  scheduleStartDateInput.classList.add('mdc-text-field__input', 'border-bottom--none')

  const scheduleStarrTime = document.createElement('div')
  scheduleStarrTime.classList.add('mdc-text-field', 'startTime')

  const scheduleStarrTimeInput = document.createElement('input')
  scheduleStarrTimeInput.type = 'time'
  scheduleStarrTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')

  if (schedule.startTime) {
    scheduleStartDateInput.setAttribute('value', moment(schedule.startTime).format('YYYY-MM-DD'))
    scheduleStarrTimeInput.setAttribute('value', moment(schedule.startTime).format('HH:MM'))
  }

  const startDateLabel = document.createElement('label')
  startDateLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  startDateLabel.textContent = 'Start Date'

  const startTimeLabel = document.createElement('label')
  startTimeLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  startTimeLabel.textContent = 'Start Time'

  const startRipple = document.createElement('div')
  startRipple.className = 'mdc-line-ripple'

  scheduleStartDate.appendChild(scheduleStartDateInput)
  scheduleStartDate.appendChild(startDateLabel)
  scheduleStartDate.appendChild(startRipple)

  scheduleStarrTime.appendChild(scheduleStarrTimeInput)
  scheduleStarrTime.appendChild(startTimeLabel)
  scheduleStarrTime.appendChild(startRipple)


  startTimeInputs.appendChild(scheduleStartDate)
  startTimeInputs.appendChild(scheduleStarrTime)

  const endTimeInputs = document.createElement('div')
  endTimeInputs.className = 'endTimeInputs'

  const scheduleEndDate = document.createElement('div')
  scheduleEndDate.classList.add('mdc-text-field', 'endDate')

  const scheduleEndDateInput = document.createElement('input')
  scheduleEndDateInput.type = 'date'
  scheduleEndDateInput.classList.add('mdc-text-field__input', 'border-bottom--none')

  const scheduleEndTime = document.createElement('div')
  scheduleEndTime.classList.add('mdc-text-field', 'endTime')

  const scheduleEndTimeInput = document.createElement('input')
  scheduleEndTimeInput.type = 'time'
  scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')

  if (schedule.endTime) {
    scheduleEndDateInput.setAttribute('value', moment(schedule.endTime).format('YYYY-MM-DD'))
    scheduleEndTimeInput.setAttribute('value', moment(schedule.endTime).format('HH:mm'))
  }

  const endDateLabel = document.createElement('label')
  endDateLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  endDateLabel.textContent = 'End Date'

  const endTimeLabel = document.createElement('label')
  endTimeLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  endTimeLabel.textContent = 'End Time'

  const endRipple = document.createElement('div')
  endRipple.className = 'mdc-line-ripple'

  scheduleEndDate.appendChild(scheduleEndDateInput)
  scheduleEndDate.appendChild(endDateLabel)
  scheduleEndDate.appendChild(endRipple)

  scheduleEndTime.appendChild(scheduleEndTimeInput)
  scheduleEndTime.appendChild(endTimeLabel)
  scheduleEndTime.appendChild(endRipple)

  endTimeInputs.appendChild(scheduleEndDate)
  endTimeInputs.appendChild(scheduleEndTime)


  scheduleLi.appendChild(scheduleName)
  scheduleLi.appendChild(br)
  scheduleLi.appendChild(startTimeInputs)
  scheduleLi.appendChild(endTimeInputs)
  console.log(scheduleList)
  scheduleList.appendChild(scheduleLi)
}

function displayVenue(venues) {
  if (!venues.length) return document.createElement('span').outerHTML

  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container'
  const venueList = document.createElement('ul')
  venueList.className = 'mdc-list activity--detail--section'

  venues.forEach(function(venue) {

    const venueLi = document.createElement('li')
    venueLi.className = 'mdc-list-item venue--list mdc-ripple-upgraded'
    const span = document.createElement('span')
    span.className = 'mdc-list-item__text'

    const descSpan = document.createElement('span')
    descSpan.className = 'mdc-list-item__primary-text detail--static-text'
    descSpan.textContent = venue.venueDescriptor

    const primarySpan = document.createElement('span')
    primarySpan.className = 'mdc-list-item__primary-text'
    primarySpan.textContent = venue.location

    const link = document.createElement('a')
    link.href = `https://maps.google.com/?q=${venue.geopoint['_latitude']},${venue.geopoint['_longitude']}`
    link.className = 'address-link-geo'
    const secondarySpan = document.createElement('span')
    secondarySpan.className = 'mdc-list-item__secondary-text venue--address'
    secondarySpan.textContent = venue.address

    link.appendChild(secondarySpan)

    span.appendChild(descSpan)
    span.appendChild(primarySpan)
    span.appendChild(link)

    venueLi.appendChild(span)
    venueList.appendChild(venueLi)
  })
  return venueList.outerHTML
}

function showVenue(venues, canEdit) {
  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container activity--detail--section'

  const venueList = document.createElement('ul')
  venueList.className = 'mdc-list'
  venueList.id = 'venue--list'

  var count = 0
  venues.forEach((venue) => {
    if (venue.geopoint) {
      count++

      showVenueUI(venue, count, venueList)
    }
  })

  venueCont.appendChild(venueList)
  return venueCont.outerHTML
}

function showVenueUI(venue, count, venueList) {

  const venueLi = document.createElement('li')
  venueLi.className = 'mdc-list-item map-select-type map-select' + count
  venueLi.dataset.location = venue.location
  venueLi.dataset.address = venue.address
  venueLi.dataset.inputlat = venue.geopoint['_latitude']
  venueLi.dataset.inputlon = venue.geopoint['_longitude']
  venueLi.dataset.descrip = venue.venueDescriptor

  const venueDesc = document.createElement('span')

  venueDesc.id = `venue-desc${count}`
  venueDesc.dataset.descriptor = venue.venueDescriptor
  venueDesc.className = 'detail--static-text venue--name-label mdc-list-item__text'
  venueDesc.textContent = `${venue.venueDescriptor} : ${venue.location} `

  const addLocationFab = document.createElement('button')
  addLocationFab.className = 'mdc-fab mdc-fab-location material-icons'

  const addLocationIcon = document.createElement('i')
  addLocationIcon.className = 'material-icons mdc-fab__icon map-select-type-action'

  addLocationIcon.textContent = 'add_location'

  addLocationFab.appendChild(addLocationIcon)

  const venueLocation = document.createElement('div')
  venueLocation.classList.add('mdc-text-field', 'venue-location--name')
  venueLocation.id = `venue-location${count}`
  const venueLocationInput = document.createElement('input')
  venueLocationInput.classList.add('mdc-text-field__input', 'border-bottom--none', 'venue-location--input')
  if (!venue.location) {
    venueLocationInput.setAttribute('placeholder', 'Choose Location')
  } else {
    venueLocationInput.setAttribute('value', venue.location)
  }

  venueLocationInput.disabled = true
  venueLocation.appendChild(venueLocationInput)

  const venueAddress = document.createElement('div')
  venueAddress.classList.add('mdc-text-field', 'venue-address--name')
  venueAddress.id = 'venue-address' + count
  const venueAddressInput = document.createElement('input')
  venueAddressInput.classList.add('mdc-text-field__input', 'border-bottom--none')
  if (!venue.address) {
    venueAddressInput.setAttribute('placeholder', 'Choose Address')
  } else {
    venueAddressInput.setAttribute('value', venue.address)
  }

  venueAddressInput.disabled = true

  venueAddress.appendChild(venueAddressInput)

  venueLi.appendChild(venueDesc)
  venueLi.appendChild(addLocationFab)
  venueLi.appendChild(venueLocation)
  venueLi.appendChild(venueAddress)
  const div = document.createElement('div')

  div.appendChild(venueLi)
  venueList.appendChild(div)
}

function updateAttachmentCont() {
  const div = document.createElement('div')
  div.id = 'update--attachment-cont'
  div.className = 'attachment--cont-update activity--detail--section'
  return div.outerHTML
}


function fetchAssigneeData(db, record, target) {
  const usersStore = db
    .transaction('users')
    .objectStore('users')
  record.assignees.forEach((mobileNumber) => {
    console.log(record)
    usersStore.openCursor(mobileNumber).onsuccess = function(e) {
      const cursor = e.target.result
      console.log(cursor)
      assigneeListUI(cursor, target)

    }
  })
}

function assigneeListUI(userRecord, target, inputField) {
  // if(document.querySelector(`[data-phoneNum="${userRecord.primaryKey}"]`)) return

  const assigneeLi = document.createElement('li')
  if (target === 'assignee--list') {
    assigneeLi.dataset.assignee = userRecord.primaryKey
  } else {
    assigneeLi.dataset.name = userRecord.value.displayName
    assigneeLi.dataset.phoneNum = userRecord.primaryKey
  }

  assigneeLi.classList.add('mdc-list-item', 'assignee-li')

  const photoGraphic = document.createElement('img')
  photoGraphic.classList.add('mdc-list-item__graphic')

  if (!userRecord.value.photoURL) {
    photoGraphic.src = './img/empty-user.jpg'
  } else {
    photoGraphic.src = userRecord.value.photoURL
  }

  const assigneeListText = document.createElement('span')
  assigneeListText.classList.add('mdc-list-item__text')
  assigneeListText.textContent = userRecord.value.displayName

  const assigneeListTextSecondary = document.createElement('span')
  assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text')
  assigneeListTextSecondary.textContent = userRecord.value.mobile
  assigneeListText.appendChild(assigneeListTextSecondary)

  assigneeLi.appendChild(photoGraphic)
  assigneeLi.appendChild(assigneeListText)
  if (target !== 'assignee--list') {
    assigneeLi.onclick = function(e) {
      getInputText(inputField)['root_'].classList.add('mdc-text-field--focused')
      getInputText(inputField)['label_']['root_'].textContent = this.dataset.name || 'Contact'
      getInputText(inputField).value = this.dataset.phoneNum
    }
  }
  console.log(target)
  document.getElementById(target).appendChild(assigneeLi)
}

function locationUI(userRecord, target, inputFields) {
  if (document.querySelector(`[data-location="${userRecord.value.location}"]`)) return

  console.log(target)
  const div = document.createElement('div')
  div.style.position = 'relative'

  div.dataset.location = userRecord.value.location
  div.dataset.address = userRecord.value.address
  div.dataset.desc = userRecord.value.venueDescriptor
  div.dataset.lat = userRecord.value.geopoint['_latitude']
  div.dataset.lon = userRecord.value.geopoint['_longitude']

  div.id = userRecord.value.location.replace(/\s/g, '')

  const Li = document.createElement('li')

  Li.classList.add('mdc-list-item', 'location-li')

  const locationListText = document.createElement('span')
  locationListText.classList.add('mdc-list-item__text')
  locationListText.textContent = userRecord.value.location

  const locationListTextSecondary = document.createElement('span')
  locationListTextSecondary.classList.add('mdc-list-item__secondary-text')
  locationListTextSecondary.textContent = userRecord.value.address
  locationListText.appendChild(locationListTextSecondary)

  Li.appendChild(locationListText)
  div.appendChild(Li)

  document.getElementById(target).appendChild(div)

  if (!document.getElementById(userRecord.value.location.replace(/\s/g, ''))) return

  document.getElementById(userRecord.value.location.replace(/\s/g, '')).addEventListener('click', function() {
    getInputText(inputFields.main).value = this.dataset.location

    document.getElementById(inputFields.main).dataset.location = this.dataset.location
    document.getElementById(inputFields.main).dataset.address = this.dataset.address
    document.getElementById(inputFields.main).dataset.inputlat = this.dataset.lat
    document.getElementById(inputFields.main).dataset.inputlon = this.dataset.lon
    document.getElementById(inputFields.main).dataset.descrip = this.dataset.desc
  })
}

function renderRemoveIcons(record, mobileNumber) {
  console.log('run')
  const removeIcon = document.createElement('span')
  removeIcon.classList.add('mdc-list-item__meta', 'material-icons')
  removeIcon.textContent = 'cancel'

  removeIcon.classList.add('remove')
  const activityId = record.activityId

  removeIcon.onclick = function(e) {
    if (record.remove === 'hidden') {
      document.querySelector(`[data-assignee="${mobileNumber}"]`).remove()
      return
    }
    const phoneNumber = e.target.parentNode.dataset.assignee
    const reqBody = {
      'activityId': activityId,
      'remove': phoneNumber
    }
    console.log(reqBody)
    requestCreator('removeAssignee', reqBody)
  }
  if (mobileNumber !== firebase.auth().currentUser.phoneNumber) {
    document.querySelector(`[data-assignee="${mobileNumber}"]`).appendChild(removeIcon)
  }
}

function renderShareIcon(record) {
  if (!record.canEdit) {
    return document.createElement('span')
  }

  const IconParent = document.createElement('button')
  IconParent.classList.add('add--assignee-icon', 'mdc-fab')
  IconParent.id = 'share-btn'
  const icon = document.createElement('i')
  icon.classList.add('material-icons', 'mdc-fab__icon')
  icon.textContent = 'person_add'
  IconParent.appendChild(icon)

  // document.getElementById('share--icon-container').innerHTML = IconParent.outerHTML

  return IconParent
}

function renderShareScreen(evt, record, key) {
  renderShareScreenUI()

  inputSelect({
    name: 'users',
    indexone: 'users',
    indextwo: 'displayName',
    indexThree: 'count'
  }, 'contacts--container', {
    main: 'contact-text-field'
  }, record)

  initializeDialog(evt, 'contact-text-field', {
    actionInput: key,
    id: record.activityId
  })
}


function initializeDialogTemplateName(evt, input, params) {
  getInputText(input).value = ''
  console.log(params)
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#children-name'))


  dialog.listen('MDCDialog:accept', function() {
    const name = getInputText(input)['root_'].dataset.name

    if (!name) {
      getInputText(params.actionInput.replace(/\s/g, '')).value = ''
    } else {
      getInputText(params.actionInput.replace(/\s/g, '')).value = name
    }
    getInputText(params.actionInput.replace(/\s/g, ''))['root_'].style.height = '40px'
    getInputText(params.actionInput.replace(/\s/g, ''))['root_'].style.marginTop = '0px'

    document.getElementById('children-name').remove()
  })

  dialog.listen('MDCDialog:cancel', function() {
    document.getElementById('children-name').remove()
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function childrenNames(cursor, target, input) {
  console.log(cursor)

  const li = document.createElement('li')
  li.dataset.name = cursor.value.attachment.Name.value
  li.classList.add('mdc-list-item', 'combo-li')

  const liText = document.createElement('span')
  liText.classList.add('mdc-list-item__text')
  liText.textContent = cursor.value.attachment.Name.value

  console.log(target)
  li.appendChild(liText)

  document.getElementById(target).appendChild(li)

  dataElement('name', cursor.value.attachment.Name.value).addEventListener('click', function() {
    getInputText(input).value = ''
    getInputText(input)['root_'].dataset.name = this.dataset.name
    // getInputText(input)['root_'].dataset.template = this.dataset.template
    getInputText(input).value = this.dataset.name

    // getInputText(input)['root_'].children[2].textContent = this.dataset.template
  })
}

function renderLocationScreen(evt, record, primaryKey, secondarKey) {
  renderLocationScreenUI()

  inputSelect({
    name: 'map',
    indexone: 'location',
    indextwo: 'address',
    indexThree: 'count'
  }, 'location--container', {
    main: 'location-text-field'
  }, record)

  initializeDialogLocation(evt, 'location-text-field', {
    actionInput: {
      primary: primaryKey,
      secondary: secondarKey
    },
    id: record.activityId
  })
}

function renderOfficeTemplateScreen(evt) {
  renderOfficeTemplateScreenUI()

  inputSelect({
    name: 'subscriptions',
    indexone: 'office',
    indextwo: 'template'
  }, 'officeTemplate--container', {
    main: 'officeTemplate--text-field'
  })

  initializeOfficeTemplateDialog(evt, 'officeTemplate--text-field')
}

function outlinedTextField(labelText, id) {
  const inputField = document.createElement('div')
  inputField.className = 'mdc-text-field text-field mdc-text-field--outlined mdc-text-field--with-leading-icon mdc-text-field--upgraded'
  inputField.id = id
  const icon = document.createElement('i')
  icon.className = 'material-icons mdc-text-field__icon'
  icon.textContent = 'account_circle'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  input.type = 'text'
  // input.id= id

  const label = document.createElement('label')
  label.className = 'mdc-floating-label'
  // label.for  = id
  label.textContent = labelText
  label.id = 'label--description'

  const notched = document.createElement('div')
  notched.className = 'mdc-notched-outline'

  const svg = document.createElement('svg')

  const path = document.createElement('path')
  path.className = 'mdc-notched-outline__path'

  svg.appendChild(path)
  notched.appendChild(svg)

  const notchedIdle = document.createElement('div')
  notchedIdle.className = 'mdc-notched-outline__idle'

  inputField.appendChild(icon)
  inputField.appendChild(input)
  inputField.appendChild(label)
  inputField.appendChild(notched)
  inputField.appendChild(notchedIdle)
  return inputField.outerHTML
}


function renderLocationScreenUI() {
  const aside = document.createElement('aside')

  aside.id = 'location-select-dialog'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const dialogHeader = document.createElement('header')
  dialogHeader.className = 'mdc-dialog__header'

  dialogHeader.innerHTML = outlinedTextField('Select Location', 'location-text-field')

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable'

  const ul = document.createElement('ul')
  ul.id = 'location--container'
  ul.className = 'mdc-list topToBottom'

  section.appendChild(ul)
  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'

  const decline = document.createElement('button')
  decline.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel'
  decline.type = 'button'
  decline.textContent = 'Cancel'

  const accept = document.createElement('button')
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept'
  accept.type = 'button'
  accept.textContent = 'Select'

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

function renderOfficeTemplateScreenUI() {
  const aside = document.createElement('aside')

  aside.id = 'officeTemplate-select-dialog'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const dialogHeader = document.createElement('header')
  dialogHeader.className = 'mdc-dialog__header'

  dialogHeader.innerHTML = outlinedTextField('Select Office & Template', 'officeTemplate--text-field')

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable'

  const ul = document.createElement('ul')
  ul.id = 'officeTemplate--container'
  ul.className = 'mdc-list'

  section.appendChild(ul)

  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'

  const decline = document.createElement('button')
  decline.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel'
  decline.type = 'button'
  decline.textContent = 'Cancel'

  const accept = document.createElement('button')
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept'
  accept.type = 'button'
  accept.textContent = 'Select'
  accept.id = 'accept-office-template-selector'
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

function initializeDialog(evt, input, params) {
  console.log(params)
  getInputText(input).value = ''

  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#change-number-dialog'))
  dialog.listen('MDCDialog:accept', function() {
    const number = []
    number.push(getInputText(input).value)
    if (params.actionInput) {

      if (!getInputText(input).value) {
        getInputText(params.actionInput).value = ''
      } else {

        getInputText(params.actionInput).value = number[0]
      }
      getInputText(params.actionInput)['root_'].style.height = '40px'
      getInputText(params.actionInput)['root_'].style.marginTop = '0px'
      document.getElementById('change-number-dialog').remove()

      return
    }

    addContact(number, params.id);

    // const removeClass = document.querySelectorAll('.remove')
    // for (let index = 0; index < removeClass.length; index++) {
    //   const icon = removeClass[index];
    //   icon.classList.add('no-click')
    //
    // }

    document.getElementById('change-number-dialog').remove()
    return;

  })

  dialog.listen('MDCDialog:cancel', function() {
    document.getElementById('change-number-dialog').remove()
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function initializeDialogLocation(evt, input, params) {
  console.log(params)
  console.log(input)
  getInputText(input).value = ''
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#location-select-dialog'))
  dialog.listen('MDCDialog:accept', function() {



    const location = getInputText(input)['root_'].dataset.location
    const address = getInputText(input)['root_'].dataset.address
    const lat = getInputText(input)['root_'].dataset.inputlat
    const lon = getInputText(input)['root_'].dataset.inputlon

    if (params.actionInput) {
      getInputText(params.actionInput.primary).value = location || ''
      getInputText(params.actionInput.secondary).value = address || ''

      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.location = location || ''
      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.address = address || ''

      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.inputlat = lat || ''
      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.inputlon = lon || ''
      document.querySelector('.pac-container').remove()
      document.getElementById('location-select-dialog').remove()
    }
  })

  dialog.listen('MDCDialog:cancel', function() {
    document.querySelector('.pac-container').remove()

    document.getElementById('location-select-dialog').remove()
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function initializeOfficeTemplateDialog(evt, input) {
  getInputText(input).value = ''

  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#officeTemplate-select-dialog'))

  console.log(dialog)
  dialog.listen('MDCDialog:accept', function() {

    const office = getInputText(input)['root_'].dataset.office
    const template = getInputText(input)['root_'].dataset.template

    if (office && template) {

      getSelectedSubscriptionData(office, template)
      document.getElementById('officeTemplate-select-dialog').remove()
    }
  })

  dialog.listen('MDCDialog:cancel', function() {
    document.getElementById('officeTemplate-select-dialog').remove()
    listView(firebase.auth().currentUser.uid)
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function updateSelectorObjectStore(dataset, input, objectStoreName) {
  console.log(dataset)
  const dbName = firebase.auth().currentUser.uid

  const inputValue = getInputText(input)['root_'].dataset.number
  const req = indexedDB.open(dbName)

  return new Promise(function(resolve, reject) {
    req.onsuccess = function() {
      const db = req.result
      const storeTx = db.transaction([objectStoreName], 'readwrite')

      const objectStore = storeTx.objectStore(objectStoreName)

      objectStore.get(inputValue).onsuccess = function(event) {
        const record = event.target.result
        if (!record) {
          resolve({
            value: inputValue,
            activityId: dataset.id
          })
          return
        }
        record.count = record.count + 1
        objectStore.put(record)
      }
      storeTx.oncomplete = function() {
        resolve({
          value: inputValue,
          activityId: dataset.id
        })
      }
      storeTx.onerror = function(event) {
        reject(event.error)
      }
    }
  })
}

function errorUpdatingSelectorObjectStore(error) {
  console.log(error)
}

function addContact(number, activityId) {
  if (!activityId) {
    console.log(number)
    const assigneeObject = {
      assignees: number,
      canEdit: true,
      remove: 'hidden'
    }
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function() {
      const db = req.result
      fetchAssigneeData(db, assigneeObject, 'assignee--list')
    }
    return
  }

  const expression = /^\+[1-9]\d{5,14}$/
  if (!expression.test(number)) return
  console.log(number)
  const reqBody = {
    'activityId': activityId,
    'share': number
  }
  requestCreator('share', reqBody)

}

function dataElement(target, key) {
  return document.querySelector(`[data-${target}="${key}"]`)
}

function createActivity(evt) {

  history.pushState(['createActivity'], null, null)

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result;
    const rootTx = db.transaction('root', 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function(event) {
      const record = event.target.result
      record.view = 'create'
      rootObjectStore.put(record)
    }

    rootTx.oncomplete = function() {
      const detail = document.createElement('div')
      detail.className = 'mdc-top-app-bar--fixed-adjust'
      detail.id = 'create-activity--container'
      createActivityDetailHeader({
        canEdit: true
      }, 'create')

      const activityMain = document.createElement('div')
      activityMain.className = 'activity-main'
      activityMain.innerHTML = sectionDiv('Office') + sectionDiv('Template') + createScheduleContainer() +
        createVenueContainer() + renderAssigneeList({
          canEdit: true
        })

      detail.innerHTML = activityMain.outerHTML

      document.getElementById('app-current-panel').innerHTML = detail.outerHTML

      document.getElementById('back-list').addEventListener('click', function() {
        // listView(dbName)
        handleViewFromHistory()
      })

      initShareButton()
      renderOfficeTemplateScreen(evt)
      sendCurrentViewNameToAndroid('create')
    }
  }
}

function officeTemplate() {
  const cont = document.createElement('div')
  cont.id = 'select-officeTemplate--container'
  cont.className = 'start-transition'

  const label = document.createElement('label')
  label.textContent = 'Select Office'
  label.className = 'mdc-typography--headline6 select-office-span'

  const button = document.createElement('button')
  button.className = 'mdc-fab add--officeTemplate-icon'
  button.id = 'officeTemplateSelect'
  const buttonIcon = document.createElement('span')
  buttonIcon.className = 'mdc-fab__icon material-icons'
  buttonIcon.textContent = 'add'

  button.appendChild(buttonIcon)
  cont.appendChild(label)
  cont.appendChild(button)

  return cont.outerHTML
}

function officeTemplateCombo(cursor, target, input) {
  console.log(input)
  if (document.querySelector(`[data-office="${cursor.value.office}"][data-template="${cursor.value.template}"]`)) return

  const li = document.createElement('li')
  li.dataset.office = cursor.value.office
  li.dataset.template = cursor.value.template

  li.classList.add('mdc-list-item', 'combo-li')

  const liText = document.createElement('span')
  liText.classList.add('mdc-list-item__text')
  liText.textContent = cursor.value.office

  const liTextSecondary = document.createElement('span')
  liTextSecondary.classList.add('mdc-list-item__secondary-text')
  liTextSecondary.textContent = cursor.value.template

  liText.appendChild(liTextSecondary)

  li.appendChild(liText)
  document.getElementById(target).appendChild(li)
  document.querySelector(`[data-office="${cursor.value.office}"][data-template="${cursor.value.template}"]`).addEventListener('click', function() {
    document.getElementById('accept-office-template-selector').disabled = false;
    getInputText(input).value = ''
    getInputText(input)['root_'].dataset.office = this.dataset.office
    getInputText(input)['root_'].dataset.template = this.dataset.template
    getInputText(input).value = this.dataset.office

    getInputText(input)['root_'].children[2].textContent = this.dataset.template
  })
}

function createVenueContainer() {
  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container activity--detail--section'
  return venueCont.outerHTML
}

function createScheduleContainer() {
  const scheduleCont = document.createElement('div')
  scheduleCont.className = 'activity--schedule-container activity--detail--section'
  const spanDiv = document.createElement('div')
  spanDiv.className = 'schedule--text'

  const scheduleList = document.createElement('ul')
  scheduleList.className = 'mdc-list'
  scheduleList.id = 'schedule--list'

  scheduleCont.appendChild(spanDiv)

  return scheduleCont.outerHTML
}

function createInput(key, type, classtype, value) {
  const mainTextField = document.createElement('div')
  mainTextField.className = `mdc-text-field mdc-text-field--dense ${classtype} attachment--text-field`

  mainTextField.dataset.key = key
  mainTextField.dataset.type = type
  mainTextField.id = key.replace(/\s/g, '')
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'

  if (type === 'string' && key !== "Name") {
    mainTextField.classList.add('attachment--string-input-active')
  }

  if (type === 'HH:MM') {
    mainInput.type = 'time'
  } else {
    mainInput.type = 'text'
  }


  if (value) {
    mainInput.disabled = value
    mainInput.style.borderBottom = 'none'
    mainInput.placeholder = 'select ' + key
  } else {
    mainInput.placeholder = key
  }

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

function getSelectedSubscriptionData(office, template) {

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)

  req.onsuccess = function() {
    const db = req.result
    const subscriptionObjectStore = db.transaction('subscriptions').objectStore('subscriptions').index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    subscriptionObjectStore.get(range).onsuccess = function(event) {
      const record = event.target.result
      console.log(record)

      document.querySelector('.activity--Office').textContent = record.office
      document.querySelector('.activity--Template').textContent = record.template

      record.schedule.forEach(function(name) {
        console.log(name)
        showScheduleUI({
          name: name,
          startTime: '',
          endTime: ''
        }, document.querySelector('.activity--schedule-container'))
      });


      let venueCont = 0
      record.venue.forEach(function(venueDescriptor) {
        venueCont++
        const locationsearch = document.createElement('ul')
        locationsearch.id = 'location--search' + venueCont
        locationsearch.className = 'mdc-list'

        showVenueUI({
          venueDescriptor: venueDescriptor,
          address: '',
          geopoint: {
            '_latitude': '',
            '_longitude': ''
          }
        }, venueCont, document.querySelector('.activity--venue-container'), false)

        document.querySelector('.map-select' + venueCont).parentNode.appendChild(locationsearch)
      });

      const mapSelectAction = document.querySelectorAll('.map-select-type-action')
      for (let index = 0; index < mapSelectAction.length; index++) {
        const element = mapSelectAction[index];
        element.addEventListener('click', function(evt) {
          console.log(evt)
          renderLocationScreen(evt, record, evt.target.parentElement.nextSibling.id, evt.target.parentElement.nextSibling.nextSibling.id)
        })
      }
      if (!record.attachment) return
      createAttachmentContainer(record.attachment, 'create-activity--container', true, false, office, template)
    }
  }
}




function setFilePath(str) {
  const imageFieldInput = document.querySelector('.image-preview--attachment').children[0]
  const img = document.createElement('img')
  img.src = `data:image/jpeg;base64,${str}`
  img.className = 'profile-container--main'
  getInputText(imageFieldInput.id).value = `data:image/jpeg;base64,${str}`
  imageFieldInput.style.opacity = '0'
  document.querySelector('.image-preview--attachment').appendChild(img)
}

function readCameraFile() {
  FetchCameraForAttachment.startCamera()
}

function reinitCount(db, id) {

  const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
  activityCount.get(id).onsuccess = function(event) {
    const record = event.target.result
    record.count = 0
    activityCount.put(record)
  }
}



function createSelectMenu(key) {
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

function createUpdateReqBody(event, reqType) {

  let allow = true
  const activityId = event.target.dataset.id
  const schedule = []
  const venue = []
  const share = []

  const allSchedule = document.querySelectorAll('.schedule--list');
  for (let index = 0; index < allSchedule.length; index++) {
    const element = allSchedule[index];

    const scheduleBody = {}
    scheduleBody.name = element.children[0].dataset.value
    const startTime = `${element.querySelector('.startDate').children[0].value} ${element.querySelector('.startTime').children[0].value}`
    const endTime = `${element.querySelector('.endDate').children[0].value} ${element.querySelector('.endTime').children[0].value}`

    console.log(startTime)

    if (startTime == " " && endTime == " ") {

      allow = true
    }

    if (startTime !== " " && endTime == " ") {
      snacks('Add a valid End Time')
      allow = false
    }

    if (endTime !== " " && startTime == " ") {
      snacks('Add a valid Start Time')
      allow = false
    }

    if (startTime && endTime && moment(endTime).valueOf() < moment(startTime).valueOf()) {
      snacks('End time cannot be before Start time')
      allow = false
    }

    scheduleBody.startTime = moment(startTime).valueOf() || ''
    scheduleBody.endTime = moment(endTime).valueOf() || ''
    schedule.push(scheduleBody)


  }

  const allVenues = document.querySelectorAll('.map-select-type');

  for (let index = 0; index < allVenues.length; index++) {
    const li = allVenues[index];

    geopoint = {}
    const venueBody = {}

    venueBody.venueDescriptor = li.dataset.descrip
    venueBody.location = li.dataset.location === 'undefined' ? '' : li.dataset.location
    venueBody.address = li.dataset.address || ''
    if (!parseInt(li.dataset.inputlat) || !parseInt(li.dataset.inputlon)) {
      geopoint = ''
    } else {
      geopoint.latitude = parseInt(li.dataset.inputlat)
      geopoint.longitude = parseInt(li.dataset.inputlon)
    }

    venueBody['geopoint'] = geopoint
    venue.push(venueBody)
  }

  const attachments = {}
  const allAttachments = document.querySelectorAll('.attachment');
  for (let index = 0; index < allAttachments.length; index++) {
    const field = allAttachments[index]
    attachments[field.dataset.key] = {
      value: field.id === 'weekday' ? field.dataset.value : getInputText(field.id).value,
      type: field.dataset.type
    }

  }

  if (!allow) return

  if (reqType === 'edit') {
    const body = {
      'activityId': activityId,
      'schedule': schedule,
      'venue': venue,
      'attachment': attachments
    }
    requestCreator('update', body)
    return
  }

  if (reqType === 'create') {
    const allShare = document.querySelectorAll('.assignee-li');
    for (let index = 0; index < allShare.length; index++) {
      share.push(allShare[index].dataset.assignee)

    }

    const body = {
      'office': document.querySelector('.activity--Office').textContent,
      'template': document.querySelector('.activity--Template').textContent,
      'share': share,
      'schedule': schedule,
      'venue': venue,
      'attachment': attachments
    }

    console.log(body)
    requestCreator('create', body)
    return
  }
}
