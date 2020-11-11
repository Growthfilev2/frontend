var database;
window.addEventListener("load", function (ev) {
  var parsed_valued = sessionStorage.getItem("passing_duty");
  var jobview_duty = JSON.parse(parsed_valued);
  firebase.auth().onAuthStateChanged(function (user) {
    var dbName = firebase.auth().currentUser.uid;
    var request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };

    request.onsuccess = function (event) {
      db = event.target.result; //  currenDuty();

      checkins_box(jobview_duty);
    };
  });
  var Header = moment(jobview_duty.timestamp); // 1

  document.getElementById("header_date").innerHTML = Header.format("DD MMMM YYYY");
  sessionStorage.clear();
});

function checkins_box(duty) {
  if (duty.header == "CurrentDuty") {
    document.getElementById("current_duty_heading").innerHTML = "Current Duty";
  }

  showDuty_card(duty);
  var timestamp_aray = [];

  for (i = 0; i < duty.checkins.length; i++) {
    timestamp_aray.push(duty.checkins[i].timestamp);
  } //Unique Timestamp Trying


  var unique = timestamp_aray.filter(onlyUnique);
  console.log(unique);

  for (var x = 0; x < unique.length; x++) {
    var div = createElement("div", {
      className: "containers",
      style: "display:inline;"
    });
    div.innerHTML = "<div id=\"container\"> ".concat(moment(unique[x]).format("hh:mm A"), " </div>");
    document.getElementById("time").appendChild(div);
  } //Checkins Photo


  for (i = 0; i < duty.checkins.length; i++) {
    // duty.checkins[i].attachment.Photo.value = "https://www.sammobile.com/wp-content/uploads/2019/03/keyguard_default_wallpaper.png";
    if (duty.checkins[i].attachment.Photo.value) {
      var photos = createElement("div", {
        className: "upload_photo"
      });
      photos.innerHTML = "<div id=\"photo_section\"><div id=\"photo\" ><img id=\"one_pic\" src=\"".concat(duty.checkins[i].attachment.Photo.value, "\" alt=\"\" width=\"160px\"\n      height=\"94px\"></div>\n      <span class=\"material-icons\" id=\"gallery_logo\">\n      insert_photo\n      </span>\n      <span id=\"timestamp_below\">").concat(moment(duty.checkins[i].timestamp).format("HH:mm A"), "</span></div>");
      document.getElementById("upload_pics").appendChild(photos);
    }
  }

  console.log(duty);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}