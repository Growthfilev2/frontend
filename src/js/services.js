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


var readStack = [];
var readDebounce = debounce(function () {
  requestCreator('Null').then(handleComponentUpdation).catch(console.log)
}, 1000, false)
window.addEventListener('callRead', readDebounce);




function handleError(error) {
  console.log(error)
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (errorInStorage.hasOwnProperty(error.message)) return;
  error.device = localStorage.getItem('deviceInfo');
  errorInStorage[error.message] = error
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  requestCreator('instant', JSON.stringify(error))
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
    if (isLocationOld(storedLocation, location)) {
      if (maxRetry > 0) {
        setTimeout(function () {
          getLocation().then(function (newLocation) {
            console.log('retry because new location is same to old location')

            handleLocationOld(maxRetry - 1, newLocation).then(resolve).catch(reject)
          }).catch(reject)
        }, 1000)
      } else {
        console.log('retry end because no change in location')

        return handleSpeedCheck(3, location, storedLocation).then(resolve).catch(reject)
      }
    } else {
      console.log('new location is different')

      return handleSpeedCheck(3, location, storedLocation).then(resolve).catch(reject)
    }
  })
}

function handleSpeedCheck(maxRetry, location, storedLocation) {
  return new Promise(function (resolve, reject) {

    const dDelta = distanceDelta(storedLocation, location);
    const tDelta = timeDelta(storedLocation.lastLocationTime, location.lastLocationTime)


    if (calculateSpeed(dDelta, tDelta) >= 40) {
      if (maxRetry > 0) {
        setTimeout(function () {
          getLocation().then(function (newLocation) {
            console.log('retry for speed')

            handleSpeedCheck(maxRetry - 1, newLocation, storedLocation).then(resolve).catch(reject)
          }).catch(reject)
        }, 1000)
      } else {
        console.log('retry for speed end')

        return resolve(location)
      }
    } else {
      console.log('no need to retry for speed')

      return resolve(location);
    }
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
        html5Geolocation().then(resolve).catch(reject)
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
    requestCreator('geolocationApi', body).then(function (result) {
      return resolve(result.response);
    }).catch(function (error) {
      reject(error)
    })
  })
}


function iosLocationError(iosError) {
  html5Geolocation().then(function (geopoint) {
    var iosLocation = new CustomEvent('iosLocation', {
      "detail": geopoint
    });
    window.dispatchEvent(iosLocation)
  }).catch(handleLocationError)
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
      timeout: 5000,
      enableHighAccuracy: false
    })
  })
}



function requestCreator(requestType, requestBody) {
  const nonLocationRequest = {
    'instant': true,
    'now': true,
    'Null': true,
    'backblaze': true,
    'removeFromOffice': true,
    'updateAuth': true,
    'geolocationApi': true
  }
  var auth = firebase.auth().currentUser;


  var requestGenerator = {
    type: requestType,
    body: '',
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

    }
  };
  let apiHandler = new Worker('js/apiHandler.js?version=31');
  auth.getIdToken(false).then(function (token) {
    requestGenerator.meta.user.token = token
    if (nonLocationRequest[requestType]) {
      requestGenerator.body = requestBody;
      apiHandler.postMessage(requestGenerator);

    } else {
      getRootRecord().then(function (rootRecord) {
        const time = fetchCurrentTime(rootRecord.serverTime);
        requestBody['timestamp'] = time

        manageLocation(3).then(function (geopoint) {
          if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) {
            mapView(geopoint);
            return;
          };
          ApplicationState.location = geopoint;
          requestBody['geopoint'] = geopoint;
          requestGenerator.body = requestBody;
          if(requestBody.template === 'check-in') {
            ApplicationState.lastCheckInCreated = time
          }
          localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
          apiHandler.postMessage(requestGenerator);
        }).catch(handleLocationError)
        return;
      });
    }
  });
  return new Promise(function (resolve, reject) {
    apiHandler.onmessage = function (event) {
      apiHandler.terminate()
      if (!event.data.success) return reject(event.data)
      return resolve(event.data)
    }
    apiHandler.onerror = function (event) {
      apiHandler.terminate()
      return reject(event.data)
    };
  })
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

function revokeSession(init) {
  firebase.auth().signOut().then(function () {
    initApp = init;
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
  if (readResponse.response.templates.length) {
    getCheckInSubs().then(function (checkInSubs) {
      ApplicationState.officeWithCheckInSubs = checkInSubs
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    })
  }
  if (!history.state) return;

  switch (history.state[0]) {
    case 'homeView':
      getSuggestions()
      break;
    case 'enterChat':
      if (!readResponse.response.addendum.length) return;
      dynamicAppendChats(readResponse.response.addendum)
      break;
    case 'chatView':
      if (!readResponse.response.addendum.length) return;
      readLatestChats(false);
      break;
    case 'reportView':
      try {
        const sectionContent = document.querySelector('.tabs-section .data-container');
        if (!sectionContent) return;
        if (sectionContent.dataset.view === 'attendence') {
          attendenceView(sectionContent)
          return
        };
        if (sectionContent.dataset.view === 'reimbursements') {
          expenseView(sectionContent)
          return
        }
      } catch (e) {
        console.log(e)
      }
      break;
    default:
      console.log("no refresh")
  }
}



function backgroundTransition() {
  if (!firebase.auth().currentUser) return
  if (!history.state) return;
  if (history.state[0] === 'profileCheck') return;

  manageLocation(3).then(function (geopoint) {
    if (!ApplicationState.location) return;
    if (!isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) return
    mapView(geopoint);
  }).catch(handleLocationError)
}



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
  const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailReg.test(String(email).toLowerCase())
}

function formatTextToTitleCase(string) {
  const arr = [];
  for (var i = 0; i < string.length; i++) {
    if (i == 0) {
      arr.push(string[i].toUpperCase())
    } else {
      if (string[i - 1].toLowerCase() == string[i - 1].toUpperCase()) {
        arr.push(string[i].toUpperCase())
      } else {
        arr.push(string[i].toLowerCase())
      }
    }
  }
  return arr.join('')
}