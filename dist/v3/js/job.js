function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function jobView(currentDuty) {
  progressBar.close();
  var duty = currentDuty;
  dom_root.classList.add('mdc-top-app-bar--fixed-adjust');
  dom_root.innerHTML = '';
  var header = setHeader("<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a><span class=\"mdc-top-app-bar__title\" >".concat(currentDuty.activityName, "</span>"), "");
  header.root_.classList.remove("hidden");
  getCustomerPhoneNumber(duty.attachment.Location.value).then(function (customerPhonenumber) {
    console.log(duty);
    duty.customerPhonenumber = customerPhonenumber;
    dom_root.appendChild(constructJobView(duty));
  });
}

;

function getCurrentJob() {
  return new Promise(function (resolve, reject) {
    var office = ApplicationState.selectedOffice;
    var tx = db.transaction('activity');
    var store = tx.objectStore('activity');
    var auth = firebase.auth().currentUser;
    var record = {
      activityName: 'DUTY',
      attachment: {
        'Duty Type': {
          value: '',
          type: 'duty'
        },
        'Location': {
          value: ApplicationState.venue ? ApplicationState.venue.location : ''
        },
        'Include': {
          value: ''
        },
        'Supervisor': {
          value: ''
        },
        'Products': {
          value: [{
            name: '',
            rate: '',
            date: '',
            quanity: ''
          }]
        }
      },
      "checkins": [],
      "calls": [],
      creator: {
        phoneNumber: '',
        displayName: '',
        photoURL: ''
      },
      office: ApplicationState.selectedOffice,
      template: 'duty',
      schedule: [{
        startTime: Date.now(),
        endTime: Date.now(),
        name: 'Date'
      }],
      assignees: [{
        displayName: auth.displayName,
        photoURL: auth.photoURL,
        phoneNumber: auth.phoneNumber
      }],
      venue: [],
      canEdit: false,
      supervisior: null,
      finished: false,
      isActive: false,
      timestamp: Date.now()
    };
    var bound = IDBKeyRange.bound(moment().startOf('day').valueOf(), moment().endOf('day').valueOf());

    store.index('timestamp').openCursor(bound).onsuccess = function (e) {
      var cursor = e.target.result;
      if (!cursor) return;

      if (cursor.value.office !== office) {
        cursor["continue"]();
        return;
      }

      if (cursor.value.template !== 'duty') {
        cursor["continue"]();
        return;
      }

      ;

      if (!isToday(cursor.value.schedule[0].startTime)) {
        cursor["continue"]();
        return;
      }

      if (!ApplicationState.venue) {
        cursor["continue"]();
        return;
      }

      if (cursor.value.attachment.Location.value !== ApplicationState.venue.location) {
        cursor["continue"]();
        return;
      }

      ;

      if (cursor.value.finished == false) {
        return;
      }

      if (cursor.value.isActive == false) {
        cursor["continue"]();
        return;
      }

      console.log('matched location with duty location');
      record = cursor.value;
      cursor["continue"]();
    };

    tx.oncomplete = function () {
      console.log(record);
      resolve(record);
    };
  });
}

function handleFinishedDuty(duty) {
  var el = document.querySelector('#time-clock');
  el.innerHTML = duty.timer.time;
}

function createAppHeader() {
  var header = setHeader("\n    <span class=\"mdc-top-app-bar__title\">OnDuty</span>\n    ", "<div class=\"mdc-menu-surface--anchor\">\n        <button class=\"material-icons mdc-top-app-bar__action-item mdc-icon-button\" aria-label=\"Profile\" id='settings-icon'>more_vert</button>\n        <div class=\"mdc-menu mdc-menu-surface\" id='app-menu'>\n            <ul class=\"mdc-list\" role=\"menu\" aria-hidden=\"true\" aria-orientation=\"vertical\" tabindex=\"-1\">\n                <li class=\"mdc-list-item\" role=\"menuitem\" data-type='settings'>\n                    <span class=\"mdc-list-item__text\">Settings</span>\n                </li>\n            </ul>\n        </div>\n    </div>");
  header.root_.classList.remove('hidden'); // setTimeout(function(){

  var menu = new mdc.menu.MDCMenu(header.root_.querySelector('.mdc-menu-surface'));
  document.getElementById('settings-icon').addEventListener('click', function () {
    menu.open = true;
    menu.listen('MDCMenu:selected', function (e) {
      console.log(e);

      if (e.detail.item.dataset.type == 'settings') {
        history.pushState(['profileScreen'], null, null);
        profileScreen();
        return;
      }

      ;

      if (e.detail.item.dataset.type == 'share') {
        var offices = JSON.parse(e.detail.item.dataset.offices);

        if (offices.length == 1) {
          giveSubscriptionInit(offices[0]);
          return;
        }

        ;
        var officeDialog = new Dialog('Choose office', officeSelectionList(offices), 'choose-office-subscription').create('simple');
        var offieList = new mdc.list.MDCList(document.getElementById('dialog-office'));
        bottomDialog(officeDialog, offieList);
        offieList.listen('MDCList:action', function (officeEvent) {
          officeDialog.close();
          giveSubscriptionInit(offices[officeEvent.detail.index]);
        });
      }
    });
  }); // },5000)

  return header;
}

function getCustomerPhoneNumber(location) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(['map', 'activity']);
    var mapStore = tx.objectStore('map');
    var activity;

    mapStore.index('location').get(location).onsuccess = function (e) {
      var record = e.target.result;
      if (!record) return resolve('');
      var activityStore = tx.objectStore('activity');

      activityStore.get(record.activityId).onsuccess = function (evt) {
        activity = evt.target.result;

        if (activity) {
          resolve(activity.attachment['First Contact'].value || activity.attachment['Second Contact'].value);
          return;
        }

        resolve('');
      };
    };
  });
}

function getSupervisorContact(phoneNumber) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction('users');
    var store = tx.objectStore('users');

    store.get(phoneNumber).onsuccess = function (evt) {
      record = evt.target.result;
    };

    tx.oncomplete = function () {
      resolve(record);
    };
  });
}

function createDutyRejection() {
  var container = createElement("div", {
    className: 'full-width'
  });
  var textField = textAreaWithHelper({
    label: 'Reason',
    required: true
  });
  var field = new mdc.textField.MDCTextField(textField.querySelector('.mdc-text-field'));
  field.root_.classList.add('full-width');
  var reasonSubmit = createButton('submit');
  reasonSubmit.classList.add("mdc-button--raised", 'full-width');
  reasonSubmit.addEventListener('click', function () {
    reasonSubmit.toggleAttribute('disabled');

    if (!field.value.trim()) {
      setHelperInvalid(field, 'Please give a reason');
      return;
    }

    ;
    setHelperValid(field);
    appLocation(3).then(function (geopoint) {
      return requestCreator('comment', {
        comment: field.value.trim()
      }, geopoint);
    }).then(function () {
      document.getElementById('dialog-container').innerHTML = '';
      reasonSubmit.toggleAttribute('disabled');
    })["catch"](function () {
      reasonSubmit.toggleAttribute('disabled');
    });
  });
  container.appendChild(textField);
  container.appendChild(reasonSubmit);
  return container;
}

function showUpcomingDuty(duty) {
  var cont = createElement("div", {
    className: 'duty-pop--container'
  });
  var heading = createElement('div', {
    className: 'inline-flex full-width'
  });
  var reasonContainer = createElement('div', {
    className: 'reason--container mt-20 hidden'
  }); // const reject = createButton('REJECT', '', 'close');
  // reject.classList.add('reject-duty');
  // reject.addEventListener('click',function(){
  //     reasonContainer.classList.remove('hidden')
  //     reasonContainer.appendChild(createDutyRejection());
  // })

  var close = createElement('i', {
    className: 'material-icons close-popup',
    textContent: 'close',
    style: 'margin-left:auto'
  });
  close.setAttribute('data-mdc-dialog-action', 'close'); // heading.appendChild(reject)

  heading.appendChild(close);
  cont.appendChild(heading);
  cont.appendChild(reasonContainer);
  var details = createElement('div', {
    className: 'duty-popup--details'
  });
  details.innerHTML = "\n    <div class='details'>\n        <span class='inline-flex mb-10 mt-20'>\n            <i class='material-icons mdc-theme--primary'>directions_bike</i>\n            <span class='ml-10'>".concat(duty.distance, " Km</span>\n        </span>\n        <span class='inline-flex mb-10 mt-20'>\n            <i class='material-icons mdc-theme--primary'>hourglass_top</i>\n            <span class='ml-10'>").concat(getTimeToReach(duty.distance, 20), "</span>\n        </span>\n        <hr>\n        <div class='customer mt-10'>\n            <div class='inline-flex mt-10 mb-10 full-width mdc-theme--primary'>\n                <i class='material-icons'>location_on</i>\n                <span class='ml-10'>").concat(duty.attachment.Location.value, " </span>\n            </div>\n            ").concat(duty.attachment['Duty Type'].value ? "<div class='inline-flex mt-10 mb-10 full-width mdc-theme--primary'>\n                <i class='material-icons'>assignment</i>\n                <span class='ml-10'>".concat(duty.attachment['Duty Type'].value, " </span>\n            </div>") : '', "\n        </div>\n        <hr>\n        <div class='supervisior'>\n            ").concat(duty.supervisiorContact ? "<ul class='mdc-list mdc-list--two-line mdc-list--avatar-list'>\n            <li class='mdc-list-item pl-0'>\n               \n                    <img class='mdc-list-item__graphic' src='".concat(duty.supervisiorContact.photoURL || './img/empty-user.jpg', "'>\n                    \n                    <span class='mdc-list-item__text'>\n                        <span class='mdc-list-item__primary-text'>").concat(duty.supervisiorContact.displayName || duty.supervisiorContact.mobile, "</span>\n                        <span class=\"mdc-list-item__secondary-text\">Supervisor</span>\n                    </span>\n                    <a class='mdc-list-item__meta material-icons' href='tel:").concat(duty.supervisiorContact.mobile, "'>phone</a>\n            </li>\n        </ul>") : '', "\n           \n            <span class='inline-flex mt-10 mb-10 full-width'>\n                <i class='material-icons mdc-theme--primary'>access_time</i>\n                <span class='ml-10'>").concat(moment(duty.schedule[0].startTime).format('hh:mm A'), " to ").concat(moment(duty.schedule[0].endTime).format('hh:mm A'), " </span>\n            </span>\n        </div>\n        ").concat(duty.assignees.length ? " <hr><div class='staff mdc-theme--primary'>\n            <span class='inline-flex mt-10 mb-10 full-width'>\n                <i class='material-icons'>group</i>\n                <span class='ml-10'>Staffs</span>\n            </span>\n            <div class='mdc-chip-set'>\n                ".concat(duty.assignees.map(function (contact, index) {
    var image = createElement('img', {
      className: 'mdc-chip__icon mdc-chip__icon--leading',
      src: contact.photoURL || './img/empty-user.jpg'
    });
    return createDynamicChips(contact.displayName || contact.mobile, index, image).outerHTML;
  }).join(""), "\n                </div>\n            </div>") : '', "\n        \n        ").concat(checkProductLength(duty.attachment.Products.value) ? "<hr><div class='products'>\n            <span class='inline-flex mt-10 mb-10 full-width'>\n                <i class='material-icons'>settings</i>\n                <span class='ml-10'>Products</span>\n            </span>\n            <ul class='mdc-list mdc-list--two-line'>\n            ".concat(duty.attachment.Products.value.map(function (product) {
    return "<li class='mdc-list-item'>\n                    <span class='mdc-list-item__text'>\n                        <span class='mdc-list-item__primary-text'>".concat(product.name, "</span>\n                        <span class='mdc-list-item__secondary-text'>Quantity : ").concat(product.quanity, "</span>\n                    </span>\n                    <span class='mdc-list-item__meta'>").concat(convertNumberToINR(Number(product.rate)), "</span>\n                </li>");
  }), "\n            </ul>\n        </div>") : '', "\n    </div>\n    <div class='navigate text-center mt-10'>\n        ").concat(createExtendedFab('navigation', 'Navigate', 'navigate', '', "https://www.google.com/maps/dir/?api=1&origin=".concat(ApplicationState.location.latitude, "%2C").concat(ApplicationState.location.longitude, "&destination=").concat(duty.coords.latitude, "%2C").concat(duty.coords.longitude)).outerHTML, "\n    </div>\n    ");
  cont.appendChild(details);
  var dialog = new Dialog('', cont, 'duty-dialog').create('simple');
  dialog.open();
  dialog.scrimClickAction = '';
  dialog.content_.querySelector('#navigate').setAttribute('data-mdc-dialog-action', 'accept');
  console.log(dialog);
}

function getTimeToReach(distance, speed) {
  var time = distance / speed;
  if (time < 1) return "".concat(time.toFixed(1) * 40, " minutes");
  return "".concat(time.toFixed(1), " Hours");
}

function dutyScreen(duty) {
  var container = createElement('div', {
    className: 'duty-container'
  });
  container.innerHTML = "\n  \n    <div class='mdc-card duty-overview'>\n       <div class='duty-details pt-10'>\n           <div class='customer'>\n               <div class='location full-width mb-10'>\n                   <div class='icon' style='float:left;'>\n                       <i class='material-icons mdc-theme--primary'>location_on</i>\n                   </div>\n                   <div class='text mdc-typography--headline6 ml-10'>\n                      ".concat(duty.attachment.Location.value || '-', "\n                    </div>\n                </div>\n                ").concat(duty.customerPhonenumber ? "\n                    <span class='inline-flex mb-10 customer-contact'>\n                    <i class='material-icons mdc-theme--secondary'>phone</i>\n                    <span class='mdc-typography--headline6 ml-10'>\n                        <a href='tel:".concat(duty.customerPhonenumber, "'>").concat(duty.customerPhonenumber, "</a>\n                    </span>\n                </span>") : '', "            \n           </div>\n           <div class='full-width mb-10 mt-10 counter-container text-center'>\n                \n        \n                ").concat(duty.isActive ? "\n                <div class='mdc-typography--headline6 bold' style='color:#7C909E;'>Duty started ".concat(duty.creator.phoneNumber ? '' : "at ".concat(formatCreatedTime(duty.schedule[0].startTime)), "</div>\n                <div id='time-clock' class='mdc-typography--headline3 bold mb-10' data-id=\"").concat(duty.activityId, "\"></div>\n                <div class='finish-button--container mt-20'>\n                        ").concat(createExtendedFab('close', 'Finish duty', 'finish').outerHTML, "\n                </div>") : '', " \n           </div>\n           <span class='inline-flex'>\n            <i class='material-icons  mdc-theme--secondary'>access_time</i>\n            <span class='mdc-typography--body1 ml-10'>").concat(formatCreatedTime(duty.schedule[0].startTime), " - ").concat(formatCreatedTime(duty.schedule[0].endTime), "</span>\n        </span>\n           ").concat(duty.attachment['Duty Type'].value ? "<div class='duty-type'>\n                <span class='inline-flex mb-10'>\n                    <i class='material-icons mdc-theme--secondary'>assignment</i>\n                    <span class='mdc-typography--headline6 ml-10'>".concat(duty.attachment['Duty Type'].value || '-', " </span>\n                </span>\n            </div>") : '', "\n           <div class='staff mt-10'>\n                <span class='inline-flex'>\n                    <i class='material-icons mdc-theme--secondary'>group_add</i>\n                    <span class='mdc-typography--headline6 ml-10'>Staff</span>\n                </span>\n                <div class=\"mdc-chip-set\" role=\"grid\">\n                    ").concat(viewAssignee(duty), "\n                </div>\n            </div>\n\n           <div class='products'>\n           ").concat(checkProductLength(duty.attachment.Products.value) ? "\n               <span class='inline-flex'>\n                   <i class='material-icons mdc-theme--secondary'>settings</i>\n                   <span class='mdc-typography--headline6 ml-10'>Products</span>\n               </span>\n               <ul class='mdc-list mdc-list--two-line'>\n                    ".concat(duty.attachment.Products.value.map(function (product) {
    return "<li class='mdc-list-item'>\n                           <span class='mdc-list-item__text'>\n                               <span class='mdc-list-item__primary-text'>".concat(product.name, "</span>\n                               <span class='mdc-list-item__secondary-text'>Quantity : ").concat(product.quanity, "</span>\n                           </span>\n                           <span class='mdc-list-item__meta'>").concat(convertNumberToINR(Number(product.rate)), "</span>\n                       </li>");
  }), "\n               </ul>") : '', "\n           </div>\n       </div>\n   </div>");
  return container;
}

function showDutySchedule(duty) {
  return "".concat(moment(duty.schedule[0].startTime).format('hh:mm A'), " to ").concat(moment(duty.schedule[0].endTime).format('hh:mm A'));
}

var createImageLi = function createImageLi(url, supportingText) {
  var li = createElement('li', {
    className: 'mdc-image-list__item'
  });
  li.innerHTML = "<div class=\"mdc-image-list__image-aspect-container\">\n                <img class=\"mdc-image-list__image\" src=\"".concat(url, "\" alt=\"Text label\">\n        </div>\n        <div class=\"mdc-image-list__supporting\">\n            <span class=\"mdc-image-list__label\">").concat(supportingText, "</span>\n        </div>");
  return li;
};

function constructJobView(duty) {
  var el = createElement('div', {
    className: 'mdc-layout-grid job-screen'
  });
  el.appendChild(dutyScreen(duty));
  var timeline = createElement('div', {
    className: 'mdc-card timeline-overview mt-10'
  });
  var imageList = createElement('ul', {
    className: 'mdc-image-list standard-image-list mdc-image-list--with-text-protection'
  });

  if (duty.hasOwnProperty('checkins')) {
    console.log('has photo');
    duty.checkins.forEach(function (activity) {
      if (activity.attachment.Photo.value) {
        console.log('has photo');
        var imageLi = createImageLi(activity.attachment.Photo.value, formatCreatedTime(activity.timestamp));
        imageLi.addEventListener('click', function () {
          var cont = createElement('div', {
            className: 'full-width'
          });
          var ul = createElement('ul', {
            className: 'mdc-list mdc-list--two-line mdc-list--avatar-list pt-0'
          });
          var creatorLi = createElement('li', {
            className: 'mdc-list-item pl-0 pr-0'
          });
          creatorLi.innerHTML = "<img src=\"".concat(activity.creator.photoURL || './img/empty-user.jpg', "\" class=\"mdc-list-item__graphic\">\n                    <span class=\"mdc-list-item__text\">\n                           <span class=\"mdc-list-item__primary-text\">").concat(activity.creator.displayName || activity.creator.phoneNumber, "</span>\n                           <span class=\"mdc-list-item__secondary-text\">").concat(formatCreatedTime(activity.timestamp), "</span>\n                       </span>");
          ul.appendChild(creatorLi);
          cont.appendChild(ul);

          if (activity.attachment.Comment.value) {
            cont.appendChild(createElement('p', {
              className: 'mdc-typography--body1 mt-0',
              textContent: activity.attachment.Comment.value
            }));
          }

          cont.appendChild(createElement('img', {
            src: activity.attachment.Photo.value,
            style: 'width:100%'
          }));
          var dialog = new Dialog('', cont).create('');
          dialog.open();
        });
        imageList.appendChild(imageLi);
      }
    });
  }

  ;

  if (imageList.childElementCount) {
    timeline.appendChild(imageList);
  } else {
    timeline.appendChild(createElement('div', {
      className: 'mdc-typography--subtitle2 text-center',
      textContent: 'No photos uploaded'
    }));
  }

  el.appendChild(timeline);

  if (duty.isActive) {
    var finish = el.querySelector('#finish');
    finish.classList.add('mdc-button--raised');
    finish.addEventListener('click', function () {
      markDutyFinished(duty);
    });
    var photoBtn = createExtendedFab('add_a_photo', 'Upload photo', '', true);
    photoBtn.style.zIndex = '99';
    photoBtn.addEventListener('click', function () {
      history.pushState(['cameraView'], null, null);
      openCamera();
    });
    el.appendChild(photoBtn);
  }

  return el;
}

function markDutyFinished(duty) {
  var tx = db.transaction('activity', 'readwrite');
  var store = tx.objectStore('activity');
  duty.isActive = false;
  store.put(duty);

  tx.oncomplete = function () {
    successDialog("Duty completed");
    history.back();
  };
}

function checkProductLength(products) {
  return products.filter(function (product) {
    return product.name;
  }).length;
}

function getTimelineAddendum(geopoint) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction('addendum');
    var store = tx.objectStore('addendum');
    var unique = {};
    var bound = IDBKeyRange.bound(moment().startOf('day').valueOf(), moment().endOf('day').valueOf());

    store.index('timestamp').openCursor(bound).onsuccess = function (evt) {
      var cursor = evt.target.result;
      if (!cursor) return;

      if (_typeof(cursor.value.location) !== 'object') {
        cursor["continue"]();
        return;
      }

      if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints({
        latitude: cursor.value.location._latitude,
        longitude: cursor.value.location._longitude
      }, geopoint))) {
        cursor["continue"]();
        return;
      }

      unique[cursor.value.activityId] = cursor.value;
      cursor["continue"]();
    };

    tx.oncomplete = function () {
      var result = [];
      console.log(result);
      Object.keys(unique).forEach(function (id) {
        result.push(unique[id]);
      });
      var sorted = result.sort(function (first, second) {
        return second.timestamp - first.timestamp;
      });
      resolve(sorted);
    };
  });
}

function getTimelineActivityData(addendums, office) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction('activity');
    var store = tx.objectStore('activity');
    var filteredResult = {
      currentDuty: '',
      timelineData: []
    };
    addendums.forEach(function (addendum) {
      if (!addendum.activityId) return;

      store.get(addendum.activityId).onsuccess = function (evt) {
        var record = evt.target.result;
        if (!record) return;
        if (record.office !== office) return;

        if (addendum.timestamp === ApplicationState.lastCheckInCreated && record.template === 'duty') {
          filteredResult.currentDuty = record;
        }

        record.geopoint = addendum.geopoint;
        filteredResult.timelineData.push(record);
      };
    });

    tx.oncomplete = function () {
      resolve(filteredResult);
    };
  });
}

function createTimeLapse(timeLineUl) {
  var header = setHeader("<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>\n    <span class=\"mdc-top-app-bar__title\">History</span>\n    ", '');
  var timeLine = createElement('div', {
    className: 'timeline'
  });
  var historyCont = createElement('div', {
    className: 'history-tl-container'
  });
  historyCont.appendChild(timeLineUl);
  var screen = createElement('div', {
    className: 'timeline--container'
  });
  timeLine.appendChild(historyCont);
  dom_root.innerHTML = '';
  screen.appendChild(timeLine);
  var bottomContainer = createElement('div', {
    className: 'timeline--footer'
  });
  var close = createButton('close');
  close.classList.add("mdc-button--raised", 'rounded-close');
  close.addEventListener('click', function () {
    history.back();
  });
  bottomContainer.appendChild(close);
  screen.appendChild(bottomContainer);
  dom_root.appendChild(screen);
}

function createTimelineLi(activity) {
  var eventName = mapTemplateNameToTimelineEvent(activity);
  var li = createElement("li", {
    className: "tl-item ".concat(activity.template)
  });
  li.dataset.activity = JSON.stringify(activity);
  var div = createElement('div', {
    className: 'item-title',
    textContent: eventName
  });
  var span = createElement('span', {
    className: 'event-time mdc-typography--caption',
    textContent: moment(activity.timestamp).format('hh:mm A')
  });
  li.addEventListener('click', function () {
    var activity = JSON.parse(li.dataset.activity);
    var heading = createActivityHeading(activity);
    showViewDialog(heading, activity, 'view-form');
  });
  li.appendChild(div);
  li.appendChild(span);
  return li;
}

function mapTemplateNameToTimelineEvent(activity) {
  if (activity.template === 'check-in') {
    if (activity.attachment.Photo.value) return 'Uploaded photo';
    return 'Check-In';
  }

  if (activity.template === 'leave') {
    return "On leave";
  }

  return 'Created ' + activity.template;
}

function checkForDuty(duty) {
  // db.transaction('activity').objectStore('activity').get('d1EbIdtHvw1x51yAcbFd').onsuccess = function(e){
  //     const duty = e.target.result;
  // if (duty.schedule[0].startTime <= Date.now()) return;
  if (duty.schedule[0].endTime < Date.now()) return;
  var tx = db.transaction('map');
  var store = tx.objectStore('map');

  store.index('location').get(duty.attachment.Location.value).onsuccess = function (evt) {
    var record = evt.target.result;
    if (!record) return;
    duty.distance = calculateDistanceBetweenTwoPoints(record, ApplicationState.location).toFixed(1);
    duty.coords = record;
  };

  tx.oncomplete = function () {
    getSupervisorContact(duty.attachment.Supervisor.value).then(function (supervisiorContact) {
      duty.supervisiorContact = supervisiorContact;
      showUpcomingDuty(duty);
    });
  }; // }

}

function getAllCustomer(office) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction('map');
    var store = tx.objectStore('map');
    var result = [];

    store.index('office').openCursor(office).onsuccess = function (evt) {
      var cursor = evt.target.result;
      if (!cursor) return;

      if (!cursor.value.location || !cursor.value.address) {
        cursor["continue"]();
        return;
      }

      if (cursor.value.template !== 'customer') {
        cursor["continue"]();
        return;
      }

      result.push(cursor.value);
      cursor["continue"]();
    };

    tx.oncomplete = function () {
      resolve(result);
    };
  });
}

function getChildrenActivity(office, template) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction('children');
    var store = tx.objectStore("children");
    var result = [];

    store.index('officeTemplate').openCursor([office, template]).onsuccess = function (evt) {
      var cursor = evt.target.result;
      if (!cursor) return;

      if (cursor.value.status === 'CANCELLED') {
        cursor["continue"]();
        return;
      }

      result.push(cursor.value);
      cursor["continue"]();
    };

    tx.oncomplete = function () {
      resolve(result);
    };
  });
}

function showRating(callSubscription, customer, dutyId) {
  history.pushState(['showRating'], null, null);
  var backIcon = "<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>\n    <span class=\"mdc-top-app-bar__title mdc-typography--headline5 bold\">How was your job ?</span>\n    ";
  var header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden');
  dom_root.innerHTML = "\n    <div id='rating-view'>\n        <iframe id='rating-form' src='".concat(window.location.origin, "/v2/forms/rating/index.html'></iframe>;\n    </div>");
  Promise.all([getChildrenActivity(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'customer'), getAllCustomer(callSubscription.office)]).then(function (response) {
    var products = response[0];
    var productSubscription = response[1];
    var customerSubscription = response[2];
    var customers = response[3];
    document.getElementById('rating-form').addEventListener("load", function (ev) {
      passFormData({
        name: 'init',
        template: callSubscription,
        body: {
          products: products,
          customers: customers,
          customer: customer,
          canEditProduct: productSubscription,
          canEditCustomer: customerSubscription,
          dutyId: dutyId
        },
        deviceType: _native.getName()
      });
    });
  });
}

function convertNumberToINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function createProductLi(products, product) {
  var li = createElement('li', {
    className: 'mdc-list-item',
    textContent: product.name
  });
  li.dataset.name = product.name;
  li.dataset.date = product.date;
  li.dataset.quantity = product.quantity;
  li.dataset.rate = product.rate;
  var edit = createElement('span', {
    className: 'mdc-list-item__meta material-icons mdc-theme--primary',
    textContent: 'edit'
  });
  edit.addEventListener('click', function () {
    openProductScreen(products, product);
  });
  var remove = createElement('span', {
    className: 'mdc-list-item__meta material-icons mdc-theme--error ml-20',
    textContent: 'delete'
  });
  remove.addEventListener('click', function () {
    li.remove();
  });
  li.appendChild(edit);
  li.appendChild(remove);
  return li;
}

function openProductScreen(products, selectedProduct) {
  productDialog = new Dialog("New product", createProductScreen(products, selectedProduct)).create('simple');
  productDialog.open();
}

function createProductScreen(products) {
  var savedProduct = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    rate: '',
    date: '',
    quantity: '',
    name: ''
  };
  var div = createElement('div', {
    className: 'product-choose-container'
  });
  var name = createProductSelect(products);

  if (savedProduct.name) {
    name.value = savedProduct.name;
  }

  var rate = new mdc.textField.MDCTextField(textField({
    id: 'rate',
    label: 'Rate',
    type: 'number',
    value: savedProduct.rate || ''
  }));
  var quantity = new mdc.textField.MDCTextField(textField({
    id: 'quantity',
    label: 'Quantity',
    type: 'number',
    value: savedProduct.quantity || ''
  }));
  var date = new mdc.textField.MDCTextField(textField({
    id: 'date',
    type: 'date',
    label: 'Date',
    value: savedProduct.data || createDate(new Date())
  }));
  div.appendChild(name.root_);
  div.appendChild(rate.root_);
  div.appendChild(quantity.root_);
  div.appendChild(date.root_);
  var actionButtons = createElement('div', {
    className: 'dialog-action-buttons'
  });
  var cancel = createButton('cancel');
  cancel.addEventListener('click', function (e) {
    e.preventDefault();
    productDialog.close();
  });
  var save = createButton('save');
  save.classList.add("mdc-button--raised");
  actionButtons.appendChild(cancel);
  actionButtons.appendChild(save);
  save.addEventListener('click', function (e) {
    e.preventDefault();
    productDialog.close();

    if (!name.value) {
      showSnacksApiResponse('Please select a product name');
      return;
    }

    if (document.querySelector("[data-product-name=\"".concat(name.value, "\"]"))) {
      document.querySelector("[data-product-name=\"".concat(name.value, "\"]")).remove();
    }

    var selectedProduct = {
      rate: Number(rate.value),
      date: date.value,
      quantity: Number(quantity.value),
      name: name.value
    };
    var ul = document.getElementById('product-list');

    _toConsumableArray(ul.querySelectorAll('li')).forEach(function (li) {
      if (li.dataset.name === name.value) {
        li.remove();
      }
    });

    ul.appendChild(createProductLi(products, selectedProduct));
  });
  div.appendChild(actionButtons);
  return div;
}

function appView() {
  var header = createAppHeader();
  dom_root.classList.add('mdc-top-app-bar--fixed-adjust');
  dom_root.innerHTML = "\n        \n        <div class='tabs-section'>\n            <div id='app-tab-content'></div>\n        </div>";
  appTabBar.listen('MDCTabBar:activated', function (evt) {
    switchTabs(evt.detail.index);
  });
  appTabBar.activateTab(0);
  var parent = document.getElementById('app-tab-content');
  swipe(parent, function (direction) {
    var focusedTabIndex = appTabBar.foundation_.adapter_.getFocusedTabIndex();

    if (direction === 'up') {
      header.root_.querySelector('.mdc-top-app-bar__row').classList.remove('hidden');
      return;
    }

    if (direction === 'down') {
      header.root_.querySelector('.mdc-top-app-bar__row').classList.add('hidden');
      return;
    }

    if (direction === 'right') {
      focusedTabIndex++;
    } else {
      focusedTabIndex--;
    }

    if (!appTabBar.tabList_[focusedTabIndex]) {
      focusedTabIndex = 0;
      return;
    }

    ;
    appTabBar.activateTab(focusedTabIndex);
  });
}

function switchTabs(index) {
  if (document.getElementById('search-btn')) {
    document.getElementById('search-btn').remove();
  }

  document.querySelector('.mdc-top-app-bar__row').classList.remove('hidden');

  if (index == 0) {
    var shareMenu = document.querySelector('#app-menu ul li[data-type="share"]');

    if (shareMenu) {
      shareMenu.remove();
    }

    showAllDuties();
    return;
  }

  if (index == 1) {
    chatView();
    return;
  }
}

function showAllDuties() {
  dom_root.classList.add('mdc-top-app-bar--fixed-adjust');
  document.getElementById('app-header').classList.remove('hidden');
  var tx = db.transaction('activity');
  var store = tx.objectStore('activity');
  var dutiesCont = createElement('div', {
    className: 'all-duties'
  });
  var listGroup = createElement('div', {
    className: 'mdc-list-group'
  });
  var activeUl = createElement('ul', {
    className: 'mdc-list mdc-list--two-line mdc-list--avatar-list active-ul mdc-elevation--z6'
  });
  var dutiesUl = createElement('ul', {
    className: 'mdc-list mdc-list--two-line mdc-list--avatar-list duties--ul'
  });
  var activities = [];

  store.index('template').openCursor('duty').onsuccess = function (evt) {
    var cursor = evt.target.result;
    if (!cursor) return;

    if (!Array.isArray(cursor.value.schedule)) {
      cursor["continue"]();
      return;
    }

    if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
      cursor["continue"]();
      return;
    }

    activities.push(cursor.value);
    cursor["continue"]();
  };

  tx.oncomplete = function () {
    var hasCurrentDuty = false;
    var hasPreviousDuties = false;
    var sortedDates = activities.sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });
    var hasMultipleOffice = Object.keys(ApplicationState.officeWithCheckInSubs).length > 1;
    getCurrentJob().then(function (activeDuty) {
      var activeDutyId = activeDuty.activityId;
      sortedDates.forEach(function (activity) {
        var li = dutyDateList(activity, activeDutyId, hasMultipleOffice);

        if (activeDutyId && activeDutyId === activity.activityId) {
          hasCurrentDuty = true;
          activeDuty.isActive = true;
          li.addEventListener('click', function () {
            removeSwipe();
            history.pushState(['jobView', activeDuty], null, null);
            jobView(activeDuty);
          });
          activeUl.appendChild(li);
          console.log('going to start timer');
        } else {
          hasPreviousDuties = true;
          li.addEventListener('click', function () {
            history.pushState(['jobView', activity], null, null);
            jobView(activity);
          });
          dutiesUl.appendChild(li);
          dutiesUl.appendChild(createElement('li', {
            className: 'mdc-list-divider'
          }));
        }
      });

      if (hasCurrentDuty) {
        listGroup.appendChild(createElement('h3', {
          className: 'mdc-list-group__subheader active--subheader',
          textContent: 'Ongoing'
        }));
      }

      listGroup.appendChild(activeUl);

      if (hasPreviousDuties) {
        listGroup.appendChild(createElement('h3', {
          className: 'mdc-list-group__subheader previous--subheader mt-10',
          textContent: 'Previous'
        }));
      }

      listGroup.appendChild(dutiesUl);
      dutiesCont.appendChild(listGroup);
      new mdc.list.MDCList(dutiesUl);
    }); // getReportSubscriptions('attendance').then(function (subs) {
    //     if (!subs.length) return;
    //     dutiesCont.appendChild(createTemplateButton(subs))
    // })

    var el = document.getElementById('app-tab-content');

    if (el) {
      el.innerHTML = "";
      el.appendChild(dutiesCont);
    }
  };
}

function dutyDateList(duty, activeDutyId, multipleOffice) {
  var li = createElement('li', {
    className: 'mdc-list-item'
  });

  if (multipleOffice) {
    li.classList.add('mdc-list--with-office');
  }

  if (activeDutyId === duty.activityId) {
    li.classList.add('active-duty');
  }

  ;
  li.innerHTML = "<span class=\"mdc-list-item__text full-width\">\n      \n        <span class=\"mdc-list-item__primary-text\">\n           \n            ".concat(duty.attachment.Location.value, "\n        </span>\n    \n        <span class=\"mdc-list-item__secondary-text bold duty-list--time\">\n            ").concat(formatCreatedTime(duty.schedule[0].startTime), " to ").concat(formatCreatedTime(duty.schedule[0].endTime), "\n        </span>\n        ").concat(multipleOffice ? "<span class=\"mdc-list-item__secondary-text duty-list--office full-width\">\n        ".concat(duty.office, "\n    </span>") : '', "\n   \n    </span>\n    <span class='mdc-list-item__meta material-icons navigate-next'>navigate_next</span>\n    ");
  new mdc.ripple.MDCRipple(li);
  return li;
}

function createProductSelect(products) {
  var select = createElement('div', {
    className: 'mdc-select full-width'
  });
  select.innerHTML = "<i class=\"mdc-select__dropdown-icon\"></i>\n                        <select class=\"mdc-select__native-control\">\n                            ".concat(products.map(function (product) {
    return "<option value=\"".concat(product.attachment.Name.value, "\">").concat(product.attachment.Name.value, "</option>");
  }).join(""), "\n                        </select>\n                        <label class=\"mdc-floating-label\">Choose product</label>\n                        <div class=\"mdc-line-ripple\"></div>");
  return new mdc.select.MDCSelect(select);
}

function createDate(dateObject) {
  console.log(dateObject);
  var month = dateObject.getMonth() + 1;
  var date = dateObject.getDate();

  if (month < 10) {
    month = '0' + month;
  }

  if (date < 10) {
    date = '0' + date;
  }

  ;
  return "".concat(dateObject.getFullYear(), "-").concat(month, "-").concat(date);
}

function getDutyStatus(duty) {
  var currentTimestamp = Date.now();
  if (duty.schedule[0].endTime < currentTimestamp) return 'Finished';
  if (duty.schedule[0].startTime > currentTimestamp) return 'Upcoming';
  if (duty.schedule[0].startTime <= currentTimestamp && currentTimestamp <= duty.schedule[0].endTime) return 'Open';
}

function createTemplateButton(subs) {
  var button = createExtendedFab('work_off', 'Apply leave', '', true);
  button.addEventListener('click', function () {
    console.log(subs);

    if (subs.length == 1) {
      history.pushState(['addView'], null, null);
      addView(subs[0]);
      return;
    }

    var officeDialog = new Dialog('Choose office', officeSelectionList(subs), 'choose-office-subscription').create('simple');
    var officeList = new mdc.list.MDCList(document.getElementById('dialog-office'));
    bottomDialog(officeDialog, officeList);
    officeList.listen('MDCList:action', function (officeEvent) {
      var selectedSubscription = subs[officeEvent.detail.index];
      officeDialog.close();
      history.pushState(['addView'], null, null);
      addView(selectedSubscription);
    });
  });
  return button;
}

function getReportSubscriptions(name) {
  return new Promise(function (resolve, reject) {
    var result = [];
    var tx = db.transaction('subscriptions');
    var store = tx.objectStore('subscriptions').index('report');

    store.openCursor(name).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      if (cursor.value.status === 'CANCELLED') {
        cursor["continue"]();
        return;
      }

      if (cursor.value.template === 'attendance regularization') {
        cursor["continue"]();
        return;
      }

      result.forEach(function (sub, index, object) {
        if (sub.office === cursor.value.office && sub.template === cursor.value.template) {
          if (!sub.hasOwnProperty('timestamp') || !cursor.value.hasOwnProperty('timestamp')) {
            object.splice(index, 1);
          } else {
            if (sub.timestamp < cursor.value.timestamp) {
              object.splice(index, 1);
            }
          }
        }
      });
      result.push(cursor.value);
      cursor["continue"]();
    };

    tx.oncomplete = function () {
      console.log(result);
      resolve(result);
    };
  });
}

function showTabs(tabs, id) {
  var div = createElement('div', {
    className: 'mdc-tab-bar',
    id: id
  });
  div.setAttribute('role', 'tablist');
  div.innerHTML = "<div class=\"mdc-tab-scroller\">\n    <div class=\"mdc-tab-scroller__scroll-area\">\n      <div class=\"mdc-tab-scroller__scroll-content\">\n    \n        ".concat(tabs.map(function (tab) {
    return "\n            <button class=\"mdc-tab\" role=\"tab\" aria-selected=\"false\" tabindex=\"-1\" id=".concat(tab.id || '', ">\n            <span class=\"mdc-tab__content\">\n              <span class=\"mdc-tab__text-label\">").concat(tab.name, "</span>\n              <span class=\"mdc-tab-indicator\">\n                <span class=\"mdc-tab-indicator__content mdc-tab-indicator__content--underline\"></span>\n              </span>\n            </span>\n            <span class=\"mdc-tab__ripple\"></span>\n          </button>");
  }).join(""), "\n      </div>\n    </div>\n  </div>");
  return div;
}

function isToday(timestamp) {
  return moment(timestamp).isSame(moment().clone().startOf('day'), 'd');
}