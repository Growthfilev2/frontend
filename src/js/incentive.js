function incentiveView() {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = incentiveDom();
    document.getElementById('start-load').classList.add('hidden')
    const el = document.getElementById('incentive-view')
    getSubscription('', 'customer').then(function (subs) {
        if (!subs.length) return;
        if (!el) return;
        el.appendChild(createTemplateButton(subs))
    }).catch(function (error) {
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
            }
        })
    })
}

function incentiveDom() {
    return `<div class='incentive-section report-view' id='incentive-view'>
  </div>`
}