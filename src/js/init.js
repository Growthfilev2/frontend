const appKey = new AppKeys();
let progressBar;
let snackBar;
let ui;
var gray = [{
  "featureType": "administrative",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#D6E2E6"
  }]
},
{
  "featureType": "administrative",
  "elementType": "geometry.stroke",
  "stylers": [{
    "color": "#CFD4D5"
  }]
},
{
  "featureType": "administrative",
  "elementType": "labels.text.fill",
  "stylers": [{
    "color": "#7492A8"
  }]
},
{
  "featureType": "landscape.man_made",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#DDE2E3"
  }]
},
{
  "featureType": "landscape.man_made",
  "elementType": "geometry.stroke",
  "stylers": [{
    "color": "#CFD4D5"
  }]
},
{
  "featureType": "landscape.natural",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#dde2e3"
  }]
},
{
  "featureType": "landscape.natural",
  "elementType": "labels.text.fill",
  "stylers": [{
    "color": "#7492A8"
  }]
},
{
  "featureType": "landscape.natural.terrain",
  "stylers": [{
    "visibility": "off"
  }]
},
{
  "featureType": "poi",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#DDE2E3"
  }]
},
{
  "featureType": "poi",
  "elementType": "labels.icon",
  "stylers": [{
    "saturation": -100
  }]
},
{
  "featureType": "poi",
  "elementType": "labels.text.fill",
  "stylers": [{
    "color": "#588CA4"
  }]
},
{
  "featureType": "poi.park",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#B9F6CA"
  }]
},
{
  "featureType": "poi.park",
  "elementType": "geometry.stroke",
  "stylers": [{
    "color": "#BAE6A1"
  }]
},
{
  "featureType": "poi.sports_complex",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#C6E8B3"
  }]
},
{
  "featureType": "poi.sports_complex",
  "elementType": "geometry.stroke",
  "stylers": [{
    "color": "#BAE6A1"
  }]
},
{
  "featureType": "road",
  "elementType": "labels.icon",
  "stylers": [{
      "saturation": -45
    },
    {
      "lightness": 10
    },
    {
      "visibility": "on"
    }
  ]
},
{
  "featureType": "road",
  "elementType": "labels.text.fill",
  "stylers": [{
    "color": "#41626B"
  }]
},
{
  "featureType": "road.arterial",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#FFFFFF"
  }]
},
{
  "featureType": "road.highway",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#C1D1D6"
  }]
},
{
  "featureType": "road.highway",
  "elementType": "geometry.stroke",
  "stylers": [{
    "color": "#A6B5BB"
  }]
},
{
  "featureType": "road.highway",
  "elementType": "labels.icon",
  "stylers": [{
    "visibility": "on"
  }]
},
{
  "featureType": "road.highway.controlled_access",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#9FB6BD"
  }]
},
{
  "featureType": "road.local",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#FFFFFF"
  }]
},
{
  "featureType": "transit",
  "elementType": "labels.icon",
  "stylers": [{
    "saturation": -70
  }]
},
{
  "featureType": "transit.line",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#CFD4D5"
  }]
},
{
  "featureType": "transit.line",
  "elementType": "labels.text.fill",
  "stylers": [{
    "color": "#CFD4D5"
  }]
},
{
  "featureType": "transit.station",
  "elementType": "labels.text.fill",
  "stylers": [{
      "color": "#90CAF9"
    },

  ]
},
{
  "featureType": "transit.station.airport",
  "elementType": "geometry.fill",
  "stylers": [{
      "saturation": -100
    },
    {
      "lightness": -5
    }
  ]
},
{
  "featureType": "water",
  "elementType": "geometry.fill",
  "stylers": [{
    "color": "#A6CBE3"
  }]
}
]

let native = function () {
  return {
    setFCMToken: function (token) {
      localStorage.setItem('token', token)
    },
    getFCMToken: function () {
      return localStorage.getItem('token')
    },
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },

    setIosInfo: function (iosDeviceInfo) {
      const queryString = new URLSearchParams(iosDeviceInfo);
      var deviceInfo = {}
      queryString.forEach(function (val, key) {
        if (key === 'appVersion') {
          deviceInfo[key] = Number(val)
        } else {
          deviceInfo[key] = val
        }
      })
      localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo))
    },
    getIosInfo: function () {
      return localStorage.getItem('deviceInfo');
    },
    getInfo: function () {
      if (!this.getName()) {
        return false
      }
      if (this.getName() === 'Android') {
        let deviceInfo;
        try {
          deviceInfo = getDeviceInfomation();
          localStorage.setItem('deviceInfo', deviceInfo);
        } catch (e) {
          sendExceptionObject(e, `Catch Type 3: AndroidInterface.getDeviceId in native.getInfo()`, []);

          deviceInfo = JSON.stringify({
            baseOs: this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 10,
            osVersion: '',
            id: '',
          })
          localStorage.setItem('deviceInfo', deviceInfo);
        }
        return deviceInfo
      }
      return this.getIosInfo();
    }
  }
}();

function isNewDay(set) {
  var today = localStorage.getItem('today');
  if (!today) {
    set ? localStorage.setItem('today', moment().format('YYYY-MM-DD')) : ''
    return true;
  }
  const isSame = moment(moment().format('YYYY-MM-DD')).isSame(moment(today));
  if (isSame) {
    return false;
  } else {
    set ? localStorage.setItem('today', moment().format('YYYY-MM-DD')) : ''
    return true
  }
}

function getDeviceInfomation() {
  return JSON.stringify({
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion())
  })
}

window.onpopstate = function (event) {

 if(!event.state) return;
  window[event.state[0]]();
}




window.addEventListener("load", function () {
  firebase.initializeApp(appKey.getKeys())
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'))
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));



  if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('sw.js').then(function (registeration) {
    //   console.log('sw registered with scope :', registeration.scope);
    // }, function (err) {
    //   console.log('sw registeration failed :', err);
    // });
  }

  moment.updateLocale('en', {
    calendar: {
      lastDay: '[yesterday]',
      sameDay: 'hh:mm',
      nextDay: '[Tomorrow at] LT',
      lastWeek: 'dddd',
      nextWeek: 'dddd [at] LT',
      sameElse: 'L'
    },
    longDateFormat: {
      LT: "h:mm A",
      LTS: "h:mm:ss A",
      L: "DD/MM/YY",
    },
    months: [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ]
  })

  if (!window.Worker && !window.indexedDB) {
    const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
    incompatibleDialog.open();
    return;
  }
  startApp(true)
})

function firebaseUiConfig(value) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        if (value) {
          updateEmail(authResult.user, value);
          return false;
        }
      },
      signInFailure: function (error) {

        return handleUIError(error)
      },
      uiShown: function () {}
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          type: 'image', // 'audio'
          size: 'normal', // 'invisible' or 'compact'
          badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
        },
        defaultCountry: 'IN',
        defaultNationalNumber: value ? firebase.auth().currentUser.phoneNumber : '',
      }
    ]

  };
}



function userSignedOut() {
 
  if (!ui) {
    ui = new firebaseui.auth.AuthUI(firebase.auth())
  }

  ui.start(document.getElementById('login-container'), firebaseUiConfig());
}


function startApp(start) {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById('start-loader').classList.add('hidden')
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }
    if (appKey.getMode() === 'production') {
      if (!native.getInfo()) {
        redirect();
        return;
      }
    }
    if (!localStorage.getItem('error') || isNewDay()) {
      localStorage.setItem('error', JSON.stringify({}));
    };


    if (start) {
      const req = window.indexedDB.open(auth.uid, 6);
      let db;
      req.onupgradeneeded = function (evt) {
        db = req.result;
        db.onerror = function () {
          handleError({
            message: `${db.error.message} from startApp on upgradeneeded`
          })
          return;
        }

        if (!evt.oldVersion) {
          createObjectStores(db, auth.uid)
        } else {
          if (evt.oldVersion < 4) {
            const subscriptionStore = req.transaction.objectStore('subscriptions')
            subscriptionStore.createIndex('status', 'status');
          }
          if (evt.oldVersion < 5) {
            var tx = req.transaction;

            const mapStore = tx.objectStore('map');
            mapStore.createIndex('bounds', ['latitude', 'longitude']);
          
          }
          if(evt.oldVersion < 6) {
            var tx = req.transaction;
            const childrenStore = tx.objectStore('children')
            childrenStore.createIndex('officeTemplate', ['office', 'template']);
           
            childrenStore.createIndex('employees', 'employee');
            childrenStore.createIndex('employeeOffice',['employee','office'])
            childrenStore.createIndex('team','team')
            childrenStore.createIndex('teamOffice',['team','office'])
            const myNumber = firebase.auth().currentUser.phoneNumber;

            childrenStore.index('template').openCursor('employee').onsuccess = function(event){
                const cursor = event.target.result;
                if(!cursor) {
                  console.log("finished modiying children")
                  return;
                }
                cursor.value.employee = cursor.value.attachment['Employee Contact'].value
                if(cursor.value.attachment['First Supervisor'].value === myNumber ||  cursor.value.attachment['Second Supervisor'].value === myNumber) {
                  cursor.value.team = 1
                }
                cursor.update(cursor.value)
                cursor.continue();
            };
        
            tx.oncomplete = function(){

              console.log("finsihed backlog")
            }
          }
        }
      }

      req.onsuccess = function () {
        console.log("run app")
        db = req.result;
        document.getElementById("main-layout-app").style.display = 'block'
        localStorage.setItem('dbexist', auth.uid);
        ga('set', 'userId', JSON.parse(native.getInfo()).id)
        console.log(document.cookie);
        
        // resetScroll();
        requestCreator('now', {
          device: native.getInfo(),
          from: '',
          registerToken: native.getFCMToken()
        });
        mapView();
        
      }
      req.onerror = function () {
        handleError({
          message: `${req.error.message} from startApp`
        })
      }
    }
  })
}


function getEmployeeDetails(range,indexName) {
  return new Promise(function (resolve, reject) {
    const auth = firebase.auth().currentUser
    const req = indexedDB.open(auth.uid)
    req.onsuccess = function () {
      const db = req.result;
      const tx = db.transaction(['children']);
      const store = tx.objectStore('children');
 

      const index = store.index(indexName)
   

      const getEmployee = index.getAll(range);

      getEmployee.onsuccess = function (event) {
        const result = event.target.result;
     
        console.log(result);

        return resolve(result)
      }
      getEmployee.onerror = function () {
        return reject({
          message: getEmployee.error
        })
      }

      // index.openCursor(range).onsuccess = function (event) {
      //   const cursor = event.target.result;
      //   if (!cursor) return;
      //   results.push(cursor.value)
      //   cursor.continue();
      // }

    }

  })
}

function createObjectStores(db, uid) {

  const activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  })

  activity.createIndex('timestamp', 'timestamp')
  activity.createIndex('office', 'office')
  activity.createIndex('hidden', 'hidden')
  activity.createIndex('template','template');
  
  const list = db.createObjectStore('list', {
    keyPath: 'activityId'
  })
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')

  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')

  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('status', 'status')
  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('urgent', ['status', 'hidden']),
    calendar.createIndex('onLeave', ['template', 'status', 'office']);

  const map = db.createObjectStore('map', {
    autoIncrement: true,
  })

  map.createIndex('activityId', 'activityId')
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('nearby', ['status', 'hidden'])
  map.createIndex('byOffice', ['office', 'location'])
  map.createIndex('bounds', ['latitude', 'longitude'])

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice',['employee','office'])
  children.createIndex('team','team')
  children.createIndex('teamOffice',['team','office'])
  const root = db.createObjectStore('root', {
    keyPath: 'uid'
  });

  root.put({
    uid: uid,
    fromTime: 0,
    location: ''
  })
}

function redirect() {
  firebase.auth().signOut().then(function () {
    window.location = 'https://www.growthfile.com';
  }).catch(function (error) {
    console.log(error)
    window.location = 'https://www.growthfile.com';
    handleError({
      message: `${error} from redirect`
    })
  });
}

function createCheckInData() {
  return new Promise(function (resolve, reject) {

    getUniqueOfficeCount().then(function (offices) {
      console.log(offices);
      const prom = [];

      if (!offices.length) return;

      offices.forEach(function (office) {
        prom.push(getSubscription(office, 'check-in'))

      })
      Promise.all(prom).then(function (result) {
        if (!result.length) return;
        const filtered = result.filter(function (set) {
          return set != undefined;
        });

        return resolve({
          data: filtered,
          offices: offices
        })


      }).catch(function (error) {
        reject(error)
      })
    });
  })
}




function setVenueForCheckIn(venueData, value) {
  const venue = {
    geopoint: {
      latitude: '',
      longitude: ''
    },
    address: '',
    location: '',
    venueDescriptor: value.venue[0]
  }
  if (!venueData.length) {
    value.venue = [venue]
    value.share = [];
    return [value];

  }
  venue.location = venueData[0].location;
  venue.address = venueData[0].address;
  venue.geopoint.latitude = venueData[0].latitude;
  venue.geopoint.longitude = venueData[0].longitude;
  value.venue = [venue]
  value.share = [];
  console.log(value)
  return [value]
}


function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    let offices = []
    req.onsuccess = function () {
      const db = req.result
      const tx = db.transaction(['children']);
      const childrenStore = tx.objectStore('children').index('employees');
      childrenStore.openCursor(firebase.auth().currentUser.phoneNumber).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return;
        
        offices.push(cursor.value.office)
        cursor.continue()
      }
      tx.oncomplete = function () {
        return resolve(offices);
      }
      tx.onerror = function () {
        return reject({
          message: tx.error.message,
          body: JSON.stringify(tx.error)
        })
      }
    }
    req.onerror = function () {
      return reject({
        message: req.error.message
      })
    }
  })
}

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
      const results = [];
      const db = req.result;
      const tx = db.transaction(['map'])
      const store = tx.objectStore('map')
      const index = store.index('byOffice')
      const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
      index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (!cursor.value.location) {
          cursor.continue();
          return;
        }
        if (!cursor.value.latitude || !cursor.value.longitude) {
          cursor.continue();
          return;
        }

        const distanceBetweenBoth = calculateDistanceBetweenTwoPoints(cursor.value, currentLocation);

        if (isLocationLessThanThreshold(distanceBetweenBoth)) {

          results.push(cursor.value);
        }
        cursor.continue();
      }
      tx.oncomplete = function () {
        const filter = {};
        results.forEach(function (value) {
          filter[value.location] = value;
        })
        const array = [];
        Object.keys(filter).forEach(function (locationName) {
          array.push(filter[locationName])
        })
        const nearest = array.sort(function (a, b) {
          return a.accuracy - b.accuracy
        })
        resolve(nearest)
      }
      tx.onerror = function () {
        reject(tx.error)
      }
    }
  })
}