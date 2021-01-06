const workerResolves = {};
const workerRejects = {};
let workerMessageIds = 0;
var ApplicationState = JSON.parse(localStorage.getItem('ApplicationState')) || {
  location: '',
  venue: '',
  knownLocation: false,
  iframeVersion: 13,
}

var updatedWifiAddresses = {
  addresses: {},
  timestamp: null
}
let DB_VERSION = 33;



/**
 * Global error logger
 */

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
      error: JSON.stringify({
        stack: event.error.stack,
        message: event.error.message
      })
    }
  })
})

const _native = function () {
  var deviceInfo = '';
  var tokenChanged = '';
  return {
    setFCMToken: function (token) {
      console.log('rec ', token)
      const storedToken = localStorage.getItem('token');
      console.log('stored token', storedToken)
      if (storedToken !== token) {
        tokenChanged = true
      }

      localStorage.setItem('token', token)
    },
    getFCMToken: function () {
      return localStorage.getItem('token')
    },
    isFCMTokenChanged: function () {
      return tokenChanged;
    },
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },

    setIosInfo: function (iosDeviceInfo) {
      const queryString = new URLSearchParams(iosDeviceInfo);
      var obj = {}
      queryString.forEach(function (val, key) {
        if (key === 'appVersion') {
          obj[key] = Number(val)
        } else {
          obj[key] = val
        }
      })
      deviceInfo = obj
      deviceInfo.idbVersion = DB_VERSION
    },
    getInfo: function () {
      if (!this.getName()) return false;
      const storedInfo = JSON.parse(localStorage.getItem('deviceInfo'));
      if (storedInfo) return storedInfo;
      if (this.getName() === 'Android') {
        deviceInfo = getAndroidDeviceInformation()
        deviceInfo.idbVersion = DB_VERSION
        return deviceInfo
      }
      return deviceInfo;
    }
  }
}();


/**
 * 
 * @param {String} wifiString 
 */
function updatedWifiScans(wifiString) {
  console.log("updated wifi", wifiString)
  const result = {}
  const splitBySeperator = wifiString.split(",")
  splitBySeperator.forEach(function (value) {
    const url = new URLSearchParams(value);
    if (url.has('ssid')) {
      url.delete('ssid')
    }
    if (!url.has('macAddress')) return;
    result[url.get("macAddress")] = true
  })
  updatedWifiAddresses.addresses = result;
  updatedWifiAddresses.timestamp = Date.now()
};

function setFirebaseAnalyticsUserId(id) {
  if (window.AndroidInterface && window.AndroidInterface.setFirebaseAnalyticsUserId) {
    window.AndroidInterface.setFirebaseAnalyticsUserId(id)
    return
  }
  if (window.messageHandlers && window.messageHandlers.firebaseAnalytics) {
    window.messageHandlers.firebaseAnalytics.postMessage({
      command: 'setFirebaseAnalyticsUserId',
      id: id
    })
    return
  }
  console.log('No native apis found');
}

function firstletter(A) {
  var pfp = A.toUpperCase();
  document.getElementById("output").style.display = "none";
  document.getElementById("no_output").style.display = "block"
  document.getElementById("no_output").innerHTML = pfp;
}



function logFirebaseAnlyticsEvent(name, params) {
  if (!name) {
    return;
  }

  if (window.AndroidInterface && window.AndroidInterface.logFirebaseAnlyticsEvent) {
    // Call Android interface
    window.AndroidInterface.logFirebaseAnlyticsEvent(name, JSON.stringify(params));
  } else if (window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.firebaseAnalytics) {
    // Call iOS interface
    var message = {
      name: name,
      parameters: params,
      command: 'logFirebaseAnlyticsEvent'
    };
    window.webkit.messageHandlers.firebaseAnalytics.postMessage(message);
  } else {
    // No Android or iOS interface found
    console.log("No native APIs found.");
  }
}

function setFirebaseAnalyticsUserProperty(name, value) {
  if (!name || !value) {
    return;
  }

  if (window.AndroidInterface && window.AndroidInterface.setFirebaseAnalyticsUserProperty) {
    // Call Android interface
    window.AndroidInterface.setFirebaseAnalyticsUserProperty(name, value);
  } else if (window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.firebaseAnalytics) {
    // Call iOS interface
    var message = {
      command: 'setFirebaseAnalyticsUserProperty',
      name: name,
      value: value
    };
    window.webkit.messageHandlers.firebaseAnalytics.postMessage(message);
  } else {
    // No Android or iOS interface found
    console.log("No native APIs found.");
  }
}



/**
 * Call different JNI Android Methods to access device information
 */
function getAndroidDeviceInformation() {
  return {
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion()),
  }
}

function createElement(tagName, attrs) {
  const el = document.createElement(tagName)
  if (attrs) {
    Object.keys(attrs).forEach(function (attr) {
      el[attr] = attrs[attr]
    })
  }
  return el;
}



const redirect = (path) => {
  // window.location = `${window.location.origin}/v3/${formatURL(path)}`;
  window.location = `${window.location.origin}${window.location.hostname === 'localhost' ?`${formatURL(path)}` :`${formatURL(path)}`}`;
}

const formatURL = (url) => {
  if (url.includes(".html")) return url;
  return `${url}.html`
}
const logReportEvent = (name) => {
  const deviceInfo = _native.getInfo();
  if (_native.getName() === 'Android' && deviceInfo.appVersion >= 14) {
    AndroidInterface.logEvent(name);
    return;
  }
  try {
    webkit.messageHandlers.logEvent.postMessage(name)
  } catch (e) {
    console.log(e)
  }
  return;
}

function createList(attr) {
  const li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.innerHTML = `
     ${attr.icon ? `<i class="mdc-list-item__graphic material-icons mdc-theme--primary" aria-hidden="true">${attr.icon}</i>` :''}
     ${attr.primaryText && attr.secondaryText ? ` <span class="mdc-list-item__text">
       <span class="mdc-list-item__primary-text">
         ${attr.primaryText}
       </span>
        <span class="mdc-list-item__secondary-text">
         ${attr.secondaryText}
       </span>` : attr.primaryText}
     </span>
     ${attr.meta ? `<span class='mdc-list-item__meta material-icons'>${attr.meta}</span>` :''}
   `
  new mdc.ripple.MDCRipple(li)
  return li;
}




/** Location utilities */
function calculateSpeed(distance, time) {
  return distance / time;
}

function distanceDelta(oldLocation, newLocation) {
  return calculateDistanceBetweenTwoPoints(oldLocation, newLocation);
}

function timeDelta(previousLocationTime, newLocationTime) {

  try {
    const duration = moment.duration(moment(newLocationTime).diff(previousLocationTime));
    return duration.asMinutes()
  } catch (e) {
    console.log(e)
    const res = newLocationTime - previousLocationTime;
    return res / 36e6;
  }
}

function getStoredLocation() {
  const oldState = localStorage.getItem('ApplicationState')
  if (!oldState) return;
  return JSON.parse(oldState).location
}

function isLocationOld(newLocation, oldLocation) {
  if (!oldLocation) return false;
  return oldLocation.provider === newLocation.provider && oldLocation.latitude === newLocation.latitude && oldLocation.longitude === newLocation.longitude;
}

function isLocationMoreThanThreshold(distance) {
  var THRESHOLD = 0.7; //km
  return distance >= THRESHOLD
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {
  try {
    var currentTime = moment();
    var duration = moment.duration(currentTime.diff(lastLocationTime)).asSeconds();
    return duration > threshold
  } catch (e) {
    const delta = Math.abs((Date.now() - lastLocationTime) / 1000);
    return delta > threshold;
  }
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

function GetOffsetBounds(latlng, offset) {
  const radius = 6378
  const d = (180 / Math.PI);
  this.latLng = latlng
  this.ratio = (offset / radius) * d;
  this.radioLon = (this.ratio) / Math.cos(this.latLng.latitude * Math.PI / 180)
}

GetOffsetBounds.prototype.north = function () {
  return this.latLng.latitude + this.ratio
}
GetOffsetBounds.prototype.south = function () {
  return this.latLng.latitude - this.ratio
}
GetOffsetBounds.prototype.east = function () {
  return this.latLng.longitude + this.radioLon
}
GetOffsetBounds.prototype.west = function () {
  return this.latLng.longitude - this.radioLon
};


function getCellularInformation() {

  let cellTowerQueryString;
  const mcc = AndroidInterface.getMobileCountryCode()
  const mnc = AndroidInterface.getMobileNetworkCode()

  const radioType = AndroidInterface.getRadioType()
  const carrier = AndroidInterface.getCarrier()
  const wifiQueryString = AndroidInterface.getWifiAccessPoints()
  try {
    cellTowerQueryString = AndroidInterface.getCellTowerInformation();
  } catch (e) {
    handleError({
      message: e.message,
      body: {
        mcc,
        mnc,
        radioType,
        carrier
      }
    })
  }

  var wifiAccessPointsArray = [];
  var cellTowerArray = [];
  if (wifiQueryString) {
    wifiAccessPointsArray = parseWifiQuery(wifiQueryString)
  };
  if (cellTowerQueryString) {
    cellTowerArray = removeFalseCellIds(parseQuery(cellTowerQueryString, mcc, mnc))
  }
  const body = {}

  if (mcc) {
    body.homeMobileCountryCode = Number(mcc)
  }
  if (mnc) {
    body.homeMobileNetworkCode = Number(mnc)
  }
  if (carrier) {
    body.carrier = carrier
  }
  if (radioType) {
    body.radioType = radioType
  }

  if (wifiAccessPointsArray.length) {
    body.wifiAccessPoints = wifiAccessPointsArray
  }

  if (cellTowerArray.length) {
    body.cellTowers = cellTowerArray;
  }

  if (wifiAccessPointsArray.length && cellTowerArray.length) {
    body.considerIp = false
  } else {
    body.considerIp = true
  }
  return body;
}

function removeFalseCellIds(cellTowers) {
  const max_value = 2147483647
  const filtered = cellTowers.filter(function (tower) {
    return tower.cellId > 0 && tower.cellId < max_value && tower.locationAreaCode > 0 && tower.locationAreaCode < max_value;
  });
  return filtered
}

/** to be removed when ssid will be removed from apk itself */

function parseWifiQuery(queryString) {
  var array = [];

  const splitBySeperator = queryString.split(",")
  splitBySeperator.forEach(function (value) {
    const url = new URLSearchParams(value);
    if (url.has('ssid')) {
      url.delete('ssid')
    }
    if (!url.has('macAddress')) return;
    const result = {}
    url.forEach(function (value, key) {

      if (key === 'macAddress') {
        result[key] = value
      } else {
        result[key] = Number(value)
      }
    });
    array.push(result)
  })
  return array;
}

function parseQuery(queryString, homeMobileCountryCode, homeMobileNetworkCode) {

  var array = [];
  const splitBySeperator = queryString.split(",")
  splitBySeperator.forEach(function (value) {
    const url = new URLSearchParams(value);
    array.push(queryPatramsToObject(url, homeMobileCountryCode, homeMobileNetworkCode))
  })
  return array;
}

function queryPatramsToObject(url, homeMobileCountryCode, homeMobileNetworkCode) {
  let result = {};
  url.forEach(function (value, key) {

    if (key === 'mobileCountryCode' && Number(value) == 0) {
      result[key] = Number(homeMobileCountryCode);
      return;
    }
    if (key === 'mobileNetworkCode' && Number(value) == 0) {
      result[key] = Number(homeMobileNetworkCode);
      return;
    };
    result[key] = Number(value)
  })
  return result;
}



/** request creator utilities */
function isWifiRequired() {
  if (_native.getName() !== 'Android') return;
  if (AndroidInterface.isWifiOn()) return;

  const deviceInfo = _native.getInfo();
  const requiredWifiDevices = {
    'samsung': true,
    'OnePlus': true
  }

  if (requiredWifiDevices[deviceInfo.deviceBrand]) return true;
  return;

}


function readWait() {
  var promise = Promise.resolve();
  for (let i = window.readStack.length - 1; i >= 0; i--) {
    promise = promise.then(function () {
      window.readStack.splice(i, 1)
      return requestCreator('Null')
    });
  }
  return promise;
}
var readDebounce = debounce(function () {
  readWait().then(handleComponentUpdation).catch(console.error)
}, 1000, false);

window.addEventListener('callRead', readDebounce);



function handleError(error) {
  let errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (!errorInStorage) {
    errorInStorage = {}
  }
  if (errorInStorage.hasOwnProperty(error.message)) return
  error.device = JSON.parse(localStorage.getItem('deviceInfo'));
  errorInStorage[error.message] = error
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  return requestCreator('instant', JSON.stringify(error))
}





function snacks(message, timeout) {
  const el = createElement('div', {
    className: 'mdc-snackbar'
  })
  el.innerHTML = `<div class="mdc-snackbar__surface">
  <div class="mdc-snackbar__label"
       role="status"
       aria-live="polite">
      ${message}
  </div>
</div>`
  document.body.appendChild(el);
  const snackBar = new mdc.snackbar.MDCSnackbar(el);
  snackBar.timeoutMs = timeout || 4000
  snackBar.open();
}


function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}

function appLocation(maxRetry) {
  return new Promise(function (resolve, reject) {
    manageLocation(maxRetry).then(function (geopoint) {
      if (!ApplicationState.location) {
        ApplicationState.location = geopoint
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
        return resolve(geopoint);
      }

      if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) {
        return reject({
          message: 'THRESHOLD EXCEED',
          type: 'geolocation',
          body: {
            geopoint: geopoint
          }
        })
      };

      ApplicationState.location = geopoint
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
      return resolve(geopoint)
    }).catch(function (error) {
      error.type = 'geolocation';
      reject(error)
    })
  })
}

function fcmToken(geopoint){
  return new Promise(function (resolve, reject) {

    if (appKey.getMode() === 'dev' && window.location.hostname === 'localhost') {
      return resolve(geopoint);
    }
    if (_native.getFCMToken() == null) {
      handleError({
        message: 'FCM Token not found',
        body: _native.getInfo()
      })
      return resolve(geopoint)
    }

    requestCreator('fcmToken', {
      token: _native.getFCMToken()
    }).then(function (geopoint) {
      resolve(geopoint)
    }).catch(function (error) {
     reject(error)
    })
  })
 
}

function manageLocation(maxRetry) {

  return new Promise(function (resolve, reject) {

    getLocation().then(function (location) {
      if (location.accuracy >= 35000) {
        if (maxRetry > 0) {
          setTimeout(function () {
            manageLocation(maxRetry - 1).then(resolve).catch(reject)
          }, 1000)
        } else {
          return handleLocationOld(3, location).then(resolve).catch(reject)
        }
      } else {
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
      message: 'BROKEN INTERNET CONNECTION',
    })

    if (_native.getName() !== 'Android') {
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
    if (ApplicationState.location && typeof (ApplicationState.location.provider) === 'object' && ApplicationState.location.provider.wifiAccessPoints) {

      let matchFound = false
      ApplicationState.location.provider.wifiAccessPoints.forEach(function (ap) {
        if (updatedWifiAddresses.addresses[ap.macAddress] && ApplicationState.location.accuracy <= 1000 && timeDelta(ApplicationState.location.lastLocationTime, updatedWifiAddresses.timestamp) <= 5) {
          matchFound = true
        }
      })

      if (matchFound) {
        return resolve(ApplicationState.location)
      }
    }

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
      timeout: 5000,
      enableHighAccuracy: false
    })
  })
};


// after logout
function initApp() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      redirect('/login');
    }
  });
}
// ends

const apiHandler = new Worker('./js/apiHandler.js?version=198');

function requestCreator(requestType, requestBody, geopoint) {
  const extralRequest = {
    'geocode': true,
    'geolocationApi': true
  }
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
      mapKey: appKey.getMapKey(),
      apiUrl: appKey.getBaseUrl(),
      authorization: extralRequest[requestType] ? false : true
    },
  };


  if (!geopoint) return executeRequest(requestGenerator);
  return getRootRecord().then(function (rootRecord) {
    let time;
    if (requestGenerator.body['timestamp']) {
      time = requestGenerator.body['timestamp']
    } else {
      time = fetchCurrentTime(rootRecord.serverTime);
    }
    requestGenerator.body['timestamp'] = time
    requestGenerator.body['geopoint'] = geopoint;
    // if (requestBody.template === 'check-in') {
    //   ApplicationState.lastCheckInCreated = time
    // };
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
    return executeRequest(requestGenerator);
  });
}


function executeRequest(requestGenerator) {
  const auth = firebase.auth().currentUser;
  if (requestGenerator.type !== 'instant') {
    // progressBar.open();
  }

  return auth.getIdToken().then(function (token) {
    requestGenerator.meta.user.token = token;
    apiHandler.onmessage = function (event) {
      // progressBar.close();

      if (!event.data.success) {
        const reject = workerRejects[event.data.id];
        if (reject) {
          reject(event.data);
          snacks(event.data.body.message);

          if (!event.data.apiRejection) {
            handleError({
              message: event.data.message,
              body: event.data.body
            })
          }
        }
      } else {
        const resolve = workerResolves[event.data.id];
        if (resolve) {
          if (event.data.response.hasOwnProperty('reloadApp') && !event.data.response.reloadApp) {
            delete event.data.response.reloadApp;
          }
          resolve(event.data.response);
        }
      }
      delete workerResolves[event.data.id]
      delete workerRejects[event.data.id]
    }

    apiHandler.onerror = function (event) {
      // progressBar.open();  
      console.log(event)
      handleError({
        message: event.message,
        body: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    };

    return new Promise(function (resolve, reject) {
      const id = workerMessageIds++;
      requestGenerator.id = id;
      workerResolves[id] = resolve;
      workerRejects[id] = reject;
      console.log(requestGenerator)
      apiHandler.postMessage(requestGenerator);
    })
  });
}


function updateApp() {
  if (_native.getName() !== 'Android') return webkit.messageHandlers.updateApp.postMessage('Update App');
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



function officeRemovalSuccess(data) {
  const officeRemoveDialog = new Dialog('Reminder', 'You have been removed from ' + data.msg.join(' & ')).create();
  officeRemoveDialog.open();
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

  getCheckInSubs().then(function (checkInSubs) {
    ApplicationState.officeWithCheckInSubs = checkInSubs
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
  });

  const dutyLocations = []
  readResponse.activities.forEach(function (activity) {
    if (activity.template !== 'duty') return;
    checkForDuty(activity);
  });
  let prom = Promise.resolve([]);
  if (!ApplicationState.venue) {
    const offsetBounds = new GetOffsetBounds(ApplicationState.location, 1);
    prom = loadNearByLocations({
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    }, ApplicationState.location)
  }

  prom.then(function (locations) {
    locations.forEach(function (location) {
      location.distance = calculateDistanceBetweenTwoPoints(location, ApplicationState.location);
      dutyLocations.push(location)
    });
    if (dutyLocations.length) {
      const sorted = dutyLocations.sort(function (a, b) {
        return a.distance - b.distance;
      });

      ApplicationState.venue = sorted[0];
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    };
  })

}

/** function call to be removed from apk */
function backgroundTransition() {}

window.readStack = []

function runRead(type) {

  if (!firebase.auth().currentUser) return;
  if (!type) return;
  if (type.read) {
    window.readStack.push(type.read);
    var readEvent = new CustomEvent('callRead', {
      detail: window.readStack
    });
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
    // if (callNow) func.apply(context, args);
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
    if (!office && !template) {
      subscription.getAll().onsuccess = function (e) {
        return resolve(event.target.result)
      }
      return;
    }

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



function handleNav(evt) {
  if (!history.state) return;
  return history.back();
}



function bottomDialog(dialog, ul) {
  dialog.root_.classList.add('bottom-dialog')
  ul.singleSelection = true
  ul.selectedIndex = 0;
  dialog.rootRecord
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

function resizeAndCompressImage(image, compressionFactor) {
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



const phoneFieldInit = (input, dropEl, hiddenInput) => {

  return intlTelInput(input, {
    initialCountry: "IN",
    formatOnDisplay: true,
    separateDialCode: true,
    dropdownContainer: dropEl || document.getElementById('country-dom'),
    hiddenInput: hiddenInput || "",
    nationalMode: false
  });
};



function toDataURL(src, callback) {
  var img = new Image();
  // img.crossOrigin = 'Anonymous';
  img.onload = function () {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL();
    callback(dataURL);
  };
  img.src = src;
}

function isAdmin(idTokenResult, office) {
  if (!idTokenResult.claims.hasOwnProperty('admin')) return;
  if (!Array.isArray(idTokenResult.claims.admin)) return;
  if (!idTokenResult.claims.admin.length) return;
  if (!office) return true;
  return idTokenResult.claims.admin.indexOf(office) > -1
}


function setHelperInvalid(field, message) {
  field.focus();
  field.foundation.setValid(false);
  field.foundation.adapter.shakeLabel(true);
  if (message) {
    field.helperTextContent = message
  }
}

function setHelperValid(field) {
  field.focus();
  field.foundation.setValid(true);
  field.helperTextContent = ''

}

function handleLocationError(error) {
  let alertDialog;
  switch (error.message) {
    case 'THRESHOLD EXCEED':
      handleCheckin(error.body.geopoint)
      break;

    case 'BROKEN INTERNET CONNECTION':

      alertDialog = new Dialog('Internet disconnected', 'You are offline. Please check your internet connection and try again').create();
      alertDialog.open();
      break;

    case 'TURN ON YOUR WIFI':

      alertDialog = new Dialog('Turn on your WiFi', 'Turn on WiFi to help OnDuty detect your location accurately').create();
      alertDialog.open();
      break;

    default:
      handleError({
        message: error.message,
        body: {
          reason: error.body || error,
          stack: error.stack || ''
        }
      })

      alertDialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again').create();
      alertDialog.open();
      break;
  }
}


function Dialog(title, content, id) {
  this.title = title;
  this.content = content;
  this.id = id;

}

Dialog.prototype.create = function (type) {
  const parent = createElement('div', {
    className: 'mdc-dialog',
    role: 'alertDialog',
    id: this.id
  })
  parent.setAttribute('aria-modal', 'true')
  parent.setAttribute('aria-labelledby', 'Title')
  parent.setAttribute('aria-describedby', 'content')
  const container = createElement('div', {
    className: 'mdc-dialog__container'
  })
  const surface = createElement('div', {
    className: 'mdc-dialog__surface'
  })
  const h2 = createElement('h2', {
    className: 'mdc-dialog__title',
  })
  h2.innerHTML = this.title
  this.footer = createElement('footer', {
    className: 'mdc-dialog__actions'
  })
  const contentContainer = createElement('div', {
    className: 'mdc-dialog__content'
  });

  if (this.content instanceof HTMLElement) {
    contentContainer.appendChild(this.content)
  } else {
    contentContainer.innerHTML = this.content
  }

  if (this.title) {
    surface.appendChild(h2)
  }
  surface.appendChild(contentContainer);
  if (type !== 'simple') {

    this.cancelButton = createElement('button', {
      className: 'mdc-button mdc-dialog__button',
      type: 'button',
      textContent: 'Close'
    })
    this.cancelButton.setAttribute('data-mdc-dialog-action', 'close');
    this.cancelButton.style.marginRight = 'auto';

    this.okButton = createElement('button', {
      className: 'mdc-button mdc-dialog__button',
      type: 'button',
      textContent: 'Okay'
    });


    this.okButton.setAttribute('data-mdc-dialog-action', 'accept')
    this.footer.appendChild(this.cancelButton)
    this.footer.appendChild(this.okButton);
    surface.appendChild(this.footer)
  }

  container.appendChild(surface)
  parent.appendChild(container);
  parent.appendChild(createElement('div', {
    className: 'mdc-dialog__scrim'
  }))

  document.body.appendChild(parent)
  // const dialogParent = document.getElementById('dialog-container')
  // dialogParent.innerHTML = ''
  // dialogParent.appendChild(parent)
  return new mdc.dialog.MDCDialog(parent);
}

function dialogButton(name, action) {
  const button = createElement('button', {
    className: 'mdc-button mdc-dialog__button',
    type: 'button',
    textContent: name
  });


  button.setAttribute('data-mdc-dialog-action', action)
  return button;
}

const getCheckInSubs = () => {
  return new Promise(resolve => {
    const checkInSubs = {};
    const req = window.indexedDB.open(firebase.auth().currentUser.uid);
    req.onsuccess = function () {
      var database = req.result;
      const tx = database.transaction('subscriptions');
      tx.objectStore('subscriptions')
        .index('templateStatus')
        .openCursor(IDBKeyRange.bound(['check-in', 'CONFIRMED'], ['check-in', 'PENDING']))
        .onsuccess = function (event) {
          const cursor = event.target.result;
          if (!cursor) return;
          if (!cursor.value.attachment || !cursor.value.venue || !cursor.value.schedule) {
            cursor.continue();
            return;
          }
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
        delete checkInSubs['xanadu'];
        return resolve(checkInSubs)
      }
    }
  })
};


const loadNearByLocations = (o, location) => {
  return new Promise((resolve, reject) => {

    const result = []

    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);

    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!ApplicationState.officeWithCheckInSubs[cursor.value.office]) {
        cursor.continue();
        return;
      };
      if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(location, cursor.value))) {
        cursor.continue();
        return;
      }
      result.push(cursor.value)
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(result);
    }
  })
}

function successDialog(text) {

  const successMark = document.getElementById('success-animation');
  successMark.classList.remove('hidden');
  document.getElementById("app-current-panel").style.opacity = '0.1';
  successMark.querySelector('.success-text').textContent = text;
  setTimeout(function () {
    successMark.classList.add('hidden');
    document.getElementById("app-current-panel")
      .style.opacity = '1';
  }, 2000);
}

const hasBankAccount = (record) => {
  if (!record.linkedAccounts) return;
  if (!Array.isArray(record.linkedAccounts)) return;
  if (!record.linkedAccounts[0]) return;

  return true
}

function passDuty(duty_array) {
  sessionStorage.setItem('passing_duty', JSON.stringify(duty_array));
  redirect('/jobview.html');
  console.log("redirect")
}


function showDuty_card(dutycard_details) {



  document.getElementById("current_location").innerHTML =
    dutycard_details.attachment.Location.value;
  console.log(dutycard_details);
  document.getElementById("starting_time").innerHTML = moment(
    dutycard_details.schedule[0].startTime
  ).format("hh:mm A");

  if (dutycard_details.header != "CurrentDuty") {
    document.getElementById("ending_time").innerHTML = moment(
      dutycard_details.schedule[0].endTime
    ).format("hh:mm A");
  }

  if (dutycard_details.schedule[0].endTime !== dutycard_details.schedule[0].startTime) {
    document
      .querySelector(".active-duty--duration")
      .classList.remove("hidden");
    document.getElementById("total_time").innerHTML = moment
      .utc(
        moment(dutycard_details.schedule[0].endTime).diff(
          moment(dutycard_details.schedule[0].startTime)
        )
      )
      .format("HH:mm");
  }

  if (dutycard_details.assignees[0].displayName) {
    document.getElementById("assignees_name").innerHTML =
      dutycard_details.assignees[0].displayName;
  } else {
    document.getElementById("assignees_name").innerHTML =
      dutycard_details.assignees[0].phoneNumber;
  }

  if (dutycard_details.assignees.length > 1) {
    if (dutycard_details.assignees.length == 2) {
      document.getElementById("other_assignees").innerHTML =
        "  & " + (dutycard_details.assignees.length - 1) + " Other";
    } else {
      document.getElementById("other_assignees").innerHTML =
        "  & " + (dutycard_details.assignees.length - 1) + " Others";
    }
  }

  document.getElementById("assignees_pic").src = dutycard_details.assignees[0].photoURL;

}




document.addEventListener('DOMContentLoaded', (event) => {


  if (localStorage.getItem('mode') === 'dark') {
    document.querySelector('body').classList.add('dark')
    document.querySelector('body').classList.remove('light')

  } else {
    document.querySelector('body').classList.remove('dark')

  }

})

function handleQRUrl(url) {
  console.log(url);
  firebase.auth().currentUser.getIdToken().then(token => {
    const latitude = ApplicationState.location.latitude.toString();
    const longitude = ApplicationState.location.longitude.toString();
    
    if (_native.getName() === 'Android') {
      AndroidInterface.loadQRPage(token, latitude, longitude, url);
      return
    }
    window.webkit.messageHandlers.openPage.postMessage({
      token,
      latitude,
      longitude,
      url
    })
  })
}

const replaceErrors = (key, value) => {
  if (value instanceof Error) {
      var error = {};
      Object.getOwnPropertyNames(value).forEach(function (key) {
        error[key] = value[key];
      });
      return error;
  }

  return value;
}


function handleCheckin(geopoint, noUser) {

  const queryLink = getDeepLink();

  getCheckInSubs().then(function (checkInSubs) {

    if (queryLink && queryLink.get('action') === 'get-subscription') {
      checkInSubs[queryLink.get('office')] = {
        attachment: {
          Comment: {
            type: 'string',
            value: ''
          },
          Photo: {
            type: 'base64',
            value: ''
          }
        },
        template: 'check-in',
        office: queryLink.get('office'),
        schedule: [],
        venue: ['Check-In Location'],
        status: 'PENDING'
      }
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      mapView(geopoint)
      return
    }

    if (!shouldCheckin(geopoint, checkInSubs)) return initProfileView();

    if (Object.keys(checkInSubs).length) {
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      return mapView(geopoint)
    }

    const storeNames = ['activity', 'addendum', 'children', 'subscriptions', 'map', 'attendance', 'reimbursement', 'payment']
    Promise.all([firebase.auth().currentUser.getIdTokenResult(), checkIDBCount(storeNames)]).then(function (result) {
      getRootRecord().then(function (record) {
        if (record.fromTime == 0) {
          loadScreen('loading-data')
          console.log("sending read 0");
          console.log(navigator.serviceWorker.controller);

          firebase.auth().currentUser.getIdToken().then(token => {

            fetch(`${appKey.getBaseUrl()}read1?from=0`, {
              method: 'GET',
              body: null,
              headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${token}`,
              }
            }).then(response => {
              console.log("read status", response.status)
              if (!response.status || response.status >= 226 || !response.ok) {
                throw response
              }
              return response.json();
            }).then(function (res) {
              if (res.hasOwnProperty('success') && !res.success) {
                snacks('Try again later');
                handleError({
                  message: 'read 0 error',
                  body: JSON.stringify(res)
                })
                return;
              }
              navigator.serviceWorker.controller.postMessage({
                type: 'read',
                readResponse: res
              });
              navigator.serviceWorker.onmessage = (event) => {
                console.log('message from worker', event.data);
                if (event.data.type === 'error') {
                  handleError({
                    message:'Error from sw: '+event.data.message,
                    body:JSON.stringify(event.data,replaceErrors)
                  });
                  snacks('Try again later')
                  return
                }
                handleCheckin(geopoint)
              };

            }).catch(function (err) {
              console.log("read err", err)
              handleError({
                message: err.message,
                body: JSON.stringify(err,replaceErrors)
              })

              if (typeof err.text === "function") {
                err.text().then(errorMessage => {
                  console.log(JSON.parse(errorMessage))
                })
              }
            })
          })

          return
        }
        if (isAdmin(result[0]) || result[1]) return initProfileView();
        return noOfficeFoundScreen();
      })
    })
  });
}


function noOfficeFoundScreen() {
  const content = `
      <div class='message-screen mdc-layout-grid'>
      <div class='icon-container'>
        <div class='mdc-theme--primary icons'>
          <i class='material-icons'>help_outline</i>
        </div>
      </div>
      <div class='text-container'>
        <h3 class='mdc-typography--headline5 headline mt-0'>No office found </h3>
        <p class='mdc-typography--body1'>
          No office found in OnDuty. Please contact your administrator
        </p>
      </div>
    </div>
  `
  dom_root.innerHTML = content;

}