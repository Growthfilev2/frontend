var db = void 0;
self.onmessage = function (e) {
    if (e.data.name === 'startTimer') {
        var req = indexedDB.open(e.data.uid);
        req.onsuccess = function () {
            db = req.result;
            getStoredTimer(e.data.dutyId).then(function (currentTime) {

                this.startTimer(e.data.dutyId, currentTime);
            });
        };
        return;
    };
};

function getStoredTimer(dutyId) {
    return new Promise(function (resolve) {
        if (!dutyId) return resolve('00:00:00');

        var tx = db.transaction('activity');
        var store = tx.objectStore('activity');

        store.get(dutyId).onsuccess = function (e) {
            var record = e.target.result;
            // if (!record.timer) {
            //     return resolve(`00:00:00`)
            // };
            var currentTimestamp = Date.now();
            // const storedTimestamp = record.timer.timestamp;
            var timeDifference = getTimeDifference(currentTimestamp, record.schedule[0].startTime);
            // if(timeDifference.seconds == 0) {
            //     return resolve(record.timer.time);
            // };

            // const storedTimer = parseTimeString(record.timer.time);
            return resolve(timeDifference.hours + ':' + timeDifference.minutes + ':' + timeDifference.seconds);
        };
    });
}

function parseTimeString(timeString) {
    var split = timeString.split(':');
    return {
        hours: Number(split[0]),
        minutes: Number(split[1]),
        seconds: Number(split[2])
    };
}

function getTimeDifference(currentTimestamp, dutyStartTime) {
    var delta = Math.abs(currentTimestamp - dutyStartTime) / 1000;
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    var seconds = Math.floor(delta % 60);
    console.log(hours);
    console.log(minutes);
    console.log(seconds);
    return {
        hours: hours,
        seconds: seconds,
        minutes: minutes
    };
}

function startTimer(uid, currentTime) {

    var split = currentTime.split(':');
    var seconds = Number(split[2]);
    var minutes = Number(split[1]);
    var hours = Number(split[0]);

    console.log(seconds);
    setInterval(function () {
        seconds++;
        if (seconds >= 60) {
            minutes++;
            seconds = 0;
        }
        if (minutes >= 60) {
            hours++;
            minutes = 0;
        };
        var timeString = formatTimerValues(hours) + ':' + formatTimerValues(minutes) + ':' + formatTimerValues(seconds);
        self.postMessage(timeString);
        updateTimer(uid, timeString);
    }, 1000);
}

function updateTimer(dutyId, timeString) {
    var tx = db.transaction('activity', 'readwrite');
    var store = tx.objectStore('activity');
    store.get(dutyId).onsuccess = function (e) {
        var record = e.target.result;
        // const timerRecord = {}
        // timerRecord[location] = {
        //     time:timeString,
        //     timestamp:Date.now()
        // };
        record.timer = {
            time: timeString,
            timestamp: Date.now()
        };
        store.put(record);
    };
    tx.oncomplete = function () {};
}

function formatTimerValues(value) {
    if (value < 10) return '0' + value;
    return value;
}
