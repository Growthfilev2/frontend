

function calculateSpeed(distance, time) {
    return distance / time;
}

function distanceDelta(oldLocation, newLocation) {
    return calculateDistanceBetweenTwoPoints(oldLocation, newLocation);
}

function timeDelta(previousLocationTime, newLocationTime) {
    const duration = moment.duration(moment(newLocationTime).diff(moment(previousLocationTime)));
    return duration;
}

function getStoredLocation() {
    const oldState = localStorage.getItem('ApplicationState')
    if (!oldState) return;
    return JSON.parse(oldState).location

}

function isLocationOld(newLocation, oldLocation) {
    if (!oldLocation) return false;
    return oldLocation.latitude === newLocation.latitude && oldLocation.longitude === newLocation.longitude

}

function isLocationMoreThanThreshold(distance) {
    var THRESHOLD = 1; //km
    return distance >= THRESHOLD
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {
    var currentTime = moment(moment().valueOf());
    var duration = moment.duration(currentTime.diff(lastLocationTime)).asSeconds()
    return duration > threshold
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

function getCellularInformation() {

    let cellTowerQueryString;
    const mcc = AndroidInterface.getMobileCountryCode()
    const mnc = AndroidInterface.getMobileNetworkCode()
    const radioType = AndroidInterface.getRadioType()
    const carrier = AndroidInterface.getCarrier()
    const wifiQueryString = AndroidInterface.getWifiAccessPoints()
    try {
        cellTowerQueryString = AndroidInterface.getCellTowerInformation();
    } catch (e) {
        handleError({
            message: e.message,
            body: {
                mcc,
                mnc,
                radioType,
                carrier
            }
        })
    }

    let wifiAccessPointsArray = [];
    let cellTowerArray = [];
    if (wifiQueryString) {
        wifiAccessPointsArray = parseQuery(wifiQueryString)
    };
    if (cellTowerQueryString) {
        cellTowerArray = removeFalseCellIds(parseQuery(cellTowerQueryString))
    }
    const body = {}

    if (mcc) {
        body.homeMobileCountryCode = Number(mcc)
    }
    if (mnc) {
        body.homeMobileNetworkCode = Number(mnc)
    }
    if (carrier) {
        body.carrier = carrier
    }
    if (radioType) {
        body.radioType = radioType
    }

    if (wifiAccessPointsArray.length) {
        body.wifiAccessPoints = wifiAccessPointsArray
    }
    if (cellTowerArray.length) {
        body.cellTowers = cellTowerArray;
    }
    if (wifiAccessPointsArray.length && cellTowerArray.length) {
        body.considerIp = false
    } else {
        body.considerIp = true
    }
    return body;

}

function removeFalseCellIds(cellTowers) {
    const max_value = 2147483647
    const filtered = cellTowers.filter(function (tower) {
        return tower.cellId > 0 && tower.cellId < max_value && tower.locationAreaCode > 0 && tower.locationAreaCode < max_value;
    });
    return filtered
}

function parseQuery(queryString) {

    var array = [];
    const splitBySeperator = queryString.split(",")
    splitBySeperator.forEach(function (value) {
        const url = new URLSearchParams(value);
        array.push(queryPatramsToObject(url))
    })
    return array;
}

function queryPatramsToObject(url) {
    let result = {};
    url.forEach(function (value, key) {
        if (key === 'macAddress' || key === 'ssid') {
            result[key] = value
        } else {
            result[key] = Number(value)
        }
    })
    return result;
}