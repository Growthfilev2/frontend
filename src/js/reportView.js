function reportView(attendanceRecord) {
  progressBar.close()
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>
  <span class="mdc-top-app-bar__title">My Reports</span>
  `
  const header = getHeader('app-header', backIcon, '');
  const panel =  document.getElementById('app-current-panel')
  panel.classList.add('mdc-top-app-bar--fixed-adjust', "mdc-layout-grid", 'pl-0', 'pr-0')
  panel.innerHTML = `
  ${showTabs()}
  <div class='tabs-section'>
  <div class='content'>
  <div class='data-container mdc-layout-grid'>
  </div>
  </div>
  </div>`

  const tabList = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'))

  tabList.listen('MDCTabBar:activated', function (evt) {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;

    if (!evt.detail.index) {
      document.getElementById('start-load').classList.remove('hidden')
      attendenceView(sectionContent,attendanceRecord);
      return;
    }
    if (evt.detail.index == 1) return expenseView(sectionContent)
    if (evt.detail.index == 2) return paymentView(sectionContent);


  })

  tabList.activateTab(0)
}






function showTabs() {

  return `<div class="mdc-tab-bar" role="tablist" style='margin-top:5px;'>
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
            <span class="mdc-tab__content">
              <span class="mdc-tab__icon material-icons" aria-hidden="true">fingerprint</span>
              <span class="mdc-tab__text-label">Attendance</span>
            </span>
            <span class="mdc-tab-indicator">
              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
            </span>
            <span class="mdc-tab__ripple"></span>
          </button>
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
          <span class="mdc-tab__content">
            <span class="mdc-tab__icon material-icons" aria-hidden="true">assignment</span>
            <span class="mdc-tab__text-label">Reimbursement</span>
          </span>
          <span class="mdc-tab-indicator">
            <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
          </span>
          <span class="mdc-tab__ripple"></span>
        </button>
        <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
        <span class="mdc-tab__content">
        <span class="mdc-tab__icon material-icons" aria-hidden="true">payment</span>
          <span class="mdc-tab__text-label">Payments</span>
        </span>
        <span class="mdc-tab-indicator">
          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
        </span>
        <span class="mdc-tab__ripple"></span>
      </button>

      
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
  [].map.call(document.querySelectorAll(selector),function(el){
    if (el) {
        const icon = el.querySelector('.dropdown i')
        if(!icon) return;
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
    
    ul.listen('MDCList:action',function(evt){
      history.pushState(['addView'], null, null);
      addView(subs[evt.detail.index])
      dialog.close()
    })
  })
  return button;
}