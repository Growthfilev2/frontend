function conversation(id, pushState) {
  window.removeEventListener('scroll', handleScroll, false)
  checkIfRecordExists('activity', id).then(function (id) {
    if (id) {
      if (pushState) {
        history.pushState(['conversation', id], null, null)
      }
      fetchAddendumForComment(id)
    } else {
      resetScroll()
      listView()
    }
  }).catch(handleError)
}

function checkIfRecordExists(store, id) {
  return new Promise(function (resolve, reject) {
    const user = firebase.auth().currentUser
    const req = window.indexedDB.open(user.uid)

    req.onsuccess = function () {
      const db = req.result;
      const objectStore = db.transaction(store).objectStore(store)
      objectStore.get(id).onsuccess = function (event) {
        const record = event.target.result;
        if (record) {
          resolve(id)
        } else {
          resolve(false)
        }
      }
    }
    req.onerror = function () {
      reject({
        message: `${req.error.message} from checkIfRecordExists`
      });
    }
  })

}

function fetchAddendumForComment(id) {
  if (!id) return;
  const user = firebase.auth().currentUser
  const req = window.indexedDB.open(user.uid)

  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['addendum'], 'readonly');
    const addendumIndex = transaction.objectStore('addendum').index('activityId');
    createHeaderContent(db, id)
    commentPanel(id)
    statusChange(db, id);
    reinitCount(db, id)

    addendumIndex.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;

      if (!document.getElementById(cursor.value.addendumId)) {
        createComment(db, cursor.value, user).then(function (comment) {
          if (document.getElementById('chat-container')) {
            document.getElementById('chat-container').appendChild(comment)
          }
        })
      }

      cursor.continue()
    }
    transaction.oncomplete = function () {
      if (document.querySelector('.activity--chat-card-container')) {
        document.querySelector('.activity--chat-card-container').scrollTop = document.querySelector('.activity--chat-card-container').scrollHeight
      }

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

  const statusChangeContainer = document.createElement('div')
  statusChangeContainer.className = 'status--change-cont'

  const commentCont = document.createElement('div')
  commentCont.className = 'comment--container'

  const field = document.createElement('div')
  field.className = 'input--text-padding mdc-text-field mdc-text-field--dense'
  field.id = 'write--comment'
  field.style.width = '100%';
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input comment-field mdc-elevation--z4'
  input.type = 'text'

  field.appendChild(input)

  commentCont.appendChild(field)


  const btn = document.createElement('button')
  btn.classList.add('mdc-fab', 'mdc-fab--mini', 'hidden')
  btn.id = 'send-chat--input'

  const btnIcon = document.createElement('span')
  btnIcon.classList.add('mdc-fac__icon', 'material-icons')
  btnIcon.textContent = 'send'
  btn.appendChild(btnIcon)

  commentCont.appendChild(btn)

  commentPanel.appendChild(chatCont)

  userCommentCont.appendChild(commentCont)

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + statusChangeContainer.outerHTML + userCommentCont.outerHTML

  document.querySelector('.comment-field').oninput = function (evt) {
    if (!evt.target.value || !evt.target.value.replace(/\s/g, '').length) {
      toggleCommentButton(false)
    } else {
      toggleCommentButton(true)
    }
  }

  document.getElementById('send-chat--input').onclick = function () {
    if (!isLocationStatusWorking()) return;
    let comment = document.querySelector('.comment-field').value;
    const reqBody = {
      'activityId': id,
      'comment': comment
    }

    requestCreator('comment', reqBody)

    document.querySelector('.comment-field').value = ''
    toggleCommentButton(false)
  }
}


function toggleCommentButton(show) {
  const input = document.getElementById('send-chat--input');
  const writeComment = document.getElementById('write--comment');
  const statusCont = document.querySelector('.status--change-cont');

  if (show) {
    input.classList.remove('hidden')
    writeComment.style.width = '80%'
    statusCont.style.opacity = '0';
  } else {
    input.classList.add('hidden');
    writeComment.style.width = '100%';
    writeComment.style.transition = '0.3s ease'
    statusCont.style.transition = '0.3s ease'
    statusCont.style.opacity = '1'
  }

}

function statusChange(db, id) {

  const label = document.createElement('label')
  label.setAttribute('for', 'toggle-status')
  label.textContent = 'Done'

  const activityStore = db.transaction('activity').objectStore('activity');
  activityStore.get(id).onsuccess = function (event) {
    const container = document.querySelector('.status--change-cont')
    const record = event.target.result;
    if (!record.canEdit || record.status === 'CANCELLED') {
      const statusSpan = document.createElement('span')
      const record = event.target.result
      statusSpan.textContent = 'Activity ' + (record.status.toLowerCase())
      if (container) {
        container.innerHTML = statusSpan.outerHTML
        container.style.textAlign = 'center'
      }
      return
    }
    if (record.editable == 0) {

      container ? container.innerHTML = label.outerHTML + loader('status-loader').outerHTML : ''
      return
    }
    if (!document.querySelector('.status-check')) {
      const div = document.createElement('div')
      div.className = 'mdc-form-field form-field-status'

      const checkbox = document.createElement('div')
      checkbox.className = 'mdc-checkbox status-check'


      const input = document.createElement("input")
      input.className = 'mdc-checkbox__native-control'
      input.id = 'toggle-status'
      input.type = 'checkbox'

      const checkbox_bckg = document.createElement('div')
      checkbox_bckg.className = 'mdc-checkbox__background'

      const svg = `<svg class="mdc-checkbox__checkmark"
      viewBox="0 0 24 24">
      <path class="mdc-checkbox__checkmark-path"
      fill="none"
      d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
      </svg>
      <div class="mdc-checkbox__mixedmark"></div>`

      const mixedmark = document.createElement('div')
      mixedmark.className = 'mdc-checkbox__mixedmark'
      checkbox_bckg.innerHTML = svg
      checkbox.appendChild(input)
      checkbox.appendChild(checkbox_bckg)

      div.appendChild(checkbox)

      if (container) {
        container.innerHTML = div.outerHTML + label.outerHTML
      }
    }

    if (!document.querySelector('.mdc-checkbox')) return;

    switchControl = new mdc.checkbox.MDCCheckbox.attachTo(document.querySelector('.mdc-checkbox'));
    if (record.status === 'CONFIRMED') {
      switchControl.checked = true
    }
    document.querySelector('.mdc-checkbox').onclick = function () {
      if (isLocationStatusWorking()) {
        changeStatusRequest(switchControl, record)
      } else {
        resetStatusConfirmation(switchControl, record);
      }
    }
  }
}

function resetStatusConfirmation(switchControl, record) {
  if (record.status === 'CONFIRMED') {
    switchControl.checked = true
  } else {
    switchControl.checked = false
  }
}

function changeStatusRequest(switchControl, record) {
  document.querySelector('.form-field-status').classList.add('hidden');

  document.querySelector('.status--change-cont').appendChild(loader('status-loader'));

  if (switchControl.checked) {
    requestCreator('statusChange', {
      activityId: record.activityId,
      status: 'CONFIRMED'
    })
  } else {
    requestCreator('statusChange', {
      activityId: record.activityId,
      status: 'PENDING'
    })
  }
}

function createComment(db, addendum, currentUser) {
  let showMap = false
  return new Promise(function (resolve) {

    let commentBox = document.createElement('div')

    commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')

    currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment', 'secondary-color-light') : commentBox.classList.add('other-user--comment', 'mdc-theme--primary-bg')
    commentBox.id = addendum.addendumId

    let textContainer = document.createElement('div')
    textContainer.classList.add('talktext')

    let user = document.createElement('p')
    user.classList.add('user-name--comment', 'mdc-typography--subtitle2')

    getUserRecord(db, addendum.user).then(function (record) {
      if (record.displayName) {
        user.textContent = record.displayName
      } else {
        user.textContent = record.mobile
      }

      let comment = document.createElement('p')
      comment.classList.add('comment', 'mdc-typography--subtitle2')
      comment.textContent = addendum.comment

      let commentInfo = document.createElement('span')
      commentInfo.className = 'comment--info'
      const datespan = document.createElement('span')
      datespan.textContent = moment(addendum.timestamp).format('DD-MM-YY H:mm')
      datespan.classList.add('comment-date', 'mdc-typography--caption')

      const link = document.createElement('div')
      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))


      mapIcon.dataset.latitude = addendum.location['_latitude']
      mapIcon.dataset.longitude = addendum.location['_longitude']
      link.appendChild(mapIcon)

      const mapDom = document.createElement('div')
      mapDom.className = 'map-convo'


      link.onclick = function (evt) {
        if (!hasMapsApiLoaded()) return
        showMap = !showMap;
        const loc = {
          lat: addendum.location['_latitude'],
          lng: addendum.location['_longitude']
        }
        const map = new AppendMap(loc, mapDom)
        map.getMarker();
        if (showMap) {
          mapDom.style.height = '200px'
          mapIcon.textContent = 'arrow_drop_down'
        } else {
          mapDom.style.height = '0px'
          mapIcon.textContent = 'location_on'
        }
      }
      commentInfo.appendChild(datespan)
      commentInfo.appendChild(link)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)
      commentBox.appendChild(textContainer)
      commentBox.appendChild(mapDom);
      resolve(commentBox)
    })
  })
}

function getUserRecord(db, data) {
  return new Promise(function (resolve, reject) {
    const usersObjectStore = db.transaction('users').objectStore('users');
    let number;
    if (typeof data === 'string') {
      number = data
    } else {
      number = data.phoneNumber;
    }
    usersObjectStore.get(number).onsuccess = function (event) {
      const record = event.target.result
      if (!record) return resolve({
        displayName: '',
        mobile: number,
        photoURL: ''
      })
      return resolve(record)
    }
  })
}

function hasMapsApiLoaded() {
  if (typeof google === 'object' && typeof google.maps === 'object') {
    return true
  }
  return false
}


function MapsCustomControl(customControlDiv, map, lat, lng) {
  var controlUI = document.createElement('div');

  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.style.padding = '0px 5px 0px 5px';

  customControlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('a');
  controlText.href = `https://www.google.com/maps?q=${lat},${lng}`
  controlText.className = 'material-icons'
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.style.textDecoration = 'none'

  controlText.innerHTML = 'open_in_new';
  controlUI.appendChild(controlText);

}

function createHeaderContent(db, id) {
  const sectionStart = document.getElementById('section-start');
  sectionStart.innerHTML = ''
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  let leftDiv = headerBackIcon()

  activityObjectStore.get(id).onsuccess = function (event) {

    const record = event.target.result;

    getUserRecord(db, record.creator).then(function (userRecord) {
      const dataObject = document.createElement('object');
      dataObject.data = userRecord.photoURL || './img/empty-user.jpg';
      dataObject.className = 'header--icon-creator';
      dataObject.type = 'image/jpeg';

      var creatorImg = document.createElement("img");
      creatorImg.src = './img/empty-user.jpg';
      creatorImg.className = 'header--icon-creator'
      dataObject.appendChild(creatorImg);

      var primarySpan = document.createElement('div');
      primarySpan.className = 'mdc-top-app-bar__title mdc-typography--subtitle2';
      const name = document.createElement('span')
      name.textContent = record.activityName;
      name.className = ''
      primarySpan.onclick = function () {
        checkIfRecordExists('activity', record.activityId).then(function (id) {
          if (id) {
            updateCreateActivity(record);
          } else {
            resetScroll()
            listView();
          }
        }).catch(handleError);
      }
      var info = document.createElement('span');
      // secondarySpan.className = 'mdc-list-item__secondary-text';
      info.textContent = 'Click here to see details';

      sectionStart.appendChild(leftDiv);
      sectionStart.appendChild(dataObject);
      primarySpan.appendChild(name);
      primarySpan.appendChild(document.createElement('br'))
      primarySpan.appendChild(info)
      sectionStart.appendChild(primarySpan)

    });
  }
}

function reinitCount(db, id) {
  const transaction = db.transaction(['list'], 'readwrite');
  const store = transaction.objectStore('list');

  store.get(id).onsuccess = function (event) {
    const record = event.target.result
    if (!record) return;
    record.count = 0
    store.put(record)
  }
  transaction.oncomplete = function () {}
}


function noSelectorResult(text) {
  const noResult = document.createElement('div')
  noResult.className = 'data-not-found'
  const p = document.createElement('p')
  p.className = 'mdc-typography--headline5'
  p.textContent = text
  noResult.appendChild(p)
  return noResult
}

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      const results = [];
      const db = req.result;
      const tx = db.transaction(['map'])
      const store = tx.objectStore('map')
      const index = store.index('byOffice')
      const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
      index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.location) {
          cursor.continue();
          return;
        }
        if (!cursor.value.latitude || !cursor.value.longitude) {
          cursor.continue();
          return;
        }

        const distanceBetweenBoth = calculateDistanceBetweenTwoPoints(cursor.value, currentLocation);

        if (isLocationLessThanThreshold(distanceBetweenBoth)) {

          results.push(cursor.value);
        }
        cursor.continue();
      }
      tx.oncomplete = function () {
        const filter = {};
        results.forEach(function (value) {
          filter[value.location] = value;
        })
        const array = [];
        Object.keys(filter).forEach(function (locationName) {
          array.push(filter[locationName])
        })
        const nearest = array.sort(function (a, b) {
          return a.accuracy - b.accuracy
        })
        resolve(nearest)
      }
      tx.onerror = function () {
        reject(tx.error)
      }
    }
  })
}

function createTempRecord(office, template, prefill) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['subscriptions']);
    const subscription = tx.objectStore('subscriptions')
    const officeTemplateCombo = subscription.index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    officeTemplateCombo.get(range).onsuccess = function (event) {
      const selectedCombo = event.target.result
      if (!selectedCombo) {
        return;
      }

      let bareBonesScheduleArray;
      if (prefill.schedule) {
        bareBonesScheduleArray = prefill.schedule
      } else {
        bareBonesScheduleArray = []
        selectedCombo.schedule.forEach(function (schedule) {
          const bareBonesSchedule = {}
          bareBonesSchedule.name = schedule
          bareBonesSchedule.startTime = ''
          bareBonesSchedule.endTime = ''
          bareBonesScheduleArray.push(bareBonesSchedule)
        })
      }
      if (prefill.attachment) {
        Object.keys(prefill.attachment).forEach(function (key) {
          selectedCombo.attachment[key] = prefill.attachment[key]
        })
      }
      const bareBonesRecord = {
        office: selectedCombo.office,
        template: selectedCombo.template,
        venue: '',
        schedule: bareBonesScheduleArray,
        attachment: selectedCombo.attachment,
        timestamp: Date.now(),
        canEdit: true,
        assignees: [],
        activityName: selectedCombo.template.toUpperCase(),
        create: true
      }

      const bareBonesVenueArray = []
      if (template === 'check-in') {

        getRootRecord().then(function (record) {
          const bareBonesVenue = {}
          bareBonesVenue.venueDescriptor = selectedCombo.venue[0]
          bareBonesVenue.location = ''
          bareBonesVenue.address = ''
          bareBonesVenue.geopoint = {
            '_latitude': '',
            '_longitude': ''
          }
          bareBonesRecord.venue = [bareBonesVenue];
          const isLocationOld = isLastLocationOlderThanThreshold(record.location.lastLocationTime, 5);
          if (record.location && !isLocationOld) return updateCreateActivity(bareBonesRecord);

          let message;
          if (native.getName() === 'Android') {
            message = 'Make Sure you have set Location Mode to High Accuracy'
          } else {
            message = 'Please wait.'
          }
          const span = document.createElement('span')
          span.className = 'mdc-typography--body1'
          span.textContent = message
          document.getElementById('dialog-container').innerHTML = dialog({
            id: 'location-fetch-dialog',
            content: span,
            headerText: 'Fetching Location'
          }).outerHTML
          const dialogEl = document.getElementById('location-fetch-dialog')
          const fetchingLocationDialog = new mdc.dialog.MDCDialog(dialogEl)
          fetchingLocationDialog.show();
          if (native.getName() === 'Ios') {
            window.addEventListener('iosLocation', function _iosLocation(e) {
              dialogEl.remove();
              updateCreateActivity(bareBonesRecord)
              window.removeEventListener('iosLocation', _iosLocation, true);
            }, true)
            return;
          }
          manageLocation().then(function (location) {
            dialogEl.remove();
            updateCreateActivity(bareBonesRecord)
          }).catch(function (error) {

            let errorMessage = 'There was a problem in detecting your location'
            if (native.getName() === 'Android') {
              errorMessage = errorMessage + '. Make sure you have set Location Mode to high accuracy'
            }
            dialogEl.querySelector('.mdc-dialog__header__title').textContent = 'Failed To Get Current Location';
            dialogEl.querySelector('section span').textContent = errorMessage;
            setTimeout(function () {
              dialogEl.remove();
            }, 3000)
            resetScroll()
            listView();
            handleError(error)
          })
        });
        return
      }

      selectedCombo.venue.forEach(function (venue) {
        const bareBonesVenue = {}
        bareBonesVenue.venueDescriptor = venue
        bareBonesVenue.location = ''
        bareBonesVenue.address = ''
        bareBonesVenue.geopoint = {
          '_latitude': '',
          '_longitude': ''
        }

        bareBonesVenueArray.push(bareBonesVenue);
      });
      bareBonesRecord.venue = bareBonesVenueArray
      updateCreateActivity(bareBonesRecord)
    }
  }

}

function hasAnyValueInChildren(office, template) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  return new Promise(function (resolve) {

    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children'])
      const store = tx.objectStore('children').index('templateStatus');
      const bound = IDBKeyRange.bound([template, 'CONFIRMED'], [template, 'PENDING'])
      let count = 0;
     
      store.openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return;
        if(cursor.value.office !== office) {
          cursor.continue();
          return;
        }
        count++
        cursor.continue()
      }
      tx.oncomplete = function(){
        resolve(count)
      }
    }
  })
}


function updateLocalRecord(thisActivity, db) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['activity'], 'readwrite');
    const store = tx.objectStore('activity');
    let updatedActivity = thisActivity;

    if (!updatedActivity.hasOwnProperty('create')) {
      store.put(updatedActivity)
    }
    tx.oncomplete = function () {
      resolve("activity object store updated with value")
    }
    tx.onerror = function () {
      reject({
        message: `${tx.error.message} from updateLocalRecord`
      });
    }
  })
}



function convertKeyToId(key) {
  let str = key.replace(/-/g, '--')
  return str.replace(/\s/g, '-')
}

function convertIdToKey(id) {
  // let str =  id.replace(/--/g, '-')
  let str = id.replace(/-/g, ' ')
  return str.replace('  ', '-')
}

function updateCreateContainer(record, showSendButton) {

  document.body.style.backgroundColor = '#eeeeee'
  document.body.classList.remove('mdc-dialog-scroll-lock')

  const activityName = document.createElement('span')
  activityName.textContent = record.activityName
  activityName.className = 'mdc-top-app-bar__title'
  let backIcon = headerBackIcon();

  const sectionStart = document.getElementById('section-start')
  sectionStart.innerHTML = ''
  sectionStart.appendChild(backIcon);
  sectionStart.appendChild(activityName)

  const container = document.createElement('div')
  container.className = 'mdc-top-app-bar--fixed-adjust update-create--activity'

  const TOTAL_LIST_TYPES = ['office', 'venue', 'schedule', 'attachment', 'assignees']

  const LIST_LENGTH = 5
  let i = 0;
  for (i; i < LIST_LENGTH; i++) {
    const containerList = document.createElement('ul')
    containerList.className = 'mdc-list custom--list-margin';

    const listGroup = document.createElement('div')
    switch (TOTAL_LIST_TYPES[i]) {
      case 'office':
        containerList.classList.remove('custom--list-margin')
        break;
      case 'schedule':
        listGroup.className = 'mdc-list-group__subheader'
        listGroup.id = 'schedule--group'
        break;
      case 'venue':
      case 'assignees':
        containerList.classList.add('mdc-list--two-line', 'mdc-list--avatar-list')
        break;

    };

    if (TOTAL_LIST_TYPES[i] === 'schedule') {
      container.appendChild(listGroup)
    } else {

      containerList.id = TOTAL_LIST_TYPES[i] + '--list'
      container.appendChild(containerList)
    }
  }
  if (record.canEdit) {

    const updateBtn = document.createElement('button')
    updateBtn.setAttribute('aria-label', 'Send')
    if (record.create) {
      updateBtn.className = ''
    } else if (!showSendButton) {
      updateBtn.className = 'hidden';
    }
    updateBtn.id = 'send-activity'
    updateBtn.textContent = 'SUBMIT'
    container.appendChild(updateBtn)
  }
  return container
}

function updateCreateActivity(record, showSendButton) {
  if (history.state[0] === 'updateCreateActivity') {
    history.replaceState(['updateCreateActivity', record], null, null)
  } else {
    history.pushState(['updateCreateActivity', record], null, null)
  }
  console.log(record)
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result

    // create base container for activity update/create
    const appView = document.getElementById('app-current-panel')

    appView.innerHTML = updateCreateContainer(record, showSendButton).outerHTML

    const officeSection = document.getElementById('office--list')
    officeSection.appendChild(createSimpleLi('Office', {
      office: record.office,
      showLabel: true
    }))


    createVenueSection(record)
    createScheduleTable(record);
    createAttachmentContainer(record)
    createAssigneeList(record, db)
    createActivityCancellation(record);
    window.scrollTo(0, 0)


    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function () {
        if(!isLocationStatusWorking()) return;
          this.dataset.progress = true
          insertInputsIntoActivity(record, true)
      });
    }

    const inputFields = document.querySelectorAll('.update-create--activity input');
    for (var i = 0; i < inputFields.length; i++) {
      inputFields[i].addEventListener('input', function (e) {
        if (!document.getElementById('send-activity').dataset.progress) {

          if (document.getElementById('send-activity').classList.contains('hidden')) {
            document.getElementById('send-activity').classList.remove('hidden')
          }
        }
      })
    }

  }
}


function createCheckInVenue(venue, defaultSelected) {

  const radio = document.createElement('div')
  radio.className = 'mdc-radio checkin'
  radio.value = JSON.stringify(venue)

  const input = document.createElement('input')
  input.className = 'mdc-radio__native-control'
  input.type = 'radio'
  input.setAttribute('name', 'radios');

  if (defaultSelected) {
    input.setAttribute('checked', 'true')
  }
  const background = document.createElement('div')
  background.className = 'mdc-radio__background'
  const outer = document.createElement('div')
  outer.className = 'mdc-radio__outer-circle'
  const inner = document.createElement('div')
  inner.className = 'mdc-radio__inner-circle'

  background.appendChild(outer)
  background.appendChild(inner)
  radio.appendChild(input)
  radio.appendChild(background)
  let showMap = false;

  return radio

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
  }

  if (key === 'delete') {
    dataVal.className = 'mdc-list-item__graphic material-icons'
    dataVal.textContent = key
    listItemLabel.classList.remove('detail--static-text')
    listItemLabel.classList.add('delete-activity')
    listItemLabel.textContent = data.text
    listItem.appendChild(dataVal)
    listItem.appendChild(listItemLabel)
  }
  if (key === 'empty') {
    listItem.dataset.prop = 'delete'
  }
  if (key === 'undo-deleted') {
    dataVal.className = 'mdc-list-item__graphic material-icons'
    dataVal.textContent = 'delete'
    listItemLabel.classList.remove('detail--static-text')
    listItemLabel.classList.add('delete-activity')

    listItemLabel.textContent = data.text
    listItem.appendChild(dataVal)
    listItem.appendChild(listItemLabel)
    listItem.classList.add('undo-delete-activity')
    const undo = document.createElement('button')
    undo.style.color = 'white';
    undo.className = 'mdc-button mdc-ripple-upgraded mdc-list-item__meta undo-deleted'
    undo.textContent = 'Undo'
    undo.onclick = function () {
      if (isLocationStatusWorking()) {
        document.querySelector('.undo-deleted').style.display = 'none'
        listItem.appendChild(loader('undo-delete-loader'));
        requestCreator('statusChange', {
          activityId: data.id,
          status: 'PENDING'
        })

      }
    }
    listItem.appendChild(undo)
  }

  return listItem
}

function createVenueSection(record) {

  const venueSection = document.getElementById('venue--list');

  if (record.template === 'check-in' && record.hasOwnProperty('create')) {

    getRootRecord().then(function (rootRecord) {
      checkMapStoreForNearByLocation(record.office, rootRecord.location).then(function (results) {
        if (!results.length) return;
        let defaultSelected = false;
        const checkInDesc = document.createElement('li')
        checkInDesc.className = 'mdc-list-item label--text'
        checkInDesc.textContent = record.venue[0].venueDescriptor
        checkInDesc.style.height = '50px'
        checkInDesc.style.paddingRight = '11px';

        const meta = document.createElement('span')
        meta.className = 'mdc-list-item__meta'
        const uncheck = document.createElement('label')
        uncheck.id = 'uncheck-checkin'
        uncheck.className = 'mdc-fab add--assignee-icon'
        const span = document.createElement('span')
        span.className = 'mdc-fab__icon material-icons'
        span.textContent = 'clear';
        uncheck.appendChild(span);
        meta.appendChild(uncheck)
        checkInDesc.appendChild(meta)
        venueSection.appendChild(checkInDesc)

        if (results.length == 1) {
          defaultSelected = true
        }

        results.forEach(function (result) {

          const form = document.createElement('div');
          form.className = 'mdc-form-field check-in-form'
          const label = document.createElement('label')
          label.setAttribute('for', 'check-in-radio');
          label.textContent = result.location
          form.appendChild(label);
          form.appendChild(createCheckInVenue(result, defaultSelected))
          venueSection.appendChild(form);
          const mapDom = document.createElement('div');
          mapDom.id = 'map-detail-check-in-create' + convertKeyToId(result.venueDescriptor)
          venueSection.appendChild(mapDom);
        })


        const uncheckFab = document.getElementById('uncheck-checkin');
        if (uncheckFab) {
          uncheckFab.addEventListener('click', function () {
            document.querySelectorAll('.mdc-radio.checkin').forEach(function (el) {
              const radio = new mdc.radio.MDCRadio(el)
              radio.checked = false
            });
          })
        }
      })
    })

    return;
  }

  record.venue.forEach(function (venue) {

    venueSection.appendChild(createVenueLi(venue, true, record))
    const mapDom = document.createElement('div');
    mapDom.className = 'map-detail ' + convertKeyToId(venue.venueDescriptor)
    venueSection.appendChild(mapDom)
  });

  if (record.template === 'check-in') {
    if (!record.venue[0].location || !record.venue[0].address) {
      document.getElementById('venue--list').style.display = 'none'
    }
  }

  if (record.venue.length === 0) {
    document.getElementById('venue--list').style.display = 'none'
  }
}

function createVenueLi(venue, showVenueDesc, record, showMetaInput) {
  let showMap = false
  const listItem = document.createElement('li')
  listItem.className = 'mdc-list-item mdc-ripple-upgraded'
  listItem.id = convertKeyToId(venue.venueDescriptor)

  const textSpan = document.createElement('div')
  textSpan.className = 'mdc-list-item__text link--span'

  const primarySpan = document.createElement('span')
  primarySpan.className = 'mdc-list-item__primary-text'

  const selectorIcon = document.createElement('span')
  selectorIcon.className = 'mdc-list-item__meta'

  const locationIcon = new Fab('add_location');
  const addLocation = locationIcon.getButton();
  addLocation.root_.classList.add('add--assignee-icon', 'attachment-selector-label')

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

    textSpan.onclick = function (evt) {
      if (!hasMapsApiLoaded()) return;
      if (!venue.geopoint['_latitude']) return;
      if (!venue.geopoint['_longitude']) return;

      showMap = !showMap

      const loc = {
        lat: venue.geopoint['_latitude'],
        lng: venue.geopoint['_longitude']
      }
      const mapParent = document.querySelector(`.map-detail.${convertKeyToId(venue.venueDescriptor)}`);
      const map = new AppendMap(loc, mapParent)
      map.getMarker();
      if (showMap) {
        mapParent.style.height = '200px';
      } else {
        mapParent.style.height = '0px';
      }
    }

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true')
      selectorIcon.appendChild(addLocation.root_)
      addLocation.root_.onclick = function (evt) {
        insertInputsIntoActivity(record)
        history.replaceState(['updateCreateActivity', record], null, null)

        selectorUI({
          record: record,
          store: 'map',
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
    listItem.onclick = function () {
      checkRadioInput(this, {
        location: venue.location,
        address: venue.address,
        geopoint: {
          '_latitude': venue.latitude,
          '_longitude': venue.longitude
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

  if (!data.schedule.length) {
    document.getElementById('schedule--group').style.display = 'none'

  }

  let count = 0;
  data.schedule.forEach(function (schedule) {
    count++
    const scheduleName = document.createElement('h5')
    scheduleName.className = 'mdc-list-group__subheader label--text'
    scheduleName.textContent = schedule.name

    const ul = document.createElement('ul')
    ul.className = 'mdc-list mdc-list--dense'

    const divider = document.createElement('li')
    divider.className = 'mdc-list-divider'
    divider.setAttribute('role', 'separator')

    const startLi = document.createElement('li')
    startLi.className = 'mdc-list-item schedule-start-li'

    const sdDiv = document.createElement('div')
    sdDiv.className = 'mdc-text-field start--date' + count

    const startDateInput = document.createElement('input')
    startDateInput.value = moment(schedule.startTime || new Date()).format('YYYY-MM-DD')
    startDateInput.type = 'date'
    startDateInput.disabled = !data.canEdit
    startDateInput.className = 'mdc-text-field__input'


    sdDiv.appendChild(startDateInput)

    const stSpan = document.createElement("span")
    stSpan.className = 'mdc-list-item__meta'

    const stDiv = document.createElement('div')
    stDiv.className = 'mdc-text-field start--time' + count

    const startTimeInput = document.createElement('input')
    if (schedule.startTime) {
      startTimeInput.value = moment(schedule.startTime).format('HH:mm')
    } else {
      startTimeInput.value = moment("24", "HH:mm").format('HH:mm')
    }

    startTimeInput.type = 'time'
    startTimeInput.className = 'time--input'
    startTimeInput.disabled = !data.canEdit
    startTimeInput.className = 'mdc-text-field__input'
    stDiv.appendChild(startTimeInput)

    stSpan.appendChild(stDiv)


    const endLi = document.createElement('li')
    endLi.className = 'mdc-list-item schedule-end-li'

    const edDiv = document.createElement('div')
    edDiv.className = 'mdc-text-field end--date' + count

    const endDateInput = document.createElement('input')
    endDateInput.value = moment(schedule.endTime || moment().add(1, 'days')).format('YYYY-MM-DD')
    endDateInput.type = 'date'
    endDateInput.disabled = !data.canEdit
    endDateInput.className = 'mdc-text-field__input'
    edDiv.appendChild(endDateInput)
    if (data.template === 'leave') {
      startDateInput.onchange = function (e) {
        const field = document.getElementById('Number-Of-Days')
        if (field) {
          const value = moment(endDateInput.value).diff(moment(startDateInput.value), 'days') + 1
          if (value >= 0) {

            field.querySelector('input').value = value
          }
        }
      }
      endDateInput.onchange = function (e) {
        const field = document.getElementById('Number-Of-Days')
        if (field) {
          const value = moment(endDateInput.value).diff(moment(startDateInput.value), 'days') + 1
          if (value >= 0) {
            field.querySelector('input').value = value
          }
        }
      }
    }
    const etSpan = document.createElement("span")
    etSpan.className = 'mdc-list-item__meta'

    const etDiv = document.createElement('div')
    etDiv.className = 'mdc-text-field end--time' + count


    const endTimeInput = document.createElement('input')
    if (schedule.endTime) {
      endTimeInput.value = moment(schedule.endTime || new Date()).format('HH:mm')
    } else {
      endTimeInput.value = moment("24", "HH:mm").format('HH:mm')

    }
    endTimeInput.type = 'time'
    endTimeInput.disabled = !data.canEdit
    endTimeInput.className = 'mdc-text-field__input'

    etDiv.appendChild(endTimeInput)

    etSpan.appendChild(etDiv)


    startLi.appendChild(sdDiv)
    startLi.appendChild(stSpan)

    endLi.appendChild(edDiv)
    endLi.appendChild(etSpan)

    ul.appendChild(startLi)
    ul.appendChild(divider)
    ul.appendChild(endLi)

    document.getElementById('schedule--group').appendChild(scheduleName)
    document.getElementById('schedule--group').appendChild(ul)
  })
}


function createAttachmentContainer(data) {

  const ordering = ['Name', 'Number', 'Template', 'email', 'phoneNumber', 'HHMM', 'weekday', 'number', 'base64', 'string']

  ordering.forEach(function (order) {
    const group = document.createElement("div")
    group.className = `${order}--group`
    document.getElementById('attachment--list').appendChild(group)
  })

  const availTypes = {
    'phoneNumber': '',
    'weekday': '',
    'HH:MM': '',
    'string': '',
    'base64': '',
    'number': '',
    'email': ''
  }


  Object.keys(data.attachment).forEach(function (key) {

    const div = document.createElement('div')
    data.attachment[key].type === 'HH:MM' ? div.className = `attachment-field HHMM` : div.className = `attachment-field ${data.attachment[key].type}`
    div.id = convertKeyToId(key)

    if (data.canEdit) {
      div.classList.add('editable--true')
    }
    const label = createElement('span', {
      className: 'label--text',
      textContent: key
    })

    if (data.attachment[key].type === 'string') {
      if (key === 'Name' || key === 'Number') {
        div.appendChild(label)
        const uniqueField = new InputField();
        const uniqueFieldInit = uniqueField.withoutLabel();
        uniqueFieldInit.root_.id = key
        uniqueFieldInit.disabled = !data.canEdit
        uniqueFieldInit.value = data.attachment[key].value
        uniqueFieldInit['input_'].required = true;
        div.appendChild(uniqueFieldInit.root_);
      } else {
        div.appendChild(label)
        const field = textAreaField({
          value: data.attachment[key].value,
          readonly: data.canEdit,
          rows: 2
        })
        div.appendChild(field);
      }
    }

    if (data.attachment[key].type === 'number') {
      div.appendChild(label)
      console.log(data)
      let canEdit = data.canEdit
      if (key === 'Number Of Days') {
        const startDate = document.querySelector('#schedule--group .start--date1 input')
        const endDate = document.querySelector('#schedule--group .end--date1 input')
        data.attachment[key].value = (moment(endDate.value).diff(startDate.value, 'days')) + 1
        console.log(moment(endDate.value).diff(startDate.value, 'days') + 1);
        canEdit = false
      }
      const numberInput = new InputField();
      const numberInit = numberInput.withoutLabel();
      numberInit.input_.type = 'number';
      numberInit.value = data.attachment[key].value
      numberInit.disabled = !data.canEdit;
      div.appendChild(numberInit.root_);

    }

    if (data.attachment[key].type === 'email') {
      div.appendChild(label)
      const emailField = new InputField();
      const emailFieldInit = emailField.withoutLabel();

      emailFieldInit.value = data.attachment[key].value;
      emailFieldInit.disabled = !data.canEdit;
      emailFieldInit['input_'].type = 'email'

      div.appendChild(emailFieldInit.root_)
    }

    if (data.attachment[key].type === 'phoneNumber') {
      div.appendChild(label)

      div.classList.add('selector--margin')

      const dataVal = createElement('span', {
        className: 'data--value-list',
        textContent: data.attachment[key].value
      })
      dataVal.dataset.primary = ''
      div.appendChild(dataVal)

      if (data.canEdit) {
        const addNumber = new Fab('person_add');
        const addNumberButton = addNumber.getButton();

        addNumberButton['root_'].classList.add('add--assignee-icon', 'attachment-selector-label')

        div.appendChild(addNumberButton['root_'])
        addNumberButton['root_'].onclick = function (evt) {
          insertInputsIntoActivity(data)
          history.replaceState(['updateCreateActivity', data], null, null)
          selectorUI({
            record: data,
            store: 'users',
            attachment: true,
            key: key
          })
        }
      }
    }

    if (data.attachment[key].type == 'HH:MM') {
      div.appendChild(label)
      const timeInput = new InputField();
      const timeInputInit = timeInput.withoutLabel();
      timeInputInit.value = data.attachment[key].value || moment("24", "HH:mm").format('HH:mm')
      timeInputInit.disabled = !data.canEdit;
      timeInputInit.input_.type = 'time'
      div.appendChild(timeInputInit['root_']);
    }

    if (data.attachment[key].type === 'weekday') {
      div.appendChild(label)
      const selectField = selectMenu({
        id: convertKeyToId(key),
        data: ['Sunday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'Monday']
      });

      selectField.listen('change', () => {
        if (!document.getElementById('send-activity').dataset.progress) {
          document.getElementById('send-activity').classList.remove('hidden')
        }
      });

      div.appendChild(selectField.root_);
    }

    if (data.attachment[key].type === 'base64') {

      const imagePreview = createElement('ul', {
        className: 'image-preview--attachment mdc-image-list standard-image-list mdc-image-list--with-text-protection'
      })
      imagePreview.appendChild(setFilePath(data.attachment[key].value, key, true))

      if (data.canEdit) {
        const imageFab = new Fab('add_a_photo');
        const imageFabInit = imageFab.getButton();
        imageFabInit.root_.classList.add('attachment-selector-label', 'add--assignee-icon')
        div.appendChild(imageFabInit.root_)
        imageFabInit.root_.onclick = function () {
          readCameraFile()
        }
      }
      div.appendChild(imagePreview)
    }

    if (!availTypes.hasOwnProperty(data.attachment[key].type)) {


      const customerAddition = {
        'tour plan': true,
        'dsr': true,
        'duty roster': true
      };
      div.appendChild(label)
      const valueField = document.createElement('span')
      let buttonCont = createElement('div', {
        className: 'customer-button-container'
      })

      valueField.textContent = data.attachment[key].value
      valueField.className = 'data--value-list'
      div.appendChild(valueField)
      hasAnyValueInChildren(data.office, data.attachment[key].type).then(function (hasValue) {

        if (hasValue) {
          const chooseExisting = new Fab('add');
          const chooseExistingEl = chooseExisting.getButton();
          chooseExistingEl.root_.classList.add('mdc-typography--subtitle2', 'mdc-button--dense', 'add--assignee-icon', 'attachment-selector-label')
          div.appendChild(chooseExistingEl.root_)


          div.classList.add('selector--margin')
          chooseExistingEl.root_.onclick = function (evt) {
            valueField.dataset.primary = ''
            insertInputsIntoActivity(data)
            history.replaceState(['updateCreateActivity', data], null, null)

            selectorUI({
              record: data,
              store: 'children',
              key: key
            })

          }
        }
        if (customerAddition[data.template]) {
          if (key === 'Customer') {

            if(data.hasOwnProperty('create')) {
              if(data.attachment.Customer.value) return;
            }
           
            const createNew = new Button('Create New')
            createNew.raised();
            createNew.shaped();
            const createNewEl = createNew.getButton();
            createNewEl.root_.classList.add('mdc-typography--subtitle2', 'mdc-button--dense', 'create-new-customer-btn')

            createNewEl.root_.onclick = function () {
              this.classList.add("hidden")
            
              if (document.querySelector('.customer-form')) {
                document.querySelector('.customer-form').remove();
              }
              div.appendChild(addNewCustomer(data))
            }
            div.appendChild(createNewEl.root_)
          }
        }
      });

    }

    const hr = document.createElement('hr')
    hr.className = 'attachment--divider'
    if (data.attachment[key].type === 'HH:MM') {

      document.querySelector('.HHMM--group').appendChild(div)
      document.querySelector('.HHMM--group').appendChild(hr)
    } else if (key === 'Name') {
      document.querySelector('.Name--group').appendChild(div)
      document.querySelector('.Name--group').appendChild(hr)
    } else if (!availTypes.hasOwnProperty(data.attachment[key].type)) {
      document.querySelector('.Template--group').appendChild(div)
      document.querySelector('.Template--group').appendChild(hr)
    } else {
      document.querySelector(`.${data.attachment[key].type}--group`).appendChild(div)
      document.querySelector(`.${data.attachment[key].type}--group`).appendChild(hr)
    }
  })
}



function createAssigneeList(record, db) {
  const parent = document.getElementById('assignees--list')
  const labelAdd = createElement('li', {
    className: 'mdc-list-item label--text add--assignee-loader',
    textContent: 'Assignees'
  })

  if (record.canEdit) {

    const labelButton = createElement('span', {
      className: 'mdc-list-item__meta'
    })

    const fabAssignee = new Fab('person_add')
    const addButton = fabAssignee.getButton();
    addButton.root_.classList.add('add--assignee-icon');

    addButton.root_.onclick = function (evt) {
      insertInputsIntoActivity(record)
      history.replaceState(['updateCreateActivity', record], null, null)
      selectorUI({
        record: record,
        store: 'users',
      })
    }
    labelButton.appendChild(addButton.root_)
    labelAdd.appendChild(labelButton)
  }

  parent.appendChild(labelAdd)


  record.assignees.forEach(function (number) {
    getUserRecord(db, number).then(function (record) {
      parent.appendChild(createSimpleAssigneeLi(record))
    })
  })
}



function createSimpleAssigneeLi(userRecord, metaType) {
  const assigneeLi = createElement('li', {
    className: 'mdc-list-item'
  })
  if (!userRecord) return assigneeLi

  const dataObject = createElement('object', {
    className: 'mdc-list-item__graphic',
    data: userRecord.photoURL || './img/empty-user.jpg',
    type: 'image/jpeg'
  })
  const photoGraphic = createElement('img', {
    className: 'empty-user-assignee',
    src: './img/empty-user.jpg'
  })
  dataObject.appendChild(photoGraphic)


  const assigneeListText = createElement('span', {
    className: 'mdc-list-item_text'
  })
  const name = createElement('span', {
    className: 'mdc-list-item__primary-text'
  })
  const number = createElement('span', {
    className: 'mdc-list-item__secondary-text'
  })

  if (!userRecord.displayName) {
    name.textContent = userRecord.mobile
  } else {
    name.textContent = userRecord.displayName
    number.textContent = userRecord.mobile
  }

  assigneeListText.appendChild(name)
  assigneeListText.appendChild(number)


  assigneeLi.appendChild(dataObject)
  assigneeLi.appendChild(assigneeListText)
  if (metaType) {
    assigneeLi.setAttribute("role", "checkbox")
    assigneeLi.appendChild(metaType.root_);
  }
  return assigneeLi
}




function checkRadioInput(inherit, value) {
  document.getElementById('selector-submit-send').textContent = 'SELECT';

  [...document.querySelectorAll('.radio-selected')].forEach(function (input) {
    input.classList.remove('radio-selected');
  });
  const parent = inherit
  if (parent) {

    const radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'))
    radio['root_'].classList.add('radio-selected')

    document.getElementById('selector-submit-send').dataset.type = ''
    radio.value = JSON.stringify(value)
  }
}


function setFilePath(str, key, show) {

  if (document.querySelector('.image--list-li')) {
    document.getElementById('attachment-picture').data = `data:image/jpg;base64,${str}`
    document.getElementById('attachment-picture').dataset.value = `data:image/jpg;base64,${str}`

    if (!document.getElementById('send-activity').dataset.progress) {
      document.getElementById('send-activity').classList.remove('hidden')
    }
    return
  }

  const li = document.createElement('li')
  li.className = 'mdc-image-list__item image--list-li'

  const container = document.createElement('div')

  const dataObject = document.createElement('object');
  dataObject.data = str || './img/placeholder.png';
  dataObject.type = 'image/jpeg';
  dataObject.id = 'attachment-picture';
  dataObject.dataset.photoKey = key;
  dataObject.className = 'profile-container--main mdc-image-list__image';

  const img = document.createElement('img')
  img.src = './img/placeholder.png';
  img.className = 'profile-container--main mdc-image-list__image'

  if (!str) {
    dataObject.data = './img/placeholder.png'
    dataObject.dataset.value = ''
  } else {
    dataObject.src = str;
    dataObject.dataset.value = str
  }
  dataObject.appendChild(img);

  dataObject.onclick = function () {
    openImage(this.data)
  }
  container.appendChild(dataObject)
  li.appendChild(container)

  const textCont = document.createElement('div')
  textCont.className = 'mdc-image-list__supporting'

  const span = document.createElement('span')
  span.textContent = key
  span.className = 'mdc-image-list__label'
  span.id = 'label--image'
  textCont.appendChild(span)
  li.appendChild(textCont)
  if (show) return li
}



function readCameraFile() {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.startCamera()
    } catch (e) {
      sendExceptionObject(e, 'CATCH Type 11: AndroidInterface.startCamera at readCameraFile', []);
    }
  } else {
    webkit.messageHandlers.takeImageForAttachment.postMessage("convert image to base 64")
  }
}

function openImage(imageSrc) {

  if (!imageSrc) return;
  const largeImage = document.createElement('img')
  largeImage.src = imageSrc;
  largeImage.style.width = '100%';

  document.getElementById('dialog-container').innerHTML = dialog({
    id: 'viewImage--dialog-component',
    headerText: 'Photo',
    content: largeImage,
    showCancel: true,
    showAccept: true
  }).outerHTML
  const dialogEl = document.querySelector('#viewImage--dialog-component')
  const imageDialog = new mdc.dialog.MDCDialog.attachTo(dialogEl);
  imageDialog.listen('MDCDialog:accept', function (evt) {
    dialogEl.remove()
  })
  imageDialog.listen('MDCDialog:cancel', function (evt) {
    dialogEl.remove()
  })
  imageDialog.show()
}

function createActivityCancellation(record) {
  if (!record.canEdit) return
  const StautsCont = document.createElement('div')
  StautsCont.className = 'status--cancel-cont'

  if (record.hasOwnProperty('create')) return


  if (record.status === 'CANCELLED') {

    StautsCont.appendChild(createSimpleLi('undo-deleted', {
      text: 'Cancelled',
      id: record.activityId
    }))

    document.querySelector('.update-create--activity').appendChild(StautsCont);

    const undo = new mdc.ripple.MDCRipple.attachTo(document.querySelector('.undo-deleted'))


    return
  }
  if (record.status !== 'CANCELLED') {

    StautsCont.appendChild(createSimpleLi('delete', {
      text: 'CANCEL'
    }))
    document.querySelector('.update-create--activity').appendChild(StautsCont);
    if (!record.canEdit) return;

    document.querySelector('.delete-activity').addEventListener('click', function (evt) {
      const span = document.createElement('span')
      span.className = 'mdc-typography--body1'
      span.textContent = 'Are you sure you want to delete this activity ? '
      document.getElementById('dialog-container').innerHTML = dialog({
        id: 'cancel-alert',
        headerText: `${record.activityName} will be deleted`,
        showCancel: true,
        showAccept: true,
        content: span
      }).outerHTML
      const dialogEl = document.querySelector('#cancel-alert')
      var cancelDialog = new mdc.dialog.MDCDialog(dialogEl);

      cancelDialog.lastFocusedTarget = evt.target;
      cancelDialog.show();
      cancelDialog.listen('MDCDialog:cancel', function () {
        dialogEl.remove()
      })
      cancelDialog.listen('MDCDialog:accept', function () {
        if (!isLocationStatusWorking()) return;
        document.querySelector('.delete-activity').style.display = 'none';
        document.querySelector('.status--cancel-cont li').appendChild(loader('cancel-loader'))
        requestCreator('statusChange', {
          activityId: record.activityId,
          status: 'CANCELLED',
        })
        dialogEl.remove()
      })
    })
  }
}


function concatDateWithTime(date, time) {
  const dateConcat = moment(date + " " + time)
  return moment(dateConcat).valueOf()
}

function insertInputsIntoActivity(record, send) {
  const allStringTypes = document.querySelectorAll('.string');

  for (var i = 0; i < allStringTypes.length; i++) {
    let inputValue = allStringTypes[i].querySelector('.mdc-text-field__input').value

    if (allStringTypes[i].querySelector('.mdc-text-field__input').required && checkSpacesInString(inputValue)) {
      if (send) {
        snacks('Please provide an input for the field “Name” ')
      }
      return;
    }

    record.attachment[convertIdToKey(allStringTypes[i].id)].value = inputValue
  }

  const allNumberTypes = document.querySelectorAll('.number')
  for (var i = 0; i < allNumberTypes.length; i++) {
    let inputValue = Number(allNumberTypes[i].querySelector('.mdc-text-field__input').value)
    record.attachment[convertIdToKey(allNumberTypes[i].id)].value = inputValue
  }

  const allEmailTypes = document.querySelectorAll('.email')
  for (var i = 0; i < allEmailTypes.length; i++) {
    let inputValue = allEmailTypes[i].querySelector('.mdc-text-field__input').value
    record.attachment[convertIdToKey(allEmailTypes[i].id)].value = inputValue
  }

  const allTimeTypes = document.querySelectorAll('.HHMM')
  for (var i = 0; i < allTimeTypes.length; i++) {
    let inputValue = allTimeTypes[i].querySelector('.mdc-text-field__input').value
    record.attachment[convertIdToKey(allTimeTypes[i].id)].value = inputValue
  }

  const imagesInAttachments = document.querySelectorAll('.image-preview--attachment  object')
  for (let i = 0; i < imagesInAttachments.length; i++) {
    record.attachment[convertKeyToId(imagesInAttachments[i].dataset.photoKey)].value = imagesInAttachments[i].dataset.value
  }


  let sd;
  let st;
  let ed;
  let et

  for (var i = 1; i < record.schedule.length + 1; i++) {

    sd = getInputText('.start--date' + i).value
    st = getInputText('.start--time' + i).value
    ed = getInputText('.end--date' + i).value
    et = getInputText('.end--time' + i).value
    if (!concatDateWithTime(sd, st) && !concatDateWithTime(ed, et)) {
      record.schedule[i - 1].startTime = concatDateWithTime(sd, st) || ''
      record.schedule[i - 1].endTime = concatDateWithTime(ed, et) || ''

    } else {


      if (sd && !st) {
        snacks('Please Select a Start Time')
        return;
      }
      if (st && !sd) {
        snacks('Please Select a Start Date')
        return
      }
      if (concatDateWithTime(sd, st) && !ed) {
        snacks('Please Select a End Date')
        return;
      }
      if (concatDateWithTime(sd, st) && !et) {
        snacks('Please Select a End Time')
        return;
      }


      if (concatDateWithTime(ed, et) < concatDateWithTime(sd, st)) {
        snacks('The End Date and Time should be greater or equal to the start time')
        return;
      }
      record.schedule[i - 1].startTime = concatDateWithTime(sd, st) || ''
      record.schedule[i - 1].endTime = concatDateWithTime(ed, et) || ''
    }

  }

  if (record.template === 'check-in') {

    document.querySelectorAll('.mdc-radio.checkin').forEach(function (el) {
      const radio = new mdc.radio.MDCRadio(el);
      if (radio.checked) {
        const venueData = JSON.parse(el.value);
        record.venue[0].geopoint = {
          latitude: venueData.latitude,
          longitude: venueData.longitude
        }
        record.venue[0].location = venueData.location
        record.venue[0].address = venueData.address
      }
    });
    if (!record.venue[0].location || !record.venue[0].address) {
      record.venue[0].geopoint = {
        latitude: '',
        longitude: ''
      }
    }
  } else {

    for (var i = 0; i < record.venue.length; i++) {
      record.venue[i].geopoint = {
        latitude: record.venue[i].geopoint['latitude'] || "",
        longitude: record.venue[i].geopoint['longitude'] || ""
      }
      if (record.venue[i].hasOwnProperty('showIcon')) {
        delete record.venue[i].showIcon
      }
    }
  }

  const requiredObject = {
    venue: record.venue,
    schedule: record.schedule,
    attachment: record.attachment
  }

  if (send) {
    sendUpdateReq(requiredObject, record)
  }

}

function sendUpdateReq(requiredObject, record) {

  if (!record.hasOwnProperty('create')) {
    requiredObject.activityId = record.activityId
    document.querySelector('header').appendChild(progressBar())
    document.querySelector('#send-activity').classList.add('hidden')
    requestCreator('update', requiredObject);
    return
  }

  requiredObject.office = record.office
  requiredObject.template = record.template
  requiredObject.share = record.assignees

  document.querySelector('header').appendChild(progressBar())
  document.querySelector('#send-activity').classList.add('hidden')
  requestCreator('create', requiredObject)
}

function checkSpacesInString(input) {
  if (!input.replace(/\s/g, '').length) return true
  return false
}

function formAddressComponent(place) {
  var address = '';
  if (place.address_components) {
    address = [
      (place.address_components[0] && place.address_components[0].short_name || ''),
      (place.address_components[1] && place.address_components[1].short_name || ''),
      (place.address_components[2] && place.address_components[2].short_name || '')
    ].join(' ');
  }
  return address
}


function getSubscription(office, template) {
  return new Promise(function (resolve) {
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['subscriptions']);
      const subscription = tx.objectStore('subscriptions')
      const officeTemplateCombo = subscription.index('officeTemplate')
      const range = IDBKeyRange.only([office, template])
      let record;
      officeTemplateCombo.get(range).onsuccess = function (event) {
        record = event.target.result
      }
      tx.oncomplete = function () {
        resolve(record)
      }
    }
  })
}

function addNewCustomer(data) {
  const container = createElement('div', {
    className: 'customer-form'
  });

  const locationErrorText = createElement('span', {
    className: 'customer-location-error mdc-typography--subtitle1'
  });

  const name = new InputField({
    id: 'customer-name',
    labelText: 'Customer Name',
    className: 'filled-background mdc-text-field--fullwidth mdc-text-field',

  })
  const address = new InputField({
    id: 'customer-name',
    labelText: 'Customer Address',
    className: 'mdc-text-field--fullwidth filled-background mdc-text-field'
  })
  const nameField = name.withoutLabel();
  nameField.input_.placeholder = 'Customer Name'
  nameField.value = data.attachment.Customer.value;
  const addressField = address.withoutLabel();
  addressField['input_'].placeholder = 'Customer Address'
  container.appendChild(nameField['root_'])
  container.appendChild(addressField['root_'])

  autocomplete = new google.maps.places.Autocomplete(addressField['input_'], {
    componentRestrictions: {
      country: "in"
    }
  });
  const mapDom = createElement('div', {
    id: 'customer-address-map'
  })
  customerLocationAutoComplete(mapDom, container, addressField);

  getLocation().then(function (location) {
    const modLocation = {
      lat: location.latitude,
      lng: location.longitude
    }
    geocodePosition(modLocation, addressField, location)
    const map = new AppendMap(modLocation, mapDom, 18)
    const marker = map.getMarker({
      draggable: true
    });
    google.maps.event.addListener(marker, 'dragend', function () {
      geocodePosition(marker.getPosition(), addressField);
    });
  }).catch(function (error) {
    mapDom.style.minHeight = '0px';
    container.style.minHeight = '0px';
    locationErrorText.textContent = 'Failed to detect your current Location. Search For A new Location or choose existing'
  })

  container.appendChild(mapDom);
  container.appendChild(locationErrorText);
  return container;
}

function customerLocationAutoComplete(el, container, addressField) {
  autocomplete.addListener('place_changed', function () {
    let place = autocomplete.getPlace();
    const latlng = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }
    const map = new AppendMap(latlng, el, 18);
    const marker = map.getMarker({
      draggable: true
    });
    el.style.minHeight = '400px'
    container.style.minHeight = '400px'
    google.maps.event.addListener(marker, 'dragend', function () {
      geocodePosition(marker.getPosition(), addressField);
    });
  });
}

function geocodePosition(pos, addressField, currentLocation) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    latLng: pos
  }, function (responses) {
    if (responses && responses.length > 0) {
      if (!currentLocation || responses.length == 1) {
        addressField.value = responses[0].formatted_address
        return;
      }
      const data = responses.slice(0, 2);

      let rawDistances = []
      data.forEach(function (value) {

        rawDistances.push({
          distance: calculateDistanceBetweenTwoPoints(currentLocation, {
            latitude: value.geometry.location.lat(),
            longitude: value.geometry.location.lng()
          }),
          address: value.formatted_address
        })
      })
      const nearest = rawDistances.sort(function (a, b) {
        return a.distance - b.distance
      })
      addressField.value = nearest[0].address



    } else {
      let locationText = document.querySelector('.customer-location-error')      
      if (locationText) {
        locationText.textContent = 'Failed To Detect This Location, Please Try Again'
      }
    }
  });
}