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
      createComment(db,cursor.value, currentUser)
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

function createComment (db,addendum, currentUser) {
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
  readNameFromNumber(db,addendum.user).then(function(nameOrNumber){
    console.log(nameOrNumber)
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
  document.getElementById('chat-container').appendChild(commentBox)

  const container = document.getElementById('chat-container')
  container.scrollTop = container.scrollHeight
}
function readNameFromNumber(db,number){
return new Promise(function(resolve,reject){
  const usersObjectStore = db.transaction('users').objectStore('users')
  usersObjectStore.get(number).onsuccess = function(event){
    const record = event.target.result

    if(!record.displayName)  resolve(number);
    
    resolve(record.displayName)
  }
  usersObjectStore.get(number).onerror = function(event){
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

        activityObjectStore.get(id).onsuccess = function (event) {
          const record = event.target.result
          console.log(record)
          createActivityDetailHeader(record, 'edit')
          document.getElementById('back-detail').addEventListener('click', function () {
            conversation(id)
          })

          updateActivityPanel(db, id, record)
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
  edit.id = `${value}-activity`
  edit.dataset.id = record.activityId
  edit.textContent = value
  edit.style.color = 'white'

  rigthDiv.appendChild(edit)
  header(leftDiv.outerHTML, rigthDiv.outerHTML)
}

function updateActivityPanel (db, id, record) {
  const detail = document.createElement('div')
  detail.className = 'mdc-top-app-bar--fixed-adjust'
  detail.innerHTML = activityTitle(record.title, true) + activityDesc(record.description, true) + office(record.office) + template(record.template) + availableStatus(record, id) + showSchedule(record.schedule) + showVenue(record.venue) + renderShareIcon(record) + renderAssigneeList(db, record, 'assignee--list')

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
  if (document.getElementById('select-cancel')) {
    document.getElementById('select-cancel').addEventListener('click', function () {
      updateStatus('CANCELLED', record.activityId)
    })
  }

  if (!record.canEdit) return
  document.getElementById('edit-activity').addEventListener('click', function () {
    makeFieldsEditable(record)
  })
  document.getElementById('share-btn').addEventListener('click', function (e) {
    renderShareDrawer(record)
  })
}

function activityTitle (title, value) {
  const container = document.createElement('div')
  container.className = 'activity--title-container'
  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Title'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--title-input'

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  if (value) {
    input.classList.add = 'border-bottom--none'
  }

  input.disabled = value
  input.type = 'text'
  input.setAttribute('value', title)

  textField.appendChild(input)
  container.appendChild(span)
  container.appendChild(textField)
  return container.outerHTML
}

function activityDesc (desc, value) {
  const container = document.createElement('div')
  container.className = 'activity--desc-container'
  const span = document.createElement('span')
  span.className = 'detail--static-text'
  span.textContent = 'Description'

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  textField.id = 'activity--desc-input'

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  if (value) {
    input.classList.add = 'border-bottom--none'
  }
  input.disabled = value
  input.type = 'text'
  input.setAttribute('value', desc)
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
  document.querySelector('.add--assignee-icon').style.display = 'none'

  const updatebtn = document.createElement('btn')
  updatebtn.id = 'update-activity'
  updatebtn.className = 'mdc-button'
  updatebtn.textContent = 'update'
  updatebtn.dataset.id = record.activityId
  updatebtn.style.color = 'white'

  document.getElementById('action-data').appendChild(updatebtn)

  getInputText('activity--title-input')['input_'].disabled = false
  getInputText('activity--title-input')['input_'].classList.remove('border-bottom--none')
  getInputText('activity--desc-input')['input_'].disabled = false
  getInputText('activity--desc-input')['input_'].classList.remove('border-bottom--none')

  const startSchedule = document.querySelectorAll('.startTimeInputs')
  const endSchedules = document.querySelectorAll('.endTimeInputs')
  const venueLocations = document.querySelectorAll('.venue-location--input')

  const venueFields = document.querySelectorAll('.map-select-type');

  [...startSchedule].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].disabled = false
      getInputText(li.id)['input_'].classList.remove('border-bottom--none')
    }
  });

  [...endSchedules].forEach(function (li) {
    console.log(li)
    if (li.classList.contains('mdc-text-field')) {
      getInputText(li.id)['input_'].disabled = false
      getInputText(li.id)['input_'].classList.remove('border-bottom--none')
    }
  });

  [...venueLocations].forEach(function (input) {
    input.disabled = false
    input.classList.remove('border-bottom--none')
  });

  [...venueFields].forEach(function (field) {
    const locationsearch = document.createElement('ul')
    locationsearch.id = 'location--search'
    locationsearch.className = 'mdc-list'

    field.appendChild(locationsearch)

    field.addEventListener('click', function () {
      if (this.dataset.active) return
      console.log(field.children[1])
      this.dataset.active = true
      inputSelect({
        name: 'map',
        indexone: 'location',
        indextwo: 'address',
        indexThree: 'count'
      }, 'location--search', {
        main: field.children[1].id,
        address: field.children[2].id
      }, record)
    })
  })

  document.getElementById('cancel-update').addEventListener('click', function () {
    cancelUpdate(record.activityId)
  })

  document.getElementById('update-activity').addEventListener('click', function (event) {
    createUpdateReqBody(event, 'update')
  })
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

  let count = 0
  schedules.forEach((schedule) => {
    count++
    showScheduleUI(schedule, count, scheduleList, true)
  })
  scheduleCont.appendChild(scheduleList)
  return scheduleCont.outerHTML
}

function showScheduleUI (schedule, count, scheduleList, value) {
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
  scheduleStartTimeInput.disabled = value
  console.log(schedule)
  scheduleStartTimeInput.setAttribute('value', moment(schedule.startTime).format('YYYY-MM-DD'))

  scheduleStartTime.appendChild(scheduleStartTimeInput)

  const scheduleEndTime = document.createElement('div')
  scheduleEndTime.classList.add('mdc-text-field', 'endTimeInputs')
  scheduleEndTime.id = `schedule-end--list${count}`

  const scheduleEndTimeInput = document.createElement('input')
  scheduleEndTimeInput.type = 'date'
  scheduleEndTimeInput.disabled = value
  scheduleEndTimeInput.classList.add('mdc-text-field__input', 'border-bottom--none')

  scheduleEndTimeInput.setAttribute('value', moment(schedule.endTime).format('YYYY-MM-DD'))

  scheduleEndTime.appendChild(scheduleEndTimeInput)

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
  venueDesc.textContent = venue.venueDescriptor

  const venueLocation = document.createElement('div')
  venueLocation.classList.add('mdc-text-field', 'venue-location--name')
  venueLocation.id = `venue-location${count}`
  const venueLocationInput = document.createElement('input')
  venueLocationInput.classList.add('mdc-text-field__input', 'border-bottom--none', 'venue-location--input')
  venueLocationInput.setAttribute('value', venue.location)

  venueLocationInput.disabled = value
  venueLocation.appendChild(venueLocationInput)

  const venueAddress = document.createElement('div')
  venueAddress.classList.add('mdc-text-field', 'venue-address--name')
  venueAddress.id = 'venue-address' + count
  const venueAddressInput = document.createElement('input')
  venueAddressInput.classList.add('mdc-text-field__input', 'border-bottom--none')
  venueAddressInput.setAttribute('value', venue.address)
  venueAddressInput.disabled = value

  venueAddress.appendChild(venueAddressInput)

  venueLi.appendChild(venueDesc)
  venueLi.appendChild(venueLocation)
  venueLi.appendChild(venueAddress)
  const div = document.createElement('div')

  div.appendChild(venueLi)
  venueList.appendChild(div)
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
  console.log(target)
  const div = document.createElement('div')
  div.style.position = 'relative'
  if (target === 'assignee--list') {
    div.dataset.user = userRecord.primaryKey
  } else {
    div.dataset.phoneNum = userRecord.primaryKey
    div.dataset.name = userRecord.value.displayName
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
  console.log(target)
  document.getElementById(target).appendChild(div)

  if(target === 'assignee--list') return
  document.querySelector(`#${target} [data-phone-num="${userRecord.primaryKey}"`).addEventListener('click',function(){
    getInputText(this.parentNode.previousSibling.id).value = this.dataset.phoneNum
    this.parentNode.previousSibling.dataset.number = this.dataset.phoneNum
  })
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

  if(!document.getElementById(userRecord.value.location.replace(/\s/g, ''))) return
  document.getElementById(userRecord.value.location.replace(/\s/g, '')).addEventListener('click', function () {
    console.log(this)
    console.log(inputFields.main)
    getInputText(inputFields.main).value = this.dataset.location
    getInputText(inputFields.address).value = this.dataset.address

    document.getElementById(inputFields.main).parentNode.dataset.location = this.dataset.location
    document.getElementById(inputFields.main).parentNode.dataset.address = this.dataset.address
    document.getElementById(inputFields.main).parentNode.dataset.inputlat = this.dataset.lat
    document.getElementById(inputFields.main).parentNode.dataset.inputlon = this.dataset.lon
    document.getElementById(inputFields.main).parentNode.dataset.descrip = this.dataset.desc
    document.getElementById(target).innerHTML = ''
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

  return IconParent.outerHTML
}

function renderShareDrawer (record) {
  const user = firebase.auth().currentUser
  const req = window.indexedDB.open(user.uid)
  document.getElementById('app-current-panel').innerHTML = renderShareDrawerUI()

  createUsersHeader(record.activityId)
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

function renderShareDrawerUI () {
  const cont = document.createElement('div')
  cont.id = 'share--container'
  cont.className ='mdc-top-app-bar--fixed-adjust'
  const mainTextField = document.createElement('div')
  mainTextField.className = 'mdc-text-field mdc-text-field--box mdc-text-field--dense'
  mainTextField.id = 'contact-text-field'

  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'
  mainInput.type = 'text'

  mainTextField.appendChild(mainInput)

  const contacts = document.createElement('div')
  contacts.id = 'contacts'

  const ul = document.createElement('ul')
  ul.className = 'mdc-list'
  ul.id = 'contacts--container'

  // contacts.appendChild(ul)

  cont.appendChild(mainTextField)
  cont.appendChild(ul)
  return cont.outerHTML
}

function createUsersHeader (id) {
  const leftDiv = document.createElement('div')

  const backSpan = document.createElement('span')
  backSpan.className = 'back-icon'
  backSpan.id = 'back-users'

  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons'
  backIcon.textContent = 'arrow_back'

  backSpan.appendChild(backIcon)
  leftDiv.appendChild(backSpan)

  header(leftDiv.outerHTML)
  document.getElementById('back-users').addEventListener('click', function () {
    fillActivityDetailPage(id)
  })
}

function fetchUsersData (record) {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    inputSelect({
      name: 'users',
      indexone: 'users',
      indextwo: 'displayName',
      indexThree: 'count'
    }, 'contacts--container', {
      main: 'contact-text-field'
    }, record)
  }
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
    scheduleBody.startTime = getInputText(li.children[1].id).value
    scheduleBody.endTime = getInputText(li.children[2].id).value
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

  if (reqType === 'update') {
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

function addContact (data) {
  console.log(data)
  const expression = /^\+[1-9]\d{5,14}$/
  if (!expression.test(data.value)) return

  const reqBody = {
    'activityId': data.activityId,
    'share': [data.value]
  }
  requestCreator('share', reqBody)
}

function dataElement (target, key) {
  return document.querySelector(`[data-${target}="${key}"]`)
}


function createActivity () {
  const detail = document.createElement('div')
  detail.className = 'mdc-top-app-bar--fixed-adjust'
  detail.id = 'create-activity--container'
  createActivityDetailHeader({
    canEdit: true
  }, 'create')
  detail.innerHTML = officeTemplate() + office('') + template('') +
    activityTitle('', false) + activityDesc('', false) + createScheduleContainer() +
    createVenueContainer()

  document.getElementById('app-current-panel').innerHTML = detail.outerHTML
  document.getElementById('back-list').addEventListener('click', listView)

  console.log(document.querySelector('#venue--list'))
  // document.querySelector('#venue--list').children[0].appendChild(locationsearch)

  inputSelect({
    name: 'subscriptions',
    indexone: 'office',
    indextwo: 'template'
  }, 'officeTemplate--container', {
    main: 'officeTemplate--text-field'
  })

  document.getElementById('create-activity').addEventListener('click', function (event) {
    createUpdateReqBody(event, 'create')
  })
}

function officeTemplate () {
  const cont = document.createElement('div')
  cont.id = 'select-officeTemplate--container'

  const mainTextField = document.createElement('div')
  mainTextField.className = 'mdc-text-field mdc-text-field--box mdc-text-field--dense'
  mainTextField.id = 'officeTemplate--text-field'

  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'
  mainInput.type = 'text'

  mainTextField.appendChild(mainInput)

  const combination = document.createElement('div')
  combination.id = 'combination-selector'

  const ul = document.createElement('ul')
  ul.className = 'mdc-list'
  ul.id = 'officeTemplate--container'

  combination.appendChild(ul)

  cont.appendChild(mainTextField)
  cont.appendChild(combination)
  return cont.outerHTML
}

function officeTemplateCombo (cursor, target) {
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

function createInput (key, type, classtype) {
  const mainTextField = document.createElement('div')
  mainTextField.className = `mdc-text-field mdc-text-field--box mdc-text-field--dense ${classtype}`
  mainTextField.id = key
  mainTextField.dataset.type = type
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'
  mainInput.type = 'text'

  mainTextField.appendChild(mainInput)
  return mainTextField.outerHTML
}

function createAttachmentContainer (attachment) {

  Object.keys(attachment).forEach(function (key) {
    const div = document.createElement('div')
    const label = document.createElement('label')
    label.textContent = key
    const keyValue = document.createElement('div')
    // keyValue.id = key
    div.appendChild(label)
    div.appendChild(keyValue)

    if (attachment[key] === 'string') {
      keyValue.innerHTML = createInput(key, attachment[key], 'attachment')
      document.getElementById('create-activity--container').appendChild(div)
    }

    if (attachment[key] === 'phoneNumber') {
      keyValue.innerHTML = createInput(key, attachment[key], 'attachment')
      const selectorDiv = document.createElement('div')
      selectorDiv.id = 'contacts' + key
      keyValue.appendChild(selectorDiv)
      document.getElementById('create-activity--container').appendChild(div)
      inputSelect({
        name: 'users',
        indexone: 'users',
        indextwo: 'displayName',
        indexThree: 'count'
      }, 'contacts' + key, {
        main: key
      })
    }
  })
}

function getSelectedSubscriptionData (office, template) {
  document.querySelector('.activity--schedule-container').innerHTML = ''
  document.querySelector('.activity--venue-container').innerHTML = ''
  // document.querySelector('.create-attachment-container').innerHTML =''
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const subscriptionObjectStore = db.transaction('subscriptions').objectStore('subscriptions').index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    subscriptionObjectStore.get(range).onsuccess = function (event) {
      const record = event.target.result
      createAttachmentContainer(record.attachment)
      document.querySelector('.activity--office').textContent = record.office
      document.querySelector('.activity--template').textContent = record.template

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
          location: '',
          address: '',
          geopoint: {
            '_latitude': '',
            '_longitude': ''
          }
        }, venueCont, document.querySelector('.activity--venue-container'), false)

        document.querySelector('.map-select' + venueCont).parentNode.appendChild(locationsearch)
      });

      [...document.querySelectorAll('.venue-location--name')].forEach(function (element) {
        element.addEventListener('click', function () {
          console.log(this)
          inputSelect({
            name: 'map',
            indexone: 'location',
            indextwo: 'address',
            indexThree: 'count'
          }, this.parentNode.nextSibling.id, {
            main: this.id,
            address: this.nextSibling.id
          })
        })
      })
    }
  }
}
