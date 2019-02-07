function conversation(id, pushState) {
  window.removeEventListener('scroll',handleScroll,false)
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
    req.onerror = function (){
      reject({message:`${req.error.message} from checkIfRecordExists`});
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
    sendCurrentViewNameToAndroid('conversation')
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
      hideSendCommentButton()
    } else {
      showSendCommentButton()
    }
  }

  document.getElementById('send-chat--input').onclick = function () {
    if(isLocationStatusWorking()){

    sendComment(id)
    }
  }
}

function sendComment(id) {
  let comment = document.querySelector('.comment-field').value;
  const reqBody = {
    'activityId': id,
    'comment': comment
  }

  requestCreator('comment', reqBody)

  document.querySelector('.comment-field').value = ''
  hideSendCommentButton()
}

function hideSendCommentButton() {
  document.getElementById('send-chat--input').classList.add('hidden')
  document.getElementById('write--comment').style.width = '100%'
  document.getElementById('write--comment').style.transition = '0.3s ease'
  document.querySelector('.status--change-cont').style.transition = '0.3s ease'
  document.querySelector('.status--change-cont').style.opacity = '1'
}

function showSendCommentButton() {
  document.getElementById('send-chat--input').classList.remove('hidden')
  document.getElementById('write--comment').style.width = '80%'
  document.querySelector('.status--change-cont').style.opacity = '0';
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
      if(isLocationStatusWorking()){
      changeStatusRequest(switchControl, record)
      }
      else {
        resetStatusConfirmation(switchControl,record);
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

      link.onclick = function (evt) {
        if (!hasMapsApiLoaded()) return
        showMap = !showMap;
        const loc = {
          lat: addendum.location['_latitude'],
          lng: addendum.location['_longitude']
        }
        maps(evt, showMap, addendum.addendumId, loc)
      }

      mapIcon.dataset.latitude = addendum.location['_latitude']
      mapIcon.dataset.longitude = addendum.location['_longitude']
      link.appendChild(mapIcon)

      const mapDom = document.createElement('div')
      mapDom.className = 'map-convo'


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

function getUserRecord(db, number) {
  return new Promise(function (resolve, reject) {
    const usersObjectStore = db.transaction('users').objectStore('users');

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

function maps(evt, show, id, location) {
  let selector = ''
  evt ? selector = document.getElementById(id).querySelector('.map-convo') : selector = document.querySelector(`.map-detail.${id}`)

  if (!show) {
    selector.style.height = '0px'
    evt ? evt.target.textContent = 'location_on' : ''
    return
  }

  if (selector.children.length !== 0) {
    selector.style.height = '200px'
    evt ? evt.target.textContent = 'arrow_drop_down' : ''
    return;
  }

  evt ? evt.target.textContent = 'arrow_drop_down' : ''

  selector.style.height = '200px'

  const map = new google.maps.Map(selector, {
    zoom: 16,
    center: location,
    disableDefaultUI: true
  });


  if (!evt) {
    var customControlDiv = document.createElement('div');
    var customControl = new MapsCustomControl(customControlDiv, map, location.lat, location.lng);
    customControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);
  }

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


  const activityObjectStore = db.transaction('activity').objectStore('activity')
  const leftDiv = document.createElement('div')

  const backDiv = document.createElement('div')
  backDiv.className = 'back-icon'
  backDiv.id = 'back-conv'
  backDiv.style.float = 'left'
  const backIcon = document.createElement('i')
  backIcon.style.marginRight = '5px'
  backIcon.className = 'material-icons back-icon--large'
  backIcon.textContent = 'arrow_back'

  backDiv.appendChild(backIcon)


  activityObjectStore.get(id).onsuccess = function (event) {

    const record = event.target.result
    getImageFromNumber(db, record.creator).then(function (uri) {
      const dataObject = document.createElement('object');
      dataObject.data = uri || './img/empty-user.jpg';
      dataObject.className = 'header--icon-creator';
      dataObject.type = 'image/jpeg';
      
      var creatorImg = document.createElement("img");
      creatorImg.src = './img/empty-user.jpg';
      dataObject.appendChild(creatorImg);
      backDiv.appendChild(dataObject);

      var primarySpan = document.createElement('div');
      primarySpan.className = 'mdc-list-item__text comment-header-primary mdc-typography--subtitle2';
      primarySpan.textContent = record.activityName;

      var secondarySpan = document.createElement('span');
      secondarySpan.className = 'mdc-list-item__secondary-text';
      secondarySpan.textContent = 'Click here to see details';

      primarySpan.appendChild(secondarySpan);

      leftDiv.appendChild(backDiv);
      leftDiv.appendChild(primarySpan);
      modifyHeader({
        id: 'app-main-header',
        left: leftDiv.outerHTML
      });

      document.getElementById('back-conv').addEventListener('click', function () {
        backNav();
      });

      document.querySelector('.comment-header-primary').addEventListener('click', function () {
        checkIfRecordExists('activity', record.activityId).then(function (id) {

          if (id) {
            updateCreateActivity(record);
          } else {
            listView();
          }
        }).catch(handleError);
      });
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
  transaction.oncomplete = function () {
  }
}

function getImageFromNumber(db, number) {
  return new Promise(function (resolve) {
    const userObjStore = db.transaction('users').objectStore('users')
    userObjStore.get(number).onsuccess = function (event) {
      const record = event.target.result
      resolve(record ? record.photoURL : './img/empty-user.jpg')
    }
  })
}

function selectorUI(evt, data) {

  sendCurrentViewNameToAndroid('selector')

  const aside = document.createElement('aside')

  aside.id = 'dialog--component'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'
  dialogSurface.appendChild(createHeader('dialog--surface-header'))

  const searchIcon = document.createElement('span')
  searchIcon.className = 'material-icons'
  searchIcon.textContent = 'search'
  searchIcon.id = 'selector--search'



  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons dialog--header-back selector--type-' + data.store
  backSpan.textContent = 'arrow_back'


  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable mdc-top-app-bar--fixed-adjust'

  const ul = document.createElement('ul')
  ul.id = 'data-list--container'
  ul.className = 'mdc-list '

  section.appendChild(ul)
  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'




  const accept = document.createElement('button');
  accept.className = 'mdc-fab mdc-dialog__footer__button mdc-dialog__footer__button--accept selector-send hidden'
  accept.type = 'button'

  const acceptIcon = document.createElement('span')
  acceptIcon.className = 'mdc-fab__icon material-icons'
  if (data.store === 'users') {
    acceptIcon.textContent = 'add'
    accept.dataset.clicktype = 'numpad'
  } else {
    acceptIcon.textContent = 'send'

  }
  accept.appendChild(acceptIcon)

  footer.appendChild(accept);



  dialogSurface.appendChild(section)
  dialogSurface.appendChild(footer)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)

  if (data.store === 'subscriptions' || data.store === 'children') {
    modifyHeader({
      id: 'dialog--surface-header',
      left: backSpan.outerHTML
    })
  } else {
    modifyHeader({
      id: 'dialog--surface-header',
      left: backSpan.outerHTML,
      right: searchIcon.outerHTML
    })
  }

  document.querySelector('.dialog--header-back').addEventListener('click', function (e) {
    if (e.target.classList.contains('selector--type-users') && e.target.dataset.state === 'users-list-back') {
      resetSelectedContacts().then(function (people) {
        handleRemoveDialogEvt(e, data)
      })
      return
    }
    removeDialog()
  })

  initializeSelectorWithData(evt, data)
}

function removeDialog() {
  const dialog = document.getElementById('dialog--component');
  if (!dialog) return;
  document.getElementById('dialog--component').remove();
  document.getElementById('growthfile').classList.remove('mdc-dialog-scroll-lock')
}

function handleRemoveDialogEvt(evt, data) {

  if (!evt) {
    return
  }
  if (evt.target.dataset.type !== 'back-list') {
    return;
  }
  resetSelectorUI(data);
  removeDialog();
}

function initializeSelectorWithData(evt, data) {
  //init dialog
  const dialog = new mdc.dialog.MDCDialog(document.querySelector('#dialog--component'))
  let activityRecord = data.record
  let selectorStore;
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    if (data.store === 'map') {
      const tx = db.transaction([data.store]);
      fillMapInSelector(db, tx, dialog, data)
    }
    if (data.store === 'subscriptions') {

      fillSubscriptionInSelector(db, dialog, data)
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      resetSelectedContacts().then(function () {

        fillUsersInSelector(data, dialog)

      })

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

function fillUsersInSelector(data, dialog) {
  const ul = document.getElementById('data-list--container')
  const alreadyPresntAssigness = {}
  const usersInRecord = data.record.assignees

  usersInRecord.forEach(function (user) {
    alreadyPresntAssigness[user] = ''
  })

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['users']);
    const store = transaction.objectStore('users')
    document.querySelector('.selector-send').classList.remove('hidden');

    store.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      const userRecord = cursor.value
      if (data.attachment.present) {
        ul.appendChild(createSimpleAssigneeLi(userRecord, true, false))
      } else if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
        ul.appendChild(createSimpleAssigneeLi(userRecord, true, true))
      }
      cursor.continue()
    }
    
    transaction.oncomplete = function () {
      const selectedBoxes = document.querySelectorAll('[data-selected="true"]');
      selectedBoxes.forEach(function (box) {
        if (box) {
          const mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
          mdcBox.checked = true
          box.children[1].style.animation = 'none'
          box.children[1].children[0].children[0].style.animation = 'none'
        }
      })

      document.getElementById('selector--search').addEventListener('click', function () {
        initSearchForSelectors(db, 'users', data)
      })

      dialog['acceptButton_'].onclick = function () {

        if (dialog['acceptButton_'].dataset.clicktype === 'numpad') {
          document.getElementById('selector--search').style.display = 'none'
          const parentNode = document.getElementById('data-list--container')
          removeChildNodes(parentNode)
          document.querySelector('.mdc-dialog__footer').style.display = 'none'
          addNewNumber(data, dialog)
          return
        }

        if (data.attachment.present) {
          const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: JSON.parse(radio.value)
          }).then(removeDialog).catch(handleError)
          return;
        }
        if (data.record.hasOwnProperty('create')) {
          resetSelectedContacts().then(function (selectedPeople) {
            updateDomFromIDB(data.record, {
              hash: 'addOnlyAssignees',
            }, {
              primary: selectedPeople
            }).then(removeDialog).catch(handleError)

          })
          return
        }
        if(isLocationStatusWorking()){
        shareReq(data)
        }
      }
    }
  }

}

function shareReq(data) {
  document.querySelector('.add--assignee-loader').appendChild(loader('user-loader'));
  document.querySelector('.add--assignee-loader .add--assignee-icon').style.display = 'none'
  resetSelectedContacts().then(function (people) {
    const reqBody = {
      'activityId': data.record.activityId,
      'share': people
    }
    requestCreator('share', reqBody)
    removeDialog()
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
            primary: [formattedNumber]
          }).then(removeDialog).catch(handleError)
          return
        }

        if (data.record.hasOwnProperty('create')) {
          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees',
          }, {
            primary: [formattedNumber]
          }).then(removeDialog).catch(handleError)
          return
        }
        if (isLocationVerified()) {

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
  document.querySelector('#dialog--component section.mdc-dialog__body--scrollable').appendChild(container)
  const getNumber = new mdc.ripple.MDCRipple.attachTo(document.getElementById('new-contact'))

}

function newNumberReq(data, formattedNumber) {
  requestCreator('share', {
    activityId: data.record.activityId,
    'share': [formattedNumber]
  })
  removeDialog()
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

function fillMapInSelector(db, tx, dialog, data) {

  if (data.record.template === 'check-in') {
    const searchIcon = document.getElementById('selector--search')
    searchIcon.classList.add('hidden');
    const ul = document.getElementById('data-list--container')

    getRootRecord().then(function (record) {
      checkMapStoreForNearByLocation(data.record.office, record.location).then(function (results) {
        results.forEach(function (result) {
          ul.appendChild(createVenueLi(result, false, data.record, true))
        })

        handleClickListnersForMap(db, dialog, data)
      })
    })
  } else {
    getLocationForMapSelector(tx, data).then(function () {
      handleClickListnersForMap(db, dialog, data)
    }).catch(console.log)
  }
}

function getLocationForMapSelector(tx, data) {
  return new Promise(function (resolve, reject) {

    const ul = document.getElementById('data-list--container')
    const store = tx.objectStore('map');
    const office = data.record.office
    const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
    store.index('byOffice').openCursor(range, 'nextunique').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      if (cursor.value.office !== data.record.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.location) {
        ul.appendChild(createVenueLi(cursor.value, false, data.record, true));
      }
      cursor.continue()
    }
    tx.oncomplete = function () {

      resolve(true)
    }
    tx.onerror = function () {
      reject(tx.error)
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
      index.openCursor(range, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.location) {
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
        resolve(results)
      }
      tx.onerror = function () {
        reject(tx.error)
      }
    }
  })
}

function handleClickListnersForMap(db, dialog, data) {

  const searchIcon = document.getElementById('selector--search')
  if (searchIcon) {
    document.getElementById('selector--search').addEventListener('click', function () {
      initSearchForSelectors(db, 'map', data)
    })
  }

  document.querySelector('.selector-send').classList.remove('hidden');

  dialog['acceptButton_'].onclick = function () {
    const selected = document.querySelector('.mdc-radio.radio-selected');
    if (!selected) return;
    const radio = new mdc.radio.MDCRadio(selected);
    const selectedField = JSON.parse(radio.value)

    updateDomFromIDB(data.record, {
      hash: 'venue',
      key: data.key
    }, {
      primary: selectedField.location,
      secondary: {
        address: selectedField.address,
        geopoint: selectedField.geopoint
      },
    }).then(removeDialog).catch(handleError)
  }
}

function fillChildrenInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  selectorStore.openCursor().onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) return;

    if (cursor.value.template === data.attachment.template && cursor.value.office === data.attachment.office && cursor.value.status != 'CANCELLED') {
      if (cursor.value.attachment.Name) {
        ul.appendChild(createSimpleLi('children', cursor.value.attachment.Name.value))
      }
      if (cursor.value.attachment.Number) {
        ul.appendChild(createSimpleLi('children', cursor.value.attachment.Number.value))
      }
    }
    cursor.continue()
  }

  document.querySelector('.selector-send').classList.remove('hidden')
  dialog['acceptButton_'].onclick = function () {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    updateDomFromIDB(activityRecord, {
      hash: 'children',
      key: data.attachment.key
    }, {
      primary: selectedField.name
    }).then(removeDialog).catch(handleError)
  }
}



function fillSubscriptionInSelector(db, dialog, data) {
  const mainUL = document.getElementById('data-list--container')
  const grp = document.createElement('div')
  grp.className = 'mdc-list-group'
  const offices = []
  const tx = db.transaction(['subscriptions'])
  const store = tx.objectStore('subscriptions');
  const officeIndex = store.index('office')
  officeIndex.openCursor(null, 'nextunique').onsuccess = function (event) {
    const cursor = event.target.result

    if (!cursor) return;

    const headline3 = document.createElement('h3')
    headline3.className = 'mdc-list-group__subheader subheader--group-small'
    headline3.textContent = cursor.value.office
    headline3.dataset.groupOffice = cursor.value.office
    const ul = document.createElement('ul')
    ul.className = 'mdc-list'
    ul.dataset.selection = cursor.value.office
    ul.setAttribute('aria-orientation', 'vertical')

    offices.push(cursor.value.office)

    grp.appendChild(headline3)
    grp.appendChild(ul)
    cursor.continue();
  }

  tx.oncomplete = function () {
    if (data.suggestCheckIn) {
      const parent = document.getElementById('data-list--container')
      const suggestion = document.createElement('div')
      suggestion.className = 'suggest-checkin--view'
      const icon = document.createElement('span')
      icon.className = 'material-icons suggestion-icon'
      icon.textContent = 'add_alert'
      suggestion.appendChild(icon)

      const text = document.createElement('span')
      text.textContent = 'Check-In ?'
      text.className = 'suggest-checkin--text'
      suggestion.appendChild(icon)
      suggestion.appendChild(text)
      parent.insertBefore(suggestion, parent.childNodes[0]);
    }
    insertTemplateByOffice(offices, data.suggestCheckIn);

    mainUL.appendChild(grp)

    dialog['acceptButton_'].onclick = function () {
      if(isLocationStatusWorking()){ 

      if (document.querySelector('.mdc-radio.radio-selected')) {

        const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
        const selectedField = JSON.parse(radio.value)
        document.getElementById('app-current-panel').dataset.view = 'create'
        createTempRecord(selectedField.office, selectedField.template, data)
      }
    }
    }
  }

}


function insertTemplateByOffice(offices, showCheckInFirst) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  const frag = document.createDocumentFragment()
  const checkInTemplate = []
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['subscriptions'], 'readonly');
    const subscriptionObjectStore = tx.objectStore('subscriptions').index('office')
    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        return
      }

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue()
        return
      }

      if (document.querySelector(`[data-selection="${cursor.value.office}"] [data-template="${cursor.value.template}"]`)) {
        cursor.continue()
        return
      }
      if (showCheckInFirst && cursor.value.template === 'check-in') {
        checkInTemplate.push({
          [cursor.value.office]: createGroupList(cursor.value.office, cursor.value.template)
        })
        cursor.continue();
        return;
      }
      document.querySelector(`[data-selection="${cursor.value.office}"]`).appendChild(createGroupList(cursor.value.office, cursor.value.template))

      cursor.continue()
    }
    tx.oncomplete = function () {

      checkInTemplate.forEach(function (li) {
        const keys = Object.keys(li);
        keys.forEach(function (key) {
          const el = document.querySelector(`[data-selection="${key}"]`);
          el.insertBefore(li[key], el.childNodes[0])
        })
      });
      document.querySelector('.selector-send').classList.remove('hidden');

    }
  }
}

function createTempRecord(office, template, data) {



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

      const bareBonesScheduleArray = []
      selectedCombo.schedule.forEach(function (schedule) {
        const bareBonesSchedule = {}
        bareBonesSchedule.name = schedule
        bareBonesSchedule.startTime = ''
        bareBonesSchedule.endTime = ''
        bareBonesScheduleArray.push(bareBonesSchedule)
      })


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

          const isLocationOld = isLastLocationOlderThanThreshold(record.location.lastLocationTime, 5);
          if (isLocationOld) {
            appDialog('Fetching Location Please wait', false)
            window.addEventListener('location', function _checkInLatest(e) {
              const newLocation = e.detail
              if (document.querySelector('#enable-gps')) {
                document.querySelector('#enable-gps').remove();
              }
              prefillLocationForCheckIn(bareBonesRecord, selectedCombo.venue[0], newLocation);
              window.removeEventListener('location', _checkInLatest, true);
            }, true)
            return
          }
          prefillLocationForCheckIn(bareBonesRecord, selectedCombo.venue[0], record.location);
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
      removeDialog()
    }
  }

}


function prefillLocationForCheckIn(bareBonesRecord, venueDesc, currentLocation) {

  checkMapStoreForNearByLocation(bareBonesRecord.office, currentLocation).then(function (results) {

    const locations = [];
    const bareBonesVenue = {}
    bareBonesVenue.venueDescriptor = venueDesc
    bareBonesVenue.location = ''
    bareBonesVenue.address = ''
    bareBonesVenue.geopoint = {
      '_latitude': '',
      '_longitude': ''
    }

    if (!results.length) {
      bareBonesVenue.showIcon = false;
    } else {
      bareBonesVenue.showIcon = true;
    }

    if (results.length === 1) {
      const singleLocation = results[0]
      bareBonesVenue.location = singleLocation.location
      bareBonesVenue.address = singleLocation.address
      bareBonesVenue.geopoint = {
        '_latitude': singleLocation.latitude,
        '_longitude': singleLocation.longitude
      }
    }
    locations.push(bareBonesVenue)
    bareBonesRecord.venue = locations
    updateCreateActivity(bareBonesRecord)
    removeDialog()
  })
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
        changeTextContentForNewSelectedVenue(attr, data)
        updateLocalRecord(thisActivity, db).then(function (message) {
          resolve(message)
        }).catch(function (error) {
          reject(error)
        })
        return
      }

      //for create
      if (attr.hash === 'addOnlyAssignees') {
        if (!data.primary.length) return
        const assigneeList = document.getElementById('assignees--list')

        data.primary.forEach(function (number) {
          if (thisActivity.assignees.indexOf(number) > -1) return
          thisActivity.assignees.push(number)
          getUserRecord(db, number).then(function (record) {
            if (assigneeList) {
              assigneeList.appendChild(createSimpleAssigneeLi(record))
            }
          })
        })
        resolve(true);
        return
      }
      
      if (attr.hash === 'weekday') return
      if (!attr.hasOwnProperty('key')) return

      thisActivity.attachment[attr.key].value = data.primary;

      updateLocalRecord(thisActivity, db).then(function (message) {
        changeTextContentForNewSelectedVenue(attr, data);
        resolve(message);
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
      reject({message:`${tx.error.message} from updateLocalRecord`});
    }
  })
}

function changeTextContentForNewSelectedVenue(attr, data) {
  const el = document.getElementById(convertKeyToId(attr.key))
  if (!el) return;
  const primaryText = el.querySelector(`[data-primary]`)
  const secondaryText = el.querySelector(`[data-secondary]`);
  const sendActivity = document.getElementById('send-activity');

  if (data.primary) {
    if (primaryText) {
      primaryText.textContent = data.primary
    }
  }
  if (data.hasOwnProperty('secondary')) {
    if (secondaryText) {
      secondaryText.textContent = data.secondary.address
    }
  }
  if (sendActivity) {
    if (!sendActivity.dataset.progress) {
      sendActivity.classList.remove('hidden')
    }
  }
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

function updateCreateContainer(recordCopy, db) {
  const record = JSON.parse(recordCopy);
  document.body.style.backgroundColor = '#eeeeee'

  const leftHeaderContent = document.createElement('div')
  leftHeaderContent.style.display = 'inline-flex'
  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons'
  backSpan.textContent = 'arrow_back'
  backSpan.id = 'backToConv'

  const activityName = document.createElement('span')
  activityName.textContent = record.activityName

  activityName.style.fontSize = '18px'
  activityName.style.paddingLeft = '10px'
  activityName.style.marginTop = '6px'

  leftHeaderContent.appendChild(backSpan)
  leftHeaderContent.appendChild(activityName)
  modifyHeader({
    id: 'app-main-header',
    left: leftHeaderContent.outerHTML
  })


  document.getElementById('backToConv').addEventListener('click', function () {
    updateLocalRecord(record, db).then(function () {
      backNav()
    }).catch(handleError)
  })



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
    updateBtn.className = 'mdc-fab send--activity-fab'
    updateBtn.setAttribute('aria-label', 'Send')
    updateBtn.id = 'send-activity'
    if (!record.hasOwnProperty('create')) {
      updateBtn.classList.add('hidden')
    }
    const sendIcon = document.createElement('span')
    sendIcon.className = 'mdc-fab__icon material-icons'
    sendIcon.textContent = 'send'
    updateBtn.appendChild(sendIcon)
    container.appendChild(updateBtn)
  }
  return container
}

function updateCreateActivity(record) {

  history.pushState(['updateCreateActivity', record], null, null)
  //open indexedDB
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result

    // create base container for activity update/create
    const appView = document.getElementById('app-current-panel')
    const oldRecord = JSON.stringify(record);
    appView.innerHTML = updateCreateContainer(oldRecord, db).outerHTML


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


    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function () {
        if(isLocationStatusWorking()){

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
      if(isLocationStatusWorking()){

      document.querySelector('.undo-deleted').style.display = 'none'
      listItem.appendChild(loader('undo-delete-loader'));
      reqForUndoDeleted(data.id)
      }
    }
    listItem.appendChild(undo)
  }

  return listItem
}

function reqForUndoDeleted(id) {


  requestCreator('statusChange', {
    activityId: id,
    status: 'PENDING'
  })
}

function createGroupList(office, template) {

  const li = document.createElement('li')
  li.className = 'mdc-list-item transition-ease'
  li.dataset.template = template
  const span = document.createElement('span')
  span.className = 'mdc-list-item__text'
  span.textContent = template.toUpperCase()

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta'
  metaInput.appendChild(createRadioInput())
  li.onclick = function () {
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
  const venueSection = document.getElementById('venue--list')

  record.venue.forEach(function (venue) {
    venueSection.appendChild(createVenueLi(venue, true, record))
    const mapDom = document.createElement('div');
    mapDom.className = 'map-detail ' + convertKeyToId(venue.venueDescriptor)
    venueSection.appendChild(mapDom)
  })

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
      maps('', showMap, convertKeyToId(venue.venueDescriptor), loc)
    }

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true')
      selectorIcon.appendChild(addLocation)
      addLocation.onclick = function (evt) {
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
  if (!record.hasOwnProperty('create')) {
    secondaryText.textContent = venue.address
  } else if (record.template === 'check-in' && !showMetaInput) {
    if (!venue.showIcon) {
      secondaryText.style.paddingTop = '3px';
      secondaryText.textContent = 'Not A Known Location'
    } else {
      secondaryText.textContent = venue.address
    }
  }

  secondaryText.dataset.secondary = ''
  textSpan.appendChild(secondaryText)
  listItem.appendChild(textSpan)
  if (showMetaInput) {
    listItem.appendChild(metaInput)
  } else {
    if (record.template === 'check-in') {
      if (venue.showIcon) {
        listItem.appendChild(selectorIcon)
      }
    } else {
      listItem.appendChild(selectorIcon)
    }
  }
  return listItem

}

function createScheduleTable(data) {

  if (!data.schedule.length) {
    document.getElementById('schedule--group').style.display = 'none'
    // return document.createElement('span')
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
    startTimeInput.value = moment(schedule.startTime || new Date()).format('HH:mm')
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
    endDateInput.value = moment(schedule.endTime || new Date()).format('YYYY-MM-DD')
    endDateInput.type = 'date'
    endDateInput.disabled = !data.canEdit
    endDateInput.className = 'mdc-text-field__input'
    edDiv.appendChild(endDateInput)

    const etSpan = document.createElement("span")
    etSpan.className = 'mdc-list-item__meta'

    const etDiv = document.createElement('div')
    etDiv.className = 'mdc-text-field end--time' + count


    const endTimeInput = document.createElement('input')
    endTimeInput.value = moment(schedule.endTime || new Date()).format('HH:mm')
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
        div.appendChild(label)
        div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key))
      }
    }


    if (data.attachment[key].type === 'number') {
      div.appendChild(label)
      div.appendChild(createNumberInput(data.attachment[key].value, data.canEdit))
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
        hasAnyValueInChildren(data.office, data.attachment[key].type, data.status).then(function (hasValue) {
          if (hasValue) {
            div.appendChild(addButtonName);
            div.classList.add('selector--margin')
            addButtonName.onclick = function (evt) {
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
  photoGraphic.dataset.number = userRecord.mobile
  photoGraphic.src = './img/empty-user.jpg'
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
      document.querySelector('.selector-send span').textContent = 'send'

    }
    objectStore.put(record)
    if (document.querySelectorAll('[data-selected="true"]').length == 0) {
      document.querySelector('.selector-send span').textContent = 'add'
      document.querySelector('.selector-send').dataset.clicktype = 'numpad'
    } else {
      document.querySelector('.selector-send').dataset.clicktype = ''

    }

  }
}

function checkRadioInput(inherit, value) {
  [...document.querySelectorAll('.radio-selected')].forEach(function (input) {
    input.classList.remove('radio-selected');
  });
  const parent = inherit
  if (parent) {

    const radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'))
    radio['root_'].classList.add('radio-selected')

    document.querySelector('.selector-send span').textContent = 'send'
    document.querySelector('.selector-send').dataset.clicktype = ''
    radio.value = JSON.stringify(value)
  }
}


function setFilePath(str, key, show) {

  if (document.querySelector('.image--list-li')) {
    document.getElementById('attachment-picture').src = `data:image/jpg;base64,${str}`
    document.getElementById('attachment-picture').dataset.value = `data:image/jpg;base64,${str}`

    if (!document.getElementById('send-activity').dataset.progress) {
      document.getElementById('send-activity').classList.remove('hidden')
    }
    return
  }

  const li = document.createElement('li')
  li.className = 'mdc-image-list__item image--list-li'

  const container = document.createElement('div')

  const img = document.createElement('img')
  img.className = 'profile-container--main mdc-image-list__image '
  img.id = 'attachment-picture'
  img.dataset.photoKey = key

  img.setAttribute('onerror', 'handleImageErrorAttachment(this)')
  if (!str) {
    img.src = './img/placeholder.png'
    img.dataset.value = ''
  } else {
    img.src = str;
    img.dataset.value = str
  }
  img.onclick = function () {
    openImage(this.src)
  }
  container.appendChild(img)
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
      handleError({message:`${e.message} from startCamera`});
    }
  } else {
    webkit.messageHandlers.takeImageForAttachment.postMessage("convert image to base 64")
  }
}

function openImage(imageSrc) {

  if (!imageSrc) return;

  document.getElementById('viewImage--dialog-component').querySelector("img").src = imageSrc;
  const imageDialog = new mdc.dialog.MDCDialog.attachTo(document.querySelector('#viewImage--dialog-component'));
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
    if (!document.getElementById('cancel-alert')) {
      cancelAlertDialog()
    }


    var dialog = new mdc.dialog.MDCDialog(document.querySelector('#cancel-alert'));

    document.getElementById('delete-allow').onclick = function () {
     if(isLocationStatusWorking()){
       deleteActivityReq(record.activityId)
     }
    }

    dialog.listen('MDCDialog:cancel', function () {
    })
    document.querySelector('.delete-activity').addEventListener('click', function (evt) {
      dialog.lastFocusedTarget = evt.target;
      dialog.show();
    })


  }

}

function deleteActivityReq(id) {
  document.querySelector('.delete-activity').style.display = 'none';
  document.querySelector('.status--cancel-cont li').appendChild(loader('cancel-loader'))

  requestCreator('statusChange', {
    activityId: id,
    status: 'CANCELLED',
  })
}

function cancelAlertDialog() {
  const aside = document.createElement('aside')
  aside.className = 'mdc-dialog'
  aside.id = 'cancel-alert'

  const surface = document.createElement('div')
  surface.className = 'mdc-dialog__surface'

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body'

  section.textContent = 'Are you sure you want to delete this activity ? '

  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'

  const accept = document.createElement('button')
  accept.type = 'button'
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept delete-btn'
  accept.textContent = 'Delete'
  accept.id = 'delete-allow'

  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel cancel-delete-btn'
  cancel.textContent = 'Cancel'

  footer.appendChild(cancel)
  footer.appendChild(accept)
  surface.appendChild(section)
  surface.appendChild(footer)
  aside.appendChild(surface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)


}



function sendActivity(record) {

  if (record.hasOwnProperty('create')) {
    insertInputsIntoActivity(record)
    return
  }

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function (event) {
    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    activityStore.get(record.activityId).onsuccess = function (event) {
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
    let inputValue = allStringTypes[i].querySelector('.mdc-text-field__input').value

    if (allStringTypes[i].querySelector('.mdc-text-field__input').required && checkSpacesInString(inputValue)) {
      snacks('Please provide an input for the field “Name” ')
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

  const imagesInAttachments = document.querySelectorAll('.image-preview--attachment  img')
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
      snacks('Please Select A Start Date and End Date')
      return
    }

    if (sd === "") {
      snacks('Please Select a Start Date')
      return;
    }
    if (ed === "") {
      snacks('Please Select an End Date')
      return;
    }


    if (concatDateWithTime(ed, et) < concatDateWithTime(sd, st)) {
      snacks('The End Date and Time should be greater or equal to the start time')
      return;
    }
    record.schedule[i - 1].startTime = concatDateWithTime(sd, st) || ''
    record.schedule[i - 1].endTime = concatDateWithTime(ed, et) || ''
  }

  for (var i = 0; i < record.venue.length; i++) {
    record.venue[i].geopoint = {
      latitude: record.venue[i].geopoint['_latitude'] || "",
      longitude: record.venue[i].geopoint['_longitude'] || ""
    }
    if (record.venue[i].hasOwnProperty('showIcon')) {
      delete record.venue[i].showIcon
    }
  }

  const requiredObject = {
    venue: record.venue,
    schedule: record.schedule,
    attachment: record.attachment
  }


  sendUpdateReq(requiredObject, record)
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

function initSearchForSelectors(db, type, attr) {
  searchBarUI(type)
  if (type === 'map') {
    let input = document.getElementById('search--bar-selector')
    const options = {
      componentRestrictions: {
        country: "in"
      }
    }

    autocomplete = new google.maps.places.Autocomplete(input, options);
    initializeAutocompleteGoogle(autocomplete, attr.record, attr)
    return
  }

  if (type === 'users') {

    initUserSelectorSearch(db, attr)
  }

}

function searchBarUI(type) {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#dialog--surface-headeraction-data")
  actionCont.className = 'search--cont'

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.add('search-field-transform')
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = 'white'
  if (!document.getElementById('search--bar--field')) {

    actionCont.appendChild(createSimpleInput('', true, true))

  } else {
    document.getElementById('search--bar--field').style.display = 'block'
  }
  document.getElementById('selector--search').style.display = 'none'
  document.querySelector('.selector-send').dataset.clicktype = ''
  document.querySelector('.selector-send span').textContent = 'send'
  dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.type = 'back-list'
  if (type === 'users') {
    dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.state = 'user-list-back'
  }
  dialogEl.querySelector('#dialog--surface-headerview-type span').style.color = '#0399f4'
}

function resetSelectorUI(data) {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#dialog--surface-headeraction-data")

  dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.type = ''

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.remove('search-field-transform')
  actionCont.querySelector('#search--bar--field').classList.remove('field-input')
  actionCont.classList.remove('search--cont')
  document.getElementById('selector--search').style.display = 'block'
  document.querySelector('.selector-send').style.display = 'block'
  document.querySelector('#search--bar--field').style.display = 'none'
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = '#eeeeee'
  document.getElementById('data-list--container').style.display = 'block'

  const selectorDialog = new mdc.dialog.MDCDialog(dialogEl)

  if (data.store === 'users') {
    document.getElementById('data-list--container').innerHTML = ''
    fillUsersInSelector(data, selectorDialog)
  }

  if (data.store === 'subscriptions') {
    document.getElementById('data-list--container').querySelectorAll('li').forEach(function (li) {
      li.style.display = 'flex'
    })
  }

}

function initializeAutocompleteGoogle(autocomplete, record, attr) {
  document.querySelector('#dialog--component .mdc-dialog__surface').style.width = '100vw'
  document.querySelector('#dialog--component .mdc-dialog__surface').style.height = '100vh'

  autocomplete.addListener('place_changed', function () {
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
    }, selectedAreaAttributes).then(removeDialog).catch(handleError)
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
  if (!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    simeplText.textContent = value
    return simeplText
  }

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field data--value-list'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-number'
  input.type = 'number'
  input.style.paddingTop = '0px'
  input.value = value
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
    attr.type === 'date' ? simeplText.textContent = moment(value).calendar() : simeplText.textContent = value

    return simeplText
  }

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
    input.value = value || moment(new Date()).format('HH:mm')
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


function toggleActionables(id) {
  if (!id) return;
  if (document.getElementById('app-current-panel').dataset.view === 'create') return
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const activityStore = db.transaction('activity').objectStore('activity')
    activityStore.get(id).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        listView()
        return
      }
      const actions = document.querySelectorAll('.mdc-fab')
      if (!record.editable) return
      
      if (document.querySelector('.loader')) {
        document.querySelector('.loader').remove()
        if (document.querySelector('.add--assignee-loader .add--assignee-icon')) {
          document.querySelector('.add--assignee-loader .add--assignee-icon').style.display = 'block'
        }
      }
      if (document.querySelector('.progress--update')) {
        document.querySelector('.progress--update').remove()
      }

    }
  }
}