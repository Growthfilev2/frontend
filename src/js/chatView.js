function chatView(){
    history.pushState(['chatView'],null,null);
    hideBottomNav()
    const backIcon = `<a class='material-icons mdc-top-app-bar__navigation-icon mdc-theme--secondary'>arrow_back</a>`
    const header = getHeader('app-header',backIcon,'');
    // getChatList();
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('user');
    let string = ''
    index.openCursor().onsuccess = function(event){
        const cursor = event.target.result;
        if(!cursor) return;
        string += `<li class="mdc-list-item">
        <img class="mdc-list-item__graphic material-icons" aria-hidden="true" src='../img/src/empty-user.jpg' data-number=${cursor.value.user}>
        <span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">
            ${cursor.value.user}
        </span>
        <span class="mdc-list-item__secondary-text">
        ${cursor.value.comment}
        </span>
        </span>
        <span class="mdc-list-item__meta" aria-hidden="true">${moment}</span></li>
        `
        cursor.continue();

    }
    tx.oncomplete = function(){
        const ulInit = new mdc.list.MDCList(document.getElementById('chats'))
        console.log(ulInit)
        ulInit.singleSelection = true;
    }

}
function formatCreatedTime(createdTime) {
    if (!createdTime) return ''
    if (isToday(createdTime)) {
      return moment(createdTime).format('hh:mm')
    }
    return moment(createdTime).format('D, MMM').replace(',', '')
  }

function getChatList(){
    return `
    <div style="
    padding: 16px 16px 0px 16px;
">
    <div class="mdc-text-field text-field mdc-text-field--outlined mdc-text-field--with-leading-icon" style="
    width: 100%;
"><i class="material-icons mdc-text-field__icon">search</i><input type="text" id="text-field-outlined-leading" class="mdc-text-field__input"><div class="mdc-notched-outline mdc-notched-outline--upgraded"><div class="mdc-notched-outline__leading"></div><div class="mdc-notched-outline__notch" style=""><label class="mdc-floating-label" for="text-field-outlined-leading" style="">Search</label></div><div class="mdc-notched-outline__trailing"></div></div></div>
    <h1 class="mdc-typography--headline6" style="
    margin-bottom: 0;
">Messages</h1>
    </div>
    
    <ul class="mdc-list demo-list mdc-list--two-line mdc-list--avatar-list" id="chats">
   
    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="0" id="d9f4d3b4-e0db-44ca-8f4e-245e7590d9e6" style="--mdc-ripple-fg-size:360px; --mdc-ripple-fg-scale:1.7064; --mdc-ripple-fg-translate-start:36.6641px, -129.914px; --mdc-ripple-fg-translate-end:120px, -144px;"><img class="mdc-list-item__graphic material-icons" aria-hidden="true" src="./img/test.jpeg"><span class="mdc-list-item__text"><span class="mdc-list-item__primary-text">Shikhar</span><span class="mdc-list-item__secondary-text">Lorem Ipsum</span></span><span class="mdc-list-item__meta" aria-hidden="true">12:38 am</span></li>
   
    </ul>
    </ul>`
}