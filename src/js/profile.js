function profileView() {


  const lastSignInTime = moment(firebase.auth().currentUser.metadata.lastSignInTime).format("dddd, MMMM Do YYYY, h:mm:ss a");
  const auth = firebase.auth().currentUser
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Profile</span>`

  const header = getHeader('app-header', backIcon, '');
  const root = `<div class="mdc-card demo-card" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});" onerror="imgErr(this)">
  <button class="mdc-fab mdc-fab--mini mdc-theme--primary-bg" aria-label="Favorite" style="
    position: fixed;
    top: 1rem;
    right: 1rem;
">
  <span class="mdc-fab__icon material-icons">edit</span>
  <input id='choose-profile-image' type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>

</button>
</div>

<div id='base-details'></div>
<div id='user-details'></div>  

`
  document.getElementById('app-current-panel').innerHTML = root;
  setDetails()

}







function setDetails() {
  progressBar.foundation_.close();
  document.getElementById('base-details').innerHTML = createBaseDetails()
  document.getElementById('user-details').innerHTML = createUserDetails();
  new mdc.list.MDCList(document.getElementById('basic-info-edit'));
  const input = document.getElementById('choose-profile-image')
  input.addEventListener('change', function (evt) {

    const files = input.files
    if (!files.length) return;
    const file = files[0];
    var fileReader = new FileReader();
    fileReader.onload = function (fileLoadEvt) {
      progressBar.open()
      const image = new Image();
      image.src = fileLoadEvt.target.result;
      image.onload = function () {
        const newSrc = resizeAndCompressImage(image);
        document.querySelector('.mdc-card__media.mdc-card__media--16-9').style.backgroundImage = `url(${newSrc})`
        requestCreator('backblaze', {
          imageBase64: newSrc
        }).then(function () {
          progressBar.close()
          snacks('Profile Picture Update Successfully')
          firebase.auth().currentUser.reload();
        }).catch(function (error) {
          progressBar.close()
          snacks(error.response.message)
        });
      }
    }
    fileReader.readAsDataURL(file);
  })
  createViewProfile()

}

function createBaseDetails() {
  const auth = firebase.auth().currentUser;

  return `<div class="basic-info seperator">
  <ul class='mdc-list' id='basic-info-edit'>
  <li class='mdc-list-item'>
  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">account_box</span>
  ${auth.displayName}
  <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['updateName'],null,null);updateName()">edit</span>
  </li>
  <li class='mdc-list-item'>
  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">email</span>
  ${auth.email || '-'}
  <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['emailUpdation'],null,null);emailUpdation(profileView,true)">edit</span>
  </li>
  <li class='mdc-list-item'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">phone</span>
    ${auth.phoneNumber}
    <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['changePhoneNumber'],null,null);changePhoneNumber()">edit</span>
  </li>
  <li class='mdc-list-item'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">account_balance</span>
    Bank Accounts
    <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['bankAccount'],null,null);bankAccount()">edit</span>
  </li>
  </ul>
</div>`
}

function bankAccount() {
  progressBar.open();
  requestCreator('paymentMethods').then(function (accounts) {
   
    console.log(accounts);
    const auth = firebase.auth().currentUser;
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Bank accounts</span>
    `
    const header = getHeader('app-header', backIcon, '');
    document.getElementById('app-current-panel').innerHTML = `
    <ul class='mdc-list mdc-list--two-line' id='bank-list'>
    ${accounts.map(function(account){
        return `<li class='mdc-list-item'>
          <span class="mdc-list-item__text">
            <span class="mdc-list-item__primary-text">${account.bankAccount}</span>
            <span class="mdc-list-item__secondary-text">${account.ifsc}</span>
        </span>
        <span class='mdc-list-item__meta material-icons bank-account-remove mdc-theme--error'  data-account="${getLast4digitsOfAccount(account.bankAccount)}">delete</span>
        </li>`
    }).join("")}
    </ul>
    `
    const list = new mdc.list.MDCList(document.getElementById('bank-list'));
    list.selectedIndex = 0;

    [].map.call(document.querySelectorAll('.bank-account-remove'), function (el) {
      if (!el) return;
      el.addEventListener('click', function () {
        progressBar.open()
        el.addEventListener('click', function () {
          const number = el.dataset.account;
          requestCreator('removeBankAccount', {
            bankAccount: number
          }).then(function () {
            snacks(`Account ${number} removed`)
          }).catch(function (error) {
            progressBar.close()
            snacks(error.response.message);
          })
        })
      })
    })

    const addNewBtn = createFab('add');
    addNewBtn.addEventListener('click', function () {
      if (!auth.email || !auth.emailVerified) {
        history.pushState(['emailUpdation'], null, null)
        emailUpdation(profileView, true)
        return
      }
      history.pushState(['addNewBankAccount'], null, null);
      addNewBankAccount();
    })
    document.getElementById('app-current-panel').appendChild(addNewBtn);

  }).catch(function(error){
    progressBar.close();
    snacks(error.response.message)
  })
}

function getLast4digitsOfAccount(accountNumber) {
  return accountNumber.substr(accountNumber.length - 4)
}

function addNewBankAccount() {
  const auth = firebase.auth().currentUser
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Add New Bank Account</span>
  `
  const header = getHeader('app-header', backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `
  <div class='mdc-layout-grid'>
  <div class='add-bank-container mt-20'>
    <div class='text-field-container  mt-10 mb-10'>
      ${textField({
        id:'name',
        label:'Name',
        type:'text',
        disabled:true,
        value:auth.displayName
      })}
     
    </div>
    <div class='text-field-container mt-10 mb-10'>
      ${textFieldTelephone({
        id:'phone',
        label:'Phonenumber',
        disabled:true,
        value:auth.phoneNumber
      })}
      
    </div>
    <div class='text-field-container mt-20'>
        ${textField({
          id:'email',
          label:'Email',
          disabled:true,
          value:auth.email && auth.emailVerified ? auth.email : '',
          type:'email'
        })}
        <div class="mdc-text-field-helper-line">
          <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	"></div>
        </div>
    </div>

    <div class='text-field-container mb-10'>
      ${textField({
        id:'account-number',
        label:'Bank Account',
        disabled:false,
        value:'',
        type:'text',
        required:true
      })}
      <div class="mdc-text-field-helper-line">
        <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	"></div>
      </div>
    </div>

    <div class='text-field-container mt-10 mb-10'>
      ${textField({
        id:'ifsc',
        label:'IFSC',
        disabled:false,
        value:'',
        type:'text',
        required:true
      })}
      <div class="mdc-text-field-helper-line">
        <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg"></div>
      </div>
    </div>

    <div class='text-field-container mt-10 mb-10'>
      ${textArea({
        id:'address',
        label:'Address',
        required:true
      })}
      <div class="mdc-text-field-helper-line">
        <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg	"></div>
      </div>
    </div>
    <button class='mdc-button mdc-button--raised full-width' id='submit-btn'>SUBMIT</button>
  </div>
  </div>
  `;



  const fields = {};
  [].map.call(document.querySelectorAll('.mdc-text-field'), function (el) {
    const field = new mdc.textField.MDCTextField(el);
    field.root_.classList.add('full-width')
    fields[field.label_.root_.textContent] = field;
  });


  const submitBtn = new mdc.ripple.MDCRipple(document.getElementById('submit-btn'))
  submitBtn.root_.addEventListener('click', function () {
    console.log(fields)
    const labels = Object.keys(fields)
    for (let index = 0; index < labels.length; index++) {
      const label = labels[index]
      const field = fields[label];
      if (!field.value) {
        setHelperInvalid(field)
        field.helperTextContent = `${label} Cannot Be Empty`
        return
      }
      field.helperTextContent = ''
    }
    progressBar.open();
    requestCreator('newBankAccount', {
      name: auth.displayName,
      email: auth.email,
      phoneNumber: auth.phoneNumber,
      bankAccount: fields['Bank Account'].value,
      ifsc: fields['IFSC'].value,
      address1: fields['Address'].value,
      type: 'bankTransfer'
    }).then(function () {
      snacks('New Bank Account Added');
      history.back();
    }).catch(function (error) {
      snacks(error.response.message)
      progressBar.close();
    })
  })
}


function changePhoneNumber() {
  const auth = firebase.auth().currentUser;
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Change Phone Number</span>
  `
  const header = getHeader('app-header', backIcon, '');
  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid change-phone-number'>
  
  <div class='change-number-form full-width'>
    <div class='old-phone-number-container'>
      ${textFieldTelephone({
        disabled:true,
        value:auth.phoneNumber,
        label:'Current phone number',
        id:'old-phone-number',
        customClass:'full-width'
      })}
    </div>
    <h3 class='mdc-typography--body1'>Enter your new phone number with country code</h3>
    <div class='new-phone-number-container full-width'>
    <span class="mdc-typography--headline5 plus-synbol">+</span>
      ${textFieldTelephone({
        disable:false,
        value:'91',
        id:'new-phone-number-country-code',
        customClass:'country-code'
      })}
     
      ${textFieldTelephone({
        disable:false,
        value:'',
        label:'New phone number',
        id:'new-phone-number',
        customClass:'new-number-field full-width'
      })}
     
    </div>
  
    <div class="mdc-theme--error mt-10"	id='change-number-helper'></div>
   
    <div  class='mb-10 mt-10'>
      <button class='mdc-button mdc-theme--primary-bg full-width' id='change-number-btn'>
      <span class='mdc-button__label mdc-theme--on-primary'>Change<span>
    </button>
  </div>

  </div>`

  const oldNumber = new mdc.textField.MDCTextField(document.getElementById("old-phone-number"))
  const newNumber = new mdc.textField.MDCTextField(document.getElementById("new-phone-number"));
  const countryCode = new mdc.textField.MDCTextField(document.getElementById('new-phone-number-country-code'))
  newNumber.focus();
  const submitBtn = document.getElementById('change-number-btn');

  submitBtn.addEventListener("click", function () {
    document.getElementById("change-number-helper").textContent = ''
    if (!countryCode.value) {
      setHelperInvalid(countryCode)
      document.getElementById("change-number-helper").textContent = 'Please Enter a country code';
      return;
    }
    if (!newNumber.value) {
      setHelperInvalid(newNumber)
      document.getElementById("change-number-helper").textContent = 'Please Enter your new mobile number';
      return;
    }
    const newNumberValue = '+' + countryCode.value + newNumber.value;

    if (oldNumber.value === newNumberValue) {
      setHelperInvalid(newNumber)
      document.getElementById("change-number-helper").textContent = 'Current phone number cannot be same as new phone number';
      return;
    }

    console.log(newNumberValue)
    const dialog = showReLoginDialog('Change Phone Number', `On clicking RE-LOGIN you will be logged out of the app. Login in again with ${newNumber.value} to change your phone number`);
    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      progressBar.open();
      const submitDialog = new Dialog('Please Wait', `<h3 class='mdc-typography--body1 mdc-theme--primary'>Do not close the app while transition is taking place.</h3>`).create('simple');
      submitDialog.open();
      console.log(submitDialog)
      submitDialog.scrimClickAction = '';

      requestCreator('changePhoneNumber', {
        newPhoneNumber: newNumberValue
      }).then(function (response) {
        setTimeout(function () {
          window.location.reload();
        }, 5000)
        console.log(response)
      }).catch(function (error) {
        progressBar.close();
        submitDialog.close();
        document.getElementById('app-current-panel').classList.remove('freeze')
        console.log(error)
        snacks(error.response.message);
      })
    })
  })

}

function setHelperInvalid(field) {
  field.focus();
  field.foundation_.setValid(false);
  field.foundation_.adapter_.shakeLabel(true);

}

function createUserDetails() {
  return `
  <div class="mdc-tab-bar" role="tablist">
  <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
          <div class="mdc-tab-scroller__scroll-content" id='tab-scroller'>
          </div>
      </div>
  </div>
</div>
<div id='my-details' class='pt-10'></div>

`
}

function createViewProfile() {

  getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees').then(function (myCreds) {
    let officeDom = '';

    myCreds.forEach(function (activity) {

      officeDom += addTabs(activity.office);
    })
    document.getElementById('tab-scroller').innerHTML = officeDom;
    const tabInit = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'));

    tabInit.listen('MDCTabBar:activated', function (evt) {

      const me = myCreds[evt.detail.index];
      const selectedOffice = me.office;

      const mySupervisors = [me.attachment['First Supervisor'].value, me.attachment['Second Supervisor'].value]

      document.getElementById('my-details').innerHTML = fillUserDetails(me);
      Promise.all([getEmployeeDetails([selectedOffice, 'recipient'], 'officeTemplate'), getEmployeeDetails([selectedOffice, 'leave-type'], 'officeTemplate'), getEmployeeDetails([1, selectedOffice], 'teamOffice')]).then(function (results) {
        const reports = results[0];
        const leaves = results[1];
        const myTeam = results[2];
        console.log(results);

        if (reports.length) {
          document.getElementById('reports').innerHTML = ` <h1 class="mdc-typography--subtitle1 mt-0">
                          Reports :
                          ${reports.map(function(report){
                              return `<span>${report.attachment.Name.value}</span>  <span class="dot"></span>`
                          }).join("")}
                          </h1>`
        }

        if (leaves.length) {
          document.getElementById('leaves').innerHTML = `<h1 class="mdc-typography--headline6 mb-0">
                          Annual  Leave Limit
                          ${leaves.map(function(leave,idx){
                             return `<h1 class="mdc-typography--headline6 mt-0 ${leaves.length - idx == 1 ? '' :'mb-0'}">${leave.attachment['Annual Limit'].value ? `${leave.attachment.Name.value} : ${leave.attachment['Annual Limit'].value}`:''} </h1>`
                          }).join("")}
                      </h1>`
        }
        const tx = db.transaction(['users']);
        const store = tx.objectStore('users');
        let team = '';
        let supers = '';

        mySupervisors.forEach(function (value) {
          store.get(value).onsuccess = function (event) {
            const record = event.target.result;
            if (!record) return;
            supers += addUserChips(record)

          }
        })

        if (myTeam.length) {
          myTeam.forEach(function (member) {
            store.get(member.attachment['Employee Contact'].value).onsuccess = function (event) {
              const record = event.target.result;
              if (!record) return;
              team += addUserChips(record)
            }
          })
        };

        tx.oncomplete = function () {
          if (supers) {
            document.getElementById('supervisors').innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Supervisors</h1>
                  <div class="mdc-chip-set supervisor">
                  ${supers}
                  </div>
                  `
          }
          if (team) {

            document.getElementById('my-team').innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Team</h1>
                  <div class="mdc-chip-set">
                  ${team}
                  </div>`
          }
        }

      })
    })
    tabInit.activateTab(0);
  })
}

function createEditProfile(name, email) {

  return ` ${nameField(name)}

  ${emailField(email,'This Will Be Used For Sending Reports')}
    `
}

function nameField(name) {
  return `<div class="mdc-typography mdc-typography--body2 p-10" id='card-body-edit'>
  <div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='name'>

  <svg class='mdc-text-field__icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
      <input class="mdc-text-field__input" value="${name}">
      <div class="mdc-line-ripple"></div>
      <label class="mdc-floating-label ${name ? 'mdc-floating-label--float-above' :''}">Name</label>
  </div>
  <div class="mdc-text-field-helper-line">
      <div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">
       This will be displayed on your public profile

      </div>
  </div>`
}

function emailField(email, label, setFocus) {
  return `<div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='email'>
  <svg class='mdc-text-field__icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
  <input class="mdc-text-field__input" type='email' value="${email}" autofocus=${setFocus ? 'true':'false'}>
  <div class="mdc-line-ripple"></div>
  <label class="mdc-floating-label ${email ? 'mdc-floating-label--float-above' :''} ">Email</label>
</div>
<div class="mdc-text-field-helper-line">
  <div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">
      ${label}
  </div>
</div>`
}

function addTabs(name) {


  return ` <button class="mdc-tab" role="tab">
        <span class="mdc-tab__content">
            <span class="mdc-tab__text-label">${name}</span>
        </span>
        <span class="mdc-tab-indicator">
            <span
                class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
        </span>
        <span class="mdc-tab__ripple"></span>
    </button>`


}

function addUserChips(user) {
  return `
  <div class="mdc-chip">
    ${user.photoURL ? `<img class="mdc-chip__icon mdc-chip__icon--leading" src=${user.photoURL} onerror="imgErr(this)">`:`
    
    <svg class="mdc-chip__icon mdc-chip__icon--leading" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z"/></svg>`}
    <div class="mdc-chip__text">${user.displayName || user.mobile}</div>
</div>`


}

function fillUserDetails(user) {
  const notAllowedFields = {
    'First Supervisor': true,
    'Second Supervisor': true,
    'Employee Contact': true,
    'Name': true
  }
  const template = `<div class="office-info">
${Object.keys(user.attachment).map(function(attachmentNames){
    return `${notAllowedFields[attachmentNames] ? '': `${user.attachment[attachmentNames].value ? `<h1 class="mdc-typography--subtitle1 mt-0">
    ${attachmentNames} : ${user.attachment[attachmentNames].value}
</h1>`:''}`}` 

}).join("")}



<div id='reports'>

</div>
</div>
<div class="hierchy pt-10 seperator">
<div id='supervisors'>
</div>

<div id='my-team' style='padding-bottom:10px'>
</div>
</div>

<div class="meta-hidden-details">
<div id='leaves'>

</div>

</div>

</div>

</div>
`
  return template
}

function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');
  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}


function isEmailValid(newEmail, currentEmail) {
  if (!newEmail) {
    return false;
  }
  return !(newEmail === currentEmail)

}