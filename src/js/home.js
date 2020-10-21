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
        if (cursor.value.office !== ApplicationState.selectedOffice) {
            cursor.continue();
            return
        }

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
                monthCard = createElement('div', {
                    className: 'month-card'
                })
            }
            month = moment(date, 'DD/MM/YYYY').month();

            // individual date cards in a date
            const card = createElement('div', {
                className: '',
                style: 'padding:16px;margin-bottom:10px'
            });
            card.dataset.date = date
            card.innerHTML = `
                <p style='font-weight:bold'>${date}</p>
                <p>${date_objects[date].totalLocationsString}</p>
                <p>total duties : ${date_objects[date].totalDuties}</p>
                <p>Total hours worked : ${date_objects[date].totalHoursWorked}<p>
                <div>
                    ${date_objects[date].activities.map(activity=>{
                        return `<div>${activity.activityId}</div>`
                    }).join(" ")}
                </div>
                `
            monthCard.appendChild(card)
            document.body.appendChild(monthCard)

        }

    }
    // transaction.oncomplete = function () {

    //     // sort the activities in descinding order, latest first
    //     const descindingDates = duties.sort((a, b) => {
    //         return b.timestamp - a.timestamp
    //     })

    //     const descindingTimestamp = timestamp_array.sort((a, b) => {
    //         return b - a
    //     })




    //     descindingTimestamp.forEach(function (activity_timestamp) {



    //         //   var ts_ms = activity_timestamp;


    //         //   var date_ob = new Date(ts_ms);


    //         //   var year = date_ob.getFullYear();


    //         //   var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    //         //  console.log(month+year)

    //     })


    //     descindingDates.forEach(function (activity) {

    //     })

    //     console.log(duties)

    //     var d;
    //     var months_array = [];
    //     var year_array = [];
    //     var daily_count = 0;

    //     for (var number_of_duties = 0; number_of_duties < duties.length; number_of_duties++) {

    //         var total_number_checkins = duties[number_of_duties].checkins.length;

    //         var total_checkins = duties[number_of_duties].checkins.length - 1;






    //         var total_time_cal = moment(duties[number_of_duties].checkins[total_checkins].timestamp - duties[number_of_duties].checkins[0].timestamp)
    //         var Day_total_time = moment.duration(total_time_cal);

    //         // document.getElementById("total_time").innerHTML = Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m" ;



    //         d = moment.duration(duties[number_of_duties].timestamp)

    //         months_array[number_of_duties] = moment().month(d.months()).format("MMMM");
    //         year_array[number_of_duties] = moment().year(d.years()).format("YYYY");


    //         year_array[number_of_duties] = moment().year();




    //         function date_wise_div() {

    //             var ts = duties[number_of_duties].timestamp;
    //             var date_ob = new Date(ts);
    //             var date = ("0" + date_ob.getDate()).slice(-2);

    //             var checkin_index = number_of_duties;


    //             const div = createElement('div',{
    //                 id:'collapsed2',
    //                 style:"display: flex;"
    //             })

    //             div.innerHTML =  `

    // <div id="date_day2"> <p id="duty_date2">${date}</p> <p id="duty_day2"></p></div>
    // <div id="duty_div2">
    //   <div id="collapsed_duty2" onclick="return duty(${checkin_index})">
    //   <p><span class="material-icons">
    //   location_on
    //   </span><span id="duty_address2">${duties[number_of_duties].checkins[0].venue[0].address.substring(0, 21)} & ${duties[number_of_duties].checkins.length-1 +" Others"} </span>
    // </p>
    // <p>
    //   <span class="material-icons">
    //   timer
    //   </span><span id="total_hours2">${Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m"}</span>&nbsp&nbsp&nbsp <span class="material-icons">
    //     work
    //     </span><span id="total_duties2"> ${duties[number_of_duties].checkins.length}</span>
    //   </p>
    //   </div>


    // </div>`

    //             return div;

    //         }



    //         var ts_ms = duties[number_of_duties].timestamp;
    //         var date_obmy = new Date(ts_ms);
    //         var year = date_obmy.getFullYear();
    //         var month = ("0" + (date_obmy.getMonth() + 1)).slice(-2);
    //         var month_year = month + year;


    //         if (number_of_duties == 0) {


    //             var expended_div = document.createElement("span");
    //             expended_div.dataset.value = moment(duties[number_of_duties].timestamp).format('DD/MM/YYYY')
    //             expended_div.innerHTML = ` ${date_wise_div().outerHTML} `;

    //             document.getElementById("day_div_expand").appendChild(expended_div);




    //         }



    //         if (number_of_duties > 0) {
    //             var pts_ms = duties[number_of_duties - 1].timestamp;
    //             var pdate_obmy = new Date(pts_ms);
    //             var pyear = pdate_obmy.getFullYear();
    //             var pmonth = ("0" + (pdate_obmy.getMonth() + 1)).slice(-2);
    //             var pmonth_year = pmonth + pyear;

    //         }

    //         // previous month+year combo != current month+year combo;

    //         if (pmonth_year != month_year) {

    //             var checkin_index = month_year;
    //             var month_div = document.createElement("div");
    //             // var date_div = document.createElement("div");
    //             month_div.innerHTML = ` <div  id="month_card2">
    //                     <div id="on_card2">
    //                             <p id="month_date2">${months_array[number_of_duties]} ${year_array[number_of_duties]}</p>
    //                             <p id="days_worked2">Days Worked</p>
    //                     </div>
    //                 </div>`;
    //             document.getElementById("month_card").appendChild(month_div);
    //         }


    //         // if date cont already exist , then apeend in it 
    //         // else create a new one
    //         var date_div = document.createElement("div");
    //         if(month_div.querySelector(`div[data-value="${moment(duties[number_of_duties].timestamp).format('DD/MM/YYYY')}"]`)) {
    //             date_div = month_div.querySelector(`div[data-value="${moment(duties[number_of_duties].timestamp).format('DD/MM/YYYY')}"]`)
    //         }

    //         // var expended_div = document.createElement("span");
    //         date_div.dataset.value = moment(duties[number_of_duties].timestamp).format('DD/MM/YYYY')
    //         date_div.appendChild(date_wise_div())
    //         month_div.appendChild(date_div);
    //     }
    // }
}



var duties, months;


function duty(duties) {
    alert(duties)
}


// function show_duty(months){


//   const duties = [];


//   var transaction = db.transaction("activity");
//   var store = transaction.objectStore('activity');

//   // open cursor on activity object store's index template
//   // pass duty as template , this will return all duty activites



//   store.index('template').openCursor('duty').onsuccess = function (evt) {
//       const cursor = evt.target.result;
//       if (!cursor) return;

//       // if duty doesn't have a schedule , ignore and continue
//       if (!Array.isArray(cursor.value.schedule)) {
//           cursor.continue();
//           return
//       }

//       // if duty doesn't have a start and end time , ignore and continue
//       if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
//           cursor.continue();
//           return
//       }



//       if (cursor.value.schedule[0].startTime == cursor.value.schedule[0].endTime) {
//         cursor.continue();
//         return
//     }

//     if (!cursor.value.checkins) {
//       cursor.continue();
//       return
//   }





//       // if activity's office doesn't match the selected office during checkin , then ignore and continue
//     //   if(cursor.value.office !== ApplicationState.office) {
//     //     cursor.continue();
//     //     return
//     // }



//       duties.push(cursor.value)

//       cursor.continue()
//   } 

//   transaction.oncomplete = function () {

//   // sort the activities in descinding order, latest first
//   const descindingDates = duties.sort((a,b)=>{
//       return b.timestamp - a.timestamp
//   })


//   var d ;
//   var months_array=[];
//   var year_array=[];
//   var daily_count = 0;

//   for( var number_of_duties=0;  number_of_duties<duties.length ; number_of_duties++){

//     var total_number_checkins = duties[number_of_duties].checkins.length;

//     var total_checkins = duties[number_of_duties].checkins.length-1 ;






//     var total_time_cal = moment(duties[number_of_duties].checkins[total_checkins].timestamp - duties[number_of_duties].checkins[0].timestamp)
//     var Day_total_time = moment.duration(total_time_cal);

//    // document.getElementById("total_time").innerHTML = Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m" ;



//     d= moment.duration(duties[number_of_duties].timestamp)

//     months_array[number_of_duties]=moment().month(d.months()).format("MMMM");
//     year_array[number_of_duties]=moment().year(d.years()).format("YYYY");


//     year_array[number_of_duties]= moment().year();




//     function date_wise_div(){

//       var ts = duties[number_of_duties].timestamp; 
//       var date_ob = new Date(ts);
//       var date = ("0" + date_ob.getDate()).slice(-2);

//       var checkin_index = number_of_duties;



//       return `<div id="collapsed2" style="display: flex;">

//       <div id="date_day2"> <p id="duty_date2">${date}</p> <p id="duty_day2"></p></div>
//       <div id="duty_div2">
//         <div id="collapsed_duty2" onclick="return duty(${checkin_index})">
//         <p><span class="material-icons">
//         location_on
//         </span><span id="duty_address2">${duties[number_of_duties].checkins[0].venue[0].address.substring(0, 21)} & ${duties[number_of_duties].checkins.length-1 +" Others"} </span>
//       </p>
//       <p>
//         <span class="material-icons">
//         timer
//         </span><span id="total_hours2">${Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m"}</span>&nbsp&nbsp&nbsp <span class="material-icons">
//           work
//           </span><span id="total_duties2"> ${duties[number_of_duties].checkins.length}</span>
//         </p>
//         </div>


//       </div>
//       </div>`

//     }





//     if(number_of_duties>0){
//     var pts_ms =  duties[number_of_duties-1].timestamp;
//     var pdate_obmy = new Date(pts_ms);
//     var pyear = pdate_obmy.getFullYear();
//     var pmonth = ("0" + (pdate_obmy.getMonth() + 1)).slice(-2);
//      var pmonth_year = pmonth+pyear;
//   }




//     if( pmonth_year  ==  months)
//   {




//     var expanded_div = document.createElement("div");



//     expanded_div.innerHTML = ` ${date_wise_div()}`;



//   document.getElementById("day_div_expand").appendChild(expanded_div);

//   }
//   else{

//   }



// }

//   }

// }