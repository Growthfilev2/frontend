var db;
var nameField;
var photo;
var emailField;
var submitBtn = document.getElementById('submit-btn');
var profileImage = document.getElementById('profile-image');
document.getElementById('upload-image').addEventListener('change', function (ev) {
  getImageBase64(ev).then(function (base64) {
    profileImage.src = base64;
  });
});
window.addEventListener("load", function (ev) {
  window.mdc.autoInit();
  var searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has('askPhoto')) {
    document.querySelector('.form-field.photo').classList.remove('hidden');
  }

  nameField = document.getElementById('name').MDCTextField;
  emailField = document.getElementById('email').MDCTextField;
  firebase.auth().onAuthStateChanged(function (user) {
    // loadProfileData(user)
    nameField.value = user.displayName;
    emailField.value = getUserEmail(user);
    profileImage.src = user.photoURL || '';
    document.getElementById('profile-form').addEventListener('submit', function (ev) {
      ev.preventDefault();

      if (!emailReg(emailField.value)) {
        setHelperInvalid(emailField, 'Incorrect email');
        return;
      }

      submitBtn.classList.add('in-progress');
      var prom;
      var trimmedName = nameField.value.split(" ").filter(function (v) {
        return v;
      }).join(" ");

      if (trimmedName === user.displayName) {
        prom = Promise.resolve();
      } else {
        prom = user.updateProfile({
          displayName: trimmedName
        });
      }

      prom.then(function () {
        console.log('name updated');

        if (user.photoURL !== document.getElementById('profile-image').src) {
          requestCreator('backblaze', {
            imageBase64: document.getElementById('profile-image').src
          });
          return;
        }

        return Promise.resolve();
      }).then(function () {
        console.log('photo updated');
        if (user.email === emailField.value) return Promise.resolve(true);
        return user.updateEmail(emailField.value);
      }).then(function (oldEmail) {
        console.log(oldEmail);

        if (oldEmail) {
          return Promise.resolve(true);
        }

        console.log('email updated');
        return user.sendEmailVerification();
      }).then(function (oldVerification) {
        console.log(oldVerification);
        var timeout = 1;

        if (!oldVerification) {
          timeout = 5000;
          console.log('email verification send');
          snacks('A verification mail has been sent to your inbox. Please click on the link in it to verify your email ID.', 6000);
        }

        setTimeout(function () {
          submitBtn.classList.remove('in-progress');
          if (searchParams.get('new_user') === "true") return redirect('/home');
          snacks('Profile updated');
        }, timeout);
      })["catch"](function (error) {
        submitBtn.classList.remove('in-progress');

        if (error.code === 'auth/requires-recent-login') {
          var dialog = new mdc.dialog.MDCDialog(document.getElementById('email-dialog'));
          dialog.listen('MDCDialog:closed', function (evt) {
            if (evt.detail.action !== 'accept') return;
            revokeSession(emailField.value);
          });
          dialog.open();
          return;
        }

        snacks(error.message);
      });
    });
  });
});

var getUserEmail = function getUserEmail(user) {
  var searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has('email')) {
    return searchParams.get('email');
  }

  return user.email;
};

var getFirstName = function getFirstName(string) {
  if (!string) return "";
  return string.split(" ")[0];
};

var getLastName = function getLastName(string) {
  if (!string) return "";
  var split = string.split(" ");
  split.shift();
  return split.join(" ");
};

var emailReg = function emailReg(email) {
  var emailRegString = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegString.test(String(email).toLowerCase());
};

var revokeSession = function revokeSession(email) {
  firebase.auth().signOut().then(function () {
    redirect("/login?re_auth=1&email=".concat(encodeURIComponent(email)));
  })["catch"](function (error) {
    handleError({
      message: 'Sign out error',
      body: error
    });
  });
};