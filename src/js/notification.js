importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js");

self.onmessage = function (event) {
  const dbName = event.data.dbName;
  const type = event.data.type;
  const handler = {
    urgent: urgent,
    nearBy: nearBy,
  }

  const curentTimestamp = moment().valueOf();

  const req = indexedDB.open(dbName)
  let userCoords;
  let distanceArr = []
  req.onsuccess = function () {
    const db = req.result;
    handler[type](db, dbName);
  }

  
  function urgent(db) {
  
    const calTx = db.transaction(['calendar']);
    const calendarObjectStore = calTx.objectStore('calendar');
    const index = calendarObjectStore.index('urgent');
    const results = [];

    const yesterday = moment().subtract(1, 'days');
    const tomorrow = moment().add(1, 'days');
    const key = IDBKeyRange.bound(['PENDING',0,0],['PENDING',0,moment().format("YYYY-MM-DD")]);
    index.openCursor(key,'prevunique').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (yesterday.isSameOrBefore(cursor.value.start) || tomorrow.isSameOrAfter(cursor.value.end)) {
        const data = {
          activityId:cursor.value.activityId,
          name:cursor.value.scheduleName,
          value:cursor.value.end
        }
        results.push(data)
      }
      cursor.continue();
    }
    calTx.oncomplete = function () {
      console.log(results)
      const reversed = results.reverse();
      updateTimestamp('urgent',reversed).then(function(success){
        self.postMessage(success);
      })
    }

  }


  function updateTimestamp(type,results){
    return new Promise(function(resolve,reject){
      const req = indexedDB.open(dbName);
      req.onsuccess = function(){
        const db = req.result;
        const transaction = db.transaction(['list'],'readwrite');
        const store = transaction.objectStore('list');
        
         results.forEach(function(data){
          store.get(data.activityId).onsuccess = function(event){
            const record = event.target.result;
            if(record){
                record.timestamp = moment().valueOf();
                record.secondLine = `${data.name}:${data.value}`
                record[type] = true
                store.put(record)
            
            }
          }
        })
        transaction.oncomplete = function(){
          resolve(type);
        }
      }
    })
  }

  function nearBy(db, dbName) {

    const rootTx = db.transaction(['root']);
    const rootStore = rootTx.objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result;

      userCoords = {
        'latitude': record.location.latitude,
        'longitude': record.location.longitude
      }
    }

    rootTx.oncomplete = function () {

      const mapTx = db.transaction(['map'], 'readwrite');

      const mapObjectStore = mapTx.objectStore('map');
      const index = mapObjectStore.index('nearby');
      const range = IDBKeyRange.lowerBound(['PENDING',0])
      index.openCursor(range).onsuccess = function (curEvent) {
        const cursor = curEvent.target.result
        if (!cursor) return;
    
        distanceArr.push(calculateDistance(userCoords, cursor.value))
        cursor.continue()
      }
      mapTx.oncomplete = function () {
        const filtered = isDistanceNearBy(distanceArr,0.5);
        const sorted = sortDistance(filtered);
        updateTimestamp('nearby',sorted.reverse()).then(function(success){
          self.postMessage(success);
        })
      }
    }
  }

  function calculateDistance(userCoords, otherLocations) {
    var R = 6371; // km
  
      const dLat = toRad(userCoords.latitude - otherLocations.latitude);
      const dLon = toRad(userCoords.longitude - otherLocations.longitude);
      const lat1 = toRad(userCoords.latitude);
      const lat2 = toRad(otherLocations.latitude);
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
    
        const record = {
          activityId: otherLocations.activityId,
          distance: distance,
          name:otherLocations.venueDescriptor,
          value:otherLocations.location
        }
        return record;     
    }
  

  function isDistanceNearBy(data,thresold){
   return data.filter(function(el){
     return el.distance <= thresold;
   })
  }

  function sortDistance(data){
    return data.sort(function(a,b){
      return a.distance - b.distance
    })
  }
    
    function toRad(value) {
      return value * Math.PI / 180;
    }
}