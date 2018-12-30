importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js");

self.onmessage = function (event) {
  var dbName = event.data.dbName;
  var type = event.data.type;
  var tsUpdate = event.data.updateTimestamp;
  var handler = {
    urgent: urgent,
    nearBy: nearBy
  };
  var req = indexedDB.open(dbName);
  var userCoords = void 0;
  var distanceArr = [];
  req.onsuccess = function () {
    var db = req.result;
    handler[type](db, tsUpdate, dbName);
  };

  function urgent(db, tsUpdate) {

    var calTx = db.transaction(['calendar']);
    var calendarObjectStore = calTx.objectStore('calendar');
    var index = calendarObjectStore.index('urgent');
    var results = [];

    var yesterday = moment().subtract(1, 'days').format("YYYY-MM-DD");

    var tomorrow = moment().add(1, 'days').format("YYYY-MM-DD");
    var key = IDBKeyRange.bound(['PENDING', 0], ['PENDING', 0]);
    index.openCursor(key).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      if (moment(yesterday).isSameOrBefore(cursor.value.end) && moment(tomorrow).isSameOrAfter(cursor.value.start)) {
        var data = {
          activityId: cursor.value.activityId,
          name: cursor.value.scheduleName,
          value: cursor.value.end
        };
        results.push(data);
      }
      cursor.continue();
    };

    calTx.oncomplete = function () {

      var ascendingDates = sortByNearestEndDate(results);

      var urgentestDates = Object.keys(ascendingDates).sort(function (a, b) {
        return moment(ascendingDates[b].value) - moment(ascendingDates[a].value).valueOf();
      });
      var output = [];
      urgentestDates.forEach(function (id) {
        output.push(ascendingDates[id]);
      });

      updateTimestamp('urgent', { data: output.reverse(), 'tsUpdate': tsUpdate }).then(function (success) {
        self.postMessage(success);
      });
    };
  }
  function sortByNearestEndDate(results) {
    var holder = {};
    var arr = [];
    results.forEach(function (rec) {
      if (!holder.hasOwnProperty(rec.activityId)) {
        holder[rec.activityId] = { id: rec.activityId, name: rec.name, value: rec.value };
      } else {
        if (moment(holder[rec.activityId].value).valueOf() > moment(rec.value).valueOf()) {
          holder[rec.activityId] = { id: rec.activityId, name: rec.name, value: rec.value };
        }
      }
    });
    return holder;
  }

  function resetNearBy() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(dbName);
      req.onsuccess = function () {
        var db = req.result;
        var transaction = db.transaction(['list'], 'readwrite');
        var objectStore = transaction.objectStore('list');
        var index = objectStore.index('status');
        var cursorReq = index.openCursor('PENDING');
        cursorReq.onsuccess = function (event) {
          var cursor = event.target.result;
          if (!cursor) return;
          if (cursor.value.nearby) {
            cursor.value.nearby = false;
            objectStore.put(cursor.value);
          }
          cursor.continue();
        };
        transaction.oncomplete = function () {
          resolve(true);
        };
        transaction.onerror = function () {
          reject(transaction.error);
        };
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
  }

  function updateTimestamp(type, results) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(dbName);
      req.onsuccess = function () {

        var db = req.result;
        var transaction = db.transaction(['list'], 'readwrite');
        var store = transaction.objectStore('list');

        results.data.forEach(function (data) {
          store.get(data.id).onsuccess = function (event) {
            var record = event.target.result;
            if (record) {
              if (results.tsUpdate) {
                record.timestamp = moment().valueOf();
              }
              if (type === 'nearby') {
                if (!record.urgent) {
                  record.secondLine = data.name + ' : ' + data.value;
                }
              } else {
                record.secondLine = data.name + ' : ' + data.value;
              }
              record[type] = true;
              store.put(record);
            }
          };
        });
        transaction.oncomplete = function () {
          resolve(type);
        };
      };
    });
  }

  function nearBy(db, tsUpdate, dbName) {

    var rootTx = db.transaction(['root']);
    var rootStore = rootTx.objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;

      userCoords = {
        'latitude': record.location.latitude,
        'longitude': record.location.longitude
      };
    };

    rootTx.oncomplete = function () {

      var mapTx = db.transaction(['map'], 'readwrite');

      var mapObjectStore = mapTx.objectStore('map');
      var index = mapObjectStore.index('nearby');
      var range = IDBKeyRange.lowerBound(['PENDING', 0]);
      index.openCursor(range).onsuccess = function (curEvent) {
        var cursor = curEvent.target.result;
        if (!cursor) return;

        distanceArr.push(calculateDistance(userCoords, cursor.value));
        cursor.continue();
      };
      mapTx.oncomplete = function () {

        var filtered = isDistanceNearBy(distanceArr, 0.5);
        var sorted = sortDistance(filtered);
        resetNearBy().then(function () {
          updateTimestamp('nearby', { data: sorted.reverse(), 'tsUpdate': tsUpdate }).then(function (success) {
            self.postMessage(success);
          });
        }).catch(console.log);
      };
    };
  }

  function calculateDistance(userCoords, otherLocations) {
    var R = 6371; // km

    var dLat = toRad(userCoords.latitude - otherLocations.latitude);
    var dLon = toRad(userCoords.longitude - otherLocations.longitude);
    var lat1 = toRad(userCoords.latitude);
    var lat2 = toRad(otherLocations.latitude);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    var distanceInMeters = distance;

    var record = {
      id: otherLocations.activityId,
      distance: distanceInMeters,
      name: otherLocations.venueDescriptor,
      value: otherLocations.location
    };
    return record;
  }

  function isDistanceNearBy(data, thresold) {
    return data.filter(function (el) {
      return el.distance <= thresold;
    });
  }

  function sortDistance(data) {
    return data.sort(function (a, b) {
      return a.distance - b.distance;
    });
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }
};