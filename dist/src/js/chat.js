//This file needs searious refactoring

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
    var container = document.querySelector('.status--change-cont');
    var record = event.target.result;
    if (!record.canEdit || record.status === 'CANCELLED') {
      var statusSpan = document.createElement('span');
      var _record = event.target.result;
      statusSpan.textContent = 'Activity ' + _record.status.toLowerCase();
      if (container) {
        container.innerHTML = statusSpan.outerHTML;
        container.style.textAlign = 'center';
      }
      return;
    }
    if (record.editable == 0) {

      container ? container.innerHTML = label.outerHTML + loader('status-loader').outerHTML : '';
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

      var svg = '<svg class="mdc-checkbox__checkmark"\n        viewBox="0 0 24 24">\n        <path class="mdc-checkbox__checkmark-path"\n        fill="none"\n        d="M1.73,12.91 8.1,19.28 22.79,4.59"/>\n        </svg>\n        <div class="mdc-checkbox__mixedmark"></div>';

      var mixedmark = document.createElement('div');
      mixedmark.className = 'mdc-checkbox__mixedmark';
      checkbox_bckg.innerHTML = svg;
      checkbox.appendChild(input);
      checkbox.appendChild(checkbox_bckg);

      div.appendChild(checkbox);

      if (container) {
        container.innerHTML = div.outerHTML + label.outerHTML;
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
            updateCreateActivity(record);
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