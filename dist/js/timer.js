self.addEventListener('message', function (event) {
  if (event.data.type !== "read") return;
  var uid = event.data.uid;
  var req = indexedDB.open(uid);

  req.onsuccess = function () {
    var db = req.result;
    setInterval(function () {
      db.transaction('root').objectStore('root').get(uid).onsuccess = function (e) {
        var record = e.target.result;
        if (!record) return;
        if (!record.fromTime) return;
        self.postMessage(event.data);
      };
    }, event.data.time);
  };
});