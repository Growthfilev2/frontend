function profileView(pushState) {
  if (pushState) {
    history.pushState(['profileView'], null, null);
  }
  if (window.addEventListener) {
    window.removeEventListener('scroll', handleScroll, false)
  }

  document.body.style.backgroundColor = '#eeeeee';
  var user = firebase.auth().currentUser;
  var dbName = user.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var rootTx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootTx.objectStore('root');
    rootObjectStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;
      rootObjectStore.put(record);
      rootTx.oncomplete = function () {
        createProfileHeader();
        createProfilePanel(db).then(function (view) {

          if (!document.getElementById('app-current-panel')) return;

          document.getElementById('app-current-panel').innerHTML = view.outerHTML;
          document.getElementById('close-profile--panel').addEventListener('click', function () {
            backNav();
          });

          if (native.getName() === 'Android') {
            document.getElementById('uploadProfileImage').addEventListener('click', function () {
              try {
                AndroidInterface.openImagePicker();
              }catch(e){
                sendExceptionObject(e,'CATCH Type 10:AndroidInterface.openImagePicker at profileview',[]);
              }
            })
          } else {
            inputFile('uploadProfileImage').addEventListener('change', function () {
              readUploadedFile()
            });
          }

          changeDisplayName(user);
          changeEmailAddress(user);
        })

      };
    };
  };
}

function inputFile(selector) {
  return document.getElementById(selector);
}

function createProfileHeader() {

  var backSpan = document.createElement('span');
  backSpan.id = 'close-profile--panel';
  var backIcon = document.createElement('i');
  backIcon.className = 'material-icons';

  backIcon.textContent = 'arrow_back';
  backSpan.appendChild(backIcon);
  modifyHeader({
    id: 'app-main-header',
    left: backSpan.outerHTML
  });
}

function createProfilePanel(db) {
  return new Promise(function (resolve) {
    
  
  getUserRecord(db,firebase.auth().currentUser.phoneNumber).then(function(userRecord){
    
      var profileView = document.createElement('div');
      profileView.id = 'profile-view--container';
      profileView.className = 'mdc-top-app-bar--fixed-adjust mdc-theme--background';

      var uploadBtn = document.createElement('button');
      uploadBtn.className = 'mdc-fab';
      if (native.getName() === 'Android') {
        uploadBtn.id = 'uploadProfileImage'
      }

      var label = document.createElement('label');
      label.setAttribute('for', 'uploadProfileImage');
      var btnText = document.createElement('span');
      btnText.className = 'mdc-fab__icon material-icons';
      btnText.textContent = 'add_a_photo';

      label.appendChild(btnText);
      uploadBtn.appendChild(label);
      let fileInput;
      if (native.getName() !== 'Android') {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.id = 'uploadProfileImage';
        fileInput.accept = 'image/jpeg;';
      }

      var profileImgCont = document.createElement('div');
      profileImgCont.id = 'profile--image-container';
      profileImgCont.className = 'profile-container--main';

      const dataObject = document.createElement('object');
      dataObject.type = 'image/jpeg';
      dataObject.data = userRecord.photoURL || './img/empty-user-big.jpg';
      dataObject.id = 'user-profile--image';

      var profileImg = document.createElement('img');
      profileImg.src = './img/empty-user-big.jpg';
      profileImg.className = 'empty-user-profile'
      dataObject.appendChild(profileImg);

      var overlay = document.createElement('div');
      overlay.className = 'insert-overlay';

      profileImgCont.appendChild(dataObject);
      profileImgCont.appendChild(overlay);
      profileImgCont.appendChild(uploadBtn);
      if (native.getName() !== 'Android') {
        label.appendChild(fileInput);
      }

      var nameChangeCont = document.createElement('div');
      nameChangeCont.id = 'name--change-container';
      nameChangeCont.className = 'profile-psuedo-card';

      var toggleBtnName = document.createElement('button');
      toggleBtnName.className = 'mdc-icon-button material-icons hidden';
      toggleBtnName.id = 'edit--name';

      toggleBtnName.setAttribute('aria-hidden', 'true');
      toggleBtnName.setAttribute('aria-pressed', 'false');
      toggleBtnName.textContent = 'check';
      const currentName = firebase.auth().currentUser.displayName;


      nameChangeCont.innerHTML = `<div class="mdc-text-field" id='name-change-field'>
        <input autocomplete="off" type="text"  placeholder="${currentName ? '' : 'Enter Your Name'}"  id="pre-filled-name" class="mdc-text-field__input" value="${currentName ? currentName : ''}">
        <label class="mdc-floating-label mdc-floating-label--float-above" for="pre-filled-name">
         Your Name
        </label>
        <div class="mdc-line-ripple"></div>
      </div>
      `

      nameChangeCont.appendChild(toggleBtnName);

      var emailCont = document.createElement('div');
      emailCont.id = 'email--change-container';
      emailCont.className = 'profile-psuedo-card';

      var toggleBtnEmail = document.createElement('button');
      toggleBtnEmail.className = 'mdc-icon-button material-icons hidden';
      toggleBtnEmail.id = 'edit--email';
      toggleBtnEmail.setAttribute('aria-hidden', 'true');
      toggleBtnEmail.setAttribute('aria-pressed', 'false');
      toggleBtnEmail.textContent = 'check';
      const currentEmail = firebase.auth().currentUser.email;

      emailCont.innerHTML = `<div class="mdc-text-field" id='email-change-field'>
        <input  autocomplete="off" type="text" id="pre-filled-email" class="mdc-text-field__input" value="${currentEmail ? currentEmail : ''}" placeholder="${currentEmail ? '' : 'Enter your Email'}">
        <label class="mdc-floating-label mdc-floating-label--float-above" for="pre-filled-email">
         Your Email
        </label>
        <div class="mdc-line-ripple"></div>
      </div>
      `


      emailCont.appendChild(toggleBtnEmail);


      profileView.appendChild(profileImgCont);
      profileView.appendChild(nameChangeCont);
      profileView.appendChild(emailCont);



      resolve(profileView)
    });
  })
}

function updateEmailDialog() {

  if (!document.getElementById('updateEmailDialog')) {
    var aside = document.createElement('aside');
    aside.className = 'mdc-dialog mdc-dialog--open';
    aside.id = 'updateEmailDialog';
    var surface = document.createElement('div');
    surface.className = 'mdc-dialog__surface';
    surface.style.width = '90%';
    surface.style.height = 'auto';
    var section = document.createElement('section');
    section.className = 'mdc-dialog__body';
    section.id = 'refresh-login'

    var footer = document.createElement('footer');
    footer.className = 'mdc-dialog__footer';

    var canel = document.createElement('button');
    canel.type = 'button';
    canel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel update-email-cancel';
    canel.textContent = 'Cancel';
    canel.style.backgroundColor = '#3498db';

    footer.appendChild(canel);

    surface.appendChild(section);
    surface.appendChild(footer)
    aside.appendChild(surface);
    document.body.appendChild(aside);

  }
}


function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');

  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}

function newSignIn(value, field) {
  updateEmailDialog()
  const dialogSelector = document.querySelector('#updateEmailDialog')
  var emailDialog = new mdc.dialog.MDCDialog(dialogSelector);
  emailDialog.show();
  try {
    if(!ui) {
      ui  = new firebaseui.auth.AuthUI(firebase.auth())
    }
    ui.start('#refresh-login', firebaseUiConfig(value));
    setTimeout(function () {
      document.querySelector('.firebaseui-id-phone-number').disabled = true;
      document.querySelector('.firebaseui-label').remove();
      document.querySelector('.firebaseui-title').textContent = 'Verify your phone Number to Update your Email address';
    }, 500)
    emailDialog.listen('MDCDialog:cancel', function () {
      field.value = firebase.auth().currentUser.email;
      dialogSelector.remove();
    });
  } catch (e) {
    dialogSelector.remove();
    console.log(e);
    handleError({
      message: `${e.message} from newSignIn function during email updation`
    });
    snacks('Please try again later');
  }
}

function readUploadedFile(image) {
  if (native.getName() === 'Android') {
    sendBase64ImageToBackblaze(image);
    return;
  }

  var file = inputFile('uploadProfileImage').files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function () {
    sendBase64ImageToBackblaze(reader.result);
    return;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
}

function sendBase64ImageToBackblaze(base64) {
  var selector = document.getElementById('user-profile--image');
  var container = document.getElementById('profile--image-container');
  const pre = 'data:image/jpeg;base64,';
  if (selector) {
    selector.data = pre + base64;
  }
  if (container) {
    document.getElementById('profile--image-container').appendChild(loader('profile--loader'));
  }
  var body = {
    'imageBase64': pre + base64
  };
  requestCreator('backblaze', body);
}

function authUpdatedError(error) {
  if (error.message !== 'auth/invalid-email') {
    handleError({
      message: `${error.message} from authUpdatedError`
    })
  }
  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  }
  snacks(error.message);
}

function changeDisplayName() {
  const nameField = document.getElementById('name-change-field')
  const name = new mdc.textField.MDCTextField(nameField)
  const nameChangeButton = document.getElementById('edit--name')
  const currentName = firebase.auth().currentUser.displayName


  nameField.addEventListener('click', function () {
    document.getElementById('pre-filled-name').placeholder = ''
    nameChangeButton.classList.remove('hidden')
    nameField.classList.add('short');

  })

  nameField.addEventListener('keydown', function (event) {
    if (event.keyCode == 13) {
      updateName(name.value);
    }
  })

  nameChangeButton.addEventListener('click', function () {
    updateName(name.value)
  })

}

function updateName(name) {

  if (!name) {
    snacks('Please Enter a Name');
    return;
  }

  firebase.auth().currentUser.updateProfile({
    displayName: name
  }).then(successDialog).catch(function (error) {
    snacks('Please Try again later');
    handleError({
      message: `${error} at updateProfile in changeDisplayName`
    })
  })
}

function changeEmailAddress() {
  const emailField = document.getElementById('email-change-field')
  const email = new mdc.textField.MDCTextField(emailField)
  const editEmail = document.getElementById('edit--email');

  emailField.addEventListener('click', function () {
    document.getElementById('pre-filled-email').placeholder = ''
    editEmail.classList.remove('hidden');
    emailField.classList.add('short');

  })

  emailField.addEventListener('keydown', function (event) {
    if (event.keyCode == 13) {
      emailValidation(email)
    }
  })

  editEmail.addEventListener('click', function () {
    emailValidation(email)
  })
}

function emailValidation(emailField) {
  const auth = firebase.auth().currentUser;


  const value = emailField.value
  if (!value) {
    snacks('Enter a valid Email Id');
    return;
  }
  if (value === auth.email && auth.emailVerified) {
    snacks('You have already set this as your email address');
    return;
  }
  if (timeDiff(auth.metadata.lastSignInTime) <= 2) {
    updateEmail(auth, value);
  } else {
    newSignIn(value, emailField);
  }
}

function updateEmail(user, email) {
  document.getElementById('growthfile').appendChild(loader('init-loader'));
  user.updateEmail(email).then(function(){
    emailUpdateSuccess(true)
  }).catch(authUpdatedError);
}

function emailUpdateSuccess(showSuccessDialog) {
  var user = firebase.auth().currentUser;
  user.sendEmailVerification().then(function(){
    emailVerificationSuccess(showSuccessDialog)
  }).catch(emailVerificationError);
}

function emailVerificationSuccess(showSuccessDialog) {
  if(showSuccessDialog){
    successDialog();
  };
  snacks('Verification link has been send to your email address');
}

function emailVerificationError(error) {
  snacks(error.message);
  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove()
  };
  
  handleError({
    message: `${error.message} from emailVerificationError`
  })
}