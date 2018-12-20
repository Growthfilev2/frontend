const notification = new Worker('js/notification.js')

function listView() {
  // document.body.style.backgroundColor = 'white'

  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  }

  history.pushState(['listView'], null, null)

  listPanel()
  creatListHeader('Recent');
  createActivityIcon();
  fetchDataForActivityList();
}


function fetchDataForActivityList() {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    let results = [];

    const transaction = db.transaction('list')
    const store = transaction.objectStore('list')
    const index = store.index('timestamp');
    index.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      results.push(cursor.value)
      cursor.continue();
    }
    transaction.oncomplete = function () {
      convertResultsToList(results);
    }
  }
}

function convertResultsToList(results) {
  let activityDom = ''
  let yOffset = window.pageYOffset

  let promiseMap = results.map(function (data) {
    return createActivityList(data).then(function (li) {
      return li
    })
  });
  Promise.all(promiseMap).then(function (results) {
    results.forEach(function (li) {
      activityDom += li
    })

    appendActivityListToDom(activityDom)
    scrollToActivity(yOffset)
  })
}

function createActivityList(data) {
  return new Promise(function (resolve) {
      resolve(activityListUI(data))    
  })
}

function getCount(db, id) {
  return new Promise(function (resolve) {
    const activityCount = db.transaction('activityCount', 'readonly').objectStore('activityCount')
    activityCount.get(id).onsuccess = function (event) {
      const record = event.target.result
      if (!record) {
        resolve(0)
      } else {
        resolve(record.count)
      }
    }
  })
}


function getCommentUndUser(db, id, creator) {
  const meta = {
    creator: creator,
    comment: '',
    commentUser: ''
  }

  return new Promise(function (resolve) {

    const addendumObjStore = db.transaction('addendum').objectStore('addendum').index('activityId')

    addendumObjStore.openCursor(id, 'prev').onsuccess = function (addendumstore) {
      const addendumCursor = addendumstore.target.result;
      if (!addendumCursor) {
        resolve(meta)
      } else if (addendumCursor.value.isComment) {
        meta.comment = addendumCursor.value.comment
        readNameFromNumber(db, addendumCursor.value.user).then(function (nameOrNum) {
          meta.commentUser = nameOrNum
          resolve(meta)
        })
      } else {
        meta.comment = addendumCursor.value.comment
        resolve(meta)
      }

    }

  })
}

function getCreatorDetails(db, meta) {

  return new Promise(function (resolve) {

    if (meta.creator === firebase.auth().currentUser.phoneNumber) {
      meta.creator = {
        photo: firebase.auth().currentUser.photoURL || './img/empty-user.jpg',
        number: meta.creator
      }
      resolve(meta)
    } else {


      const userObjStore = db.transaction('users').objectStore('users')

      userObjStore.get(meta.creator).onsuccess = function (userstore) {
        const record = userstore.target.result

        if (record && record.hasOwnProperty('photoURL')) {
          meta.creator = {
            photo: userstore.target.result.photoURL || './img/empty-user.jpg',
            number: meta.creator
          }
        } else {
          meta.creator = {
            photo: './img/empty-user.jpg',
            number: meta.creator
          }
        }

        resolve(meta)
      }

    }
  })
}


function activityListUI(data) {

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
  const secondLine = document.createElement('span')
  secondLine.className = 'mdc-list-item__secondary-text'
  if(data.urgent || data.nearby) {
    secondLine.textContent = data.secondLine;
  }

  leftTextContainer.appendChild(activityNameText)
  leftTextContainer.appendChild(secondLine);
  // leftTextContainer.appendChild(lastComment)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta');
  metaTextContainer.appendChild(generateIconByCondition(data,li));
  
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

  li.innerHTML += creator.outerHTML + leftTextContainer.outerHTML + metaTextContainer.outerHTML
  return li.outerHTML
}

function generateIconByCondition(data,li){
  const icon  = document.createElement('i');
  icon.className = 'material-icons';
  if(data.urgent) {
    icon.textContent = 'alarm';
    
    return icon;
  }
  if(data.nearby) {
    icon.textContent = 'location_on';
    return icon;
  }
  if(data.count) {

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


function appendActivityListToDom(activityDom, hasHeaderAndCard, headerName) {
  if (document.getElementById('activity--list')) {
    document.getElementById('activity--list').innerHTML = activityDom
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

  getCountOfTemplates().then(function (officeTemplateObject) {
    if (Object.keys(officeTemplateObject).length) {
      createActivityIconDom(officeTemplateObject)
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


function createActivityIconDom(officeTemplateCombo) {

  getRootRecord().then(function (record) {
    const parent = document.getElementById('create-activity--parent')

    const fab = document.createElement('button')
    fab.className = 'mdc-fab create-activity'
    fab.id = 'create-activity'
    fab.setAttribute('aria-label', 'Add')
    const span = document.createElement('span')
    span.className = 'mdc-fab_icon material-icons'
    span.id = 'activity-create--icon'
    if (record.suggestCheckIn) {
      span.textContent = 'add_alert'
    } else {
      span.textContent = 'add'
    }

    fab.appendChild(span)
    parent.innerHTML = fab.outerHTML;

    document.querySelector('.create-activity').addEventListener('click', function (evt) {
      const keysArray = Object.keys(officeTemplateCombo);
      console.log(record.suggestCheckIn);
      if (record.suggestCheckIn) {
        if (keysArray.length === 1) {
          createTempRecord(keysArray[0], 'check-in')
        } else {
          callSubscriptionSelectorUI(evt, record.suggestCheckIn)
        }
        suggestCheckIn(false);
        return;
      }

      callSubscriptionSelectorUI(evt)
    })
  }).catch(console.log)
}

function callSubscriptionSelectorUI(evt, suggestCheckIn) {
  selectorUI(evt, {
    record: '',
    store: 'subscriptions',
    suggestCheckIn: suggestCheckIn
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

function creatListHeader(headerName, backIcon) {
  const parentIconDiv = document.createElement('div')
  parentIconDiv.className = 'drawer--icons'

  const menuIcon = document.createElement('span')
  menuIcon.id = 'menu--panel'
  const icon = document.createElement('i')
  icon.className = 'material-icons'
  if (backIcon) {
    icon.textContent = 'keyboard_backspace'
  } else {

    icon.textContent = 'menu'
  }

  const menuSpan = document.createElement('span')
  menuSpan.className = 'current--selcted-filter'
  headerName === 'Cancelled' ? menuSpan.textContent = 'Trash' : menuSpan.textContent = headerName

  menuIcon.appendChild(icon)
  menuIcon.appendChild(menuSpan)

  parentIconDiv.appendChild(menuIcon)

  const searchIcon = document.createElement('span')
  searchIcon.id = 'search--panel'
  const sicon = document.createElement('i')
  sicon.className = 'material-icons'
  sicon.textContent = 'search'
  searchIcon.appendChild(sicon);


  header(parentIconDiv.outerHTML, '', 'list')


  document.getElementById('menu--panel').addEventListener('click', function () {
    if (backIcon) {
      backNav()
      return
    }

    getRootRecord().then(function (record) {
      initMenu();
    })

    sendCurrentViewNameToAndroid('drawer')

  })

}

function scrollToActivity(yOffset) {
  if (localStorage.getItem('clickedActivity')) {
    if (document.querySelector(`[data-id="${localStorage.getItem('clickedActivity')}"]`)) {

      document.querySelector(`[data-id="${localStorage.getItem('clickedActivity')}"]`).scrollIntoView({
        behavior: "instant",
        block: "center",
        "inline": "center"
      })
      localStorage.removeItem('clickedActivity')
    }
    return
  }

  if (yOffset === 0) {
    localStorage.removeItem('clickedActivity')
    window.scrollTo(0, 0)
    return
  }

  if (yOffset > 0) {
    window.scrollTo(0, yOffset);
  }

}

function notificationWorker(type, count) {
  return new Promise(function (resolve, reject) {

    notification.postMessage({
      dbName: firebase.auth().currentUser.uid,
      type: type,
    })

    notification.onmessage = function (message) {
      resolve(message.data);
    }
    notification.onerror = function (error) {
      reject(error)
    }
  })
}

// let filter = function () {
//   return {
//     urgent: function () {
//       return new Promise(function (resolve) {
//         const urgentNotification = notificationWorker('urgent');
//         urgentNotification.then(function (res) {
//           resolve(res)
//         });
//       });
//     },
//     nearBy: function () {
//       return new Promise(function (resolve) {
//         const nearByNotification = notificationWorker('nearBy');
//         nearByNotification.then(function (res) {
//           resolve(res)
//         });
//       });
//     }
//   }
// }();


function initMenu() {


  const filters = [{
    type: 'Urgent',
    icon: 'alarm'
  }, {
    type: 'Nearby',
    icon: 'near_me'
  }]


  const aside = document.createElement('aside')
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography'

  const nav = document.createElement('nav')
  nav.className = 'mdc-drawer__drawer'

  const header = document.createElement('header')
  header.className = 'mdc-drawer__header drawer--header'

  const headerContent = document.createElement('div')
  headerContent.className = 'mdc-drawer__header-content'

  const ImageDiv = document.createElement('div')
  ImageDiv.className = 'drawer--header-div'
  ImageDiv.onclick = function () {
    profileView(true)

  }
  const headerIcon = document.createElement('img')
  headerIcon.className = 'drawer-header-icon'

  headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'

  const headerDetails = document.createElement('div')
  headerDetails.className = 'header--details'

  const name = document.createElement('div')
  name.className = 'mdc-typography--subtitle'
  name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber

  headerDetails.appendChild(name)

  ImageDiv.appendChild(headerIcon)
  headerContent.appendChild(ImageDiv)
  headerContent.appendChild(headerDetails)
  header.appendChild(headerContent)

  const navContent = document.createElement('nav')

  navContent.className = 'mdc-drawer__content mdc-list filter-sort--list'



  filters.forEach(function (filter) {

    const a = document.createElement('div')
    a.className = 'mdc-list-item mdc-list-item--activated'

    const i = document.createElement('i')
    i.className = 'material-icons mdc-list-item__graphic drawer--icons'
    i.setAttribute('aria-hidden', 'true')
    i.textContent = filter.icon
    const textSpan = document.createElement('span')
    textSpan.textContent = filter.type
    a.appendChild(i)
    a.appendChild(textSpan)

    a.onclick = function () {

      window.scrollTo(0, 0)
      if (filter.type === 'Urgent') {
        sortByDates(filter.type, true)
      }
      if (filter.type === 'Nearby') {
        sortByLocation(filter.type, true)
      }

      let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      drawer.open = false
      sendCurrentViewNameToAndroid('listView')
      document.querySelector('.current--selcted-filter').textContent = filter.type;
    }
    navContent.appendChild(a)
  })
  nav.appendChild(header)
  nav.appendChild(navContent)
  aside.appendChild(nav)
  document.getElementById('drawer-parent').appendChild(aside)
  let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
  drawer.open = true;
}


function sortByDates(type, pushState) {
  if (pushState) {
    history.pushState(["sortByDates", type], null, null)
  } else {
    history.replaceState(["sortByDates", type], null, null)
  }

  filter.urgent().then(function (record) {
    generateActivitiesByDate(record)
  });

}


function generateActivitiesByDate(activities) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  let results = [];
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['activity']);
    const activityObjectStore = tx.objectStore('activity');

    activities.forEach(function (data) {
      activityObjectStore.get(data.activityId).onsuccess = function (event) {
        const record = event.target.result;
        if (record) {
          results.push(record);
        }
      }
    })

    tx.oncomplete = function () {
      convertResultsToList(db, results, false, 'Urgent');
    }
  }
}

function sortByLocation(type, pushState) {
  if (pushState) {
    history.pushState(['sortByLocation', type], null, null)
  } else {
    history.replaceState(['sortByLocation', type], null, null)
  }

  filter.nearBy().then(function (record) {
    sortActivitiesByLocation(record);
  })

}

function sortActivitiesByLocation(nearBy) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;

    let results = [];


    const tx = db.transaction(['activity']);
    const activityObjectStore = tx.objectStore('activity');

    nearBy.forEach(function (data) {
      activityObjectStore.get(data.activityId).onsuccess = function (event) {
        const record = event.target.result;
        results.push(record);
      }
    })
    tx.oncomplete = function () {
      convertResultsToList(db, results, false, 'NearBy');
    }
  }
}

function locationSortError(error) {
  console.log(error)
}

function header(contentStart, contentEnd, headerType) {

  const header = document.createElement('header')
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1'
  if (headerType === 'list') {
    header.classList.add('header-list--gray')
  }
  const row = document.createElement('div')
  row.className = 'mdc-top-app-bar__row'

  const sectionStart = document.createElement('section')
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start'

  const leftUI = document.createElement('div')
  leftUI.id = 'view-type'
  leftUI.innerHTML = contentStart

  sectionStart.appendChild(leftUI)

  const sectionEnd = document.createElement('div')
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end'

  const rightUI = document.createElement('div')
  rightUI.id = 'action-data'
  if (contentEnd) {
    rightUI.innerHTML = contentEnd
  }
  sectionEnd.appendChild(rightUI)
  row.appendChild(sectionStart)
  row.appendChild(sectionEnd)
  header.innerHTML = row.outerHTML
  if (headerType === 'selector') {
    return header
  } else {
    document.getElementById('header').innerHTML = header.outerHTML
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
      const req = indexedDB.open(firebase.auth().currentUser.uid)
      req.onsuccess = function () {
        const db = req.result;
        const tx = db.transaction(['root'], 'readwrite')
        const store = tx.objectStore('root')
        record.suggestCheckIn = value;
        store.put(record)

        tx.oncomplete = function () {
          resolve(true)
          if(history.state[0] === 'listView'){
            createActivityIcon();
          }
        }
        tx.onerror = function () {
          reject(tx.error)
        }
      }
      req.onerror = function () {
        reject(req.error);
      }
    }).catch(function (error) {
      reject(error)
    })
  })
}