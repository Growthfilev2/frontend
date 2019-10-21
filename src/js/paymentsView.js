function paymentView(sectionContent) {
    sectionContent.innerHTML = paymentDom();
    sectionContent.dataset.view = 'payments'
    const tx = db.transaction('payment')
    const index = tx.objectStore('payment').index('month')
    const frag = document.createDocumentFragment();
    let month = ''
    index.openCursor(null, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (month !== cursor.value.month) {
            frag.appendChild(createElement('div', {
                className: 'hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12',
                textContent: moment(`${cursor.value.month + 1}-${cursor.value.year}`, 'MM-YYYY').format('MMMM YYYY')
            }))
        };

        month = cursor.value.month;
        const card = commonCardHeading(cursor.value);
        card.querySelector('.card-detail-section').innerHTML= paymentDetails(cursor.value);
        frag.appendChild(card)
        cursor.continue();
    }
    tx.oncomplete = function() {
        const el = document.getElementById('payments')
        if(!el) return;
        el.appendChild(frag);
    }
}

function paymentDetails(paymentData) {
    return `<div class='payment-details'>
        ${paymentData.createdAt ? ` <h3 class='mdc-typography--body1'>
        Created  : ${moment(paymentData.createdAt).format('DD/MM/YYYY hh:mm A')}
    </h3>` :''}
        ${paymentData.cycleStartDate && paymentData.cycleEndDate ?`<h3 class='mdc-typography--body1 mb-0'>
        Cycle  : ${moment(paymentData.cycleStartDate).format('DD/MM/YYYY')} - ${moment(paymentData.cycleEndDate).format('DD/MM/YYYY')}
    </h3>` :'' }
    </div>` 
}

function paymentDom() {
    return `<div class='payment-section' id='payments'>   
</div>`
}

