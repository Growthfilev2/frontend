var apiHandler = new Worker('src/js/apiHandler.js');

function handleImageError(img) {
  img.onerror = null;
  img.src = './img/empty-user.jpg';

  var req = window.indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var usersObjectStoreTx = db.transaction('users', 'readwrite');
    var usersObjectStore = usersObjectStoreTx.objectStore('users');
    usersObjectStore.get(img.dataset.number).onsuccess = function (event) {

      var record = event.target.result;
      if (!record) {
        return;
      };

      if (record.isUpdated == 0) return;
      record.isUpdated = 0;
      usersObjectStore.put(record);
    };
  };
  return true;
}

function handleImageErrorAttachment(img) {
  img.onerror = null;
  img.src = './img/placeholder.png';
  return true;
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

  listView({
    urgent: false,
    nearBy: false
  });
}

function appDialog(messageString) {
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
    ok.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel';
    ok.textContent = 'Ok';
    ok.style.backgroundColor = '#3498db';

    footer.appendChild(ok);

    surface.appendChild(section);
    surface.appendChild(footer);
    aside.appendChild(surface);
    document.body.appendChild(aside);
  }

  var gpsDialog = new mdc.dialog.MDCDialog(document.querySelector('#enable-gps'));
  gpsDialog.show();
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
  console.log(serverTime);
  return Date.now() + serverTime;
}

function sendLocationServiceCrashRequest(rejection) {
  return {
    'message': rejection,

    'phoneProp': native.getInfo()
  };
}

function geolocationApi(method, url, data) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log(xhr);

        if (xhr.status >= 400) {
          if (JSON.parse(xhr.response).error.errors[0].reason !== 'notFound') {
            setGeolocationApiUsage(false).then(function () {
              reject({
                message: xhr.response,
                cellular: data,
                success: false
              });
            });
          }
          return;
        }

        var result = JSON.parse(xhr.responseText);
        resolve({
          'latitude': result.location.lat,
          'longitude': result.location.lng,
          'accuracy': result.accuracy,
          'provider': 'Cellular',
          'lastLocationTime': Date.now(),
          'success': true,
          'useTowerInfo': true
        });
      }
    };
    xhr.send(data);
  });
}

function manageLocation() {
  if (!localStorage.getItem('dbexist')) {
    localStorage.setItem('dbexist', firebase.auth().currentUser.uid);
  };

  if (native.getName() === 'Android') {
    getRootRecord().then(function (rootRecord) {
      if (shouldFetchCellTower(rootRecord.location)) {
        useGeolocationApi(rootRecord.location.provider);
        return;
      }
      useHTML5Location();
    });
    return;
  }

  useHTML5Location();
}

function shouldFetchCellTower(locationObject) {
  if (locationObject.hasOwnProperty('useTowerInfo')) {
    return locationObject.useTowerInfo;
  }
  return true;
}

function useGeolocationApi(provider) {
  var apiKey = 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo';
  var CelllarJson = false;

  try {
    CelllarJson = Towers.getCellularData();
    if (!Object.keys(JSON.parse(CelllarJson)).length) return;

    geoFetchPromise = geolocationApi('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + apiKey, CelllarJson);

    if (provider === 'MOCK') {
      geoFetchPromise.then(function (geoData) {
        updateLocationInRoot(geoData).then(locationUpdationSuccess, locationUpdationError);
      }).catch(function (error) {
        requestCreator('instant', JSON.stringify(sendLocationServiceCrashRequest(error)));
      });
      return;
    }

    geoFetchPromise.then(function (geoData) {
      initLocationInterval(geoData);
    }).catch(function (error) {
      initLocationInterval(error);
    });
  } catch (e) {
    requestCreator('instant', JSON.stringify({
      message: {
        error: e.message,
        file: 'services.js',
        lineNo: 231,
        device: JSON.parse(native.getInfo()),
        help: 'Problem in calling method for fetching cellular towers.'
      }
    }));

    if (provider === 'MOCK') return;
    useHTML5Location();
  }
}

function useHTML5Location() {
  locationInterval().then(function (navigatorData) {
    updateLocationInRoot(navigatorData).then(locationUpdationSuccess, locationUpdationError);
  }).catch(function (error) {
    requestCreator('instant', JSON.stringify(sendLocationServiceCrashRequest(error)));
  });
}

function initLocationInterval(locationStatus) {
  var singletonSuccess = [];
  var bestLocation = void 0;
  locationInterval().then(function (navigatorData) {
    if (locationStatus.success) {
      singletonSuccess.push(locationStatus, navigatorData);
      bestLocation = sortedByAccuracy(singletonSuccess);
    } else {
      requestCreator('instant', JSON.stringify(sendLocationServiceCrashRequest(locationStatus)));
      bestLocation = navigatorData;
    }
    updateLocationInRoot(bestLocation).then(locationUpdationSuccess, locationUpdationError);
  }).catch(function (error) {
    if (locationStatus.success) {
      updateLocationInRoot(locationStatus).then(locationUpdationSuccess, locationUpdationError);
    } else {
      requestCreator('instant', JSON.stringify(sendLocationServiceCrashRequest(locationStatus)));
    }
    requestCreator('instant', JSON.stringify(sendLocationServiceCrashRequest(error)));
  });
}

function locationUpdationSuccess(location) {
  if (!location.prev.latitude) return;
  if (!location.prev.longitude) return;
  if (!location.new.latitude) return;
  if (!location.new.longitude) return;

  var locationEvent = new CustomEvent("location", {
    "detail": location.new
  });
  window.dispatchEvent(locationEvent);

  var distanceBetweenBoth = calculateDistanceBetweenTwoPoints(location.prev, location.new);
  var locationChanged = new CustomEvent("locationChanged", {
    "detail": isLocationMoreThanThreshold(distanceBetweenBoth)
  });
  window.dispatchEvent(locationChanged);
}

function showSuggestCheckInDialog() {
  var dialog = new mdc.dialog.MDCDialog(document.querySelector('#suggest-checkIn-dialog'));
  if (!dialog) return;
  if (document.getElementById('dialog--component')) return;
  dialog['root_'].classList.remove('hidden');
  dialog.show();
  dialog.listen('MDCDialog:accept', function (evt) {
    getRootRecord().then(function (rootRecord) {
      suggestCheckIn(false).then(function () {
        if (rootRecord.offices.length === 1) {
          createTempRecord(rootRecord.offices[0], 'check-in', {
            suggestCheckIn: true
          });
        } else {
          callSubscriptionSelectorUI(evt, true);
        }
      });
    }).catch(console.log);
  });
  dialog.listen('MDCDialog:cancel', function (evt) {
    suggestCheckIn(false).then(console.log).catch(console.log);
  });
}

function isDialogOpened(id) {
  var currentDialog = document.querySelector(id);
  if (!currentDialog) return false;
  var isOpen = currentDialog.classList.contains('mdc-dialog--open');
  return isOpen;
}

function locationUpdationError(error) {
  requestCreator('instant', JSON.stringify({
    'message': error
  }));
}

function mock() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({
        'latitude': '',
        'longitude': '',
        'accuracy': 99999999,
        'lastLocationTime': Date.now(),
        'provider': 'Mock'
      });
    }, 6000);
  });
}

function navigatorPromise() {
  var stabalzied = [];
  var totalcount = 0;
  var count = 0;
  return new Promise(function (resolve, reject) {

    var myInterval = setInterval(function () {

      navigator.geolocation.getCurrentPosition(function (position) {
        ++totalcount;
        if (totalcount !== 1) {

          stabalzied.push({
            'latitude': position.coords.latitude,
            'longitude': position.coords.longitude,
            'accuracy': position.coords.accuracy,
            'lastLocationTime': Date.now(),
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

        reject(error.message);
      });
    }, 500);
  });
}

function locationInterval() {
  return new Promise(function (resolve, reject) {
    var promiseArray = [navigatorPromise()];
    if (native.getName() === 'Android') {
      promiseArray.push(mock());
    }
    Promise.race(promiseArray).then(function (location) {
      resolve(location);
    }).catch(function (error) {
      reject(error);
    });
  });
}

function sortedByAccuracy(geoData) {
  var result = geoData.sort(function (a, b) {
    return a.accuracy - b.accuracy;
  });
  return result[0];
}

function updateLocationInRoot(finalLocation) {
  if (!finalLocation) return;

  var previousLocation = void 0;
  return new Promise(function (resolve, reject) {
    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['root'], 'readwrite');
      var rootStore = tx.objectStore('root');
      rootStore.get(dbName).onsuccess = function (event) {

        var record = event.target.result;
        previousLocation = {
          latitude: record.location.latitude,
          longitude: record.location.longitude,
          accuracy: record.location.accuracy,
          provider: record.location.provider,
          localStorage: record.location.lastLocationTime
        };
        if (!record.location) {
          record.location = finalLocation;
        } else {
          record.location.latitude = finalLocation.latitude;
          record.location.longitude = finalLocation.longitude;
          record.location.accuracy = finalLocation.accuracy;
          record.location.lastLocationTime = finalLocation.lastLocationTime, record.location.provider = finalLocation.provider;
        }
        rootStore.put(record);
      };
      tx.oncomplete = function () {
        resolve({
          prev: previousLocation,
          new: finalLocation
        });
      };
    };
    req.onerror = function (error) {
      reject(error);
    };
  });
}

function setGeolocationApiUsage(useApi) {
  return new Promise(function (resolve, reject) {
    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(['root'], 'readwrite');
      var rootStore = tx.objectStore('root');
      rootStore.get(dbName).onsuccess = function (event) {
        var record = event.target.result;
        record.location.useTowerInfo = useApi;
        rootStore.put(record);
      };

      tx.oncomplete = function () {

        resolve('useGeolocationApi is set to ' + useApi);
      };
      tx.onerror = function () {
        reject(JSON.stringify(tx.error));
      };
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
  var THRESHOLD = 0.5; //km
  if (distance >= THRESHOLD) return true;
  return false;
}

function isLocationLessThanThreshold(distance) {
  var THRESHOLD = 0.5; //km
  if (distance <= THRESHOLD) return true;
  return false;
}

function sendCurrentViewNameToAndroid(viewName) {
  if (native.getName() === 'Android') {
    try {
      Fetchview.startConversation(viewName);
    } catch (e) {
      requestCreator('instant', JSON.stringify({
        message: e.message
      }));
    }
  }
}

function inputFile(selector) {
  return document.getElementById(selector);
}

function getNonLocationmessageString(name) {
  if (name === 'gps') {
    return 'Please Enable GPS to use Growthfile';
  }
  return 'Please Allow Location services To Use Growthfile';
}

function isLocationVerified(reqType) {
  if (native.getName() === 'Android') {
    var title = 'Message';
    var messageData = {
      title: title,
      message: '',
      cancelable: true,
      button: {
        text: 'Okay',
        show: true,
        clickAction: {
          redirection: {
            text: '',
            value: false
          }
        }
      }
    };

    if (!Internet.isConnectionActive()) {
      messageData.message = 'Please Check Your Internet Connection';
      Android.notification(JSON.stringify(messageData));
      return false;
    }

    var locationStatus = JSON.parse(gps.isEnabled());

    if (!locationStatus.active) {
      messageData.message = getNonLocationmessageString(locationStatus.name);
      Android.notification(JSON.stringify(messageData));
      return false;
    }
    return true;
  }
  // webkit.messageHandlers.checkInternet.postMessage(reqType);
  return true;
}

function iosConnectivity(connectivity) {
  // for future implementation
  if (!connectivity.connected) {
    // resetLoaders()
  }
}

function resetLoaders(data) {
  if (native.getName() === 'Android') {

    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').style.display = 'block';
    }
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
  snacks(data.msg);
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

  if (requestType === 'instant' || requestType === 'now' || requestType === 'Null') {
    auth.getIdToken(false).then(function (token) {

      requestGenerator.body = requestBody;
      requestGenerator.user.token = token;
      apiHandler.postMessage(requestGenerator);
    });
  } else {

    getRootRecord().then(function (rootRecord) {

      var location = rootRecord.location;
      var isLocationOld = isLastLocationOlderThanThreshold(location.lastLocationTime, 1);

      requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
      if (isLocationOld) {
        handleWaitForLocation(requestBody, requestGenerator);
      } else {
        auth.getIdToken(false).then(function (token) {

          var geopoints = {
            'latitude': location.latitude,
            'longitude': location.longitude,
            'accuracy': location.accuracy
          };

          requestBody['geopoint'] = geopoints;
          requestGenerator.body = requestBody;
          requestGenerator.user.token = token;
          console.log(requestGenerator);
          sendRequest(location, requestGenerator);
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
        'accuracy': data.accuracy
      };
      requestBody['geopoint'] = geopoints;
      requestGenerator.body = requestBody;
      requestGenerator.user.token = token;
      sendRequest(geopoints, requestGenerator);
    });
    window.removeEventListener('location', _listener, true);
  }, true);
}

function sendRequest(location, requestGenerator) {

  if (location.latitude && location.longitude && location.accuracy) {

    apiHandler.postMessage(requestGenerator);
  } else {
    appDialog('Fetching Location Please wait. If Problem persists, Then Please restart the application.');
  }
}

function isLastLocationOlderThanThreshold(test, threshold) {
  var currentTime = moment(moment().valueOf());
  var lastLocationTime = test;
  var duration = moment.duration(currentTime.diff(lastLocationTime));
  var difference = duration.asSeconds();
  console.log(difference);
  if (difference > threshold) {
    return true;
  }
  return false;
}

var receiverCaller = {
  'update-app': updateApp,
  'revoke-session': revokeSession,
  'notification': successDialog,
  'manageLocation': manageLocation,
  'error': resetLoaders,
  'android-stop-refreshing': androidStopRefreshing,
  'loadView': loadView,
  'redirect-to-list': changeState
};

function messageReceiver(response) {
  receiverCaller[response.data.type](response.data);
}

function updateApp(data) {
  if (native.getName() === 'Android') {
    console.log("update App");
    Android.notification(data.msg);
    return;
  }
  // webkit.messageHandlers.updateApp.postMessage();
}

function revokeSession() {
  firebase.auth().signOut().then(function () {
    removeIDBInstance(firebase.auth().currentUser).then(function () {
      console.log("session revoked");
    }).catch(function (error) {
      var removalError = error;
      removalError.message = '';
      requestCreator('instant', JSON.stringify(removalError));
    });
  }, function (error) {
    requestCreator('instant', JSON.stringify(error));
  });
}

function changeState(data) {
  history.pushState(['listView'], null, null);
}

function loadView(data) {

  androidStopRefreshing();

  if (!history.state) {
    localStorage.setItem('today', null);
    openListWithChecks();
    return;
  }

  if (history.state[0] === 'updateCreateActivity') {
    toggleActionables(history.state[1].activityId);
    return;
  }

  if (history.state[0] === 'profileView') return;

  if (history.state[0] === 'listView') {
    listView({
      urgent: false,
      nearBy: false
    });

    return;
  }

  window[history.state[0]](history.state[1], false);
}

function androidStopRefreshing() {
  if (native.getName() === 'Android') {
    try {
      AndroidRefreshing.stopRefreshing(true);
    } catch (e) {

      var instantBody = {
        message: e.message,
        device: native.getInfo()
      };
      requestCreator('instant', JSON.stringify(instantBody));
    }
  }
}

function onErrorMessage(error) {

  var logs = {
    message: error.message,
    body: {
      'line-number': error.lineno,
      'file': error.filename
    }
  };

  requestCreator('instant', JSON.stringify(logs));

  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  });
}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector));
}

function runRead(value) {

  if (localStorage.getItem('dbexist')) {
    requestCreator('Null', value);
  }
}