function claimsView(){
    document.getElementById('app-header').classList.remove("hidden")
    // document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Reimbursements</span>
    `
    const header = getHeader('app-header', backIcon,'');
    document.getElementById('app-current-panel').innerHTML = emptyClaims();
}

function emptyClaims(){

    return  `<div class='empty-claims-section'>
        <h3 class='mdc-typography--headline6'>No open claims pending for payment</h3>
        <button class='mdc-button' id='apply-claim'>
             <span class='mdc-button--label'>Create A New Claim</span>
        </button>
    </div>`
}