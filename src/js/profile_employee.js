
let db;

navigator.serviceWorker.onmessage = (event) => {
  console.log("message from worker", event.data);
};


window.addEventListener("load", (ev) => {
  firebase.auth().onAuthStateChanged((user) => {
    const req = window.indexedDB.open(user.uid);
    req.onsuccess = function (e) {
     readdata();
    };
    
  });
});


function readdata(){
  var transaction = db.transaction(["children"], "readwrite");
  
  var objectStore = transaction.objectStore('children');

  var objectStoreRequest = objectStore.get("phoneNumber");

  

  request.onerror = function(event) {
    console.log('Transaction failed');
  };

  objectStoreRequest.onsuccess = function(event) {
    
    document.getElementById("designation").innerHTML= "hello";

    
  };
}

// window.addEventListener("load", (ev) => {
//   const dbName = firebase.auth().currentUser.uid;
//   var request = window.indexedDB.open(dbName, 33);

//   request.onsuccess = function(event) {
//     db = event.target.result;
//   };

//   var transaction = db.transaction('children');
//   var objectStore = transaction.objectStore('children');
//   var request = objectStore.get(phoneNumber);

//   request.onerror = function(event) {
//     console.log('Transaction failed');
//   };

//   request.onsuccess = function( event) {
//      if (request.result) {
//       document.getElementById("designation").innerHTML= request.result.designation.value;
         
//      } else {
//        console.log('No data record');
//      }
//   };
// });