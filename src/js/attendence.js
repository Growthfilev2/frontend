function attendenceView(sectionContent) {

  Promise.all([getSubscription(ApplicationState.office, 'leave'), getSubscription(ApplicationState.office, 'attendance regularization')]).then(function (result) {
    console.log(result);
    const leaveSub = result[0];
    const arSub = result[1];
    if (leaveSub.length) {
      sectionContent.innerHTML = attendanceDom(leaveSub);
      const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
      handleTemplateListClick(listInit)
    }
    createTodayStat();
    if (!arSub.length) return;

    createMonthlyStat(arSub[0]);
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
  <div class='monthly-stat'>
  
  </div>
  </div>
  </div>`
}

function createTodayStat() {
  const startOfTodayTimestamp = moment().startOf('day').valueOf()
  console.log(startOfTodayTimestamp)
  const currentTimestamp = moment().valueOf();
  console.log(currentTimestamp)
  const myNumber = firebase.auth().currentUser.phoneNumber;
  let todayCardString = '';
  const result = []

  const activityTx = db.transaction('activity')
  activityTx.objectStore('activity')
    .index('timestamp')
    .openCursor(IDBKeyRange.lowerBound(startOfTodayTimestamp), 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.creator.phoneNumber !== myNumber) {
        cursor.continue();
        return;
      }
      result.push(cursor.value);
      cursor.continue();
    }
  activityTx.oncomplete = function () {
    console.log(result);
    const addendumTx = db.transaction('addendum');

    result.forEach(function (activity) {
      addendumTx
        .objectStore('addendum')
        .index('activityId')
        .get(activity.activityId).onsuccess = function (event) {
          const result = event.target.result;


          todayCardString += todayStatCard(result, activity);
        }
    })
    addendumTx.oncomplete = function () {
      if (todayCardString) {

        document.querySelector('.today-stat').innerHTML =
          `<div class="hr-sect  mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12">Today</div>
          ${todayCardString}
          `
      }
    }
  }
}



function todayStatCard(addendum, activity) {
  return `
    <div class='mdc-card mdc-layout-grid__cell report-cards'>
      <div class="mdc-card__primary-action">
        <div class="demo-card__primary">
        <div class='card-heading-container'>
        <h2 class="demo-card__title mdc-typography mdc-typography--headline6">${activity.activityName}</h2>
       ${addendum ?`   <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0">${addendum.comment}</h3>` :'' }
     
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

function renderArCard(statusObject) {
  if (statusObject.statusForDay == 1) {
    return `<p class='present sfd mt-0 mb-0'>Status For Day : ${statusObject.statusForDay}</p>`
  }
  if (statusObject.onAr) {
    return `<p class='sfd mt-0 mb-0 mdc-theme--primary'>Applied for AR</p>`
  }
  return `<button class='mdc-button mdc-theme--primary-bg ar-button' data-date="${statusObject.year}-${statusObject.month + 1}-${statusObject.date}">
  <span class="mdc-button__label mdc-theme--on-primary">Apply AR</span>
</button>
<p class='mdc-theme--error sfd mt-0 mb-0'>Status For Day : ${statusObject.statusForDay}</p>`
}

function monthlyStatCard(value) {

  const day = moment(`${value.date}-${value.month + 1}-${value.year}`, 'DD-MM-YYYY').format('ddd')
  return `
    <div class="month-container mdc-elevation--z2">
      <div class="month-date-cont">
        <span class='day'>${day}</span>
        <p class='date'>${value.date}</p>
       
      </div>
      <div class='btn-container'>
        ${renderArCard(value)}
      </div>
  </div>
    `
}

function createMonthlyStat(arSub) {
  const copy = JSON.parse(JSON.stringify(arSub));
  const tx = db.transaction('reports');
  const today = Number(`${new Date().getMonth()}${new Date().getDate()}${new Date().getFullYear()}`)
  let monthlyString = ''
  let month;

  tx.objectStore('reports')
    .index('month')
    .openCursor(null, 'prev')
    .onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.joinedDate === today) {
        cursor.continue();
        return;
      }
      if (month !== cursor.value.month) {
        monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5">${moment(`${cursor.value.month + 1}-${cursor.value.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`
      }
      month = cursor.value.month;

      monthlyString += monthlyStatCard(cursor.value);

      cursor.continue();
    }
  tx.oncomplete = function () {
    document.querySelector('.monthly-stat').innerHTML = monthlyString;
    [].map.call(document.querySelectorAll('.ar-button'), function (el) {
      const ripple = new mdc.ripple.MDCRipple(el);
      el.addEventListener('click', function () {

        copy.date = el.dataset.date
        history.pushState(['addView'], null, null);
        addView(copy)
      })
    })
  }
}