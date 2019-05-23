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
    map = new google.maps.Map(document.getElementById('app-current-panel'), {
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
      // runAppChecks(location);
    })
    google.maps.event.addListener(map, 'idle', function () {
      if (document.querySelector('#recenter-action i')) {
        document.querySelector('#recenter-action i').style.color = 'black';
      }
      // var v1 = performance.now()
      // loadNearByLocations(getMapBounds(map), map).then(function (markers) {
      //   // markers.forEach(function(marker){

      //   // })
      //   var v2 = performance.now();
      //   console.log(v2 - v1);
      // })
    });

  }).catch(function (error) {
    console.log(error);
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    document.getElementById('start-loader').classList.add('hidden');
    document.getElementById('app-current-panel').innerHTML = '<div><p>Failed To Detect You Location</p><button class="mdc-button" onclick=mapView()>Try Again</button></div>'
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

function setFilePath(base64,orientation) {
  // localStorage.setItem('b6',base64);


  // const image = createElement('img',{src:`data:image/jpg;base64,${base64}`,width:'auto',height:'100%'})
  
  const container = createElement('div');
  container.style.backgroundImage = `url(data:image/jpg;base64,${base64})`;

  const header = createHeader(['keyboard_backspace'], []);
  header.foundation_.adapter_.addClass('transparent');
  

  container.appendChild(header.root_)
  // container.appendChild(image);

  const dialog = new Dialog('', container).create('simple');
  document.querySelector('.mdc-dialog__content').style.padding = '0px';
  document.querySelector('.mdc-dialog__content').style.overflow = 'hidden'
  dialog.open();

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
          id: cursor.value.activityId

        });
        console.log(cursor.value.latitude, cursor.value.longitude)
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
          result.push(marker)
        }
        cursor.continue();

      }
      tx.oncomplete = function () {

        return resolve(result)
      }
    }
  })
}