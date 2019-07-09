const appKey = new AppKeys();
let progressBar;
let snackBar;
let ui;
let send;
let change;
let next;
let emailInit;
var db;
let isCheckInCreated;
let drawer;
let navList;

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
        deviceInfo = getAndroidDeviceInformation();
        localStorage.setItem('deviceInfo', deviceInfo);
        return deviceInfo
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
    'appVersion': Number(AndroidInterface.getAppVersion())
  })
}

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'mapView' || event.state[0] === 'snapView') return;
  if (event.state[0] === 'homeView') {
    getSuggestions();
    return
  }

  window[event.state[0]](event.state[1]);
}




window.addEventListener("load", function () {
  firebase.initializeApp(appKey.getKeys())
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'))
  drawer = new mdc.drawer.MDCDrawer(document.querySelector('.mdc-drawer'));
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));


  drawer.listen('MDCDrawer:opened', function (evt) {
    document.querySelector(".mdc-drawer__header .mdc-drawer__title").textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber;
    document.querySelector(".mdc-drawer__header img").src = firebase.auth().currentUser.photoURL || '../src/img/empty-user.jpg'
    document.querySelector(".mdc-drawer__header img").onclick = function () {
      profileView();

    }
  })


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



function firebaseUiConfig(value, redirect) {

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
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          type: 'image', // 'audio'
          size: 'invisible', // 'invisible' or 'compact'
          badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
        },
        defaultCountry: 'IN',
        defaultNationalNumber: value ? firebase.auth().currentUser.phoneNumber : '',
      }
    ]

  };
}



function userSignedOut() {
  ui = new firebaseui.auth.AuthUI(firebase.auth())
  ui.start(document.getElementById('login-container'), firebaseUiConfig());
}


function startApp() {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      // document.getElementById('start-loader').classList.add('hidden')
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
    localStorage.setItem('error', JSON.stringify({}));
    

    const req = window.indexedDB.open(auth.uid, 15);

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
        if (evt.oldVersion < 6) {
          var tx = req.transaction;
          const childrenStore = tx.objectStore('children')
          childrenStore.createIndex('officeTemplate', ['office', 'template']);

          childrenStore.createIndex('employees', 'employee');
          childrenStore.createIndex('employeeOffice', ['employee', 'office'])
          childrenStore.createIndex('team', 'team')
          childrenStore.createIndex('teamOffice', ['team', 'office'])
          const myNumber = firebase.auth().currentUser.phoneNumber;

          childrenStore.index('template').openCursor('employee').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) {
              console.log("finished modiying children")
              return;
            }
            cursor.value.employee = cursor.value.attachment['Employee Contact'].value
            if (cursor.value.attachment['First Supervisor'].value === myNumber || cursor.value.attachment['Second Supervisor'].value === myNumber) {
              cursor.value.team = 1
            }
            cursor.update(cursor.value)
            cursor.continue();
          };

          tx.oncomplete = function () {

            console.log("finsihed backlog")
          }
        }
        if (evt.oldVersion < 7) {
          var tx = req.transaction;
          const mapStore = tx.objectStore('map')
          mapStore.createIndex('office', 'office');
          mapStore.createIndex('status', 'status');
          mapStore.createIndex('selection', ['office', 'status', 'location']);
        }
        if (evt.oldVersion < 8) {
          var tx = req.transaction;
          const listStore = tx.objectStore('list')
          const calendar = tx.objectStore('calendar')

          listStore.createIndex('office', 'office');
          calendar.createIndex('office', 'office')
        }
        if (evt.oldVersion < 9) {
          var tx = req.transaction;
          const userStore = tx.objectStore('users');
          userStore.createIndex('mobile', 'mobile');

          const addendumStore = tx.objectStore('addendum');
          addendumStore.createIndex('user', 'user');
          addendumStore.createIndex('timestamp', 'timestamp')
        }
        if (evt.oldVersion <= 10) {
          var tx = req.transaction;
          const subscriptionStore = tx.objectStore('subscriptions')
          subscriptionStore.createIndex('count', 'count');
        }
        if (evt.oldVersion <= 11) {
          var tx = req.transaction;
          const userStore = tx.objectStore('users')
          userStore.createIndex('timestamp', 'timestamp')
        }
        if (evt.oldVersion <= 12) {
          var tx = req.transaction;
          const activityStore = tx.objectStore('activity')
          activityStore.createIndex('status', 'status')
        }
        if (evt.oldVersion <= 13) {
          var tx = req.transaction;
          const subscriptions = tx.objectStore('subscriptions')
          subscriptions.createIndex('validSubscription', ['office', 'template', 'status'])
          const addendum = tx.objectStore('addendum')
          addendum.createIndex('key', 'key')
          addendum.createIndex('KeyTimestamp',['timestamp','key'])
        }

        if(evt.oldVersion <= 14) {
          var tx = req.transaction;
          const users = tx.objectStore('users');
          users.createIndex('NAME_SEARCH','NAME_SEARCH')
        
          users.openCursor().onsuccess = function(event){
            const cursor = event.target.result;
            if(!cursor) return;
            if(!cursor.value.timestamp) {
                cursor.value.timestamp = '';
            }
            cursor.value.NAME_SEARCH = cursor.value.displayName.toLowerCase();
            const update =  cursor.update(cursor.value)
            update.onsuccess = function(){
              console.log("updated user ",cursor.value)
            }

            cursor.continue();  
          }
        }


      };
    }
    req.onsuccess = function () {
      db = req.result;

      if (!areObjectStoreValid(db.objectStoreNames)) {
        db.close();
        console.log(auth)
        const deleteIDB = indexedDB.deleteDatabase(auth.uid);
        deleteIDB.onsuccess = function () {
          window.location.reload();
        }
        deleteIDB.onblocked = function () {
          snacks('Please Re-Install The App')
        }
        deleteIDB.onerror = function () {
          snacks('Please Re-Install The App')
        }
        return;
      }
      const startLoad = document.querySelector('#start-load')
      startLoad.classList.remove('hidden');
      console.log("run app")
      document.getElementById("main-layout-app").style.display = 'block'
    
      // ga('set', 'userId', '12345')

      const texts = ['Loading Growthfile', 'Getting Your Data', 'Creating Profile', 'Please Wait']

      let index = 0;
      var interval = setInterval(function () {
        if (index == texts.length - 1) {
          clearInterval(interval)
        }
        startLoad.querySelector('p').textContent = texts[index]
        index++;
      }, index + 1 * 1000);
      // profileView();
      // return;
      requestCreator('now', {
        device: native.getInfo(),
        from: '',
        registerToken: native.getFCMToken()
      }).then(function (response) {
        if (response.updateClient) {
          updateApp()
          return
        }
        if (response.revokeSession) {
          revokeSession();
          return
        };
        getRootRecord().then(function (rootRecord) {
          if (!rootRecord.fromTime) {
            requestCreator('Null').then(profileCheck).catch(function (error) {
              snacks(error.response.message, 'Okay')
            })
            return;
          }
          profileCheck();
          requestCreator('Null').then(console.log).catch(function (error) {
            snacks(error.response.message, 'Okay', (function () {
              startApp(true)
            }))
          })
        })
      }).catch(function (error) {
        console.log(error)
        snacks(error.response.message, 'Retry')
      })
    }
    req.onerror = function () {
      handleError({
        message: `${req.error.message} from startApp`
      })
    }

  })
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
      if(!files.length) return;
        const file = files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadEvt) {
          const srcData = fileLoadEvt.target.result;
          const image = new Image();
          image.src = srcData;
          image.onload = function(){
            const newDataUrl = resizeAndCompressImage(image);
            document.getElementById('image-update').src = newDataUrl;
            progCard.open();
            requestCreator('backblaze', {
              'imageBase64': newDataUrl
            }).then(function () {
              progCard.close();
              checkForRecipient()
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
  checkForRecipient()
}


function resizeAndCompressImage(image){
  var canvas = document.createElement('canvas');
  const canvasDimension = new CanvasDimension(image.width,image.height);
  canvasDimension.setMaxHeight(screen.height)
  canvasDimension.setMaxWidth(screen.width);
  const newDimension = canvasDimension.getNewDimension()
  canvas.width = newDimension.width
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  const newDataUrl = canvas.toDataURL('image/jpeg',0.5);
  return newDataUrl;

}

function CanvasDimension(width,height){
this.MAX_HEIGHT = ''
this.MAX_WIDTH =''
this.width = width;
this.height = height;
}
CanvasDimension.prototype.setMaxWidth = function(MAX_WIDTH) {
  this.MAX_WIDTH = MAX_WIDTH
}
CanvasDimension.prototype.setMaxHeight = function(MAX_HEIGHT) {
  this.MAX_HEIGHT = MAX_HEIGHT
}
CanvasDimension.prototype.getNewDimension = function(){
  if(this.width > this.height) {
    if(this.width > this.MAX_WIDTH) {
      this.height *= this.MAX_WIDTH/ this.width;
      this.width = this.MAX_WIDTH;

    }
  }
  else {
    if(this.height > this.MAX_HEIGHT) {
      this.width *= this.MAX_HEIGHT / this.height;
      this.height = this.MAX_HEIGHT
    }
  }
  return {
    width:this.width,
    height:this.height
  }
}

function checkForRecipient() {
  const auth = firebase.auth().currentUser;
  getEmployeeDetails(IDBKeyRange.bound(['recipient', 'CONFIRMED'], ['recipient', 'PENDING']), 'templateStatus').then(function (result) {
    if (!result.length) return mapView();
    return mapView();
    if (auth.email && auth.emailVerified) return mapView();

    const text = getReportNameString(result)
    if (!auth.email) {
      const content = `<h3 class='mdc-typography--headline6 mt-0'>${text}</h3>
    <div class="mdc-text-field mdc-text-field--outlined" id='email'>
       <input class="mdc-text-field__input" required>
      <div class="mdc-notched-outline">
          <div class="mdc-notched-outline__leading"></div>
          <div class="mdc-notched-outline__notch">
                <label class="mdc-floating-label">Email</label>
          </div>
          <div class="mdc-notched-outline__trailing"></div>
      </div>
    </div>`

      const button = `<div class="mdc-card__actions">
    <div class="mdc-card__action-icons"></div>
    <div class="mdc-card__action-buttons">
    <button class="mdc-button" id='addEmail'>
      <span class="mdc-button__label">UPDATE</span>
      <i class="material-icons mdc-button__icon" aria-hidden="true">arrow_forward</i>
    </button>
 </div>
 </div>`


      document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, '<span class="mdc-top-app-bar__title">Add You Email Address</span>', button)
      const emailInit = new mdc.textField.MDCTextField(document.getElementById('email'))
      const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'))


      new mdc.ripple.MDCRipple(document.getElementById('addEmail')).root_.addEventListener('click', function (evt) {
        if (!emailInit.value) {
          emailInit.focus();
          return
        }
        progCard.open();
        requestCreator('updateAuth', {
          email: emailInit.value,
          phoneNumber:firebase.auth().currentUser.phoneNumber
        }).then(function () {
          snacks('Verification Link has been Sent to ' + emailInit.value)
          mapView();
          progCard.close();

        }).catch(console.log)
      })
      return
    }

    if (!auth.emailVerified) {
      const currentEmail = firebase.auth().currentUser.email
      const content = `<h3 class='mdc-typography--headline6 mt-0'>${text}</h3>
      <h3 class='mdc-typography--body1'>Click To Send a verification Email</h3>
      <button class="mdc-button mdc-theme--primary-bg mdc-theme--on-primary" id='sendVerification'>
      <span class="mdc-button__label">RESEND VERIFICATION MAIL</span>
      </button>`
      document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, '<span class="mdc-top-app-bar__title">VERIFY YOUR EMAIL ADDRESS</span>', '')
      const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'))

      new mdc.ripple.MDCRipple(document.getElementById('sendVerification')).root_.addEventListener('click', function (evt) {
        progCard.open();
        requestCreator('updateAuth', {
          email: currentEmail,
          phoneNumber:firebase.auth().currentUser.phoneNumber
        }).then(function () {
          progCard.close();
          snacks('Verification Link has been Sent to ' + currentEmail)
          mapView();
        }).catch(console.log)
      })

      return;
    };

  });
}

function getReportNameString(result) {
  let string = ''
  let base = 'You are a recipient in '
  const offices = {}
  result.forEach(function (report) {
    if (!offices[report.office]) {
      offices[report.office] = [report.attachment.Name.value]
    } else {
      offices[report.office].push(report.attachment.Name.value)
    }
  })

  const keys = Object.keys(offices)
  keys.forEach(function (office, idx) {
    const reportNames = offices[office].join(',')
    console.log(idx)

    base += ' ' + reportNames + ' For ' + office + ' &'



  })
  const lastChar = base[base.length - 1];
  if (lastChar === '&') {
    return base.substring(0, base.length - 1)
  }
  return base;
}


function simpleInputField() {

}

function profileCheck() {
  history.state = null;
  document.getElementById('start-load').classList.add('hidden');
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
    history.pushState(['profileCheck'], null, null)
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
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum']

  for (let index = 0; index < stores.length; index++) {
    const el = stores[index];
    if (!names.contains(el)) return false;
  }
  return true;

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
        message: getEmployee.error
      })
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
  activity.createIndex('template', 'template');
  activity.createIndex('status', 'status')
  const list = db.createObjectStore('list', {
    keyPath: 'activityId'
  })
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');
  list.createIndex('office', 'office');

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')
  users.createIndex('mobile', 'mobile')
  users.createIndex('timestamp', 'timestamp')
  users.createIndex('NAME_SEARCH','NAME_SEARCH')
  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key')
  addendum.createIndex('KeyTimestamp',['timestamp','key'])
  const subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  })

  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status'])

  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('count', 'count');
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
  if (!venueData) {
    value.venue = [venue]
    value.share = [];
    return value;

  }
  venue.location = venueData.location;
  venue.address = venueData.address;
  venue.geopoint.latitude = venueData.latitude;
  venue.geopoint.longitude = venueData.longitude;
  value.venue = [venue]
  value.share = [];
  console.log(value)
  return value
}


function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    let offices = []
    const tx = db.transaction(['children']);
    const childrenStore = tx.objectStore('children').index('employees');
    childrenStore.openCursor(firebase.auth().currentUser.phoneNumber).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;

      offices.push(cursor.value.office)
      cursor.continue()
    }
    tx.oncomplete = function () {
      console.log(offices)
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

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {

    const results = [];
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

  })
}