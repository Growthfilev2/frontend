

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    "sign-in-button", {
        //use size normal to show the captcha :)
        size: "invisible",
        callback: function (response) {
            submitPhoneNumberAuth();
        }
    }
);

//This Sends the Otp to the Mobile
function submitPhoneNumberAuth() {

    var phoneNumber = document.getElementById("phoneNumber").value;
    //Country Code appending
    phoneNumber = "+91" + phoneNumber;
    var appVerifier = window.recaptchaVerifier;
    firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier).then(function (confirmationResult) {
            window.confirmationResult = confirmationResult;
            document.getElementById('login_section').style.display = "none";
            document.getElementById('otp_section').style.display = "block";
        })
        .catch(function (error) {
            console.log(error);
        });
}

//OTP input in different boxes
function inputInsideOtpInput(el) {
    if (el.value.length > 1) {
        el.value = el.value[el.value.length - 1];
    }
    try {
        if (el.value == null || el.value == "") {
            this.foucusOnInput(el.previousElementSibling);
        } else {
            this.foucusOnInput(el.nextElementSibling);
        }
    } catch (e) {
        console.log(e);
    }
}

function foucusOnInput(ele) {
    ele.focus();
    let val = ele.value;
    ele.value = "";
    // ele.value = val;
    setTimeout(() => {
        ele.value = val;
    })
}

function collect_otp() {
    document.getElementById("code").value =
        document.getElementById("otp1").value +
        document.getElementById("otp2").value +
        document.getElementById("otp3").value +
        document.getElementById("otp4").value +
        document.getElementById("otp5").value +
        document.getElementById("otp6").value;
    submitPhoneNumberAuthCode();
}

//This Verifies The otp
function submitPhoneNumberAuthCode() {
    var code = document.getElementById("code").value;
    confirmationResult.confirm(code).then(function (result) {
           redirect('/')
        })
        .catch(function (error) {
            alert(error);
        });
}

var input = document.querySelector("#phoneNumber");
window.intlTelInput(input, {
    initialCountry: "IN",
    formatOnDisplay: true,
    separateDialCode: true,
    utilsScript: "external/js/utils.js"
});