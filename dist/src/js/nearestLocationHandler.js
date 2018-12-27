self.onmessage = function (event) {
  var req = indexedDB.open(event.data.dbName);

  var distanceArr = [];
  req.onsuccess = function () {
    var db = req.result;
    var rootStore = db.transaction('root').objectStore('root');
    rootStore.get(event.data.dbName).onsuccess = function (event) {
      var record = event.target.result;

      var userCoords = {
        'latitude': record.latitude,
        'longitude': record.longitude
      };

      var mapObjectStore = db.transaction('map', 'readwrite').objectStore('map');
      mapObjectStore.openCursor().onsuccess = function (curEvent) {
        var cursor = curEvent.target.result;
        if (!cursor) {
          distanceArr.sort(function (a, b) {
            return a.distance - b.distance;
          });
          self.postMessage(distanceArr);
          return;
        }
        distanceArr.push(calculateDistance(userCoords, cursor.value, mapObjectStore));
        cursor.continue();
      };
    };
  };
};

function calculateDistance(userCoords, otherLocations, mapObjectStore) {
  var R = 6371; // km
  var dLat = toRad(userCoords.lat - otherLocations['latitude']);
  var dLon = toRad(userCoords.lng - otherLocations['longitude']);
  var lat1 = toRad(userCoords.lat);
  var lat2 = toRad(otherLocations['latitude']);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;

  var record = {
    activityId: otherLocations.activityId,
    distance: distance
  };

  return record;
  //to do remove empty distance records
}

function toRad(value) {
  return value * Math.PI / 180;
}