function mapView() {
    history.pushState(['mapView'], null, null);
    document.getElementById('section-start').innerHTML = ' <a href="#" class="demo-menu material-icons mdc-top-app-bar__navigation-icon">menu</a>'
    topAppBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
    topAppBar.setScrollTarget(document.getElementById('main-content'));
    topAppBar.root_.classList.add('transparent');


    manageLocation().then(function (location) {
        document.getElementById('start-loader').classList.add('hidden');
        const latLng = {
            lat: location.latitude,
            lng: location.longitude
        }
        const map = new google.maps.Map(document.getElementById('app-current-panel'), {
            center: latLng,
            zoom: 18,
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

        var centerControlDiv = document.createElement('div');
        var centerControl = new CenterControl(centerControlDiv, map, latLng);
        centerControlDiv.index = 1;
        console.log(map)
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
        google.maps.event.addListenerOnce(map, 'idle', function () {
            console.log("Asd")
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
            // do something only the first time the map is loaded
            runAppChecks(location);

        });
    })

}

function CenterControl(controlDiv, map, latLng) {

    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.className = 'custom-center-map'
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.className = 'material-icons'
    controlText.innerHTML = 'my_location';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function () {
        map.setZoom(18);
        map.panTo(latLng);
    });

}

function getSubscription(office, template) {
    return new Promise(function (resolve) {
        const dbName = firebase.auth().currentUser.uid
        const req = indexedDB.open(dbName)
        req.onsuccess = function () {
            const db = req.result
            const tx = db.transaction(['subscriptions']);
            const subscription = tx.objectStore('subscriptions')
            const officeTemplateCombo = subscription.index('officeTemplate')
            const range = IDBKeyRange.only([office, template])
            let record;
            officeTemplateCombo.get(range).onsuccess = function (event) {
                if (!event.target.result) return;
                if (event.target.result.status !== 'CANCELLED') {
                    record = event.target.result;
                }
            }
            tx.oncomplete = function () {

                return resolve(record)

            }
        }
    })
}