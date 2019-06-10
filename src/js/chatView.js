function chatView() {
    history.pushState(['chatView'], null, null);
    hideBottomNav()
    document.getElementById('start-load').classList.add('hidden');

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>

    </a>`

    const addIcon = `<a class='mdc-top-app-bar__action-item' onclick=newMessage()>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    </a>`

    const header = getHeader('app-header', backIcon, addIcon);
    // getChatList();
    readLatestChats()

}



function chatDom(currentChats, suggestions) {
return `<div class='user-chats'>

<div class="mdc-list-group">
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">Messages</h3>
  ${currentChats ?  '':selectNew()}
  <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='chats'>
    ${currentChats}
  </ul>
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">Suggestions</h3>
  <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='suggestions'>
        ${suggestions}
  </ul>
</div>
</div>`
}

function newMessage() {

}

function readLatestChats() {

    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('timestamp');
    let string = ''

    index.openCursor(null, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.user === firebase.auth().currentUser.phoneNumber) {
            cursor.continue();
            return;
        };

        string += userLi(cursor.value.user, cursor.value.comment, cursor.value.timestamp);
        cursor.continue();
    }
    tx.oncomplete = function () {
        let suggestion = '';
        if (string) {
            document.getElementById('app-current-panel').innerHTML = chatDom(string, '');
        } else {
            getSuggestions().then(function (suggestionString) {
                document.getElementById('app-current-panel').innerHTML = chatDom('', suggestionString);
            })
        }

        let currentChatsInit;
        let suggestionsInit;
        const currentChats = document.getElementById('chats')
        const suggestionsChats = document.getElementById('suggestions')
        if (currentChats) {
            currentChatsInit = new mdc.list.MDCList(currentChats);
        }
        if (suggestionsChats) {
            suggestionsInit = new mdc.list.MDCList(suggestionsChats)
        }

        // const ulInit = addUserLiToList(string, ul);
        // ulInit.singleSelection = true;
        // console.log(ulInit)
    }

    // ul.innerHTML = liString;
    // return new mdc.list.MDCList(ul)
}

function userLi(number, comment, time, photo) {
    return `<li class="mdc-list-item" onclick=enterChat(${number},${photo})>
    <img class="mdc-list-item__graphic material-icons" aria-hidden="true" src=${photo || '../src/img/empty-user.jpg'} data-number=${number}>
    <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${number}
    </span>
    <span class="mdc-list-item__secondary-text">
    ${comment}
    </span>
    </span>
    <span class="mdc-list-item__meta" aria-hidden="true">${formatCreatedTime(time)}</span>
    </li>`
}

function getSuggestions() {
    return new Promise(function (resolve, reject) {

        let teamString = '';
        let superString = '';
        Promise.all([getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees'), getEmployeeDetails(IDBKeyRange.only(1), 'team')]).then(function (result) {
            const tx = db.transaction(['users']);
            const store = tx.objectStore('users');
            const self = result[0]
            const team = result[1];
            if (!self.length && !team.length) {
                return;
            }
            if (self.length) {
                self.forEach(function (record) {
                    if (record.attachment['First Supervisor'].value) {
                        store.get(record.attachment['First Supervisor'].value).onsuccess = function (event) {
                            const userRecord = event.target.result;
                            if (!userRecord) return;
                            superString += userLi(userRecord.displayName || userRecord.mobile, 'First Supervisor', '', userRecord.photoURL)
                        }
                    };

                    if (record.attachment['Second Supervisor'].value) {
                        store.get(record.attachment['Second Supervisor'].value).onsuccess = function (event) {
                            const userRecord = event.target.result;
                            if (!userRecord) return;
                            superString += userLi(userRecord.displayName || userRecord.mobile, 'Second Supervisor', '', userRecord.photoURL)
                        }
                    }
                })
            }
            if (team.length) {
                team.forEach(function (person) {
                    store.get(person.attachment['Employee Contact'].value).onsuccess = function (event) {
                        const userRecord = event.target.result;
                        if (!userRecord) return;
                        teamString += userLi(userRecord.displayName || userRecord.mobile, person.attachment.Designation.value, '', userRecord.photoURL)
                    }
                })
            }
            tx.oncomplete = function () {
                return resolve(superString+teamString)
                
            }
        })
    })
}

function selectNew() {
    return `<div class='new-message-container'>
        <h2 class='mdc-typography--headline5'>Message Team With Direct</h2>
    <p>Send private message.... </p>
    <button class='mdc-button' onclick=newMessage()>
    <span class="mdc-button__label">Send Message</span>
    </button>
    </div>`
}

function formatCreatedTime(createdTime) {
    if (!createdTime) return ''
    if (isToday(createdTime)) {
        return moment(createdTime).format('hh:mm')
    }
    return moment(createdTime).format('D, MMM').replace(',', '')
}

function isToday(comparisonTimestamp) {
    const today = new Date();
    if (today.setHours(0, 0, 0, 0) == new Date(comparisonTimestamp).setHours(0, 0, 0, 0)) {
        return true
    }
    return false;
}

function enterChat(number,photo){
    history.pushState(['userChat'],null,null);
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>`
    const header = getHeader('app-header', backIcon, '');

    document.getElementById('app-current-panel').innerHTML =  `
    <div class="wrapper">
        <div class="inner" id="inner">
          <div class="content" id="content"></div>
        </div>
        <div class="bottom" id="bottom">
        <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
        <textarea class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100" autofocus="true" id='comment-textarea'></textarea></div>
    <button id='comment-sent' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"
      style="z-index: 9;">
      <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    </button>
  </div>
        </div>
    </div>`
    getUserChats(number,photo)
}



function messageBox (comment,position,image){
    return `<div class="message-wrapper ${position}">
    <img class="circle-wrapper" src=${image}>
    <div class="text-wrapper">${comment}</div>
    </div>`
}

function getUserChats(number,opImage){
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('user')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const myImage = firebase.auth().currentUser.photoURL;
    const parent = document.getElementById('content');
    let timeLine = ''
    let position = '';
    let image = ''
    index.openCursor(number).onsuccess = function(event){
        const cursor = event.target.result;
        if(!cursor) return;
        if(cursor.value.user === myNumber) {
            position = 'me';
            image = myImage
        }
        else {
            position = 'them';
            image = opImage;
        }
        timeLine += messageBox(cursor.value.comment,image)
        cursor.continue();
    }
    tx.oncomplete = function(){
        parent.innerHTML = timeLine;
        document.getElementById('comment-sent').addEventListener('click',function(){

        });

       document.getElementById('comment-textarea').addEventListener('keyup', function () {
            this.style.paddingTop = '25px';
            this.style.height = '5px'
            this.style.height = (this.scrollHeight) + "px";
            if (this.scrollHeight <= 300) {
                document.getElementById('comment-sent').style.bottom = (this.scrollHeight - 20) + "px";
            }
        });
    }
}
