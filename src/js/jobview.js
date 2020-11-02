var database;

window.addEventListener("load", (ev) => {
  var parsed_valued = sessionStorage.getItem("passing_duty");
  var jobview_duty = JSON.parse(parsed_valued);

  var parsed_header = sessionStorage.getItem("passing_header");
  var header = JSON.parse(parsed_header)
  console.log(header)

  firebase.auth().onAuthStateChanged((user) => {
    const dbName = firebase.auth().currentUser.uid;
    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function (event) {
      db = event.target.result;

      //  currenDuty();
      checkins_box(jobview_duty,header);
    };
  });
 

  var Header = moment(jobview_duty.timestamp);
  // 1

  document.getElementById("header_date").innerHTML = Header.format(
    "DD MMMM YYYY"
  );

 sessionStorage.clear();
});

function checkins_box(duty,header) {
  
  if(header){
  if (header.header == "CurrentDuty") {
    document.getElementById("current_duty_heading").innerHTML = "Current Duty";
  }}

  showDuty_card(duty);

  for (i = 0; i < duty.checkins.length; i++) {
  //  duty.checkins[i].attachment.Photo.value = "https://www.sammobile.com/wp-content/uploads/2019/03/keyguard_default_wallpaper.png";

    if (i < 1) {
      var div = createElement("div", {
        className: "containers",
        style: "display:inline;",
      });

      div.innerHTML = `<div id="container"> ${moment(
        duty.checkins[i].timestamp
      ).format("hh:mm A")} </div>`;

      document.getElementById("time").appendChild(div);
    } else {
      if (duty.checkins[i - 1].timestamp != duty.checkins[i].timestamp) {
        var div = createElement("div", {
          className: "containers",
          style: "display:inline;",
        });

        div.innerHTML = `<div id="container"> ${moment(
          duty.checkins[i].timestamp
        ).format("hh:mm A")} </div>`;

        document.getElementById("time").appendChild(div);
      }
    }
    if (duty.checkins[i].attachment.Photo.value) {
      var photos = createElement("div", {
        className: "upload_photo",
      });

      photos.innerHTML = `<div id="photo_section"><div id="photo" ><img id="one_pic" src="${
        duty.checkins[i].attachment.Photo.value
      }" alt="" width="160px"
      height="94px"></div>
      <span class="material-icons" id="gallery_logo">
      insert_photo
      </span>
      <span id="timestamp_below">${moment(duty.checkins[i].timestamp).format(
        "HH:mm A"
      )}</span></div>`;

      document.getElementById("upload_pics").appendChild(photos);
    }
  }

  console.log(duty);
}
