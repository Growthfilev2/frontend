function conversation (id) {
  if (!id) return
  removeDom('chat-container')

  const currentUser = firebase.auth().currentUser

  const req = window.indexedDB.open(currentUser.uid)
  let mapToggle = false

  req.onsuccess = function () {
    const db = req.result
    const addendumIndex = db.transaction('addendum', 'readonly').objectStore('addendum').index('activityId')
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(currentUser.uid).onsuccess = function (event) {
      const record = event.target.result
      record.id = id
      rootObjectStore.put(record)
    }

    fillActivityDetailPage(db, id)

    addendumIndex.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      let commentBox = document.createElement('div')
      commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')
      currentUser.phoneNumber === cursor.value.user ? commentBox.classList.add('current-user--comment') : commentBox.classList.add('other-user--comment')

      let textContainer = document.createElement('div')
      textContainer.classList.add('talktext')

      let user = document.createElement('p')
      user.classList.add('user-name--comment')
      user.appendChild(document.createTextNode(cursor.value.user))

      let comment = document.createElement('p')
      comment.classList.add('comment')
      comment.appendChild(document.createTextNode(cursor.value.comment))

      let commentInfo = document.createElement('span')
      commentInfo.style.float = 'right'
      commentInfo.appendChild(document.createTextNode(new Date(cursor.value.timestamp).toLocaleTimeString()))

      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))
      mapIcon.onclick = function (iconEvent) {
        window.open(`https://www.google.co.in/maps/@${cursor.value.location['_latitude']},${cursor.value.location['_longitude']}`)
      }

      commentInfo.appendChild(mapIcon)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)

      commentBox.appendChild(textContainer)

      document.getElementById('chat-container').appendChild(commentBox)

      cursor.continue()
    }

    const btn = document.createElement('button')
    btn.classList.add('mdc-fab', 'mdc-fab--mini')
    btn.id = 'send-chat--input'

    const btnIcon = document.createElement('span')
    btnIcon.classList.add('mdc-fac__icon', 'material-icons')
    btnIcon.textContent = 'send'
    btn.innerHTML = btnIcon.outerHTML
    document.getElementById('button-cont').innerHTML = btn.outerHTML

    document.getElementById('send-chat--input').addEventListener('click', function () {
      const reqBody = {
        'activityId': id,
        'comment': getInputText('write--comment').value
      }

      requestCreator('comment', reqBody)
    })
  }
}

function fillActivityDetailPage (db, id) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  activityObjectStore.get(id).onsuccess = function (event) {
    const record = event.target.result
    console.log(record)
    getInputText('activity--title-input').value = record.title
    getInputText('activity--desc-input').value = record.description
    document.querySelector('.current-status').innerHTML = record.status

    availableStatus(record, id)

    document.querySelector('.activity--office').innerHTML = record.office
    document.querySelector('.activity--template').innerHTML = record.template

    showSchedule(record.schedule, record.canEdit)
    showVenue(record.venue, record.canEdit)
    renderAssigneeList(db, record, 'assignee--list', 'assigneeList')
    renderShareIcon(record)
  }
  document.getElementById('updateActivity').addEventListener('click', function () {
    makeFieldsEditable(id)
  })
}

function makeFieldsEditable (id) {
  getInputText('activity--title-input')['input_'].disabled = false
  getInputText('activity--desc-input')['input_'].disabled = false
  const schedules = document.querySelectorAll('.schedule--list');
  [...schedules].forEach(function (li) {
    console.log(li.children)
  })
}

function availableStatus (record, id) {
  document.querySelector('.current-status').classList.add(record.status)
  if (document.querySelector('.current-status').classList.length > 2) {
    const previousStatus = document.querySelector('.current-status').classList[1]
    document.querySelector('.current-status').classList.remove(previousStatus)
  }

  if (!record.canEdit) return
  removeDom('available-status')

  const pendingIcon = document.createElement('i')
  pendingIcon.classList.add('status-pending', 'material-icons')
  pendingIcon.appendChild(document.createTextNode('undo'))
  pendingIcon.id = 'select-pending'

  pendingIcon.onclick = function () {
    updateStatus(
      'PENDING',
      id
    )
  }

  const cancelIcon = document.createElement('i')
  cancelIcon.classList.add('status-cancel', 'material-icons')
  cancelIcon.appendChild(document.createTextNode('clear'))
  cancelIcon.id = 'select-cancel'
  cancelIcon.onclick = function () {
    updateStatus(
      'CANCELLED',
      id
    )
  }

  const confirmedIcon = document.createElement('i')
  confirmedIcon.classList.add('status-confirmed', 'material-icons')
  confirmedIcon.appendChild(document.createTextNode('check'))

  confirmedIcon.id = 'select-confirmed'
  confirmedIcon.onclick = function () {
    updateStatus(
      'CONFIRMED',
      id
    )
  }

  if (record.status === 'PENDING') {
    document.querySelector('#available-status').appendChild(
      cancelIcon
    )
    document.querySelector('#available-status').appendChild(
      confirmedIcon
    )
    return
  }
  if (record.status === 'CANCELLED') {
    document.querySelector('#available-status').appendChild(
      pendingIcon
    )
    document.querySelector('#available-status').appendChild(
      confirmedIcon
    )
    return
  }
  if (record.status === 'CONFIRMED') {
    document.querySelector('#available-status').appendChild(
      cancelIcon
    )
    document.querySelector('#available-status').appendChild(
      pendingIcon
    )
  }
}

function updateStatus (status, id) {
  const reqBody = {
    'activityId': id,
    'status': status
  }

  requestCreator('statusChange', reqBody)
}

function showSchedule (schedules, canEdit) {
  let scheduleCount = 0

  removeDom('schedule--list')

  function getMonthDate (dateString) {
    const split = dateString.split('T')[0].split('-').slice(1, 3)
    const dateArr = [split[1], split[0]]
    return dateArr.join('/')
  }

  schedules.forEach((schedule) => {
    scheduleCount++

    const scheduleLi = document.createElement('li')
    scheduleLi.classList.add('mdc-list-item', 'schedule--list')

    const scheduleName = document.createElement('span')
    scheduleName.classList.add('schedule-name--list')
    scheduleName.innerHTML = schedule.name

    const scheduleStartTime = document.createElement('div')
    scheduleStartTime.classList.add('mdc-text-field', 'startTimeInputs')
    scheduleStartTime.id = `schedule-start--list${scheduleCount}`

    const scheduleStartTimeInput = document.createElement('input')
    scheduleStartTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
    scheduleStartTimeInput.disabled = true
    scheduleStartTimeInput.value = getMonthDate(schedule.startTime)
    scheduleStartTime.appendChild(scheduleStartTimeInput)

    const scheduleEndTime = document.createElement('div')
    scheduleEndTime.classList.add('mdc-text-field', 'endTimeInputs')
    scheduleEndTime.id = `schedule-end--list${scheduleCount}`

    const scheduleEndTimeInput = document.createElement('input')
    scheduleEndTimeInput.disabled = true
    scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
    scheduleEndTimeInput.value = getMonthDate(schedule.endTime)
    scheduleEndTime.appendChild(scheduleEndTimeInput)

    const scheduleEditIconSpan = document.createElement('span')
    scheduleEditIconSpan.id = `schedule-edit--icon${scheduleCount}`
    scheduleEditIconSpan.classList.add('activity--edit-icon')

    scheduleLi.appendChild(scheduleName)
    scheduleLi.appendChild(scheduleStartTime)
    scheduleLi.appendChild(scheduleEndTime)
    scheduleLi.appendChild(scheduleEditIconSpan)

    document.querySelector('#schedule--list').appendChild(scheduleLi)

    if (!canEdit) return
  })
}

function showVenue (venues, canEdit) {
  let venueCount = 0

  removeDom('venue--list')

  venues.forEach((venue) => {
    if (venue.geopoint) {
      venueCount++

      const venueLi = document.createElement('li')
      const venueDesc = document.createElement('div')
      venueDesc.appendChild(document.createTextNode(venue.venueDescriptor))
      venueLi.appendChild(venueDesc)

      const venueLocation = document.createElement('div')
      venueLocation.classList.add('mdc-text-field', 'venue-location--name', `venue-location${venueCount}`)
      const venueLocationInput = document.createElement('input')
      venueLocationInput.classList.add('mdc-text-field__input', 'border-bottom--none')
      venueLocationInput.value = venue.location
      venueLocation.appendChild(venueLocationInput)

      const venueEditableIcons = document.createElement('div')
      const venueMapIcon = document.createElement('i')
      venueMapIcon.classList.add('material-icons')
      venueMapIcon.textContent = 'location_on'

      const venueEditIconCont = document.createElement('span')
      venueEditIconCont.classList.add(venueCount, 'activity--edit-icon')
      venueEditIconCont.id = `venue--edit-cont${venueCount}`

      venueEditableIcons.appendChild(venueMapIcon)
      venueEditableIcons.appendChild(venueEditIconCont)

      const venueAddress = document.createElement('div')
      venueAddress.classList.add('mdc-text-field', 'venue-address--name', `venue-address${venueCount}`)
      const venueAddressInput = document.createElement('input')
      venueAddressInput.classList.add('mdc-text-field__input', 'border-bottom--none')
      venueAddressInput.value = venue.address
      venueAddress.appendChild(venueAddressInput)

      venueLi.appendChild(venueDesc)
      venueLi.appendChild(venueLocation)
      venueLi.appendChild(venueEditableIcons)
      venueLi.appendChild(venueAddress)

      document.querySelector('#venue--list').appendChild(venueLi)
      const venueLocationTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.venue-location${venueCount}`))
      const venueAddressTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.venue-address${venueCount}`))
      if (!canEdit) return

      // renderFieldIcons(`venue--edit-cont${venueCount}`, `edit-venue${venueCount}`, [venueLocationTextField, venueAddressTextField, ]);
    }
  })
}

function renderAssigneeList (db, record, target, type) {
  const usersStore = db
    .transaction('users')
    .objectStore('users')

  removeDom(target)

  record.assignees.forEach((mobileNumber) => {
    console.log(mobileNumber)
    usersStore

      .get(mobileNumber)
      .onsuccess = function (e) {
        const userRecord = e.target.result
        assigneeListUI(userRecord, target, type)
        if (!record.canEdit) return
        renderRemoveIcons(record, userRecord.mobile, type)
      }
  })
}

function assigneeListUI (userRecord, target, type) {
  const div = document.createElement('div')
  div.id = `${type}${userRecord.mobile}`
  div.classList.add(type)
  div.style.position = 'relative'
  div.dataset.userId = userRecord.mobile
  const assigneeLi = document.createElement('li')
  assigneeLi.dataset.num = userRecord.mobile

  assigneeLi.classList.add('mdc-list-item', 'assignee-li')

  const photoGraphic = document.createElement('img')
  photoGraphic.classList.add('mdc-list-item__graphic')

  if (!userRecord.photoURL) {
    photoGraphic.classList.add('material-icons')
    photoGraphic.textContent = 'account_circle'
  }
  photoGraphic.src = userRecord.photoURL

  const assigneeListText = document.createElement('span')
  assigneeListText.classList.add('mdc-list-item__text')
  assigneeListText.textContent = userRecord.displayName

  const assigneeListTextSecondary = document.createElement('span')
  assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text')
  assigneeListTextSecondary.textContent = userRecord.mobile
  assigneeListText.appendChild(assigneeListTextSecondary)

  assigneeLi.appendChild(photoGraphic)
  assigneeLi.appendChild(assigneeListText)
  div.appendChild(assigneeLi)
  document.getElementById(target).appendChild(div)
}

function renderRemoveIcons (record, mobileNumber, type) {
  const removeIcon = document.createElement('span')
  removeIcon.classList.add('mdc-list-item__meta', 'material-icons')
  removeIcon.textContent = 'cancel'
  removeIcon.classList.add('remove')
  const activityId = record.activityId

  removeIcon.onclick = function (e) {
    const phoneNumber = e.target.parentNode.dataset.userId

    const reqBody = {
      'activityId': activityId,
      'remove': [phoneNumber]
    }
    console.log(reqBody)
    requestCreator('removeAssignee', reqBody)
  }

  document.getElementById(`${type}${mobileNumber}`).appendChild(removeIcon)
}

function renderShareIcon (record) {
  if (!record.canEdit) return

  const IconParent = document.createElement('span')
  IconParent.classList.add('add--assignee-icon')
  const icon = document.createElement('i')
  icon.classList.add('material-icons')
  icon.id = 'share-btn'
  icon.textContent = 'add'
  IconParent.appendChild(icon)

  document.getElementById('share--icon-container').innerHTML = IconParent.outerHTML

  document.getElementById('share-btn').onclick = function (e) {
    renderShareDrawer(record)
  }
}

function renderShareDrawer (record) {
  removeDom('contacts--container')

  const user = firebase.auth().currentUser
  const req = window.indexedDB.open(user.uid)
  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(user.uid).onsuccess = function (event) {
      const rootRecord = event.target.result
      rootRecord.view = 'share'
      rootObjectStore.put(rootRecord)
      rootTx.oncomplete = fetchUsersData(record)
    }
  }
}

function fetchUsersData (record) {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result

    const mdcShareDrawer = mdc
      .drawer
      .MDCTemporaryDrawer
      .attachTo(document.getElementById('share-drawer'))

    mdcShareDrawer.open = true

    document.getElementById('back-share').addEventListener('click', function () {
      loadDefaultView(db, mdcShareDrawer)
    })

    const userCountIndex = db
      .transaction('users')
      .objectStore('users').index('count')

    document.getElementById('add-contact').dataset.id = record.activityId

    inputSelect(userCountIndex, null, 'share')
  }
}

function autosuggestContacts () {
  const boundKeyRange = IDBKeyRange
    .bound(
      getInputText('contact--text-field').value,
      `${getInputText('contact--text-field').value}\uffff`
    )

  const dbName = firebase.auth().currentUser.uid
  const request = window.indexedDB.open(dbName)

  request.onsuccess = function () {
    const db = request.result
    const userObjectStore = db
      .transaction('users')
      .objectStore('users')

    const contactEl = document.querySelectorAll('.share')
    contactEl.forEach(function (el) {
      el.style.display = 'none'
    })

    inputSelect(userObjectStore, boundKeyRange, 'share')
  }
}

function displaySelectedContact (number) {
  getInputText('contact--text-field').value = number
}

function updateContact (activityId) {
  const dbName = firebase.auth().currentUser.uid
  console.log(activityId)

  const inputValue = getInputText('contact--text-field').value
  console.log(inputValue)
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const usersTx = db.transaction(['users'], 'readwrite')
    const usersObjectStore = usersTx.objectStore('users')

    usersObjectStore.get(inputValue).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        addContact(inputValue, activityId)
      } else {
        record.count = record.count + 1
        usersObjectStore.put(record)
      }
    }
    usersTx.oncomplete = function () {
      addContact(inputValue, activityId)
    }
  }
}

function addContact (number, id) {
  const expression = /^\+[1-9]\d{5,14}$/
  if (!expression.test(number)) return

  const reqBody = {
    'activityId': id,
    'share': [number]
  }
  requestCreator('share', reqBody)
}
