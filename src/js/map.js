var map;
var globMark;

function handleNav(evt) {
  const state = history.state[0]
  if (state === 'profileView' || state === 'snapView' || state === 'chatView') {
    return history.back();
  }
  return profileView();
}

function mapView() {
  history.pushState(['mapView'], null, null);
  progressBar.close();
  const headerImage = `<img  class="material-icons mdc-top-app-bar__navigation-icon mdc-theme--secondary header-photo" src='./img/empty-user.jpg'>`
  const chatIcon = `<span class="material-icons mdc-top-app-bar__action-item mdc-theme--secondary" aria-label="chat" onclick="chatView()">chat</a>`
  const header = getHeader(headerImage, chatIcon);

  header.navIcon_.src = firebase.auth().currentUser.photoURL;

  header.listen('MDCTopAppBar:nav', handleNav);

  document.getElementById('app-current-panel').innerHTML = mapDom();
  document.getElementById('map-view').style.height = '100%';

  manageLocation().then(function (location) {

    document.getElementById('start-loader').classList.add('hidden');

    const latLng = {
      lat: location.latitude,
      lng: location.longitude
    }
    console.log(latLng)
    const offsetBounds = new GetOffsetBounds(location, 0.5);
    console.log({
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    })
    console.log(latLng)
    const o = {
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    };
    if (!document.getElementById('map')) return;
    map = new google.maps.Map(document.getElementById('map'), {
      center: latLng,
      zoom: 18,
      // maxZoom:18,
      disableDefaultUI: true,
      styles: gray,
      restriction: {
        latLngBounds: {
          north: offsetBounds.north(),
          south: offsetBounds.south(),
          east: offsetBounds.east(),
          west: offsetBounds.west()
        },
        strictBounds: true,
        // strictBounds: false,
      },
      // mapTypeId: google.maps.MapTypeId.ROADMAP
    })

    var marker = new google.maps.Marker({
      position: latLng,
      icon: 'https://www.robotwoods.com/dev/misc/bluecircle.png'
    });
    marker.setMap(map);

    var radiusCircle = new google.maps.Circle({
      strokeColor: '#0399f4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0399f4',
      fillOpacity: 0.35,
      map: map,
      center: latLng,
      radius: location.accuracy
    });


    google.maps.event.addListenerOnce(map, 'idle', function () {
      console.log('idle_once');
      loadNearByLocations(o, map, location).then(function (markers) {

        const el = document.getElementById('selection-box');
        const contentBody = el.querySelector('.content-body');
        const cardHeaderText = `Hello, ${firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber }`;
        el.querySelector('#card-header').textContent = cardHeaderText
        el.classList.remove('hidden');

        contentBody.innerHTML = `<div>
        ${mdcSelectVenue(markers, 'Where Are You ?','select-venue')}
        <div id='office-cont' class='pt-10'></div>
        <div id='subs-cont' class='pt-10'></div>
        <div id='submit-cont' class='pt-10'></div>
        </div>`
        selectVenue = new mdc.select.MDCSelect(document.getElementById('select-venue'));

        selectVenue.listen('MDCSelect:change', (evt) => {
          console.log(evt.detail.value)
          if (!evt.detail.value) return;
          const value = JSON.parse(evt.detail.value)
          if (value === 1 || value === 0) {
            const newSubs = []

            getUniqueOfficeCount().then(function (offices) {
              if (!offices.length) return;

              document.getElementById('office-cont').innerHTML = `${mdcDefaultSelect(offices,'Choose Office','choose-office')}`
              const selectOfficeInit = new mdc.select.MDCSelect(document.getElementById('choose-office'));
              selectOfficeInit.listen('MDCSelect:change', function (evt) {
                getSubscription(evt.detail.value, 'check-in').then(function (checkInSub) {
                  if (!checkInSub) return;
                  requestCreator('create', setVenueForCheckIn([], checkInSub));
                  checkForVenueSubs().then(function (venueSubs) {
                    if (!venueSubs.length) return;
                    document.getElementById('subs-cont').innerHTML = `${mdcDefaultSelect(newSubs, 'Choose','select-subs')}`
                    const subsSelect = new mdc.select.MDCSelect(document.getElementById('select-subs'))
                    subsSelect.selectedIndex = 0
                    subsSelect.listen('MDCSelect:change',function(evt){
                      document.getElementById('submit-cont').innerHTML = `<button class='mdc-button'>Create ${evt.detail.value}</button>`
                    })
                  });
                });
              });
              if (offices.length == 1) {
                selectOfficeInit.selectedIndex = 0
              }
              if (offices.length > 1) {
                selectOfficeInit.selectedIndex = -1
              }
            })
            return;
          }

          document.getElementById('office-cont').innerHTML = ''
          document.getElementById('subs-cont').innerHTML = ''
          document.getElementById('submit-cont').innerHTML = ''

          getSubscription(value.office, 'check-in').then(function (result) {
            requestCreator('create', setVenueForCheckIn([value], result));
            getAvailbleSubs(value).then(function (subs) {
              if (!subs.length) return;
              document.getElementById('subs-cont').innerHTML = `${mdcDefaultSelect(subs, 'Choose','select-subs')}`
              const subsSelect = new mdc.select.MDCSelect(document.getElementById('select-subs'))
              subsSelect.selectedIndex = -1
              subsSelect.listen('MDCSelect:change', function (evt) {
                document.getElementById('submit-cont').innerHTML = `<button class='mdc-button'>Create ${evt.detail.value}</button>`
              })
            })
          })
        });

        if (!markers.length) {
          selectVenue.selectedIndex = 0
        }
        if (markers.length == 1) {
          selectVenue.selectedIndex = 1
        }
        if (markers.length > 1) {
          selectVenue.selectedIndex = -1
        }
      })
    });


  }).catch(function (error) {
    console.log(error);
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    document.getElementById('start-loader').classList.add('hidden');
    document.getElementById('map').innerHTML = '<div><p>Failed To Detect You Location</p><button class="mdc-button" onclick=mapView()>Try Again</button></div>'
  })
}



function addSnapControl(map, office) {
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();

  var snapControlDiv = document.createElement('div');
  var snapControl = new TakeSnap(snapControlDiv, office);
  snapControlDiv.index = 1;

  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(snapControlDiv);

}

function getAvailbleSubs(venue) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions']);
      const store = tx.objectStore('subscriptions');
      const index = store.index('office');
      const result = [];
      index.openCursor(venue.office).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
          if (cursor.value.attachment[attachmentName].type === venue.template) {
            result.push(cursor.value.template)
          }

        })
        cursor.continue();
      }
      tx.oncomplete = function () {
        resolve(result)
      }
    }
  })
}

function newLocationSelectionForm(options) {
  return `<ul class="mdc-list" role="radiogroup" id='new-location-selection'>
  ${options.map(function(option){
    return `<li class="mdc-list-item" role="radio" aria-checked="false">
    <span class="mdc-list-item__graphic">
      <div class="mdc-radio">
        <input class="mdc-radio__native-control"
              type="radio"
              id=${option.id}
              name=${option.name}
              value=${option.value}>
        <div class="mdc-radio__background">
          <div class="mdc-radio__outer-circle"></div>
          <div class="mdc-radio__inner-circle"></div>
        </div>
      </div>
    </span>
    <label class="mdc-list-item__text" for=${option.id}>${option.label}</label>
  </li>`
  }).join("")}
  </ul>
`
}

function mapDom() {
  return `
  <div id='map-view' class='mdc-top-app-bar--dense-fixed-adjust'>
    <div id='map'></div>
    <div class="mdc-card card basic-with-header selection-box-auto hidden" id='selection-box'>
      <div class="card__primary">
        <h2 class="demo-card__title mdc-typography mdc-typography--headline6 margin-auto" id='card-header'></h2>

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
      <div class="card__secondary mdc-typography mdc-typography--body2">
        <!-- 'mdc-card__primary-action card__primary-action' -->
        <div class="content-body">

        </div>
        <div id='submit-cont' class='hidden'>
          <button class="demo-button mdc-button mdc-theme--primary-bg mdc-theme--secondary" id='submit-check-in'><span
              class="mdc-button__label">SUBMIT</span></button>
        </div>
      </div>

      <!-- <div class="mdc-card__actions">
        </div> -->
    </div>
  </div>`
}

function getAdddress(location) {
  return new Promise(function (resolve, reject) {

    const latLng = {
      lat: location.latitude,
      lng: location.longitude
    }
    const geocoder = new google.maps.Geocoder;
    geocoder.geocode({
      'location': latLng
    }, function (results, status) {

      if (status !== 'OK') return reject({
        message: 'Geocoder failed due to: ' + status
      })
      if (!results[0]) return reject({
        message: 'No Results Found'
      })
      return resolve(results[0].formatted_address)
    })
  })
}

function checkForVenueSubs() {
  return new Promise(function (resolve, reject) {


    const req = indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['subscriptions']);
      const store = tx.objectStore('subscriptions');
      const result = []
      store.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return
        if (cursor.value.template === 'check-in') {
          cursor.continue();
          return;
        }
        if (!cursor.value.venue[0]) {
          cursor.continue();
          return;
        }
        result.push(cursor.value)
        cursor.continue();
      }
      tx.oncomplete = function () {
        resolve(result)
      }

    }
  })
}

function ChatControl(chatDiv) {

  const chat = new Fab('chat').getButton();
  chat.root_.id = 'recenter-action'
  chat.root_.classList.add('custom-control', 'right', 'mdc-theme--primary-bg', 'mdc-theme--secondary');
  chatDiv.appendChild(chat.root_);
  chat.root_.addEventListener('click', function () {});
}

function TakeSnap(el, office) {

  const snap = new Fab('photo_camera').getButton();
  snap.root_.id = 'take-snap';
  snap.root_.classList.add('custom-control', 'right', 'mdc-theme--primary-bg')
  el.appendChild(snap.root_);
  snap.root_.addEventListener('click', function () {

    console.log('clicked')
    localStorage.setItem('snap_office', office)
    AndroidInterface.startCamera();
    // setFilePath();
  });

}

function setFilePath(base64) {
  const backIcon = `<a class='material-icons mdc-top-app-bar__navigation-icon mdc-theme--on-primary'>arrow_back</a>`
  const header = getHeader(backIcon, '');
  history.pushState(['snapView'], null, null)
  const url = `data:image/jpg;base64,${base64}`
  document.getElementById('app-current-panel').innerHTML = `
  
<div id='snap' class="snap-bckg" style="background-image: url(${url}); padding: 0px; overflow: hidden; background-size: cover;">
<div class="form-meta snap-form">
  <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
      <textarea
      class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100" autofocus="true"></textarea></div>
      <button id='snap-submit' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"
    style="z-index: 9;"><i class="mdc-fab__icon material-icons">send</i>
    </button>
</div>
</div>
  `
  const content = document.getElementById('snap')
  const textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'))
  const submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'))


  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px'
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = (this.scrollHeight - 20) + "px";
    }
  });
  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;

    getSubscription(localStorage.getItem('snap_office'), 'check-in').then(function (sub) {
      sub.attachment.Photo.value = url
      sub.attachment.Comment.value = textValue;
      progressBar.open();
      requestCreator('create', setVenueForCheckIn([], sub))
      history.back();
    })
  })

  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    content.style.padding = '0px'
    content.style.overflow = 'hidden'
    content.classList.add('snap-bckg');

    if (orientation == 'potrait') {
      content.style.backgroundSize = 'cover'
    }
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;

}

function mdcDefaultSelect(data, label, id) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
 
  ${data.map(function(value){
    return ` <option value='${value}'>
    ${value}
    </option>`
}).join("")}
  </select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}


function mdcSelectVenue(venues, label, id) {
  let float;
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">

  <option value=${JSON.stringify('1')}>New Venue</option>
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

function focusMarker(map, latLng, zoom) {
  map.setZoom(zoom);
  map.panTo(latLng);
}

function GetOffsetBounds(latlng, offset) {
  const radius = 6378
  const d = (180 / Math.PI);
  this.latLng = latlng
  this.ratio = (offset / radius) * d;
  this.radioLon = (this.ratio) / Math.cos(this.latLng.latitude * Math.PI / 180)

}
GetOffsetBounds.prototype.north = function () {
  return this.latLng.latitude + this.ratio
}
GetOffsetBounds.prototype.south = function () {
  return this.latLng.latitude - this.ratio
}
GetOffsetBounds.prototype.east = function () {
  return this.latLng.longitude + this.radioLon
}
GetOffsetBounds.prototype.west = function () {
  return this.latLng.longitude - this.radioLon
}

function getMapBounds(map) {
  const northEast = map.getBounds().getNorthEast()
  const southWest = map.getBounds().getSouthWest()

  return {
    ne: [northEast.lat(), northEast.lng()],
    sw: [southWest.lat(), southWest.lng()]
  }
}

function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {
    var markerImage = new google.maps.MarkerImage(
      './img/marker.png',
      new google.maps.Size(30, 30), //size
      null, //origin
      null, //anchor
      new google.maps.Size(30, 30) //scale
    );
    var infowindow = new google.maps.InfoWindow();
    const result = []
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    let lastOpen;
    let lastCursor;
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['map'])
      const store = tx.objectStore('map');
      const index = store.index('bounds');
      const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
      const bounds = map.getBounds()
      index.openCursor(idbRange).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.location || !cursor.value.latitude || !cursor.value.longitude) {
          cursor.continue();
          return;
        };
        if (lastCursor) {
          if (lastCursor.lat === cursor.value.latitude && lastCursor.lng === cursor.value.longitude) {
            cursor.continue();
            return;
          }
        }

        var marker = new google.maps.Marker({
          position: {
            lat: cursor.value.latitude,
            lng: cursor.value.longitude
          },

          icon: {
            url: './img/marker.png',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
          },
          id: cursor.value.activityId,
          value: JSON.stringify(cursor.value)
        });
        if (calculateDistanceBetweenTwoPoints(location, {
            latitude: cursor.value.latitude,
            longitude: cursor.value.longitude
          }) < 0.5) {
          marker.setMap(map);
          const content = `<span>${cursor.value.activityId}</span>`
          google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
            return function () {
              if (lastOpen) {
                lastOpen.close();
              }

              infowindow.setContent(content);
              infowindow.open(map, marker);
              lastOpen = infowindow;

            };
          })(marker, content, infowindow));
          result.push(cursor.value)
          bounds.extend(marker.getPosition())
        } else {
          console.log(calculateDistanceBetweenTwoPoints({
            latitude: location.latitude,
            longitude: location.longitude
          }, {
            latitude: cursor.value.latitude,
            longitude: cursor.value.longitude
          }))
          console.log(cursor.value)
        }
        lastCursor = {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        };
        cursor.continue();
      }
      tx.oncomplete = function () {
        map.fitBounds(bounds);
        return resolve(result)
      }
    }
  })
}