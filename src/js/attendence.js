function attendenceView(sectionContent) {
  const subs = {}
  sectionContent.innerHTML = attendanceDom();
  const result = []
  const tx = db.transaction('subscriptions');
  tx.objectStore('subscriptions')
    .index('report')
    .openCursor(IDBKeyRange.only('attendance'))
    .onsuccess = function (event) {
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
      result.push(cursor.value);

      cursor.continue();
    };
  tx.oncomplete = function () {
    const suggestionListEl = document.getElementById('suggested-list');
    if (suggestionListEl) {
      suggestionListEl.innerHTML = templateList(result)
      const suggestionListInit = new mdc.list.MDCList(suggestionListEl)
      handleTemplateListClick(suggestionListInit)
    };

    createTodayStat();
    createMonthlyStat()

  }
  tx.onerror = function () {
    handleError({
      message: `${tx.error} from attendanceView`,
      body: ''
    })
  }
}

function attendanceDom() {
  return `<div class='attendance-section'>
  
  
  <div class='mdc-layout-grid__inner'>
  <div class='list-container mdc-layout-grid__cell--span-12'>
    <ul class='mdc-list subscription-list' id='suggested-list'></ul>
  </div>
  </div>
  <div class='today-stat mdc-layout-grid__inner'>
  
  </div>
  <div class='monthly-stat'>
  
  </div>
  
  </div>`
}

function createTodayStat() {
  const startOfTodayTimestamp = moment().startOf('day').valueOf()

  const currentTimestamp = moment().valueOf();

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
  if (statusObject.statusForDay == 0) {
    return `
    <button class='mdc-button mdc-theme--primary-bg status-button mdc-theme--on-primary' data-template="attendance regularization" data-office="${statusObject.office}"  data-date="${statusObject.year}/${statusObject.month + 1}/${statusObject.date}">
      Apply AR
    </button>
    <button class='mdc-button mdc-theme--primary-bg status-button mdc-theme--on-primary' data-template="leave" data-office="${statusObject.office}"  data-date="${statusObject.year}/${statusObject.month + 1}/${statusObject.date}">
      Apply Leave
    </button>
      <p class='mdc-theme--error sfd mt-0 mb-0'>Status For Day : ${statusObject.statusForDay}</p>`

  }
  if (statusObject.statusForDay > 0 || statusObject.statusForDay < 1) {
    return `
    <button class='mdc-button mdc-theme--primary-bg status-button mdc-theme--on-primary' data-template="attendance regularization" data-office="${statusObject.office}"  data-date="${statusObject.year}/${statusObject.month + 1}/${statusObject.date}">
      Apply AR
    </button>
      <p class='mdc-theme--error sfd mt-0 mb-0'>Status For Day : ${statusObject.statusForDay}</p>`
  }
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

function createMonthlyStat() {
  const tx = db.transaction('reports');
  let monthlyString = ''
  let month;

  tx.objectStore('reports')
    .index('month')
    .openCursor(null, 'prev')
    .onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      const recordTimestamp = moment(`${cursor.value.date}-${cursor.value.month +1}-${cursor.value.year}`, 'DD-MM-YYYY').valueOf()

      if (recordTimestamp > moment().valueOf()) {
        cursor.continue();
        return;
      }

      if (!cursor.value.hasOwnProperty('statusForDay')) {
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
    [].map.call(document.querySelectorAll('.status-button'), function (el) {
      el.addEventListener('click', checkStatusSubscription)
    });

    if (!monthlyString) {
      try {
        getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees').then(function (employeeDetails) {

          const employeeOffices = []
          employeeDetails.forEach(function (record) {
            if (record.status !== 'CANCELLED') {
              return employeeOffices.push(record.office)
            }
          });
          if (!employeeOffices.length) return;
          getCountOfStatusObject().then(function (result) {
            handleError({
              message: 'status object log',
              body: JSON.stringify({
                count: result.count,
                data: result.data,
                employeeStatus: employeeOffices.join(' || ')
              })
            })
          }).catch(handleError)
        })
      } catch (e) {
        handleError({
          message: e.message,
          body: '',
          stack: e.stack
        })
      }
    }
  }
  tx.onerror = function () {
    handleError({
      message: tx.error,
      body: ''
    })
  }
}

function getCountOfStatusObject() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('reports');
    const store = tx.objectStore("reports");
    const body = {
      count: '',
      data: ''
    }
    const countReq = store.count()

    countReq.onsuccess = function (event) {
      body.count = event.target.result
    }
    store.getAll().onsuccess = function (event) {
      body.data = event.target.result
    }
    tx.oncomplete = function () {
      return resolve(body);
    }
    tx.onerror = function () {
      return reject({
        message: tx.error,
        body: ''
      })
    }
    countReq.onerror = function () {
      return reject({
        message: countReq.error,
        body: ''
      })
    }
  })
}

function checkStatusSubscription(event) {

  console.log(event)
  const el = event.target;
  const dataset = el.dataset;
  console.log(dataset)
  const tx = db.transaction('subscriptions');
  const fetch = tx
    .objectStore('subscriptions')
    .index('officeTemplate')
    .openCursor(IDBKeyRange.only([dataset.office, dataset.template]));
  let subscription;
  fetch.onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) return;
    if (cursor.value.status === 'CANCELLED') {
      cursor.continue();
      return;
    }
    subscription = cursor.value;
    cursor.continue();
  }
  fetch.onerror = function () {
    handleError({
      message: fetch.error,
      body: ''
    })
  }
  tx.oncomplete = function () {
    if (!subscription) {
      snacks(`You Don't Have ${formatTextToTitleCase(dataset.template)} Subscription`);
      return
    }
    history.pushState(['addView'], null, null);
    subscription.date = dataset.date;
    addView(subscription)
  }
  tx.onerror = function () {
    handleError({
      message: tx.error,
      body: ''
    })
  }
}