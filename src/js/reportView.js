function reportView() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>
  <span class="mdc-top-app-bar__title">My Reports</span>
  `
  const header = getHeader('app-header', backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `
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
      attendenceView(sectionContent);
      return;
    }
    if (evt.detail.index == 1) return expenseView(sectionContent)
    incentiveView(sectionContent)
  })

  tabList.activateTab(0)
}


function incentiveView(sectionContent) {
  sectionContent.dataset.view = 'incentive'
  getReportSubs('incentive').then(function (subs) {
    if (!subs.length) {
      sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Are Not Eligible For Incentives</h3>'
      return;
    }
    sectionContent.innerHTML = templateList(subs);
    const el = document.getElementById('suggested-list')
    if(el) return;
    const listInit = new mdc.list.MDCList(el)
    handleTemplateListClick(listInit)
  })
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

          <span class="mdc-tab__text-label">Incentives</span>
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
    tx.objectStore('subscriptions')
      .index('report')
      .openCursor(IDBKeyRange.only(reportName)).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return
        if (cursor.value.status === 'CANCELLED') {
          cursor.delete()
          cursor.continue();
          return;
        }
        if (reportName === 'attendance' && cursor.value.template === 'attendance regularization') {
          cursor.continue();
          return;
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