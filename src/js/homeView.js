function getSuggestions() {
  if (ApplicationState.knownLocation) {
    getKnownLocationSubs().then(homeView);
    return;
  }
  return getSubsWithVenue().then(homeView)
}

function getKnownLocationSubs() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');
    const result = [];
    const venue = ApplicationState.venue
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (cursor.value.status === 'CANCELLED') {
        cursor.delete()
        cursor.continue();
        return;
      };

      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === venue.template) {
          result.push(cursor.value)
        }
      })
      cursor.continue();
    }
    tx.oncomplete = function () {
      resolve(result)
    }
  })
}

function getPendingLocationActivities() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction('activity');
    const result = []
    const index = tx.objectStore('activity').index('status')
    index.openCursor('PENDING').onsuccess = function (evt) {
      const cursor = evt.target.result;
      if (!cursor) return;
      if (cursor.value.office !== ApplicationState.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.hidden) {
        cursor.continue();
        return;
      }

      let match;

      if (!match) {
        cursor.continue();
        return;
      }
      let found = false
      match.schedule.forEach(function (sn) {
        if (!sn.startTime && !sn.endTime) return;
        if (moment(moment().format('DD-MM-YY')).isBetween(moment(sn.startTime).format('DD-MM-YY'), moment(sn.endTime).format('DD-MM-YY'), null, '[]')) {
          sn.isValid = true
          found = true
        }
      })

      if (found) {
        result.push(match);
      }
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(result)
    }
  })
}


function getSubsWithVenue() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');

    const result = []
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return
      if (cursor.value.template === 'check-in') {
        cursor.continue();
        return;
      }
      if (cursor.value.status === 'CANCELLED') {
        cursor.delete()
        cursor.continue();
        return;
      }
      if (!cursor.value.venue.length) {
        cursor.continue();
        return;
      }
      console.log(cursor.value)
      result.push(cursor.value)

      cursor.continue();
    }
    tx.oncomplete = function () {
      resolve(result)
    }
  })
}

function handleNav(evt) {
  console.log(evt)
  if (history.state[0] === 'homeView') {
    history.pushState(['profileView'], null, null)
    profileView();
    return;
  }
  return history.back();
}

function homePanel(commonTasks) {
  return ` <div class="container home-container">
  <div class='meta-work'>
    <ul class='mdc-list subscription-list' id='common-task-list'>
      ${commonTasks.map(function(task){
          return `<li class='mdc-list-item' id="${task.id}">${task.name}
          <span class='mdc-list-item__meta material-icons'>keyboard_arrow_right</span>
        </li>`
      }).join("")}

      <li class='mdc-list-divider'></li>
    </ul>
  </div>
  <div class='work-tasks'>
      <div id='text'>
     
      </div>
      <div id ='ar-container'></div>
      <div id='duty-container'></div>
      <div id='suggestions-container'></div>
      <div id='action-button' class='attendence-claims-btn-container mdc-layout-grid__inner'>
      </div>

  </div>
  <button class="mdc-fab mdc-fab--extended  mdc-theme--primary-bg app-fab--absolute" id='reports'>
    <span class="material-icons mdc-fab__icon">description</span>
    <span class="mdc-fab__label">My Reports</span>
 </button>
</div>`
}

function homeHeaderStartContent(name) {
  return `
  <img class="mdc-top-app-bar__navigation-icon mdc-icon-button image" id='profile-header-icon' onerror="imgErr(this)" src=${firebase.auth().currentUser.photoURL || './img/src/empty-user.jpg'}>
  <span class="mdc-top-app-bar__title">${name}</span>
`
}


function homeView(suggestedTemplates) {
  document.getElementById('start-load').classList.add('hidden')
  try {
    const commonTasks = getCommonTasks();
    progressBar.close();
    history.pushState(['homeView'], null, null);
    let clearIcon = ''
    if (ApplicationState.nearByLocations.length > 1) {
      clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='change-location'>clear</button>`
    }
    const header = getHeader('app-header', homeHeaderStartContent(ApplicationState.venue.location || ''), clearIcon);
    if(!ApplicationState.venue) {
      generateCheckInVenueName(header);
    }
    if(document.getElementById('change-location')) {
      document.getElementById('change-location').addEventListener('click',function(){
        progressBar.open();
        manageLocation(3).then(mapView).catch(handleLocationError);
      })
    }
    

    header.listen('MDCTopAppBar:nav', handleNav);
    header.root_.classList.remove('hidden')

    const panel = document.getElementById('app-current-panel')
    panel.classList.add('mdc-top-app-bar--fixed-adjust', "mdc-layout-grid", 'pl-0', 'pr-0')
    let suggestionLength = suggestedTemplates.length;

    panel.innerHTML = homePanel(commonTasks);

 
    const commonListEl = document.getElementById('common-task-list');
    if (commonListEl) {
      const commonTaskList = new mdc.list.MDCList(commonListEl);
      commonTaskList.singleSelection = true;
      const rootTx = db.transaction('root', 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {

        const rootRecord = event.target.result;
        if (!rootRecord) return;
        if (rootRecord.totalCount && rootRecord.totalCount > 0) {
          const el = document.getElementById('open-chat-list');
          if (!el) return;
          const metaIcon = el.querySelector('.mdc-list-item__meta')
          metaIcon.classList.remove('material-icons');
          metaIcon.innerHTML = `<div class='chat-count mdc-typography--subtitle2'>${rootRecord.totalCount}</div>`
        }

        if (rootRecord.totalCount < 0) {
          rootRecord.totalCount = 0;
          rootStore.put(rootRecord);
        }
      };

      commonTaskList.listen('MDCList:action', function (commonListEvent) {
        const selectedType = commonTasks[commonListEvent.detail.index];
        if (selectedType.name === 'Change Location') {
          progressBar.open();
          manageLocation(3).then(mapView).catch(handleLocationError)
          return;
        }

        if (selectedType.name === 'Chat') {
          history.pushState(['chatView'], null, null);
          chatView();
          return;
        }
        const offices = Object.keys(ApplicationState.officeWithCheckInSubs)
        if (offices.length == 1) {
          photoOffice = offices[0];
          history.pushState(['snapView'], null, null)
          snapView()
          return
        }
        const officeList = `<ul class='mdc-list subscription-list' id='dialog-office'>
         ${offices.map(function(office){
           return `<li class='mdc-list-item'>
           ${office}
           <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
             keyboard_arrow_right
           </span>
           </li>`
         }).join("")}
         </ul>`

        const dialog = new Dialog('Choose Office', officeList, 'choose-office-subscription').create('simple');
        const ul = new mdc.list.MDCList(document.getElementById('dialog-office'));
        bottomDialog(dialog, ul)
        ul.listen('MDCList:action', function (e) {
          photoOffice = offices[e.detail.index]
          history.pushState(['snapView'], null, null)
          snapView()
          dialog.close();
        })
      })
    }

    const workTaskEl = document.querySelector('.work-tasks #text');
    Promise.all([checkForUpdates(), getYesterdayAtt()]).then(function (results) {

      const updates = results[0]
      const ars = results[1]
      if (!updates.length && !hasValidAr(ars) && !suggestedTemplates.length) {
        if (workTaskEl) {
          document.querySelector('.work-tasks #text').innerHTML = `<h3 class="mdc-list-group__subheader mdc-typography--headline5  mdc-theme--primary">All Tasks Completed</h3>`
        }
        return;
      }
      if (workTaskEl) {
        workTaskEl.innerHTML = `<h3 class="mdc-list-group__subheader mt-0 mb-0">Suggestions</h3>`
      }
      createArSuggestion(ars)
      createUpdatesuggestion(updates)
    }).catch(handleError);

    const auth = firebase.auth().currentUser
    document.getElementById('reports').addEventListener('click', function () {
      if (auth.email && auth.emailVerified) {
        history.pushState(['reportView'], null, null)
        reportView();
        return
      };

      history.pushState(['emailUpdation'], null, null)
      emailUpdation()
    })

    if (!suggestionLength) return;
    console.log(suggestedTemplates)

    if (document.querySelector('.work-tasks #text') && document.getElementById('suggestions-container')) {
      document.querySelector('.work-tasks #text').innerHTML = `<h3 class="mdc-list-group__subheader mt-0 mb-0">Suggestions</h3>`
      document.getElementById('suggestions-container').innerHTML = templateList(suggestedTemplates)
      const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
      handleTemplateListClick(suggestedInit);
    }
  } catch (e) {
    console.log(e)
    handleError({
      message: e.message,
      body: JSON.stringify(e.stack)
    })
  }
}

function generateCheckInVenueName(header){
  const lastCheckInCreatedTimestamp = ApplicationState.lastCheckInCreated;
  if(!lastCheckInCreatedTimestamp) return;
  if(!header) return;
  const myNumber = firebase.auth().currentUser.phoneNumber;
  const tx = db.transaction('addendum');
  const addendumStore = tx.objectStore('addendum')
  let addendums = [];
  
  if(addendumStore.indexNames.contains('KeyTimestamp')) {
    const key = myNumber+myNumber
    const range = IDBKeyRange.only([lastCheckInCreatedTimestamp,key])
    addendumStore.index('KeyTimestamp').getAll(range).onsuccess = function(event){
      if(!event.target.result.length) return;
      addendums = event.target.result;
    };
  }
  else {

    addendumStore.index('user').openCursor(myNumber).onsuccess = function(event){
      const cursor  = event.target.result;
      if(!cursor) return;
      if(cursor.value.timestamp !== lastCheckInCreatedTimestamp) {
        cursor.continue();
        return;
      }
      addendums.push(cursor.value)
      cursor.continue();
    }
  }

  tx.oncomplete = function(){
    console.log(addendums);
    if(!addendums.length) return;
    addendums.forEach(function(addendum){
      const activityStore = db.transaction('activity').objectStore('activity');
      activityStore.get(addendum.activityId).onsuccess = function(activityEvent) {
        const activity = activityEvent.target.result;
        if(!activity) return;
        if(activity.template !== 'check-in') return;
        const commentArray = addendum.comment.split(" ");
        const index = commentArray.indexOf("from");
        const nameOfLocation = commentArray.slice(index+1,commentArray.length).join(" ");
        console.log(header)
        console.log(nameOfLocation)
        if(header.root_.querySelector('.mdc-top-app-bar__title')) {
          header.root_.querySelector('.mdc-top-app-bar__title').textContent = nameOfLocation;
        }
      }
    })
  }
}

function getCommonTasks() {
  const tasks = [{
    name: 'Chat',
    id: 'open-chat-list'
  }];

  // if (ApplicationState.nearByLocations.length) {
  //   tasks.unshift({
  //     name: 'Change Location',
  //     id: 'change-location-list'
  //   })
  // };

  if (ApplicationState.officeWithCheckInSubs) {
    if (Object.keys(ApplicationState.officeWithCheckInSubs).length) {
      tasks.push({
        name: 'Photo Check-In',
        id: 'photo-check-in'
      })
    }
  }
  return tasks
}

function hasValidAr(arRecord) {
  if (!arRecord) return;
  if (!arRecord.hasOwnProperty('statusForDay')) return;
  if (arRecord.statusForDay == 1) return;
  return true
}

function createUpdatesuggestion(result) {
  const el = document.getElementById("duty-container");
  if (!result.length) return;
  if (!el) return;
  el.innerHTML = `<ul class='mdc-list subscription-list'>
    ${result.map(function(activity) {
        return `<li class='mdc-list-item'>
        <span class='mdc-list-item__text'>${activity.activityName}</span>
      
        <span class="mdc-list-item__meta material-icons mdc-theme--primary">
          keyboard_arrow_right
      </span>
        </li>`
    }).join("")}
    <li class='mdc-list-divider'></li>
  </ul>`

  const dutyList = new mdc.list.MDCList(el.querySelector('ul'))
  dutyList.singleSelection = true;
  dutyList.selectedIndex = 0;
  dutyList.listen('MDCList:action', function (event) {

    const activity = result[event.detail.index]
    const heading = createActivityHeading(activity)
    const statusButtonFrag = createElement('div')
    statusButtonFrag.style.float = 'right';

    const dialog = new Dialog(heading, activityDomCustomer(activity), 'view-form').create()
    dialog.open();
    dialog.autoStackButtons = false;
    dialog.buttons_[1].classList.add('hidden')
    if (!activity.canEdit) return;

    getStatusArray(activity).forEach(function (buttonDetails) {

      const button = createElement("button", {
        className: 'mdc-button material-icons'
      })

      button.style.color = buttonDetails.color
      const span = createElement("span", {
        className: 'mdc-button__label',
        textContent: buttonDetails.name
      })
      const icon = createElement('i', {
        className: 'material-icons mdc-button__icon',
        textContent: buttonDetails.icon
      })
      button.appendChild(icon)
      button.appendChild(span)
      
      button.addEventListener('click', function () {
        setActivityStatus(activity, buttonDetails.status)
        dialog.close()
      })
      statusButtonFrag.appendChild(button)
    })


    dialog.listen('MDCDialog:opened', function () {
      dialog.root_.querySelector('#status-change-container').appendChild(statusButtonFrag);
    })
  })
}

function getYesterdayArDate() {
  const date = new Date();
  const ts = date.setDate(date.getDate() - 1);
  const convertedDate = new Date(ts)
  return Number(`${convertedDate.getMonth()}${convertedDate.getDate()}${convertedDate.getFullYear()}`)
}


function createArSuggestion(result) {
  const el = document.getElementById('ar-container');

  if (!hasValidAr(result)) return;

  const ul = createElement('ul', {
    className: 'mdc-list subscription-list mdc-list--two-line'
  })
  const li = createElement('li', {
    className: 'mdc-list-item'
  })
  const icon = createElement('span', {
    className: 'mdc-list-item__meta material-icons mdc-theme--primary',
    textContent: 'keyboard_arrow_right'
  })
  const textCont = createElement('span', {
    className: 'mdc-list-item__text'
  })
  const primaryText = createElement('span', {
    className: 'mdc-list-item__primary-text'
  })
  const secondartText = createElement('span', {
    className: 'mdc-list-item__secondary-text mdc-theme--error',
    textContent: 'Status For Day Yesterday : ' + result.statusForDay
  })
  secondartText.style.marginTop = '5px';
  secondartText.style.fontSize = '1rem';

  if (result.statusForDay == 0) {
    primaryText.textContent = 'Apply AR/Leave'
  }
  if (result.statusForDay > 0 && result.statusForDay < 1) {
    primaryText.textContent = 'Apply AR'
  }
  textCont.appendChild(primaryText)
  textCont.appendChild(secondartText);
  li.appendChild(textCont);

  li.addEventListener('click', function () {
    history.pushState(['reportView'], null, null)
    reportView();
  })
  ul.appendChild(li)
  li.appendChild(icon)
  if (!el) return;
  el.appendChild(ul)
  const list = new mdc.list.MDCList(ul);
  list.selectedIndex = 0;
  list.singleSelection = true;
}


function getYesterdayAtt() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('attendance');
    const store = tx.objectStore('attendance');
    let record;
    store.get(getYesterdayArDate()).onsuccess = function (event) {
      record = event.target.result;
    }
    tx.oncomplete = function () {
      return resolve(record)
    }
    tx.onerror = function () {
      return reject(tx.error)
    }
  })
}

function checkForUpdates() {

  return new Promise(function (resolve, reject) {
    const currentTimestamp = moment().valueOf()
    const maxTimestamp = moment().add(24, 'h').valueOf();
    console.log(maxTimestamp);
    const calendarTx = db.transaction('calendar');
    const results = []
    const range = IDBKeyRange.lowerBound(currentTimestamp);

    calendarTx.objectStore('calendar').index('end').openCursor(range).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      };
      if (cursor.value.hidden == 1) {
        cursor.continue();
        return;
      }
      if (!cursor.value.start || !cursor.value.end) {
        cursor.continue();
        return;
      };

      if (cursor.value.start <= maxTimestamp) {
        results.push(cursor.value)
      };
      cursor.continue();
    };

    calendarTx.oncomplete = function () {
      console.log(results);

      const activityTx = db.transaction('activity');

      const activityRecords = [];
      results.forEach(function (result) {
        activityTx.objectStore('activity').get(result.activityId).onsuccess = function (event) {
          const record = event.target.result;
          if (!record.attachment.Location) return;
          if (!record.attachment.Location.value) return;
          console.log(record);
          activityRecords.push(record);
        }
      });
      activityTx.oncomplete = function () {
        console.log(activityRecords)
        const mapTx = db.transaction('map')
        const updateRecords = []
        activityRecords.forEach(function (record) {
          mapTx.objectStore('map').index('location').get(record.attachment.Location.value).onsuccess = function (event) {
            const mapRecord = event.target.result;
            if(!mapRecord) return;
            if (!mapRecord.latitude || !mapRecord.longitude) return;
            if (calculateDistanceBetweenTwoPoints({
                latitude: mapRecord.latitude,
                longitude: mapRecord.longitude
              }, ApplicationState.location) > 1) return;
            updateRecords.push(record);
          }
        })
        mapTx.oncomplete = function () {
          return resolve(updateRecords);
        }
      }
    }
    
    calendarTx.onerror = function () {
      return reject({
        message: tx.error,
        body: ''
      })
    }
  })
}



function handleTemplateListClick(listInit) {
  listInit.singleSelection = true;
  listInit.selectedIndex = 0;
  listInit.listen('MDCList:action', function (evt) {
    const el = listInit.listElements[evt.detail.index]
    const officeOfSelectedList = JSON.parse(el.dataset.office)
    const valueSelectedList = JSON.parse(el.dataset.value)
    if (officeOfSelectedList.length == 1) {
      history.pushState(['addView'], null, null);
      addView(valueSelectedList[0])
      return
    }
    

    const dialog = new Dialog('Choose Office', officeSelectionList(valueSelectedList), 'choose-office-subscription').create('simple');
    const ul = new mdc.list.MDCList(document.getElementById('dialog-office'))
    bottomDialog(dialog, ul)
    
    ul.listen('MDCList:action', function (event) {
      history.pushState(['addView'], null, null);
      addView(valueSelectedList[event.detail.index])
      dialog.close()
    })
  });
}

function officeSelectionList(subs){
  const officeList = `<ul class='mdc-list subscription-list' id='dialog-office'>
    ${subs.map(function(sub){
      return `<li class='mdc-list-item'>
      ${sub.office}
      <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
        keyboard_arrow_right
      </span>
      </li>`
    }).join("")}
    </ul>`

    return officeList;
  
}

function bottomDialog(dialog, ul) {

  ul.singleSelection = true
  ul.selectedIndex = 0;

  setTimeout(function () {
    dialog.root_.querySelector('.mdc-dialog__surface').classList.add('open')
    ul.foundation_.adapter_.focusItemAtIndex(0);
  }, 50)

  dialog.listen('MDCDialog:opened', function () {
    ul.layout();
  })

  dialog.listen('MDCDialog:closing', function () {
    dialog.root_.querySelector('.mdc-dialog__surface').classList.remove('open');
  })
  dialog.open();
}


function pendinglist(activities) {
  return `
  <ul class="mdc-list subscription-list" role="group" aria-label="List with checkbox items" id='confirm-tasks'>
    ${activities.map(function(activity,idx){
      return `
      <li class="mdc-list-item" role="checkbox" aria-checked="false">
      Confirm ${activity.activityName} ?    
      <div class='mdc-checkbox mdc-list-item__meta'>
        <input type="checkbox"
                class="mdc-checkbox__native-control"
                id="demo-list-checkbox-item-${idx}" />
        <div class="mdc-checkbox__background">
          <svg class="mdc-checkbox__checkmark"
                viewBox="0 0 24 24">
            <path class="mdc-checkbox__checkmark-path"
                  fill="none"
                  d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
          </svg>
          <div class="mdc-checkbox__mixedmark"></div>
        </div>
      </div>   
    </li>`
    }).join()}
  </ul>
  `
}

function templateList(suggestedTemplates) {
  const ul = createElement('ul', {
    className: 'mdc-list subscription-list',
    id: 'suggested-list'
  })
  suggestedTemplates.forEach(function (sub) {
    const el = ul.querySelector(`[data-template="${sub.template}"]`)
    if (el) {
      var currentOffice = JSON.parse(el.dataset.office)
      currentOffice.push(sub.office);
      var currentValue = JSON.parse(el.dataset.value);
      currentValue.push(sub);

      el.dataset.office = JSON.stringify(currentOffice)
      el.dataset.value = JSON.stringify(currentValue)
    } else {
      const li = createElement('li', {
        className: 'mdc-list-item'
      })
      li.dataset.template = sub.template;
      li.dataset.office = JSON.stringify([sub.office]);
      li.dataset.value = JSON.stringify([sub])
      li.innerHTML = `${formatTextToTitleCase(`Create New ${sub.template}`)}
      <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
        keyboard_arrow_right
      </span>`
      ul.appendChild(li)
    }
  });

  return ul.outerHTML;
}

function updateName() {

  const auth = firebase.auth().currentUser;
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Update Name</span>
  `
  const header = getHeader('app-header', backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid change-name'>

<div class="mdc-text-field mdc-text-field--outlined mt-10" id='name'>
  <input class="mdc-text-field__input" required value='${firebase.auth().currentUser.displayName}' type='text' >
 <div class="mdc-notched-outline">
     <div class="mdc-notched-outline__leading"></div>
     <div class="mdc-notched-outline__notch">
           <label for='email' class="mdc-floating-label mdc-floating-label--float-above ">Name</label>
     </div>
     <div class="mdc-notched-outline__trailing"></div>
 </div>
</div>
<div class="mdc-text-field-helper-line">
  <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	">
  </div>
</div>

<div  class='mb-10 mt-10'>
  <button class='mdc-button mdc-theme--primary-bg' id='name-btn'>
  <span class='mdc-button__label mdc-theme--on-primary'>Update<span>
</button>
</div>
  </div>`
  const nameField = new mdc.textField.MDCTextField(document.getElementById('name'))
  nameField.focus();
  document.getElementById('name-btn').addEventListener('click', function () {
    if (!nameField.value) {
      nameField.focus();
      nameField.foundation_.setValid(false);
      nameField.foundation_.adapter_.shakeLabel(true);
      nameField.helperTextContent = 'Name Cannot Be Left Blank';
      return;
    }
    progressBar.open();
    auth.updateProfile({
      displayName: nameField.value.trim()
    }).then(function () {
      progressBar.close();
      history.back();
      snacks('Name Updated Successfully')
    })
  })
}

function getEmailViewHeading(auth, updateOnly) {
  const text = {
    topBarText: '',
    heading: '',
    btnText: 'Update'
  }
  if (updateOnly) {
    text.topBarText = 'Update Email';
    return text;
  }
  if (!auth.email) {
    text.topBarText = 'Add Email';
    text.heading = 'Please Add You Email Address To Continue'
    return text;
  }
  text.topBarText = 'Verify Email'
  text.heading = 'Please Verify Your Email Address To Continue'
  text.btnText = 'Verify'
  return text;
}

function emailUpdation(updateOnly) {
  const auth = firebase.auth().currentUser;
  const headings = getEmailViewHeading(auth, updateOnly)
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">${headings.topBarText}</span>
  `
  const header = getHeader('app-header', backIcon, '');
  header.root_.classList.remove('hidden');

  getEmployeeDetails(IDBKeyRange.bound(['recipient', 'CONFIRMED'], ['recipient', 'PENDING']), 'templateStatus').then(function (result) {

    document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid update-email'>
        
    ${updateEmailDom(auth.email, getReportOffices(result), headings)}
    </div>`
    const emailField = new mdc.textField.MDCTextField(document.getElementById('email'))
    emailField.focus();
    document.getElementById('email-btn').addEventListener('click', function () {
      console.log(emailField)

      if (!emailReg(emailField.value)) {
        emailField.focus();
        emailField.foundation_.setValid(false);
        emailField.foundation_.adapter_.shakeLabel(true);
        emailField.helperTextContent = 'Enter A Valid Email Id';
        return;
      };

      if (updateOnly) {
        if (emailField.value === firebase.auth().currentUser.email) {
          emailField.foundation_.setValid(false);
          emailField.foundation_.adapter_.shakeLabel(true);
          emailField.helperTextContent = 'New Email Cannot Be Same As Previous Email';
          return
        }
        progressBar.open()
        firebase.auth().currentUser.updateEmail(emailField.value).then(function () {
          firebase.auth().currentUser.sendEmailVerification().then(function () {
            snacks('Email Verification Has Been Sent.')
            history.pushState(['emailVerificationWait'], null, null)
            emailVerificationWait(updateOnly)
            progressBar.close()
          }).catch(handleEmailError)
        }).catch(handleEmailError)
        return
      }
      progressBar.open()
      if (emailField.value === firebase.auth().currentUser.email) {
        firebase.auth().currentUser.sendEmailVerification().then(function () {
          snacks('Email Verification Has Been Sent.')
          progressBar.close();
          history.pushState(['emailVerificationWait'], null, null)
          emailVerificationWait()
        }).catch(handleEmailError)
        return;
      };

      firebase.auth().currentUser.updateEmail(emailField.value).then(function () {
        firebase.auth().currentUser.sendEmailVerification().then(function () {
          snacks('Email Verification Has Been Sent.')
          history.pushState(['emailVerificationWait'], null, null)
          emailVerificationWait()
          progressBar.close()
        }).catch(handleEmailError)
      }).catch(handleEmailError)
      return
    })
    if (!result.length && !updateOnly) {
      const skipbtn = new mdc.ripple.MDCRipple(document.getElementById('skip-btn'))
      skipbtn.root_.classList.remove('hidden')
      skipbtn.root_.addEventListener('click', function () {
        history.pushState(['reportView'], null, null);
        reportView();
      })
    }
  })
}

function emailVerificationWait(updateOnly) {
  const auth = firebase.auth().currentUser
  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid'>
  <h3 class='mdc-typography--headline6'>Verification Link Has Been Sent To ${firebase.auth().currentUser.email}</h3>
  <p class='mdc-typography--body1'>Click Continue To Proceed Further</p>
  <button class='mdc-button mdc-theme--primary-bg mt-10' id='continue'>
  <span class='mdc-button__label mdc-theme--on-primary'>CONTINUE</span>
  </button>
</div>`
  document.getElementById('continue').addEventListener('click', function (evt) {
    progressBar.open()
    firebase.auth().currentUser.reload();
    setTimeout(function () {
      firebase.auth().currentUser.reload();
      if (!auth.emailVerified) {
        snacks('Email Not Verified. Try Again');
        progressBar.close()
        return;
      }
      progressBar.close()
      if (updateOnly) {
        history.go(-2);
        return;
      }
      history.pushState(['reportView'], null, null)
      reportView();
    }, 2000)
  })
}

function handleEmailError(error) {
  progressBar.close()
  if (error.code === 'auth/requires-recent-login') {
    const dialog = showReLoginDialog('Email Authentication', 'Please Login Again To Complete The Operation');
    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      revokeSession();
    })
    return;
  }
  snacks(error.message);

}

function getReportOffices(result) {

  const offices = []
  result.forEach(function (report, idx) {

    if (offices.indexOf(report.office) > -1) return
    offices.push(report.office);
  })
  if (offices.length) {
    return `You Are A Recipient In Reports for ${offices.join(', ').replace(/,(?!.*,)/gmi, ' &')}`
  }
  return ''
}


function updateEmailDom(email, reportString, headings) {

  return `

<h3 class='mdc-typography--headline6'>${headings.heading}</h3>
<p class='report-rec mt-10 mdc-typography--body1'>
${reportString}
</p>

<div class="mdc-text-field mdc-text-field--outlined mt-10" id='email'>
  <input class="mdc-text-field__input" required value='${email || ''}' type='email'>
 <div class="mdc-notched-outline">
     <div class="mdc-notched-outline__leading"></div>
     <div class="mdc-notched-outline__notch">
           <label for='email' class="mdc-floating-label ${email ? `mdc-floating-label--float-above` :''}">Email</label>
     </div>
     <div class="mdc-notched-outline__trailing"></div>
 </div>
</div>
<div class="mdc-text-field-helper-line">
  <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	">
  </div>
</div>

<div  class='mb-10 mt-10'>
<button class='mdc-button mdc-theme--primary-bg' id='email-btn'>
<span class='mdc-button__label mdc-theme--on-primary'>${headings.btnText}<span>
</button>

<button class='mdc-button mt-10 hidden' id='skip-btn'>
<span class='mdc-button__label'>SKIP<span>
</button>

</div>
`

}


