importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js");

self.onmessage = function (event) {
  var dbName = event.data.dbName;
  var office = event.data.office;
  var type = event.data.type;
  var count = event.data.count;
  var handler = {
    urgent: urgent,
    nearBy: nearBy
  };

  var req = indexedDB.open(dbName);
  var userCoords = void 0;
  var distanceArr = [];
  req.onsuccess = function () {
    var db = req.result;
    handler[type](db, dbName, count);
  };

  function updateMapWithNoStatus(db) {
    return new Promise(function (resolve, reject) {
      var mapTx = db.transaction(['map'], 'readwrite');
      var mapObjectStore = mapTx.objectStore('map');

      var resultsWithoutStatus = [];
      mapObjectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.status) {
          cursor.continue();
          return;
        }
        if (cursor.value.office) {
          cursor.continue();
          return;
        }
        if (cursor.value.hidden) {
          cursor.continue();
          return;
        }

        resultsWithoutStatus.push(cursor.value);
        cursor.delete();
        cursor.continue();
      };

      mapTx.oncomplete = function () {
        var activityTx = db.transaction(['activity'], 'readwrite');
        var activityStore = activityTx.objectStore('activity');

        resultsWithoutStatus.forEach(function (data) {
          activityStore.get(data.activityId).onsuccess = function (event) {
            var record = event.target.result;
            if (record) {
              var transaction = db.transaction(['map'], 'readwrite');
              var _mapObjectStore = transaction.objectStore('map');
              data.status = record.status;
              data.hidden = record.hidden;
              data.office = record.office;
              _mapObjectStore.put(data);
            }
          };
        });
        activityTx.oncomplete = function () {
          resolve(true);
        };
      };
    });
  }

  function updateCalendarWithNoStatus(db, activity) {
    return new Promise(function (resolve, reject) {
      var calTx = db.transaction(['calendar'], 'readwrite');
      var calendarObjectStore = calTx.objectStore('calendar');

      var resultsWithoutStatus = [];
      calendarObjectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;

        if (cursor.value.status) {
          cursor.continue();
          return;
        }
        if (cursor.value.office) {
          cursor.continue();
          return;
        }

        resultsWithoutStatus.push(cursor.value);
        cursor.delete();
        cursor.continue();
      };

      calTx.oncomplete = function () {
        var activityTx = db.transaction(['activity'], 'readwrite');
        var activityStore = activityTx.objectStore('activity');

        resultsWithoutStatus.forEach(function (data) {
          activityStore.get(data.activityId).onsuccess = function (event) {
            var record = event.target.result;
            if (record) {
              var transaction = db.transaction(['calendar'], 'readwrite');
              var calendarStore = transaction.objectStore('calendar');
              data.status = record.status;
              data.office = record.office;
              calendarStore.put(data);
            }
          };
        });
        activityTx.oncomplete = function () {
          resolve(true);
        };
      };
    });
  }

  function urgent(db, dbName, count) {
    updateCalendarWithNoStatus(db).then(function () {
      var calTx = db.transaction(['calendar']);
      var calendarObjectStore = calTx.objectStore('calendar');
      var results = [];
      var today = moment().format("YYYY-MM-DD");
      var yesterday = moment().subtract(1, 'days');
      var tomorrow = moment().add(1, 'days');
      calendarObjectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.office !== office) {
          cursor.continue();
          return;
        }
        if (cursor.value.hidden) {
          cursor.continue();
          return;
        }
        if (cursor.value.status !== 'PENDING') {
          cursor.continue();
          return;
        }

        if (yesterday.isSameOrBefore(cursor.value.start) || tomorrow.isSameOrAfter(cursor.value.end)) {
          results.push(cursor.value);
        }
        cursor.continue();
      };
      calTx.oncomplete = function () {
        var sorted = sortDatesInDescindingOrder(results);
        if (count) {
          self.postMessage(sorted.length);
        } else {
          self.postMessage(sorted);
        }
      };
    }).catch(console.log);
  }

  function sortDatesInDescindingOrder(results) {
    var ascending = results.sort(function (a, b) {
      return moment(b.end).valueOf() - moment(a.end).valueOf();
    });
    return ascending;
  }

  function nearBy(db, dbName, count) {
    updateMapWithNoStatus(db).then(function () {
      var rootTx = db.transaction(['root']);
      var rootStore = rootTx.objectStore('root');
      rootStore.get(dbName).onsuccess = function (event) {
        var record = event.target.result;

        userCoords = {
          'latitude': record.latitude,
          'longitude': record.longitude
        };
      };

      rootTx.oncomplete = function () {

        var mapTx = db.transaction(['map'], 'readwrite');

        var mapObjectStore = mapTx.objectStore('map');
        mapObjectStore.openCursor().onsuccess = function (curEvent) {
          var cursor = curEvent.target.result;
          if (!cursor) return;
          if (cursor.value.office !== office) {
            cursor.continue();
            return;
          }
          if (cursor.value.status !== 'PENDING') {
            cursor.continue();
            return;
          }
          if (cursor.value.hidden) {
            cursor.continue();
            return;
          }

          distanceArr.push(calculateDistance(userCoords, cursor.value));
          cursor.continue();
        };
        mapTx.oncomplete = function () {
          var filtered = distanceArr.filter(function (record) {
            return record !== null;
          });
          if (count) {
            self.postMessage(filtered.length);
          } else {
            self.postMessage(filtered);
          }
        };
      };
    }).catch(console.log);
  }

  function calculateDistance(userCoords, otherLocations) {
    var R = 6371; // km
    var THRESHOLD = 0.5; //km
    if (!otherLocations.latitude || !otherLocations.longitude) return null;

    var dLat = toRad(userCoords.latitude - otherLocations.latitude);
    var dLon = toRad(userCoords.longitude - otherLocations.longitude);
    var lat1 = toRad(userCoords.latitude);
    var lat2 = toRad(otherLocations.latitude);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    if (distance <= THRESHOLD) {
      var record = {
        activityId: otherLocations.activityId,
        distance: distance
      };
      return record;
    }
    return null;
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }
};