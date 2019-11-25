function reportView(attendanceRecord) {
  progressBar.close()
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>
  <span class="mdc-top-app-bar__title">My Reports</span>
  `
  initHeaderView();

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
    

      if (!evt.detail.index) {
        history.pushState(['chatView'], null, null);
        chatView();
        return;
      }
      if (evt.detail.index == 1) {
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
        return;
      }

      document.getElementById('start-load').classList.remove('hidden')
      if (evt.detail.index == 2) {
        history.pushState(['attendanceView'], null, null);
        attendenceView(attendanceRecord);
        return
      }

      if (evt.detail.index == 3) {
        history.pushState(['expenseView'], null, null);
        return expenseView()
      }
      if (evt.detail.index == 4) {
        history.pushState(['paymentView'], null, null);
        return paymentView();
      }
    })
    tabList.activateTab(2)
  })
}


function getReportTabData() {
  return new Promise(function (resolve, reject) {
    const reportTabData = [{
      icon: 'fingerprint',
      name: 'Attendances',
      store: 'attendance'
    }, {
      icon: 'assignment',
      name: 'Reimbursements',
      store: 'reimbursement'
    }, {
      icon: 'payment',
      name: 'Payments',
      store: 'payment'
    }];

    const tx = db.transaction(['attendance', 'reimbursement', 'payment']);

    reportTabData.forEach(function (data) {

      if (!db.objectStoreNames.contains(data.store)) return;
      const store = tx.objectStore(data.store);
      const req = store.count()
      req.onsuccess = function () {
        data.count = req.result;
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
          ${getCommonTasks().map(function(commonTask){
            return `<button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1" id=${commonTask.id}>
            <span class="mdc-tab__content">
              <span class="mdc-tab__icon material-icons" aria-hidden="true">${commonTask.icon}</span>
              <span class="mdc-tab__text-label">${commonTask.name}</span>
            </span>
            <span class="mdc-tab-indicator">
              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
            </span>
            <span class="mdc-tab__ripple"></span>
          </button>`
          }).join("")}
          ${reportTabs.map(function(report){
              return `
              ${report.count ? `<button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
              <span class="mdc-tab__content">
                <span class="mdc-tab__icon material-icons" aria-hidden="true">${report.icon}</span>
                <span class="mdc-tab__text-label">${report.name}</span>
              </span>
              <span class="mdc-tab-indicator">
                <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
              </span>
              <span class="mdc-tab__ripple"></span>
            </button>` :''}
              `
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