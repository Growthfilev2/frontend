function addView(sub) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template.toUpperCase()}</span>
    `
    const header = getHeader('app-header', backIcon, '');
    header.root_.classList.remove('hidden')
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    
    // hideBottomNav();
    document.getElementById('app-current-panel').innerHTML = `
    <div class='banner'></div>
    <iframe id='form-iframe' src="${window.location.origin}/forms/${sub.template}/edit.html"></iframe>
    `
    console.log(db)
    document.getElementById('form-iframe').addEventListener("load", ev => {
        // your stuff
        document.getElementById('form-iframe').contentWindow.init(sub);
    })
}

function sendFormToParent(formData) {
    progressBar.open();
    requestCreator('create', formData).then(function () {
            progressBar.close();
            successDialog()
            if (formData.template === 'customer') {
                ApplicationState.knownLocation = true;
                ApplicationState.venue = {
                    office: formData.office,
                    template: formData.template,
                    status: formData.status,
                    location:formData.venue[0].location,
                    address:formData.venue[0].address,
                    latitude:formData.venue[0].geopoint.latitude,
                    longitude:formData.venue[0].geopoint.longitude
                }
                getSuggestions();
                return;
            }
            getSuggestions();
            // homeView(selectedSubs, location)
        })
        .catch(function (error) {
            progressBar.close();
            snacks(error.response.message,'Okay')
    })
}