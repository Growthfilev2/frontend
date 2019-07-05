function chatView() {

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
    // const contactsBtn = new mdc.ripple.MDCRipple(document.querySelector('.open-contacts-btn'));
    // contactsBtn.root_.addEventListener('click', function (evt) {
    //     contactsBtn.root_.remove();
    //     loadUsers().then(function (result) {
    //         header.navIcon_.classList.remove('hidden')
    //         document.getElementById('search-btn').classList.remove('hidden')

    //         document.getElementById('chats').innerHTML = result.domString


    //     })
    // })
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
        const currentChatsArray = []
        let newContacts = '';
        const newContactsArray = [];
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
                currentChatsArray.push(cursor.value)
                currentChats += userLi(cursor.value);
            } else {
                newContactsArray.push(cursor.value)
                newContacts += userLi(cursor.value)
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
           <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='current-chats-list'>
            ${currentChats}
           </ul>`:'' }
           ${newContacts ?`  <h3 class="mdc-list-group__subheader">Other Contacts</h3>
           <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id='new-chats-list'>
            ${newContacts}
           </ul>`:''}
          </div>`
            parent.innerHTML = listGroup;
            if(currentChatsArray.length) {

                const currenChatsUl = new mdc.list.MDCList(document.getElementById('current-chats-list'))
                currenChatsUl.listen('MDCList:action',function(evt){
                    const userRecord = currentChatsArray[evt.detail.index];
                    history.pushState(['enterChat',userRecord],null,null)
                    enterChat(userRecord)
                })
            }
            if(newContactsArray.length) {
            const newChatsUl = new mdc.list.MDCList(document.getElementById('new-chats-list'))
            newChatsUl.listen('MDCList:action',function(evt){
                const userRecord = newContactsArray[evt.detail.index];
                history.pushState(['enterChat',userRecord],null,null)
                enterChat(userRecord)
            })
        }
        
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
    const result = []
    index.openCursor(null, 'prev').onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        }
        result.push(cursor.value)
        string += userLi(cursor.value, true);
        cursor.continue();
    }
    tx.oncomplete = function () {
        if(!result.length) {
            document.getElementById('chats').innerHTML = `<li class='mdc-list-item'>No Chats Found</li>`
            return;
        }
        document.getElementById('search-btn').classList.remove('hidden')
        const ulSelector =  document.getElementById('chats')
        ulSelector.innerHTML = string
        const ul = new mdc.list.MDCList(ulSelector)
        ul.listen('MDCList:action',function(evt){
            const userRecord = result[evt.detail.index]
            history.pushState(['enterChat',userRecord],null,null)
            enterChat(userRecord);
        })
    }

}

function userLi(value) {
    return `<li class="mdc-list-item">
   <div style="position:relative">
   <img class="mdc-list-item__graphic" aria-hidden="true" src=${value.photoURL || './img/empty-user.jpg'} data-number=${value.mobile}>
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
    ${value.count ? `<div class='chat-count'>${value.count}</div>` :''}
    
    ${value.timestamp ? formatCreatedTime(value.timestamp) : ''}</span>
    </li>`
}

function loadUsers(hideMetaText,exception) {
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
            if(exception) {
                if(exception[cursor.value.mobile]) {
                    cursor.continue();
                    return;
                }
            }
            result.push(cursor.value)
            if(hideMetaText) {
                cursor.value.comment = '';
                cursor.value.count = ''
                cursor.value.timestamp = ''
                string += userLi(cursor.value);
            }
            else {
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
  
        const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>       
        </a>
        <img src=${userRecord.photoURL || './img/empty-user.jpg'} class='header-image'>
        <span class="mdc-top-app-bar__title">${userRecord.displayName || userRecord.mobile}</span>
        `

        const header = getHeader('app-header', backIcon, '');
        header.root_.classList.remove('hidden')
        console.log(header)
       

        document.getElementById('app-current-panel').innerHTML = `
        <div class="wrapper">
        <div class="inner" id="inner">
    
        <div class="content" id="content">

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





function actionBox(value) {
    return `
    <div class='action-box-container'>
    <div class='menu-container mdc-menu-surface--anchor' id="${value.addendumId}"> 
    </div>
   
    <div class="message-wrapper aciton-info" onclick="createActivityActionMenu('${value.addendumId}','${value.activityId}')">
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
        </span>
    </span>
    </div>
    </div>`
}

function messageBoxDom(comment,position,image,time) {
    const wrapper = createElement('div',{className:`message-wrapper ${position}`})
    const imageEl = createElement('img',{className:'circle-wrapper',src:image});
    const text = createElement('div',{className:`text-wrapper`,textContent:comment})
    const metadata = createElement('span',{className:'metadata'});
    const timeEl = createElement('span',{className:'time',textContent:moment(time).format('hh:mm')})
    wrapper.appendChild(imageEl);
    metadata.appendChild(timeEl)
    text.appendChild(metadata);
    wrapper.appendChild(text);
    return wrapper;
}

function actionBoxDom(value){
    const container = createElement('div',{className:'action-box-container'})
    const menuCont = createElement('div',{id:value.addendumId,className:'menu-container mdc-menu-surface--anchor'})
    const wrapper = createElement('div',{className:`message-wrapper aciton-info`});
    wrapper.onclick = function(){
        createActivityActionMenu(value.addendumId,value.activityId)
    }
    const text = createElement('div',{className:`text-wrapper`,textContent:value.comment})
    const metadata = createElement('span',{className:'metadata'});
    const icon = createElement('i',{className:'material-icons',textContent:'info'})
    metadata.appendChild(icon)
    text.appendChild(metadata);
    wrapper.appendChild(text);
    container.appendChild(menuCont)
    container.appendChild(wrapper)
   return container;
}

function createActivityActionMenu(addendumId,activityId) {
    console.log("long press")
    db.transaction('activity').objectStore('activity').get(activityId).onsuccess = function (event) {
        const activity = event.target.result;
        if (!activity) return;
        const heading = `${activity.activityName}
        <p class='card-time mdc-typography--subtitle1 mb-0 mt-0'>Created On ${formatCreatedTime(activity.timestamp)}</p>
        <span class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ${activity.creator.displayName || activity.creator.phoneNumber}</span>`
        const items = ['View/Edit', 'Share']
        if (!activity.canEdit) {
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
        const joinedId = addendumId+activityId
        document.getElementById(addendumId).innerHTML = createSimpleMenu(items,joinedId)
        const menu = new mdc.menu.MDCMenu(document.getElementById(joinedId))
        menu.open = true
        menu.root_.classList.add('align-right-menu')
        menu.listen('MDCMenu:selected', function (evt) {
            switch (items[evt.detail.index]) {
                case 'View/Edit':
                    dialog = new Dialog(heading, activityDomCustomer(activity), 'view-form', viewFormActions()).create();
                    dialog.open()
                    break;
                case 'Share':
                    share(activity)
                    break;
                case 'Mark Pending':
                    setActivityStatus(activity, 'PENDING')
                    break;
                case 'Mark Confirmed':
                    setActivityStatus(activity, 'CONFIRMED')
                    break;
                case 'Mark Cancelled':
                    setActivityStatus(activity, 'CANCELLED')
                    break;
                default:
                    break;
            }
        })
    }

}


function createDynamicChips(user, id) {
    const chip = createElement('button', {
        className: 'mdc-chip mdc-chip--selected',
        id: id
    });

    const image = createElement('img', {
        className: 'mdc-chip__icon mdc-chip__icon--leading',
        src: user.photoURL || './img/empty-user.jpg'
    })
    const text = createElement('div', {
        className: 'mdc-chip__text',
        textContent: `${user.displayName || user.mobile}`
    })
    const trailingIcon = createElement('i', {
        className: 'material-icons mdc-chip__icon mdc-chip__icon--trailing',
        textContent: 'cancel'
    })
    trailingIcon.setAttribute('tabindex', '0');
    trailingIcon.setAttribute('role', 'button');
    chip.appendChild(image)
    chip.appendChild(text)
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
    history.pushState(['share',activity],null,null)
    console.log(chipInit)
    loadUsers(true,alreadySelected).then(function (userResult) {

        if (!userResult.data.length) return;
        sendBtn.root_.addEventListener('click',function(){
           const userArray = Object.keys(newSelected);
           if(!userArray.length) {
            snacks('At least 1 contact must be selected')
            return;
           }
            console.log(newSelected);
            addAssignee(activity,userArray);

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
            if(!chipInit.chips.length) {
                chipSetEl.classList.add('hidden')
            }
            else {
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
                el.querySelector('.user-selection-icon').classList.add('user-selection-show')
                const newChip = createDynamicChips(clickedUser, index);
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
                }
                else {
                    searchInit.trailingIcon_.root_.classList.remove('hidden')
                }
                ul.listElements.forEach(function (el) {
                    el.classList.remove('found')
                })
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
               document.getElementById('search-users').classList.add('hidden')
               document.getElementById('app-header').classList.remove("hidden")
               searchInit.value = "";
               searchInit.input_.dispatchEvent(new Event('input'))
            }
            searchInit.trailingIcon_.root_.onclick = function () {
                searchInit.value = "";
                searchInit.input_.dispatchEvent(new Event('input'))
              
            }
        })
    });

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

function addAssignee(record,userArray){
    progressBar.open();
    requestCreator('share',{
        activityId:record.activityId,
        share:userArray
    }).then(function(){
        progressBar.close();
        snacks(`You Added ${userArray.length} People`)
        history.back();
    }).catch(function(error){
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
     ${activityRecord.assignees.map(function(user,idx){
        return `<div class="mdc-chip" id='${idx}-preselected'>
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
    const myNumber = firebase.auth().currentUser.phoneNumber
    addendums.forEach(function (addendum) {
        let position = '';
        let image = ''
        if (addendum.user !== myNumber) {
            position = 'them'
            image = history.state[1].photoURL
            if(parent) {
            if (addendum.isComment) {
                    parent.appendChild(messageBoxDom(addendum.comment, position, image, addendum.timestamp))
                    
                } else {
                    parent.appendChild(actionBoxDom(addendum))
                }
            }
        }
    })

    setBottomScroll()
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
                if(!parent) return;
                parent.appendChild(messageBoxDom(commentInit.value, 'me', firebase.auth().currentUser.photoURL))
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