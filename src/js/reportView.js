function reportView(state, attendanceRecord) {
  progressBar.close()

  const panel = document.getElementById('app-current-panel');

  getReportTabData().then(function (reportTabs) {
    console.log(reportTabs);

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

      initHeaderView();
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
          photoOffice = offices[e.detail.index];


          snapView()
          dialog.close();
        })
        return;
      }

      document.getElementById('start-load').classList.remove('hidden')
      const reportDataObject = reportTabs[evt.detail.index];

      window[reportDataObject.view]();
    })

    if (state == null) {
      if (reportTabs.length > 2) {
        return tabList.activateTab(2)
      }
      return tabList.activateTab(0)
    }

    tabList.activateTab(state)

  })
}


function getReportTabData() {
  return new Promise(function (resolve, reject) {
    const reportTabData = [{
      name: 'Chat',
      id: 'open-chat-list',
      icon: 'notifications',
      view: 'chatView',
      index: 0,
    }, {
      name: 'Photo Check-In',
      id: 'photo-check-in',
      icon: 'add_a_photo',
      view: 'snapView',
      index: 1
    }];

    const names = ['attendance', 'reimbursement', 'payment']
    const tx = db.transaction(names);

    names.forEach(function (name, index) {

      if (!db.objectStoreNames.contains(name)) return;
      const store = tx.objectStore(name);
      const req = store.count()
      req.onsuccess = function () {
        const value = req.result;
        if (!value) return;
        if (name === 'attendance') {
          reportTabData.push({
            icon: 'fingerprint',
            name: 'Attendances',
            store: 'attendance',
            view: 'attendanceView',
            index: index
          })
        }
        if (name === 'reimbursement') {
          reportTabData.push({
            icon: 'assignment',
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
    tx.oncomplete = function () {
      return resolve(reportTabData)
    }
    tx.onerror = function () {
      return reject(tx.error)
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
                <span class="mdc-tab__icon material-icons" aria-hidden="true">${report.icon}</span>
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



function getReportSubs(reportName) {
  return new Promise(function (resolve, reject) {
    const subs = [];
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions')
    var request = ''
    if (store.indexNames.contains('report')) {
      request = store.index('report')
        .openCursor(IDBKeyRange.only(reportName))
    } else {
      request = store.openCursor();
    }

    request.onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return
      if (cursor.value.status === 'CANCELLED') {
        cursor.delete()
        cursor.continue();
        return;
      }

      if (cursor.value.report !== reportName) {
        cursor.continue();
        return;
      }
      if (cursor.value.template === 'attendance regularization') {
        cursor.continue();
        return
      }

      subs.push(cursor.value)
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(subs)
    }
    tx.onerror = function () {
      return reject(tx.error)
    }
  })
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
    const dialog = new Dialog('Choose Office', officeSelectionList(subs), 'choose-office-subscription').create('simple');
    const ul = new mdc.list.MDCList(document.getElementById('dialog-office'))
    bottomDialog(dialog, ul)

    ul.listen('MDCList:action', function (evt) {
      history.pushState(['addView'], null, null);
      addView(subs[evt.detail.index])
      dialog.close()
    })
  })
  return button;
}