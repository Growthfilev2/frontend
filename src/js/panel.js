const notification = new Worker('js/notification.js')

function listView(filter) {
  // document.body.style.backgroundColor = 'white'
  console.log(filter)
  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  }
  history.pushState(['listView'], null, null)

  listPanel()
  creatListHeader('Recent');
  createActivityIcon();
  
  if(!filter) {
    fetchDataForActivityList();
    return;
  }
  notificationWorker('urgent', filter.urgent).then(function () {
    notificationWorker('nearBy', filter.nearby).then(function (req) {
      fetchDataForActivityList();
    })
  })
}


function fetchDataForActivityList() {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;    
    let activityDom = '' 
    const transaction = db.transaction('list')
    const store = transaction.objectStore('list')
    const index = store.index('timestamp');

    index.openCursor(null,'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      activityDom += activityListUI(cursor.value).outerHTML;
      cursor.continue();
    }

    transaction.oncomplete = function () {
      if(document.getElementById('activity--list')){
        document.getElementById('activity--list').innerHTML = activityDom;
      }
      scrollToActivity()
    }
  }
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
  if (data.urgent || data.nearby) {
    secondLine.textContent = data.secondLine;
  }

  leftTextContainer.appendChild(activityNameText)
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
  return li;
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
        suggestCheckIn(false).then(function () {
          createActivityIcon();
        }).catch(console.log)
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

function creatListHeader(headerName) {
  const parentIconDiv = document.createElement('div')
  parentIconDiv.className = 'drawer--icons'

  const menuIcon = document.createElement('span')
  menuIcon.id = 'menu--panel'
  const icon = document.createElement('i')
  icon.className = 'material-icons'

  icon.textContent = 'menu'

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
  header(parentIconDiv.outerHTML, '', 'list');
  document.getElementById('menu--panel').addEventListener('click', function () {
    initMenu();
    sendCurrentViewNameToAndroid('drawer')
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
    }
    return
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



function initMenu() {


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

  nav.appendChild(header)
  nav.appendChild(navContent)
  aside.appendChild(nav)
  document.getElementById('drawer-parent').appendChild(aside)
  let drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
  drawer.open = true;
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