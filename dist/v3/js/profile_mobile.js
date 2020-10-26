var db;

navigator.serviceWorker.onmessage = function (event) {
  console.log("message from worker", event.data);
};

window.addEventListener("load", function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function (e) {
      db = req.result;

      db.transaction("root").objectStore("root").get(user.uid).onsuccess = function (e) {};
    };
  });
});

function isPossiblyValidPhoneNumber(string) {
  return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(string);
}

function checknumber() {
  var mobileNumber = document.getElementById("mobile").value;
  var alert_text = document.getElementById("alert_text1");

  if (!isPossiblyValidPhoneNumber(mobileNumber.trim())) {
    alert_text.style.display = "block";
    document.getElementById("alert_text").style.display = "none";
    return;
  } else {
    alert_text.style.display = "none";
    var number_value = firebase.auth().currentUser.phoneNumber;

    if (number_value == "+91" + document.getElementById("mobile").value) {
      document.getElementById("alert_text").style.display = "block";
    } else {
      document.getElementById("alert_text").style.display = "none";
    }
  }
}