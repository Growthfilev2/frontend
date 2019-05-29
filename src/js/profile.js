function profileView(pushState) {
    document.getElementById('start-loader').classList.add('hidden')
    if (pushState) {
        history.pushState(['profileView'], null, null);
    }
    drawer.open = false
    // if (window.addEventListener) {
    //     window.removeEventListener('scroll', handleScroll, false)
    // }

    const sectionStart = document.getElementById('section-start');
    sectionStart.innerHTML = ''
    sectionStart.appendChild(headerBackIcon())

    const template = `<div class="mdc-card demo-card mdc-top-app-bar--fixed-adjust">
  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">

      <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"
          style="background-image: url(${firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg'});">
      </div>

      <button id="edit-button" class="mdc-icon-button without-icon-edit" aria-label="Add to favorites" aria-hidden="true"
          aria-pressed="false">
          <i class="material-icons mdc-icon-button__icon mdc-icon-button__icon--on white fs-30">check</i>
          <i class="material-icons mdc-icon-button__icon white fs-30">edit</i>
      </button>

      <div class="demo-card__primary p-10">
          <div class="view-profile">
              <div class="basic-info seperator">

                  <h1 class="mdc-typography--headline5 mb-0 mt-0" id='view-name'>${firebase.auth().currentUser.displayName || '-'}</h1>
                  <h1 class="mdc-typography--headline6 mb-0 mt-0"><i
                          class="material-icons meta-icon">email</i><span id='view-email'>
                          ${firebase.auth().currentUser.email}
                          </span>
                          
                          </h1>
                  <h1 class="mdc-typography--headline6 mt-0"> <i class="material-icons meta-icon">phone</i><span
                          class="mdc-typography--headline6">+91</span> 9999288921
                  </h1>
              </div>

              <div class="mdc-tab-bar pb-20" role="tablist">
                  <div class="mdc-tab-scroller">
                      <div class="mdc-tab-scroller__scroll-area">
                          <div class="mdc-tab-scroller__scroll-content" id='tab-scroller'>
                              
                          </div>
                      </div>
                  </div>
              </div>
              <div id='user-detail'></div>
              `
    document.getElementById('profile-view').innerHTML = template;
    getUniqueOfficeCount().then(function (offices) {
        console.log(offices)
        document.getElementById('tab-scroller').innerHTML = addTabs(offices);
        const tabInit = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'));
        //minor hack
        setTimeout(function () {
            tabInit.activateTab(0);
        }, 0)
        tabInit.listen('MDCTabBar:activated', function (evt) {
            getEmployeeDetails([firebase.auth().currentUser.phoneNumber, offices[evt.detail.index]], 'employeeOffice').then(function (employee) {
                document.getElementById('user-detail').innerHTML = fillUserDetails(employee[0])                
                Promise.all([getEmployeeDetails([offices[evt.detail.index], 'recipient'], 'officeTemplate'),getEmployeeDetails([offices[evt.detail.index], 'leave-type'], 'officeTemplate')]).then(function(results){
                    const reports = results[0];
                    const leaves = results[1];
                    console.log(results)
                    if(reports.length) {

                        document.getElementById('reports').innerHTML = ` <h1 class="mdc-typography--subtitle1 mt-0">
                        Reports :
                        ${reports.map(function(report){
                            return `<span>${report.attachment.Name.value}</span>  <span class="dot"></span>`
                        }).join("")}
                        </h1>`
                    }

                    if(leaves.length) {
                        document.getElementById('leaves').innerHTML =`<h1 class="mdc-typography--headline6 mb-0">
                        Remaining Leaves
                        ${leaves.map(function(leave){
                           return `<h1 class="mdc-typography--headline6 mt-0 mb-0">${leave.attachment.Name.value} : ${leave.attachment['Annual Limit'].value}</h1>`
                        }).join("")}
                    </h1>`
                    }

//                    
                })

            })
        })
    })
}

function addTabs(data) {

    return `${data.map(function(name){
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
      }).join("")}`

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

<h1 class="mdc-typography--subtitle1 mt-0">
    Joined : 5th September, 2018
</h1>
<div id='reports'>

</div>
</div>
<div class="hierchy pt-10">
${user.attachment['First Supervisor'].value || user.attachment['Second Supervisor'].value ? `<span class="mdc-typography--headline6 mt-0 mb-0">Supervisiors</span>
<div class="mdc-chip-set supervisor">

${user.attachment['First Supervisor'].value ?  `<div class="mdc-chip">
   <i class="material-icons mdc-chip__icon mdc-chip__icon--leading">supervisor_account</i>
   <div class="mdc-chip__text">${user.attachment['First Supervisor'].value}</div>
</div>`:''}

${user.attachment['Second Supervisor'].value ?  `<div class="mdc-chip">
<i class="material-icons mdc-chip__icon mdc-chip__icon--leading">supervisor_account</i>
<div class="mdc-chip__text">${user.attachment['Second Supervisor'].value}</div>
</div>`:''}
   
</div>`:''}

<div id='my-team'>
<span class="mdc-typography--headline6 mt-0 mb-0">Team</h1>
    <div class="mdc-chip-set supervisor">
            
            <div class="mdc-chip">
                <img class="mdc-chip__icon mdc-chip__icon--leading" src="sample.jpeg">
                <div class="mdc-chip__text">Syd</div>

            </div>
            <div class="mdc-chip">
                <i
                    class="material-icons mdc-chip__icon mdc-chip__icon--leading">supervisor_account</i>
                <div class="mdc-chip__text">Gilmour</div>

            </div>
            <div class="mdc-chip">
                    <img class="mdc-chip__icon mdc-chip__icon--leading" src="sample.jpeg">
                <div class="mdc-chip__text">Waters</div>

            </div>
            <div class="mdc-chip">
                <i class="material-icons mdc-chip__icon mdc-chip__icon--leading">supervisor_account</i>
                <div class="mdc-chip__text">+9199999288925</div>
            </div>
            <div class="mdc-chip">
                    <i class="material-icons mdc-chip__icon mdc-chip__icon--leading">add</i>
                    <div class="mdc-chip__text"> 10 Others</div>
            </div>
        </div>

</div>
</div>


<div class="meta-hidden-details" style="border-top: 1px solid rgba(0, 0, 0, 0.2)">
<div id='leaves'>

</div>


</div>

</div>

</div>
`
    return template
}




{/* <div class="mdc-typography mdc-typography--body2 p-10 hidden" id='card-body-edit'>
<div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='name'>

<i class="material-icons mdc-text-field__icon">account_circle</i>
<input class="mdc-text-field__input">
<div class="mdc-line-ripple"></div>
<label class="mdc-floating-label">Name</label>
</div>
<div class="mdc-text-field-helper-line">
<div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">
<i class="material-icons"></i>
</div>
</div>

<div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id='email'>
<i class="material-icons mdc-text-field__icon">email</i>
<input class="mdc-text-field__input">
<div class="mdc-line-ripple"></div>
<label class="mdc-floating-label">Email</label>
</div>
<div class="mdc-text-field-helper-line">
<div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">
This will be displayed on your public profile
</div>
</div>
</div>
</div>
<div class="mdc-card__actions">
<div class="mdc-card__action-buttons">
<span class="mdc-typography--headline6 last-logged-in-time"></span>
</div>

</div>
</div> */}