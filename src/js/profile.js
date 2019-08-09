function profileView() {


  const lastSignInTime = moment(firebase.auth().currentUser.metadata.lastSignInTime).format("dddd, MMMM Do YYYY, h:mm:ss a");
  const auth = firebase.auth().currentUser
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Profile</span>`
  const editIcon = ` <a  class="material-icons mdc-top-app-bar__action-item" aria-label="Edit" id='edit-profile'>edit</a>
  <a class=" mdc-top-app-bar__action-item hidden" aria-label="Edit" id='save-profile'>SAVE</a>
  `
  const header = getHeader('app-header', backIcon, editIcon);
  const root = `<div class="mdc-card demo-card" id='profile-card'>
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">
  
  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
  style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});" onerror="imgErr(this)">

</div>
<button class='mdc-button overlay-text'>
<i class='material-icons mdc-button__icon mdc-theme--on-primary'>add_a_photo</i>
<span class='mdc-button__label mdc-theme--on-primary'>
Choose Image
</span>
<input id='choose-profile-image' type='file' accept='image/jpeg;capture=camera'  class='overlay-text'>
</button>
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
  let newName;
  let newEmail;
  const currentName = auth.displayName;
  const currentEmail = auth.email;
  let imageSrc = firebase.auth().currentUser.photoURL;

  document.getElementById('edit-profile').addEventListener('click', function (evt) {
    console.log(header);
    header.iconRipples_[0].root_.classList.add('hidden')
    header.iconRipples_[1].root_.classList.remove('hidden')
    history.pushState(['edit-profile'], null, null);
    document.getElementById('base-details').innerHTML = ''
    document.querySelector('.mdc-card .mdc-card__actions').classList.add('hidden')
    document.querySelector('#user-details').innerHTML = createEditProfile(currentName, currentEmail);
    nameInit = new mdc.textField.MDCTextField(document.getElementById('name'));
    emailInit = new mdc.textField.MDCTextField(document.getElementById('email'));


    const imageBckg = document.querySelector('.mdc-card__media');
    imageBckg.classList.add('reduced-brightness');
    document.querySelector('.mdc-button.overlay-text').classList.add('show');

    const input = document.getElementById('choose-profile-image')
    document.querySelector('.overlay-text').style.opacity = 1;

    input.addEventListener('change', function (evt) {

      const files = input.files
      if (!files.length) return;
      const file = files[0];
      var fileReader = new FileReader();
      fileReader.onload = function (fileLoadEvt) {
        const image = new Image();
        image.src = fileLoadEvt.target.result;
        image.onload = function () {
          const newSrc = resizeAndCompressImage(image);
          imageBckg.style.backgroundImage = `url(${newSrc})`
          imageSrc = newSrc;
        }
      }
      fileReader.readAsDataURL(file);
    })

  })
  document.getElementById('save-profile').addEventListener('click', function () {
    document.querySelector('.mdc-card .mdc-card__actions').classList.remove('hidden')
    newName = nameInit.value;
    newEmail = emailInit.value;
    progressBar.foundation_.open();

    if (imageSrc !== firebase.auth().currentUser.photoURL) {
      requestCreator('backblaze', {
        imageBase64: imageSrc
      }).then(function () {
        snacks('Profile Picture set successfully')
      }).catch(function (error) {
        snacks(error.response.message)
      });
    }
    if (newName !== auth.displayName) {
      auth.updateProfile({
        displayName: formatTextToTitleCase(newName)
      }).then(function () {
        snacks('Username Updated Successfully')
      })
    }

    if (newEmail !== auth.email) {
      if (!newEmail) {
        snacks('Please Enter An Email Address')
        progressBar.foundation_.close();
        return;
        
      }
      if(!emailReg(newEmail))  {
        snacks('Please Enter A Valid Email Address')
        progressBar.foundation_.close();
        return;
      }
      auth.updateEmail(newEmail).then(function () {
        auth.sendEmailVerification().then(function () {
          snacks('Verification Link has been Sent')
          history.back()
        }).catch(function (verificationError) {
          snacks(verificationError.message)

        })
      }).catch(function (error) {
        progressBar.foundation_.close();
        if (error.code === 'auth/requires-recent-login') {
          redirectParam.updateEmail = newEmail;
          redirectParam.verify = false;
          redirectParam.functionName = 'getSuggestions'
          showReLoginDialog('Email Update', 'Please login again to update your email address')
          return
        }
        handleError({
          message: error.code,
          body: JSON.stringify(error)
        })
      })
      return;
    }
    history.back();
  })

}







function setDetails() {
  progressBar.foundation_.close();
  document.getElementById('base-details').innerHTML = createBaseDetails()
  document.getElementById('user-details').innerHTML = createUserDetails();
  createViewProfile()

}

function createBaseDetails() {
  const auth = firebase.auth().currentUser;

  return `   <div class="basic-info seperator">

  <h1 class="mdc-typography--headline5 mb-0 mt-0" id='view-name'>
      ${auth.displayName || '-'}</h1>
  <h1 class="mdc-typography--headline6 mb-0 mt-0">
  <i class="material-icons meta-icon">email</i>
  <span id='view-email'>
          ${auth.email}
      </span>

  </h1>
  <h1 class="mdc-typography--headline6 mt-0"> 
  <i class="material-icons meta-icon">phone</i>

  <span
          class="mdc-typography--headline6">${auth.phoneNumber.substring(0,3)}</span> ${auth.phoneNumber.substring(3,auth.phoneNumber.length)}
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
  const template = `<div class="office-info seperator">
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