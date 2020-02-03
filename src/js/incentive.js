function incentiveView() {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = incentiveDom();
    const el = document.getElementById('incentive-view');
    Promise.all([getReportSubscriptions('incentive'), getSubscription('', 'call')]).then(function (results) {
        const merged = [...results[0],...results[1]];
        if(!merged.length) return;
        if(!el) return;
        el.appendChild(createTemplateButton(merged))
    })
}

function incentiveDom() {
    return `<div class='incentive-section report-view' id='incentive-view'>
  </div>`
}