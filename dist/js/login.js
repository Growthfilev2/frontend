window.addEventListener('load', function () {
  if (localStorage.getItem('mode') === 'dark') {
    document.querySelector('body').style.backgroundImage = "url(../img/login_background_dark.svg)";
    document.querySelector('body').style.position = "fixed";
    document.querySelector('body').style.backgroundRepeat = "no-repeat";
    document.querySelector('body').style.backgroundSize = "cover";
    document.querySelector('body').style.width = "100%";
    document.querySelector('body').style.height = "100%";
    document.querySelector('body').style.backgroundPosition = "fixed";
    document.getElementById("logo_dark").src = "img/logo_login_dark.svg";
  }
});
var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', {
  signInOptions: [{
    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    recaptchaParameters: {
      type: 'image',
      // 'audio'
      size: 'normal',
      // 'invisible' or 'compact'
      badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.

    },
    defaultCountry: 'IN'
  }]
});
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function signInSuccessWithAuthResult(authResult, redirectUrl) {
      setTimeout(function () {
        var queryParams = new URLSearchParams(window.location.search); // after login send custom events to fb analytics and firebase analytics

        if (authResult && !authResult.additionalUserInfo.isNewUser) {
          logReportEvent("login");
          logFirebaseAnlyticsEvent("login", {
            method: firebase.auth.PhoneAuthProvider.PROVIDER_ID
          });

          if (queryParams && queryParams.has('re_auth')) {
            return redirect("/profile_edit.html?email=".concat(queryParams.get('email')));
          }

          return redirect("/index.html".concat(window.location.search ? "".concat(window.location.search) : ""));
        }

        firebase.auth().currentUser.getIdTokenResult().then(function (tokenResult) {
          if (isAdmin(tokenResult)) {
            logReportEvent("Sign Up Admin");
            setFirebaseAnalyticsUserProperty("isAdmin", "true");
          } else {
            logReportEvent("Sign Up");
          }

          var signUpParams = {
            method: firebase.auth.PhoneAuthProvider.PROVIDER_ID
          };

          if (queryParams) {
            signUpParams.source = queryParams.get("utm_source");
            signUpParams.medium = queryParams.get("utm_medium");
            signUpParams.campaign = queryParams.get("utm_campaign");
          }

          logFirebaseAnlyticsEvent("sign_up", signUpParams);

          if (queryParams && queryParams.has('re_auth')) {
            return redirect("/profile_edit");
          }

          redirect("/index.html".concat(window.location.search ? "".concat(window.location.search) : ""));
        });
      }, 1500);
      return false;
    },
    uiShown: function uiShown() {
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