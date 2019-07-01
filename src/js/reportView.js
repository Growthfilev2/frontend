function reportView(){
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
    const searchIcon = `<a class='mdc-top-app-bar__action-item material-icons hidden' id='search-btn'>
        search
    </a>`

    const header = getHeader('app-header', backIcon,'');
    document.getElementById('app-header').classList.remove("hidden")
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')

    document.getElementById('tabs').innerHTML = showTabs()
    setTimeout(function () {
        tabList.activateTab(1);
    }, 0)
    const tabList = new mdc.tabBar.MDCTabBar(document.querySelector('#tabs .mdc-tab-bar'))
    console.log(tabList)
   

      tabList.listen('MDCTabBar:activated', function (evt) {
        document.getElementById('app-current-panel').innerHTML = ''
        if(!evt.detail.index) {
            document.getElementById('app-current-panel').innerHTML = `<div class='attendence-section pt-20 mdc-top-app-bar--fixed-adjust-with-tabs'>
    ${applyLeave()}
    ${attendenceCards()}
    </div>
    `
    return
        }
        if(evt.detail.index == 1){
            document.getElementById('app-current-panel').innerHTML =`<div class='mdc-top-app-bar--fixed-adjust-with-tabs'>${emptyClaims()}</div>`
        }
      })
    
}   

function showTabs(){
    return `<div class="mdc-tab-bar" role="tablist">
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
          <button class="mdc-tab mdc-tab--active" role="tab" aria-selected="true" tabindex="0">
            <span class="mdc-tab__content">
              <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">fingerprint</span>
              <span class="mdc-tab__text-label mdc-theme--on-primary">Attendence</span>
            </span>
            <span class="mdc-tab-indicator mdc-tab-indicator--active">
              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
            </span>
            <span class="mdc-tab__ripple"></span>
          </button>
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
          <span class="mdc-tab__content">
            <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true"></span>
            <span class="mdc-tab__text-label mdc-theme--on-primary">reimbursement</span>
          </span>
          <span class="mdc-tab-indicator">
            <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
          </span>
          <span class="mdc-tab__ripple"></span>
        </button>
        <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
        <span class="mdc-tab__content">
         
          <span class="mdc-tab__text-label mdc-theme--on-primary">Report 1</span>
        </span>
        <span class="mdc-tab-indicator">
          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
        </span>
        <span class="mdc-tab__ripple"></span>
      </button>
      <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
        <span class="mdc-tab__content">
          <span class="mdc-tab__text-label mdc-theme--on-primary">Report 2</span>
        </span>
        <span class="mdc-tab-indicator">
          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
        </span>
        <span class="mdc-tab__ripple"></span>
      </button><button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
      <span class="mdc-tab__content">
        <span class="mdc-tab__text-label mdc-theme--on-primary">Report 3</span>
      </span>
      <span class="mdc-tab-indicator">
        <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
      </span>
      <span class="mdc-tab__ripple"></span>
    </button><button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
    <span class="mdc-tab__content">
      <span class="mdc-tab__icon material-icons" aria-hidden="true">favorite</span>
      <span class="mdc-tab__text-label mdc-theme--on-primary">Report 4</span>
    </span>
    <span class="mdc-tab-indicator">
      <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
    </span>
    <span class="mdc-tab__ripple"></span>
  </button>
        </div>
      </div>
    </div>
  </div>`
}