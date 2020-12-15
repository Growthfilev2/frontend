var database;
navigator.serviceWorker.onmessage = (event) => {
  console.log("message from worker", event.data);
  if (event.data.type === "error") {
    handleError(event.data);
    return;
  }
  const readResponse = event.data;
  // if new checkin subscriptions comes then update the db
  getCheckInSubs().then(function (checkInSubs) {
    ApplicationState.officeWithCheckInSubs = checkInSubs;
    localStorage.setItem("ApplicationState", JSON.stringify(ApplicationState));
  });

  if (
    readResponse.activities.some((activity) => activity.template === "duty")
  ) {
    if (document.getElementById("duties-list")) {
      document.getElementById("duties-list").innerHTML = "";

      firebase.auth().onAuthStateChanged((user) => {
        const dbName = firebase.auth().currentUser.uid;
        const request = window.indexedDB.open(dbName, DB_VERSION);
    
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

  const dutyLocations = [];

  let prom = Promise.resolve([ApplicationState.venue]);
  // is user created a checkin from unknown location then venue in application state will be empty
  // if its empty then find all the nearest locations
  if (!ApplicationState.venue) {
    const offsetBounds = new GetOffsetBounds(ApplicationState.location, 1);
    prom = loadNearByLocations(
      {
        north: offsetBounds.north(),
        south: offsetBounds.south(),
        east: offsetBounds.east(),
        west: offsetBounds.west(),
      },
      ApplicationState.location
    );
  }

  prom.then(function (locations) {
    locations.forEach(function (location) {
      location.distance = calculateDistanceBetweenTwoPoints(
        location,
        ApplicationState.location
      );
      dutyLocations.push(location);
    });
    // if there are locatiosn nearby, then sort the locatiuns by distance in asc order
    if (dutyLocations.length) {
      const sorted = dutyLocations.sort(function (a, b) {
        return a.distance - b.distance;
      });
      // update application state and set the new venue
      ApplicationState.venue = sorted[0];
      console.log(sorted[0]);
      localStorage.setItem(
        "ApplicationState",
        JSON.stringify(ApplicationState)
      );
      read();
    }
  });
};

window.addEventListener("load", (ev) => {
//  console.log(moment().format("hh:mm"));
  firebase.auth().onAuthStateChanged((user) => {
    const dbName = firebase.auth().currentUser.uid;
    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function (event) {
      db = event.target.result;

      document.getElementById("pfp").src =
        firebase.auth().currentUser.photoURL || "./img/ic_pic_upload.png";
      document
        .getElementById("photo-upload-btn")
        .addEventListener("click", () => {
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
  getCurrentJob().then((record) => {
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
    

    document
      .getElementById("current_duty_card")
      .addEventListener("click", function (e) {
        e.stopPropagation();

        passDuty(record);
      });

    showDuty_card(record);
    
    console.log(record);

    document.getElementById("finish").addEventListener("click", function (e) {
      e.stopPropagation();
      document.getElementById("blur").style.display = "block";
      document.getElementById("comformation_box").style.display = "block";
      // current_date = new Date();
      // current_time = current_date.getTime();
      // time= moment(current_time).format("hh:mm A")
      document.getElementById("current_time").innerHTML =
        "Time: " + moment().format("hh:mm A");
      document.getElementById("finish_location").innerHTML =
        "Location: " + record.attachment.Location.value;
      // console.log(record.attachment.Location.value);
    });

    document
      .getElementById("yes_finish")
      .addEventListener("click", function () {
        const tx = db.transaction("activity", "readwrite");
        const objecstore = tx.objectStore("activity");
        record.finished = true;
        objecstore.put(record);

        tx.oncomplete = function () {
          document.getElementById("current_duty_card").style.display = "none";

          document.getElementById("blur").style.display = "none";
          document.getElementById("comformation_box").style.display = "none";
         // console.log(record);
          
        };
        
        
          
          
        
      });

      
      console.log(record)

    document.getElementById("no_hide").addEventListener("click", function () {
      document.getElementById("comformation_box").style.display = "none";
      document.getElementById("blur").style.display = "none";
    });
  });
}

function readduty() {
  const duties = [];
  const timestamp_array = [];

  var transaction = db.transaction("activity");
  var store = transaction.objectStore("activity");

  // open cursor on activity object store's index template
  // pass duty as template , this will return all duty activites

  let dateObjects = {};

  store.index("template").openCursor("duty").onsuccess = function (evt) {
    const cursor = evt.target.result;
    if (!cursor) return;

    // if duty doesn't have a schedule , ignore and continue
    if (!Array.isArray(cursor.value.schedule)) {
      cursor.continue();
      return;
    }

    // if duty doesn't have a start and end time , ignore and continue
    if (
      !cursor.value.schedule[0].startTime ||
      !cursor.value.schedule[0].endTime
    ) {
      cursor.continue();
      return;
    }


    if (cursor.value.isActive == false) {
      cursor.continue();
      return;
    }


    if (cursor.value.finished == false) {
      cursor.continue();
      return;
    }

    if (!cursor.value.checkins) {
      cursor.continue();
      return;
    }

    // if activity's office doesn't match the selected office during checkin , then ignore and continue
    // if (cursor.value.office !== ApplicationState.selectedOffice) {
    //     cursor.continue();
    //     return
    // }

    timestamp_array.push(cursor.value.timestamp);
    duties.push(cursor.value);
    cursor.continue();
   
  };
  transaction.oncomplete = function () {
  //  console.log(duties);
    let DT = {};
    // sort by desciding order;

    const sorted = duties.sort((b, a) => {
      return b.timestamp - a.timestamp;
    });
    // create an object where key is month+year combo and its value is an array of duty objects
    sorted.forEach((duty) => {
      const date = new Date(duty.timestamp);

      if (DT[`${date.getMonth()}${date.getFullYear()}`]) {
        DT[`${date.getMonth()}${date.getFullYear()}`].push(duty);
      } else {
        DT[`${date.getMonth()}${date.getFullYear()}`] = [duty];
      }
    });

    

    const months = Object.keys(dateObjects);
    let date_objects = {};
    
    // loop through the object and caluclate total hours, total locations and total hours worked
    // for each date
    Object.keys(DT).forEach((key) => {
      let totalDuties = 0;
      let totalHoursWorked = 0;
      let totalLocationsString = "";
      let currentDate;
      let activities = [];
      DT[key].forEach((activity) => {
        // if current Date is not equal to the activity date then
        // reset the variable count
        if (currentDate !== moment(activity.timestamp).format("DD/MM/YYYY")) {
          totalDuties = 0;
          totalHoursWorked = 0;
          totalLocationsString = "";
          activities = [];
        }
        currentDate = moment(activity.timestamp).format("DD/MM/YYYY");
        // increment the variables beacause all are of same date
        activities.push(activity);
        totalDuties++;
        totalLocationsString += activity.attachment.Location.value + " & ";

        // filter checkins where creator is self and sort in descinding order;

        const checkins = activity.checkins
          .filter(
            (v) =>
              v.creator.phoneNumber === firebase.auth().currentUser.phoneNumber
          )
          .sort((a, b) => {
            return b.timestamp - a.timestamp;
          });

        if (checkins.length) {
          // use moment to calculate duration
          totalHoursWorked +=
            checkins[0].timestamp - checkins[checkins.length - 1].timestamp;
        }

        // set the values in a new object
        date_objects[moment(activity.timestamp).format("DD/MM/YYYY")] = {
          totalDuties,
          totalLocationsString,
          totalHoursWorked,
          activities,
        };
      });
    });
  //  console.log(date_objects);
    readallduties(date_objects);
  };
}

function readallduties(object_of_dates) {
  const keys = Object.keys(object_of_dates);
  let month;
  let monthCard;
  let daysWorkedInMonth = 0;
  var month_count= 0; 
  // loop the new objects backwards

  for (let i = keys.length - 1; i >= 0; i--) {
    const date = keys[i];
    // if month variable is not equal to current month value
    // create a new card
  
    if (month != moment(date, "DD/MM/YYYY").month()) {
      //Created an array to convert number into string

      var first_month = new Date();
      var current_month = first_month.getMonth();
      var pre_month = current_month - 1;

      if (current_month == month) {
        monthCard.style.display = "block";
        document.getElementById("month_card2").style.backgroundColor =
          "var(--mdc-theme-primary)";
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
        style: "display:none;"
      });

      monthCard.innerHTML = ` <div  id="month_card2" >
                <div id="on_card2">
                <p id="month_date2">${one_month} ${curent_year}</p>
                
                <p class="total-days-worked"></p>
                
                <span class="material-icons arrow_class" id="arrow" >keyboard_arrow_down</span>
                </div>
               
                </div>
                `;
      daysWorkedInMonth = 0;
      month_count++;
     

    }

    daysWorkedInMonth++;

    monthCard.querySelector(".total-days-worked").innerHTML =
      "Days Worked: " +
      daysWorkedInMonth +
      " Days/ " +
      total_working_day +
      " Days";

    month = moment(date, "DD/MM/YYYY").month();
    

    if (current_month == month) {
      monthCard.style.display = "block";
      monthCard.querySelector("#month_card2").style.backgroundColor = "var(--mdc-theme-primary)";
      monthCard.querySelector("#month_card2").style.color = "var(--mdc-theme-on-primary)";
      monthCard.querySelector("#arrow").style.color = "var(--mdc-theme-on-primary)";
      monthCard.querySelector("#arrow").style.transform = "rotate(180deg)";
    }

    // Converted total work hours in to hours and minuts

    const card = createDateCard(date, object_of_dates);

    //console.log(date)
    //Expanded first month
   
    monthCard.addEventListener("click", function (e) {

     
      // if(card.style.display == "flex"){
      //   document.getElementById("arrow").style.transform = "rotate(0deg)";
      // }else{
       document.getElementById("arrow").style.transform = "rotate(180deg)";
      // }


      if (card.style.display == "flex") {
        card.style.display = "none";
        document.getElementById("arrow").style.transform = "rotate(0deg)";

       //document.getElementsByClassName("arrow_class")[1].style.transform  = "rotate(0deg)";

        return;
      }
      card.style.display = "flex";

     
       
   //  document.getElementById("arrow").style.transform = "rotate(180deg)";
     // document.getElementsByClassName("arrow_class")[1].style.transform  = "rotate(180deg)";

    });

    // Added event listener on Date Card in order to create Sub Duty Divs
    card.addEventListener("click", function (e) {
      e.stopPropagation();

      if (card.querySelector(".duties-list").childElementCount) {
        card.querySelector(".duties-list").innerHTML = "";
        card.querySelector("#day_arrow").style.transform = "rotate(0deg)";
        return;
      }

      card.querySelector("#day_arrow").style.transform = "rotate(180deg)";

      // For loop that reads individual duty in the specific [date]
      object_of_dates[date].activities.forEach((j) => {
        card.querySelector(".duties-list").appendChild(subDuties(j));
        // card.querySelector("#inner_location_icon").style.color= "#25456c";
        // card.querySelector("#inner_builder_icon").style.color= "#25456c";
        // card.querySelector("#inner_timer_icon").style.color= "#25456c";
      });
    });

    monthCard.appendChild(card);

    

    document.getElementById("duties-list").appendChild(monthCard);

    var first_month = new Date();
    var current_month = first_month.getMonth();

    if (moment(date, "DD/MM/YYYY").month() == current_month) {
      monthCard.style.display = "block";
      card.style.display = "flex";
    }
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

  if(month_count<3){
    document.getElementById("show_more_b").style.display = "none";
    document.getElementById("show_less_b").style.display = "none";
  }
 

}

function createDateCard(date, object_of_dates) {
  const day = moment(date, "DD/MM/YYYY").format("ddd").toString().toUpperCase();
  const day_total_time = moment.duration(
    object_of_dates[date].totalHoursWorked
  );

  var trying = moment(date, "DD/MM/YYYY").format("D MM YYYY");
  

  const current_date = new Date();
  var cd = current_date.getDate();
  var cm = current_date.getMonth() + 1;
  var cy = current_date.getFullYear();
  var present_date = cd + " " + cm + " " + cy;
  

  // individual date cards in a date
  const card = createElement("div", {
    id: "collapsed2",
  });

  card.dataset.date = date;
  card.innerHTML = `
  
          <div id="date_day2"> <p id="duty_date2">${date.slice(
            0,
            2
          )}</p> <p id="duty_day2">${day}</p></div>
          <div id="duty_div2">
            <div id="collapsed_duty2" >
            <p><span id="current_location_icon" class="material-icons-outlined">
            location_on
            </span><span id="duty_address2">${
              object_of_dates[date].totalLocationsString.substring(0, 18) +
              "..."
            }  ${
    object_of_dates[date].totalDuties == 1
      ? " "
      : "& " + (object_of_dates[date].totalDuties - 1) + " Others"
  } </span>
          </p>
          <p>
          
            <span id="current_timer_icon" class="material-icons-outlined">
            timer
            </span><span id="total_hours2">${
              day_total_time.days() +
              "d " +
              day_total_time.hours() +
              "h " +
              day_total_time.minutes() +
              "m"
            }</span>&nbsp&nbsp&nbsp <span id="current_totaltime_icon" class="material-icons-outlined">
            work_outline
              </span><span id="total_duties2"> ${
                object_of_dates[date].totalDuties
              }</span>
              
            </p>
                  <p id="arrow_div"><span class="material-icons" id="day_arrow">keyboard_arrow_down</span></p>
            </div>
                
            <div><hr id="h_line"><div id="circle"></div></div> 
              <div class='duties-list'></div>
          </div>
          
                
          `;

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
}

// function addStyle(styles) {

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

  var diff = moment
    .utc(
      moment(j.schedule[0].endTime || "00").diff(
        moment(j.schedule[0].startTime)
      )
    )
    .format("HH:mm");

  var starttime = moment(j.schedule[0].startTime).format("hh:mm A");
  var endtime = moment(j.schedule[0].endTime).format("hh:mm A");
 // console.log(j);
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

  const collapsed = createElement("div", {
    id: "expended_duty",
    style: "display: block;",
  });

  collapsed.addEventListener("click", function (e) {
    e.stopPropagation();
    console.log(j);

    passDuty(j);
  });
  
  collapsed.innerHTML = `
  <div id="individual_duty">
  
              <p id="expended_location">
              <span id="inner_location_icon" class="material-icons-outlined"> location_on </span>&nbsp
              &nbsp<span id="expended_location">${
                j.attachment.Location.value
              }</span>
            </p>
    
            <p id="expended_checkin_time">
              <span id="inner_builder_icon" class="material-icons-outlined"> query_builder </span>&nbsp
              &nbsp<span id="expended_interval">
                <span id="expended_starting_time">${starttime}</span>-
                <span id="expended_ending_time">${endtime}</span></span
              >
            </p>
            <p id="expended_checkin_totaltime">
              <span id="inner_timer_icon" class="material-icons-outlined"> timer </span>&nbsp &nbsp<span
                id="expended_total_time"
                >${diff.slice(0, 2) + "h " + diff.slice(3, 5) + "m"}</span>
            </p>
          
            <div style="display: flex;"> 
            <div class="mdc-chip-set mdc-chip-set--filter" role="grid" id="assignees_div">
            <div class="mdc-chip" id="assignees_div" role="row">
              <div class="mdc-chip__ripple"></div>
              <i class="material-icons mdc-chip__icon mdc-chip__icon--leading"><img id="assignees_pic" src="${assignees_photo}"  width="24px" height="24px"></i>
              <span class="mdc-chip__checkmark" >
                <svg class="mdc-chip__checkmark-svg" viewBox="-2 -3 30 30">
                  <path class="mdc-chip__checkmark-path" fill="none" stroke="black"
                        d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                </svg>
              </span>
              <span role="gridcell">
                <span role="checkbox" tabindex="0" aria-checked="false" class="mdc-chip__primary-action">
                  <span class="mdc-chip__text" id="assignees_name">${
                    !assignees_displayname
                      ? assignees_phonenumber
                      : assignees_displayname
                  }</span>
                </span>
              </span>
            </div>
          
          </div >
          <span id="other_assignees">${and + " " + other_assignee}</span>
          <div id="duty_right_indicator">
          <span class="material-icons">
          keyboard_arrow_right
          </span>
          </div>
          </div>
          
          </div>

          <div><hr id="h_line"><div id="circle"></div></div> 
              `;
  return collapsed;
}

function openCamera() {

  disableBack();

  if (_native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return;
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(
  base64,
  retries = {
    subscriptionRetry: 0,
    invalidRetry: 0,
  }
) {
  if(window.location.pathname.split("/").indexOf('upload-photo') == -1) {
    history.pushState(null, null, "/upload-photo");
  }
  const url = `data:image/jpg;base64,${base64}`;
  // const url = firebase.auth().currentUser.photoURL;
  // const url = base64
  document.getElementById("app-current-panel").innerHTML = `
  <div class='upload-photo-container'>
     <div class='image-cont'><img id='checkin-photo'></div>
     <div class='details pt-10'>
        <span class='mdc-typography--caption'>Details</span>
        <div class='mdc-typography--subtitle1'>${moment().format(
          "DDDD, MMMM MM,YYYY HH:mm"
        )}</div>
        ${
          ApplicationState.venue
            ? `<div class='mdc-typography--subtitle2'> ${ApplicationState.venue.location}</div>`
            : ""
        }
        
     </div>
      <div class="form-meta snap-form">
      <label class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea mdc-text-field--no-label" id="photo-text">
          <span class="mdc-text-field__resizer">
            <textarea id="description_box" class="mdc-text-field__input" rows="1" cols="40" aria-label="Label" placeholder='Photo Description'></textarea>
          </span>
          <span class="mdc-notched-outline">
            <span class="mdc-notched-outline__leading"></span>
            <span class="mdc-notched-outline__trailing"></span>
          </span>
    </label>
        <button id='snap-submit' class="mdc-button mdc-button--raised form-submit-btn mt-10">
            <div class="dots">
                <div class="dot dot1"></div>
                <div class="dot dot2"></div>
                <div class="dot dot3"></div>
            </div>
          <span class="mdc-button__label">UPLOAD</span>
        </button>
      </div>
  </div>
  `;
  document.getElementById(
    "home-header"
  ).innerHTML = `<div class="mdc-top-app-bar__row">
 <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
     <a id="backicon" class="material-icons mdc-top-app-bar__navigation-icon mdc-icon-button"
         aria-label="Open navigation menu" href="javascript:redirect('/home')">arrow_back</a>
     <span class="mdc-top-app-bar__title">Photo Check-in</span>
 </section>

</div>`;
  document
    .getElementById("app-current-panel")
    .classList.remove("extra--adjust");

  const textarea = new mdc.textField.MDCTextField(
    document.getElementById("photo-text")
  );
  const submit = new mdc.ripple.MDCRipple(
    document.getElementById("snap-submit")
  );
  document.getElementById("checkin-photo").src = url;

  textarea.focus();

  submit.root.addEventListener("click", function () {
    const textValue = textarea.value;


    sendPhotoCheckinRequest({
      sub:
        ApplicationState.officeWithCheckInSubs[ApplicationState.selectedOffice],
      base64: url,
      retries: retries,
      textValue: textValue,
      knownLocation: true,
      btn: submit.root,
    });
  });
}

function sendPhotoCheckinRequest(request) {
  const url = request.base64;
  const textValue = request.textValue;
  const retries = request.retries;
  const sub = JSON.parse(JSON.stringify(request.sub));
  sub.attachment.Photo.value = url || "";
  sub.attachment.Comment.value = textValue;
  sub.share = [];
  request.btn.classList.add("in-progress");

  
  requestCreator(
    "create",
    fillVenueInSub(sub, ApplicationState.venue),
    ApplicationState.location
  )
    .then(function () {
      request.btn.classList.remove("in-progress");
      snacks("Photo uploaded");
      setTimeout(() => {
        redirect("/home");
      }, 3000);
    })
    .catch(function (error) {
      request.btn.classList.remove("in-progress");
      if (error.message === "Invalid check-in") {
        handleInvalidCheckinLocation(retries.invalidRetry, function (
          newGeopoint
        ) {
          ApplicationState.location = newGeopoint;
          retries.invalidRetry++;
          setFilePath(base64, retries);
        });
        return;
      }
      snacks(error.message);
    });
}

function disableBack() 
{
   window.history.forward()
   }