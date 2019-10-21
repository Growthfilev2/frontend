function paymentView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'
    const tx = db.transaction('payments')
    const index = tx.objectStore('payments').index('month')
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
        // card.queryselector('.mdc-card__primary-action').appendChild()
        frag.appendChild(card)
        cursor.continue();
    }
    tx.oncomplete = function() {
        const el = document.getElementById('payments')
        if(!el) return;
        el.appendChild(frag);
    }
}

function paymentDetails() {

}

function paymentDom() {
    return `<div class='payment-section' id='payments'>   
</div>`
}

