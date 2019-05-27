var gray = [{
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#D6E2E6"
    }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{
      "color": "#CFD4D5"
    }]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{
      "color": "#7492A8"
    }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#DDE2E3"
    }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{
      "color": "#CFD4D5"
    }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#dde2e3"
    }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "labels.text.fill",
    "stylers": [{
      "color": "#7492A8"
    }]
  },
  {
    "featureType": "landscape.natural.terrain",
    "stylers": [{
      "visibility": "off"
    }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#DDE2E3"
    }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [{
      "saturation": -100
    }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{
      "color": "#588CA4"
    }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#B9F6CA"
    }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.stroke",
    "stylers": [{
      "color": "#BAE6A1"
    }]
  },
  {
    "featureType": "poi.sports_complex",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#C6E8B3"
    }]
  },
  {
    "featureType": "poi.sports_complex",
    "elementType": "geometry.stroke",
    "stylers": [{
      "color": "#BAE6A1"
    }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{
        "saturation": -45
      },
      {
        "lightness": 10
      },
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{
      "color": "#41626B"
    }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#FFFFFF"
    }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#C1D1D6"
    }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{
      "color": "#A6B5BB"
    }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.icon",
    "stylers": [{
      "visibility": "on"
    }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#9FB6BD"
    }]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#FFFFFF"
    }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [{
      "saturation": -70
    }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#CFD4D5"
    }]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.fill",
    "stylers": [{
      "color": "#CFD4D5"
    }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{
        "color": "#90CAF9"
      },

    ]
  },
  {
    "featureType": "transit.station.airport",
    "elementType": "geometry.fill",
    "stylers": [{
        "saturation": -100
      },
      {
        "lightness": -5
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{
      "color": "#A6CBE3"
    }]
  }
]
var map;
var globMark;

function mapView() {
  history.pushState(['mapView'], null, null);
  document.getElementById('section-start').innerHTML = ' <a href="#" class="demo-menu material-icons mdc-top-app-bar__navigation-icon">menu</a>'
  topAppBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
  topAppBar.setScrollTarget(document.getElementById('main-content'));
  topAppBar.root_.classList.add('transparent');
  document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust')
  let loadedMarkers = [];

  manageLocation().then(function (location) {
    document.getElementById('start-loader').classList.add('hidden');
    const latLng = {
      lat: location.latitude,
      lng: location.longitude
    }
    map = new google.maps.Map(document.getElementById('map'), {
      center: latLng,
      zoom: 18,
      disableDefaultUI: true,
      styles: gray,
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
      var centerControlDiv = document.createElement('div');
      var centerControl = new CenterControl(centerControlDiv, map, latLng)
      centerControlDiv.index = 1;


      var snapControlDiv = document.createElement('div');
      var snapControl = new TakeSnap(snapControlDiv);
      snapControlDiv.index = 2;

      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(snapControlDiv)


      // console.log(map)
      topAppBar.listen('MDCTopAppBar:nav', () => {
        drawer.open = !drawer.open;

        [].map.call(document.querySelectorAll('.mdc-drawer .mdc-list-item'), function (el) {
          new mdc.ripple.MDCRipple(el)
        })
        document.getElementById('drawer-icon').src = firebase.auth().currentUser.photoURL;
        document.getElementById('drawer-title').textContent = firebase.auth().currentUser.displayName || irebase.auth().currentUser.phoneNumber
        document.getElementById('drawer-icon').onclick = function () {
          profileView();
        }
      });

      // isEmployeeOnLeave().then(function (onLeave) {
      //   if (onLeave) return
      //   createCheckInData().then(function (result) {
      //     checkInDialog(result, location)
      //   }).catch(console.log)
      // })
    })

    google.maps.event.addListener(map, 'idle', function () {
      if (document.querySelector('#recenter-action i')) {
        document.querySelector('#recenter-action i').style.color = 'black';
      };

      Promise.all([loadNearByLocations(getMapBounds(map), map), getUniqueOfficeCount()]).then(function (result) {
        const body = {};
        let selectOffice;
        let selectVenue;
        const markers = result[0];
        const offices = result[1];
        const markerLength =  markers.length
        const officesLength = offices.length ;

        const el = document.getElementById('selection-box');
        const contentBody = el.querySelector('.content-body');

        el.querySelector('#card-header').textContent = `Hello, ${firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber }`;
        el.classList.remove('hidden');
        if (!markerLength) {

          if (officesLength > 1) {
            contentBody.innerHTML = mdcSelect(offices, 'Select Office');
            selectOffice = new mdc.select.MDCSelect(el.querySelector('.mdc-select'));

            return;
          }
          body.office = offices[0];

          const officeLi = `
            <ul class='mdc-list'>
            <li class="mdc-list-item mdc-ripple-upgraded" aria-selected="true" tabindex="0">
            <span class="mdc-list-item__graphic material-icons mdc-theme--on-primary" aria-hidden="true">business</span>
              ${offices[0]}
             </li>
            </ul>`
          contentBody.innerHTML = officeLi;
         
          return;
        }


        if (markerLength == 1) {
          const venueLi = `
          <ul class='mdc-list' id='default-venue'>
           <li class="mdc-list-item  mdc-theme--on-primary" aria-selected="true" tabindex="0" id='unselect-venue'>
           <span class="mdc-list-item__graphic material-icons mdc-theme--on-primary" aria-hidden="true">location_on</span>
            ${markers[0]}
           <span class="mdc-list-item__meta material-icons" aria-hidden="true" id='clear-venue'>clear</span>
           </li>
          </ul>
          `
          contentBody.innerHTML = venueLi;
          const listInit = new mdc.list.MDCList(document.getElementById('default-venue'))
          new mdc.ripple.MDCRipple(listInit.listElements[0]);
          console.log(listInit);
          document.getElementById('clear-venue').addEventListener('click', function () {
            listInit.listElements[0].classList.add('hidden');
            contentBody.style.minHeight = '56px';
            if (officesLength > 1) {
              contentBody.innerHTML = mdcSelect(offices, 'Select Office');
              selectOffice = new mdc.select.MDCSelect(el.querySelector('.mdc-select'));
            }
            contentBody.style.minHeight = '';
          })


          return;
        }
        if (markerLength > 1) {
          console.log(markers)
          contentBody.innerHTML = mdcSelect(markers, 'Where Are You ? ');
          selectVenue = new mdc.select.MDCSelect(el.querySelector('.mdc-select'));
          selectVenue.listen('MDCSelect:change', (evt) => {
            console.log(evt)
            const venueLi = `
            <ul class='mdc-list' id='default-venue'>
             <li class="mdc-list-item  mdc-theme--on-primary" aria-selected="true" tabindex="0" id='unselect-venue'>
             <span class="mdc-list-item__graphic material-icons mdc-theme--on-primary" aria-hidden="true">location_on</span>
              ${evt.detail.value}
             <span class="mdc-list-item__meta material-icons" aria-hidden="true" id='clear-venue'>clear</span>
             </li>
            </ul>`
            contentBody.innerHTML = venueLi;

            const listInit = new mdc.list.MDCList(document.getElementById('default-venue'))
            new mdc.ripple.MDCRipple(listInit.listElements[0]);
            console.log(listInit);
            document.getElementById('clear-venue').addEventListener('click', function () {
              listInit.listElements[0].classList.add('hidden');
              contentBody.style.minHeight = '56px';
              if (officesLength > 1) {
                contentBody.innerHTML = mdcSelect(offices, 'Select Office');
                 selectOffice = new mdc.select.MDCSelect(el.querySelector('.mdc-select'));
              }
              contentBody.style.minHeight = '';
            })
          });
          return;
        }

        document.getElementById('submit-check-in').addEventListener('click',function(){
          console.log(selectOffice)
          console.log(selectVenue);
          // getSubscription(office, 'check-in')
        })
      })
    });

  }).catch(function (error) {
    console.log(error);
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    document.getElementById('start-loader').classList.add('hidden');
    document.getElementById('map').innerHTML = '<div><p>Failed To Detect You Location</p><button class="mdc-button" onclick=mapView()>Try Again</button></div>'
  })
}


function CenterControl(controlDiv, map, latLng) {

  // Set CSS for the control border.

  const recenter = new Fab('my_location').getButton();
  recenter.root_.id = 'recenter-action'
  recenter.root_.classList.add('custom-control', 'right', 'mdc-theme--background', 'mdc-theme--on-primary');
  console.log(recenter)
  controlDiv.appendChild(recenter.root_);
  recenter.root_.addEventListener('click', function () {
    recenter.root_.querySelector('i').style.color = '#0399f4'
    focusMarker(map, latLng, 18);
  });

}

function TakeSnap(el) {
  const snap = new Fab('photo_camera').getButton();
  snap.root_.id = 'take-snap';
  snap.root_.classList.add('custom-control', 'right', 'mdc-theme--on-secondary')
  el.appendChild(snap.root_);
  snap.root_.addEventListener('click', function () {

    console.log('clicked')
    AndroidInterface.startCamera();

    // setFilePath();
  })
}


function mdcSelect(data, label) {
  const template = `
<div class="mdc-select mdc-select-custom">
<input type="hidden" name="enhanced-select"}>
<i class="mdc-select__dropdown-icon"></i>
<div class="mdc-select__selected-text"></div>
<div class="mdc-select__menu mdc-menu mdc-menu-surface mdc-select-custom">
  <ul class="mdc-list">

    ${data.map(function(name){
      return `<li class="mdc-list-item" data-value="${name}">
        ${name}
    </li>`
    }).join("")}
  </ul>
</div>
<span class="mdc-floating-label">${label}</span>
<div class="mdc-line-ripple"></div>
</div>`
  return template;


}


function setFilePath(base64) {
  // container.appendChild(image);
  const url = `data:image/jpg;base64,${base64}`
  const form = createElement('div', {
    className: 'form-meta'
  });
  form.classList.add('snap-form');
  const textarea = textAreaField({
    rows: "1",
    cols: "100",
    label: 'Comment'
  })

  textarea.input_.classList.add('mdc-theme--primary', 'snap-text');

  const submit = new Fab('send').getButton();
  submit.root_.classList.add('app-fab--absolute');
  submit.root_.style.zIndex = '9'
  submit.root_.setAttribute('autofocus', 'true');

  form.appendChild(textarea.root_);
  form.appendChild(submit.root_);



  const dialog = new Dialog('', form).create('simple');

  dialog.listen('MDCDialog:opened', function (evt) {
    const content = dialog.content_

    const header = createHeader(['keyboard_backspace'], [], 'snap-header');
    header.foundation_.adapter_.addClass('transparent');
    header.listen('MDCTopAppBar:nav', () => {
      dialog.close();
    });
    content.appendChild(header.root_);

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
      const image = url;

      createCheckInData().then(function (result) {
        console.log(result)
        manageLocation().then(function (location) {
          result.data[0].attachment.Comment.value = textValue;
          result.data[0].attachment.Photo.value = image
          checkInDialog(result, location)
          dialog.close();
        })
      }).catch(console.log)
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
    image.src = url

  })

  dialog.container_.style.minWidth = '100%';
  dialog.root_.querySelector('.mdc-dialog__surface').style.minWidth = '100%';
  dialog.root_.querySelector('.mdc-dialog__surface').style.minHeight = '100vh';
  dialog.open();
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

function getMapBounds(map) {
  const northEast = map.getBounds().getNorthEast()
  const southWest = map.getBounds().getSouthWest()
  return {
    ne: [northEast.lat(), northEast.lng()],
    sw: [southWest.lat(), southWest.lng()]
  }
}

function loadNearByLocations(range, map) {
  return new Promise(function (resolve, reject) {
    var markerImage = new google.maps.MarkerImage(
      './img/marker.png',
      new google.maps.Size(30, 30), //size
      null, //origin
      null, //anchor
      new google.maps.Size(30, 30) //scale
    );
    var infowindow = new google.maps.InfoWindow({

      disableAutoPan: true
    });
    const result = []
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    let lastOpen;
    let lastCursor;
    console.log(range)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['map'])
      const store = tx.objectStore('map');
      const index = store.index('bounds');
      const idbRange = IDBKeyRange.bound(range.sw, range.ne);

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
        // console.log(cursor.value.latitude, cursor.value.longitude)
        if ((map.getBounds().contains(marker.getPosition()))) {
          const content = `<span>${cursor.value.location}</span>`
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
          marker.setMap(map);
          result.push(cursor.value.location)
        }

        lastCursor = {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        };
       
        cursor.continue();
      }
      tx.oncomplete = function () {

        return resolve(result)
      }
    }
  })
}