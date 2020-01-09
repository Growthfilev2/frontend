function attendanceView(yesterdayAttendanceRecord) {
  const sectionContent = document.querySelector('.tabs-section .data-container');

  if (!sectionContent) return;
  sectionContent.innerHTML = attendanceDom();

  const el = document.getElementById('attendance-view')
  getReportSubscriptions('attendance').then(function (subs) {
    if (!subs.length) return;
    if (!el) return
    el.appendChild(createTemplateButton(subs))
  })
  getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees').then(function (myCreds) {
    const officeEmployee = {}
    myCreds.forEach(function (cred) {
      officeEmployee[cred.office] = cred;
    });
    createAttendanceCard(officeEmployee, yesterdayAttendanceRecord)
  }).catch(function (error) {
    createAttendanceCard();
  });
}


function createAttendanceCard(employeeRecord, yesterdayAttendanceRecord) {
  getMonthlyData().then(function (monthlyData) {
    const parent = document.getElementById('attendance-cards');
    if (!monthlyData.length) {
      if (parent) {
        parent.innerHTML = `<h5 class='mdc-typography--headline5 mdc-layout-grid__cell--span-12 text-center'>No Attendance Found</h5>`
      }
      return;
    }


    let monthlyString = ''
    let month;
    monthlyData.forEach(function (record) {
      if (month !== record.month) {
        monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`
      }
      month = record.month;
      monthlyString += attendaceCard(record, employeeRecord);
    });

    if (!parent) return;
    parent.innerHTML = monthlyString;
    toggleReportCard('.attendance-card');
    if (yesterdayAttendanceRecord) {
      document.querySelector(`[data-id="${yesterdayAttendanceRecord.id}"]`).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      })
    }
    [].map.call(document.querySelectorAll('.status-button'), function (el) {

      el.addEventListener('click', checkStatusSubscription)
    });

  }).catch(function (error) {
    console.log(error)

    handleError({
      message: error.message,
      body: {
        stack: error.stack || '',
      }
    })
  })
}



function attendaceCard(data, employeeRecord) {

  return `<div data-id="${data.id}" class='mdc-card report-card mdc-card--outlined attendance-card mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-8-tablet '>
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
        <div class='text-container pt-10 pb-10 mdc-typography--body1'>
          ${data.addendum.length ? `
            <div class='detail count'>
              ${getMinimumDalyCount(data,employeeRecord)}
            </div>
            <div class='detail working-hour'>
              ${getWorkingHoursText(data,employeeRecord)}
            </div>
          ` :'No Activities Found'}
        </div>
      <div class='time-container'>
          ${data.addendum.map(ad => {
              return ` <a class='time addendum-value mdc-typography--headline6 ${ad.latitude && ad.longitude ? 'mdc-theme--primary' :''}' ${ad.latitude && ad.longitude ? `href='geo:${ad.latitude},${ad.longitude}?q=${ad.latitude},${ad.longitude}'` : ''}>
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

function getMinimumDalyCount(data, employeeRecord) {

  const offices = Object.keys(employeeRecord);
  if (!offices.length) {
    return ` Count :  ${data.addendum.length}`
  }
  if (!employeeRecord[data.office]) {
    return ` Count : ${data.addendum.length}`
  }
  if (!employeeRecord[data.office].attachment.hasOwnProperty('Minimum Daily Activity Count')) return ` Count : ${data.addendum.length}`;
  if (!employeeRecord[data.office].attachment['Minimum Daily Activity Count'].value) {
    return ` Count : ${data.addendum.length}`
  }
  return `  Count :  ${data.addendum.length} / ${employeeRecord[data.office].attachment['Minimum Daily Activity Count'].value}`
}

function getWorkingHoursText(data, employeeRecord) {
  const hours = calculateWorkedHours(data.addendum);
  if (!hours) return '';
  const offices = Object.keys(employeeRecord);
  if (!offices.length) return ` Working hours :  ${hours}`;
  if (!employeeRecord[data.office]) return ` Working hours :  ${hours}`;
  if (!employeeRecord[data.office].attachment.hasOwnProperty('Minimum Working Hours')) return ` Working hours :  ${hours}`;
  if (!employeeRecord[data.office].attachment['Minimum Working Hours'].value) return ` Working hours :  ${hours}`;
  return ` Working hours :  ${hours} / ${employeeRecord[data.office].attachment['Minimum Working Hours'].value} `
}


function getAttendanceTime(addendum) {

  return moment(addendum.timestamp).format('hh:mm A')
}

function calculateWorkedHours(addendums) {
  const length = addendums.length
  if (!length || length == 1) return ''
  var hours = Math.abs(addendums[length - 1].timestamp - addendums[0].timestamp) / 3600000;

  if (!hours) return '';
  return Number(hours.toFixed(2))

}

function attendanceStatusType(data) {
  if (data.onLeave) {
    return 'On leave'
  }
  if (data.onAr) {
    return 'On AR'
  }
  if (data.holiday) {
    return 'Holiday'
  }
  if (data.weeklyOff) {
    return 'Weekly off'
  }
  if (data.isLate) {
    return 'Late'
  }
  return ''
}

function attendanceDom() {
  return `<div class='attendance-section report-view' id='attendance-view'>
    <div class='monthly-stat  mdc-layout-grid__inner' id='attendance-cards'></div>
  </div>`
}

function isAttendaceCardToday(attendaceObject) {
  const date = new Date();
  return attendaceObject.date == date.getDate() && attendaceObject.month == date.getMonth() && attendaceObject.year == date.getFullYear();

}

function attendaceButtons(attendaceObject) {
  if (attendaceObject.attendance == 1) return ``;

  if (attendaceObject.attendance == 0) {
    return `
    <button class='mdc-button mdc-card__action mdc-card__action--button status-button' data-template="leave" data-id="${attendaceObject.id}" data-office="${attendaceObject.office}"  data-date="${attendaceObject.year}/${attendaceObject.month + 1}/${attendaceObject.date}" ${attendaceObject.editable ? '' :'disabled'}>
      Apply Leave
    </button>
    <button class='mdc-button mdc-card__action mdc-card__action--button status-button mdc-button--raised' data-id="${attendaceObject.id}" data-template="attendance regularization" data-office="${attendaceObject.office}"  data-date="${attendaceObject.year}/${attendaceObject.month + 1}/${attendaceObject.date}" ${attendaceObject.editable && !isAttendaceCardToday(attendaceObject) ? '' :'disabled'}>
    Apply AR
  </button>
    `

  }
  if (attendaceObject.attendance > 0 && attendaceObject.attendance < 1) {
    return `<button class="mdc-button mdc-card__action mdc-card__action--button full-bleed--action status-button" data-id="${attendaceObject.id}" data-id="${attendaceObject.id}" ${attendaceObject.editable && !isAttendaceCardToday(attendaceObject) ? '' :'disabled'} data-template="attendance regularization" data-office="${attendaceObject.office}"  data-date="${attendaceObject.year}/${attendaceObject.month + 1}/${attendaceObject.date}">
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

        if (!cursor.value.date || !cursor.value.hasOwnProperty('month') || !cursor.value.year) {
          cursor.continue();
          return;
        }
        if(Date.now() < cursor.value.key) {
          cursor.continue();
          return;

        }
      
        if (!cursor.value.hasOwnProperty('attendance')) {
          cursor.continue();
          return;
        };
        if (!cursor.value.addendum) {
          cursor.value.addendum = [];
        }
        if (!cursor.value.hasOwnProperty('addendum')) {
          cursor.value.addendum = [];
        } else {
          cursor.value.addendum.sort(function (a, b) {
            return a.timestamp - b.timestamp
          })
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
  const el = event.target.closest('button');
  const dataset = el.dataset;
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
      snacks(`You don't have ${dataset.template} subscription`);
      return
    }

    history.pushState(['addView'], null, null);
    subscription.date = dataset.date;
    subscription.id = dataset.id
    addView(subscription)

  }

  tx.onerror = function () {
    return reject({
      message: tx.error,
    })
  }
}