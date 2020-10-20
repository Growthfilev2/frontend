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

        if (!validateIFSC(ifsc.value)) {
          setHelperInvalid(ifsc);
          return;
        }
        if (confirmAcctNumber.value !== acctNumber.value) {
          setHelperInvalid(confirmAcctNumber);
          return;
        }
        const validPhoneNumber = isPhoneNumberValid(iti);
        if (!validPhoneNumber.valid) {
          setHelperInvalid(phone, validPhoneNumber.message);
        }
        requestCreator('bank')
        console.log('done')

      })
    }
  })
})



const validateIFSC = (string) => {
  return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string)
}



const isPhoneNumberValid = (iti) => {
  var errorCode = iti.getValidationError();
  const result = {
    message: '',
    valid: false
  }
  if (errorCode) {
    result.message = getPhoneFieldErrorMessage(errorCode);
    return result
  }
  if (!iti.isValidNumber()) {
    result.message = 'Invalid number';
    return result
  }
  result.valid = true;
  return result;
}

const getPhoneFieldErrorMessage = (code) => {
  let message = ''
  switch (code) {
    case 1:
      message = 'Please enter a correct country code';
      break;

    case 2:
      message = 'Number is too short';
      break;
    case 3:
      message = 'Number is too long';
      break;
    case 4:
      message = 'Invalid Number'
      break;

    default:
      message = ''
      break
  }
  return message;
}