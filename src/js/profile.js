
function profileScreen() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon  material-icons'>arrow_back</a>`
  const help = `<a href="https://wa.me/918595422858">HELP</a>`
  setHeader(backIcon, help);
  // const tabs
  
}


function profileView() {

  const root = `<div class="mdc-card demo-card" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});" onerror="imgErr(this)">
  <button class="mdc-fab mdc-fab--mini mdc-theme--primary-bg" aria-label="Favorite" style="
    position: fixed;
    top: 1rem;
    right: 1rem;">
      <span class="mdc-fab__icon material-icons">edit</span>
      <input id='choose-profile-image' type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>
  </button>
</div>

<div id='base-details'></div>
<div id='user-details'></div>  

`;

  document.getElementById('app-current-panel').innerHTML = root;
  setDetails()
}







function setDetails() {
  progressBar.close();
  document.getElementById('base-details').innerHTML = createBaseDetails()
  document.getElementById('user-details').innerHTML = createUserDetails();
  new mdc.list.MDCList(document.getElementById('basic-info-edit'));
  const input = document.getElementById('choose-profile-image')
  input.addEventListener('change', function (evt) {
    getImageBase64(evt).then(function (dataURL) {
      document.querySelector('.mdc-card__media.mdc-card__media--16-9').style.backgroundImage = `url(${dataURL})`
      return requestCreator('backblaze', {
        'imageBase64': dataURL
      })
    }).then(function () {
      snacks('Profile picture updated')
      firebase.auth().currentUser.reload();
    }).catch(function(error){
      snacks('Try again later')
    })
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
  <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['updateName'],null,null);updateName(function(){history.back()})">edit</span>
  </li>
  <li class='mdc-list-item'>
  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">email</span>
  ${auth.email || '-'}
  <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['emailUpdation'],null,null);emailUpdation(false,function(){history.back()})">edit</span>
  </li>
  <li class='mdc-list-item'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">phone</span>
    ${auth.phoneNumber}
    <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="phoneNumberChangeUI()">edit</span>
  </li>
  <li class='mdc-list-item'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">account_balance</span>
    Bank accounts
    <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['bankAccount'], null, null);bankAccount()">edit</span>
  </li>
  <li class='mdc-list-item'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">verified_user</span>
    Id proofs
    <span class="mdc-list-item__meta material-icons mdc-theme--primary" aria-hidden="true" onclick="history.pushState(['idProofView'],null,null);idProofView(function(){history.back()})">edit</span>
  </li>
  </ul>
</div>`
}

function bankAccount() {
  getProfileInformation().then(function (rootRecord) {
    const accounts = rootRecord.linkedAccounts

    console.log(accounts);
    const auth = firebase.auth().currentUser;
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
      <span class="mdc-top-app-bar__title">Bank accounts</span>
      `
    setHeader(backIcon, '');
    document.getElementById('app-current-panel').innerHTML = `
      <ul class='mdc-list mdc-list--two-line' id='bank-list'>
      ${accounts.map(function(account,index){
          return `<li class='mdc-list-item' data-index="${index}">
            <span class="mdc-list-item__text">
              <span class="mdc-list-item__primary-text">${account.bankAccount}</span>
              <span class="mdc-list-item__secondary-text">${account.ifsc}</span>
          </span>
          <span class='mdc-list-item__meta material-icons mdc-theme--error'  data-account="${getLast4digitsOfAccount(account.bankAccount)}">delete</span>
          </li>`
      }).join("")}
      </ul>
      `
    const list = new mdc.list.MDCList(document.getElementById('bank-list'));
    list.selectedIndex = 0;

    [].map.call(document.querySelectorAll('.bank-account-remove'), function (el) {
      if (!el) return;
      el.addEventListener('click', function () {
        const number = el.dataset.account;
        requestCreator('removeBankAccount', {
          bankAccount: number
        }).then(function () {
          const uid = firebase.auth().currentUser.uid
          const tx = db.transaction('root', 'readwrite');
          const store = tx.objectStore('root');
          let newRootRecord;
          store.get(uid).onsuccess = function (event) {
            newRootRecord = event.target.result;
            const index = Number(el.parentNode.dataset.index);
            newRootRecord.linkedAccounts.splice(index, 1);
            store.put(newRootRecord)
          }
          tx.oncomplete = function () {
            el.parentNode.remove();
            snacks(`Account removed`)
          }
        }).catch(function(error){
          snacks(error.message);
        });
      })
    })

    const addNewBtn = actionButton('Add BANK ACCOUNT');
    addNewBtn.querySelector('.mdc-button').addEventListener('click', function () {
      if (!auth.email || !auth.emailVerified) {
        history.pushState(['emailUpdation'], null, null)
        emailUpdation(true, profileView)
        return
      }
      history.pushState(['addNewBankAccount'], null, null);
      addNewBankAccount(function () {
        reloadPage();
      });
    })
    document.getElementById('app-current-panel').appendChild(addNewBtn);

  })
}

function getLast4digitsOfAccount(accountNumber) {
  return accountNumber.substr(accountNumber.length - 4)
}

function validateIFSC(string) {
  return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string)
}

function addNewBankAccount(callback) {
  const auth = firebase.auth().currentUser
  let backIcon = ''
  let actionBtn = ''
  if (history.state[0] === 'profileCheck') {
    backIcon = '<span class="mdc-top-app-bar__title">Add bank account</span>';
    actionBtn = createButton('SKIP','skip-header').outerHTML;
  } else {

    backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add Bank Account</span>
    `
  }
  setHeader(backIcon, actionBtn);
  document.getElementById('app-current-panel').innerHTML = `
  <div class='mdc-layout-grid'>
  <div class='add-bank-container mt-20'>
    
    ${!auth.email ?  `${textFieldWithHelper({
      id:'email',
      label:'Email',
      disabled:false,
      value:'',
      type:'number',
      required:true
    }).outerHTML}` : ''}

    ${textFieldWithHelper({
      id:'account-number',
      label:'Bank account number',
      disabled:false,
      value:'',
      type:'number',
      required:true
    }).outerHTML}
    
    ${textFieldWithHelper({
      id:'account-number-re',
      label:'Re-enter bank account number',
      disabled:false,
      value:'',
      type:'number',
      required:true
    }).outerHTML}
      
    ${textFieldWithHelper({
      id:'ifsc',
      label:'IFSC',
      disabled:false,
      value:'',
      type:'text',
      required:true
    }).outerHTML}

          
    ${textFieldWithHelper({
      id:'upi',
      label:'UPI',
      disabled:false,
      value:'',
      type:'text',
      required:true
    }).outerHTML}

  </div>
  </div>
  ${actionButton('SUBMIT','submit-btn').outerHTML}
  `;


  const submitBtn = new mdc.ripple.MDCRipple(document.getElementById('submit-btn'))
  submitBtn.root_.setAttribute('disabled', 'true');
  const fields = {};
  [].map.call(document.querySelectorAll('.mdc-text-field'), function (el) {
    const field = new mdc.textField.MDCTextField(el);
    field.input_.addEventListener('paste', function (e) {
      e.preventDefault();
    });
    field.root_.classList.add('full-width')
    fields[field.label_.root_.textContent] = field;
  });

  fields['Re-enter Bank Account Number'].input_.addEventListener('input', function () {
    if (fields['Re-enter Bank Account Number'].value !== fields['Bank Account Number'].value) {
      setHelperInvalid(fields['Re-enter Bank Account Number'], '')
      submitBtn.root_.setAttribute('disabled', 'true')
    } else {
      setHelperValid(fields['Re-enter Bank Account Number'])
      submitBtn.root_.removeAttribute('disabled')

    }
  })


  submitBtn.root_.addEventListener('click', function () {
    console.log(fields)
    const labels = Object.keys(fields);

    for (let index = 0; index < labels.length; index++) {
      const label = labels[index]
      const field = fields[label];
      if (!field.value) {
        setHelperInvalid(field, `${label} Cannot Be Empty`)

        return
      }
      field.helperTextContent = ''
    }

    if (fields['Re-enter Bank Account Number'].value !== fields['Bank Account Number'].value) {
      setHelperInvalid(fields['Re-enter Bank Account Number'], `Bank Account number do not match`)
      return;
    }

    if (!validateIFSC(fields['IFSC'].value)) {
      setHelperInvalid(fields['IFSC'], `Invalid IFSC code`);
      return;
    }


    if(!auth.email) {
      emailUpdate(fields['Email'],function(){
            requestCreator('newBankAccount', {
              bankAccount: fields['Bank account number'].value,
              ifsc: fields['IFSC'].value,
              address1: fields['IFSC'].value,
              displayName:auth.displayName,
              email:auth.email
            }).then(function () {
              snacks('New bank account added');
              if (callback) {
                callback()
              } else {
                history.back();
              }
            }).catch(function(error){
              snacks(error.message);
            })
      },function(){
        
      })
    }

  });

  const skipBtn = document.getElementById('skip-header');
  if (!skipBtn) return;
  new mdc.ripple.MDCRipple(skipBtn);
  skipBtn.addEventListener('click', function () {

    if (callback) {
      const rootTx = db.transaction('root', 'readwrite');
      const rootStore = rootTx.objectStore('root');

      rootStore.get(auth.uid).onsuccess = function (event) {
        const record = event.target.result;
        record.skipBankAccountAdd = true
        rootStore.put(record);
      }
      rootTx.oncomplete = function () {
        callback();
      }
      return
    }
    history.back();
  });
}

function phoneNumberChangeUI() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Change phone number</span>
  `
  setHeader(backIcon, '');
  document.getElementById("app-current-panel").innerHTML = `
  <div class='change-phone-number-ui mdc-layout-grid mt-20'>
      <div class='icon-container'>
        <div class='mdc-theme--primary icons'>
          <i class='material-icons'>sim_card</i>
          <i class='material-icons'>arrow_right_alt</i>
          <i class='material-icons'>sim_card</i>
        </div>
      </div>
      <div class='text-container'>
        <h3 class='mdc-typography--headline6'>Changing your phone number will migrate all your data to new number</h3>
        <p class='mdc-typography--body1'>
        Please confirm that you are able to receive SMS  at your new number.
        </p>
      </div>
  </div>
  ${actionButton('CONFIRM','confirm-btn').outerHTML}
  `
  document.getElementById('confirm-btn').addEventListener('click', function () {
    history.pushState(['changePhoneNumber'], null, null);
    changePhoneNumber();
  })
}

function changePhoneNumber() {
  const auth = firebase.auth().currentUser;

  document.getElementById('app-current-panel').innerHTML = `<div class='mdc-layout-grid change-phone-number mt-20'>
  
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
      <h3 class='mdc-typography--body1'>Enter your new phone number</h3>
        <div class='new-phone-number-container full-width'>
          ${textFieldTelephoneWithHelper({
              id:'new-phone-number',
              customClass:'new-number-field full-width',
              required:true
          }).outerHTML}  
        </div>
    </div>
  </div>
  ${actionButton('Update','change-number-btn').outerHTML}
  `

  const oldNumberField = new mdc.textField.MDCTextField(document.getElementById("old-phone-number"))
  const newNumberField = new mdc.textField.MDCTextField(document.getElementById("new-phone-number"));
  const iti = phoneFieldInit(newNumberField.input_);

  const submitBtn = document.getElementById('change-number-btn');

  submitBtn.addEventListener("click", function () {
    if (!iti.isValidNumber()) {
      setHelperInvalid(newNumberField, 'Please enter a correct number');
      return;
    }

    const newNumber = iti.getNumber(intlTelInputUtils.numberFormat.E164)
    if (oldNumberField.value === newNumber) {
      setHelperInvalid(newNumberField, 'New number cannot be similar to old number')
      return;
    }

    const dialog = new Dialog('Change Phone Number', `Are you sure you want to change your phone number ?`).create();
    dialog.buttons_[1].textContent = 'CONFIRM';
    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      appLocation(3).then(function (geopoint) {
        loadingScreen(['Phone number change is in progress']);
        document.getElementById('app-header').classList.add('hidden')
        requestCreator('changePhoneNumber', {
          newPhoneNumber: newNumber
        }, geopoint).then(function (response) {
          const tx = db.transaction('root', 'readwrite');
          const store = tx.objectStore('root')
          store.get(auth.uid).onsuccess = function (e) {
            const record = e.target.result;
            record.fromTime = 0;
            store.put(record)
          }
          tx.oncomplete = function () {
            reloadPage();
          }
        }).catch(function (error) {
          document.getElementById('app-header').classList.remove('hidden')
          history.back();
        })
      }).catch(handleLocationError)
    })
    dialog.open()
  })

}

function setHelperInvalid(field, message) {
  field.focus();
  field.foundation_.setValid(false);
  field.foundation_.adapter_.shakeLabel(true);

  field.helperTextContent = message
}

function setHelperValid(field) {
  field.focus();
  field.foundation_.setValid(true);
  field.helperTextContent = ''
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

      const mySupervisors = [me.attachment['First Supervisor'].value]
      if(me.attachment['Second Supervisor']) {
        mySupervisors.push(me.attachment['Second Supervisor'].value)
      }
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
                              return `<span>${report.attachment.Name.value}</span>  <span class="dots"></span>`
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
            store.get(member.attachment['Phone Number'].value).onsuccess = function (event) {
              const record = event.target.result;
              if (!record) return;
              team += addUserChips(record)
            }
          })
        };

        tx.oncomplete = function () {
          const superEl = document.getElementById('supervisors');
          const teamEl = document.getElementById('my-team')
          if (supers && superEl) {

            superEl.innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Supervisors</h1>
                  <div class="mdc-chip-set supervisor">
                  ${supers}
                  </div>
                  `
          }
          if (team && teamEl) {

            teamEl.innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Team</h1>
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
    'Phone Number': true,
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