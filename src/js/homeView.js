function getSuggestions() {
  if (ApplicationState.knownLocation) {
    Promise.all([getPendingLocationActivities(),getKnownLocationSubs()]).then(function(result){

    })
    
    return;
  }
  if (!ApplicationState.office) return getAllSubscriptions().then(homeView);
  return getSubsWithVenue().then(homeView)
}

function getKnownLocationSubs() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['subscriptions']);
    const store = tx.objectStore('subscriptions');
    
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
      }
      let found = false;
      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === venue.template) {
          result.push(cursor.value)
          found = true;
        }
      })
      cursor.continue();
    }
    tx.oncomplete = function () {
      resolve(result)
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
  // const state = history.state[0]
  // if(state === 'homeView') return getSuggestions();
  return history.back();
}

function homePanel() {
  return ` <div class="container home-container">
  
  ${topNavCard()}
  <div id='suggestions-container'></div>
  </div>`
}

function topNavCard() {
  return `
   
    <div class="profile-container mdc-card">
    <div class="mdc-card__primary-action">
      <div class="simple">
  
        <img src="${firebase.auth().currentUser.photoURL}" class="image" id='profile-image-card'>
        <h3 class="mdc-typography--headline6">My Growthfile</h3>
      </div>
      <div class="actions">
        <div class="action">
  
          <span class="mdc-typography--body1" id='camera'><i class="material-icons">camera</i>Camera</span>
        </div>
        <div class="action">
          <span class="mdc-typography--body1" id='chat'><i class="material-icons">comment</i>Chats</span>
        </div>
      </div>
  
    </div>
  </div>
  
  `
}

function homeView(suggestedTemplates) {
  progressBar.close();

  const header = getHeader('app-header', '', '');
  header.listen('MDCTopAppBar:nav', handleNav);
  document.getElementById('app-header').classList.add('hidden')
  history.pushState(['homeView'], null, null)
  const panel = document.getElementById('app-current-panel')
  document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust')
  panel.innerHTML = homePanel();
  document.getElementById('camera').addEventListener('click', function () {
    history.pushState(['snapView'], null, null)
    snapView()
  })
  document.getElementById('chat').addEventListener('click', function () {
    history.pushState(['chatView'], null, null);
    chatView()
  })
  document.getElementById('profile-image-card').addEventListener('click', function () {
    history.pushState(['profileView'], null, null);
    profileView()
  })

  document.getElementById('suggestions-container').innerHTML = `
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">Suggestions... (Text Content to be changed)</h3>

  <ul class="mdc-list subscription-list" id='suggested-list'>
    ${suggestedTemplates.map(function(sub){
    return `<li class='mdc-list-item' data-value='${JSON.stringify(sub)}'>
        New ${sub.template}  ?
      <span class='mdc-list-item__meta material-icons'>
        keyboard_arrow_right
      </span>
    </li>`
    }).join("")}
  </ul>`


  const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
  suggestedInit.singleSelection = true;
  suggestedInit.selectedIndex = 0
  suggestedInit.listen('MDCList:action', function (evt) {
    console.log(suggestedInit.listElements[evt.detail.index].dataset)
    history.pushState(['addView'], null, null);
    addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value))
  })

}

function getPendingLocationActivities() {
  const tx = db.transaction('activity');
  // const 
  const index = tx.objectStore('activity').index('status')
  index.openCursor('PENDING').onsuccess = function (evt) {
    const cursor = evt.target.result;
    if (!cursor) return;
    // if(ApplicationState)
    console.log(cursor.value)
    cursor.continue();
  }
}