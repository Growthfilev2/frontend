function attendenceView(sectionContent) {
  sectionContent.innerHTML = attendanceDom();
  sectionContent.dataset.view = 'attendence'
  
  getReportSubs('attendance').then(function (subs) {
    console.log(subs)
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
      body: {
        stack: error.stack || '',
      }
    })
  })

  getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees').then(function (myCreds) {
    console.log(myCreds);
    const officeEmployee = {}
    myCreds.forEach(function(cred) {
      officeEmployee[cred.office] = cred;
    })
    createAttendanceCard(officeEmployee)
  }).catch(function(error){
    createAttendanceCard();
  })

  
}


function createAttendanceCard(employeeRecord) {
  getMonthlyData().then(function (monthlyData) {
   
    document.getElementById('start-load').classList.add('hidden')

    let monthlyString = ''
    let month;
    [{   
      date: 5,
      month: 9,
      year: 2019,
      office: "Puja Capital",
      officeId: "asdasd",
      onLeave: false,
      onAr: false, 
      onHoliday: true, 
      weeklyOff: false, 
      attendance: 0,
      addendum:[{
          addendumId: "asdasd",
          latitude: "28.123",
          longitude: "77.123",
          timestamp: 1571660508914,
          comment: "asjdpoasjpodjasd"
      },
      {
        addendumId: "asdasd",
        latitude: "28.123",
        longitude: "77.123",
        timestamp: 1571660521701,
        comment: "asjdpoasjpodjasd"
    },
    {
      addendumId: "asdasd",
      latitude: "28.123",
      longitude: "77.123",
      timestamp: Date.now(),
      comment: "asjdpoasjpodjasd"
  }

    ]
  }].forEach(function (record) {
      if (month !== record.month) {
        monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`
      }
      month = record.month;
      monthlyString += attendaceCard(record,employeeRecord);
    });
    
    const el = document.querySelector('.monthly-stat');
    if (!el) return;
    el.innerHTML = monthlyString;
    [].map.call(document.querySelectorAll('.attendance-card'),function(el){
      if(el) {
        const icon = el.querySelector('.dropdown i')
        icon.addEventListener('click',function(){
          const detailContainer =  el.querySelector('.attendace-detail-container')
          if(detailContainer.classList.contains('hidden')) {
            icon.textContent = 'keyboard_arrow_up'
            detailContainer.classList.remove('hidden')
          }
          else {
            icon.textContent = 'keyboard_arrow_down'
            detailContainer.classList.add('hidden')
          }
        })        
      }
    });

    [].map.call(document.querySelectorAll('.status-button'), function (el) {
      el.addEventListener('click', checkStatusSubscription)
    });
   
  }).catch(function (error) {
    console.log(error)
    document.getElementById('start-load').classList.add('hidden')
    handleError({
      message: error.message,
      body: {
        stack: error.stack || '',
      }
    })
  })
}

function attendaceCard(data,employeeRecord) {
  return `<div class='mdc-card mdc-card--outlined attendance-card'>
      <div class='mdc-card__primary-action'>
        <div class="demo-card__primary">
          <div class="month-date-cont">
            <div class="day">${cardDate(data)}</div>
            <div class="date">${data.date}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography ${data.attendance < 1 ? 'mdc-theme--error' :'mdc-theme--success'}">Attendance : ${data.attendance}</span>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${data.office}</h3>
          </div>
          <div class="dropdown-container dropdown">
            <i class="material-icons">keyboard_arrow_down</i>
            <div class='mdc-typography--subtitle2 mdc-theme--primary'>${attendanceStatusType(data)}</div>
          </div>
        </div>
        <div class='attendace-detail-container hidden'>
        <div class='text-container'>
          ${data.addendum.length ? `
          <div class='detail count'>
            Count : ${data.addendum.length} ${Object.keys(employeeRecord).length && employeeRecord[data.office]['Minimum Daily Activity Count'].value ? `/ ${employeeRecord[data.office]['Minimum Daily Activity Count'].value}` :''}
          </div>
          <div class='detail working-hour'>
            ${calculateWorkedHours(data.addendum) ?`Working hours : ${calculateWorkedHours(data.addendum)} ${Object.keys(employeeRecord).length && employeeRecord[data.office]['Minimum Working Hours'].value ? `/ ${employeeRecord[data.office]['Minimum Working Hours'].value}` :''}` :''}
            ` :''}
          </div>
        </div>
         <div class='time-container'>
          ${data.addendum.map(ad => {
              return `<a class='time addendum-value mdc-typography--headline6 mdc-theme--primary' href='geo:${ad.latitude},${ad.longitude}?q=${ad.latitude},${ad.longitude}'>
                  ${getAttendanceTime(ad)}
                  <div class='mdc-typography--caption'>Check-in</div>
              </a>`
          }).join("")}
         </div>         
        </div>
      </div>
      ${data.attendance == 1 ? '' :`<div class="mdc-card__actions ${data.attendance > 0 && data.attendance < 1 ? 'mdc-card__actions--full-bleed' :''}">
      ${attendaceButtons(data)}
</div>`}
      
  </div>`
}



function getAttendanceTime(addendum) {
  return moment(addendum.timestamp).format('HH:MM A')
}

function calculateWorkedHours(addendums) {
  const length = addendums.length
  if(!length || length == 1) return ''
  return new Date(addendums[length -1].timestamp).getHours() - new Date(addendums[0].timestamp).getHours();
}

function attendanceStatusType(data) {
if(data.onLeave) {
  return 'You were on leave'
}
if(data.onAr) {
  return 'You applied for AR'
}
if(data.onHoliday) {
  return 'Holiday'
}
if(data.weeklyOff) {
  return 'Weekly off'
}
}

function attendanceDom() {
  return `<div class='attendance-section'>
  
  <div class='mdc-layout-grid__inner'>
  <div class='list-container mdc-layout-grid__cell--span-12'>
    <ul class='mdc-list subscription-list' id='suggested-list'></ul>
  </div>
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
        if(!cursor.value.creator) {
          cursor.continue();
          return;
        }
        
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
    <div class='mdc-card mdc-layout-grid__cell report-cards' data-today-id='${activity.activityId}'>
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

function attendaceButtons(attendaceObject) {
  if (attendaceObject.attendance == 1) return ``;

  if (attendaceObject.attendance == 0) {
    return `
    <button class='mdc-button mdc-card__action mdc-card__action--button status-button' data-template="leave" data-office="${attendaceObject.office}"  data-date="${attendaceObject.year}/${attendaceObject.month + 1}/${attendaceObject.date}">
      Apply Leave
    </button>
    <button class='mdc-button mdc-card__action mdc-card__action--button status-button mdc-button--raised' data-template="attendance regularization" data-office="${attendaceObject.office}"  data-date="${attendaceObject.year}/${attendaceObject.month + 1}/${attendaceObject.date}">
    Apply AR
  </button>
    `
    
  }
  if (attendaceObject.attendance > 0 && attendaceObject.attendance < 1) {

    return `<button class="mdc-button mdc-card__action mdc-card__action--button full-bleed--action">
    <span class="mdc-button__label">Apply AR</span>
    <i class="material-icons" aria-hidden="true">arrow_forward</i>
  </button>`
  }
}


function cardDate(value) {
  return moment(`${value.date}-${value.month + 1}-${value.year}`, 'DD-MM-YYYY').format('ddd')
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

    const tx = db.transaction('attendance');

    const result = []
    tx.objectStore('attendance')
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
        if (!cursor.value.hasOwnProperty('attendance')) {
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
  const tx = db.transaction('subscriptions', 'readwrite');
  const fetch = tx
    .objectStore('subscriptions')
    .index('officeTemplate')
    .openCursor(IDBKeyRange.only([dataset.office, dataset.template]));
  let subscription;
  fetch.onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) return;
    if (cursor.value.status === 'CANCELLED') {
      cursor.delete()
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