
let selectedSubs;

ApplicationState = JSON.parse(localStorage.getItem('ApplicationState')) || {
  location: '',
  knownLocation: false,
  venue: '',
  iframeVersion: 13,
  nearByLocations: []
}

var markersObject = {
  markers: [],
  infowindow: []
}

function logReportEvent(name) {
  const deviceInfo = JSON.parse(native.getInfo());
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

  document.getElementById('app-current-panel').innerHTML = `
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

function handleLocationError(error, onAppOpen) {
  let alertDialog;
  if (progressBar) {
    progressBar.close()
  }
  if (document.getElementById('selection-box-prog')) {
    document.getElementById('selection-box-prog').classList.add('mdc-linear-progress--closed')
  }
  passFormData({
    name: 'toggleSubmit',
    template: '',
    body: '',
    deviceType: native.getName()
  })
  switch (error.message) {
    case 'THRESHOLD EXCEED':
      if (history.state)
        mapView(error.body.geopoint);
      break;

    case 'BROKEN INTERNET CONNECTION':
      if (onAppOpen) {
        failureScreen({
          message: 'You Are Currently Offline. Please Check Your Internet Connection',
          icon: 'wifi_off',
          title: 'BROKEN INTERNET CONNECTION'
        }, function () {
          loadingScreen();
          openMap();
        });
        return;
      };
      alertDialog = new Dialog(error.message, 'Please Check Your Internet Connection').create();
      alertDialog.open();
      break;

    case 'TURN ON YOUR WIFI':
      if (onAppOpen) {
        failureScreen({
          message: 'Enabling Wifi Will Help Growthfile Accurately Detect Your Location',
          icon: 'wifi_off',
          title: 'TURN ON YOUR WIFI'
        }, function () {
          loadingScreen();
          openMap();
        });
        return;
      }
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
      if (onAppOpen) {
        failureScreen({
          message: 'There was a problem in detecting your location. Please try again later',
          icon: 'location_off',
          title: 'Failed To Detect Location'
        }, function () {
          loadingScreen();
          openMap();
        });
        return;
      }
      alertDialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
      alertDialog.open();
      break;
  }
}

function mapView(location) {

  document.getElementById('app-header').classList.add('hidden');

  ApplicationState.location = location
  history.pushState(['mapView'], null, null);
  const panel = document.getElementById('app-current-panel')
  panel.classList.remove('pl-0', 'pr-0');
  progressBar.close();
  
  panel.innerHTML = `
    <div id='map-view' class=''>
      ${selectionBox()}
    </div>
  `

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
  },location).then(function (nearByLocations) {
    ApplicationState.nearByLocations = nearByLocations;
    if (!nearByLocations.length) return createUnkownCheckIn(location)
    if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], location);
    loadCardData(nearByLocations, location)
  })
  
}

function createUnkownCheckIn(geopoint, retry) {
  loadingScreen()
  document.getElementById("app-header").classList.add('hidden')
  const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;
  const prom = []
  offices.forEach(function (office) {
    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];
    prom.push(requestCreator('create', fillVenueInSub(copy, ''), geopoint))
  })

  progressBar.open()
  Promise.all(prom).then(function () {

    successDialog('Check-In Created')
    ApplicationState.venue = ''
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));

    initProfileView()

  }).catch(function (error) {

    progressBar.close()

    if (error.message === 'Invalid check-in') {

      handleInvalidCheckinLocation(retry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        createUnkownCheckIn(newGeopoint, true);
      });
      return
    };
    
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
  const header = setHeader('<span class="mdc-top-app-bar__title">Choose location</span>','','app-header')
  header.root_.classList.remove("hidden")
  const venuesList = `<ul class='mdc-list mdc-list pt-0 mdc-list--two-line mdc-list--avatar-list' id='selected-venue'>
  ${venues.map(function(venue) {
      return `${venueList(venue)}`
  }).join("")}
  <li class='mdc-list-divider'></li>
  ${loadUnkwown()}
</ul>`

  document.querySelector('#selection-box .content-body').innerHTML = venuesList;
  
  const ul = new mdc.list.MDCList(document.getElementById('selected-venue'))
  ul.singleSelection = true;
  ul.selectedIndex = 0;
  ul.listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    if (evt.detail.index == venues.length) return createUnkownCheckIn(geopoint);
   

    const selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue,geopoint);
  })
  logFirebaseAnlyticsEvent('map_view_check-in');
};

function createKnownCheckIn(selectedVenue, geopoint, retry) {

  const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]))
  copy.share = []
 
  progressBar.open()

  requestCreator('create', fillVenueInSub(copy, selectedVenue), geopoint).then(function () {

    successDialog('Check-In Created')
    ApplicationState.venue = selectedVenue
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initProfileView()
  }).catch(function (error) {
    progressBar.close()

    if (error.message === 'Invalid check-in') {

      handleInvalidCheckinLocation(retry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        createKnownCheckIn(selectedVenue, newGeopoint, true);
      });
      return
    };

    
  })
}

function loadUnkwown() {
  return ` <li class='mdc-list-item venue-list-item  pl-0 pr-0'>
  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">location_on</span>
    Unknown location
    <span class="mdc-list-item__meta material-icons" aria-hidden="true">keyboard_arrow_right</span>
  </li>`
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


function newOfficeView() {

}

  
function selectionBox() {
  return `<div class="selection-box-auto" id='selection-box'>

  <div role="progressbar"
    class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed"
    id='selection-box-prog'>
    <div class="mdc-linear-progress__buffering-dots"></div>
    <div class="mdc-linear-progress__buffer"></div>
    <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
      <span class="mdc-linear-progress__bar-inner"></span>
    </div>
    <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
      <span class="mdc-linear-progress__bar-inner"></span>
    </div>
  </div>

  <div class="content-body">
  </div>
  </div>
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

function setFilePath(base64, retry) {

  
  const url = `data:image/jpg;base64,${base64}`
  document.querySelector('.tabs-section .data-container').innerHTML = `

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

    const sub = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[photoOffice]))

    sub.attachment.Photo.value = url
    sub.attachment.Comment.value = textValue;
    sub.share = []

    requestCreator('create', fillVenueInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {

      history.pushState(['reportView'], null, null)
      reportView()
      successDialog('Check-In Created')
    }).catch(function (error) {
      if (error.message === 'Invalid check-in') {
        handleInvalidCheckinLocation(retry, function (newGeopoint) {
          ApplicationState.location = newGeopoint;
          setFilePath(base64, true);
        });
        return
      };
    });
  })
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
    markersObject.markers = [];
    markersObject.infowindow = []
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
      return resolve(result)
    }
  })
}