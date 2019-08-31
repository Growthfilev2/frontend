
function expenseView() {

    const sectionContent = document.querySelector('.tabs-section .data-container');
    getReportSubs('reimbursement').then(function (subs) {
        if (!subs.length) {
            sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Claim</h3>'
            return
        }
        sectionContent.innerHTML = templateList(subs);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)
    }).catch(function(error){
        handleError({
            message:error.message,
            body:{
                stack:error.stack || '',
                error:error
            }
        })
    })
}