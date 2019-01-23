var notification = new Worker('js/notification.js');

var scroll_namespace = {
  count: 0,
  size: 20,
  skip: false
};

function initDomLoad() {

  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove();
  }

  if (document.querySelector('.mdc-linear-progress')) {
    document.querySelector('.mdc-linear-progress').remove();
  }

  listPanel();
  creatListHeader('Activities');
  createActivityIcon();
}

function listView(filter, updatedActivities) {
  history.pushState(['listView'], null, null);
  initDomLoad();

  getRootRecord().then(function (record) {

    if (record.suggestCheckIn) {
      document.getElementById('alert--box').innerHTML = createCheckInDialog().outerHTML;
      showSuggestCheckInDialog();
    }

    window.addEventListener('scroll', handleScroll, false);

    if (!filter) {
      startCursor(record.location);
      return;
    }

    notificationWorker('urgent', filter.urgent).then(function () {
      notificationWorker('nearBy', filter.nearby).then(function () {
        startCursor(record.location);
      });
    });
  });
}

function updateEl(activities, currentLocation) {

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var tx = db.transaction(['list', 'activity']);
    var activityStore = tx.objectStore('activity');
    var listStore = tx.objectStore('list');
    var ul = document.getElementById('activity--list');
    activities.forEach(function (activity) {
      listStore.get(activity.activityId).onsuccess = function (event) {
        var record = event.target.result;
        var existingEl = document.querySelector('[data-id="' + activity.activityId + '"]');
        if (existingEl) {
          existingEl.remove();
        }
        if (!record) return;
        getActivityDataForList(activityStore, record, currentLocation).then(function (li) {
          ul.insertBefore(li, ul.childNodes[0]);
        });
      };
    });
  };
}

function handleScroll(ev) {
  getRootRecord().then(function (record) {
    if (window.innerHeight + window.scrollY === document.body.scrollHeight) {
      startCursor(record.location);
    }
  });
};

function startCursor(currentLocation) {
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var transaction = db.transaction(['list', 'activity', 'root']);
    var activity = transaction.objectStore('activity');
    var store = transaction.objectStore('list');
    var index = store.index('timestamp');
    var iterator = 0;
    var advanceCount = scroll_namespace.count;
    var fragment = document.createDocumentFragment();
    index.openCursor(null, 'prev').onsuccess = function (event) {

      var cursor = event.target.result;
      if (!cursor) return;

      if (advanceCount) {
        if (!scroll_namespace.skip) {
          scroll_namespace.skip = true;
          cursor.advance(advanceCount);
        } else {

          getActivityDataForList(activity, cursor.value, currentLocation).then(function (dom) {
            fragment.appendChild(dom);
            iterator++;
          });

          runCursor(cursor, iterator);
        }
      } else {

        getActivityDataForList(activity, cursor.value, currentLocation).then(function (dom) {
          fragment.appendChild(dom);
          iterator++;
        });

        runCursor(cursor, iterator);
      }
    };

    /** Transaction has ended. Increment the namespace_count 
     * If an activity was clicked and not changed then scroll to that activity
     */

    transaction.oncomplete = function () {
      var ul = document.getElementById('activity--list');
      if (!ul) return;

      ul.appendChild(fragment);
      scroll_namespace.count = scroll_namespace.count + scroll_namespace.size;
      scroll_namespace.skip = false;
      scroll_namespace.size = 20;
      scrollToActivity();
    };
  };
}

function runCursor(cursor, iterator) {
  var size = scroll_namespace.size;
  if (iterator < size) {
    cursor.continue();
  }
}

function getActivityDataForList(activity, value, currentLocation) {
  return new Promise(function (resolve, reject) {

    var secondLine = document.createElement('span');
    secondLine.className = 'mdc-list-item__secondary-text';

    activity.get(value.activityId).onsuccess = function (event) {

      var record = event.target.result;
      if (!record) return;
      var schedules = record.schedule;
      var venues = record.venue;
      var status = record.status;

      if (status === 'PENDING') {
        secondLine.appendChild(generateLastestSchedule(schedules));
      } else {
        if (schedules.length) {
          var el = document.createElement('div');
          el.textContent = generateTextIfActivityIsNotPending(status);
          secondLine.appendChild(el);
        }
      }
      secondLine.appendChild(generateLatestVenue(venues, currentLocation));
      resolve(activityListUI(value, secondLine));
    };
  });
}

function generateTextIfActivityIsNotPending(status) {
  var textStatus = {
    'CONFIRMED': 'Done',
    'CANCELLED': 'Cancelled'
  };
  return textStatus[status];
}

function generateSecondLine(name, value) {
  var el = document.createElement('div');
  if (name && value) {
    el.textContent = name + ' : ' + value;
  } else {
    el.textContent = '';
  }
  return el;
}

function generateLastestSchedule(schedules) {
  var length = schedules.length;
  var text = void 0;
  switch (length) {
    case 0:
      text = generateSecondLine('', '');
      break;
    case 1:
      var timeTypeSingle = getTimeTypeForSingleSchedule(schedules[0]);
      text = generateSecondLine(timeTypeSingle.name, timeTypeSingle.value);
      break;
    default:
      var formattedDates = formatDates(schedules);
      var ascendingOrder = sortDatesInAscendingOrderWithPivot({
        time: moment().valueOf(),
        pivot: true
      }, formattedDates);
      var timeTypeMultiple = getTimeTypeForMultipleSchedule(ascendingOrder);
      text = generateSecondLine(timeTypeMultiple.name, timeTypeMultiple.time);
      break;
  }
  return text;
}

function getTimeTypeForSingleSchedule(schedule) {
  var today = moment().format('DD-MM-YYYY');
  var startTime = moment(schedule.startTime).format('DD-MM-YYYY');
  var newScheduleText = {
    name: schedule.name,
    value: ''
  };
  if (!startTime) return newScheduleText;
  if (!schedule.endTime) return newScheduleText;

  if (moment(startTime).isAfter(moment(today))) {
    newScheduleText.value = moment(startTime).calendar();
  } else {
    newScheduleText.value = moment(schedule.endTime).calendar();
  }
  return newScheduleText;
}

function formatDates(schedules) {
  var formatted = [];
  schedules.forEach(function (schedule) {
    formatted.push({
      time: schedule.startTime,
      name: schedule.name
    });
    formatted.push({
      time: schedule.endTime,
      name: schedule.name
    });
  });
  return formatted;
}

function sortDatesInAscendingOrderWithPivot(pivot, dates) {
  var dataset = dates.slice();
  dataset.push(pivot);
  return dataset.sort(function (a, b) {
    return a.time - b.time;
  });
}

function getTimeTypeForMultipleSchedule(dates) {
  var duplicate = dates.slice();
  var pivotIndex = positionOfPivot(duplicate);
  if (pivotIndex === dates.length - 1) {
    duplicate[pivotIndex - 1].time = moment(duplicate[pivotIndex - 1].time).calendar();
    return duplicate[pivotIndex - 1];
  }
  duplicate[pivotIndex + 1].time = moment(duplicate[pivotIndex + 1].time).calendar();
  return duplicate[pivotIndex + 1];
}

function positionOfPivot(dates) {
  var index = dates.findIndex(function (obj) {
    if (obj.pivot) {
      return obj;
    }
  });
  return index;
}

function generateLatestVenue(venues, currentLocation) {
  var length = venues.length;
  var text = '';
  switch (length) {
    case 0:
      text = generateSecondLine('', '');
      break;
    case 1:
      text = generateSecondLine(venues[0].venueDescriptor, venues[0].location);
      break;
    default:

      var distances = [];
      venues.forEach(function (venue) {

        var lat = venue.geopoint['_latitude'];
        var lon = venue.geopoint['_longitude'];
        if (lat && lon) {
          var geopoint = {
            latitude: lat,
            longitude: lon
          };
          distances.push({
            distance: calculateDistanceBetweenTwoPoints(geopoint, currentLocation),
            desc: venue.venueDescriptor,
            location: venue.location
          });
        }
      });
      if (!distances.length) {
        text = generateSecondLine('', '');
      } else {

        var sortedDistance = sortNearestLocation(distances);
        text = generateSecondLine(sortedDistance[0].desc, sortedDistance[0].location);
      }
  }
  return text;
}

function sortNearestLocation(distances) {
  var dataset = distances.slice();
  return dataset.sort(function (a, b) {
    return a.distance - b.distance;
  });
}

function activityListUI(data, secondLine) {

  var li = document.createElement('li');
  li.dataset.id = data.activityId;
  li.setAttribute('onclick', 'localStorage.setItem(\'clickedActivity\',this.dataset.id);conversation(this.dataset.id,true)');
  li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1');

  var creator = document.createElement("img");
  creator.dataset.number = data.creator.number;
  creator.className = 'mdc-list-item__graphic material-icons';
  creator.setAttribute('onerror', 'handleImageError(this)');
  creator.src = data.creator.photo || './img/empty-user.jpg';

  var leftTextContainer = document.createElement('span');
  leftTextContainer.classList.add('mdc-list-item__text');
  var activityNameText = document.createElement('span');

  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold';

  activityNameText.textContent = data.activityName;

  // if (data.urgent || data.nearby) {
  //   secondLine.textContent = data.secondLine;
  // }
  // else {
  //   if(data.lastComment.user && data.lastComment.text) {
  //     secondLine.textContent = `${data.lastComment.user} : ${data.lastComment.text}`;
  //   }
  // }

  leftTextContainer.appendChild(activityNameText);

  leftTextContainer.appendChild(secondLine);
  // leftTextContainer.appendChild(lastComment)

  var metaTextContainer = document.createElement('span');
  metaTextContainer.classList.add('mdc-list-item__meta');
  metaTextContainer.appendChild(generateIconByCondition(data, li));

  var metaTextActivityStatus = document.createElement('span');
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', 'status-in-activity', '' + data.status);
  var statusIcon = document.createElement('i');
  statusIcon.className = 'material-icons';

  var cancelIcon = document.createElement('i');
  cancelIcon.classList.add('status-cancel', 'material-icons');
  cancelIcon.appendChild(document.createTextNode('clear'));

  var confirmedIcon = document.createElement('i');
  confirmedIcon.classList.add('status-confirmed', 'material-icons');
  confirmedIcon.appendChild(document.createTextNode('check'));

  if (data.status === 'CONFIRMED') {
    metaTextActivityStatus.appendChild(confirmedIcon);
  }
  if (data.status === 'CANCELLED') {
    metaTextActivityStatus.appendChild(cancelIcon);
  }

  metaTextContainer.appendChild(metaTextActivityStatus);

  li.appendChild(creator);
  li.appendChild(leftTextContainer);
  li.appendChild(metaTextContainer);
  return li;
}

function generateIconByCondition(data, li) {
  var icon = document.createElement('i');
  icon.className = 'material-icons notification';
  if (data.urgent) {
    icon.textContent = 'alarm';

    return icon;
  }
  if (data.nearby) {
    icon.textContent = 'location_on';
    return icon;
  }
  if (data.count) {

    var countDiv = document.createElement('div');

    var countSpan = document.createElement('span');
    countSpan.textContent = data.count;
    countSpan.className = 'count mdc-meta__custom-text';
    countDiv.appendChild(countSpan);
    li.classList.add('count-active');
    return countDiv;
  }
  var timeCustomText = document.createElement('div');
  timeCustomText.className = 'mdc-meta__custom-text';
  timeCustomText.style.width = '80px';
  timeCustomText.style.fontSize = '14px';
  timeCustomText.textContent = moment(data.timestamp).calendar();
  return timeCustomText;
}

function appendActivityListToDom(activityDom) {
  var parent = document.getElementById('activity--list');
  if (parent) {
    parent.appendChild(activityDom);
  }
}

function getRootRecord() {
  return new Promise(function (resolve, reject) {
    var record = void 0;
    var dbName = localStorage.getItem('dbexist');
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var rootTx = db.transaction(['root'], 'readwrite');
      var rootStore = rootTx.objectStore('root');
      rootStore.get(dbName).onsuccess = function (event) {
        var data = event.target.result;
        data ? record = data : record = null;
      };

      rootTx.oncomplete = function () {
        if (record) {
          resolve(record);
        } else {
          reject('No root record found');
        }
      };
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function createActivityIcon() {
  if (document.getElementById('create-activity')) return;
  getCountOfTemplates().then(function (officeTemplateObject) {
    if (Object.keys(officeTemplateObject).length) {
      createActivityIconDom();
      return;
    }
  }).catch(console.log);
}

function getCountOfTemplates() {

  return new Promise(function (resolve, reject) {
    var count = 0;
    var officeByTemplate = {};
    var req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['subscriptions'], 'readonly');
      var subscriptionObjectStore = tx.objectStore('subscriptions').index('office');
      subscriptionObjectStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        var cursor = event.target.result;

        if (!cursor) return;
        count++;
        officeByTemplate[cursor.value.office] = count;
        cursor.continue();
      };

      tx.oncomplete = function () {
        resolve(officeByTemplate);
      };
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function createActivityIconDom() {

  var parent = document.getElementById('create-activity--parent');

  var fab = document.createElement('button');
  fab.className = 'mdc-fab create-activity';
  fab.id = 'create-activity';
  fab.setAttribute('aria-label', 'Add');
  var span = document.createElement('span');
  span.className = 'mdc-fab_icon material-icons';
  span.id = 'activity-create--icon';

  span.textContent = 'add';

  fab.appendChild(span);
  parent.innerHTML = fab.outerHTML;

  document.querySelector('.create-activity').addEventListener('click', function (evt) {
    callSubscriptionSelectorUI(evt);
  });
}

function callSubscriptionSelectorUI(evt, checkIn) {
  selectorUI(evt, {
    record: '',
    store: 'subscriptions',
    suggestCheckIn: checkIn
  });
}

function listPanel() {
  if (document.getElementById('activity-list-main')) return;

  var listCard = document.createElement('div');
  listCard.className = 'mdc-card panel-card mdc-top-app-bar--fixed-adjust';
  listCard.id = 'activity-list-main';
  var listUl = document.createElement('ul');
  listUl.className = 'mdc-list mdc-list--two-line mdc-list--avatar-list';
  listUl.id = 'activity--list';

  listCard.appendChild(listUl);

  var fabParent = document.createElement('div');
  fabParent.id = 'create-activity--parent';
  listCard.appendChild(fabParent);

  document.getElementById('app-current-panel').innerHTML = listCard.outerHTML;
}

function creatListHeader(headerName) {
  var parentIconDiv = document.createElement('div');
  parentIconDiv.className = 'profile--icon-header';

  var menuIcon = document.createElement('span');
  menuIcon.id = 'menu--panel';

  var icon = document.createElement('img');
  icon.src = firebase.auth().currentUser.photoURL;
  icon.className = 'list-photo-header';
  menuIcon.appendChild(icon);

  var headerText = document.createElement('p');
  headerText.textContent = headerName;
  menuIcon.appendChild(headerText);
  parentIconDiv.appendChild(menuIcon);

  var searchIcon = document.createElement('span');
  searchIcon.id = 'search--panel';
  var sicon = document.createElement('i');
  sicon.className = 'material-icons';
  sicon.textContent = 'search';
  searchIcon.appendChild(sicon);
  modifyHeader({
    id: 'app-main-header',
    left: parentIconDiv.outerHTML,
    right: ''
  });
  document.querySelector('.list-photo-header').addEventListener('click', function () {
    profileView(true);
  });
}

function scrollToActivity() {
  var clickedActivity = localStorage.getItem('clickedActivity');
  if (document.querySelector('[data-id="' + clickedActivity + '"]')) {
    document.querySelector('[data-id="' + clickedActivity + '"]').scrollIntoView({
      behavior: "instant",
      block: "center",
      "inline": "center"
    });
    localStorage.removeItem('clickedActivity');
    return;
  }
}

function notificationWorker(type, updateTimestamp) {
  return new Promise(function (resolve, reject) {

    notification.postMessage({
      dbName: firebase.auth().currentUser.uid,
      type: type,
      updateTimestamp: updateTimestamp
    });

    notification.onmessage = function (message) {
      resolve(message.data);
    };
    notification.onerror = function (error) {
      reject(error);
    };
  });
}

function modifyHeader(attr) {

  if (attr.left) {

    var left = document.getElementById(attr.id + 'view-type');
    left.innerHTML = attr.left;
  }
  if (attr.right) {

    var right = document.getElementById(attr.id + 'action-data');
    right.innerHTML = attr.right;
  }
}

function createInputForProfile(key, type, classtype) {
  var mainTextField = document.createElement('div');
  mainTextField.className = 'mdc-text-field mdc-text-field--dense ' + classtype + ' attachment--text-field';

  mainTextField.dataset.key = key;
  mainTextField.dataset.type = type;
  mainTextField.id = key.replace(/\s/g, '');
  var mainInput = document.createElement('input');
  mainInput.className = 'mdc-text-field__input';

  if (type && key === 'displayName') {
    mainInput.placeholder = 'Your Name';
  }
  if (type && key === 'email') {
    mainInput.placeholder = 'Your Email';
  }

  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  mainTextField.appendChild(mainInput);
  mainTextField.appendChild(ripple);
  return mainTextField;
}

function suggestCheckIn(value) {
  return new Promise(function (resolve, reject) {
    getRootRecord().then(function (record) {

      var req = indexedDB.open(firebase.auth().currentUser.uid);
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction(['root'], 'readwrite');
        var store = tx.objectStore('root');
        if (record.suggestCheckIn !== value) {

          record.suggestCheckIn = value;
          store.put(record);
        }
        tx.oncomplete = function () {
          resolve(true);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      };
      req.onerror = function () {
        reject(req.error);
      };
    }).catch(function (error) {
      reject(error);
    });
  });
}