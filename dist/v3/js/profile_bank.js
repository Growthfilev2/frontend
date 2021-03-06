var db;
var acctNumber;
var confirmAcctNumber;
var ifsc;
var nameField;
var phone;
var submitBtn = document.getElementById('submit-btn');
window.addEventListener('load', function (ev) {
  window.mdc.autoInit();
  firebase.auth().onAuthStateChanged(function (user) {
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function (e) {
      db = req.result;
      acctNumber = document.getElementById('acct-number').MDCTextField;
      confirmAcctNumber = document.getElementById('confirm-acc-number').MDCTextField;
      nameField = document.getElementById('name').MDCTextField;
      phone = document.getElementById('phone-field-mdc').MDCTextField;
      phone.value = firebase.auth().currentUser.phoneNumber;
      ifsc = document.getElementById('ifsc').MDCTextField;
      var iti = phoneFieldInit(phone.input_);
      document.getElementById('form-account').addEventListener('submit', function (ev) {
        ev.preventDefault();

        if (!validateIFSC(ifsc.value)) {
          setHelperInvalid(ifsc);
          return;
        }

        if (confirmAcctNumber.value !== acctNumber.value) {
          setHelperInvalid(confirmAcctNumber);
          return;
        }

        var validPhoneNumber = isPhoneNumberValid(iti);

        if (!validPhoneNumber.valid) {
          setHelperInvalid(phone, validPhoneNumber.message);
        }

        submitBtn.classList.add('in-progress');
        requestCreator('newBankAccount', {
          bankAccount: acctNumber.value,
          ifsc: ifsc.value,
          name: nameField.value,
          bankPhoneNumber: iti.getNumber(intlTelInputUtils.numberFormat.E164)
        }).then(function (response) {
          console.log(response);
          snacks('Bank account added');
          setTimeout(function () {
            window.history.back();
          }, 4000);
        })["catch"](function (err) {
          submitBtn.classList.remomve('in-progress');
        });
        console.log('done');
      });
    };
  });
});

var validateIFSC = function validateIFSC(string) {
  return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string);
};

var isPhoneNumberValid = function isPhoneNumberValid(iti) {
  var errorCode = iti.getValidationError();
  var result = {
    message: '',
    valid: false
  };

  if (errorCode) {
    result.message = getPhoneFieldErrorMessage(errorCode);
    return result;
  }

  if (!iti.isValidNumber()) {
    result.message = 'Invalid number';
    return result;
  }

  result.valid = true;
  return result;
};

var getPhoneFieldErrorMessage = function getPhoneFieldErrorMessage(code) {
  var message = '';

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
      message = 'Invalid Number';
      break;

    default:
      message = '';
      break;
  }

  return message;
};