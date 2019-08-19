var readStack = [];
var readDebounce = debounce(function () {
  requestCreator('Null').then(handleComponentUpdation).catch(console.log)
}, 1000, false)
window.addEventListener('callRead', readDebounce);




function handleError(error) {
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



function manageLocation() {
  return new Promise(function (resolve, reject) {
    getLocation().then(function (location) {
      resolve(location)
    }).catch(function (error) {
      reject(error);
    })
  })
}

function getLocation() {
  return new Promise(function (resolve, reject) {
    if (native.getName() === 'Android') {
      html5Geolocation().then(function (htmlLocation) {
        if (htmlLocation.accuracy <= 350) return resolve(htmlLocation);

        handleGeoLocationApi().then(function (cellLocation) {
          if (htmlLocation.accuracy < cellLocation.accuracy) {
            return resolve(htmlLocation);
          }
          return resolve(cellLocation)
        }).catch(function (error) {
          return resolve(htmlLocation);
        })
      }).catch(function (htmlError) {
        handleGeoLocationApi().then(function (location) {
          return resolve(location);
        }).catch(function (error) {
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
      return;
    }

    try {
      webkit.messageHandlers.locationService.postMessage('start');
      window.addEventListener('iosLocation', function _iosLocation(e) {
        resolve(e.detail)
        window.removeEventListener('iosLocation', _iosLocation, true);
      }, true)
    } catch (e) {
      html5Geolocation().then(function (location) {
        resolve(location)
      }).catch(function (error) {
        reject(error)
      })
    }
  })
}

function handleCellularInformation(retry) {
  return new Promise(function (resolve, reject) {

    try {
      body = getCellularInformation();
      if (!Object.keys(body).length) {
        reject("empty object from getCellularInformation");
      }
      if (body.considerIp) {

        var interval = setInterval(function () {
          body = getCellularInformation();
          if (!body.considerIp || retry == 0) {
            clearInterval(interval);

            resolve(body)
            return;
          }
          retry--
        }, 1000)
        return;
      }
      return resolve(body)
    } catch (e) {
      reject(e)
    }
  })
}

function handleGeoLocationApi() {
  return new Promise(function (resolve, reject) {
    var retry = 2;
    handleCellularInformation(retry).then(function (body) {
      if (body.considerIp) {
        handleError({
          message: 'considerIp is true after retry',
          body: JSON.stringify(body)
        })
      }
      console.log(body);
      requestCreator('geolocationApi', body).then(function (result) {
        return resolve(result.response);
      }).catch(reject)
    }).catch(reject)
  })
}


function iosLocationError(iosError) {
  html5Geolocation().then(function (geopoint) {
    var iosLocation = new CustomEvent('iosLocation', {
      "detail": geopoint
    });
    window.dispatchEvent(iosLocation)
  }).catch(locationErrorDialog)
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
        lastLocationTime: Date.now()
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

function toRad(value) {
  return value * Math.PI / 180;
}

function calculateDistanceBetweenTwoPoints(oldLocation, newLocation) {

  var R = 6371; // km
  var dLat = toRad(newLocation.latitude - oldLocation.latitude);
  var dLon = toRad(newLocation.longitude - oldLocation.longitude);
  var lat1 = toRad(newLocation.latitude);
  var lat2 = toRad(oldLocation.latitude);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;

}

function isLocationMoreThanThreshold(distance) {
  var THRESHOLD = 1; //km
  if (distance >= THRESHOLD) return true;
  return false;
}


function isLocationStatusWorking() {
  const requiredWifi = {
    'samsung': true,
    'OnePlus': true
  }

  if (!navigator.onLine) {
    const connectionDialog = new Dialog('BROKEN INTERNET CONNECTION', 'Make Sure You have a working Internet Connection').create()
    connectionDialog.open();
    return;
  }
  if (native.getName() !== 'Android') return true;

  if (!AndroidInterface.isLocationPermissionGranted()) {
    const alertDialog = new Dialog('LOCATION PERMISSION', 'Please Allow Growthfile location access.').create()
    alertDialog.open();
    return
  }
  const brand = JSON.parse(localStorage.getItem('deviceInfo')).deviceBrand
  if (requiredWifi[brand]) {
    if (!AndroidInterface.isWifiOn()) {
      const alertDialog = new Dialog('TURN ON YOUR WIFI', 'Growthfile requires wi-fi access for improving your location accuracy.').create();
      alertDialog.open();
      return;
    }
    return true;
  }
  return true
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
  let apiHandler = new Worker('js/apiHandler.js');

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
      retryCount: 2
    }
  };

  auth.getIdToken(false).then(function (token) {
    requestGenerator.meta.user.token = token
    if (nonLocationRequest[requestType]) {
      requestGenerator.body = requestBody;
      apiHandler.postMessage(requestGenerator);

    } else {
      getRootRecord().then(function (rootRecord) {
        const time = fetchCurrentTime(rootRecord.serverTime);
        requestBody['timestamp'] = time
        if (isLastLocationOlderThanThreshold(ApplicationState.location.lastLocationTime, 60)) {
          manageLocation().then(function (geopoint) {
            if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) {
              mapView(geopoint);
              return;
            };
            ApplicationState.location = geopoint;
            requestBody['geopoint'] = geopoint;
            requestGenerator.body = requestBody;
            apiHandler.postMessage(requestGenerator);

          }).catch(locationErrorDialog)
          return;
        }
        requestBody['geopoint'] = ApplicationState.location;
        requestGenerator.body = requestBody;
        apiHandler.postMessage(requestGenerator);

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




function locationErrorDialog(error) {
  const dialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
  dialog.open();
  dialog.listen('MDCDialog:closed', function (evt) {
    handleError(error);
  })
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {

  var currentTime = moment(moment().valueOf());
  console.log(currentTime)
  var duration = moment.duration(currentTime.diff(lastLocationTime));
  console.log(duration)
  var difference = duration.asSeconds();
  console.log(difference)
  return difference > threshold

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
    default:
    case 'chatView':
      if (!readResponse.response.addendum.length) return;
      readLatestChats(false);
      break;
    case 'reportView':
      const tabEl = document.querySelector('.mdc-tab-bar')
      if (!tabEl) return;

      const tabBar = new mdc.tabBar.MDCTabBar(tabEl)

      if (tabBar.foundation_.adapter_.getFocusedTabIndex() == 0) {
        const sectionContent = document.querySelector('.tabs-section .data-container');
        if (sectionContent) {
          attendenceView(sectionContent)
        }
      }
      break;
  }
}



function backgroundTransition() {
  if (!firebase.auth().currentUser) return
  if (!history.state) return;
  if (history.state[0] === 'profileCheck') return;

  manageLocation().then(function (geopoint) {
    if (!ApplicationState.location) return;
    if (!isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) return
    mapView(geopoint);
  })
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