importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.2/firebase-auth.js');
importScripts('js/config.js');
var userAuth;
var meta;

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        userAuth = user;
    }
})



const files = ['/',
    'offline.html',
    'error-404.html',
    'index.html',
    'css/app.css',
    'js/core.js',
    'js/config.js',
    'js/init.js',
    'js/checkin.js',
    'js/login.js',
    'home.html',
    'profile.html',
    'profile_aadhaar.html',
    'profile_pan.html',
    'profile_edit.html',
    'profile_bank_show.html',
    'profile_employee.html',
    'external/js/intl-utils.js',
    'external/js/intlTelInput.min.js',
    'external/js/moment.min.js',
    'external/img/flags.png',
    'external/img/flags@2x.png',
    'external/css/intlTelInput.css',
]
const staticCacheName = 'pages-cache-v604';

// Listen for install event, set callback
self.addEventListener('install', function (event) {
    // Perform some task

    event.waitUntil(caches.open(staticCacheName).then(cache => {
        return cache.addAll(files);
    }));
});

self.addEventListener('activate', function (event) {
    console.log('Activating new service worker...');
    // event.waitUntil(self.clients.claim())

    const cacheAllowlist = [staticCacheName];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        console.log('deleting', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => {
                // console.log('claiming client');
                // event.waitUntil(clients.claim())
            })
        })
    )
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith(appKey.getBaseUrl())) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                // console.log('Found ', event.request.url, ' in cache');
                return response;
            }
            // console.log('Network request for ', event.request.url);
            return fetch(event.request).then(fetchResponse => {
                if (fetchResponse.status === 404) {
                    return caches.match('error-404.html');
                }

                if (fetchResponse.headers.has('content-type') && matchContentType(fetchResponse.headers.get('content-type'))) {
                    // console.log('caching', event.request.url, fetchResponse.headers.has('content-type') ? fetchResponse.headers.get('content-type') : '');
                    return caches.open(staticCacheName).then(cache => {
                        cache.put(event.request.url, fetchResponse.clone());
                        return fetchResponse
                    });
                }
                return fetchResponse
            });

        }).catch(error => {
            console.log(error)
            return caches.match('offline.html')
        })
    );
})

const matchContentType = (contentType) => {
    return contentType.match(/^text\/css|application\/javascript|text\/javascript|font\/|image\/*/i)
}

self.addEventListener('message', (event) => {
    // console.log(userAuth)
    if (!event.data) return;
    if(event.data.type !== 'read') return;
    console.log('SW REC message', event.data)


    userAuth.getIdToken().then(token => {
        const config = {
            meta: {
                user: {
                    token: token,
                    uid: userAuth.uid,
                    displayName: userAuth.displayName,
                    photoURL: userAuth.photoURL,
                    phoneNumber: userAuth.phoneNumber,
                },
                apiUrl: appKey.getBaseUrl()
            },
        };

        handleRead(config,event.data.readResponse).then(res => {
            sendResponseToClient(res);
        }).catch(err => {

            console.error(err)
            sendResponseToClient({
                type: 'error',
                message: err.message,
                body: JSON.stringify(err.stack)
            })
        })
    }).catch(console.log)


})

const sendResponseToClient = (response) => {
    self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
    }).then((clients) => {
        clients.forEach(client => client.postMessage(response));
    })
}


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
const handleRead = (data, readResponse) => {
    return new Promise((resolve, reject) => {

        const req = indexedDB.open(data.meta.user.uid);
        req.onsuccess = function () {
            const db = req.result
            updateIDB({
                payload: data,
                db
            },readResponse).then(resolve).catch(reject)
        }
        req.onerror = function () {
            console.log(req.error)
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
        store.put(record);
    }
}

function updateIDB(config, readResponse) {
    return new Promise(function (resolve, reject) {

        if (readResponse) return successResponse(readResponse, config.payload.meta, config.db, resolve, reject);


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
            method: 'GET',
            body: null,
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${request.token}`,
            },

            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache'
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