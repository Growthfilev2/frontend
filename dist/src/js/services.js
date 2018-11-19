var offset = '';
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
}

function enableGps(messageString) {
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
    ok.id = '';
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
    actionHandler: function actionHandler() {

      if (type) {
        requestCreator('statusChange', {
          activityId: type.id,
          status: 'PENDING'
        });
      }
    }
  };

  var snackbar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

  snackbar.show(data);
}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}

function geolocationApi(method, url, data) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var result = JSON.parse(xhr.responseText);
          resolve({
            'latitude': result.location.lat,
            'longitude': result.location.lng,
            'accuracy': result.accuracy,
            'provider': 'Cellular',
            'lastLocationTime': Date.now()
          });
        } else {
          reject(xhr.statusText);
        }
      }
    };
    if (!data) {
      resolve(undefined);
    } else {
      console.log(data);
      xhr.send(data);
    }
  }).catch(function (error) {
    return error;
  });
}

function manageLocation() {

  var apiKey = 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo';
  var CelllarJson = void 0;
  var geoFetchPromise = void 0;
  var navigatorFetchPromise = void 0;

  if (native.getName() === 'Android') {
    try {
      CelllarJson = Towers.getCellularData();
    } catch (e) {
      requestCreator('instant', JSON.stringify({
        message: e.message
      }));
    }
  } else {
    CelllarJson = false;
  }

  var removeFalseData = [];

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var rootStore = db.transaction('root', 'readwrite').objectStore('root');

    rootStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
      return new Promise(function (resolve) {

        var record = event.target.result;
        // if(moment(record.lastLocationTime - Date.now()).format('m') < 30) return
        if (CelllarJson) {

          geoFetchPromise = geolocationApi('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + apiKey, CelllarJson);
        } else {
          geoFetchPromise = {
            'latitude': '',
            'longitude': '',
            'accuracy': 999999
          };
        }

        navigatorFetchPromise = locationInterval();
        Promise.all([geoFetchPromise, navigatorFetchPromise]).then(function (geoData) {

          geoData.forEach(function (data) {
            if (!data) {
              var index = geoData.indexOf(data);
              geoData.splice(0, index);
            } else if (data.accuracy == -1 || data.accuracy == 999999) {
              var _index = geoData.indexOf(data);
              geoData.splice(0, _index);
            } else {
              removeFalseData.push(data);
            }
          });
          console.log(removeFalseData);
          var mostAccurate = sortedByAccuracy(removeFalseData);

          updateLocationInRoot(mostAccurate);
        }).catch(function (error) {
          requestCreator('instant', JSON.stringify({
            message: error
          }));
        });
      });
    };
  };
}

function locationInterval() {

  var stabalzied = [];
  var count = 0;
  var geo = {
    'latitude': '',
    'longitude': '',
    'accuracy': '',
    'lastLocationTime': '',
    'provider': ''
  };

  return new Promise(function (resolve, reject) {

    if (native.getName() === 'Android') {
      if (androidLocation.isMock()) {
        geo.accuracy = -1;
        geo.provider = 'Mock';
        resolve(geo);
        return;
      }
    }

    var myInterval = setInterval(function () {

      navigator.geolocation.getCurrentPosition(function (position) {
        if (!position) {
          geo.accuracy = -1;
          geo.provider = 'HTML5';
          resolve(geo);
          return;
        }
        if (stabalzied.length == 0) {
          stabalzied.push({
            'latitude': position.coords.latitude,
            'longitude': position.coords.longitude,
            'accuracy': position.coords.accuracy,
            'lastLocationTime': Date.now()
          });
        } else {
          if (stabalzied[0].latitude.toFixed(3) === position.coords.latitude.toFixed(3) && stabalzied[0].longitude.toFixed(3) === position.coords.longitude.toFixed(3)) {
            ++count;
            if (count < 3) {
              stabalzied.push({
                'latitude': position.coords.latitude,
                'longitude': position.coords.longitude,
                'accuracy': position.coords.accuracy,
                'lastLocationTime': Date.now()
              });
            }
            if (count == 3) {
              if (stabalzied[2].accuracy < 350) {

                geo.latitude = stabalzied[2].latitude, geo.longitude = stabalzied[2].longitude, geo.accuracy = stabalzied[2].accuracy, geo.provider = 'HTML5', geo.lastLocationTime = stabalzied[2].lastLocationTime;
                clearInterval(myInterval);
                resolve(geo);
                return;
              }
            } else {
              var mostAccurate = sortedByAccuracy(stabalzied);
              geo.latitude = mostAccurate.latitude, geo.longitude = mostAccurate.longitude, geo.accuracy = mostAccurate.accuracy;
              geo.provider = 'HTML5';
              geo.lastLocationTime = mostAccurate.lastLocationTime;
              clearInterval(myInterval);
              resolve(geo);
              return;
            }
          }
        }
      }, function (error) {
        reject(error);
      });
    }, 500);
  }).catch(function (error) {
    return error;
  });
}

function sortedByAccuracy(geoData) {
  var result = geoData.sort(function (a, b) {
    return a.accuracy - b.accuracy;
  });
  return result[0];
}

function updateLocationInRoot(finalLocation) {
  console.log(finalLocation);

  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var rootStore = db.transaction('root', 'readwrite').objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;
      record.latitude = finalLocation.latitude;
      record.longitude = finalLocation.longitude;
      record.accuracy = finalLocation.accuracy;
      record.provider = finalLocation.provider;
      record.lastLocationTime = finalLocation.timestamp;
      rootStore.put(record);
    };
  };
}

function sendCurrentViewNameToAndroid(viewName) {
  if (localStorage.getItem('deviceType') === 'Android') {
    Fetchview.startConversation(viewName);
  }
}

function inputFile(selector) {
  return document.getElementById(selector);
}

function requestCreator(requestType, requestBody) {

  // A request generator body with type of request to perform and the body/data to send to the api handler.
  // spawn a new worker called apiHandler.

  console.log(apiHandler);
  var requestGenerator = {
    type: requestType,
    body: ''
  };

  if (requestType === 'instant' || requestType === 'now' || requestType === 'Null') {
    requestGenerator.body = requestBody;
    apiHandler.postMessage(requestGenerator);
  } else {

    if (offset) {
      clearTimeout(offset);
      offset = null;
    }

    var dbName = firebase.auth().currentUser.uid;
    var req = indexedDB.open(dbName);
    req.onsuccess = function () {
      var db = req.result;
      var rootTx = db.transaction('root', 'readwrite');
      var rootObjectStore = rootTx.objectStore('root');

      rootObjectStore.get(dbName).onsuccess = function (event) {
        var record = event.target.result;
        if (record.hasOwnProperty('latitude') && record.hasOwnProperty('longitude') && record.hasOwnProperty('accuracy')) {
          if (record.latitude && record.longitude && record.accuracy) {
            var geopoints = {
              'latitude': record.latitude,
              'longitude': record.longitude,
              'accuracy': record.accuracy
            };
            requestBody['timestamp'] = fetchCurrentTime(record.serverTime);
            requestBody['geopoint'] = geopoints;
            requestGenerator.body = requestBody;
            apiHandler.postMessage(requestGenerator);
          } else {
            enableGps('Fetching Location Please wait');
          }
        } else {
          enableGps('Fetching Location Please wait');
        }
      };
    };
  }

  // handle the response from apiHandler when operation is completed
  apiHandler.onmessage = loadViewFromRoot;
  apiHandler.onerror = onErrorMessage;
}

function loadViewFromRoot(response) {

  if (response.data.type === 'update-app') {

    if (native.getName() === 'Android') {
      Android.notification(response.data.msg);
      return;
    }
    webkit.messageHandlers.updateApp.postMessage();
    return;
  }

  if (response.data.type === 'revoke-session') {
    revokeSession();
    return;
  }

  if (response.data.type === 'notification') {
    successDialog();
    return;
  }

  if (response.data.type === 'manageLocation') {
    localStorage.setItem('dbexist', firebase.auth().currentUser.uid);
    manageLocation();
    return;
  }

  // only for development
  if (response.data.type === 'error') {
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

    snacks(response.data.msg);
    return;
  }

  if (response.data.type === 'create-success') {
    listView();
    return;
  }

  if (response.data.type === 'reset-offset') {
    if (offset) {
      console.log("removing offset");
      clearTimeout(offset);
      offset = null;
    }
    return;
  }

  var req = window.indexedDB.open(firebase.auth().currentUser.uid);

  req.onsuccess = function () {
    var db = req.result;

    if (response.data.type === 'updateAssigneesList') {
      console.log("only update assingee list");
      var activityObjectStore = db.transaction('activity').objectStore('activity');
      //here dbName is activityId

      activityObjectStore.get(response.data.params.id).onsuccess = function (event) {
        var record = event.target.result;
        // toggleActionables(record.editable)

        readNameAndImageFromNumber([response.data.params.number], db);
      };
      history.pushState(['listView'], null, null);
      return;
    }

    if (response.data.type === 'redirect-to-list') {
      history.pushState(['listView'], null, null);
      return;
    }

    // updateIDB

    if (response.data.type === 'updateIDB') {
      if (response.data.msg === 'true') {
        if (native.getName() === 'Android') {
          console.log("send signal to android to stop refreshing");
          AndroidRefreshing.stopRefreshing(true);
        } else {
          webkit.messageHandlers.setRefreshing.postMessage('false');
        }
      }

      if (!history.state) {
        window["listView"](true);
        return;
      }

      if (history.state[0] === 'updateCreateActivity') {
        toggleActionables(history.state[1].activityId);
        handleTimeout();
        return;
      }

      if (history.state[0] === 'profileView') return;

      window[history.state[0]](history.state[1], false);
      handleTimeout();
    }
  };
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

function checkGpsAvail() {
  if (native.getName() === 'Android') {
    if (!gps.isEnabled()) {
      var messageData = {
        title: 'Cannot determine Location',
        message: 'Please Turn On Gps, To Use Growthfile',
        cancelable: true,
        button: {
          text: 'Okay',
          show: true,
          clickAction: {
            redirection: {
              text: '',
              value: false
            },
            enableGps: {
              value: true
            }
          }
        }
      };
      Android.notification(JSON.stringify(messageData));
    }
  }
}

function handleTimeout() {

  offset = setTimeout(function () {
    checkGpsAvail();
    requestCreator('Null', 'false');
    manageLocation();
  }, 30000);
}

function getInputText(selector) {
  return mdc.textField.MDCTextField.attachTo(document.querySelector(selector));
}