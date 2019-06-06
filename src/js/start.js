
function showUserDetails() {
    const auth = firebase.auth().currentUser;
    return auth.email && auth.emailVerified;
}



function userDetails(reports, auth) {
    document.getElementById('start-load').classList.add('hidden');
    const panel = document.getElementById('app-current-panel')
    panel.classList.add('user-detail-bckg')
    panel.innerHTML = userDom();

    const progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'))
    progCard.close();
     send = new mdc.ripple.MDCRipple(document.getElementById('send'))

    let string = '';
    let base = '';
    let helperText = '';
    if (!auth.email) {
    base = 'Please Add Your Email Address'
    helperText = 'Enter Your Email Address'
    } else if (!auth.emailVerified) {
    base = 'Please Verify Your Email Address'
    send.root_.querySelector('span').textContent = 'Verify'
    }

    let sub = ''
    reports.forEach(function (val, idx) {
        string += `${val.attachment.Name.value} ${idx == reports.length -1? '' : ',' }`
    })
    sub = sub + string;

    document.getElementById('email-container').innerHTML = `<h2 class='mdc-typography--headline5'>${base}</h2>
    <p>You Have Been Added as a recipient in ${sub}</p>
    ${emailField(auth.email,`${helperText}`,true)}
    <button class="mdc-button hidden" id="change-email" style="
    float: right;
">
    <span class="mdc-button__label">Change Email</span>
  </button>
    `
     change = new mdc.ripple.MDCRipple(document.getElementById('change-email'));
     next = new mdc.ripple.MDCRipple(document.getElementById('next'));

     emailInit = new mdc.textField.MDCTextField(document.getElementById('email'));
    emailInit.input_.setAttribute('required', 'true');
    emailInit.root_.classList.add('mdc-text-field--focused')
    console.log(emailInit)
    change.root_.onclick = function () {
        emailInit.foundation_.setDisabled(false);
        change.root_.classList.add('hidden');
        next.root_.classList.add('hidden');
        send.root_.classList.remove("hidden");

    }
   next.root_.onclick =  function () {
     
        setTimeout(function(){
            firebase.auth().currentUser.reload();
            if (firebase.auth().currentUser.emailVerified)  return mapView();

             change.root_.classList.remove('hidden');
            snacks('You have not verified Your Email Address. Try Again')
        },2000)

    };

    send.root_.onclick = function () {
        // document.getElementById('next').classList.add('hidden')
        const newEmail = emailInit.value;
        if (!newEmail) {
            emailInit.root_.classList.add('mdc-text-field--focused')
            emailInit.foundation_.setHelperTextContent('Please Check Your Email');
            return;
        }
        emailInit.foundation_.setHelperTextContent('');
     
        send.root_.classList.add('hidden');
        progCard.open();
        if (timeDiff(auth.metadata.lastSignInTime) <= 5) {
           
            emailFlow(auth, newEmail).then(function () {
                progCard.close();
                snacks('Verification Link has Been Send To you Email Address');
                emailInit.foundation_.setDisabled(true);
                change.root_.classList.remove('hidden');
                next.root_.classList.remove('hidden');

              
            }).catch(function (error) {

                progCard.close();
                if (error.code === 'auth/too-many-requests') {
                    mapView();
                    snacks('You Can Also Update Your Email Address From Your Profile')
                    return;
                }
                send.root_.classList.remove('hidden');
                snacks(error.message)

            })
            // updateEmail(auth, newEmail, true);

        } else {

            newSignIn(newEmail, true);
        }
    }
};



function emailFlow(user, email) {
    return new Promise(function (resolve, reject) {
        user.updateEmail(email).then(function () {
            user.sendEmailVerification().then(function () {
                return resolve(true)
            }).catch(function (error) {
                return reject(error)
            });
        }).catch(function (error) {
            return reject(error)
        });
    })
}


function userDom() {
    return `<div class="mdc-card" id='user-fill'>
    <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate" id='card-progress'>
  <div class="mdc-linear-progress__buffering-dots"></div>
  <div class="mdc-linear-progress__buffer"></div>
  <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
    <span class="mdc-linear-progress__bar-inner"></span>
  </div>
  <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
    <span class="mdc-linear-progress__bar-inner"></span>
  </div>
</div>
    <div class="mdc-card__primary-action user-card">
    
    <div id='email-container'>
    
    </div>
  
    <div class='button'>
    <button class="mt-10  hidden mdc-button mdc-theme--primary-bg mdc-theme--text-primary-on-light" id='next' style='width:100%'>
    <span class="mdc-button__label">Next</span>
  </button>
    <button class="mt-20 mdc-button mdc-theme--primary-bg mdc-theme--text-primary-on-light" id='send' style='width:100%'>
    <span class="mdc-button__label">Update</span>
  </button>
 
    </div>

</div>
    `
}