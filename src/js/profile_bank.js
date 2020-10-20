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

      getRootRecord().then(fillAccount).catch(console.error)
      document.getElementById('form-account').addEventListener('submit', (ev) => {
        [acctNumber,confirmAcctNumber,name,phone,ifsc]
      })  
    }
  })
})

const fillAccount = (record) => {
  const account = record.linkedAccount[0];
  if (!hasBankAccount(record)) {
    document.querySelector('.confirm-acc-number-cont').classList.remove('hidden');
    return
  };

  submitBtn.querySelector('.mdc-button__label').textContent = 'UPDATE';
  acctNumber.value = '';
  acctNumber.label_.root.textContent = `Account number (${account.bankAccount})`
  acctNumber.input_.setAttribute('placeholder', 'Re-enter Bank Account Number');

  name.value = account.name || '';
  phone.value = account.phone || firebase.auth().currentUser.phoneNumber;
  ifsc.value = account.ifsc;
  // setFieldsDisabled();
}
const setFieldsDisabled = () => {
  acctNumber.disabled = true;
  name.disabled = true;
  phone.disabled = true;
  ifsc.disabled = true;
}


const hasBankAccount = (record) => {
  return record.linkedAccount && record.linkedAccount[0]
}
const validateIFSC = (string) => {
  return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string)
}