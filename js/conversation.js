function conversation (id) {
  if (!id) return
  removeDom('chat-container')

  const currentUser = firebase.auth().currentUser

  const req = window.indexedDB.open(currentUser.uid)
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
      commentInfo.appendChild(document.createTextNode(cursor.value.timestamp.split('T')[1].split('.')[0]))

      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))

      commentInfo.appendChild(mapIcon)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)

      commentBox.appendChild(textContainer)
      document.getElementById('chat-container').appendChild(commentBox)
      cursor.continue()
    }

    document.getElementById('send-chat--input').addEventListener('click', function () {
      fetchCurrentLocation().then(function (geopoints) {
        const reqBody = {
          'activityId': id,
          'comment': getInputText('write--comment').value,
          'timestamp': fetchCurrentTime(),
          'geopoint': geopoints
        }

        requestCreator('comment', reqBody)
      })
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
    renderAssigneeList(db, record, 'assignee--list', 'activity-detail')
    renderShareIcon(record)
  }
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
  fetchCurrentLocation().then(function (geopoints) {
    const reqBody = {
      'activityId': id,
      'status': status,
      'timestamp': fetchCurrentTime(),
      'geopoint': geopoints
    }

    requestCreator('statusChange', reqBody)
  })
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
    scheduleLi.classList.add('mdc-list-item')

    const scheduleName = document.createElement('span')
    scheduleName.classList.add('schedule-name--list')
    scheduleName.innerHTML = schedule.name

    const scheduleStartTime = document.createElement('div')
    scheduleStartTime.classList.add('mdc-text-field', `schedule-start--list${scheduleCount}`)

    const scheduleStartTimeInput = document.createElement('input')
    scheduleStartTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
    scheduleStartTimeInput.disabled = true
    scheduleStartTimeInput.value = getMonthDate(schedule.startTime)
    scheduleStartTime.appendChild(scheduleStartTimeInput)

    const scheduleEndTime = document.createElement('div')
    scheduleEndTime.classList.add('mdc-text-field', `schedule-end--list${scheduleCount}`)

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

    const scheduleStartTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.schedule-start--list${scheduleCount}`))

    const scheduleEndTextField = mdc.textField.MDCTextField.attachTo(document.querySelector(`.schedule-end--list${scheduleCount}`))

    if (!canEdit) return

    // renderFieldIcons(
    //     `schedule-edit--icon${scheduleCount}`,
    //     `edit-schedule${scheduleCount}`, [
    //         scheduleStartTextField,
    //         scheduleEndTextField,
    //     ]
    // );
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
        assigneeListUI(userRecord, record, target, type)
      }
  })
}

function assigneeListUI (userRecord, record, target, type) {
  const assigneeLi = document.createElement('li')

  assigneeLi.dataset.num = userRecord.mobile
  assigneeLi.dataset.id = record.activityId
  assigneeLi.classList.add('mdc-list-item', 'assignee-li')
  if (type === 'share' && record.canEdit) {
    assigneeLi.setAttribute('onclick', 'displaySelectedContact(this.dataset)')
  }
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

  const removeIcon = document.createElement('span')
  removeIcon.classList.add('mdc-list-item__meta', 'material-icons')
  removeIcon.textContent = 'cancel'

  removeIcon.onclick = function (e) {
    const phoneNumber = e.target.parentElement.dataset.num
    fetchCurrentLocation().then(function (geopoints) {
      const reqBody = {
        'activityId': record.activityId,
        'timestamp': fetchCurrentTime(),
        'geopoint': geopoints,
        'remove': [phoneNumber]
      }
      requestCreator('removeAssignee', reqBody)
    })
  }

  assigneeLi.appendChild(photoGraphic)
  assigneeLi.appendChild(assigneeListText)

  if (type === 'activity-detail' && record.canEdit) {
    assigneeLi.appendChild(removeIcon)
  }

  console.log(document.querySelector(`#${target}`))

  document.querySelector(`#${target}`).appendChild(assigneeLi)
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

  const parentDiv = document.querySelector('.activity--share-container .detail--static-text').parentNode
  parentDiv.insertBefore(IconParent, document.querySelector('.activity--share-container .detail--static-text'))

  document.getElementById('share-btn').onclick = function (e) {
    renderShareDrawer(record)
  }
}

function renderShareDrawer (record) {
  const user = firebase.auth().currentUser
  const req = window.indexedDB.open(user.uid)
  req.onsuccess = function () {
    const db = req.result

    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')
    rootObjectStore.get(user.uid).onsuccess = function (event) {
      const rootRecord = event.target.result
      rootRecord.view = 'share'
      rootObjectStore.put(rootRecord)
    }

    const mdcShareDrawer = mdc
      .drawer
      .MDCTemporaryDrawer
      .attachTo(document.getElementById('share-drawer'))

    mdcShareDrawer.open = true

    const userObjectStore = db
      .transaction('users')
      .objectStore('users')

    userObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return

      assigneeListUI(cursor.value, record, 'contacts--container', 'share')
      cursor.continue()
    }
  }

  getInputText('contact--text-field')['input_'].onkeyup = function (keychange) {
    removeDom('contacts--container')

    const boundKeyRange = IDBKeyRange
      .bound(
        keychange.target.value,
        `${keychange.target.value}\uffff`
      )
    const dbName = firebase.auth().currentUser.uid
    const request = window.indexedDB.open(dbName)
    request.onsuccess = function () {
      const db = request.result
      console.log(db)
      const userObjectStore = db
        .transaction('users')
        .objectStore('users')

      userObjectStore.openCursor(boundKeyRange).onsuccess = function (cursorEvent) {
        const cursor = cursorEvent.target.result
        console.log(cursor)

        if (!cursor) { return }

        assigneeListUI(cursor.value, record, 'contacts--container', 'share')

        cursor.continue()
      }
    }
  }

  // initDrawer.close('.share--drawer', '.back-share')
}
function displaySelectedContact (dataset) {
  getInputText('contact--text-field').value = dataset.num

  document.querySelector('#add-contact').onclick = function (e) {
    fetchCurrentLocation().then(function (geopoints) {
      const reqBody = {
        activityId: dataset.id,
        timestamp: fetchCurrentTime(),
        share: [getInputText('contact--text-field').value],
        geopoint: geopoints
      }
      requestCreator('share', reqBody)
    })
  }
}
