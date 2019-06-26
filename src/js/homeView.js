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
      }

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
      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === ApplicationState.venue.template && cursor.value.attachment[attachmentName].value === ApplicationState.venue.location) {
          console.log(cursor.value)
          match = cursor.value
        }
      })
      if (!match) {
        cursor.continue();
        return;
      }
      let found = false
      match.schedule.forEach(function (sn) {
        if (moment(moment()).isBetween(sn.startTime, sn.endTime, null, '[]')) {
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
  // const state = history.state[0]
  // if(state === 'homeView') return getSuggestions();
  return history.back();
}

function homePanel() {
  return ` <div class="container home-container"> 
  ${topNavCard()}
  <div class='work-tasks'>
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">What do you want to do ?</h3>
  <h3 class="mdc-list-group__subheader">Suggestions</h3>
  <div id='pending-location-tasks'></div>
  <div id='suggestions-container'></div>
  </div>
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
    <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed" id='suggestion-progress'>
    <div class="mdc-linear-progress__buffering-dots"></div>
    <div class="mdc-linear-progress__buffer"></div>
    <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
      <span class="mdc-linear-progress__bar-inner"></span>
    </div>
    <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
      <span class="mdc-linear-progress__bar-inner"></span>
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
  const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('suggestion-progress'))

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
  if (ApplicationState.knownLocation) {
    getPendingLocationActivities().then(function (activities) {
      document.getElementById('pending-location-tasks').innerHTML = pendinglist(activities);
      const ul = new mdc.list.MDCList(document.getElementById('confirm-tasks'))
      ul.singleSelection = true;
      console.log(ul)
      ul.listen('MDCList:action', function (evt) {
        console.log(activities[evt.detail.index])
        const activityClicked = activities[evt.detail.index];
        progCard.open();
    
        requestCreator('statusChange',{
          activityId: activityClicked.activityId,
          status: 'CONFIRMED'
        }).then(function(){
          progCard.close();
          ul.listElements[evt.detail.index].classList.add('slide-right');
          setTimeout(function(){
            ul.listElements[evt.detail.index].classList.add('hidden');
          },500)
        }).catch(function(error){
          progCard.close();
          snacks(error.response.message)
          ul.foundation_.adapter_.setCheckedCheckboxOrRadioAtIndex(evt.detail.index,false)      
        })
      })
    })
  }
  document.getElementById('suggestions-container').innerHTML = templateList(suggestedTemplates)
  const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
  suggestedInit.singleSelection = true;
  suggestedInit.selectedIndex = 0;
  suggestedInit.listen('MDCList:action', function (evt) {
    console.log(suggestedInit.listElements[evt.detail.index].dataset)
    history.pushState(['addView'], null, null);
    addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value))
  })
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