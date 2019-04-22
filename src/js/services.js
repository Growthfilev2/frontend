let apiHandler = new Worker('js/apiHandler.js');

function handleError(error) {
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (!errorInStorage.hasOwnProperty(error.message)) {
    errorInStorage[error.message] = true
    localStorage.setItem('error', JSON.stringify(errorInStorage));
    error.device = JSON.stringify(native.getInfo());
    requestCreator('instant', JSON.stringify(error))
    return
  }
}

function loader(nameClass) {
  var div = document.createElement('div');
  div.className = 'loader ' + nameClass;
  return div;
}



function successDialog() {
  const checkMark = createElement('div',{className:'success-checkmark',id:'success-check'})
  const icon = createElement('div',{className:'check-icon'})
  const lineTip = createElement('span',{className:'icon-line line-tip'})
  const lineLong = createElement('span',{className:'icon-line line-long'})
  const circle = createElement('div',{className:'icon-circle'})
  const fix = createElement('div',{className:'icon-fix'})
  
  icon.appendChild(lineTip)
  icon.appendChild(lineLong);
  icon.appendChild(circle)
  icon.appendChild(fix)
  checkMark.appendChild(icon);
  document.body.appendChild(checkMark);

  // setTimeout(function () {
  //   document.getElementById('success-check').remove();
  //   resetScroll();
  //   localStorage.removeItem('clickedActivity');
  //   resetScroll()
  //   listView();
  // }, 1000);
}


function progressBar() {
  var div = document.createElement('div');
  div.className = 'mdc-linear-progress mdc-linear-progress--indeterminate progress--update';
  div.role = 'progressbar';
  var bufferDots = document.createElement('div');
  bufferDots.className = 'mdc-linear-progress__buffering-dots';
  var buffer = document.createElement('div');
  buffer.className = 'mdc-linear-progress__buffer';
  var primary = document.createElement('div');
  primary.className = 'mdc-linear-progress__bar mdc-linear-progress__primary-bar';

  var primaryInner = document.createElement('span');
  primaryInner.className = 'mdc-linear-progress__bar-inner';

  primary.appendChild(primaryInner);
  var secondary = document.createElement('div');
  secondary.className = 'mdc-linear-progress__bar mdc-linear-progress__secondary-bar';

  var secondaryInner = document.createElement('span');
  secondaryInner.className = 'mdc-linear-progress__bar-inner';

  secondary.appendChild(secondaryInner);
  div.appendChild(bufferDots);
  div.appendChild(buffer);
  div.appendChild(primary);
  div.appendChild(secondary);
  return div;
}

function snacks(message, type) {
  var snack = document.createElement('div');
  snack.className = 'mdc-snackbar';
  snack.setAttribute('aria-live', 'assertive');
  snack.setAttribute('aria-atomic', 'true');
  snack.setAttribute('aria-hidden', 'true');
  snack.style.zIndex = 99999
  var snackbarText = document.createElement('div');
  snackbarText.className = 'mdc-snackbar__text mdc-typography--subtitle2';

  var snackbarAction = document.createElement('div');
  snackbarAction.className = 'mdc-snackbar__action-wrapper';

  var button = document.createElement('button');
  button.className = 'mdc-snackbar__action-button';

  snackbarAction.appendChild(button);

  snack.appendChild(snackbarText);
  snack.appendChild(snackbarAction);
  document.getElementById('snackbar-container').innerHTML = snack.outerHTML;

  var data = {

    message: message,
    actionText: 'OK',
    timeout: 5000,
    actionHandler: function actionHandler() {

    }
  };

  var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

  snackbar.show(data);
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
            body: body,
          });
        }
        const response = JSON.parse(xhr.response);
        if (!response) {
          return reject({
            message: 'Response From geolocation Api ' + response,
            body: body
          })
        }
        resolve({
          latitude: response.location.lat,
          longitude: response.location.lng,
          accuracy: response.accuracy,
          provider: {
            body: body
          }
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

function handleRequestBody(request) {
  const body = JSON.parse(request);
  if (body.wifiAccessPoints && body.wifiAccessPoints.length) {
    if (body.cellTowers) {
      delete body.cellTowers;
    }
    return JSON.stringify(body);
  } else {
    return null;
  }
}

function manageLocation() {
  return new Promise(function (resolve, reject) {
    getLocation().then(function (location) {
      updateLocationInRoot(location)
      resolve(location)
    }).catch(function (error) {
      reject(error)
    })
  })
}

function getLocation() {
  return new Promise(function (resolve, reject) {
    const holder = {}
    if (native.getName() === 'Android') {
      html5Geolocation().then(function (htmlLocation) {
        if (htmlLocation.accuracy <= 350) return resolve(htmlLocation);
        holder['html5'] = {
          body: '',
          result: htmlLocation
        }
        handleGeoLocationApi(holder, htmlLocation).then(function (location) {
          resolve(location)
        })
      }).catch(function (htmlError) {
        handleGeoLocationApi(holder).then(function (location) {
          resolve(location)
        }).catch(function (error) {
          reject({
            message: 'Both HTML and Geolocation failed to fetch location.',
            body: JSON.stringify({
              html5: htmlError,
              geolocation: JSON.stringify(error),
            }),
            'locationError': true
          })
        })
      })
      return;
    }

    html5Geolocation().then(function (location) {
      resolve(location)
    }).catch(function (error) {
      reject(error)
    })
  })
}


function handleGeoLocationApi(holder, htmlLocation) {
  return new Promise(function (resolve, reject) {
    let body;
    const allLocations = [];
    body = getCellularInformation()
    console.log(body)
    if (body === "") {
      if (htmlLocation) {
        resolve(htmlLocation)
        return;
      }
      reject("empty string from AndroidInterface.getCellularData");
    }

    geolocationApi(body).then(function (cellLocation) {
      if (cellLocation.accuracy <= 350) return resolve(cellLocation);

      holder['orignialGeolocationResponse'] = {
        body: body,
        result: cellLocation
      };


      const withoutCellTower = handleRequestBody(body);
      if (!withoutCellTower) {
        if (cellLocation.accuracy >= 1200) {
          handleError({
            message: 'Oringinal CellTower has accuracy more than 1200 and WAP doesnt exist',
            body: JSON.stringify(holder),
            locationError: true
          })
        }
        if (!htmlLocation) {
          resolve(cellLocation)
          return
        }
        if (cellLocation.accuracy < htmlLocation.accuracy) {
          resolve(cellLocation);
          return
        }
        return resolve(htmlLocation);
      }

      geolocationApi(withoutCellTower).then(function (withoutCellTowerLocation) {
        if (withoutCellTowerLocation.accuracy <= 350) return resolve(withoutCellTowerLocation);
        holder['withoutCellTower'] = {
          body: withoutCellTower,
          result: withoutCellTowerLocation
        };
        if (withoutCellTowerLocation.accuracy >= 1200) {

          handleError({
            message: 'html5,originalCellTower,WithoutCellTower',
            body: JSON.stringify(holder),
            locationError: true

          })
        }


        Object.keys(holder).forEach(function (key) {
          allLocations.push(holder[key].result)
        })
        return resolve(sortedByAccuracy(allLocations))
      }).catch(function (error) {
        if (cellLocation.accuracy >= 1200) {
          holder['withoutCellTower'] = {
            body: withoutCellTower
          }
          handleError({
            message: 'Orinigal CellTower has accuracy more than 1200 and api failure when sending cellTowerObject without cellularTowers',
            body: JSON.stringify(holder),
            locationError: true

          })
        }

        if (!htmlLocation) {
          resolve(cellLocation);
          return;
        }
        if (cellLocation.accuracy < htmlLocation.accuracy) {
          resolve(cellLocation);
          return
        }
        return resolve(htmlLocation);
      });
    }).catch(function (error) {
      if (htmlLocation) {
        resolve(htmlLocation)
        return;
      }
      reject(error)
    })
  })
}

function iosLocationError(error) {
  manageLocation().then(console.log).catch(console.log);
  handleError(error)
}

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    const prom = [];
    for (let i = 0; i < 2; i++) {

      let navProm = new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(function (position) {
          return resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            provider: 'HTML5'
          })

        }, function (error) {
          reject({
            message: error
          })
        }, {
          timeout: 5000,
          maximumAge: 0,
          enableHighAccuracy: true
        })
      })
      prom.push(navProm)
    }


    Promise.all(prom).then(function (results) {

      let bestAccuracy = results.sort(function (a, b) {
        return a.accuracy - b.accuracy
      })
      resolve(bestAccuracy[0]);
      return;
    }).catch(function (error) {

      reject({
        message: error.message.message
      })
      return;
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
        "detail": isLocationMoreThanThreshold(distanceBetweenBoth) || app.isNewDay()
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
  if (native.getName() !== 'Android') return true;

  if (!AndroidInterface.isLocationPermissionGranted()) {
    const alertDialog = new Dialog('LOCATION PERMISSION', 'Please Allow Growthfile location access.');
    alertDialog.open();
    return
  }

  if (JSON.parse(localStorage.getItem('deviceInfo')).deviceBrand === 'samsung') {
    if (!AndroidInterface.isWifiOn()) {
      const alertDialog = new Dialog('TURN ON YOUR WIFI', 'Growthfile requires wi-fi access for improving your location accuracy.');
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

  if (requestType === 'instant' || requestType === 'now' || requestType === 'Null' || requestType === 'backblaze') {
    auth.getIdToken(false).then(function (token) {
      requestGenerator.body = requestBody;
      requestGenerator.meta.user.token = token;

      apiHandler.postMessage(requestGenerator);
    }).catch(console.log);
  } else {

    getRootRecord().then(function (rootRecord) {
      let location = rootRecord.location;
      var isLocationOld = isLastLocationOlderThanThreshold(location.lastLocationTime, 5);
      const promises = [auth.getIdToken(false)];
      if (isLocationOld) {
        if (native.getName() === 'Android') {
          promises.push(manageLocation())
        } else {
          window.addEventListener('iosLocation', function _iosLocation(e) {
            promises.push(e.detail)
            window.removeEventListener('iosLocation', _iosLocation, true)
          }, true)
        }
      }

      Promise.all(promises).then(function (result) {
        const token = result[0];
        if (result.length == 2) {
          location = result[1];
          console.log(location)
        }

        var geopoints = {
          'latitude': location.latitude,
          'longitude': location.longitude,
          'accuracy': location.accuracy,
          'provider': location.provider
        };

        if (requestType === 'create') {
          requestBody.forEach(function (body) {
            body.timestamp = fetchCurrentTime(rootRecord.serverTime);
            body.geopoint = geopoints
          })
        } else {
          requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
          requestBody['geopoint'] = geopoints;
        }
        requestGenerator.body = requestBody;

        requestGenerator.meta.user.token = token;

        sendRequest(location, requestGenerator);
      }).catch(function (error) {
        handleError(error);
      })
    });
  };

  // handle the response from apiHandler when operation is completed
  apiHandler.onmessage = messageReceiver;
  apiHandler.onerror = onErrorMessage;
}


function sendRequest(location, requestGenerator) {
  if (location.latitude && location.longitude && location.accuracy) {
    apiHandler.postMessage(requestGenerator);
  } else {
    const locationErrorDialog = new Dialog('Location Error', 'There was a Problem in detecting your location. Please Try again later').create();
    locationErrorDialog.open();
    locationErrorDialog.listen('MDCDialog:closed', function (evt) {
      getRootRecord().then(function (record) {
        handleError({
          message: 'No Locations Found in indexedDB',
          body: JSON.stringify({
            storedLocation: record.location,
            cellTower: getCellularInformation()
          })
        })
        resetScroll()
        listView();
      })
    })
  }
}

function isLastLocationOlderThanThreshold(test, threshold) {

  var currentTime = moment(moment().valueOf());
  var lastLocationTime = test;
  var duration = moment.duration(currentTime.diff(lastLocationTime));
  var difference = duration.asSeconds();
  if (difference > threshold) {
    return true;
  }
  return false;
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
  const emailVerifyDialog = new Dialog(notification.title, notification.body);
  emailVerifyDialog.open();
  emailVerifyDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;
    profileView(true);
  })
}


function createBlankPayrollDialog(notificationData) {
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
  radioListInit.singleSelection = true

  payrollDialog.listen('MDCDialog:opened', function (evt) {
    radioListInit.layout();
    radioListInit.listElements.map(function (el) {
      return new mdc.ripple.MDCRipple.attachTo(el)
    })
  })
  payrollDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;
    if (!isLocationStatusWorking()) return;
    const value = JSON.parse(document.getElementById('list-radio-item-' + radioListInit.selectedIndex).value)
    createTempRecord(value.office, value.template, {
      schedule: value.schedule,
      attachment: value.attachment
    });
  })
}

function initFirstLoad(response) {
  if (history.state[0] !== 'listView') return;
  if (response.msg.hasOwnProperty('activity')) {
    if (response.msg.activity.length) {
      getRootRecord().then(function (record) {
        updateEl(response.msg.activity, record);
      })
    }
  }
  if (response.msg.hasOwnProperty('template')) {
    createActivityIcon()
  }

  return;
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
  if (document.querySelector('header .mdc-linear-progress')) {
    document.querySelector('header .mdc-linear-progress').remove();
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
    'col-number': error.colno
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
  setTimeout(function () {
    if (value.read) {
      requestCreator('Null', value)
      return;
    };

    if (value.verifyEmail) {
      const notificationData = JSON.parse(value.verifyEmail)
      emailVerify(notificationData)
      return;
    };

    if (value.payroll) {
      const notificationData = JSON.parse(value.payroll)
      createBlankPayrollDialog(notificationData)
      return;
    }
  }, 1500)
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function jniException(message, stack) {
  handleError({
    message: message,
    body: stack,
    androidException: true
  })
}

function sendExceptionObject(exception, message, param) {
  handleError({
    message: `${message}`,
    body: JSON.stringify({
      message: exception.message,
      name: exception.name,
      stack: JSON.stringify(exception.stack),
      paramSent: param
    })
  })
}