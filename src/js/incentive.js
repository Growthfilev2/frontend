function incentiveView() {
    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = incentiveDom();
    const el = document.getElementById('incentive-view');
    getReportSubscriptions('incentive').then(function (subs) {
        if (!subs.length) return;
        if (!el) return;
        getDropDownContent('', 'customer-type', 'template').then((customerTypes) => {
            subs.forEach((sub) => {
                if (sub.template === 'customer') {
                    sub.customerTypes = customerTypes;
                    fillVenueInSub(sub,{
                        latitude:ApplicationState.location.latitude,
                        longitude:ApplicationState.location.longitude
                    })
                }
            })
            el.appendChild(createTemplateButton(subs))
        })
    })
}

function incentiveDom() {
    return `<div class='incentive-section report-view' id='incentive-view'>
  </div>`
}