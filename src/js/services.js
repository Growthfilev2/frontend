var apiHandler = new Worker('apiHandler.js');

function handleError(error) {
  const errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (!errorInStorage.hasOwnProperty(error.message)) {
    errorInStorage[error.message] = true
    localStorage.setItem('error', JSON.stringify(errorInStorage));
    error.device = native.getInfo();
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
function officeRemovalDialog(text){
  if (!document.getElementById('office-removal-dialog')) {
    var aside = document.createElement('aside');
    aside.className = 'mdc-dialog mdc-dialog--open';
    aside.id = 'office-removal-dialog';
    aside.style.backgroundColor = 'rgba(0,0,0,0.47)'
    var surface = document.createElement('div');
    surface.className = 'mdc-dialog__surface';
    surface.style.width = '90%';
    surface.style.height = 'auto';

    var section = document.createElement('section');
    section.className = 'mdc-dialog__body mock-main-body';
    section.textContent = text;

    var footer = document.createElement('footer');
    footer.className = 'mdc-dialog__footer mock-footer';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept';
    ok.textContent = 'Ok';
    ok.style.width = '100%';
    ok.style.backgroundColor = '#3498db';

    footer.appendChild(ok);

    surface.appendChild(section);
    surface.appendChild(footer);
    aside.appendChild(surface);
    document.body.appendChild(aside);
  }
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
    xhr.open('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo', true);
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
            'locationError':true
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
    try {
      body = AndroidInterface.getCellularData()
    } catch (e) {
      if (htmlLocation) {
        resolve(htmlLocation)
        return;
      }
      sendExceptionObject(e,'CATCH Type 4 : AndroidInterface.getCellularData at handleGeolocationApi',[]);
      reject('CATCH Type 4 : AndroidInterface.getCellularData at handleGeolocationApi')
      return;
    }

    if (!Object.keys(JSON.parse(body)).length) {
      if (htmlLocation) {
        return resolve(htmlLocation);
      }
      return reject('Empty Object returned from getCellularData method')
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
            locationError:true
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
            locationError:true

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
            locationError:true

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
  manageLocation().then(function (location) {
    if (location.latitude && location.longitude) {
      updateLocationInRoot(location)
    }
  })
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
          enableHighAccuracy:true
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

function showSuggestCheckInDialog(offices) {
  const checkInDialog = document.querySelector('#suggest-checkIn-dialog');
  if (!checkInDialog) return;
  var dialog = new mdc.dialog.MDCDialog(checkInDialog);
  if (!dialog) return;
  if (document.getElementById('dialog--component')) return;
  dialog['root_'].classList.remove('hidden');
  dialog.show();
  dialog.listen('MDCDialog:accept', function (evt) {
    if (isLocationStatusWorking()) {
      if (offices.length === 1) {
        createTempRecord(offices[0], 'check-in', {
          suggestCheckIn: true
        });
      } else {
        callSubscriptionSelectorUI(true);
      }
    }
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

function sendCurrentViewNameToAndroid(viewName) {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.startConversation(viewName);
    } catch (e) {
      sendExceptionObject(e,'CATCH Type 5: AndroidInterface.startConversation at sendCurrentViewNameToAndroid',[viewName]);
    }
  }
}

var locationPermission = function () {
  return {
    checkLocationPermission: function checkLocationPermission() {
      try {
        return AndroidInterface.isLocationPermissionGranted();
      } catch (e) {
        sendExceptionObject(e,'CATCH Type 6: AndroidInterface.isLocationPermissionGranted at locationPermission',[]);
        return true;
      }
    }
  };
}();

function createAndroidDialog(title, body) {
  try {
    AndroidInterface.showDialog(title, body);
  } catch (e) {
    sendExceptionObject(e,'CATCH Type 1:AndroidInterface.showDialog at createAndroidDialog ',[title,body])
    appDialog(body, true);
  }
}

function isLocationStatusWorking() {
  if (native.getName() !== 'Android') return true;

  if (!locationPermission.checkLocationPermission()) {
    createAndroidDialog('Location Permission', 'Please Allow Growthfile location access.')
    return;
  }
  try {
    if (!AndroidInterface.isConnectionActive()) {
      createAndroidDialog('No Connectivity', 'Please Check your Internet Connectivity');
      return;
    }
  }catch(e){
    sendExceptionObject(e,'CATCH Type 7: AndroidInterface.isConnectionActive  at isLocationStatusWorking',[])
    return true;
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
      let location = rootRecord.location;
      var isLocationOld = isLastLocationOlderThanThreshold(location.lastLocationTime, 5);
      const promises = [auth.getIdToken(false)];
      if (isLocationOld) {
        promises.push(manageLocation())
      }
      Promise.all(promises).then(function (result) {
        const token = result[0];
        if (result.length == 2) {
          location = result[1];
          console.log(location)
          updateLocationInRoot(location);
        }
        var geopoints = {
          'latitude': location.latitude,
          'longitude': location.longitude,
          'accuracy': location.accuracy,
          'provider': location.provider
        };
        requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
        requestBody['geopoint'] = geopoints;
        requestGenerator.body = requestBody;
        requestGenerator.user.token = token;
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
    appDialog('Fetching Location Please wait.', true);
    getRootRecord().then(function (record) {
      var cellTowerInfo = void 0;
      try {
        cellTowerInfo = AndroidInterface.getCellularData();
      } catch (e) {
        cellTowerInfo = e.message;
        sendExceptionObject(e,'CATCH Type 4: AndroidInterface.getCullarData at sendRequest',[])
      }

      var body = {
        deviceInfo: native.getInfo(),
        storedLocation: record.location,
        cellTower: cellTowerInfo
      };
      handleError({message:'No Locations Found in indexedDB',body:JSON.stringify(body)})
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
  'removed-from-office':officeRemovalSuccess,
  'revoke-session': revokeSession,
  'notification': successDialog,
  'android-stop-refreshing': androidStopRefreshing,
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
      sendExceptionObject(e,'CATCH Type 8: AndroidInterface.updateApp at updateApp',[JSON.stringify(data.msg)])
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
function officeRemovalSuccess(data){
  officeRemovalDialog('You have been removed from ' + data.msg.join(' & '));
  const dialog = new mdc.dialog.MDCDialog(document.getElementById('office-removal-dialog'));
  dialog.show()
  dialog.listen('MDCDialog:accept', function () { 
  document.getElementById('office-removal-dialog').remove();
  document.getElementById('app-current-panel').innerHTML = '';
   listView();
  })
  return
}

function androidStopRefreshing() {
  if (native.getName() === 'Android') {
    try {
      AndroidInterface.stopRefreshing(true);
    } catch (e) {
      sendExceptionObject(e,'CATCH Type 9:AndroidInterface.stopRefreshing at androidStopRefreshing',[true])
    }
  }
}

function onErrorMessage(error) {
 
  const body = {
    'line-number': error.lineno,
    'file': error.filename,
    'col-number':error.colno
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

  if (value) {
    const key = Object.keys(value)[0]
    switch (key) {
      case 'verifyEmail':
        emailVerify();
        break;
      case 'read':
        requestCreator('Null', value);
        break;
      default:
        requestCreator('Null', value);
    }
    return;
  }
  requestCreator('Null', value);
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function sendExceptionObject(exception,message,param){
  handleError({
    message:`${message}`,
    body : JSON.stringify({
      message:exception.message,
      name:exception.name,
      stack:JSON.stringify(exception.stack),
      paramSent:param
    })
  })
}