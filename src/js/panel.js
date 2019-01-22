const notification = new Worker('js/notification.js')

const scroll_namespace = {
  count: 0,
  size: 20,
  skip: false
}



function initDomLoad() {

  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  }

  if (document.querySelector('.mdc-linear-progress')) {
    document.querySelector('.mdc-linear-progress').remove();
  }
  
  listPanel()
  creatListHeader('Activities');
  createActivityIcon();
}

function listView(filter, updatedActivities) {
  history.pushState(['listView'], null, null)
  initDomLoad()

  getRootRecord().then(function (record) {

    if (record.suggestCheckIn) {
      document.getElementById('alert--box').innerHTML = createCheckInDialog().outerHTML
      showSuggestCheckInDialog()
    }

    window.addEventListener('scroll', handleScroll,false)

    if (!filter) {
      startCursor(record.location);
      return;
    }

    notificationWorker('urgent', filter.urgent).then(function () {
      notificationWorker('nearBy', filter.nearby).then(function () {
        startCursor(record.location);
      })
    });
  })
}

function updateEl(activities, currentLocation) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['list', 'activity'])
    const activityStore = tx.objectStore('activity')
    const listStore = tx.objectStore('list');
    const ul = document.getElementById('activity--list')
    activities.forEach(function (activity) {
      listStore.get(activity.activityId).onsuccess = function (event) {
        const record = event.target.result;
        const existingEl = document.querySelector(`[data-id="${activity.activityId}"]`)
        if (existingEl) {
          existingEl.remove();
        }
        if(!record) return;
        getActivityDataForList(activityStore, record, currentLocation).then(function (li) {
          ul.insertBefore(li, ul.childNodes[0])
        })
      }
    })
  }
}

function handleScroll(ev) { 
  getRootRecord().then(function(record){
    if(window.innerHeight + window.scrollY === document.body.scrollHeight) {
      startCursor(record.location);
    }
  })

};
 
function startCursor(currentLocation) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;
    const transaction = db.transaction(['list', 'activity', 'root'])
    const activity = transaction.objectStore('activity');
    const store = transaction.objectStore('list')
    const index = store.index('timestamp');
    let iterator = 0;
    const advanceCount = scroll_namespace.count;
    let fragment = document.createDocumentFragment();

    const ul = document.getElementById('activity--list')
    index.openCursor(null, 'prev').onsuccess = function (event) {

      const cursor = event.target.result;
      if (!cursor) return;

      if (advanceCount) {
        if (!scroll_namespace.skip) {
          scroll_namespace.skip = true
          cursor.advance(advanceCount)
        } else {
          
          getActivityDataForList(activity, cursor.value, currentLocation).then(function (dom) {
            fragment.appendChild(dom)
            iterator++
          })
         
          runCursor(cursor, iterator)
        }
      } else {
     
        getActivityDataForList(activity, cursor.value, currentLocation).then(function (dom) {
          fragment.appendChild(dom)
          iterator++
        })
      
        runCursor(cursor, iterator)
      }
    }

    /** Transaction has ended. Increment the namespace_count 
     * If an activity was clicked and not changed then scroll to that activity
     */

    transaction.oncomplete = function () {
    
      ul.appendChild(fragment)
      scroll_namespace.count = scroll_namespace.count + scroll_namespace.size;
      scroll_namespace.skip = false
      scroll_namespace.size = 20
      scrollToActivity()
    }
  }
}

function runCursor(cursor, iterator) {
  const size = scroll_namespace.size;
  if (iterator < size) {
    cursor.continue();
  }
}


function getActivityDataForList(activity, value, currentLocation) {
  return new Promise(function (resolve, reject) {

    const secondLine = document.createElement('span')
    secondLine.className = 'mdc-list-item__secondary-text'

    activity.get(value.activityId).onsuccess = function (event) {

      const record = event.target.result;
      if (!record) return
      const schedules = record.schedule;
      const venues = record.venue;
      const status = record.status

      if (status === 'PENDING') {
        secondLine.appendChild(generateLastestSchedule(schedules));
      } else {
        if (schedules.length) {
          const el = document.createElement('div')
          el.textContent = generateTextIfActivityIsNotPending(status)
          secondLine.appendChild(el);
        }
      }
      secondLine.appendChild(generateLatestVenue(venues, currentLocation));
      resolve(activityListUI(value, secondLine))
    }
  })
}

function generateTextIfActivityIsNotPending(status) {
  const textStatus = {
    'CONFIRMED': 'Done',
    'CANCELLED': 'Cancelled'
  }
  return textStatus[status]
}

function generateSecondLine(name, value) {
  const el = document.createElement('div');
  if (name && value) {
    el.textContent = `${name} : ${value}`
  } else {
    el.textContent = ''
  }
  return el
}


function generateLastestSchedule(schedules) {
  const length = schedules.length;
  let text;
  switch (length) {
    case 0:
      text = generateSecondLine('', '')
      break;
    case 1:
      const timeTypeSingle = getTimeTypeForSingleSchedule(schedules[0])
      text = generateSecondLine(timeTypeSingle.name, timeTypeSingle.value)
      break;
    default:
      const formattedDates = formatDates(schedules);
      const ascendingOrder = sortDatesInAscendingOrderWithPivot({
        time: moment().valueOf(),
        pivot: true
      }, formattedDates);
      const timeTypeMultiple = getTimeTypeForMultipleSchedule(ascendingOrder);
      text = generateSecondLine(timeTypeMultiple.name, timeTypeMultiple.time);
      break;
  }
  return text
}

function getTimeTypeForSingleSchedule(schedule) {
  const today = moment().format('DD-MM-YYYY');
  const startTime = moment(schedule.startTime).format('DD-MM-YYYY');
  let newScheduleText = {
    name: schedule.name,
    value: ''
  }
  if (!startTime) return newScheduleText
  if (!schedule.endTime) return newScheduleText

  if (moment(startTime).isAfter(moment(today))) {
    newScheduleText.value = moment(startTime).calendar();
  } else {
    newScheduleText.value = moment(schedule.endTime).calendar();
  }
  return newScheduleText;

}

function formatDates(schedules) {
  const formatted = []
  schedules.forEach(function (schedule) {
    formatted.push({
      time: schedule.startTime,
      name: schedule.name
    })
    formatted.push({
      time: schedule.endTime,
      name: schedule.name
    })
  })
  return formatted;
}

function sortDatesInAscendingOrderWithPivot(pivot, dates) {
  const dataset = dates.slice();
  dataset.push(pivot);
  return dataset.sort(function (a, b) {
    return a.time - b.time;
  })
}

function getTimeTypeForMultipleSchedule(dates) {
  const duplicate = dates.slice()
  const pivotIndex = positionOfPivot(duplicate);
  if (pivotIndex === dates.length - 1) {
    duplicate[pivotIndex - 1].time = moment(duplicate[pivotIndex - 1].time).calendar();
    return duplicate[pivotIndex - 1]
  }
  duplicate[pivotIndex + 1].time = moment(duplicate[pivotIndex + 1].time).calendar();
  return duplicate[pivotIndex + 1]
}

function positionOfPivot(dates) {
  const index = dates.findIndex(function (obj) {
    if (obj.pivot) {
      return obj
    }
  })
  return index;
}

function generateLatestVenue(venues, currentLocation) {
  const length = venues.length
  let text = ''
  switch (length) {
    case 0:
      text = generateSecondLine('', '');
      break;
    case 1:
      text = generateSecondLine(venues[0].venueDescriptor, venues[0].location)
      break;
    default:


      const distances = []
      venues.forEach(function (venue) {

        const lat = venue.geopoint['_latitude']
        const lon = venue.geopoint['_longitude']
        if (lat && lon) {
          const geopoint = {
            latitude: lat,
            longitude: lon
          }
          distances.push({
            distance: calculateDistanceBetweenTwoPoints(geopoint, currentLocation),
            desc: venue.venueDescriptor,
            location: venue.location
          })
        }
      })
      if (!distances.length) {
        text = generateSecondLine('', '')
      } else {

        const sortedDistance = sortNearestLocation(distances)
        text = generateSecondLine(sortedDistance[0].desc, sortedDistance[0].location)
      }
  }
  return text;
}

function sortNearestLocation(distances) {
  const dataset = distances.slice();
  return dataset.sort(function (a, b) {
    return a.distance - b.distance
  })
}

function activityListUI(data, secondLine) {

  const li = document.createElement('li')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', `localStorage.setItem('clickedActivity',this.dataset.id);conversation(this.dataset.id,true)`)
  li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1');

  const creator = document.createElement("img")
  creator.dataset.number = data.creator.number
  creator.className = 'mdc-list-item__graphic material-icons'
  creator.setAttribute('onerror', `handleImageError(this)`)
  creator.src = data.creator.photo || './img/empty-user.jpg'

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const activityNameText = document.createElement('span')

  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold'

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

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta');
  metaTextContainer.appendChild(generateIconByCondition(data, li));

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', 'status-in-activity', `${data.status}`)
  const statusIcon = document.createElement('i')
  statusIcon.className = 'material-icons'

  const cancelIcon = document.createElement('i')
  cancelIcon.classList.add('status-cancel', 'material-icons')
  cancelIcon.appendChild(document.createTextNode('clear'))

  const confirmedIcon = document.createElement('i')
  confirmedIcon.classList.add('status-confirmed', 'material-icons')
  confirmedIcon.appendChild(document.createTextNode('check'))

  if (data.status === 'CONFIRMED') {
    metaTextActivityStatus.appendChild(confirmedIcon)
  }
  if (data.status === 'CANCELLED') {
    metaTextActivityStatus.appendChild(cancelIcon)
  }

  metaTextContainer.appendChild(metaTextActivityStatus)

  li.appendChild(creator);
  li.appendChild(leftTextContainer);
  li.appendChild(metaTextContainer);
  return li

}


function generateIconByCondition(data, li) {
  const icon = document.createElement('i');
  icon.className = 'material-icons notification'
  if (data.urgent) {
    icon.textContent = 'alarm';

    return icon;
  }
  if (data.nearby) {
    icon.textContent = 'location_on';
    return icon;
  }
  if (data.count) {

    const countDiv = document.createElement('div')

    const countSpan = document.createElement('span')
    countSpan.textContent = data.count
    countSpan.className = 'count mdc-meta__custom-text'
    countDiv.appendChild(countSpan)
    li.classList.add('count-active');
    return countDiv;
  }
  const timeCustomText = document.createElement('div')
  timeCustomText.className = 'mdc-meta__custom-text'
  timeCustomText.style.width = '80px';
  timeCustomText.style.fontSize = '14px';
  timeCustomText.textContent = moment(data.timestamp).calendar()
  return timeCustomText;
}

function appendActivityListToDom(activityDom) {
  const parent = document.getElementById('activity--list')
  if (parent) {
    parent.appendChild(activityDom);
  }
}

function getRootRecord() {
  return new Promise(function (resolve, reject) {
    let record;
    const dbName = localStorage.getItem('dbexist');
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result;
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(dbName).onsuccess = function (event) {
        const data = event.target.result;
        data ? record = data : record = null;
      }

      rootTx.oncomplete = function () {
        if (record) {
          resolve(record)
        } else {
          reject('No root record found');
        }
      }
    }
    req.onerror = function () {
      reject(req.error)
    }
  })
}

function createActivityIcon() {
  if (document.getElementById('create-activity')) return;
  getCountOfTemplates().then(function (officeTemplateObject) {
    if (Object.keys(officeTemplateObject).length) {
      createActivityIconDom()
      return;
    }
  }).catch(console.log)
}


function getCountOfTemplates() {

  return new Promise(function (resolve, reject) {
    let count = 0;
    const officeByTemplate = {}
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions'], 'readonly');
      const subscriptionObjectStore = tx.objectStore('subscriptions').index('office')
      subscriptionObjectStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result;

        if (!cursor) return;
        count++
        officeByTemplate[cursor.value.office] = count;
        cursor.continue();
      }

      tx.oncomplete = function () {
        resolve(officeByTemplate)
      }
    }
    req.onerror = function () {
      reject(req.error);
    }
  })
}


function createActivityIconDom() {


  const parent = document.getElementById('create-activity--parent')

  const fab = document.createElement('button')
  fab.className = 'mdc-fab create-activity'
  fab.id = 'create-activity'
  fab.setAttribute('aria-label', 'Add')
  const span = document.createElement('span')
  span.className = 'mdc-fab_icon material-icons'
  span.id = 'activity-create--icon'

  span.textContent = 'add'


  fab.appendChild(span)
  parent.innerHTML = fab.outerHTML;

  document.querySelector('.create-activity').addEventListener('click', function (evt) {
    callSubscriptionSelectorUI(evt)
  })
}

function callSubscriptionSelectorUI(evt, checkIn) {
  selectorUI(evt, {
    record: '',
    store: 'subscriptions',
    suggestCheckIn: checkIn
  })
}

function listPanel() {
  if (document.getElementById('activity-list-main')) return

  const listCard = document.createElement('div')
  listCard.className = 'mdc-card panel-card mdc-top-app-bar--fixed-adjust'
  listCard.id = 'activity-list-main'
  const listUl = document.createElement('ul')
  listUl.className = 'mdc-list mdc-list--two-line mdc-list--avatar-list'
  listUl.id = 'activity--list'

  listCard.appendChild(listUl)

  const fabParent = document.createElement('div')
  fabParent.id = 'create-activity--parent'
  listCard.appendChild(fabParent);

  document.getElementById('app-current-panel').innerHTML = listCard.outerHTML

}

function creatListHeader(headerName) {
  const parentIconDiv = document.createElement('div')
  parentIconDiv.className = 'profile--icon-header'

  const menuIcon = document.createElement('span')
  menuIcon.id = 'menu--panel'

  const icon = document.createElement('img')
  icon.src = firebase.auth().currentUser.photoURL
  icon.className = 'list-photo-header'
  menuIcon.appendChild(icon)

  const headerText = document.createElement('p');
  headerText.textContent = headerName;
  menuIcon.appendChild(headerText)
  parentIconDiv.appendChild(menuIcon)

  const searchIcon = document.createElement('span')
  searchIcon.id = 'search--panel'
  const sicon = document.createElement('i')
  sicon.className = 'material-icons'
  sicon.textContent = 'search'
  searchIcon.appendChild(sicon);
  modifyHeader({
    id: 'app-main-header',
    left: parentIconDiv.outerHTML,
    right: ''
  });
  document.querySelector('.list-photo-header').addEventListener('click', function () {
    profileView(true)
  })
}

function scrollToActivity() {
  const clickedActivity = localStorage.getItem('clickedActivity')
  if (document.querySelector(`[data-id="${clickedActivity}"]`)) {
    document.querySelector(`[data-id="${clickedActivity}"]`).scrollIntoView({
      behavior: "instant",
      block: "center",
      "inline": "center"
    })
    localStorage.removeItem('clickedActivity')
    return
  }
}

function notificationWorker(type, updateTimestamp) {
  return new Promise(function (resolve, reject) {

    notification.postMessage({
      dbName: firebase.auth().currentUser.uid,
      type: type,
      updateTimestamp: updateTimestamp
    })

    notification.onmessage = function (message) {
      resolve(message.data);
    }
    notification.onerror = function (error) {
      reject(error)
    }
  })
}


function modifyHeader(attr) {

  if (attr.left) {

    const left = document.getElementById(attr.id + 'view-type')
    left.innerHTML = attr.left
  }
  if (attr.right) {

    const right = document.getElementById(attr.id + 'action-data')
    right.innerHTML = attr.right
  }

}



function createInputForProfile(key, type, classtype) {
  const mainTextField = document.createElement('div')
  mainTextField.className = `mdc-text-field mdc-text-field--dense ${classtype} attachment--text-field`

  mainTextField.dataset.key = key
  mainTextField.dataset.type = type
  mainTextField.id = key.replace(/\s/g, '')
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'

  if (type && key === 'displayName') {
    mainInput.placeholder = 'Your Name'
  }
  if (type && key === 'email') {
    mainInput.placeholder = 'Your Email'
  }

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  mainTextField.appendChild(mainInput)
  mainTextField.appendChild(ripple)
  return mainTextField
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