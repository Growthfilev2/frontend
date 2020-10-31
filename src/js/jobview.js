var database;

window.addEventListener("load", (ev) => {
  var parsed_valued = sessionStorage.getItem("passing_duty");
  var jobview_duty = JSON.parse(parsed_valued);

  firebase.auth().onAuthStateChanged((user) => {
    const dbName = firebase.auth().currentUser.uid;
    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function (event) {
      db = event.target.result;

    //  currenDuty();
      checkins_box(jobview_duty);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
    };
  });
  console.log(jobview_duty.timestamp);

  var header = moment(jobview_duty.timestamp);
  // 1

  document.getElementById("header_date").innerHTML = header.format(
    "DD MMMM YYYY"
  );
});

// function currenDuty() {
//   getCurrentJob().then((record) => {
//     if (!record.activityId || record.finished == true) {
    
//       document.getElementById("current_duty_card").style.display = "none";

//       return;
//     }

//     if (record.activityId) {
//       document.getElementById("current_duty_heading").innerHTML = "Current Duty";
//         }

//     document.getElementById("current_location").innerHTML =
//       record.attachment.Location.value;
//     //console.log(record);
//     document.getElementById("starting_time").innerHTML = moment(
//       record.schedule[0].startTime
//     ).format("hh:mm A");

//     if (record.schedule[0].endTime !== record.schedule[0].startTime) {
//       document
//         .querySelector(".active-duty--duration")
//         .classList.remove("hidden");
//       document.getElementById("total_time").innerHTML = moment
//         .utc(
//           moment(record.schedule[0].endTime).diff(
//             moment(record.schedule[0].startTime)
//           )
//         )
//         .format("HH:mm");
//     }

//     if (record.assignees[0].displayName) {
//       document.getElementById("assignees_name").innerHTML =
//         record.assignees[0].displayName;
//     } else {
//       document.getElementById("assignees_name").innerHTML =
//         record.assignees[0].phoneNumber;
//     }

//     if (record.assignees.length > 1) {
//       if (record.assignees.length == 2) {
//         document.getElementById("other_assignees").innerHTML =
//           "  &" + record.assignees.length - 1 + "Other";
//       } else {
//         document.getElementById("other_assignees").innerHTML =
//           "  &" + record.assignees.length - 1 + "Others";
//       }
//     }

//     document.getElementById("assignees_pic").src = record.assignees[0].photoURL;
//   });
// }

function checkins_box(duty) {

if(duty.header == 'CurrentDuty'){
  document.getElementById("current_duty_heading").innerHTML = 'Current Duty';
}
  

  document.getElementById("current_location").innerHTML =
  duty.attachment.Location.value;
//console.log(record);
document.getElementById("starting_time").innerHTML = moment(
  duty.schedule[0].startTime
).format("hh:mm A");

document.getElementById("ending_time").innerHTML = moment(
  duty.schedule[0].endTime
).format("hh:mm A");

if (duty.schedule[0].endTime !== duty.schedule[0].startTime) {
  document
    .querySelector(".active-duty--duration")
    .classList.remove("hidden");
  document.getElementById("total_time").innerHTML = moment
    .utc(
      moment(duty.schedule[0].endTime  - duty.schedule[0].startTime
      )
    )
    .format("HH:mm");
}

if (duty.assignees[0].displayName) {
  document.getElementById("assignees_name").innerHTML =
    duty.assignees[0].displayName;
} else {
  document.getElementById("assignees_name").innerHTML =
    duty.assignees[0].phoneNumber;
}

if (duty.assignees.length > 1) {
  if (duty.assignees.length == 2) {
    document.getElementById("other_assignees").innerHTML =
      "  &" + duty.assignees.length - 1 + "Other";
  } else {
    document.getElementById("other_assignees").innerHTML =
      "  &" + duty.assignees.length - 1 + "Others";
  }
}

document.getElementById("assignees_pic").src = duty.assignees[0].photoURL;



  for (i = 0; i < duty.checkins.length; i++) {
    duty.checkins[i].attachment.Photo.value =
      "https://www.sammobile.com/wp-content/uploads/2019/03/keyguard_default_wallpaper.png";

    var div = createElement("div", {
      className: "containers",
      style: "display:inline;",
    });



    div.innerHTML = `<div id="container"> ${moment(
      duty.checkins[i].timestamp
    ).format("hh:mm A")} </div>`;

    document.getElementById("time").appendChild(div);

      var photos = createElement("div", {
        className: "upload_photo"
       
      })

      photos.innerHTML = `<div id="photo_section"><div id="photo"><img id="one_pic" src="${duty.checkins[i].attachment.Photo.value}" alt="" width="160px"
      height="94px"></div>
      <span class="material-icons" id="gallery_logo">
      insert_photo
      </span>
<span id="timestamp_below">${moment(
  duty.checkins[i].timestamp
).format("HH:mm A")}</span></div>`

      document.getElementById("upload_pics").appendChild(photos);


  }

  console.log(duty);
}
