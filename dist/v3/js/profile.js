var db;
var logout = document.getElementById("logout");

navigator.serviceWorker.onmessage = function (event) {
  console.log("message from worker", event.data);
};

document.querySelector('.profile-head').addEventListener('click', function (ev) {
  redirect('/profile_edit');
});
document.getElementById('file').addEventListener('change', function (ev) {
  getImageBase64(ev).then(function (base64) {
    document.getElementById('output').src = base64;
    snacks('Uploading profile image ...');
    requestCreator('backblaze', {
      imageBase64: base64
    }).then(function () {
      firebase.auth().currentUser.reload();
      snacks('Profile image uploaded');
    });
  });
});
window.addEventListener("load", function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    loadProfileData(user);
  });
  logout.addEventListener('click', function (e) {
    e.preventDefault();
    firebase.auth().signOut().then(function () {
      initApp();
    });
  });
});

var loadProfileData = function loadProfileData(user) {
  var req = window.indexedDB.open(user.uid);

  req.onsuccess = function (e) {
    db = req.result;
    getRootRecord().then(function (record) {
      document.getElementById("output").src = user.photoURL || './img/ic_pic_upload.png';
      document.getElementById("name").innerHTML = user.displayName;
      document.getElementById("mobile").innerHTML = user.phoneNumber;
      document.getElementById("email").innerHTML = user.email || "-"; // document.getElementById(
      //   "mobile_number"
      // ).innerHTML = user.phoneNumber;

      var profileVerificationPercentage = calculateProfileVerification(record);
      if (profileVerificationPercentage == 100) return;
      document.querySelector('.percentage').textContent = "".concat(profileVerificationPercentage, "%");
      document.querySelector('.profile-completion').classList.remove('hidden');
      document.getElementById('progress-bar').style.width = "".concat(profileVerificationPercentage, "%");
      var profileBtnsCont = document.getElementById('profile-completion-buttons');

      if (!hasBankAccount(record)) {
        profileBtnsCont.appendChild(createProfileBtn('Add bank account', './profile_bank_show.html'));
      }

      if (!record.pan) {
        profileBtnsCont.appendChild(createProfileBtn('Add pan card', './profile_pan.html'));
      }

      if (!record.aadhar) {
        profileBtnsCont.appendChild(createProfileBtn('Add aadhar card', './profile_aadhaar.html'));
      }
    });

    db.transaction('children').objectStore('children').index('employees').get(user.phoneNumber).onsuccess = function (e) {
      var record = e.target.result;
      document.getElementById('employee-at').textContent = record.attachment.Designation.value ? "".concat(record.attachment.Designation.value, ", ").concat(record.office) : record.office;
      document.getElementById('employee-meta').href = "".concat(document.getElementById('employee-meta').href, "?id=").concat(record.activityId);
    };
  };
};

var createProfileBtn = function createProfileBtn(name, href) {
  var a = createElement('a', {
    href: href,
    className: 'mdc-button mdc-button--raised'
  });
  var label = createElement('span', {
    className: 'mdc-button--label',
    textContent: name
  }); // new mdc.ripple.MDCRipple(a);

  a.appendChild(label);
  return a;
};

var calculateProfileVerification = function calculateProfileVerification(rootRecord) {
  var fields = [rootRecord.linkedAccounts, rootRecord.pan, rootRecord.aadhar];
  return (fields.filter(function (value) {
    return value;
  }).length / fields.length * 100).toFixed(0);
};