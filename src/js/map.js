var map;
var globMark;
let o;
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
var geocodeVenue = '';

function failureScreen(error, callback) {

  document.getElementById('start-load').classList.add('hidden');
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
  if (document.getElementById('check-in-prog')) {
    document.getElementById('check-in-prog').classList.add('mdc-linear-progress--closed')
  }

  switch (error.message) {
    case 'THRESHOLD EXCEED':
      mapView(error.body.geopoint)
      break;
    case 'BROKEN INTERNET CONNECTION':
      if (onAppOpen) {
        failureScreen({
          message: 'You Are Currently Offline. Please Check Your Internet Connection',
          icon: 'wifi_off',
          title: 'BROKEN INTERNET CONNECTION'
        }, openMap);
        return;
      }
      alertDialog = new Dialog(error.message, 'Please Check Your Internet Connection').create();
      alertDialog.open();
      break;

    case 'TURN ON YOUR WIFI':
      if (onAppOpen) {
        failureScreen({
          message: 'Enabling Wifi Will Help Growthfile Accurately Detect Your Location',
          icon: 'wifi_off',
          title: 'TURN ON YOUR WIFI'
        }, openMap);
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
        }, openMap);
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
  panel.classList.remove('mdc-top-app-bar--fixed-adjust', 'mdc-layout-grid', 'pl-0', 'pr-0');
  panel.innerHTML = mapDom();
  document.getElementById('map-view').style.height = '100%';

  const latLng = {
    lat: location.latitude,
    lng: location.longitude
  }
  console.log(latLng)
  const offsetBounds = new GetOffsetBounds(location, 1);
  const o = {
    north: offsetBounds.north(),
    south: offsetBounds.south(),
    east: offsetBounds.east(),
    west: offsetBounds.west()
  };

  if (!document.getElementById('map')) return;
  console.log(google);

  const map = new google.maps.Map(document.getElementById('map'), {
    center: latLng,
    zoom: 15,
    disableDefaultUI: true,
    restriction: {
      latLngBounds: o,
      strictBounds: true,
    },

  })

  var marker = new google.maps.Marker({
    position: latLng,
    icon: './img/bluecircle.png',
    map: map
  });

  var radiusCircle = new google.maps.Circle({
    strokeColor: '#89273E',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#89273E',
    fillOpacity: 0.35,
    map: map,
    center: latLng,
    radius: location.accuracy < 100 ?  location.accuracy * 2 : location.accuracy
  });

  google.maps.event.addListenerOnce(map, 'idle', function () {
    console.log('idle_once');
    loadNearByLocations(o, map, location).then(function (nearByLocations) {
      ApplicationState.nearByLocations = nearByLocations;
      if (!nearByLocations.length) return createUnkownCheckIn('', location)
      if (nearByLocations.length == 1) return createKnownCheckIn(nearByLocations[0], '', location);
      document.getElementById('map').style.display = 'block'
      loadCardData(nearByLocations, map, location)
    })
  });
}

function createUnkownCheckIn(cardProd, geopoint) {
  document.getElementById('start-load').classList.remove('hidden');

  const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;
  const prom = []
  offices.forEach(function (office) {
    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    copy.share = [];

    prom.push(requestCreator('create', fillVenueInCheckInSub(copy, ''), geopoint))
  })

  if (cardProd) {
    cardProd.open()
  }
  Promise.all(prom).then(function () {
    if (cardProd) {
      cardProd.close()
    }
    document.getElementById('start-load').classList.add('hidden');

    successDialog('Check-In Created')
    ApplicationState.venue = ''
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initHeaderView()
    // history.pushState(['homeView'],null,null)

    history.pushState(['reportView'], null, null)
    reportView()
  }).catch(function (error) {
    document.getElementById('start-load').classList.add('hidden');

    snacks(error.response.message);
    if (cardProd) {
      cardProd.close()
    }
  })
}

function loadCardData(venues, map, geopoint) {
  document.getElementById('start-load').classList.add('hidden');
  ApplicationState.knownLocation = true;
  const venuesList = `<ul class='mdc-list mdc-list pt-0 mdc-list--two-line mdc-list--avatar-list' id='selected-venue'>
  ${venues.map(function(venue) {
      return `${venueList(venue)}`
  }).join("")}
  <li class='mdc-list-divider'></li>
  ${loadUnkwown()}
</ul>`
  document.querySelector('#selection-box').classList.remove('hidden')
  document.querySelector('#selection-box #card-primary').textContent = 'Choose location';
  document.querySelector('#selection-box .content-body').innerHTML = venuesList;
  document.getElementById('map').style.height = `calc(100vh - ${document.querySelector('#selection-box').offsetHeight - 52}px)`;
  const cardProd = new mdc.linearProgress.MDCLinearProgress(document.getElementById('check-in-prog'));

  const ul = new mdc.list.MDCList(document.getElementById('selected-venue'))
  ul.singleSelection = true;
  ul.selectedIndex = 0;
  ul.listen('MDCList:action', function (evt) {
    console.log(evt.detail.index)
    if (evt.detail.index == venues.length) return createUnkownCheckIn(cardProd, geopoint);
    focusMarker(map, markersObject, evt.detail.index)
    cardProd.open();
    const selectedVenue = venues[evt.detail.index];
    createKnownCheckIn(selectedVenue, '', geopoint);
  })
};

function createKnownCheckIn(selectedVenue, cardProd, geopoint) {

  const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[selectedVenue.office]))
  copy.share = []
  if (cardProd) {
    cardProd.open();
  }

  requestCreator('create', fillVenueInCheckInSub(copy, selectedVenue), geopoint).then(function () {

    successDialog('Check-In Created')
    ApplicationState.venue = selectedVenue
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    initHeaderView()
    // history.pushState(['homeView'],null,null)
    history.pushState(['reportView'], null, null)
    reportView();
  }).catch(function (error) {
    snacks(error.response.message);
    if (cardProd) {
      cardProd.close()
    }
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
  return `<div class="selection-box-auto hidden" id='selection-box'>

  <div class="card__primary">
    <h2 class="demo-card__title mdc-typography mdc-typography--headline6 margin-auto" id='card-primary'>
    </h2>
  </div>
  <div role="progressbar"
    class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed"
    id='check-in-prog'>
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


function mapDom() {
  return `
  <div id='map-view' class=''>
    <div id='map'></div>
      ${selectionBox()}
    </div>
  `
}

function snapView() {
  setFilePath();
  // if (native.getName() === "Android") {
  //   AndroidInterface.startCamera("setFilePath");
  //   return
  // }
  // webkit.messageHandlers.startCamera.postMessage("setFilePath")

}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {

  // const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  // const header = getHeader('app-header', backIcon, '');
  // header.root_.classList.remove('hidden')

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
    progressBar.open();

    requestCreator('create', fillVenueInCheckInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {
      initHeaderView()
      // history.pushState(['homeView'],null,null)
      history.pushState(['reportView'], null, null)
      reportView()
      successDialog('Check-In Created')
      progressBar.close()
    }).catch(function (error) {
      progressBar.close()
      snacks(error.response.message)
    })
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

function focusMarker(map, markersObject, index) {
  const marker = markersObject.markers[index];
  const info = markersObject.infowindow[index];
  info.setContent(`<span>${marker.title}</span>`)
  info.open(map, marker)
  map.panTo(marker.position);
  map.setZoom(18);
}




function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {
    markersObject.markers = [];
    markersObject.infowindow = []
    var infowindow = new google.maps.InfoWindow();
    const result = []
    let lastOpen;
    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
    const bounds = map.getBounds();

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


      var marker = new google.maps.Marker({
        position: {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        },
        title: cursor.value.location,
        icon: {
          url: './img/m.png',
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        },
        id: cursor.value.activityId,
        value: JSON.stringify(cursor.value)
      });


      marker.setMap(map);

      const content = `<span>${cursor.value.location}</span>`
      google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
        return function () {
          if (lastOpen) {
            lastOpen.close();
          };
          infowindow.setContent(content);
          infowindow.open(map, marker);
          lastOpen = infowindow;
        };
      })(marker, content, infowindow));
      markersObject.markers.push(marker)
      markersObject.infowindow.push(infowindow);

      bounds.extend(marker.getPosition())
      cursor.continue();
    }
    tx.oncomplete = function () {
      map.fitBounds(bounds);
      return resolve(result)
    }
  })
}