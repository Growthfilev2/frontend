var apiHandler = new Worker('apiHandler.js');

function handleError(error) {
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (!errorInStorage.hasOwnProperty(error.message)) {
    errorInStorage[error.message] = true
    localStorage.setItem('error', JSON.stringify(errorInStorage));
    error.device = native.getInfo();
    if (error.stack) {
      error.stack = error.stack;
    }

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
  var aside = document.createElement('aside');
  aside.className = 'mdc-dialog mdc-dialog--open success--dialog';
  aside.id = 'success--dialog';

  var surface = document.createElement('div');
  surface.className = 'mdc-dialog__surface round--surface';

  var section = document.createElement('section');
  section.className = 'mdc-dialog__body';

  var div = document.createElement('div');
  div.className = 'success--container';

  var icon = document.createElement('div');
  icon.className = 'success--check';

  div.appendChild(icon);
  section.appendChild(div);
  surface.appendChild(section);
  aside.appendChild(surface);
  document.body.appendChild(aside);

  var successDialog = new mdc.dialog.MDCDialog(document.querySelector('#success--dialog'));
  successDialog.show();

  setTimeout(function () {
    document.getElementById('success--dialog').remove();
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }, 1200);
  scroll_namespace.count = 0;
  scroll_namespace.size = 20;
  localStorage.removeItem('clickedActivity');
  listView();
}

function appDialog(messageString, showButton) {
  if (!document.getElementById('enable-gps')) {
    var aside = document.createElement('aside');
    aside.className = 'mdc-dialog mdc-dialog--open';
    aside.id = 'enable-gps';

    var surface = document.createElement('div');
    surface.className = 'mdc-dialog__surface';
    surface.style.width = '90%';
    surface.style.height = 'auto';

    var section = document.createElement('section');
    section.className = 'mdc-dialog__body mock-main-body';
    section.textContent = messageString;

    var footer = document.createElement('footer');
    footer.className = 'mdc-dialog__footer mock-footer';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept';
    ok.textContent = 'Ok';
    if (!showButton) {
      ok.classList.add('hidden');
    }

    ok.style.backgroundColor = '#3498db';

    footer.appendChild(ok);

    surface.appendChild(section);
    surface.appendChild(footer);
    aside.appendChild(surface);
    document.body.appendChild(aside);
  }

  var gpsDialog = new mdc.dialog.MDCDialog(document.querySelector('#enable-gps'));

  gpsDialog.listen('MDCDialog:accept', function () {
    listView();
  });

  gpsDialog.show();
}

function appUpdateDialog(messageString, title) {
  if (!document.getElementById('app-update-dialog')) {
    var aside = document.createElement('aside');
    aside.className = 'mdc-dialog mdc-dialog--open';
    aside.id = 'app-update-dialog';

    var surface = document.createElement('div');
    surface.className = 'mdc-dialog__surface';
    surface.style.width = '90%';
    surface.style.height = 'auto';

    var header = document.createElement('header');
    header.className = 'mdc-dialog__header';
    var headerText = document.createElement('h2');
    headerText.className = 'mdc-dialog__header__title';
    headerText.textContent = title;
    header.appendChild(headerText);
    var section = document.createElement('section');
    section.className = 'mdc-dialog__body';
    section.textContent = messageString;

    var footer = document.createElement('footer');
    footer.className = 'mdc-dialog__footer';

    surface.appendChild(header);
    surface.appendChild(section);
    surface.appendChild(footer);
    aside.appendChild(surface);
    document.body.appendChild(aside);
  }

  var appUpdate = new mdc.dialog.MDCDialog(document.querySelector('#app-update-dialog'));
  appUpdate.show();
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
    actionText: type ? type.btn : 'OK',
    timeout: 10000,
    actionHandler: function actionHandler() {}
  };

  var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

  snackbar.show(data);
}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}


function geolocationApi(req) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(req.method, req.url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 400) {
          const errorMessage = JSON.parse(xhr.response).error.errors[0].reason
          if (errorMessage === 'Backend Error') {
            if (req.retry === 1) {
              return reject({
                message: errorMessage,
                body: {
                  cellular: req.body,
                  tries: 'Retried 3 times'
                }
              });
            }
            req.retry--
            geolocationApi(req).then().catch(function (error) {
              reject(error)
            })
            return;
          }

          return reject({
            message: errorMessage,
            body: req.body
          });
        }

        if (!xhr.responseText) {
          return reject({
            message: 'No response text from google',
            body: req.body
          })
        };
        const response = JSON.parse(xhr.responseText);
        if (!response) {
          return reject({
            message: 'Response text is not parseable',
            body: req.body
          })
        }

        resolve({
          'latitude': response.location.lat,
          'longitude': response.location.lng,
          'accuracy': response.accuracy,
          'provider': {
            'cellular': JSON.parse(req.body)
          },
        });
      }
    };
    const verfiedBody = handleRequestBody(req.body);
    if(verfiedBody){
      xhr.send(verfiedBody);
    }
    else {
      reject({message:'WCDMA CellTower request doesnt have wifiAccessPoints',body:req.body})
    }
  });
}

function handleRequestBody(request) {
  const body = JSON.parse(request);
  if (body.radioType === "WCDMA") {
    if (body.wifiAccessPoints &&  body.wifiAccessPoints.length) {
      if(body.cellTowers) {
        delete body.cellTowers;
      }
      return JSON.stringify(body);
    } else {
      return null;
    }
  }
  return request
}


function getCellTowerInfo() {
  return new Promise(function (resolve, reject) {
    let coarseData = "";
    try {
      coarseData = AndroidInterface.getCellularData();
    } catch (e) {
      reject({
        message: `${e.message} from getCellularData`
      });
    }

    if (!coarseData) {
      reject({
        message: 'empty cell tower from android.'
      });
      return
    }
    var apiKey ='AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo'
    const req = {
      method: 'POST',
      url: 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + apiKey,
      body: coarseData,
      retry: 3
    }

    geolocationApi(req).then(function (location) {
      resolve(location)
    }).catch(function (error) {
      reject(error)
    });
  })
}

function manageLocation() {
  return new Promise(function (resolve, reject) {
    if (native.getName() === 'Android') {
      getCellTowerInfo().then(function (location) {
        resolve(location)
      }).catch(function (error) {
        handleError(error);
        return html5Geolocation();
      }).then(function (location) {
        resolve(location)
      }).catch(function (error) {
        reject({
          error: error,
          meta: 'Both geolocation and html5 failed to get location'
        });
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

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    var stabalzied = [];
    var totalcount = 0;
    var count = 0;

    var myInterval = setInterval(function () {
      navigator.geolocation.getCurrentPosition(function (position) {
        ++totalcount;
        if (totalcount !== 1) {
          stabalzied.push({
            'latitude': position.coords.latitude,
            'longitude': position.coords.longitude,
            'accuracy': position.coords.accuracy,
            'provider': 'HTML5'
          });

          if (stabalzied[0].latitude.toFixed(3) === position.coords.latitude.toFixed(3) && stabalzied[0].longitude.toFixed(3) === position.coords.longitude.toFixed(3)) {
            ++count;
            if (count == 3) {
              clearInterval(myInterval);
              myInterval = null;
              return resolve(stabalzied[0]);
            }
          }
          if (totalcount >= 5) {
            clearInterval(myInterval);
            myInterval = null;
            var bestInNavigator = sortedByAccuracy(stabalzied);
            return resolve(bestInNavigator);
          }
        }
      }, function (error) {
        clearInterval(myInterval);
        myInterval = null;
        reject({
          message: `${error.message} from html5Geolocation`
        });
      });
    }, 500);
  });

}


function locationUpdationSuccess(location) {
 
  var locationEvent = new CustomEvent("location", {
    "detail": location.new
  });
  window.dispatchEvent(locationEvent);

  var distanceBetweenBoth = calculateDistanceBetweenTwoPoints(location.prev, location.new);
 
  var suggestCheckIn = new CustomEvent("suggestCheckIn", { 
    "detail": isLocationMoreThanThreshold(distanceBetweenBoth) || app.isNewDay()
  });
  window.dispatchEvent(suggestCheckIn);
}

function showSuggestCheckInDialog() {
  const checkInDialog = document.querySelector('#suggest-checkIn-dialog');
  if (!checkInDialog) return;
  var dialog = new mdc.dialog.MDCDialog(checkInDialog);
  if (!dialog) return;
  if (document.getElementById('dialog--component')) return;
  dialog['root_'].classList.remove('hidden');
  dialog.show();
  dialog.listen('MDCDialog:accept', function (evt) {
    getRootRecord().then(function (rootRecord) {
      if (isLocationStatusWorking()) {
        if (rootRecord.offices.length === 1) {
          createTempRecord(rootRecord.offices[0], 'check-in', {
            suggestCheckIn: true
          });
        } else {
          callSubscriptionSelectorUI(evt, true);
        }
      }
    }).catch(console.log);
  });
  dialog.listen('MDCDialog:cancel', function (evt) {
   app.isNewDay();
  });
}

function isDialogOpened(id) {
  var currentDialog = document.querySelector(id);
  if (!currentDialog) return false;
  var isOpen = currentDialog.classList.contains('mdc-dialog--open');
  return isOpen;
}

function updateLocationInRoot(finalLocation) {
  return new Promise(function (resolve, reject) {

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
  
        resolve({
          prev: previousLocation,
          new: finalLocation
        });
      };
      tx.onerror = function () {
        reject({
          message: `${tx.error.message} from updateLocationInRoot`,
          body: tx.error.name
        })
      }
    };
    req.onerror = function () {
      reject({
        message: `${req.error.message} from updateLocationInRoot`,
        body: req.error.name
      });
    };
  });
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

function sendCurrentViewNameToAndroid(viewName) {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.startConversation(viewName);
    } catch (e) {
      handleError({
        message: `${e.message} from startConversation`
      });
    }
  }
}

var locationPermission = function () {
  return {
    checkGps: function checkGps() {
      try {
        return AndroidInterface.isGpsEnabled();
      } catch (e) {
        handleError({
          message: `${e.message} from isGpsEnabled`
        })
        return true;
      }
    },
    checkLocationPermission: function checkLocationPermission() {
      try {
        return AndroidInterface.isLocationPermissionGranted();
      } catch (e) {
        handleError({
          message: `${e.message} from isLocationPermissionGranted`
        });
        return true;
      }
    }
  };
}();

function createAndroidDialog(title, body) {
  try {
    AndroidInterface.showDialog(title, body);
  } catch (e) {
    handleError({
      message: `${e.message} from showDialog`
    });
    appDialog(body, true);
  }
}

function isLocationStatusWorking() {
  if (native.getName() !== 'Android') return true;

  if (!locationPermission.checkLocationPermission()) {
    createAndroidDialog('Location Permission', 'Please Allow Growthfile location access.')
    return;
  }
  if (!AndroidInterface.isConnectionActive()) {
    createAndroidDialog('No Connectivity', 'Please Check your Internet Connectivity');
    return;
  }
  return true
}

function requestCreator(requestType, requestBody) {
  var auth = firebase.auth().currentUser;

  var requestGenerator = {
    type: requestType,
    body: '',
    user: {
      token: '',
      uid: auth.uid,
      displayName: auth.displayName,
      photoURL: auth.photoURL,
      phoneNumber: auth.phoneNumber
    }
  };

  if (requestType === 'instant' || requestType === 'now' || requestType === 'Null' || requestType === 'backblaze') {
    auth.getIdToken(false).then(function (token) {
      requestGenerator.body = requestBody;
      requestGenerator.user.token = token;
      apiHandler.postMessage(requestGenerator);
    }).catch(function (error) {
      handleError({
        message: error.code
      })
    });
  } else {

    getRootRecord().then(function (rootRecord) {

      var location = rootRecord.location;
      var isLocationOld = isLastLocationOlderThanThreshold(location.lastLocationTime, 5);

      requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
      if (isLocationOld) {
        handleWaitForLocation(requestBody, requestGenerator);
      } else {
        auth.getIdToken(false).then(function (token) {

          var geopoints = {
            'latitude': location.latitude,
            'longitude': location.longitude,
            'accuracy': location.accuracy,
            'provider': location.provider
          };

          requestBody['geopoint'] = geopoints;
          requestGenerator.body = requestBody;
          requestGenerator.user.token = token;
          sendRequest(location, requestGenerator);
        }).catch(function (error) {
          handleError({
            message: error.code
          })
        });
      }
    });
  };

  // handle the response from apiHandler when operation is completed
  apiHandler.onmessage = messageReceiver;
  apiHandler.onerror = onErrorMessage;
}

function handleWaitForLocation(requestBody, requestGenerator) {

  window.addEventListener('location', function _listener(e) {
    firebase.auth().currentUser.getIdToken(false).then(function (token) {

      var data = e.detail;
      var geopoints = {
        'latitude': data.latitude,
        'longitude': data.longitude,
        'accuracy': data.accuracy,
        'provider': data.provider
      };
      requestBody['geopoint'] = geopoints;
      requestGenerator.body = requestBody;
      requestGenerator.user.token = token;
      sendRequest(geopoints, requestGenerator);
    }).catch(function (error) {
      handleError({
        message: error.code
      })
    });
    window.removeEventListener('location', _listener, true);
  }, true);
}

function sendRequest(location, requestGenerator) {

  if (location.latitude && location.longitude && location.accuracy) {

    apiHandler.postMessage(requestGenerator);
  } else {
    appDialog('Fetching Location Please wait.', true);
    getRootRecord().then(function (record) {
      var cellTowerInfo = void 0;
      try {
        cellTowerInfo = AndroidInterface.getCellularData();
      } catch (e) {
        cellTowerInfo = e.message;
      }

      var body = {

        deviceInfo: native.getInfo(),
        storedLocation: record.location,
        cellTower: cellTowerInfo

      };
      handleError({
        message: 'No location found in indexedDB',
        body: body
      })
    });
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
  'revoke-session': revokeSession,
  'notification': successDialog,
  'android-stop-refreshing': androidStopRefreshing,
  'loadView': loadView,
  'apiFail': apiFail,
  'backblazeRequest': urlFromBase64Image,  
};

function messageReceiver(response) {
  receiverCaller[response.data.type](response.data);
}


function emailVerify() {

  if (firebase.auth().currentUser.email) {
    emailUpdateSuccess()
    return;
  }

  showEMailUpdateDailog();
  const dialog = new mdc.dialog.MDCDialog(document.getElementById('email-update-dialog'));
  dialog.show()
  dialog.listen('MDCDialog:accept', function () {
    document.getElementById('email-update-dialog').remove()
    profileView(true);
  })
  dialog.listen('MDCDialog:cancel', function () {
    document.getElementById('email-update-dialog').remove()
  })
}

function showEMailUpdateDailog() {

  var aside = document.createElement('aside');
  aside.className = 'mdc-dialog mdc-dialog--open';
  aside.id = 'email-update-dialog';
  aside.style.backgroundColor = 'rgba(0,0,0,0.47)'
  var surface = document.createElement('div');
  surface.className = 'mdc-dialog__surface';
  surface.style.width = '90%';
  surface.style.height = 'auto';

  const header = document.createElement('header');
  header.className = 'mdc-dialog__header'
  const headerText = document.createElement('h2')
  headerText.className = 'mdc-dialog__header__title'
  headerText.textContent = 'Reminder'
  header.appendChild(headerText)
  var section = document.createElement('section');
  section.className = 'mdc-dialog__body';
  section.textContent = 'Please Set your Email-id';

  var footer = document.createElement('footer');
  footer.className = 'mdc-dialog__footer';

  var ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept';
  ok.textContent = 'Okay';
  ok.style.backgroundColor = '#3498db';

  var canel = document.createElement('button');
  canel.type = 'button';
  canel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel';
  canel.textContent = 'Cancel';
  canel.style.backgroundColor = '#3498db';

  footer.appendChild(canel);
  footer.appendChild(ok);

  surface.appendChild(header)
  surface.appendChild(section);
  surface.appendChild(footer);
  aside.appendChild(surface);

  document.body.appendChild(aside);

}

function initFirstLoad(response) {
  console.log(response);
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

function updateApp(data) {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.updateApp(data.msg);
    } catch (e) {
      var message = 'Please Install the Latest version from google play store , to Use Growthfile. After Updating the App, close Growthfile and open again ';
      var title = JSON.parse(data.msg).message;
      appUpdateDialog('' + message, title);
    } 
    return;
  }
  webkit.messageHandlers.updateApp.postMessage('Update App');
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

function urlFromBase64Image(data) {

  if (data.code === 200) {
    if (history.state[0] === 'profileView') {
      var selector = document.querySelector('#profile--image-container .profile--loader ');
      if (selector) {
        selector.remove();
      }
      document.getElementById('user-profile--image').src = firebase.auth().currentUser.photoURL;
      return;
    }
  }
}

function loadView(data) {

  if (history.state[0] === 'updateCreateActivity') {
    toggleActionables(history.state[1].activityId);
    return;
  }
  if (history.state[0] === 'profileView') return;

  window[history.state[0]](history.state[1], false);
}



function androidStopRefreshing() {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.stopRefreshing(true);
    } catch (e) {
      handleError({
        message: `${e.message} from androidStopRefreshing`
      })
    }
  }
}

function onErrorMessage(error) {
  const body = {
    'line-number': error.lineno,
    'file': error.filename
  }
  handleError({
    message: `${error.message} from apiHandler.js at ${error.lineno}`,
    body: body
  });
}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector));
}

function runRead(value) {
  
  if (localStorage.getItem('dbexist')) {
    if(!value) {
      requestCreator('Null', value);
      return;
    }
    
    if (Object.keys(value)[0] === 'verifyEmail') {
      emailVerify();
      return
    }
  }
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}