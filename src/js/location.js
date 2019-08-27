function calculateSpeed(distance, time) {
    return distance / time;
}

function isLocationNew(newLocation) {

    const oldState = localStorage.getItem('ApplicationState');
    if (!oldState) return false;

    const oldLocation = JSON.parse(oldState).location;
    if (oldLocation.latitude && oldLocation.longitude) {
        if (oldLocation.latitude === newLocation.latitude && oldLocation.longitude === newLocation.longitude) {
            return true
        }
        return false
    }
    return false;
}

function toRad(value) {
    return value * Math.PI / 180;
}

function calculateDistanceBetweenTwoPoints(oldLocation, newLocation) {

    var R = 6371; // km
    var dLat = toRad(newLocation.latitude - oldLocation.latitude);
    var dLon = toRad(newLocation.longitude - oldLocation.longitude);
    var lat1 = toRad(newLocation.latitude);
    var lat2 = toRad(oldLocation.latitude);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;
    return distance;

}

function isLocationMoreThanThreshold(distance) {
    var THRESHOLD = 1; //km
    if (distance >= THRESHOLD) return true;
    return false;
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {

    var currentTime = moment().valueOf();
    var duration = moment.duration(currentTime.diff(lastLocationTime)).asSeconds()
    return duration > threshold

}



function isLocationStatusWorking() {
    const requiredWifi = {
        'samsung': true,
        'OnePlus': true
    }

    if (!navigator.onLine) {
        const connectionDialog = new Dialog('BROKEN INTERNET CONNECTION', 'Make Sure You have a working Internet Connection').create()
        connectionDialog.open();
        return;
    }
    if (native.getName() !== 'Android') return true;

    if (!AndroidInterface.isLocationPermissionGranted()) {
        const alertDialog = new Dialog('LOCATION PERMISSION', 'Please Allow Growthfile location access.').create()
        alertDialog.open();
        return
    }
    const brand = JSON.parse(localStorage.getItem('deviceInfo')).deviceBrand
    if (requiredWifi[brand]) {
        if (!AndroidInterface.isWifiOn()) {
            const alertDialog = new Dialog('TURN ON YOUR WIFI', 'Growthfile requires wi-fi access for improving your location accuracy.').create();
            alertDialog.open();
            return;
        }
        return true;
    }
    return true
}