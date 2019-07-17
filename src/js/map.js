var map;
var globMark;
let o;
let selectedSubs;
ApplicationState = {
  office: '',
  location: '',
  knownLocation: false,
  venue: '',
  iframeVersion: 5,
  idToken: ''
}



function mapView(location) {
  history.pushState(['mapView'], null, null);
  document.getElementById('start-load').classList.add('hidden');
  document.getElementById('app-header').classList.add('hidden')
  document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust');
  const panel = document.getElementById('app-current-panel')
  panel.innerHTML = mapDom();
  panel.classList.remove('user-detail-bckg', 'mdc-top-app-bar--fixed-adjust')
  document.getElementById('map-view').style.height = '100%';

  if (!location) {
    document.getElementById('start-load').classList.add('hidden')
    document.getElementById('map').innerHTML = '<div class="center-abs"><p>Failed To Detect You Location</p><button class="mdc-button" id="try-again">Try Again</button></div>'
    const btn = new mdc.ripple.MDCRipple(document.getElementById('try-again'))
    btn.root_.onclick = function () {
      document.getElementById('start-load').classList.remove('hidden')
      openMap();
    }
    return
  }
  ApplicationState.location = location
  firebase.auth().currentUser.reload()
  console.log("auth relaoderd")
  document.getElementById('start-load').classList.add('hidden');

  const latLng = {
    lat: location.latitude,
    lng: location.longitude
  }
  console.log(latLng)
  const offsetBounds = new GetOffsetBounds(location, 0.5);


  o = {
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

    restriction: {
      latLngBounds: {
        north: offsetBounds.north(),
        south: offsetBounds.south(),
        east: offsetBounds.east(),
        west: offsetBounds.west()
      },
      strictBounds: true,

    },

  })

  var marker = new google.maps.Marker({
    position: latLng,
    icon: 'https://www.robotwoods.com/dev/misc/bluecircle.png'
  });
  marker.setMap(map);

  var radiusCircle = new google.maps.Circle({
    strokeColor: '#89273E',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#89273E',
    fillOpacity: 0.35,
    map: map,
    center: latLng,
    radius: location.accuracy
  });


  google.maps.event.addListenerOnce(map, 'idle', function () {
    console.log('idle_once');
    loadNearByLocations(o, map, location).then(function (markers) {
      loadCardData(markers)
    })
  });


}



function loadCardData(markers) {

  const el = document.getElementById('selection-box');
  const aside = el.querySelector('aside');

  const contentBody = el.querySelector('.content-body');
  contentBody.innerHTML = '';

  const header = document.getElementById('card-primary');
  const cardProd = new mdc.linearProgress.MDCLinearProgress(document.getElementById('check-in-prog'));
  header.textContent = `Where Are You`;
  el.classList.remove('hidden');



  contentBody.innerHTML = `<div>
    ${mdcSelectVenue(markers, 'Where Are You ?','select-venue')}
    <div id='office-cont' class='pt-10'></div>
    <div id='subs-cont' class='pt-10'></div>
    <div id='submit-cont' class='pt-10'></div>
    </div>`

  selectVenue = new mdc.select.MDCSelect(document.getElementById('select-venue'));
  selectVenue.listen('MDCSelect:change', (evt) => {
    document.getElementById('office-cont').innerHTML = ''
    document.getElementById('subs-cont').innerHTML = ''
    document.getElementById('submit-cont').innerHTML = ''
    console.log(evt.detail.value)
    aside.classList.add('open')
    const value = JSON.parse(evt.detail.value)
    if (!value) return;
    if (value === 1) {
      ApplicationState.knownLocation = false;
      ApplicationState.venue = '';
      ApplicationState.office = '';
      getUniqueOfficeCount().then(function (offices) {
        if(!offices.length) {
          showNoOfficeFound();
          return;
        };
        document.getElementById('office-cont').innerHTML = `${mdcDefaultSelect(offices,'Choose Office','choose-office')}`
        const selectOfficeInit = new mdc.select.MDCSelect(document.getElementById('choose-office'));
        selectOfficeInit.listen('MDCSelect:change', function (evt) {
          if (!evt.detail.value) return;
          ApplicationState.office = evt.detail.value
          getSubscription(evt.detail.value, 'check-in').then(function (checkInSub) {
            console.log(checkInSub)
            if (!checkInSub) return getSuggestions()
            cardProd.open();

            requestCreator('create', setVenueForCheckIn('', checkInSub)).then(function () {
              snacks('Check-in created');
              cardProd.close()
              getSuggestions()
            }).catch(function (error) {
              snacks(error.response.message);
              cardProd.close()
            })
          });
        });
        if (offices.length == 1) {
          selectOfficeInit.selectedIndex = 1
        }
        if (offices.length > 1) {
          selectOfficeInit.selectedIndex = 0
        }
      })
      return;
    }

    ApplicationState.knownLocation = true;
    ApplicationState.venue = value;
    ApplicationState.office = value.office;
    getSubscription(value.office, 'check-in').then(function (result) {
      if (!result) return getSuggestions();

      document.getElementById('submit-cont').innerHTML = `<button id='confirm' class='mdc-button mdc-theme--primary-bg mdc-theme--text-primary-on-light'>
        <span class='mdc-button__label'>Confirm</span>
        </button>`
      const confirm = new mdc.ripple.MDCRipple(document.getElementById('confirm'));

      confirm.root_.onclick = function () {
        confirm.root_.classList.add('hidden')
        cardProd.open();
        requestCreator('create', setVenueForCheckIn(value, result)).then(function () {
          snacks('Check-in created');
          cardProd.close();
          getSuggestions();
        }).catch(function (error) {
          console.log(error)
          confirm.root_.classList.remove('hidden');
          snacks(error.response.message);
          cardProd.close()
        })
      }
    })
  });

  if (!markers.length) {
    selectVenue.selectedIndex = 1;
  };

  if (markers.length == 1) {
    selectVenue.selectedIndex = 2;
  };

  if (markers.length > 1) {
    selectVenue.selectedIndex = 0;
  }

};

function showNoOfficeFound(){
  const content = `<h3 class='mdc-typography--headline6'>No Office Found For ${firebase.auth().currentUser.phoneNumber}</h3>
  <p>Please Contact Your Administrator</p>
  `
  const dialog = new Dialog('No Office Found',content).create('simple');
  dialog.scrimClickAction = ''
  dialog.open();
}

function getAllSubscriptions() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction("subscriptions");
    const result = [];
    tx.objectStore('subscriptions').openCursor().onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
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

function hideBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.add('hidden');
}

function showBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.remove('hidden');
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
    <div  class="overlay selection-box-auto hidden" id='selection-box'>
              <aside class="social" tabindex="-1" role="dialog" aria-labelledby="modal-label" aria-hidden="true">
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
                <div id='submit-cont'>
                </div>
              </aside>
            </div>

  `
}

function snapView() {
  // localStorage.setItem('snap_office', office)
  history.pushState(['snapView'], null, null)
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath")
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {

  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  const header = getHeader('app-header', backIcon, '');
  header.root_.classList.remove('hidden')
  document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')

  const url = `data:image/jpg;base64,${base64}`
  document.getElementById('app-current-panel').innerHTML = `

  <div class='image-container'>
  <div id='snap' class="snap-bckg">
  <div class="form-meta snap-form">
    <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
        <textarea
        class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100"></textarea></div>
        <button id='snap-submit' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"
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
  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;
    getUniqueOfficeCount().then(function (offices) {
      if (!offices.length) return;
      if (offices.length == 1) {
        getSubscription(offices[0], 'check-in').then(function (sub) {
          if (!sub) {
            snacks('Check-in Subscription not available')
            history.back();
            return
          }
          sub.attachment.Photo.value = url
          sub.attachment.Comment.value = textValue;
          progressBar.open();
          requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
            getSuggestions()
            snacks('Check-In Created')
          }).catch(function (error) {
            snacks(error.message)

          })
        })
        return
      }
      if (offices.length > 1) {
        const template = `<ul class='mdc-list' role='radiogroup' id='dialog-office'>
              ${offices.map(function(office,idx){
                return ` <li class="mdc-list-item" role="radio" aria-checked="${idx ? 'false':'true'}" tabindex=${idx ? '':'0'}>
                <span class="mdc-list-item__graphic">
                  <div class="mdc-radio">
                    <input class="mdc-radio__native-control"
                          type="radio"
                          id='demo-list-radio-item-${idx}'
                          name="demo-list-radio-item-group"
                          value="1">
                    <div class="mdc-radio__background">
                      <div class="mdc-radio__outer-circle"></div>
                      <div class="mdc-radio__inner-circle"></div>
                    </div>
                  </div>
                </span>
                <label class="mdc-list-item__text" for="demo-list-radio-item-${idx}">${office}</label>
              </li>`
              }).join("")}
            
            <ul>`
        const dialog = new Dialog('Send To', template).create();
        const list = new mdc.list.MDCList(document.getElementById('dialog-office'))
        dialog.open();
        dialog.listen('MDCDialog:opened', () => {
          list.layout();
          list.singleSelection = true
        });
        dialog.listen('MDCDialog:closed', function (evt) {
          if (evt.detail.action !== 'accept') return;

          getSubscription(offices[list.selectedIndex], 'check-in').then(function (sub) {
            if (!sub) {
              snacks('Check-in Subscription not available')
              history.back();
              return
            }
            sub.attachment.Photo.value = url
            sub.attachment.Comment.value = textValue;
            progressBar.open();
            requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
              getSuggestions()
              snacks('Check-In Created')
            }).catch(function (error) {
              snacks(error.response.message)
            })
          })
        })
      }
    })

  })


  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;
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
  let float;
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


function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {

    var infowindow = new google.maps.InfoWindow();
    const result = []
    let lastOpen;
    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
    const bounds = map.getBounds()
    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (calculateDistanceBetweenTwoPoints(location, {
          latitude: cursor.value.latitude,
          longitude: cursor.value.longitude
        }) > 0.5) {
        cursor.continue();
        return;
      }



      var marker = new google.maps.Marker({
        position: {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        },

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
      result.push(cursor.value)
      bounds.extend(marker.getPosition())
      cursor.continue();
    }
    tx.oncomplete = function () {
      map.fitBounds(bounds);
      return resolve(result)
    }
  })
}