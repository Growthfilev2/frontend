function chooseAlternativePhoneNumber(alternatePhoneNumbers) {
    dom_root.innerHTML = `<div class='phone-number-choose ${alternatePhoneNumbers.length == 1 ? 'slider' :''}'>
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
function isAdmin(idTokenResult,office) {
    if (!idTokenResult.claims.hasOwnProperty('admin')) return;
    if (!Array.isArray(idTokenResult.claims.admin)) return;
    if (!idTokenResult.claims.admin.length) return;
    if(!office) return true;
    return idTokenResult.claims.admin.indexOf(office) > -1
   
}


function giveSubscriptionInit(office) {
    
    // requestCreator('shareLink',{
    //     office:office
    // }).then(function(response){
        history.pushState(['shareLink'], null, null);
        // const link = response.shortLink;    
        const link = 'https://growthfile.page.link/naxz'    
        const dialog = new Dialog('Invitation link',shareWidget(link, office)).create('simple'); 
        dialog.open();      
    // }).catch(console.log)
}
