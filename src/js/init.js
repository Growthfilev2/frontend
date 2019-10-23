const appKey = new AppKeys();
let progressBar;
var db;
let snackBar;
let DB_VERSION = 20;
let initApp = true;


function imgErr(source) {
  source.onerror = '';
  source.src = './img/empty-user.jpg';
  return true;
}

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
      if (!this.getName()) return false;

      if (this.getName() === 'Android') {
        if (!localStorage.getItem('deviceInfo')) {
          localStorage.setItem('deviceInfo', getAndroidDeviceInformation());
        }

        return localStorage.getItem('deviceInfo');
      }
      return this.getIosInfo();
    }
  }
}();

function getAndroidDeviceInformation() {
  return JSON.stringify({
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion()),
  })
}

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'mapView' || event.state[0] === 'snapView') return;
  if (event.state[0] === 'homeView') {
    getSuggestions();
    return
  }
  if (event.state[0] === 'emailUpdation' || event.state[0] === 'emailVerificationWait') {
    history.go(-1);
    return;
  }
  window[event.state[0]](event.state[1]);
}


function initializeApp() {
  window.addEventListener('load', function () {
    firebase.initializeApp(appKey.getKeys())
    progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('#app-header .mdc-linear-progress'))
    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    topBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
    const panel = this.document.getElementById('app-current-panel');
    
    if (!window.Worker && !window.indexedDB) {
      const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
      incompatibleDialog.open();
      return;
    }

    firebase.auth().onAuthStateChanged(function (auth) {
      if (!auth) {
        document.getElementById("app-current-panel").classList.add('hidden')
        userSignedOut()
        return;
      }
      if (appKey.getMode() === 'production') {
        if (!native.getInfo()) {
          redirect();
          return;
        }
      }
      

      panel.innerHTML = '';
      panel.classList.remove('hidden');
      panel.classList.remove('freeze');
      
      if (!initApp) {
        document.getElementById('app-header').classList.remove('hidden')
        return
      }

      localStorage.setItem('error', JSON.stringify({}));
      checkNetworkValidation();

    });
  })
}

function checkNetworkValidation() {
  if (!navigator.onLine) {
    failureScreen({
      message: 'You Are Currently Offline. Please Check Your Internet Connection',
      icon: 'wifi_off',
      title: 'BROKEN INTERNET CONNECTION'
    }, checkNetworkValidation)
    return;
  }
  startApp();
}



function firebaseUiConfig() {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        return false;
      },
      signInFailure: function (error) {
        return handleUIError(error)
      },
      uiShown: function () {

      }
    },
    signInFlow: 'popup',
    signInOptions: [{
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'invisible', // 'invisible' or 'compact'
        badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
      },
      defaultCountry: 'IN',

    }]
  };
}



function userSignedOut() {
  progressBar.close();
  document.getElementById("dialog-container").innerHTML = '';
  document.getElementById("app-header").classList.add("hidden");
  document.getElementById('app-current-panel').classList.remove('freeze');
  var ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
  ui.start(document.getElementById('login-container'), firebaseUiConfig());
}


function startApp() {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName, DB_VERSION);
  req.onupgradeneeded = function (evt) {
    db = req.result;
    db.onerror = function () {
      handleError({
        message: `${db.error.message}`,
      })
      return;
    };
    if (!evt.oldVersion) {
      createObjectStores(db, dbName)
    } else {
      createReportObjectStores(db);
      if(db.objectStoreNames.contains('list')) {
        db.deleteObjectStore('list')
      }
      if(db.objectStoreNames.contains('reports')) {
        db.deleteObjectStore('reports')
      }
     
      console.log('version upgrade')
    }
  }
  req.onsuccess = function () {
    console.log("request success")
    db = req.result;

    console.log("run app")
    const startLoad = document.querySelector('#start-load')
    startLoad.classList.remove('hidden');

    const texts = ['Loading Growthfile', 'Getting Your Data', 'Creating Profile', 'Please Wait']

    let index = 0;
    var interval = setInterval(function () {
      if (index == texts.length - 1) {
        clearInterval(interval)
      };
      startLoad.querySelector('p').textContent = texts[index]
      index++;
    }, index + 1 * 1000);



    requestCreator('now', {
      device: native.getInfo(),
      from: '',
      registerToken: native.getFCMToken()
    }).then(function (res) {

      if (res.response.updateClient) {
        updateApp()
        return
      }
      if (res.response.revokeSession) {
        revokeSession(true);
        return
      };

      getRootRecord().then(function (rootRecord) {
        if (!rootRecord.fromTime) {
          requestCreator('Null').then(function () {
            document.getElementById('start-load').classList.add('hidden')
            history.pushState(['profileCheck'], null, null)
            profileCheck();
          }).catch(function (error) {
            if (error.response.apiRejection) {
              snacks(error.response.message, 'Okay')
            }
            handleError({
              message: error.message,
              body: error,
            })
          })
          return;
        }
        document.getElementById('start-load').classList.add('hidden')
        history.pushState(['profileCheck'], null, null)
        profileCheck();

        runRead({
          read: '1'
        })
      }).catch(function (error) {
        handleError({
          message: error.message,
          body: JSON.stringify(error)
        })
      })
    }).catch(function (error) {
      if (error.response.apiRejection) {
        snacks(error.response.message, 'Okay')
        return;
      }
      handleError({
        message: error.message,
        body: JSON.stringify(error)
      })
    })
  }
  req.onerror = function () {

    handleError({
      message: `${req.error.name}`,
      body: JSON.stringify(req.error.message)
    })
  }
}



function miniProfileCard(content, headerTitle, action) {

  return `<div class='mdc-card profile-update-init'>
  <header class='mdc-top-app-bar mdc-top-app-bar--fixed' id='card-header'>
    <div class='mdc-top-app-bar__row'>
      <section class='mdc-top-app-bar__section mdc-top-app-bar__section--align-start' id='card-header-start'>
        ${headerTitle}
      </section>
    </div>
    <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed" id='card-progress'>
      <div class="mdc-linear-progress__buffering-dots"></div>
      <div class="mdc-linear-progress__buffer"></div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
        <span class="mdc-linear-progress__bar-inner"></span>
      </div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
        <span class="mdc-linear-progress__bar-inner"></span>
      </div>
    </div>
  </header>
  <div class='content-area mdc-top-app-bar--fixed-adjust'>
  <div id='primary-content'>
  
  ${content}
  </div>
  </div>
  ${action}
</div>`


}




function checkForPhoto() {
  const auth = firebase.auth().currentUser;
  if (!auth.photoURL) {
    const content = `

      <div class='photo-container'>
      <img src="./img/empty-user.jpg" id="image-update">
      <button class="mdc-fab mdc-theme--primary-bg" aria-label="Favorite">
        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">camera</span>
        <input type='file' accept='image/jpeg;capture=camera' id='choose'>
      </button>

      </div>
      <div class="view-container">
      <div class="mdc-text-field mdc-text-field--with-leading-icon mb-10 mt-20">
    <i class="material-icons mdc-text-field__icon mdc-theme--primary">account_circle</i>
    <input class="mdc-text-field__input" value="${auth.displayName}" disabled>
    <div class="mdc-line-ripple"></div>
    <label class="mdc-floating-label mdc-floating-label--float-above">Name</label>
  </div>

  <div class="mdc-text-field mdc-text-field--with-leading-icon mt-0">
    <i class="material-icons mdc-text-field__icon mdc-theme--primary">phone</i>
    <input class="mdc-text-field__input" value="${auth.phoneNumber}" disabled>
    <div class="mdc-line-ripple"></div>
    <label class="mdc-floating-label mdc-floating-label--float-above">Phone</label>
  </div>
      </div>
      </div>
      `
    document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, ' <span class="mdc-top-app-bar__title">Add Your Profile Picture</span>', '')
    const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'))

    document.getElementById('choose').addEventListener('change', function (evt) {

      const files = document.getElementById('choose').files
      if (!files.length) return;
      const file = files[0];
      var fileReader = new FileReader();
      fileReader.onload = function (fileLoadEvt) {
        const srcData = fileLoadEvt.target.result;
        const image = new Image();
        image.src = srcData;
        image.onload = function () {
          const newDataUrl = resizeAndCompressImage(image);
          document.getElementById('image-update').src = newDataUrl;
          progCard.open();
          requestCreator('backblaze', {
            'imageBase64': newDataUrl
          }).then(function () {
            progCard.close();
            openMap();
          }).catch(function (error) {
            progCard.close();
            snacks(error.response.message)
          })
        }
      }
      fileReader.readAsDataURL(file);
    })
    return
  }
  openMap();

}


function resizeAndCompressImage(image) {
  var canvas = document.createElement('canvas');
  const canvasDimension = new CanvasDimension(image.width, image.height);
  canvasDimension.setMaxHeight(screen.height)
  canvasDimension.setMaxWidth(screen.width);
  const newDimension = canvasDimension.getNewDimension()
  canvas.width = newDimension.width
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  const newDataUrl = canvas.toDataURL('image/jpeg', 0.5);
  return newDataUrl;

}

function CanvasDimension(width, height) {
  this.MAX_HEIGHT = ''
  this.MAX_WIDTH = ''
  this.width = width;
  this.height = height;
}
CanvasDimension.prototype.setMaxWidth = function (MAX_WIDTH) {
  this.MAX_WIDTH = MAX_WIDTH
}
CanvasDimension.prototype.setMaxHeight = function (MAX_HEIGHT) {
  this.MAX_HEIGHT = MAX_HEIGHT
}
CanvasDimension.prototype.getNewDimension = function () {
  if (this.width > this.height) {
    if (this.width > this.MAX_WIDTH) {
      this.height *= this.MAX_WIDTH / this.width;
      this.width = this.MAX_WIDTH;
    }
  } else {
    if (this.height > this.MAX_HEIGHT) {
      this.width *= this.MAX_HEIGHT / this.height;
      this.height = this.MAX_HEIGHT
    }
  }

  return {
    width: this.width,
    height: this.height
  }
}



function updateEmailButton() {
  return `<div class="mdc-card__actions">
<div class="mdc-card__action-icons"></div>
<div class="mdc-card__action-buttons">

<button class="mdc-button mdc-card__action mdc-card__action--button" id='addEmail'>
 <span class="mdc-button__label">UPDATE</span>
 <i class="material-icons mdc-button__icon" aria-hidden="true">arrow_forward</i>
</button>
</div>
</div>`
}


function showReLoginDialog(heading, contentText) {
  const content = `<h3 class="mdc-typography--headline6 mdc-theme--primary">${contentText}</h3>`
  const dialog = new Dialog(heading, content).create();
  dialog.open();
  dialog.buttons_[1].textContent = 'RE-LOGIN';
  return dialog;


}



function profileCheck() {
  const auth = firebase.auth().currentUser;
  if (!auth.displayName) {

    const content = `
    <div class="mdc-text-field mdc-text-field--outlined" id='name'>
    <input class="mdc-text-field__input" required>
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label class="mdc-floating-label">Name</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>
  `
    const action = `<div class="mdc-card__actions"><div class="mdc-card__action-icons"></div><div class="mdc-card__action-buttons"><button class="mdc-button" id='updateName'>
  <span class="mdc-button__label">NEXT</span>
  <i class="material-icons mdc-button__icon" aria-hidden="true">arrow_forward</i>
  </button></div></div>`

    document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, `<span class="mdc-top-app-bar__title">Enter Your Name</span>`, action)
    const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'))
    const nameInput = new mdc.textField.MDCTextField(document.getElementById('name'))
    console.log(nameInput)
    new mdc.ripple.MDCRipple(document.getElementById('updateName')).root_.addEventListener('click', function () {
      if (!nameInput.value) {
        nameInput.focus();
        return;
      }
      progCard.open();
      auth.updateProfile({
        displayName: nameInput.value
      }).then(checkForPhoto).catch(console.log)
    })
    return
  }
  checkForPhoto()


}

function areObjectStoreValid(names) {
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum',]
  for (let index = 0; index < stores.length; index++) {
    const el = stores[index];
    if (!names.contains(el)) {
      return {
        'not-present': el,
        isValid: false
      };
    }
  }
  return {
    'not-present': '',
    isValid: true
  };
}

function getEmployeeDetails(range, indexName) {
  return new Promise(function (resolve, reject) {
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
        message: getEmployee.error,
        body: ''
      })
    }
  })
}

function createReportObjectStores(db) {
  if(!db.objectStoreNames.contains('attendance')) {

    const attendance = db.createObjectStore('attendance',{
      keyPath:'id',
    })
    attendance.createIndex('key','key')
    attendance.createIndex('date','date')
    attendance.createIndex('month','month')
    attendance.createIndex('office','office')
    attendance.createIndex('attendance','attendance');
  }
  if(!db.objectStoreNames.contains('payment')) {

    const payments = db.createObjectStore('payment',{
      keyPath:'id'
    })
    payments.createIndex('key','key')

    payments.createIndex('date','date')
    payments.createIndex('month','month')
    payments.createIndex('year','year')
    payments.createIndex('status','status')
    payments.createIndex('office','office')
  }
  if(!db.objectStoreNames.contains('reimbursement')) {

    const reimbursements = db.createObjectStore('reimbursement',{
      keyPath:'id'
    })
    reimbursements.createIndex('key','key')
    reimbursements.createIndex('date','date')
    reimbursements.createIndex('month','month')
    reimbursements.createIndex('year','year')
    reimbursements.createIndex('office','office')
  }

}
function createObjectStores(db, uid) {

  const activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  })

  activity.createIndex('timestamp', 'timestamp')
  activity.createIndex('office', 'office')
  activity.createIndex('hidden', 'hidden')
  activity.createIndex('template', 'template');
  activity.createIndex('status', 'status')
 
  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')
  users.createIndex('mobile', 'mobile')
  users.createIndex('timestamp', 'timestamp')
  users.createIndex('NAME_SEARCH', 'NAME_SEARCH')
  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key')
  addendum.createIndex('KeyTimestamp', ['timestamp', 'key'])

  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status'])
  subscriptions.createIndex('templateStatus', ['template', 'status'])
  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('count', 'count');
  subscriptions.createIndex('report', 'report');

  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('office', 'office')
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
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
  map.createIndex('selection', ['office', 'status', 'location']);

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice', ['employee', 'office'])
  children.createIndex('team', 'team')
  children.createIndex('teamOffice', ['team', 'office'])

  createReportObjectStores(db)
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


function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    let offices = [];

    const tx = db.transaction('children');
    const childrenStore = tx.objectStore('children').index('employees');

    childrenStore.openCursor(firebase.auth().currentUser.phoneNumber).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      offices.push(cursor.value.office)
      cursor.continue()
    };

    tx.oncomplete = function () {
      return resolve(offices);
    }
    tx.onerror = function () {
      return reject({
        message: tx.error.message,
        body: JSON.stringify(tx.error)
      })
    }
  })
}


function hasDataInDB() {
  return new Promise(function (resolve) {
    const tx = db.transaction(['activity', 'subscriptions'])
    const activityStoreCountReq = tx.objectStore('activity').count()
    const subscriptionStoreCountReq = tx.objectStore('subscriptions').count()
    let activityStoreSize;
    let subscriptionStoreSize;

    activityStoreCountReq.onsuccess = function () {
      activityStoreSize = activityStoreCountReq.result;
    }
    subscriptionStoreCountReq.onsuccess = function () {
      subscriptionStoreSize = subscriptionStoreCountReq.result;
    }
    tx.oncomplete = function () {
      if (!activityStoreSize && !subscriptionStoreSize) return resolve(false)
      return resolve(true)
    }
  })
}

function getCheckInSubs() {
  return new Promise(function (resolve) {
    const checkInSubs = {};
    const tx = db.transaction('subscriptions');
    tx.objectStore('subscriptions')
      .index('templateStatus')
      .openCursor(IDBKeyRange.bound(['check-in', 'CONFIRMED'], ['check-in', 'PENDING']))
      .onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (checkInSubs[cursor.value.office]) {
          if (checkInSubs[cursor.value.office].timestamp <= cursor.value.timestamp) {
            checkInSubs[cursor.value.office] = cursor.value;
          }
        } else {
          checkInSubs[cursor.value.office] = cursor.value
        }
        cursor.continue();
      }
    tx.oncomplete = function () {
      return resolve(checkInSubs)
    }
  })
}

function openMap() {
  document.getElementById('start-load').classList.remove('hidden');

  hasDataInDB().then(function (data) {

    if (!data) return showNoOfficeFound();

    getCheckInSubs().then(function (checkInSubs) {

      if (!Object.keys(checkInSubs).length) {
        manageLocation(3).then(function (location) {
          document.getElementById('start-load').classList.add('hidden');
          ApplicationState.location = location;
          localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
          getSuggestions()
        }).catch(function (error) {
          handleLocationError(error, true)
        })
        return
      };
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      const oldState = localStorage.getItem('ApplicationState')
      manageLocation(3).then(function (geopoint) {
        document.getElementById('start-load').classList.add('hidden');
        if (!oldState) return mapView(geopoint);
        const oldApplicationState = JSON.parse(oldState);
        if (!oldApplicationState.lastCheckInCreated) return mapView(geopoint);

        const isOlder = isLastLocationOlderThanThreshold(oldApplicationState.lastCheckInCreated, 300)
        const hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldApplicationState.location, geopoint))
        if (isOlder || hasChangedLocation) return mapView(geopoint);
        ApplicationState = oldApplicationState
        return getSuggestions()
      }).catch(function (error) {
        handleLocationError(error, true)
      })
    })
  })
}

function fillVenueInCheckInSub(sub, venue) {
  const vd = sub.venue[0];
  sub.venue = [{
    geopoint: {
      latitude: venue.latitude || '',
      longitude: venue.longitude || ''
    },
    location: venue.location || '',
    address: venue.address || '',
    venueDescriptor: vd
  }];
  return sub;
}