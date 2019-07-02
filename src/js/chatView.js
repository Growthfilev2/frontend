let delay;
let longPressTimer = 1000;

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
        let currentChats = '';
        let newContacts = '';
        const myNumber = firebase.auth().currentUser.phoneNumber;
        const searchable = getSearchBound(evt)
        searchable.bound.onsuccess = function (event) {
            const cursor = event.target.result
            if (!cursor) return
            if (cursor.value.mobile === myNumber) {
                cursor.continue();
                return;
            }

            if (cursor.value.timestamp) {
                currentChats += userLi(cursor.value,true);
            } else {
                newContacts += userLi(cursor.value,true)
            }

            cursor.continue()
        }
        searchable.tx.oncomplete = function () {
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

        }

    });

    searchInit.leadingIcon_.root_.onclick = function () {
        history.back()
    }
    searchInit.trailingIcon_.root_.onclick = function () {
        searchInit.value = ''
    }

}

function getSearchBound(evt) {
    let value = evt.target.value;
    let indexName;

    if (isNumber(value)) {
        indexName = 'mobile'
        value = formatNumber(value);
    } else {
        indexName = 'displayName'
    }
    const bound = IDBKeyRange.bound(value, value + '\uffff')
    const tx = db.transaction(['users', 'addendum']);
    return {
        tx: tx,
        bound: tx.objectStore('users').index(indexName).openCursor(bound)
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
        string += userLi(cursor.value,true);
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

function userLi(value,isClickable,attr) {
    return `<li class="mdc-list-item ${attr ? attr.class.join("") :''}" ${isClickable ?`onclick="enterChat('${value.mobile}')"`: ''}>
    <img class="mdc-list-item__graphic material-icons" aria-hidden="true" src=${value.photoURL || './img/empty-user.jpg'} data-number=${value.phoneNumber}>
    <span class="mdc-list-item__text">
    <span class="mdc-list-item__primary-text">
        ${value.displayName || value.mobile}
    </span>
    <span class="mdc-list-item__secondary-text">
    ${value.comment || ''}
    </span>
    </span>
    <span class="mdc-list-item__meta" aria-hidden="true">
    ${count ? `<div class='chat-count'>${count}</div>` :''}
    
    ${value.timestamp ? formatCreatedTime(value.timestamp) : ''}</span>
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
            string += userLi(cursor.value,true);
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



    db.transaction('users').objectStore('users').get(number).onsuccess = function (event) {
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
        history.pushState(['enterChat', record], null, null)

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
    return `
    <div class='mdc-menu-surface--anchor'>
    <div class="mdc-menu mdc-menu-surface" data-id="${value.activityId}">
    </div>
    <div class="message-wrapper aciton-info" onclick="createActivityActionMenu('${value.activityId}')">
    <div class="text-wrapper">${value.comment}
    <span class="metadata">
    <i class='material-icons'>info</i>
    </span>
    </div>
    </div>
    </div>
   `
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


function createActivityActionMenu(id) {
    console.log("long press")
    db.transaction('activity').objectStore('activity').get(id).onsuccess = function (event) {
        const activity = event.target.result;
        if (!activity) return;
        const heading = `${activity.activityName}
        <p class='card-time mdc-typography--subtitle1 mb-0 mt-0'>Created On ${formatCreatedTime(activity.timestamp)}</p>
        <span class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ${activity.creator.displayName || activity.creator.phoneNumber}</span>`
        const items = ['View/Edit','Share']
        if(!activity.canEdit) {
            dialog = new Dialog(heading, activityDomCustomer(activity), 'view-form').create('simple');
            dialog.open();
            return
        };

       
      
        
            if (activity.status === 'CANCELLED') {
                items.push('Mark Confirmed')
                items.push('Mark Pending')
            }
            if (activity.status === 'PENDING') {
                items.push('Mark Confirmed')
                items.push('Mark Cancelled')

            }
            if (activity.status === 'CONFIRMED') {
                items.push('Mark Pending')
                items.push('Mark Cancelled')
            }
            document.querySelector(`[data-id="${id}"]`).innerHTML = createSimpleMenu(items)
            menu = new mdc.menu.MDCMenu(document.querySelector(`[data-id="${id}"]`))
            menu.open = true
            menu.root_.classList.add('align-right-menu')
            menu.listen('MDCMenu:selected',function(evt){
              
                switch(items[evt.detail.index]){
                    case 'View/Edit':
                    dialog = new Dialog(heading, activityDomCustomer(activity), 'view-form', viewFormActions()).create();
                    dialog.open()
                    break;
                    case 'share':
                    createShareUI(activity)
                    break;
                    case 'Mark Pending':
                    setActivityStatus(activity,'PENDING')
                    break;
                    case 'Mark Confirmed':
                    setActivityStatus(activity,'CONFIRMED')
                    break;
    
                    case 'Mark Cancelled':
                    setActivityStatus(activity,'CANCELLED')
                    break;
                    default:
                    break;
                }
            })
        
    }
   
}


function createDynamicChips(user) {
    const chip = createElement('div',{className:'mdc-chip'});
    const image = createElement('image',{className:'mdc-chip__icon mdc-chip__icon--leading',src:`${user.photoURL || '../img/empty-user.jpg'}`})
    const text = createElement('div',{className:'mdc-chip__text',textContent:`${user.displayName || user.phoneNumber}`})
    const trailingIcon = createElement('i',{className:'mdc-chip__icon mdc-chip__icon--trailing material-icons',textContent:'clear'})
    chip.appendChild(image)
    chip.appendChild(text)
    chip.appendChild(trailingIcon)
    return chip

}

function share(activity) {
    const alreadySelected = {};
    const newSelected = {};
    const content = `
    ${searchBar()}
    <h3 class='mdc-typography--headline6'>Added</h3>
    ${viewAssignee(activity)}
    <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='users-list'>

    </ul>
    `

    activity.assignees.forEach(function (ass) {
        alreadySelected[ass.phoneNumber] = true
    });

    document.getElementById('app-header').classList.add("hidden")
    document.getElementById('app-current-panel').innerHTML = content();
    const searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'))
    searchInit.focus()
    const results = [];
    searchInit.addEventListener('input',function(evt){
        const searchable = getSearchBound(evt);
        let userString = '';
        searchable.bound.onsuccess = function(searchEvent) {
            const cursor = searchEvent.target.result;
            if(!cursor) return;
            if(alreadySelected[cursor.value.mobile]) {
                cursor.continue();
                return;
            }
            results.push(cursor.value)
            if(newSelected[cursor.value.mobile]) {
                userString += userLi(cursor.value) = userLi(cursor.value,false,{class:'selected'})
            }
            else {
                userString += userLi(cursor.value);
            }

            cursor.continue();
        }
        searchable.tx.oncomplete = function(){
            const ulSelector =  document.getElementById('users-list') 
            ulSelector.innerHTML = userString;
            const ul = new mdc.list.MDCList(ulSelector)
            ul.listen('MDCList:action',function(listActionEvent){
                const el =  ul.listElements[listActionEvent.detail.index]
                const selectedUser = results[listActionEvent.detail.index]
                if(el.classList.contains('selected')) {
                    delete newSelected[selectedUser.mobile]
                    ul.listElements[listActionEvent.detail.index].classList.remove('selected')
                }
                else {
                    newSelected[selectedUser.mobile] = true;
                    ul.listElements[listActionEvent.detail.index].classList.add('selected')
                    document.getElementById('share').appendChild(createDynamicChips(selectedUser))
                }
            })

            // const chipInit = new mdc.chips.MDCChipSet(document.getElementById('share'))
            // chipInit.listen('MDCChip:action',function(chipEvent){
            //     delete alreadySelected[selectedUser.mobile]
            //     ul.listElements[listActionEvent.detail.index].classList.remove('selected')
            // })
        }
    })
   
}

function activityDomCustomer(activityRecord) {
    console.log(activityRecord);
    return ` <div class='mdc-card'>
    <div class='view-card'>

        <div id='attachment-container'>
            ${viewAttachment(activityRecord)}
        </div>
        <div id='venue-container'>
            <ul class="mdc-list">
                ${viewVenue(activityRecord)}
            </ul>
        </div>
        <div id='schedule-container'>
            <ul class='mdc-list mdc-list--two-line'>
                ${viewSchedule(activityRecord)}
            </ul>
        </div>
        <div id='schedule-container'></div>
        <div id='assignee-container'>
            <div class="assignees tasks-heading center">
                <i class="material-icons">share</i>
                ${viewAssignee(activityRecord)}
            </div>
        </div>
    
    </div>
</div>`
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
   
    
    <div class="mdc-card__action-icons">
        <button class="mdc-icon-button material-icons mdc-card__action mdc-card__action--icon " title="edit"
            data-mdc-ripple-is-unbounded="true">edit</button>
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

function viewAttachment(activityRecord) {
    return `${Object.keys(activityRecord.attachment).map(function(attachmentName){
        return `${activityRecord.attachment[attachmentName].value ? `<h1 class="mdc-typography--subtitle1 mt-0">
        ${attachmentName} : ${activityRecord.attachment[attachmentName].value}
        </h1>` :''}`
    }).join("")}`
}

function viewVenue(activityRecord) {
    return `${activityRecord.venue.map(function(v,idx){
        return `
            ${v.location && v.address ? `
            <li class="mdc-list-item">
                 ${idx == 0 ?`<span class="mdc-list-item__graphic material-icons"
                 aria-hidden="true">location_on</span>` :
                 `<span class="mdc-list-item__graphic" aria-hidden="true"
                    style='background-color:white'></span>`}
                     <span class='list-text'>${v.location}</span>
              </li>`:''}`
     }).join("")}`
}

function viewSchedule(activityRecord) {
    return `${activityRecord.schedule.map(function(sc,idx){
            return  `
            <li class="mdc-list-item">
            ${idx == 0 ? `<span class="mdc-list-item__graphic material-icons"
            aria-hidden="true">today</span>`:`<span class="mdc-list-item__graphic" aria-hidden="true"
            style='background-color:white'></span>`}
            <span class="mdc-list-item__text">
              <span class="mdc-list-item__primary-text">${sc.name}</span>
              <span class="mdc-list-item__secondary-text">${formatCreatedTime(sc.startTime)} - ${formatCreatedTime(sc.endTime)}</span>
            </span>
          </li>`
    }).join("")}`
}

function viewAssignee(activityRecord) {
    return `
    <div class="mdc-chip-set" id='share'>
     ${activityRecord.assignees.map(function(user){
        return `<div class="mdc-chip">
                    <img class='mdc-chip__icon mdc-chip__icon--leading' src=${user.photoURL || '../img/empty-user.jpg'}>
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
    let string = ''
    const myNumber = firebase.auth().currentUser.phoneNumber
    const myImage = firebase.auth().currentUser.photoURL;
    addendums.forEach(function (addendum) {
        let position = '';
        let image = ''
        if (addendum.user === myNumber) {
            position = 'me'
            image = myImage
        } else {
            position = 'them'
            image = history.state[1].photoURL
        }
        if (addendum.isComment) {
            string += messageBox(addendum.comment, position, image, addendum.timestamp)
        } else {
            string += actionBox(addendum)
        }
    })
    parent.innerHTML += string;
    setBottomScroll()
}



function getUserChats(userRecord) {
    const tx = db.transaction('addendum');
    const index = tx.objectStore('addendum').index('key')
    const myNumber = firebase.auth().currentUser.phoneNumber;
    const range = IDBKeyRange.only(myNumber + userRecord.mobile)
    index.getAll(range).onsuccess = function (event) {
        console.log(event.target.result);
    }
    const myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
    const parent = document.getElementById('content');
    let timeLine = ''
    let position = '';
    let image = ''
    index.openCursor(range).onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.user === myNumber) {
            position = 'me';
            image = myImage
        } else {
            position = 'them';
            image = userRecord.photoURL || './img/empty-user.jpg'
        }
        console.log(new Date(cursor.value.timestamp))
        if (cursor.value.isComment) {
            timeLine += messageBox(cursor.value.comment, position, image, cursor.value.timestamp)
        } else {
            timeLine += actionBox(cursor.value)
        }
        cursor.continue();
    }
    tx.oncomplete = function () {
        parent.innerHTML = timeLine;
        setBottomScroll();

        // [...document.querySelectorAll('.mdc-menu-surface--anchor')].forEach(function(el){
        //         el.addEventListener('mousedown',function(event){
        //                 console.log('mousedown',event)
        //                 selectedId = el.dataset.id
        //                 menu = new mdc.menu.MDCMenu(document.querySelector(`[data-id="${selectedId}"] .mdc-menu`))
        //                 delay = setTimeout(createActivityActionMenu,longPressTimer);
        //         },true)

        //         el.addEventListener('mouseup', function (e) {
        //             selectedId = ''
        //             console.log('mouseup',menu)
        //             if(menu){
        //                 menu.open = true
        //                 menu.root_.classList.add('mdc-menu-surface--open')
        //             }
        //             clearTimeout(delay)
        //         })
        //         el.addEventListener('mouseout', function (e) {
        //             selectedId =''
        //             console.log('mouseout',menu)
        //             if(menu){
                        
        //                 menu.open = true
        //                 menu.root_.classList.add('mdc-menu-surface--open')
        //             }
        //             clearTimeout(delay)
        //         })

        // })



        const btn = new mdc.ripple.MDCRipple(document.getElementById('comment-send'));
        const commentInit = new mdc.textField.MDCTextField(document.getElementById('comment-textarea'))
        const form = document.querySelector('.conversation-compose');
        const bottom = document.getElementById('bottom')
        btn.root_.addEventListener('click', function () {

            if (!commentInit.value.trim()) return;
            progressBar.open()
            requestCreator('dm', {
                comment: commentInit.value,
                assignee: userRecord.mobile
            }).then(function () {
                parent.innerHTML += messageBox(commentInit.value, 'me', firebase.auth().currentUser.photoURL);
                commentInit.value = ''
                resetCommentField(bottom, form, commentInit.input_)
                setBottomScroll()
                progressBar.close()

            }).catch(function (error) {
                progressBar.close()
                commentInit.value = ''
                snacks(error.response.message);

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