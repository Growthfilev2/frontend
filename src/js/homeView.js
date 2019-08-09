function getSuggestions() {
  if (ApplicationState.knownLocation) {
    getKnownLocationSubs().then(homeView);
    return;
  }
  return getSubsWithVenue().then(homeView)

}

function getKnownLocationSubs() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['subscriptions']);
    const store = tx.objectStore('subscriptions');
    const result = [];
    const venue = ApplicationState.venue
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (cursor.value.status === 'CANCELLED') {
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
    const tx = db.transaction(['subscriptions']);
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
  if(history.state[0] === 'homeView') {
    history.pushState(['profileView'],null,null)
    profileView();
    return;
  }
  return history.back();
}

function homePanel(suggestionLength) {
  return ` <div class="container home-container">
  <div class='meta-work'>
    <ul class='mdc-list subscription-list' id='common-task-list'>
      <li class='mdc-list-item'>Chat
      <span class='mdc-list-item__meta material-icons'>keyboard_arrow_right</span>
      </li>
      ${Object.keys(ApplicationState.officeWithCheckInSubs).length ? ` <li class='mdc-list-item'>Take Photo
      <span class='mdc-list-item__meta material-icons'>keyboard_arrow_right</span>
      </li>`:''}
      <li class='mdc-list-divider'></li>
    </ul>
  </div>
  <div class='work-tasks'>
      ${suggestionLength ? ``:
        `<h3 class="mdc-list-group__subheader mdc-typography--headline5  mdc-theme--primary">All Tasks Completed</h3>`
      }
      <h3 class="mdc-list-group__subheader mt-0 mb-0">${suggestionLength ? 'Suggestions' :''}</h3>
      <div id='pending-location-tasks'></div>
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

function homeHeaderStartContent(locationName) {
  return `
  <img class="mdc-top-app-bar__navigation-icon mdc-icon-button" src=${firebase.auth().currentUser.photoURL || './img/src/empty-user.jpg'}>
  <span class="mdc-top-app-bar__title">${locationName}</span>
`
}


function homeView(suggestedTemplates) {

  progressBar.close();
  history.pushState(['homeView'], null, null);
  let clearIcon = '';
  if (ApplicationState.nearByLocations.length) {
    clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='change-location'>clear</button>`
  }


  const header = getHeader('app-header', homeHeaderStartContent(ApplicationState.venue.location || 'Location'), clearIcon);


  header.listen('MDCTopAppBar:nav', handleNav);
  header.root_.classList.remove('hidden')


  const panel = document.getElementById('app-current-panel')

  panel.classList.add('mdc-top-app-bar--fixed-adjust', "mdc-layout-grid", 'pl-0', 'pr-0')

  const suggestionLength = suggestedTemplates.length;
  panel.innerHTML = homePanel(suggestionLength);

  if (document.getElementById('change-location')) {
    document.getElementById('change-location').addEventListener('click', function (evt) {
      progressBar.open()
      manageLocation().then(function (newLocation) {
        header.root_.classList.add('hidden');
        panel.classList.remove('mdc-top-app-bar--fixed-adjust', 'mdc-layout-grid', 'pl-0', 'pr-0');
        mapView(newLocation);
      }).catch(showNoLocationFound)
    })
  };
  const commonTaskList = new mdc.list.MDCList(document.getElementById('common-task-list'));
  commonTaskList.listen('MDCList:action', function (commonListEvent) {
    console.log(commonListEvent)
    if (commonListEvent.detail.index == 0) {
      const tx = db.transaction('root', 'readwrite');
      const store = tx.objectStore('root')
      store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
        const rootRecord = event.target.result;
        rootRecord.totalCount = 0;
        store.put(rootRecord)
      }
      tx.oncomplete = function () {
        history.pushState(['chatView'], null, null);
        chatView()
      }
      return;
    };

    history.pushState(['snapView'], null, null)
    const offices = Object.keys(ApplicationState.officeWithCheckInSubs)
    if (offices.length == 1) {
      photoOffice = offices[0]
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
      snapView()
      dialog.close();
    })
  })

  db.transaction('root').objectStore('root').get(firebase.auth().currentUser.uid).onsuccess = function (event) {
    const rootRecord = event.target.result;
    if (!rootRecord) return;
   
    if (rootRecord.totalCount) {
      const el =  commonTaskList.listElements[0].querySelector('.mdc-list-item__meta')
      el.classList.remove('material-icons');
      el.innerHTML = `<div class='chat-count'>${rootRecord.totalCount}</div>`
    }
  }

  document.getElementById('reports').addEventListener('click', function () {
    history.pushState(['reportView'],null,null)
    reportView();
  })
  
  if (!suggestedTemplates.length) return;
  console.log(suggestedTemplates)
  document.getElementById('suggestions-container').innerHTML = templateList(suggestedTemplates)

  const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
  handleTemplateListClick(suggestedInit);


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

    const officeList = `<ul class='mdc-list subscription-list' id='dialog-office'>
    ${officeOfSelectedList.map(function(office){
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
    ul.listen('MDCList:action', function (event) {
      history.pushState(['addView'], null, null);
      addView(valueSelectedList[event.detail.index])
      dialog.close()
    })
  });
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