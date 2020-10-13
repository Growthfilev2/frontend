// /** Utility method for storing and getting device data**/
// let native = function () {
//     var deviceInfo = '';
//     var tokenChanged = '';
//     return {
//         setFCMToken: function (token) {
//             console.log('rec ', token)
//             const storedToken = localStorage.getItem('token');
//             console.log('stored token', storedToken)
//             if (storedToken !== token) {
//                 tokenChanged = true
//             }

//             localStorage.setItem('token', token)
//         },
//         getFCMToken: function () {
//             return localStorage.getItem('token')
//         },
//         isFCMTokenChanged: function () {
//             return tokenChanged;
//         },
//         setName: function (device) {
//             localStorage.setItem('deviceType', device);
//         },
//         getName: function () {
//             return localStorage.getItem('deviceType');
//         },

//         setIosInfo: function (iosDeviceInfo) {
//             const queryString = new URLSearchParams(iosDeviceInfo);
//             var obj = {}
//             queryString.forEach(function (val, key) {
//                 if (key === 'appVersion') {
//                     obj[key] = Number(val)
//                 } else {
//                     obj[key] = val
//                 }
//             })
//             deviceInfo = obj
//             deviceInfo.idbVersion = DB_VERSION
//         },
//         getInfo: function () {
//             if (!this.getName()) return false;
//             const storedInfo = JSON.parse(localStorage.getItem('deviceInfo'));
//             if (storedInfo) return storedInfo;
//             if (this.getName() === 'Android') {
//                 deviceInfo = getAndroidDeviceInformation()
//                 deviceInfo.idbVersion = DB_VERSION
//                 return deviceInfo
//             }
//             return deviceInfo;
//         }
//     }
// }();

// /** Wifi sancs results from android */
// var updatedWifiAddresses = {
//     addresses: {},
//     timestamp: null
//   }

// /**
//  * Call different JNI Android Methods to access device information
//  */
// function getAndroidDeviceInformation() {
//     return {
//         'id': AndroidInterface.getId(),
//         'deviceBrand': AndroidInterface.getDeviceBrand(),
//         'deviceModel': AndroidInterface.getDeviceModel(),
//         'osVersion': AndroidInterface.getOsVersion(),
//         'baseOs': AndroidInterface.getBaseOs(),
//         'radioVersion': AndroidInterface.getRadioVersion(),
//         'appVersion': Number(AndroidInterface.getAppVersion()),
//     }
// }

// /** Log analytics event */
// function logReportEvent(name) {
//     const deviceInfo = native.getInfo();
//     if (native.getName() === 'Android' && deviceInfo.appVersion >= 14) {
//         AndroidInterface.logEvent(name);
//         return;
//     }
//     try {
//         webkit.messageHandlers.logEvent.postMessage(name)
//     } catch (e) {
//         console.log(e)
//     }
//     return;
// }


const redirect = (path) => {
   window.location = window.location.origin+path;
}
const logReportEvent = (name) =>{
   const deviceInfo = native.getInfo();
   if (native.getName() === 'Android' && deviceInfo.appVersion >= 14) {
     AndroidInterface.logEvent(name);
     return;
   }
   try {
     webkit.messageHandlers.logEvent.postMessage(name)
   } catch (e) {
     console.log(e)
   }
   return;
 }

 function createList(attr) {
   const li = createElement('li', {
     className: 'mdc-list-item'
   });
   li.innerHTML = `
     ${attr.icon ? `<i class="mdc-list-item__graphic material-icons mdc-theme--primary" aria-hidden="true">${attr.icon}</i>` :''}
     ${attr.primaryText && attr.secondaryText ? ` <span class="mdc-list-item__text">
       <span class="mdc-list-item__primary-text">
         ${attr.primaryText}
       </span>
        <span class="mdc-list-item__secondary-text">
         ${attr.secondaryText}
       </span>` : attr.primaryText}
     </span>
     ${attr.meta ? `<span class='mdc-list-item__meta material-icons'>${attr.meta}</span>` :''}
   `
   new mdc.ripple.MDCRipple(li)
   return li;
 }