
window.addEventListener('load', () => {

  if(localStorage.getItem('mode') === 'dark'){
    document.querySelector('body').style.backgroundImage = "url(../img/login_background_dark.svg)"
    document.querySelector('body').style.position = "fixed";
    document.querySelector('body').style.backgroundRepeat = "no-repeat";
    document.querySelector('body').style.backgroundSize="cover";
    document.querySelector('body').style.width= "100%";
    document.querySelector('body').style.height="100%";
    document.querySelector('body').style.backgroundPosition="fixed";
    document.getElementById("logo_dark").src= "img/logo_login_dark.svg";
  }
 
});



var ui = new firebaseui.auth.AuthUI(firebase.auth());


ui.start('#firebaseui-auth-container', {
  signInOptions: [
    {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'normal', // 'invisible' or 'compact'
        badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
      },
      defaultCountry: 'IN', 
      defaultNationalNumber: '9999955555',
     
    }
  ]
});



var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (!user) return;
        setTimeout(() => {
          const queryParams = new URLSearchParams(window.location.search);
          // after login send custom events to fb analytics and firebase analytics
          if (authResult && !authResult.additionalUserInfo.isNewUser) {
            logReportEvent("login");
            logFirebaseAnlyticsEvent("login", {
              method: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
            });
    
            if (queryParams && queryParams.has('re_auth')) {
              return redirect(`/profile_edit.html?email=${queryParams.get('email')}`)
            }
    
            return redirect(
              `/index.html${
                  window.location.search ? `${window.location.search}` : ""
                }`
            );
          }
    
          firebase
            .auth()
            .currentUser.getIdTokenResult()
            .then(function (tokenResult) {
    
              if (isAdmin(tokenResult)) {
                logReportEvent("Sign Up Admin");
                setFirebaseAnalyticsUserProperty("isAdmin", "true");
              } else {
                logReportEvent("Sign Up");
              }
              const signUpParams = {
                method: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
              };
    
              if (queryParams) {
                signUpParams.source = queryParams.get("utm_source");
                signUpParams.medium = queryParams.get("utm_medium");
                signUpParams.campaign = queryParams.get("utm_campaign");
              }
              logFirebaseAnlyticsEvent("sign_up", signUpParams);
              if (queryParams && queryParams.has('re_auth')) {
                return redirect(`/profile_edit`)
              }
              redirect(
                `/index.html${
                    window.location.search ? `${window.location.search}` : ""
                  }`
              );
            });
        }, 1500)
      });
      return false;
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loading').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',  
  // Terms of service url.
  tosUrl: 'https://growthfile.com/legal#terms-of-use-user',
  // Privacy policy url.
  privacyPolicyUrl: 'https://growthfile.com/legal#privacy-policy'
};




ui.start('#firebaseui-auth-container', uiConfig);


// var authentication;
// window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
//   "sign-in-button", {
//     //use size normal to show the captcha :)
//     size: "invisible",
//     callback: function (response) {
//       submitPhoneNumberAuth();
//     },
//   }
// );

// window.addEventListener('load', () => {

//   if(localStorage.getItem('mode') === 'dark'){
//     document.querySelector('body').style.backgroundImage = "url(../img/login_background_dark.svg)"
//     document.querySelector('body').style.position = "fixed";
//     document.querySelector('body').style.backgroundRepeat = "no-repeat";
//     document.querySelector('body').style.backgroundSize="cover";
//     document.querySelector('body').style.width= "100%";
//     document.querySelector('body').style.height="100%";
//     document.querySelector('body').style.backgroundPosition="fixed";
//     document.getElementById("logo_dark").src= "img/logo_login_dark.svg";
//   }
//   firebase.auth().onAuthStateChanged(function (user) {
//     if (!user) return;
//     setTimeout(() => {
//       const queryParams = new URLSearchParams(window.location.search);
//       // after login send custom events to fb analytics and firebase analytics
//       if (authentication && !authentication.additionalUserInfo.isNewUser) {
//         logReportEvent("login");
//         logFirebaseAnlyticsEvent("login", {
//           method: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//         });

//         if (queryParams && queryParams.has('re_auth')) {
//           return redirect(`/profile_edit.html?email=${queryParams.get('email')}`)
//         }

//         return redirect(
//           `/index.html${
//               window.location.search ? `${window.location.search}` : ""
//             }`
//         );
//       }

//       firebase
//         .auth()
//         .currentUser.getIdTokenResult()
//         .then(function (tokenResult) {

//           if (isAdmin(tokenResult)) {
//             logReportEvent("Sign Up Admin");
//             setFirebaseAnalyticsUserProperty("isAdmin", "true");
//           } else {
//             logReportEvent("Sign Up");
//           }
//           const signUpParams = {
//             method: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//           };

//           if (queryParams) {
//             signUpParams.source = queryParams.get("utm_source");
//             signUpParams.medium = queryParams.get("utm_medium");
//             signUpParams.campaign = queryParams.get("utm_campaign");
//           }
//           logFirebaseAnlyticsEvent("sign_up", signUpParams);
//           if (queryParams && queryParams.has('re_auth')) {
//             return redirect(`/profile_edit`)
//           }
//           redirect(
//             `/index.html${
//                 window.location.search ? `${window.location.search}` : ""
//               }`
//           );
//         });
//     }, 1500)
//   });
// });


// function isPossiblyValidPhoneNumber(string) {
//   return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(string);
// }

// function phone_validation() {
//   var phoneNumber = document.getElementById("phoneNumber").value;
//   var alert_text = document.getElementById("alert_message");
//   if (!isPossiblyValidPhoneNumber(phoneNumber.trim())) {
//     alert_text.style.display = "block";
//     return;
//   } else {
//     alert_text.style.display = "none";
//     submitPhoneNumberAuth();
//   }
// }

// //This Sends the Otp to the Mobile
// function submitPhoneNumberAuth() {
//   var phoneNumber = document.getElementById("phoneNumber").value;
//   //Country Code appending
//   phoneNumber = "+91" + phoneNumber;
//   var appVerifier = window.recaptchaVerifier;
//   firebase
//     .auth()
//     .signInWithPhoneNumber(phoneNumber, appVerifier)
//     .then(function (confirmationResult) {
//       window.confirmationResult = confirmationResult;
//       document.getElementById("login_section").style.display = "none";
//       document.getElementById("otp_section").style.display = "block";
//       // countdown();
//     })
//     .catch(function (error) {
//       console.log(error);
//     });
// }

// //OTP input in different boxes
// function inputInsideOtpInput(el) {
//   if (el.value.length > 1) {
//     el.value = el.value[el.value.length - 1];
//   }
//   try {
//     if (el.value == null || el.value == "") {
//       //   this.foucusOnInput(el.previousElementSibling);
//     } else {
//       this.foucusOnInput(el.nextElementSibling);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }

// function foucusOnInput(ele) {
//   ele.focus();
//   let val = ele.value;
//   ele.value = "";
//   // ele.value = val;
//   setTimeout(() => {
//     ele.value = val;
//   });
// }

// function collect_otp() {
//   document.getElementById("code").value =
//     document.getElementById("otp1").value +
//     document.getElementById("otp2").value +
//     document.getElementById("otp3").value +
//     document.getElementById("otp4").value +
//     document.getElementById("otp5").value +
//     document.getElementById("otp6").value;

//   submitPhoneNumberAuthCode();
// }

// function goback2(event) {

//   var key = event.keyCode || event.charCode;
//   if (key == 8) {
//     document.getElementById("otp1").focus();
//   }
// }

// function goback3(event) {

//   var key = event.keyCode || event.charCode;
//   if (key == 8) {
//     document.getElementById("otp2").focus();
//   }
// }

// function goback4(event) {

//   var key = event.keyCode || event.charCode;
//   if (key == 8) {
//     document.getElementById("otp3").focus();
//   }
// }

// function goback5(event) {

//   var key = event.keyCode || event.charCode;
//   if (key == 8) {
//     document.getElementById("otp4").focus();
//   }
// }

// function goback6(event) {

//   var key = event.keyCode || event.charCode;
//   if (key == 8) {
//     document.getElementById("otp6").value = "";
//     document.getElementById("otp5").focus();
//   }
// }



// //This Verifies The otp
// function submitPhoneNumberAuthCode() {
//   var code = document.getElementById("code").value;
//   confirmationResult
//     .confirm(code)
//     .then(function (authResult) {
//       console.log(window.location.search);
//       authentication = authResult;
//     })
//     .catch(function (error) {
//       console.error(error);
//       alert(error);
//     });
// }

// var input = document.querySelector("#phoneNumber");
// window.intlTelInput(input, {
//   initialCountry: "IN",
//   formatOnDisplay: true,
//   separateDialCode: true,
//   utilsScript: "external/js/utils.js",
// });


