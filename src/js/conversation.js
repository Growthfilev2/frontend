function conversation(id, pushState) {
  window.removeEventListener('scroll', handleScroll, false)
  checkIfRecordExists('activity', id).then(function (id) {
    if (id) {
      if (pushState) {
        history.pushState(['conversation', id], null, null)
      }
      fetchAddendumForComment(id)
    } else {
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

  const inputField = document.createElement('div')
  inputField.className = 'input--text-padding mdc-text-field mdc-text-field--dense'
  inputField.id = 'write--comment'
  inputField.style.width = '100%';
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input comment-field mdc-elevation--z4'
  input.type = 'text'

  inputField.appendChild(input)

  commentCont.appendChild(inputField)


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

        appendMap(loc, mapDom, {
          zoom: 16,
          center: location,
          disableDefaultUI: true,

        });
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


function appendMap(location, el, options) {

  const map = new google.maps.Map(el, options);

  var customControlDiv = document.createElement('div');
  var customControl = new MapsCustomControl(customControlDiv, map, location.lat, location.lng);
  customControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);

  const marker = new google.maps.Marker({
    position: location,
    map: map
  });
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

function fillUsersInSelector(data) {
  const ul = document.getElementById('data-list--container')
  const recordAssignees = data.record.assignees

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['users']);
    const store = transaction.objectStore('users')
    document.querySelector('.selector-send').classList.remove('hidden');
    const btn = document.getElementById('selector-submit-send')
    btn.textContent = 'Add New Number';
    btn.dataset.type = 'add-number'
    let count = 0;
    let alreadyPresent = {}

    recordAssignees.forEach(function (assignee) {
      if (typeof assignee === 'string') {
        alreadyPresent[assignee] = true;
      } else {
        alreadyPresent[assignee.phoneNumber] = true
      }
    })
    alreadyPresent[firebase.auth().currentUser.phoneNumber] = true

    store.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return

      if (data.attachment.present) {
        count++
        ul.appendChild(createSimpleAssigneeLi(cursor.value, true, false))
      } else {
        if (!alreadyPresent.hasOwnProperty(cursor.value.mobile)) {
          count++
          ul.appendChild(createSimpleAssigneeLi(cursor.value, true, true))
        }
      }
      cursor.continue()
    }

    transaction.oncomplete = function () {
      if (!count) {
        ul.appendChild(noSelectorResult('No Contact Found'));
        document.getElementById('users-selector-search').style.display = 'none';
      }
      btn.onclick = function () {
        if (btn.dataset.type === 'add-number') {
          document.getElementById('users-selector-search').style.display = 'none';
          removeChildNodes(ul)
          btn.remove();
          addNewNumber(data)
          return
        }

        if (data.attachment.present) {
          const selector = document.querySelector('.mdc-radio.radio-selected');
          if (!selector) {
            document.getElementById('selector-warning').textContent = '* Please Select A Contact'
            return
          }
          const radio = new mdc.radio.MDCRadio(selector)
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: JSON.parse(radio.value)
          }).then(function (activity) {

            updateCreateActivity(activity, true)
          }).catch(handleError)
          return;
        }

        if (data.record.hasOwnProperty('create')) {
          resetSelectedContacts().then(function (selectedPeople) {
            if (!selectedPeople.length) {
              document.getElementById('selector-warning').textContent = '* Please Select A Contact'
              return
            }

            updateDomFromIDB(data.record, {
              hash: 'addOnlyAssignees',
            }, {
              primary: selectedPeople
            }).then(function (activity) {
              document.body.classList.remove('mdc-dialog-scroll-lock');
              updateCreateActivity(activity, true)
            }).catch(handleError)
          })
          return
        }
        if (isLocationStatusWorking()) {
          shareReq(data)
        }
      }


      const selectedBoxes = document.querySelectorAll('[data-selected="true"]');
      selectedBoxes.forEach(function (box) {
        if (box) {
          const mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
          mdcBox.checked = true
          box.children[1].style.animation = 'none'
          box.children[1].children[0].children[0].style.animation = 'none'
        }
      })
    }
  }

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

function shareReq(data) {

  resetSelectedContacts().then(function (people) {
    const reqBody = {
      'activityId': data.record.activityId,
      'share': people
    }
    document.querySelector('header').appendChild(progressBar())

    requestCreator('share', reqBody)
  })
}

function addNewNumber(data) {
  const container = document.createElement('div')
  container.className = 'custom-number--container'


  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  input.id = 'number-field'
  input.type = 'number'
  input.setAttribute('maxlength', '10')
  input.setAttribute('size', '10')
  input.required = true
  input.onkeypress = function (event) {
    return event.charCode >= 48 && event.charCode <= 57
  }

  input.oninput = function () {
    if (this.value.length > this.maxLength) {
      this.value = this.value.slice(0, this.maxLength)

    } else if (this.value.length === this.maxLength) {
      document.querySelector('.message-field').classList.remove('error-message')
      this.classList.add('valid-input')
      document.querySelector('.message-field').textContent = ''
      document.getElementById('new-contact').disabled = false

    } else {
      document.querySelector('.message-field').classList.add('error-message')
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number'
      document.getElementById('new-contact').disabled = true
    }

  }


  const createButton = document.createElement('button')
  createButton.className = 'mdc-button'
  createButton.textContent = 'Add Contact'
  createButton.id = 'new-contact'

  createButton.onclick = function () {
    const number = document.getElementById('number-field').value

    const formattedNumber = formatNumber(number)
    if (checkNumber(formattedNumber)) {

      numberNotExist(formattedNumber).then(function (exist) {
        if (exist) {
          document.getElementById('new-contact').disabled = true
          document.querySelector('.message-field').classList.add('error-message')
          document.querySelector('.message-field').textContent = '* Contact already exist'
          return
        }

        if (data.attachment.present) {
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: formattedNumber
          }).then(function (activity) {
            console.log(activity);
            updateCreateActivity(activity, true)
          }).catch(handleError)
          return
        }

        if (data.record.hasOwnProperty('create')) {
          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees',
          }, {
            primary: [formattedNumber]
          }).then(function (activity) {

            updateCreateActivity(activity, true)
          }).catch(handleError)
          return
        }
        if (isLocationStatusWorking()) {

          newNumberReq(data, formattedNumber)
        }
      })

    } else {
      document.querySelector('.message-field').classList.add('error-message')
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number'
      document.getElementById('new-contact').disabled = true

    }

  }

  const message = document.createElement('p')
  message.className = 'mdc-typography--subtitle2 message-field'
  message.textContent = 'Enter new phone contact without country code'
  message.id = 'helper-message'

  container.appendChild(input)
  container.appendChild(message)
  container.appendChild(createButton)
  document.querySelector('#data-list--container').appendChild(container)
  const getNumber = new mdc.ripple.MDCRipple.attachTo(document.getElementById('new-contact'))

}

function newNumberReq(data, formattedNumber) {
  document.querySelector('header').appendChild(progressBar())

  requestCreator('share', {
    activityId: data.record.activityId,
    'share': [formattedNumber]
  })
}

function numberNotExist(number) {
  return new Promise(function (resolve) {

    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      const store = db.transaction('users').objectStore('users')
      store.get(number).onsuccess = function (event) {
        const record = event.target.result
        if (record) {

          resolve(true)
        } else {
          resolve(false)
        }
      }
    }
  })
}

function resetSelectedContacts() {
  return new Promise(function (resolve) {
    const selectedUsers = []
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      const objectStoreTx = db.transaction(['users'], 'readwrite')
      const objectStore = objectStoreTx.objectStore('users')
      objectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {

          resolve(selectedUsers)
          return
        }
        if (cursor.value.isSelected) {

          selectedUsers.push(cursor.value.mobile)
          cursor.value.isSelected = false
          objectStore.put(cursor.value)
        }
        cursor.continue()
      }

    }
  })
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

function hasAnyValueInChildren(office, template, status) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  return new Promise(function (resolve) {

    req.onsuccess = function () {
      const db = req.result
      const childrenStore = db.transaction('children').objectStore('children')
      let count = 0;
      let result = false
      childrenStore.openCursor().onsuccess = function (event) {
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
  return new Promise(function (resolve, reject) {
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result;
      let thisActivity = activityRecord;

      if (attr.hash === 'venue') {
        thisActivity = updateVenue(thisActivity, attr, data);
        updateLocalRecord(thisActivity, db).then(function (message) {
          resolve(thisActivity)
        }).catch(function (error) {
          console.log(error)
          reject(error)
        })
        return
      }
      //for create
      if (attr.hash === 'addOnlyAssignees') {
        if (!data.primary.length) return
        data.primary.forEach(function (number) {
          if (thisActivity.assignees.indexOf(number) > -1) return
          thisActivity.assignees.push(number)
        })
        resolve(thisActivity);
        return
      }

      if (attr.hash === 'weekday') return
      if (!attr.hasOwnProperty('key')) return

      thisActivity.attachment[attr.key].value = data.primary;

      updateLocalRecord(thisActivity, db).then(function (message) {
        resolve(thisActivity);
      }).catch(function (error) {
        reject(error)
      })
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

function updateVenue(updatedActivity, attr, data) {

  updatedActivity.venue.forEach(function (field) {
    if (field.venueDescriptor === attr.key) {
      field.location = data.primary
      field.address = data.secondary.address
      field.geopoint['_latitude'] = data.secondary.geopoint['_latitude']
      field.geopoint['_longitude'] = data.secondary.geopoint['_longitude']
    }
  })
  return updatedActivity
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
    createAssigneeList(record, true, db)
    createActivityCancellation(record);
    window.scrollTo(0, 0)


    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function () {
        if (isLocationStatusWorking()) {

          this.dataset.progress = true
          sendActivity(record)
        }
      })
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

    if (document.querySelector('.mdc-select')) {
      const select = new mdc.select.MDCSelect(document.querySelector('.mdc-select'));
      select.listen('change', () => {
        updateDomFromIDB(record, {
          hash: 'weekday',
          key: select['root_'].dataset.value
        }, {
          primary: select.value
        }).then(function (message) {
          if (!document.getElementById('send-activity').dataset.progress) {

            if (document.getElementById('send-activity').classList.contains('hidden')) {
              document.getElementById('send-activity').classList.remove('hidden')
            }
          }
        }).catch(handleError)
      });
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
  if (key === 'children') {
    const metaInput = document.createElement('span')
    metaInput.className = 'mdc-list-item__meta'
    metaInput.appendChild(createRadioInput())


    listItem.textContent = data
    listItem.appendChild(metaInput)
    listItem.onclick = function () {

      checkRadioInput(this, {
        name: data
      })
    }
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
    undo.className = 'mdc-button mdc-ripple-upgraded mdc-list-item__meta undo-deleted'
    undo.textContent = 'Undo'
    undo.onclick = function () {
      if (isLocationStatusWorking()) {
        debugger
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

    textSpan.onclick = function (evt) {
      if (!hasMapsApiLoaded()) return;
      if (!venue.geopoint['_latitude']) return;
      if (!venue.geopoint['_longitude']) return;

      showMap = !showMap

      const loc = {
        lat: venue.geopoint['_latitude'],
        lng: venue.geopoint['_longitude']
      }
      const mapParent = document.querySelector(`.map-detail.${convertKeyToId(venue.venueDescriptor)}`)
      appendMap(loc, mapParent, {
        zoom: 16,
        center: location,
        disableDefaultUI: true
      })
      if (showMap) {
        mapParent.style.height = '200px';
      } else {
        mapParent.style.height = '0px';
      }
    }

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true')
      selectorIcon.appendChild(addLocation)
      addLocation.onclick = function (evt) {
        insertInputsIntoActivity(record)
        history.replaceState(['updateCreateActivity', record], null, null)

        selectorUI({
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

    const label = document.createElement('span')
    label.className = 'label--text'
    label.textContent = key

    if (key === 'Name' || key === 'Number') {
      div.appendChild(label)
      const required = true
      div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key, required))
    } else {
      if (data.attachment[key].type === 'string') {
        console.log(data.canEdit)
        div.appendChild(label)
        div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key))
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
      div.appendChild(createNumberInput(data.attachment[key].value, canEdit))
    }

    if (data.attachment[key].type === 'email') {
      div.appendChild(label)
      div.appendChild(createEmailInput(data.attachment[key].value, data.canEdit))
    }

    if (data.attachment[key].type === 'phoneNumber') {
      div.classList.add('selector--margin')
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
        addButton.onclick = function (evt) {
          insertInputsIntoActivity(data)
          history.replaceState(['updateCreateActivity', data], null, null)
          selectorUI({
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
      div.appendChild(createSelectMenu(key, data.attachment[key].value, data.canEdit))

    }

    if (data.attachment[key].type === 'base64') {
      const addCamera = document.createElement('label')
      addCamera.className = 'mdc-fab attachment-selector-label add--assignee-icon'
      addCamera.id = 'start-camera'

      const span = document.createElement('span')
      span.className = 'mdc-fab__icon material-icons'
      span.textContent = 'add_a_photo'
      addCamera.appendChild(span)

      const imagePreview = document.createElement('ul')
      imagePreview.className = 'image-preview--attachment mdc-image-list standard-image-list mdc-image-list--with-text-protection'

      imagePreview.appendChild(setFilePath(data.attachment[key].value, key, true))


      div.appendChild(imagePreview)


      if (data.canEdit) {

        div.appendChild(addCamera)
        div.appendChild(imagePreview);
        addCamera.onclick = function () {
          readCameraFile()
        }
      }
    }


    if (!availTypes.hasOwnProperty(data.attachment[key].type)) {


      if (!data.canEdit) {

        createElement('span', {
          className: 'data--value-list',
          textContent: key
        })

      }
      const customerSelectionTemplates = {
        'tour plan': true
      }

      if (!customerSelectionTemplates[data.template]) return;
      hasAnyValueInChildren(data.office, data.attachment[key].type, data.status).then(function (hasValue) {
        const chooseExisting = createElement('button', {
          className: 'mdc-button shaped',
          textContent: 'Choose Existing'
        })
        new mdc.ripple.MDCRipple(chooseExisting)

        chooseExisting.onclick = function (evt) {

          insertInputsIntoActivity(data)
          history.replaceState(['updateCreateActivity', data], null, null);
          selectorUI({
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
        div.appendChild(chooseExisting)
      })
      const createNew = createElement('button', {
        className: 'mdc-button shaped',
        textContent: 'Create New'
      })
      new mdc.ripple.MDCRipple(createNew)
      createNew.onclick = function () {
        getSubscription(data.office, 'customer').then(function (record) {
          getLocation().then(function (location) {
            div.appendChild(createElement('span', {
              className: 'label--text data--value-list',
              textContent: 'Name'
            }))
            div.appendChild(createSimpleInput('', true, '', 'Name', true))
            div.appendChild(createElement('span', {
              className: 'label--text data--value-list',
              textContent: record.venue[0]
            }))

            checkMapStoreForNearByLocation(data.office, location).then(function (nearestLocations) {
              div.appendChild(createSimpleInput(nearestLocations[0].location, true, '', record.venue[0], true))
              const modLocation = {
                lat: location.latitude,
                lng: location.longitude
              }
              const mapDom = createElement('div', {
                id: 'customer-address'
              })
              appendMap(modLocation, mapDom, {
                zoom: 16,
                center: location,
                disableDefaultUI: true,
                draggable: true,
                animation: google.maps.Animation.DROP,
              })
              mapDom.style.height = '200px';
              autocomplete.addListener('place_changed', function () {
                let place = autocomplete.getPlace();
                modLocation.lat = place.geometry.location.lat()
                modLocation.lng = place.geometry.location.lng()
                appendMap(modLocation, mapDom, {
                  zoom: 16,
                  center: location,
                  disableDefaultUI: true,
                  draggable: true,
                  animation: google.maps.Animation.DROP,
                })
              })

              google.maps.event.addListener(marker, 'dragend',
                function (marker) {

                  var latLng = marker.latLng;
                  currentLatitude = latLng.lat();
                  currentLongitude = latLng.lng();

                });
              div.appendChild(mapDom)
            })
          }).catch(function (error) {
            div.appendChild(createElement('span', {
              className: 'info-attachment',
              textContent: 'Failed to Detect Your Current Location. Choose From Exisintg Customer'
            }))
          })
        })
      }
      div.appendChild(createNew)
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



function createAssigneeList(record, showLabel, db) {
  const parent = document.getElementById('assignees--list')
  if (showLabel) {

    const labelAdd = document.createElement('li')
    labelAdd.className = 'mdc-list-item label--text add--assignee-loader'
    labelAdd.textContent = 'Assignees'
    const labelButton = document.createElement('span')
    labelButton.className = 'mdc-list-item__meta'
    const addButton = document.createElement('div')
    addButton.className = 'mdc-fab add--assignee-icon'

    addButton.onclick = function (evt) {
      insertInputsIntoActivity(record)
      history.replaceState(['updateCreateActivity', record], null, null)
      selectorUI({
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


    if (record.canEdit) {
      labelAdd.appendChild(labelButton)
    }

    parent.appendChild(labelAdd)
  }

  record.assignees.forEach(function (number) {
    getUserRecord(db, number).then(function (record) {
      parent.appendChild(createSimpleAssigneeLi(record))
    })
  })
}



function createSimpleAssigneeLi(userRecord, showMetaInput, isCheckbox) {
  const assigneeLi = document.createElement('li')
  assigneeLi.classList.add('mdc-list-item', 'assignee-li')
  if (!userRecord) return assigneeLi
  assigneeLi.dataset.value = userRecord.mobile
  const dataObject = document.createElement('object');
  dataObject.data = userRecord.photoURL || './img/empty-user.jpg';
  dataObject.type = 'image/jpeg';
  dataObject.className = 'mdc-list-item__graphic';

  const photoGraphic = document.createElement('img')
  photoGraphic.src = './img/empty-user.jpg'
  photoGraphic.className = 'empty-user-assignee'
  dataObject.appendChild(photoGraphic)
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
    if (isCheckbox) {
      metaInput.appendChild(createCheckBox(userRecord))
    } else {
      metaInput.appendChild(createRadioInput())
      assigneeLi.onclick = function () {
        checkRadioInput(this, assigneeLi.dataset.value)
      }
    }
  }
  assigneeLi.appendChild(dataObject)
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

function createCheckBox(userRecord) {

  const checkbox = document.createElement('div')
  checkbox.className = 'mdc-checkbox status-check'
  checkbox.dataset.selected = userRecord.isSelected

  const input = document.createElement("input")
  input.className = 'mdc-checkbox__native-control'
  input.type = 'checkbox'
  input.onclick = function (evt) {

    checkCheckboxInput(evt, userRecord)
  }
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

  return checkbox
}

function checkCheckboxInput(evt, record) {

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const objectStore = db.transaction('users', 'readwrite').objectStore('users')
    if (record.hasOwnProperty('isSelected') && record.isSelected) {
      evt.target.parentNode.dataset.selected = false
      record.isSelected = false

    } else {
      evt.target.parentNode.dataset.selected = true
      record.isSelected = true

    }
    objectStore.put(record)
    if (document.querySelectorAll('[data-selected="true"]').length) {
      document.querySelector('.selector-send').dataset.type = ''
      document.querySelector('.selector-send').textContent = 'SELECT'
    }
  }
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

function sendActivity(record) {

  if (record.hasOwnProperty('create')) {
    insertInputsIntoActivity(record, true)
    return
  }

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function (event) {
    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    activityStore.get(record.activityId).onsuccess = function (event) {
      const record = event.target.result
      insertInputsIntoActivity(record, true)
    }
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
        latitude: record.venue[i].geopoint['_latitude'] || "",
        longitude: record.venue[i].geopoint['_longitude'] || ""
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
    requestCreator('update', requiredObject)
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

function initializeAutocompleteGoogle(autocomplete, attr) {

  autocomplete.addListener('place_changed', function () {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }
    //  document.getElementById('location--container').style.marginTop = '0px'



    const selectedAreaAttributes = {
      primary: place.name,
      secondary: {
        address: formAddressComponent(place),
        geopoint: {
          '_latitude': place.geometry.location.lat(),
          '_longitude': place.geometry.location.lng()
        }
      }
    }
    updateDomFromIDB(attr.record, {
      hash: 'venue',
      key: attr.key
    }, selectedAreaAttributes).then(function (activity) {

      updateCreateActivity(activity, true);
    }).catch(handleError)
  })
}

function createSimpleInput(value, canEdit, withIcon, key, required) {

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
  input.className = 'mdc-text-field__input input--value--update'
  input.style.paddingTop = '0px'
  input.value = value
  input.required = required

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  if (withIcon) {

    textField.id = 'search--bar--field'
    input.id = 'search--bar-selector'
    textField.classList.add('field-input')

  }
  textField.appendChild(input)
  textField.appendChild(ripple)
  if (textField) {
    const jsTField = new mdc.textField.MDCTextField.attachTo(textField)
  }
  return textField
}

function createNumberInput(value, canEdit) {
  const textField = document.createElement('div')
  textField.className = 'mdc-text-field data--value-list'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-number'
  input.type = 'number'
  input.style.paddingTop = '0px'
  input.value = value
  if (!canEdit) {
    input.setAttribute('readonly', 'true')
  }
  input.setAttribute('onkeypress', "return event.charCode >= 48 && event.charCode <= 57")
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  textField.appendChild(input)
  textField.appendChild(ripple)

  return textField
}

function createEmailInput(value, canEdit) {
  if (!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    simeplText.textContent = value
    return simeplText
  }
  const textField = document.createElement('div')
  textField.className = 'mdc-text-field data--value-list'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-email'
  input.type = 'email'
  input.placeholder = 'johndoe@example.com'
  input.style.paddingTop = '0px'
  input.value = value
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  textField.appendChild(input)
  textField.appendChild(ripple)

  return textField
}

function createTimeInput(value, canEdit, attr) {
  if (!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    if (attr.type === 'date') {
      if (value) {
        simeplText.textContent = moment(value).calendar()
      } else {
        simeplText.textContent = ''
      }
    }
    return simeplText
  }

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-time'
  input.type = attr.type
  input.style.borderBottom = 'none'

  attr.type === 'date' ? input.value = moment(value).format('DD-MM-YYYY') : input.value = value

  if (attr.type === 'time') {
    textField.classList.add('data--value-list')
    input.style.width = '100%'
    input.value = value || moment("24", "HH:mm").format('HH:mm')
  };

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

function createSelectMenu(key, value, canEdit) {
  if (!canEdit) {
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
  select.style.paddingRight = '0px';
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  for (var i = 0; i < weekdays.length; i++) {
    const option = document.createElement('option')
    option.value = weekdays[i]
    option.textContent = weekdays[i]
    if (value === weekdays[i]) {
      option.setAttribute('selected', 'true')
    }

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

function createElement(tagName, attrs) {
  const el = document.createElement(tagName)
  Object.keys(attrs).forEach(function (attr) {
    el[attr] = attrs[attr]
  })
  return el;
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

function addNewCustomer(data, el) {
  const container = createElement('div', {
    className: 'customer-form'
  });
  hasAnyValueInChildren(data.office, data.template, data.status).then(function (value) {
    if (!value) return;
    const chooseExisting = createElement('button', {
      className: 'mdc-button shaped',
      textContent: 'Choose existing'
    });
    new mdc.ripple.MDCRipple(chooseExisting);
    container.appendChild(chooseExisting)
    chooseExisting.onclick = function () {
      insertInputsIntoActivity(data)
      history.replaceState(['updateCreateActivity', data], null, null);
      selectorUI({
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
  })
  const createNew = createElement('button', {
    className: 'mdc-button shaped',
    textContent: 'Create New'
  })
  new mdc.ripple.MDCRipple(createNew);

  container.appendChild(createNew);
  const locationErrorText = createElement('span',{className:'customer-location-error mdc-typography--subtitle1'});

  createNew.onclick = function () {
    container.style.height = '200px'
    const name = inputField({id:'customer-name',labelText:'Customer Name'})
    new mdc.textField.MDCTextField(name)
    container.appendChild(name)
    const address =  inputField({id:'customer-name',labelText:'Customer Address'})
    new mdc.textField.MDCTextField(address)
    container.appendChild(address)
    const mapDom = createElement('div',{id:'customer-address-map'})
    getLocation().then(function(location){
      appendMap({lat:location.latitude,lng:location.longitude},mapDom)
      container.appendChild(mapDom);
    }).catch(function(error){ 
      locationErrorText.textContent = 'Failed to detect your current Location. Please Choose from existing Customers'
    })
  }
}

function inputField(attr){
  const field = createElement('div', {
    className: 'mdc-text-field',
    id: attr.id
  })
  field.appendChild(createElement('input', {
    type: 'text',
    id: attr.id+'-input'
  }))
  field.appendChild(createElement('label', {
    className: 'mdc-floating-label mdc-floating-label--float-above',
    for: attr.id+'-input',
    textContent: attr.labelText
  }))
  field.appendChild(createElement('div',{className:'mdc-line-ripple'}))
  return field;
}