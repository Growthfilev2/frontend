var deviceInfo;
var currentDevice;
var meta;
var requestFunctionCaller = {
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  backblaze: backblaze,
  updateAuth: updateAuth,
  comment: comment,
  changePhoneNumber: changePhoneNumber,
  newBankAccount: newBankAccount,
  removeBankAccount: removeBankAccount,
  idProof: idProof,
  device: device,
  acquisition: acquisition,
  fcmToken: fcmToken,
  pan: pan,
  aadhar: aadhar,
  profile: profile,
  shareLink: shareLink
};
/**
 * send message back to main thread
 * @param {object} response 
 * @param {string} id 
 */

var sendSuccessRequestToMainThread = function sendSuccessRequestToMainThread(response, id) {
  self.postMessage({
    response: response,
    success: true,
    id: id
  });
};
/**
 * sends error body to main thread to show api rejection messages
 * or to handle in view. if it's not an api rejection but js execution error in this file itself
 * then log the error and pass to main thread.
 * @param {object} error 
 */


var sendErrorRequestToMainThread = function sendErrorRequestToMainThread(error) {
  var errorObject = {
    message: error.message,
    body: error,
    apiRejection: false,
    success: false,
    id: error.id,
    requestType: error.requestType,
    stack: error.stack || ''
  };

  if (error.code) {
    errorObject.apiRejection = true;
  } else {
    instant(JSON.stringify(errorObject), meta);
  }

  self.postMessage(errorObject);
};

self.onmessage = function (event) {
  console.log(event);
  meta = event.data.meta;
  var workerId = event.data.id;

  if (event.data.type === 'geolocationApi') {
    geolocationApi(event.data.body, event.data.meta, 3).then(function (response) {
      sendSuccessRequestToMainThread(response, workerId);
    }).catch(function (error) {
      error.id = workerId;
      self.postMessage(error);
    });
    return;
  }

  var req = indexedDB.open(event.data.meta.user.uid);

  req.onsuccess = function () {
    var db = req.result;
    if (event.data.type === 'now') return handleNow(event.data, db);
    if (event.data.type === 'instant') return instant(event.data.body, event.data.meta);
    requestFunctionCaller[event.data.type](event.data.body, event.data.meta).then(function (response) {
      sendSuccessRequestToMainThread(response, workerId);
    }).catch(function (error) {
      error.id = workerId;
      error.requestType = event.data.type;
      sendErrorRequestToMainThread(error);
    });
  };
};

function handleNow(eventData, db) {
  fetchServerTime(eventData.meta, db).then(function (response) {
    var rootTx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootTx.objectStore('root');

    rootObjectStore.get(eventData.meta.user.uid).onsuccess = function (event) {
      rootRecord = event.target.result;
      rootRecord.serverTime = response.timestamp - Date.now();
      rootRecord.linkedAccount = response.linkedAccounts || null;
      var idProof = response.idProof || {};
      rootRecord.pan = idProof.pan;
      rootRecord.aadhar = idProof.aadhar;
      rootObjectStore.put(rootRecord);
    };

    rootTx.oncomplete = function () {
      if (!response.removeFromOffice) return self.postMessage({
        response: response,
        success: true,
        id: eventData.id
      });

      if (Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
        removeFromOffice(response.removeFromOffice, eventData.meta, db).then(function (response) {
          sendSuccessRequestToMainThread(response, workerId);
        }).catch(function (error) {
          error.id = eventData.id;
          error.requestType = eventData.type;
          sendErrorRequestToMainThread(error);
        });
      }

      ;
    };
  }).catch(function (error) {
    error.id = eventData.id;
    error.requestType = eventData.type;
    sendErrorRequestToMainThread(error);
  });
} // Performs XMLHTTPRequest for the API's.


function http(request) {
  var authorization = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url, true);

    if (authorization) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Authorization', "Bearer ".concat(request.token));
    } // xhr.timeout = 30000;
    // xhr.ontimeout = function () {
    //   return reject({
    //     code: 'request-timed-out',
    //     message: 'Request time out. Try again later',
    //   });
    // }


    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (!xhr.status || xhr.status > 226) {
          if (!xhr.response) return;
          var errorObject = JSON.parse(xhr.response);
          var apiFailBody = {
            message: errorObject.message,
            code: errorObject.code
          };
          return reject(apiFailBody);
        }

        xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success');
      }
    };

    xhr.send(request.body || null);
  });
}

function fetchServerTime(meta, db) {
  return new Promise(function (resolve, reject) {
    var url = "".concat(meta.apiUrl, "now");
    var tx = db.transaction(['root'], 'readwrite');
    var rootStore = tx.objectStore('root');

    rootStore.get(meta.user.uid).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) return;

      if (record.officesRemoved) {
        record.officesRemoved.forEach(function (office) {
          url = url + "&removeFromOffice=".concat(office.replace(' ', '%20'));
        });
        delete record.officesRemoved;
      }

      rootStore.put(record);
    };

    tx.oncomplete = function () {
      var httpReq = {
        method: 'GET',
        url: url,
        body: null,
        token: meta.user.token
      };
      http(httpReq).then(resolve).catch(reject);
    };
  });
}

function instant(error, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/logs"),
    body: error,
    token: meta.user.token
  };
  http(req).then(console.log).catch(console.log);
}

function comment(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "activities/comment"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function changePhoneNumber(body, meta) {
  console.log('change number');
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "changePhoneNumber"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function removeBankAccount(body, meta) {
  var req = {
    method: 'DELETE',
    url: "".concat(meta.apiUrl, "services/accounts"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function newBankAccount(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/linkedAccount"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function searchOffice(body, meta) {
  var req = {
    method: 'GET',
    url: "".concat(meta.apiUrl, "services/search?q=").concat(body.query),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function checkIns(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/checkIns"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function idProof(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/idProof"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function device(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/device"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function acquisition(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/acquisition"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function fcmToken(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/fcmToken"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function pan(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/pan"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function aadhar(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/aadhar"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function profile(body, meta) {
  var req = {
    method: 'GET',
    url: "".concat(meta.apiUrl, "profile/"),
    body: null,
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function shareLink(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/shareLink"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function createSubscription(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/subscription"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function dm(body, meta) {
  console.log(body);
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "dm"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function statusChange(body, meta) {
  var req = {
    method: 'PATCH',
    url: "".concat(meta.apiUrl, "activities/change-status"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function share(body, meta) {
  var req = {
    method: 'PATCH',
    url: "".concat(meta.apiUrl, "activities/share"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function update(body, meta) {
  var req = {
    method: 'PATCH',
    url: "".concat(meta.apiUrl, "activities/update"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function create(requestBody, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "activities/create"),
    body: JSON.stringify(requestBody),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function acquisition(body, meta) {
  var req = {
    method: 'PUT',
    url: "".concat(meta.apiUrl, "profile/acquisition"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  };
  return http(req);
}

function geolocationApi(body, meta, retry) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + meta.mapKey, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 400) {
          if (retry > 0) {
            setTimeout(function () {
              retry = retry - 1;
              geolocationApi(body, meta, retry).then(resolve).catch(reject);
            }, 1000);
          } else {
            return reject({
              message: JSON.parse(xhr.response).error.message,
              body: {
                geolocationResponse: JSON.parse(xhr.response),
                geolocationBody: body
              }
            });
          }

          return;
        }

        var response = JSON.parse(xhr.response);

        if (!response) {
          if (retry > 0) {
            setTimeout(function () {
              retry = retry - 1;
              geolocationApi(body, meta, retry).then(resolve).catch(reject);
            }, 1000);
          } else {
            return reject({
              message: 'Response From geolocation Api ' + response,
              body: body
            });
          }

          return;
        }

        return resolve({
          latitude: response.location.lat,
          longitude: response.location.lng,
          accuracy: response.accuracy,
          provider: body,
          lastLocationTime: Date.now()
        });
      }
    };

    xhr.onerror = function () {
      if (retry > 0) {
        setTimeout(function () {
          retry = retry - 1;
          geolocationApi(body, meta, retry).then(resolve).catch(reject);
        }, 1000);
      } else {
        return reject({
          message: xhr
        });
      }
    };

    xhr.send(JSON.stringify(body));
  });
}

function removeFromOffice(offices, meta, db) {
  return new Promise(function (resolve, reject) {
    var deleteTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity'], 'readwrite');

    deleteTx.oncomplete = function () {
      var rootTx = db.transaction(['root'], 'readwrite');
      var rootStore = rootTx.objectStore('root');

      rootStore.get(meta.user.uid).onsuccess = function (event) {
        var record = event.target.result;
        if (!record) return;
        record.officesRemoved = offices;
        rootStore.put(record);
      };

      rootTx.oncomplete = function () {
        console.log("run read after removal");
        resolve({
          response: 'Office Removed',
          success: true
        });
      };

      rootTx.onerror = function (error) {
        reject({
          response: error,
          success: false
        });
      };
    };

    deleteTx.onerror = function () {
      console.log(tx.error);
    };

    removeActivity(offices, deleteTx);
  });
}

function removeActivity(offices, tx) {
  var names = ['activity', 'children', 'map', 'calendar', 'subscriptions'];
  names.forEach(function (name) {
    var index = tx.objectStore(name).index('office');
    offices.forEach(function (office) {
      removeByIndex(index, office);
    });
  });
}

function removeByIndex(index, range) {
  index.openCursor(range).onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  };
}

function updateAuth(body, meta) {
  var req = {
    method: 'POST',
    url: "https://growthfile.com/json?action=update-auth",
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  };
  return http(req);
}

function backblaze(body, meta) {
  var req = {
    method: 'POST',
    url: "".concat(meta.apiUrl, "services/images"),
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 30000
  };
  return http(req);
}