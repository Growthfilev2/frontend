function paymentView() {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = paymentDom();
    
    getPaymentData().then(function (paymentData) {
        const parent = document.getElementById('payment-cards');
        let month = ''
        let monthlyString = ''
        const keys = Object.keys(paymentData);
        
        if (!keys.length) {
            if(parent) {
                parent.innerHTML = "<h5 class='mdc-typography--headline5 text-center'>No Payment Found</h5>"
            }
            return
        }
        keys.forEach(function (key) {
            const timestamp = Number(key)
            if (month !== new Date(timestamp).getMonth()) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${new Date(timestamp).getMonth() + 1}-${new Date(timestamp).getFullYear()}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = new Date(timestamp).getMonth();
            const offices = Object.keys(paymentData[key]);
            offices.forEach(function (office) {
                monthlyString += paymentCard(timestamp, office, paymentData);
            })
        })
        if (!parent) return;
        parent.innerHTML = monthlyString;
        toggleReportCard('.payment-card');
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

function getPaymentData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('payment')
        const index = tx.objectStore('payment').index('key')
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
            }
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(dateObject)
        }
    })
}


function paymentCard(timestamp, office, paymentData) {
    return `<div class='mdc-card  report-card mdc-card--outlined payment-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
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
                <span class="demo-card__title mdc-typography">${calculateTotalPayment(paymentData[timestamp][office])}</span>
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
          <div class='amount-container'>
            ${paymentData[timestamp][office].map(function(payment){
                return `
                <div class='amount ${payment.details.status === 'CANCELLED' ? 'mdc-theme--error':''}'>
                    <div class='mdc-typography--subtitle2'>${payment.details.account}</div>
                    <div class='mdc-typography--caption'>${payment.details.ifsc}</div>
                    <div class='mdc-typography--headline6 ${payment.details.status === 'CANCELLED' ?'' :'mdc-theme--primary'}'>${payment.details.status === 'CANCELLED' ? 0 : convertAmountToCurrency(payment.details.amount,payment.currency) || ''}</div>
                    <div class='mdc-typography--caption'>${payment.details.status || ''}</div>
                    ${payment.details.cycleStart && payment.details.cycleEnd ? `<div class='mdc-typography--caption'>${moment(payment.details.cycleStart,"Do MMM YYYY").format("DD/MM/YY")} - ${moment(payment.details.cycleEnd,"Do MMM YYYY").format("DD/MM/YY")}</div>` :''} 
                </div>`
            }).join("")}
          </div>
          </div>
        </div>
    </div>`
}

function calculateTotalPayment(data) {
    let total = 0;
    let currency = '';

    data.forEach(function (value) {
        if(value.details.status === 'CANCELLED') return;
        const amount = Number(value.details.amount)
        total = total + (amount);
        currency = value.currency
    })
    return convertAmountToCurrency(total, currency)
}

function paymentDom() {
    return `<div class='payment-section report-view' id='payments'>   
    <div id='payment-cards' class='mdc-layout-grid__inner'>
    </div>
</div>`
}