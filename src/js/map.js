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
        const map = new google.maps.Map(document.getElementById('app-current-panel'), {
            center: latLng,
            zoom:20,
            disableDefaultUI: true,
            gestureHandling: 'greedy'
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
            var centerControl = new CenterControl(centerControlDiv, map, latLng);
            centerControlDiv.index = 1;
            // console.log(map)
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);

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
            runAppChecks(location);
        })
        google.maps.event.addListener(map, 'idle', function () {
            if (document.querySelector('#recenter-action span')) {
                document.querySelector('#recenter-action span').style.color = 'black';
            }

            loadNearByLocations(getMapBounds(map), map).then(function (markers) {
                // console.log(markers)
            })
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
    recenter.root_.classList.add('custom-center-map');
    console.log(recenter)
    controlDiv.appendChild(recenter.root_);
    recenter.root_.addEventListener('click', function () {
        recenter.root_.querySelector('span').style.color = '#0399f4'
        map.setZoom(20);
        map.panTo(latLng);
    });

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
                }

                var marker = new google.maps.Marker({
                    position: {
                        lat: cursor.value.latitude,
                        lng: cursor.value.longitude
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