function expenseView(sectionContent) {
    const subs = []
    const tx = db.transaction('subscriptions');
    sectionContent.dataset.view === 'reimbursement'
    tx.objectStore('subscriptions')
        .index('report')
        .openCursor(IDBKeyRange.only('reimbursement'))
        .onsuccess = function (event) {
            const cursor = event.target.result;
            if(!cursor) return
            if(cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
            subs.push(cursor.value)
            cursor.continue();

        }
    tx.oncomplete = function () {
        console.log(subs)
        if (!subs.length) {
            sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Claim</h3>'
            return
        }
        sectionContent.innerHTML = templateList(subs);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)

    }
}