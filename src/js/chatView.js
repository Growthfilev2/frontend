var contactsUl;
var chatsUl;
let currentChatsArray = [];
let currentContactsArray = [];
let menu;
let timer = null;
const duration = 800;

function chatView() {

    document.getElementById('start-load').classList.add('hidden');
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Chat</span>
    `
    const searchIcon = `<a class='mdc-top-app-bar__action-item material-icons' id='search-btn'>
        search
    </a>`

    const header = getHeader('app-header', backIcon, searchIcon);
    header.root_.classList.remove('hidden')
    if (!document.getElementById('search-btn')) return;
    document.getElementById('search-btn').addEventListener('click', function () {
        history.pushState(['searchChats'], null, null)
        search()
    })
    document.getElementById('app-current-panel').innerHTML = chatDom()

    readLatestChats(true);
    getOtherContacts();
}

function chatDom() {
    return `<div class='user-chats'>
    
<div id='search-users-container'>
    <div class='search-field'></div>
    <div class='search-result-container'></div>
</div>
<div class="mdc-list-group">
 <h3 id='no-result-found' style='text-align:center'></h3>   
<div class='chats-container'>
<h3 class="mdc-list-group__subheader mdc-list-group__subheader mdc-typography--headline6">Chats</h3>
<ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='chats'>

</ul>
</div>
<div class='contacts-container'>
  <h3 class="mdc-list-group__subheader mdc-list-group__subheader mdc-typography--headline6">Other Contacts</h3>
  <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='all-contacts'>
  </ul>
</div>
  </div>
</div>`
}

function searchBar() {
    return `<div id='search-users' class="mdc-text-field mdc-text-field--with-leading-icon mdc-text-field--with-trailing-icon mdc-text-field--no-label">
    <i class="material-icons mdc-text-field__icon" tabindex="0" role="button" id='search-back'>arrow_back</i>
    <i class="material-icons mdc-text-field__icon hidden"  tabindex="0" role="button" id='clear-search'>clear</i>
    <input type="text" id="my-input" class="mdc-text-field__input" placeholder='Search...' style='padding-left:48px;padding-right: 48px;'>
    <div class="mdc-line-ripple"></div>
</div>`

}

function search() {
    document.getElementById('app-header').classList.add("hidden")
    document.querySelector('#search-users-container .search-field').innerHTML = searchBar();
    const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
    searchInit.focus();
    searchInit.input_.addEventListener('input', function (evt) {
        searchInit.trailingIcon_.root_.classList.remove('hidden')
        if (!evt.target.value) {
            searchInit.trailingIcon_.root_.classList.add('hidden')
        } else {
            searchInit.trailingIcon_.root_.classList.remove('hidden')
        };
        const myNumber = firebase.auth().currentUser.phoneNumber;
        const searchable = getSearchBound(evt)
        let currentChats = '';
        let currentContacts = '';
        currentChatsArray = [];
        currentContactsArray = [];
        searchable.bound.onsuccess = function (event) {
            const cursor = event.target.result
            if (!cursor) return
            if (cursor.value.mobile === myNumber) {
                cursor.continue();
                return;
            }

            if (cursor.value.timestamp) {
                currentChats += userLi(cursor.value)
                currentChatsArray.push(cursor.value)
            } else {
                currentContacts += userLi(cursor.value)
                currentContactsArray.push(cursor.value)
            }
            cursor.continue()
        }
        searchable.tx.oncomplete = function () {
            const chatsEl = document.getElementById('chats')
            const contactsEl = document.getElementById('all-contacts')
            const noResultEl = document.getElementById('no-result-found');

            if (noResultEl) {
                if (!currentChatsArray.length && !currentContactsArray.length) {
                    noResultEl.innerHTML = 'No Results Found'
                } else {
                    noResultEl.innerHTML = ''
                }
            }
            if (chatsEl) {
                if (!currentChatsArray.length) {
                    document.querySelector('.chats-container').classList.add("hidden")
                } else {
                    document.querySelector('.chats-container').classList.remove("hidden")
                }
                chatsEl.innerHTML = currentChats
            }
            if (contactsEl) {
                if (!currentContacts) {
                    document.querySelector('.contacts-container').classList.add("hidden")
                } else {
                    document.querySelector('.contacts-container').classList.remove("hidden")
                }
                contactsEl.innerHTML = currentContacts;
            }
        }

    });

    searchInit.leadingIcon_.root_.onclick = function () {
        history.back();

    }
    searchInit.trailingIcon_.root_.onclick = function () {
        searchInitCancel(searchInit);
    }
}

function getSearchBound(evt) {
    let value = evt.target.value;
    const tx = db.transaction(['users', 'addendum']);
    let STORE_OR_INDEX = tx.objectStore('users')
    let bound = null
    let direction = 'next'
    if (!evt.target.value) {
        if (history.state[0] === 'searchChats') {
            indexName = 'timestamp'
            direction = 'prev'
        }
    } else {
        if (isNumber(value)) {
            indexName = 'mobile'
            value = formatNumber(value);
        } else {
            indexName = 'NAME_SEARCH'
            value = value.toLowerCase();
        };
        bound = IDBKeyRange.bound(value, value + '\uffff');
        STORE_OR_INDEX = STORE_OR_INDEX.index(indexName)
    }

    STORE_OR_INDEX = STORE_OR_INDEX.openCursor(bound, direction)

    return {
        tx: tx,
        bound: STORE_OR_INDEX
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
    return number.replace(/ +/g, "");
}

function getOtherContacts() {
    currentContactsArray = [];
    const tx = db.transaction('users', 'readwrite');
    const index = tx.objectStore('users').index('timestamp');

    const myNumber = firebase.auth().currentUser.phoneNumber;
    let currentContacts = ''
    index.openCursor("").onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        };
        currentContacts += userLi(cursor.value)
        currentContactsArray.push(cursor.value)
        cursor.continue();
    }
    tx.oncomplete = function () {
        const contactsEl = document.getElementById('all-contacts')
        document.querySelector('.contacts-container').classList.remove("hidden")
        if (!contactsEl) return;
        if (!currentContacts) {
            contactsEl.innerHTML = 'No Contacts Found'
            return
        };
        contactsEl.innerHTML = currentContacts;
        contactsUl = new mdc.list.MDCList(contactsEl);
        initializeContactList(contactsUl)

    }
}

function readLatestChats(initList) {
    currentChatsArray = [];
    const tx = db.transaction(['users','root'], 'readwrite');
    const index = tx.objectStore('users').index('timestamp');
    const auth = firebase.auth().currentUser;

    const myNumber = auth.phoneNumber
    let currentChats = '';
   
    index.openCursor(null, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if(!cursor.value.timestamp) {
            cursor.continue();
            return;
        }

        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        };

        console.log(cursor.value);
    
        if (ApplicationState.currentChatSlected === cursor.value.mobile && cursor.value.count) {
            var currentUserCount = cursor.value.count;

            const rootStore = tx.objectStore('root')
            rootStore.get(auth.uid).onsuccess = function(event){
                const record = event.target.result;
                if(record) {
                    console.log(currentUserCount)
                    record.totalCount = record.totalCount - currentUserCount;
                    rootStore.put(record)
                }
            }

            cursor.value.count = 0;
            const update = cursor.update(cursor.value);
            update.onsuccess = function () {
                ApplicationState.currentChatSlected = null;
                console.log("count reset")
            }
        }

        currentChats += userLi(cursor.value)
        currentChatsArray.push(cursor.value)

        cursor.continue();
    }
    tx.oncomplete = function () {
        ApplicationState.currentChatSlected = null;
        const chatsEl = document.getElementById('chats')
        document.querySelector('.chats-container').classList.remove("hidden")
        if (!chatsEl) return
        if (!currentChatsArray.length) {
            chatsEl.innerHTML = `<h3 class="mb-0 mdc-typography--headline5 mdc-theme--primary mb-0 text-center">No Chats found</h3>
                <p class='text-center'>Choose From Below or Search</p>
                `
            return;
        }
        chatsEl.innerHTML = currentChats
        if (!initList) return;
        chatsUl = new mdc.list.MDCList(chatsEl);
        initializeChatList(chatsUl);
    }
}


function initializeChatList(chatsUl) {

    chatsUl.listen('MDCList:action', function (evt) {
        const userRecord = currentChatsArray[evt.detail.index]
        if (history.state[0] === 'searchChats') {
            history.replaceState(['enterChat', userRecord], null, null)
        } else {
            history.pushState(['enterChat', userRecord], null, null)
        }
        enterChat(userRecord);
    })
}

function initializeContactList(contactsUl) {
    contactsUl.listen('MDCList:action', function (evt) {
        const userRecord = currentContactsArray[evt.detail.index]
        if (history.state[0] === 'searchChats') {
            history.replaceState(['enterChat', userRecord], null, null)
        } else {
            history.pushState(['enterChat', userRecord], null, null)
        }
        enterChat(userRecord);
    })
}

function userLi(value) {
    return `<li class="mdc-list-item">
   <div style="position:relative">
   <img class="mdc-list-item__graphic"  aria-hidden="true" src=${value.photoURL || './img/empty-user.jpg'}  onerror="imgErr(this)" data-number=${value.mobile}>
   <i class="material-icons user-selection-icon">check_circle</i>
   </div>
    
    <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${value.displayName || value.mobile}
    </span>
    <span class="mdc-list-item__secondary-text">
    ${value.comment || ''}
    </span>
    </span>
    <span class="mdc-list-item__meta" aria-hidden="true">
    ${value.count ? `<div class='chat-count mdc-typography--subtitle2'>${value.count}</div>` :''}
    <span class='chat-time mdc-typography--subtitle2'>
        ${value.timestamp ? formatCreatedTime(value.timestamp) : ''}</span>
    </span>
    </li>`
}

function loadUsers(hideMetaText, exception) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction(['users']);
        const store = tx.objectStore('users');
        const myNumber = firebase.auth().currentUser.phoneNumber
        let string = '';
        const result = [];
        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.mobile === myNumber) {
                cursor.continue();
                return;
            }
            if (exception) {
                if (exception[cursor.value.mobile]) {
                    cursor.continue();
                    return;
                }
            }
            result.push(cursor.value)
            if (hideMetaText) {
                cursor.value.comment = '';
                cursor.value.count = ''
                cursor.value.timestamp = ''
                string += userLi(cursor.value);
            } else {
                string += userLi(cursor.value);
            }
            cursor.continue()
        }
        tx.oncomplete = function () {
            return resolve({
                domString: string,
                data: result
            })
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

function enterChat(userRecord) {
    ApplicationState.currentChatSlected = userRecord.mobile;
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <img src=${userRecord.photoURL || './img/empty-user.jpg'} class='header-image' onerror="imgErr(this)">
        <span class="mdc-top-app-bar__title">${userRecord.displayName || userRecord.mobile}</span>
        `

    const header = getHeader('app-header', backIcon, '');
    header.root_.classList.remove('hidden')
    console.log(header)


    document.getElementById('app-current-panel').innerHTML = `
    <div class="page">
    <div class="marvel-device nexus5">
   
      
      
      
      <div class="screen">
        <div class="screen-container">
          
          <div class="chat">
            <div class="chat-container">
              
              <div class="conversation">
                <div class="conversation-container">
                <div id='content'>
                </div>
            
                <form class="conversation-compose">
                  <div class="input-space-left"></div>
                                    
                  <input class="input-msg" data-name="dm" data-param="assignee" data-param-value="${userRecord.mobile}" name="input" placeholder="Type a message" autocomplete="off"  id='comment-input'>
                  <div class="input-space-right"></div>
                  <button class="send" id='comment-send'>
                      <div class="circle">
                        <i class="material-icons">send</i>
                      </div>
                    </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
        `
    getUserChats(userRecord)

}

function actionBoxDom(value, position) {
    const div = createElement('div', {
        className: `message ${position} menu-action`
    })
    div.addEventListener('touchstart', function (event) {
        touchStart(event, value.addendumId, value.activityId, value.location._latitude, value.location._longitude);
    })
    div.addEventListener('touchend', touchEnd)
    div.addEventListener('touchcancel', touchCancel);
    div.addEventListener('touchmove', touchMove);
    div.innerHTML = actionBoxContent(value)
    return div
}

function actionBoxContent(value) {

    return `
    <div class='menu-container mdc-menu-surface--anchor' id="${value.addendumId}"> </div>
    ${value.comment}
<span class="metadata">
    <span class="time">
    ${moment(value.timestamp).format('hh:mm')}
    </span>
    <span class='tick'>
        <i class='material-icons'>info</i>
    </span>
</span>`
}

function actionBox(value, position) {
    return `
    <div class="message ${position} menu-action" ontouchstart="touchStart(event,'${value.addendumId}','${value.activityId}','${value.location._latitude}','${value.location._longitude}')" ontouchEnd="touchEnd(event)" ontouchmove="touchMove(event)" ontouchcancel="touchCancel(event)">  
    ${actionBoxContent(value)}
    </div>
  `
}

function handleLongPress(addendumId, activityId, _latitude, _longitude) {
    clearTimeout(timer);
    const geopoint = {
        _latitude: _latitude,
        _longitude: _longitude
    }
    if (menu) {
        menu.open = false;
        menu = null;
    }
    createActivityActionMenu(addendumId, activityId, geopoint)

};

function touchStart(event, addendumId, activityId, _latitude, _longitude) {

    timer = setTimeout(function () {
        handleLongPress(addendumId, activityId, _latitude, _longitude)
    }, duration)
}

function touchEnd(event) {
    clearTimeout(timer)
}

function touchMove(event) {
    clearTimeout(timer)

}

function touchCancel(event) {
    clearTimeout(timer)

}




function messageBoxContent(comment, time) {
    return ` ${comment}
    <span class="metadata">
        <span class="time">${moment(time).format('hh:mm')}</span
    </span>
  </div>`
}

function messageBox(comment, position, time) {

    return ` <div class="message ${position}">
    ${messageBoxContent(comment,time)}
    `
}

function messageBoxDom(comment, position, time) {

    const div = createElement('div', {
        className: `message ${position}`
    })
    div.innerHTML = messageBoxContent(comment, time)

    return div;
}

function createActivityHeading(activity) {
    return `${activity.activityName}
    <p class='card-time mdc-typography--subtitle1 mb-0 mt-0'>Created On ${formatCreatedTime(activity.timestamp)}</p>
    <span class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ${activity.creator.displayName || activity.creator.phoneNumber}</span>`
}

function createActivityActionMenu(addendumId, activityId, geopoint) {

    db.transaction('activity').objectStore('activity').get(activityId).onsuccess = function (event) {
        const activity = event.target.result;
        if (!activity) return;
        const heading = createActivityHeading(activity)
        let items = [{
            name: 'View',
            icon: 'info'
        }, {
            name: 'Reply',
            icon: 'reply'
        }];
        if (activity.canEdit) {
            items.push({
                name: 'Share',
                icon: 'share'
            })
            if (activity.status === 'CANCELLED') {
                items.push({
                    name: 'Confirm',
                    icon: 'check'
                })
                items.push({
                    name: 'Undo',
                    icon: 'undo'
                })
            }
            if (activity.status === 'PENDING') {
                items.push({
                    name: 'Confirm',
                    icon: 'check'
                })
                items.push({
                    name: 'Delete',
                    icon: 'delete'
                })

            }
            if (activity.status === 'CONFIRMED') {
                items.push({
                    name: 'Undo',
                    icon: 'undo'
                })
                items.push({
                    name: 'Delete',
                    icon: 'delete'
                })
            }
        };

        const joinedId = addendumId + activityId
        document.getElementById(addendumId).innerHTML = createSimpleMenu(items, joinedId)
        document.getElementById(joinedId).appendChild(menuItemMap({
            name: 'Map',
            icon: 'map'
        }, geopoint));

        menu = new mdc.menu.MDCMenu(document.getElementById(joinedId))
        menu.open = true
        menu.root_.classList.add('align-right-menu');


        menu.listen('MDCMenu:selected', function (evt) {
            switch (items[evt.detail.index].name) {
                case 'View':
                    showViewDialog(heading, activity, 'view-form')
                    break;
                case 'Reply':
                    reply(activity)
                    break;
                case 'Share':
                    share(activity)
                    break;
                case 'Undo':
                    setActivityStatus(activity, 'PENDING')
                    break;
                case 'Confirm':
                    setActivityStatus(activity, 'CONFIRMED')
                    break;
                case 'Delete':
                    setActivityStatus(activity, 'CANCELLED')
                    break;
                default:
                    break;
            }
        })
    }

}

function reply(activity) {
    const input = document.querySelector('.conversation-compose input')
    input.dispatchEvent(new Event('focus'));
    input.focus()
    input.placeholder = 'Type your reply'
    if (input) {
        input.dataset.name = 'comment'
        input.dataset.param = 'activityId'
        input.dataset.paramValue = activity.activityId
    };
}

function showViewDialog(heading, activity, id) {
    let type = 'simple';
    if (activity.canEdit) {
        type = ''
    }
    if (activity.template === 'check-in' && activity.attachment['Photo'].value) {
        type = ''
    }
    const dialog = new Dialog(heading, activityDomCustomer(activity), id).create(type);
    dialog.open();
    dialog.autoStackButtons = false;
    if (!type) {
        dialog.buttons_[1].classList.add("hidden");
    }

    dialog.listen("MDCDialog:opened", function (evt) {
        const scheduleEl = document.getElementById('schedule-container');
        if (scheduleEl) {
            const scheduleList = new mdc.list.MDCList(scheduleEl);
            scheduleList.layout()
        }
    })
}



function createDynamicChips(text, id, leadingIcon) {
    const chip = createElement('button', {
        className: 'mdc-chip mdc-chip--selected',
        id: id
    });

    const chipText = createElement('div', {
        className: 'mdc-chip__text',
        textContent: text
    })
    const trailingIcon = createElement('i', {
        className: 'material-icons mdc-chip__icon mdc-chip__icon--trailing',
        textContent: 'cancel'
    })
    trailingIcon.setAttribute('tabindex', '0');
    trailingIcon.setAttribute('role', 'button');
    leadingIcon ? chip.appendChild(leadingIcon) : ''
    chip.appendChild(chipText)
    chip.appendChild(trailingIcon)
    return chip

}

function share(activity) {

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add People</span>
    `
    const searchIcon = `<a class='mdc-top-app-bar__action-item material-icons' id='search-btn'>
        search
    </a>`

    const alreadySelected = {};
    const newSelected = {};

    const content = `
    <div id='search-users-container'>
    </div>
    <div class='share-user-container'>
    <div class="mdc-chip-set hidden" id='share'>
    </div>
    </div>
    <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='users-list'>
    </ul>
    <button class="mdc-fab mdc-theme--primary-bg app-fab--absolute" aria-label="Favorite" id='send-assignee'>
        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">arrow_forward</span>
    </button>
    `
    activity.assignees.forEach(function (ass) {
        alreadySelected[ass.phoneNumber] = true
    });

    document.getElementById('app-current-panel').innerHTML = content;
    const header = getHeader('app-header', backIcon, searchIcon);
    const chipSetEl = document.getElementById('share')
    const chipInit = new mdc.chips.MDCChipSet(chipSetEl)
    const ulSelector = document.getElementById('users-list')
    const ul = new mdc.list.MDCList(ulSelector)
    const sendBtn = new mdc.ripple.MDCRipple(document.getElementById('send-assignee'))
    history.pushState(['share', activity], null, null)
    console.log(chipInit)
    loadUsers(true, alreadySelected).then(function (userResult) {

        if (!userResult.data.length) return;
        sendBtn.root_.addEventListener('click', function () {
            const userArray = Object.keys(newSelected);
            if (!userArray.length) {
                snacks('At least 1 contact must be selected')
                return;
            }
            console.log(newSelected);
            addAssignee(activity, userArray);

        })
        document.getElementById('users-list').innerHTML = userResult.domString;

        chipInit.listen('MDCChip:removal', function (event) {

            console.log(chipInit.chips)
            const liElement = ul.listElements[Number(event.detail.chipId)]
            delete newSelected[userResult.data[Number(event.detail.chipId)].mobile]
            chipSetEl.removeChild(event.detail.root);
            liElement.classList.remove('selected')
            liElement.querySelector('.user-selection-icon').classList.add('hidden')
            liElement.querySelector('.user-selection-icon').classList.remove('user-selection-show')
            if (!chipInit.chips.length) {
                chipSetEl.classList.add('hidden')
            } else {
                chipSetEl.classList.remove('hidden')
            }
        });



        ul.listen('MDCList:action', function (listActionEvent) {
            const index = listActionEvent.detail.index
            const el = ul.listElements[index];
            const clickedUser = userResult.data[index];
            if (el.classList.contains('selected')) {
                const chip = new mdc.chips.MDCChip(document.getElementById('' + index))
                chip.beginExit();
            } else {

                newSelected[clickedUser.mobile] = true;
                el.classList.add('selected')
                el.querySelector('.user-selection-icon').classList.remove('hidden')
                el.querySelector('.user-selection-icon').classList.add('user-selection-show');
                const image = createElement('img', {
                    className: 'mdc-chip__icon mdc-chip__icon--leading',
                    src: clickedUser.photoURL || './img/empty-user.jpg'
                })
                const newChip = createDynamicChips(clickedUser.displayName || clickedUser.mobile, index, image);
                chipSetEl.appendChild(newChip)
                chipInit.addChip(newChip)
                newChip.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "end"
                })
                chipSetEl.classList.remove('hidden')
            }
        });

        document.getElementById('search-btn').addEventListener('click', function (evt) {
            document.getElementById('app-header').classList.add("hidden")

            document.getElementById('search-users-container').innerHTML = `<div class='search-field'>
            ${searchBar()}
        </div>`

            const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
            searchInit.focus()

            searchInit.input_.addEventListener('input', function (evt) {
                if (!evt.target.value) {
                    searchInit.trailingIcon_.root_.classList.add('hidden')
                } else {
                    searchInit.trailingIcon_.root_.classList.remove('hidden')
                }
                ul.listElements.forEach(function (el) {
                    el.classList.remove('found')
                });

                const searchable = getSearchBound(evt);

                searchable.bound.onsuccess = function (searchEvent) {
                    const cursor = searchEvent.target.result;
                    if (!cursor) return;

                    if (alreadySelected[cursor.value.mobile]) {
                        cursor.continue();
                        return;
                    }
                    const el = document.querySelector(`[data-number="${cursor.value.mobile}"]`)
                    if (el) {

                        el.parentNode.parentNode.classList.add('found');
                    }

                    cursor.continue();
                }

                searchable.tx.oncomplete = function () {
                    ul.listElements.forEach(function (el) {
                        if (el.classList.contains('found')) {
                            el.classList.remove('hidden')
                        } else {
                            el.classList.add('hidden')
                        }
                    })
                }
            })

            searchInit.leadingIcon_.root_.onclick = function () {
                searchInitBack(searchInit)
            }
            searchInit.trailingIcon_.root_.onclick = function () {
                searchInitCancel(searchInit)
            };
        })
    });

}

function closeSearchBar() {

    document.getElementById('search-users').classList.add('hidden')
    document.getElementById('app-header').classList.remove("hidden")
}

function searchInitBack(searchInit) {
    closeSearchBar();
    searchInit.value = "";
    searchInit.input_.dispatchEvent(new Event('input'));

}

function searchInitCancel(searchInit) {
    searchInit.value = "";
    searchInit.input_.dispatchEvent(new Event('input'));
}

function activityDomCustomer(activityRecord) {
    console.log(activityRecord);
    return ` <div class='mdc-card'>
    <div class='view-card'>

    <div id='schedule-container'>
        <ul class='mdc-list mdc-list--two-line'>
            ${viewSchedule(activityRecord)}
        </ul>
    </div>
    <div id='attachment-container'>
        ${viewAttachment(activityRecord)}
        
    </div>  
     
        <div id='assignee-container'>
            ${activityRecord.assignees.length ?`<div class="assignees tasks-heading center">
            <i class="material-icons">share</i>
            ${viewAssignee(activityRecord)}
        </div>` :'' }
          
        </div>
    
    </div>
</div>`
}

function addAssignee(record, userArray) {
    progressBar.open();
    closeSearchBar();
    requestCreator('share', {
        activityId: record.activityId,
        share: userArray
    }).then(function () {
        progressBar.close();
        snacks(`You Added ${userArray.length} People`)
        history.back();
    }).catch(function (error) {
        snacks(error.response.message)
        progressBar.close();
    })
}


function setActivityStatus(record, status) {
    progressBar.open();
    requestCreator('statusChange', {
        activityId: record.activityId,
        status: status
    }).then(function () {
        snacks(`${record.activityName} is ${status}`)
        progressBar.close();

    }).catch(function (error) {
        snacks(error.response.message);
        progressBar.close();
    })
}

function viewFormActions() {
    return `
    <div class="mdc-card__actions">
    <div class="mdc-card__action-buttons">
    <button class="mdc-button mdc-card__action mdc-card__action--button">
    <span class="mdc-button__label">Close</span>
    </button>
    </div>
    </div>
    
`
}

function markCancelled(record) {
    console.log(record)
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

function viewFormAttachmentEl(attachmentName, activityRecord) {
    if (activityRecord.attachment[attachmentName].type === 'base64') {
        return `<ul class="mdc-image-list my-image-list mdc-image-list--masonry">
        <li class="mdc-image-list__item">
        <img class="mdc-image-list__image" src="${activityRecord.attachment[attachmentName].value}" onerror="imgErr(this)">
          <div class="mdc-image-list__supporting">
            <span class="mdc-image-list__label">${attachmentName}</span>
          </div>
        </li>
      </ul>`
    }

    if (attachmentName === 'Include') {
        return ''
    }
    return `<h1 class="mdc-typography--subtitle1 mt-0">
        ${attachmentName} : ${activityRecord.attachment[attachmentName].value}
    </h1>`
}

function viewAttachment(activityRecord) {
    return `${Object.keys(activityRecord.attachment).map(function(attachmentName){
        return `${activityRecord.attachment[attachmentName].value ? viewFormAttachmentEl(attachmentName,activityRecord) :''}`
    }).join("")}`
}

function viewVenue(activityRecord, showMap) {
    return `${activityRecord.venue.map(function(v,idx){
    
        return `
            ${v.location && v.address ? `
            <li class="mdc-list-item">
                 ${idx == 0 ?`<span class="mdc-list-item__graphic material-icons"
                 aria-hidden="true">location_on</span>` :
                 `<span class="mdc-list-item__graphic" aria-hidden="true"
                    style='background-color:white'></span>`}
                    <span class='mdc-list-item__text'>
                    <span class='mdc-list-item__primary-text'>${v.location}</span>
                    <span class='mdc-list-item__secondary-text'>${v.address}</span>
                    </span>
                     ${showMap ? `<a class="mdc-list-item__meta material-icons venue-map-intent mdc-theme--primary" aria-hidden="true" href='geo:${v.geopoint._latitude},${v.geopoint._longitude}?q=${v.geopoint._latitude},${v.geopoint._longitude}'>map</a>`:'' }
              </li>`:''}`
     }).join("")}`
}

function viewSchedule(activityRecord) {

    return `
    
    ${activityRecord.schedule.map(function(sc,idx){
            return  `
            <li class="mdc-list-item">
            ${idx == 0 ? `<span class="mdc-list-item__graphic material-icons"
            aria-hidden="true">today</span>`:`<span class="mdc-list-item__graphic" aria-hidden="true"
            style='background-color:white'></span>`}
            <span class="mdc-list-item__text">
              <span class="mdc-list-item__primary-text">${sc.name}</span>
              <span class="mdc-list-item__secondary-text">${moment(sc.startTime).format('D MMM h[:]mm A')} - ${moment(sc.endTime).format('D MMM h[:]mm A')}</span>
            </span>
          </li>`
    }).join("")}`
}

function viewAssignee(activityRecord) {
    return `
    <div class="mdc-chip-set" id='share'>
     ${activityRecord.assignees.map(function(user,idx){
        return `<div class="mdc-chip" id='${idx}-preselected'>
                    <img class='mdc-chip__icon mdc-chip__icon--leading' src=${user.photoURL || '../img/empty-user.jpg'} onerror="imgErr(this)">
                    <div class='mdc-chip__text'>${user.displayName || user.phoneNumber}</div>
                </div>`
    }).join("")}
    </div>`

}



function createStatusChange(status) {

    let selectStrings = ''
    if (status === 'CANCELLED') {
        selectStrings = `<li class="mdc-list-item" data-value="PENDING">
       PENDING
      </li>
      <li class="mdc-list-item" data-value="CONFIRMED">
        CONFIRMED
    </li>
      `
    }
    if (status === 'PENDING') {
        selectStrings = `<li class="mdc-list-item mdc-list-item--selected" data-value="PENDING" aria-selected="true">
        PENDING
       </li>
       <li class="mdc-list-item" data-value="CONFIRMED">
         CONFIRMED
     </li>
       `
    }
    if (status === 'CONFIRMED') {
        selectStrings = `<li class="mdc-list-item mdc-list-item--selected" data-value="CONFIRMED" aria-selected="true">
        CONFIRMED
       </li>
       <li class="mdc-list-item" data-value="PENDING">
         PENDING
     </li>
       `
    }

    return `<div class="mdc-select status-select" id='status-enhanced-select'>
    <input type="hidden" name="enhanced-select">
    <i class="mdc-select__dropdown-icon"></i>
    <div class="mdc-select__selected-text"></div>
    <div class="mdc-select__menu mdc-menu mdc-menu-surface status-select">
      <ul class="mdc-list">
        ${selectStrings}
      </ul>
    </div>
    <span class="mdc-floating-label">Change Status</span>
    <div class="mdc-line-ripple"></div>
  </div>`

}

function dynamicAppendChats(addendums) {
    const parent = document.getElementById('content');
    const myNumber = firebase.auth().currentUser.phoneNumber;

    addendums.forEach(function (addendum) {
        if (!parent) return;

        let position = 'them';
        if (addendum.user === myNumber) {
            position = 'me'
        }
        if (addendum.user === history.state[1].mobile || addendum.user === myNumber) {
            if (addendum.isComment) {
                if (addendum.user === myNumber) return;
                parent.appendChild(messageBoxDom(addendum.comment, position, addendum.timestamp))
                return;
            }
            parent.appendChild(actionBoxDom(addendum, position))
        }
    })
    setBottomScroll()
}

function getHumanDateString(date) {
    const today = moment();
    const yesterday = moment().subtract(1, 'day');


    if (date.isSame(today, 'day')) return 'Today';
    if (date.isSame(yesterday, 'day')) return 'Yesterday';
    return date.format('DD MMMM YYYY')


}

function dateBox(dateString) {
    return `<div class='date-box'>
<div class="date" data-chat-date='${dateString}'>${dateString}</div>
</div>`


}



function getUserChats(userRecord) {
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('key')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const range = IDBKeyRange.only(myNumber + userRecord.mobile)

    const myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
    const parent = document.getElementById('content');
    let timeLine = ''
    let position = '';
    let currentDateName = ''
    index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (cursor.value.user === myNumber) {
            position = 'me';
            image = myImage
        } else {
            position = 'them';
            image = userRecord.photoURL || './img/empty-user.jpg'
        };
        const dateName = getHumanDateString(moment(cursor.value.timestamp))
        if (dateName !== currentDateName) {
            timeLine += dateBox(dateName)
        }
        currentDateName = dateName;
        if (cursor.value.isComment) {
            timeLine += messageBox(cursor.value.comment, position, cursor.value.timestamp)
        } else {
            if (cursor.value.user === myNumber || cursor.value.user === userRecord.mobile) {
                timeLine += actionBox(cursor.value, position);
            }
        }
        cursor.continue();
    }
    tx.oncomplete = function () {
        parent.innerHTML = timeLine;
        setBottomScroll();

        const form = document.querySelector('.conversation-compose');
        if(!form) return;
        form.querySelector('input').addEventListener('focus', function (evt) {
            setTimeout(function () {
                setBottomScroll();
            }, 500)
        })

        form.addEventListener('submit', function (e) {

            e.preventDefault();
            var input = e.target.input;
            const val = input.value;
            if (!val) return;

            progressBar.open()
            const param = input.dataset.param
            const paramValue = input.dataset.paramValue
            const requestBody = {
                comment: val
            }
            requestBody[param] = paramValue
            requestCreator(input.dataset.name, requestBody).then(function () {
                parent.appendChild(messageBoxDom(val, 'me', Date.now()))
                setBottomScroll();
                input.value = ''
                progressBar.close()
            }).catch(function (error) {
                input.value = ''
                progressBar.close()
                snacks(error.response.message);
            })
            input.dataset.name = 'dm';
            input.dataset.param = 'assignee'
            input.dataset.paramValue = userRecord.mobile
            input.placeholder = 'Type a message'
        });
    }
}



function resetCommentField(bottom, form, input) {
    bottom.style.height = '72px'
    form.style.height = '56px';
    input.style.height = 'auto'
}

function setBottomScroll() {

    const el = document.querySelector('.conversation-container');
    if (!el) return;
    el.scrollTop = el.scrollHeight;
}