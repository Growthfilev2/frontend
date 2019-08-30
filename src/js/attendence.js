function attendenceView(sectionContent) {
  sectionContent.innerHTML = attendanceDom();
  sectionContent.dataset.view = 'attendence'

  getAttendenceSubs().then(function (subs) {
    document.getElementById('start-load').classList.add('hidden')

    const suggestionListEl = document.getElementById('suggested-list');
    if (!suggestionListEl) return
    suggestionListEl.innerHTML = templateList(subs)
    const suggestionListInit = new mdc.list.MDCList(suggestionListEl)
    handleTemplateListClick(suggestionListInit)
  }).catch(function (error) {
    document.getElementById('start-load').classList.add('hidden')

    handleError({
      message: error.message,
      body: '',
      stack: error.stack || ''
    })
  });

  getTodayStatData().then(function (todayString) {
    document.getElementById('start-load').classList.add('hidden')

    if (!todayString) return;
    const el = document.querySelector('.today-stat');
    if (!el) return;
    el.innerHTML =
      `<div class="hr-sect  mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12">Today</div>
    ${todayString}
    `
  }).catch(function (error) {
    document.getElementById('start-load').classList.add('hidden')

    handleError({
      message: error.message,
      body: '',
      stack: error.stack || ''
    })
  });



  getMonthlyData().then(function (monthlyData) {
    document.getElementById('start-load').classList.add('hidden')

    let monthlyString = ''
    let month;
    monthlyData.forEach(function (record) {
      if (month !== record.month) {
        monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`
      }
      month = record.month;
      monthlyString += monthlyStatCard(record);
    })
    const el = document.querySelector('.monthly-stat');
    if (!el) return;
    el.innerHTML = monthlyString;
    [].map.call(document.querySelectorAll('.status-button'), function (el) {
      el.addEventListener('click', checkStatusSubscription)
    });
  }).catch(function (error) {
    document.getElementById('start-load').classList.add('hidden')
    handleError({
      message: error.message,
      body: '',
      stack: error.stack || ''
    })
  })

}

function getAttendenceSubs() {
  return new Promise(function (resolve, reject) {
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
      return resolve(result)
    }
    tx.onerror = function () {
      return reject({
        message: tx.error,
      })
    }
  })
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



function getTodayStatData() {
  return new Promise(function (resolve, reject) {


    const startOfTodayTimestamp = moment().startOf('day').valueOf()

    const myNumber = firebase.auth().currentUser.phoneNumber;
    let todayCardString = '';
    const result = [];


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
            if (!result) return;
            todayCardString += todayStatCard(result, activity);
          }
      })
      addendumTx.oncomplete = function () {
        return resolve(todayCardString);
      }
      addendumTx.onerror = function () {
        return reject({
          message: addendumTx.error
        })
      }
    }
    activityTx.onerror = function () {
      return reject({
        message: activityTx.error
      })
    }
  })
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
  if (statusObject.statusForDay > 0 && statusObject.statusForDay < 1) {
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

function getMonthlyData() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction('reports');

    const result = []
    tx.objectStore('reports')
      .index('month')
      .openCursor(null, 'prev')
      .onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.date || !cursor.value.month || !cursor.value.year) {
          cursor.continue();
          return;
        }
        const recordDate = `${cursor.value.year}-${cursor.value.month +1}-${cursor.value.date}`
        const today = moment().format('YYYY-MM-DD')
        if (moment(today, 'YYYY-MM-DD').isSameOrBefore(moment(recordDate, 'YYYY-MM-DD'))) {
          cursor.continue();
          return;
        }
        if (!cursor.value.statusForDay) {
          cursor.continue();
          return;
        }
        result.push(cursor.value)
        cursor.continue();
      }
    tx.oncomplete = function () {
      return resolve(result);
    }
    tx.onerror = function () {
      return reject({
        message: tx.error
      })
    }
  })
}


function checkStatusSubscription(event) {

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
    return reject({
      message: fetch.error
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
    return reject({
      message: tx.error,
    })
  }
}