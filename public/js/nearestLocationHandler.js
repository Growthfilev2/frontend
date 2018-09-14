self.onmessage = function(event){
  const userCoords = event.data.geopoint
  let count = 0;
  const req = indexedDB.open(event.data.dbName)
  req.onsuccess = function(){
    const db = req.result
    const mapObjectStore = db.transaction('map','readwrite').objectStore('map')
    const resultsInStore = mapObjectStore.count()
    resultsInStore.onsuccess = function(){
      // resultsInStore.result
      mapObjectStore.openCursor().onsuccess = function(event){
      const cursor = event.target.result
      if(!cursor) return
      count++
      calculateDistance(userCoords,cursor.value,mapObjectStore)
      if(count <= resultsInStore.result) {
        cursor.continue()
      }
      else {
        self.postMessage('nearyBy Locations Filtered')
        return
      }
    }
  }
}

}


function calculateDistance(userCoords,otherLocations,mapObjectStore){
  mapObjectStore.index('activityId').get(otherLocations.activityId).onsuccess = function(event){
  const record = event.target.result
  var R = 6371; // km
  const dLat = toRad(userCoords.lat - otherLocations['latitude']);
  const dLon = toRad(userCoords.lng - otherLocations['longitude']);
  const lat1 = toRad(userCoords.lat);
  const lat2 = toRad(otherLocations['latitude']);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  record.distance = distance
  console.log(record)
  mapObjectStore.put(record)

  //to do remove empty distance records
}
function toRad(value) {
  return value * Math.PI / 180;
}


}
