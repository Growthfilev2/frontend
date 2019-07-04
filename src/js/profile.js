function profileView() {
  drawer.open = false;
 
  document.getElementById('start-load').classList.add('hidden');
  document.getElementById('app-header').classList.remove('hidden')

  const lastSignInTime = firebase.auth().currentUser.metadata.lastSignInTime;
  const auth = firebase.auth().currentUser
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Profile</span>`
  const header = getHeader('app-header', backIcon, '');
  header.setScrollTarget(document.getElementById('main-content'));

  const root = `<div class="mdc-card demo-card" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});">
  <button id="edit-profile"
  class="mdc-icon-button mdc-theme--primary-bg mdc-theme--on-primary"
  aria-label="Add to favorites"
  aria-hidden="true"
  aria-pressed="false">

  <svg class='mdc-icon-button__icon  mdc-icon-button__icon--on' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
  <svg class='mdc-icon-button__icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>

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
    auth.updateProfile({
      displayName: newName
    }).then(function () {
      // if (!isEmailValid(newEmail, currentEmail)) return setDetails();
      requestCreator('updateEmail', {
        email: emailInit.value
      }).then(function () {
        snacks('Verification Link has been Sent to ' + emailInit.value)

        setDetails();
      }).catch(function(error){
        progressBar.close();
        if(error) {
          snacks(error.response.message)
        }
        else {
          snacks('Please Try Again Later')
        }
      })
    })
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
  <h1 class="mdc-typography--headline6 mb-0 mt-0">
  <svg class='meta-icon' fill='#cccccc' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
  <span id='view-email'>
          ${firebase.auth().currentUser.email}
      </span>

  </h1>
  <h1 class="mdc-typography--headline6 mt-0"> 
  <svg class='meta-icon' fill='#cccccc' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
  <span
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
  })
}

function createEditProfile(name, email) {

  return ` ${nameField(name)}

  ${emailField(email,'This Will Be Used For Sending Reports')}
    `
}

function nameField(name){
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
    ${user.photoURL ? `<img class="mdc-chip__icon mdc-chip__icon--leading" src=${user.photoURL}>`:`
    
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
