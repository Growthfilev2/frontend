self.onmessage = function(event) {
  
  const req = indexedDB.open(event.data.dbName)

  let distanceArr = []
  req.onsuccess = function() {
    const db = req.result
    const mapObjectStore = db.transaction('map', 'readwrite').objectStore('map')
    const rootStore = db.transaction('root').objectStore('root')
    rootStore.get(event.data.dbName).onsuccess = function(event){
      const record = event.target.result;
      const userCoords = {
        'latitude':record.latitude,
        'longitude':record.longitude
      }
      mapObjectStore.openCursor().onsuccess = function(curEvent) {
          const cursor = curEvent.target.result
          if (!cursor) {
            distanceArr.sort(function(a,b){
                return a.distance - b.distance
            })
            self.postMessage(distanceArr);
            return
          }
          distanceArr.push(calculateDistance(userCoords, cursor.value, mapObjectStore))
          cursor.continue()
        }
    }
  }
}


function calculateDistance(userCoords, otherLocations, mapObjectStore) {
    var R = 6371; // km
    const dLat = toRad(userCoords.lat - otherLocations['latitude']);
    const dLon = toRad(userCoords.lng - otherLocations['longitude']);
    const lat1 = toRad(userCoords.lat);
    const lat2 = toRad(otherLocations['latitude']);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const record  = {
      activityId : otherLocations.activityId,
      distance: distance
    }

    return record
    //to do remove empty distance records
}

function toRad(value) {
    return value * Math.PI / 180;
}
