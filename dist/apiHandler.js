importScripts("../external/js/moment.min.js");var apiUrl="https://us-central1-growthfilev2-0.cloudfunctions.net/api/",deviceInfo=void 0;function getTime(){return Date.now()}var requestFunctionCaller={comment:comment,statusChange:statusChange,share:share,update:update,create:create};function requestHandlerResponse(e,t,n,o){self.postMessage({type:e,code:t,msg:n,params:o})}function sendApiFailToMainThread(e){requestHandlerResponse("apiFail",e.code,e)}function http(i){return new Promise(function(n,o){var r=new XMLHttpRequest;r.open(i.method,i.url,!0),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("Authorization","Bearer "+i.token),r.onreadystatechange=function(){if(4===r.readyState){if(!r.status)return void requestHandlerResponse("android-stop-refreshing",400);if(226<r.status){var e=JSON.parse(r.response),t={res:JSON.parse(r.response),url:i.url,data:i.data,device:currentDevice,message:e.message,code:e.code};return o(t)}r.responseText?n(JSON.parse(r.responseText)):n("success")}},r.send(i.body||null)})}function fetchServerTime(n,o){currentDevice=n.device;var e=JSON.parse(currentDevice);return new Promise(function(t){http({method:"GET",url:apiUrl+"now?deviceId="+e.id+"&appVersion="+e.appVersion+"&os="+e.baseOs+"&registrationToken="+n.registerToken,body:null,token:o.token}).then(function(e){if(console.log(e),e.updateClient){requestHandlerResponse("update-app",200,JSON.stringify({title:"Message",message:"There is a New version of your app available",cancelable:!1,button:{text:"Update",show:!0,clickAction:{redirection:{text:"com.growthfile.growthfileNew",value:!0}}}}),"")}else e.revokeSession?requestHandlerResponse("revoke-session",200):t({ts:e.timestamp,fromTime:n.from,user:o})}).catch(sendApiFailToMainThread)})}function instant(e,t){var n={method:"POST",url:apiUrl+"services/logs",body:e,token:t.token};console.log(e),http(n).then(function(e){console.log(e)}).catch(console.log)}function fetchRecord(e,o){return new Promise(function(t){var n=indexedDB.open(e);n.onsuccess=function(e){n.result.transaction("activity").objectStore("activity").get(o).onsuccess=function(e){t(e.target.result)}}})}function initializeIDB(r){return console.log("init db"),new Promise(function(t,e){var o=indexedDB.open(r.user.uid,3);o.onerror=function(){console.log(o.error),e(o.error)},o.onupgradeneeded=function(e){console.log(e),createObjectStores(o,r)},o.onsuccess=function(){var e=o.result.transaction(["root"],"readwrite"),n=e.objectStore("root");n.get(r.user.uid).onsuccess=function(e){var t=e.target.result;t.serverTime=r.ts-Date.now(),n.put(t)},e.oncomplete=function(){t({user:r.user,fromTime:r.fromTime})}}})}function createObjectStores(e,t){var n=e.result,o=n.createObjectStore("activity",{keyPath:"activityId"});o.createIndex("timestamp","timestamp"),o.createIndex("office","office"),o.createIndex("hidden","hidden");var r=n.createObjectStore("list",{keyPath:"activityId"});r.createIndex("timestamp","timestamp"),r.createIndex("status","status");var i=n.createObjectStore("users",{keyPath:"mobile"});i.createIndex("displayName","displayName"),i.createIndex("isUpdated","isUpdated"),i.createIndex("count","count"),n.createObjectStore("addendum",{autoIncrement:!0}).createIndex("activityId","activityId");var a=n.createObjectStore("subscriptions",{autoIncrement:!0});a.createIndex("office","office"),a.createIndex("template","template"),a.createIndex("officeTemplate",["office","template"]);var c=n.createObjectStore("calendar",{autoIncrement:!0});c.createIndex("activityId","activityId"),c.createIndex("timestamp","timestamp"),c.createIndex("start","start"),c.createIndex("end","end"),c.createIndex("urgent",["status","hidden"]),c.createIndex("onLeave",["template","status","office"]);var s=n.createObjectStore("map",{autoIncrement:!0});s.createIndex("activityId","activityId"),s.createIndex("location","location"),s.createIndex("latitude","latitude"),s.createIndex("longitude","longitude"),s.createIndex("nearby",["status","hidden"]),s.createIndex("byOffice",["office","location"]);var u=n.createObjectStore("children",{keyPath:"activityId"});u.createIndex("template","template"),u.createIndex("office","office"),u.createIndex("templateStatus",["template","status"]),n.createObjectStore("root",{keyPath:"uid"}).put({uid:t.user.uid,fromTime:t.fromTime,location:""})}function comment(n,o){return console.log(n),new Promise(function(e,t){http({method:"POST",url:apiUrl+"activities/comment",body:JSON.stringify(n),token:o.token}).then(function(){e(!0)}).catch(sendApiFailToMainThread)})}function statusChange(n,o){return new Promise(function(t,e){fetchRecord(o.uid,n.activityId).then(function(e){http({method:"PATCH",url:apiUrl+"activities/change-status",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"status",o).then(function(){t(!0)}).catch(console.log)}).catch(sendApiFailToMainThread)})})}function share(n,o){return new Promise(function(t,e){http({method:"PATCH",url:apiUrl+"activities/share",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"share",o).then(function(){t(!0)})}).catch(sendApiFailToMainThread)})}function update(n,o){return new Promise(function(t,e){http({method:"PATCH",url:apiUrl+"activities/update",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"update",o).then(function(){t(!0)})}).catch(sendApiFailToMainThread)})}function create(n,o){return console.log(n),new Promise(function(t,e){http({method:"POST",url:apiUrl+"activities/create",body:JSON.stringify(n),token:o.token}).then(function(e){t(!0)}).catch(sendApiFailToMainThread)})}function getUrlFromPhoto(e,t){http({method:"POST",url:apiUrl+"services/images",body:JSON.stringify(e),token:t.token}).then(function(e){requestHandlerResponse("backblazeRequest",200)}).catch(sendApiFailToMainThread)}function instantUpdateDB(i,a,e){return new Promise(function(t,n){var r=indexedDB.open(e.uid);r.onsuccess=function(){var e=r.result.transaction(["activity"],"readwrite"),o=e.objectStore("activity");o.get(i.activityId).onsuccess=function(e){var t=e.target.result;if(t.editable=0,"share"===a&&(i.share.forEach(function(e){t.assignees.push(e)}),o.put(t)),"update"===a){t.schedule=i.schedule,t.attachment=i.attachment;for(var n=0;n<t.venue.length;n++)t.venue[n].geopoint={_latitude:i.venue[n].geopoint._latitude,_longitude:i.venue[n].geopoint._longitude};o.put(t)}"status"===a&&(t[a]=i[a],o.put(t))},e.oncomplete=function(){t(!0)},e.onerror=function(){n(!0)}}})}function updateMap(n,e){var o=indexedDB.open(e.user.uid);o.onsuccess=function(){var e=o.result,t=e.transaction(["map"],"readwrite");t.objectStore("map").index("activityId").openCursor(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var n=t.delete();t.continue(),n.onerror=errorDeletingRecord}},t.oncomplete=function(){var t=e.transaction(["map"],"readwrite").objectStore("map");"check-in"!==n.template&&n.venue.forEach(function(e){t.add({activityId:n.activityId,latitude:e.geopoint._latitude,longitude:e.geopoint._longitude,location:e.location.toLowerCase(),template:n.template,address:e.address.toLowerCase(),venueDescriptor:e.venueDescriptor,status:n.status,office:n.office,hidden:n.hidden})})},t.onerror=errorDeletingRecord}}function errorDeletingRecord(e){console.log(e.target.error)}function transactionError(e){console.log(e.target.error)}function updateCalendar(r,e){var n=indexedDB.open(e.user.uid);n.onsuccess=function(){var t=n.result,e=t.transaction(["calendar"],"readwrite");e.objectStore("calendar").index("activityId").openCursor(r.activityId).onsuccess=function(e){var t=e.target.result;t&&(t.delete().onerror=errorDeletingRecord,t.continue())},e.oncomplete=function(){var e=t.transaction(["calendar"],"readwrite"),o=e.objectStore("calendar");r.schedule.forEach(function(e){var t=moment(e.startTime).toDate(),n=moment(e.endTime).toDate();o.add({activityId:r.activityId,scheduleName:e.name,timestamp:r.timestamp,template:r.template,hidden:r.hidden,start:moment(t).format("YYYY-MM-DD"),end:moment(n).format("YYYY-MM-DD"),status:r.status,office:r.office})}),e.onerror=transactionError}}}function putAttachment(e,t){var n=e.transaction("children","readwrite").objectStore("children"),o={activityId:t.activityId,status:t.status,template:t.template,office:t.office,attachment:t.attachment};n.put(o)}function putAssignessInStore(e,t){t.forEach(function(t){var n=e.transaction("users","readwrite").objectStore("users");n.openCursor(t).onsuccess=function(e){e.target.result||n.add({mobile:t,isUpdated:0,displayName:""})}})}function removeUserFromAssigneeInActivity(e,t){if(t.length){var n=e.transaction(["activity"],"readwrite"),r=n.objectStore("activity");t.forEach(function(o){r.get(o.id).onsuccess=function(e){var t=e.target.result;if(t){var n=t.assignees.indexOf(o.user);-1<n&&(t.assignees.splice(n,1),r.put(t))}}}),n.oncomplete=function(){console.log("user removed from assignee in activity where he once was if that activity existed")}}}function removeActivityFromDB(e,t,n){if(t.length){var o=e.transaction(["activity","list","children"],"readwrite"),r=o.objectStore("activity"),i=o.objectStore("list"),a=o.objectStore("children");t.forEach(function(e){r.delete(e),i.delete(e),a.delete(e)}),o.oncomplete=function(){mapAndCalendarRemovalRequest(activitiesToRemove,n)}}}function mapAndCalendarRemovalRequest(o,e){var r=indexedDB.open(e.user.uid);r.onsuccess=function(){var e=r.result.transaction(["calendar","map"],"readwrite"),t=e.objectStore("calendar").index("activityId"),n=e.objectStore("map").index("activityId");deleteByIndex(t,o),deleteByIndex(n,o),e.oncomplete=function(){console.log("activity is removed from all stores")},e.onerror=function(){console.log(transaction.error)}}}function deleteByIndex(e,n){e.openCursor().onsuccess=function(e){var t=e.target.result;t&&(-1<n.indexOf(t.key)&&t.delete(),t.continue())}}function createUsersApiUrl(a,c){return new Promise(function(e){var t=a.transaction(["users"],"readwrite"),n=t.objectStore("users"),o="",r=apiUrl+"services/users?q=",i="";n.openCursor().onsuccess=function(e){var t=e.target.result;if(t){var n="%2B"+t.value.mobile+"&q=";o+=""+n.replace("+",""),t.continue()}},t.oncomplete=function(){i=""+r+o,o&&e({db:a,url:i,user:c})}})}function updateUserObjectStore(i){return new Promise(function(t,n){http({method:"GET",url:i.url,data:null,token:i.user.token}).then(function(o){if(!Object.keys(o).length)return t(!0);var e=i.db.transaction(["users"],"readwrite"),r=e.objectStore("users");r.openCursor().onsuccess=function(e){var t=e.target.result;if(t&&o.hasOwnProperty(t.primaryKey)){if(o[t.primaryKey].displayName&&o[t.primaryKey].photoURL){var n=t.value;n.photoURL=o[t.primaryKey].photoURL,n.displayName=o[t.primaryKey].displayName,r.put(n)}t.continue()}},e.oncomplete=function(){t(!0)},e.onerror=function(){n(e.error)}}).catch(function(e){n(e)})})}function findSubscriptionCount(o){return new Promise(function(e,t){var n=o.transaction(["subscriptions"],"readwrite").objectStore("subscriptions").count();n.onsuccess=function(){e(n.result)},n.onerror=function(){t(n.error)}})}function updateSubscription(e,i,a){findSubscriptionCount(e).then(function(o){var r=indexedDB.open(a.user.uid);r.onsuccess=function(){var e=r.result.transaction(["subscriptions"],"readwrite"),t=e.objectStore("subscriptions"),n=t.index("template");o?(n.openCursor(i.template).onsuccess=function(e){var t=e.target.result;t&&(i.office===t.value.office&&t.delete(),t.continue())},e.oncomplete=function(){var e=indexedDB.open(a.user.uid);e.onsuccess=function(){e.result.transaction("subscriptions","readwrite").objectStore("subscriptions").put(i)}}):t.put(i)}}).catch(console.log)}function createListStore(o,r,e){var i=indexedDB.open(e.user.uid);i.onsuccess=function(){var e=i.result.transaction(["list"],"readwrite"),t=e.objectStore("list"),n={activityId:o.activityId,secondLine:"",count:r[o.activityId],timestamp:o.timestamp,creator:{number:o.creator,photo:""},activityName:o.activityName,status:o.status};t.put(n),e.oncomplete=function(){console.log("done")}}}function updateListStoreWithCreatorImage(e){return new Promise(function(n,o){var i=indexedDB.open(e.user.uid);i.onsuccess=function(){var e=i.result.transaction(["list","users"],"readwrite"),r=e.objectStore("list"),t=e.objectStore("users");r.openCursor().onsuccess=function(e){var n=e.target.result;if(n){var o=n.value.creator;t.get(o.number).onsuccess=function(e){var t=e.target.result;t&&(o.photo=t.photoURL,r.put(n.value))},n.continue()}},e.oncomplete=function(){n(!0)},e.onerror=function(){o(e.error)}}})}function successResponse(a,c){var e=indexedDB.open(c.user.uid),s=[],u=[];e.onsuccess=function(){var n=e.result,o=n.transaction("addendum","readwrite").objectStore("addendum"),r=n.transaction(["root"],"readwrite").objectStore("root"),t=n.transaction(["activity"],"readwrite").objectStore("activity"),i={};a.addendum.forEach(function(e){e.unassign&&(e.user==c.user.phoneNumber?s.push(e.activityId):u.push({id:e.activityId,user:e.user}));var t=e.activityId;i[t]=(i[t]||0)+1,o.add(e)}),removeActivityFromDB(n,s,c),removeUserFromAssigneeInActivity(n,u,c),a.activities.forEach(function(e){e.canEdit?e.editable=1:e.editable=0,t.put(e),0===e.hidden&&createListStore(e,i,c),updateMap(e,c),updateCalendar(e,c),putAssignessInStore(n,e.assignees),putAttachment(n,e)}),a.templates.forEach(function(e){updateSubscription(n,e,c)}),r.get(c.user.uid).onsuccess=function(e){getUniqueOfficeCount(c).then(function(e){setUniqueOffice(e,c)}).catch(console.log);var t=e.target.result;t.fromTime=a.upto,r.put(t),createUsersApiUrl(n,c.user).then(function(e){updateUserObjectStore(e).then(function(e){updateListStoreWithCreatorImage(c).then(function(){requestHandlerResponse("loadView",200,a.activities)})}).catch(function(e){requestHandlerResponse("loadView",200,updatedActivities)})})}}}function getUniqueOfficeCount(i){return new Promise(function(t,n){var e=i.user.uid,o=indexedDB.open(e),r=[];o.onsuccess=function(){var e=o.result.transaction(["activity"]);e.objectStore("activity").index("office").openCursor(null,"nextunique").onsuccess=function(e){var t=e.target.result;t&&(r.push(t.value.office),t.continue())},e.oncomplete=function(){t(r)},o.onerror=function(e){n(e.error)}}})}function setUniqueOffice(o,e){var t=e.user.uid,r=indexedDB.open(t);r.onsuccess=function(){var e=r.result.transaction(["root"],"readwrite"),n=e.objectStore("root");n.get(t).onsuccess=function(e){var t=e.target.result;t.offices=o,n.put(t)},e.oncomplete=function(){console.log("all offices are set")}}}function updateIDB(r){var i=indexedDB.open(r.user.uid);i.onsuccess=function(){var e=i.result.transaction(["root"]),t=e.objectStore("root"),n=void 0,o=void 0;r.fromTime?o=r.fromTime:t.get(r.user.uid).onsuccess=function(e){n=e.target.result,o=n.fromTime},e.oncomplete=function(){http({method:"GET",url:apiUrl+"read?from="+o,data:null,token:r.user.token}).then(function(e){e&&successResponse(e,r)}).catch(sendApiFailToMainThread)}}}self.onmessage=function(e){"now"!==e.data.type?"instant"!==e.data.type?"Null"!==e.data.type?"backblaze"!==e.data.type?requestFunctionCaller[e.data.type](e.data.body,e.data.user).then(function(e){e&&requestHandlerResponse("notification",200,"status changed successfully")}).catch(function(e){console.log(e)}):getUrlFromPhoto(e.data.body,e.data.user):updateIDB({user:e.data.user}):instant(e.data.body,e.data.user):fetchServerTime(e.data.body,e.data.user).then(initializeIDB).then(updateIDB).catch(console.log)};