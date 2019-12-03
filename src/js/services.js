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

function appLocation(maxRetry) {
  return new Promise(function (resolve, reject) {
    return resolve({
      accuracy: 657586,
      isLocationOld: true,
      lastLocationTime: 1575395053660,
      latitude: 28.482764799999998,
      longitude: 77.0678784,
      provider: "HTML5",
    })
    manageLocation(maxRetry).then(function (geopoint) {
      if (!ApplicationState.location) {
        ApplicationState.location = geopoint
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
        return resolve(geopoint);
      }

      if (history.state[0] !== 'profileCheck' && isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(ApplicationState.location, geopoint))) {
        return reject({
          message: 'THRESHOLD EXCEED',
          body: {
            geopoint: geopoint
          }
        })
      };

      ApplicationState.location = geopoint
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
      return resolve(geopoint)
    }).catch(reject)
  })
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
    if (!isLocationOld(storedLocation, location)) return resolve(location);
    if (maxRetry > 0) {
      setTimeout(function () {
        getLocation().then(function (newLocation) {
          console.log('retry because new location is same to old location')
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
  }).catch(function (error) {

    reject(error);
  })
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
      timeout: true,
      enableHighAccuracy: false
    })
  })
}

// let apiHandler = new Worker('js/apiHandler.js?version=56');

function requestCreator(requestType, requestBody, geopoint) {

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

  let apiHandler = new Worker('js/apiHandler.js?version=56');

  auth.getIdToken().then(function (token) {
    requestGenerator.meta.user.token = token
    if (!geopoint) {
      requestGenerator.body = requestBody;
      apiHandler.postMessage(requestGenerator);

    } else {
      getRootRecord().then(function (rootRecord) {
        const time = fetchCurrentTime(rootRecord.serverTime);
        requestBody['timestamp'] = time
        requestBody['geopoint'] = geopoint;
        requestGenerator.body = requestBody;
        if (requestBody.template === 'check-in') {
          ApplicationState.lastCheckInCreated = time
        }
        localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState))
        console.log('sending', requestGenerator);
        apiHandler.postMessage(requestGenerator);

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
  console.log(readResponse)
  if (readResponse.response.templates.length) {
    getCheckInSubs().then(function (checkInSubs) {
      ApplicationState.officeWithCheckInSubs = checkInSubs
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    })
  }
  if (!history.state) return;

  switch (history.state[0]) {


    case 'enterChat':
      if (!readResponse.response.addendum.length) return;
      dynamicAppendChats(readResponse.response.addendum)
      break;
    case 'chatView':
      if (!readResponse.response.addendum.length) return;
      readLatestChats(false);
      break;

    case 'reportView':

      reportView(history.state[1]);


      break;
    default:
      console.log("no refresh")
  }
}

/** function call to be removed from apk */
function backgroundTransition() {}

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
  const emailRegString = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegString.test(String(email).toLowerCase())
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




function getSuggestions() {
  if (ApplicationState.knownLocation) {
    getKnownLocationSubs().then(homeView);
    return;
  }
  return getSubsWithVenue().then(homeView);

}

function getKnownLocationSubs() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');
    const result = [];
    const venue = ApplicationState.venue
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.delete()
        cursor.continue();
        return;
      };

      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === venue.template) {
          result.push(cursor.value)
        }
      })
      cursor.continue();
    };

    tx.oncomplete = function () {
      resolve(result)
    }
  })
}

function getPendingLocationActivities() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction('activity');
    const result = []
    const index = tx.objectStore('activity').index('status')
    index.openCursor('PENDING').onsuccess = function (evt) {
      const cursor = evt.target.result;
      if (!cursor) return;
      if (cursor.value.office !== ApplicationState.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.hidden) {
        cursor.continue();
        return;
      }

      let match;

      if (!match) {
        cursor.continue();
        return;
      }
      let found = false
      match.schedule.forEach(function (sn) {
        if (!sn.startTime && !sn.endTime) return;
        if (moment(moment().format('DD-MM-YY')).isBetween(moment(sn.startTime).format('DD-MM-YY'), moment(sn.endTime).format('DD-MM-YY'), null, '[]')) {
          sn.isValid = true
          found = true
        }
      })

      if (found) {
        result.push(match);
      }
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(result)
    }
  })
}


function getSubsWithVenue() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');

    const result = []
    store.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return
      if (cursor.value.template === 'check-in') {
        cursor.continue();
        return;
      }
      if (cursor.value.status === 'CANCELLED') {
        cursor.delete()
        cursor.continue();
        return;
      }
      if (!cursor.value.venue.length) {
        cursor.continue();
        return;
      }
      console.log(cursor.value)
      result.push(cursor.value)

      cursor.continue();
    }
    tx.oncomplete = function () {
      resolve(result)
    }
  })
}

function handleNav(evt) {
  console.log(evt)
  if (history.state[0] === 'reportView') {
    history.pushState(['profileView'], null, null)
    profileView();
    return;
  }
  return history.back();
}


function homeHeaderStartContent(name) {
  return `<img class="mdc-top-app-bar__navigation-icon mdc-icon-button image" id='profile-header-icon' onerror="imgErr(this)" src=${firebase.auth().currentUser.photoURL || './img/src/empty-user.jpg'}>
  <span class="mdc-top-app-bar__title">${name}</span>`;

}

function initHeaderView() {

  let clearIcon = ''
  if (ApplicationState.nearByLocations.length > 1) {
    clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='change-location'>clear</button>`
  }
  const header = getHeader('app-header', homeHeaderStartContent(ApplicationState.venue.location || ''), clearIcon);
  header.listen('MDCTopAppBar:nav', handleNav);
  header.root_.classList.remove('hidden');

  if (!ApplicationState.venue) {
    generateCheckInVenueName(header);
  }
  if (document.getElementById('change-location')) {
    document.getElementById('change-location').addEventListener('click', function () {
      progressBar.open();
      manageLocation(3).then(mapView).catch(handleLocationError);
    })
  }
  return header;
}



function generateCheckInVenueName(header) {
  const lastCheckInCreatedTimestamp = ApplicationState.lastCheckInCreated;
  if (!lastCheckInCreatedTimestamp) return;
  if (!header) return;
  const myNumber = firebase.auth().currentUser.phoneNumber;
  const tx = db.transaction('addendum');
  const addendumStore = tx.objectStore('addendum')
  let addendums = [];

  if (addendumStore.indexNames.contains('KeyTimestamp')) {
    const key = myNumber + myNumber
    const range = IDBKeyRange.only([lastCheckInCreatedTimestamp, key])
    addendumStore.index('KeyTimestamp').getAll(range).onsuccess = function (event) {
      if (!event.target.result.length) return;
      addendums = event.target.result;
    };
  } else {

    addendumStore.index('user').openCursor(myNumber).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.timestamp !== lastCheckInCreatedTimestamp) {
        cursor.continue();
        return;
      }
      addendums.push(cursor.value)
      cursor.continue();
    }
  }

  tx.oncomplete = function () {
    console.log(addendums);
    if (!addendums.length) return;
    addendums.forEach(function (addendum) {
      const activityStore = db.transaction('activity').objectStore('activity');
      activityStore.get(addendum.activityId).onsuccess = function (activityEvent) {
        const activity = activityEvent.target.result;
        if (!activity) return;
        if (activity.template !== 'check-in') return;
        const commentArray = addendum.comment.split(" ");
        const index = commentArray.indexOf("from");
        const nameOfLocation = commentArray.slice(index + 1, commentArray.length).join(" ");
        console.log(header)
        console.log(nameOfLocation)
        if (header.root_.querySelector('.mdc-top-app-bar__title')) {
          header.root_.querySelector('.mdc-top-app-bar__title').textContent = nameOfLocation;
        }
      }
    })
  }
}



function createUpdatesuggestion(result) {
  const el = document.getElementById("duty-container");
  if (!result.length) return;
  if (!el) return;
  el.innerHTML = `<ul class='mdc-list subscription-list'>
    ${result.map(function(activity) {
        return `<li class='mdc-list-item'>
        <span class='mdc-list-item__text'>${activity.activityName}</span>
      
        <span class="mdc-list-item__meta material-icons mdc-theme--primary">
          keyboard_arrow_right
      </span>
        </li>`
    }).join("")}
    <li class='mdc-list-divider'></li>
  </ul>`

  const dutyList = new mdc.list.MDCList(el.querySelector('ul'))
  dutyList.singleSelection = true;
  dutyList.selectedIndex = 0;
  dutyList.listen('MDCList:action', function (event) {

    const activity = result[event.detail.index]
    const heading = createActivityHeading(activity)
    const statusButtonFrag = createElement('div')
    statusButtonFrag.style.float = 'right';

    const dialog = new Dialog(heading, activityDomCustomer(activity), 'view-form').create()
    dialog.open();
    dialog.autoStackButtons = false;
    dialog.buttons_[1].classList.add('hidden')
    if (!activity.canEdit) return;

    getStatusArray(activity).forEach(function (buttonDetails) {

      const button = createElement("button", {
        className: 'mdc-button material-icons'
      })

      button.style.color = buttonDetails.color
      const span = createElement("span", {
        className: 'mdc-button__label',
        textContent: buttonDetails.name
      })
      const icon = createElement('i', {
        className: 'material-icons mdc-button__icon',
        textContent: buttonDetails.icon
      })
      button.appendChild(icon)
      button.appendChild(span)

      button.addEventListener('click', function () {
        setActivityStatus(activity, buttonDetails.status)
        dialog.close()
      })
      statusButtonFrag.appendChild(button)
    })


    dialog.listen('MDCDialog:opened', function () {
      dialog.root_.querySelector('#status-change-container').appendChild(statusButtonFrag);
    })
  })
}

function getYesterdayArDate() {
  const date = new Date();
  console.log(date.setDate(date.getDate() - 1))
  return date.setDate(date.getDate() - 1);
}


function createArSuggestion(attendances) {
  const el = document.getElementById('ar-container');

  const ul = createElement('ul', {
    className: 'mdc-list subscription-list mdc-list--two-line'
  })
  attendances.forEach(function (record) {

    const li = createElement('li', {
      className: 'mdc-list-item'
    })
    const icon = createElement('span', {
      className: 'mdc-list-item__meta material-icons mdc-theme--primary',
      textContent: 'keyboard_arrow_right'
    })
    const textCont = createElement('span', {
      className: 'mdc-list-item__text'
    })
    const primaryText = createElement('span', {
      className: 'mdc-list-item__primary-text'
    })
    const secondartText = createElement('span', {
      className: 'mdc-list-item__secondary-text mdc-theme--error',
      textContent: 'Attendance Yesterday : ' + record.attendance
    })
    secondartText.style.marginTop = '5px';
    secondartText.style.fontSize = '1rem';

    if (record.attendance == 0) {
      primaryText.textContent = `Apply AR/Leave : ${record.office}`
    }
    if (record.attendance > 0 && record.attendance < 1) {
      primaryText.textContent = `Apply AR : ${record.office}`
    }
    textCont.appendChild(primaryText)
    textCont.appendChild(secondartText);
    li.appendChild(textCont);

    li.addEventListener('click', function () {
      history.pushState(['reportView'], null, null)
      reportView(record);
    })
    li.appendChild(icon)
    ul.appendChild(li)
  })
  if (!el) return;
  el.appendChild(ul)
  const list = new mdc.list.MDCList(ul);
  list.selectedIndex = 0;
  list.singleSelection = true;
}


function getYesterdayAtt() {
  return new Promise(function (resolve, reject) {
    var date = new Date()
    const tx = db.transaction('attendance');
    const index = tx.objectStore('attendance').index('key');
    let records = [];
    index.openCursor(IDBKeyRange.lowerBound(getYesterdayArDate())).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!cursor.value.hasOwnProperty('attendance')) {
        cursor.continue();
        return;
      }

      if (cursor.value.attendance == 1) {
        cursor.continue();
        return;
      }

      if (cursor.value.date === (date.getDate() - 1) && cursor.value.month == date.getMonth() && cursor.value.year == date.getFullYear()) {
        records.push(cursor.value)
      }
      cursor.continue();
    }
    tx.oncomplete = function () {
      return resolve(records)
    }
    tx.onerror = function () {
      return reject(tx.error)
    }
  })
}

function checkForUpdates() {

  return new Promise(function (resolve, reject) {
    const currentTimestamp = moment().valueOf()
    const maxTimestamp = moment().add(24, 'h').valueOf();
    console.log(maxTimestamp);
    const calendarTx = db.transaction('calendar');
    const results = []
    const range = IDBKeyRange.lowerBound(currentTimestamp);

    calendarTx.objectStore('calendar').index('end').openCursor(range).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      };
      if (cursor.value.hidden == 1) {
        cursor.continue();
        return;
      }
      if (!cursor.value.start || !cursor.value.end) {
        cursor.continue();
        return;
      };

      if (cursor.value.start <= maxTimestamp) {
        results.push(cursor.value)
      };
      cursor.continue();
    };

    calendarTx.oncomplete = function () {
      console.log(results);

      const activityTx = db.transaction('activity');

      const activityRecords = [];
      results.forEach(function (result) {
        activityTx.objectStore('activity').get(result.activityId).onsuccess = function (event) {
          const record = event.target.result;
          if (!record.attachment.Location) return;
          if (!record.attachment.Location.value) return;
          console.log(record);
          activityRecords.push(record);
        }
      });
      activityTx.oncomplete = function () {
        console.log(activityRecords)
        const mapTx = db.transaction('map')
        const updateRecords = []
        activityRecords.forEach(function (record) {
          mapTx.objectStore('map').index('location').get(record.attachment.Location.value).onsuccess = function (event) {
            const mapRecord = event.target.result;
            if (!mapRecord) return;
            if (!mapRecord.latitude || !mapRecord.longitude) return;
            if (calculateDistanceBetweenTwoPoints({
                latitude: mapRecord.latitude,
                longitude: mapRecord.longitude
              }, ApplicationState.location) > 1) return;
            updateRecords.push(record);
          }
        })
        mapTx.oncomplete = function () {
          return resolve(updateRecords);
        }
      }
    }

    calendarTx.onerror = function () {
      return reject({
        message: tx.error,
        body: ''
      })
    }
  })
}



function handleTemplateListClick(listInit) {
  listInit.singleSelection = true;
  listInit.selectedIndex = 0;
  listInit.listen('MDCList:action', function (evt) {
    const el = listInit.listElements[evt.detail.index]
    const officeOfSelectedList = JSON.parse(el.dataset.office)
    const valueSelectedList = JSON.parse(el.dataset.value)
    if (officeOfSelectedList.length == 1) {
      history.pushState(['addView'], null, null);
      addView(valueSelectedList[0])
      return
    }


    const dialog = new Dialog('Choose Office', officeSelectionList(valueSelectedList), 'choose-office-subscription').create('simple');
    const ul = new mdc.list.MDCList(document.getElementById('dialog-office'))
    bottomDialog(dialog, ul)

    ul.listen('MDCList:action', function (event) {
      history.pushState(['addView'], null, null);
      addView(valueSelectedList[event.detail.index])
      dialog.close()
    })
  });
}

function officeSelectionList(subs) {

  const officeList = `<ul class='mdc-list subscription-list' id='dialog-office'>
    ${subs.map(function(sub){
      return `<li class='mdc-list-item'>
      ${sub.office}
      <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
        keyboard_arrow_right
      </span>
      </li>`
    }).join("")}
    </ul>`

  return officeList;

}

function bottomDialog(dialog, ul) {

  ul.singleSelection = true
  ul.selectedIndex = 0;

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


function pendinglist(activities) {
  return `
  <ul class="mdc-list subscription-list" role="group" aria-label="List with checkbox items" id='confirm-tasks'>
    ${activities.map(function(activity,idx){
      return `
      <li class="mdc-list-item" role="checkbox" aria-checked="false">
      Confirm ${activity.activityName} ?    
      <div class='mdc-checkbox mdc-list-item__meta'>
        <input type="checkbox"
                class="mdc-checkbox__native-control"
                id="demo-list-checkbox-item-${idx}" />
        <div class="mdc-checkbox__background">
          <svg class="mdc-checkbox__checkmark"
                viewBox="0 0 24 24">
            <path class="mdc-checkbox__checkmark-path"
                  fill="none"
                  d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
          </svg>
          <div class="mdc-checkbox__mixedmark"></div>
        </div>
      </div>   
    </li>`
    }).join()}
  </ul>
  `
}

function templateList(suggestedTemplates) {
  const ul = createElement('ul', {
    className: 'mdc-list subscription-list',
    id: 'suggested-list'
  })
  suggestedTemplates.forEach(function (sub) {
    const el = ul.querySelector(`[data-template="${sub.template}"]`)
    if (el) {
      var currentOffice = JSON.parse(el.dataset.office)
      currentOffice.push(sub.office);
      var currentValue = JSON.parse(el.dataset.value);
      currentValue.push(sub);

      el.dataset.office = JSON.stringify(currentOffice)
      el.dataset.value = JSON.stringify(currentValue)
    } else {
      const li = createElement('li', {
        className: 'mdc-list-item'
      })
      li.dataset.template = sub.template;
      li.dataset.office = JSON.stringify([sub.office]);
      li.dataset.value = JSON.stringify([sub])
      li.innerHTML = `${formatTextToTitleCase(`Create New ${sub.template}`)}
      <span class='mdc-list-item__meta material-icons mdc-theme--primary'>
        keyboard_arrow_right
      </span>`
      ul.appendChild(li)
    }
  });

  return ul.outerHTML;
}

function updateName(callback) {

  const auth = firebase.auth().currentUser;
  let backIcon = ''
  if (!callback) {
    backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Update Name</span>
    `
  } else {
    backIcon = `<span class="mdc-top-app-bar__title">Add Name</span>`
  }
  const header = getHeader('app-header', backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `
  
  <div class='mdc-layout-grid change-name'>
  <p class='mdc-typography--body1 mdc-theme--primary'>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ornare dictum lacus eget eleifend. Donec in tempor neque. Ut purus dui, maximus sed convallis ac, facilisis ac sem.
  
  </p>
<div class="mdc-text-field mdc-text-field--outlined mt-10" id='name'>
  <input class="mdc-text-field__input" required value='${firebase.auth().currentUser.displayName || ''}' type='text' >
 <div class="mdc-notched-outline">
     <div class="mdc-notched-outline__leading"></div>
     <div class="mdc-notched-outline__notch">
           <label for='email' class="mdc-floating-label mdc-floating-label--float-above ">Name</label>
     </div>
     <div class="mdc-notched-outline__trailing"></div>
 </div>
</div>
<div class="mdc-text-field-helper-line">
  <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	">
  </div>
</div>

<div  class='mb-10 mt-10'>
  <button class='mdc-button mdc-theme--primary-bg' id='name-btn'>
  <span class='mdc-button__label mdc-theme--on-primary'>Update<span>
</button>
</div>
  </div>`
  const nameField = new mdc.textField.MDCTextField(document.getElementById('name'))
  nameField.focus();
  document.getElementById('name-btn').addEventListener('click', function () {
    if (!nameField.value) {
      nameField.focus();
      nameField.foundation_.setValid(false);
      nameField.foundation_.adapter_.shakeLabel(true);
      nameField.helperTextContent = 'Name Cannot Be Left Blank';
      return;
    }
    progressBar.open();
    auth.updateProfile({
      displayName: nameField.value.trim()
    }).then(function () {
      progressBar.close();
      snacks('Name Updated Successfully')
      if (callback) {
        history.pushState([`${callback.name}`], null, null);
        callback()
      } else {
        history.back();
      }
    })
  })
}

function getEmailViewHeading(auth) {
  const text = {
    topBarText: '',
    heading: '',
    btnText: 'Update'
  }

  if (!auth.email) {
    text.topBarText = 'Add Email';
    text.heading = 'Please Add You Email Address To Continue'
    return text;
  }
  if (!auth.emailVerified) {

    text.topBarText = 'Verify Email'
    text.heading = 'Please Verify Your Email Address To Continue'
    text.btnText = 'Verify'
    return text;
  }
  text.topBarText = 'Update Email'
  text.btnText = 'Update'
  return text;
}

function emailUpdation(callback, updateOnly) {
  const auth = firebase.auth().currentUser;
  const headings = getEmailViewHeading(auth)
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">${headings.topBarText}</span>
  `
  const header = getHeader('app-header', backIcon, '');
  header.root_.classList.remove('hidden');

  getEmployeeDetails(IDBKeyRange.bound(['recipient', 'CONFIRMED'], ['recipient', 'PENDING']), 'templateStatus').then(function (result) {

    document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid update-email'>
        
    ${updateEmailDom(auth.email, getReportOffices(result), headings)}
    </div>`
    const emailField = new mdc.textField.MDCTextField(document.getElementById('email'))
    emailField.focus();
    document.getElementById('email-btn').addEventListener('click', function () {
      console.log(emailField)


      if (!emailReg(emailField.value)) {
        setHelperInvalid(emailField)
        emailField.helperTextContent = 'Enter A Valid Email Id';
        return;
      };


      progressBar.open();

      if (auth.email) {
        if (emailField.value !== auth.email) {
          emailUpdate(emailField.value, callback)
          return;
        }
        if (!auth.emailVerified) {
          emailVerification(callback);
          return
        }
        progressBar.close()
        setHelperInvalid(emailField)
        emailField.helperTextContent = 'New Email Cannot Be Same As Previous Email';
        return
      }

      emailUpdate(emailField.value, callback)
      return
    });

    const skipbtn = new mdc.ripple.MDCRipple(document.getElementById('skip-btn'))
    skipbtn.root_.classList.remove('hidden')
    skipbtn.root_.addEventListener('click', function () {
      if (!updateOnly) {
        const rootTx =  db.transaction('root','readwrite');
        const rootStore = rootTx.objectStore('root');

        rootStore.get(auth.uid).onsuccess = function(event){
          const record = event.target.result;
          record.skipEmail = true
          rootStore.put(record);
        }
        rootTx.oncomplete =  function() {
          history.pushState([`${callback}`], null, null);
          callback();
        }
        return
      }
      history.pushState([`${callback}`], null, null);
      callback();
    })

  })
}

function emailUpdate(email, callback) {
  firebase.auth().currentUser.updateEmail(email).then(function () {
    emailVerification(callback)
  }).catch(handleEmailError)
}

function emailVerification(callback) {

  firebase.auth().currentUser.sendEmailVerification().then(function () {
    snacks('Email Verification Has Been Sent.')
    progressBar.close();
    history.pushState(['emailVerificationWait'], null, null)
    emailVerificationWait(callback)
  }).catch(handleEmailError)
}

function emailVerificationWait(callback) {
  const auth = firebase.auth().currentUser
  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid'>
  <h3 class='mdc-typography--headline6'>Verification Link Has Been Sent To ${firebase.auth().currentUser.email}</h3>
  <p class='mdc-typography--body1'>Click Continue To Proceed Further</p>
  <button class='mdc-button mdc-theme--primary-bg mt-10' id='continue'>
  <span class='mdc-button__label mdc-theme--on-primary'>CONTINUE</span>
  </button>
</div>`
  document.getElementById('continue').addEventListener('click', function (evt) {
    progressBar.open()
    firebase.auth().currentUser.reload();
    setTimeout(function () {
      firebase.auth().currentUser.reload();
      if (!auth.emailVerified) {
        snacks('Email Not Verified. Try Again');
        progressBar.close()
        return;
      }
      progressBar.close();

      history.pushState([`${callback}`], null, null)
      callback();
    }, 2000)
  })
}

function handleEmailError(error) {
  progressBar.close()
  if (error.code === 'auth/requires-recent-login') {
    const dialog = showReLoginDialog('Email Authentication', 'Please Login Again To Complete The Operation');
    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      revokeSession();
    })
    return;
  }
  snacks(error.message);

}

function getReportOffices(result) {

  const offices = []
  result.forEach(function (report, idx) {

    if (offices.indexOf(report.office) > -1) return
    offices.push(report.office);
  })
  if (offices.length) {
    return `
    Email is required to add bank account.
    You Are A Recipient In Reports for ${offices.join(', ').replace(/,(?!.*,)/gmi, ' &')}`
  }
  return 'Email is required to add bank account.'
}


function updateEmailDom(email, reportString, headings) {

  return `

<h3 class='mdc-typography--headline6'>${headings.heading}</h3>
<p class='report-rec mt-10 mdc-typography--body1'>
${reportString}
</p>

<div class="mdc-text-field mdc-text-field--outlined mt-10" id='email'>
  <input class="mdc-text-field__input" required value='${email || ''}' type='email'>
 <div class="mdc-notched-outline">
     <div class="mdc-notched-outline__leading"></div>
     <div class="mdc-notched-outline__notch">
           <label for='email' class="mdc-floating-label ${email ? `mdc-floating-label--float-above` :''}">Email</label>
     </div>
     <div class="mdc-notched-outline__trailing"></div>
 </div>
</div>
<div class="mdc-text-field-helper-line">
  <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	">
  </div>
</div>

<div  class='mb-10 mt-10'>
<button class='mdc-button mdc-theme--primary-bg' id='email-btn'>
<span class='mdc-button__label mdc-theme--on-primary'>${headings.btnText}<span>
</button>

<button class='mdc-button mt-10' id='skip-btn'>
  <span class='mdc-button__label'>SKIP<span>
</button>

</div>
`
}