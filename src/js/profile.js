let db;
const logout = document.getElementById("logout");

navigator.serviceWorker.onmessage = (event) => {
  console.log("message from worker", event.data);
};

document.querySelector('.profile-head').addEventListener('click', (ev) => {
  redirect('/profile_edit')
})
document.getElementById('file').addEventListener('change', (ev) => {
  getImageBase64(ev).then(base64 => {
    document.getElementById('output').src = base64;
    snacks('Uploading profile image ...')
    requestCreator('backblaze', {
      imageBase64: base64
    }).then(() => {
      firebase.auth().currentUser.reload();
      snacks('Profile image uploaded')
    })
  })
})

window.addEventListener("load", (ev) => {
  firebase.auth().onAuthStateChanged((user) => {
    loadProfileData(user)
  });
  logout.addEventListener('click', (e) => {
    e.preventDefault();
    firebase.auth().signOut().then(() => {

      initApp();
    })
  })
});


const loadProfileData = (user) => {

  const req = window.indexedDB.open(user.uid);
  req.onsuccess = function (e) {
    db = req.result;

    getRootRecord().then(record => {
      document.getElementById("output").src =
        user.photoURL ||
        firstletter(user.displayName.charAt(0));

      document.getElementById(
        "name"
      ).innerHTML = user.displayName;

      document.getElementById(
        "mobile"
      ).innerHTML = user.phoneNumber;

      document.getElementById("email").innerHTML =
        user.email || "-";

      // document.getElementById(
      //   "mobile_number"
      // ).innerHTML = user.phoneNumber;
      const profileVerificationPercentage = calculateProfileVerification(record);

      if (profileVerificationPercentage == 100) return;

      document.querySelector('.percentage').textContent = `${profileVerificationPercentage}%`;
      document.querySelector('.profile-completion').classList.remove('hidden')
      document.getElementById('progress-bar').style.width = `${profileVerificationPercentage}%`;

      const profileBtnsCont = document.getElementById('profile-completion-buttons')
      if (!record.linkedAccount) {
        profileBtnsCont.appendChild(createProfileBtn('Add bank account', './profile_bank'))
      }
      if (!record.pan) {
        profileBtnsCont.appendChild(createProfileBtn('Add pan card', './profile_pan'))
      }
      if (!record.linkedAccount) {
        profileBtnsCont.appendChild(createProfileBtn('Add aadhar card', './profile_aadhar'))
      }
    })

    db.transaction('children').objectStore('children').index('employees').get(user.phoneNumber).onsuccess = function (e) {
      const record = e.target.result;
      document.getElementById('employee-at').textContent = record.attachment.Designation.value ? `${record.attachment.Designation.value}, ${record.office}` : record.office;
      document.getElementById('employee-meta').href = `${document.getElementById('employee-meta').href}?id=${record.activityId}`;
    }
  };

}




const createProfileBtn = (name, href) => {
  const a = createElement('a', {
    href: href,
    className: 'mdc-button mdc-button--raised',
  })
  const label = createElement('span', {
    className: 'mdc-button--label',
    textContent: name
  })

  // new mdc.ripple.MDCRipple(a);
  a.appendChild(label)
  return a;
}

const calculateProfileVerification = (rootRecord) => {
  const fields = [rootRecord.linkedAccount, rootRecord.pan, rootRecord.aadhar];
  return ((fields.filter(value => value).length / fields.length) * 100).toFixed(0)
}



const firstletter = (A) => {
  var pfp = A.toUpperCase();
  document.getElementById("output").style.display = "none";
  document.getElementById("no_output").style.display = "block"
  document.getElementById("no_output").innerHTML = pfp;
}