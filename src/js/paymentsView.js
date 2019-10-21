function paymentView(sectionContent) {
    sectionContent.innerHTML = paymentDom();
    sectionContent.dataset.view = 'payments'
    const parent = document.getElementById('payments');
    const frag = document.createDocumentFragment();
    let month = ''
    let monthlyString = ''
    getPaymentData().then(function (paymentData) {
        if (!paymentData.length) {
            parent.innerHTML = "<h3 class='mdc-typography--headline5'>No payment records found</h3>"
            return
        }
        paymentData.forEach(function (payment) {
            if (month !== payment.month) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${payment.month + 1}-${payment.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };

            month = payment.month;
            monthlyString += paymentCard(payment);

        })
        if (parent) {
            parent.innerHTML = monthlyString;
            [].map.call(document.querySelectorAll('.payment-card'), function (el) {
                if (el) {
                    const icon = el.querySelector('.dropdown i')
                    icon.addEventListener('click', function () {
                        const detailContainer = el.querySelector('.attendace-detail-container')
                        if (detailContainer.classList.contains('hidden')) {
                            icon.textContent = 'keyboard_arrow_up'
                            detailContainer.classList.remove('hidden')
                        } else {
                            icon.textContent = 'keyboard_arrow_down'
                            detailContainer.classList.add('hidden')
                        }
                    })
                }
            });
        }
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
        const index = tx.objectStore('payment').index('month')
        const result = []
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            result.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(result)
        }

    })
}



function paymentCard(data) {
    return `<div class='mdc-card mdc-card--outlined payment-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
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
                <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title ${data.status === 'complete' ? 'mdc-theme--success' : data.status === 'cancelled' ? 'mdc-theme--error' :''}">Status : ${data.status}</h3>
              </div>
          </div>
          <div class='right'>
            <div class="dropdown-container dropdown">
              <i class="material-icons">keyboard_arrow_down</i>
              <div class='mdc-typography--subtitle2 mdc-theme--primary capitalize'>${data.type}</div>
            </div>
          </div>
          </div>
          <div class='attendace-detail-container hidden'>
          <div class='text-container'>
            ${data.createdAt ?`<h1 class='detail mdc-typography--body1'>
            Created : ${moment(data.createdAt).format('DD/MM/YYYY HH:mm')}
          </h1>` :'' }
            ${data.cycleStartDate && data.cycleEndDate ? `<h3  class='detail  mdc-typography--body1'>
                Cycle : ${moment(data.cycleStartDate).format('DD/MM/YYYY')} - ${moment(data.cycleEndDate).format('DD/MM/YYYY')}
            </h1>` :''}
          </div>
          </div>
        </div>
    </div>`
}


function paymentDom() {
    return `<div class='payment-section' id='payments'>   
</div>`
}