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
    };

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
  if (history.state[0] === 'reportView') {
    history.pushState(['profileView'], null, null)
    profileView();
    return;
  }
  return history.back();
}




function initHeaderView() {

  let clearIcon = ''
  if (ApplicationState.nearByLocations.length > 1) {
    clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='change-location'>clear</button>`
  }
  const header = getHeader('app-header', homeHeaderStartContent(ApplicationState.venue.location || ''), clearIcon);
  header.listen('MDCTopAppBar:nav', handleNav);
  header.root_.classList.remove('hidden');

  if (!ApplicationState.venue) {
    generateCheckInVenueName(header);
  }
  if (document.getElementById('change-location')) {
    document.getElementById('change-location').addEventListener('click', function () {
      progressBar.open();
      manageLocation(3).then(mapView).catch(handleLocationError);
    })
  }
  return header;
}



function generateCheckInVenueName(header) {
  const lastCheckInCreatedTimestamp = ApplicationState.lastCheckInCreated;
  if (!lastCheckInCreatedTimestamp) return;
  if (!header) return;
  const myNumber = firebase.auth().currentUser.phoneNumber;
  const tx = db.transaction('addendum');
  const addendumStore = tx.objectStore('addendum')
  let addendums = [];

  if (addendumStore.indexNames.contains('KeyTimestamp')) {
    const key = myNumber + myNumber
    const range = IDBKeyRange.only([lastCheckInCreatedTimestamp, key])
    addendumStore.index('KeyTimestamp').getAll(range).onsuccess = function (event) {
      if (!event.target.result.length) return;
      addendums = event.target.result;
    };
  } else {

    addendumStore.index('user').openCursor(myNumber).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.timestamp !== lastCheckInCreatedTimestamp) {
        cursor.continue();
        return;
      }
      addendums.push(cursor.value)
      cursor.continue();
    }
  }

  tx.oncomplete = function () {
    console.log(addendums);
    if (!addendums.length) return;
    addendums.forEach(function (addendum) {
      const activityStore = db.transaction('activity').objectStore('activity');
      activityStore.get(addendum.activityId).onsuccess = function (activityEvent) {
        const activity = activityEvent.target.result;
        if (!activity) return;
        if (activity.template !== 'check-in') return;
        const commentArray = addendum.comment.split(" ");
        const index = commentArray.indexOf("from");
        const nameOfLocation = commentArray.slice(index + 1, commentArray.length).join(" ");
        console.log(header)
        console.log(nameOfLocation)
        if (header.root_.querySelector('.mdc-top-app-bar__title')) {
          header.root_.querySelector('.mdc-top-app-bar__title').textContent = nameOfLocation;
        }
      }
    })
  }
}

function getCommonTasks() {
  const tasks = [{
    name: 'Chat',
    id: 'open-chat-list',
    icon: 'notifications'
  }];


  tasks.push({
    name: 'Photo Check-In',
    id: 'photo-check-in',
    icon: 'add_a_photo'
  })
  return tasks
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
  console.log(date.setDate(date.getDate() - 1))
  return date.setDate(date.getDate() - 1);
}


function createArSuggestion(attendances) {
  const el = document.getElementById('ar-container');

  const ul = createElement('ul', {
    className: 'mdc-list subscription-list mdc-list--two-line'
  })
  attendances.forEach(function (record) {

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
      textContent: 'Attendance Yesterday : ' + record.attendance
    })
    secondartText.style.marginTop = '5px';
    secondartText.style.fontSize = '1rem';

    if (record.attendance == 0) {
      primaryText.textContent = `Apply AR/Leave : ${record.office}`
    }
    if (record.attendance > 0 && record.attendance < 1) {
      primaryText.textContent = `Apply AR : ${record.office}`
    }
    textCont.appendChild(primaryText)
    textCont.appendChild(secondartText);
    li.appendChild(textCont);

    li.addEventListener('click', function () {
      history.pushState(['reportView'], null, null)
      reportView(record);
    })
    li.appendChild(icon)
    ul.appendChild(li)
  })
  if (!el) return;
  el.appendChild(ul)
  const list = new mdc.list.MDCList(ul);
  list.selectedIndex = 0;
  list.singleSelection = true;
}


function getYesterdayAtt() {
  return new Promise(function (resolve, reject) {
    var date = new Date()
    const tx = db.transaction('attendance');
    const index = tx.objectStore('attendance').index('key');
    let records = [];
    index.openCursor(IDBKeyRange.lowerBound(getYesterdayArDate())).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!cursor.value.hasOwnProperty('attendance')) {
        cursor.continue();
        return;
      }

      if (cursor.value.attendance == 1) {
        cursor.continue();
        return;
      }

      if (cursor.value.date === (date.getDate() - 1) && cursor.value.month == date.getMonth() && cursor.value.year == date.getFullYear()) {
        records.push(cursor.value)
      }
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(records)
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
            if (!mapRecord) return;
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

function officeSelectionList(subs) {

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

function getEmailViewHeading(auth) {
  const text = {
    topBarText: '',
    heading: '',
    btnText: 'Update'
  }

  if (!auth.email) {
    text.topBarText = 'Add Email';
    text.heading = 'Please Add You Email Address To Continue'
    return text;
  }
  if (!auth.emailVerified) {

    text.topBarText = 'Verify Email'
    text.heading = 'Please Verify Your Email Address To Continue'
    text.btnText = 'Verify'
    return text;
  }
  text.topBarText = 'Update Email'
  text.btnText = 'Update'
  return text;
}

function emailUpdation(callback, updateOnly) {
  const auth = firebase.auth().currentUser;
  const headings = getEmailViewHeading(auth)
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
        setHelperInvalid(emailField)
        emailField.helperTextContent = 'Enter A Valid Email Id';
        return;
      };


      progressBar.open();

      if (auth.email) {
        if (emailField.value !== auth.email) {
          emailUpdate(emailField.value, callback)
          return;
        }
        if (!auth.emailVerified) {
          emailVerification(callback);
          return
        }
        progressBar.close()
        setHelperInvalid(emailField)
        emailField.helperTextContent = 'New Email Cannot Be Same As Previous Email';
        return
      }

      emailUpdate(emailField.value, callback)
      return
    });

    if (!result.length && !updateOnly) {
      const skipbtn = new mdc.ripple.MDCRipple(document.getElementById('skip-btn'))
      skipbtn.root_.classList.remove('hidden')
      skipbtn.root_.addEventListener('click', function () {
        history.pushState([`${callback}`], null, null);
        callback();
      })
    }
  })
}

function emailUpdate(email, callback) {
  firebase.auth().currentUser.updateEmail(email).then(function () {
    emailVerification(callback)
  }).catch(handleEmailError)
}

function emailVerification(callback) {
  firebase.auth().currentUser.sendEmailVerification().then(function () {
    snacks('Email Verification Has Been Sent.')
    progressBar.close();
    history.pushState(['emailVerificationWait'], null, null)
    emailVerificationWait(callback)
  }).catch(handleEmailError)
}

function emailVerificationWait(callback) {
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
      // if (updateOnly) {
      //   history.go(-2);
      //   return;
      // }
      history.pushState([`${callback}`], null, null)
      callback();
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

function newUserLandingpage(geopoint) {
  const appEl = document.getElementById('app-current-panel');
  appEl.innerHTML = '';

  const container = createElement('div', {
    className: 'landing-page-container text-center'
  })
  container.innerHTML = `<div class='text-box'>
  <p class='mdc-typography--headline5 mt-0'>Welcome to GROWTHFILE, Lorem ipsum</p>
</div>`

  const cardBoxCont = createElement('div', {
    className: 'card-box-container'
  })

  const card = createElement('div', {
    className: 'selection-box mdc-card  mdc-card--outlined'
  })
  card.innerHTML = `<div class='content'>
  <div class='icon-container'>
    <i class='material-icons mdc-theme--primary'>search</i>
  </div>
  <div class='text'>
    <p class='mdc-typography--body1 mt-10 mb-0'>Search Office</p>
  </div>
</div>`

  card.addEventListener('click', function () {
    searchOffice(geopoint);
  });

  cardBoxCont.appendChild(card)
  container.appendChild(cardBoxCont)
  appEl.appendChild(container);

}


function searchOffice(geopoint) {
  const appEl = document.getElementById('app-current-panel');
  appEl.innerHTML = `<div class='search-map-cont'>
   <div class='search-container'>
    ${textField({
      id: 'search-address',
      label: 'Search',
      leadingIcon:'search',
      trailingIcon:'clear',
      autocomplete:'organization'
    })}

    <div class='search-result-container'>
      <div role="progressbar" id='search-progress-bar' class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed">
        <div class="mdc-linear-progress__buffering-dots"></div>
        <div class="mdc-linear-progress__buffer"></div>
        <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
          <span class="mdc-linear-progress__bar-inner"></span>
        </div>
        <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
          <span class="mdc-linear-progress__bar-inner"></span>
        </div>
      </div>
       <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list' id='place-query-ul'>
       </ul>
    </div>
   </div>
  <div id='map-search'></div>
  ${selectionBox()}
  </div>`;

  const center = {
    lat: geopoint.latitude,
    lng: geopoint.longitude
  }

  const map = new google.maps.Map(document.getElementById('map-search'), {
    zoom: 15,
    center: center,
    disableDefaultUI: true
  });

  var marker = new google.maps.Marker({
    position: center,
    icon: './img/bluecircle.png',
    map: map
  });

  var radiusCircle = new google.maps.Circle({
    strokeColor: '#89273E',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#89273E',
    fillOpacity: 0.35,
    map: map,
    center: center,
    radius: geopoint.accuracy < 100 ? geopoint.accuracy * 2 : geopoint.accuracy
  });

  const searchField = new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'));
  console.log(searchField)
  searchField.trailingIcon_.root_.addEventListener('click', function () {
    searchField.value = ''
    searchField.trailingIcon_.root_.classList.add('hidden')
    document.getElementById('place-query-ul').innerHTML = ''
    searchField.focus();
    map.setCenter(center)
    createMarker()
  })
  searchField.trailingIcon_.root_.classList.add('hidden')
  const placeRequesParam = {
    query: '',
    fields: ['name', 'geometry', 'place_id', 'formatted_address', 'types', 'photos']
  }
  searchField.input_.addEventListener('input', function (event) {
    if (!event.target.value.trim()) return
    searchField.trailingIcon_.root_.classList.remove('hidden')
    var searchEvent = new CustomEvent('searchPlaces', {
      detail: {
        value: event.target.value,
        map: map,
        placeRequesParam: placeRequesParam,
        geopoint: geopoint
      }
    });

    window.dispatchEvent(searchEvent);
  })
}

var searchDebounde = debounce(function (event) {
  const map = event.detail.map;
  const placeRequesParam = event.detail.placeRequesParam;
  const value = event.detail.value;
  const geopoint = event.detail.geopoint
  placeRequesParam.query = value;
  const service = new google.maps.places.PlacesService(map);
  const mapCont = document.getElementById('map-search')
  const ul = new mdc.list.MDCList(document.getElementById('place-query-ul'))
  var infowindow = new google.maps.InfoWindow();
  const searchProgress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('search-progress-bar'))
  searchProgress.open();


  service.findPlaceFromQuery(placeRequesParam, function (results, status) {
    ul.root_.innerHTML = ''
    searchProgress.close();
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      console.log(results)
      results.forEach(function (result) {
        createMarker(result, map, infowindow)
        const li = searchPlaceResultList(result.name, result.formatted_address);
        li.addEventListener('click', function () {
          service.getDetails({
            placeId: result.place_id,
            fields: ['international_phone_number']
          }, function (placeDetail, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK && placeDetail.international_phone_number) {
              result.international_phone_number = placeDetail.international_phone_number
            }
            requestCreator('search', {
              query: `template=office&attachmentName=${value}`
            }).then(function (searchResponse) {
              console.log(searchResponse.response)
              const offices = Object.keys(searchResponse.response);
              
              // if (offices.length) {

              //   return;
              // };

            }).catch(console.error)
          });
        });
        ul.root_.appendChild(li);
      })
      map.setCenter(results[0].geometry.location);
    } else {
      createMarker()
      map.setCenter({
        lat: geopoint.latitude,
        lng: geopoint.longitude
      })
      const supportLi = searchPlaceResultList(`No result found for "${value}"`, `Add "${value}" as a company`, 'add');
      supportLi.addEventListener('click', function () {
        createOfficeInit(geopoint)
      })
      ul.root_.appendChild(supportLi);
    }

    // createOfficeInit(geopoint, result)
  }).catch(console.error)


}, 1000, false)

window.addEventListener('searchPlaces', searchDebounde)




function searchPlaceResultList(primaryText, secondaryText, icon) {
  const li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.innerHTML = `<span class='mdc-list-item__graphic material-icons'>${icon ? icon :'location_on'}</span>
    <span class='mdc-list-item__text'>
        <span class='mdc-list-item__primary-text'>${primaryText}</span>
        <span class='mdc-list-item__secondary-text'>${secondaryText}</span>
    </span>`
  return li;

}

var searchPlaceMarkers = [];

function createMarker(place, map, infowindow) {
  searchPlaceMarkers.forEach(function (oldMarker) {
    oldMarker.setMap(null);
  })
  searchPlaceMarkers = [];
  if (!place) return;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
  searchPlaceMarkers.push(marker);
}


function createOfficeInit(geopoint, placeComponent) {

  document.getElementById('app-header').classList.remove('hidden')
  const appEl = document.getElementById('app-current-panel')
  history.pushState(['addView'], null, null);
  const template = {
    "schedule": [
      "Date Of Establishment",
      "Trial Period"
    ],
    "attachment": {
      "Registered Office Address": {
        "type": "string",
        "value": placeComponent && placeComponent.formatted_address ? placeComponent.formatted_address : ''
      },
      "Company Logo": {
        "value": '',
        "type": "string"
      },
      "Youtube ID": {
        "type": "string",
        "value": ""
      },
      "Usage": {
        "type": "string",
        "value": ""
      },
      "Branch Place Supported Types": {
        "type": "string",
        "value": ""
      },
      "First Day Of Monthly Cycle": {
        "type": "number",
        "value": ""
      },
      "Timezone": {
        "type": "string",
        "value": ""
      },
      "Second Contact": {
        "type": "phoneNumber",
        "value": ""
      },
      "First Day Of Reimbursement Cycle": {
        "type": "number",
        "value": ""
      },
      "GST Number": {
        "type": "string",
        "value": ""
      },
      "Description": {
        "type": "string",
        "value": ""
      },
      "Short Description": {
        "type": "string",
        "value": ""
      },
      "First Contact": {
        "type": "phoneNumber",
        "value": placeComponent && placeComponent.international_phone_number ? placeComponent.international_phone_number : ''
      },
      "Name": {
        "type": "string",
        "value": placeComponent && placeComponent.name ? placeComponent.name : ''
      },
      "Customer Place Supported Types": {
        "value": "",
        "type": "string"
      }
    },
    "template": "office",
    "venue": [],
  };
  // search api  => 

  addView(template);

  // }

}

function createNewEmployee(office) {

  document.getElementById('app-header').classList.remove('hidden')
  const appEl = document.getElementById('app-current-panel')
  history.pushState(['addView'], null, null);

  addView({
    "schedule": [],
    "template": 'employee',
    "attachment": {
      "Department": {
        "value": "",
        "type": "department"
      },
      "Product Specialization": {
        "type": "string",
        "value": ""
      },
      "Minimum Working Hours": {
        "type": "number",
        "value": ""
      },
      "Daily End Time": {
        "value": "",
        "type": "HH:MM"
      },
      "Monthly Off Days": {
        "type": "number",
        "value": ""
      },
      "Designation": {
        "type": "string",
        "value": ""
      },
      "Maximum Advance Amount Given": {
        "type": "number",
        "value": ""
      },
      "Employee Based In Customer Location": {
        "type": "boolean",
        "value": ""
      },
      "Minimum Daily Activity Count": {
        "type": "number",
        "value": ""
      },
      "Start Point Latitude": {
        "type": "number",
        "value": ""
      },
      "Employee Code": {
        "type": "string",
        "value": ""
      },
      "Second Supervisor": {
        "type": "phoneNumber",
        "value": ""
      },
      "Daily Start Time": {
        "type": "HH:MM",
        "value": ""
      },
      "Scheduled Only": {
        "type": "boolean",
        "value": ""
      },
      "Name": {
        "type": "string",
        "value": ""
      },
      "KM Daily Limit": {
        "type": "string",
        "value": ""
      },
      "Employee Contact": {
        "type": "phoneNumber",
        "value": ""
      },
      "KM Rate": {
        "type": "string",
        "value": ""
      },
      "First Supervisor": {
        "type": "phoneNumber",
        "value": ""
      },
      "Location Validation Check": {
        "type": "boolean",
        "value": ""
      },
      "Region": {
        "type": "region",
        "value": ""
      },
      "Task Specialization": {
        "type": "string",
        "value": ""
      },
      "Start Point Longitude": {
        "type": "number",
        "value": ""
      },
      "Base Location": {
        "type": "branch",
        "value": ""
      },
      "Third Supervisor": {
        "value": "",
        "type": "phoneNumber"
      }
    },
    "venue": [],

  });

  // document.querySelector('#section-start .mdc-top-app-bar__navigation-icon').addEventListener('click',function(){
  //   history.back();
  // })
}