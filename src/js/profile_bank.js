let db;

let acctNumber;
let confirmAcctNumber;
let ifsc;
let name;
let phone;

const submitBtn = document.getElementById('submit-btn');

window.addEventListener('load', (ev) => {
  window.mdc.autoInit();
  firebase.auth().onAuthStateChanged(user => {
    const req = window.indexedDB.open(user.uid);
    req.onsuccess = function (e) {
      db = req.result;
      acctNumber = document.getElementById('acct-number').MDCTextField;
      confirmAcctNumber = document.getElementById('confirm-acc-number').MDCTextField;
      name = document.getElementById('name').MDCTextField;
      phone = document.getElementById('phone-field-mdc').MDCTextField;
      ifsc = document.getElementById('ifsc').MDCTextField;
      const iti = phoneFieldInit(phone.input_);

      document.getElementById('form-account').addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        if(!validateIFSC(ifsc.value)) {
          setHelperInvalid(ifsc.input_);
          return;
        }
        if()
      })  
    }
  })
})



const validateIFSC = (string) => {
  return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string)
}