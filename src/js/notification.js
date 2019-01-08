importScripts('../external/js/moment.min.js')
self.onmessage = function (event) {
  const dbName = event.data.dbName;
  const type = event.data.type;
  const tsUpdate = event.data.updateTimestamp
  const handler = {
    urgent: urgent,
    nearBy: nearBy,
  }
  const req = indexedDB.open(dbName)
  let userCoords;
  let distanceArr = []
  req.onsuccess = function () {
    const db = req.result;
    handler[type](db, tsUpdate, dbName);
  }


  function urgent(db, tsUpdate) {

    const calTx = db.transaction(['calendar']);
    const calendarObjectStore = calTx.objectStore('calendar');
    const index = calendarObjectStore.index('urgent');
    const results = [];

    const yesterday = moment().subtract(1, 'days').format("YYYY-MM-DD");

    const tomorrow = moment().add(1, 'days').format("YYYY-MM-DD");
    const key = IDBKeyRange.bound(['PENDING', 0], ['PENDING', 0]);
    index.openCursor(key).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      const end = moment(cursor.value.end, 'YYYY-MM-DD')
      const start = moment(cursor.value.start, 'YYYY-MM-DD');
    
      if (moment(yesterday).isSameOrBefore(end) && moment(tomorrow).isSameOrAfter(start)) { 
        const data = {
          activityId: cursor.value.activityId,
          name: cursor.value.scheduleName,
          value: cursor.value.end
        }
        results.push(data)
      }
      cursor.continue();
    }

    calTx.oncomplete = function () {

      const ascendingDates = sortByNearestEndDate(results);

      const urgentestDates = Object.keys(ascendingDates).sort(function (a, b) {
        return moment(ascendingDates[b].value) - moment(ascendingDates[a].value).valueOf();
      })
      const output = []
      urgentestDates.forEach(function (id) {
        output.push(ascendingDates[id])
      })
      resetNotifs('urgent').then(function(){

        updateTimestamp('urgent', {
          data: output.reverse(),
          'tsUpdate': tsUpdate
        }).then(function (success) {
          self.postMessage(success);
        })
      })
    }

  }

  function sortByNearestEndDate(results) {
    let holder = {}
    let arr = []
    results.forEach(function (rec) {
      if (!holder.hasOwnProperty(rec.activityId)) {
        holder[rec.activityId] = {
          id: rec.activityId,
          name: rec.name,
          value: rec.value
        }
      } else {
        if (moment(holder[rec.activityId].value).valueOf() > moment(rec.value).valueOf()) {
          holder[rec.activityId] = {
            id: rec.activityId,
            name: rec.name,
            value: rec.value
          }
        }
      }
    })
    return holder;
  }

  function resetNotifs(type) {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open(dbName);
      req.onsuccess = function () {
        const db = req.result;
        const transaction = db.transaction(['list'], 'readwrite');
        const objectStore = transaction.objectStore('list');
        const index = objectStore.index('status');
        const cursorReq = index.openCursor('PENDING');
        cursorReq.onsuccess = function (event) {
          const cursor = event.target.result;
          if (!cursor) return;
          if (cursor.value[type]) {
            cursor.value[type] = false;
            objectStore.put(cursor.value)
          }
          cursor.continue()
        }
        transaction.oncomplete = function () {
          resolve(true)
        }
        transaction.onerror = function () {
          reject(transaction.error)
        }
      }
      req.onerror = function () {
        reject(req.error)
      }
    })
  }

  function updateTimestamp(type, results) {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open(dbName);
      req.onsuccess = function () {

        const db = req.result;
        const transaction = db.transaction(['list'], 'readwrite');
        const store = transaction.objectStore('list');

        results.data.forEach(function (data) {
          store.get(data.id).onsuccess = function (event) {
            const record = event.target.result;
            if (record) {
              if (results.tsUpdate) {
                record.timestamp = moment().valueOf();
              }
              record[type] = true
              store.put(record);
            }
          }
        })
        transaction.oncomplete = function () {
          resolve(type);
        }
      }
    })
  }

  function nearBy(db, tsUpdate, dbName) {

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
      const range = IDBKeyRange.lowerBound(['PENDING', 0])
      index.openCursor(range).onsuccess = function (curEvent) {
        const cursor = curEvent.target.result
        if (!cursor) return;

        distanceArr.push(calculateDistance(userCoords, cursor.value))
        cursor.continue()
      }
      mapTx.oncomplete = function () {

        const filtered = isDistanceNearBy(distanceArr, 0.5);
        const sorted = sortDistance(filtered);
        resetNotifs('nearby').then(function () {
          updateTimestamp('nearby', {
            data: sorted.reverse(),
            'tsUpdate': tsUpdate
          }).then(function (success) {
            self.postMessage(success);
          })
        }).catch(console.log)
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

    const distanceInMeters = distance

    const record = {
      id: otherLocations.activityId,
      distance: distanceInMeters,
      name: otherLocations.venueDescriptor,
      value: otherLocations.location
    }
    return record;
  }
  
  function isDistanceNearBy(data, thresold) {
    return data.filter(function (el) {
      return el.distance <= thresold;
    })
  }

  function sortDistance(data) {
    return data.sort(function (a, b) {
      return a.distance - b.distance
    })
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }
}