var loadFile = function(event) {
    var image = document.getElementById('output');
    image.src = URL.createObjectURL(event.target.files[0]);
  };

  function employeedetails(){
      document.getElementById("employee_details").style.display="block";

      document.getElementById("wrapper").style.display="none";
  }

  function showprofile(){
    document.getElementById("wrapper").style.display="block";
    
    document.getElementById("employee_details").style.display="none";

    document.getElementById("edit_profile").style.display="none";
  }

  function editdetails(){
    document.getElementById("edit_profile").style.display="block";

    document.getElementById("wrapper").style.display="none";
}

let db;

    navigator.serviceWorker.onmessage = (event) => {
        console.log('message from worker', event.data);
    };
    
    window.addEventListener('load',(ev)=>{
        firebase.auth().onAuthStateChanged(user => {
            const req = window.indexedDB.open(user.uid);
            req.onsuccess = function(e) {
                db = req.result;
                db.transaction('root').objectStore('root').get(user.uid).onsuccess = function (e) {

                  document.getElementById('output').src = firebase.auth().currentUser.photoURL;

                  document.getElementById('name').innerHTML = firebase.auth().currentUser.displayName;

                  document.getElementById('mobile').innerHTML = firebase.auth().currentUser.phoneNumber;

                  document.getElementById('email').innerHTML = firebase.auth().currentUser.email;

                  document.getElementById('mobile_number').innerHTML = firebase.auth().currentUser.phoneNumber;
                  

                  
                }
            }
        })
    })

