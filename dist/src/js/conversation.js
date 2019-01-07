function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function conversation(id, pushState) {
  console.log(id);
  checkIfRecordExists('activity', id).then(function (id) {
    console.log(id);
    if (id) {
      if (pushState) {
        history.pushState(['conversation', id], null, null);
      }
      fetchAddendumForComment(id);
    } else {
      listView();
    }
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify({
      message: error
    }));
  });
}

function checkIfRecordExists(store, id) {
  return new Promise(function (resolve, reject) {
    var user = firebase.auth().currentUser;
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function () {
      var db = req.result;
      var objectStore = db.transaction(store).objectStore(store);
      objectStore.get(id).onsuccess = function (event) {
        var record = event.target.result;
        if (record) {
          resolve(id);
        } else {
          resolve(false);
        }
      };
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function fetchAddendumForComment(id) {
  if (!id) return;
  var user = firebase.auth().currentUser;
  var req = window.indexedDB.open(user.uid);

  req.onsuccess = function () {
    var db = req.result;
    var transaction = db.transaction(['addendum'], 'readonly');
    var addendumIndex = transaction.objectStore('addendum').index('activityId');
    createHeaderContent(db, id);
    commentPanel(id);
    statusChange(db, id);
    sendCurrentViewNameToAndroid('conversation');
    reinitCount(db, id);

    addendumIndex.openCursor(id).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      if (!document.getElementById(cursor.value.addendumId)) {
        createComment(db, cursor.value, user).then(function (comment) {
          if (document.getElementById('chat-container')) {
            document.getElementById('chat-container').appendChild(comment);
          }
        });
      }

      cursor.continue();
    };
    transaction.oncomplete = function () {
      if (document.querySelector('.activity--chat-card-container')) {
        console.log(document.querySelector('.activity--chat-card-container').scrollHeight);
        document.querySelector('.activity--chat-card-container').scrollTop = document.querySelector('.activity--chat-card-container').scrollHeight;
      }
    };
  };
}

function commentPanel(id) {
  if (document.querySelector('.activity--chat-card-container')) {
    return;
  }

  var commentPanel = document.createElement('div');
  commentPanel.className = 'activity--chat-card-container  mdc-top-app-bar--fixed-adjust panel-card';

  var chatCont = document.createElement('div');
  chatCont.id = 'chat-container';
  chatCont.className = 'mdc-card reverser-parent';

  var userCommentCont = document.createElement('div');
  userCommentCont.className = 'user-comment--container';

  var statusChangeContainer = document.createElement('div');
  statusChangeContainer.className = 'status--change-cont';

  var commentCont = document.createElement('div');
  commentCont.className = 'comment--container';

  var inputField = document.createElement('div');
  inputField.className = 'input--text-padding mdc-text-field mdc-text-field--dense';
  inputField.id = 'write--comment';
  inputField.style.width = '100%';
  var input = document.createElement('input');
  input.className = 'mdc-text-field__input comment-field mdc-elevation--z4';
  input.type = 'text';

  inputField.appendChild(input);

  commentCont.appendChild(inputField);

  var btn = document.createElement('button');
  btn.classList.add('mdc-fab', 'mdc-fab--mini', 'hidden');
  btn.id = 'send-chat--input';

  var btnIcon = document.createElement('span');
  btnIcon.classList.add('mdc-fac__icon', 'material-icons');
  btnIcon.textContent = 'send';
  btn.appendChild(btnIcon);

  commentCont.appendChild(btn);

  commentPanel.appendChild(chatCont);

  userCommentCont.appendChild(commentCont);

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + statusChangeContainer.outerHTML + userCommentCont.outerHTML;

  document.querySelector('.comment-field').oninput = function (evt) {
    if (!evt.target.value || !evt.target.value.replace(/\s/g, '').length) {
      hideSendCommentButton();
    } else {
      showSendCommentButton();
    }
  };

  document.getElementById('send-chat--input').onclick = function () {

    if (isLocationVerified()) {
      sendComment(id);
    }
  };
}

function sendComment(id) {
  var comment = document.querySelector('.comment-field').value;
  var reqBody = {
    'activityId': id,
    'comment': comment
  };

  requestCreator('comment', reqBody);

  document.querySelector('.comment-field').value = '';
  hideSendCommentButton();
}

function hideSendCommentButton() {
  document.getElementById('send-chat--input').classList.add('hidden');
  document.getElementById('write--comment').style.width = '100%';
  document.getElementById('write--comment').style.transition = '0.3s ease';
  document.querySelector('.status--change-cont').style.transition = '0.3s ease';
  document.querySelector('.status--change-cont').style.opacity = '1';
}

function showSendCommentButton() {
  document.getElementById('send-chat--input').classList.remove('hidden');
  document.getElementById('write--comment').style.width = '80%';
  document.querySelector('.status--change-cont').style.opacity = '0';
}

function statusChange(db, id) {

  var label = document.createElement('label');
  label.setAttribute('for', 'toggle-status');
  label.textContent = 'Done';

  var activityStore = db.transaction('activity').objectStore('activity');
  activityStore.get(id).onsuccess = function (event) {

    var record = event.target.result;
    if (!record.canEdit || record.status === 'CANCELLED') {
      var statusSpan = document.createElement('span');
      var _record = event.target.result;
      statusSpan.textContent = 'Activity ' + _record.status.toLowerCase();
      document.querySelector('.status--change-cont').innerHTML = statusSpan.outerHTML;
      document.querySelector('.status--change-cont').style.textAlign = 'center';
      return;
    }
    if (record.editable == 0) {

      document.querySelector('.status--change-cont').innerHTML = label.outerHTML + loader('status-loader').outerHTML;
      return;
    }
    if (!document.querySelector('.status-check')) {
      var div = document.createElement('div');
      div.className = 'mdc-form-field form-field-status';

      var checkbox = document.createElement('div');
      checkbox.className = 'mdc-checkbox status-check';

      var input = document.createElement("input");
      input.className = 'mdc-checkbox__native-control';
      input.id = 'toggle-status';
      input.type = 'checkbox';

      var checkbox_bckg = document.createElement('div');
      checkbox_bckg.className = 'mdc-checkbox__background';

      var svg = '<svg class="mdc-checkbox__checkmark"\n      viewBox="0 0 24 24">\n      <path class="mdc-checkbox__checkmark-path"\n      fill="none"\n      d="M1.73,12.91 8.1,19.28 22.79,4.59"/>\n      </svg>\n      <div class="mdc-checkbox__mixedmark"></div>';

      var mixedmark = document.createElement('div');
      mixedmark.className = 'mdc-checkbox__mixedmark';
      checkbox_bckg.innerHTML = svg;
      checkbox.appendChild(input);
      checkbox.appendChild(checkbox_bckg);

      div.appendChild(checkbox);

      if (document.querySelector('.status--change-cont')) {
        document.querySelector('.status--change-cont').innerHTML = div.outerHTML + label.outerHTML;
      }
    }

    if (!document.querySelector('.mdc-checkbox')) return;

    switchControl = new mdc.checkbox.MDCCheckbox.attachTo(document.querySelector('.mdc-checkbox'));
    if (record.status === 'CONFIRMED') {
      switchControl.checked = true;
    }
    document.querySelector('.mdc-checkbox').onclick = function () {
      if (isLocationVerified()) {
        changeStatusRequest(switchControl, record);
      } else {
        resetStatusConfirmation(switchControl, record);
      }
    };
  };
}

function resetStatusConfirmation(switchControl, record) {
  if (record.status === 'CONFIRMED') {
    switchControl.checked = true;
  } else {
    switchControl.checked = false;
  }
}

function changeStatusRequest(switchControl, record) {
  document.querySelector('.form-field-status').classList.add('hidden');

  document.querySelector('.status--change-cont').appendChild(loader('status-loader'));

  if (switchControl.checked) {
    requestCreator('statusChange', {
      activityId: record.activityId,
      status: 'CONFIRMED'
    });
  } else {
    requestCreator('statusChange', {
      activityId: record.activityId,
      status: 'PENDING'
    });
  }
}

function createComment(db, addendum, currentUser) {
  // console.log(addendum)
  var showMap = false;
  return new Promise(function (resolve) {

    var commentBox = document.createElement('div');

    commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left');

    currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment', 'secondary-color-light') : commentBox.classList.add('other-user--comment', 'mdc-theme--primary-bg');
    commentBox.id = addendum.addendumId;

    var textContainer = document.createElement('div');
    textContainer.classList.add('talktext');

    var user = document.createElement('p');
    user.classList.add('user-name--comment', 'mdc-typography--subtitle2');

    readNameFromNumber(db, addendum.user).then(function (nameOrNumber) {
      // console.log(nameOrNumber)
      user.textContent = nameOrNumber;

      var comment = document.createElement('p');
      comment.classList.add('comment', 'mdc-typography--subtitle2');
      comment.textContent = addendum.comment;

      var commentInfo = document.createElement('span');
      commentInfo.className = 'comment--info';
      var datespan = document.createElement('span');
      datespan.textContent = moment(addendum.timestamp).format('DD-MM-YY H:mm');
      datespan.classList.add('comment-date', 'mdc-typography--caption');

      var link = document.createElement('div');
      var mapIcon = document.createElement('i');
      mapIcon.classList.add('user-map--span', 'material-icons');
      mapIcon.appendChild(document.createTextNode('location_on'));

      link.onclick = function (evt) {
        showMap = !showMap;
        var loc = {
          lat: addendum.location['_latitude'],
          lng: addendum.location['_longitude']
        };
        maps(evt, showMap, addendum.addendumId, loc);
      };

      mapIcon.dataset.latitude = addendum.location['_latitude'];
      mapIcon.dataset.longitude = addendum.location['_longitude'];
      link.appendChild(mapIcon);

      var mapDom = document.createElement('div');
      mapDom.className = 'map-convo';

      commentInfo.appendChild(datespan);
      commentInfo.appendChild(link);
      textContainer.appendChild(user);
      textContainer.appendChild(comment);
      textContainer.appendChild(commentInfo);

      commentBox.appendChild(textContainer);
      commentBox.appendChild(mapDom);
      resolve(commentBox);
    }).catch(console.log);
  });
}

function readNameFromNumber(db, number) {
  return new Promise(function (resolve, reject) {
    // if (number === firebase.auth().currentUser.phoneNumber) return resolve(firebase.auth().currentUser.displayName)
    var usersObjectStore = db.transaction('users').objectStore('users');
    usersObjectStore.get(number).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) return resolve(number);
      if (!record.displayName) {
        resolve(number);
        return;
      }
      return resolve(record.displayName);
    };
    usersObjectStore.get(number).onerror = function (event) {
      reject(event);
    };
  });
}

function maps(evt, show, id, location) {
  var selector = '';
  evt ? selector = document.getElementById(id).querySelector('.map-convo') : selector = document.querySelector('.map-detail.' + id);

  console.log(show);
  if (!show) {
    selector.style.height = '0px';
    evt ? evt.target.textContent = 'location_on' : '';
    return;
  }

  if (selector.children.length !== 0) {
    selector.style.height = '200px';
    evt ? evt.target.textContent = 'arrow_drop_down' : '';
    return;
  }

  evt ? evt.target.textContent = 'arrow_drop_down' : '';

  selector.style.height = '200px';

  var map = new google.maps.Map(selector, {
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
  var marker = new google.maps.Marker({
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
  controlText.href = 'https://www.google.com/maps?q=' + lat + ',' + lng;
  controlText.className = 'material-icons';
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.style.textDecoration = 'none';

  controlText.innerHTML = 'open_in_new';
  controlUI.appendChild(controlText);
}

function createHeaderContent(db, id) {

  var activityObjectStore = db.transaction('activity').objectStore('activity');
  var leftDiv = document.createElement('div');
  // leftDiv.style.display = 'inline-flex'

  var backDiv = document.createElement('div');
  backDiv.className = 'back-icon';
  backDiv.id = 'back-conv';
  backDiv.style.float = 'left';
  var backIcon = document.createElement('i');
  backIcon.style.marginRight = '5px';
  backIcon.className = 'material-icons back-icon--large';
  backIcon.textContent = 'arrow_back';

  backDiv.appendChild(backIcon);

  activityObjectStore.get(id).onsuccess = function (event) {

    var record = event.target.result;
    getImageFromNumber(db, record.creator).then(function (uri) {

      var creatorImg = document.createElement("img");
      creatorImg.className = 'header--icon-creator';
      creatorImg.dataset.number = record.creator;
      creatorImg.src = uri;
      creatorImg.setAttribute('onerror', 'handleImageError(this)');
      backDiv.appendChild(creatorImg);

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
            updateCreateActivity(record, true);
          } else {
            listView();
          }
        }).catch(function (error) {
          requestCreator('instant', JSON.stringify({
            message: error
          }));
        });
      });
    });
  };
}

function reinitCount(db, id) {
  var transaction = db.transaction(['list'], 'readwrite');
  var store = transaction.objectStore('list');

  store.get(id).onsuccess = function (event) {
    var record = event.target.result;
    if (!record) return;
    record.count = 0;
    store.put(record);
  };
  transaction.oncomplete = function () {
    console.log("done");
  };
}

function getImageFromNumber(db, number) {
  return new Promise(function (resolve) {
    var userObjStore = db.transaction('users').objectStore('users');
    userObjStore.get(number).onsuccess = function (event) {
      var record = event.target.result;
      if (number === firebase.auth().currentUser.phoneNumber) {
        resolve(firebase.auth().currentUser.photoURL || './img/empty-user.jpg');
      } else {
        resolve(record ? record.photoURL : './img/empty-user.jpg');
      }
    };
  });
}

function selectorUI(evt, data) {

  sendCurrentViewNameToAndroid('selector');

  var aside = document.createElement('aside');

  aside.id = 'dialog--component';
  aside.className = 'mdc-dialog';
  aside.role = 'alertdialog';

  var dialogSurface = document.createElement('div');
  dialogSurface.className = 'mdc-dialog__surface';
  dialogSurface.appendChild(createHeader('dialog--surface-header'));

  var searchIcon = document.createElement('span');
  searchIcon.className = 'material-icons';
  searchIcon.textContent = 'search';
  searchIcon.id = 'selector--search';

  var backSpan = document.createElement('span');
  backSpan.className = 'material-icons dialog--header-back selector--type-' + data.store;
  backSpan.textContent = 'arrow_back';

  var section = document.createElement('section');
  section.className = 'mdc-dialog__body--scrollable mdc-top-app-bar--fixed-adjust';

  var ul = document.createElement('ul');
  ul.id = 'data-list--container';
  ul.className = 'mdc-list ';

  section.appendChild(ul);
  var footer = document.createElement('footer');
  footer.className = 'mdc-dialog__footer';

  var accept = document.createElement('button');
  accept.className = 'mdc-fab mdc-dialog__footer__button mdc-dialog__footer__button--accept selector-send hidden';
  accept.type = 'button';

  var acceptIcon = document.createElement('span');
  acceptIcon.className = 'mdc-fab__icon material-icons';
  if (data.store === 'users') {
    acceptIcon.textContent = 'add';
    accept.dataset.clicktype = 'numpad';
  } else {
    acceptIcon.textContent = 'send';
  }
  accept.appendChild(acceptIcon);

  footer.appendChild(accept);

  dialogSurface.appendChild(section);
  dialogSurface.appendChild(footer);

  aside.appendChild(dialogSurface);
  var backdrop = document.createElement('div');
  backdrop.className = 'mdc-dialog__backdrop';
  aside.appendChild(backdrop);
  document.body.appendChild(aside);

  if (data.store === 'subscriptions' || data.store === 'children') {
    modifyHeader({
      id: 'dialog--surface-header',
      left: backSpan.outerHTML
    });
  } else {
    modifyHeader({
      id: 'dialog--surface-header',
      left: backSpan.outerHTML,
      right: searchIcon.outerHTML
    });
  }

  document.querySelector('.dialog--header-back').addEventListener('click', function (e) {
    if (e.target.classList.contains('selector--type-users') && e.target.dataset.state === 'users-list-back') {
      resetSelectedContacts().then(function (people) {
        handleRemoveDialogEvt(e, data);
      });
      return;
    }
    removeDialog();
  });

  initializeSelectorWithData(evt, data);
}

function removeDialog() {
  var dialog = document.getElementById('dialog--component');
  if (!dialog) return;
  document.getElementById('dialog--component').remove();
  document.getElementById('growthfile').classList.remove('mdc-dialog-scroll-lock');
}

function handleRemoveDialogEvt(evt, data) {

  if (!evt) {
    return;
  }
  if (evt.target.dataset.type !== 'back-list') {
    return;
  }
  resetSelectorUI(data);
  removeDialog();
}

function initializeSelectorWithData(evt, data) {
  console.log(data);
  //init dialog
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#dialog--component'));
  var activityRecord = data.record;
  var selectorStore = void 0;
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    if (data.store === 'map') {
      var objectStore = db.transaction(data.store).objectStore(data.store);
      selectorStore = objectStore.index('location');
      fillMapInSelector(db, selectorStore, dialog, data);
    }
    if (data.store === 'subscriptions') {

      fillSubscriptionInSelector(db, dialog, data);
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store);
      resetSelectedContacts().then(function () {

        fillUsersInSelector(data, dialog);
      });
    }

    if (data.store === 'children') {
      selectorStore = db.transaction(data.store).objectStore(data.store);
      fillChildrenInSelector(selectorStore, activityRecord, dialog, data);
    }
  };
  // show dialog
  dialog.lastFocusedTarget = evt.target;
  dialog.show();
}

function fillUsersInSelector(data, dialog) {
  var ul = document.getElementById('data-list--container');
  var alreadyPresntAssigness = {};
  var usersInRecord = data.record.assignees;

  usersInRecord.forEach(function (user) {
    alreadyPresntAssigness[user] = '';
  });

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var selectorStore = db.transaction('users').objectStore('users');
    selectorStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        var selectedBoxes = document.querySelectorAll('[data-selected="true"]');
        selectedBoxes.forEach(function (box) {
          var mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
          mdcBox.checked = true;
          box.children[1].style.animation = 'none';
          box.children[1].children[0].children[0].style.animation = 'none';
        });
        return;
      }

      var userRecord = cursor.value;

      if (data.attachment.present) {

        ul.appendChild(createSimpleAssigneeLi(userRecord, true, false));
      } else if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
        ul.appendChild(createSimpleAssigneeLi(userRecord, true, true));
      }

      cursor.continue();
    };

    document.getElementById('selector--search').addEventListener('click', function () {
      initSearchForSelectors(db, 'users', data);
    });
    document.querySelector('.selector-send').classList.remove('hidden');

    dialog['acceptButton_'].onclick = function () {

      if (dialog['acceptButton_'].dataset.clicktype === 'numpad') {
        document.getElementById('selector--search').style.display = 'none';
        document.getElementById('data-list--container').innerHTML = '';
        document.querySelector('.mdc-dialog__footer').style.display = 'none';
        addNewNumber(data, dialog);
        return;
      }

      if (data.attachment.present) {
        var radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'));
        console.log(radio);
        console.log("run");
        updateDomFromIDB(data.record, {
          hash: '',
          key: data.attachment.key
        }, {
          primary: JSON.parse(radio.value)
        }).then(removeDialog).catch(function (error) {
          requestCreator('instant', JSON.stringify({ message: error }));
        });
        return;
      }
      if (data.record.hasOwnProperty('create')) {
        resetSelectedContacts().then(function (selectedPeople) {
          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees'
          }, {
            primary: selectedPeople
          }).then(removeDialog).catch(function (error) {
            requestCreator('instant', JSON.stringify({ message: error }));
          });
        });
        return;
      }
      if (isLocationVerified()) {

        shareReq(data);
      }
    };
  };
}

function shareReq(data) {
  document.querySelector('.add--assignee-loader').appendChild(loader('user-loader'));
  document.querySelector('.add--assignee-loader .add--assignee-icon').style.display = 'none';
  resetSelectedContacts().then(function (people) {
    console.log(people);
    var reqBody = {
      'activityId': data.record.activityId,
      'share': people
    };
    requestCreator('share', reqBody);
    removeDialog();
  });
}

function addNewNumber(data) {
  var container = document.createElement('div');
  container.className = 'custom-number--container';

  var input = document.createElement('input');
  input.className = 'mdc-text-field__input';
  input.id = 'number-field';
  input.type = 'number';
  input.setAttribute('maxlength', '10');
  input.setAttribute('size', '10');
  input.required = true;
  input.onkeypress = function (event) {
    return event.charCode >= 48 && event.charCode <= 57;
  };

  input.oninput = function () {
    if (this.value.length > this.maxLength) {
      console.log(this);
      this.value = this.value.slice(0, this.maxLength);
    } else if (this.value.length === this.maxLength) {
      document.querySelector('.message-field').classList.remove('error-message');
      this.classList.add('valid-input');
      document.querySelector('.message-field').textContent = '';
      document.getElementById('new-contact').disabled = false;
    } else {
      document.querySelector('.message-field').classList.add('error-message');
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number';
      document.getElementById('new-contact').disabled = true;
    }
  };

  var createButton = document.createElement('button');
  createButton.className = 'mdc-button';
  createButton.textContent = 'Add Contact';
  createButton.id = 'new-contact';
  createButton.onclick = function () {
    var number = document.getElementById('number-field').value;

    var formattedNumber = formatNumber(number);
    if (checkNumber(formattedNumber)) {

      numberNotExist(formattedNumber).then(function (exist) {
        if (exist) {
          document.getElementById('new-contact').disabled = true;
          document.querySelector('.message-field').classList.add('error-message');
          document.querySelector('.message-field').textContent = '* Contact already exist';
          return;
        }

        if (data.attachment.present) {
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: [formattedNumber]
          }).then(removeDialog).catch(function (error) {
            requestCreator('instant', JSON.stringify({ message: error }));
          });
          return;
        }

        if (data.record.hasOwnProperty('create')) {
          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees'
          }, {
            primary: [formattedNumber]
          }).then(removeDialog).catch(function (error) {
            requestCreator('instant', JSON.stringify({ message: error }));
          });
          return;
        }
        if (isLocationVerified()) {

          newNumberReq(data, formattedNumber);
        }
      });
    } else {
      document.querySelector('.message-field').classList.add('error-message');
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number';
      document.getElementById('new-contact').disabled = true;
    }
  };

  var message = document.createElement('p');
  message.className = 'mdc-typography--subtitle2 message-field';
  message.textContent = 'Enter new phone contact without country code';
  message.id = 'helper-message';

  container.appendChild(input);
  container.appendChild(message);
  container.appendChild(createButton);
  document.querySelector('#dialog--component section.mdc-dialog__body--scrollable').appendChild(container);
  var getNumber = new mdc.ripple.MDCRipple.attachTo(document.getElementById('new-contact'));
}

function newNumberReq(data, formattedNumber) {
  requestCreator('share', {
    activityId: data.record.activityId,
    'share': [formattedNumber]
  });
  removeDialog();
}

function numberNotExist(number) {
  return new Promise(function (resolve) {

    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var store = db.transaction('users').objectStore('users');
      store.get(number).onsuccess = function (event) {
        var record = event.target.result;
        if (record) {

          resolve(true);
        } else {
          resolve(false);
        }
      };
    };
  });
}

function resetSelectedContacts() {
  return new Promise(function (resolve) {
    var selectedUsers = [];
    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var objectStoreTx = db.transaction(['users'], 'readwrite');
      var objectStore = objectStoreTx.objectStore('users');
      objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {

          resolve(selectedUsers);
          return;
        }
        if (cursor.value.isSelected) {
          selectedUsers.push(cursor.value.mobile);
          cursor.value.isSelected = false;
          objectStore.put(cursor.value);
        }
        cursor.continue();
      };
    };
  });
}

function fillMapInSelector(db, selectorStore, dialog, data) {
  var ul = document.getElementById('data-list--container');
  selectorStore.openCursor(null, 'nextunique').onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;
    if (cursor.value.location) {
      ul.appendChild(createVenueLi(cursor.value, false, data.record, true));
    }

    cursor.continue();
  };

  document.getElementById('selector--search').addEventListener('click', function () {

    initSearchForSelectors(db, 'map', data);
  });

  document.querySelector('.selector-send').classList.remove('hidden');

  dialog['acceptButton_'].onclick = function () {
    var radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'));
    var selectedField = JSON.parse(radio.value);
    updateDomFromIDB(data.record, {
      hash: 'venue',
      key: data.key
    }, {
      primary: selectedField.location,
      secondary: {
        address: selectedField.address,
        geopoint: selectedField.geopoint
      }
    }).then(removeDialog).catch(function (error) {
      console.log(error);
      requestCreator('instant', JSON.stringify({ message: error }));
    });
  };
}

function fillChildrenInSelector(selectorStore, activityRecord, dialog, data) {
  var ul = document.getElementById('data-list--container');
  console.log(data);
  selectorStore.openCursor().onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;

    if (cursor.value.template === data.attachment.template && cursor.value.office === data.attachment.office && cursor.value.status != 'CANCELLED') {
      if (cursor.value.attachment.Name) {
        ul.appendChild(createSimpleLi('children', cursor.value.attachment.Name.value));
      }
      if (cursor.value.attachment.Number) {
        ul.appendChild(createSimpleLi('children', cursor.value.attachment.Number.value));
      }
    }
    cursor.continue();
  };

  document.querySelector('.selector-send').classList.remove('hidden');
  dialog['acceptButton_'].onclick = function () {
    var radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'));
    var selectedField = JSON.parse(radio.value);
    updateDomFromIDB(activityRecord, {
      hash: 'children',
      key: data.attachment.key
    }, {
      primary: selectedField.name
    }).then(removeDialog).catch(function (error) {
      requestCreator('instant', JSON.stringify({ message: error }));
    });
  };
}

function fillSubscriptionInSelector(db, dialog, data) {
  console.log(data);
  var mainUL = document.getElementById('data-list--container');
  var grp = document.createElement('div');
  grp.className = 'mdc-list-group';
  var offices = [];
  var tx = db.transaction(['subscriptions']);
  var store = tx.objectStore('subscriptions');
  var officeIndex = store.index('office');
  officeIndex.openCursor(null, 'nextunique').onsuccess = function (event) {
    var cursor = event.target.result;

    if (!cursor) return;

    var headline3 = document.createElement('h3');
    headline3.className = 'mdc-list-group__subheader subheader--group-small';
    headline3.textContent = cursor.value.office;
    headline3.dataset.groupOffice = cursor.value.office;
    var ul = document.createElement('ul');
    ul.className = 'mdc-list';
    ul.dataset.selection = cursor.value.office;
    ul.setAttribute('aria-orientation', 'vertical');

    offices.push(cursor.value.office);

    grp.appendChild(headline3);
    grp.appendChild(ul);
    cursor.continue();
  };

  tx.oncomplete = function () {
    if (data.suggestCheckIn) {
      var parent = document.getElementById('data-list--container');
      var suggestion = document.createElement('div');
      suggestion.className = 'suggest-checkin--view';
      var icon = document.createElement('span');
      icon.className = 'material-icons suggestion-icon';
      icon.textContent = 'add_alert';
      suggestion.appendChild(icon);

      var text = document.createElement('span');
      text.textContent = 'Check-In ?';
      text.className = 'suggest-checkin--text';
      suggestion.appendChild(icon);
      suggestion.appendChild(text);
      parent.insertBefore(suggestion, parent.childNodes[0]);
    }
    insertTemplateByOffice(offices, data.suggestCheckIn);

    mainUL.appendChild(grp);

    dialog['acceptButton_'].onclick = function () {

      if (document.querySelector('.mdc-radio.radio-selected')) {

        var radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'));
        console.log(radio);
        var selectedField = JSON.parse(radio.value);
        console.log(selectedField.office);
        console.log(selectedField.template);
        document.getElementById('app-current-panel').dataset.view = 'create';
        createTempRecord(selectedField.office, selectedField.template, data);
      }
    };
  };
}

function insertTemplateByOffice(offices, showCheckInFirst) {

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  var frag = document.createDocumentFragment();
  var checkInTemplate = [];
  req.onsuccess = function () {
    var db = req.result;
    var tx = db.transaction(['subscriptions'], 'readonly');
    var subscriptionObjectStore = tx.objectStore('subscriptions').index('office');
    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        return;
      }

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }

      if (document.querySelector('[data-selection="' + cursor.value.office + '"] [data-template="' + cursor.value.template + '"]')) {
        cursor.continue();
        return;
      }
      if (showCheckInFirst && cursor.value.template === 'check-in') {
        checkInTemplate.push(_defineProperty({}, cursor.value.office, createGroupList(cursor.value.office, cursor.value.template)));
        cursor.continue();
        return;
      }
      document.querySelector('[data-selection="' + cursor.value.office + '"]').appendChild(createGroupList(cursor.value.office, cursor.value.template));

      cursor.continue();
    };
    tx.oncomplete = function () {

      checkInTemplate.forEach(function (li) {
        var keys = Object.keys(li);
        keys.forEach(function (key) {
          var el = document.querySelector('[data-selection="' + key + '"]');
          el.insertBefore(li[key], el.childNodes[0]);
        });
      });
      document.querySelector('.selector-send').classList.remove('hidden');
    };
  };
}

function createTempRecord(office, template, data) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var selectorStore = db.transaction('subscriptions').objectStore('subscriptions');
    var officeTemplateCombo = selectorStore.index('officeTemplate');
    var range = IDBKeyRange.only([office, template]);
    officeTemplateCombo.get(range).onsuccess = function (event) {
      var selectedCombo = event.target.result;
      if (!selectedCombo) {
        console.log("no such combo");
        return;
      }
      var bareBonesVenue = {};
      var bareBonesVenueArray = [];

      var bareBonesScheduleArray = [];
      selectedCombo.venue.forEach(function (venue) {
        var bareBonesVenue = {};

        bareBonesVenue.venueDescriptor = venue;
        bareBonesVenue.location = '';
        bareBonesVenue.address = '';
        bareBonesVenue.geopoint = {
          '_latitude': '',
          '_longitude': ''
        };
        bareBonesVenueArray.push(bareBonesVenue);
      });

      console.log(selectedCombo);
      selectedCombo.schedule.forEach(function (schedule) {
        var bareBonesSchedule = {};
        bareBonesSchedule.name = schedule;
        bareBonesSchedule.startTime = '';
        bareBonesSchedule.endTime = '';
        bareBonesScheduleArray.push(bareBonesSchedule);
      });

      var bareBonesRecord = {
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
      };

      updateCreateActivity(bareBonesRecord, true);
      removeDialog();
    };
  };
}

function hasAnyValueInChildren(office, template, status) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  return new Promise(function (resolve) {

    req.onsuccess = function () {
      var db = req.result;
      var childrenStore = db.transaction('children').objectStore('children');
      var count = 0;
      var result = false;
      childrenStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {
          if (count === 0) {
            result = false;
            resolve(result);
          } else {
            result = true;
            resolve(result);
          }
          return;
        }
        if (cursor.value.template === template && cursor.value.office === office && status != 'CANCELLED') {
          count++;
        }
        cursor.continue();
      };
    };
  });
}

function updateDomFromIDB(activityRecord, attr, data) {
  return new Promise(function (resolve, reject) {
    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var thisActivity = activityRecord;

      if (attr.hash === 'venue') {
        thisActivity = updateVenue(thisActivity, attr, data);
        changeTextContentForNewSelectedVenue(attr, data);
        updateLocalRecord(thisActivity, db).then(function (message) {
          resolve(message);
        }).catch(function (error) {
          console.log(error);
          reject(error);
        });
        return;
      }

      //for create
      if (attr.hash === 'addOnlyAssignees') {

        if (data.primary.length > 0) {
          data.primary.forEach(function (number) {
            if (thisActivity.assignees.indexOf(number) > -1) return;
            thisActivity.assignees.push(number);
          });
        }
        var newAssigness = thisActivity.assignees;
        readNameAndImageFromNumber(newAssigness, db).then(function (message) {
          resolve(message);
        }).catch(function (error) {
          reject(error);
        });
        return;
      }

      if (attr.hash === 'weekday') return;
      if (!attr.hasOwnProperty('key')) return;

      thisActivity.attachment[attr.key].value = data.primary;

      updateLocalRecord(thisActivity, db).then(function (message) {
        changeTextContentForNewSelectedVenue(attr, data);
        resolve(message);
      }).catch(function (error) {
        reject(error);
      });
    };
  });
}

function updateLocalRecord(thisActivity, db) {
  return new Promise(function (resolve, reject) {

    var tx = db.transaction(['activity'], 'readwrite');
    var store = tx.objectStore('activity');
    var updatedActivity = thisActivity;

    if (!updatedActivity.hasOwnProperty('create')) {
      store.put(updatedActivity);
    }
    tx.oncomplete = function () {
      resolve("activity object store updated with value");
    };
    tx.onerror = function () {
      reject(JSON.stringify(tx.error));
    };
  });
}

function changeTextContentForNewSelectedVenue(attr, data) {
  var el = document.getElementById(convertKeyToId(attr.key));
  if (!el) return;
  var primaryText = el.querySelector('[data-primary]');
  var secondaryText = el.querySelector('[data-secondary]');
  var sendActivity = document.getElementById('send-activity');

  if (data.primary) {
    if (primaryText) {
      primaryText.textContent = data.primary;
    }
  }
  if (data.hasOwnProperty('secondary')) {
    if (secondaryText) {
      secondaryText.textContent = data.secondary.address;
    }
  }
  if (sendActivity) {
    if (!sendActivity.dataset.progress) {
      sendActivity.classList.remove('hidden');
    }
  }
}

function updateVenue(updatedActivity, attr, data) {

  updatedActivity.venue.forEach(function (field) {
    if (field.venueDescriptor === attr.key) {
      field.location = data.primary;
      field.address = data.secondary.address;
      field.geopoint['_latitude'] = data.secondary.geopoint['_latitude'];
      field.geopoint['_longitude'] = data.secondary.geopoint['_longitude'];
      console.log(field);
    }
  });
  return updatedActivity;
}

function convertKeyToId(key) {
  var str = key.replace(/-/g, '--');
  return str.replace(/\s/g, '-');
}

function convertIdToKey(id) {
  // let str =  id.replace(/--/g, '-')
  var str = id.replace(/-/g, ' ');
  return str.replace('  ', '-');
}

function updateCreateContainer(recordCopy, db) {
  var record = JSON.parse(recordCopy);
  document.body.style.backgroundColor = '#eeeeee';

  var leftHeaderContent = document.createElement('div');
  leftHeaderContent.style.display = 'inline-flex';
  var backSpan = document.createElement('span');
  backSpan.className = 'material-icons';
  backSpan.textContent = 'arrow_back';
  backSpan.id = 'backToConv';

  var activityName = document.createElement('span');
  activityName.textContent = record.activityName;

  activityName.style.fontSize = '21px';
  activityName.style.paddingLeft = '10px';
  activityName.style.marginTop = '6px';

  leftHeaderContent.appendChild(backSpan);
  leftHeaderContent.appendChild(activityName);
  modifyHeader({
    id: 'app-main-header',
    left: leftHeaderContent.outerHTML
  });

  document.getElementById('backToConv').addEventListener('click', function () {
    console.log(record);
    updateLocalRecord(record, db).then(function () {
      backNav();
    }).catch(function (error) {
      requestCreator('instant', JSON.stringify({ message: error }));
    });
  });

  var container = document.createElement('div');
  container.className = 'mdc-top-app-bar--fixed-adjust update-create--activity';

  var TOTAL_LIST_TYPES = ['office', 'venue', 'schedule', 'attachment', 'assignees'];

  var LIST_LENGTH = 5;
  var i = 0;
  for (i; i < LIST_LENGTH; i++) {
    var containerList = document.createElement('ul');
    containerList.className = 'mdc-list custom--list-margin';

    var listGroup = document.createElement('div');
    switch (TOTAL_LIST_TYPES[i]) {
      case 'office':
        containerList.classList.remove('custom--list-margin');
        break;
      case 'schedule':
        listGroup.className = 'mdc-list-group__subheader';
        listGroup.id = 'schedule--group';
        break;
      case 'venue':
      case 'assignees':
        containerList.classList.add('mdc-list--two-line', 'mdc-list--avatar-list');
        break;

    };

    if (TOTAL_LIST_TYPES[i] === 'schedule') {
      container.appendChild(listGroup);
    } else {

      containerList.id = TOTAL_LIST_TYPES[i] + '--list';
      container.appendChild(containerList);
    }
  }
  if (record.canEdit) {

    var updateBtn = document.createElement('button');
    updateBtn.className = 'mdc-fab send--activity-fab';
    updateBtn.setAttribute('aria-label', 'Send');
    updateBtn.id = 'send-activity';
    if (!record.hasOwnProperty('create')) {
      updateBtn.classList.add('hidden');
    }
    var sendIcon = document.createElement('span');
    sendIcon.className = 'mdc-fab__icon material-icons';
    sendIcon.textContent = 'send';
    updateBtn.appendChild(sendIcon);
    container.appendChild(updateBtn);
  }
  return container;
}

function updateCreateActivity(record, pushState) {

  if (pushState) {
    history.pushState(['updateCreateActivity', record], null, null);
  }

  //open indexedDB
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;

    // create base container for activity update/create
    var appView = document.getElementById('app-current-panel');
    var oldRecord = JSON.stringify(record);
    appView.innerHTML = updateCreateContainer(oldRecord, db).outerHTML;

    var officeSection = document.getElementById('office--list');
    officeSection.appendChild(createSimpleLi('Office', {
      office: record.office,
      showLabel: true
    }));

    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function () {
        if (isLocationVerified()) {
          this.dataset.progress = true;
          sendActivity(record);
        }
      });
    }

    createVenueSection(record);
    createScheduleTable(record);

    createAttachmentContainer(record);

    var inputFields = document.querySelectorAll('.update-create--activity input');
    for (var i = 0; i < inputFields.length; i++) {
      inputFields[i].addEventListener('input', function (e) {
        if (!document.getElementById('send-activity').dataset.progress) {

          if (document.getElementById('send-activity').classList.contains('hidden')) {
            document.getElementById('send-activity').classList.remove('hidden');
          }
        }
      });
    }

    if (document.querySelector('.mdc-select')) {
      var select = new mdc.select.MDCSelect(document.querySelector('.mdc-select'));
      select.listen('change', function () {
        console.log(select);
        updateDomFromIDB(record, {
          hash: 'weekday',
          key: select['root_'].dataset.value
        }, {
          primary: select.value
        }).then(function (message) {
          if (!document.getElementById('send-activity').dataset.progress) {

            if (document.getElementById('send-activity').classList.contains('hidden')) {
              document.getElementById('send-activity').classList.remove('hidden');
            }
          }
        }).catch(function (error) {
          requestCreator('instant', JSON.stringify({ message: error }));
        });
      });
    }

    createAssigneeList(db, record, true);

    createActivityCancellation(record);
  };
}

function createSimpleLi(key, data) {

  var listItem = document.createElement('li');
  listItem.className = 'mdc-list-item mdc-ripple-upgraded';

  var listItemLabel = document.createElement('span');
  listItemLabel.className = 'detail--static-text';
  var listItemMeta = document.createElement('span');

  var dataVal = document.createElement('span');

  if (key === 'Office') {
    dataVal.className = 'data--value-list';
    dataVal.textContent = data.office;
    listItemLabel.textContent = key;
    listItem.appendChild(listItemLabel);
    listItem.appendChild(dataVal);
  }
  if (key === 'children') {
    var metaInput = document.createElement('span');
    metaInput.className = 'mdc-list-item__meta';
    metaInput.appendChild(createRadioInput());

    listItem.textContent = data;
    listItem.appendChild(metaInput);
    listItem.onclick = function () {

      checkRadioInput(this, {
        name: data
      });
    };
  }
  if (key === 'delete') {
    dataVal.className = 'mdc-list-item__graphic material-icons';
    dataVal.textContent = key;
    listItemLabel.classList.remove('detail--static-text');
    listItemLabel.classList.add('delete-activity');
    listItemLabel.textContent = data.text;
    listItem.appendChild(dataVal);
    listItem.appendChild(listItemLabel);
  }
  if (key === 'empty') {
    listItem.dataset.prop = 'delete';
  }
  if (key === 'undo-deleted') {
    dataVal.className = 'mdc-list-item__graphic material-icons';
    dataVal.textContent = 'delete';
    listItemLabel.classList.remove('detail--static-text');
    listItemLabel.classList.add('delete-activity');

    listItemLabel.textContent = data.text;
    listItem.appendChild(dataVal);
    listItem.appendChild(listItemLabel);
    listItem.classList.add('undo-delete-activity');
    var undo = document.createElement('button');
    undo.className = 'mdc-button mdc-ripple-upgraded mdc-list-item__meta undo-deleted';
    undo.textContent = 'Undo';
    undo.onclick = function () {

      if (isLocationVerified()) {
        document.querySelector('.undo-deleted').style.display = 'none';
        listItem.appendChild(loader('undo-delete-loader'));
        reqForUndoDeleted(data.id);
      }
    };
    listItem.appendChild(undo);
  }

  return listItem;
}

function reqForUndoDeleted(id) {

  requestCreator('statusChange', {
    activityId: id,
    status: 'PENDING'
  });
}

function createGroupList(office, template) {

  var li = document.createElement('li');
  li.className = 'mdc-list-item transition-ease';
  li.dataset.template = template;
  var span = document.createElement('span');
  span.className = 'mdc-list-item__text';
  span.textContent = template.toUpperCase();

  var metaInput = document.createElement('span');
  metaInput.className = 'mdc-list-item__meta';
  metaInput.appendChild(createRadioInput());
  li.onclick = function () {
    checkRadioInput(this, {
      office: office,
      template: template
    });
  };
  li.appendChild(span);
  li.appendChild(metaInput);
  return li;
}

function createVenueSection(record) {
  console.log(record);
  var venueSection = document.getElementById('venue--list');

  record.venue.forEach(function (venue) {
    venueSection.appendChild(createVenueLi(venue, true, record));
    var mapDom = document.createElement('div');
    mapDom.className = 'map-detail ' + convertKeyToId(venue.venueDescriptor);
    venueSection.appendChild(mapDom);
  });

  if (record.venue.length === 0) {
    document.getElementById('venue--list').style.display = 'none';
  }
}

function createVenueLi(venue, showVenueDesc, record, showMetaInput) {
  var showMap = false;
  var listItem = document.createElement('li');
  listItem.className = 'mdc-list-item mdc-ripple-upgraded';
  listItem.id = convertKeyToId(venue.venueDescriptor);

  var textSpan = document.createElement('div');
  textSpan.className = 'mdc-list-item__text link--span';

  var primarySpan = document.createElement('span');
  primarySpan.className = 'mdc-list-item__primary-text';

  var selectorIcon = document.createElement('span');
  selectorIcon.className = 'mdc-list-item__meta';
  var addLocation = document.createElement('label');
  addLocation.className = 'mdc-fab add--assignee-icon attachment-selector-label';
  var locationBtnSpan = document.createElement('span');
  locationBtnSpan.className = 'mdc-fab__icon material-icons';
  locationBtnSpan.textContent = 'add_location';
  addLocation.appendChild(locationBtnSpan);

  if (showVenueDesc) {
    var listItemLabel = document.createElement('span');
    listItemLabel.className = 'detail--static-text';
    listItemLabel.textContent = venue.venueDescriptor;

    var dataValue = document.createElement('span');
    dataValue.className = 'data--value-list';
    dataValue.textContent = venue.location;
    dataValue.dataset.primary = '';

    primarySpan.appendChild(listItemLabel);
    primarySpan.appendChild(dataValue);
    textSpan.appendChild(primarySpan);

    textSpan.onclick = function (evt) {
      showMap = !showMap;

      var loc = {
        lat: venue.geopoint['_latitude'],
        lng: venue.geopoint['_longitude']
      };

      maps('', showMap, convertKeyToId(venue.venueDescriptor), loc);
    };

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true');
      selectorIcon.appendChild(addLocation);
      addLocation.onclick = function (evt) {
        selectorUI(evt, {
          record: record,
          store: 'map',
          attachment: {
            present: false
          },
          key: venue.venueDescriptor
        });
      };
    }
  } else {
    primarySpan.textContent = venue.location;
    textSpan.appendChild(primarySpan);
  }

  var metaInput = document.createElement('span');
  metaInput.className = 'mdc-list-item__meta material-icons';

  if (showMetaInput) {

    metaInput.appendChild(createRadioInput());
    listItem.onclick = function () {
      console.log(venue);
      checkRadioInput(this, {
        location: venue.location,
        address: venue.address,
        geopoint: {
          '_latitude': venue.latitude,
          '_longitude': venue.longitude
        },
        venueDesc: venue.venueDescriptor
      });
    };
  }

  var secondaryText = document.createElement('span');
  secondaryText.className = 'mdc-list-item__secondary-text';
  secondaryText.textContent = venue.address;
  secondaryText.dataset.secondary = '';
  textSpan.appendChild(secondaryText);
  listItem.appendChild(textSpan);
  if (showMetaInput) {
    listItem.appendChild(metaInput);
  } else {
    listItem.appendChild(selectorIcon);
  }

  return listItem;
}

function createScheduleTable(data) {

  if (!data.schedule.length) {
    document.getElementById('schedule--group').style.display = 'none';
    // return document.createElement('span')
  }

  var count = 0;
  data.schedule.forEach(function (schedule) {
    count++;
    console.log(schedule.startTime);
    var scheduleName = document.createElement('h5');
    scheduleName.className = 'mdc-list-group__subheader label--text';
    scheduleName.textContent = schedule.name;

    var ul = document.createElement('ul');
    ul.className = 'mdc-list mdc-list--dense';

    var divider = document.createElement('li');
    divider.className = 'mdc-list-divider';
    divider.setAttribute('role', 'separator');

    var startLi = document.createElement('li');
    startLi.className = 'mdc-list-item schedule-start-li';

    var sdDiv = document.createElement('div');
    sdDiv.className = 'mdc-text-field start--date' + count;

    var startDateInput = document.createElement('input');
    startDateInput.value = moment(schedule.startTime || new Date()).format('YYYY-MM-DD');
    startDateInput.type = 'date';
    startDateInput.disabled = !data.canEdit;
    startDateInput.className = 'mdc-text-field__input';

    sdDiv.appendChild(startDateInput);

    var stSpan = document.createElement("span");
    stSpan.className = 'mdc-list-item__meta';

    var stDiv = document.createElement('div');
    stDiv.className = 'mdc-text-field start--time' + count;

    var startTimeInput = document.createElement('input');
    startTimeInput.value = moment(schedule.startTime || new Date()).format('HH:mm');
    startTimeInput.type = 'time';
    startTimeInput.className = 'time--input';
    startTimeInput.disabled = !data.canEdit;
    startTimeInput.className = 'mdc-text-field__input';
    stDiv.appendChild(startTimeInput);

    stSpan.appendChild(stDiv);

    var endLi = document.createElement('li');
    endLi.className = 'mdc-list-item schedule-end-li';

    var edDiv = document.createElement('div');
    edDiv.className = 'mdc-text-field end--date' + count;

    var endDateInput = document.createElement('input');
    endDateInput.value = moment(schedule.endTime || new Date()).format('YYYY-MM-DD');
    endDateInput.type = 'date';
    endDateInput.disabled = !data.canEdit;
    endDateInput.className = 'mdc-text-field__input';
    edDiv.appendChild(endDateInput);

    var etSpan = document.createElement("span");
    etSpan.className = 'mdc-list-item__meta';

    var etDiv = document.createElement('div');
    etDiv.className = 'mdc-text-field end--time' + count;

    var endTimeInput = document.createElement('input');
    endTimeInput.value = moment(schedule.endTime || new Date()).format('HH:mm');
    endTimeInput.type = 'time';
    endTimeInput.disabled = !data.canEdit;
    endTimeInput.className = 'mdc-text-field__input';

    etDiv.appendChild(endTimeInput);

    etSpan.appendChild(etDiv);

    startLi.appendChild(sdDiv);
    startLi.appendChild(stSpan);

    endLi.appendChild(edDiv);
    endLi.appendChild(etSpan);

    ul.appendChild(startLi);
    ul.appendChild(divider);
    ul.appendChild(endLi);

    document.getElementById('schedule--group').appendChild(scheduleName);
    document.getElementById('schedule--group').appendChild(ul);
  });
}

function createAttachmentContainer(data) {

  var ordering = ['Name', 'Number', 'Template', 'email', 'phoneNumber', 'HHMM', 'weekday', 'number', 'base64', 'string'];

  ordering.forEach(function (order) {
    var group = document.createElement("div");
    group.className = order + '--group';
    document.getElementById('attachment--list').appendChild(group);
  });

  var availTypes = {
    'phoneNumber': '',
    'weekday': '',
    'HH:MM': '',
    'string': '',
    'base64': '',
    'number': '',
    'email': ''
  };

  Object.keys(data.attachment).forEach(function (key) {

    var div = document.createElement('div');
    data.attachment[key].type === 'HH:MM' ? div.className = 'attachment-field HHMM' : div.className = 'attachment-field ' + data.attachment[key].type;
    div.id = convertKeyToId(key);

    if (data.canEdit) {
      div.classList.add('editable--true');
    }

    var label = document.createElement('span');
    label.className = 'label--text';
    label.textContent = key;

    if (key === 'Name' || key === 'Number') {
      div.appendChild(label);
      var required = true;
      div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key, required));
    } else {
      if (data.attachment[key].type === 'string') {
        div.appendChild(label);
        div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key));
      }
    }

    if (data.attachment[key].type === 'number') {
      div.appendChild(label);
      div.appendChild(createNumberInput(data.attachment[key].value, data.canEdit));
    }

    if (data.attachment[key].type === 'email') {
      div.appendChild(label);
      div.appendChild(createEmailInput(data.attachment[key].value, data.canEdit));
    }

    if (data.attachment[key].type === 'phoneNumber') {
      div.classList.add('selector--margin');
      var addButton = document.createElement('label');
      addButton.className = 'mdc-fab add--assignee-icon attachment-selector-label';
      var span = document.createElement('span');
      span.className = 'mdc-fab__icon material-icons';
      span.textContent = 'person_add';
      addButton.appendChild(span);

      var dataVal = document.createElement('span');
      dataVal.className = 'data--value-list';
      dataVal.dataset.primary = '';
      if (data.canEdit) {
        div.appendChild(addButton);
        addButton.onclick = function (evt) {
          selectorUI(evt, {
            record: data,
            store: 'users',
            attachment: {
              present: true,
              key: key
            }
          });
        };
      }
      div.appendChild(label);

      dataVal.textContent = data.attachment[key].value;
      div.appendChild(dataVal);
    }

    if (data.attachment[key].type == 'HH:MM') {
      div.appendChild(label);
      div.appendChild(createTimeInput(data.attachment[key].value, data.canEdit, {
        simple: false,
        type: 'time'
      }));
    }

    if (data.attachment[key].type === 'weekday') {
      div.appendChild(label);
      div.appendChild(createSelectMenu(key, data.attachment[key].value, data.canEdit));
    }

    if (data.attachment[key].type === 'base64') {
      var addCamera = document.createElement('label');
      addCamera.className = 'mdc-fab attachment-selector-label add--assignee-icon';
      addCamera.id = 'start-camera';

      var _span = document.createElement('span');
      _span.className = 'mdc-fab__icon material-icons';
      _span.textContent = 'add_a_photo';
      addCamera.appendChild(_span);

      var imagePreview = document.createElement('ul');
      imagePreview.className = 'image-preview--attachment mdc-image-list standard-image-list mdc-image-list--with-text-protection';

      imagePreview.appendChild(setFilePath(data.attachment[key].value, key, true));

      div.appendChild(imagePreview);

      if (data.canEdit) {

        div.appendChild(addCamera);
        div.appendChild(imagePreview);
        addCamera.onclick = function () {
          readCameraFile();
        };
      }
    }

    if (!availTypes.hasOwnProperty(data.attachment[key].type)) {

      var addButtonName = document.createElement('label');
      addButtonName.className = 'mdc-fab add--assignee-icon attachment-selector-label';
      var spanName = document.createElement('span');
      spanName.className = 'mdc-fab__icon material-icons';
      spanName.textContent = 'add';
      addButtonName.appendChild(spanName);
      div.appendChild(label);
      var valueField = document.createElement('span');
      valueField.textContent = data.attachment[key].value;
      valueField.className = 'data--value-list';
      div.appendChild(valueField);
      // div.appendChild(createInput(key, data.attachment[key].type, 'attachment', true))
      if (data.canEdit) {
        hasAnyValueInChildren(data.office, data.attachment[key].type, data.status).then(function (hasValue) {
          if (hasValue) {
            console.log(hasValue);
            div.appendChild(addButtonName);
            div.classList.add('selector--margin');
            addButtonName.onclick = function (evt) {
              valueField.dataset.primary = '';
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
              });
            };
          }
        });
      }
    }

    var hr = document.createElement('hr');
    hr.className = 'attachment--divider';
    if (data.attachment[key].type === 'HH:MM') {

      document.querySelector('.HHMM--group').appendChild(div);
      document.querySelector('.HHMM--group').appendChild(hr);
    } else if (key === 'Name') {
      document.querySelector('.Name--group').appendChild(div);
      document.querySelector('.Name--group').appendChild(hr);
    } else if (!availTypes.hasOwnProperty(data.attachment[key].type)) {
      document.querySelector('.Template--group').appendChild(div);
      document.querySelector('.Template--group').appendChild(hr);
    } else {
      document.querySelector('.' + data.attachment[key].type + '--group').appendChild(div);
      document.querySelector('.' + data.attachment[key].type + '--group').appendChild(hr);
    }
  });
}

function createAssigneeList(db, record, showLabel) {
  if (showLabel) {

    var labelAdd = document.createElement('li');
    labelAdd.className = 'mdc-list-item label--text add--assignee-loader';
    labelAdd.textContent = 'Assignees';

    var labelButton = document.createElement('span');
    labelButton.className = 'mdc-list-item__meta';
    var addButton = document.createElement('div');
    addButton.className = 'mdc-fab add--assignee-icon';

    addButton.onclick = function (evt) {
      selectorUI(evt, {
        record: record,
        store: 'users',
        attachment: {
          present: false
        }
      });
    };
    var span = document.createElement('span');
    span.className = 'mdc-fab__icon material-icons';
    span.textContent = 'person_add';
    addButton.appendChild(span);
    labelButton.appendChild(addButton);

    if (record.canEdit) {
      labelAdd.appendChild(labelButton);
    }

    document.getElementById('assignees--list').appendChild(labelAdd);
  }
  readNameAndImageFromNumber(record.assignees, db).then(function () {}).catch(function (error) {
    requestCreator('instant', JSON.stringify({ message: error }));
  });
}

function readNameAndImageFromNumber(assignees, db) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(['users']);
    var store = tx.objectStore('users');
    var userRecords = [];
    assignees.forEach(function (assignee) {
      store.get(assignee).onsuccess = function (event) {
        var record = event.target.result;
        if (!record) {
          userRecord.push({
            mobile: assignee,
            displayName: '',
            photoURL: ''
          });
        } else {
          userRecords.push(record);
        }
      };
    });
    tx.oncomplete = function () {
      var assigneeList = document.getElementById('assignees--list');
      if (assigneeList) {
        userRecords.forEach(function (userRecord) {
          assigneeList.appendChild(createSimpleAssigneeLi(userRecord));
        });
        resolve('user list updated');
      }
    };
    tx.onerror = function () {
      reject(JSON.stringify(tx.error));
    };
  });
}

function createSimpleAssigneeLi(userRecord, showMetaInput, isCheckbox) {
  var assigneeLi = document.createElement('li');
  assigneeLi.classList.add('mdc-list-item', 'assignee-li');
  if (!userRecord) return assigneeLi;
  assigneeLi.dataset.value = userRecord.mobile;
  var photoGraphic = document.createElement('img');
  photoGraphic.classList.add('mdc-list-item__graphic');
  photoGraphic.dataset.number = userRecord.mobile;
  if (userRecord.mobile === firebase.auth().currentUser.phoneNumber) {
    photoGraphic.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg';
  } else {
    photoGraphic.src = userRecord.photoURL || './img/empty-user.jpg';
  }
  photoGraphic.setAttribute('onerror', 'handleImageError(this)');

  var assigneeListText = document.createElement('span');
  assigneeListText.classList.add('mdc-list-item__text');
  var assigneeName = document.createElement('span');
  assigneeName.className = 'mdc-list-item__primary-text';

  var assigneeListTextSecondary = document.createElement('span');
  assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text');

  if (!userRecord.displayName) {
    assigneeName.textContent = userRecord.mobile;
  } else {
    assigneeName.textContent = userRecord.displayName;
    assigneeListTextSecondary.textContent = userRecord.mobile;
  }

  assigneeListText.appendChild(assigneeName);
  assigneeListText.appendChild(assigneeListTextSecondary);

  var metaInput = document.createElement('span');
  metaInput.className = 'mdc-list-item__meta material-icons';
  if (showMetaInput) {
    if (isCheckbox) {
      metaInput.appendChild(createCheckBox(userRecord));
    } else {
      metaInput.appendChild(createRadioInput());
      assigneeLi.onclick = function () {
        checkRadioInput(this, assigneeLi.dataset.value);
      };
    }
  }
  assigneeLi.appendChild(photoGraphic);
  assigneeLi.appendChild(assigneeListText);
  assigneeLi.appendChild(metaInput);
  return assigneeLi;
}

function createRadioInput() {
  var div = document.createElement("div");
  div.className = 'mdc-radio radio-control-selector';
  var input = document.createElement('input');
  input.className = 'mdc-radio__native-control';
  input.type = 'radio';
  input.name = 'radio';

  var radioBckg = document.createElement('div');
  radioBckg.className = 'mdc-radio__background';

  var outerRadio = document.createElement('div');
  outerRadio.className = 'mdc-radio__outer-circle';

  var innerRadio = document.createElement("div");
  innerRadio.className = 'mdc-radio__inner-circle';
  radioBckg.appendChild(outerRadio);
  radioBckg.appendChild(innerRadio);

  div.appendChild(input);
  div.appendChild(radioBckg);
  return div;
}

function createCheckBox(userRecord) {

  var checkbox = document.createElement('div');
  checkbox.className = 'mdc-checkbox status-check';
  checkbox.dataset.selected = userRecord.isSelected;

  var input = document.createElement("input");
  input.className = 'mdc-checkbox__native-control';
  input.type = 'checkbox';
  input.onclick = function (evt) {

    checkCheckboxInput(evt, userRecord);
  };
  var checkbox_bckg = document.createElement('div');
  checkbox_bckg.className = 'mdc-checkbox__background';

  var svg = '<svg class="mdc-checkbox__checkmark"\n    viewBox="0 0 24 24">\n    <path class="mdc-checkbox__checkmark-path"\n    fill="none"\n    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>\n    </svg>\n    <div class="mdc-checkbox__mixedmark"></div>';

  var mixedmark = document.createElement('div');
  mixedmark.className = 'mdc-checkbox__mixedmark';
  checkbox_bckg.innerHTML = svg;
  checkbox.appendChild(input);
  checkbox.appendChild(checkbox_bckg);

  return checkbox;
}

function checkCheckboxInput(evt, record) {

  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var objectStore = db.transaction('users', 'readwrite').objectStore('users');
    if (record.hasOwnProperty('isSelected') && record.isSelected) {
      evt.target.parentNode.dataset.selected = false;
      record.isSelected = false;
    } else {
      evt.target.parentNode.dataset.selected = true;
      record.isSelected = true;
      document.querySelector('.selector-send span').textContent = 'send';
    }
    objectStore.put(record);
    if (document.querySelectorAll('[data-selected="true"]').length == 0) {
      document.querySelector('.selector-send span').textContent = 'add';
      document.querySelector('.selector-send').dataset.clicktype = 'numpad';
    } else {
      document.querySelector('.selector-send').dataset.clicktype = '';
    }
  };
}

function checkRadioInput(inherit, value) {
  [].concat(_toConsumableArray(document.querySelectorAll('.radio-selected'))).forEach(function (input) {
    input.classList.remove('radio-selected');
  });
  var parent = inherit;
  var radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'));
  radio['root_'].classList.add('radio-selected');

  document.querySelector('.selector-send span').textContent = 'send';
  document.querySelector('.selector-send').dataset.clicktype = '';
  radio.value = JSON.stringify(value);
  console.log(value);
}

function setFilePath(str, key, show) {

  if (document.querySelector('.image--list-li')) {
    document.getElementById('attachment-picture').src = 'data:image/jpeg;base64,' + str;
    if (!document.getElementById('send-activity').dataset.progress) {
      document.getElementById('send-activity').classList.remove('hidden');
    }
    return;
  }
  var li = document.createElement('li');
  li.className = 'mdc-image-list__item image--list-li';

  var container = document.createElement('div');

  var img = document.createElement('img');
  img.className = 'profile-container--main mdc-image-list__image ';
  img.id = 'attachment-picture';
  img.dataset.photoKey = key;

  img.setAttribute('onerror', 'handleImageErrorAttachment(this)');
  if (!str) {
    img.src = './img/placeholder.png';
  } else {
    img.src = str;
  }
  img.onclick = function () {
    openImage(this.src);
  };
  container.appendChild(img);
  li.appendChild(container);

  var textCont = document.createElement('div');
  textCont.className = 'mdc-image-list__supporting';

  var span = document.createElement('span');
  span.textContent = key;
  span.className = 'mdc-image-list__label';
  span.id = 'label--image';
  textCont.appendChild(span);
  li.appendChild(textCont);
  if (show) return li;
}

function readCameraFile() {
  if (native.getName() === 'Android') {
    try {
      FetchCameraForAttachment.startCamera();
    } catch (e) {
      requestCreator('instant', JSON.stringify({
        message: e.message,
        device: native.getInfo()
      }));
    }
  } else {
    webkit.messageHandlers.takeImageForAttachment.postMessage("convert image to base 64");
  }
}

function openImage(imageSrc) {
  // sendCurrentViewNameToAndroid('selector')

  if (imageSrc.substring(0, 4) !== "data") return;

  document.getElementById('viewImage--dialog-component').querySelector("img").src = imageSrc;
  var imageDialog = new mdc.dialog.MDCDialog.attachTo(document.querySelector('#viewImage--dialog-component'));
  imageDialog.show();
}

function createActivityCancellation(record) {
  var StautsCont = document.createElement('div');
  StautsCont.className = 'status--cancel-cont';

  if (record.hasOwnProperty('create')) return;

  if (!record.canEdit) {
    // StautsCont.appendChild(createSimpleLi('delete',{text:'Deleted'}))
    // document.querySelector('.update-create--activity').appendChild(StautsCont);
    return;
  }

  if (record.status === 'CANCELLED') {
    StautsCont.appendChild(createSimpleLi('undo-deleted', {
      text: 'Deleted',
      id: record.activityId
    }));

    document.querySelector('.update-create--activity').appendChild(StautsCont);
    var undo = new mdc.ripple.MDCRipple.attachTo(document.querySelector('.undo-deleted'));

    return;
  }
  if (record.status !== 'CANCELLED') {

    StautsCont.appendChild(createSimpleLi('delete', {
      text: 'CANCEL'
    }));

    document.querySelector('.update-create--activity').appendChild(StautsCont);
    if (!document.getElementById('cancel-alert')) {
      cancelAlertDialog();
    }

    var dialog = new mdc.dialog.MDCDialog(document.querySelector('#cancel-alert'));

    document.getElementById('delete-allow').onclick = function () {
      if (isLocationVerified()) {

        deleteActivityReq(record.activityId);
      }
    };

    dialog.listen('MDCDialog:cancel', function () {
      console.log('canceled');
    });
    document.querySelector('.delete-activity').addEventListener('click', function (evt) {
      dialog.lastFocusedTarget = evt.target;
      dialog.show();
    });
  }
}

function deleteActivityReq(id) {
  document.querySelector('.delete-activity').style.display = 'none';
  document.querySelector('.status--cancel-cont li').appendChild(loader('cancel-loader'));

  requestCreator('statusChange', {
    activityId: id,
    status: 'CANCELLED'
  });
}

function cancelAlertDialog() {
  var aside = document.createElement('aside');
  aside.className = 'mdc-dialog';
  aside.id = 'cancel-alert';

  var surface = document.createElement('div');
  surface.className = 'mdc-dialog__surface';

  var section = document.createElement('section');
  section.className = 'mdc-dialog__body';

  section.textContent = 'Are you sure you want to delete this activity ? ';

  var footer = document.createElement('footer');
  footer.className = 'mdc-dialog__footer';

  var accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept delete-btn';
  accept.textContent = 'Delete';
  accept.id = 'delete-allow';

  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel cancel-delete-btn';
  cancel.textContent = 'Cancel';

  footer.appendChild(cancel);
  footer.appendChild(accept);
  surface.appendChild(section);
  surface.appendChild(footer);
  aside.appendChild(surface);
  var backdrop = document.createElement('div');
  backdrop.className = 'mdc-dialog__backdrop';
  aside.appendChild(backdrop);
  document.body.appendChild(aside);
}

function sendActivity(record) {

  if (record.hasOwnProperty('create')) {
    insertInputsIntoActivity(record);
    return;
  }

  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function (event) {
    var db = req.result;
    var activityStore = db.transaction('activity', 'readwrite').objectStore('activity');

    activityStore.get(record.activityId).onsuccess = function (event) {
      var record = event.target.result;
      insertInputsIntoActivity(record, activityStore);
    };
  };
}

function concatDateWithTime(date, time) {
  var dateConcat = moment(date + " " + time);
  return moment(dateConcat).valueOf();
}

function insertInputsIntoActivity(record, activityStore) {
  console.log(record);
  var allStringTypes = document.querySelectorAll('.string');
  for (var i = 0; i < allStringTypes.length; i++) {
    var inputValue = allStringTypes[i].querySelector('.mdc-text-field__input').value;

    if (allStringTypes[i].querySelector('.mdc-text-field__input').required && checkSpacesInString(inputValue)) {
      snacks('Please provide an input for the field “Name” ');
      return;
    }
    console.log(convertIdToKey(allStringTypes[i].id));

    record.attachment[convertIdToKey(allStringTypes[i].id)].value = inputValue;
  }

  var allNumberTypes = document.querySelectorAll('.number');
  for (var i = 0; i < allNumberTypes.length; i++) {
    var _inputValue = Number(allNumberTypes[i].querySelector('.mdc-text-field__input').value);
    record.attachment[convertIdToKey(allNumberTypes[i].id)].value = _inputValue;
  }

  var allEmailTypes = document.querySelectorAll('.email');
  for (var i = 0; i < allEmailTypes.length; i++) {
    var _inputValue2 = allEmailTypes[i].querySelector('.mdc-text-field__input').value;
    record.attachment[convertIdToKey(allEmailTypes[i].id)].value = _inputValue2;
  }

  var allTimeTypes = document.querySelectorAll('.HHMM');
  for (var i = 0; i < allTimeTypes.length; i++) {
    var _inputValue3 = allTimeTypes[i].querySelector('.mdc-text-field__input').value;
    record.attachment[convertIdToKey(allTimeTypes[i].id)].value = _inputValue3;
  }

  var imagesInAttachments = document.querySelectorAll('.image-preview--attachment  img');
  for (var _i = 0; _i < imagesInAttachments.length; _i++) {
    record.attachment[convertKeyToId(imagesInAttachments[_i].dataset.photoKey)].value = imagesInAttachments[_i].src;
  }

  var sd = void 0;
  var st = void 0;
  var ed = void 0;
  var et = void 0;
  var allow = true;
  for (var i = 1; i < record.schedule.length + 1; i++) {

    sd = getInputText('.start--date' + i).value;
    st = getInputText('.start--time' + i).value;
    ed = getInputText('.end--date' + i).value;
    et = getInputText('.end--time' + i).value;

    console.log(concatDateWithTime(sd, st));

    if (!concatDateWithTime(sd, st) && !concatDateWithTime(ed, et)) {
      snacks('Please Select A Start Date and End Date');
      return;
    }

    if (sd === "") {
      snacks('Please Select a Start Date');
      return;
    }
    if (ed === "") {
      snacks('Please Select an End Date');
      return;
    }

    if (concatDateWithTime(ed, et) < concatDateWithTime(sd, st)) {
      snacks('The End Date and Time should be greater or equal to the start time');
      return;
    }
    record.schedule[i - 1].startTime = concatDateWithTime(sd, st) || '';
    record.schedule[i - 1].endTime = concatDateWithTime(ed, et) || '';
  }

  for (var i = 0; i < record.venue.length; i++) {
    record.venue[i].geopoint = {
      latitude: record.venue[i].geopoint['_latitude'] || "",
      longitude: record.venue[i].geopoint['_longitude'] || ""
    };
  }

  var requiredObject = {
    venue: record.venue,
    schedule: record.schedule,
    attachment: record.attachment
  };

  sendUpdateReq(requiredObject, record);
}

function sendUpdateReq(requiredObject, record) {

  if (!record.hasOwnProperty('create')) {
    requiredObject.activityId = record.activityId;
    document.querySelector('header').appendChild(progressBar());
    document.querySelector('#send-activity').classList.add('hidden');
    requestCreator('update', requiredObject);
    return;
  }

  requiredObject.office = record.office;
  requiredObject.template = record.template;
  requiredObject.share = record.assignees;

  document.querySelector('header').appendChild(progressBar());
  document.querySelector('#send-activity').classList.add('hidden');
  requestCreator('create', requiredObject);
}

function checkSpacesInString(input) {
  if (!input.replace(/\s/g, '').length) return true;
  return false;
}

function initSearchForSelectors(db, type, attr) {
  searchBarUI(type);
  if (type === 'map') {
    var input = document.getElementById('search--bar-selector');
    var options = {
      componentRestrictions: {
        country: "in"
      }
    };
    autocomplete = new google.maps.places.Autocomplete(input, options);
    initializeAutocompleteGoogle(autocomplete, attr.record, attr);
    return;
  }

  if (type === 'users') {

    initUserSelectorSearch(db, attr);
  }
}

function searchBarUI(type) {

  var dialogEl = document.getElementById('dialog--component');
  var actionCont = dialogEl.querySelector("#dialog--surface-headeraction-data");
  actionCont.className = 'search--cont';

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.add('search-field-transform');
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = 'white';
  if (!document.getElementById('search--bar--field')) {

    actionCont.appendChild(createSimpleInput('', true, true));
  } else {
    document.getElementById('search--bar--field').style.display = 'block';
  }
  document.getElementById('selector--search').style.display = 'none';
  document.querySelector('.selector-send').dataset.clicktype = '';
  document.querySelector('.selector-send span').textContent = 'send';
  dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.type = 'back-list';
  if (type === 'users') {
    dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.state = 'user-list-back';
  }
  // document.getElementById('data-list--container').style.display = 'none'
}

function resetSelectorUI(data) {

  var dialogEl = document.getElementById('dialog--component');
  var actionCont = dialogEl.querySelector("#dialog--surface-headeraction-data");

  dialogEl.querySelector('#dialog--surface-headerview-type span').dataset.type = '';

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.remove('search-field-transform');
  actionCont.querySelector('#search--bar--field').classList.remove('field-input');
  actionCont.classList.remove('search--cont');
  document.getElementById('selector--search').style.display = 'block';
  document.querySelector('.selector-send').style.display = 'block';
  document.querySelector('#search--bar--field').style.display = 'none';
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = '#eeeeee';
  document.getElementById('data-list--container').style.display = 'block';

  var selectorDialog = new mdc.dialog.MDCDialog(dialogEl);

  if (data.store === 'users') {
    document.getElementById('data-list--container').innerHTML = '';
    fillUsersInSelector(data, selectorDialog);
  }

  if (data.store === 'subscriptions') {
    document.getElementById('data-list--container').querySelectorAll('li').forEach(function (li) {
      li.style.display = 'flex';
    });
  }
}

function initializeAutocompleteGoogle(autocomplete, record, attr) {
  document.querySelector('#dialog--component .mdc-dialog__surface').style.width = '100vw';
  document.querySelector('#dialog--component .mdc-dialog__surface').style.height = '100vh';

  autocomplete.addListener('place_changed', function () {
    var place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location");
      return;
    }
    //  document.getElementById('location--container').style.marginTop = '0px'

    var address = '';
    if (place.address_components) {
      address = [place.address_components[0] && place.address_components[0].short_name || '', place.address_components[1] && place.address_components[1].short_name || '', place.address_components[2] && place.address_components[2].short_name || ''].join(' ');
    }

    console.log(address);
    var selectedAreaAttributes = {
      primary: place.name,
      secondary: {
        address: address,
        geopoint: {
          '_latitude': place.geometry.location.lat(),
          '_longitude': place.geometry.location.lng()
        }
      }
    };
    updateDomFromIDB(record, {
      hash: 'venue',
      key: attr.key
    }, selectedAreaAttributes).then(removeDialog).catch(function (error) {
      requestCreator('instant', JSON.stringify({ message: error }));
    });
  });
}

function createSimpleInput(value, canEdit, withIcon, key, required) {

  if (!canEdit) {
    var onlyText = document.createElement('span');
    onlyText.className = 'data--value-list';
    onlyText.textContent = value;
    return onlyText;
  }

  var textField = document.createElement('div');
  if (key && key.length < 15) {

    textField.className = 'mdc-text-field data--value-list';
  } else {
    textField.className = 'mdc-text-field data--value-list-small';
  }

  var input = document.createElement('input');
  input.className = 'mdc-text-field__input input--value--update';
  input.style.paddingTop = '0px';
  input.value = value;
  input.required = required;

  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  if (withIcon) {

    textField.id = 'search--bar--field';
    input.id = 'search--bar-selector';
    textField.classList.add('field-input');
  }
  textField.appendChild(input);
  textField.appendChild(ripple);
  var jsTField = new mdc.textField.MDCTextField.attachTo(textField);

  return textField;
}

function createNumberInput(value, canEdit) {
  if (!canEdit) {
    var simeplText = document.createElement('span');
    simeplText.className = 'data--value-list';
    simeplText.textContent = value;
    return simeplText;
  }
  var textField = document.createElement('div');
  textField.className = 'mdc-text-field data--value-list';
  var input = document.createElement('input');
  input.className = 'mdc-text-field__input input--type-number';
  input.type = 'number';
  input.style.paddingTop = '0px';
  input.value = value;
  input.setAttribute('onkeypress', "return event.charCode >= 48 && event.charCode <= 57");
  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  textField.appendChild(input);
  textField.appendChild(ripple);

  return textField;
}

function createEmailInput(value, canEdit) {
  if (!canEdit) {
    var simeplText = document.createElement('span');
    simeplText.className = 'data--value-list';
    simeplText.textContent = value;
    return simeplText;
  }
  var textField = document.createElement('div');
  textField.className = 'mdc-text-field data--value-list';
  var input = document.createElement('input');
  input.className = 'mdc-text-field__input input--type-email';
  input.type = 'email';
  input.placeholder = 'johndoe@example.com';
  input.style.paddingTop = '0px';
  input.value = value;
  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  textField.appendChild(input);
  textField.appendChild(ripple);

  return textField;
}

function createTimeInput(value, canEdit, attr) {
  if (!canEdit) {
    var simeplText = document.createElement('span');
    simeplText.className = 'data--value-list';
    attr.type === 'date' ? simeplText.textContent = moment(value).calendar() : simeplText.textContent = value;

    return simeplText;
  }
  console.log(canEdit);

  var textField = document.createElement('div');
  textField.className = 'mdc-text-field';
  var input = document.createElement('input');
  input.className = 'mdc-text-field__input input--type-time';
  input.type = attr.type;
  input.style.borderBottom = 'none';

  attr.type === 'date' ? input.value = moment(value).format('YYYY-MM-DD') : input.value = value;
  if (attr.type === 'time') {
    textField.classList.add('data--value-list');
    input.style.width = '100%';
    input.value = value || moment(new Date()).format('HH:mm');
  }
  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  textField.appendChild(input);
  textField.appendChild(ripple);
  if (attr.simple) {
    input.classList.remove('mdc-text-field__input');
    return input;
  }
  return textField;
}

function createSelectMenu(key, value, canEdit) {
  if (!canEdit) {
    var span = document.createElement('span');
    span.className = 'data--value-list';
    span.textContent = value;
    return span;
  }
  var div = document.createElement('div');
  div.className = 'mdc-select data--value-list';
  div.style.height = '32%;';
  div.id = convertKeyToId(key);
  div.dataset.value = key;
  div.dataset.primary = '';
  var select = document.createElement('select');
  select.className = 'mdc-select__native-control';
  select.style.paddingRight = '0px';
  var weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (var i = 0; i < weekdays.length; i++) {
    var option = document.createElement('option');
    option.value = weekdays[i];
    option.textContent = weekdays[i];
    if (value === weekdays[i]) {
      option.setAttribute('selected', 'true');
    }

    select.appendChild(option);
  }
  var label = document.createElement('label');
  label.className = 'mdc-floating-label';
  label.textContent = '';

  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';
  div.appendChild(label);
  div.appendChild(select);
  div.appendChild(ripple);
  return div;
}

function showSendActivity(evt) {
  console.log(evt);
  var sendActivity = document.getElementById('send-activity');
  var rect1 = sendActivity.getBoundingClientRect();
  var rect2 = document.querySelector('.status--cancel-cont').getBoundingClientRect();
  var isOverlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
  console.log(isOverlap);
  if (isOverlap) {
    sendActivity.classList.add('hidden');
    return;
  }
  sendActivity.classList.remove('hidden');
}

function toggleActionables(id) {
  console.log(id);
  if (!id) return;
  if (document.getElementById('app-current-panel').dataset.view === 'create') return;
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var activityStore = db.transaction('activity').objectStore('activity');
    activityStore.get(id).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) {
        listView();
        return;
      }
      var actions = document.querySelectorAll('.mdc-fab');
      if (!record.editable) return;

      if (document.querySelector('.loader')) {
        document.querySelector('.loader').remove();
        if (document.querySelector('.add--assignee-loader .add--assignee-icon')) {

          document.querySelector('.add--assignee-loader .add--assignee-icon').style.display = 'block';
        }
      }
      if (document.querySelector('.progress--update')) {
        document.querySelector('.progress--update').remove();
      }
    };
  };
}