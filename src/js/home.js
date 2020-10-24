var database;
navigator.serviceWorker.onmessage = (event) => {
  console.log('message from worker', event.data);
  const readResponse = event.data
  // if new checkin subscriptions comes then update the db
  getCheckInSubs().then(function (checkInSubs) {
    ApplicationState.officeWithCheckInSubs = checkInSubs
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
  });

  if (readResponse.activities.some(activity => activity.template === "duty")) {
    readduty()
  }
  const dutyLocations = []

  let prom = Promise.resolve([]);
  // is user created a checkin from unknown location then venue in application state will be empty
  // if its empty then find all the nearest locations
  if (!ApplicationState.venue) {
    const offsetBounds = new GetOffsetBounds(ApplicationState.location, 1);
    prom = loadNearByLocations({
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    }, ApplicationState.location)
  }

  prom.then(function (locations) {
    locations.forEach(function (location) {
      location.distance = calculateDistanceBetweenTwoPoints(location, ApplicationState.location);
      dutyLocations.push(location)
    });
    // if there are locatiosn nearby, then sort the locatiuns by distance in asc order
    if (dutyLocations.length) {
      const sorted = dutyLocations.sort(function (a, b) {
        return a.distance - b.distance;
      });
      // update application state and set the new venue
      ApplicationState.venue = sorted[0];
      console.log(sorted[0])
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      read()
    };
  })
};


window.addEventListener("load", (ev) => {
  firebase.auth().onAuthStateChanged((user) => {
    const dbName = firebase.auth().currentUser.uid;
    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onerror = function (event) {
      console.log("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function (event) {
      db = event.target.result;

      document.getElementById("pfp").src =
        firebase.auth().currentUser.photoURL ||
        firstletter(firebase.auth().currentUser.displayName.charAt(0));

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
    document.getElementById("current_location").innerHTML =
      record.attachment.Location.value;
    //console.log(record);
    document.getElementById("starting_time").innerHTML = moment(
      record.schedule[0].startTime
    ).format("hh:mm A");

    var ms = moment(record.schedule[0].endTime, "DD/MM/YYYY HH:mm:ss").diff(
      moment(record.schedule[0].startTime, "DD/MM/YYYY HH:mm:ss")
    );
    var d = moment.duration(ms);

    document.getElementById("total_time").innerHTML =
      d.hours() + "h " + d.minutes() + "m";

    if (record.assignees[0].displayName) {
      document.getElementById("assignees_name").innerHTML =
        record.assignees[0].displayName;
    } else {
      document.getElementById("assignees_name").innerHTML =
        record.assignees[0].phoneNumber;
    }

    if (record.assignees.length > 1) {
      if (record.assignees.length == 2) {
        document.getElementById("other_assignees").innerHTML =
          "  &" + record.assignees.length - 1 + "Other";
      } else {
        document.getElementById("other_assignees").innerHTML =
          "  &" + record.assignees.length - 1 + "Others";
      }
    }

    document.getElementById("assignees_pic").src = record.assignees[0].photoURL;

    console.log(record);
  });
}

function readduty() {
  const duties = [];

  var transaction = db.transaction("activity");
  var store = transaction.objectStore("activity");

  // open cursor on activity object store's index template
  // pass duty as template , this will return all duty activites


  store.index("template").openCursor("duty").onsuccess = function (evt) {
    const cursor = evt.target.result;
    if (!cursor) return;

    // if duty doesn't have a schedule , ignore and continue
    if (!Array.isArray(cursor.value.schedule)) {
      cursor.continue();
      return;
    }

    // if duty doesn't have a start and end time , ignore and continue
    if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
      cursor.continue();
      return;
    }

    if (!cursor.value.checkins) {
      cursor.continue();
      return;
    }

    // if activity's office doesn't match the selected office during checkin , then ignore and continue
    if (cursor.value.office !== ApplicationState.selectedOffice) {
      cursor.continue();
      return
    }

    duties.push(cursor.value);

    cursor.continue();
  };
  transaction.oncomplete = function () {
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

    console.log(DT);

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
    console.log(date_objects);
    readallduties(date_objects)
  }

};



function readallduties(object_of_dates) {

  const keys = Object.keys(object_of_dates);
  let month;
  let monthCard;
  let daysWorkedInMonth = 0;

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
      }

      if (pre_month == month) {
        monthCard.style.display = "block";
      }

      one_month = moment(date, "DD/MM/YYYY").format('MMMM');
      curent_year = moment(date, "DD/MM/YYYY").year();
      total_working_day = moment(date, "YYYY-MM").daysInMonth();
      console.log("total_working_day")

      monthCard = createElement("div", {
        className: "month-card",
        style: "display:none;",
      });

      monthCard.innerHTML = ` <div  id="month_card2">
                <div id="on_card2">
                <p id="month_date2">${one_month} ${curent_year}</p>
                
                <p class="total-days-worked"></p>
                <span class="material-icons" id="arrow">
                keyboard_arrow_down
                </span>
                </div>
                </div>
                `;
      daysWorkedInMonth = 0;
    }



    daysWorkedInMonth++;


    monthCard.querySelector(".total-days-worked").innerHTML =
      "Days Worked: " +
      daysWorkedInMonth +
      " Days/ " +
      total_working_day +
      " Days";


    month = moment(date, "DD/MM/YYYY").month();



    // Converted total work hours in to hours and minuts

    const card = createDateCard(date, object_of_dates)

    //Expanded first month

    monthCard.addEventListener("click", function (e) {
      if (card.style.display == "flex") {
        card.style.display = "none";

        return;
      }
      card.style.display = "flex";
    });


    // Added event listener on Date Card in order to create Sub Duty Divs
    card.addEventListener("click", function (e) {
      e.stopPropagation();

      if (card.querySelector(".duties-list").childElementCount) {
        card.querySelector(".duties-list").innerHTML = "";
        return;
      }

      // For loop that reads individual duty in the specific [date]

      object_of_dates[date].activities.forEach((j) => {

        card.querySelector(".duties-list").appendChild(subDuties(j));

      });


    });

    monthCard.appendChild(card);

    document.body.appendChild(monthCard);

    var first_month = new Date();
    var current_month = first_month.getMonth();

    if (moment(date, "DD/MM/YYYY").month() == current_month) {
      card.style.display = "flex";
      monthCard.style.display = 'block';
    }
  }

  document
    .getElementById("show_more_b")
    .addEventListener("click", function () {
      document.getElementById("show_more_b").style.display = "none";

      var show_all_card = document.querySelectorAll(".month-card");
      console.log(show_all_card.length);
      for (var i = 0; i < show_all_card.length; i++) {
        show_all_card[i].style.display = "block";
      }


    });

}


function createDateCard(date, object_of_dates) {

  const day = moment(date, "DD/MM/YYYY").format('ddd').toString().toUpperCase()
  const day_total_time = moment.duration(object_of_dates[date].totalHoursWorked);

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
            <p><span class="material-icons">
            location_on
            </span><span id="duty_address2">${object_of_dates[
              date
            ].totalLocationsString.substring(0, 21)}  ${
              object_of_dates[date].totalDuties == 1
        ? " "
        : object_of_dates[date].totalDuties - 1 + " Others"
    } </span>
          </p>
          <p>
            <span class="material-icons">
            timer
            </span><span id="total_hours2">${
              day_total_time.days() +
              "d " +
              day_total_time.hours() +
              "h " +
              day_total_time.minutes() +
              "m"
            }</span>&nbsp&nbsp&nbsp <span class="material-icons">
              work
              </span><span id="total_duties2"> ${
                object_of_dates[date].totalDuties
              }</span>
            </p>
            </div>
      
              <div class='duties-list'></div>
          </div>
                  `;


  return card;
}



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


  var assignees_displayname = j.assignees[0].displayName;
  var assignees_phonenumber = j.assignees[0].phoneNumber;
  var assignees_photo = j.assignees[0].photoURL;

  var other_assignee = "";
  var and = "";
  if (j.assignees.length > 1) {
    and = "&";
    if (j.assignees.length == 2) {
      other_assignee = j.assignees.length - 1 + " Other";
    } else {
      other_assignee = j.assignees.length - 1 + " Others";
    }
  }


  const collapsed = createElement("div", {
    id: "expended_duty",
    style: "display: block;",
  });


  collapsed.innerHTML = `
              <p id="expended_location">
              <span class="material-icons-outlined"> location_on </span>&nbsp
              &nbsp<span id="expended_location">${
                j.attachment.Location.value
              }</span>
            </p>
    
            <p id="expended_checkin_time">
              <span class="material-icons-outlined"> query_builder </span>&nbsp
              &nbsp<span id="expended_interval">
                <span id="expended_starting_time">${starttime}</span>-
                <span id="expended_ending_time">${endtime}</span></span
              >
            </p>
            <p id="expended_checkin_totaltime">
              <span class="material-icons-outlined"> timer </span>&nbsp &nbsp<span
                id="expended_total_time"
                >${
                  diff.slice(0, 2) + "h " + diff.slice(3, 5) + "m"
                }</span>
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
          
          </div>
          <span id="other_assignees">${
            and + " " + other_assignee
          }</span>
          </div>
              `
  return collapsed;

}