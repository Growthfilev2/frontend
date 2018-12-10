self.onmessage = function(event) {
  const dbName = event.data.dbName;
  const office = event.data.office;
  const req = indexedDB.open(dbName)
  let userCoords;
  let distanceArr = []
  req.onsuccess = function() {
    const db = req.result
    const rootTx = db.transaction(['root']);
    const rootStore = rootTx.objectStore('root');

    rootStore.get(dbName).onsuccess = function(event) {
      const record = event.target.result;

      userCoords = {
        'latitude': record.latitude,
        'longitude': record.longitude
      }
    }

    rootTx.oncomplete = function() {
      console.log(userCoords);

      const mapTx = db.transaction(['map'], 'readwrite');

      const mapObjectStore = mapTx.objectStore('map');
      mapObjectStore.openCursor().onsuccess = function(curEvent) {
        const cursor = curEvent.target.result
        if (!cursor) return;
        if(cursor.value.office !== office){
          cursor.continue();
          return;
        }
        if(cursor.value.status !== 'PENDING'){
          cursor.continue();
          return;
        }
        if(cursor.value.hidden){
          cursor.continue();
          return;
        }

        distanceArr.push(calculateDistance(userCoords, cursor.value))
        cursor.continue()
      }
      mapTx.oncomplete = function() {
        const filtered =   distanceArr.filter(function(record){
          return record !== null;
        })
        self.postMessage(filtered);
      }
    }

  }

}
function calculateDistance(userCoords, otherLocations) {
  var R = 6371; // km
  const THRESHOLD = 0.5 //km
  if(!otherLocations.latitude || !otherLocations.longitude) return null;

  const dLat = toRad(userCoords.latitude - otherLocations.latitude);
  const dLon = toRad(userCoords.longitude - otherLocations.longitude);
  const lat1 = toRad(userCoords.latitude);
  const lat2 = toRad(otherLocations.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  console.log(distance)
  console.log(otherLocations)
  if(distance <= THRESHOLD) {
    const record = {
    activityId: otherLocations.activityId,
    distance: distance
    }
  return record;
  }
return null;

}

function toRad(value) {
  return value * Math.PI / 180;
}
