function homeView(subs, location) {
    progressBar.close();
    // navList.selectedIndex = 1;
    // document.querySelector(`[data-state="homeView"]`).classList.add('mdc-bottom-navigation__list-item--activated')
    // const headerImage = `<img  class="mdc-top-app-bar__navigation-icon mdc-theme--secondary header-photo" src='./img/empty-user.jpg'>`
    
    const header = getHeader('app-header', '', '');
    // header.setScrollTarget(document.getElementById('main-content'));
    // header.navIcon_.src = firebase.auth().currentUser.photoURL;
    header.listen('MDCTopAppBar:nav', handleNav);
    document.getElementById('app-header').classList.add('hidden')
    document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust')

    document.getElementById('app-current-panel').innerHTML =`
    <div class="container home-container">
    <div class="profile-container mdc-card">
    <div class="mdc-card__primary-action">
      <div class="simple">
  
        <img src="${firebase.auth().currentUser.photoURL}" class="image" id='profile-image-card'>
        <h3 class="mdc-typography--headline6">My Growthfile</h3>
      </div>
      <div class="actions">
        <div class="action">
  
          <span class="mdc-typography--body1" id='camera'><i class="material-icons">camera</i>Camera</span>
        </div>
        <div class="action">
          <span class="mdc-typography--body1" id='chat'><i class="material-icons">comment</i>Chats</span>
        </div>
      </div>
  
    </div>
  </div>
  
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">What do you want to do ? </h3>
  ${subs.suggested.length ? ` <h3 class="mdc-list-group__subheader">Suggestions</h3>
  <ul class="mdc-list subscription-list" id='suggested-list'>
    ${subs.suggested.map(function(sub){
    return `<li class='mdc-list-item' data-value='${JSON.stringify(sub)}'>
      ${sub.template}
      <span class='mdc-list-item__meta material-icons'>
        keyboard_arrow_right
      </span>
    </li>`
    }).join("")}
  </ul>` :''}
  </div>
  `
    history.pushState(['homeView',location], null, null)
    document.getElementById('camera').addEventListener('click',function(){
      snapView()
    })
    document.getElementById('chat').addEventListener('click',function(){
      history.pushState(['chatView'], null, null);
      chatView()
    })
    document.getElementById('profile-image-card').addEventListener('click',function(){
      history.pushState(['profileView'], null, null);
      profileView()
    })
    if (subs.suggested.length) {
      const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
      suggestedInit.singleSelection = true;
      suggestedInit.selectedIndex = 0
      suggestedInit.listen('MDCList:action', function (evt) {
        console.log(suggestedInit.listElements[evt.detail.index].dataset)
        history.pushState(['addView'], null, null);
        addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value), location)
      })
    }

  }