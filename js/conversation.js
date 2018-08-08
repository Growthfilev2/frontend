function conversation (id) {
  if (!id) return
  // removeDom('chat-container')
  commentPanel(id)
  let commentDom = ''

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

    addendumIndex.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        console.log(commentDom)
        document.getElementById('chat-container').innerHTML = commentDom
        document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight
        return
      }

      commentDom += createComment(db, cursor.value, currentUser)
      cursor.continue()
    }
  }
}

function commentPanel (id) {
  if (document.getElementById('chat-container')) {
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

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + userCommentCont.outerHTML
  document.getElementById('send-chat--input').onclick = function () {
    const reqBody = {
      'activityId': id,
      'comment': getInputText('write--comment').value
    }

    requestCreator('comment', reqBody)
    getInputText('write--comment').value = ''
  }
}

function createComment (db, addendum, currentUser) {
  if (document.getElementById(addendum.addendumId)) {
    return document.getElementById(addendum.addendumId).outerHTML
  }

  let commentBox = document.createElement('div')

  commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left', 'mdc-theme--primary-bg')

  currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment') : commentBox.classList.add('other-user--comment')
  commentBox.id = addendum.addendumId

  let textContainer = document.createElement('div')
  textContainer.classList.add('talktext')

  let user = document.createElement('p')
  user.classList.add('user-name--comment')
  readNameFromNumber(db, addendum.user).then(function (nameOrNumber) {
    user.textContent = nameOrNumber
  }).catch(console.log)

  let comment = document.createElement('p')
  comment.classList.add('comment')
  comment.textContent = addendum.comment

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
  return commentBox.outerHTML
}

function readNameFromNumber (db, number) {
  return new Promise(function (resolve, reject) {
    const usersObjectStore = db.transaction('users').objectStore('users')
    usersObjectStore.get(number).onsuccess = function (event) {
      const record = event.target.result

      if (!record.displayName) resolve(number)

      resolve(record.displayName)
    }
    usersObjectStore.get(number).onerror = function (event) {
      reject(event)
    }
  })
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

    const primarySpan = document.createElement('div')
    primarySpan.className = 'mdc-list-item__text comment-header-primary mdc-theme--secondary'
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

    document.getElementById('back-conv').addEventListener('click', function () {
      reinitCount(db, id)
      listView()
    })

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

        activityObjectStore.get(id).onsuccess = function (event) {
          const record = event.target.result
          console.log(record)
          createActivityDetailHeader(record, 'edit')
          document.getElementById('back-detail').addEventListener('click', function () {
            conversation(id)
          })

          updateActivityPanel(db, record)
          fetchAssigneeData(db, record, 'assignee--list')
        }
      }
    }
  }
}

function createActivityDetailHeader (record, value) {
  const leftDiv = document.createElement('div')

  const backSpan = document.createElement('span')
  backSpan.className = 'back-icon'
  if (value === 'edit') {
    backSpan.id = 'back-detail'
  }
  if (value === 'create') {
    backSpan.id = 'back-list'
  }

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'
  backSpan.appendChild(backIcon)

  const cancel = document.createElement('i')
  cancel.className = 'material-icons'
  cancel.id = 'cancel-update'
  cancel.dataset.id = record.activityId
  cancel.textContent = 'clear'
  cancel.style.color = 'gray'
  cancel.style.display = 'none'

  leftDiv.appendChild(backSpan)
  leftDiv.appendChild(cancel)

  if (!record.canEdit) {
    header(leftDiv.outerHTML)
    return
  }

  const rigthDiv = document.createElement('div')

  const toggleBtnName = document.createElement('button')
  toggleBtnName.className = 'mdc-icon-button material-icons'
  toggleBtnName.id = `${value}-activity`
  toggleBtnName.dataset.id = record.activityId

  toggleBtnName.setAttribute('aria-hidden', 'true')
  toggleBtnName.setAttribute('aria-pressed', 'false')

  if (value === 'edit') {
    toggleBtnName.setAttribute('data-toggle-on-content', 'check')
    toggleBtnName.setAttribute('data-toggle-on-label', 'check')
    toggleBtnName.setAttribute('data-toggle-off-content', 'edit')
    toggleBtnName.setAttribute('data-toggle-off-label', 'editActivity')

    toggleBtnName.textContent = 'edit'
  }
  if (value === 'create') {
    toggleBtnName.setAttribute('data-toggle-on-content', 'check')
    toggleBtnName.setAttribute('data-toggle-on-label', 'check')
    toggleBtnName.setAttribute('data-toggle-off-content', 'check')
    toggleBtnName.setAttribute('data-toggle-off-label', 'createActivity')

    toggleBtnName.textContent = 'check'
  }

  // const edit = document.createElement('button')
  // edit.className = 'mdc-button'
  // edit.id = `${value}-activity`
  // edit.dataset.id = record.activityId
  // edit.textContent = value
  // edit.style.color = 'white'

  rigthDiv.appendChild(toggleBtnName)
  header(leftDiv.outerHTML, rigthDiv.outerHTML)
  if (value === 'edit') {
    toggleActivityHeader(`${value}-activity`, '.activity-detail-page', value, record)
  }
  if (value === 'create') {
    toggleActivityHeader(`${value}-activity`, '#create-activity--container', value)
  }
}

function updateActivityPanel (db, record) {
  const detail = document.createElement('div')
  detail.className = 'mdc-top-app-bar--fixed-adjust activity-detail-page'
  detail.innerHTML = activityTitle(record.title, true) + activityDesc(record.description, true) + office(record.office) + template(record.template) + availableStatus(record) + showSchedule(record.schedule) + showVenue(record.venue) + updateAttachmentCont() + renderShareIcon(record) + renderAssigneeList(db, record, 'assignee--list')

  document.getElementById('app-current-panel').innerHTML = detail.outerHTML
  createAttachmentContainer(record.attachment , 'update--attachment-cont',record.canEdit,true)

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
  if (document.getElementById('select-cancel')) {
    document.getElementById('select-cancel').addEventListener('click', function () {
      updateStatus('CANCELLED', record.activityId)
    })
  }


  if (!record.canEdit) return

  document.getElementById('share-btn').addEventListener('click', function (evt) {
    const usersObjectStore = db.transaction('users').objectStore('users')
    record.assignees.forEach(function (number) {
      usersObjectStore.get(number).onsuccess = function (event) {
        const result = event.target.result
        if (!result) {
          const reqBody = {
            'activityId': record.activityId,
            'number': [number]
          }
          requestCreator('share', reqBody)
        }
      }
    })
    renderShareScreen(evt, record, '')
  })
}

function toggleActivityHeader (toggleId, containerClass, type, record) {
  var toggleButton = new mdc.iconButton.MDCIconButtonToggle(document.getElementById(toggleId))

  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function ({
    detail
  }) {
    if (!detail.isOn) {
      let allow = true
      checkInValidInputs(type, containerClass)
    } else {
      if (type === 'create') {
        checkInValidInputs(type, containerClass)
      } else {
        makeFieldsEditable(record)
      }
    }
  })
}

function checkInValidInputs (type, containerClass) {
  let allow = true
  document.getElementById('app-current-panel').querySelectorAll('[required]').forEach(function (elemnt) {
    console.log(elemnt.value)
    if (elemnt.value.trim() !== '' && allow == true) {
      allow = true

      createUpdateReqBody(event, type)
      return
    }
    allow = false
    return snacks('Please fill are required Inputs')
  })
}

function activityTitle (title, value) {
  const container = document.createElement('div')
  container.className = 'activity--title-container'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--title-input'

  const label = document.createElement('label')
  label.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  label.textContent = 'Title'
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  const input = document.createElement('input')
  input.required = true
  input.minLength = 1
  input.maxLength = 120

  input.className = 'mdc-text-field__input'
  if (value) {
    input.classList.add = 'border-bottom--none'
  }
  console.log(value)
  input.disabled = value
  input.type = 'text'
  if (title) {
    input.setAttribute('value', title)
  }

  textField.appendChild(input)
  textField.appendChild(label)
  textField.appendChild(ripple)

  container.appendChild(textField)
  return container.outerHTML
}

function activityDesc (desc, value) {
  const container = document.createElement('div')
  container.className = 'activity--desc-container'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--desc-input'

  const label = document.createElement('label')
  label.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  label.textContent = 'Description'
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  const input = document.createElement('input')
  input.required = true
  input.minLength = 1
  input.maxLength = 120

  input.className = 'mdc-text-field__input'
  if (value) {
    input.classList.add = 'border-bottom--none'
  }
  input.disabled = value
  input.type = 'text'
  input.setAttribute('value', desc)

  textField.appendChild(input)
  textField.appendChild(label)
  textField.appendChild(ripple)
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
  document.getElementById('back-detail').remove()
  document.getElementById('cancel-update').style.display = 'block'

  document.getElementById('activity--status-container').style.display = 'none'
  document.querySelector('.activity--share-container').style.display = 'none'
  document.querySelector('.add--assignee-icon').style.display = 'none'

  getInputText('activity--title-input')['input_'].disabled = false
  getInputText('activity--title-input')['input_'].classList.remove('border-bottom--none')
  getInputText('activity--desc-input')['input_'].disabled = false
  getInputText('activity--desc-input')['input_'].classList.remove('border-bottom--none')

  const startSchedule = document.querySelectorAll('.startTimeInputs')
  const endSchedules = document.querySelectorAll('.endTimeInputs')
  const venueLocations = document.querySelectorAll('.venue-location--input')
  const attachments = document.querySelectorAll('.attachment')
  const venueFields = document.querySelectorAll('.map-select-type-action');

  [...startSchedule].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].disabled = false
      getInputText(li.id)['input_'].classList.remove('border-bottom--none')
      li.addEventListener('click', function (e) {
        e.target.parentNode.nextSibling.children[0].disabled = false
        console.log(e.target)
        e.target.parentNode.nextSibling.children[0].min = e.target.value
        console.log(e.target.parentNode.nextSibling.children[0].min)
      })
    }
  });

  [...endSchedules].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].classList.remove('border-bottom--none')
    }
  });

  [...venueLocations].forEach(function (input) {
    input.disabled = false
    input.classList.remove('border-bottom--none')
  });

  [...venueFields].forEach(function (field) {
 
    field.addEventListener('click', function (evt) {
      renderLocationScreen(evt, record, field.nextSibling.id, evt.target.nextSibling.nextSibling.id)
    })
  });

  [...attachments].forEach(function (field) {
    if (field.dataset.type === 'string') {

      field.children[0].disabled = false
    }
  });

  [...document.querySelectorAll('.attachment-selector-label')].forEach(function (label) {
    label.style.display = 'block'
  })


  document.getElementById('cancel-update').addEventListener('click', function () {
    cancelUpdate(record.activityId)
  })

  // document.getElementById('update-activity').addEventListener('click', function (event) {
  //   createUpdateReqBody(event, 'update')
  // })
}

function cancelUpdate (id) {
  fillActivityDetailPage(id)
}

function availableStatus (record) {
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

  const scheduleList = document.createElement('div')
  scheduleList.className = ''
  scheduleList.id = 'schedule--list'

  scheduleCont.appendChild(spanDiv)

  let count = 0
  schedules.forEach((schedule) => {
    count++
    showScheduleUI(schedule, count, scheduleList, true)
  })
  scheduleCont.appendChild(scheduleList)
  return scheduleCont.outerHTML
}

function showScheduleUI (schedule, count, scheduleList, value) {
  const scheduleLi = document.createElement('div')
  scheduleLi.classList.add('schedule--list')

  const scheduleName = document.createElement('span')
  scheduleName.classList.add('schedule-name--list', 'detail--static-text')
  scheduleName.dataset.value = schedule.name
  scheduleName.innerHTML = schedule.name

  const scheduleStartTime = document.createElement('div')
  scheduleStartTime.classList.add('mdc-text-field', 'startTimeInputs')
  scheduleStartTime.id = `schedule-start--list${count}`

  const scheduleStartTimeInput = document.createElement('input')
  scheduleStartTimeInput.type = 'datetime-local'
  scheduleStartTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
  scheduleStartTimeInput.disabled = value
  scheduleStartTimeInput.required = true

  scheduleStartTimeInput.setAttribute('value', (moment(schedule.startTime).format('YYYY-MM-DDTHH:mm')))

  const startLabel = document.createElement('label')
  startLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  startLabel.textContent = 'From'

  const startRipple = document.createElement('div')
  startRipple.className = 'mdc-line-ripple'

  scheduleStartTime.appendChild(scheduleStartTimeInput)
  scheduleStartTime.appendChild(startLabel)
  scheduleStartTime.appendChild(startRipple)

  const scheduleEndTime = document.createElement('div')
  scheduleEndTime.classList.add('mdc-text-field', 'endTimeInputs')
  scheduleEndTime.id = `schedule-end--list${count}`

  const scheduleEndTimeInput = document.createElement('input')
  scheduleEndTimeInput.type = 'datetime-local'
  scheduleEndTimeInput.disabled = value
  scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')
  scheduleEndTimeInput.required = true

  scheduleEndTimeInput.setAttribute('value', moment(schedule.endTime).format('YYYY-MM-DDTHH:mm'))

  const endLabel = document.createElement('label')
  endLabel.className = 'mdc-floating-label mdc-floating-label--float-above detail--static-text'
  endLabel.textContent = 'To'

  const endRipple = document.createElement('div')
  endRipple.className = 'mdc-line-ripple'

  scheduleEndTime.appendChild(scheduleEndTimeInput)
  scheduleEndTime.appendChild(endLabel)
  scheduleEndTime.appendChild(endRipple)

  const scheduleEditIconSpan = document.createElement('span')
  scheduleEditIconSpan.id = `schedule-edit--icon$`
  scheduleEditIconSpan.classList.add('activity--edit-icon')

  scheduleLi.appendChild(scheduleName)
  scheduleLi.appendChild(scheduleStartTime)
  scheduleLi.appendChild(scheduleEndTime)
  scheduleLi.appendChild(scheduleEditIconSpan)

  scheduleList.appendChild(scheduleLi)
}

function showVenue (venues, canEdit) {
  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container'

  const venueList = document.createElement('ul')
  venueList.className = 'mdc-list'
  venueList.id = 'venue--list'

  var count = 0
  venues.forEach((venue) => {
    if (venue.geopoint) {
      count++

      showVenueUI(venue, count, venueList, true)
    }
  })

  venueCont.appendChild(venueList)
  return venueCont.outerHTML
}

function showVenueUI (venue, count, venueList, value) {
  const venueLi = document.createElement('li')

  venueLi.className = 'mdc-list-item map-select-type map-select' + count
  venueLi.dataset.location = venue.location
  venueLi.dataset.address = venue.address
  venueLi.dataset.inputlat = venue.geopoint['_latitude']
  venueLi.dataset.inputlon = venue.geopoint['_longitude']
  venueLi.dataset.descrip = venue.venueDescriptor

  const venueDesc = document.createElement('div')

  venueDesc.id = `venue-desc${count}`
  venueDesc.dataset.descriptor = venue.venueDescriptor
  venueDesc.className = 'detail--static-text'
  venueDesc.textContent = venue.venueDescriptor

  const addLocationLabel = document.createElement('label')
  addLocationLabel.className = 'material-icons map-select-type-action'
  addLocationLabel.textContent = 'add_location'

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

  venueLocationInput.required = true
  venueLocationInput.disabled = value
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

  venueAddressInput.disabled = value
  venueAddressInput.required = true

  venueAddress.appendChild(venueAddressInput)

  venueLi.appendChild(venueDesc)
  venueLi.appendChild(addLocationLabel)
  venueLi.appendChild(venueLocation)
  venueLi.appendChild(venueAddress)
  const div = document.createElement('div')

  div.appendChild(venueLi)
  venueList.appendChild(div)
}

function updateAttachmentCont() {
  const div = document.createElement('div')
  div.id = 'update--attachment-cont'
  div.className = 'attachment--cont-update'
  return div.outerHTML
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

function assigneeListUI (userRecord, target, inputField) {
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
    assigneeLi.onclick = function (e) {
      getInputText(inputField)['root_'].classList.add('mdc-text-field--focused')
      getInputText(inputField)['label_']['root_'].textContent = this.dataset.name || 'Contact'
      getInputText(inputField).value = this.dataset.phoneNum
    }
  }
  console.log(target)
  document.getElementById(target).appendChild(assigneeLi)
}

function locationUI (userRecord, target, inputFields) {
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

  document.getElementById(userRecord.value.location.replace(/\s/g, '')).addEventListener('click', function () {
    getInputText(inputFields.main).value = this.dataset.location

    document.getElementById(inputFields.main).dataset.location = this.dataset.location
    document.getElementById(inputFields.main).dataset.address = this.dataset.address
    document.getElementById(inputFields.main).dataset.inputlat = this.dataset.lat
    document.getElementById(inputFields.main).dataset.inputlon = this.dataset.lon
    document.getElementById(inputFields.main).dataset.descrip = this.dataset.desc
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
    const phoneNumber = e.target.parentNode.dataset.assignee
    const reqBody = {
      'activityId': activityId,
      'remove': [phoneNumber]
    }
    console.log(reqBody)
    requestCreator('removeAssignee', reqBody)
  }
  if (mobileNumber !== firebase.auth().currentUser.phoneNumber) {
    document.querySelector(`[data-assignee="${mobileNumber}"]`).appendChild(removeIcon)
  }
}

function renderShareIcon (record) {
  if (!record.canEdit) return

  const IconParent = document.createElement('button')
  IconParent.classList.add('add--assignee-icon', 'mdc-fab')
  IconParent.id = 'share-btn'
  const icon = document.createElement('i')
  icon.classList.add('material-icons', 'mdc-fab__icon')
  icon.textContent = 'add'
  IconParent.appendChild(icon)

  // document.getElementById('share--icon-container').innerHTML = IconParent.outerHTML

  return IconParent.outerHTML
}

function renderShareScreen (evt, record, key) {
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

function renderLocationScreen (evt, record, primaryKey, secondarKey) {
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

function renderOfficeTemplateScreen (evt) {
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

function outlinedTextField (labelText, id) {
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

function renderShareScreenUI () {
  const aside = document.createElement('aside')

  aside.id = 'change-number-dialog'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const dialogHeader = document.createElement('header')
  dialogHeader.className = 'mdc-dialog__header'

  dialogHeader.innerHTML = outlinedTextField('Select Contact', 'contact-text-field')

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable'

  const ul = document.createElement('ul')
  ul.id = 'contacts--container'
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

function renderLocationScreenUI () {
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

function renderOfficeTemplateScreenUI () {
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

function initializeDialog (evt, input, params) {
  console.log(params)
  getInputText(input).value = ''
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#change-number-dialog'))
  dialog.listen('MDCDialog:accept', function () {
    const number = getInputText(input).value
    console.log(number)
    if (params.actionInput) {
      console.log(getInputText(params.actionInput))
      getInputText(params.actionInput).value = number
      document.getElementById('change-number-dialog').remove()

      return
    }
    addContact(number, params.id);
    [...document.querySelectorAll('.remove')].forEach(function (icon) {
      icon.classList.add('no-click')
    })
  })

  dialog.listen('MDCDialog:cancel', function () {
    document.getElementById('change-number-dialog').remove()
    // fillActivityDetailPage(activityId)
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function initializeDialogLocation (evt, input, params) {
  console.log(params)
  console.log(input)
  getInputText(input).value = ''
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#location-select-dialog'))
  dialog.listen('MDCDialog:accept', function () {
    const location = getInputText(input)['root_'].dataset.location
    const address = getInputText(input)['root_'].dataset.address
    const lat = getInputText(input)['root_'].dataset.inputlat
    const lon = getInputText(input)['root_'].dataset.inputlon

    if (params.actionInput) {
      console.log(params.actionInput.primary)
      console.log(params.actionInput.secondary)

      getInputText(params.actionInput.primary).value = location
      getInputText(params.actionInput.secondary).value = address

      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.location = location
      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.address = address

      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.inputlat = lat
      getInputText(params.actionInput.primary)['root_'].parentNode.dataset.inputlon = lon

      document.getElementById('location-select-dialog').remove()

      return
    }

  })

  dialog.listen('MDCDialog:cancel', function () {
    document.getElementById('location-select-dialog').remove()
    // fillActivityDetailPage(activityId)
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function initializeOfficeTemplateDialog (evt, input) {
  getInputText(input).value = ''

  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#officeTemplate-select-dialog'))
  dialog.listen('MDCDialog:accept', function () {
    const office = getInputText(input)['root_'].dataset.office
    const template = getInputText(input)['root_'].dataset.template
    console.log(office)
    console.log(template)
    getSelectedSubscriptionData(office, template)

    document.getElementById('officeTemplate-select-dialog').remove()
  })

  dialog.listen('MDCDialog:cancel', function () {
    document.getElementById('officeTemplate-select-dialog').remove()
    listView()
    // fillActivityDetailPage(activityId)
  })

  dialog.lastFocusedTarget = evt.target
  dialog.show()
}

function createUpdateReqBody (event, reqType) {
  const title = getInputText('activity--title-input').value
  const desc = getInputText('activity--desc-input').value
  const activityId = event.target.dataset.id
  const schedule = []
  const venue = []

  const allSchedule = document.querySelectorAll('.schedule--list');
  [...allSchedule].forEach(function (li) {
    const scheduleBody = {}
    scheduleBody.name = li.children[0].dataset.value
    scheduleBody.startTime = moment(getInputText(li.children[1].id).value).valueOf()
    console.log(scheduleBody.startTime)
    scheduleBody.endTime = moment(getInputText(li.children[2].id).value).valueOf()
    schedule.push(scheduleBody)
  })

  const allVenues = document.querySelectorAll('.map-select-type');
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

  const attachments = {}
  const allAttachments = document.querySelectorAll('.attachment');
  [...allAttachments].forEach(function (field) {
    attachments[field.id] = {
      value: getInputText(field.id).value,
      type: field.dataset.type

    }
    console.log(attachments)
  })

  if (reqType === 'edit') {
    const body = {
      'activityId': activityId,
      'title': title,
      'description': desc,
      'schedule': schedule,
      'venue': venue
    }

    console.log(body)

    requestCreator('update', body)
    return
  }

  if (reqType === 'create') {
    const body = {
      'office': document.querySelector('.activity--office').textContent,
      'template': document.querySelector('.activity--template').textContent,
      'title': title,
      'description': desc,
      'schedule': schedule,
      'venue': venue,
      // 'share': getInputText('contact--text-field').value,
      'attachment': attachments
    }
    console.log(body)
    requestCreator('create', body)
  }
}

function updateSelectorObjectStore (dataset, input, objectStoreName) {
  console.log(dataset)
  const dbName = firebase.auth().currentUser.uid

  const inputValue = getInputText(input)['root_'].dataset.number
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

function addContact (number, activityId) {
  const expression = /^\+[1-9]\d{5,14}$/
  if (!expression.test(number)) return

  const reqBody = {
    'activityId': activityId,
    'share': [number]
  }
  requestCreator('share', reqBody)
}

function dataElement (target, key) {
  return document.querySelector(`[data-${target}="${key}"]`)
}

function createActivity (evt) {
  const detail = document.createElement('div')
  detail.className = 'mdc-top-app-bar--fixed-adjust'
  detail.id = 'create-activity--container'
  createActivityDetailHeader({
    canEdit: true
  }, 'create')

  const activityMain = document.createElement('div')
  activityMain.className = 'activity-main'
  activityMain.innerHTML = office('') + template('') +
  activityTitle('', true) + activityDesc('', true) + createScheduleContainer() +
  createVenueContainer()

  detail.innerHTML = activityMain.outerHTML

  document.getElementById('app-current-panel').innerHTML = detail.outerHTML
  document.getElementById('back-list').addEventListener('click', listView)

  renderOfficeTemplateScreen(evt)
}

function officeTemplate () {
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

function officeTemplateCombo (cursor, target, input) {
  console.log(input)
  if (document.querySelector(`[data-office="${cursor.value.office}"][data-template="${cursor.value.template}"]`)) return

  const li = document.createElement('li')
  li.dataset.office = cursor.value.office
  li.dataset.template = cursor.value.name

  li.classList.add('mdc-list-item', 'combo-li')

  const liText = document.createElement('span')
  liText.classList.add('mdc-list-item__text')
  liText.textContent = cursor.value.office

  const liTextSecondary = document.createElement('span')
  liTextSecondary.classList.add('mdc-list-item__secondary-text')
  liTextSecondary.textContent = cursor.value.name

  liText.appendChild(liTextSecondary)

  li.appendChild(liText)
  document.getElementById(target).appendChild(li)
  dataElement('office', cursor.value.office).addEventListener('click', function () {
    getInputText(input).value = ''
    getInputText(input)['root_'].dataset.office = this.dataset.office
    getInputText(input)['root_'].dataset.template = this.dataset.template
    getInputText(input).value = this.dataset.office

    getInputText(input)['root_'].children[2].textContent = this.dataset.template
  })
}

function createVenueContainer () {
  const venueCont = document.createElement('div')
  venueCont.className = 'activity--venue-container'

  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Venue'
  // const venueList = document.createElement('ul')
  // venueList.className = 'mdc-list'
  // venueList.id = 'venue--list'

  venueCont.appendChild(span)

  // venueCont.appendChild(venueList)
  return venueCont.outerHTML
}

function createScheduleContainer () {
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

  return scheduleCont.outerHTML
}

function createInput (key, type, classtype, value) {
  const mainTextField = document.createElement('div')
  mainTextField.className = `mdc-text-field mdc-text-field--dense ${classtype}`
  mainTextField.id = key.replace(/\s/g, '')
  mainTextField.dataset.type = type
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'
  mainInput.type = 'text'
  if (value) {
    mainInput.disabled = value
  }
  const label = document.createElement('label')
  label.className = 'mdc-floating-label'
  label.textContent = type

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  mainTextField.appendChild(mainInput)
  mainTextField.appendChild(label)
  mainTextField.appendChild(ripple)
  return mainTextField
}


function getSelectedSubscriptionData (office, template) {
  document.querySelector('.activity--schedule-container').innerHTML = ''
  document.querySelector('.activity--venue-container').innerHTML = ''

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const subscriptionObjectStore = db.transaction('subscriptions').objectStore('subscriptions').index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    subscriptionObjectStore.get(range).onsuccess = function (event) {
      const record = event.target.result
      console.log(record)
      createAttachmentContainer(record.attachment,'create-activity--container',true,false)

      document.querySelector('.activity--office').textContent = record.office
      document.querySelector('.activity--template').textContent = record.name
      getInputText('activity--title-input')['input_'].disabled = false
      getInputText('activity--desc-input')['input_'].disabled = false

      record.schedule.forEach(function (name) {
        console.log(name)
        showScheduleUI({
          name: name,
          startTime: '',
          endTime: ''
        }, 1, document.querySelector('.activity--schedule-container'), false)
      })

      let venueCont = 0
      record.venue.forEach(function (venueDescriptor) {
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

      [...document.querySelectorAll('.map-select-type-action')].forEach(function (element) {
        element.addEventListener('click', function (evt) {
          console.log(evt)
          renderLocationScreen(evt, record, element.nextSibling.id, evt.target.nextSibling.nextSibling.id)
        })
      })
    }
  }
}

function createAttachmentContainer (attachment,target,canEdit,value) {
  if (document.getElementById('attachment-container')) {
    document.getElementById('attachment-container').remove()
  }

  const attachCont = document.createElement('div')
  attachCont.id = 'attachment-container'
  console.log(attachment)
  Object.keys(attachment).forEach(function (key) {
    console.log(key)
    const div = document.createElement('div')
    div.className = 'attachment-field'
    const label = document.createElement('label')
    label.textContent = key
    label.className = 'label--text'

    const addButton = document.createElement('label')
    addButton.className = 'mdc-fab add--assignee-icon attachment-selector-label'
    const span = document.createElement('span')
    span.className = 'mdc-fab__icon material-icons'
    span.textContent = 'person_add'
    addButton.appendChild(span)

    // labelIcon.id = 'create-activity--assignee'

    const keyValue = document.createElement('div')
    // keyValue.id = key
    div.appendChild(label)
    if (attachment[key].type === 'phoneNumber' && canEdit) {
      div.appendChild(addButton)
    }

    div.appendChild(keyValue)

    if(target === 'update--attachment-cont') {
      addButton.style.display = 'none'
    }
 

    if (attachment[key].type === 'string') {
      keyValue.innerHTML = createInput(key, attachment[key].type, 'attachment',value).outerHTML
      attachCont.appendChild(div)
    }

    if (attachment[key].type === 'phoneNumber') {
      keyValue.innerHTML = createInput(key, attachment[key].type, 'attachment', true,value).outerHTML

      attachCont.appendChild(div)
      
      addButton.onclick = function (evt) {
        renderShareScreen(evt, '', key.replace(/\s/g, ''))
      }
    }
    console.log(target)
    document.getElementById(target).appendChild(attachCont)
    // getInputText(key.replace(/\s/g, '')).value = ''
  })
}


function reinitCount (db, id) {
  const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
  activityCount.get(id).onsuccess = function (event) {
    const record = event.target.result
    record.count = 0
    activityCount.put(record)
  }
}
