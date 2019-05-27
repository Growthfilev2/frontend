let apiHandler = new Worker('js/apiHandler.js');

function handleError(error) {
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (errorInStorage.hasOwnProperty(error.message)) return;
  errorInStorage[error.message] = true
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  requestCreator('instant', JSON.stringify(error))
}

function loader(nameClass) {
  var div = document.createElement('div');
  div.className = 'loader ' + nameClass;
  return div;
}

function successDialog() {

  if (history.state[0] !== 'mapView') {
    progressBar.foundation_.close();
    const successMark = document.getElementById('success-animation');
    const viewContainer = document.getElementById('growthfile');
    successMark.classList.remove('hidden');
    viewContainer.style.opacity = '0.37';
    setTimeout(function () {
      successMark.classList.add('hidden');
      viewContainer.style.opacity = '1';
    }, 1500);
    mapView();
    return;
  }
  snackBar.labelText = 'Check-In Created'
  snackBar.open();
}

function snacks(message, type) {
  snackBar.labelText = message;
  snackBar.open();
  snackBar.timeoutMs = 10000
  snackBar.actionButtonText = 'okay';

}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}


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
      // if (native.getName() === 'Android') {
          updateLocationInRoot(location)
      // };
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
      resolve({latitude:28.549173600000003,longitude:77.25055569999999,accuracy:24})
      // html5Geolocation().then(function (location) {
      //   resolve(location)
      // }).catch(function (error) {
      //   reject(error)
      // })
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

function logWifi(ogBody) {
  const req = {
    message: 'Wi-fi Change Log',
    body: {
      main: ogBody
    }
  }
  for (let i = 1; i <= 3; i++) {

    (function (index) {

      setTimeout(function () {
        if (index == 3) {
          handleError(req)
          return;
        }
        let result
        let name;
        if (index == 1) {
          name = 'first wifi at ' + moment().format('hh:mm:ss')

        }
        if (index == 2) {
          name = 'second wifi at ' + moment().format('hh:mm:ss')

        };

        try {
          result = getCellularInformation();
        } catch (e) {
          result = e.message
        }
        req.body[name] = result;
      }, i * 2000)
    })(i)
  }
}

function iosLocationError(error) {
  html5Geolocation().then(function (location) {
    updateLocationInRoot(location)
  }).catch(function (error) {
    reject(error)
  })
  handleError(error);
}

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(function (position) {
      return resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        provider: 'HTML5'
      })

    }, function (error) {
      reject({
        message: error.message
      })
    }, {

      maximumAge: 0,
      timeout:10000,
      enableHighAccuracy: false
    })
  })
}

function updateLocationInRoot(finalLocation) {
  var previousLocation = {
    latitude: '',
    longitude: '',
    accuracy: '',
    provider: '',
    lastLocationTime: ''
  };
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var tx = db.transaction(['root'], 'readwrite');
    var rootStore = tx.objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;
      if (record.location) {
        previousLocation = record.location
      };
      record.location = finalLocation;
      record.location.lastLocationTime = Date.now();
      rootStore.put(record);
    };

    tx.oncomplete = function () {
      if (!previousLocation.latitude) return;
      if (!previousLocation.longitude) return;
      if (!finalLocation.latitude) return;
      if (!finalLocation.longitude) return;

      var distanceBetweenBoth = calculateDistanceBetweenTwoPoints(previousLocation, finalLocation);

      var suggestCheckIn = new CustomEvent("suggestCheckIn", {
        "detail": {
          newDay: isNewDay(true),
          locationChanged: isLocationMoreThanThreshold(distanceBetweenBoth)
        }
      });
      window.dispatchEvent(suggestCheckIn);

      if (native.getName() === 'Ios') {
        var iosLocation = new CustomEvent('iosLocation', {
          "detail": finalLocation
        });
        window.dispatchEvent(iosLocation)
      }

    };
    tx.onerror = function () {
      handleError({
        message: `${tx.error.message} from updateLocationInRoot`,
        body: tx.error.name
      })
    }

    req.onerror = function () {
      handleError({
        message: `${req.error.message} from updateLocationInRoot`,
        body: req.error.name
      });
      window.dispatchEvent(suggestCheckIn);
    };
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

function isLocationMoreThanThreshold(distance) {
  var THRESHOLD = 1; //km
  if (distance >= THRESHOLD) return true;
  return false;
}

function isLocationLessThanThreshold(distance) {
  var THRESHOLD = 1; //km
  if (distance <= THRESHOLD) return true;
  return false;
}

function sortedByAccuracy(geoData) {
  var result = geoData.sort(function (a, b) {
    return a.accuracy - b.accuracy;
  });
  return result[0];
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



function requestCreator(requestType, requestBody,location) {
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
    if (requestType === 'instant' || requestType === 'now' || requestType === 'Null' || requestType === 'backblaze') {
      requestGenerator.body = requestBody;
      requestGenerator.meta.user.token = token;

      apiHandler.postMessage(requestGenerator);

    } else {
      getRootRecord().then(function (rootRecord) {
        let location = rootRecord.location;
        let isLocationOld = true;
        location ? isLocationOld = isLastLocationOlderThanThreshold(location.lastLocationTime, 5) : '';
        requestGenerator.meta.user.token = token;
        if (isLocationOld) {
          // manageLocation().then(function (location) {
            createRequestBody(requestType, requestBody, requestGenerator, rootRecord.serverTime, location)
          // }).catch(locationErrorDialog)
        } else {
          createRequestBody(requestType, requestBody, requestGenerator, rootRecord.serverTime, rootRecord.location)
        }
      });
    }
  }).catch(console.log)

  // handle the response from apiHandler when operation is completed
  apiHandler.onmessage = messageReceiver;
  apiHandler.onerror = onErrorMessage;
}

function createRequestBody(requestType, requestBody, requestGenerator, serverTime, location) {

  if (requestType === 'create') {
    requestBody.forEach(function (body) {
      body.timestamp = fetchCurrentTime(serverTime);
      body.geopoint = location
    })
  } else {
    requestBody['timestamp'] = fetchCurrentTime(serverTime);
    requestBody['geopoint'] = location;
  }
  requestGenerator.body = requestBody;
  apiHandler.postMessage(requestGenerator);
}



function locationErrorDialog(error) {
  // progressBar.foundation_.close();
  const dialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
  dialog.open();
  dialog.listen('MDCDialog:closed', function (evt) {
    resetScroll()
    listView();
    handleError(error);
  })
}

function isLastLocationOlderThanThreshold(test, threshold) {
  if (!test) return true;
  var currentTime = moment(moment().valueOf());
  var duration = moment.duration(currentTime.diff(test));
  var difference = duration.asSeconds();
  return difference > threshold

}

var receiverCaller = {
  'initFirstLoad': initFirstLoad,
  'update-app': updateApp,
  'removed-from-office': officeRemovalSuccess,
  'revoke-session': revokeSession,
  'notification': successDialog,
  'apiFail': apiFail,
};

function messageReceiver(response) {
  receiverCaller[response.data.type](response.data);
}


function emailVerify(notification) {
  if (firebase.auth().currentUser.email && firebase.auth().currentUser.emailVerified) return;
  if (firebase.auth().currentUser.email) return emailUpdateSuccess();
  const emailVerifyDialog = new Dialog(notification.title, notification.body).create();
  emailVerifyDialog.open();
  emailVerifyDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;
    profileView(true);
  })
}

function templateDialog(notificationData, isSuggestion, hasMultipleOffice) {
  const container = createElement('div', {
    className: 'notification-message',
    textContent: notificationData.body
  });

  const ul = createElement('ul', {
    className: 'mdc-list',
    id: 'payroll-notification-list'
  })
  ul.setAttribute('role', 'radiogroup')

  notificationData.data.forEach(function (data, idx) {
    ul.appendChild(radioList({
      labelText: data.template,
      index: idx,
      value: data,
    }))
  })
  container.appendChild(ul);

  const payrollDialog = new Dialog(notificationData.title, container).create();
  payrollDialog.open();

  const radioListInit = new mdc.list.MDCList(ul)
  radioListInit.singleSelection = true;
  payrollDialog.listen('MDCDialog:opened', function (evt) {
    radioListInit.layout();
    radioListInit.listElements.map(function (el) {
      return new mdc.ripple.MDCRipple.attachTo(el)
    })
  })
  payrollDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;


    if (!isLocationStatusWorking()) return;
    const rawValue = document.getElementById('list-radio-item-' + radioListInit.selectedIndex).value
    if (!rawValue) return;

    const value = JSON.parse(rawValue);
    let prefill = {
      schedule: '',
      attachment: ''
    }
    if (!isSuggestion) {
      prefill.schedule = value.schedule
      prefill.attachment = value.attachment

    }
    if (!hasMultipleOffice) {
      ga('send', {
        hitType: 'event',
        eventCategory: 'suggestion',
        eventAction: 'click',
        eventLabel: value.template + ' suggestion selected'
      });
      createTempRecord(value.office, value.template, prefill);
      return;
    }
    selectorUI({
      store: 'subscriptions'
    });
  })
}

function initFirstLoad(response) {
  // if (history.state[0] !== 'listView') return;
  // if (response.msg.hasOwnProperty('activity')) {
  //   if (response.msg.activity.length) {
  //     getRootRecord().then(function (record) {
  //       updateEl(response.msg.activity, record);
  //     })
  //   }
  // }
  // if (response.msg.hasOwnProperty('template')) {
  //   createActivityIcon()
  // }

  // return;
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


function apiFail(data) {
  if (document.getElementById('send-activity')) {
    document.getElementById('send-activity').style.display = 'block';
  }

  if (document.querySelector('.loader')) {
    document.querySelector('.loader').remove();
  }
  if (document.querySelector('.delete-activity')) {
    document.querySelector('.delete-activity').style.display = 'block';
  }
  if (document.querySelector('.undo-delete-loader')) {
    document.querySelector('.undo-delete-loader').style.display = 'block';
  }
  if (document.querySelector('.form-field-status')) {
    if (document.querySelector('.form-field-status').classList.contains('hidden')) {
      document.querySelector('.form-field-status').classList.remove('hidden');
    }
  }
  // progressBar.foundation_.close();
  snacks(data.msg.message);
}

function officeRemovalSuccess(data) {
  const officeRemoveDialog = new Dialog('Reminder', 'You have been removed from ' + data.msg.join(' & ')).create();
  officeRemoveDialog.open();
  officeRemoveDialog.listen('MDCDialog:closed', function () {
    document.getElementById('app-current-panel').innerHTML = '';
    resetScroll()
    listView();
  });
  return
}

function onErrorMessage(error) {

  const body = {
    'line-number': error.lineno,
    'file': error.filename,
    'col-number': error.colno,
  }
  handleError({
    message: `${error.message} from apiHandler.js at line-number ${error.lineno} and columne-number ${error.colno}`,
    body: body
  });
}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector));
}


function runRead(value) {
  if (!localStorage.getItem('dbexist')) return
  if (!value) return requestCreator('Null', value);
  if (value.read) {
    requestCreator('Null', value)
    return;
  };

  setTimeout(function () {
    if (value.verifyEmail) {
      const notificationData = JSON.parse(value.verifyEmail)
      emailVerify(notificationData)
      return;
    };

    if (value.payroll) {
      const notificationData = JSON.parse(value.payroll)
      templateDialog(notificationData)
      return;
    }
  }, 500)
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function getRootRecord() {
  return new Promise(function (resolve, reject) {
    let record;
    const dbName = firebase.auth().currentUser.uid;
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result;
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(dbName).onsuccess = function (event) {
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
    }
    req.onerror = function () {
      reject({
        message: `${req.error} from getRootRecord`
      })
    }
  })
}


function headerBackIcon(store) {
  const backIcon = document.createElement('i')
  backIcon.className = 'material-icons mdc-top-app-bar__navigation-icon'
  backIcon.textContent = 'arrow_back'
  backIcon.onclick = function () {
    if (!store) return backNav();
    // if (store === 'subscriptions') {
    //   resetScroll()
    //   listView()
    // } else {
    //   updateCreateActivity(history.state[1], true);
    // }
  }
  return backIcon;
}

function getUserRecord(db, data) {
  return new Promise(function (resolve, reject) {
    const usersObjectStore = db.transaction('users').objectStore('users');
    let number;
    if (typeof data === 'string') {
      number = data
    } else {
      number = data.phoneNumber;
    }
    usersObjectStore.get(number).onsuccess = function (event) {
      const record = event.target.result
      if (!record) return resolve({
        displayName: '',
        mobile: number,
        photoURL: ''
      })
      return resolve(record)
    }
  })
}
function getSubscription(office, template) {
  return new Promise(function (resolve) {
      const dbName = firebase.auth().currentUser.uid
      const req = indexedDB.open(dbName)
      req.onsuccess = function () {
          const db = req.result
          const tx = db.transaction(['subscriptions']);
          const subscription = tx.objectStore('subscriptions')
          const officeTemplateCombo = subscription.index('officeTemplate')
          const range = IDBKeyRange.only([office, template])
          let record;
          officeTemplateCombo.get(range).onsuccess = function (event) {
              if (!event.target.result) return;
              if (event.target.result.status !== 'CANCELLED') {
                  record = event.target.result;
              }
          }
          tx.oncomplete = function () {

              return resolve(record)

          }
      }
  })
}