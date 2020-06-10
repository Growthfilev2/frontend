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


function giveSubscriptionInit(office) {
    requestCreator('shareLink',{
        office:office
    }).then(function(response){
        const link = response.shortLink;
        const el = document.getElementById('app-current-panel')
        el.innerHTML = '';
        const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">Add users</span>
        `
        const header = setHeader(backIcon, '');
        header.root_.classList.remove('hidden')
        el.appendChild(shareWidget(link, office));
    }).catch(console.log)
}
