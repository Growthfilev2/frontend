var database;

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

        document.getElementById("total_time").innerHTML = d.hours() + "h " + d.minutes() + "m";


    });
}

function readduty() {

    const duties = [];
    const timestamp_array = [];

    var transaction = db.transaction("activity");
    var store = transaction.objectStore('activity');

    // open cursor on activity object store's index template
    // pass duty as template , this will return all duty activites


    let dateObjects = {}

    store.index('template').openCursor('duty').onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (!cursor) return;

        // if duty doesn't have a schedule , ignore and continue
        if (!Array.isArray(cursor.value.schedule)) {
            cursor.continue();
            return
        }

        // if duty doesn't have a start and end time , ignore and continue
        if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
            cursor.continue();
            return
        }



        if (cursor.value.schedule[0].startTime == cursor.value.schedule[0].endTime) {
            cursor.continue();
            return
        }

        if (!cursor.value.checkins) {
            cursor.continue();
            return
        }

        // if activity's office doesn't match the selected office during checkin , then ignore and continue
        // if (cursor.value.office !== ApplicationState.selectedOffice) {
        //     cursor.continue();
        //     return
        // }

        timestamp_array.push(cursor.value.timestamp)

        duties.push(cursor.value)

        cursor.continue()
    }
    transaction.oncomplete = function () {
        let DT = {}
        // sort by desciding order;

        const sorted = duties.sort((b, a) => {
            return b.timestamp - a.timestamp
        })
        // create an object where key is month+year combo and its value is an array of duty objects
        sorted.forEach(duty => {
            const date = new Date(duty.timestamp);

            if (DT[`${date.getMonth()}${date.getFullYear()}`]) {
                DT[`${date.getMonth()}${date.getFullYear()}`].push(duty)
            } else {
                DT[`${date.getMonth()}${date.getFullYear()}`] = [duty];
            }
        })

        console.log(DT)

        const months = Object.keys(dateObjects);
        let date_objects = {}
        // loop through the object and caluclate total hours, total locations and total hours worked 
        // for each date
        Object.keys(DT).forEach(key => {

            let totalDuties = 0;
            let totalHoursWorked = 0;
            let totalLocationsString = '';
            let currentDate;
            let activities = []
            DT[key].forEach(activity => {

                // if current Date is not equal to the activity date then
                // reset the variable count
                if (currentDate !== moment(activity.timestamp).format("DD/MM/YYYY")) {
                    totalDuties = 0;
                    totalHoursWorked = 0;
                    totalLocationsString = 0;
                    activities = []
                }
                currentDate = moment(activity.timestamp).format("DD/MM/YYYY")
                // increment the variables beacause all are of same date
                activities.push(activity)
                totalDuties++;
                totalLocationsString += activity.attachment.Location.value + ' & ';

                // filter checkins where creator is self and sort in descinding order;

                const checkins = activity.checkins.filter(v => v.creator.phoneNumber === firebase.auth().currentUser.phoneNumber).sort((a, b) => {
                    return b.timestamp - a.timestamp;
                })

                if (checkins.length) {
                    // use moment to calculate duration
                    totalHoursWorked += checkins[0].timestamp - checkins[checkins.length - 1].timestamp;
                }

                // set the values in a new object
                date_objects[moment(activity.timestamp).format("DD/MM/YYYY")] = {
                    totalDuties,
                    totalLocationsString,
                    totalHoursWorked,
                    activities
                }

            })
        });
        console.log(date_objects)

        const keys = Object.keys(date_objects);
        let month;
        let monthCard;
        // loop the new objects backwards
        for (let i = keys.length - 1; i >= 0; i--) {
            const date = keys[i];
            // if month variable is not equal to current month value
            // create a new card
            if (month != moment(date, 'DD/MM/YYYY').month()) {




                //Created an array to convert number into string
                var month_array = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];



                one_month = month_array[moment(date, 'DD/MM/YYYY').month()];


                monthCard = createElement('div', {
                    className: 'month-card'
                })

                monthCard.innerHTML = ` <div  id="month_card2">
                        <div id="on_card2">
                                <p id="month_date2">${one_month}</p>
                                <p id="days_worked2">Days Worked</p>
                        </div>
                    </div>`;
            }
            month = moment(date, 'DD/MM/YYYY').month();

            // Converted total work hours in to hours and minuts

            var Day_total_time = moment.duration(date_objects[date].totalHoursWorked)

            // individual date cards in a date
            const card = createElement('div', {
                id: 'collapsed2',
                style: "display: flex;"
            });
            card.dataset.date = date
            card.innerHTML = `
            <div id="date_day2"> <p id="duty_date2">${date.slice(0,2)}</p> <p id="duty_day2"></p></div>
            <div id="duty_div2">
              <div id="collapsed_duty2" >
              <p><span class="material-icons">
              location_on
              </span><span id="duty_address2">${date_objects[date].totalLocationsString} </span>
            </p>
            <p>
              <span class="material-icons">
              timer
              </span><span id="total_hours2">${Day_total_time.hours() + "h "+ Day_total_time.minutes()+"m"}</span>&nbsp&nbsp&nbsp <span class="material-icons">
                work
                </span><span id="total_duties2"> ${date_objects[date].totalDuties}</span>
              </p>
              </div>
        
                <div class='duties-list'></div>
            </div>
                    `


            // Added event listener on Date Card in order to create Sub Duty Divs 
            card.addEventListener("click", function () {
                const cont = createElement('div',{
                    className:'duty-list'
                })
                card.querySelector('.duties-list').innerHTML = ''
                // For loop that reads individual duty in the specific [date]
                date_objects[date].activities.forEach(j=>{

                    // Created sub Duty card here 
                    const collapsed = createElement('div', {
                        id: 'expended_duty',
                        style: "display: block;"
                    });
    
                    collapsed.innerHTML = `
                    <p id="expended_location">
                    <span class="material-icons-outlined"> location_on </span>&nbsp
                    &nbsp<span id="expended_location">${j.attachment.Location.value}</span>
                  </p>
          
                  <p id="expended_checkin_time">
                    <span class="material-icons-outlined"> query_builder </span>&nbsp
                    &nbsp<span id="expended_interval">
                      <span id="expended_starting_time">00:</span>-
                      <span id="expended_ending_time">00</span></span
                    >
                  </p>
                  <p>
                    <span class="material-icons-outlined"> timer </span>&nbsp &nbsp<span
                      id="expended_total_time"
                      >asdas</span>
                  </p>
                
                    `
                    // I don't know where to append
    
                    // "coll" is the div in HTML
                  
                    card.querySelector('.duties-list').appendChild(collapsed)
    
                    console.log(j.attachment.Location.value)
                })
                // monthCard.appendChild(cont)
            });

            monthCard.appendChild(card)
            document.body.appendChild(monthCard)

        }


    }
}
