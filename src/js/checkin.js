function fillVenueInSub(sub, venue) {
    const vd = sub.venue[0];
    sub.venue = [{
        geopoint: {
            latitude: venue.latitude || '',
            longitude: venue.longitude || ''
        },
        location: venue.location || '',
        address: venue.address || '',
        venueDescriptor: vd
    }];
    return sub;
}


function reloadPage() {
    window.location.reload(true);
}


function shouldCheckin(geopoint, checkInSubs) {
    ApplicationState.officeWithCheckInSubs = checkInSubs;
    const oldState = JSON.parse(localStorage.getItem('ApplicationState'))
    if (!oldState) return true
    if (!oldState.lastCheckInCreated) return true
    const isOlder = isLastLocationOlderThanThreshold(oldState.lastCheckInCreated, 300)
    const hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldState.location, geopoint))
    if (isOlder || hasChangedLocation) {
        return true
    }
    ApplicationState = oldState;
    return false
}



function failureScreen(error, callback) {

    dom_root.innerHTML = `
      <div class="center-abs location-not-found">
      <i class='material-icons mdc-theme--secondary'>${error.icon || 'location_off'}</i>
      <p class='mdc-typography--headline5'>
      ${error.title}
      </p>
      <p class='mdc-typography--body1'>
      ${error.message}
      </p>
      <button class="mdc-button mdc-theme--primary-bg" id='try-again'>
      <span class="mdc-button__label mdc-theme--on-primary">RETRY</span>
      </button>
      </div>`
    document.getElementById('try-again').addEventListener('click', function (evt) {
        document.querySelector('.center-abs.location-not-found').classList.add('hidden')
        callback();
    })
}


function mapView(location) {

    ApplicationState.location = location
    // progressBar.close();

    const latLng = {
        lat: location.latitude,
        lng: location.longitude
    }
    console.log(latLng)
    const offsetBounds = new GetOffsetBounds(location, 1);

    loadNearByLocations({
        north: offsetBounds.north(),
        south: offsetBounds.south(),
        east: offsetBounds.east(),
        west: offsetBounds.west()
    }, location).then(function (nearByLocations) {

        if (!nearByLocations.length) return createUnkownCheckIn(location)
        if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
        loadLocationsCard(nearByLocations, location);
    }).catch(error => {
        handleError({
            message: error.message,
            body: error
        })
    })
}

function createUnkownCheckIn(geopoint) {
    // document.getElementById("app-header").classList.add('hidden')
    const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
    ApplicationState.knownLocation = false;
    if (offices.length == 1) {
        generateRequestForUnknownCheckin(offices[0], geopoint)
        return
    }
    const officeCard = bottomCard('Choose office');

    offices.forEach(function (office) {
        const li = createList({
            primaryText: office,
            meta: 'navigate_next'
        });
        officeCard.ul.appendChild(li);
    })

    new mdc.list.MDCList(officeCard.ul).listen('MDCList:action', function (evt) {
        console.log(evt.detail.index)
        const selectedOffice = offices[evt.detail.index];
        generateRequestForUnknownCheckin(selectedOffice, geopoint)
        officeCard.card.classList.add('hidden')
    })
    dom_root.appendChild(officeCard.card);
}


function generateRequestForUnknownCheckin(office, geopoint, retries = {
    subscriptionRetry: 0,
    invalidRetry: 0
}) {
    loadScreen('checkin');
    document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in'
    getRootRecord().then(function (rootRecord) {
        const timestamp = fetchCurrentTime(rootRecord.serverTime)

        const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
        copy.share = [];
        copy.timestamp = timestamp
        console.log('checkin body',copy)
        requestCreator('create', fillVenueInSub(copy, ''), geopoint).then(function () {
            ApplicationState.lastCheckInCreated = Date.now()
            ApplicationState.venue = ''
            ApplicationState.selectedOffice = office;
            localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
            removeScreen()
            successDialog('Check-In Created')
            initProfileView();
        }).catch(function (error) {
            console.log(error)
            // progressBar.close()
            const queryLink = getDeepLink();

            if (error.message === `No subscription found for the template: 'check-in' with the office '${office}'`) {

                if (queryLink && queryLink.get('action') === 'get-subscription') {
                    handleCheckinRetryUnkown(retries, office, geopoint)
                    return
                }
                handleSubscriptionError()
                return;
            }

            if (error.message === 'Invalid check-in') {
                handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
                    ApplicationState.location = newGeopoint;
                    retries.invalidRetry++
                    generateRequestForUnknownCheckin(office, newGeopoint, retries);
                });
                return
            };

        })

    })
}


function handleCheckinRetryUnkown(retries, office, geopoint) {
    if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
            retries.subscriptionRetry++
            generateRequestForUnknownCheckin(office, geopoint, retries)
        }, 5000)
        return
    }
    redirect('/index.html')
}


function handleInvalidCheckinLocation(callback) {

    if (_native.getName() === 'Android') {
        handleGeoLocationApi().then(callback).catch(function (error) {
            handleLocationError({
                message: ''
            });
        })
        return;
    }

    try {
        webkit.messageHandlers.locationService.postMessage('start');
        window.addEventListener('iosLocation', function _iosLocation(e) {
            callback(e.detail)
            window.removeEventListener('iosLocation', _iosLocation, true);
        }, true);
    } catch (e) {
        handleLocationError({
            message: ''
        });
    }
}


const bottomCard = (heading, listTwoLine) => {
    const card = createElement('div', {
        className: 'mdc-card mdc-elevation--z16 mdc-card--outlined bottom-card'
    })
    card.appendChild(createElement('h1', {
        className: 'mdc-typography--headline6',
        textContent: heading
    }))
    const ul = createElement('ul', {
        className: 'mdc-list pt-0'
    })
    if (listTwoLine) {
        ul.classList.add('mdc-list--two-line', 'mdc-list--avatar-list')
    }
    card.appendChild(ul);

    return {
        ul,
        card
    }
}

function loadLocationsCard(venues, geopoint) {

    ApplicationState.knownLocation = true;
    const locationCard = bottomCard('Choose duty location', true);

    venues.map(function (venue) {
        locationCard.ul.appendChild(createList({
            icon: 'location_on',
            primaryText: venue.location,
            secondaryText: venue.office,
            meta: 'navigate_next'
        }))
    })

    new mdc.list.MDCList(locationCard.ul).listen('MDCList:action', function (evt) {
        console.log(evt.detail.index)
        const selectedVenue = venues[evt.detail.index];
        createKnownCheckIn(selectedVenue, geopoint);
        locationCard.card.classList.add('hidden')
        // return;
    })
    dom_root.appendChild(locationCard.card);

};

function createKnownCheckIn(selectedVenue, geopoint, retries = {
    subscriptionRetry: 0,
    invalidRetry: 0
}) {
    console.log(selectedVenue)

    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]))
    copy.share = []
    // progressBar.open()
    loadScreen('checkin')
    document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in at ' + selectedVenue.location;
    console.log('checkin body',copy)
    // return
    requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {
        ApplicationState.lastCheckInCreated =  Date.now()
        ApplicationState.venue = selectedVenue;
        ApplicationState.selectedOffice = selectedVenue.office;
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
        removeScreen()
        successDialog('Check-In Created')
        initProfileView()
    }).catch(function (error) {
        console.log(error)
        // progressBar.close()
        const queryLink = getDeepLink();

        if (error.message === `No subscription found for the template: 'check-in' with the office '${office}'`) {
            if (queryLink && queryLink.get('action') === 'get-subscription') return handleCheckinRetryKnown(retries, geopoint, selectedVenue)
            handleSubscriptionError();
            return
        };
        if (error.message === 'Invalid check-in') {
            handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
                ApplicationState.location = newGeopoint;
                retries.invalidRetry++
                createKnownCheckIn(selectedVenue, newGeopoint, retries);
            });
            return
        };
    })
}
function handleSubscriptionError() {
    navigator.serviceWorker.controller.postMessage({
        type: 'read'
    });
    navigator.serviceWorker.onmessage = (event) => {
        getCheckInSubs().then(subs => {
            if (!Object.keys(subs).length) return noOfficeFoundScreen();
            handleCheckin(geopoint)
        })
    }
}

function handleCheckinRetryKnown(retries, geopoint, selectedVenue) {
    if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
            retries.subscriptionRetry++
            createKnownCheckIn(selectedVenue, geopoint, retries);
        }, 5000)
        return
    };
    redirect('/index.html')
}

function snapView(selector) {
    document.querySelector(selector).innerHTML = `
    <div class='snap-container'>
    <h6 class='mdc-typography--headline5 text-center'>
      Create a photo check-in
    </h6>
    <div class='landing-page-container text-center'>
      <button class="mdc-fab mdc-fab--extended mdc-theme--primary-bg mdc-theme--on-primary">
        <div class="mdc-fab__ripple"></div>
        <span class="material-icons mdc-fab__icon">camera</span>
        <span class="mdc-fab__label">Take photo</span>
      </button>
    </div>
    </div>
    `;

    document.querySelector('.snap-container .mdc-fab').addEventListener('click', openCamera)
    openCamera();
}



function mdcDefaultSelect(data, label, id, option) {
    const template = `<div class="mdc-select" id=${id}>
    <i class="mdc-select__dropdown-icon"></i>
    <select class="mdc-select__native-control">
    <option disabled selected></option>
    ${data.map(function(value){
      return ` <option value='${value}'>
      ${value}
      </option>`
  }).join("")}
  ${option}
  
    </select>
    <label class='mdc-floating-label'>${label}</label>
    <div class="mdc-line-ripple"></div>
  </div>`
    return template;
}


function getOrientation(image) {
    if (image.width > image.height) return 'landscape'
    if (image.height > image.width) return 'potrait'
    if (image.width == image.height) return 'square'
}