function expenseView(sectionContent) {
   
    getSubscription(ApplicationState.office, 'expense claim').then(function (result) {
        if (!result.length) {
            sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Expense Claim</h3>'
            return
        }
        sectionContent.innerHTML =templateList(result);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)
    })
}