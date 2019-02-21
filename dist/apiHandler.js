importScripts("external/js/moment.min.js");var apiUrl="https://api2.growthfile.com/api/",deviceInfo=void 0,currentDevice=void 0;function getTime(){return Date.now()}var requestFunctionCaller={comment:comment,statusChange:statusChange,share:share,update:update,create:create};function requestHandlerResponse(e,t,n,o){self.postMessage({type:e,code:t,msg:n,params:o})}function sendApiFailToMainThread(e){requestHandlerResponse("apiFail",e.code,e)}function http(i){return new Promise(function(n,o){var r=new XMLHttpRequest;r.open(i.method,i.url,!0),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("Authorization","Bearer "+i.token),r.onreadystatechange=function(){if(4===r.readyState){if(!r.status)return void requestHandlerResponse("android-stop-refreshing",400);if(226<r.status){var e=JSON.parse(r.response),t={res:JSON.parse(r.response),url:i.url,data:i.data,device:currentDevice,message:e.message,code:e.code};return o(t)}r.responseText?n(JSON.parse(r.responseText)):n("success")}},r.send(i.body||null)})}function fetchServerTime(e,n){currentDevice=e.device;var o=JSON.parse(currentDevice);return new Promise(function(t){http({method:"GET",url:apiUrl+"now?deviceId="+o.id+"&appVersion="+o.appVersion+"&os="+o.baseOs+"&registrationToken="+e.registerToken,body:null,token:n.token}).then(function(e){if(console.log(e),e.updateClient){requestHandlerResponse("update-app",200,JSON.stringify({title:"Message",message:"There is a New version of your app available",cancelable:!1,button:{text:"Update",show:!0,clickAction:{redirection:{text:"com.growthfile.growthfileNew",value:!0}}}}),"")}else e.revokeSession?requestHandlerResponse("revoke-session",200):t({ts:e.timestamp,user:n})}).catch(sendApiFailToMainThread)})}function instant(e,t){http({method:"POST",url:apiUrl+"services/logs",body:e,token:t.token}).then(function(e){console.log(e)}).catch(console.log)}function fetchRecord(e,o){return new Promise(function(t){var n=indexedDB.open(e);n.onsuccess=function(e){n.result.transaction("activity").objectStore("activity").get(o).onsuccess=function(e){t(e.target.result)}}})}function putServerTime(r){return new Promise(function(t,e){var o=indexedDB.open(r.user.uid);o.onerror=function(){e(o.error)},o.onsuccess=function(){var e=o.result.transaction(["root"],"readwrite"),n=e.objectStore("root");n.get(r.user.uid).onsuccess=function(e){var t=e.target.result;t.serverTime=r.ts-Date.now(),n.put(t)},e.oncomplete=function(){t({user:r.user,ts:r.ts})}}})}function comment(n,o){return console.log(n),new Promise(function(e,t){http({method:"POST",url:apiUrl+"activities/comment",body:JSON.stringify(n),token:o.token}).then(function(){e(!0)}).catch(sendApiFailToMainThread)})}function statusChange(n,o){return new Promise(function(t,e){fetchRecord(o.uid,n.activityId).then(function(e){http({method:"PATCH",url:apiUrl+"activities/change-status",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"status",o).then(function(){t(!0)}).catch(console.log)}).catch(sendApiFailToMainThread)})})}function share(n,o){return new Promise(function(t,e){http({method:"PATCH",url:apiUrl+"activities/share",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"share",o).then(function(){t(!0)})}).catch(sendApiFailToMainThread)})}function update(n,o){return new Promise(function(t,e){http({method:"PATCH",url:apiUrl+"activities/update",body:JSON.stringify(n),token:o.token}).then(function(e){instantUpdateDB(n,"update",o).then(function(){t(!0)})}).catch(sendApiFailToMainThread)})}function create(n,o){return console.log(n),new Promise(function(t,e){http({method:"POST",url:apiUrl+"activities/create",body:JSON.stringify(n),token:o.token}).then(function(e){t(!0)}).catch(sendApiFailToMainThread)})}function getUrlFromPhoto(e,t){http({method:"POST",url:apiUrl+"services/images",body:JSON.stringify(e),token:t.token}).then(function(e){requestHandlerResponse("backblazeRequest",200)}).catch(sendApiFailToMainThread)}function instantUpdateDB(i,s,e){return new Promise(function(t,n){var r=indexedDB.open(e.uid);r.onsuccess=function(){var e=r.result.transaction(["activity"],"readwrite"),o=e.objectStore("activity");o.get(i.activityId).onsuccess=function(e){var t=e.target.result;if(t.editable=0,"share"===s&&(i.share.forEach(function(e){t.assignees.push(e)}),o.put(t)),"update"===s){t.schedule=i.schedule,t.attachment=i.attachment;for(var n=0;n<t.venue.length;n++)t.venue[n].geopoint={_latitude:i.venue[n].geopoint._latitude,_longitude:i.venue[n].geopoint._longitude};o.put(t)}"status"===s&&(t[s]=i[s],o.put(t))},e.oncomplete=function(){t(!0)},e.onerror=function(){n(!0)}}})}function updateMap(o,r){var t=indexedDB.open(r.user.uid);t.onsuccess=function(){var n=t.result,e=n.transaction(["map"],"readwrite");e.objectStore("map").index("activityId").openCursor(o.activityId).onsuccess=function(e){var t=e.target.result;if(t){var n=t.delete();t.continue(),n.onerror=errorDeletingRecord}},e.oncomplete=function(){var e=n.transaction(["map"],"readwrite"),t=e.objectStore("map");"check-in"!==o.template&&o.venue.forEach(function(e){t.add({activityId:o.activityId,latitude:e.geopoint._latitude,longitude:e.geopoint._longitude,location:e.location.toLowerCase(),template:o.template,address:e.address.toLowerCase(),venueDescriptor:e.venueDescriptor,status:o.status,office:o.office,hidden:o.hidden})}),e.onerror=function(){instant(JSON.stringify({message:""+e.error}),r.user)}},e.onerror=function(){instant(JSON.stringify({message:""+e.error}),r.user)}}}function errorDeletingRecord(e){console.log(e.target.error)}function updateCalendar(r,n){var o=indexedDB.open(n.user.uid);o.onsuccess=function(){var e=o.result,t=e.transaction(["calendar"],"readwrite");t.objectStore("calendar").index("activityId").openCursor(r.activityId).onsuccess=function(e){var t=e.target.result;t&&(t.delete().onerror=errorDeletingRecord,t.continue())},t.oncomplete=function(){var o=e.transaction(["calendar"],"readwrite").objectStore("calendar");r.schedule.forEach(function(e){var t=moment(e.startTime).toDate(),n=moment(e.endTime).toDate();o.add({activityId:r.activityId,scheduleName:e.name,timestamp:r.timestamp,template:r.template,hidden:r.hidden,start:moment(t).format("YYYY-MM-DD"),end:moment(n).format("YYYY-MM-DD"),status:r.status,office:r.office})}),t.onerror=function(){instant(JSON.stringify({message:""+t.error}),n.user)}}}}function putAttachment(o,r){var i=indexedDB.open(r.user.uid);i.onsuccess=function(){var e=i.result.transaction(["children"],"readwrite"),t=e.objectStore("children"),n={activityId:o.activityId,status:o.status,template:o.template,office:o.office,attachment:o.attachment};t.put(n),e.onerror=function(){instant(JSON.stringify({message:""+e.error}),r.user)}}}function putAssignessInStore(e,t){var o=indexedDB.open(t.user.uid);o.onsuccess=function(){var n=o.result.transaction(["users"],"readwrite").objectStore("users");e.forEach(function(t){n.get(t).onsuccess=function(e){e.target.result||n.put({mobile:t,displayName:"",photoURL:""})}})}}function removeUserFromAssigneeInActivity(e,t){if(t.length){var n=e.transaction(["activity"],"readwrite"),r=n.objectStore("activity");t.forEach(function(o){r.get(o.id).onsuccess=function(e){var t=e.target.result;if(t){var n=t.assignees.indexOf(o.user);-1<n&&(t.assignees.splice(n,1),r.put(t))}}}),n.oncomplete=function(){console.log("user removed from assignee in activity where he once was if that activity existed")}}}function removeActivityFromDB(e,t,n){if(t.length){var o=e.transaction(["activity","list","children"],"readwrite"),r=o.objectStore("activity"),i=o.objectStore("list"),s=o.objectStore("children");t.forEach(function(e){r.delete(e),i.delete(e),s.delete(e)}),o.oncomplete=function(){mapAndCalendarRemovalRequest(activitiesToRemove,n)}}}function mapAndCalendarRemovalRequest(o,e){var r=indexedDB.open(e.user.uid);r.onsuccess=function(){var e=r.result.transaction(["calendar","map"],"readwrite"),t=e.objectStore("calendar").index("activityId"),n=e.objectStore("map").index("activityId");deleteByIndex(t,o),deleteByIndex(n,o),e.oncomplete=function(){console.log("activity is removed from all stores")},e.onerror=function(){console.log(transaction.error)}}}function deleteByIndex(e,n){e.openCursor().onsuccess=function(e){var t=e.target.result;t&&(-1<n.indexOf(t.key)&&t.delete(),t.continue())}}function updateSubscription(e,s,t){return new Promise(function(n,r){if(s.length){var i=indexedDB.open(t.user.uid);i.onsuccess=function(){var e=i.result.transaction(["subscriptions"],"readwrite"),o=e.objectStore("subscriptions"),t=o.index("template");s.forEach(function(n){t.openCursor(n.template).onsuccess=function(e){var t=e.target.result;t?(n.office===t.value.office?t.update(n):t.put(n),t.continue()):o.put(n)}}),e.oncomplete=function(){n(!0)},e.onerror=function(){r({message:""+e.error})}}}else n(!0)})}function deleteTemplateInSubscription(e){}function createListStore(s,a,t){return new Promise(function(r,e){var i=indexedDB.open(t.user.uid);i.onsuccess=function(){var t=i.result,e=t.transaction(["users"]),n=e.objectStore("users"),o={activityId:s.activityId,secondLine:"",count:a[s.activityId],timestamp:s.timestamp,creator:{number:s.creator,photo:""},activityName:s.activityName,status:s.status};n.get(s.creator).onsuccess=function(e){var t=e.target.result;t&&(o.creator.photo=t.photoURL)},e.oncomplete=function(){var e=t.transaction(["list"],"readwrite"),n=e.objectStore("list");n.get(s.activityId).onsuccess=function(e){var t=e.target.result;o.createdTime=t?t.createdTime:s.timestamp,n.put(o)},e.oncomplete=function(){r(!0)}}}})}function successResponse(s,a){var c=indexedDB.open(a.user.uid),u=[],d=[];c.onsuccess=function(){var e=c.result,n=e.transaction("addendum","readwrite").objectStore("addendum"),o=e.transaction(["activity","addendum"],"readwrite").objectStore("activity"),r={};s.addendum.forEach(function(e){if(e.unassign&&(e.user==a.user.phoneNumber?u.push(e.activityId):d.push({id:e.activityId,user:e.user})),e.isComment){var t=e.activityId;r[t]=(r[t]||0)+1}n.add(e)}),removeActivityFromDB(e,u,a),removeUserFromAssigneeInActivity(e,d,a);for(var t=function(e){var t=s.activities[e];t.canEdit?t.editable=1:t.editable=0,o.put(t),updateMap(t,a),updateCalendar(t,a),putAssignessInStore(t.assignees,a),putAttachment(t,a),0===t.hidden&&createListStore(t,r,a).then(function(){20<=s.activities.length?s.activities.length-e<=20&&requestHandlerResponse("initFirstLoad",200,{activity:[t]}):requestHandlerResponse("initFirstLoad",200,{activity:[t]})})},i=s.activities.length;i--;)t(i);updateRoot(a,s).then(function(){updateSubscription(e,s.templates,a).then(function(){requestHandlerResponse("initFirstLoad",200,{template:!0})}).catch(function(e){instant(JSON.stringify(e),a.user),requestHandlerResponse("initFirstLoad",200,{template:!0})})}),getUniqueOfficeCount(a).then(function(e){setUniqueOffice(e,a).then(console.log).catch(function(e){instant(JSON.stringify(e),a.user)})}).catch(function(e){instant(JSON.stringify(e),a.user)}),createUsersApiUrl(e,a.user).then(updateUserObjectStore).catch(function(e){instant(JSON.stringify(e),a.user)})}}function createUsersApiUrl(i,s){return new Promise(function(e){var t=i.transaction(["users"],"readwrite"),n=t.objectStore("users"),o="",r=apiUrl+"services/users?q=";n.openCursor().onsuccess=function(e){var t=e.target.result;if(t){var n="%2B"+t.value.mobile+"&q=";o+=""+n.replace("+",""),t.continue()}},t.oncomplete=function(){e({db:i,url:""+r+o,user:s})},t.onerror=function(){reject({message:t.error})}})}function updateUserObjectStore(t){http({method:"GET",url:t.url,data:null,token:t.user.token}).then(function(o){if(Object.keys(o).length){var e=t.db.transaction(["users"],"readwrite"),r=e.objectStore("users");r.openCursor().onsuccess=function(e){var t=e.target.result;if(t&&o.hasOwnProperty(t.primaryKey)){if(o[t.primaryKey].displayName&&o[t.primaryKey].photoURL){var n=t.value;n.photoURL=o[t.primaryKey].photoURL,n.displayName=o[t.primaryKey].displayName,r.put(n)}t.continue()}},e.oncomplete=function(){},e.onerror=function(){instant(JSON.stringify({message:""+e.error}),param.user)}}}).catch(function(e){console.log(e)})}function updateRoot(i,s){return new Promise(function(t,o){var r=indexedDB.open(i.user.uid);r.onsuccess=function(){var e=r.result.transaction(["root"],"readwrite"),n=e.objectStore("root");n.get(i.user.uid).onsuccess=function(e){var t=e.target.result;t.fromTime=s.upto,n.put(t)},e.oncomplete=function(){t(!0)},e.onerror=function(){o(e.error)}}})}function getUniqueOfficeCount(i){return new Promise(function(t,n){var e=i.user.uid,o=indexedDB.open(e),r=[];o.onsuccess=function(){var e=o.result.transaction(["activity"]);e.objectStore("activity").index("office").openCursor(null,"nextunique").onsuccess=function(e){var t=e.target.result;t&&(r.push(t.value.office),t.continue())},e.oncomplete=function(){t(r)},e.onerror=function(){n({message:e.error})},o.onerror=function(){n({message:o.error})}}})}function setUniqueOffice(s,e){return new Promise(function(t,o){var r=e.user.uid,i=indexedDB.open(r);i.onsuccess=function(){var e=i.result.transaction(["root"],"readwrite"),n=e.objectStore("root");n.get(r).onsuccess=function(e){var t=e.target.result;t.offices=s,n.put(t)},e.oncomplete=function(){t(!0)},e.onerror=function(){o({message:e.error})}}})}function updateIDB(r){var i=indexedDB.open(r.user.uid);i.onsuccess=function(){var e=i.result.transaction(["root"]),t=e.objectStore("root"),n=void 0,o=void 0;t.get(r.user.uid).onsuccess=function(e){n=e.target.result,o=n.fromTime},e.oncomplete=function(){http({method:"GET",url:apiUrl+"read?from="+o,data:null,token:r.user.token}).then(function(e){e&&(requestHandlerResponse("android-stop-refreshing",200),successResponse(e,r))}).catch(sendApiFailToMainThread)}}}self.onmessage=function(e){"now"!==e.data.type?"instant"!==e.data.type?"Null"!==e.data.type?"backblaze"!==e.data.type?requestFunctionCaller[e.data.type](e.data.body,e.data.user).then(function(e){e&&requestHandlerResponse("notification",200,"status changed successfully")}).catch(function(e){console.log(e)}):getUrlFromPhoto(e.data.body,e.data.user):updateIDB({user:e.data.user}):instant(e.data.body,e.data.user):fetchServerTime(e.data.body,e.data.user).then(putServerTime).then(updateIDB).catch(console.log)};