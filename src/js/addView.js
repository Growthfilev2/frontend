const allowedOrigins = {
    'https://growthfile.com': true,
    'https://growthfile-207204.firebaseapp.com': true
}

function addView(sub, body) {
    removeSwipe()
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    `
    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden');
    dom_root.classList.remove("mdc-layout-grid", 'pl-0', 'pr-0');
    dom_root.innerHTML = `
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
    const frame = document.getElementById('form-iframe') || document.getElementById('rating-form')
    if (!frame) return;
    frame.contentWindow.postMessage(data, window.location.origin);
}

function resizeFrame(frameDimensions) {
    const frame = document.getElementById('rating-form');
    if (!frame) return;
    frame.style.height = frameDimensions.height + 'px'
}



window.addEventListener('message', function (event) {
    if (!allowedOrigins[event.origin]) return;
    if (typeof event.data === 'object' && event.data != null) {
        if (event.data.hasOwnProperty('name')) {
            window[event.data.name](event.data.body);
        }
    }
});



function sendFormToParent(formData) {
    progressBar.open();
    const customerAuths = formData.customerAuths;
    delete formData.customerAuths;
    appLocation(3).then(function (geopoint) {

        requestCreator('create', formData, geopoint).then(function () {
            console.log(formData);
     
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
                    // appView()
                    history.back();
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
            // return appView();
            return  history.back();
        }).catch(function (err) {
            snacks(err.message);
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
    const frame = document.getElementById('form-iframe') || document.getElementById('rating-form')
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