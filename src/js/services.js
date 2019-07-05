let apiHandler = new Worker('js/apiHandler.js');

function handleError(error) {
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (errorInStorage.hasOwnProperty(error.message)) return;
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  requestCreator('instant', JSON.stringify(error))
}


function successDialog(data) {
  console.log(data)
  const successMark = document.getElementById('success-animation');
  const viewContainer = document.getElementById('growthfile');
  successMark.classList.remove('hidden');
  viewContainer.style.opacity = '0.37';
  setTimeout(function () {
    successMark.classList.add('hidden');
    viewContainer.style.opacity = '1';
  }, 1500);
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

//TODO MOVE TO WORKER
function geolocationApi(body) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + appKey.getMapKey(), true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {

      if (xhr.readyState === 4) {
        if (xhr.status >= 400) {
          return reject({
            message: xhr.response,
            body: JSON.parse(body),
          });
        }
        const response = JSON.parse(xhr.response);
        if (!response) {
          return reject({
            message: 'Response From geolocation Api ' + response,
            body: JSON.parse(body)
          })
        }
        resolve({
          latitude: response.location.lat,
          longitude: response.location.lng,
          accuracy: response.accuracy,
          provider: body
        });
      }
    };
    xhr.onerror = function () {
      reject({
        message: xhr
      })
    }
    xhr.send(body);

  });
}


function manageLocation() {
  return new Promise(function (resolve, reject) {
    getLocation().then(function (location) {
      ApplicationState.location = location
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
      // resolve({
      //   latitude: 28.549173600000003,
      //   longitude: 77.25055569999999,
      //   accuracy: 24
      // })
      html5Geolocation().then(function (location) {
        resolve(location)
      }).catch(function (error) {
        reject(error)
      })
    }
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
    geolocationApi(JSON.stringify(body)).then(function (cellLocation) {
      return resolve(cellLocation);
    }).catch(function (error) {
      reject(error)
    })
  })
}

function iosLocationError(error) {
  return new Promise(function(resolve,reject){
    html5Geolocation().then(function (location) {
      ApplicationState.location = location;
      return resolve(location)
    }).catch(reject)
    handleError(error);
  })
}

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(function (position) {
      return resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        provider: 'HTML5',
        lastLocationTime:Date.now()
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

  var auth = firebase.auth().currentUser;
  if (!auth) return;
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
      apiUrl: appKey.getBaseUrl()
    }
  };

  auth.getIdToken(false).then(function (token) {
    requestGenerator.meta.user.token = token;
    if (requestType === 'instant' || requestType === 'now' || requestType === 'Null' || requestType === 'backblaze' || requestType === 'removeFromOffice') {
      requestGenerator.body = requestBody;
      apiHandler.postMessage(requestGenerator);
    } else {
      getRootRecord().then(function (rootRecord) {
        requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
        requestGenerator.body = requestBody;
        requestBody['geopoint'] = ApplicationState.location;
        apiHandler.postMessage(requestGenerator);
      });
    }
  }).catch(console.log)
  return new Promise(function (resolve, reject) {
    apiHandler.onmessage = function (event) {
      console.log(event)
      if (!event.data.success) return reject(event.data)
      return resolve(event.data)
    }
    apiHandler.onerror = function (event) {
      console.log(event)
      return reject(event.data)
    };
  })
}




function locationErrorDialog(error) {

  const dialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
  dialog.open();
  dialog.listen('MDCDialog:closed', function (evt) {
    resetScroll()
    listView();
    handleError(error);
  })
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {
  if (!lastLocationTime) return true;
  var currentTime = moment(moment().valueOf());
  var duration = moment.duration(currentTime.diff(lastLocationTime));
  var difference = duration.asSeconds();
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

function revokeSession() {
  firebase.auth().signOut().then(function () {}).catch(function (error) {

    handleError({
      message: 'Sign out error',
      body: error
    });
  });
}

function officeRemovalSuccess(data) {
  const officeRemoveDialog = new Dialog('Reminder', 'You have been removed from ' + data.msg.join(' & ')).create();
  officeRemoveDialog.open();
  officeRemoveDialog.listen('MDCDialog:closed', function () {

  });
  return
}



function handleComponentUpdation(readResponse) {

  switch (history.state[0]) {
    case 'homeView':
      getSuggestions()
      break;
    case 'enterChat':
      dynamicAppendChats(readResponse.response.addendum)
      break;
    default:
      break;
  }

}

function runRead(value) {

  if (!value || value.read) {
    requestCreator('Null', value).then(handleComponentUpdation).catch(console.log)
    return;
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

function getSubscription(office, template, status) {
  return new Promise(function (resolve) {
    const tx = db.transaction(['subscriptions']);
    const subscription = tx.objectStore('subscriptions')
    const officeTemplateCombo = subscription.index('validSubscription')
    const range = IDBKeyRange.only([office, template, status])
    officeTemplateCombo.get(range).onsuccess = function (event) {
      if (!event.target.result) return resolve(null);
      return resolve(event.target.result)
    }
    tx.onerror = function () {
      return reject({
        message: tx.error,
        body: ''
      })
    }

  })
}