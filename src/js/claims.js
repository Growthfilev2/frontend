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
        reimData.forEach(function (record) {
            if (month !== record.month) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = record.month;
            monthlyString += reimbursementCard(record);
        })
        if (!parent) return
        parent.innerHTML = monthlyString;
        toggleReportCard('.reim-card');
        [].map.call(document.querySelectorAll('.reim-amount'), function (el) {
            const id = el.dataset.id;
            db.transaction('activity').objectStore('activity').get(id).onsuccess = function (event) {
                const activity = event.target.result;
                const heading = createActivityHeading(activity)
                showViewDialog(heading, activity, 'view-form');
            }
        })
    })
}


function reimbursementCard(data) {
    return `<div class='mdc-card mdc-card--outlined reim-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
    <div class='mdc-card__primary-action'>
      <div class="demo-card__primary">
      <div class='left'>
          <div class="month-date-cont">
            <div class="day">${cardDate(data)}</div>
            <div class="date">${data.date}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography">${convertAmountToCurrency(data.amount,data.currency)}</span>
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
      <div class='text-container'>
        ${data.reims.map(function(value){
            return `<div class='amount-container'>
                <div class='amount mdc-typography--headline6 mdc-theme--primary' data-claimId="${value.id}">
                    ${convertAmountToCurrency(value.amount,value.currency)}
                    <div class='mdc-typography--caption'>${value.type}</div>
                </div>
            </div>`
        }).join("")}
      </div>
      </div>
    </div>
</div>`
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
            <div id='reimbursements'></div>
    </div>`
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reimbursement')
        const index = tx.objectStore('reimbursement').index('month')
        const result = [];
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            result.push(cursor.value);
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(result)
        }
        tx.onerror = function () {
            return reject(tx.error)
        }
    })
}