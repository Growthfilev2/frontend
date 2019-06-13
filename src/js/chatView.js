function chatView(replaceState) {
    if(!replaceState) {
        history.pushState(['chatView'], null, null);
    }
    else {
        history.replaceState(['chatView'], null, null);
    }
    // hideBottomNav()
    document.getElementById('start-load').classList.add('hidden');

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
    const addIcon = `<a class='mdc-top-app-bar__action-item' onclick=newMessage()>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    </a>`
    const header = getHeader('app-header', backIcon, addIcon);
    readLatestChats();
}



function chatDom(currentChats, suggestions) {
    return `<div class='user-chats'>
    
<div id='search-users-container'>
<div id="search-users" class="mdc-text-field mdc-text-field--outlined mdc-text-field--with-leading-icon mdc-text-field--dense">
  <i class="material-icons mdc-text-field__icon">search</i>
  <input class="mdc-text-field__input">
  <div class="mdc-notched-outline">
    <div class="mdc-notched-outline__leading"></div>
    <div class="mdc-notched-outline__notch">
      <label class="mdc-floating-label">Search</label>
    </div>
    <div class="mdc-notched-outline__trailing"></div>
  </div>
</div>
</div>

</div>

</div>
<div class="mdc-list-group">
    ${currentChats ? '' : selectNew()}
    <div class='chats-list-container ${currentChats ? '':'hidden'}'>
        <h3 class="mdc-list-group__subheader mdc-typography--headline6">Messages</h3>
         <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='chats'>
         ${currentChats}
         </ul>
    </div>
    <div class='suggestions-list-container ${suggestions ?'':'hidden'}'>
    <h3 class="mdc-list-group__subheader mdc-typography--headline6 ">Suggestions</h3>
    <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='suggestions'>${suggestions}</ul>
</div>

</div>`
}

function newMessage() {
    history.pushState(['newMessage'], null, null);
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>`

    const header = getHeader('app-header', backIcon, '');
    document.getElementById('search-users-container').innerHTML = `
    <h3 class="mdc-list-group__subheader mdc-typography--headline6 mb-0 mr-0 ml-0">To</h3>
    <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--dense mdc-text-field--no-label" id='search-users' style='height:48px'>
    <input class="mdc-text-field__input"
           type="text"
           placeholder=""
           aria-label="Full-Width Text Field">
           <div class="mdc-line-ripple"></div>
  </div>`
    const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
    searchInit.focus()
    searchInit.input_.addEventListener('input', searchUsers)
    document.querySelector('.chats-list-container').classList.add('hidden')
    document.querySelector('.new-message-container').classList.add('hidden');
    loadAllUsers().then(function (allUsersString) {
        if (!allUsersString) return;
        document.getElementById('suggestions').innerHTML = allUsersString
        document.querySelector('.suggestions-list-container').classList.remove('hidden')
    })
}

function searchUsers(evt) {
    if (history.state[0] !== 'searchUsers') {
        if (history.state[0] !== 'newMessage') {
            const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </a>`
            const header = getHeader('app-header', backIcon, '');
            history.pushState(['searchUsers'], null, null)
        }
    }
    let value = evt.target.value;
    let indexName;
    let searchResult = ''
    document.querySelector('.chats-list-container').classList.add('hidden')
    document.querySelector('.new-message-container').classList.add('hidden')

    if (isNumber(value)) {
        indexName = 'mobile'
        value = formatNumber(value);
    } else {
        indexName = 'displayName'
    }
    const bound = IDBKeyRange.bound(value, value + '\uffff')
    const tx = db.transaction('users');
    const myNumber = firebase.auth().currentUser.phoneNumber;

    tx.objectStore('users').index(indexName).openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        }
        searchResult += userLi(cursor.value, '', '')
        cursor.continue()
    }
    tx.oncomplete = function () {

        document.getElementById('suggestions').innerHTML = searchResult
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
        db.transaction('users').objectStore('users').index('mobile').get(cursor.value.user).onsuccess = function (event) {
            if (!event.target.result) return
            string += userLi(event.target.result, cursor.value.comment, cursor.value.timestamp);
        }
        cursor.continue();
    }
    tx.oncomplete = function () {
        let suggestion = '';
        if (string) {
            document.getElementById('app-current-panel').innerHTML = chatDom(string, '');
            const currentChats = document.getElementById('chats')
            if (currentChats) {
                currentChatsInit = new mdc.list.MDCList(currentChats);
            }

        } else {
            getSuggestions().then(function (suggestionString) {
                console.log(suggestionString)
                document.getElementById('app-current-panel').innerHTML = chatDom('', suggestionString);

                const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
                searchInit.input_.addEventListener('keyup', searchUsers);
                const suggestionsChats = document.getElementById('suggestions')
                if (suggestionsChats) {
                    suggestionsInit = new mdc.list.MDCList(suggestionsChats)
                }

            })

        }
    }

}

function userLi(userRecord, secondaryText, time) {
    return `<li class="mdc-list-item" onclick=enterChat('${userRecord.mobile}','${userRecord.photoURL}')>
    <img class="mdc-list-item__graphic material-icons" aria-hidden="true" src=${userRecord.photoURL || './img/empty-user.jpg'} data-number=${userRecord.phoneNumber}>
    <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${userRecord.displayName || userRecord.mobile}
    </span>
    <span class="mdc-list-item__secondary-text">
    ${secondaryText}
    </span>
    </span>
    <span class="mdc-list-item__meta" aria-hidden="true">${formatCreatedTime(time)}</span>
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
            string += userLi(cursor.value, '', '');
            cursor.continue()
        }
        tx.oncomplete = function () {
            return resolve(string)
        }

    });
}

function getSuggestions() {

    return new Promise(function (resolve, reject) {

        let teamString = '';
        let superString = '';
        let all = '';

        Promise.all([getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees'), getEmployeeDetails(IDBKeyRange.only(1), 'team')]).then(function (result) {
            const tx = db.transaction(['users']);
            const store = tx.objectStore('users');
            const self = result[0]
            const team = result[1];
            if (!self.length && !team.length) {
                return loadAllUsers()
            }
            if (self.length) {
                self.forEach(function (record) {
                    if (record.attachment['First Supervisor'].value) {
                        store.get(record.attachment['First Supervisor'].value).onsuccess = function (event) {
                            const userRecord = event.target.result;
                            if (!userRecord) return;
                            superString += userLi(userRecord, 'First Supervisor', '')
                        }
                    };

                    if (record.attachment['Second Supervisor'].value) {
                        store.get(record.attachment['Second Supervisor'].value).onsuccess = function (event) {
                            const userRecord = event.target.result;
                            if (!userRecord) return;
                            superString += userLi(userRecord, 'Second Supervisor', '')
                        }
                    }
                })
            }
            if (team.length) {
                team.forEach(function (person) {
                    store.get(person.attachment['Employee Contact'].value).onsuccess = function (event) {
                        const userRecord = event.target.result;
                        if (!userRecord) return;
                        teamString += userLi(userRecord, person.attachment.Designation.value, '')
                    }
                })
            }
            tx.oncomplete = function () {

                return resolve(superString + teamString + all)

            }
        })
    })
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

function enterChat(number, photo) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>`

    const header = getHeader('app-header', backIcon, '');
    // history.pushState(['enterChat'],null,null)
    console.log(header)
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
    getUserChats(number, photo)
}

{
    /* <input class="input-msg" name="input" placeholder="Type a message" autocomplete="off" autofocus></input> */
}


function messageBox(comment, position, image) {
    return `<div class="message-wrapper ${position}">
    <img class="circle-wrapper" src=${image}>
    <div class="text-wrapper">${comment}</div>
    </div>`
}

function getUserChats(number, opImage) {
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('user')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
    const parent = document.getElementById('content');
    let timeLine = ''
    let position = '';
    let image = ''
    index.openCursor(number).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.user === myNumber) {
            position = 'me';
            image = myImage
        } else {
            position = 'them';
            image = opImage || './img/empty-user.jpg'
        }
        timeLine += messageBox(cursor.value.comment, position, image)
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
            this.style.height = '5px'
            this.style.height = (this.scrollHeight) + "px";
            form.style.height = this.style.height
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