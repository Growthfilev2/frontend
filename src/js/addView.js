function addView(sub, body) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template === 'subscription' ? 'Add other contacts' : sub.template === 'users' ? 'Add people' : sub.template}</span>
    `
    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden')
    document.getElementById('app-current-panel').classList.remove("mdc-layout-grid", 'pl-0', 'pr-0');
    document.getElementById('app-current-panel').innerHTML = `
        <iframe class='' id='form-iframe' src='${window.location.origin}/v2/forms/${sub.template}/edit.html'></iframe>`;
    document.getElementById('form-iframe').addEventListener("load", ev => {
        passFormData({
            name: 'init',
            template: sub,
            body: body,
            deviceType: native.getName()
        });
    })
}

function passFormData(data) {
    const frame = document.getElementById('form-iframe');
    if (!frame) return;
    frame.contentWindow.postMessage(data, window.location.origin);
}

function resizeFrame() {

}

function originMatch(origin) {
    const origins = ['https://growthfile-207204.firebaseapp.com', 'https://growthfile.com', 'https://growthfile-testing.firebaseapp.com', 'http://localhost:5000', 'http://localhost', 'https://growthfilev2-0.firebaseapp.com']
    return origins.indexOf(origin) > -1;
}

window.addEventListener('message', function (event) {
    console.log(event)
    if (!originMatch(event.origin)) return;
    this.console.log(event.data);
    if (typeof event.data === 'object' && event.data != null) {
        if (event.data.hasOwnProperty('name')) {
            window[event.data.name](event.data.body);
        }
    }
});


function sendOfficeData(requestBody) {
    const auth = firebase.auth().currentUser;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': requestBody.registeredOfficeAddress
    }, function (geocodeResults, status) {
        if (status == 'OK' && geocodeResults.length) {
            requestBody.placeId = geocodeResults[0].place_id
            appLocation(3).then(function (geopoint) {
    
                return requestCreator('createOffice', requestBody, geopoint).then(function () {
                    successDialog(`Office created successfully`);
                    logReportEvent('Office Created')
                    logFirebaseAnlyticsEvent('office_created', {
                        item_location_id: requestBody.placeId,
                    });
    
                    progressBar.open();
                    setTimeout(function () {
                        requestCreator('subscription', {
                            "share": [{
                                phoneNumber: auth.phoneNumber,
                                displayName: auth.displayName,
                                email: auth.email
                            }],
                            "template": "subscription",
                            "office": requestBody.name
                        }, geopoint).then(function (response) {
                            return updateFromTime(0)
                        }).then(function () {
                            progressBar.close();
                            history.pushState(['share'], null, null);
                            giveSubscriptionInit(requestBody.name, true);
                        }).catch(function (error) {
                            progressBar.close();
                            snacks(error.message);
                        })
                    }, 3000)
                }).catch(function (error) {
                    console.log(error)
                    passFormData({
                        name: 'toggleSubmit',
                        template: '',
                        body: '',
                        deviceType: native.getName()
                    })
                    if (error.message === `Office with the name '${requestBody.name}' already exists`) {
    
                    }
                })
            }).catch(handleLocationError);
            return
        }
        snacks('No such address found')
        passFormData({
            name: 'toggleSubmit',
            template: '',
            body: '',
            deviceType: native.getName()
        })

    })
    // requestCreator('geocode', `address=${encodeURIComponent(requestBody.registeredOfficeAddress)}`).then(function (response) {
    //     if (response.status !== "OK") {
    //         snacks('Error occured please try again later')
    //         passFormData({
    //             name: 'toggleSubmit',
    //             template: '',
    //             body: '',
    //             deviceType: native.getName()
    //         })
    //         return
    //     }
    //     if (!response.results.length) {
    //         snacks('No such address found')

    //         return
    //     }

       

    // }).catch(console.error);

}

function sendUsersData(formData) {
    appLocation(3).then(function (geopoint) {
        requestCreator('checkIns', formData, geopoint).then(function (response) {
            history.back();
            successDialog('')
        }).catch(function (error) {
            passFormData({
                name: 'toggleSubmit',
                template: '',
                body: '',
                deviceType: native.getName()
            })
        });

    }).catch(handleLocationError);
}

function sendSubscriptionData(formData, geopoint) {
    const prom = geopoint ? Promise.resolve(geopoint) : appLocation(3);
    prom.then(function (coord) {
        requestCreator('subscription', formData, coord).then(function (response) {

            localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
            document.getElementById('app-header').classList.add('hidden');
            loadingScreen(['Generating Reports']);
            const rootTx = db.transaction(['root'], 'readwrite');
            const store = rootTx.objectStore('root')
            const uid = firebase.auth().currentUser.uid
            store.get(uid).onsuccess = function (event) {
                const record = event.target.result;
                record.fromTime = 0;
                store.put(record)
            }
            rootTx.oncomplete = function () {
                loadingScreen(['Getting Data', 'Generating Reports'])
                requestCreator('Null').then(function () {
                    openMap();
                }).catch(console.error)

            };
        }).catch(function (error) {
            passFormData({
                name: 'toggleSubmit',
                template: '',
                body: '',
                deviceType: native.getName()
            })
        })
    }).catch(handleLocationError)

}


function sendFormToParent(formData) {
    progressBar.open();
    const customerAuths = formData.customerAuths;
    delete formData.customerAuths;
    appLocation(3).then(function (geopoint) {

        requestCreator('create', formData, geopoint).then(function () {
            console.log(formData)
            successDialog(`You Created a ${formData.template}`);


            if (formData.report === 'attendance' && formData.id) {
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
            };


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

            return reportView()
        }).catch(function (err) {
            passFormData({
                name: 'toggleSubmit',
                template: '',
                body: '',
                deviceType: native.getName()
            })
            if (formData.report === 'attendance' && err.body.code == 400) {
                if (!formData.id) return;
                const tx = db.transaction('attendance');
                const store = tx.objectStore('attendance')
                store.get(formData.id).onsuccess = function (event) {
                    const record = event.target.result;
                    if (!record) return;
                    handleError({
                        message: 'IDB record',
                        body: record
                    })
                }
                tx.oncomplete = function () {};
            }
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
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'setContact',
        body: contactDetails
    }, window.location.origin)
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
    }, window.location.origin);
}


function expenseClaimImage(base64) {
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'setExpenseImage',
        body: base64
    }, window.location.origin);

}

function callImage(base64) {
    const frame = document.getElementById('form-iframe')
    if (!frame) return;
    frame.contentWindow.postMessage({
        name: 'setCallImage',
        body: base64
    }, window.location.origin);

}