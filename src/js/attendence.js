function attendenceView(){
    document.getElementById('app-header').classList.remove("hidden")
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Attendence</span>
    `
   
    const header = getHeader('app-header', backIcon,'');
    document.getElementById('app-current-panel').innerHTML = `<div class='attendence-section pt-20'>
    ${applyLeave()}
    ${attendenceCards()}
    </div>
    `
    
}

function applyLeave(){
   
   return `<button class="mdc-button apply-leave">
   <i class="material-icons mdc-button__icon" aria-hidden="true">today</i>
   <span class="mdc-button__label">Apply For A New Leave</span>
 </button>`
}

function attendenceCards(){
    return `<div class='cards-container mdc-layout-grid__inner mt-20 pt-20'>
    ${[1,2,3].map(function(){
        return `<div class="mdc-card mdc-layout-grid__cell">
        <div class="mdc-card__primary-action demo-card__primary-action">
        <div class="">
            <h2 class="demo-card__title mdc-typography mdc-typography--headline6">Our Changing Planet</h2>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">by Kurt Wagner</h3>
        </div>
        <div class="demo-card__secondary mdc-typography mdc-typography--body2">Visit ten places on our planet that are undergoing the biggest changes today.</div>
        <div class="card-actions mt-20">
        <button class="mdc-button" style="
/* width: 100%; */
">
            <span class="mdc-button__label" style="
text-align: left;
">Regularize Attendece</span>
        </button><button class="mdc-button" style="
/* margin: 0 auto; */
/* display: block; */
/* width: 100%; */
">
            <span class="mdc-button__label">Apply Leave</span>
        </button>
        
        </div>
        </div>
 
    </div>`
    }).join("")}
    </div>`
}

