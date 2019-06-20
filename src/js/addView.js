function addView(sub, location) {
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template.toUpperCase()}</span>
    `
    const header = getHeader('app-header', backIcon, '');

    history.pushState(['addView'], null, null);
    hideBottomNav();
    document.getElementById('app-current-panel').innerHTML = `
    <div class='banner'></div>
    <iframe id='form-iframe' src="https://growthfile-testing.firebaseapp.com/forms/customer/edit.html"></iframe>
    `
    console.log(db)
    document.getElementById('form-iframe').addEventListener("load", ev => {
        // your stuff
        document.getElementById('form-iframe').contentWindow.init(sub, location);
    })
}

function sendFormToParent(formData,location) {
    progressBar.open();
    requestCreator('create', formData).then(function () {
        progressBar.close();
        successDialog()
        homeView(selectedSubs,location)
    }).catch(function(error){
        progressBar.close();
        snacks(error.response.message)
    })
}