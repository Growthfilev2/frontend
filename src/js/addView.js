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
    <iframe id='form-iframe' src='${window.location.origin}/frontend/dist/forms/customer/edit.html'></iframe>
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
                const customerAuths = formData.customerAuths;
                delete formData.customerAuths;
                getSuggestions();
                customerAuths.forEach(function(auth){
                    delete auth.displayName
                    requestCreator('updateAuth', auth).then(function (response) {
                        console.log(response)
                    }).catch(console.log)
                })
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


function parseContact(contactString){
const displayName = contactString.split("&")[0].split("=")[1];
const phoneNumber = contactString.split("&")[1].split("=")[1];
const email = contactString.split("&")[2].split("=")[1];
return {
    displayName:displayName,
    phoneNumber:phoneNumber ?  formatNumber(phoneNumber) : "",
    email:email
    }
}

function setContactForCustomer(contactString){
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails,'First Contact');
}
function setContactForCustomerFailed(exceptionMessage){
    handleError({
        message:exceptionMessage,
        body:''
    })
}

function setContactForSecondCustomer(contactString){
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails,'Second Contact');
}
function setContactForSecondCustomerFailed(exceptionMessage){
    handleError({
        message:exceptionMessage,
        body:''
    })
}


