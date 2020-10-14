importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-auth.js');

var userAuth;
var meta;

firebase.initializeApp({
    apiKey: "AIzaSyB2SuCoyi9ngRIy6xZRYuzxoQJDtOheiUM",
    authDomain: "growthfilev2-0.firebaseapp.com",
    databaseURL: "https://growthfilev2-0.firebaseio.com",
    projectId: "growthfilev2-0",
    storageBucket: "growthfilev2-0.appspot.com",
    messagingSenderId: "1011478688238",
    appId: "1:1011478688238:web:707166c5b9729182d81eff",
    measurementId: "G-R2K1J16PTW"
});


firebase.auth().onAuthStateChanged(user => {
    if (user) {
        console.log(user)
        userAuth = user;
    }
})

console.log("there is a change")
// Listen for install event, set callback
self.addEventListener('install', function (event) {
    // Perform some task
    console.log('Service worker installed', event)

    event.waitUntil(self.skipWaiting());

});

self.addEventListener('activate', function (event) {
    // Perform some task
    console.log('Service worker activated', event)

});

self.addEventListener('message', (event) => {

    if (event.data && event.data.type === 'read') {

        // do something
        console.log('SW REC message', event.data)


        userAuth.getIdToken().then(token => {
            console.log(token)
            const b = {
                meta: {
                    user: {
                        token: token,
                        uid: userAuth.uid,
                        displayName: userAuth.displayName,
                        photoURL: userAuth.photoURL,
                        phoneNumber: userAuth.phoneNumber,
                    },
                    apiUrl: 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'
                },
            };
            handleRead(b).then(res => {
                self.clients.matchAll({
                    includeUncontrolled: true,
                    type: 'window',
                }).then((clients) => {
                    if (clients && clients.length) {
                        // Send a response - the clients
                        // array is ordered by last focused
                        clients[0].postMessage(res);
                    }
                });
            }).catch(console.error)
        })
    }
})




/**
 * send message back to main thread
 * @param {object} response 
 * @param {string} id 
 */
const sendSuccessRequestToMainThread = (response, id) => {
    self.postMessage({
        response: response,
        success: true,
        id: id,
    })
}

/**
 * sends error body to main thread to show api rejection messages
 * or to handle in view. if it's not an api rejection but js execution error in this file itself
 * then log the error and pass to main thread.
 * @param {object} error 
 */
const sendErrorRequestToMainThread = (error) => {

    const errorObject = {
        message: error.message,
        body: error,
        apiRejection: false,
        success: false,
        id: error.id,
        requestType: error.requestType,
        stack: error.stack || '',
    }

    if (error.code) {
        errorObject.apiRejection = true
    } else {
        instant(JSON.stringify(errorObject), meta)
    }
    self.postMessage(errorObject)
}
const handleRead = (data) => {
    return new Promise((resolve, reject) => {


        const req = indexedDB.open(data.meta.user.uid);
        req.onsuccess = function () {
            const db = req.result
            updateIDB({
                payload: data,
                db: db
            }).then(resolve).catch(reject)
        }
    })
}





function removeActivity(offices, tx) {
    const names = ['activity', 'children', 'map', 'calendar', 'subscriptions'];
    names.forEach(function (name) {
        const index = tx.objectStore(name).index('office');
        offices.forEach(function (office) {
            removeByIndex(index, office)
        })
    })

}





function updateAttendance(attendanceData = [], store) {
    attendanceData.forEach(function (value) {
        if (!value.id) return;
        value.editable = 1;
        store.put(value)
    })
}

function updateReimbursements(reimbursementData = [], store) {
    reimbursementData.forEach(function (value) {
        if (!value.id) return;
        store.put(value)
    })
}

function updatePayments(paymentData = [], store) {
    paymentData.forEach(function (value) {
        if (!value.id) return;
        store.put(value)
    })
}


function updateCalendar(activity, tx) {
    const calendarObjectStore = tx.objectStore('calendar')
    const calendarActivityIndex = calendarObjectStore.index('activityId')
    calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {
            if (!Array.isArray(activity.schedule)) return;

            activity.schedule.forEach(function (schedule) {
                if (typeof schedule !== 'object') return;
                const record = {
                    activityId: activity.activityId,
                    scheduleName: schedule.name,
                    timestamp: activity.timestamp,
                    template: activity.template,
                    hidden: activity.hidden,
                    start: schedule.startTime,
                    end: schedule.endTime,
                    status: activity.status,
                    office: activity.office
                }
                calendarObjectStore.add(record)
            });
            return;
        }

        let recordDeleteReq = cursor.delete()
        cursor.continue()
        recordDeleteReq.onsuccess = function () {
            console.log("remove calendar")
        }
        recordDeleteReq.onerror = function () {
            instant(JSON.stringify({
                message: recordDeleteReq.error.message
            }), meta)
        }
    }
}

function putMap(location, updateTx) {
    if (!location.activityId) return;
    const mapObjectStore = updateTx.objectStore('map')
    mapObjectStore.put(location);
}

function putAttachment(activity, tx, param) {
    if (!activity.activityId) return
    const store = tx.objectStore('children');
    const commonSet = {
        activityId: activity.activityId,
        status: activity.status,
        template: activity.template,
        office: activity.office,
        attachment: activity.attachment,
    };

    const myNumber = param.user.phoneNumber

    if (activity.template === 'employee') {
        if (activity.attachment.hasOwnProperty('Employee Contact')) {
            commonSet.employee = activity.attachment['Employee Contact'].value
        }
        if (activity.attachment.hasOwnProperty('Phone Number')) {
            commonSet.employee = activity.attachment['Phone Number'].value
        }
        if (activity.attachment.hasOwnProperty('First Supervisor') && activity.attachment['First Supervisor'].value === myNumber) {
            commonSet.team = 1
        }
    }

    store.put(commonSet)
}

function removeUserFromAssigneeInActivity(addendum, updateTx) {
    const addendumIndex = updateTx.objectStore('addendum').index('user');
    removeByIndex(addendumIndex, addendum.user)
    const activityObjectStore = updateTx.objectStore('activity')
    activityObjectStore.get(addendum.activityId).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;

        const indexOfUser = record.assignees.findIndex(function (assignee) {
            return assignee.phoneNumber === addendum.user
        })

        if (indexOfUser > -1) {
            record.assignees.splice(indexOfUser, 1)

            activityObjectStore.put(record)
        }
    }
}

function removeActivityFromDB(id, updateTx) {
    if (!id) return;

    const activityObjectStore = updateTx.objectStore('activity');
    const chidlrenObjectStore = updateTx.objectStore('children');
    activityObjectStore.delete(id);
    chidlrenObjectStore.delete(id);

    ['calendar', 'map', 'addendum'].forEach(function (name) {
        const index = updateTx.objectStore(name).index('activityId')
        removeByIndex(index, id)
    })

}

function putSubscription(subscription, tx) {
    const store = tx.objectStore('subscriptions');
    store.put(subscription);

}




function successResponse(read, param, db, resolve, reject) {

    const updateTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity', 'addendum', 'root', 'users', 'attendance', 'reimbursement', 'payment'], 'readwrite');
    const addendumObjectStore = updateTx.objectStore('addendum')
    const activityObjectStore = updateTx.objectStore('activity');
    const userStore = updateTx.objectStore('users');
    const attendaceStore = updateTx.objectStore('attendance')
    const reimbursementStore = updateTx.objectStore('reimbursement')
    const paymentStore = updateTx.objectStore('payment')

    let counter = {};
    let userTimestamp = {}
    let addendumIds = {}
    read.addendum.forEach(function (addendum) {

        if (!addendum.hasOwnProperty('user')) return;

        if (addendum.unassign) {
            if (addendum.user == param.user.phoneNumber) {
                removeActivityFromDB(addendum.activityId, updateTx);
            } else {
                removeUserFromAssigneeInActivity(addendum, updateTx)
            };
        };

        addendumObjectStore.put(addendum)
    })


    read.locations.forEach(function (location) {
        putMap(location, updateTx);
    });


    console.log(userTimestamp);
    console.log(counter);
    updateAttendance(read.attendances, attendaceStore)
    updateReimbursements(read.reimbursements, reimbursementStore)
    updatePayments(read.payments, paymentStore);
    read.activities.forEach(function (activity) {
        if (!activity.activityId) return;

        activity.canEdit ? activity.editable == 1 : activity.editable == 0;

        if (activity.template === 'duty') {
            handleDutyActivity(activity, updateTx);
        } else {
            activityObjectStore.put(activity);
        }
        updateCalendar(activity, updateTx);
        putAttachment(activity, updateTx, param);
        addendumObjectStore.index('activityId').getAll(activity.activityId).onsuccess = function (e) {
            const addendums = e.target.result || [];
            const lastAddendum = addendums.sort(function (a, b) {
                return b.timestamp - a.timestamp;
            })[0];
            updateUserStore(lastAddendum, activity.assignees, param, userStore)
        }
    })

    function updateUserStore(lastAddendum, assignees, param, userStore) {
        let promise = Promise.resolve();
        assignees.forEach(function (assignee) {

            promise = promise.then(function () {
                return setAddendumForUser(userStore, assignee, lastAddendum, param)
            })
        })
        return promise;

    }


    function setAddendumForUser(userStore, assignee, lastAddendum, param) {
        return new Promise(function (resolve, reject) {

            userStore.get(assignee.phoneNumber).onsuccess = function (e) {
                const user = e.target.result || {};
                user.displayName = assignee.displayName;
                user.mobile = assignee.phoneNumber;
                user.photoURL = assignee.photoURL;
                user.NAME_SEARCH = assignee.displayName.toLowerCase();

                if (lastAddendum) {
                    if (user.mobile !== param.user.phoneNumber) {
                        console.log('increment count');
                        if (user.count) {
                            user.count += 1;
                        } else {
                            user.count = 1;
                        }
                    }
                    user.timestamp = lastAddendum.timestamp;
                    user.comment = lastAddendum.comment;
                    lastAddendum.key = param.user.phoneNumber + assignee.phoneNumber;
                    addendumObjectStore.put(lastAddendum);
                }



                userStore.put(user).onsuccess = function () {
                    resolve(true)
                }
            }
        })
    }

    function handleDutyActivity(activity, updateTx) {
        const store = updateTx.objectStore('activity');
        store.get(activity.activityId).onsuccess = function (e) {
            const record = e.target.result;
            if (!record) {
                store.put(activity);
                return
            }
            activity.timer = record.timer;
            store.put(activity);
        }
    }


    if (read.products) {
        read.products.forEach(function (product) {
            putAttachment(product, updateTx, param);
        })
    }

    read.templates.forEach(function (subscription) {

        if (!subscription.activityId) {
            instant(JSON.stringify({
                message: 'activityId missing from template object',
                body: subscription
            }), param)
            return;
        }

        putSubscription(subscription, updateTx);

    })



    updateRoot(read, updateTx, param.user.uid);
    updateTx.oncomplete = function () {
        console.log("all completed");
        return resolve(read)
    }
    updateTx.onerror = function () {
        return reject(updateTx.error)
    }
}

function updateUserStore(userStore, phoneNumber, currentAddendum, user) {
    userStore.get(phoneNumber).onsuccess = function (event) {
        let userRecord = event.target.result || {
            count: 0,
            displayName: '',
            photoURL: '',
            mobile: phoneNumber,
            comment: '',
            timestamp: '',
            NAME_SEARCH: user.displayName.toLowerCase()
        }

        userRecord.comment = currentAddendum.comment;
        userRecord.timestamp = currentAddendum.timestamp;
        userRecord.mobile = user.phoneNumber;
        userRecord.displayName = user.displayName;

        if (!userRecord.photoURL) {
            userRecord.photoURL = user.photoURL;
        }

        userRecord.NAME_SEARCH = user.displayName.toLowerCase();
        if (currentAddendum.isComment) {
            if (!counter[phoneNumber]) return userStore.put(userRecord);
        }
        if (userRecord.count) {
            userRecord.count += counter[phoneNumber];
        } else {
            userRecord.count = counter[phoneNumber];
        }
        userStore.put(userRecord)
    }
}

function updateRoot(read, tx, uid) {

    const store = tx.objectStore('root')
    store.get(uid).onsuccess = function (event) {
        const record = event.target.result;
        record.fromTime = read.upto;
        console.log('start adding upto')
        store.put(record);
    }
}

function updateIDB(config) {
    return new Promise(function (resolve, reject) {

        const tx = config.db.transaction(['root']);
        const rootObjectStore = tx.objectStore('root');
        let record;
        let time;

        rootObjectStore.get(config.payload.meta.user.uid).onsuccess = function (event) {
            record = event.target.result;
            time = record.fromTime
        }

        tx.oncomplete = function () {
            const req = {
                method: 'GET',
                url: `${config.payload.meta.apiUrl}read1?from=${time}`,
                data: null,
                token: config.payload.meta.user.token
            };

            http(req)
                .then(function (response) {
                    console.log('read completed')
                    return successResponse(response, config.payload.meta, config.db, resolve, reject);
                }).catch(function (error) {

                    return reject(error)
                })
        }
    })
};

// Performs XMLHTTPRequest for the API's.
function http(request) {
    return new Promise(function (resolve, reject) {
        return fetch(request.url, {
            method: request.method,
            body: null,
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${request.token}`
            }
        }).then(response => {
            if (!response.status || response.status >= 226 || !response.ok) {
                throw response
            }
            return response.json();
        }).then(function (res) {

            if (res.hasOwnProperty('success') && !res.success) {
                reject(res);
                return;
            }
            resolve(res)

        }).catch(function (err) {
            if (typeof err.text === "function") {
                err.text().then(errorMessage => {
                    reject(JSON.parse(errorMessage))
                })
            }
        })
    })
}

function removeFromOffice(offices, meta, db) {
    return new Promise(function (resolve, reject) {
        const deleteTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity'], 'readwrite');
        deleteTx.oncomplete = function () {
            const rootTx = db.transaction(['root'], 'readwrite')
            const rootStore = rootTx.objectStore('root')
            rootStore.get(meta.user.uid).onsuccess = function (event) {
                const record = event.target.result;
                if (!record) return;
                record.officesRemoved = offices
                rootStore.put(record)
            }
            rootTx.oncomplete = function () {
                console.log("run read after removal")
                resolve({
                    response: 'Office Removed',
                    success: true
                })

            }
            rootTx.onerror = function (error) {

                reject({
                    response: error,
                    success: false
                })
            }

        };

        deleteTx.onerror = function () {
            console.log(tx.error)
        }
        removeActivity(offices, deleteTx)
    })
}
function removeByIndex(index, range) {
    index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
    }
}