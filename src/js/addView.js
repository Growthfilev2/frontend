function addView(sub, location) {
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template.toUpperCase()}</span>
    `
    const header = getHeader('app-header', backIcon, '');


    // hideBottomNav();
    document.getElementById('app-current-panel').innerHTML = `
    <div class='banner'></div>
    <iframe id='form-iframe' src="${window.location.origin}/forms/customer/edit.html"></iframe>
    `
    console.log(db)
    document.getElementById('form-iframe').addEventListener("load", ev => {
        // your stuff
        document.getElementById('form-iframe').contentWindow.init(sub, location);
    })
}

function sendFormToParent(formData, location) {
    progressBar.open();
    requestCreator('create', formData).then(function () {
            progressBar.close();
            successDialog()
            if (formData.template === 'customer') {
                const venue = {
                    office: formData.office,
                    template: formData.template,
                    status: formData.status
                }
                getAvailbleSubs(venue).then(function (subs) {
                    selectedSubs = subs;
                    homeView(selectedSubs, location)
                })
                return;
            }
            homeView(selectedSubs, location)
        })
        .catch(function (error) {
            progressBar.close();
            snacks(error.response.message)
    })
}