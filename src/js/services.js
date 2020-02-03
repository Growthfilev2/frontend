const workerResolves = {};
const workerRejects = {};
let workerMessageIds = 0;

function isWifiRequired() {
  if (native.getName() !== 'Android') return false;
  if (AndroidInterface.isWifiOn()) return false;

  const deviceInfo = JSON.parse(native.getInfo());
  const requiredWifiDevices = {
    'samsung': true,
    'OnePlus': true
  }

  if (requiredWifiDevices[deviceInfo.deviceBrand]) return true;
  return false;

}



var readDebounce = debounce(function () {
  requestCreator('Null').then(handleComponentUpdation).catch(console.error)
}, 1000, false)
window.addEventListener('callRead', readDebounce);



function handleError(error) {
  console.log(error)
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (errorInStorage.hasOwnProperty(error.message))
    error.device = localStorage.getItem('deviceInfo');
  errorInStorage[error.message] = error
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  return requestCreator('instant', JSON.stringify(error))
}


function successDialog(text) {

  const successMark = document.getElementById('success-animation');
  const viewContainer = document.getElementById('app-current-panel');
  successMark.classList.remove('hidden');
  document.getElementById('app-header').style.opacity = '0.1'
  viewContainer.style.opacity = '0.1';
  successMark.querySelector('.success-text').textContent = text;
  setTimeout(function () {
    successMark.classList.add('hidden');
    viewContainer.style.opacity = '1';
    document.getElementById('app-header').style.opacity = '1'
  }, 2000);
}


function snacks(message, text, callback) {
  snackBar.labelText = message;
  snackBar.open();
  snackBar.timeoutMs = 4000
  snackBar.actionButtonText = text ? text : 'Okay';

  snackBar.listen('MDCSnackbar:closed', function (evt) {
    if (evt.detail.reason !== 'action') return;
    if (callback && typeof callback === 'function') {
      callback()
    }
  })
}




function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}

function appLocation(maxRetry) {
  return new Promise(function (resolve, reject) {
    return resolve({
      latitude:22,
      longitude:77,
      lastLocationTime:Date.now()
    })
    manageLocation(maxRetry).then(function (geopoint) {
      if (!ApplicationState.location) {
        ApplicationState.location = geopoint
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
        return resolve(geopoint);
      }

      if (history.state && history.state[0] !== 'profileCheck' && isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) {
        return reject({
          message: 'THRESHOLD EXCEED',
          body: {
            geopoint: geopoint
          }
        })
      };

      ApplicationState.location = geopoint
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
      return resolve(geopoint)
    }).catch(reject)
  })
}

function manageLocation(maxRetry) {

  return new Promise(function (resolve, reject) {

    getLocation().then(function (location) {
      if (location.accuracy >= 35000) {
        if (maxRetry > 0) {
          setTimeout(function () {
            console.log('retry because of high accuracy')
            manageLocation(maxRetry - 1).then(resolve).catch(reject)
          }, 1000)
        } else {
          console.log('retry end of high accuracy')
          return handleLocationOld(3, location).then(resolve).catch(reject)
        }
      } else {
        console.log('accuracy is less than 35000')
        return handleLocationOld(3, location).then(resolve).catch(reject)
      }
    }).catch(reject);
  });
}

function handleLocationOld(maxRetry, location) {
  return new Promise(function (resolve, reject) {
    const storedLocation = getStoredLocation();

    if (!storedLocation) return resolve(location)
    if (!isLocationOld(storedLocation, location)) return resolve(location);
    if (maxRetry > 0) {
      setTimeout(function () {
        getLocation().then(function (newLocation) {
          console.log('retry because new location is same to old location')
          handleLocationOld(maxRetry - 1, newLocation).then(resolve).catch(reject)
        }).catch(reject)
      }, 1000)
      return
    }
    return resolve(location);
  })
}


function getLocation() {
  return new Promise(function (resolve, reject) {


    if (!navigator.onLine) return reject({
      message: 'BROKEN INTERNET CONNECTION'
    })

    if (native.getName() !== 'Android') {
      try {
        webkit.messageHandlers.locationService.postMessage('start');
        window.addEventListener('iosLocation', function _iosLocation(e) {
          resolve(e.detail)
          window.removeEventListener('iosLocation', _iosLocation, true);
        }, true)
      } catch (e) {
        html5Geolocation().then(function (geopoint) {
          return resolve(geopoint)
        }).catch(function (error) {
          reject(error)
        })
      }
      return;
    }


    html5Geolocation().then(function (htmlLocation) {
      if (htmlLocation.isLocationOld || htmlLocation.accuracy >= 350) {
        handleGeoLocationApi().then(resolve).catch(function (error) {
          return resolve(htmlLocation);
        })
        return;
      };
      return resolve(htmlLocation)
    }).catch(function (htmlError) {
      handleGeoLocationApi().then(resolve).catch(function (error) {
        return reject({
          message: 'Both HTML and Geolocation failed to fetch location',
          body: {
            html5: htmlError,
            geolocation: error,
          },
          'locationError': true
        })
      })
    })
  })
}


function handleGeoLocationApi() {
  return new Promise(function (resolve, reject) {
    let body;
    try {
      body = getCellularInformation();
    } catch (e) {
      reject(e.message);
    }
    if (!Object.keys(body).length) {
      reject("empty object from getCellularInformation");
    }
    requestCreator('geolocationApi', body).then(resolve).catch(reject)
  })
}

function iosLocationError(iosError) {
  html5Geolocation().then(function (geopoint) {
    var iosLocation = new CustomEvent('iosLocation', {
      "detail": geopoint
    });
    window.dispatchEvent(iosLocation)
  }).catch(console.error);
  handleError(iosError)
}

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(function (position) {
      return resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        provider: 'HTML5',
        isLocationOld: isLocationOld(position.coords, getStoredLocation()),
        lastLocationTime: Date.now(),
      })
    }, function (error) {
      reject({
        message: error.message
      })
    }, {
      maximumAge: 0,
      timeout: 8000,
      enableHighAccuracy: false
    })
  })
}

const apiHandler = new Worker('js/apiHandler.js?version=84');

function requestCreator(requestType, requestBody, geopoint) {
  var auth = firebase.auth().currentUser;
  var requestGenerator = {
    type: requestType,
    body: requestBody,
    meta: {
      user: {
        token: '',
        uid: auth.uid,
        displayName: auth.displayName,
        photoURL: auth.photoURL,
        phoneNumber: auth.phoneNumber,
      },
      key: appKey.getMapKey(),
      apiUrl: appKey.getBaseUrl(),
    },
  };


  if (!geopoint) return executeRequest(requestGenerator);
  return getRootRecord().then(function (rootRecord) {
    const time = fetchCurrentTime(rootRecord.serverTime);
    requestGenerator.body['timestamp'] = time
    requestGenerator.body['geopoint'] = geopoint;
    if (requestBody.template === 'check-in') {
      ApplicationState.lastCheckInCreated = time
    };
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
    console.log('sending', requestGenerator);
    return executeRequest(requestGenerator);
  });
}

function executeRequest(requestGenerator) {
  const auth = firebase.auth().currentUser;
  if (requestGenerator.type !== 'instant') {
    progressBar.open();
  }

  return auth.getIdToken().then(function (token) {
    requestGenerator.meta.user.token = token;
    apiHandler.onmessage = function (event) {
      progressBar.close();

      console.log(event);
      if (!event.data.success) {
        const reject = workerRejects[event.data.id];
        if (reject) {
          reject(event.data);


          if (!event.data.apiRejection) {
            handleError({
              message: event.data.message,
              body: JSON.stringify(event.data.body)
            })
          } else if (event.data.requestType !== 'Null') {
            snacks(event.data.message);
          }
        }
      } else {
        const resolve = workerResolves[event.data.id];
        if (resolve) {
          if(event.data.response.hasOwnProperty('reloadApp') && !event.data.response.reloadApp)  {
            delete event.data.response.reloadApp;
          }
          resolve(event.data.response);
        }
      }
      delete workerResolves[event.data.id]
      delete workerRejects[event.data.id]
    }

    apiHandler.onerror = function (event) {

      progressBar.open();
      handleError({
        message: event.message,
        body: JSON.stringify({
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })
    };

    return new Promise(function (resolve, reject) {
      const id = workerMessageIds++;
      requestGenerator.id = id;
      workerResolves[id] = resolve;
      workerRejects[id] = reject;

      apiHandler.postMessage(requestGenerator);
    })
  });
}


function updateApp() {
  if (native.getName() !== 'Android') return webkit.messageHandlers.updateApp.postMessage('Update App');
  const updateAppDialog = new Dialog('New Update Avaialble', 'Please Install the Latest version from google play store , to Use Growthfile. Click Okay to Install Lastest Version from Google Play Store.').create()
  updateAppDialog.open();
  updateAppDialog.scrimClickAction = ''
  updateAppDialog.listen('MDCDialog:opened', function () {
    const cancelButton = updateAppDialog.buttons_[0];
    cancelButton.setAttribute('disabled', 'true');
  })
  updateAppDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;
    AndroidInterface.openGooglePlayStore('com.growthfile.growthfileNew')
  })
}

function revokeSession() {
  firebase.auth().signOut().then(function () {
    document.getElementById('app-header').classList.add('hidden');
  }).catch(function (error) {

    handleError({
      message: 'Sign out error',
      body: error
    });
  });
}

function officeRemovalSuccess(data) {
  const officeRemoveDialog = new Dialog('Reminder', 'You have been removed from ' + data.msg.join(' & ')).create();
  officeRemoveDialog.open();
  officeRemoveDialog.listen('MDCDialog:closed', function () {});
  return
}

function updateIosLocation(geopointIos) {
  geopointIos.lastLocationTime = Date.now()
  var iosLocation = new CustomEvent('iosLocation', {
    "detail": geopointIos
  });
  window.dispatchEvent(iosLocation)
}

function handleComponentUpdation(readResponse) {
  console.log(readResponse)
  if (readResponse.reloadApp) {
    reloadPage();
    return;
  }

  if (readResponse.templates.length) {
    getCheckInSubs().then(function (checkInSubs) {

      ApplicationState.officeWithCheckInSubs = checkInSubs
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    })

  }
  if (!history.state) return;

  switch (history.state[0]) {


    case 'enterChat':
      if (!readResponse.addendum.length) return;
      dynamicAppendChats(readResponse.addendum)
      break;
    case 'chatView':
      if (!readResponse.addendum.length) return;
      readLatestChats(false);
      break;

    case 'reportView':

      reportView(history.state[1]);


      break;
    default:
      console.log("no refresh")
  }
}

/** function call to be removed from apk */
function backgroundTransition() {}

function runRead(type) {
  if (!firebase.auth().currentUser) return;
  if (type.read) {
    var readEvent = new CustomEvent('callRead', {
      detail: type.read
    })
    window.dispatchEvent(readEvent);
  }
  return
}


function debounce(func, wait, immeditate) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    var later = function () {
      timeout = null;
      if (!immeditate) func.apply(context, args)
    }
    var callNow = immeditate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  }
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function getRootRecord() {
  return new Promise(function (resolve, reject) {
    let record;
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootStore = rootTx.objectStore('root')
    rootStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
      const data = event.target.result;
      record = data;
    }

    rootTx.oncomplete = function () {
      resolve(record)
    }
    rootTx.onerror = function () {
      reject({
        message: `${rootTx.error.message} from getRootRecord`
      })
    }
  })
}


function getSubscription(office, template) {
  return new Promise(function (resolve) {
    const tx = db.transaction(['subscriptions']);
    const subscription = tx.objectStore('subscriptions')
    let range;
    let index;
    if (office) {
      index = subscription.index('validSubscription')
      range = IDBKeyRange.bound([office, template, 'CONFIRMED'], [office, template, 'PENDING'])
    } else {
      index = subscription.index('templateStatus');
      range = IDBKeyRange.bound([template, 'CONFIRMED'], [template, 'PENDING'])
    }
    index.getAll(range).onsuccess = function (event) {
      return resolve(event.target.result)
    }
  })
}

function emailReg(email) {
  const emailRegString = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegString.test(String(email).toLowerCase())
}


function handleNav(evt) {
  console.log(evt)
  if (!history.state) return;
  if (history.state[0] === 'reportView') {
    history.pushState(['profileView'], null, null)
    profileView();
    return;
  }
  return history.back();
}



function bottomDialog(dialog, ul) {

  ul.singleSelection = true
  ul.selectedIndex = 0;

  setTimeout(function () {
    dialog.root_.querySelector('.mdc-dialog__surface').classList.add('open')
    ul.foundation_.adapter_.focusItemAtIndex(0);
  }, 50)

  dialog.listen('MDCDialog:opened', function () {
    ul.layout();
  })

  dialog.listen('MDCDialog:closing', function () {
    dialog.root_.querySelector('.mdc-dialog__surface').classList.remove('open');
  })
  dialog.open();
}

function getImageBase64(evt, compressionFactor = 0.5) {
  return new Promise(function (resolve, reject) {
    const files = evt.target.files
    if (!files.length) return;
    const file = files[0];
    var fileReader = new FileReader();
    fileReader.onload = function (fileLoadEvt) {
      const srcData = fileLoadEvt.target.result;
      const image = new Image();
      image.src = srcData;
      image.onload = function () {
        const newDataUrl = resizeAndCompressImage(image, compressionFactor);
        return resolve(newDataUrl)
      }
    }
    fileReader.readAsDataURL(file);
  })
}


function updateName(callback) {

  const auth = firebase.auth().currentUser;
  let backIcon = ''
  if (history.state[0] === 'profileCheck') {
    backIcon = `<span class="mdc-top-app-bar__title">Name</span>`

  } else {
    backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Name</span>
    `
  }

  setHeader(backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `
  
  <div class='mdc-layout-grid change-name'>
    <p class='mdc-typography--body1'>
        Please provide your name
    </p>
    ${textFieldWithHelper({
      id:'name',
      value:auth.displayName || '',
      required:true,
      label:'Name'
    }).outerHTML}
  </div>
  <div  class='mb-10 mt-10'>
    ${actionButton('Update','name-btn').outerHTML}
  </div>`

  const nameField = new mdc.textField.MDCTextField(document.getElementById('name'))
  nameField.focus();
  document.getElementById('name-btn').addEventListener('click', function () {
    if (!nameField.value) {
      setHelperInvalid(nameField,'Name Cannot Be Left Blank')
      return;
    }
    progressBar.open();
    auth.updateProfile({
      displayName: nameField.value.trim()
    }).then(function () {
      progressBar.close();
      snacks('Name updated')
      callback();
    })
  })
}

function getEmailViewHeading(auth) {
  const text = {
    topBarText: '',
    heading: '',
    btnText: 'Update'
  }

  if (!auth.email) {
    text.topBarText = 'Email';
    // text.heading = 'Please Add You Email Address To Continue'
    return text;
  }
  if (!auth.emailVerified) {

    text.topBarText = 'Email'
    // text.heading = 'Please Verify Your Email Address To Continue'
    text.btnText = 'Verify'
    return text;
  }
  text.topBarText = 'Email'
  text.btnText = 'Update'
  return text;
}




function emailUpdation(skip, callback) {
  const auth = firebase.auth().currentUser;
  const headings = getEmailViewHeading(auth)
  let backIcon = '';
  if (history.state[0] === 'profileCheck') {
    backIcon = `
    <span class="mdc-top-app-bar__title">${headings.topBarText}</span>
    `
  } else {
    backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${headings.topBarText}</span>
    `
  }

  const header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden');

  document.getElementById('app-current-panel').innerHTML = updateEmailDom(skip, headings)
  const emailField = new mdc.textField.MDCTextField(document.getElementById('email'))
  emailField.focus();
  document.getElementById('email-btn').addEventListener('click', function () {

    if (!emailReg(emailField.value)) {
      setHelperInvalid(emailField,'Enter A Valid Email Id')
      return;
    };


    progressBar.open();

    if (auth.email) {
      if (emailField.value !== auth.email) {
        emailUpdate(emailField.value, callback)
        return;
      }
      if (!auth.emailVerified) {
        emailVerification(callback);
        return
      }
      progressBar.close()
      setHelperInvalid(emailField,'New Email Cannot Be Same As Previous Email')
      return
    }

    emailUpdate(emailField.value, callback)
    return
  });

  const skipbtn = document.getElementById('skip-btn')
  if (!skipbtn) return;

  new mdc.ripple.MDCRipple(skipbtn)
  skipbtn.classList.remove('hidden')
  skipbtn.addEventListener('click', function () {
    const rootTx = db.transaction('root', 'readwrite');
    const rootStore = rootTx.objectStore('root');

    rootStore.get(auth.uid).onsuccess = function (event) {
      const record = event.target.result;
      record.skipEmail = true
      rootStore.put(record);
    }
    rootTx.oncomplete = function () {

      callback();
    }
  })


}

function emailUpdate(email, callback) {
  firebase.auth().currentUser.updateEmail(email).then(function () {
    emailVerification(callback);
  }).catch(handleEmailError)
}

function emailVerification(callback) {

  firebase.auth().currentUser.sendEmailVerification().then(function () {
    snacks('Email verification has been sent.')
    progressBar.close();

    emailVerificationWait(callback)
  }).catch(handleEmailError)
}

function emailVerificationWait(callback) {
  const auth = firebase.auth().currentUser
  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid'>
  <h3 class='mdc-typography--headline6'>Verification Link Has Been Sent To ${firebase.auth().currentUser.email}</h3>
  <p class='mdc-typography--body1'>Click Continue To Proceed Further</p>
</div>
${actionButton('CONTINUE','continue').outerHTML}
`
  document.getElementById('continue').addEventListener('click', function (evt) {

    firebase.auth().currentUser.reload();
    setTimeout(function () {
      firebase.auth().currentUser.reload();
      if (!auth.emailVerified) {
        snacks('Email not verified. Try again');
        return;
      }
      callback();
    }, 2000)
  })
}

function handleEmailError(error) {
  progressBar.close()
  if (error.code === 'auth/requires-recent-login') {
    const dialog = showReLoginDialog('Email Authentication', 'Please Login Again To Complete The Operation');
    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      if (history.state[0] !== 'profileCheck') {
        EMAIL_REAUTH = true;
      }
      revokeSession();
    })
    return;
  }
  snacks(error.message);
}




function updateEmailDom(skipbtn, headings) {
  const email = firebase.auth().currentUser.email
  return `
  <div class='mdc-layout-grid update-email'>
    ${skipbtn ? `<button class='mdc-button mt-10 mdc-button--raised' id='skip-btn'>
    <span class='mdc-button__label mdc-theme--secondary'>SKIP<span>
    </button>` :''}

    <h3 class='mdc-typography--headline6'>${headings.heading}</h3>
    <p class='report-rec mt-10 mdc-typography--body1'>
      Verify your email to receive  offer letter, salary slip, tax forms & other documents
    </p>
    ${textFieldWithHelper({
      id:'email',
      classList:['mt-10'],
      value:email ||'',
      type:'email',
      label:'Email',
    }).outerHTML}
</div>
<div  class='mb-10 mt-10'>
  ${actionButton(headings.btnText,'email-btn').outerHTML}
</div>
`
}

function isPossiblyValidAadharNumber(string) {
  return /^\d{4}\d{4}\d{4}$/.test(string)
}

function isPossiblyValidPan(string) {
  return /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(string)
}


function showPan(record) {

  if (history.state[0] !== 'profileCheck') return true
  if (record.pan.number && record.pan.front && record.pan.back) return false;
  return true
}

function showAadhar(record) {
  if (history.state[0] !== 'profileCheck') return true
  if (record.aadhar.number && record.aadhar.front && record.aadhar.back) return false;
  return true
}



function idProofView(callback) {
  getRootRecord().then(function (rootRecord) {
    const auth = firebase.auth().currentUser;
    const ids = rootRecord.idProof || {
      'aadhar': {
        'front': '',
        'back': '',
        'number': ''
      },
      'pan': {
        'front': '',
        'number': ''
      }
    }

    let backIcon = ''
    if (history.state[0] === 'profileCheck') {
      backIcon = ' <span class="mdc-top-app-bar__title">Add ID Proof</span>'
    } else {
      backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add ID Proof</span>
    `
    }
    setHeader(backIcon, '');

    const panel = document.getElementById('app-current-panel');
    panel.innerHTML = `
  <div class='id-container app-padding'>
  ${history.state[0] === 'profileCheck' ? ` <button class='mdc-button mdc-button--raised' id='skip-btn'>SKIP</button>` :'' }
    
    

    <div class='pan-container pb-10 ${showPan(ids) ? '' : 'hidden'}'>
    <h3 class='mdc-typography--headline6 mdc-theme--primary'> Enter PAN card details</h3>
      ${textFieldWithHelper({
        id:'pan-number',
        label:'Enter PAN Number',
        value:ids.pan.number,
        type:'text',
        required:true,
        classList:['mt-10','mb-10']
      }).outerHTML}
  
    <div class='pan-images mdc-layout-grid__inner'>
        <div class='mdc-layout-grid__cell mdc-layout-grid__cell--span-2-phone'>
          <div class='image-container'>
            <img src='${ids.pan.front || './img/placeholder.png' }'  class='width-100' data-name="panFront"  data-valid="${ids.pan.front ? 'true' : 'false'}">
            <div class='add-icon-cont'>
              <button class="mdc-fab mdc-fab--mini mdc-button--raised">
                <span class="mdc-fab__icon material-icons">add_a_photo</span>
                <input type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>
              </button>
            </div>
          </div>
          <div class="mdc-image-list__supporting">
            <span class="mdc-image-list__label">PAN FRONT</span>
          </div>
        </div>
        
    </div>
    <div class='aadhar-container ${showAadhar(ids) ? '' : 'hidden'}'>
        <h3 class='mdc-typography--headline6 mdc-theme--primary'>Enter AADHAR card details</h3>
        ${textFieldWithHelper({
          id:'aadhar-number',
          label:'Enter AADHAR card Number',
          value:ids.aadhar.number,
          type:'text',
          required:true,
          classList:['mt-10','mb-10']
        }).outerHTML}
      <div class='aadhar-images mdc-layout-grid__inner'>
      <div class='mdc-layout-grid__cell mdc-layout-grid__cell--span-2-phone'>
      <div class='image-container'>
        <img src='${ids.aadhar.front || './img/placeholder.png' }' class='width-100' data-name="aadharFront"  data-valid="${ids.aadhar.front ? 'true' : 'false'}">
        <div class='add-icon-cont'>
          <button class="mdc-fab mdc-fab--mini mdc-button--raised">
            <span class="mdc-fab__icon material-icons">add_a_photo</span>
            <input type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>
          </button>
        </div>
       
      </div>
      <div class="mdc-image-list__supporting">
      <span class="mdc-image-list__label">AADHAR FRONT</span>
    </div>
    </div>
    <div class='mdc-layout-grid__cell mdc-layout-grid__cell--span-2-phone'>
    <div class='image-container'>
        <img src='${ids.aadhar.back || './img/placeholder.png' }' class='width-100' data-name="aadharBack" data-valid="${ids.aadhar.back ? 'true' : 'false'}">
        
        <div class='add-icon-cont'>
          <button class="mdc-fab mdc-fab--mini mdc-button--raised">
            <span class="mdc-fab__icon material-icons">add_a_photo</span>
            <input type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>
          </button>
        </div>
    </div>
    <div class="mdc-image-list__supporting">
      <span class="mdc-image-list__label">AADHAR BACK</span>
    </div> 
    </div>
</div>
      </div>
    </div>
    </div>
    ${actionButton('UPDATE','submit-btn').outerHTML}
  `
    
    const panNumber = new mdc.textField.MDCTextField(document.getElementById('pan-number'))
    const aadharNumber = new mdc.textField.MDCTextField(document.getElementById('aadhar-number'))
    const skipBtn = document.getElementById('skip-btn');

    [...document.querySelectorAll('.id-container .mdc-fab input')].forEach(function (el) {
      el.addEventListener('change', function (evt) {

        getImageBase64(evt).then(function (dataURL) {
          const parentImg = el.closest('.image-container').querySelector('img')
          if(!parentImg) return;
          parentImg.src = `${dataURL}`;
          parentImg.dataset.valid = true
        });
      })
    })

    const submitBtn = document.getElementById('submit-btn');
    new mdc.ripple.MDCRipple(submitBtn);
    submitBtn.addEventListener("click", function () {

      if (!isPossiblyValidAadharNumber(aadharNumber.value.trim())) {
        setHelperInvalid(aadharNumber, 'Please enter a valid AADHAR number');
        return;
      }

      if (!isPossiblyValidPan(panNumber.value.trim())) {
        setHelperInvalid(panNumber,'Please enter a valid PAN number');
        return;
      };
      const validImagesLength = [...document.querySelectorAll(`[data-valid="false"]`)].length;

      if (validImagesLength) {
        snacks('Please Upload All Images');
        return;
      }

      ids.aadhar.number = aadharNumber.value.trim();
      ids.aadhar.front = document.querySelector(`[data-name="aadharFront"]`).src;
      ids.aadhar.back = document.querySelector(`[data-name="aadharBack"]`).src;
      ids.pan.number = panNumber.value.trim();
      ids.pan.front = document.querySelector(`[data-name="panFront"]`).src;

      submitBtn.setAttribute('disabled', true)
      if (skipBtn) {
        skipBtn.setAttribute('disabled', true)
      }
      requestCreator('idProof', ids).then(function (response) {
        const tx = db.transaction('root', 'readwrite');
        const store = tx.objectStore('root')
        store.get(auth.uid).onsuccess = function (event) {
          const newRecord = event.target.result;
          newRecord.idProof = response;
          store.put(newRecord);
        }
        tx.oncomplete = function () {
          callback();
        }
      }).catch(function () {
        if (skipBtn) {
          skipBtn.removeAttribute('disabled')
        }
        submitBtn.removeAttribute('disabled')
      });
    })
    if (!skipBtn) return;

    new mdc.ripple.MDCRipple(skipBtn);
    skipBtn.addEventListener('click', function () {
      const tx = db.transaction('root', 'readwrite');
      const store = tx.objectStore('root')
      store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
        const record = event.target.result;
        record.skipIdproofs = true
        store.put(record)
      }
      tx.oncomplete = function () {
        if (callback) {
          callback();
        }
      }
    })
  })
}









function getDropDownContent(office, template, indexName) {
    return new Promise(function (resolve, reject) {
        const data = []
        const name_object = {}
        const tx = parent.db.transaction(['children'])
        let keyRange = ''
        if(office) {
           keyRange = IDBKeyRange.only([office, template])
        }
        else {
          keyRange = IDBKeyRange.only(template)
        }
        tx.objectStore('children').index(indexName).openCursor(keyRange).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
            const value = cursor.value.attachment.Name.value
            if (name_object[value]) {
                cursor.continue();
                return;
            }
            name_object[value] = true;
            data.push(value);

            
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(data)
        }

    })
}


const phoneFieldInit = (input,dropEl,hiddenInput) => {
  
    return intlTelInput(input, {
        initialCountry: "IN",
        formatOnDisplay: true,
        separateDialCode: true,
        dropdownContainer:dropEl || null,
        hiddenInput:hiddenInput || "",
        nationalMode:false
    });
  };