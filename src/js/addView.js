function addView(sub) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template === 'subscription' ? 'Add other contacts' : sub.template === 'users' ? 'Add people' : sub.template}</span>
    `
    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden')
    document.getElementById('app-current-panel').classList.remove("mdc-layout-grid", 'pl-0', 'pr-0');
    document.getElementById('app-current-panel').innerHTML = `
        <iframe class='' id='form-iframe' src='${window.location.origin}/growthfile-frontend/dist/v2/forms/${sub.template}/edit.html'></iframe>`;
    document.getElementById('form-iframe').addEventListener("load", ev => {
        const frame = document.getElementById('form-iframe');
        if (!frame) return;
        frame.contentWindow.postMessage({
            name: 'init',
            body: sub,
            deviceType: native.getName()
        }, window.location.href);
    })
}

function originMatch(origin) {
    const origins = ['https://growthfile-207204.firebaseapp.com', 'https://growthfile.com', 'https://growthfile-testing.firebaseapp.com', 'http://localhost:5000', 'http://localhost']
    return origins.indexOf(origin) > -1;
}

window.addEventListener('message', function (event) {
    console.log(event)
    if (!originMatch(event.origin)) return;
    this.console.log(event.data);
    window[event.data.name](event.data.body);
})


function sendOfficeData(requestBody) {
    appLocation(3).then(function (geopoint) {
        requestCreator('createOffice', requestBody, geopoint).then(function () {
            successDialog(`Office created successfully`);
            giveSubscriptionInit(requestBody.name);
        }).catch(console.error)
    }).catch(handleLocationError);
}

function sendUsersData(formData) {
    appLocation(3).then(function (geopoint) {
        requestCreator('checkIns', formData, geopoint).then(function (response) {
            history.back();
            successDialog('')
        }).catch(console.error);

    }).catch(handleLocationError);
}

function sendSubscriptionData(formData) {
    appLocation(3).then(function (geopoint) {
        requestCreator('subscription', formData, geopoint).then(function (response) {
            ApplicationState.createdSubscription = true;
            localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
            document.getElementById('app-header').classList.add('hidden');
            loadingScreen();
            const rootTx = db.transaction(['root'], 'readwrite');
            const store = rootTx.objectStore('root')
            const uid = firebase.auth().currentUser.uid
            store.get(uid).onsuccess = function (event) {
                const record = event.target.result;
                record.fromTime = 0;
                store.put(record)
            }
            rootTx.oncomplete = function () {
                reloadPage();
            }
        });
    }).catch(handleLocationError);
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

                successDialog(`You Created a ${templateName}`);
            
                reportView()
            }).catch(console.error)
            return;
        }
        requestCreator('create', formData, geopoint).then(function () {
            console.log(formData)


            if (formData.report === 'attendance') {
                if (formData.template === 'attendance regularization') {
                    successDialog(`You Applied for an AR`);
                } else {
                    successDialog(`You Created a ${formData.template}`);
                };

                if (!formData.id) {
                    reportView()
                    return;
                }

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
                    }).catch(console.error)
                })
            }

            reportView()

            return;
        }).catch(console.error)

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
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'contactDetails',
        body: contactDetails
    }, window.location.href)
}

function setContactForCustomerFailed(exceptionMessage) {
    handleError({
        message: exceptionMessage,
        body: ''
    })
}

function getContactManager(contactString) {
    const contactDetails = parseContact(contactString);
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'setContactForManager',
        body: contactDetails
    }, window.location.href);
}


function expenseClaimImage(base64) {
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'setExpenseImage',
        body: base64
    }, window.location.href);
   
}