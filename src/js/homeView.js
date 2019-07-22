function getSuggestions() {
  if (ApplicationState.knownLocation) {
    getKnownLocationSubs().then(homeView);
    return;
  }
  if (!ApplicationState.office) return getAllSubscriptions().then(homeView);

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
      if (cursor.value.office !== venue.office) {
        cursor.continue();
        return;
      }
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
        if(!sn.startTime && !sn.endTime)  return;
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
    const office = ApplicationState.office
    const result = []
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return
      if (cursor.value.template === 'check-in') {
        cursor.continue();
        return;
      }
      if (cursor.value.office !== office) {
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
  return history.back();
}

function homePanel(suggestionLength) {
  return ` <div class="container home-container">
  <div class='work-tasks'>
      ${suggestionLength ? `<h3 class="mdc-list-group__subheader mdc-typography--headline5">What do you want to do ?</h3>`:
        `<h3 class="mdc-list-group__subheader mdc-typography--headline5 text-center mdc-theme--primary">All Tasks Completed</h3>`
      }
      <h3 class="mdc-list-group__subheader">${suggestionLength ? 'Suggestions' :''}</h3>
      <div id='pending-location-tasks'></div>
      <div id='suggestions-container'></div>
      <div id='action-button' class='attendence-claims-btn-container mdc-layout-grid__inner'>
      </div>

      <button class="mdc-fab mdc-fab--extended  mdc-theme--primary-bg app-fab--absolute" id='reports'>
      <span class="material-icons mdc-fab__icon">description</span>
      <span class="mdc-fab__label">My Reports</span>
     </button>
  </div>
</div>`
}

function homeHeaderStartContent(){
  return `
  <img src="${firebase.auth().currentUser.photoURL}" class="image " id='profile-header-icon' onerror="imgErr(this)">
  <span class="header-two-line mdc-top-app-bar__title">${ApplicationState.venue.location || 'Unknown Location'}</span>
`
}

function homeView(suggestedTemplates) {
  progressBar.close();
 
  const actionItems = ` 
  <a  class="mdc-top-app-bar__action-item pt-0" aria-label="Chat" id='chat'>
  <div class="action" style='display:inline-flex;align-items:center' id='chat-container'>
  <div class='chat-button'>
  <i class="material-icons">comment</i>
  <span class='count-badge hidden' id='total-count'></span>
  </div>
</div>
</div>
  </a>
  <a  class="material-icons mdc-top-app-bar__action-item" aria-label="Add a photo" id='camera'>add_a_photo</a>`
  
  const header = getHeader('app-header', homeHeaderStartContent(), actionItems);
  header.root_.classList.remove('hidden')
  document.getElementById('app-current-panel').classList.add('mdc-top-app-bar--fixed-adjust',"mdc-layout-grid",'pl-0','pr-0')

  history.pushState(['homeView'], null, null)
  header.listen('MDCTopAppBar:nav', handleNav);
  

  const panel = document.getElementById('app-current-panel')
  const suggestionLength = suggestedTemplates.length
  panel.innerHTML = homePanel(suggestionLength);
  db.transaction('root').objectStore('root').get(firebase.auth().currentUser.uid).onsuccess = function(event){
    const rootRecord = event.target.result;
    if(!rootRecord)  return;

    if(rootRecord.totalCount) {
      document.getElementById('total-count').classList.remove('hidden')
      document.getElementById('total-count').textContent = rootRecord.totalCount
    }
  }
  if(document.getElementById('camera')) {

    document.getElementById('camera').addEventListener('click', function () {
      history.pushState(['snapView'], null, null)
      snapView()
    })
  } 
  document.getElementById('chat-container').addEventListener('click', function () {
    history.pushState(['chatView'], null, null);
    chatView()
    const tx =  db.transaction('root','readwrite');
    const store =  tx.objectStore('root')
     store.get(firebase.auth().currentUser.uid).onsuccess = function(event){
      const rootRecord = event.target.result;
      rootRecord.totalCount = 0;
      store.put(rootRecord)
    }
  })
  document.getElementById('profile-header-icon').addEventListener('click', function () {
    history.pushState(['profileView'], null, null);
    profileView()
  })

  document.getElementById('reports').addEventListener('click',function(){
    history.pushState(['reportView'],null,null)
    reportView();
  })
  
  if(!suggestedTemplates.length) return;

  document.getElementById('suggestions-container').innerHTML = templateList(suggestedTemplates)
  const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
  suggestedInit.singleSelection = true;
  suggestedInit.selectedIndex = 0;
  suggestedInit.listen('MDCList:action', function (evt) {
    console.log(suggestedInit.listElements[evt.detail.index].dataset)
    history.pushState(['addView'], null, null);
    addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value))
  });
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
  return `<ul class="mdc-list subscription-list" id='suggested-list'>
  ${suggestedTemplates.map(function(sub){
  return `<li class='mdc-list-item' data-value='${JSON.stringify(sub)}'>
      New ${sub.template}  ?
    <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
      keyboard_arrow_right
    </span>
  </li>`
  }).join("")}
</ul>`
}