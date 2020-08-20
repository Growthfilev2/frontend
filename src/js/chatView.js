var contactsUl;
var chatsUl;
let currentChatsArray = [];
let currentContactsArray = [];

function chatView() {
    const sectionContent = document.getElementById('app-tab-content');
    if (!sectionContent) return;

    if (!document.getElementById('search-btn')) {
        const searchIcon = createElement('button', {
            className: 'material-icons mdc-top-app-bar__action-item mdc-icon-button',
            id: 'search-btn',
            textContent: 'search'
        });
        document.getElementById('section-end').insertBefore(searchIcon, document.getElementById('section-end').firstChild);
        searchIcon.addEventListener('click', function () {
            history.pushState(['searchChats'], null, null)
            search()
        })
    }


    sectionContent.innerHTML = chatDom();
    // getSubscription('','customer').then(function(subscriptions){
    //     if(!subscriptions.length) return;
    //     const btn = createExtendedFab('add','Add customer','',true);
    //     btn.addEventListener('click',function(){
    //         if(subscriptions.length == 1) {
    //             getDropDownContent(subscriptions[0].office, 'customer-type', 'officeTemplate').then((customerTypes) => {
    //                 history.pushState(['addView'], null, null);
    //                 fillVenueInSub(subscriptions[0], {
    //                     latitude: ApplicationState.location.latitude,
    //                     longitude: ApplicationState.location.longitude
    //                 });
    //                 addView(subscriptions[0], customerTypes);
    //             });
    //             return
    //         }
    //         const officeDialog = new Dialog('Choose office', officeSelectionList(subscriptions), 'choose-office-subscription').create('simple');
    //         const offieList = new mdc.list.MDCList(document.getElementById('dialog-office'))
    //         bottomDialog(officeDialog, offieList);
    //         offieList.listen('MDCList:action', function (officeEvent) {
    //             officeDialog.close();
    //             getDropDownContent(subscriptions[officeEvent.detail.index].office, 'customer-type', 'officeTemplate').then((customerTypes) => {
    //                 history.pushState(['addView'], null, null);
    //                 fillVenueInSub(subscriptions[officeEvent.detail.index], {
    //                     latitude: ApplicationState.location.latitude,
    //                     longitude: ApplicationState.location.longitude
    //                 });
    //                 addView(subscriptions[officeEvent.detail.index], customerTypes);
    //             });
    //         })
    //     })
    //     sectionContent.appendChild(btn)
    // })

    // firebase.auth().currentUser.getIdTokenResult().then(function(idTokenResult){
    //     if(!isAdmin(idTokenResult)) return;
    //     const li =  createElement('li',{
    //         className:'mdc-list-item'
    //     })
    //     li.setAttribute('role','menuitem');
    //     li.dataset.type = 'share';

    //     li.dataset.offices = JSON.stringify([...new Set(idTokenResult.claims.admin)]);
    //     const span = createElement('span',{
    //         className:'mdc-list-item__text',
    //         textContent:'Add users'
    //     })
    //     li.appendChild(span);
    //     document.querySelector('#app-menu ul').insertBefore(li,document.querySelector('#app-menu ul').firstChild)
        
    // })
  

    readLatestChats(true);
}

function chooseContact(contactString) {


    const contactDetails = parseContact(contactString);
    contactDetails.mobile = contactDetails.phoneNumber;
    delete contactDetails.phoneNumber;
    history.pushState(['enterChat', contactDetails], null, null);
    enterChat(contactDetails);
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
<h3 class="mdc-list-group__subheader mdc-list-group__subheader mdc-typography--headline6"></h3>
<ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='chats'>

</ul>
</div>
<div class='contacts-container'>
  <h3 class="mdc-list-group__subheader mdc-list-group__subheader mdc-typography--headline6"></h3>
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
    appTabBar.root_.classList.add('hidden')

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
                    document.querySelector('.chats-container h3').textContent = ''
                    document.querySelector('.chats-container').classList.add("hidden")
                } else {
                    document.querySelector('.chats-container h3').textContent = 'Chats'
                    document.querySelector('.chats-container').classList.remove("hidden")
                }
                chatsEl.innerHTML = currentChats
            }
            if (contactsEl) {
                if (!currentContacts) {
                    document.querySelector('.contacts-container h3').textContent = ''
                    document.querySelector('.contacts-container').classList.add("hidden")
                } else {
                    document.querySelector('.contacts-container h3').textContent = 'Other Contacts'
                    document.querySelector('.contacts-container').classList.remove("hidden")
                }
                contactsEl.innerHTML = currentContacts;
            }
        }

    });

    searchInit.leadingIcon_.root_.onclick = function () {
        closeSearchBar();
        chatView();
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
        if (history.state && history.state[0] === 'searchChats') {
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

        } else {
            contactsEl.innerHTML = currentContacts;
        }
        contactsUl = new mdc.list.MDCList(contactsEl);
        initializeContactList(contactsUl)

    }
}

function readLatestChats(initList) {
    currentChatsArray = [];
    const tx = db.transaction(['users'], 'readwrite');
    const index = tx.objectStore('users').index('timestamp');
    const auth = firebase.auth().currentUser;

    const myNumber = auth.phoneNumber
    let currentChats = '';
    const range = IDBKeyRange.bound(1, 2713890600000);
    index.openCursor(range, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;

        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        };

        currentChats += userLi(cursor.value,true)
        currentChatsArray.push(cursor.value)

        cursor.continue();
    }
    tx.oncomplete = function () {

        const chatsEl = document.getElementById('chats')
        const contactsEl = document.getElementById('all-contacts');
        const chatsCont = document.querySelector('.chats-container')
        if (chatsCont) {
            chatsCont.classList.remove("hidden")
        }
        if (!chatsEl) return
        if (!currentChatsArray.length) {
            chatsEl.innerHTML = `<h3 class="mb-0 mdc-typography--headline5 mdc-theme--primary mb-0 text-center">No chats found</h3>
                `
        } else {
            chatsEl.innerHTML = currentChats
        }
        if (!initList) return;
        chatsUl = new mdc.list.MDCList(chatsEl);
        initializeChatList(chatsUl);
        initializeContactList(new mdc.list.MDCList(contactsEl))

    }
}


function initializeChatList(chatsUl) {

    chatsUl.listen('MDCList:action', function (evt) {
        const userRecord = currentChatsArray[evt.detail.index];
        // if(!history.state) 
        
        if (history.state && history.state[0] === 'searchChats') {
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
        if (history.state && history.state[0] === 'searchChats') {
            history.replaceState(['enterChat', userRecord], null, null)
        } else {
            history.pushState(['enterChat', userRecord], null, null)
        }
        enterChat(userRecord);
    })
}

function userLi(value,showCount) {
    return `<li class="mdc-list-item ${value.count && showCount ? 'unread-chat':''}">
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
    <span class='chat-time mdc-typography--subtitle2'>
        ${value.timestamp ? formatChatTime(value.timestamp) : ''}</span>
        ${value.count && showCount ? ` <div class='unread-count'>${value.count}</div>` :''}
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
    return moment(createdTime).calendar(null, {
        sameDay: 'hh:mm A',
        lastDay: '[Yesterday] hh:mm A',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastWeek: 'DD/MM/YY hh:mm A',
        sameElse: 'DD/MM/YY hh:mm A'
    })
}

function formatChatTime(createdTime) {
    if (!createdTime) return ''
    return moment(createdTime).calendar(null, {
        sameDay: 'hh:mm',
        lastDay: '[Yesterday]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastWeek: 'DD/MM/YY',
        sameElse: 'DD/MM/YY'
    })
}

function isToday(comparisonTimestamp) {
    const today = new Date();
    if (today.setHours(0, 0, 0, 0) == new Date(comparisonTimestamp).setHours(0, 0, 0, 0)) {
        return true
    }
    return false;
}

function enterChat(userRecord) {
    removeSwipe()
    const sectionContent = document.getElementById('app-tab-content')
    if (!sectionContent) return;
    const tx =  db.transaction('users','readwrite');
    const store =  tx.objectStore('users')
    store.get(userRecord.mobile).onsuccess = function(e){
        const record = e.target.result;
        if(!record) return;
        delete record.count;
        store.put(record)
    }
 
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <img src=${userRecord.photoURL || './img/empty-user.jpg'} class='header-image' onerror="imgErr(this)">
        <span class="mdc-top-app-bar__title">${userRecord.displayName || userRecord.mobile}</span>
        `

    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden')
   


    sectionContent.innerHTML = `
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


function actionBoxContent(value) {

    return `
    <div class='menu-container mdc-menu-surface--anchor' id="${value.addendumId}"> </div>
    ${value.comment}
<span class="metadata">
<i class='material-icons'>info</i>
<span>click to see more</span>
    <span class="time">
        ${moment(value.timestamp).format('hh:mm')}
    </span>
  
</span>`
}

function actionBox(value, position) {
    const div = createElement('div',{
        className:`message ${position} menu-action`
    });
    div.addEventListener('click',function(){
        openActivity(value);
    })
    div.innerHTML = `${actionBoxContent(value)}`
    return div;
}

function openActivity(value) {
    db.transaction('activity').objectStore('activity').get(value.activityId).onsuccess = function (event) {
        const activity = event.target.result;
        if (!activity) return;
        const heading = createActivityHeading(activity,value.location)
        showViewDialog(heading, activity, 'view-form');
    }
};




function messageBoxContent(comment, time) {
    return ` ${comment}
    <span class="metadata">
        <span class="time">${moment(time).format('hh:mm')}</span
    </span>
  </div>`
}

function messageBox(comment, position, time) {
    const div = createElement('div',{
        className:`message ${position}`
    })
    div.innerHTML = ` ${messageBoxContent(comment,time)}`
    return div;
}



function createActivityHeading(activity,geopoint) {
    let mapTag = `<a target="_blank" href='comgooglemaps://?center=${geopoint._latitude},${geopoint._longitude}'>view in map</span>`
    if (native.getName() === 'Android') {
        mapTag = `<a href='geo:${geopoint._latitude},${geopoint._longitude}?q=${geopoint._latitude},${geopoint._longitude}'>view in map</a>`
    }
    return `${activity.activityName}
    <p class='card-time mdc-typography--subtitle1 mb-0 mt-0'>Created On ${formatCreatedTime(activity.timestamp)}</p>
    <i class='material-icons dialog-close--heading' id='close-activity-dialog'>close</i>
    ${activity.creator.displayName  || activity.creator.phoneNumber  ? ` <span class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ${activity.creator.displayName || activity.creator.phoneNumber}</span>` :''}
    <div class='mdc-typography--subtitle2'>${mapTag}</div>
    `
}

function getStatusArray(activity) {
    const items = [];
    const confirm = {
        name: 'Confirm',
        icon: 'check',
        status: 'CONFIRMED',
        color: 'green'
    }
    const undo = {
        name: 'Undo',
        icon: 'undo',
        status: 'PENDING',
        color: '#103153'
    }
    const cancel = {
        name: 'Delete',
        icon: 'delete',
        status: 'CANCELLED',
        color: 'red'
    }

    if (activity.status === 'CANCELLED') {
        items.push(undo,confirm)
    }
    if (activity.status === 'PENDING') {
        items.push(cancel,confirm)

    }
    if (activity.status === 'CONFIRMED') {
        items.push(cancel, undo);
    };
    return items;
}




function showViewDialog(heading, activity, id) {

    const dialog = new Dialog(heading, activityDomCustomer(activity), id).create()
    
    dialog.open();

    const footer = dialog.container_.querySelector('.mdc-dialog__actions');
    footer.remove()
    // if(activity.canEdit) {
    //     footer.innerHTML = '';
    //     getStatusArray(activity).forEach(function(item,index){
    //         const button = createButton(item.name,'',item.icon);
    //         if(index == 0) {
    //             button.style.marginRight = 'auto';
    //         }
    //         button.style.color = item.color;
    //         button.addEventListener('click',function(){
    //                 activity.status = item.status
    //                 setActivityStatus(activity)
    //         })
    //         footer.appendChild(button);
    //     });
    // }
    // else {
    // }


    dialog.autoStackButtons = false;
    dialog.listen("MDCDialog:opened", function (evt) {
        const scheduleEl = document.getElementById('schedule-container');
        if (scheduleEl) {
            const scheduleList = new mdc.list.MDCList(scheduleEl);
            scheduleList.layout()
        }
    })
    document.getElementById('close-activity-dialog').addEventListener('click',function(){
        dialog.close();
    })
    if(document.getElementById('share-btn')) {
        document.getElementById('share-btn').addEventListener('click',function(){
            share(activity, dom_root)
        })
    }
    return dialog;
}



function createDynamicChips(text, id, leadingIcon) {
    const chip = createElement('button', {
        className: 'mdc-chip',
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

function share(activity, parent) {
    if (!parent) return;
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Add People</span>
    `
    const searchIcon = `<a class='mdc-top-app-bar__action-item material-icons' id='search-btn'>
        search
    </a>`
    const header = setHeader(backIcon, searchIcon);
    header.root_.classList.remove('hidden')
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
        alreadySelected[ass.phoneNumber] = true;
        newSelected[ass.phoneNumber] = true;
    });

    parent.innerHTML = content;


    const chipSetEl = document.getElementById('share')
    const chipInit = new mdc.chips.MDCChipSet(chipSetEl)
    const ulSelector = document.getElementById('users-list')
    const ul = new mdc.list.MDCList(ulSelector)
    const sendBtn = new mdc.ripple.MDCRipple(document.getElementById('send-assignee'))
    history.pushState(['share', activity], null, null)

    loadUsers(true, alreadySelected).then(function (userResult) {

        if (!userResult.data.length) return;
        sendBtn.root_.addEventListener('click', function () {
            const userArray = Object.keys(newSelected);
            if (!userArray.length) {
                snacks('At least 1 contact must be selected')
                return;
            }

            activity.share = userArray;
            addAssignee(activity);

        })
        document.getElementById('users-list').innerHTML = userResult.domString;

        chipInit.listen('MDCChip:removal', function (event) {

        
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
                newChip.classList.add('mdc-chip--selected')
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
    if (document.getElementById('search-users')) {
        document.getElementById('search-users').classList.add('hidden')
    }
    document.getElementById('app-header').classList.remove("hidden")
    appTabBar.root_.classList.remove('hidden')
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

    return ` <div class='mdc-card'>
    <div id='status-change-container'></div>
    <div class='view-card'>
    <div id='schedule-container'>
        <ul class='mdc-list mdc-list--two-line'>
            ${viewSchedule(activityRecord)}
        </ul>
    </div>
    <div id='schedule-container'>
        <ul class='mdc-list mdc-list--two-line'>
            ${viewVenue(activityRecord)}
        </ul>
    </div>
    <div id='attachment-container'>
        ${viewAttachment(activityRecord)}
    </div>  
     
        <div id='assignee-container'>
            ${activityRecord.assignees.length ?`<div class="assignees tasks-heading center">
            <i class="material-icons">share</i>
            ${viewAssignee(activityRecord,true)}
        </div>` :'' }
          
    </div>

</div>`
}

function addAssignee(record) {

    closeSearchBar();
    appLocation(3).then(function (geopoint) {
        requestCreator('share', record, geopoint).then(function () {
            snacks(`You added ${record.assignees.length} people`)
            history.back();
        }).catch(console.error)

    }).catch(handleLocationError)
}


function setActivityStatus(record) {

    appLocation(3).then(function (geopoint) {
        requestCreator('statusChange', record, geopoint).then(function () {
            snacks(`${record.activityName} is ${record.status}`)
        }).catch(console.error)
    }).catch(handleLocationError)
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
    if (activityRecord.attachment[attachmentName].type === 'product') {
        if(!checkProductLength(activityRecord.attachment['Products'].value)) return '';
      
        return `<div class='products-container'>
            <p class='mdc-typography--subtitle2 mb-0'>Products : </p>
            ${activityRecord.attachment[attachmentName].value.map(function(product){
                return `<p class='mt-0 mb-0 mdc-theme--subtitle1'>${product.name}</p>
                <div class='details mdc-theme--caption' style='margin-left:20px'>
                    ${product.date ? `<div> Date : ${moment(product.date).format('D MMM h[:]mm A')}</div>`:''}
                    ${product.quantity ? `<div>Quantity : ${product.quantity}</div>` :''}
                    ${product.rate ? `<div>Rate : ${product.rate}</div>` :''}
                </div>
                `
            }).join("")}
        </div>
        `;
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

function viewAssignee(activityRecord,canAdd) {
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
// ${activityRecord.canEdit & canAdd ? `<div class="mdc-chip add-people" id='share-btn'>
// <i class='mdc-chip__icon mdc-chip__icon--leading material-icons'>group_add</i>
// <div class='mdc-chip__text'>Add people</div>
// </div>` :''} 



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

function dynamicAppendChats() {
    const parent = document.getElementById('content');
    const myNumber = firebase.auth().currentUser.phoneNumber;
    
    db
    .transaction('addendum')
    .objectStore('addendum')
    .index('timestamp')
    .openCursor(IDBKeyRange.lowerBound(Number(parent.dataset.timestamp),true))
    .onsuccess = function(e){
        const cursor = e.target.result;
        if(!cursor) return;
        if(!parent) return;
        if(cursor.value.key !== myNumber+history.state[1].mobile) {
            cursor.continue();
            return;
        }
        if(document.getElementById(cursor.value.addendumId)) {
            cursor.continue();
            return;
        }
        
        let position = 'them';
        if (cursor.value.user === myNumber) {
            position = 'me'
        }

        if (cursor.value.isComment) {
            parent.appendChild(messageBox(cursor.value.comment, position, cursor.value.timestamp))
        }
        else {
            parent.appendChild(actionBox(cursor.value, position))
        }
        cursor.continue();
    }

    const tx =  db.transaction('users','readwrite');
    const store =  tx.objectStore('users')
    store.get(history.state[1].mobile).onsuccess = function(e){
        const record = e.target.result;
        if(!record) return;
        delete record.count;
        store.put(record)
    }
    tx.oncomplete = function(){
        setBottomScroll();
    }
}

function getHumanDateString(date) {
    const today = moment();
    const yesterday = moment().subtract(1, 'day');


    if (date.isSame(today, 'day')) return 'Today';
    if (date.isSame(yesterday, 'day')) return 'Yesterday';
    return date.format('DD MMMM YYYY')


}

function dateBox(dateString) {
    const box = createElement('div',{
        className:'date-box'
    })
    box.innerHTML =`<div class="date" data-chat-date='${dateString}'>${dateString}</div>
    `
   return box


}



function getUserChats(userRecord) {
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('key')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const range = IDBKeyRange.only(myNumber + userRecord.mobile)

    const myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
    const parent = document.getElementById('content');
    let timeLine = document.createDocumentFragment();
    let position = '';
    let currentDateName = ''
    let lastTimestamp = '';
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
            timeLine.appendChild(dateBox(dateName))
        }
        currentDateName = dateName;
        if (cursor.value.isComment) {
            timeLine.appendChild(messageBox(cursor.value.comment, position, cursor.value.timestamp))
        } else {
            timeLine.appendChild(actionBox(cursor.value, position));
        }
        lastTimestamp = cursor.value.timestamp
        cursor.continue();
    }
    tx.oncomplete = function () {
        parent.innerHTML = '';
        parent.appendChild(timeLine);
        setBottomScroll();
        parent.dataset.timestamp = lastTimestamp
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