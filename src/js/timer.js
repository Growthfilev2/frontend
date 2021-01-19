self.addEventListener('message', (event) => {
    if (event.data.type !== "read") return;
    const uid = event.data.uid
    const req = indexedDB.open(uid);
    req.onsuccess = function () {
        const db = req.result
        setInterval(() => {
            db.transaction('root').objectStore('root').get(uid).onsuccess = function (e) {
                const record = e.target.result;
                if (!record) return;
                if (!record.fromTime) return;
                self.postMessage(event.data)
            }
        }, event.data.time)
    }
})