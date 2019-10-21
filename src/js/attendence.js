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
    myCreds.forEach(function (cred) {
      officeEmployee[cred.office] = cred;
    });
    createAttendanceCard(officeEmployee)
  }).catch(function (error) {
    createAttendanceCard();
  });

}


function createAttendanceCard(employeeRecord) {
  getMonthlyData().then(function (monthlyData) {
    const parent = document.getElementById('attendance');
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
      onAr: true,
      onHoliday: false,
      weeklyOff: false,
      attendance: 0,
      addendum: [{
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
        monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`
      }
      month = record.month;
      monthlyString += attendaceCard(record, employeeRecord);
    });

    if (!parent) return;
    parent.innerHTML = monthlyString;
    toggleReportCard('.attendance-card');

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

function attendaceCard(data, employeeRecord) {
  return `<div class='mdc-card mdc-card--outlined attendance-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
      <div class='mdc-card__primary-action'>
        <div class="demo-card__primary">
        <div class='left'>
            <div class="month-date-cont">
              <div class="day">${cardDate(data)}</div>
              <div class="date">${data.date}</div>
            </div>
            <div class="heading-container">
              <span class="demo-card__title mdc-typography ${data.attendance < 1 ? 'mdc-theme--error' :'mdc-theme--success'}">Attendance : ${data.attendance}</span>
              <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${data.office}</h3>
            </div>
        </div>
        <div class='right'>
          <div class="dropdown-container dropdown">
            <i class="material-icons">keyboard_arrow_down</i>
            <div class='mdc-typography--subtitle2 mdc-theme--primary'>${attendanceStatusType(data)}</div>
          </div>
        </div>
        </div>
        <div class='detail-container hidden'>
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
      </div>`
    }
  </div>`
}



function getAttendanceTime(addendum) {
  return moment(addendum.timestamp).format('HH:MM A')
}

function calculateWorkedHours(addendums) {
  const length = addendums.length
  if (!length || length == 1) return ''
  const duration = moment.duration(moment(new Date(addendums[length - 1].timestamp), 'DD/MM/YYYY HH:mm').diff(moment(new Date(addendums[0].timestamp), 'DD/MM/YYYY HH:mm'))).asHours()
  console.log(duration)
  return Number(duration).toFixed(1)

}

function attendanceStatusType(data) {
  if (data.onLeave) {
    return 'Applied for leave'
  }
  if (data.onAr) {
    return 'Applied for AR'
  }
  if (data.onHoliday) {
    return 'Holiday'
  }
  if (data.weeklyOff) {
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
  <div class='monthly-stat' id='attendance'></div>
  </div>`
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

    return `<button class="mdc-button mdc-card__action mdc-card__action--button full-bleed--action status-button">
    <span class="mdc-button__label">Apply AR</span>
    <i class="material-icons" aria-hidden="true">arrow_forward</i>
  </button>`
  }
}


function cardDate(value) {
  return moment(`${value.date}-${value.month + 1}-${value.year}`, 'DD-MM-YYYY').format('ddd')
}


function getMonthlyData() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction('attendance');

    const result = []
    tx.objectStore('attendance')
      .index('key')
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