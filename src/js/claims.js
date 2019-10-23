function expenseView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'

    getReportSubs('reimbursement').then(function (subs) {
        const listEl = document.getElementById('suggested-list-reim')
        if (subs.length && listEl) {
            listEl.innerHTML = templateList(subs);
            const listInit = new mdc.list.MDCList(listEl)
            handleTemplateListClick(listInit)
        }
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
        let month = monthlyString = '';
        const parent = document.getElementById('reimbursements')
        const keys = Object.keys(reimbursementData);
        keys.forEach(function (key) {
            const timestamp = Number(key)
            if (month !== new Date(timestamp).getMonth()) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${new Date(timestamp).getMonth() + 1}-${new Date(timestamp).getFullYear()}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = new Date(timestamp).getMonth();

            monthlyString += reimbursementCard(key,reimbursementData);
        })
        if (!parent) return
        parent.innerHTML = monthlyString;
        toggleReportCard('.reim-card');
        [].map.call(document.querySelectorAll('.amount-container .amount'), function (el) {
            el.addEventListener('click',function() {
                const id = el.dataset.relevantId;
                db.transaction('activity').objectStore('activity').get(id).onsuccess = function (event) {
                    const activity = event.target.result;
                    if(activity) {
                        const heading = createActivityHeading(activity)
                        showViewDialog(heading, activity, 'view-form');
                    }
                }
            })
        })
    })
}


function reimbursementCard(key,data) {
    return `<div class='mdc-card mdc-card--outlined reim-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
    <div class='mdc-card__primary-action'>
      <div class="demo-card__primary">
      <div class='left'>
          <div class="month-date-cont">
            <div class="day">${cardDate({
                date:new Date(Number(key)).getDate(),
                month:new Date(Number(key)).getMonth(),
                year:new Date(Number(key)).getFullYear()
            })}</div>
            <div class="date">${new Date(Number(key)).getDate()}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography">${totalReimAmount(data[key])}</span>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${data.office}</h3>
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
        ${data[key].map(function(value){
            return `
                <div class='amount mdc-typography--headline6 ${value.details.status === 'CANCELLED' ? 'mdc-theme--error' : value.details.status === 'CONFIRMED' ? 'mdc-theme--success' : ''}' data-relevant-id="${value.details.relevantActivityId}">
                    <div class='mdc-typography--caption'>${value.reimbursementType}</div>
                    ${value.details.status === 'CANCELLED' ? 0 : convertAmountToCurrency(value.amount,value.currency)}
                    <div class='mdc-typography--caption'>${value.details.status}</div>
                    <div class='mdc-typography--subtitle2'>${value.reimbursementName}</div>
                </div>
            `
        }).join("")}
        </div>
      </div>
      </div>
    </div>
</div>`
}

function totalReimAmount(reimData){
    let total = 0;
    let currency = ''
    reimData.forEach(function(data){
        if(data.details.status !== 'CANCELLED') {
            total += data.amount
            currency = data.currency
        }
    })
    return convertAmountToCurrency(total,currency)
}



function convertAmountToCurrency(amount, currency) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR'
    }).format(amount)
}



function reimDom() {
    return `<div class='reim-section'>
        <div class='mdc-layout-grid__inner'>
            <div id='text-container-reim' class='mdc-layout-grid__cell--span-12'></div>
            <div class='list-container mdc-layout-grid__cell--span-12'>
                <ul class='mdc-list subscription-list' id='suggested-list-reim'></ul>
            </div>
        </div>
        <div id='reimbursements' class='mdc-layout-grid__inner'></div>
    `
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reimbursement')
        const index = tx.objectStore('reimbursement').index('month')
        const result = [];
        const dateObject = {}
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if(!dateObject[cursor.value.key]) {
                dateObject[cursor.value.key] = [cursor.value]
            }
            else {
                dateObject[cursor.value.key].push(cursor.value)
            }
            cursor.continue();
        }
        tx.oncomplete = function () {
            // Object.key(dateObject).forEach(function(k) {
            //     new Date(console.log(k))
            // })
            return resolve(dateObject)
        }
        tx.onerror = function () {
            return reject(tx.error)
        }
    })
}