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
   

    var ms = moment( record.schedule[0].endTime, "DD/MM/YYYY HH:mm:ss").diff(
      moment( record.schedule[0].startTime, "DD/MM/YYYY HH:mm:ss")
    );
    var d = moment.duration(ms);

    document.getElementById("total_time").innerHTML = d.hours()+"h "+ d.minutes()+"m" ;

    
  });
}
 function readduty(){

const duties = [];

var transaction = db.transaction("activity");
var store = transaction.objectStore('activity');

// open cursor on activity object store's index template
// pass duty as template , this will return all duty activites



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


  if (!cursor.value.attachment.Date ) {
    cursor.continue();
    return
}



    // if activity's office doesn't match the selected office during checkin , then ignore and continue
  //   if(cursor.value.office !== ApplicationState.office) {
  //     cursor.continue();
  //     return
  // }

    duties.push(cursor.value)
    
    cursor.continue()
} 

transaction.oncomplete = function () {

// sort the activities in descinding order, latest first
const descindingDates = duties.sort((a,b)=>{
    return b.timestamp - a.timestamp
})


// descindingDates.forEach(function (activity){
// console.log(activity);
// })



var d ;
var months_array=[];
var year_array=[];
var daily_count = 0;




for( var number_of_duties=0;  number_of_duties<duties.length ; number_of_duties++){

  var total_number_checkins = duties[number_of_duties].checkins.length;

  var total_checkins = duties[number_of_duties].checkins.length-1 ;


  var total_time_cal = moment(duties[number_of_duties].checkins[total_checkins].timestamp - duties[number_of_duties].checkins[0].timestamp)
  var Day_total_time = moment.duration(total_time_cal);

 // document.getElementById("total_time").innerHTML = Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m" ;
  

  
  d= moment.duration(duties[number_of_duties].schedule[0].startTime)

  months_array[number_of_duties]=moment().month(d.months()).format("MMMM");
  year_array[number_of_duties]=moment().year(d.years()).format("YYYY");
  

  year_array[number_of_duties]= moment().year();



  function date_wise_div(){

    var ts = duties[number_of_duties].timestamp; 
    var date_ob = new Date(ts);
    var date = ("0" + date_ob.getDate()).slice(-2);
  
  
  
     return`<div id="collapsed2" style="display: flex;">
  
    <div id="date_day2"> <p id="duty_date2">${date}</p> <p id="duty_day2"></p></div>
    <div id="duty_div2">
      <div id="collapsed_duty2">
      <p><span class="material-icons">
      location_on
      </span><span id="duty_address2">${duties[number_of_duties].checkins[0].venue[0].address.substring(0, 21)} & ${duties[number_of_duties].checkins.length-1 +" Others"} </span>
    </p>
    <p>
      <span class="material-icons">
      timer
      </span><span id="total_hours2">${Day_total_time.hours()+"h "+ Day_total_time.minutes()+"m"}</span>&nbsp&nbsp&nbsp <span class="material-icons">
        work
        </span><span id="total_duties2"> ${duties[number_of_duties].checkins.length}</span>
      </p>
      </div>
    
      
     
    </div>
    </div>`
  
  }


  
  if(  months_array[number_of_duties] == "October" )
{


  function createSimpleMenu() {
    return `
    <div id="expended_duty" style="display: block;">
     <p id="expended_location">
    <span class="material-icons-outlined"> location_on </span>&nbsp
    &nbsp<span id="expended_location">saasd</span>
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
  </div>
  `
  }

  var month_div = document.createElement("div");
  var day_div = document.createElement("div");

 

 


  day_div.innerHTML = ` <div id="expended_duty" style="display: block;">
   <p id="expended_location">
  <span class="material-icons-outlined"> location_on </span>&nbsp
  &nbsp<span id="expended_location">saasd</span>
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
</div>
`


  month_div.innerHTML = ` <div class="month_card2" id="oct_card" >
  <div id="on_card2">
        
  <p id="month_date2">${months_array[number_of_duties]} ${year_array[number_of_duties]}</p>
  
  <p id="days_worked2">Days Worked</p>
  
</div>
</div>
${date_wise_div()}

`;

  document.getElementById("month_card").appendChild(month_div);
  
  document.getElementById("oct_card").style.display = 'block';

  

}







if( months_array[number_of_duties] == "September")
{


  function createSimpleMenu() {
    return `
    <div id="expended_duty" style="display: block;">
     <p id="expended_location">
    <span class="material-icons-outlined"> location_on </span>&nbsp
    &nbsp<span id="expended_location">saasd</span>
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
  </div>
  `
  }

  var sep_div = document.createElement("div");
  var day_div = document.createElement("div");

  day_div.innerHTML = ` <div id="expended_duty" style="display: block;">
   <p id="expended_location">
  <span class="material-icons-outlined"> location_on </span>&nbsp
  &nbsp<span id="expended_location">saasd</span>
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
</div>
`


  sep_div.innerHTML = ` <div class="month_card2" id="sep_card"  >
  <div id="on_card2">
        
  <p id="month_date2">${months_array[number_of_duties]} ${year_array[number_of_duties]}</p>
  
  <p id="days_worked2">Days Worked</p>
  
</div>
</div>

${date_wise_div()}
`;

  document.getElementById("month_card").appendChild(sep_div);
  document.getElementById("sep_card").style.display = 'block';
 



}

if( months_array[number_of_duties] == "August")
{


  function createSimpleMenu() {
    return `
    <div id="expended_duty" style="display: block;">
     <p id="expended_location">
    <span class="material-icons-outlined"> location_on </span>&nbsp
    &nbsp<span id="expended_location">saasd</span>
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
  </div>
  `
  }

  var aug_div = document.createElement("div");
  var day_div = document.createElement("div");

  day_div.innerHTML = ` <div id="expended_duty" style="display: block;">
   <p id="expended_location">
  <span class="material-icons-outlined"> location_on </span>&nbsp
  &nbsp<span id="expended_location">saasd</span>
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
</div>
`


  aug_div.innerHTML = ` <div class="month_card2" id="aug_card"  >
  <div id="on_card2">
        
  <p id="month_date2">${months_array[number_of_duties]} ${year_array[number_of_duties]}</p>
  
  <p id="days_worked2">Days Worked</p>
  
</div>
</div>

${date_wise_div()}`;

  document.getElementById("month_card").appendChild(aug_div);
  document.getElementById("aug_card").style.display = 'block';
 



}

if( months_array[number_of_duties] == "July")
{


  function createSimpleMenu() {
    return `
    <div id="expended_duty" style="display: block;">
     <p id="expended_location">
    <span class="material-icons-outlined"> location_on </span>&nbsp
    &nbsp<span id="expended_location">saasd</span>
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
  </div>
  `
  }

  var jul_div = document.createElement("div");
//   var day_div = document.createElement("div");

//   day_div.innerHTML = ` <div id="expended_duty" style="display: block;">
//    <p id="expended_location">
//   <span class="material-icons-outlined"> location_on </span>&nbsp
//   &nbsp<span id="expended_location">saasd</span>
// </p>

// <p id="expended_checkin_time">
//   <span class="material-icons-outlined"> query_builder </span>&nbsp
//   &nbsp<span id="expended_interval">
//     <span id="expended_starting_time">00:</span>-
//     <span id="expended_ending_time">00</span></span
//   >
// </p>
// <p>
//   <span class="material-icons-outlined"> timer </span>&nbsp &nbsp<span
//     id="expended_total_time"
//     >asdas</span>
// </p>
// </div>
// `


  jul_div.innerHTML = ` <div class="month_card2" id="jul_card"  >
  <div id="on_card2">
        
  <p id="month_date2">${months_array[number_of_duties]} ${year_array[number_of_duties]}</p>
  
  <p id="days_worked2">Days Worked</p>
  
</div>
</div>

${date_wise_div()}`;

  document.getElementById("month_card").appendChild(jul_div);
  document.getElementById("jul_card").style.display = 'block';
 



}





}




console.log(duties);

}

}

