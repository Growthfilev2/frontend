function expenseView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'
    const el = document.getElementById('reim-view')
    getSubscription('', 'claim').then(function (subs) {
        if (!subs.length) return;
        if(!el) return
        el.appendChild(createTemplateButton(subs))
    }).catch(function (error) {
        console.log(error)
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
                error: error
            }
        })
    })
    
    getReimMonthlyData().then(function (reimbursementData) {
        console.log(reimbursementData)
        const parent = document.getElementById('reimbursement-cards')
        const keys = Object.keys(reimbursementData);
        if (!keys.length) {
            if(parent) {
                parent.innerHTML = `<h5 class='mdc-typography--headline5 mdc-layout-grid__cell--span-12 text-center'>No Reimbursement Found</h5>`
            }
            return;
        }

        let month = monthlyString = '';
        keys.forEach(function (key) {
            const timestamp = Number(key)
            if (month !== new Date(timestamp).getMonth()) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${new Date(timestamp).getMonth() + 1}-${new Date(timestamp).getFullYear()}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = new Date(timestamp).getMonth();
            const offices = Object.keys(reimbursementData[key]);
            offices.forEach(function (office) {
                monthlyString += reimbursementCard(timestamp, office, reimbursementData);
            })
        });
        if (!parent) return
        parent.innerHTML = monthlyString;
        toggleReportCard('.reim-card');

        [].map.call(document.querySelectorAll(`[data-claim-id]`), function (el) {
            el.addEventListener('click', function () {
                const id = el.dataset.claimId;
                db.transaction('activity').objectStore('activity').get(id).onsuccess = function (event) {
                    const activity = event.target.result;
                    if (activity) {
                        const heading = createActivityHeading(activity)
                        showViewDialog(heading, activity, 'view-form');
                    }
                }
            })
        });
    }).catch(function (error) {
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
            }
        })
    })
}


function reimbursementCard(timestamp, office, data) {
    return `<div class='mdc-card report-card mdc-card--outlined reim-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
    <div class='mdc-card__primary-action'>
      <div class="demo-card__primary">
      <div class='left'>
          <div class="month-date-cont">
            <div class="day">${cardDate({
                date:new Date(timestamp).getDate(),
                month:new Date(timestamp).getMonth(),
                year:new Date(timestamp).getFullYear()
            })}</div>
            <div class="date">${new Date(timestamp).getDate()}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography">${calculateTotalReim(data[timestamp][office])}</span>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${office}</h3>
          </div>
      </div>
      <div class='right'>
        <div class="dropdown-container dropdown">
          <i class="material-icons">keyboard_arrow_down</i>
        </div>
      </div>
      </div>
      <div class='detail-container hidden'>
      <div class='text-container'></div>
      <div class='amount-container'>
        ${data[timestamp][office].map(function(value){
            return `
                <div class='amount mdc-typography--headline6 ${value.details.status === 'CANCELLED' ? 'mdc-theme--error' : value.details.status === 'CONFIRMED' ? 'mdc-theme--success' : ''}' ${value.details.claimId ? `data-claim-id="${value.details.claimId}"` :''}>
                    ${value.reimbursementType === 'km allowance' ? kmAllowanceDetail(value) : claimDetail(value)}
                </div>
                `
        }).join("")}
        </div>
      </div>
      </div>
    </div>
</div>`

}

function claimDetail(value){
    return `<div class='mdc-typography--caption'>${value.reimbursementType || ''}</div>
    ${value.details.status === 'CANCELLED' ? 0 : convertAmountToCurrency(value.amount,value.currency) || ''}
    <div class='mdc-typography--caption'>${value.details.status || ''}</div>
    <div class='mdc-typography--subtitle2'>${value.reimbursementName || ''}</div>`
}
function kmAllowanceDetail(value) {
    return `
    <a style='text-decoration: none;' href='https://www.google.com/maps/dir/?api=1&origin=${value.details.startLocation.latitude}%2C${value.details.startLocation.longitude}&destination=${value.details.endLocation.latitude}%2C${value.details.endLocation.longitude}'>
        <div class='mdc-typography--caption'>${value.reimbursementType || ''}</div>
        ${value.details.status === 'CANCELLED' ? 0 : convertAmountToCurrency(value.amount,value.currency) || ''}
        <div class='mdc-typography--caption'>${value.details.rate ? convertAmountToCurrency(Number(value.details.rate),value.currency) : ''}</div>
        <div class='mdc-typography--subtitle2'>${value.details.distanceTravelled + ' KM' || ''}</div>
    </a>
    `
}
function calculateTotalReim(data) {
    let total = 0;
    let currency = ''

    data.forEach(function (value) {

        if (value.details.status !== 'CANCELLED') {
            total += Number(value.amount)
            currency = value.currency
        }
    })
    return convertAmountToCurrency(total, currency)
}



function convertAmountToCurrency(amount, currency) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR'
    }).format(amount)
}

function reimDom() {
    return `<div class='reim-section' id='reim-view'>
        <div id='reimbursement-cards' class='mdc-layout-grid__inner'></div>
    `
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reimbursement')
        const index = tx.objectStore('reimbursement').index('key')
        const dateObject = {}
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            const officeObject = {}
            if (!dateObject[cursor.value.key]) {
                officeObject[cursor.value.office] = [cursor.value]
                dateObject[cursor.value.key] = officeObject;
                cursor.continue();
                return
            }

            if (dateObject[cursor.value.key][cursor.value.office]) {
                dateObject[cursor.value.key][cursor.value.office].push(cursor.value)
            } else {
                dateObject[cursor.value.key][cursor.value.office] = [cursor.value]
            };

            cursor.continue();
        }
        tx.oncomplete = function () {
            try {
                Object.keys(dateObject).forEach(function(timestamp){
                    Object.keys(dateObject[timestamp]).forEach(function(office){
                        dateObject[timestamp][office].sort(function(a,b){
                            return b.timestamp - a.timestamp
                        })
                    })
                });
            }catch(e){
                console.log(e)
            }

            console.log(dateObject)
            return resolve(dateObject)
        }
        tx.onerror = function () {
            return reject(tx.error)
        }
    })
}