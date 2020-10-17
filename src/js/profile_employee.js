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
      read();
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
    };
  });
});

function read() {
  var transaction = db.transaction("children");
  var objectStore = transaction.objectStore("children");

  var myIndex  = objectStore.index('employees'); 

  var request = myIndex.get(firebase.auth().currentUser.phoneNumber);

  
  request.onsuccess = function (event) {
    
    /**
       Variable names should be explainatory. don't assign random characters as variables names.
       It makes code harder to read.
    **/

    if (request.result) {
      document.getElementById("office").innerHTML = request.result.office || "-";
      document.getElementById("designation").innerHTML = request.result.attachment.Designation.value || "-";
      document.getElementById("employee_id").innerHTML = request.result.attachment['Employee Code'].value || "-";
      document.getElementById("supervisor").innerHTML = request.result.attachment['First Supervisor'].value || "-";
      document.getElementById("department").innerHTML = request.result.attachment.Department.value || "-";
      document.getElementById("region").innerHTML = request.result.attachment.Region.value || "-";

      
    } else {
      console.log("Read All Info");
    }
  };
}

