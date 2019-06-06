function profileView() {
  history.pushState(['profileView'], null, null);
  document.getElementById('start-load').classList.add('hidden')
  const lastSignInTime = firebase.auth().currentUser.metadata.lastSignInTime;
  const auth = firebase.auth().currentUser
  const backIcon = `<a class='material-icons mdc-top-app-bar__navigation-icon'>arrow_back</a>`
  const header = getHeader('app-header',backIcon,'');
  header.setScrollTarget(document.getElementById('main-content'));

  const root = `<div class="mdc-card demo-card mdc-top-app-bar--dense-fixed-adjust" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});">
  <button id="edit-profile"
  class="mdc-icon-button mdc-theme--primary-bg mdc-theme--on-primary"
  aria-label="Add to favorites"
  aria-hidden="true"
  aria-pressed="false">
  <i class="material-icons mdc-icon-button__icon mdc-icon-button__icon--on">check</i>
  <i class="material-icons mdc-icon-button__icon">edit</i>
</button>
</div>
<div id='base-details'></div>
<div id='user-details'></div>  
<div class="mdc-card__actions">
<div class="mdc-card__action-buttons">
    <span class="mdc-typography--headline6 last-logged-in-time">${lastSignInTime}</span>
</div>
</div>
`

  document.getElementById('app-current-panel').innerHTML = root;
  setDetails()

  const editInit = new mdc.iconButton.MDCIconButtonToggle(document.getElementById('edit-profile'))
  let newName;
  let newEmail;
  const currentName = auth.displayName;
  const currentEmail = auth.email;

  editInit.listen('MDCIconButtonToggle:change', function (evt) {
    if (evt.detail.isOn) {
      document.getElementById('base-details').innerHTML = ''
      document.querySelector('.mdc-card .mdc-card__actions').classList.add('hidden')

      document.querySelector('#user-details').innerHTML = createEditProfile(currentName, currentEmail);
      nameInit = new mdc.textField.MDCTextField(document.getElementById('name'));
      emailInit = new mdc.textField.MDCTextField(document.getElementById('email'));
      return;
    }
    document.querySelector('.mdc-card .mdc-card__actions').classList.remove('hidden')
    newName = nameInit.value;
    newEmail = emailInit.value;
    progressBar.foundation_.open();
    if (newName !== currentName && isEmailValid(newEmail, currentEmail)) {
      auth.updateProfile({
        displayName: newName
      }).then(function () {
        if (timeDiff(lastSignInTime) <= 2) {
          updateEmail(auth, newEmail);
        } else {
          newSignIn(newEmail);
        }
      })
      return
    }

    if (newName !== currentName && !isEmailValid(newEmail, currentEmail)) {
      auth.updateProfile({
        displayName: newName
      }).then(setDetails)
      return;

    }
    if (newName === currentName && isEmailValid(newEmail, currentEmail)) {
      if (timeDiff(lastSignInTime) <= 2) {
        updateEmail(auth, newEmail);
      } else {
        newSignIn(newEmail);
      }
      return;
    }
    setDetails()
  })

  console.log(editInit)

}


function setDetails() {
  progressBar.foundation_.close();
  document.getElementById('base-details').innerHTML = createBaseDetails()
  document.getElementById('user-details').innerHTML = createUserDetails();
  createViewProfile()

}

function createBaseDetails() {
  return `   <div class="basic-info seperator">

  <h1 class="mdc-typography--headline5 mb-0 mt-0" id='view-name'>
      ${firebase.auth().currentUser.displayName || '-'}</h1>
  <h1 class="mdc-typography--headline6 mb-0 mt-0"><i
          class="material-icons meta-icon mdc-theme--text-primary-on-dark">email</i><span id='view-email'>
          ${firebase.auth().currentUser.email}
      </span>

  </h1>
  <h1 class="mdc-typography--headline6 mt-0"> <i class="material-icons meta-icon mdc-theme--text-primary-on-dark">phone</i><span
          class="mdc-typography--headline6">+91</span> 9999288921
  </h1>
</div>`
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
    //minor hack
    setTimeout(function () {
      tabInit.activateTab(0);
    }, 0)
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
                          Remaining Leaves
                          ${leaves.map(function(leave,idx){
                             return `<h1 class="mdc-typography--headline6 mt-0 ${leaves.length - idx == 1 ? '' :'mb-0'}">${leave.attachment.Name.value} : ${leave.attachment['Annual Limit'].value}</h1>`
                          }).join("")}
                      </h1>`
        }
        const req = indexedDB.open(firebase.auth().currentUser.uid);
        req.onsuccess = function () {
          const db = req.result;
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
              console.log(supers)
              document.getElementById('supervisors').innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Supervisors</h1>
                  <div class="mdc-chip-set supervisor">
                  ${supers}
                  </div>
                  `
            }
            if (team) {
              console.log(team)

              document.getElementById('my-team').innerHTML = `<h1 class="mdc-typography--headline6 mt-0 mb-0">Team</h1>
                  <div class="mdc-chip-set">
                  ${team}
                  </div>`
            }
          }
        }
      })
    })
  })
}

function createEditProfile(name, email) {

  return ` <div class="mdc-typography mdc-typography--body2 p-10" id='card-body-edit'>
  <div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='name'>

      <i class="material-icons mdc-text-field__icon">account_circle</i>
      <input class="mdc-text-field__input" value="${name}">
      <div class="mdc-line-ripple"></div>
      <label class="mdc-floating-label ${name ? 'mdc-floating-label--float-above' :''}">Name</label>
  </div>
  <div class="mdc-text-field-helper-line">
      <div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">
       This will be displayed on your public profile

      </div>
  </div>

  ${emailField(email,'This Will Be Used For Sending Reports')}
</div>`
}

function emailField (email,label,setFocus){
  return `<div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='email'>
  <i class="material-icons mdc-text-field__icon">email</i>
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
    ${user.photoURL ? `<img class="mdc-chip__icon mdc-chip__icon--leading" src=${user.photoURL}>`:`<i class="material-icons mdc-chip__icon mdc-chip__icon--leading">supervisor_account</i>`}
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
  const template = `<div class="office-info seperator">
${Object.keys(user.attachment).map(function(attachmentNames){
    return `${notAllowedFields[attachmentNames] ? '': `${user.attachment[attachmentNames].value ? `<h1 class="mdc-typography--subtitle1 mt-0">
    ${attachmentNames} : ${user.attachment[attachmentNames].value}
</h1>`:''}`}` 

}).join("")}

<h1 class="mdc-typography--subtitle1 mt-0">
    Joined : ${moment(firebase.auth().currentUser.metadata.creationTime).format("Do MMM YYYY")}
</h1>

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

function updateEmail(user, email) {
  user.updateEmail(email).then(function () {
    emailUpdateSuccess(user)
  }).catch(console.log);
}

function emailUpdateSuccess(user,) {
  user.sendEmailVerification().then(function(){
    emailVerificationSuccess()
  }).catch(emailVerificationError);
  
}

function emailVerificationSuccess() {
  document.getElementById('dialog-container').innerHTML = ''
  snacks('Verification link has been send to your email address');

  setDetails();
}

function emailVerificationError(error) {
  snacks(error.message);
  try {
    progressBar.foundation_.close();
  }catch(e){
    console.log(e)
  }
}

function newSignIn(value,redirect) {
  const dialog = new Dialog('', createElement('div', {
    id: 'refresh-login'
  })).create();
  dialog.open();
  dialog.root_.querySelector('.mdc-dialog__content').style.padding = '0px';
  console.log(dialog)
  
  dialog.listen('MDCDialog:opened', function (evt) {
    dialog.buttons_.forEach(function(el){
      el.classList.add('hidden')
    })
    try {
      if (!ui) {
        ui = new firebaseui.auth.AuthUI(firebase.auth())
      }
      ui.start('#refresh-login', firebaseUiConfig(value,redirect));
      setTimeout(function () {
        document.querySelector('.firebaseui-id-phone-number').disabled = true;
        document.querySelector('.firebaseui-label').remove();
        document.querySelector('.firebaseui-title').textContent = 'Verify your phone Number';
      }, 500)

    } catch (e) {
      // dialogSelector.remove();
      console.log(e);
      handleError({
        message: `${e.message} from newSignIn function during email updation`
      });
      if(redirect) {
        mapView();
        return
      }
      snacks('Please try again later');
    }
  })


}