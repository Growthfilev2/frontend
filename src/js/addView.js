function addView(sub) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template === 'employee' ? 'Check-in subscribers' : formatTextToTitleCase(sub.template)}</span>
    `
    const header = getHeader('app-header', backIcon, '');

    document.getElementById('app-current-panel').innerHTML = `
    <div class='banner'></div>
    <iframe id='form-iframe' src='${window.location.origin}/v2/forms/${sub.template}/edit.html'></iframe>
    `;

    document.getElementById('form-iframe').addEventListener("load", ev => {
        document.getElementById('form-iframe').contentWindow.init(sub);
    })

}


function sendOfficeData() {
    progressBar.open();
    setTimeout(() => {
        successDialog(`Office created successfully`);
        progressBar.close();
        setTimeout(function(){
            giveSubscriptionInit();
        },200)
    },1000);
}

function sendSubscriptionData(formData) {
    progressBar.open();
    setTimeout(() => {
        getCheckInSubs().then(function(subs){
            if(!Object.keys(subs).length) {
                document.getElementById('app-current-panel').classList.add('mdc-theme--primary-bg')
                document.getElementById('app-current-panel').innerHTML = `
                <p class='mdc-typography--headline6 text-center'>
                    Please wait while you get check-in subscription
                </p>
                `;
                document.getElementById('start-load').classList.remove('hidden');
                setTimeout(() => {
                    progressBar.close();
                    history.pushState(['reportView'], null, null);
                    reportView();
                }, 2000);
                return
            }
            progressBar.close();
            history.pushState(['reportView'], null, null);
            reportView();
        })
    }, 1000);
}

function sendFormToParent(formData) {
    progressBar.open();

    const customerAuths = formData.customerAuths;
    delete formData.customerAuths;
    appLocation(3).then(function (geopoint) {
        if (Array.isArray(formData)) {
            const prom = []
            const templateName = formData[0].template
            formData.forEach(function (form) {
                prom.push(requestCreator('create', form, geopoint))
            })

            Promise.all(prom).then(function (response) {
                progressBar.close();
                successDialog(`You Created a ${templateName}`);
                // getSuggestions();
                reportView()
            }).catch(function (error) {
                progressBar.close();
                snacks(error.message, 'Okay')
            })
            return;
        }
        requestCreator('create', formData, geopoint).then(function () {
            progressBar.close();
            if (formData.template === 'attendance regularization') {
                successDialog(`You Applied for an AR`);
                const tx = db.transaction('attendance', 'readwrite');
                const store = tx.objectStore('attendance')
                store.get(formData.id).onsuccess = function (event) {
                    const record = event.target.result;
                    if (!record) return;
                    record.editable = 0;
                    store.put(record)
                }
                tx.oncomplete = function () {
                    reportView()
                    // getSuggestions();
                }
                return;
            }
            successDialog(`You Created a ${formData.template}`);

            if (formData.template === 'customer') {
                ApplicationState.knownLocation = true;
                ApplicationState.venue = {
                    office: formData.office,
                    template: formData.template,
                    status: formData.status,
                    location: formData.venue[0].location,
                    address: formData.venue[0].address,
                    latitude: formData.venue[0].geopoint.latitude,
                    longitude: formData.venue[0].geopoint.longitude
                }
                localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
                Object.keys(customerAuths).forEach(function (customerNumber) {
                    requestCreator('updateAuth', customerAuths[customerNumber], geopoint).then(function (response) {
                        console.log(response)
                    }).catch(function (error) {
                        console.log(error.message)
                    })
                })
            }

            reportView()

            return;
        }).catch(function (error) {
            progressBar.close();
            snacks(error.message, 'Okay')
        })

    }).catch(handleLocationError)
}


function parseContact(contactString) {
    const displayName = contactString.split("&")[0].split("=")[1];
    const phoneNumber = contactString.split("&")[1].split("=")[1];
    const email = contactString.split("&")[2].split("=")[1];
    return {
        displayName: displayName || "",
        phoneNumber: phoneNumber ? formatNumber(phoneNumber) : "",
        email: email || ""
    }
}


function setContactForCustomer(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails, 'First Contact');
}

function setContactForCustomerFailed(exceptionMessage) {
    handleError({
        message: exceptionMessage,
        body: ''
    })
}

function getContactPeople(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContactForPeople(contactDetails);
}

function getContactSupervisor(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContactForSupervisor(contactDetails);
}

function getContactOwner(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContactForOwner(contactDetails);
}

function getContactSupervisors(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContactForSupervisors(contactDetails);
}

function setContactForSecondCustomer(contactString) {
    const contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails, 'Second Contact');
}

function setContactForSecondCustomerFailed(exceptionMessage) {
    handleError({
        message: exceptionMessage,
        body: ''
    })
}


function expenseClaimImage(base64) {
    document.getElementById('form-iframe').contentWindow.setExpenseImage(base64);
}