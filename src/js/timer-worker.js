let db;
self.onmessage = function (e) {
        if (e.data.name === 'startTimer') {
            const req = indexedDB.open(e.data.uid);
            req.onsuccess = function () {
                db = req.result;
                getStoredTimer(e.data.dutyId).then(function (currentTime) {
                    this.startTimer(e.data.dutyId,e.data.location,currentTime);
                })
            }
            return
        };
    };

    function getStoredTimer(dutyId) {
        return new Promise(function(resolve){

            const tx = db.transaction('activity');
            const store = tx.objectStore('activity');

            store.get(dutyId).onsuccess = function (e) {
                const record = e.target.result;
                if (!record.timer) {
                    return resolve(`00:00:00`)
                };
                const key = Object.keys(record.timer);
                const currentTimestamp = Date.now();
                const storedTimestamp = record.timer[key[0]].timestamp;
                const timeDifference = getTimeDifference(currentTimestamp,storedTimestamp);
                if(timeDifference.seconds == 0) {
                    return resolve(record.timer[key[0]].time);
                }
                const storedTimer = parseTimeString(record.timer[key[0]].time);
                return resolve(`${storedTimer.hours + timeDifference.hours}:${storedTimer.minutes + timeDifference.minutes}:${storedTimer.seconds+timeDifference.seconds}`);
            }
        })
    }

    function parseTimeString(timeString) {
        const split = timeString.split(':')
        return {
            hours:Number(split[0]),
            minutes:Number(split[1]),
            seconds:Number(split[2])
        }
    }

    function getTimeDifference(currentTimestamp,storedTimestamp) {
        let delta = Math.abs(currentTimestamp - storedTimestamp) / 1000;
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;

        const hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        const minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        const seconds = Math.floor(delta % 60);
        console.log(hours)
        console.log(minutes);
        console.log(seconds);
        return {
            hours:hours,
            seconds:seconds,
            minutes:minutes
        }
       
    }

    function startTimer(uid,location, currentTime) {
     
        const split = currentTime.split(':')
        let seconds = Number(split[2]);
        let minutes = Number(split[1]);
        let hours = Number(split[0]);
        
        console.log(seconds);
        setInterval(function () {
            seconds++;
            if (seconds >= 60) {
                minutes++
                seconds = 0;
            }
            if (minutes >= 60) {
                hours++;
                minutes = 0;
            };
            const timeString = `${formatTimerValues(hours)}:${formatTimerValues(minutes)}:${formatTimerValues(seconds)}`
            self.postMessage(timeString);
            updateTimer(uid,location,timeString);
        }, 1000)
    }

    function updateTimer(dutyId,location,timeString) {
        const tx = db.transaction('activity', 'readwrite');
        const store = tx.objectStore('activity');
        store.get(dutyId).onsuccess = function (e) {
            const record = e.target.result;
            const timerRecord = {}
            timerRecord[location] = {
                time:timeString,
                timestamp:Date.now()
            };
            record.timer = timerRecord;
            store.put(record)
        }
        tx.oncomplete = function () {
      
        }
    }

    function formatTimerValues(value) {
        if (value < 10) return `0${value}`;
        return value
    }