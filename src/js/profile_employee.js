window.addEventListener("load", (ev) => {
  firebase.auth().onAuthStateChanged((user) => {
    const request = window.indexedDB.open(user.uid);
    request.onsuccess = function (event) {

      const db = event.target.result;
      const id = new URLSearchParams(window.location.search).get('id');
      db.transaction('activity').objectStore('activity').get(id).onsuccess = function (e) {
        const record = e.target.result;
        if (!record) return;
        document.getElementById("office").innerHTML = record.office || "-";
        document.getElementById("designation").innerHTML = record.attachment.Designation.value || "-";
        document.getElementById("employee_id").innerHTML = record.attachment['Employee Code'].value || "-";
        document.getElementById("supervisor").innerHTML = record.attachment['First Supervisor'].value || "-";
        document.getElementById("department").innerHTML = record.attachment.Department.value || "-";
        document.getElementById("region").innerHTML = record.attachment.Region.value || "-";
      }
    };
  });
});

const loadEmployeeDetails = (record) => {

  document.getElementById("office").innerHTML = record.office
  document.getElementById("designation").innerHTML = record.attachment.Designation.value || '-'
  document.getElementById("employee_id").innerHTML = record.attachment['Employee Code'].value || '-'
  document.getElementById("supervisor").innerHTML = record.attachment['First Supervisor'].value || '-'
  if(record.attachment.Department) {
    document.getElementById("department").innerHTML = record.attachment.Department.value || '-'
  }
  if(record.attachment.Region) {
    document.getElementById("region").innerHTML = record.attachment.Region.value || '-'
  }
}