function fillVenueInSub(sub, venue) {
  var vd = sub.venue[0];
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
  var oldState = JSON.parse(localStorage.getItem('ApplicationState'));
  if (!oldState) return true;
  if (!oldState.lastCheckInCreated) return true;
  var isOlder = isLastLocationOlderThanThreshold(oldState.lastCheckInCreated, 300);
  var hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldState.location, geopoint));

  if (isOlder || hasChangedLocation) {
    return true;
  }

  ApplicationState = oldState;
  return false;
}

function failureScreen(error, callback) {
  dom_root.innerHTML = "\n      <div class=\"center-abs location-not-found\">\n      <i class='material-icons mdc-theme--secondary'>".concat(error.icon || 'location_off', "</i>\n      <p class='mdc-typography--headline5'>\n      ").concat(error.title, "\n      </p>\n      <p class='mdc-typography--body1'>\n      ").concat(error.message, "\n      </p>\n      <button class=\"mdc-button mdc-theme--primary-bg\" id='try-again'>\n      <span class=\"mdc-button__label mdc-theme--on-primary\">RETRY</span>\n      </button>\n      </div>");
  document.getElementById('try-again').addEventListener('click', function (evt) {
    document.querySelector('.center-abs.location-not-found').classList.add('hidden');
    callback();
  });
}

function mapView(location) {
  ApplicationState.location = location; // progressBar.close();

  var latLng = {
    lat: location.latitude,
    lng: location.longitude
  };
  console.log(latLng);
  var offsetBounds = new GetOffsetBounds(location, 1);
  loadNearByLocations({
    north: offsetBounds.north(),
    south: offsetBounds.south(),
    east: offsetBounds.east(),
    west: offsetBounds.west()
  }, location).then(function (nearByLocations) {
    if (!nearByLocations.length) return createUnkownCheckIn(location);
    if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
    loadLocationsCard(nearByLocations, location);
  })["catch"](function (error) {
    handleError({
      message: error.message,
      body: error
    });
  });
}

function createUnkownCheckIn(geopoint) {
  // document.getElementById("app-header").classList.add('hidden')
  var offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;

  if (offices.length == 1) {
    generateRequestForUnknownCheckin(offices[0], geopoint);
    return;
  }

  var officeCard = bottomCard('Choose office');
  offices.forEach(function (office) {
    var li = createList({
      primaryText: office,
      meta: 'navigate_next'
    });
    officeCard.ul.appendChild(li);
  });
  new mdc.list.MDCList(officeCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index);
    var selectedOffice = offices[evt.detail.index];
    generateRequestForUnknownCheckin(selectedOffice, geopoint);
    officeCard.card.classList.add('hidden');
  });
  dom_root.appendChild(officeCard.card);
}

function generateRequestForUnknownCheckin(office, geopoint) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };
  loadScreen('checkin');
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in';
  getRootRecord().then(function (rootRecord) {
    var timestamp = fetchCurrentTime(rootRecord.serverTime);
    var copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];
    copy.timestamp = timestamp;
    console.log('checkin body', copy);
    requestCreator('create', fillVenueInSub(copy, ''), geopoint).then(function () {
      ApplicationState.lastCheckInCreated = Date.now();
      ApplicationState.venue = '';
      ApplicationState.selectedOffice = office;
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      removeScreen();
      successDialog('Check-In Created');
      initProfileView();
    })["catch"](function (error) {
      console.log(error); // progressBar.close()

      var queryLink = getDeepLink();

      if (error.message === "No subscription found for the template: 'check-in' with the office '".concat(office, "'")) {
        if (queryLink && queryLink.get('action') === 'get-subscription') {
          handleCheckinRetryUnkown(retries, office, geopoint);
          return;
        }

        handleSubscriptionError();
        return;
      }

      if (error.message === 'Invalid check-in') {
        handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
          ApplicationState.location = newGeopoint;
          retries.invalidRetry++;
          generateRequestForUnknownCheckin(office, newGeopoint, retries);
        });
        return;
      }

      ;
    });
  });
}

function handleCheckinRetryUnkown(retries, office, geopoint) {
  if (retries.subscriptionRetry <= 2) {
    setTimeout(function () {
      retries.subscriptionRetry++;
      generateRequestForUnknownCheckin(office, geopoint, retries);
    }, 5000);
    return;
  }

  redirect('/index.html');
}

function handleInvalidCheckinLocation(callback) {
  if (_native.getName() === 'Android') {
    handleGeoLocationApi().then(callback)["catch"](function (error) {
      handleLocationError({
        message: ''
      });
    });
    return;
  }

  try {
    webkit.messageHandlers.locationService.postMessage('start');
    window.addEventListener('iosLocation', function _iosLocation(e) {
      callback(e.detail);
      window.removeEventListener('iosLocation', _iosLocation, true);
    }, true);
  } catch (e) {
    handleLocationError({
      message: ''
    });
  }
}

var bottomCard = function bottomCard(heading, listTwoLine) {
  var card = createElement('div', {
    className: 'mdc-card mdc-elevation--z16 mdc-card--outlined bottom-card'
  });
  card.appendChild(createElement('h1', {
    className: 'mdc-typography--headline6',
    textContent: heading
  }));
  var ul = createElement('ul', {
    className: 'mdc-list pt-0'
  });

  if (listTwoLine) {
    ul.classList.add('mdc-list--two-line', 'mdc-list--avatar-list');
  }

  card.appendChild(ul);
  return {
    ul: ul,
    card: card
  };
};

function loadLocationsCard(venues, geopoint) {
  ApplicationState.knownLocation = true;
  var locationCard = bottomCard('Choose duty location', true);
  venues.map(function (venue) {
    locationCard.ul.appendChild(createList({
      icon: 'location_on',
      primaryText: venue.location,
      secondaryText: venue.office,
      meta: 'navigate_next'
    }));
  });
  new mdc.list.MDCList(locationCard.ul).listen('MDCList:action', function (evt) {
    console.log(evt.detail.index);
    var selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue, geopoint);
    locationCard.card.classList.add('hidden'); // return;
  });
  dom_root.appendChild(locationCard.card);
}

;

function createKnownCheckIn(selectedVenue, geopoint) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };
  console.log(selectedVenue);
  var copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]));
  copy.share = []; // progressBar.open()

  loadScreen('checkin');
  document.querySelector('#checkin .loading-text--headline').textContent = 'Checking in at ' + selectedVenue.location;
  console.log('checkin body', copy); // return

  requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {
    ApplicationState.lastCheckInCreated = Date.now();
    ApplicationState.venue = selectedVenue;
    ApplicationState.selectedOffice = selectedVenue.office;
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    removeScreen();
    successDialog('Check-In Created');
    initProfileView();
  })["catch"](function (error) {
    console.log(error); // progressBar.close()

    var queryLink = getDeepLink();

    if (error.message === "No subscription found for the template: 'check-in' with the office '".concat(office, "'")) {
      if (queryLink && queryLink.get('action') === 'get-subscription') return handleCheckinRetryKnown(retries, geopoint, selectedVenue);
      handleSubscriptionError();
      return;
    }

    ;

    if (error.message === 'Invalid check-in') {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++;
        createKnownCheckIn(selectedVenue, newGeopoint, retries);
      });
      return;
    }

    ;
  });
}

function handleSubscriptionError() {
  navigator.serviceWorker.controller.postMessage({
    type: 'read'
  });

  navigator.serviceWorker.onmessage = function (event) {
    getCheckInSubs().then(function (subs) {
      if (!Object.keys(subs).length) return noOfficeFoundScreen();
      handleCheckin(geopoint);
    });
  };
}

function handleCheckinRetryKnown(retries, geopoint, selectedVenue) {
  if (retries.subscriptionRetry <= 2) {
    setTimeout(function () {
      retries.subscriptionRetry++;
      createKnownCheckIn(selectedVenue, geopoint, retries);
    }, 5000);
    return;
  }

  ;
  redirect('/index.html');
}

function snapView(selector) {
  document.querySelector(selector).innerHTML = "\n    <div class='snap-container'>\n    <h6 class='mdc-typography--headline5 text-center'>\n      Create a photo check-in\n    </h6>\n    <div class='landing-page-container text-center'>\n      <button class=\"mdc-fab mdc-fab--extended mdc-theme--primary-bg mdc-theme--on-primary\">\n        <div class=\"mdc-fab__ripple\"></div>\n        <span class=\"material-icons mdc-fab__icon\">camera</span>\n        <span class=\"mdc-fab__label\">Take photo</span>\n      </button>\n    </div>\n    </div>\n    ";
  document.querySelector('.snap-container .mdc-fab').addEventListener('click', openCamera);
  openCamera();
}

function mdcDefaultSelect(data, label, id, option) {
  var template = "<div class=\"mdc-select\" id=".concat(id, ">\n    <i class=\"mdc-select__dropdown-icon\"></i>\n    <select class=\"mdc-select__native-control\">\n    <option disabled selected></option>\n    ").concat(data.map(function (value) {
    return " <option value='".concat(value, "'>\n      ").concat(value, "\n      </option>");
  }).join(""), "\n  ").concat(option, "\n  \n    </select>\n    <label class='mdc-floating-label'>").concat(label, "</label>\n    <div class=\"mdc-line-ripple\"></div>\n  </div>");
  return template;
}

function getOrientation(image) {
  if (image.width > image.height) return 'landscape';
  if (image.height > image.width) return 'potrait';
  if (image.width == image.height) return 'square';
}