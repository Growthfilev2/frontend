/** Initialize global variables */
const DB_VERSION = 33;

/** handle global error logging */

window.addEventListener('error', function (event) {
    this.console.error(event.error);
    if (event.message.toLowerCase().indexOf('script error') > -1) return;
    if (event.message === "You can't have a focus-trap without at least one focusable element") return;


    handleError({
        message: 'global error :' + event.message,
        body: {
            lineno: event.lineno,
            filename: event.filename,
            colno: event.colno,
            error: event.error ? JSON.stringify({
                stack: event.error.stack,
                message: event.error.message
            }) : ''
        }
    })
})

/** Handle Database and Service Worker initialization and global listeners */
window.addEventListener('load', (ev) => {

    // initialize service worker here
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', {
            scope: appKey.getMode() === 'dev' ? '/' : '/v3/'
        }).then(reg => {
            let reloadCounter = 0
            // when new service worker is found, the app will update 
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                // newWorker.state;
                // "installing" - the install event has fired, but not yet complete
                // "installed"  - install complete
                // "activating" - the activate event has fired, but not yet complete
                // "activated"  - fully active
                // "redundant"  - discarded. Either failed install, or it's been
                //                replaced by a newer version

                newWorker.addEventListener('statechange', (e) => {
                    // newWorker.state has changed

                    if (newWorker.state === "activated") {
                        if (reloadCounter >= 1) return
                        reloadCounter++
                        console.log("new worker is activate")
                        authRedirect()
                    }

                });
            });

            if (reg.active) {
                console.log("sw is active")
                authRedirect();
            }
        })
        return
    }
    alert("This app is incompatible with your device");
})


/**
 * when service worker is active , handle auth redirects
 */
const authRedirect = () => {
    firebase.auth().onAuthStateChanged(user => {
        console.log("auth started")
        const joinLink = new URLSearchParams(window.location.search).has('action')
        if (!user) return redirect(`/login.html${joinLink ? `?${joinLink.toString()}`:''}`);
         setupDB(user);
    })
}


/**
 * Initialize IndexedDB
 * @param {object} user // firebase auth object 
 */
const setupDB = (user) => {
    const dbName = user.uid;
    const req = window.indexedDB.open(dbName, DB_VERSION);
    let db;
    // if DB is new or an update to DB is found (DB_VERSION is increased)

    req.onupgradeneeded = function (evt) {
        db = req.result;
        db.onerror = function () {
            handleError({
                message: `${db.error.message}`,
            })
        };

        switch (evt.oldVersion) {
            case 0:
                createObjectStores(db, dbName)
                break;
            case 30:
                createSubscriptionObjectStore(db);
                createMapObjectStore(db);
                createCalendarObjectStore(db);
                break;
            case 31:
                const addendumStore = req.transaction.objectStore('addendum');
                if (!addendumStore.indexNames.contains('timestamp')) {
                    addendumStore.createIndex('timestamp', 'timestamp');
                }
                break;
            case 32:
                const userStore = req.transaction.objectStore('users');
                userStore.openCursor().onsuccess = function (e) {
                    const cursor = e.target.result;
                    if (!cursor) return;
                    delete cursor.value.count;
                    userStore.put(cursor.value)
                    cursor.continue();
                }
            default:
                console.log('version upgrade');
                break;
        }
    }

    req.onsuccess = function () {
        console.log("request success")
        db = req.result;

        console.log("run app")

        // Each js file handling view will have the init function
        // instead of using load listener , auth state listener and DB init on each page 
        // the init function will be called, after all initialization is done
        init(db)

        //   regulator()
        //   .then(console.log).catch(function (error) {
        //     if (error.type === 'geolocation') return handleLocationError(error)
        //     console.log(error)
        //     contactSupport()
        //   })
    };

    req.onerror = function () {
        handleError({
            message: `${req.error.name}`,
            body: JSON.stringify(req.error.message)
        })
    }
}


