function paymentView() {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = paymentDom();
    document.getElementById('start-load').classList.add('hidden')
    const parent = document.getElementById('payments');
    let month = ''
    let monthlyString = ''
    getPaymentData().then(function (paymentData) {
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
        [].map.call(document.querySelectorAll(`[data-paymentdata]`),function(el){
            console.log(el)
            el.addEventListener('click',function(){
                const data = JSON.parse(el.dataset.paymentdata)
                const dialog = new Dialog(paymentViewHeading(data),paymentViewContent(data),'payment-dialog').create('simple');
                dialog.open();
            })
        })
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
          <div class='text-container'></div>
          <div class='amount-container'>
           ${paymentData[timestamp][office].map(function(payment){
                return `
                <div  data-paymentData='${JSON.stringify(payment)}' class='amount  mdc-typography--headline6 ${payment.status === 'CANCELLED' ? 'mdc-theme--error' : payment.status === 'CONFIRMED' ? 'mdc-theme--success' : ''}'>
                    <div class='mdc-typography--caption'>${payment.type}</div>
                    ${payment.status === 'CANCELLED' ? 0 : convertAmountToCurrency(payment.amount,payment.currency)}
                    <div class='mdc-typography--caption'>${payment.status}</div>
                </div>
                `
           }).join("")}
         </div>
          </div>
        </div>
    </div>`
}


function paymentViewHeading(data){
    return `<span class='capitalize'>${data.type}</span>
    <div class='card-time mdc-typography--subtitle1 capitalize'>Created On ${formatCreatedTime(data.createdAt)}</p>
    `
}

function paymentViewContent(data) {
    return `<div class=claim-view'> 
        ${data.amount ? `
        <h3 class='mdc-typography--body1 info-heading mt-0'>
            Amount : ${convertAmountToCurrency(Number(data.amount),data.currency)}` : ''}
        </h3>
      
        ${data.status ? `<h3 class='mdc-typography--body1 info-heading mt-0'>
           Status : ${data.status} 
        </h3>` : ''}
        ${data.cycleStartTime && data.cycleEndTime ? `<h3 class='mdc-typography--body1 info-heading'>
            Cycle : ${moment(data.cycleStartTime).format('DD/MM/YYYY')} - ${moment(data.cycleEndTime).format('DD/MM/YYYY')}
        </h3>` : ''}
        
    </div>`
}

function calculateTotalPayment(data) {
    let total = 0;
    let currency = '';

    data.forEach(function (value) {
        const amount = Number(value.amount)
        total = total + (amount);
        currency = value.currency
    })
    return convertAmountToCurrency(total, currency)
}

function paymentDom() {
    return `<div class='payment-section' id='payments'>   
</div>`
}