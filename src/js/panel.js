const scroll_namespace = {
  count: 0,
  size: 20,
  skip: false,

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

function listView() {
  history.pushState(['listView'], null, null)
  initDomLoad();

  getSizeOfListStore().then(function (size) {
    if (!size) {
      appendTextContentInListView('No activities Found');
      return;
    }
    if (size > 20) {

      window.addEventListener('scroll', handleScroll, false)
    }

    getRootRecord().then(function (record) {

      if (size && size <= 20) {
        loadActivitiesFromListStore(record.location)
        return;
      }
      startCursor(record.location);
    });
  })
}

function appendTextContentInListView(textContent) {
  const p = document.createElement('p')
  p.textContent = textContent;
  p.className = 'no-activity'
  document.getElementById('activity-list-main').appendChild(p)
  document.getElementById('activity-list-main').style.boxShadow = 'none';
}


function getSizeOfListStore() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['list'])
      const store = tx.objectStore('list');
      var countReq = store.count();
      countReq.onsuccess = function () {
        resolve(countReq.result)
      }
      countReq.onerror = function () {
        reject(countReq.error)
      }
    }
    req.onerror = function () {
      reject(req.error);
    }
  })
}

function updateEl(activities, rootRecord) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction(['list', 'activity'])
    const activityStore = tx.objectStore('activity')
    const listStore = tx.objectStore('list');
    const ul = document.getElementById('activity--list');
    activities.forEach(function (activity) {
      if (document.querySelector('.no-activity')) {
        document.querySelector('.no-activity').remove()
      }

      listStore.get(activity.activityId).onsuccess = function (event) {
        const record = event.target.result;
        const existingEl = document.querySelector(`[data-id="${activity.activityId}"]`)
        if (existingEl) {
          existingEl.remove();
        }
        if (!record) return;

        if (!rootRecord.location) {
          getActivityDataForList(activityStore, record).then(function (li) {
            ul.insertBefore(li, ul.childNodes[0])
          })
        } else {
          getActivityDataForList(activityStore, record, rootRecord.location).then(function (li) {
            ul.insertBefore(li, ul.childNodes[0])
          })
        }
      }
    })
  }
}

function handleScroll(ev) {
  getRootRecord().then(function (record) {
    if (window.innerHeight + window.scrollY === document.body.scrollHeight) {
      const ul = document.getElementById('activity--list')
      if (!ul) return
      startCursor(record.location);
    }
  })
};

function loadActivitiesFromListStore(currentLocation) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;
    const transaction = db.transaction(['list', 'activity', 'root'])
    const activity = transaction.objectStore('activity');
    const store = transaction.objectStore('list')
    const index = store.index('timestamp');
    let fragment = document.createDocumentFragment();
    index.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      getActivityDataForList(activity, cursor.value, currentLocation).then(function (dom) {
        fragment.appendChild(dom)
      })
      cursor.continue();
    }
    transaction.oncomplete = function () {
      const ul = document.getElementById('activity--list')
      if (!ul) return
      ul.innerHTML = ''
      ul.appendChild(fragment)
      scrollToActivity()
    }
  }
}

function startCursor(currentLocation) {
  console.log(currentLocation)
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
      const ul = document.getElementById('activity--list')
      if (!ul) return

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
    const secondLineParent = document.createElement('div')
    secondLineParent.style.marginTop = '10px';

    const secondLineVenue = document.createElement('span')
    secondLineVenue.className = 'mdc-list-item__secondary-text venue-secondline'

    const secondLineSchedule = document.createElement('span')
    secondLineSchedule.className = 'mdc-list-item__secondary-text'

    activity.get(value.activityId).onsuccess = function (event) {

      const record = event.target.result;
      if (!record) return
      const schedules = record.schedule;
      const venues = record.venue;
      let venueSpan;
      const dateSpan = generateLastestSchedule(schedules, value.createdTime);

      if (currentLocation) {
        venueSpan = generateLatestVenue(venues, currentLocation);
      }

      if (venueSpan && !dateSpan) {
        secondLineVenue.textContent = venueSpan;
        secondLineVenue.style.maxWidth = '70%';
      } else if (dateSpan && !venueSpan) {
        secondLineSchedule.textContent = dateSpan
      } else if (dateSpan && venueSpan) {
        secondLineVenue.textContent = venueSpan;
        secondLineSchedule.textContent = ' | ' + dateSpan;
      }
      secondLineParent.appendChild(secondLineVenue)
      secondLineParent.appendChild(secondLineSchedule)
      // const secondLineCss = setMarginForSecondLine(secondLine)
      resolve(activityListUI(value, secondLineParent))
    }
  })
}

function setMarginForSecondLine(secondLine) {
  const nodes = secondLine.childNodes
  if (nodes.length > 1) {
    if (nodes[0].innerHTML && nodes[1].innerHTML) {
      secondLine.style.marginTop = '-42px'
      return secondLine;
    }
    secondLine.style.marginTop = '-35px'
    return secondLine
  }
  secondLine.style.marginTop = '-35px'
  return secondLine
}

function generateTextIfActivityIsNotPending(status) {
  const textStatus = {
    'CONFIRMED': 'Done',
    'CANCELLED': 'Cancelled'
  }
  return textStatus[status]
}



function generateLastestSchedule(schedules, createdTime) {
  const validSchedules = removeEmptyObjects(schedules, 'startTime', 'endTime');
  const length = validSchedules.length;

  if (!length) {
    return formatCreatedTime(createdTime);
  }

  const currentTime = Date.now();
  const ascendingOrder = sortDatesInAscendingOrderWithPivot(currentTime, validSchedules);
  return getTimeTypeForMultipleSchedule(currentTime, ascendingOrder)
}

function removeEmptyObjects(data, prop1, prop2) {
  if (!data.length) {
    return data;
  }
  return data.filter(function (value) {
    if (value[prop1] && value[prop2]) {
      return value
    }
  })
}



function sortDatesInAscendingOrderWithPivot(pivot, dates) {
  const dataset = dates.slice();
  dataset.push(pivot);
  return dataset.sort(function (a, b) {
    return a - b;
  })
}

function getTimeTypeForMultipleSchedule(pivot, dates) {
  const duplicate = dates.slice()
  const index = duplicate.indexOf(pivot);

  if (index == dates.length - 1) {
    return moment(dates[dates.length - 2]).format('D, MMM').replace(',', '')
  }
  return moment(dates[index + 1]).format('D, MMM').replace(',', '')
}


function formatCreatedTime(createdTime) {
  if (!createdTime) return ''
  if (isToday(createdTime)) {
    return moment(createdTime).format('hh:mm')
  }

  return moment(createdTime).format('D, MMM').replace(',', '')
}

function isToday(comparisonTimestamp) {
  const today = new Date();
  if (today.setHours(0, 0, 0, 0) == new Date(comparisonTimestamp).setHours(0, 0, 0, 0)) {
    return true
  }
  return false;
}

function generateLatestVenue(venues, currentLocation) {
  const validVenues = removeEmptyObjects(venues, 'location', 'address')
  const length = validVenues.length
  if (!length) {
    return ''
  }

  if (length == 1) {
    return validVenues[0].location;
  }

  const distances = []
  venues.forEach(function (venue) {

    const lat = venue.geopoint['_latitude']
    const lon = venue.geopoint['_longitude']

    const geopoint = {
      latitude: lat,
      longitude: lon
    }
    distances.push({
      distance: calculateDistanceBetweenTwoPoints(geopoint, currentLocation),
      location: venue.location
    })
  })

  const sortedDistance = sortNearestLocation(distances)
  return sortedDistance[0].location;
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
  li.onclick = function () {
    localStorage.setItem('clickedActivity', this.dataset.id);
    conversation(this.dataset.id, true);
  }
  li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1');
  const dataObject = document.createElement('object');
  dataObject.data = data.creator.photo || './img/empty-user.jpg';
  dataObject.type = 'image/jpeg';
  dataObject.className = 'mdc-list-item__graphic material-icons'

  var creator = document.createElement("img");
  creator.src = './img/empty-user.jpg';
  creator.className = 'empty-user-list'
  dataObject.appendChild(creator);

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  const activityNameText = document.createElement('span')
  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold'
  activityNameText.textContent = data.activityName;
  leftTextContainer.appendChild(activityNameText);
  leftTextContainer.appendChild(secondLine)

  const timeCustomText = document.createElement('div')
  timeCustomText.className = 'mdc-meta__custom-text'
  timeCustomText.style.width = '76px';
  if (isToday(data.timestamp)) {
    timeCustomText.style.marginTop = '4px'
  }

  timeCustomText.textContent = moment(data.timestamp).calendar()

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta');
  metaTextContainer.appendChild(timeCustomText);
  metaTextContainer.appendChild(generateIconByCondition(data, li));

  li.appendChild(dataObject);
  li.appendChild(leftTextContainer);
  li.appendChild(metaTextContainer);
  return li

}


function generateIconByCondition(data, li) {

  if (data.count) {

    const countSpan = document.createElement('span')
    countSpan.textContent = data.count
    countSpan.className = 'count mdc-meta__custom-text'

    li.classList.add('count-active');
    return countSpan;
  }


  const cancelIcon = document.createElement('i')
  cancelIcon.classList.add('status-cancel', 'material-icons', `${data.status}`);
  cancelIcon.textContent = 'clear';

  const confirmedIcon = document.createElement('i')
  confirmedIcon.classList.add('status-confirmed', 'material-icons', `${data.status}`)
  confirmedIcon.textContent = 'check';

  const pendingIcon = document.createElement('i')
  pendingIcon.classList.add('status-pending', 'material-icons', `${data.status}`)
  pendingIcon.textContent = '';

  if (data.status === 'CONFIRMED') {
    return confirmedIcon
  }
  if (data.status === 'CANCELLED') {
    return cancelIcon
  }
  return pendingIcon
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
    const dbName = firebase.auth().currentUser.uid;
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
          reject({
            message: 'No root record found from getRootRecord'
          });
        }
      }
      rootTx.onerror = function () {
        reject({
          message: `${rootTx.error.message} from getRootRecord`
        })
      }
    }
    req.onerror = function () {
      reject({
        message: `${req.error} from getRootRecord`
      })
    }
  })
}

function createActivityIcon() {
  if (document.getElementById('create-activity')) return;
  getCountOfTemplates().then(function (count) {
    if (count) {
      createActivityIconDom()
      return;
    }
  }).catch(handleError);
}


function getCountOfTemplates() {

  return new Promise(function (resolve, reject) {
    let count = 0;
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions'], 'readonly');
      const subscriptionObjectStore = tx.objectStore('subscriptions').index('office')
      subscriptionObjectStore.openCursor(null, 'nextunique').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        count++;
        cursor.continue();
      }
      tx.oncomplete = function () {
        resolve(count)
      }
      tx.onerror = function () {
        reject({
          message: `${tx.error} from getCountOfTemplates`
        });
      }
    }
    req.onerror = function () {
      reject({
        message: `${req.error} from getCountOfTemplates`
      });
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
  const req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    const db = req.result;
    getImageFromNumber(db, firebase.auth().currentUser.phoneNumber).then(function (uri) {

      const parentIconDiv = document.createElement('div')
      parentIconDiv.className = 'profile--icon-header'

      const menuIcon = document.createElement('div')
      menuIcon.id = 'menu--panel'

      const object = document.createElement('object');
      object.className = 'list-photo-header';
      object.type = 'image/jpeg';
      object.data = uri || './img/empty-user.jpg';

      const icon = document.createElement('img');
      icon.src = './img/empty-user.jpg';
      icon.className = 'list-photo-header'
      object.appendChild(icon);

      menuIcon.appendChild(object)

      const headerText = document.createElement('p');
      headerText.textContent = headerName;
      menuIcon.appendChild(headerText)
      parentIconDiv.appendChild(menuIcon)
      modifyHeader({
        id: 'app-main-header',
        left: parentIconDiv.outerHTML,
        right: ''
      });

      document.querySelector('.list-photo-header').addEventListener('click', function () {
        profileView(true)
      })
    })
  }
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
      reject({
        message: `${error.message} from notificationWorker at ${error.lineno}`
      })
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
          reject({
            message: `${tx.error.message} from suggestCheckIn`
          });
        };
      };
      req.onerror = function () {
        reject({
          message: `${req.error} from suggestCheckIn`
        });
      };
    }).catch(function (error) {
      reject(error);
    });
  });
}