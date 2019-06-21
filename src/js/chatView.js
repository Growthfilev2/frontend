function chatView() {
    // if(!replaceState) {

    // showBottomNav()  
    // }
    // else {
    //     history.replaceState(['chatView'], null, null);
    // }
    // hideBottomNav()
    document.getElementById('start-load').classList.add('hidden');

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
    const searchIcon = `<a class='mdc-top-app-bar__action-item material-icons hidden' id='search-btn'>
        search
    </a>`

    const header = getHeader('app-header', backIcon, searchIcon);

    document.getElementById('search-btn').addEventListener('click', search)

    document.getElementById('app-header').classList.remove("hidden")
    document.getElementById('app-current-panel').innerHTML = chatDom()
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    const contactsBtn = new mdc.ripple.MDCRipple(document.querySelector('.open-contacts-btn'));
    contactsBtn.root_.addEventListener('click', function (evt) {
        contactsBtn.root_.remove();
        loadAllUsers().then(function (allUsers) {
            header.navIcon_.classList.remove('hidden')
            document.getElementById('search-btn').classList.remove('hidden')

            document.getElementById('chats').innerHTML = allUsers;
            // history.pushState(['search'],null,null)
            // const currentChats = document.getElementById('chats')
            // currentChatsInit = new mdc.list.MDCList(currentChats);
            // currentChatsInit.listen('MDCList:action', function (evt) {
            //     enterChat(JSON.parse(currentChatsInit.listElements[evt.detail.index].dataset.user),'pushState')
            // })

        })
    })
    readLatestChats();
}

function chatDom() {
    return `<div class='user-chats'>
    
<div id='search-users-container'>
    <div class='search-field'></div>
    <div class='search-result-container'></div>
</div>
    <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='chats'>
       
    </ul>
    <button class="mdc-fab app-fab--absolute open-contacts-btn mdc-theme--primary-bg" aria-label="Contacts">
        <span class="mdc-fab__icon material-icons mdc-theme--text-primary-on-light">contacts</span>
    </button>
</div>`
}

function search() {
    document.getElementById('app-header').classList.add("hidden")

    const searchField = `<div id='search-users' class="mdc-text-field mdc-text-field--with-leading-icon mdc-text-field--with-trailing-icon mdc-text-field--no-label">
        <i class="material-icons mdc-text-field__icon" tabindex="0" role="button" id='search-back'>arrow_back</i>
        <i class="material-icons mdc-text-field__icon hidden"  tabindex="0" role="button" id='clear-search'>clear</i>
        <input type="text" id="my-input" class="mdc-text-field__input" placeholder='Search...' style='padding-left:48px;padding-right: 48px;'>
        <div class="mdc-line-ripple"></div>
  </div>`

    document.querySelector('#search-users-container .search-field').innerHTML = searchField;

    const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
    searchInit.focus()
    const parent = document.querySelector('#search-users-container .search-result-container')
    searchInit.input_.addEventListener('input', function (evt) {
        searchInit.trailingIcon_.root_.classList.remove('hidden')
        if (!evt.target.value) {
            searchInit.trailingIcon_.root_.classList.add('hidden')
            parent.innerHTML = ''
            readLatestChats()
            return;
        }

        document.getElementById('chats').innerHTML = ''
        searchUsers(evt, parent)
    });

    searchInit.leadingIcon_.root_.onclick = function () {
        history.back()
    }
    searchInit.trailingIcon_.root_.onclick = function () {
        searchInit.value = ''
    }

}

function searchUsers(evt, parent) {

    let value = evt.target.value;
    let indexName;
    let currentChats = '';
    let newContacts = '';
    if (isNumber(value)) {
        indexName = 'mobile'
        value = formatNumber(value);
    } else {
        indexName = 'displayName'
    }
    const bound = IDBKeyRange.bound(value, value + '\uffff')
    const tx = db.transaction(['users', 'addendum']);
    const myNumber = firebase.auth().currentUser.phoneNumber;
    // tx.objectStore('addendum').index('user').openCursor(bound).onsuccess = function(event)
    tx.objectStore('users').index(indexName).openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        }
        // tx.objectStore('addendum').index('user').get(cursor.value.mobile).onsuccess = function (event) {
        //     const record = event.target.result;
        if (cursor.value.timestamp) {

            currentChats += userLi(cursor.value, cursor.value.comment, cursor.value.timestamp);
        } else {
            newContacts += userLi(cursor.value)
        }

        cursor.continue()
    }
    tx.oncomplete = function () {
        if (!currentChats && !newContacts) {
            parent.innerHTML = `<h3 class="mdc-list-group__subheader text-center">No Results Found</h3>`
            return;
        }
        const listGroup = `<div class="mdc-list-group" id='search-list-group'>
       ${currentChats ?` <h3 class="mdc-list-group__subheader">Chats</h3>
       <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list">
        ${currentChats}
       </ul>`:'' }
       ${newContacts ?`  <h3 class="mdc-list-group__subheader">Other Contacts</h3>
       <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list">
        ${newContacts}
       </ul>`:''}
      </div>`
        parent.innerHTML = listGroup;
        // [].map.call(document.querySelectorAll('#search-list-group ul'),function(el){
        //     const ul =  new mdc.list.MDCList(el)
        //       ul.listen('MDCList:action',function(evt){
        //         enterChat(JSON.parse(ul.listElements[evt.detail.index].dataset.user),'replaceState')
        //     })
        // })
    }
}

function isNumber(searchTerm) {
    return !isNaN(searchTerm)
}

function formatNumber(numberString) {
    let number = numberString;
    if (number.substring(0, 2) === '91') {
        number = '+' + number
    } else if (number.substring(0, 3) !== '+91') {
        number = '+91' + number
    }

    return number
}


function readLatestChats() {

    const tx = db.transaction('users');
    const index = tx.objectStore('users').index('timestamp');
    let string = ''
    const myNumber = firebase.auth().currentUser.phoneNumber
    index.openCursor(null, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        }
        console.log(cursor.value)
        string += userLi(cursor.value, cursor.value.comment, cursor.value.timestamp);
        cursor.continue();
    }
    tx.oncomplete = function () {
        let suggestion = '';
        if (string) {
            document.getElementById('search-btn').classList.remove('hidden')
        }


        document.getElementById('chats').innerHTML = string

    }

}

function userLi(userRecord, secondaryText, time, count) {
    return `<li class="mdc-list-item"  onclick=enterChat('${userRecord.mobile}')>
    <img class="mdc-list-item__graphic material-icons" aria-hidden="true" src=${userRecord.photoURL || './img/empty-user.jpg'} data-number=${userRecord.phoneNumber}>
    <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${userRecord.displayName || userRecord.mobile}
    </span>
    <span class="mdc-list-item__secondary-text">
    ${secondaryText || ''}
    </span>
    </span>
    <span class="mdc-list-item__meta" aria-hidden="true">
    ${count ? `<div class='chat-count'>${count}</div>` :''}
    
    ${time ? formatCreatedTime(time) : ''}</span>
    </li>`
}

function loadAllUsers() {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction(['users']);
        const store = tx.objectStore('users');
        const myNumber = firebase.auth().currentUser.phoneNumber
        let string = '';

        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.mobile === myNumber) {
                cursor.continue();
                return;
            }
            string += userLi(cursor.value, cursor.value.comment, cursor.value.timestamp);
            cursor.continue()
        }
        tx.oncomplete = function () {
            return resolve(string)
        }

    });
}


function selectNew() {
    return `<div class='new-message-container'>
        <h2 class='mdc-typography--headline5 mt-0 mb-0'>Message Team With Direct</h2>
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

function enterChat(number) {
    // const userRecord = JSON.parse(userRecordString)
    // debugger;

    // hideBottomNav()
    db.transaction('users').objectStore('users').index('mobile').get(number).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        const userRecord = record;
        const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>       
        </a>
        <img src=${userRecord.photoURL || './img/empty-user.jpg'} class='header-image'>
        <span class="mdc-top-app-bar__title">${userRecord.displayName || userRecord.mobile}</span>
        `

        const header = getHeader('app-header', backIcon, '');
        console.log(header)
        history.pushState(['enterChat'], null, null)

        document.getElementById('app-header').classList.remove("hidden")
        document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust')

        document.getElementById('app-current-panel').innerHTML = `
        <div class="wrapper">
        <div class="inner" id="inner">
        <div class="content" id="content"></div>
        </div>
        <div class="bottom" id="bottom">
        <div class="conversation-compose">
        
        <div id='comment-textarea' class="mdc-text-field text-field mdc-text-field--fullwidth mdc-text-field--no-label  mdc-text-field--textarea">
        
        <textarea id="text-field-fullwidth-textarea-helper" class="mdc-text-field__input mdc-text-field__input  input-msg">
        </textarea>
        
        </div>
        
        <button id='comment-send' class="mdc-fab send mdc-theme--primary-bg mdc-theme-on--primary" aria-label="Favorite">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
        </button>
        </div>
        
        </div>
        </div>
        </div>
        </div>`
        getUserChats(userRecord)
    }
}

function actionBox(value) {
    return `<div class="message-wrapper aciton-info" onclick="showActivity(${value.activityId})">
    <div class="text-wrapper">${value.comment}
    <span class="metadata">
    <i class='material-icons'>info</i>
    </span>
    </div>
    </div>`
}

function messageBox(comment, position, image, time) {
    return `<div class="message-wrapper ${position}">
    <img class="circle-wrapper" src=${image}>
    <div class="text-wrapper">${comment}
    <span class="metadata">
                      <span class="time">
        ${moment(time).format('hh:mm')}
</span></span>
    </div>
    </div>`
}

function showActivity(activityId) {
    db.transaction('activity').objectStore('activity').get(activityId).onsuccess = function (event) {
        const record = event.target.result;
        if (!record) return;
        const dialog = new Dialog('', activityDomCustomer(record), 'view-form').create('simple');
        dialog.open();
    }
}



function iconByType(type, name) {
    if (type === 'string') {
        if (name === 'Name') {
            return 'account_circle'
        }
        return 'info'
    }

    const iconObject = {
        'phoneNumber': 'phone',
        'HH:MM': 'access_time',
        'weekday': 'today',

    }
    return iconObject[type]
}

function activityDomCustomer(activityRecord) {
    console.log(activityRecord);

    return `
    <div class='mdc-card'>
    <div class='view-card'>
    <h2 class="demo-card__title mdc-typography mdc-typography--headline6">${activityRecord.activityName}</h2>
    <span class='card-time mdc-typography--caption1'>${activityRecord.timestamp}</span>
    <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ${activityRecord.creator.displayName || activityRecord.creator.phoneNumber}</h3>
    ${Object.keys(activityRecord.attachment).map(function(attachmentName){
       console.log(iconByType(activityRecord.attachment[attachmentName].type,attachmentName))
       return `${activityRecord.attachment[attachmentName].value ? `<h3 class="mdc-typography--body1  tasks-heading">
       <i class="material-icons">${iconByType(activityRecord.attachment[attachmentName].type,attachmentName)}</i>
       <span>${activityRecord.attachment[attachmentName].value}</span>
   </h3>` :''}`
   }).join("")}
   ${activityRecord.venue.map(function(v){
       return `
           <h3 class="mdc-typography--body1  tasks-heading">
               <i class="material-icons">location_on</i>
               <span>${v.address}</span>
           </h3>`
   }).join("")}
   <div class="assignees tasks-heading center">
           <i class="material-icons">share</i>
           <div class="mdc-chip-set" id='share'>
           ${activityRecord.assignees.map(function(user){
               return `<div class="mdc-chip" tabindex="0">
               ${user.photoURL ? `<img class="mdc-chip__icon mdc-chip__icon--leading" src=${user.photoURL}`:`  <i class="material-icons mdc-chip__icon mdc-chip__icon--leading">account_circle</i>`}
                   <div class="mdc-chip__text">${user.displayName || user.mobile}</div>
               </div>`
           }).join("")}
           </div>
           <div class='status-change'>
           <h3 class="mdc-typography--subtitle1 mb-0">Mark</h3>
           <div class='mdc-form-field'>
               ${createStatusChange(activityRecord.status)}
           </div>
           </div>
       </div>
    </div>
    
    
    <div class="mdc-card__actions">
    <div class="mdc-card__action-buttons">
 
    <button class="mdc-button">
        <i class="material-icons mdc-button__icon" aria-hidden="true">delete</i>
        <span class="mdc-button__label">Remove</span>
    </button>
    </div>
    <div class="mdc-card__action-icons">
   
    <button class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon " title="edit" data-mdc-ripple-is-unbounded="true">edit</button>
    </div>
    </div>
        
    </div>
</div>`
    
}

function createStatusChange(status){
if(status === 'CONFIRMED') {
    return createSimpleRadio('pending-radio','PENDING')+createSimpleRadio('cancelled-radio','CANCELLED')
} 
if(status === 'CANCELLED') {
    return createSimpleRadio('pending-radio','PENDING')+createSimpleRadio('confirmed-radio','CONFIRMED')

}
if(status === 'PENDING') {
    return createSimpleRadio('confirmed-radio','CONFIRMED')+createSimpleRadio('cancelled-radio','CANCELLED')

}
}

function getUserChats(userRecord) {
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('user')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
    const parent = document.getElementById('content');
    let timeLine = ''
    let position = '';
    let image = ''
    index.openCursor(userRecord.mobile).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.user === myNumber) {
            position = 'me';
            image = myImage
        } else {
            position = 'them';
            image = userRecord.photoURL || './img/empty-user.jpg'
        }
        if (cursor.value.isComment) {
            timeLine += messageBox(cursor.value.comment, position, image, cursor.value.timestamp)
        } else {
            timeLine += actionBox(cursor.value)
        }
        cursor.continue();
    }
    tx.oncomplete = function () {
        parent.innerHTML = timeLine;
        setBottomScroll()
        const btn = new mdc.ripple.MDCRipple(document.getElementById('comment-send'));
        const commentInit = new mdc.textField.MDCTextField(document.getElementById('comment-textarea'))
        const form = document.querySelector('.conversation-compose');
        const bottom = document.getElementById('bottom')
        btn.root_.addEventListener('click', function () {

            if (!commentInit.value.trim()) return;
            progressBar.open()
            requestCreator('comment', {
                comment: commentInit.value,
                activityId: "MvzCZw5ravEU4L3PWiKB",
            }).then(function () {
                parent.innerHTML += messageBox(commentInit.value, 'me', firebase.auth().currentUser.photoURL);
                commentInit.value = ''
                resetCommentField(bottom, form, commentInit.input_)
                setBottomScroll()
                progressBar.close()

            }).catch(function (error) {
                progressBar.close()

            })
        });
        commentInit.input_.addEventListener('input', function () {
            if (this.scrollHeight >= 200) return;

            this.style.paddingTop = '10px';

            this.style.lineHeight = '1'
            this.style.height = '5px'
            this.style.height = (this.scrollHeight) + "px";
            form.style.minHeight = '56px';
            form.style.height = 'auto'
            bottom.style.height = (this.scrollHeight + 20) + 'px'
            //not
            if (!this.value.trim()) {
                resetCommentField(bottom, form, this)

            }


        });
    }
}

function resetCommentField(bottom, form, input) {
    bottom.style.height = '72px'
    form.style.height = '56px';
    input.style.height = 'auto'
}

function setBottomScroll() {
    document.getElementById('inner').scrollTo(0, document.getElementById('inner').scrollHeight);

}

function getSelectedContact(contactString) {
    console.log(contactString);
    // const  contactSearch  = new URLSearchParams(contactString);
    // const userRecord = {
    //     displayName
    // }
}