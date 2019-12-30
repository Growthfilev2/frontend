const appKey = new AppKeys();
let progressBar;
var db;
let snackBar;
let DB_VERSION = 30;
var EMAIL_REAUTH;
var firebaseUI;
var sliderIndex = 1;
var sliderTimeout = 10000;


window.addEventListener('error',function(event){
  if(event.message.toLowerCase().indexOf('script error') > -1) {
    this.console.log(event)
  }
  else {
    handleError({
      message:'global error :' + event.message,
      body:{
        lineno:event.lineno,
        filename:event.filename,
        colno:event.colno,
        error:JSON.stringify({
          stack:event.error.stack,
          message:event.error.message
        })
      }
    })  
  }
})

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
        localStorage.setItem('deviceInfo', getAndroidDeviceInformation());
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
  if (event.state[0] === 'mapView') return;
  if (event.state[0] === 'reportView') {
    this.reportView(event.state[1])
    return;
  }
  if (event.state[0] === 'emailUpdation' || event.state[0] === 'emailVerificationWait') {
    history.go(-1);
    return;
  };
  if(window[event.state[0]]) {
    window[event.state[0]](event.state[1]);
  }
}


function initializeApp() {
  window.addEventListener('load', function () {
    firebase.initializeApp(appKey.getKeys())
    progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('#app-header .mdc-linear-progress'))
    snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    topBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
    // header =  new mdc.topAppBar.MDCTopAppBar(this.document.getElementById('app-header'))


    const panel = this.document.getElementById('app-current-panel');

    if (!window.Worker && !window.indexedDB) {
      const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
      incompatibleDialog.open();
      return;
    }

    firebase.auth().onAuthStateChanged(function (auth) {
      if (!auth) {
        history.pushState(['userSignedOut'], null, null);
        userSignedOut()
        return;
      }
      const header = new mdc.topAppBar.MDCTopAppBar(document.getElementById('app-header'));
      header.listen('MDCTopAppBar:nav', handleNav);
      header.root_.classList.add("hidden");
      if (appKey.getMode() === 'production' && !native.getInfo()) return redirect()

      panel.classList.remove('hidden');
      if(EMAIL_REAUTH) {
        history.pushState(['reportView'],null,null);
        history.pushState(['profileView'],null,null);
        history.pushState(['emailUpdation'],null,null);
        emailUpdation(false,function(){
          EMAIL_REAUTH = false
          history.back()
        })
        return;
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
        console.log(authResult);
      
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

function initializeFirebaseUI() {
  document.getElementById("app-header").classList.remove("hidden");
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Login</span>
  `;
  header = setHeader(backIcon, '');
  header.listen('MDCTopAppBar:nav', handleNav);
  firebaseUI = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
  firebaseUI.start(document.getElementById('login-container'), firebaseUiConfig());
}


function userSignedOut() {
  progressBar.close();
  document.getElementById("dialog-container").innerHTML = '';
  document.getElementById('step-ui').innerHTML = '';
  document.getElementById("app-header").classList.add("hidden");
  if (firebaseUI) {
    firebaseUI.delete();
  }

  const panel = document.getElementById('app-current-panel');
  panel.innerHTML = `
    <div class='slider' id='app-slider'>
      <div class='slider-container'>
        <div class='slider-content'>
          <div class='graphic-container'>
            <img src='./img/ic_launcher.png'>
          </div>

          <div class='text'>
              <p class='mdc-typography--headline6 text-center mb-0'>
                Welcome to Growthfile
              </p>
              <p class='mdc-typography--body1 text-center p-10'>
                Mark attendance on Growthfile to avoid deductions in salary and expenses
              </p>
          </div>
        </div>
        

      </div>
    </div>
    <div class="action-button-container">
          <div class="submit-button-cont">
              <div class='dot-container'>
                <span class='dot active'></span>
                <span class='dot'></span>
                <span class='dot'></span>
              </div>
              <div class='mdc-typography--body1 mb-10'>
                <div class='text-center'>
                  <a href='https://www.growthfile.com/legal.html#privacy-policy'>Privacy Policy</a> &
                  <a href='https://www.growthfile.com/legal.html#terms-of-use-user'>Terms of use</a>
                </div>
              </div>
              <button class="mdc-button mdc-button--raised submit-btn" data-mdc-auto-init="MDCRipple"
                  id='login-btn'>
                  <div class="mdc-button__ripple"></div>
                  
                  <span class="mdc-button__label">Agree & Continue</span>
              </button>
          </div>
        </div>
  `;


  const sliderEl = document.getElementById('app-slider');
  const btn = new mdc.ripple.MDCRipple(document.getElementById('login-btn'));
  btn.root_.addEventListener('click', function () {
    removeSwipe()
    panel.innerHTML = '';
    history.pushState(['login'], null, null);
    initializeFirebaseUI();
  })
  
  var interval = setInterval(function(){
    sliderSwipe({
      element:sliderEl,
      direction:'right'
    })
  },sliderTimeout);
  swipe(sliderEl, sliderSwipe);
}




function sliderSwipe(swipeEvent) {
  const el = swipeEvent.element;
  if (swipeEvent.direction === 'left') {
    if (sliderIndex <= 1) {
      sliderIndex = 3;
    }
    else {
      sliderIndex--

    }
  }

  if (swipeEvent.direction === 'right') {
    if (sliderIndex >= 3) {
      sliderIndex = 1;
    }
    else {
      sliderIndex++
    }
  }

  loadSlider(el);
  [...document.querySelectorAll('.dot')].forEach(function (dotEl, index) {
    dotEl.classList.remove('active');
    if (index == sliderIndex - 1) {
      dotEl.classList.add('active')
    }
  })
}

function loadSlider(sliderEl) {

  let sliderContent = '';

  switch (sliderIndex) {
    case 1:
      sliderContent = `<div class='graphic-container'>
      <img src='./img/ic_launcher.png'>
    </div>

    <div class='text'>
        <p class='mdc-typography--headline6 text-center mb-0'>
          Welcome to Growthfile
        </p>
        <p class='mdc-typography--body1 text-center p-10'>
          Mark attendance on Growthfile to avoid deductions in salary and expenses
        </p>
    </div>`
      break;
    case 2:
      sliderContent = `
        <div class='icon-container'>
          <i class='material-icons mdc-theme--primary'>room</i>

        </div>
        <div class='text-container'>
          <ul class='slider-list'>
            <li>Mark attendance on your phone</li>
            <li>Branch, customer or unknown location</li>
            <li>Calculate kilometres traveled</li>
          </ul>
        </div>
        `

      break;
    case 3:

      sliderContent = `
        <div class='image-container'>
            <img src='./img/currency_large.png' class='currency-primary'>
        </div>
        <div class='text-container'>
        <ul class='slider-list'>
            <li>Daily payment calculation</li>
            <li>Online bank transfer</li>
            <li>Offer letter, payslip & form 16</li>
            
        </ul>
        </div>
        `
      break;
  }
  sliderEl.querySelector('.slider-content').innerHTML = sliderContent;
}


function loadingScreen() {
  const panel = document.getElementById('app-current-panel');

  const texts = ['Loading Growthfile', 'Getting Your Data', 'Creating Profile', 'Please Wait'];

  panel.innerHTML = `
  <div class='splash-content' id='loading-screen'>

      <div class='graphic-container'>
        <img src='./img/ic_launcher.png'>
      </div>
  
      <div class='text'>

        <p class='mdc-typography--headline6 text-center mb-0'>
            Growthfile is free to use for any employee of any company
        </p>
        <p class='mdc-typography--subtitle2 text-center'>
          No more queries, disputes, delays or deductions from your monthly salary & other payments
        </p>
    </div>

    <div class="showbox" id='start-load'>
    <div class="loader">
      <svg class="circular" viewBox="25 25 50 50">
        <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10"/>
      </svg>
    </div>
    <p class="mdc-typography--subtitle2 mdc-theme--primary"></p>
  </div>
    <div class='icon-cont mdc-layout-grid__inner mt-20'>
        <div class='mdc-layout-grid__cell--span-2-phone mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-6-desktop'>
          <div class='icon text-center'>
            <i class='material-icons mdc-theme--primary'>room</i>
            <p class='mt-10 mdc-typography--subtitle1 mdc-theme--primary'>Check-in</p>
          </div>
        </div>
       
        <div class='mdc-layout-grid__cell--span-2-phone mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-6-desktop'>
          <div class='icon text-center'>
            <img src='./img/currency.png' class='currency-primary'>
            <p class='mt-10 mdc-typography--subtitle1 mdc-theme--primary'>Incentives</p>
          </div>
        </div>

      </div>
  </div>
  `
  const startLoad = document.getElementById('start-load')
  let index = 0;
  var interval = setInterval(function () {
    if (index == texts.length - 1) {
      clearInterval(interval)
    };
    startLoad.querySelector('p').textContent = texts[index]
    index++;
  }, index + 1 * 1000);

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
      if (db.objectStoreNames.contains('list')) {
        db.deleteObjectStore('list')
      }
      if (db.objectStoreNames.contains('reports')) {
        db.deleteObjectStore('reports')
      }
      var rootStore = req.transaction.objectStore('root')
      rootStore.get(dbName).onsuccess = function (rootEvent) {
        const record = rootEvent.target.result;
        record.fromTime = 0;
        rootStore.put(record);
      }
      console.log('version upgrade')
    }
  }
  req.onsuccess = function () {
    console.log("request success")
    db = req.result;
    console.log("run app")
    loadingScreen();

    requestCreator('now', {
      device: native.getInfo(),
      from: '',
      registerToken: native.getFCMToken()
    }).then(function (res) {
      if (res.updateClient) {
        updateApp()
        return
      }
      if (res.revokeSession) {
        revokeSession(true);
        return
      };
      let rootRecord;
      const rootTx = db.transaction('root', 'readwrite');
      const store = rootTx.objectStore('root');
      store.get(dbName).onsuccess = function (transactionEvent) {
        rootRecord = transactionEvent.target.result;
        
        rootRecord.linkedAccounts = res.linkedAccounts || [];
      
        if (res.idProofs) {
          rootRecord.idProofs = res.idProofs
        }
        store.put(rootRecord);

      }
      rootTx.oncomplete = function () {
        if (!rootRecord.fromTime) return requestCreator('Null').then(initProfileView).catch(console.error)
        initProfileView()
        runRead({
          read: '1'
        })
      }
    }).catch(console.error)
  }
  req.onerror = function () {

    handleError({
      message: `${req.error.name}`,
      body: JSON.stringify(req.error.message)
    })
  }
}

function initProfileView() {

  document.getElementById('app-header').classList.remove('hidden')
  history.pushState(['profileCheck'], null, null)
  profileCheck();
}



function miniProfileCard(content, headerTitle, action) {

  return `<div class='mdc-card profile-update-init'>
  
  <div class='content-area'>
  <div id='primary-content'>
  
  ${content}
  </div>
  </div>
  ${action}
</div>`


}


function increaseStep(stepNumber) {

  const prevNumber = stepNumber - 1;
  if (prevNumber == 0) {
    document.getElementById(`step${stepNumber}`).classList.add('is-active');
    return;
  }
  document.getElementById(`step${prevNumber}`).classList.remove('is-active');
  document.getElementById(`step${prevNumber}`).classList.add('is-complete');
  document.getElementById(`step${stepNumber}`).classList.add('is-active');

}

function checkForPhoto() {
  const auth = firebase.auth().currentUser;
  if (auth.photoURL) {
    increaseStep(3)
    checkForEmail();
    return;
  }

  increaseStep(2)
  const content = `

      <div class='photo-container'>
      <img src="./img/empty-user.jpg" id="image-update">
      <button class="mdc-fab mdc-theme--primary-bg" aria-label="Favorite">
        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">camera</span>
        <input type='file' accept='image/jpeg;capture=camera' id='choose'>
      </button>
      </div>
  
      `
  document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, ' <span class="mdc-top-app-bar__title">Add Your Profile Picture</span>', '')
  document.getElementById('choose').addEventListener('change', function (evt) {
    getImageBase64(evt).then(function (dataURL) {
      document.getElementById('image-update').src = dataURL;
      return requestCreator('backblaze', {
        'imageBase64': dataURL
      })
    }).then(checkForEmail).catch(function (error) {
      snacks(error.message)
    })
  })

}

function checkForEmail() {

  const auth = firebase.auth().currentUser;
  if (auth.email && auth.emailVerified) {
    increaseStep(4);
    checkForId();
    return
  }


  getRootRecord().then(function (record) {
    if (record.skipEmail) {
      increaseStep(4);
      checkForId();
      return
    }
    increaseStep(3)
    emailUpdation(true, function () {

      checkForId()
    });

  })
}


function checkForId() {

  getRootRecord().then(function (record) {
    if (record.skipIdproof || record.idProofs) {
      increaseStep(5);
      checkForBankAccount();
      return
    };
    increaseStep(4);
    idProofView(checkForBankAccount);

  })
}


function checkForBankAccount() {

  getRootRecord().then(function (record) {
    if (record.skipBankAccountAdd || record.linkedAccounts.length) {
      openMap();
      return;
    }
    increaseStep(5)
    addNewBankAccount(openMap);
  })
}


function resizeAndCompressImage(image,compressionFactor) {
  var canvas = document.createElement('canvas');
  const canvasDimension = new CanvasDimension(image.width, image.height);
  canvasDimension.setMaxHeight(screen.height)
  canvasDimension.setMaxWidth(screen.width);
  const newDimension = canvasDimension.getNewDimension()
  canvas.width = newDimension.width
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  const newDataUrl = canvas.toDataURL('image/jpeg', compressionFactor);
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



function showReLoginDialog(heading, contentText) {
  const content = `<h3 class="mdc-typography--headline6 mdc-theme--primary">${contentText}</h3>`
  const dialog = new Dialog(heading, content).create();
  dialog.open();
  dialog.buttons_[1].textContent = 'RE-LOGIN';
  return dialog;


}

function getProfileCompletionTabs() {
  const auth = firebase.auth().currentUser;
  const dom = `<div class="step-container mdc-top-app-bar--fixed-adjust">
  <div class="progress">
    <div class="progress-track"></div>
    <div id="step1" class="progress-step">
      <i class='material-icons'>person</i>
    </div>
    <div id="step2" class="progress-step">
      <i class='material-icons'>camera</i>
    </div>
    <div id="step3" class="progress-step">
      <i class='material-icons'>email</i>
    </div>
    <div id="step4" class="progress-step">
      <i class='material-icons'>verified_user</i>
     </div>
    <div id="step5" class="progress-step">
      <i class='material-icons'>payment</i>
    </div>
  </div>

</div>`
  return dom
}

function profileCheck() {
  const auth = firebase.auth().currentUser;
  document.getElementById('step-ui').innerHTML = getProfileCompletionTabs();
  if (!auth.displayName) {
    document.getElementById("app-header").classList.remove('hidden');
    increaseStep(1)
    updateName(function () {
     
      checkForPhoto();
    });
    return
  };

  increaseStep(2)
  checkForPhoto();
}

function areObjectStoreValid(names) {
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum', ]
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
  if (!db.objectStoreNames.contains('attendance')) {

    const attendance = db.createObjectStore('attendance', {
      keyPath: 'id',
    })
    attendance.createIndex('key', 'key')
    attendance.createIndex('date', 'date')
    attendance.createIndex('month', 'month')
    attendance.createIndex('office', 'office')
    attendance.createIndex('attendance', 'attendance');
  }
  if (!db.objectStoreNames.contains('payment')) {

    const payments = db.createObjectStore('payment', {
      keyPath: 'id'
    })

    payments.createIndex('key', 'key')
    payments.createIndex('date', 'date')
    payments.createIndex('month', 'month')
    payments.createIndex('year', 'year')
    payments.createIndex('status', 'status')
    payments.createIndex('office', 'office')
  }
  if (!db.objectStoreNames.contains('reimbursement')) {

    const reimbursements = db.createObjectStore('reimbursement', {
      keyPath: 'id'
    });
    reimbursements.createIndex('key', 'key')
    reimbursements.createIndex('date', 'date')
    reimbursements.createIndex('month', 'month')
    reimbursements.createIndex('year', 'year')
    reimbursements.createIndex('office', 'office')
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
  document.getElementById('app-header').classList.add("hidden")
  document.getElementById('step-ui').innerHTML = ''
  progressBar.open();
  appLocation(3).then(function (geopoint) {
    progressBar.close();
    getCheckInSubs().then(function (checkInSubs) {
      if (!Object.keys(checkInSubs).length) {
        ApplicationState.location = geopoint;
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
        history.pushState(['searchOffice', geopoint], null, null)
        searchOffice(geopoint);
        return
      };

      ApplicationState.officeWithCheckInSubs = checkInSubs;
      const oldState = localStorage.getItem('ApplicationState')
      if (!oldState) return mapView(geopoint);
      const oldApplicationState = JSON.parse(oldState);
      if (!oldApplicationState.lastCheckInCreated) return mapView(geopoint);
      const isOlder = isLastLocationOlderThanThreshold(oldApplicationState.lastCheckInCreated, 300)
      const hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldApplicationState.location, geopoint))
      if (isOlder || hasChangedLocation) return mapView(geopoint);
      ApplicationState = oldApplicationState
      history.pushState(['reportView'], null, null)
      return reportView()
    })
  }).catch(function (error) {
    progressBar.close();
    handleLocationError(error, true)
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


function reloadPage() {
  window.location.reload(true);
}