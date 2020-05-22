function reportView(state, attendanceRecord) {

  document.getElementById('step-ui').innerHTML = ''
  const panel = document.getElementById('app-current-panel');
  panel.classList.remove('mdc-theme--primary-bg')
  getReportTabData().then(function (reportTabs) {
    console.log(reportTabs);
    reportViewHeader()
    panel.classList.add('mdc-top-app-bar--fixed-adjust', "mdc-layout-grid", 'pl-0', 'pr-0')
    panel.innerHTML = `
    ${showTabs(reportTabs)}
    <div class='tabs-section'>
    <div class='content'>
    <div class='data-container mdc-layout-grid'>
    </div>
    </div>
    </div>`

    const tabList = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'))
    tabList.listen('MDCTabBar:activated', function (evt) {
      history.replaceState(['reportView', evt.detail.index], null, null)
      if (!evt.detail.index) {
        chatView();
        return;
      }
      if (document.getElementById('search-btn')) {
        document.getElementById('search-btn').remove();
      }
      if (evt.detail.index == 1) {
        const offices = Object.keys(ApplicationState.officeWithCheckInSubs)
        if (offices.length == 1) {
          photoOffice = offices[0];
          snapView('.tabs-section .data-container')
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
          photoOffice = offices[e.detail.index];
          snapView('.tabs-section .data-container')
          dialog.close();
        })
        return;
      }

      const reportDataObject = reportTabs[evt.detail.index];

      window[reportDataObject.view]();
    })

    if (state == null) {
      if (reportTabs.length > 2) {
        return tabList.activateTab(2)

      }
      return tabList.activateTab(0)
    }

    tabList.activateTab(state);

  }).catch(handleError)
}

function reportViewHeader() {
  let clearIcon = ''
  if (ApplicationState.nearByLocations.length > 1) {
    clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='change-location'>clear</button>`
  }
  const header = setHeader(homeHeaderStartContent(ApplicationState.venue.location || ''), clearIcon);
  header.root_.classList.remove('hidden');
  if (!ApplicationState.venue) {
    generateCheckInVenueName(header);
  }
  if (document.getElementById('change-location')) {
    document.getElementById('change-location').addEventListener('click', function () {
      progressBar.open();
      appLocation(3).then(mapView).catch(handleLocationError)
    })
  }
};

function homeHeaderStartContent(name) {
  return `<img class="mdc-top-app-bar__navigation-icon mdc-icon-button image" id='profile-header-icon' onerror="imgErr(this)" src=${firebase.auth().currentUser.photoURL || './img/src/empty-user.jpg'}>
  <span class="mdc-top-app-bar__title">${name}</span>`;

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




function getReportTabData() {
  return new Promise(function (resolve, reject) {
    const reportTabData = [{
      name: 'Contacts',
      id: 'open-chat-list',
      icon: 'person_add',
      view: 'chatView',
      index: 0,
    }];
    if (Object.keys(ApplicationState.officeWithCheckInSubs).length) {
      reportTabData.push({
        name: 'Photo Check-In',
        id: 'photo-check-in',
        icon: 'add_a_photo',
        view: 'snapView',
        index: 1
      })
    }
    const names = ['attendance', 'reimbursement', 'payment']
    const reportTx = db.transaction(names);

    names.forEach(function (name, index) {

      if (!db.objectStoreNames.contains(name)) return;
      const store = reportTx.objectStore(name);
      const req = store.count()
      req.onsuccess = function () {
        const value = req.result;
        if (!value) return;
        if (name === 'attendance') {
          reportTabData.push({
            icon: 'room',
            name: 'Attendances',
            store: 'attendance',
            view: 'attendanceView',
            index: index
          })
        }
        if (name === 'reimbursement') {
          reportTabData.push({
            icon: 'motorcycle',
            name: 'Reimbursements',
            store: 'reimbursement',
            view: 'expenseView',
            index: index
          })
        }
        if (name === 'payment') {
          reportTabData.push({
            icon: 'payment',
            name: 'Payments',
            store: 'payment',
            view: 'paymentView',
            index: index
          })
        }

      }
    })
    reportTx.oncomplete = function () {
      Promise.all([getReportSubscriptions('incentive'), getSubscription('', 'call')]).then(function (results) {
        const merged = [...results[0], ...results[1]];
        if (merged.length) {
          reportTabData.push({
            name: 'Incentives',
            icon: './img/currency.png',
            view: 'incentiveView',
            index: reportTabData.length + 1
          })
        }
        return resolve(reportTabData)
      })
    }
    reportTx.onerror = function () {
      return reject({
        message: reportTx.error.message,
        body: JSON.stringify(reportTx.error)
      })
    }
  })
}

function showTabs(reportTabs) {

  return `<div class="mdc-tab-bar" role="tablist" style='margin-top:5px;'>
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
      
          ${reportTabs.map(function(report){
              return `
              <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1" id=${report.id || ''}>
              <span class="mdc-tab__content">
                ${report.name === 'Incentives' ?`<img class='mdc-tab__icon currency-primary' src=${report.icon}>`  : `<span class="mdc-tab__icon material-icons" aria-hidden="true">${report.icon}</span>`}
                
                <span class="mdc-tab__text-label">${report.name}</span>
              </span>
              <span class="mdc-tab-indicator">
                <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
              </span>
              <span class="mdc-tab__ripple"></span>
            </button>`
          }).join("")}
        </div>
      </div>
    </div>
  </div>`
}


function getReportSubscriptions(name) {
  return new Promise(function (resolve, reject) {
    const result = []
    const tx = db.transaction('subscriptions');
    const store = tx.objectStore('subscriptions').index('report');
    store.openCursor(name).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      if (cursor.value.template === 'attendance regularization') {
        cursor.continue();
        return;
      }
      result.forEach(function (sub, index, object) {
        if (sub.office === cursor.value.office && sub.template === cursor.value.template) {
          if (!sub.hasOwnProperty('timestamp') || !cursor.value.hasOwnProperty('timestamp')) {
            object.splice(index, 1)
          } else {
            if (sub.timestamp < cursor.value.timestamp) {
              object.splice(index, 1)
            }
          }
        }
      })
      result.push(cursor.value);
      cursor.continue();
    }
    tx.oncomplete = function () {
      console.log(result)
      resolve(result);
    }
  });
}


function toggleReportCard(selector) {
  [].map.call(document.querySelectorAll(selector), function (el) {
    if (el) {
      const icon = el.querySelector('.dropdown i')
      if (!icon) return;
      icon.addEventListener('click', function () {
        const detailContainer = el.querySelector('.detail-container')
        if (detailContainer.classList.contains('hidden')) {
          icon.textContent = 'keyboard_arrow_up'
          detailContainer.classList.remove('hidden')
        } else {
          icon.textContent = 'keyboard_arrow_down'
          detailContainer.classList.add('hidden')
        }
      })
    }
  })
}

function createTemplateButton(subs) {

    const button = createFab('add')
    button.addEventListener('click', function () {
      if (subs.length == 1) {
        history.pushState(['addView'], null, null);
        addView(subs[0])
        return
      }

      const uniqueSubs = {}
        subs.forEach(function (sub) {
        if (!uniqueSubs[sub.template]) {
          uniqueSubs[sub.template] = [sub]
        } else {
          uniqueSubs[sub.template].push(sub)
        }
      })

      const dialog = new Dialog('', templateSelectionList(uniqueSubs), 'choose-office-subscription').create('simple');
      const ul = new mdc.list.MDCList(document.getElementById('dialog-office'))
      bottomDialog(dialog, ul)

      ul.listen('MDCList:action', function (subscriptionEvent) {
        const selectedSubscriptions = uniqueSubs[Object.keys(uniqueSubs)[subscriptionEvent.detail.index]];
        dialog.close()
        if (selectedSubscriptions.length == 1) {
          history.pushState(['addView'], null, null);
          addView(selectedSubscriptions[0])
          return
        }
        const officeDialog = new Dialog('Choose office', officeSelectionList(selectedSubscriptions), 'choose-office-subscription').create('simple');
        const officeList = new mdc.list.MDCList(document.getElementById('dialog-office'))
        bottomDialog(officeDialog, officeList)
        officeList.listen('MDCList:action', function (officeEvent) {
          const selectedSubscription = selectedSubscriptions[officeEvent.detail.index];
          officeDialog.close();
          history.pushState(['addView'], null, null);
          addView(selectedSubscription)
        })
      })
    })
    return button;
 
}



function templateSelectionList(uniqueSubs) {
  return `<ul class='mdc-list subscription-list' id='dialog-office'>
     ${Object.keys(uniqueSubs).map(function(name){
       return `<li class='mdc-list-item'>
        <span class="mdc-list-item__text">
          ${name}
        </span>      
       <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
         keyboard_arrow_right
       </span>
       </li>`
     }).join("")}
     </ul>`
};

function officeSelectionList(subscriptions) {
  return `<ul class='mdc-list subscription-list' id='dialog-office'>
     ${subscriptions.map(function(sub){
       return `<li class='mdc-list-item'>
        <span class="mdc-list-item__text">
          ${sub.office} 
        </span>      
       <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
         keyboard_arrow_right
       </span>
       </li>`
     }).join("")}
     </ul>`
};