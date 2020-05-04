function chooseAlternativePhoneNumber(alternatePhoneNumbers) {
    const auth = firebase.auth().currentUser;
    const appEl = document.getElementById('app-current-panel');
    appEl.innerHTML = `<div class='phone-number-choose ${alternatePhoneNumbers.length == 1 ? 'slider' :''}'>
            <div class='phone-number-choose-cont ${alternatePhoneNumbers.length == 1 ? 'slider-container' :''}''>
               
                ${alternatePhoneNumbers.length == 1 ? `<p class='mdc-typography--body1 pl-20 pr-20'>
                We found another number <span class='mdc-theme--primary'><b>${alternatePhoneNumbers[0].phoneNumber}</b></span> you used with this device for Company <span class='mdc-theme--primary'><b>${alternatePhoneNumbers[0].office}</b></span>. Login with this phone number to proceed
                </p>`:`<p class='mdc-typography--body1'>We found other numbers you used with this device . Login with any of these phone numbers to proceed</p>

                <ul class='mdc-list  mdc-list--two-line' id='phone-list'>                   
                    ${alternatePhoneNumbers.map(function(data){
                        return `<li class='mdc-list-item'>
                        <span class="mdc-list-item__text">
                          <span class="mdc-list-item__primary-text">${data.phoneNumber}</span>
                          <span class="mdc-list-item__secondary-text mdc-theme--primary">Company : ${data.office}</span>
                      </span>
                      </li>`
                    }).join("")}
                </ul>`}
              
            </div>
    </div>
    ${actionButton('RE-LOGIN', 'confirm-phone-btn').outerHTML}
    `

    const confirmBtn = document.getElementById("confirm-phone-btn");
    if (!confirmBtn) return;
    new mdc.ripple.MDCRipple(confirmBtn);
    confirmBtn.addEventListener('click', revokeSession);

}
function isAdmin(idTokenResult) {
    if (!idTokenResult.claims.hasOwnProperty('admin')) return;
    if (!Array.isArray(idTokenResult.claims.admin)) return;
    if (!idTokenResult.claims.admin.length) return;
    return true;
}

function isDeviceVersionLower(requiredVersionAndroid, requiredVersionIos) {
    const device = native.getInfo();

    if (native.getName() === 'Android') {
        return Number(device.appVersion) < requiredVersionAndroid
    }
    return Number(device.appVersion) < requiredVersionIos;
}

function giveSubscriptionInit(name, skip) {
    if (isDeviceVersionLower(17, 9)) {
        const template = {
            "assignees": [],
            "template": "subscription",
            "office": name
        };
        if (history.state[0] === 'addView') {
            history.replaceState(['addView'], null, null);
        } else {
            history.pushState(['addView'], null, null);
        }
        addView(template);
        return
    };


    const el = document.getElementById('app-current-panel')
    el.innerHTML = '';
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add users</span>
    `
    
    let header;
    if (skip) {
        const skipBtn = createButton('NEXT', 'skip-header');
        header = setHeader('', skipBtn.outerHTML);
        document.getElementById('skip-header').addEventListener('click', function () {
            window.location.reload();
        })
    } else {
        header = setHeader(backIcon, '');
    }

    header.root_.classList.remove('hidden')
    progressBar.open()
    createDynamicLinkSocialTags(name).then(function (socialInfo) {
        createDynamiclink(`?action=get-subscription&office=${name}&utm_source=share_link_employee_app&utm_medium=share_widget&utm_campaign=share_link`, socialInfo).then(function (link) {
            progressBar.close();
            el.appendChild(shareWidget(link, name));
        }).catch(function (error) {
            if (skip) {
                window.location.reload();
            }
            handleError({
                message: error.message,
                body: JSON.stringify(error)
            })
        })
    })
}

function createDynamicLinkSocialTags(office) {
    return new Promise(function (resolve, reject) {
        
        const socialInfo = {
            "socialTitle": `${office} @Growthfile`,
            "socialDescription": "No More Conflicts On Attendance & Leaves. Record Them Automatically!",
            "socialImageLink": 'https://growthfile-207204.firebaseapp.com/v2/img/ic_launcher.png'
        }
        const tx = db.transaction('children');
        const index = tx.objectStore('children').index('officeTemplate');
        index.get(IDBKeyRange.only([name, 'office'])).onsuccess = function (e) {
            const record = e.target.result;
            if (!record) return;
            socialInfo.socialImageLink = record.attachment['Company Logo'].value;

        }
        tx.oncomplete = function () {
            resolve(socialInfo);
        }
    })
}
