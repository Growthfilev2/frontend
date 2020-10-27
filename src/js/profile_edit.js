let db;

let nameField;
let photo;
let emailField;
let uploadedBase64 = null
const submitBtn = document.getElementById('submit-btn');

const profileImage = document.getElementById('profile-image');

document.getElementById('upload-image').addEventListener('change',(ev)=>{
    getImageBase64(ev).then(base64=>{
        uploadedBase64 = base64;
        profileImage.src = base64;
    })
})
window.addEventListener("load", (ev) => {
    window.mdc.autoInit()
    const searchParams = new URLSearchParams(window.location.search);
    
    if (searchParams.has('askPhoto')) {
        document.querySelector('.form-field.photo').classList.remove('hidden');
        document.querySelector('.mdc-top-app-bar').classList.add('hidden')
        document.getElementById('edit_profile').classList.remove('mdc-top-app-bar--fixed-adjust')
    }

    nameField = document.getElementById('name').MDCTextField;
    emailField = document.getElementById('email').MDCTextField;

    firebase.auth().onAuthStateChanged((user) => {
        // loadProfileData(user)

        nameField.value = user.displayName || '';
        emailField.value = getUserEmail(user)

        if(user.photoURL) {
            uploadedBase64 = user.photoURL
            profileImage.src;
        }

        document.getElementById('profile-form').addEventListener('submit', (ev) => {
            ev.preventDefault();
            if (emailField.value && !emailReg(emailField.value)) {
                setHelperInvalid(emailField, 'Incorrect email');
                return
            }

            submitBtn.classList.add('in-progress')
            let prom;
            const trimmedName = nameField.value.split(" ").filter(v => v).join(" ");

            if (trimmedName === user.displayName) {
                prom = Promise.resolve();
            } else {
                prom = user.updateProfile({
                    displayName: trimmedName,
                })
            }
            prom.then(() => {
                    console.log('name updated');
                    if (user.photoURL !== uploadedBase64) {
                        requestCreator('backblaze', {
                            imageBase64: document.getElementById('profile-image').src
                        })
                        return
                    }
                    return Promise.resolve();
                }).then(() => {
                    console.log('photo updated');
                    if (user.email == (emailField.value || null)) return Promise.resolve(true);
                    return user.updateEmail(emailField.value)
                }).then((oldEmail) => {
                    console.log(oldEmail)
                    if (oldEmail) {
                        return Promise.resolve(true);
                    }
                    console.log('email updated');
                    return user.sendEmailVerification()
                }).then((oldVerification) => {
                    console.log(oldVerification)
                    let timeout = 1
                    if (!oldVerification) {
                        timeout = 5000
                        console.log('email verification send');
                        snacks('A verification mail has been sent to your inbox. Please click on the link in it to verify your email ID.', 6000);
                    }
                    setTimeout(() => {
                        submitBtn.classList.remove('in-progress')
                        if(searchParams.get('new_user') === "true") return redirect('/home')
                        snacks('Profile updated');
                    }, timeout)
                })
                .catch((error) => {
                    submitBtn.classList.remove('in-progress')

                    if (error.code === 'auth/requires-recent-login') {
                        const dialog = new mdc.dialog.MDCDialog(document.getElementById('email-dialog'));
                        dialog.listen('MDCDialog:closed', function (evt) {
                            if (evt.detail.action !== 'accept') return;
                            revokeSession(emailField.value);
                        })
                        dialog.open();
                        return;
                    }
                    snacks(error.message);
                })
        })
    });

});

const getUserEmail = (user) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('email')) {
        return searchParams.get('email')
    }
    return user.email || ''
}

const getFirstName = (string) => {
    if (!string) return ""
    return string.split(" ")[0]
}
const getLastName = (string) => {
    if (!string) return ""
    const split = string.split(" ");
    split.shift();
    return split.join(" ")
}

const emailReg = (email) => {
    const emailRegString = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegString.test(String(email).toLowerCase())
}

const revokeSession = (email) => {
    firebase.auth().signOut().then(function () {
        redirect(`/login.html?re_auth=1&email=${encodeURIComponent(email)}`)
    }).catch(function (error) {
        handleError({
            message: 'Sign out error',
            body: error
        });
    });
}