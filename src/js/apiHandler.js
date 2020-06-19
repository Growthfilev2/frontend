let deviceInfo;
let currentDevice;
let meta;

function getTime() {
  return Date.now()
}

function getWebWorkerVersion() {
  const param = new URLSearchParams(self.location.search);
  return Number(param.get('version'))
}



const requestFunctionCaller = {
  dm: dm,
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
  subscription: createSubscription,
  searchOffice: searchOffice,
  checkIns: checkIns,
  idProof: idProof,
  device: device,
  acquisition: acquisition,
  fcmToken: fcmToken,
  pan: pan,
  aadhar: aadhar,
  profile: profile,
  shareLink:shareLink
}

function sendSuccessRequestToMainThread(response, id) {
  self.postMessage({
    response: response,
    success: true,
    id: id,
  })
}

function sendErrorRequestToMainThread(error) {

  const errorObject = {
    message: error.message,
    body: error,
    apiRejection: false,
    success: false,
    id: error.id,
    requestType: error.requestType
  }
  if (error.stack) {
    errorObject.stack = error.stack
  };

  if (error.code) {
    errorObject.apiRejection = true
  } else {
    instant(JSON.stringify(errorObject), meta)
  }
  self.postMessage(errorObject)
}

self.onmessage = function (event) {
  console.log(event)
  meta = event.data.meta;
  const workerId = event.data.id
  if (event.data.type === 'geolocationApi') {
    geolocationApi(event.data.body, event.data.meta, 3).then(function (response) {
      sendSuccessRequestToMainThread(response, workerId)
    }).catch(function (error) {
      error.id = workerId;
      self.postMessage(error);
    });
    return
  }

  const req = indexedDB.open(event.data.meta.user.uid);
  req.onsuccess = function () {
    const db = req.result

    if (event.data.type === 'now') return handleNow(event.data, db)
    if (event.data.type === 'instant') return instant(event.data.body, event.data.meta)

    if (event.data.type === 'Null') {
      updateIDB({
        payload: event.data,
        db: db
      }).then(function (response) {
        sendSuccessRequestToMainThread(response, workerId)
      }).catch(function (error) {
        error.id = workerId,
          error.requestType = event.data.type
        sendErrorRequestToMainThread(error)
      })
      return;
    }

    requestFunctionCaller[event.data.type](event.data.body, event.data.meta).then(function (response) {
      sendSuccessRequestToMainThread(response, workerId)
    }).catch(function (error) {
      error.id = workerId;
      error.requestType = event.data.type
      sendErrorRequestToMainThread(error)
    })
  }

}

function handleNow(eventData, db) {
  fetchServerTime(eventData.meta, db).then(function (response) {
    const rootTx = db.transaction(['root'], 'readwrite')
    const rootObjectStore = rootTx.objectStore('root')
    rootObjectStore.get(eventData.meta.user.uid).onsuccess = function (event) {
      rootRecord = event.target.result
      rootRecord.serverTime = response.timestamp - Date.now()
      rootObjectStore.put(rootRecord);
    }
    rootTx.oncomplete = function () {
      if (!response.removeFromOffice) return self.postMessage({
        response: response,
        success: true,
        id: eventData.id
      })

      if (Array.isArray(response.removeFromOffice) && response.removeFromOffice.length) {
        removeFromOffice(response.removeFromOffice, eventData.meta, db).then(function (response) {
          sendSuccessRequestToMainThread(response, workerId)
        }).catch(function (error) {
          error.id = eventData.id;
          error.requestType = eventData.type
          sendErrorRequestToMainThread(error)
        })
      };
    }
  }).catch(function (error) {
    error.id = eventData.id
    error.requestType = eventData.type
    sendErrorRequestToMainThread(error)
  })
}

// Performs XMLHTTPRequest for the API's.

function http(request, authorization = true) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(request.method, request.url, true)
    if (authorization) {
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
      xhr.setRequestHeader('Authorization', `Bearer ${request.token}`)
    }

    // xhr.timeout = 30000;
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
          const errorObject = JSON.parse(xhr.response)
          const apiFailBody = {
            message: errorObject.message,
            code: errorObject.code
          }
          return reject(apiFailBody)
        }
        xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success')
      }
    };
    xhr.send(request.body || null)
  })
}




function fetchServerTime(meta, db) {
  return new Promise(function (resolve, reject) {

    let url = `${meta.apiUrl}now`
    const tx = db.transaction(['root'], 'readwrite');
    const rootStore = tx.objectStore('root');

    rootStore.get(meta.user.uid).onsuccess = function (event) {
      const record = event.target.result;
      if (!record) return;
      if (record.officesRemoved) {
        record.officesRemoved.forEach(function (office) {
          url = url + `&removeFromOffice=${office.replace(' ','%20')}`
        });
        delete record.officesRemoved;
      }

      rootStore.put(record);
    }
    tx.oncomplete = function () {
      const httpReq = {
        method: 'GET',
        url: url,
        body: null,
        token: meta.user.token
      }
      http(httpReq).then(resolve).catch(reject)
    }
  })
}

function instant(error, meta) {

  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/logs`,
    body: error,
    token: meta.user.token
  }
  http(req).then(console.log).catch(console.log)
}



function comment(body, meta) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}activities/comment`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)
}

function changePhoneNumber(body, meta) {
  console.log('change number')
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}changePhoneNumber`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}



function removeBankAccount(body, meta) {

  const req = {
    method: 'DELETE',
    url: `${meta.apiUrl}services/accounts`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function newBankAccount(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/linkedAccount`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}



function searchOffice(body, meta) {
  const req = {
    method: 'GET',
    url: `${meta.apiUrl}services/search?q=${body.query}`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function checkIns(body, meta) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/checkIns`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function idProof(body, meta) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/idProof`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}


function device(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/device`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function acquisition(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/acquisition`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function fcmToken(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/fcmToken`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function pan(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/pan`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function aadhar(body, meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/aadhar`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function profile(body, meta) {
  const req = {
    method: 'GET',
    url: `${meta.apiUrl}profile/`,
    body: null,
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}

function shareLink(body,meta){
  const req = {
    method:'POST',
    url:`${meta.apiUrl}services/shareLink`,
    body:JSON.stringify(body),
    token:meta.user.token,
    timeout:null
  }
  return http(req)
}


function createSubscription(body, meta) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/subscription`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
}


function dm(body, meta) {
  console.log(body)
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}dm`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)
}

function statusChange(body, meta) {

  const req = {
    method: 'PATCH',
    url: `${meta.apiUrl}activities/change-status`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)

}


function share(body, meta) {

  const req = {
    method: 'PATCH',
    url: `${meta.apiUrl}activities/share`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)


}

function update(body, meta) {
  const req = {
    method: 'PATCH',
    url: `${meta.apiUrl}activities/update`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)
}

function create(requestBody, meta) {

  const req = {
    method: 'POST',
    url: `${meta.apiUrl}activities/create`,
    body: JSON.stringify(requestBody),
    token: meta.user.token,
    timeout: null
  }
  return http(req)

}

function acquisition(body,meta) {
  const req = {
    method: 'PUT',
    url: `${meta.apiUrl}profile/acquisition`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: null
  }
  return http(req)
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
              retry = retry - 1
              geolocationApi(body, meta, retry).then(resolve).catch(reject)
            }, 1000)
          } else {
            return reject({
              message: JSON.parse(xhr.response).error.message,
              body: {
                geolocationResponse: JSON.parse(xhr.response),
                geolocationBody: body
              },
            });
          }
          return
        }

        const response = JSON.parse(xhr.response);
        if (!response) {
          if (retry > 0) {
            setTimeout(function () {
              retry = retry - 1
              geolocationApi(body, meta, retry).then(resolve).catch(reject)
            }, 1000)
          } else {
            return reject({
              message: 'Response From geolocation Api ' + response,
              body: body
            })
          }
          return
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
          retry = retry - 1
          geolocationApi(body, meta, retry).then(resolve).catch(reject)
        }, 1000)
      } else {
        return reject({
          message: xhr
        })
      }
    }
    xhr.send(JSON.stringify(body));
  });
}

function removeFromOffice(offices, meta, db) {
  return new Promise(function (resolve, reject) {
    const deleteTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity'], 'readwrite');
    deleteTx.oncomplete = function () {
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootStore = rootTx.objectStore('root')
      rootStore.get(meta.user.uid).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        record.officesRemoved = offices
        rootStore.put(record)
      }
      rootTx.oncomplete = function () {
        console.log("run read after removal")
        resolve({
          response: 'Office Removed',
          success: true
        })

      }
      rootTx.onerror = function (error) {

        reject({
          response: error,
          success: false
        })
      }

    };

    deleteTx.onerror = function () {
      console.log(tx.error)
    }

    removeActivity(offices, deleteTx)


  })
}

function removeActivity(offices, tx) {
  const names = ['activity', 'children', 'map', 'calendar', 'subscriptions'];
  names.forEach(function (name) {
    const index = tx.objectStore(name).index('office');
    offices.forEach(function (office) {
      removeByIndex(index, office)
    })
  })

}

function removeByIndex(index, range) {
  index.openCursor(range).onsuccess = function (event) {
    const cursor = event.target.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  }
}

function updateAuth(body, meta) {
  const req = {
    method: 'POST',
    url: `https://growthfile.com/json?action=update-auth`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 15000
  }
  return http(req)
}

function backblaze(body, meta) {
  const req = {
    method: 'POST',
    url: `${meta.apiUrl}services/images`,
    body: JSON.stringify(body),
    token: meta.user.token,
    timeout: 30000
  }

  return http(req)
}


function updateAttendance(attendanceData = [], store) {
  attendanceData.forEach(function (value) {
    if (!value.id) return;
    value.editable = 1;
    store.put(value)
  })
}

function updateReimbursements(reimbursementData = [], store) {
  reimbursementData.forEach(function (value) {
    if (!value.id) return;
    store.put(value)
  })
}

function updatePayments(paymentData = [], store) {
  paymentData.forEach(function (value) {
    if (!value.id) return;
    store.put(value)
  })
}


function updateCalendar(activity, tx) {
  const calendarObjectStore = tx.objectStore('calendar')
  const calendarActivityIndex = calendarObjectStore.index('activityId')
  calendarActivityIndex.openCursor(activity.activityId).onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) {
      if(!Array.isArray(activity.schedule)) return;

      activity.schedule.forEach(function (schedule) {
        if(typeof schedule !== 'object') return;
        const record = {
          activityId: activity.activityId,
          scheduleName: schedule.name,
          timestamp: activity.timestamp,
          template: activity.template,
          hidden: activity.hidden,
          start: schedule.startTime,
          end: schedule.endTime,
          status: activity.status,
          office: activity.office
        }
        calendarObjectStore.add(record)
      });
      return;
    }

    let recordDeleteReq = cursor.delete()
    cursor.continue()
    recordDeleteReq.onsuccess = function () {
      console.log("remove calendar")
    }
    recordDeleteReq.onerror = function () {
      instant(JSON.stringify({
        message: recordDeleteReq.error.message
      }), meta)
    }
  }
}

function putMap(location, updateTx) {
  if (!location.activityId) return;
  const mapObjectStore = updateTx.objectStore('map')
  mapObjectStore.put(location);
}

function putAttachment(activity, tx, param) {
  if (!activity.activityId) return
  const store = tx.objectStore('children');
  const commonSet = {
    activityId: activity.activityId,
    status: activity.status,
    template: activity.template,
    office: activity.office,
    attachment: activity.attachment,
  };

  const myNumber = param.user.phoneNumber

  if (activity.template === 'employee') {
    if (activity.attachment.hasOwnProperty('Employee Contact')) {
      commonSet.employee = activity.attachment['Employee Contact'].value
    }
    if (activity.attachment.hasOwnProperty('Phone Number')) {
      commonSet.employee = activity.attachment['Phone Number'].value
    }
    if (activity.attachment.hasOwnProperty('First Supervisor') && activity.attachment['First Supervisor'].value === myNumber) {
      commonSet.team = 1
    }
  }

  store.put(commonSet)
}

function removeUserFromAssigneeInActivity(addendum, updateTx) {
  const addendumIndex = updateTx.objectStore('addendum').index('user');
  removeByIndex(addendumIndex, addendum.user)
  const activityObjectStore = updateTx.objectStore('activity')
  activityObjectStore.get(addendum.activityId).onsuccess = function (event) {
    const record = event.target.result;
    if (!record) return;

    const indexOfUser = record.assignees.findIndex(function (assignee) {
      return assignee.phoneNumber === addendum.user
    })

    if (indexOfUser > -1) {
      record.assignees.splice(indexOfUser, 1)

      activityObjectStore.put(record)
    }
  }
}

function removeActivityFromDB(id, updateTx) {
  if (!id) return;

  const activityObjectStore = updateTx.objectStore('activity');
  const chidlrenObjectStore = updateTx.objectStore('children');
  activityObjectStore.delete(id);
  chidlrenObjectStore.delete(id);

  ['calendar', 'map', 'addendum'].forEach(function (name) {
    const index = updateTx.objectStore(name).index('activityId')
    removeByIndex(index, id)
  })

}

function putSubscription(subscription, tx) {
  const store = tx.objectStore('subscriptions');
  store.put(subscription);

}




function successResponse(read, param, db, resolve, reject) {

  const updateTx = db.transaction(['map', 'calendar', 'children', 'subscriptions', 'activity', 'addendum', 'root', 'users', 'attendance', 'reimbursement', 'payment'], 'readwrite');
  const addendumObjectStore = updateTx.objectStore('addendum')
  const activityObjectStore = updateTx.objectStore('activity');
  const userStore = updateTx.objectStore('users');
  const attendaceStore = updateTx.objectStore('attendance')
  const reimbursementStore = updateTx.objectStore('reimbursement')
  const paymentStore = updateTx.objectStore('payment')

  let counter = {};
  let userTimestamp = {}

  read.addendum.forEach(function (addendum) {

    if (!addendum.hasOwnProperty('user')) return;

    if (addendum.unassign) {
      if (addendum.user == param.user.phoneNumber) {
        removeActivityFromDB(addendum.activityId, updateTx);
      } else {
        removeUserFromAssigneeInActivity(addendum, updateTx)
      };
    };


    if (addendum.isComment) {
      if (addendum.hasOwnProperty('assignee')) {
        if (addendum.assignee === param.user.phoneNumber) {
          addendum.key = param.user.phoneNumber + addendum.user
          userTimestamp[addendum.user] ? userTimestamp[addendum.user].push(addendum) : userTimestamp[addendum.user] = [addendum]
          counter[addendum.user] ? counter[addendum.user] += 1 : counter[addendum.user] = 1;
        } else {
          addendum.key = param.user.phoneNumber + addendum.assignee
          userTimestamp[addendum.assignee] ? userTimestamp[addendum.assignee].push(addendum) : userTimestamp[addendum.assignee] = [addendum];
        }
      } else {
        addendum.key = param.user.phoneNumber + addendum.user;
        userTimestamp[addendum.user] ? userTimestamp[addendum.user].push(addendum) : userTimestamp[addendum.user] = [addendum];
        if (addendum.user !== param.user.phoneNumber) {
          counter[addendum.user] ? counter[addendum.user] += 1 : counter[addendum.user] = 1
        }
      }
      addendumObjectStore.add(addendum)
    } else {
      addendum.key = param.user.phoneNumber + addendum.user;
      userTimestamp[addendum.user] ? userTimestamp[addendum.user].push(addendum) : userTimestamp[addendum.user] = [addendum];
      if (addendum.user !== param.user.phoneNumber) {
        counter[addendum.user] ? counter[addendum.user] += 1 : counter[addendum.user] = 1
      }
    }
  })


  read.locations.forEach(function (location) {
    putMap(location, updateTx);
  });


  updateAttendance(read.attendances, attendaceStore)
  updateReimbursements(read.reimbursements, reimbursementStore)
  updatePayments(read.payments, paymentStore);
  read.activities.forEach(function (activity) {
    if (!activity.activityId) return;

    activity.canEdit ? activity.editable == 1 : activity.editable == 0;

    if(activity.template === 'duty') {
      handleDutyActivity(activity,updateTx);
    }
    else {
      activityObjectStore.put(activity);
    }
    updateCalendar(activity, updateTx);
    putAttachment(activity, updateTx, param);

    activity.assignees.forEach(function (user) {
      userStore.get(user.phoneNumber).onsuccess = function (event) {

        let selfRecord = event.target.result;
        if (!selfRecord) {
          selfRecord = {
            count: 0
          }
        };
        selfRecord.mobile = user.phoneNumber;
        selfRecord.displayName = user.displayName;
        if (!selfRecord.photoURL) {
          selfRecord.photoURL = user.photoURL;
        }
        selfRecord.NAME_SEARCH = user.displayName.toLowerCase();
        if (!selfRecord.timestamp) {
          selfRecord.timestamp = ''
        }

        userStore.put(selfRecord)
      }
    })
  })

  console.log(userTimestamp);
  Object.keys(userTimestamp).forEach(function (number) {

    const currentAddendums = userTimestamp[number]
    currentAddendums.forEach(function (addendum) {
      if (addendum.isComment && addendum.assignee) return updateUserStore(userStore, number, addendum, counter);
      const activityId = addendum.activityId
      activityObjectStore.get(activityId).onsuccess = function (activityEvent) {
        const record = activityEvent.target.result;
        if (!record) {
          console.log('no activity id found for addendum')
          return;
        }

        record.assignees.forEach(function (user) {
          addendum.key = param.user.phoneNumber + user.phoneNumber;
          addendumObjectStore.put(addendum);
          if(record.template === 'duty') {
            console.log('duty addendum added');
          }
          if (number === param.user.phoneNumber) {
            updateUserStore(userStore, user.phoneNumber, addendum, counter)
          }
          if (number === user.phoneNumber) {
            updateUserStore(userStore, number, addendum, counter)
          }
        })
      }
    })
  })

  function handleDutyActivity(activity,updateTx){
    const store = updateTx.objectStore('activity');
    store.get(activity.activityId).onsuccess = function(e) {
      const record = e.target.result;
      if(!record) {
        store.put(activity);
        return
      }
      activity.timer = record.timer;
      store.put(activity);
    }
  }


  if (read.products) {
    read.products.forEach(function (product) {
      putAttachment(product, updateTx, param);
    })
  }

  read.templates.forEach(function (subscription) {
    if (subscription.status === 'CANCELLED') return;
    if (!subscription.activityId) {
      instant(JSON.stringify({
        message: 'activityId missing from template object',
        body: subscription
      }), param)
      return;
    }
   
    putSubscription(subscription, updateTx);

  })



  updateRoot(read, updateTx, param.user.uid, counter);
  updateTx.oncomplete = function () {
    console.log("all completed");
    return resolve(read)
  }
  updateTx.onerror = function () {
    return reject(updateTx.error)
  }
}

function updateUserStore(userStore, phoneNumber, currentAddendum, counter) {
  userStore.get(phoneNumber).onsuccess = function (event) {
    let userRecord = event.target.result
    if (!userRecord) {
      userRecord = {
        count: 0,
        displayName: '',
        photoURL: '',
        mobile: phoneNumber
      }
    }
    userRecord.comment = currentAddendum.comment
    userRecord.timestamp = currentAddendum.timestamp
    if (currentAddendum.isComment) {
      if (!counter[phoneNumber]) return userStore.put(userRecord);
    }
    if (userRecord.count) {
      userRecord.count += counter[phoneNumber];
    } else {
      userRecord.count = counter[phoneNumber];
    }
    userStore.put(userRecord)
  }
}

function updateRoot(read, tx, uid, counter) {
  let totalCount = 0;
  Object.keys(counter).forEach(function (number) {
    totalCount += counter[number]
  })
  const store = tx.objectStore('root')
  store.get(uid).onsuccess = function (event) {
    const record = event.target.result;
    record.fromTime = read.upto;
    if (record.totalCount) {
      record.totalCount += totalCount;
    } else {
      record.totalCount = totalCount;
    }
    console.log('start adding upto')
    store.put(record);
  }
}

function updateIDB(config) {
  return new Promise(function (resolve, reject) {

    const tx = config.db.transaction(['root']);
    const rootObjectStore = tx.objectStore('root');
    let record;
    let time;

    rootObjectStore.get(config.payload.meta.user.uid).onsuccess = function (event) {
      record = event.target.result;
      time = record.fromTime
    }

    tx.oncomplete = function () {
      const req = {
        method: 'GET',
        url: `${config.payload.meta.apiUrl}read1?from=${time}`,
        data: null,
        token: config.payload.meta.user.token
      };

      http(req)
        .then(function (response) {
          console.log('read completed')
          return successResponse(response, config.payload.meta, config.db, resolve, reject);
        }).catch(function (error) {

          return reject(error)
        })
    }
  })
};