function conversation (id) {
  if (!id) return
  // removeDom('chat-container')
  const currentUser = firebase.auth().currentUser

  const req = window.indexedDB.open(currentUser.uid)

  req.onsuccess = function () {
    const db = req.result
    createHeaderContent(db, id)

    const addendumIndex = db.transaction('addendum', 'readonly').objectStore('addendum').index('activityId')
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(currentUser.uid).onsuccess = function (event) {
      const record = event.target.result
      record.id = id
      record.view = 'conversation'
      rootObjectStore.put(record)
    }

    // fillActivityDetailPage(db, id)
    commentPanel(id)

    addendumIndex.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      createComment(cursor.value, currentUser)
      cursor.continue()
    }
  }
}

function commentPanel (id) {
  const commentPanel = document.createElement('div')
  commentPanel.className = 'activity--chat-card-container mdc-card mdc-top-app-bar--fixed-adjust panel-card'

  const chatCont = document.createElement('div')
  chatCont.id = 'chat-container'
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
  input.style.position = 'absolute'

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
  commentPanel.appendChild(userCommentCont)

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML
  document.getElementById('send-chat--input').onclick = function () {
    const reqBody = {
      'activityId': id,
      'comment': getInputText('write--comment').value
    }

    requestCreator('comment', reqBody)
    getInputText('write--comment').value = ''
  }
}

function createComment (addendum, currentUser) {
  let commentBox = document.createElement('div')
  commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')
  currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment') : commentBox.classList.add('other-user--comment')
  commentBox.id = addendum.addendumId

  let textContainer = document.createElement('div')
  textContainer.classList.add('talktext')

  let user = document.createElement('p')
  user.classList.add('user-name--comment')
  user.appendChild(document.createTextNode(addendum.user))

  let comment = document.createElement('p')
  comment.classList.add('comment')
  comment.appendChild(document.createTextNode(addendum.comment))

  let commentInfo = document.createElement('span')
  commentInfo.style.width = '100%'
  const datespan = document.createElement('span')
  datespan.textContent = moment(addendum.timestamp).calendar()
  datespan.classList.add('comment-date')

  let mapIcon = document.createElement('i')
  mapIcon.classList.add('user-map--span', 'material-icons')
  mapIcon.appendChild(document.createTextNode('location_on'))
  mapIcon.onclick = function (iconEvent) {
    window.open(`https://www.google.co.in/maps/@${addendum.location['_latitude']},${addendum.location['_longitude']}`)
  }

  commentInfo.appendChild(datespan)
  commentInfo.appendChild(mapIcon)
  textContainer.appendChild(user)
  textContainer.appendChild(comment)
  textContainer.appendChild(commentInfo)

  commentBox.appendChild(textContainer)
  document.getElementById('chat-container').appendChild(commentBox)

  const container = document.getElementById('chat-container')
  container.scrollTop = container.scrollHeight
  // container.scrollTop = container.scrollHeight
}

function createHeaderContent (db, id) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  const leftDiv = document.createElement('div')

  const backSpan = document.createElement('span')
  backSpan.className = 'back-icon'
  backSpan.id = 'back-conv'
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'

  backSpan.appendChild(backIcon)

  activityObjectStore.get(id).onsuccess = function (event) {
    const record = event.target.result

    const primarySpan = document.createElement('span')
    primarySpan.className = 'mdc-list-item__text comment-header-primary'
    primarySpan.textContent = record.title

    const secondarySpan = document.createElement('span')
    secondarySpan.className = 'mdc-list-item__secondary-text'
    secondarySpan.textContent = record.office

    primarySpan.appendChild(secondarySpan)
    leftDiv.appendChild(backSpan)
    leftDiv.appendChild(primarySpan)

    const status = document.createElement('span')
    status.className = `${record.status} header-status`
    status.textContent = record.status

    header(leftDiv.outerHTML, status.outerHTML)
    document.getElementById('back-conv').addEventListener('click', listView)
  }
}

// function fillActivityDetailPage (db, id) {
//   const activityObjectStore = db.transaction('activity').objectStore('activity')
//   activityObjectStore.get(id).onsuccess = function (event) {
//     const record = event.target.result
//     console.log(record)
//     getInputText('activity--title-input').value = record.title
//     getInputText('activity--desc-input').value = record.description
//     document.querySelector('.current-status').innerHTML = record.status

//     availableStatus(record, id)

//     document.querySelector('.activity--office').innerHTML = record.office
//     document.querySelector('.activity--template').innerHTML = record.template

//     showSchedule(record.schedule, record.canEdit)
//     showVenue(record.venue, record.canEdit)
//     renderAssigneeList(db, record, 'assignee--list')
//     renderShareIcon(record)
//   }
//   document.getElementById('updateActivity').addEventListener('click', function () {
//     makeFieldsEditable(id)
//   })
// }

// function makeFieldsEditable (id) {
//   getInputText('activity--title-input')['input_'].disabled = false
//   getInputText('activity--desc-input')['input_'].disabled = false
//   const startSchedule = document.querySelectorAll('.startTimeInputs')
//   const endSchedules = document.querySelectorAll('.endTimeInputs');
//   [...startSchedule].forEach(function (li) {
//     console.log(li)
//     if (li.classList.contains('mdc-text-field')) {
//       getInputText(li.id)['input_'].disabled = false
//     }
//   });

//   [...endSchedules].forEach(function (li) {
//     console.log(li)
//     if (li.classList.contains('mdc-text-field')) {
//       getInputText(li.id)['input_'].disabled = false
//     }
//   })
// }

// function availableStatus (record, id) {
//   document.querySelector('.current-status').classList.add(record.status)
//   if (document.querySelector('.current-status').classList.length > 2) {
//     const previousStatus = document.querySelector('.current-status').classList[1]
//     document.querySelector('.current-status').classList.remove(previousStatus)
//   }

//   if (!record.canEdit) return
//   removeDom('available-status')

//   const pendingIcon = document.createElement('i')
//   pendingIcon.classList.add('status-pending', 'material-icons')
//   pendingIcon.appendChild(document.createTextNode('undo'))
//   pendingIcon.id = 'select-pending'

//   pendingIcon.onclick = function () {
//     updateStatus(
//       'PENDING',
//       id
//     )
//   }

//   const cancelIcon = document.createElement('i')
//   cancelIcon.classList.add('status-cancel', 'material-icons')
//   cancelIcon.appendChild(document.createTextNode('clear'))
//   cancelIcon.id = 'select-cancel'
//   cancelIcon.onclick = function () {
//     updateStatus(
//       'CANCELLED',
//       id
//     )
//   }

//   const confirmedIcon = document.createElement('i')
//   confirmedIcon.classList.add('status-confirmed', 'material-icons')
//   confirmedIcon.appendChild(document.createTextNode('check'))

//   confirmedIcon.id = 'select-confirmed'
//   confirmedIcon.onclick = function () {
//     updateStatus(
//       'CONFIRMED',
//       id
//     )
//   }

//   if (record.status === 'PENDING') {
//     document.querySelector('#available-status').appendChild(
//       cancelIcon
//     )
//     document.querySelector('#available-status').appendChild(
//       confirmedIcon
//     )
//     return
//   }
//   if (record.status === 'CANCELLED') {
//     document.querySelector('#available-status').appendChild(
//       pendingIcon
//     )
//     document.querySelector('#available-status').appendChild(
//       confirmedIcon
//     )
//     return
//   }
//   if (record.status === 'CONFIRMED') {
//     document.querySelector('#available-status').appendChild(
//       cancelIcon
//     )
//     document.querySelector('#available-status').appendChild(
//       pendingIcon
//     )
//   }
// }

// function updateStatus (status, id) {
//   const reqBody = {
//     'activityId': id,
//     'status': status
//   }

//   requestCreator('statusChange', reqBody)
// }

// function showSchedule (schedules, canEdit) {
//   let scheduleCount = 0

//   removeDom('schedule--list')

//   function getMonthDate (dateString) {
//     const split = dateString.split('T')[0].split('-').slice(1, 3)
//     const dateArr = [split[1], split[0]]
//     return dateArr.join('/')
//   }

//   schedules.forEach((schedule) => {
//     scheduleCount++

//     const scheduleLi = document.createElement('li')
//     scheduleLi.classList.add('mdc-list-item', 'schedule--list')

//     const scheduleName = document.createElement('span')
//     scheduleName.classList.add('schedule-name--list')
//     scheduleName.innerHTML = schedule.name

//     const scheduleStartTime = document.createElement('div')
//     scheduleStartTime.classList.add('mdc-text-field', 'startTimeInputs')
//     scheduleStartTime.id = `schedule-start--list${scheduleCount}`

//     const scheduleStartTimeInput = document.createElement('input')
//     scheduleStartTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
//     scheduleStartTimeInput.disabled = true
//     scheduleStartTimeInput.value = getMonthDate(schedule.startTime)
//     scheduleStartTime.appendChild(scheduleStartTimeInput)

//     const scheduleEndTime = document.createElement('div')
//     scheduleEndTime.classList.add('mdc-text-field', 'endTimeInputs')
//     scheduleEndTime.id = `schedule-end--list${scheduleCount}`

//     const scheduleEndTimeInput = document.createElement('input')
//     scheduleEndTimeInput.disabled = true
//     scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
//     scheduleEndTimeInput.value = getMonthDate(schedule.endTime)
//     scheduleEndTime.appendChild(scheduleEndTimeInput)

//     const scheduleEditIconSpan = document.createElement('span')
//     scheduleEditIconSpan.id = `schedule-edit--icon${scheduleCount}`
//     scheduleEditIconSpan.classList.add('activity--edit-icon')

//     scheduleLi.appendChild(scheduleName)
//     scheduleLi.appendChild(scheduleStartTime)
//     scheduleLi.appendChild(scheduleEndTime)
//     scheduleLi.appendChild(scheduleEditIconSpan)

//     document.querySelector('#schedule--list').appendChild(scheduleLi)

//     if (!canEdit) return
//   })
// }

// function showVenue (venues, canEdit) {
//   let venueCount = 0

//   removeDom('venue--list')

//   venues.forEach((venue) => {
//     if (venue.geopoint) {
//       venueCount++

//       const venueLi = document.createElement('li')
//       const venueDesc = document.createElement('div')
//       venueDesc.appendChild(document.createTextNode(venue.venueDescriptor))
//       venueLi.appendChild(venueDesc)

//       const venueLocation = document.createElement('div')
//       venueLocation.classList.add('mdc-text-field', 'venue-location--name', `venue-location${venueCount}`)
//       const venueLocationInput = document.createElement('input')
//       venueLocationInput.classList.add('mdc-text-field__input', 'border-bottom--none')
//       venueLocationInput.value = venue.location
//       venueLocation.appendChild(venueLocationInput)

//       const venueEditableIcons = document.createElement('div')
//       const venueMapIcon = document.createElement('i')
//       venueMapIcon.classList.add('material-icons')
//       venueMapIcon.textContent = 'location_on'

//       const venueEditIconCont = document.createElement('span')
//       venueEditIconCont.classList.add(venueCount, 'activity--edit-icon')
//       venueEditIconCont.id = `venue--edit-cont${venueCount}`

//       venueEditableIcons.appendChild(venueMapIcon)
//       venueEditableIcons.appendChild(venueEditIconCont)

//       const venueAddress = document.createElement('div')
//       venueAddress.classList.add('mdc-text-field', 'venue-address--name', `venue-address${venueCount}`)
//       const venueAddressInput = document.createElement('input')
//       venueAddressInput.classList.add('mdc-text-field__input', 'border-bottom--none')
//       venueAddressInput.value = venue.address
//       venueAddress.appendChild(venueAddressInput)

//       venueLi.appendChild(venueDesc)
//       venueLi.appendChild(venueLocation)
//       venueLi.appendChild(venueEditableIcons)
//       venueLi.appendChild(venueAddress)

//       document.querySelector('#venue--list').appendChild(venueLi)
//       const venueLocationTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.venue-location${venueCount}`))
//       const venueAddressTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.venue-address${venueCount}`))
//       if (!canEdit) return

//       // renderFieldIcons(`venue--edit-cont${venueCount}`, `edit-venue${venueCount}`, [venueLocationTextField, venueAddressTextField, ]);
//     }
//   })
// }

// function renderAssigneeList (db, record, target) {
//   const usersStore = db
//     .transaction('users')
//     .objectStore('users')

//   removeDom(target)

//   record.assignees.forEach((mobileNumber) => {
//     console.log(record)
//     usersStore.openCursor(mobileNumber).onsuccess = function (e) {
//       const cursor = e.target.result
//       console.log(cursor)
//       assigneeListUI(cursor, target)
//       if (record.canEdit) {
//         renderRemoveIcons(record, cursor.primaryKey)
//       }
//     }
//   })
// }

// function assigneeListUI (userRecord, target) {
//   const div = document.createElement('div')
//   console.log(userRecord)
//   div.style.position = 'relative'
//   if (target === 'assignee--list') {
//     div.dataset.user = userRecord.primaryKey
//   } else {
//     div.dataset.contact = userRecord.primaryKey
//   }

//   const assigneeLi = document.createElement('li')

//   assigneeLi.classList.add('mdc-list-item', 'assignee-li')

//   const photoGraphic = document.createElement('img')
//   photoGraphic.classList.add('mdc-list-item__graphic')

//   if (!userRecord.value.photoURL) {
//     photoGraphic.src = './img/empty-user.jpg'
//   } else {
//     photoGraphic.src = userRecord.value.photoURL
//   }

//   const assigneeListText = document.createElement('span')
//   assigneeListText.classList.add('mdc-list-item__text')
//   assigneeListText.textContent = userRecord.value.displayName

//   const assigneeListTextSecondary = document.createElement('span')
//   assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text')
//   assigneeListTextSecondary.textContent = userRecord.value.mobile
//   assigneeListText.appendChild(assigneeListTextSecondary)

//   assigneeLi.appendChild(photoGraphic)
//   assigneeLi.appendChild(assigneeListText)
//   div.appendChild(assigneeLi)
//   document.getElementById(target).appendChild(div)
// }

// function renderRemoveIcons (record, mobileNumber) {
//   console.log('run')
//   const removeIcon = document.createElement('span')
//   removeIcon.classList.add('mdc-list-item__meta', 'material-icons')
//   removeIcon.textContent = 'cancel'

//   removeIcon.classList.add('remove')
//   const activityId = record.activityId

//   removeIcon.onclick = function (e) {
//     const phoneNumber = e.target.parentNode.dataset.user

//     const reqBody = {
//       'activityId': activityId,
//       'remove': [phoneNumber]
//     }
//     console.log(reqBody)
//     requestCreator('removeAssignee', reqBody)
//   }
//   if (mobileNumber !== firebase.auth().currentUser.phoneNumber) {
//     document.querySelector(`[data-user="${mobileNumber}"]`).appendChild(removeIcon)
//   }
// }

// function renderShareIcon (record) {
//   if (!record.canEdit) return

//   const IconParent = document.createElement('span')
//   IconParent.classList.add('add--assignee-icon')
//   const icon = document.createElement('i')
//   icon.classList.add('material-icons')
//   icon.id = 'share-btn'
//   icon.textContent = 'add'
//   IconParent.appendChild(icon)

//   document.getElementById('share--icon-container').innerHTML = IconParent.outerHTML

//   document.getElementById('share-btn').onclick = function (e) {
//     renderShareDrawer(record)
//   }
// }

// function renderShareDrawer (record) {
//   console.log(record)
//   const user = firebase.auth().currentUser
//   const req = window.indexedDB.open(user.uid)
//   req.onsuccess = function () {
//     const db = req.result
//     const rootTx = db.transaction(['root'], 'readwrite')
//     const rootObjectStore = rootTx.objectStore('root')
//     rootObjectStore.get(user.uid).onsuccess = function (event) {
//       const rootRecord = event.target.result
//       rootRecord.view = 'share'
//       rootObjectStore.put(rootRecord)
//       rootTx.oncomplete = fetchUsersData(record)
//     }
//   }
// }

// function fetchUsersData (record) {
//   removeDom('contacts--container')

//   const dbName = firebase.auth().currentUser.uid
//   const req = window.indexedDB.open(dbName)
//   req.onsuccess = function () {
//     const db = req.result

//     const mdcShareDrawer = mdc
//       .drawer
//       .MDCTemporaryDrawer
//       .attachTo(document.getElementById('share-drawer'))

//     mdcShareDrawer.open = true

//     document.getElementById('back-share').addEventListener('click', function () {
//       loadDefaultView(db, mdcShareDrawer)
//     })

//     const userCountIndex = db
//       .transaction('users')
//       .objectStore('users').index('count')

//     inputSelect(userCountIndex, 'contacts', 'contact--text-field', record)
//   }
// }

// function updateSelectorObjectStore (dataset, input, objectStoreName) {
//   console.log(dataset)
//   const dbName = firebase.auth().currentUser.uid

//   const inputValue = getInputText(input).value
//   console.log(inputValue)
//   const req = indexedDB.open(dbName)

//   return new Promise(function (resolve, reject) {
//     req.onsuccess = function () {
//       const db = req.result
//       const storeTx = db.transaction([objectStoreName], 'readwrite')

//       const objectStore = storeTx.objectStore(objectStoreName)

//       objectStore.get(inputValue).onsuccess = function (event) {
//         const record = event.target.result
//         if (!record) {
//           resolve({value: inputValue, activityId: dataset.id})
//           return
//         }
//         record.count = record.count + 1
//         objectStore.put(record)
//       }
//       storeTx.oncomplete = function () {
//         resolve({value: inputValue, activityId: dataset.id})
//       }
//       storeTx.onerror = function (event) {
//         reject(event.error)
//       }
//     }
//   })
// }

// function errorUpdatingSelectorObjectStore (error) {
//   console.log(error)
// }
// function addContact (data) {
//   const expression = /^\+[1-9]\d{5,14}$/
//   if (!expression.test(data.value)) return

//   const reqBody = {
//     'activityId': data.activityId,
//     'share': [data.value]
//   }
//   requestCreator('share', reqBody)
// }

// function dataElement (key) {
//   return document.querySelector(`[data-contact="${key}"]`)
// }
