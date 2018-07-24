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
  if (document.getElementById('chat-container')) {
    return
  }

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
  console.log(addendum)
  if (document.getElementById(addendum.addendumId)) {
    return
  }
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

    document.querySelector('.comment-header-primary').addEventListener('click', function () {
      fillActivityDetailPage(id)
    })
  }
}

function fillActivityDetailPage (id) {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const rootTx = db.transaction(['root'], 'readwrite')

    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result
      record.id = id
      record.view = 'detail'
      rootObjectStore.put(record)
    }

    rootTx.oncomplete = function () {
      const req = window.indexedDB.open(dbName)

      req.onsuccess = function () {
        const db = req.result
        const activityObjectStore = db.transaction('activity').objectStore('activity')
        const mapObjectStore = db.transaction('map').objectStore('map').index('location')

        activityObjectStore.get(id).onsuccess = function (event) {
          const record = event.target.result
          console.log(record)
          createActivityDetailHeader(record)
          document.getElementById('back-detail').addEventListener('click', function () {
            conversation(id)
          })
          createActivityPanel(db, id, record)

          getInputText('activity--title-input').value = record.title
          getInputText('activity--desc-input').value = record.description
          fetchAssigneeData(db, record, 'assignee--list')
        }
      }
    }
  }
}

function createActivityDetailHeader (record) {
  const leftDiv = document.createElement('div')

  const backSpan = document.createElement('span')
  backSpan.className = 'back-icon'
  backSpan.id = 'back-detail'

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'

  backSpan.appendChild(backIcon)
  leftDiv.appendChild(backSpan)

  if (!record.canEdit) {
    header(leftDiv.outerHTML)
    return
  }

  const rigthDiv = document.createElement('div')

  const cancel = document.createElement('button')
  cancel.className = 'mdc-button'
  cancel.id = 'cancel-update'
  cancel.dataset.id = record.activityId
  cancel.textContent = 'cancel'
  cancel.style.color = 'white'
  cancel.style.display = 'none'
  rigthDiv.appendChild(cancel)

  const edit = document.createElement('button')
  edit.className = 'mdc-button'
  edit.id = 'edit-activity'
  edit.dataset.id = record.activityId
  edit.textContent = 'edit'
  edit.style.color = 'white'

  rigthDiv.appendChild(edit)
  header(leftDiv.outerHTML, rigthDiv.outerHTML)
}

function createActivityPanel (db, id, record) {
  const detail = document.createElement('div')
  detail.className = 'mdc-top-app-bar--fixed-adjust'
  detail.innerHTML = activityTitle(record.title) + activityDesc(record.description) + office(record.office) + template(record.template) + availableStatus(record, id) + showSchedule(record.schedule) + showVenue(record.venue) + renderAssigneeList(db, record, 'assignee--list') + renderShareIcon(record)

  document.getElementById('app-current-panel').innerHTML = detail.outerHTML

  if (document.getElementById('select-pending')) {
    document.getElementById('select-pending').addEventListener('click', function () {
      updateStatus('PENDING', record.activityId)
    })
  }
  if (document.getElementById('select-confirmed')) {
    document.getElementById('select-confirmed').addEventListener('click', function () {
      updateStatus('CONFIRMED', record.activityId)
    })
  }
  if (document.getElementById('select-cancelled')) {
    document.getElementById('select-cancelled').addEventListener('click', function () {
      updateStatus('CANCELLED', record.activityId)
    })
  }

  if (!record.canEdit) return
  document.getElementById('edit-activity').addEventListener('click', function () {
    makeFieldsEditable(record)
  })
}

function activityTitle () {
  const container = document.createElement('div')
  container.className = 'activity--title-container'
  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Title'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--title-input'

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input border-bottom--none'
  input.disabled = true
  input.type = 'text'

  textField.appendChild(input)
  container.appendChild(span)
  container.appendChild(textField)
  return container.outerHTML
}

function activityDesc () {
  const container = document.createElement('div')
  container.className = 'activity--desc-container'
  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Description'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--desc-input'

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input border-bottom--none'
  input.disabled = true
  input.type = 'text'

  container.appendChild(span)
  textField.appendChild(input)
  container.appendChild(textField)

  return container.outerHTML
}

function office (office) {
  const officeCont = document.createElement('div')
  officeCont.className = 'activity--office-container'
  const span = document.createElement('span')
  span.textContent = 'Office'
  span.className = 'detail--static-text'
  const p = document.createElement('p')
  p.className = 'activity--office'
  p.textContent = office
  officeCont.appendChild(span)
  officeCont.appendChild(p)
  return officeCont.outerHTML
}

function template (template) {
  const templateCont = document.createElement('div')
  templateCont.className = 'activity--template-container'
  const span = document.createElement('span')
  span.textContent = 'Template'
  span.className = 'detail--static-text'

  const p = document.createElement('p')
  p.className = 'activity--template'
  p.textContent = template
  templateCont.appendChild(span)
  templateCont.appendChild(p)
  return templateCont.outerHTML
}

function makeFieldsEditable (record) {
  document.getElementById('edit-activity').remove()
  document.getElementById('cancel-update').style.display = 'block'

  document.getElementById('activity--status-container').style.display = 'none'
  document.querySelector('.activity--share-container').style.display = 'none'
  document.querySelector('.add--assignee-icon').style.dispaly = 'none'

  const updatebtn = document.createElement('btn')
  updatebtn.id = 'update-activity'
  updatebtn.className = 'mdc-button'
  updatebtn.textContent = 'update'
  updatebtn.dataset.id = record.activityId
  updatebtn.style.color = 'white'

  document.getElementById('action-data').appendChild(updatebtn)

  getInputText('activity--title-input')['input_'].disabled = false
  getInputText('activity--desc-input')['input_'].disabled = false
  const startSchedule = document.querySelectorAll('.startTimeInputs')
  const endSchedules = document.querySelectorAll('.endTimeInputs')
  const venueLocations = document.querySelectorAll('.venue-location--input')

  const venueFields = document.querySelectorAll('.map-select');

  [...startSchedule].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].disabled = false
    }
  });

  [...endSchedules].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].disabled = false
    }
  });

  [...venueLocations].forEach(function (input) {
    input.disabled = false
  });

  [...venueFields].forEach(function (field) {
    const locationsearch = document.createElement('ul')
    locationsearch.id = 'location--search'
    locationsearch.className = 'mdc-list'

    document.querySelector('#venue--list').children[0].appendChild(locationsearch)

    field.children[0].addEventListener('click', function () {
      if (this.dataset.active) return

      this.dataset.active = true
      inputSelectMap({
        name: 'map',
        indexone: 'location',
        indextwo: 'address'
      }, 'location--search', {
        location: this.id,
        address: field.children[1].id
      }, record)
    })
  })

  document.getElementById('cancel-update').addEventListener('click', function () {
    cancelUpdate(record.activityId)
  })

  document.getElementById('update-activity').addEventListener('click', createUpdateReqBody)
}

function cancelUpdate (id) {
  fillActivityDetailPage(id)
}

function availableStatus (record, id) {
  const statusCont = document.createElement('div')
  statusCont.id = 'activity--status-container'

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
  pendingIcon.appendChild(document.createTextNode('undo'))
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

function updateStatus (status, id) {
  const reqBody = {
    'activityId': id,
    'status': status
  }

  requestCreator('statusChange', reqBody)
}

function showSchedule (schedules) {
  const scheduleCont = document.createElement('div')
  scheduleCont.className = 'activity--schedule-container'
  const spanDiv = document.createElement('div')
  spanDiv.className = 'schedule--text'

  const spanCont = document.createElement('span')
  spanCont.className = 'detail--static-text detail--static-text-schedule'
  spanCont.textContent = 'Schedule'

  const startTimeSpan = document.createElement('span')
  startTimeSpan.className = 'detail--static-text-startTime'
  startTimeSpan.textContent = 'from'

  const endTimeSpan = document.createElement('span')
  endTimeSpan.className = 'detail--static-text-endTime'
  endTimeSpan.textContent = 'to'

  const scheduleList = document.createElement('ul')
  scheduleList.className = 'mdc-list'
  scheduleList.id = 'schedule--list'

  spanDiv.appendChild(spanCont)
  spanDiv.appendChild(endTimeSpan)
  spanDiv.appendChild(startTimeSpan)

  scheduleCont.appendChild(spanDiv)

  function getMonthDate (dateString) {
    const split = dateString.split('T')[0].split('-').slice(1, 3)
    const dateArr = [split[1], split[0]]
    return dateArr.join('/')
  }
  let count = 0
  schedules.forEach((schedule) => {
    count++
    const scheduleLi = document.createElement('li')
    scheduleLi.classList.add('mdc-list-item', 'schedule--list')

    const scheduleName = document.createElement('span')
    scheduleName.classList.add('schedule-name--list')
    scheduleName.dataset.value = schedule.name
    scheduleName.innerHTML = schedule.name

    const scheduleStartTime = document.createElement('div')
    scheduleStartTime.classList.add('mdc-text-field', 'startTimeInputs')
    scheduleStartTime.id = `schedule-start--list${count}`

    const scheduleStartTimeInput = document.createElement('input')
    scheduleStartTimeInput.type = 'date'
    scheduleStartTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
    scheduleStartTimeInput.disabled = true
    scheduleStartTimeInput.setAttribute('value', getMonthDate(schedule.startTime))
    // scheduleStartTimeInput.value = getMonthDate(schedule.startTime)
    scheduleStartTime.appendChild(scheduleStartTimeInput)

    const scheduleEndTime = document.createElement('div')
    scheduleEndTime.classList.add('mdc-text-field', 'endTimeInputs')
    scheduleEndTime.id = `schedule-end--list${count}`

    const scheduleEndTimeInput = document.createElement('input')
    scheduleEndTimeInput.type = 'date'
    scheduleEndTimeInput.disabled = true
    scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
    scheduleEndTimeInput.setAttribute('value', getMonthDate(schedule.endTime))
    scheduleEndTime.appendChild(scheduleEndTimeInput)

    const scheduleEditIconSpan = document.createElement('span')
    scheduleEditIconSpan.id = `schedule-edit--icon$`
    scheduleEditIconSpan.classList.add('activity--edit-icon')

    scheduleLi.appendChild(scheduleName)
    scheduleLi.appendChild(scheduleStartTime)
    scheduleLi.appendChild(scheduleEndTime)
    scheduleLi.appendChild(scheduleEditIconSpan)

    scheduleList.appendChild(scheduleLi)
  })
  scheduleCont.appendChild(scheduleList)
  return scheduleCont.outerHTML
}

function showVenue (venues, canEdit) {
  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container'

  const div = document.createElement('div')

  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Venue'
  const venueList = document.createElement('ul')
  venueList.className = 'mdc-list'
  venueList.id = 'venue--list'

  venueCont.appendChild(span)
  var count = 0
  venues.forEach((venue) => {
    if (venue.geopoint) {
      count++

      const venueLi = document.createElement('li')

      venueLi.className = 'mdc-list-item map-select'
      venueLi.dataset.location = venue.location
      venueLi.dataset.address = venue.address
      venueLi.dataset.inputlat = venue.geopoint['_latitude']
      venueLi.dataset.inputlon = venue.geopoint['_longitude']
      venueLi.dataset.descrip = venue.venueDescriptor

      const venueDesc = document.createElement('div')

      venueDesc.id = `venue-desc${count}`
      venueDesc.dataset.descriptor = venue.venueDescriptor
      venueDesc.textContent = venue.venueDescriptor

      const venueLocation = document.createElement('div')
      venueLocation.classList.add('mdc-text-field', 'venue-location--name')
      venueLocation.id = `venue-location${count}`
      const venueLocationInput = document.createElement('input')
      venueLocationInput.classList.add('mdc-text-field__input', 'border-bottom--none', 'venue-location--input')
      venueLocationInput.setAttribute('value', venue.location)

      venueLocationInput.disabled = true
      venueLocation.appendChild(venueLocationInput)

      const venueAddress = document.createElement('div')
      venueAddress.classList.add('mdc-text-field', 'venue-address--name')
      venueAddress.id = 'venue-address' + count
      const venueAddressInput = document.createElement('input')
      venueAddressInput.classList.add('mdc-text-field__input', 'border-bottom--none')
      venueAddressInput.setAttribute('value', venue.address)
      venueAddressInput.disabled = true

      venueAddress.appendChild(venueAddressInput)

      venueLi.appendChild(venueLocation)
      venueLi.appendChild(venueAddress)
      venueLi.appendChild(venueDesc)

      div.appendChild(venueLi)
      venueList.appendChild(div)
    }
  })

  venueCont.appendChild(venueList)
  return venueCont.outerHTML
}

function renderAssigneeList () {
  const shareCont = document.createElement('div')
  shareCont.className = 'activity--share-container'
  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Assignees'

  const shareIcon = document.createElement('div')
  shareIcon.id = 'share--icon-container'
  const assigneeList = document.createElement('ul')
  assigneeList.id = 'assignee--list'
  assigneeList.className = 'mdc-list mdc-list--two-line mdc-list--avatar-list'

  shareCont.appendChild(span)
  shareCont.appendChild(shareIcon)
  shareCont.appendChild(assigneeList)

  return shareCont.outerHTML
}

function fetchAssigneeData (db, record, target) {
  const usersStore = db
    .transaction('users')
    .objectStore('users')
  record.assignees.forEach((mobileNumber) => {
    console.log(record)
    usersStore.openCursor(mobileNumber).onsuccess = function (e) {
      const cursor = e.target.result
      console.log(cursor)
      assigneeListUI(cursor, target)
      if (record.canEdit) {
        renderRemoveIcons(record, cursor.primaryKey)
      }
    }
  })
}

function assigneeListUI (userRecord, target) {
  const div = document.createElement('div')
  console.log(userRecord)
  div.style.position = 'relative'
  if (target === 'assignee--list') {
    div.dataset.user = userRecord.primaryKey
  } else {
    div.dataset.contact = userRecord.primaryKey
  }

  const assigneeLi = document.createElement('li')

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
  div.appendChild(assigneeLi)
  document.getElementById(target).appendChild(div)
}

function locationUI (userRecord, target, inputFields) {
  if (document.querySelector(`[data-location="${userRecord.value.location}"]`)) return

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
  document.getElementById(target).innerHTML += div.outerHTML

  document.getElementById(userRecord.value.location.replace(/\s/g, '')).addEventListener('click', function () {
    getInputText(inputFields.location).value = this.dataset.location
    getInputText(inputFields.address).value = this.dataset.address
    this.parentNode.previousSibling.dataset.location = this.dataset.location
    this.parentNode.previousSibling.dataset.address = this.dataset.address
    this.parentNode.previousSibling.dataset.inputlat = this.dataset.lat
    this.parentNode.previousSibling.dataset.inputlon = this.dataset.lon
    this.parentNode.previousSibling.dataset.descrip = this.dataset.desc
  })
}

function renderRemoveIcons (record, mobileNumber) {
  console.log('run')
  const removeIcon = document.createElement('span')
  removeIcon.classList.add('mdc-list-item__meta', 'material-icons')
  removeIcon.textContent = 'cancel'

  removeIcon.classList.add('remove')
  const activityId = record.activityId

  removeIcon.onclick = function (e) {
    const phoneNumber = e.target.parentNode.dataset.user

    const reqBody = {
      'activityId': activityId,
      'remove': [phoneNumber]
    }
    console.log(reqBody)
    requestCreator('removeAssignee', reqBody)
  }
  if (mobileNumber !== firebase.auth().currentUser.phoneNumber) {
    document.querySelector(`[data-user="${mobileNumber}"]`).appendChild(removeIcon)
  }
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

  // document.getElementById('share--icon-container').innerHTML = IconParent.outerHTML

  icon.onclick = function (e) {
    renderShareDrawer(record)
  }
  return IconParent.outerHTML
}

function renderShareDrawer (record) {
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

    document.getElementById('back-share').addEventListener('click', function () {
      fillActivityDetailPage(db, id)
    })

    const userCountIndex = db
      .transaction('users')
      .objectStore('users').index('count')

      // inputSelect(userCountIndex, 'contacts', 'contact--text-field', record)
  }
}

function createUpdateReqBody (event) {
  const title = getInputText('activity--title-input').value
  const desc = getInputText('activity--desc-input').value
  const activityId = event.target.dataset.id
  const schedule = []
  const venue = []

  const allSchedule = document.querySelectorAll('.schedule--list');
  [...allSchedule].forEach(function (li) {
    const scheduleBody = {}

    scheduleBody.name = li.children[0].dataset.value
    scheduleBody.startTime = getInputText(li.children[1].id).value
    scheduleBody.endTime = getInputText(li.children[2].id).value
    schedule.push(scheduleBody)
  })

  const allVenues = document.querySelectorAll('.map-select');
  [...allVenues].forEach(function (li) {
    geopoint = {}
    const venueBody = {}

    venueBody.venueDescriptor = li.dataset.descrip
    venueBody.location = li.dataset.location
    venueBody.address = li.dataset.address
    geopoint.latitude = parseInt(li.dataset.inputlat)
    geopoint.longitude = parseInt(li.dataset.inputlon)
    venueBody['geopoint'] = geopoint
    venue.push(venueBody)
  })
  const body = {
    'activityId': activityId,
    'title': title,
    'description': desc,
    'schedule': schedule,
    'venue': venue
  }
  console.log(body)
  requestCreator('update', body)
}

function updateSelectorObjectStore (dataset, input, objectStoreName) {
  console.log(dataset)
  const dbName = firebase.auth().currentUser.uid

  const inputValue = getInputText(input).value
  console.log(inputValue)
  const req = indexedDB.open(dbName)

  return new Promise(function (resolve, reject) {
    req.onsuccess = function () {
      const db = req.result
      const storeTx = db.transaction([objectStoreName], 'readwrite')

      const objectStore = storeTx.objectStore(objectStoreName)

      objectStore.get(inputValue).onsuccess = function (event) {
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
      storeTx.oncomplete = function () {
        resolve({
          value: inputValue,
          activityId: dataset.id
        })
      }
      storeTx.onerror = function (event) {
        reject(event.error)
      }
    }
  })
}

function errorUpdatingSelectorObjectStore (error) {
  console.log(error)
}

function addContact (data) {
  const expression = /^\+[1-9]\d{5,14}$/
  if (!expression.test(data.value)) return

  const reqBody = {
    'activityId': data.activityId,
    'share': [data.value]
  }
  requestCreator('share', reqBody)
}

function dataElement (key) {
  return document.querySelector(`[data-location="${key}"]`)
}
