window.addEventListener("load", function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    var request = window.indexedDB.open(user.uid);

    request.onsuccess = function (event) {
      var db = event.target.result;
      var id = new URLSearchParams(window.location.search).get('id');
      if (!id) return;

      db.transaction('activity').objectStore('activity').get(id).onsuccess = function (e) {
        var record = e.target.result;
        if (!record) return;
        loadEmployeeDetails(record);
      };
    };
  });
});

var loadEmployeeDetails = function loadEmployeeDetails(record) {
  document.getElementById("office").innerHTML = record.office;
  document.getElementById("designation").innerHTML = record.attachment.Designation.value || '-';
  document.getElementById("employee_id").innerHTML = record.attachment['Employee Code'].value || '-';
  document.getElementById("supervisor").innerHTML = record.attachment['First Supervisor'].value || '-';

  if (record.attachment.Department) {
    document.getElementById("department").innerHTML = record.attachment.Department.value || '-';
  }

  if (record.attachment.Region) {
    document.getElementById("region").innerHTML = record.attachment.Region.value || '-';
  }
};