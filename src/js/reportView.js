function reportView() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  const header = getHeader('app-header', backIcon, '');

  document.getElementById('tabs').innerHTML = showTabs()
  const tabList = new mdc.tabBar.MDCTabBar(document.querySelector('#tabs .mdc-tab-bar'))
  setTimeout(function () {
    tabList.activateTab(0);
  }, 0)

  tabList.listen('MDCTabBar:activated', function (evt) {
    document.getElementById('app-current-panel').innerHTML = `<div class='tabs-section pt-20 mdc-top-app-bar--fixed-adjust-with-tabs'>
    <div class='content'>
     
    </div>
    </div>`
    const sectionContent = document.querySelector('.tabs-section .content');
    if (!evt.detail.index) {
      getSubscription(ApplicationState.office, 'leave').then(function (result) {
        console.log(result);
        sectionContent.innerHTML = attendanceDom(result);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)
        createTodayStat();
        createMonthlyStat();
      }).catch(console.log)
      return
    }

    if (evt.detail.index == 1) {
      getSubscription(ApplicationState.office, 'expense claim').then(function (result) {
        if (!result.length) {
          sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Expense Claim</h3>'
          return
        }
        sectionContent.innerHTML = templateList(result);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)
      })
      return;
    };

    const promiseArray = []
    const incentives = ['customer', 'order', 'collection']
    incentives.forEach(function (name) {
      promiseArray.push(getSubscription(ApplicationState.office, name))
    });

    Promise.all(promiseArray).then(function (incentiveSubs) {
      console.log(incentiveSubs);
      const merged = [].concat.apply([], incentiveSubs)
      if (!merged.length) {
        sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You are not eligible for incentives</h3>'
        return
      }
      sectionContent.innerHTML = templateList(merged);
      const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
      handleTemplateListClick(listInit)

    }).catch(console.log)
  })

}

function attendanceDom(leaveSub) {
  return `<div class='attendance-section'>

<div class='data-container mdc-layout-grid'>
<div class='mdc-layout-grid__inner'>
<div class='list-container mdc-layout-grid__cell--span-12'>
  ${templateList(leaveSub)}
</div>
</div>
<div class='today-stat mdc-layout-grid__inner'>

</div>
<div class='monthly-stat mdc-layout-grid__inner'>

</div>
</div>
</div>`
}

function createTodayStat() {
  const startOfTodayTimestamp = moment().startOf('day').valueOf()
  const currentTimestamp = moment().valueOf();
  const myNumber = firebase.auth().currentUser.phoneNumber;
  let todayCardString = '';
  const key = myNumber + myNumber
  const tx = db.transaction('addendum');
  const result = []
  console.log(key)
  tx.objectStore('addendum')
    .index('KeyTimestamp')
    .openCursor(IDBKeyRange.bound([startOfTodayTimestamp, key], [currentTimestamp, key]), 'prev')
    .onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.isComment) {
        cursor.continue();
        return;
      }
      if (cursor.value.key !== key) {
        cursor.continue();
        return;
      }
      result.push(cursor.value);
      cursor.continue();
    };
  tx.oncomplete = function () {
    const activityTx = db.transaction('activity')
    result.forEach(function (addendum) {
      activityTx.objectStore('activity').get(addendum.activityId).onsuccess = function (activityEvent) {
        const activity = activityEvent.target.result;
        if (!activity) return;

        todayCardString += todayStatCard(addendum, activity);
      }
    })
    activityTx.oncomplete = function () {
      document.querySelector('.today-stat').innerHTML =
        `<div class="hr-sect mdc-layout-grid__cell--span-12">Today</div>
      ${todayCardString};
    `
    }
  }
}



function todayStatCard(addendum, activity) {
  return `
  <div class='mdc-card mdc-layout-grid__cell report-cards'>
    <div class="mdc-card__primary-action">
      <div class="demo-card__primary">
      <div class='card-heading-container'>
      <h2 class="demo-card__title mdc-typography mdc-typography--headline5">${addendum.comment}</h2>
      <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0">at ${moment(activity.timestamp).format('hh:mm a')}</h3>
      </div>
      <div class='activity-data'>
      ${activity.venue.length ?`  <ul class='mdc-list mdc-list--two-line'>
      ${viewVenue(activity,false)}
      </ul>` :''}
      ${activity.schedule.length ?`<ul class='mdc-list mdc-list--two-line'>
      ${viewSchedule(activity)}
      </ul>` :''}
  
      </div>
    </div>
  </div>  
</div>
  `
}

function monthlyStatCard(value) {
  `<div class='mdc-card mdc-layout-grid__cell--span-12'>
    <div class="mdc-card__primary-action">
      <div class="demo-card__primary">
      <div class="mdc-list-item__graphic" aria-hidden="true">
      <span>Thu</span>
      <p>12</p>
      </div>
      <ul class="mdc-list demo-list">
      <li class="mdc-list-item mdc-ripple-upgraded" tabindex="0" id="" style="">
      <span class="mdc-list-item__graphic material-icons" aria-hidden="true">wifi</span>
      
      </li>
      Line-item
      </ul>
     
      <div class='card-heading-container'>
      <h2 class="demo-card__title mdc-typography mdc-typography--headline5">${addendum.comment}</h2>
      <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0">at ${moment(activity.timestamp).format('hh:mm a')}</h3>
      </div>

      
    </div>
  </div>  
</div>`
}

function createMonthlyStat() {
  const tx = db.transaction('reports');
  const MAX_STATUS_FOR_DAY_VALUE = 1
  const CURRENT_MONTH = new Date().getMonth();
  const monthlyString = ''
  tx.objectStore('reports')
    .index('statusForDay')
    .openCursor(IDBKeyRange.upperBound(MAX_STATUS_FOR_DAY_VALUE, true))
    .onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.month !== CURRENT_MONTH) {
        cursor.continue();
        return;
      }
      monthlyString += monthlyStatCard(cursor.value);
      console.log(cursor.value)
      cursor.continue();
    }
  tx.oncomplete = function () {
    document.querySelector('.monthly-stat').innerHTML = monthlyStatCard;
  }
}


function showTabs() {

  return `<div class="mdc-tab-bar" role="tablist">
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
            <span class="mdc-tab__content">
              <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">fingerprint</span>
              <span class="mdc-tab__text-label mdc-theme--on-primary">Attendence</span>
            </span>
            <span class="mdc-tab-indicator">
              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
            </span>
            <span class="mdc-tab__ripple"></span>
          </button>
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
          <span class="mdc-tab__content">
            <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">assignment</span>
            <span class="mdc-tab__text-label mdc-theme--on-primary">Reimbursement</span>
          </span>
          <span class="mdc-tab-indicator">
            <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
          </span>
          <span class="mdc-tab__ripple"></span>
        </button>
        <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
        <span class="mdc-tab__content">
        <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">payment</span>

          <span class="mdc-tab__text-label mdc-theme--on-primary">Incentives</span>
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