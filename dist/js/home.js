var database;

navigator.serviceWorker.onmessage = function (event) {
  console.log("message from worker", event.data);

  if (event.data.type === "error") {
    handleError(event.data);
    return;
  }

  var readResponse = event.data; // if new checkin subscriptions comes then update the db

  getCheckInSubs().then(function (checkInSubs) {
    ApplicationState.officeWithCheckInSubs = checkInSubs;
    localStorage.setItem("ApplicationState", JSON.stringify(ApplicationState));
  });

  if (readResponse.activities.some(function (activity) {
    return activity.template === "duty";
  })) {
    if (document.getElementById("duties-list")) {
      document.getElementById("duties-list").innerHTML = "";
      firebase.auth().onAuthStateChanged(function (user) {
        var dbName = firebase.auth().currentUser.uid;
        var request = window.indexedDB.open(dbName, DB_VERSION);

        request.onerror = function (event) {
          console.log("Why didn't you allow my web app to use IndexedDB?!");
        };

        request.onsuccess = function (event) {
          db = event.target.result;
          readduty();
        };
      });
    }
  }

  var dutyLocations = [];
  var prom = Promise.resolve([ApplicationState.venue]); // is user created a checkin from unknown location then venue in application state will be empty
  // if its empty then find all the nearest locations

  if (!ApplicationState.venue) {
    var offsetBounds = new GetOffsetBounds(ApplicationState.location, 1);
    prom = loadNearByLocations({
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    }, ApplicationState.location);
  }

  prom.then(function (locations) {
    locations.forEach(function (location) {
      location.distance = calculateDistanceBetweenTwoPoints(location, ApplicationState.location);
      dutyLocations.push(location);
    }); // if there are locatiosn nearby, then sort the locatiuns by distance in asc order

    if (dutyLocations.length) {
      var sorted = dutyLocations.sort(function (a, b) {
        return a.distance - b.distance;
      }); // update application state and set the new venue

      ApplicationState.venue = sorted[0];
      console.log(sorted[0]);
      localStorage.setItem("ApplicationState", JSON.stringify(ApplicationState));
      read();
    }
  });
};

window.addEventListener("load", function (ev) {
  console.log(moment().format("hh:mm"));
  firebase.auth().onAuthStateChanged(function (user) {
    var dbName = firebase.auth().currentUser.uid;
    var request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      document.getElementById("pfp").src = firebase.auth().currentUser.photoURL || "./img/ic_pic_upload.png";
      document.getElementById("photo-upload-btn").addEventListener("click", function () {
        openCamera();
      });
      read();
      readduty();
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
    };
  });
});

function read() {
  getCurrentJob().then(function (record) {
    if (!record.activityId || record.finished == true) {
      document.getElementById("current_duty_card").style.display = "none";
      return;
    }

    if (record.activityId) {
      document.getElementById("current_duty_card").style.display = "flex";
      document.getElementById("location_icon").style.color = "var(--mdc-theme-primary)";
      document.getElementById("builder_icon").style.color = "var(--mdc-theme-primary)";
      document.getElementById("timer_icon").style.color = "var(--mdc-theme-primary)";
    }

    record.header = "CurrentDuty";
    document.getElementById("current_location").addEventListener("click", function (e) {
      e.stopPropagation();
      passDuty(record);
    });
    showDuty_card(record);
    console.log(record);
    document.getElementById("finish").addEventListener("click", function () {
      document.getElementById("blur").style.display = "block";
      document.getElementById("comformation_box").style.display = "block"; // current_date = new Date();
      // current_time = current_date.getTime();
      // time= moment(current_time).format("hh:mm A")

      document.getElementById("current_time").innerHTML = "Time: " + moment().format("hh:mm A");
      document.getElementById("finish_location").innerHTML = "Location: " + record.attachment.Location.value; // console.log(record.attachment.Location.value);
    });
    document.getElementById("yes_finish").addEventListener("click", function () {
      var tx = db.transaction("activity", "readwrite");
      var objecstore = tx.objectStore("activity");
      record.finished = true;
      objecstore.put(record);

      tx.oncomplete = function () {
        document.getElementById("current_duty_card").style.display = "none";
        document.getElementById("blur").style.display = "none";
        document.getElementById("comformation_box").style.display = "none";
        console.log(record);
      };
    });
    document.getElementById("no_hide").addEventListener("click", function () {
      document.getElementById("comformation_box").style.display = "none";
      document.getElementById("blur").style.display = "none";
    });
  });
}

function readduty() {
  var duties = [];
  var timestamp_array = [];
  var transaction = db.transaction("activity");
  var store = transaction.objectStore("activity"); // open cursor on activity object store's index template
  // pass duty as template , this will return all duty activites

  var dateObjects = {};

  store.index("template").openCursor("duty").onsuccess = function (evt) {
    var cursor = evt.target.result;
    if (!cursor) return; // if duty doesn't have a schedule , ignore and continue

    if (!Array.isArray(cursor.value.schedule)) {
      cursor["continue"]();
      return;
    } // if duty doesn't have a start and end time , ignore and continue


    if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
      cursor["continue"]();
      return;
    }

    if (cursor.value.schedule[0].startTime == cursor.value.schedule[0].endTime) {
      cursor["continue"]();
      return;
    }

    if (cursor.value.isActive == false) {
      cursor["continue"]();
      return;
    }

    if (cursor.value.isActive == false) {
      cursor["continue"]();
      return;
    }

    if (cursor.value.finished == false) {
      cursor["continue"]();
      return;
    }

    if (!cursor.value.checkins) {
      cursor["continue"]();
      return;
    } // if activity's office doesn't match the selected office during checkin , then ignore and continue
    // if (cursor.value.office !== ApplicationState.selectedOffice) {
    //     cursor.continue();
    //     return
    // }


    timestamp_array.push(cursor.value.timestamp);
    duties.push(cursor.value);
    cursor["continue"]();
  };

  transaction.oncomplete = function () {
    var DT = {}; // sort by desciding order;

    var sorted = duties.sort(function (b, a) {
      return b.timestamp - a.timestamp;
    }); // create an object where key is month+year combo and its value is an array of duty objects

    sorted.forEach(function (duty) {
      var date = new Date(duty.timestamp);

      if (DT["".concat(date.getMonth()).concat(date.getFullYear())]) {
        DT["".concat(date.getMonth()).concat(date.getFullYear())].push(duty);
      } else {
        DT["".concat(date.getMonth()).concat(date.getFullYear())] = [duty];
      }
    });
    console.log(DT);
    var months = Object.keys(dateObjects);
    var date_objects = {}; // loop through the object and caluclate total hours, total locations and total hours worked
    // for each date

    Object.keys(DT).forEach(function (key) {
      var totalDuties = 0;
      var totalHoursWorked = 0;
      var totalLocationsString = "";
      var currentDate;
      var activities = [];
      DT[key].forEach(function (activity) {
        // if current Date is not equal to the activity date then
        // reset the variable count
        if (currentDate !== moment(activity.timestamp).format("DD/MM/YYYY")) {
          totalDuties = 0;
          totalHoursWorked = 0;
          totalLocationsString = "";
          activities = [];
        }

        currentDate = moment(activity.timestamp).format("DD/MM/YYYY"); // increment the variables beacause all are of same date

        activities.push(activity);
        totalDuties++;
        totalLocationsString += activity.attachment.Location.value + " & "; // filter checkins where creator is self and sort in descinding order;

        var checkins = activity.checkins.filter(function (v) {
          return v.creator.phoneNumber === firebase.auth().currentUser.phoneNumber;
        }).sort(function (a, b) {
          return b.timestamp - a.timestamp;
        });

        if (checkins.length) {
          // use moment to calculate duration
          totalHoursWorked += checkins[0].timestamp - checkins[checkins.length - 1].timestamp;
        } // set the values in a new object


        date_objects[moment(activity.timestamp).format("DD/MM/YYYY")] = {
          totalDuties: totalDuties,
          totalLocationsString: totalLocationsString,
          totalHoursWorked: totalHoursWorked,
          activities: activities
        };
      });
    });
    console.log(date_objects);
    readallduties(date_objects);
  };
}

function readallduties(object_of_dates) {
  var keys = Object.keys(object_of_dates);
  var month;
  var monthCard;
  var daysWorkedInMonth = 0;
  var month_count = 0; // loop the new objects backwards

  var _loop = function _loop(i) {
    var date = keys[i]; // if month variable is not equal to current month value
    // create a new card

    if (month != moment(date, "DD/MM/YYYY").month()) {
      //Created an array to convert number into string
      first_month = new Date();
      current_month = first_month.getMonth();
      pre_month = current_month - 1;

      if (current_month == month) {
        monthCard.style.display = "block";
        document.getElementById("month_card2").style.backgroundColor = "var(--mdc-theme-primary)";
        document.getElementById("month_card2").style.color = "var(--mdc-theme-on-primary)";
        document.getElementById("arrow").style.color = "var(--mdc-theme-on-primary)";
      }

      if (pre_month == month) {
        monthCard.style.display = "block";
      }

      one_month = moment(date, "DD/MM/YYYY").format("MMMM");
      curent_year = moment(date, "DD/MM/YYYY").year();
      total_working_day = moment(date, "YYYY-MM").daysInMonth();
      monthCard = createElement("div", {
        className: "month-card",
        style: "display:none;",
        onclick: "arrow_f()"
      });
      monthCard.innerHTML = " <div  id=\"month_card2\" >\n                <div id=\"on_card2\">\n                <p id=\"month_date2\">".concat(one_month, " ").concat(curent_year, "</p>\n                \n                <p class=\"total-days-worked\"></p>\n                \n                <span class=\"material-icons arrow_class\" id=\"arrow\" >keyboard_arrow_down</span>\n                </div>\n               \n                </div>\n                ");
      daysWorkedInMonth = 0;
      month_count++;
    }

    daysWorkedInMonth++;
    monthCard.querySelector(".total-days-worked").innerHTML = "Days Worked: " + daysWorkedInMonth + " Days/ " + total_working_day + " Days";
    month = moment(date, "DD/MM/YYYY").month();

    if (current_month == month) {
      monthCard.style.display = "block";
      monthCard.querySelector("#month_card2").style.backgroundColor = "var(--mdc-theme-primary)";
      monthCard.querySelector("#month_card2").style.color = "var(--mdc-theme-on-primary)";
      monthCard.querySelector("#arrow").style.color = "var(--mdc-theme-on-primary)";
      monthCard.querySelector("#arrow").style.transform = "rotate(180deg)";
    } // Converted total work hours in to hours and minuts


    var card = createDateCard(date, object_of_dates); //Expanded first month

    monthCard.addEventListener("click", function (e) {
      // if(card.style.display == "flex"){
      //   document.getElementById("arrow").style.transform = "rotate(0deg)";
      // }else{
      document.getElementById("arrow").style.transform = "rotate(180deg)"; // }

      if (card.style.display == "flex") {
        card.style.display = "none";
        document.getElementById("arrow").style.transform = "rotate(0deg)"; //document.getElementsByClassName("arrow_class")[1].style.transform  = "rotate(0deg)";

        return;
      }

      card.style.display = "flex"; //  document.getElementById("arrow").style.transform = "rotate(180deg)";
      // document.getElementsByClassName("arrow_class")[1].style.transform  = "rotate(180deg)";
    }); // Added event listener on Date Card in order to create Sub Duty Divs

    card.addEventListener("click", function (e) {
      e.stopPropagation();

      if (card.querySelector(".duties-list").childElementCount) {
        card.querySelector(".duties-list").innerHTML = "";
        card.querySelector("#day_arrow").style.transform = "rotate(0deg)";
        return;
      }

      card.querySelector("#day_arrow").style.transform = "rotate(180deg)"; // For loop that reads individual duty in the specific [date]

      object_of_dates[date].activities.forEach(function (j) {
        card.querySelector(".duties-list").appendChild(subDuties(j)); // card.querySelector("#inner_location_icon").style.color= "#25456c";
        // card.querySelector("#inner_builder_icon").style.color= "#25456c";
        // card.querySelector("#inner_timer_icon").style.color= "#25456c";
      });
    });
    monthCard.appendChild(card);
    document.getElementById("duties-list").appendChild(monthCard);
    first_month = new Date();
    current_month = first_month.getMonth();

    if (moment(date, "DD/MM/YYYY").month() == current_month) {
      monthCard.style.display = "block";
      card.style.display = "flex";
    }
  };

  for (var i = keys.length - 1; i >= 0; i--) {
    var first_month;
    var current_month;
    var pre_month;
    var first_month;
    var current_month;

    _loop(i);
  }

  document.getElementById("show_more_b").addEventListener("click", function () {
    document.getElementById("show_more_b").style.display = "none";
    document.getElementById("show_less_b").style.display = "block";
    var show_all_card = document.querySelectorAll(".month-card");
    console.log(show_all_card.length);

    for (var i = 0; i < show_all_card.length; i++) {
      show_all_card[i].style.display = "block";
    }
  });
  document.getElementById("show_less_b").addEventListener("click", function () {
    document.getElementById("show_more_b").style.display = "block";
    document.getElementById("show_less_b").style.display = "none";
    var show_all_card = document.querySelectorAll(".month-card");
    console.log(show_all_card.length);

    for (var i = 2; i < show_all_card.length; i++) {
      show_all_card[i].style.display = "none";
    }
  });

  if (month_count < 3) {
    document.getElementById("show_more_b").style.display = "none";
    document.getElementById("show_less_b").style.display = "none";
  }
}

function createDateCard(date, object_of_dates) {
  var day = moment(date, "DD/MM/YYYY").format("ddd").toString().toUpperCase();
  var day_total_time = moment.duration(object_of_dates[date].totalHoursWorked);
  var trying = moment(date, "DD/MM/YYYY").format("D MM YYYY");
  var current_date = new Date();
  var cd = current_date.getDate();
  var cm = current_date.getMonth() + 1;
  var cy = current_date.getFullYear();
  var present_date = cd + " " + cm + " " + cy; // individual date cards in a date

  var card = createElement("div", {
    id: "collapsed2"
  });
  card.dataset.date = date;
  card.innerHTML = "\n  \n          <div id=\"date_day2\"> <p id=\"duty_date2\">".concat(date.slice(0, 2), "</p> <p id=\"duty_day2\">").concat(day, "</p></div>\n          <div id=\"duty_div2\">\n            <div id=\"collapsed_duty2\" >\n            <p><span id=\"current_location_icon\" class=\"material-icons-outlined\">\n            location_on\n            </span><span id=\"duty_address2\">").concat(object_of_dates[date].totalLocationsString.substring(0, 18) + "...", "  ").concat(object_of_dates[date].totalDuties == 1 ? " " : "& " + (object_of_dates[date].totalDuties - 1) + " Others", " </span>\n          </p>\n          <p>\n          \n            <span id=\"current_timer_icon\" class=\"material-icons-outlined\">\n            timer\n            </span><span id=\"total_hours2\">").concat(day_total_time.days() + "d " + day_total_time.hours() + "h " + day_total_time.minutes() + "m", "</span>&nbsp&nbsp&nbsp <span id=\"current_totaltime_icon\" class=\"material-icons-outlined\">\n            work_outline\n              </span><span id=\"total_duties2\"> ").concat(object_of_dates[date].totalDuties, "</span>\n              \n            </p>\n                  <p id=\"arrow_div\"><span class=\"material-icons\" id=\"day_arrow\">keyboard_arrow_down</span></p>\n            </div>\n                \n            <div><hr id=\"h_line\"><div id=\"circle\"></div></div> \n              <div class='duties-list'></div>\n          </div>\n          \n                \n          ");

  if (trying == present_date) {
    card.querySelector("#duty_date2").style.backgroundColor = "var(--mdc-theme-primary)";
    card.querySelector("#duty_date2").style.color = "var(--mdc-theme-on-primary)";
    card.querySelector("#current_location_icon").style.color = "var(--mdc-theme-primary)";
    card.querySelector("#current_totaltime_icon").style.color = "var(--mdc-theme-primary)";
    card.querySelector("#current_timer_icon").style.color = "var(--mdc-theme-primary)";
    card.querySelector("#h_line").style.color = "var(--mdc-theme-primary)";
    card.querySelector("#circle").style.backgroundColor = "var(--mdc-theme-primary)";
  }

  return card;
} // function addStyle(styles) {
//   /* Create style document */
//   var css = document.createElement('style');
//   css.type = 'text/css';
//   if (css.styleSheet)
//       css.styleSheet.cssText = styles;
//   else
//       css.appendChild(document.createTextNode(styles));
//   /* Append style to the tag name */
//   document.getElementsByTagName("head")[0].appendChild(css);
//   return ""
// }


function subDuties(j) {
  var diff = moment.utc(moment(j.schedule[0].endTime || "00").diff(moment(j.schedule[0].startTime))).format("HH:mm");
  var starttime = moment(j.schedule[0].startTime).format("hh:mm A");
  var endtime = moment(j.schedule[0].endTime).format("hh:mm A");
  var assignees_displayname = j.assignees[0].displayName;
  var assignees_phonenumber = j.assignees[0].phoneNumber;
  var assignees_photo = j.assignees[0].photoURL;
  var other_assignee = "";
  var and = "";

  if (j.assignees.length > 1) {
    and = "& ";

    if (j.assignees.length == 2) {
      other_assignee = +(j.assignees.length - 1) + " Other";
    } else {
      other_assignee = +(j.assignees.length - 1) + " Others";
    }
  }

  var collapsed = createElement("div", {
    id: "expended_duty",
    style: "display: block;"
  });
  collapsed.addEventListener("click", function (e) {
    e.stopPropagation();
    console.log(j);
    passDuty(j);
  });
  collapsed.innerHTML = "\n  <div id=\"individual_duty\">\n  \n              <p id=\"expended_location\">\n              <span id=\"inner_location_icon\" class=\"material-icons-outlined\"> location_on </span>&nbsp\n              &nbsp<span id=\"expended_location\">".concat(j.attachment.Location.value, "</span>\n            </p>\n    \n            <p id=\"expended_checkin_time\">\n              <span id=\"inner_builder_icon\" class=\"material-icons-outlined\"> query_builder </span>&nbsp\n              &nbsp<span id=\"expended_interval\">\n                <span id=\"expended_starting_time\">").concat(starttime, "</span>-\n                <span id=\"expended_ending_time\">").concat(endtime, "</span></span\n              >\n            </p>\n            <p id=\"expended_checkin_totaltime\">\n              <span id=\"inner_timer_icon\" class=\"material-icons-outlined\"> timer </span>&nbsp &nbsp<span\n                id=\"expended_total_time\"\n                >").concat(diff.slice(0, 2) + "h " + diff.slice(3, 5) + "m", "</span>\n            </p>\n          \n            <div style=\"display: flex;\"> \n            <div class=\"mdc-chip-set mdc-chip-set--filter\" role=\"grid\" id=\"assignees_div\">\n            <div class=\"mdc-chip\" id=\"assignees_div\" role=\"row\">\n              <div class=\"mdc-chip__ripple\"></div>\n              <i class=\"material-icons mdc-chip__icon mdc-chip__icon--leading\"><img id=\"assignees_pic\" src=\"").concat(assignees_photo, "\"  width=\"24px\" height=\"24px\"></i>\n              <span class=\"mdc-chip__checkmark\" >\n                <svg class=\"mdc-chip__checkmark-svg\" viewBox=\"-2 -3 30 30\">\n                  <path class=\"mdc-chip__checkmark-path\" fill=\"none\" stroke=\"black\"\n                        d=\"M1.73,12.91 8.1,19.28 22.79,4.59\"/>\n                </svg>\n              </span>\n              <span role=\"gridcell\">\n                <span role=\"checkbox\" tabindex=\"0\" aria-checked=\"false\" class=\"mdc-chip__primary-action\">\n                  <span class=\"mdc-chip__text\" id=\"assignees_name\">").concat(!assignees_displayname ? assignees_phonenumber : assignees_displayname, "</span>\n                </span>\n              </span>\n            </div>\n          \n          </div >\n          <span id=\"other_assignees\">").concat(and + " " + other_assignee, "</span>\n          <div id=\"duty_right_indicator\">\n          <span class=\"material-icons\">\n          keyboard_arrow_right\n          </span>\n          </div>\n          </div>\n          \n          </div>\n\n          <div><hr id=\"h_line\"><div id=\"circle\"></div></div> \n              ");
  return collapsed;
}

function openCamera() {
  if (_native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return;
  }

  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {
  var retries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    subscriptionRetry: 0,
    invalidRetry: 0
  };

  if (window.location.pathname.split("/").indexOf('upload-photo') == -1) {
    history.pushState(null, null, "/upload-photo");
  }

  var url = "data:image/jpg;base64,".concat(base64); // const url = firebase.auth().currentUser.photoURL;
  // const url = base64

  document.getElementById("app-current-panel").innerHTML = "\n  <div class='upload-photo-container'>\n     <div class='image-cont'><img id='checkin-photo'></div>\n     <div class='details pt-10'>\n        <span class='mdc-typography--caption'>Details</span>\n        <div class='mdc-typography--subtitle1'>".concat(moment().format("DDDD, MMMM MM,YYYY HH:mm"), "</div>\n        ").concat(ApplicationState.venue ? "<div class='mdc-typography--subtitle2'> ".concat(ApplicationState.venue.location, "</div>") : "", "\n        \n     </div>\n      <div class=\"form-meta snap-form\">\n      <label class=\"mdc-text-field mdc-text-field--outlined mdc-text-field--textarea mdc-text-field--no-label\" id=\"photo-text\">\n          <span class=\"mdc-text-field__resizer\">\n            <textarea id=\"description_box\" class=\"mdc-text-field__input\" rows=\"1\" cols=\"40\" aria-label=\"Label\" placeholder='Photo Description'></textarea>\n          </span>\n          <span class=\"mdc-notched-outline\">\n            <span class=\"mdc-notched-outline__leading\"></span>\n            <span class=\"mdc-notched-outline__trailing\"></span>\n          </span>\n    </label>\n        <button id='snap-submit' class=\"mdc-button mdc-button--raised form-submit-btn mt-10\">\n            <div class=\"dots\">\n                <div class=\"dot dot1\"></div>\n                <div class=\"dot dot2\"></div>\n                <div class=\"dot dot3\"></div>\n            </div>\n          <span class=\"mdc-button__label\">UPLOAD</span>\n        </button>\n      </div>\n  </div>\n  ");
  document.getElementById("home-header").innerHTML = "<div class=\"mdc-top-app-bar__row\">\n <section class=\"mdc-top-app-bar__section mdc-top-app-bar__section--align-start\">\n     <a id=\"backicon\" class=\"material-icons mdc-top-app-bar__navigation-icon mdc-icon-button\"\n         aria-label=\"Open navigation menu\" href=\"javascript:redirect('/home')\">arrow_back</a>\n     <span class=\"mdc-top-app-bar__title\">Photo Check-in</span>\n </section>\n\n</div>";
  document.getElementById("app-current-panel").classList.remove("extra--adjust");
  var textarea = new mdc.textField.MDCTextField(document.getElementById("photo-text"));
  var submit = new mdc.ripple.MDCRipple(document.getElementById("snap-submit"));
  document.getElementById("checkin-photo").src = url;
  textarea.focus();
  submit.root.addEventListener("click", function () {
    var textValue = textarea.value;
    sendPhotoCheckinRequest({
      sub: ApplicationState.officeWithCheckInSubs[ApplicationState.selectedOffice],
      base64: url,
      retries: retries,
      textValue: textValue,
      knownLocation: true,
      btn: submit.root
    });
  });
}

function sendPhotoCheckinRequest(request) {
  var url = request.base64;
  var textValue = request.textValue;
  var retries = request.retries;
  var sub = JSON.parse(JSON.stringify(request.sub));
  sub.attachment.Photo.value = url || "";
  sub.attachment.Comment.value = textValue;
  sub.share = [];
  request.btn.classList.add("in-progress");
  requestCreator("create", fillVenueInSub(sub, ApplicationState.venue), ApplicationState.location).then(function () {
    request.btn.classList.remove("in-progress");
    snacks("Photo uploaded");
    setTimeout(function () {
      redirect("/home");
    }, 3000);
  })["catch"](function (error) {
    request.btn.classList.remove("in-progress");

    if (error.message === "Invalid check-in") {
      handleInvalidCheckinLocation(retries.invalidRetry, function (newGeopoint) {
        ApplicationState.location = newGeopoint;
        retries.invalidRetry++;
        setFilePath(base64, retries);
      });
      return;
    }

    snacks(error.message);
  });
}