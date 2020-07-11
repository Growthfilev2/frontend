function profileScreen() {
  removeSwipe()

  const backIcon = `<a class='mdc-top-app-bar__navigation-icon  material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Settings</span>`
  const header = setHeader(backIcon, '');
  header.root_.classList.remove('hidden')
  const auth = firebase.auth().currentUser;
  dom_root.classList.add('mdc-top-app-bar--fixed-adjust')
  dom_root.innerHTML = ''
  const ul = createElement('ul', {
    className: 'mdc-list mdc-list--two-line mdc-list--avatar-list'
  })
  const profileLi = createElement('li', {
    className: 'mdc-list-item'
  })
  profileLi.innerHTML = `<img class="mdc-list-item__graphic"  aria-hidden="true" src=${auth.photoURL || './img/empty-user.jpg'}  onerror="imgErr(this)">
  <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${auth.displayName}
    </span>
    <span class="mdc-list-item__secondary-text">
        ${auth.phoneNumber}
    </span>
  </span>`
  new mdc.ripple.MDCRipple(profileLi)

  profileLi.addEventListener('click',function(){
    history.pushState(['profileView'],null,null);
    profileView();
  })

  const bank = createList({
    icon: 'account_balance',
    primaryText: 'Bank account',
    secondaryText: 'Add or edit bank accounts'
  })
  bank.addEventListener('click', function () {
    history.pushState(['bankAccount'], null, null);
    bankAccount()
  })
  const ids = createList({
    icon: 'verified_user',
    primaryText: 'Id proofs',
    secondaryText: 'Aadhar , PAN'
  })
  ids.addEventListener('click', function () {
    history.pushState(['idProofView'], null, null);
    idProofView(function () {
      history.back()
    })
  });

  const help = createList({
    icon: 'help',
    primaryText: 'Help',
    secondaryText: 'Contact us,privacy,FAQ'
  })
  help.addEventListener('click', function () {
    history.pushState(['helpView'], null, null);
    helpView();
  })
  ul.appendChild(profileLi)
  ul.appendChild(createListDivider())
  // ul.appendChild(bank)
  // ul.appendChild(ids)
  ul.appendChild(help);
  dom_root.appendChild(ul)
}


function helpView() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon  material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Help</span>`
  const header = setHeader(backIcon, '');
  const ul = createElement('ul',{
    className:'mdc-list mdc-list--avatar-list help-list'
  });
  const contactUs = createElement('li',{
    className:'mdc-list-item'
  })
  contactUs.innerHTML = `
  <i class="mdc-list-item__graphic material-icons mdc-theme--secondary" aria-hidden="true">help</i>
  <a href='https://wa.me/+918595422858'>Contact us</a>`

  const faq = createElement('li',{
    className:'mdc-list-item'
  })
  faq.innerHTML = `
  <i class="mdc-list-item__graphic material-icons mdc-theme--secondary" aria-hidden="true">question_answer</i>
  <a href='https://growthfile.com/faq'>FAQ</a>`;

  const privacy = createElement('li',{
    className:'mdc-list-item'
  })
  privacy.innerHTML = `
  <i class="mdc-list-item__graphic material-icons mdc-theme--secondary" aria-hidden="true">privacy_tip</i>
  <a href='https://growthfile.com/legal'>Privacy policy</a>`;
  
  ul.appendChild(contactUs)
  ul.appendChild(createListDivider())
  ul.appendChild(faq)
  ul.appendChild(createListDivider())
  ul.appendChild(privacy);
  dom_root.innerHTML = '';
  dom_root.appendChild(ul);
}

function createList(attr) {
  const li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.innerHTML = `
    ${attr.icon ? `<i class="mdc-list-item__graphic material-icons mdc-theme--secondary" aria-hidden="true">${attr.icon}</i>` :''}
    ${attr.primaryText && attr.secondaryText ? ` <span class="mdc-list-item__text">
      <span class="mdc-list-item__primary-text">
        ${attr.primaryText}
      </span>
       <span class="mdc-list-item__secondary-text">
        ${attr.secondaryText}
      </span>` : attr.primaryText}
      ${attr.meta ? `<span class='mdc-list-item__meta material-icons'>${attr.meta}</span>` :''}
    </span>
  `
  new mdc.ripple.MDCRipple(li)
  return li;
}

function createListDivider(){
  return createElement('li',{
    className:'mdc-list-divider'
  })
}

function profileView() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon  material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Account</span>`

  const header = setHeader(backIcon, '');
  const root = `<div class="mdc-card demo-card" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});background-size:contain;" onerror="imgErr(this)">
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

  dom_root.innerHTML = root;
  setDetails()
}







function setDetails() {
  progressBar.close();
  document.getElementById('base-details').innerHTML = createBaseDetails()
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
    }).catch(function (error) {
      snacks('Try again later')
    })
  })

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
    dom_root.innerHTML = `
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
        }).catch(function (error) {
          snacks(error.message);
        });
      })
    })

    const addNewBtn = actionButton('Add BANK ACCOUNT');
    addNewBtn.querySelector('.mdc-button').addEventListener('click', function () {
      if (!auth.email || !auth.emailVerified) {
        history.pushState(['profileScreen'], null, null)
        emailUpdation(true, profileScreen)
        return
      }
      history.pushState(['addNewBankAccount'], null, null);
      addNewBankAccount(function () {
        reloadPage();
      });
    })
    dom_root.appendChild(addNewBtn);

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
    actionBtn = createButton('SKIP', 'skip-header').outerHTML;
  } else {

    backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add Bank Account</span>
    `
  }
  setHeader(backIcon, actionBtn);
  dom_root.innerHTML = `
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
  console.log(fields)

  fields['Re-enter bank account number'].input_.addEventListener('input', function () {
    if (fields['Re-enter bank account number'].value !== fields['Bank account number'].value) {
      setHelperInvalid(fields['Re-enter bank account number'], '')
      submitBtn.root_.setAttribute('disabled', 'true')
    } else {
      setHelperValid(fields['Re-enter bank account number'])
      submitBtn.root_.removeAttribute('disabled')

    }
  })


  submitBtn.root_.addEventListener('click', function () {
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

    if (fields['Re-enter bank account number'].value !== fields['Bank account number'].value) {
      setHelperInvalid(fields['Re-enter bank account number'], `Bank account number do not match`)
      return;
    }

    if (!validateIFSC(fields['IFSC'].value)) {
      setHelperInvalid(fields['IFSC'], `Invalid IFSC code`);
      return;
    }
    
    const requestBody =  {
      bankAccount: fields['Bank account number'].value,
      ifsc: fields['IFSC'].value,
      address1: fields['IFSC'].value,
      displayName: auth.displayName,
      email: auth.email,
      upi:fields['UPI'].value
    }
    if (!auth.email) {
      emailUpdate(fields['Email'], function () {
        createNewAccount(requestBody)
      })
      return
    }
    createNewAccount(requestBody)
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

function createNewAccount(body) {
  return requestCreator('newBankAccount', body).then(function () {
    snacks('New bank account added');
      history.back();
  }).catch(function (error) {
    snacks(error.message);
  })
}

function phoneNumberChangeUI() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Change phone number</span>
  `
  setHeader(backIcon, '');
  dom_root.innerHTML = `
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

  dom_root.innerHTML = `<div class='mdc-layout-grid change-phone-number mt-20'>
  
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


function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');
  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}


function isEmailValid(newEmail, currentEmail) {
  if (!newEmail) {
    return false;
  };
  return !(newEmail === currentEmail)
};

