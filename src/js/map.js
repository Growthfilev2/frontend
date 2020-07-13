let selectedSubs;
var ApplicationState = JSON.parse(localStorage.getItem('ApplicationState')) || {
  location: '',
  venue: '',
  knownLocation: false,
  iframeVersion: 13,
}

function logReportEvent(name) {
  const deviceInfo = native.getInfo();
  if (native.getName() === 'Android' && deviceInfo.appVersion >= 14) {
    AndroidInterface.logEvent(name);
    return;
  }
  try {
    webkit.messageHandlers.logEvent.postMessage(name)
  } catch (e) {
    console.log(e)
  }
  return;
}

function failureScreen(error, callback) {


  document.getElementById('app-header').classList.add('hidden')

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

function handleLocationError(error) {
  let alertDialog;
  if (progressBar) {
    progressBar.close()
  }

  passFormData({
    name: 'toggleSubmit',
    template: '',
    body: '',
    deviceType: native.getName()
  })
  switch (error.message) {
    case 'THRESHOLD EXCEED':
      handleCheckin(error.body.geopoint)
      break;

    case 'BROKEN INTERNET CONNECTION':

      alertDialog = new Dialog(error.message, 'Please Check Your Internet Connection').create();
      alertDialog.open();
      break;

    case 'TURN ON YOUR WIFI':

      alertDialog = new Dialog(error.message, 'Enabling Wifi Will Help Growthfile Accurately Detect Your Location').create();
      alertDialog.open();
      break;

    default:
      handleError({
        message: error.message,
        body: {
          reason: error.body || error,
          stack: error.stack || ''
        }
      })

      alertDialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
      alertDialog.open();
      break;
  }
}

function mapView(location) {

  document.getElementById('app-header').classList.add('hidden');

  ApplicationState.location = location
  history.pushState(['mapView'], null, null);
  progressBar.close();

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
    dom_root.innerHTML = `
    <div id='map-view'>
      <div class="selection-box-auto" id='selection-box'>
          <div class="content-body"></div>
      </div>
    </div>`

    if (!nearByLocations.length) return createUnkownCheckIn(location)
    if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
    loadCardData(nearByLocations, location)
  })
}

function createUnkownCheckIn(geopoint) {
  document.getElementById("app-header").classList.add('hidden')
  const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;
  if (offices.length == 1) {
    generateRequestForUnknownCheckin(offices[0], geopoint)
    return
  }
  const header = setHeader('<span class="mdc-top-app-bar__title">Choose company</span>', '', 'app-header')
  header.root_.classList.remove("hidden");
  dom_root.classList.add("mdc-top-app-bar--fixed-adjust")
  const officeList = createElement('ul', {
    className: 'mdc-list pt-0'
  })
  offices.forEach(function (office) {
    const li = createList({
      primaryText: office
    });
    officeList.appendChild(li);
  })

  document.querySelector('#selection-box .content-body').appendChild(officeList)
  const ul = new mdc.list.MDCList(officeList)
  ul.singleSelection = true;
  ul.selectedIndex = 0;
  ul.listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    const selectedOffice = offices[evt.detail.index];
    generateRequestForUnknownCheckin(selectedOffice, geopoint)
  })
}


function generateRequestForUnknownCheckin(office, geopoint, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  loadingScreen({
    src: './img/fetching-location.jpg',
    text: 'Checking in ...'
  })
  getRootRecord().then(function (rootRecord) {
    const timestamp = fetchCurrentTime(rootRecord.serverTime)

    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];
    copy.timestamp = timestamp
    requestCreator('create', fillVenueInSub(copy, ''), geopoint).then(function () {

      successDialog('Check-In Created')
      ApplicationState.venue = ''
      ApplicationState.selectedOffice = office;
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      initProfileView()
    }).catch(function (error) {

      progressBar.close()
      const queryLink = getDeepLink();

      if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

        if (retries.subscriptionRetry <= 2) {
          setTimeout(function () {
            retries.subscriptionRetry++
            generateRequestForUnknownCheckin(office, geopoint, retries)
          }, 5000)
        }
        return
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


function handleInvalidCheckinLocation(retry, callback) {
  if (retry) return reloadPage();

  if (native.getName() === 'Android') {
    handleGeoLocationApi().then(callback).catch(function (error) {
      handleError({
        message: 'Geolocation failed to get data for retry attempt at invalid checkin',
        body: error
      });
      failureScreen({
        message: 'There was a problem in detecting your location.',
        icon: 'location_off',
        title: 'Failed To Detect Location'
      }, reloadPage);

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

    failureScreen({
      message: 'There was a problem in detecting your location.',
      icon: 'location_off',
      title: 'Failed To Detect Location'
    }, reloadPage);
  }
}



function loadCardData(venues, geopoint) {
  ApplicationState.knownLocation = true;
  const header = setHeader('<span class="mdc-top-app-bar__title">Choose your location</span>', '', 'app-header')
  header.root_.classList.remove("hidden");
  dom_root.classList.add("mdc-top-app-bar--fixed-adjust")
  // const venuesUl = createElement('ul',{
  //   className:'mdc-list mdc-list pt-0 mdc-list--two-line mdc-list--avatar-list'
  // })
  const venuesList = `<ul class='mdc-list mdc-list pt-0 mdc-list--two-line mdc-list--avatar-list' id='selected-venue'>
  ${venues.map(function(venue) {
      return `${venueList(venue)}`
  }).join("")}
</ul>`

  document.querySelector('#selection-box .content-body').innerHTML = venuesList;

  const ul = new mdc.list.MDCList(document.getElementById('selected-venue'))
  ul.singleSelection = true;
  ul.selectedIndex = 0;
  ul.listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    const selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue, geopoint);
  })
};

function createKnownCheckIn(selectedVenue, geopoint, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  console.log(selectedVenue)

  const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]))
  copy.share = []
  document.getElementById('app-header').classList.add('hidden')
  progressBar.open()
  loadingScreen({
    src: './img/fetching-location.jpg',
    text: 'Checking in at ' + selectedVenue.location
  })
  // return
  requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {
    successDialog('Check-In Created')
    ApplicationState.venue = selectedVenue;
    ApplicationState.selectedOffice = selectedVenue.office;

    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initProfileView()
  }).catch(function (error) {
    progressBar.close()
    const queryLink = getDeepLink();

    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++
          createKnownCheckIn(selectedVenue, geopoint, retries);
        }, 5000)
      }
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



function venueList(venue) {


  return `<li class='mdc-list-item venue-list-item  pl-0 pr-0'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">location_on</span>
    <span class="mdc-list-item__text">
      <span class="mdc-list-item__primary-text">${venue.location}</span>
      <span class="mdc-list-item__secondary-text">${venue.office}</span>
    </span>
    <span class="mdc-list-item__meta material-icons" aria-hidden="true">keyboard_arrow_right</span>
    </li>
  
    `


}


function toggleCardHeight(toggle, cardSelector) {
  const el = document.getElementById('map-view');
  const card = document.getElementById(cardSelector);
  if (toggle) {
    el.classList.add('hidden')
    card.classList.remove('hidden');
    card.style.height = '100%';
    document.getElementById('app-header').classList.add('hidden')

  } else {
    el.classList.remove('hidden');
    document.getElementById('selection-box').classList.remove('hidden');
    card.classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden')

  }
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

function openCamera() {
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}




function setFilePath(base64, retries = {
  subscriptionRetry: 0,
  invalidRetry: 0
}) {
  const url = `data:image/jpg;base64,${base64}`
  dom_root.innerHTML = `
  <div class='image-container'>
    <div id='snap' class="snap-bckg">
      <div class="form-meta snap-form">
        <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
            <textarea
            class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100"></textarea></div>
            <button id='snap-submit' class="mdc-fab app-fab--absolute  snap-fab mdc-theme--primary-bg  mdc-ripple-upgraded"
          style="z-index: 9;">
          <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
        </button>
      </div>
    </div>
  </div>
  `
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">Upload photo</span>
        `
  const header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden');
  const content = document.getElementById('snap')
  const textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'))
  const submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'))


  textarea.focus();
  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px'
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = (this.scrollHeight - 20) + "px";
    }
  });

  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;

  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;
    sendPhotoCheckinRequest({
      sub: ApplicationState.officeWithCheckInSubs[ApplicationState.selectedOffice],
      base64: url,
      retries: retries,
      textValue: textValue,
      knownLocation: true
    })
  })
}


function sendPhotoCheckinRequest(request) {
  const url = request.base64;
  const textValue = request.textValue;
  const retries = request.retries;
  const sub = JSON.parse(JSON.stringify(request.sub))
  sub.attachment.Photo.value = url || ''
  sub.attachment.Comment.value = textValue;
  sub.share = []
  history.back();
  requestCreator('create', fillVenueInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {
    successDialog('Photo uploaded');

  }).catch(function (error) {
    const queryLink = getDeepLink();
    if (queryLink && queryLink.get('action') === 'get-subscription' && error.message === `No subscription found for the template: 'check-in' with the office '${queryLink.get('office')}'`) {

      if (retries.subscriptionRetry <= 2) {
        setTimeout(function () {
          retries.subscriptionRetry++
          if (request.knownLocation) {
            createKnownCheckIn(ApplicationState.venue, geopoint, retries);
          } else {
            createUnkownCheckIn(sub.office, geopoint, retries);
          }
        }, 5000)
      }
      return
    }

    if (error.message === 'Invalid check-in') {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++
        setFilePath(base64, retries);
      });
      return
    };
  });
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


function mdcSelectVenue(venues, label, id) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  <option disabled selected value=${JSON.stringify('0')}></option>
  <option value=${JSON.stringify('1')}>UNKNOWN LOCATION</option>

  ${venues.map(function(value){
    return ` <option value='${JSON.stringify(value)}'>
    ${value.location}
    </option>`
  }).join("")}
  
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





function loadNearByLocations(o, location) {
  return new Promise(function (resolve, reject) {

    const result = []

    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);

    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!ApplicationState.officeWithCheckInSubs[cursor.value.office]) {
        cursor.continue();
        return;
      };
      if (calculateDistanceBetweenTwoPoints(location, cursor.value) > 1) {
        cursor.continue();
        return;
      }
      result.push(cursor.value)
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(result);
    }
  })
}