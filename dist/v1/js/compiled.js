function addView(sub) {

    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon material-icons\'>arrow_back</a>\n    <span class="mdc-top-app-bar__title">' + sub.template.toUpperCase() + '</span>\n    ';
    var header = getHeader('app-header', backIcon, '');
    header.root_.classList.remove('hidden');
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');

    // hideBottomNav();
    document.getElementById('app-current-panel').innerHTML = '\n    <div class=\'banner\'></div>\n    <iframe id=\'form-iframe\' src=\'' + window.location.origin + '/forms/' + sub.template + '/edit.html?var=' + ApplicationState.iframeVersion + '\'></iframe>\n    ';
    console.log(db);
    document.getElementById('form-iframe').addEventListener("load", function (ev) {
        document.getElementById('form-iframe').contentWindow.init(sub);
    });
}

function sendFormToParent(formData) {
    progressBar.open();
    var customerAuths = formData.customerAuths;
    delete formData.customerAuths;
    requestCreator('create', formData).then(function () {
        progressBar.close();
        successDialog();
        if (formData.template === 'customer') {
            ApplicationState.knownLocation = true;
            ApplicationState.venue = {
                office: formData.office,
                template: formData.template,
                status: formData.status,
                location: formData.venue[0].location,
                address: formData.venue[0].address,
                latitude: formData.venue[0].geopoint.latitude,
                longitude: formData.venue[0].geopoint.longitude
            };

            getSuggestions();
            Object.keys(customerAuths).forEach(function (customerNumber) {

                requestCreator('updateAuth', customerAuths[customerNumber]).then(function (response) {
                    console.log(response);
                }).catch(function (error) {
                    console.log(error.response.message);
                });
            });

            return;
        }
        getSuggestions();
    }).catch(function (error) {
        progressBar.close();
        snacks(error.response.message, 'Okay');
    });
}

function parseContact(contactString) {
    var displayName = contactString.split("&")[0].split("=")[1];
    var phoneNumber = contactString.split("&")[1].split("=")[1];
    var email = contactString.split("&")[2].split("=")[1];
    return {
        displayName: displayName || "",
        phoneNumber: phoneNumber ? formatNumber(phoneNumber) : "",
        email: email || ""
    };
}

function setContactForCustomer(contactString) {
    var contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails, 'First Contact');
}
function setContactForCustomerFailed(exceptionMessage) {
    handleError({
        message: exceptionMessage,
        body: ''
    });
}

function setContactForSecondCustomer(contactString) {
    var contactDetails = parseContact(contactString);
    document.getElementById('form-iframe').contentWindow.setContact(contactDetails, 'Second Contact');
}
function setContactForSecondCustomerFailed(exceptionMessage) {
    handleError({
        message: exceptionMessage,
        body: ''
    });
}
function attendenceView() {
    document.getElementById('app-header').classList.remove("hidden");
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');
    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon material-icons\'>arrow_back</a>\n    <span class="mdc-top-app-bar__title">Attendence</span>\n    ';

    var header = getHeader('app-header', backIcon, '');
    document.getElementById('app-current-panel').innerHTML = '<div class=\'attendence-section pt-20\'>\n    ' + applyLeave() + '\n    ' + attendenceCards() + '\n    </div>\n    ';
}

function applyLeave() {

    return '<button class="mdc-button" id=\'apply-leave\'>\n    <i class="material-icons mdc-button__icon" aria-hidden="true">today</i>\n    <span class="mdc-button__label">Apply For A New Leave</span>\n  </button>';
}

function attendenceCards() {
    return '<div class=\'cards-container mdc-layout-grid__inner mt-20 pt-20\'>\n    ' + [1, 2, 3].map(function () {
        return '<div class="mdc-card mdc-layout-grid__cell">\n        <div class="mdc-card__primary-action demo-card__primary-action">\n        <div class="">\n            <h2 class="demo-card__title mdc-typography mdc-typography--headline6">Our Changing Planet</h2>\n            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">by Kurt Wagner</h3>\n        </div>\n        <div class="demo-card__secondary mdc-typography mdc-typography--body2">Visit ten places on our planet that are undergoing the biggest changes today.</div>\n        <div class="card-actions mt-20">\n        <button class="mdc-button" style="\n/* width: 100%; */\n">\n            <span class="mdc-button__label" style="\ntext-align: left;\n">Regularize Attendece</span>\n        </button><button class="mdc-button" style="\n/* margin: 0 auto; */\n/* display: block; */\n/* width: 100%; */\n">\n            <span class="mdc-button__label">Apply Leave</span>\n        </button>\n        \n        </div>\n        </div>\n \n    </div>';
    }).join("") + '\n    </div>';
}
var contactsUl;
var chatsUl;
var currentChatsArray = [];
var currentContactsArray = [];
function chatView() {

    document.getElementById('start-load').classList.add('hidden');
    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon\'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>';
    var searchIcon = '<a class=\'mdc-top-app-bar__action-item material-icons\' id=\'search-btn\'>\n        search\n    </a>';

    var header = getHeader('app-header', backIcon, searchIcon);
    document.getElementById('app-header').classList.remove("hidden");
    document.getElementById('app-current-panel').innerHTML = chatDom();
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');

    readLatestChats();
}

function chatDom() {
    return '<div class=\'user-chats\'>\n    \n<div id=\'search-users-container\'>\n    <div class=\'search-field\'></div>\n    <div class=\'search-result-container\'></div>\n</div>\n<div class="mdc-list-group">\n <h3 id=\'no-result-found\' style=\'text-align:center\'></h3>   \n<div class=\'chats-container\'>\n<h3 class="mdc-list-group__subheader">Chats</h3>\n<ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id=\'chats\'>\n\n</ul>\n</div>\n<div class=\'contacts-container\'>\n  <h3 class="mdc-list-group__subheader">Other Contacts</h3>\n  <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id=\'all-contacts\'>\n  </ul>\n</div>\n  </div>\n</div>';
}

function searchBar() {
    return '<div id=\'search-users\' class="mdc-text-field mdc-text-field--with-leading-icon mdc-text-field--with-trailing-icon mdc-text-field--no-label">\n    <i class="material-icons mdc-text-field__icon" tabindex="0" role="button" id=\'search-back\'>arrow_back</i>\n    <i class="material-icons mdc-text-field__icon hidden"  tabindex="0" role="button" id=\'clear-search\'>clear</i>\n    <input type="text" id="my-input" class="mdc-text-field__input" placeholder=\'Search...\' style=\'padding-left:48px;padding-right: 48px;\'>\n    <div class="mdc-line-ripple"></div>\n</div>';
}

function search() {
    document.getElementById('app-header').classList.add("hidden");
    document.querySelector('#search-users-container .search-field').innerHTML = searchBar();
    var searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'));
    searchInit.focus();
    searchInit.input_.addEventListener('input', function (evt) {
        searchInit.trailingIcon_.root_.classList.remove('hidden');
        if (!evt.target.value) {
            searchInit.trailingIcon_.root_.classList.add('hidden');
        } else {
            searchInit.trailingIcon_.root_.classList.remove('hidden');
        };
        var myNumber = firebase.auth().currentUser.phoneNumber;
        var searchable = getSearchBound(evt);
        var currentChats = '';
        var currentContacts = '';
        currentChatsArray = [];
        currentContactsArray = [];
        searchable.bound.onsuccess = function (event) {
            var cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.mobile === myNumber) {
                cursor.continue();
                return;
            }

            if (cursor.value.timestamp) {
                currentChats += userLi(cursor.value);
                currentChatsArray.push(cursor.value);
            } else {
                currentContacts += userLi(cursor.value);
                currentContactsArray.push(cursor.value);
            }
            cursor.continue();
        };
        searchable.tx.oncomplete = function () {
            var chatsEl = document.getElementById('chats');
            var contactsEl = document.getElementById('all-contacts');
            var noResultEl = document.getElementById('no-result-found');

            if (noResultEl) {
                if (!currentChatsArray.length && !currentContactsArray.length) {
                    noResultEl.innerHTML = 'No Results Found';
                } else {
                    noResultEl.innerHTML = '';
                }
            }
            if (chatsEl) {
                if (!currentChatsArray.length) {
                    document.querySelector('.chats-container').classList.add("hidden");
                } else {
                    document.querySelector('.chats-container').classList.remove("hidden");
                }
                chatsEl.innerHTML = currentChats;
            }
            if (contactsEl) {
                if (!currentContacts) {
                    document.querySelector('.contacts-container').classList.add("hidden");
                } else {
                    document.querySelector('.contacts-container').classList.remove("hidden");
                }
                contactsEl.innerHTML = currentContacts;
            }
        };
    });

    searchInit.leadingIcon_.root_.onclick = function () {
        history.back();
        // searchInitBack(searchInit)
    };
    searchInit.trailingIcon_.root_.onclick = function () {
        searchInitCancel(searchInit);
    };
}

function getSearchBound(evt) {
    var value = evt.target.value;
    var tx = db.transaction(['users', 'addendum']);
    var STORE_OR_INDEX = tx.objectStore('users');
    var bound = null;
    var direction = 'next';
    if (!evt.target.value) {
        if (history.state[0] === 'searchChats') {
            indexName = 'timestamp';
            direction = 'prev';
        }
    } else {
        if (isNumber(value)) {
            indexName = 'mobile';
            value = formatNumber(value);
        } else {
            indexName = 'NAME_SEARCH';
            value = value.toLowerCase();
        };
        bound = IDBKeyRange.bound(value, value + '\uFFFF');
        STORE_OR_INDEX = STORE_OR_INDEX.index(indexName);
    }

    STORE_OR_INDEX = STORE_OR_INDEX.openCursor(bound, direction);

    return {
        tx: tx,
        bound: STORE_OR_INDEX
    };
}

function isNumber(searchTerm) {
    return !isNaN(searchTerm);
}

function formatNumber(numberString) {
    var number = numberString;
    if (number.substring(0, 2) === '91') {
        number = '+' + number;
    } else if (number.substring(0, 3) !== '+91') {
        number = '+91' + number;
    }
    return number.replace(/ +/g, "");
}
function readLatestChats() {
    var v1 = performance.now();
    document.querySelector('.user-chats').classList.add('hidden');
    currentChatsArray = [];
    currentContactsArray = [];
    var tx = db.transaction('users', 'readwrite');
    var index = tx.objectStore('users').index('timestamp');

    var myNumber = firebase.auth().currentUser.phoneNumber;
    var currentChats = '';

    var currentContacts = '';

    index.openCursor(null, 'prev').onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.mobile === myNumber) {
            cursor.continue();
            return;
        };
        if (ApplicationState.currentChatSlected === cursor.value.mobile) {
            cursor.value.count = 0;
            var update = cursor.update(cursor.value);
            update.onsuccess = function () {
                ApplicationState.currentChatSlected = null;
                console.log("count reset");
            };
        }
        if (cursor.value.timestamp) {
            currentChats += userLi(cursor.value);
            currentChatsArray.push(cursor.value);
        } else {
            currentContacts += userLi(cursor.value);
            currentContactsArray.push(cursor.value);
        }
        cursor.continue();
    };
    tx.oncomplete = function () {
        var chatsEl = document.getElementById('chats');
        var contactsEl = document.getElementById('all-contacts');
        var chatsUl = void 0;
        var contactsUl = void 0;
        if (chatsEl) {
            document.querySelector('.chats-container').classList.remove("hidden");
            if (!currentChatsArray.length) {
                currentChats = 'No Chat Found. ';
            }
            chatsEl.innerHTML = currentChats;
            chatsUl = new mdc.list.MDCList(chatsEl);
            initializeChatList(chatsUl);
        }
        if (contactsEl) {
            document.querySelector('.contacts-container').classList.remove("hidden");
            if (!currentContacts) {
                currentContacts = 'No Contacts Found';
            };
            contactsEl.innerHTML = currentContacts;
            contactsUl = new mdc.list.MDCList(contactsEl);
            initializeContactList(contactsUl);
        }
        document.querySelector('.user-chats').classList.remove('hidden');

        var v2 = performance.now();
        console.log('performance', v2 - v1);
        if (!document.getElementById('search-btn')) return;
        if (chatsUl && contactsUl) {
            document.getElementById('search-btn').addEventListener('click', function () {
                history.pushState(['searchChats'], null, null);
                search();
            });
        }
    };
}

function initializeChatList(chatsUl) {

    chatsUl.listen('MDCList:action', function (evt) {
        var userRecord = currentChatsArray[evt.detail.index];
        if (history.state[0] === 'searchChats') {
            history.replaceState(['enterChat', userRecord], null, null);
        } else {
            history.pushState(['enterChat', userRecord], null, null);
        }
        enterChat(userRecord);
    });
}

function initializeContactList(contactsUl) {
    contactsUl.listen('MDCList:action', function (evt) {
        var userRecord = currentContactsArray[evt.detail.index];
        if (history.state[0] === 'searchChats') {
            history.replaceState(['enterChat', userRecord], null, null);
        } else {
            history.pushState(['enterChat', userRecord], null, null);
        }
        enterChat(userRecord);
    });
}

function userLi(value) {
    return '<li class="mdc-list-item">\n   <div style="position:relative">\n   <img class="mdc-list-item__graphic"  aria-hidden="true" src=' + (value.photoURL || './img/empty-user.jpg') + '  onerror="imgErr(this)" data-number=' + value.mobile + '>\n   <i class="material-icons user-selection-icon">check_circle</i>\n   </div>\n    \n    <span class="mdc-list-item__text">\n    <span class="mdc-list-item__primary-text">\n        ' + (value.displayName || value.mobile) + '\n    </span>\n    <span class="mdc-list-item__secondary-text">\n    ' + (value.comment || '') + '\n    </span>\n    </span>\n    <span class="mdc-list-item__meta" aria-hidden="true">\n    ' + (value.count ? '<div class=\'chat-count\'>' + value.count + '</div>' : '') + '\n    ' + (value.timestamp ? formatCreatedTime(value.timestamp) : '') + '</span>\n    </li>';
}

function loadUsers(hideMetaText, exception) {
    return new Promise(function (resolve, reject) {
        var tx = db.transaction(['users']);
        var store = tx.objectStore('users');
        var myNumber = firebase.auth().currentUser.phoneNumber;
        var string = '';
        var result = [];
        store.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
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
            result.push(cursor.value);
            if (hideMetaText) {
                cursor.value.comment = '';
                cursor.value.count = '';
                cursor.value.timestamp = '';
                string += userLi(cursor.value);
            } else {
                string += userLi(cursor.value);
            }
            cursor.continue();
        };
        tx.oncomplete = function () {
            return resolve({
                domString: string,
                data: result
            });
        };
    });
}

function selectNew() {
    return '<div class=\'new-message-container\'>\n        <h2 class=\'mdc-typography--headline5 mt-0 mb-0\'>Message Team With Direct</h2>\n    <p>Send private message.... </p>\n    <button class=\'mdc-button\' onclick=newMessage()>\n    <span class="mdc-button__label">Send Message</span>\n    </button>\n    </div>';
}

function formatCreatedTime(createdTime) {
    if (!createdTime) return '';
    if (isToday(createdTime)) {
        return moment(createdTime).format('hh:mm');
    }
    return moment(createdTime).format('D, MMM').replace(',', '');
}

function isToday(comparisonTimestamp) {
    var today = new Date();
    if (today.setHours(0, 0, 0, 0) == new Date(comparisonTimestamp).setHours(0, 0, 0, 0)) {
        return true;
    }
    return false;
}

function enterChat(userRecord) {
    ApplicationState.currentChatSlected = userRecord.mobile;
    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon\'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>       \n        </a>\n        <img src=' + (userRecord.photoURL || './img/empty-user.jpg') + ' class=\'header-image\' onerror="imgErr(this)">\n        <span class="mdc-top-app-bar__title">' + (userRecord.displayName || userRecord.mobile) + '</span>\n        ';

    var header = getHeader('app-header', backIcon, '');
    header.root_.classList.remove('hidden');
    console.log(header);

    document.getElementById('app-current-panel').innerHTML = '\n        <div class="wrapper">\n        <div class="inner" id="inner">\n    \n        <div class="content" id="content">\n\n        </div>\n      \n        <div class="bottom" id="bottom">\n        <div class="conversation-compose">\n        \n        <div id=\'comment-textarea\' class="mdc-text-field text-field mdc-text-field--fullwidth mdc-text-field--no-label  mdc-text-field--textarea">\n        \n        <textarea id="text-field-fullwidth-textarea-helper" class="mdc-text-field__input mdc-text-field__input  input-msg">\n        </textarea>\n        \n        </div>\n        \n        <button id=\'comment-send\' class="mdc-fab send mdc-theme--primary-bg mdc-theme-on--primary" aria-label="Favorite">\n        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\n        </button>\n        </div>\n        \n        </div>\n        </div>\n        </div>\n        </div>';
    getUserChats(userRecord);
}

function actionBox(value) {
    return '\n    <div class=\'action-box-container\'>\n    <div class=\'menu-container mdc-menu-surface--anchor\' id="' + value.addendumId + '"> \n    </div>\n   \n    <div class="message-wrapper aciton-info" onclick="createActivityActionMenu(\'' + value.addendumId + '\',\'' + value.activityId + '\')">\n    <div class="text-wrapper">' + value.comment + '\n    <span class="metadata">\n    <i class=\'material-icons\'>info</i>\n    </span>\n    </div>\n    </div>\n    </div>\n   ';
}

function messageBox(comment, position, image, time) {
    return '<div class="message-wrapper ' + position + '">\n    <img class="circle-wrapper" src=' + image + ' onerror="imgErr(this)">\n    <div class="text-wrapper">' + comment + '\n    <span class="metadata">\n        <span class="time">\n            ' + moment(time).format('hh:mm') + '\n        </span>\n    </span>\n    </div>\n    </div>';
}

function messageBoxDom(comment, position, image, time) {
    var wrapper = createElement('div', {
        className: 'message-wrapper ' + position
    });
    var imageEl = createElement('img', {
        className: 'circle-wrapper',
        src: image
    });
    var text = createElement('div', {
        className: 'text-wrapper',
        textContent: comment
    });
    var metadata = createElement('span', {
        className: 'metadata'
    });
    var timeEl = createElement('span', {
        className: 'time',
        textContent: moment(time).format('hh:mm')
    });
    wrapper.appendChild(imageEl);
    metadata.appendChild(timeEl);
    text.appendChild(metadata);
    wrapper.appendChild(text);
    return wrapper;
}

function actionBoxDom(value) {
    var container = createElement('div', {
        className: 'action-box-container'
    });
    var menuCont = createElement('div', {
        id: value.addendumId,
        className: 'menu-container mdc-menu-surface--anchor'
    });
    var wrapper = createElement('div', {
        className: 'message-wrapper aciton-info'
    });
    wrapper.onclick = function () {
        createActivityActionMenu(value.addendumId, value.activityId);
    };
    var text = createElement('div', {
        className: 'text-wrapper',
        textContent: value.comment
    });
    var metadata = createElement('span', {
        className: 'metadata'
    });
    var icon = createElement('i', {
        className: 'material-icons',
        textContent: 'info'
    });
    metadata.appendChild(icon);
    text.appendChild(metadata);
    wrapper.appendChild(text);
    container.appendChild(menuCont);
    container.appendChild(wrapper);
    return container;
}

function createActivityActionMenu(addendumId, activityId) {
    console.log("long press");
    db.transaction('activity').objectStore('activity').get(activityId).onsuccess = function (event) {
        var activity = event.target.result;
        if (!activity) return;
        var heading = activity.activityName + '\n        <p class=\'card-time mdc-typography--subtitle1 mb-0 mt-0\'>Created On ' + formatCreatedTime(activity.timestamp) + '</p>\n        <span class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mt-0">by ' + (activity.creator.displayName || activity.creator.phoneNumber) + '</span>';
        if (!activity.canEdit) {
            showViewDialog(heading, activity, 'view-form');

            return;
        };
        var items = [{
            name: 'View',
            icon: 'info'
        }, {
            name: 'Share',
            icon: 'share'
        }, {
            name: 'Edit',
            icon: 'edit'
        }];

        if (activity.status === 'CANCELLED') {
            items.push({
                name: 'Confirm',
                icon: 'check'
            });
            items.push({
                name: 'Undo',
                icon: 'undo'
            });
        }
        if (activity.status === 'PENDING') {
            items.push({
                name: 'Confirm',
                icon: 'check'
            });
            items.push({
                name: 'Delete',
                icon: 'delete'
            });
        }
        if (activity.status === 'CONFIRMED') {
            items.push({
                name: 'Undo',
                icon: 'undo'
            });
            items.push({
                name: 'Delete',
                icon: 'delete'
            });
        }
        var joinedId = addendumId + activityId;
        document.getElementById(addendumId).innerHTML = createSimpleMenu(items, joinedId);
        var menu = new mdc.menu.MDCMenu(document.getElementById(joinedId));
        menu.open = true;
        menu.root_.classList.add('align-right-menu');
        menu.listen('MDCMenu:selected', function (evt) {
            switch (items[evt.detail.index].name) {
                case 'View':
                    showViewDialog(heading, activity, 'view-form');
                    break;
                case 'Edit':
                    break;
                case 'Share':
                    share(activity);
                    break;
                case 'Undo':
                    setActivityStatus(activity, 'PENDING');
                    break;
                case 'Confirm':
                    setActivityStatus(activity, 'CONFIRMED');
                    break;
                case 'Delete':
                    setActivityStatus(activity, 'CANCELLED');
                    break;
                default:
                    break;
            }
        });
    };
}

function showViewDialog(heading, activity, id) {
    var dialog = new Dialog(heading, activityDomCustomer(activity), id).create();
    dialog.open();
    dialog.buttons_[1].classList.add('hidden');
    dialog.autoStackButtons = false;

    dialog.listen("MDCDialog:opened", function (evt) {
        var venueEl = document.getElementById('venue-container');
        var scheduleEl = document.getElementById('schedule-container');
        if (venueEl) {
            var venueList = new mdc.list.MDCList(venueEl);
            venueList.singleSelection = true;
            venueList.layout();
        }
        if (scheduleEl) {
            var scheduleList = new mdc.list.MDCList(venueEl);
            scheduleList.layout();
        }
    });
}

function createDynamicChips(user, id) {
    var chip = createElement('button', {
        className: 'mdc-chip mdc-chip--selected',
        id: id
    });

    var image = createElement('img', {
        className: 'mdc-chip__icon mdc-chip__icon--leading',
        src: user.photoURL || './img/empty-user.jpg'
    });
    var text = createElement('div', {
        className: 'mdc-chip__text',
        textContent: '' + (user.displayName || user.mobile)
    });
    var trailingIcon = createElement('i', {
        className: 'material-icons mdc-chip__icon mdc-chip__icon--trailing',
        textContent: 'cancel'
    });
    trailingIcon.setAttribute('tabindex', '0');
    trailingIcon.setAttribute('role', 'button');
    chip.appendChild(image);
    chip.appendChild(text);
    chip.appendChild(trailingIcon);
    return chip;
}

function share(activity) {

    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon material-icons\'>arrow_back</a>\n    <span class="mdc-top-app-bar__title">Add People</span>\n    ';
    var searchIcon = '<a class=\'mdc-top-app-bar__action-item material-icons\' id=\'search-btn\'>\n        search\n    </a>';

    var alreadySelected = {};
    var newSelected = {};

    var content = '\n    <div id=\'search-users-container\'>\n    </div>\n    <div class=\'share-user-container\'>\n    <div class="mdc-chip-set hidden" id=\'share\'>\n    </div>\n    </div>\n    <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list" id=\'users-list\'>\n    </ul>\n    <button class="mdc-fab mdc-theme--primary-bg app-fab--absolute" aria-label="Favorite" id=\'send-assignee\'>\n        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">arrow_forward</span>\n    </button>\n    ';
    activity.assignees.forEach(function (ass) {
        alreadySelected[ass.phoneNumber] = true;
    });

    document.getElementById('app-current-panel').innerHTML = content;
    var header = getHeader('app-header', backIcon, searchIcon);
    var chipSetEl = document.getElementById('share');
    var chipInit = new mdc.chips.MDCChipSet(chipSetEl);
    var ulSelector = document.getElementById('users-list');
    var ul = new mdc.list.MDCList(ulSelector);
    var sendBtn = new mdc.ripple.MDCRipple(document.getElementById('send-assignee'));
    history.pushState(['share', activity], null, null);
    console.log(chipInit);
    loadUsers(true, alreadySelected).then(function (userResult) {

        if (!userResult.data.length) return;
        sendBtn.root_.addEventListener('click', function () {
            var userArray = Object.keys(newSelected);
            if (!userArray.length) {
                snacks('At least 1 contact must be selected');
                return;
            }
            console.log(newSelected);
            addAssignee(activity, userArray);
        });
        document.getElementById('users-list').innerHTML = userResult.domString;

        chipInit.listen('MDCChip:removal', function (event) {

            console.log(chipInit.chips);
            var liElement = ul.listElements[Number(event.detail.chipId)];
            delete newSelected[userResult.data[Number(event.detail.chipId)].mobile];
            chipSetEl.removeChild(event.detail.root);
            liElement.classList.remove('selected');
            liElement.querySelector('.user-selection-icon').classList.add('hidden');
            liElement.querySelector('.user-selection-icon').classList.remove('user-selection-show');
            if (!chipInit.chips.length) {
                chipSetEl.classList.add('hidden');
            } else {
                chipSetEl.classList.remove('hidden');
            }
        });

        ul.listen('MDCList:action', function (listActionEvent) {
            var index = listActionEvent.detail.index;
            var el = ul.listElements[index];
            var clickedUser = userResult.data[index];
            if (el.classList.contains('selected')) {
                var chip = new mdc.chips.MDCChip(document.getElementById('' + index));
                chip.beginExit();
            } else {

                newSelected[clickedUser.mobile] = true;
                el.classList.add('selected');
                el.querySelector('.user-selection-icon').classList.remove('hidden');
                el.querySelector('.user-selection-icon').classList.add('user-selection-show');
                var newChip = createDynamicChips(clickedUser, index);
                chipSetEl.appendChild(newChip);
                chipInit.addChip(newChip);
                newChip.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "end"
                });
                chipSetEl.classList.remove('hidden');
            }
        });

        document.getElementById('search-btn').addEventListener('click', function (evt) {
            document.getElementById('app-header').classList.add("hidden");

            document.getElementById('search-users-container').innerHTML = '<div class=\'search-field\'>\n            ' + searchBar() + '\n        </div>';

            var searchInit = new mdc.textField.MDCTextField(document.getElementById('search-users'));
            searchInit.focus();

            searchInit.input_.addEventListener('input', function (evt) {
                if (!evt.target.value) {
                    searchInit.trailingIcon_.root_.classList.add('hidden');
                } else {
                    searchInit.trailingIcon_.root_.classList.remove('hidden');
                }
                ul.listElements.forEach(function (el) {
                    el.classList.remove('found');
                });

                var searchable = getSearchBound(evt);

                searchable.bound.onsuccess = function (searchEvent) {
                    var cursor = searchEvent.target.result;
                    if (!cursor) return;

                    if (alreadySelected[cursor.value.mobile]) {
                        cursor.continue();
                        return;
                    }
                    var el = document.querySelector('[data-number="' + cursor.value.mobile + '"]');
                    if (el) {

                        el.parentNode.parentNode.classList.add('found');
                    }

                    cursor.continue();
                };

                searchable.tx.oncomplete = function () {
                    ul.listElements.forEach(function (el) {
                        if (el.classList.contains('found')) {
                            el.classList.remove('hidden');
                        } else {
                            el.classList.add('hidden');
                        }
                    });
                };
            });

            searchInit.leadingIcon_.root_.onclick = function () {
                searchInitBack(searchInit);
            };
            searchInit.trailingIcon_.root_.onclick = function () {
                searchInitCancel(searchInit);
            };
        });
    });
}

function searchInitBack(searchInit) {
    document.getElementById('search-users').classList.add('hidden');
    document.getElementById('app-header').classList.remove("hidden");
    searchInit.value = "";
    searchInit.input_.dispatchEvent(new Event('input'));
}

function searchInitCancel(searchInit) {
    searchInit.value = "";
    searchInit.input_.dispatchEvent(new Event('input'));
}

function activityDomCustomer(activityRecord) {
    console.log(activityRecord);
    return ' <div class=\'mdc-card\'>\n    <div class=\'view-card\'>\n\n        <div id=\'attachment-container\'>\n            ' + viewAttachment(activityRecord) + '\n        </div>\n        <div id=\'venue-container\'>\n            <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list">\n                ' + viewVenue(activityRecord) + '\n            </ul>\n        </div>\n        <div id=\'schedule-container\'>\n            <ul class=\'mdc-list mdc-list--two-line\'>\n                ' + viewSchedule(activityRecord) + '\n            </ul>\n        </div>\n        <div id=\'schedule-container\'></div>\n        <div id=\'assignee-container\'>\n            <div class="assignees tasks-heading center">\n                <i class="material-icons">share</i>\n                ' + viewAssignee(activityRecord) + '\n            </div>\n        </div>\n    \n    </div>\n</div>';
}

function addAssignee(record, userArray) {
    progressBar.open();
    requestCreator('share', {
        activityId: record.activityId,
        share: userArray
    }).then(function () {
        progressBar.close();
        snacks('You Added ' + userArray.length + ' People');
        history.back();
    }).catch(function (error) {
        snacks(error.response.message);
        progressBar.close();
    });
}

function setActivityStatus(record, status) {
    progressBar.open();
    requestCreator('statusChange', {
        activityId: record.activityId,
        status: status
    }).then(function () {
        snacks(record.activityName + ' is ' + status);
        progressBar.close();
    }).catch(function (error) {
        snacks(error.response.message);
        progressBar.close();
    });
}

function viewFormActions() {
    return '\n    <div class="mdc-card__actions">\n    <div class="mdc-card__action-buttons">\n    <button class="mdc-button mdc-card__action mdc-card__action--button">\n    <span class="mdc-button__label">Close</span>\n    </button>\n    </div>\n    </div>\n    \n';
}

function markCancelled(record) {
    console.log(record);
}

function iconByType(type, name) {
    if (type === 'string') {
        if (name === 'Name') {
            return 'account_circle';
        }

        return 'info';
    }

    var iconObject = {
        'phoneNumber': 'phone',
        'HH:MM': 'access_time',
        'weekday': 'today'

    };
    return iconObject[type];
}

function viewFormAttachmentEl(attachmentName, activityRecord) {
    if (activityRecord.attachment[attachmentName].type === 'base64') {
        return '<ul class="mdc-image-list my-image-list">\n        <li class="mdc-image-list__item">\n          <div class="mdc-image-list__image-aspect-container">\n            <img class="mdc-image-list__image" src="' + activityRecord.attachment[attachmentName].value + '" onerror="imgErr(this)">\n          </div>\n          <div class="mdc-image-list__supporting">\n            <span class="mdc-image-list__label">' + attachmentName + '</span>\n          </div>\n        </li>\n      </ul>';
    }
    return '<h1 class="mdc-typography--subtitle1 mt-0">\n        ' + attachmentName + ' : ' + activityRecord.attachment[attachmentName].value + '\n    </h1>';
}

function viewAttachment(activityRecord) {
    return '' + Object.keys(activityRecord.attachment).map(function (attachmentName) {
        return '' + (activityRecord.attachment[attachmentName].value ? viewFormAttachmentEl(attachmentName, activityRecord) : '');
    }).join("");
}

function viewVenue(activityRecord) {
    return '' + activityRecord.venue.map(function (v, idx) {

        return '\n            ' + (v.location && v.address ? '\n            <li class="mdc-list-item">\n                 ' + (idx == 0 ? '<span class="mdc-list-item__graphic material-icons"\n                 aria-hidden="true">location_on</span>' : '<span class="mdc-list-item__graphic" aria-hidden="true"\n                    style=\'background-color:white\'></span>') + '\n                    <span class=\'mdc-list-item__text\'>\n                    <span class=\'mdc-list-item__primary-text\'>' + v.location + '</span>\n                    <span class=\'mdc-list-item__secondary-text\'>' + v.address + '</span>\n                    </span>\n                     <a class="mdc-list-item__meta material-icons venue-map-intent mdc-theme--primary" aria-hidden="true" href=\'geo:' + v.geopoint._latitude + ',' + v.geopoint._longitude + '\'>map</a>\n              </li>' : '');
    }).join("");
}

function viewSchedule(activityRecord) {
    return '' + activityRecord.schedule.map(function (sc, idx) {
        return '\n            <li class="mdc-list-item">\n            ' + (idx == 0 ? '<span class="mdc-list-item__graphic material-icons"\n            aria-hidden="true">today</span>' : '<span class="mdc-list-item__graphic" aria-hidden="true"\n            style=\'background-color:white\'></span>') + '\n            <span class="mdc-list-item__text">\n              <span class="mdc-list-item__primary-text">' + sc.name + '</span>\n              <span class="mdc-list-item__secondary-text">' + formatCreatedTime(sc.startTime) + ' - ' + formatCreatedTime(sc.endTime) + '</span>\n            </span>\n          </li>';
    }).join("");
}

function viewAssignee(activityRecord) {
    return '\n    <div class="mdc-chip-set" id=\'share\'>\n     ' + activityRecord.assignees.map(function (user, idx) {
        return '<div class="mdc-chip" id=\'' + idx + '-preselected\'>\n                    <img class=\'mdc-chip__icon mdc-chip__icon--leading\' src=' + (user.photoURL || '../img/empty-user.jpg') + ' onerror="imgErr(this)">\n                    <div class=\'mdc-chip__text\'>' + (user.displayName || user.phoneNumber) + '</div>\n                </div>';
    }).join("") + '\n    </div>';
}

function createStatusChange(status) {

    var selectStrings = '';
    if (status === 'CANCELLED') {
        selectStrings = '<li class="mdc-list-item" data-value="PENDING">\n       PENDING\n      </li>\n      <li class="mdc-list-item" data-value="CONFIRMED">\n        CONFIRMED\n    </li>\n      ';
    }
    if (status === 'PENDING') {
        selectStrings = '<li class="mdc-list-item mdc-list-item--selected" data-value="PENDING" aria-selected="true">\n        PENDING\n       </li>\n       <li class="mdc-list-item" data-value="CONFIRMED">\n         CONFIRMED\n     </li>\n       ';
    }
    if (status === 'CONFIRMED') {
        selectStrings = '<li class="mdc-list-item mdc-list-item--selected" data-value="CONFIRMED" aria-selected="true">\n        CONFIRMED\n       </li>\n       <li class="mdc-list-item" data-value="PENDING">\n         PENDING\n     </li>\n       ';
    }

    return '<div class="mdc-select status-select" id=\'status-enhanced-select\'>\n    <input type="hidden" name="enhanced-select">\n    <i class="mdc-select__dropdown-icon"></i>\n    <div class="mdc-select__selected-text"></div>\n    <div class="mdc-select__menu mdc-menu mdc-menu-surface status-select">\n      <ul class="mdc-list">\n        ' + selectStrings + '\n      </ul>\n    </div>\n    <span class="mdc-floating-label">Change Status</span>\n    <div class="mdc-line-ripple"></div>\n  </div>';
}

function dynamicAppendChats(addendums) {
    var parent = document.getElementById('content');
    var myNumber = firebase.auth().currentUser.phoneNumber;
    addendums.forEach(function (addendum) {
        var position = '';
        var image = '';

        position = 'them';
        image = history.state[1].photoURL;
        if (!parent) return;
        if (addendum.isComment && addendum.user === myNumber) return;
        if (addendum.isComment) {
            parent.appendChild(messageBoxDom(addendum.comment, position, image, addendum.timestamp));
        } else {
            if (addendum.user === history.state[1].mobile) {
                parent.appendChild(actionBoxDom(addendum));
            } else {
                db.transaction('activity').objectStore('activity').get(addendum.activityId).onsuccess = function (evt) {
                    var activity = evt.target.result;
                    var showActionAddendum = activity.assignees.filter(function (val) {
                        return val.phoneNumber === history.state[1].mobile;
                    });
                    if (!showActionAddendum.length) return;
                    parent.appendChild(actionBoxDom(addendum));
                };
            }
        }
    });
    setBottomScroll();
}

function getUserChats(userRecord) {
    var tx = db.transaction('addendum');
    var index = tx.objectStore('addendum').index('key');
    var myNumber = firebase.auth().currentUser.phoneNumber;
    var range = IDBKeyRange.only(myNumber + userRecord.mobile);

    var myImage = firebase.auth().currentUser.photoURL || './img/empty-user.jpg';
    var parent = document.getElementById('content');
    var timeLine = '';
    var position = '';
    var image = '';
    index.openCursor(range).onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        if (cursor.value.user === myNumber) {
            position = 'me';
            image = myImage;
        } else {
            position = 'them';
            image = userRecord.photoURL || './img/empty-user.jpg';
        }
        if (cursor.value.isComment) {
            timeLine += messageBox(cursor.value.comment, position, image, cursor.value.timestamp);
        } else {
            if (cursor.value.user === myNumber || cursor.value.user === userRecord.mobile) {
                timeLine += actionBox(cursor.value);
            }
        }
        cursor.continue();
    };
    tx.oncomplete = function () {
        parent.innerHTML = timeLine;
        setBottomScroll();

        var btn = new mdc.ripple.MDCRipple(document.getElementById('comment-send'));
        var commentInit = new mdc.textField.MDCTextField(document.getElementById('comment-textarea'));
        var form = document.querySelector('.conversation-compose');
        var bottom = document.getElementById('bottom');
        btn.root_.addEventListener('click', function () {

            if (!commentInit.value.trim()) return;
            progressBar.open();
            requestCreator('dm', {
                comment: commentInit.value,
                assignee: userRecord.mobile
            }).then(function () {
                if (!parent) return;
                parent.appendChild(messageBoxDom(commentInit.value, 'me', firebase.auth().currentUser.photoURL));
                commentInit.value = '';
                resetCommentField(bottom, form, commentInit.input_);
                setBottomScroll();
                progressBar.close();
            }).catch(function (error) {
                progressBar.close();
                commentInit.value = '';
                snacks(error.response.message);
            });
        });
        commentInit.input_.addEventListener('input', function () {
            if (this.scrollHeight >= 200) return;

            this.style.paddingTop = '10px';

            this.style.lineHeight = '1';
            this.style.height = '5px';
            this.style.height = this.scrollHeight + "px";
            form.style.minHeight = '56px';
            form.style.height = 'auto';
            bottom.style.height = this.scrollHeight + 20 + 'px';
            //not
            if (!this.value.trim()) {
                resetCommentField(bottom, form, this);
            }
        });
    };
}

function resetCommentField(bottom, form, input) {
    bottom.style.height = '72px';
    form.style.height = '56px';
    input.style.height = 'auto';
}

function setBottomScroll() {
    var el = document.getElementById('inner');
    if (!el) return;
    el.scrollTo(0, el.scrollHeight);
}
function claimsView() {
    document.getElementById('app-header').classList.remove("hidden");
    document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');
    var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon material-icons\'>arrow_back</a>\n    <span class="mdc-top-app-bar__title">Reimbursements</span>\n    ';
    var header = getHeader('app-header', backIcon, '');
    document.getElementById('app-current-panel').innerHTML = emptyClaims();
}

function emptyClaims() {

    return '<div class=\'empty-claims-section\'>\n        <h3 class=\'mdc-typography--headline6\'>No open claims pending for payment</h3>\n        <button class=\'mdc-button\'>\n        <span class=\'mdc-button--label\'>Create A New Claim</span>\n        </button>\n    </div>';
}

function getCellularInformation() {

    var cellTowerQueryString = void 0;
    var mcc = AndroidInterface.getMobileCountryCode();
    var mnc = AndroidInterface.getMobileNetworkCode();
    var radioType = AndroidInterface.getRadioType();
    var carrier = AndroidInterface.getCarrier();
    var wifiQueryString = AndroidInterface.getWifiAccessPoints();
    try {
        cellTowerQueryString = AndroidInterface.getCellTowerInformation();
    } catch (e) {
        console.log(e);
    }

    var wifiAccessPointsArray = [];
    var cellTowerArray = [];
    if (wifiQueryString) {
        wifiAccessPointsArray = parseQuery(wifiQueryString);
    };
    if (cellTowerQueryString) {
        cellTowerArray = removeFalseCellIds(parseQuery(cellTowerQueryString));
    }
    var body = {};

    if (mcc) {
        body.homeMobileCountryCode = Number(mcc);
    }
    if (mnc) {
        body.homeMobileNetworkCode = Number(mnc);
    }
    if (carrier) {
        body.carrier = carrier;
    }
    if (radioType) {
        body.radioType = radioType;
    }

    if (wifiAccessPointsArray.length) {
        body.wifiAccessPoints = wifiAccessPointsArray;
    }
    if (cellTowerArray.length) {
        body.cellTowers = cellTowerArray;
    }
    if (wifiAccessPointsArray.length && cellTowerArray.length) {
        body.considerIp = false;
    } else {
        body.considerIp = true;
    }
    return body;
}

function removeFalseCellIds(cellTowers) {
    var max_value = 2147483647;
    var filtered = cellTowers.filter(function (tower) {
        return tower.cellId > 0 && tower.cellId < max_value && tower.locationAreaCode > 0 && tower.locationAreaCode < max_value;
    });

    return filtered;
}

function parseQuery(queryString) {

    var array = [];
    var splitBySeperator = queryString.split(",");
    splitBySeperator.forEach(function (value) {
        var url = new URLSearchParams(value);
        array.push(queryPatramsToObject(url));
    });
    return array;
}

function queryPatramsToObject(url) {
    var result = {};
    url.forEach(function (value, key) {
        if (key === 'macAddress') {
            result[key] = value;
        } else {
            result[key] = Number(value);
        }
    });

    return result;
}

function createElement(tagName, attrs) {
    var el = document.createElement(tagName);
    if (attrs) {

        Object.keys(attrs).forEach(function (attr) {
            el[attr] = attrs[attr];
        });
    }
    return el;
}

function Dialog(title, content, id) {
    this.title = title;
    this.content = content;
    this.id = id;
}

Dialog.prototype.create = function (type) {
    var parent = createElement('div', {
        className: 'mdc-dialog',
        role: 'alertDialog',
        id: this.id
    });
    parent.setAttribute('aria-modal', 'true');
    parent.setAttribute('aria-labelledby', 'Title');
    parent.setAttribute('aria-describedby', 'content');
    var container = createElement('div', {
        className: 'mdc-dialog__container'
    });
    var surface = createElement('div', {
        className: 'mdc-dialog__surface'
    });
    var h2 = createElement('h2', {
        className: 'mdc-dialog__title'
    });
    h2.innerHTML = this.title;
    var footer = createElement('footer', {
        className: 'mdc-dialog__actions'
    });
    var contentContainer = createElement('div', {
        className: 'mdc-dialog__content'
    });

    if (this.content instanceof HTMLElement) {
        contentContainer.appendChild(this.content);
    } else {
        contentContainer.innerHTML = this.content;
    }

    surface.appendChild(h2);
    surface.appendChild(contentContainer);
    if (type !== 'simple') {

        var cancelButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Close'
        });
        cancelButton.setAttribute('data-mdc-dialog-action', 'close');

        var okButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Okay'
        });

        okButton.setAttribute('data-mdc-dialog-action', 'accept');
        footer.appendChild(cancelButton);
        footer.appendChild(okButton);

        surface.appendChild(footer);
    }

    container.appendChild(surface);
    parent.appendChild(container);
    parent.appendChild(createElement('div', {
        className: 'mdc-dialog__scrim'
    }));
    var dialogParent = document.getElementById('dialog-container');
    dialogParent.innerHTML = '';
    dialogParent.appendChild(parent);
    return new mdc.dialog.MDCDialog(parent);
};

function getHeader(parentSelector, sectionStart, sectionEnd) {
    var el = document.getElementById(parentSelector);
    el.querySelector('#section-start').innerHTML = sectionStart;
    el.querySelector('#section-end').innerHTML = sectionEnd;
    el.querySelector('#tabs').innerHTML = '';
    topAppBar = new mdc.topAppBar.MDCTopAppBar(el);
    // topAppBar.foundation_.adapter_.deregisterNavigationIconInteractionHandler('MDCTopAppBar:nav',handleNav);
    return topAppBar;
}

function createSimpleRadio(id, label) {
    return '<div class=\'mdc-radio\'>\n    <input class="mdc-radio__native-control" type="radio" name="demo-radio-set" id=' + id + '>\n    <div class="mdc-radio__background">\n    <div class="mdc-radio__outer-circle">\n    </div>\n    <div class="mdc-radio__inner-circle">\n    </div>\n    </div>\n    </div>\n    <label for=' + id + '>' + label + '</label>\n    ';
}

function createSimpleToggle(id) {
    return '<div class="mdc-switch mdc-list-item__meta" id=' + id + '>\n    <div class="mdc-switch__track"></div>\n    <div class="mdc-switch__thumb-underlay">\n      <div class="mdc-switch__thumb">\n          <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch">\n      </div>\n    </div>\n  </div>';
}

function createSimpleMenu(items, id) {
    return '\n    <div class="mdc-menu mdc-menu-surface" id="' + id + '">\n    <ul class="mdc-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">\n    ' + items.map(function (item) {
        return ' <li class="mdc-list-item" role="menuitem">\n        <span class="mdc-list-item__graphic mdc-menu__selection-group-icon">\n        <i class=\'material-icons\'>' + item.icon + '</i>\n        </span>\n        <span class="mdc-list-item__text">' + item.name + '</span>\n        </li>';
    }).join("") + '\n    </ul>\n    </div>\n  ';
}
function AppKeys() {
    this.mode = 'dev';
};
AppKeys.prototype.getMode = function () {
    return this.mode;
};
AppKeys.prototype.getMapKey = function () {
    if (this.mode === 'production') {
        return "AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo";
    }
    return "AIzaSyCadBqkHUJwdcgKT11rp_XWkbQLFAy80JQ";
};
AppKeys.prototype.getKeys = function () {
    if (this.mode === 'production') {
        return {
            apiKey: this.getMapKey(),
            authDomain: 'growthfile-207204.firebaseapp.com',
            databaseURL: 'https://growthfile-207204.firebaseio.com',
            projectId: 'growthfile-207204',
            storageBucket: 'growthfile-207204.appspot.com',
            messagingSenderId: '701025551237'
        };
    }
    return {
        apiKey: this.getMapKey(),
        authDomain: "growthfilev2-0.firebaseapp.com",
        projectId: "growthfilev2-0",
        messagingSenderId: "1011478688238"
    };
};

AppKeys.prototype.getBaseUrl = function () {
    return this.mode === 'production' ? 'https://api2.growthfile.com/api/' : 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/';
};
function getSuggestions() {
  if (ApplicationState.knownLocation) {
    getKnownLocationSubs().then(homeView);
    return;
  }
  if (!ApplicationState.office) return getAllSubscriptions().then(homeView);
  return getSubsWithVenue().then(homeView);
}

function getKnownLocationSubs() {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(['subscriptions']);
    var store = tx.objectStore('subscriptions');
    var result = [];
    var venue = ApplicationState.venue;
    store.openCursor(null, 'prev').onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.office !== venue.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }

      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === venue.template) {
          result.push(cursor.value);
        }
      });
      cursor.continue();
    };
    tx.oncomplete = function () {
      resolve(result);
    };
  });
}

function getPendingLocationActivities() {
  return new Promise(function (resolve, reject) {

    var tx = db.transaction('activity');
    var result = [];
    var index = tx.objectStore('activity').index('status');
    index.openCursor('PENDING').onsuccess = function (evt) {
      var cursor = evt.target.result;
      if (!cursor) return;
      if (cursor.value.office !== ApplicationState.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.hidden) {
        cursor.continue();
        return;
      }

      var match = void 0;
      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === ApplicationState.venue.template && cursor.value.attachment[attachmentName].value === ApplicationState.venue.location) {
          console.log(cursor.value);
          match = cursor.value;
        }
      });
      if (!match) {
        cursor.continue();
        return;
      }
      var found = false;
      match.schedule.forEach(function (sn) {
        if (!sn.startTime && !sn.endTime) return;
        if (moment(moment().format('DD-MM-YY')).isBetween(moment(sn.startTime).format('DD-MM-YY'), moment(sn.endTime).format('DD-MM-YY'), null, '[]')) {
          sn.isValid = true;
          found = true;
        }
      });

      if (found) {
        result.push(match);
      }
      cursor.continue();
    };
    tx.oncomplete = function () {
      return resolve(result);
    };
  });
}

function getSubsWithVenue() {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(['subscriptions']);
    var store = tx.objectStore('subscriptions');
    var office = ApplicationState.office;
    var result = [];
    store.openCursor(null, 'prev').onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.template === 'check-in') {
        cursor.continue();
        return;
      }
      if (cursor.value.office !== office) {
        cursor.continue();
        return;
      }

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }

      if (!cursor.value.venue.length) {
        cursor.continue();
        return;
      }
      result.push(cursor.value);
      cursor.continue();
    };
    tx.oncomplete = function () {
      resolve(result);
    };
  });
}

function handleNav(evt) {
  // const state = history.state[0]
  // if(state === 'homeView') return getSuggestions();
  return history.back();
}

function homePanel() {
  return ' <div class="container home-container">\n  ' + topNavCard() + '\n  <div class=\'work-tasks\'>\n      <h3 class="mdc-list-group__subheader mdc-typography--headline6">What do you want to do ?</h3>\n      <h3 class="mdc-list-group__subheader">Suggestions</h3>\n      <div id=\'pending-location-tasks\'></div>\n      <div id=\'suggestions-container\'></div>\n      <div id=\'action-button\' class=\'attendence-claims-btn-container mdc-layout-grid__inner\'>\n      </div>\n\n      <button class="mdc-fab mdc-fab--extended  mdc-theme--primary-bg app-fab--absolute" id=\'reports\'>\n      <span class="material-icons mdc-fab__icon">description</span>\n      <span class="mdc-fab__label">My Reports</span>\n     </button>\n  </div>\n</div>';
}

function topNavCard() {

  return '\n    <div class="profile-container mdc-card">\n    <div class="mdc-card__primary-action">\n      <div class="simple">\n  \n        <img src="' + firebase.auth().currentUser.photoURL + '" class="image" id=\'profile-image-card\' onerror="imgErr(this)">\n        <h3 class="mdc-typography--headline6">My Growthfile</h3>\n      </div>\n      <div class="actions">\n        <div class="action">\n          <span class="mdc-typography--body1" id=\'camera\'><i class="material-icons">camera</i>Camera</span>\n        </div>\n       \n        <div class="action">\n          <span class="mdc-typography--body1" id=\'chat\'><i class="material-icons">comment</i>Chats</span>\n        </div>\n      </div>\n  \n    </div>\n    <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed" id=\'suggestion-progress\'>\n    <div class="mdc-linear-progress__buffering-dots"></div>\n    <div class="mdc-linear-progress__buffer"></div>\n    <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">\n      <span class="mdc-linear-progress__bar-inner"></span>\n    </div>\n    <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">\n      <span class="mdc-linear-progress__bar-inner"></span>\n    </div>\n  </div>\n  </div>\n  \n  ';
}

function homeView(suggestedTemplates) {
  progressBar.close();
  var header = getHeader('app-header', '', '');
  header.listen('MDCTopAppBar:nav', handleNav);
  document.getElementById('app-header').classList.add('hidden');
  history.pushState(['homeView'], null, null);
  var panel = document.getElementById('app-current-panel');
  document.getElementById('growthfile').classList.remove('mdc-top-app-bar--fixed-adjust');

  panel.innerHTML = homePanel();
  var progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('suggestion-progress'));
  if (document.getElementById('camera')) {

    document.getElementById('camera').addEventListener('click', function () {
      history.pushState(['snapView'], null, null);
      snapView();
    });
  }
  document.getElementById('chat').addEventListener('click', function () {
    history.pushState(['chatView'], null, null);
    chatView();
  });
  document.getElementById('profile-image-card').addEventListener('click', function () {
    history.pushState(['profileView'], null, null);
    profileView();
  });

  document.getElementById('reports').addEventListener('click', function () {
    history.pushState(['reportView'], null, null);
    reportView();
  });

  if (ApplicationState.knownLocation) {
    getPendingLocationActivities().then(function (activities) {
      if (!document.getElementById('pending-location-tasks')) return;

      document.getElementById('pending-location-tasks').innerHTML = pendinglist(activities);
      var ul = new mdc.list.MDCList(document.getElementById('confirm-tasks'));
      ul.singleSelection = true;
      console.log(ul);
      ul.listen('MDCList:action', function (evt) {
        console.log(activities[evt.detail.index]);
        var activityClicked = activities[evt.detail.index];
        progCard.open();

        requestCreator('statusChange', {
          activityId: activityClicked.activityId,
          status: 'CONFIRMED'
        }).then(function () {
          progCard.close();
          ul.listElements[evt.detail.index].classList.add('slide-right');
          setTimeout(function () {
            ul.listElements[evt.detail.index].classList.add('hidden');
          }, 500);
        }).catch(function (error) {
          progCard.close();
          snacks(error.response.message);
          ul.foundation_.adapter_.setCheckedCheckboxOrRadioAtIndex(evt.detail.index, false);
        });
      });
    });
  }
  document.getElementById('suggestions-container').innerHTML = templateList(suggestedTemplates);
  var suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'));
  suggestedInit.singleSelection = true;
  suggestedInit.selectedIndex = 0;
  suggestedInit.listen('MDCList:action', function (evt) {
    console.log(suggestedInit.listElements[evt.detail.index].dataset);
    history.pushState(['addView'], null, null);
    addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value));
  });
  Promise.all([getSubscription(ApplicationState.office, 'attendance regularization', 'CONFIRMED'), getSubscription(ApplicationState.office, 'leave', 'CONFIRMED'), getSubscription(ApplicationState.office, 'expense claim', 'CONFIRMED')]).then(function (result) {}).catch(console.log);
}

function pendinglist(activities) {
  return '\n  <ul class="mdc-list subscription-list" role="group" aria-label="List with checkbox items" id=\'confirm-tasks\'>\n    ' + activities.map(function (activity, idx) {
    return '\n      <li class="mdc-list-item" role="checkbox" aria-checked="false">\n      Confirm ' + activity.activityName + ' ?    \n      <div class=\'mdc-checkbox mdc-list-item__meta\'>\n        <input type="checkbox"\n                class="mdc-checkbox__native-control"\n                id="demo-list-checkbox-item-' + idx + '" />\n        <div class="mdc-checkbox__background">\n          <svg class="mdc-checkbox__checkmark"\n                viewBox="0 0 24 24">\n            <path class="mdc-checkbox__checkmark-path"\n                  fill="none"\n                  d="M1.73,12.91 8.1,19.28 22.79,4.59"/>\n          </svg>\n          <div class="mdc-checkbox__mixedmark"></div>\n        </div>\n      </div>   \n    </li>';
  }).join() + '\n  </ul>\n  ';
}

function templateList(suggestedTemplates) {
  return '<ul class="mdc-list subscription-list" id=\'suggested-list\'>\n  ' + suggestedTemplates.map(function (sub) {
    return '<li class=\'mdc-list-item\' data-value=\'' + JSON.stringify(sub) + '\'>\n      New ' + sub.template + '  ?\n    <span class=\'mdc-list-item__meta material-icons mdc-theme--primary\'>\n      keyboard_arrow_right\n    </span>\n  </li>';
  }).join("") + '\n</ul>';
}
var appKey = new AppKeys();
var progressBar = void 0;
var snackBar = void 0;
var ui = void 0;
var send = void 0;
var change = void 0;
var next = void 0;
var emailInit = void 0;
var db;
var isCheckInCreated = void 0;
var drawer = void 0;
var navList = void 0;

function imgErr(source) {
  source.onerror = '';
  source.src = './img/empty-user.jpg';
  return true;
}

var native = function () {
  return {
    setFCMToken: function setFCMToken(token) {
      localStorage.setItem('token', token);
    },
    getFCMToken: function getFCMToken() {
      return localStorage.getItem('token');
    },
    setName: function setName(device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function getName() {
      return localStorage.getItem('deviceType');
    },

    setIosInfo: function setIosInfo(iosDeviceInfo) {
      var queryString = new URLSearchParams(iosDeviceInfo);
      var deviceInfo = {};
      queryString.forEach(function (val, key) {
        if (key === 'appVersion') {
          deviceInfo[key] = Number(val);
        } else {
          deviceInfo[key] = val;
        }
      });
      localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
    },
    getIosInfo: function getIosInfo() {
      return localStorage.getItem('deviceInfo');
    },
    getInfo: function getInfo() {
      if (!this.getName()) return false;

      if (this.getName() === 'Android') {
        deviceInfo = getAndroidDeviceInformation();
        localStorage.setItem('deviceInfo', deviceInfo);
        return deviceInfo;
      }
      return this.getIosInfo();
    }
  };
}();

function getAndroidDeviceInformation() {
  return JSON.stringify({
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion())
  });
}

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'mapView' || event.state[0] === 'snapView') return;
  if (event.state[0] === 'homeView') {
    getSuggestions();
    return;
  }

  window[event.state[0]](event.state[1]);
};

window.addEventListener("load", function () {
  firebase.initializeApp(appKey.getKeys());
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('.mdc-linear-progress'));
  drawer = new mdc.drawer.MDCDrawer(document.querySelector('.mdc-drawer'));
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));

  // drawer.listen('MDCDrawer:opened', function (evt) {
  //   document.querySelector(".mdc-drawer__header .mdc-drawer__title").textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber;
  //   document.querySelector(".mdc-drawer__header img").src = firebase.auth().currentUser.photoURL || '../src/img/empty-user.jpg'
  //   document.querySelector(".mdc-drawer__header img").onclick = function () {
  //     profileView();

  //   }
  // })


  moment.updateLocale('en', {
    calendar: {
      lastDay: '[yesterday]',
      sameDay: 'hh:mm',
      nextDay: '[Tomorrow at] LT',
      lastWeek: 'dddd',
      nextWeek: 'dddd [at] LT',
      sameElse: 'L'
    },
    longDateFormat: {
      LT: "h:mm A",
      LTS: "h:mm:ss A",
      L: "DD/MM/YY"
    },
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  });

  if (!window.Worker && !window.indexedDB) {
    var incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile is incompatible with this device').create();
    incompatibleDialog.open();
    return;
  }
  startApp(true);
});

function firebaseUiConfig(value, redirect) {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function signInSuccessWithAuthResult(authResult) {
        return false;
      },
      signInFailure: function signInFailure(error) {
        return handleUIError(error);
      },
      uiShown: function uiShown() {}
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'invisible', // 'invisible' or 'compact'
        badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
      },
      defaultCountry: 'IN',
      defaultNationalNumber: value ? firebase.auth().currentUser.phoneNumber : ''
    }]

  };
}

function userSignedOut() {
  ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start(document.getElementById('login-container'), firebaseUiConfig());
}

function startApp() {

  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      // document.getElementById('start-loader').classList.add('hidden')
      document.getElementById("main-layout-app").style.display = 'none';
      userSignedOut();
      return;
    }

    if (appKey.getMode() === 'production') {
      if (!native.getInfo()) {
        redirect();
        return;
      }
    }
    localStorage.setItem('error', JSON.stringify({}));

    var req = window.indexedDB.open(auth.uid, 15);

    req.onupgradeneeded = function (evt) {
      db = req.result;
      db.onerror = function () {
        handleError({
          message: db.error.message + ' from startApp on upgradeneeded'
        });
        return;
      };

      if (!evt.oldVersion) {
        createObjectStores(db, auth.uid);
      } else {
        if (evt.oldVersion < 4) {
          var subscriptionStore = req.transaction.objectStore('subscriptions');
          subscriptionStore.createIndex('status', 'status');
        }
        if (evt.oldVersion < 5) {
          var tx = req.transaction;

          var mapStore = tx.objectStore('map');
          mapStore.createIndex('bounds', ['latitude', 'longitude']);
        }
        if (evt.oldVersion < 6) {
          var tx = req.transaction;
          var childrenStore = tx.objectStore('children');
          childrenStore.createIndex('officeTemplate', ['office', 'template']);

          childrenStore.createIndex('employees', 'employee');
          childrenStore.createIndex('employeeOffice', ['employee', 'office']);
          childrenStore.createIndex('team', 'team');
          childrenStore.createIndex('teamOffice', ['team', 'office']);
          var myNumber = firebase.auth().currentUser.phoneNumber;

          childrenStore.index('template').openCursor('employee').onsuccess = function (event) {
            var cursor = event.target.result;
            if (!cursor) {
              console.log("finished modiying children");
              return;
            }
            cursor.value.employee = cursor.value.attachment['Employee Contact'].value;
            if (cursor.value.attachment['First Supervisor'].value === myNumber || cursor.value.attachment['Second Supervisor'].value === myNumber) {
              cursor.value.team = 1;
            }
            cursor.update(cursor.value);
            cursor.continue();
          };

          tx.oncomplete = function () {

            console.log("finsihed backlog");
          };
        }
        if (evt.oldVersion < 7) {
          var tx = req.transaction;
          var _mapStore = tx.objectStore('map');
          _mapStore.createIndex('office', 'office');
          _mapStore.createIndex('status', 'status');
          _mapStore.createIndex('selection', ['office', 'status', 'location']);
        }
        if (evt.oldVersion < 8) {
          var tx = req.transaction;
          var listStore = tx.objectStore('list');
          var calendar = tx.objectStore('calendar');

          listStore.createIndex('office', 'office');
          calendar.createIndex('office', 'office');
        }
        if (evt.oldVersion < 9) {
          var tx = req.transaction;
          var userStore = tx.objectStore('users');
          userStore.createIndex('mobile', 'mobile');

          var addendumStore = tx.objectStore('addendum');
          addendumStore.createIndex('user', 'user');
          addendumStore.createIndex('timestamp', 'timestamp');
        }
        if (evt.oldVersion <= 10) {
          var tx = req.transaction;
          var _subscriptionStore = tx.objectStore('subscriptions');
          _subscriptionStore.createIndex('count', 'count');
        }
        if (evt.oldVersion <= 11) {
          var tx = req.transaction;
          var _userStore = tx.objectStore('users');
          _userStore.createIndex('timestamp', 'timestamp');
        }
        if (evt.oldVersion <= 12) {
          var tx = req.transaction;
          var activityStore = tx.objectStore('activity');
          activityStore.createIndex('status', 'status');
        }
        if (evt.oldVersion <= 13) {
          var tx = req.transaction;
          var subscriptions = tx.objectStore('subscriptions');
          subscriptions.createIndex('validSubscription', ['office', 'template', 'status']);
          var addendum = tx.objectStore('addendum');
          addendum.createIndex('key', 'key');
          addendum.createIndex('KeyTimestamp', ['timestamp', 'key']);
        }

        if (evt.oldVersion <= 14) {
          var tx = req.transaction;
          var users = tx.objectStore('users');
          users.createIndex('NAME_SEARCH', 'NAME_SEARCH');

          users.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (!cursor) return;
            if (!cursor.value.timestamp) {
              cursor.value.timestamp = '';
            }
            cursor.value.NAME_SEARCH = cursor.value.displayName.toLowerCase();
            var update = cursor.update(cursor.value);
            update.onsuccess = function () {
              console.log("updated user ", cursor.value);
            };

            cursor.continue();
          };
        }
      };
    };
    req.onsuccess = function () {
      db = req.result;

      if (!areObjectStoreValid(db.objectStoreNames)) {
        db.close();
        console.log(auth);
        var deleteIDB = indexedDB.deleteDatabase(auth.uid);
        deleteIDB.onsuccess = function () {
          window.location.reload();
        };
        deleteIDB.onblocked = function () {
          snacks('Please Re-Install The App');
        };
        deleteIDB.onerror = function () {
          snacks('Please Re-Install The App');
        };
        return;
      }
      var startLoad = document.querySelector('#start-load');
      startLoad.classList.remove('hidden');
      console.log("run app");
      document.getElementById("main-layout-app").style.display = 'block';

      // ga('set', 'userId', '12345')

      var texts = ['Loading Growthfile', 'Getting Your Data', 'Creating Profile', 'Please Wait'];

      var index = 0;
      var interval = setInterval(function () {
        if (index == texts.length - 1) {
          clearInterval(interval);
        }
        startLoad.querySelector('p').textContent = texts[index];
        index++;
      }, index + 1 * 1000);
      // profileView();
      // return;
      requestCreator('now', {
        device: native.getInfo(),
        from: '',
        registerToken: native.getFCMToken()
      }).then(function (response) {
        if (response.updateClient) {
          updateApp();
          return;
        }
        if (response.revokeSession) {
          revokeSession();
          return;
        };
        getRootRecord().then(function (rootRecord) {
          if (!rootRecord.fromTime) {
            requestCreator('Null').then(profileCheck).catch(function (error) {
              snacks(error.response.message, 'Okay');
            });
            return;
          }
          profileCheck();
          requestCreator('Null').then(console.log).catch(function (error) {
            snacks(error.response.message, 'Okay', function () {
              startApp(true);
            });
          });
        });
      }).catch(function (error) {
        console.log(error);
        snacks(error.response.message, 'Retry');
      });
    };
    req.onerror = function () {
      handleError({
        message: req.error.message + ' from startApp'
      });
    };
  });
}

function miniProfileCard(content, headerTitle, action) {

  return '<div class=\'mdc-card profile-update-init\'>\n  <header class=\'mdc-top-app-bar mdc-top-app-bar--fixed\' id=\'card-header\'>\n    <div class=\'mdc-top-app-bar__row\'>\n      <section class=\'mdc-top-app-bar__section mdc-top-app-bar__section--align-start\' id=\'card-header-start\'>\n        ' + headerTitle + '\n      </section>\n    </div>\n    <div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed" id=\'card-progress\'>\n      <div class="mdc-linear-progress__buffering-dots"></div>\n      <div class="mdc-linear-progress__buffer"></div>\n      <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">\n        <span class="mdc-linear-progress__bar-inner"></span>\n      </div>\n      <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">\n        <span class="mdc-linear-progress__bar-inner"></span>\n      </div>\n    </div>\n  </header>\n  <div class=\'content-area mdc-top-app-bar--fixed-adjust\'>\n  <div id=\'primary-content\'>\n  \n  ' + content + '\n  </div>\n  </div>\n  ' + action + '\n</div>';
}

function checkForPhoto() {
  var auth = firebase.auth().currentUser;
  if (!auth.photoURL) {
    var content = '\n\n      <div class=\'photo-container\'>\n      <img src="./img/empty-user.jpg" id="image-update">\n      <button class="mdc-fab mdc-theme--primary-bg" aria-label="Favorite">\n        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">camera</span>\n        <input type=\'file\' accept=\'image/jpeg;capture=camera\' id=\'choose\'>\n      </button>\n\n      </div>\n      <div class="view-container">\n      <div class="mdc-text-field mdc-text-field--with-leading-icon mb-10 mt-20">\n    <i class="material-icons mdc-text-field__icon mdc-theme--primary">account_circle</i>\n    <input class="mdc-text-field__input" value="' + auth.displayName + '" disabled>\n    <div class="mdc-line-ripple"></div>\n    <label class="mdc-floating-label mdc-floating-label--float-above">Name</label>\n  </div>\n\n  <div class="mdc-text-field mdc-text-field--with-leading-icon mt-0">\n    <i class="material-icons mdc-text-field__icon mdc-theme--primary">phone</i>\n    <input class="mdc-text-field__input" value="' + auth.phoneNumber + '" disabled>\n    <div class="mdc-line-ripple"></div>\n    <label class="mdc-floating-label mdc-floating-label--float-above">Phone</label>\n  </div>\n      </div>\n      </div>\n      ';
    document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, ' <span class="mdc-top-app-bar__title">Add Your Profile Picture</span>', '');
    var progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'));

    document.getElementById('choose').addEventListener('change', function (evt) {

      var files = document.getElementById('choose').files;
      if (!files.length) return;
      var file = files[0];
      var fileReader = new FileReader();
      fileReader.onload = function (fileLoadEvt) {
        var srcData = fileLoadEvt.target.result;
        var image = new Image();
        image.src = srcData;
        image.onload = function () {
          var newDataUrl = resizeAndCompressImage(image);
          document.getElementById('image-update').src = newDataUrl;
          progCard.open();
          requestCreator('backblaze', {
            'imageBase64': newDataUrl
          }).then(function () {
            progCard.close();
            checkForRecipient();
          }).catch(function (error) {
            progCard.close();
            snacks(error.response.message);
          });
        };
      };
      fileReader.readAsDataURL(file);
    });
    return;
  }
  checkForRecipient();
}

function resizeAndCompressImage(image) {
  var canvas = document.createElement('canvas');
  var canvasDimension = new CanvasDimension(image.width, image.height);
  canvasDimension.setMaxHeight(screen.height);
  canvasDimension.setMaxWidth(screen.width);
  var newDimension = canvasDimension.getNewDimension();
  canvas.width = newDimension.width;
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  var newDataUrl = canvas.toDataURL('image/jpeg', 0.5);
  return newDataUrl;
}

function CanvasDimension(width, height) {
  this.MAX_HEIGHT = '';
  this.MAX_WIDTH = '';
  this.width = width;
  this.height = height;
}
CanvasDimension.prototype.setMaxWidth = function (MAX_WIDTH) {
  this.MAX_WIDTH = MAX_WIDTH;
};
CanvasDimension.prototype.setMaxHeight = function (MAX_HEIGHT) {
  this.MAX_HEIGHT = MAX_HEIGHT;
};
CanvasDimension.prototype.getNewDimension = function () {
  if (this.width > this.height) {
    if (this.width > this.MAX_WIDTH) {
      this.height *= this.MAX_WIDTH / this.width;
      this.width = this.MAX_WIDTH;
    }
  } else {
    if (this.height > this.MAX_HEIGHT) {
      this.width *= this.MAX_HEIGHT / this.height;
      this.height = this.MAX_HEIGHT;
    }
  }

  return {
    width: this.width,
    height: this.height
  };
};

function checkForRecipient() {
  var auth = firebase.auth().currentUser;
  getEmployeeDetails(IDBKeyRange.bound(['recipient', 'CONFIRMED'], ['recipient', 'PENDING']), 'templateStatus').then(function (result) {
    if (!result.length) return mapView();
    return mapView();
    if (auth.email && auth.emailVerified) return mapView();

    var text = getReportNameString(result);
    if (!auth.email) {
      var content = '<h3 class=\'mdc-typography--headline6 mt-0\'>' + text + '</h3>\n    <div class="mdc-text-field mdc-text-field--outlined" id=\'email\'>\n       <input class="mdc-text-field__input" required>\n      <div class="mdc-notched-outline">\n          <div class="mdc-notched-outline__leading"></div>\n          <div class="mdc-notched-outline__notch">\n                <label class="mdc-floating-label">Email</label>\n          </div>\n          <div class="mdc-notched-outline__trailing"></div>\n      </div>\n    </div>';

      var button = '<div class="mdc-card__actions">\n    <div class="mdc-card__action-icons"></div>\n    <div class="mdc-card__action-buttons">\n    <button class="mdc-button" id=\'addEmail\'>\n      <span class="mdc-button__label">UPDATE</span>\n      <i class="material-icons mdc-button__icon" aria-hidden="true">arrow_forward</i>\n    </button>\n </div>\n </div>';

      document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, '<span class="mdc-top-app-bar__title">Add You Email Address</span>', button);
      var _emailInit = new mdc.textField.MDCTextField(document.getElementById('email'));
      var progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'));

      new mdc.ripple.MDCRipple(document.getElementById('addEmail')).root_.addEventListener('click', function (evt) {
        if (!_emailInit.value) {
          _emailInit.focus();
          return;
        }
        progCard.open();
        requestCreator('updateAuth', {
          email: _emailInit.value,
          phoneNumber: firebase.auth().currentUser.phoneNumber
        }).then(function () {
          snacks('Verification Link has been Sent to ' + _emailInit.value);
          mapView();
          progCard.close();
        }).catch(console.log);
      });
      return;
    }

    if (!auth.emailVerified) {
      var currentEmail = firebase.auth().currentUser.email;
      var _content = '<h3 class=\'mdc-typography--headline6 mt-0\'>' + text + '</h3>\n      <h3 class=\'mdc-typography--body1\'>Click To Send a verification Email</h3>\n      <button class="mdc-button mdc-theme--primary-bg mdc-theme--on-primary" id=\'sendVerification\'>\n      <span class="mdc-button__label">RESEND VERIFICATION MAIL</span>\n      </button>';
      document.getElementById('app-current-panel').innerHTML = miniProfileCard(_content, '<span class="mdc-top-app-bar__title">VERIFY YOUR EMAIL ADDRESS</span>', '');
      var _progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'));

      new mdc.ripple.MDCRipple(document.getElementById('sendVerification')).root_.addEventListener('click', function (evt) {
        _progCard.open();
        requestCreator('updateAuth', {
          email: currentEmail,
          phoneNumber: firebase.auth().currentUser.phoneNumber
        }).then(function () {
          _progCard.close();
          snacks('Verification Link has been Sent to ' + currentEmail);
          mapView();
        }).catch(console.log);
      });

      return;
    };
  });
}

function getReportNameString(result) {
  var string = '';
  var base = 'You are a recipient in ';
  var offices = {};
  result.forEach(function (report) {
    if (!offices[report.office]) {
      offices[report.office] = [report.attachment.Name.value];
    } else {
      offices[report.office].push(report.attachment.Name.value);
    }
  });

  var keys = Object.keys(offices);
  keys.forEach(function (office, idx) {
    var reportNames = offices[office].join(',');
    console.log(idx);

    base += ' ' + reportNames + ' For ' + office + ' &';
  });
  var lastChar = base[base.length - 1];
  if (lastChar === '&') {
    return base.substring(0, base.length - 1);
  }
  return base;
}

function simpleInputField() {}

function profileCheck() {
  history.state = null;
  document.getElementById('start-load').classList.add('hidden');
  var auth = firebase.auth().currentUser;
  if (!auth.displayName) {
    var content = '\n    <div class="mdc-text-field mdc-text-field--outlined" id=\'name\'>\n    <input class="mdc-text-field__input" required>\n    <div class="mdc-notched-outline">\n      <div class="mdc-notched-outline__leading"></div>\n      <div class="mdc-notched-outline__notch">\n        <label class="mdc-floating-label">Name</label>\n      </div>\n      <div class="mdc-notched-outline__trailing"></div>\n    </div>\n  </div>\n  ';
    var action = '<div class="mdc-card__actions"><div class="mdc-card__action-icons"></div><div class="mdc-card__action-buttons"><button class="mdc-button" id=\'updateName\'>\n  <span class="mdc-button__label">NEXT</span>\n  <i class="material-icons mdc-button__icon" aria-hidden="true">arrow_forward</i>\n  </button></div></div>';

    document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, '<span class="mdc-top-app-bar__title">Enter Your Name</span>', action);
    var progCard = new mdc.linearProgress.MDCLinearProgress(document.getElementById('card-progress'));
    var nameInput = new mdc.textField.MDCTextField(document.getElementById('name'));
    console.log(nameInput);
    history.pushState(['profileCheck'], null, null);
    new mdc.ripple.MDCRipple(document.getElementById('updateName')).root_.addEventListener('click', function () {
      if (!nameInput.value) {
        nameInput.focus();
        return;
      }
      progCard.open();
      auth.updateProfile({
        displayName: nameInput.value
      }).then(checkForPhoto).catch(console.log);
    });
    return;
  }
  checkForPhoto();
}

function areObjectStoreValid(names) {
  var stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum'];

  for (var index = 0; index < stores.length; index++) {
    var el = stores[index];
    if (!names.contains(el)) return false;
  }
  return true;
}

function getEmployeeDetails(range, indexName) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(['children']);
    var store = tx.objectStore('children');
    var index = store.index(indexName);
    var getEmployee = index.getAll(range);

    getEmployee.onsuccess = function (event) {
      var result = event.target.result;

      console.log(result);

      return resolve(result);
    };
    getEmployee.onerror = function () {
      return reject({
        message: getEmployee.error
      });
    };
  });
}

function createObjectStores(db, uid) {

  var activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  });

  activity.createIndex('timestamp', 'timestamp');
  activity.createIndex('office', 'office');
  activity.createIndex('hidden', 'hidden');
  activity.createIndex('template', 'template');
  activity.createIndex('status', 'status');
  var list = db.createObjectStore('list', {
    keyPath: 'activityId'
  });
  list.createIndex('timestamp', 'timestamp');
  list.createIndex('status', 'status');
  list.createIndex('office', 'office');

  var users = db.createObjectStore('users', {
    keyPath: 'mobile'
  });

  users.createIndex('displayName', 'displayName');
  users.createIndex('isUpdated', 'isUpdated');
  users.createIndex('count', 'count');
  users.createIndex('mobile', 'mobile');
  users.createIndex('timestamp', 'timestamp');
  users.createIndex('NAME_SEARCH', 'NAME_SEARCH');
  var addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  });

  addendum.createIndex('activityId', 'activityId');
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key');
  addendum.createIndex('KeyTimestamp', ['timestamp', 'key']);
  var subscriptions = db.createObjectStore('subscriptions', {
    autoIncrement: true
  });

  subscriptions.createIndex('office', 'office');
  subscriptions.createIndex('template', 'template');
  subscriptions.createIndex('officeTemplate', ['office', 'template']);
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status']);

  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('count', 'count');
  var calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  });

  calendar.createIndex('activityId', 'activityId');
  calendar.createIndex('timestamp', 'timestamp');
  calendar.createIndex('start', 'start');
  calendar.createIndex('end', 'end');
  calendar.createIndex('office', 'office');
  calendar.createIndex('urgent', ['status', 'hidden']), calendar.createIndex('onLeave', ['template', 'status', 'office']);

  var map = db.createObjectStore('map', {
    autoIncrement: true
  });

  map.createIndex('activityId', 'activityId');
  map.createIndex('location', 'location');
  map.createIndex('latitude', 'latitude');
  map.createIndex('longitude', 'longitude');
  map.createIndex('nearby', ['status', 'hidden']);
  map.createIndex('byOffice', ['office', 'location']);
  map.createIndex('bounds', ['latitude', 'longitude']);
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
  map.createIndex('selection', ['office', 'status', 'location']);

  var children = db.createObjectStore('children', {
    keyPath: 'activityId'
  });

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice', ['employee', 'office']);
  children.createIndex('team', 'team');
  children.createIndex('teamOffice', ['team', 'office']);
  var root = db.createObjectStore('root', {
    keyPath: 'uid'
  });

  root.put({
    uid: uid,
    fromTime: 0,
    location: ''
  });
}

function redirect() {
  firebase.auth().signOut().then(function () {
    window.location = 'https://www.growthfile.com';
  }).catch(function (error) {
    console.log(error);
    window.location = 'https://www.growthfile.com';
    handleError({
      message: error + ' from redirect'
    });
  });
}

function setVenueForCheckIn(venueData, value) {
  var venue = {
    geopoint: {
      latitude: '',
      longitude: ''
    },
    address: '',
    location: '',
    venueDescriptor: value.venue[0]
  };
  if (!venueData) {
    value.venue = [venue];
    value.share = [];
    return value;
  }
  venue.location = venueData.location;
  venue.address = venueData.address;
  venue.geopoint.latitude = venueData.latitude;
  venue.geopoint.longitude = venueData.longitude;
  value.venue = [venue];
  value.share = [];
  console.log(value);
  return value;
}

function getUniqueOfficeCount() {
  return new Promise(function (resolve, reject) {
    var offices = [];
    var tx = db.transaction(['children']);
    var childrenStore = tx.objectStore('children').index('employees');
    childrenStore.openCursor(firebase.auth().currentUser.phoneNumber).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      offices.push(cursor.value.office);
      cursor.continue();
    };
    tx.oncomplete = function () {
      console.log(offices);
      return resolve(offices);
    };
    tx.onerror = function () {
      return reject({
        message: tx.error.message,
        body: JSON.stringify(tx.error)
      });
    };
  });
}

function checkMapStoreForNearByLocation(office, currentLocation) {
  return new Promise(function (resolve, reject) {

    var results = [];
    var tx = db.transaction(['map']);
    var store = tx.objectStore('map');
    var index = store.index('byOffice');
    var range = IDBKeyRange.bound([office, ''], [office, '\uFFFF']);
    index.openCursor(range).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;

      if (!cursor.value.location) {
        cursor.continue();
        return;
      }
      if (!cursor.value.latitude || !cursor.value.longitude) {
        cursor.continue();
        return;
      }
      var distanceBetweenBoth = calculateDistanceBetweenTwoPoints(cursor.value, currentLocation);
      if (isLocationLessThanThreshold(distanceBetweenBoth)) {
        results.push(cursor.value);
      }
      cursor.continue();
    };
    tx.oncomplete = function () {
      var filter = {};
      results.forEach(function (value) {
        filter[value.location] = value;
      });
      var array = [];
      Object.keys(filter).forEach(function (locationName) {
        array.push(filter[locationName]);
      });
      var nearest = array.sort(function (a, b) {
        return a.accuracy - b.accuracy;
      });
      resolve(nearest);
    };
    tx.onerror = function () {
      reject(tx.error);
    };
  });
}
var map;
var globMark;
var o = void 0;
var selectedSubs = void 0;
ApplicationState = {
  office: '',
  location: '',
  knownLocation: false,
  venue: '',
  iframeVersion: 3
};

function mapView() {
  history.pushState(['mapView'], null, null);
  document.getElementById('start-load').classList.add('hidden');
  var panel = document.getElementById('app-current-panel');
  panel.innerHTML = mapDom();
  panel.classList.remove('user-detail-bckg', 'mdc-top-app-bar--fixed-adjust');
  document.getElementById('map-view').style.height = '100%';

  manageLocation().then(function (location) {
    ApplicationState.location = location;
    firebase.auth().currentUser.reload();
    console.log("auth relaoderd");
    document.getElementById('start-load').classList.add('hidden');

    var latLng = {
      lat: location.latitude,
      lng: location.longitude
    };
    console.log(latLng);
    var offsetBounds = new GetOffsetBounds(location, 0.5);

    o = {
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    };
    if (!document.getElementById('map')) return;
    map = new google.maps.Map(document.getElementById('map'), {
      center: latLng,
      zoom: 18,
      // maxZoom:18,
      disableDefaultUI: true,

      restriction: {
        latLngBounds: {
          north: offsetBounds.north(),
          south: offsetBounds.south(),
          east: offsetBounds.east(),
          west: offsetBounds.west()
        },
        strictBounds: true
        // strictBounds: false,
      }
      // mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var marker = new google.maps.Marker({
      position: latLng,
      icon: 'https://www.robotwoods.com/dev/misc/bluecircle.png'
    });
    marker.setMap(map);

    var radiusCircle = new google.maps.Circle({
      strokeColor: '#89273E',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#89273E',
      fillOpacity: 0.35,
      map: map,
      center: latLng,
      radius: location.accuracy
    });

    google.maps.event.addListenerOnce(map, 'idle', function () {
      console.log('idle_once');
      // createForm('Puja Capital', 'customer','',location)
      // return

      // map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();
      loadNearByLocations(o, map, location).then(function (markers) {
        loadCardData(markers);
      });
    });
  }).catch(function (error) {
    console.log(error);
    // document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    document.getElementById('start-load').classList.add('hidden');

    document.getElementById('map').innerHTML = '<div class="center-abs"><p>Failed To Detect You Location</p><button class="mdc-button" id="try-again">Try Again</button></div>';
    var btn = new mdc.ripple.MDCRipple(document.getElementById('try-again'));
    btn.root_.onclick = function () {
      document.getElementById('start-load').classList.remove('hidden');
      mapView();
    };
  });
}

function loadCardData(markers) {

  var el = document.getElementById('selection-box');
  var aside = el.querySelector('aside');

  var contentBody = el.querySelector('.content-body');
  contentBody.innerHTML = '';

  var header = document.getElementById('card-primary');
  var cardProd = new mdc.linearProgress.MDCLinearProgress(document.getElementById('check-in-prog'));
  header.textContent = 'Where Are You';
  el.classList.remove('hidden');

  contentBody.innerHTML = '<div>\n    ' + mdcSelectVenue(markers, 'Where Are You ?', 'select-venue') + '\n    <div id=\'office-cont\' class=\'pt-10\'></div>\n    <div id=\'subs-cont\' class=\'pt-10\'></div>\n    <div id=\'submit-cont\' class=\'pt-10\'></div>\n    </div>';

  selectVenue = new mdc.select.MDCSelect(document.getElementById('select-venue'));
  selectVenue.listen('MDCSelect:change', function (evt) {
    document.getElementById('office-cont').innerHTML = '';
    document.getElementById('subs-cont').innerHTML = '';
    document.getElementById('submit-cont').innerHTML = '';
    console.log(evt.detail.value);
    aside.classList.add('open');
    if (!evt.detail.value) return;
    var value = JSON.parse(evt.detail.value);

    if (value === 1) {
      ApplicationState.knownLocation = false;
      ApplicationState.venue = '';
      ApplicationState.office = '';
      getUniqueOfficeCount().then(function (offices) {
        if (!offices.length) return getSuggestions();

        document.getElementById('office-cont').innerHTML = '' + mdcDefaultSelect(offices, 'Choose Office', 'choose-office');
        var selectOfficeInit = new mdc.select.MDCSelect(document.getElementById('choose-office'));
        selectOfficeInit.listen('MDCSelect:change', function (evt) {
          if (!evt.detail.value) return;
          ApplicationState.office = evt.detail.value;
          getSubscription(evt.detail.value, 'check-in', 'CONFIRMED').then(function (checkInSub) {
            if (!checkInSub) return getSuggestions();

            cardProd.open();
            requestCreator('create', setVenueForCheckIn('', checkInSub)).then(function () {
              snacks('Check-in created');
              cardProd.close();
              getSuggestions();
            }).catch(function (error) {
              snacks(error.response.message);
              cardProd.close();
            });
          });
        });
        if (offices.length == 1) {
          selectOfficeInit.selectedIndex = 1;
        }
        if (offices.length > 1) {
          selectOfficeInit.selectedIndex = 0;
        }
      });
      return;
    }

    ApplicationState.knownLocation = true;
    ApplicationState.venue = value;
    ApplicationState.office = value.office;
    getSubscription(value.office, 'check-in', 'CONFIRMED').then(function (result) {
      if (!result) return getSuggestions();

      document.getElementById('submit-cont').innerHTML = '<button id=\'confirm\' class=\'mdc-button mdc-theme--primary-bg mdc-theme--text-primary-on-light\'>\n        <span class=\'mdc-button__label\'>Confirm</span>\n        </button>';
      var confirm = new mdc.ripple.MDCRipple(document.getElementById('confirm'));

      confirm.root_.onclick = function () {
        confirm.root_.classList.add('hidden');
        cardProd.open();
        requestCreator('create', setVenueForCheckIn(value, result)).then(function () {
          snacks('Check-in created');
          cardProd.close();
          getSuggestions();
        }).catch(function (error) {
          console.log(error);
          confirm.root_.classList.remove('hidden');
          snacks(error.response.message);
          cardProd.close();
        });
      };
    });
  });

  if (!markers.length) {
    selectVenue.selectedIndex = 1;
  };

  if (markers.length == 1) {
    selectVenue.selectedIndex = 2;
  };

  if (markers.length > 1) {
    selectVenue.selectedIndex = 0;
  }
};

function getAllSubscriptions() {
  return new Promise(function (resolve, reject) {

    var tx = db.transaction("subscriptions");
    var result = [];
    tx.objectStore('subscriptions').openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      result.push(cursor.value);
      cursor.continue();
    };
    tx.oncomplete = function () {

      return resolve(result);
    };
  });
}

function hideBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.add('hidden');
}

function showBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.remove('hidden');
}

function toggleCardHeight(toggle, cardSelector) {
  var el = document.getElementById('map-view');
  var card = document.getElementById(cardSelector);
  if (toggle) {
    el.classList.add('hidden');
    card.classList.remove('hidden');
    card.style.height = '100%';
    document.getElementById('app-header').classList.add('hidden');
  } else {
    el.classList.remove('hidden');
    document.getElementById('selection-box').classList.remove('hidden');
    card.classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
  }
}

function mapDom() {
  return '\n  <div id=\'map-view\' class=\'\'>\n    <div id=\'map\'></div>\n    <div  class="overlay selection-box-auto hidden" id=\'selection-box\'>\n              <aside class="social" tabindex="-1" role="dialog" aria-labelledby="modal-label" aria-hidden="true">\n                <div class="card__primary">\n                  <h2 class="demo-card__title mdc-typography mdc-typography--headline6 margin-auto" id=\'card-primary\'>\n                  </h2>\n\n                </div>\n                <div role="progressbar"\n                  class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed"\n                  id=\'check-in-prog\'>\n                  <div class="mdc-linear-progress__buffering-dots"></div>\n                  <div class="mdc-linear-progress__buffer"></div>\n                  <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">\n                    <span class="mdc-linear-progress__bar-inner"></span>\n                  </div>\n                  <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">\n                    <span class="mdc-linear-progress__bar-inner"></span>\n                  </div>\n                </div>\n\n                <div class="content-body">\n\n                </div>\n                <div id=\'submit-cont\'>\n                </div>\n              </aside>\n            </div>\n\n  ';
}

function snapView() {
  // localStorage.setItem('snap_office', office)
  history.pushState(['snapView'], null, null);
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return;
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath");
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {

  var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon\'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>';
  var header = getHeader('app-header', backIcon, '');
  header.root_.classList.remove('hidden');
  document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');

  var url = 'data:image/jpg;base64,' + base64;
  document.getElementById('app-current-panel').innerHTML = '\n\n  <div class=\'image-container\'>\n  <div id=\'snap\' class="snap-bckg">\n  <div class="form-meta snap-form">\n    <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id=\'snap-textarea\'>\n        <textarea\n        class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100"></textarea></div>\n        <button id=\'snap-submit\' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"\n      style="z-index: 9;">\n      <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\n      </button>\n  </div>\n  </div>\n\n  </div>\n  ';

  var content = document.getElementById('snap');
  var textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'));
  var submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'));

  textarea.focus();
  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px';
    this.style.height = this.scrollHeight + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = this.scrollHeight - 20 + "px";
    }
  });
  submit.root_.addEventListener('click', function () {
    var textValue = textarea.value;
    getUniqueOfficeCount().then(function (offices) {
      if (!offices.length) return;
      if (offices.length == 1) {
        getSubscription(offices[0], 'check-in', 'CONFIRMED').then(function (sub) {
          if (!sub) {
            snacks('Check-in Subscription not available');
            history.back();
            return;
          }
          sub.attachment.Photo.value = url;
          sub.attachment.Comment.value = textValue;
          progressBar.open();
          requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
            getSuggestions();
            snacks('Check-In Created');
          }).catch(function (error) {
            snacks(error.message);
          });
        });
        return;
      }
      if (offices.length > 1) {
        var template = '<ul class=\'mdc-list\' role=\'radiogroup\' id=\'dialog-office\'>\n              ' + offices.map(function (office, idx) {
          return ' <li class="mdc-list-item" role="radio" aria-checked="' + (idx ? 'false' : 'true') + '" tabindex=' + (idx ? '' : '0') + '>\n                <span class="mdc-list-item__graphic">\n                  <div class="mdc-radio">\n                    <input class="mdc-radio__native-control"\n                          type="radio"\n                          id=\'demo-list-radio-item-' + idx + '\'\n                          name="demo-list-radio-item-group"\n                          value="1">\n                    <div class="mdc-radio__background">\n                      <div class="mdc-radio__outer-circle"></div>\n                      <div class="mdc-radio__inner-circle"></div>\n                    </div>\n                  </div>\n                </span>\n                <label class="mdc-list-item__text" for="demo-list-radio-item-' + idx + '">' + office + '</label>\n              </li>';
        }).join("") + '\n            \n            <ul>';
        var dialog = new Dialog('Send To', template).create();
        var list = new mdc.list.MDCList(document.getElementById('dialog-office'));
        dialog.open();
        dialog.listen('MDCDialog:opened', function () {
          list.layout();
          list.singleSelection = true;
        });
        dialog.listen('MDCDialog:closed', function (evt) {
          if (evt.detail.action !== 'accept') return;

          getSubscription(offices[list.selectedIndex], 'check-in', 'CONFIRMED').then(function (sub) {
            if (!sub) {
              snacks('Check-in Subscription not available');
              history.back();
              return;
            }
            sub.attachment.Photo.value = url;
            sub.attachment.Comment.value = textValue;
            progressBar.open();
            requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
              getSuggestions();
              snacks('Check-In Created');
            }).catch(function (error) {
              snacks(error.response.message);
            });
          });
        });
      }
    });
  });

  var image = new Image();
  image.onload = function () {
    var sizeInBytes = 4 * Math.ceil(image.src.length / 3) * 0.5624896334383812;
    var sizeInKb = sizeInBytes / 1000;
    snacks('image width : ' + image.width + ' , image Height ' + image.height + ' , image size ' + sizeInKb);
    var orientation = getOrientation(image);
    content.style.backgroundImage = 'url(' + url + ')';
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain';
    }
  };
  image.src = url;
}

function mdcDefaultSelect(data, label, id, option) {
  var template = '<div class="mdc-select" id=' + id + '>\n  <i class="mdc-select__dropdown-icon"></i>\n  <select class="mdc-select__native-control">\n  <option disabled selected></option>\n  ' + data.map(function (value) {
    return ' <option value=\'' + value + '\'>\n    ' + value + '\n    </option>';
  }).join("") + '\n' + option + '\n\n  </select>\n  <label class=\'mdc-floating-label\'>' + label + '</label>\n  <div class="mdc-line-ripple"></div>\n</div>';
  return template;
}

function mdcSelectVenue(venues, label, id) {
  var float = void 0;
  var template = '<div class="mdc-select" id=' + id + '>\n  <i class="mdc-select__dropdown-icon"></i>\n  <select class="mdc-select__native-control">\n  <option disabled selected value=' + JSON.stringify('0') + '></option>\n  <option value=' + JSON.stringify('1') + '>UNKNOWN LOCATION</option>\n  ' + venues.map(function (value) {
    return ' <option value=\'' + JSON.stringify(value) + '\'>\n    ' + value.location + '\n    </option>';
  }).join("") + '\n  </select>\n  <label class=\'mdc-floating-label\'>' + label + '</label>\n  <div class="mdc-line-ripple"></div>\n</div>';
  return template;
}

function getOrientation(image) {
  if (image.width > image.height) return 'landscape';
  if (image.height > image.width) return 'potrait';
  if (image.width == image.height) return 'square';
}

function focusMarker(map, latLng, zoom) {
  map.setZoom(zoom);
  map.panTo(latLng);
}

function GetOffsetBounds(latlng, offset) {
  var radius = 6378;
  var d = 180 / Math.PI;
  this.latLng = latlng;
  this.ratio = offset / radius * d;
  this.radioLon = this.ratio / Math.cos(this.latLng.latitude * Math.PI / 180);
}

GetOffsetBounds.prototype.north = function () {
  return this.latLng.latitude + this.ratio;
};
GetOffsetBounds.prototype.south = function () {
  return this.latLng.latitude - this.ratio;
};
GetOffsetBounds.prototype.east = function () {
  return this.latLng.longitude + this.radioLon;
};
GetOffsetBounds.prototype.west = function () {
  return this.latLng.longitude - this.radioLon;
};

function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {

    var infowindow = new google.maps.InfoWindow();
    var result = [];
    var lastOpen = void 0;

    var tx = db.transaction(['map']);
    var store = tx.objectStore('map');
    var index = store.index('bounds');
    var idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
    var bounds = map.getBounds();
    index.openCursor(idbRange).onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) return;
      if (calculateDistanceBetweenTwoPoints(location, {
        latitude: cursor.value.latitude,
        longitude: cursor.value.longitude
      }) > 0.5) {
        cursor.continue();
        return;
      }

      var marker = new google.maps.Marker({
        position: {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        },

        icon: {
          url: './img/m.png',
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        },
        id: cursor.value.activityId,
        value: JSON.stringify(cursor.value)
      });

      marker.setMap(map);
      var content = '<span>' + cursor.value.activityId + '</span>';
      // google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
      //   return function () {
      //     if (lastOpen) {
      //       lastOpen.close();
      //     };
      //     infowindow.setContent(content);
      //     infowindow.open(map, marker);
      //     lastOpen = infowindow;
      //   };
      // })(marker, content, infowindow));
      result.push(cursor.value);
      bounds.extend(marker.getPosition());
      cursor.continue();
    };
    tx.oncomplete = function () {
      map.fitBounds(bounds);
      return resolve(result);
    };
  });
}
function profileView() {
  drawer.open = false;

  document.getElementById('start-load').classList.add('hidden');
  document.getElementById('app-header').classList.remove('hidden');
  document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');

  var lastSignInTime = firebase.auth().currentUser.metadata.lastSignInTime;
  var auth = firebase.auth().currentUser;
  var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon mdc-top-app-bar__navigation-icon material-icons\'>arrow_back</a>\n  <span class="mdc-top-app-bar__title">Profile</span>';
  var editIcon = ' <a  class="material-icons mdc-top-app-bar__action-item" aria-label="Edit" id=\'edit-profile\'>edit</a>\n  <a class=" mdc-top-app-bar__action-item hidden" aria-label="Edit" id=\'save-profile\'>SAVE</a>\n  ';
  var header = getHeader('app-header', backIcon, editIcon);

  header.setScrollTarget(document.getElementById('main-content'));

  var root = '<div class="mdc-card demo-card" id=\'profile-card\'>\n  <div class="mdc-card__primary-action demo-card__primary-action" tabindex="0">\n  \n  <div class="mdc-card__media mdc-card__media--16-9 demo-card__media"\n  style="background-image: url(' + (firebase.auth().currentUser.photoURL || './img/empty-user-big.jpg') + ');" onerror="imgErr(this)">\n\n</div>\n<button class=\'mdc-button overlay-text\'>\n<i class=\'material-icons mdc-button__icon mdc-theme--on-primary\'>add_a_photo</i>\n<span class=\'mdc-button__label mdc-theme--on-primary\'>\nChoose Image\n</span>\n<input id=\'choose-profile-image\' type=\'file\' accept=\'image/jpeg;capture=camera\'  class=\'overlay-text\'>\n</button>\n<div id=\'base-details\'></div>\n<div id=\'user-details\'></div>  \n<div class="mdc-card__actions">\n<div class="mdc-card__action-buttons">\n    <span class="mdc-typography--headline6 last-logged-in-time">' + lastSignInTime + '</span>\n</div>\n</div>\n';

  document.getElementById('app-current-panel').innerHTML = root;
  setDetails();

  var newName = void 0;
  var newEmail = void 0;
  var currentName = auth.displayName;
  var currentEmail = auth.email;
  var imageSrc = firebase.auth().currentUser.photoURL;

  document.getElementById('edit-profile').addEventListener('click', function (evt) {
    // evt.target.classList.add('hidden')
    console.log(header);
    header.iconRipples_[0].root_.classList.add('hidden');
    header.iconRipples_[1].root_.classList.remove('hidden');
    history.pushState(['edit-profile'], null, null);
    document.getElementById('base-details').innerHTML = '';
    document.querySelector('.mdc-card .mdc-card__actions').classList.add('hidden');
    document.querySelector('#user-details').innerHTML = createEditProfile(currentName, currentEmail);
    nameInit = new mdc.textField.MDCTextField(document.getElementById('name'));
    emailInit = new mdc.textField.MDCTextField(document.getElementById('email'));

    var imageBckg = document.querySelector('.mdc-card__media');
    imageBckg.classList.add('reduced-brightness');
    document.querySelector('.mdc-button.overlay-text').classList.add('show');

    var input = document.getElementById('choose-profile-image');
    document.querySelector('.overlay-text').style.opacity = 1;

    input.addEventListener('change', function (evt) {

      var files = input.files;
      if (!files.length) return;
      var file = files[0];
      var fileReader = new FileReader();
      fileReader.onload = function (fileLoadEvt) {
        var image = new Image();
        image.src = fileLoadEvt.target.result;
        image.onload = function () {
          var newSrc = resizeAndCompressImage(image);
          imageBckg.style.backgroundImage = 'url(' + newSrc + ')';
          imageSrc = newSrc;
        };
      };
      fileReader.readAsDataURL(file);
    });
  });
  document.getElementById('save-profile').addEventListener('click', function () {
    document.querySelector('.mdc-card .mdc-card__actions').classList.remove('hidden');
    newName = nameInit.value;
    newEmail = emailInit.value;
    progressBar.foundation_.open();

    if (imageSrc !== firebase.auth().currentUser.photoURL) {
      requestCreator('backblaze', {
        imageBase64: imageSrc
      }).then(function () {
        snacks('Profile Picture set successfully');
      }).catch(function (error) {
        snacks(error.response.message);
      });
    }
    auth.updateProfile({
      displayName: newName
    }).then(function () {
      if (!isEmailValid(newEmail, currentEmail)) return history.back();
      requestCreator('updateAuth', {
        email: emailInit.value
      }).then(function () {
        snacks('Verification Link has been Sent to ' + emailInit.value);
        history.back();
        setDetails();
      }).catch(function (error) {
        progressBar.close();
        history.back();
        if (error) {
          snacks(error.response.message);
        } else {
          snacks('Please Try Again Later');
        }
      });
    });
  });
}

function setDetails() {
  progressBar.foundation_.close();
  document.getElementById('base-details').innerHTML = createBaseDetails();
  document.getElementById('user-details').innerHTML = createUserDetails();
  createViewProfile();
}

function createBaseDetails() {
  return '   <div class="basic-info seperator">\n\n  <h1 class="mdc-typography--headline5 mb-0 mt-0" id=\'view-name\'>\n      ' + (firebase.auth().currentUser.displayName || '-') + '</h1>\n  <h1 class="mdc-typography--headline6 mb-0 mt-0">\n  <svg class=\'meta-icon\' fill=\'#cccccc\' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\n  <span id=\'view-email\'>\n          ' + firebase.auth().currentUser.email + '\n      </span>\n\n  </h1>\n  <h1 class="mdc-typography--headline6 mt-0"> \n  <svg class=\'meta-icon\' fill=\'#cccccc\' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>\n  <span\n          class="mdc-typography--headline6">+91</span> 9999288921\n  </h1>\n</div>';
}

function createUserDetails() {
  return '\n  <div class="mdc-tab-bar" role="tablist">\n  <div class="mdc-tab-scroller">\n      <div class="mdc-tab-scroller__scroll-area">\n          <div class="mdc-tab-scroller__scroll-content" id=\'tab-scroller\'>\n          </div>\n      </div>\n  </div>\n</div>\n<div id=\'my-details\' class=\'pt-10\'></div>\n\n';
}

function createViewProfile() {

  getEmployeeDetails(IDBKeyRange.only(firebase.auth().currentUser.phoneNumber), 'employees').then(function (myCreds) {
    var officeDom = '';

    myCreds.forEach(function (activity) {

      officeDom += addTabs(activity.office);
    });
    document.getElementById('tab-scroller').innerHTML = officeDom;
    var tabInit = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'));
    //minor hack
    setTimeout(function () {
      tabInit.activateTab(0);
    }, 0);
    tabInit.listen('MDCTabBar:activated', function (evt) {

      var me = myCreds[evt.detail.index];
      var selectedOffice = me.office;

      var mySupervisors = [me.attachment['First Supervisor'].value, me.attachment['Second Supervisor'].value];

      document.getElementById('my-details').innerHTML = fillUserDetails(me);
      Promise.all([getEmployeeDetails([selectedOffice, 'recipient'], 'officeTemplate'), getEmployeeDetails([selectedOffice, 'leave-type'], 'officeTemplate'), getEmployeeDetails([1, selectedOffice], 'teamOffice')]).then(function (results) {
        var reports = results[0];
        var leaves = results[1];
        var myTeam = results[2];
        console.log(results);

        if (reports.length) {
          document.getElementById('reports').innerHTML = ' <h1 class="mdc-typography--subtitle1 mt-0">\n                          Reports :\n                          ' + reports.map(function (report) {
            return '<span>' + report.attachment.Name.value + '</span>  <span class="dot"></span>';
          }).join("") + '\n                          </h1>';
        }

        if (leaves.length) {
          document.getElementById('leaves').innerHTML = '<h1 class="mdc-typography--headline6 mb-0">\n                          Remaining Leaves\n                          ' + leaves.map(function (leave, idx) {
            return '<h1 class="mdc-typography--headline6 mt-0 ' + (leaves.length - idx == 1 ? '' : 'mb-0') + '">' + leave.attachment.Name.value + ' : ' + leave.attachment['Annual Limit'].value + '</h1>';
          }).join("") + '\n                      </h1>';
        }
        var tx = db.transaction(['users']);
        var store = tx.objectStore('users');
        var team = '';
        var supers = '';

        mySupervisors.forEach(function (value) {
          store.get(value).onsuccess = function (event) {
            var record = event.target.result;
            if (!record) return;
            supers += addUserChips(record);
          };
        });

        if (myTeam.length) {
          myTeam.forEach(function (member) {
            store.get(member.attachment['Employee Contact'].value).onsuccess = function (event) {
              var record = event.target.result;
              if (!record) return;
              team += addUserChips(record);
            };
          });
        };

        tx.oncomplete = function () {
          if (supers) {
            document.getElementById('supervisors').innerHTML = '<h1 class="mdc-typography--headline6 mt-0 mb-0">Supervisors</h1>\n                  <div class="mdc-chip-set supervisor">\n                  ' + supers + '\n                  </div>\n                  ';
          }
          if (team) {

            document.getElementById('my-team').innerHTML = '<h1 class="mdc-typography--headline6 mt-0 mb-0">Team</h1>\n                  <div class="mdc-chip-set">\n                  ' + team + '\n                  </div>';
          }
        };
      });
    });
  });
}

function createEditProfile(name, email) {

  return ' ' + nameField(name) + '\n\n  ' + emailField(email, 'This Will Be Used For Sending Reports') + '\n    ';
}

function nameField(name) {
  return '<div class="mdc-typography mdc-typography--body2 p-10" id=\'card-body-edit\'>\n  <div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id=\'name\'>\n\n  <svg class=\'mdc-text-field__icon\' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\n      <input class="mdc-text-field__input" value="' + name + '">\n      <div class="mdc-line-ripple"></div>\n      <label class="mdc-floating-label ' + (name ? 'mdc-floating-label--float-above' : '') + '">Name</label>\n  </div>\n  <div class="mdc-text-field-helper-line">\n      <div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">\n       This will be displayed on your public profile\n\n      </div>\n  </div>';
}

function emailField(email, label, setFocus) {
  return '<div class="mdc-text-field mdc-text-field--with-leading-icon full-width" id=\'email\'>\n  <svg class=\'mdc-text-field__icon\' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>\n  <input class="mdc-text-field__input" type=\'email\' value="' + email + '" autofocus=' + (setFocus ? 'true' : 'false') + '>\n  <div class="mdc-line-ripple"></div>\n  <label class="mdc-floating-label ' + (email ? 'mdc-floating-label--float-above' : '') + ' ">Email</label>\n</div>\n<div class="mdc-text-field-helper-line">\n  <div id="username-helper-text" class="mdc-text-field-helper-text" aria-hidden="true">\n      ' + label + '\n  </div>\n</div>';
}

function addTabs(name) {

  return ' <button class="mdc-tab" role="tab">\n        <span class="mdc-tab__content">\n            <span class="mdc-tab__text-label">' + name + '</span>\n        </span>\n        <span class="mdc-tab-indicator">\n            <span\n                class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n        </span>\n        <span class="mdc-tab__ripple"></span>\n    </button>';
}

function addUserChips(user) {
  return '\n  <div class="mdc-chip">\n    ' + (user.photoURL ? '<img class="mdc-chip__icon mdc-chip__icon--leading" src=' + user.photoURL + ' onerror="imgErr(this)">' : '\n    \n    <svg class="mdc-chip__icon mdc-chip__icon--leading" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z"/></svg>') + '\n    <div class="mdc-chip__text">' + (user.displayName || user.mobile) + '</div>\n</div>';
}

function fillUserDetails(user) {
  var notAllowedFields = {
    'First Supervisor': true,
    'Second Supervisor': true,
    'Employee Contact': true,
    'Name': true
  };
  var template = '<div class="office-info seperator">\n' + Object.keys(user.attachment).map(function (attachmentNames) {
    return '' + (notAllowedFields[attachmentNames] ? '' : '' + (user.attachment[attachmentNames].value ? '<h1 class="mdc-typography--subtitle1 mt-0">\n    ' + attachmentNames + ' : ' + user.attachment[attachmentNames].value + '\n</h1>' : ''));
  }).join("") + '\n\n<h1 class="mdc-typography--subtitle1 mt-0">\n    Joined : ' + moment(firebase.auth().currentUser.metadata.creationTime).format("Do MMM YYYY") + '\n</h1>\n\n<div id=\'reports\'>\n\n</div>\n</div>\n<div class="hierchy pt-10 seperator">\n<div id=\'supervisors\'>\n</div>\n\n<div id=\'my-team\' style=\'padding-bottom:10px\'>\n</div>\n</div>\n\n<div class="meta-hidden-details">\n<div id=\'leaves\'>\n\n</div>\n\n</div>\n\n</div>\n\n</div>\n';
  return template;
}

function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');
  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}

function isEmailValid(newEmail, currentEmail) {
  if (!newEmail) {
    return false;
  }
  return !(newEmail === currentEmail);
}
function reportView() {
  var backIcon = '<a class=\'mdc-top-app-bar__navigation-icon\'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>';
  var searchIcon = '<a class=\'mdc-top-app-bar__action-item material-icons hidden\' id=\'search-btn\'>\n        search\n    </a>';

  var header = getHeader('app-header', backIcon, '');
  document.getElementById('app-header').classList.remove("hidden");
  document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust');

  document.getElementById('tabs').innerHTML = showTabs();
  setTimeout(function () {
    tabList.activateTab(1);
  }, 0);
  var tabList = new mdc.tabBar.MDCTabBar(document.querySelector('#tabs .mdc-tab-bar'));
  console.log(tabList);

  tabList.listen('MDCTabBar:activated', function (evt) {
    document.getElementById('app-current-panel').innerHTML = '';
    if (!evt.detail.index) {
      document.getElementById('app-current-panel').innerHTML = '<div class=\'attendence-section pt-20 mdc-top-app-bar--fixed-adjust-with-tabs\'>\n    ' + applyLeave() + '\n    ' + attendenceCards() + '\n    </div>\n    ';
      return;
    }
    if (evt.detail.index == 1) {
      document.getElementById('app-current-panel').innerHTML = '<div class=\'mdc-top-app-bar--fixed-adjust-with-tabs\'>' + emptyClaims() + '</div>';
    }
  });
}

function showTabs() {
  return '<div class="mdc-tab-bar" role="tablist">\n    <div class="mdc-tab-scroller">\n      <div class="mdc-tab-scroller__scroll-area">\n        <div class="mdc-tab-scroller__scroll-content">\n          <button class="mdc-tab mdc-tab--active" role="tab" aria-selected="true" tabindex="0">\n            <span class="mdc-tab__content">\n              <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">fingerprint</span>\n              <span class="mdc-tab__text-label mdc-theme--on-primary">Attendence</span>\n            </span>\n            <span class="mdc-tab-indicator mdc-tab-indicator--active">\n              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n            </span>\n            <span class="mdc-tab__ripple"></span>\n          </button>\n          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">\n          <span class="mdc-tab__content">\n            <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">assignment</span>\n            <span class="mdc-tab__text-label mdc-theme--on-primary">reimbursement</span>\n          </span>\n          <span class="mdc-tab-indicator">\n            <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n          </span>\n          <span class="mdc-tab__ripple"></span>\n        </button>\n        <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">\n        <span class="mdc-tab__content">\n         \n          <span class="mdc-tab__text-label mdc-theme--on-primary">Report 1</span>\n        </span>\n        <span class="mdc-tab-indicator">\n          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n        </span>\n        <span class="mdc-tab__ripple"></span>\n      </button>\n      <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">\n        <span class="mdc-tab__content">\n          <span class="mdc-tab__text-label mdc-theme--on-primary">Report 2</span>\n        </span>\n        <span class="mdc-tab-indicator">\n          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n        </span>\n        <span class="mdc-tab__ripple"></span>\n      </button><button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">\n      <span class="mdc-tab__content">\n        <span class="mdc-tab__text-label mdc-theme--on-primary">Report 3</span>\n      </span>\n      <span class="mdc-tab-indicator">\n        <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n      </span>\n      <span class="mdc-tab__ripple"></span>\n    </button><button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">\n    <span class="mdc-tab__content">\n      <span class="mdc-tab__icon material-icons" aria-hidden="true">favorite</span>\n      <span class="mdc-tab__text-label mdc-theme--on-primary">Report 4</span>\n    </span>\n    <span class="mdc-tab-indicator">\n      <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>\n    </span>\n    <span class="mdc-tab__ripple"></span>\n  </button>\n        </div>\n      </div>\n    </div>\n  </div>';
}
var apiHandler = new Worker('js/apiHandler.js');

function handleError(error) {
  var errorInStorage = JSON.parse(localStorage.getItem('error'));
  if (errorInStorage.hasOwnProperty(error.message)) return;
  localStorage.setItem('error', JSON.stringify(errorInStorage));
  requestCreator('instant', JSON.stringify(error));
}

function successDialog(data) {
  console.log(data);
  var successMark = document.getElementById('success-animation');
  var viewContainer = document.getElementById('growthfile');
  successMark.classList.remove('hidden');
  viewContainer.style.opacity = '0.37';
  setTimeout(function () {
    successMark.classList.add('hidden');
    viewContainer.style.opacity = '1';
  }, 1500);
}

function snacks(message, text, callback) {
  snackBar.labelText = message;
  snackBar.open();
  snackBar.timeoutMs = 4000;
  snackBar.actionButtonText = text ? text : 'Okay';

  snackBar.listen('MDCSnackbar:closed', function (evt) {
    if (evt.detail.reason !== 'action') return;
    if (callback && typeof callback === 'function') {
      callback();
    }
  });
}

function fetchCurrentTime(serverTime) {
  return Date.now() + serverTime;
}

//TODO MOVE TO WORKER
function geolocationApi(body) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + appKey.getMapKey(), true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {

      if (xhr.readyState === 4) {
        if (xhr.status >= 400) {
          return reject({
            message: xhr.response,
            body: JSON.parse(body)
          });
        }
        var response = JSON.parse(xhr.response);
        if (!response) {
          return reject({
            message: 'Response From geolocation Api ' + response,
            body: JSON.parse(body)
          });
        }
        resolve({
          latitude: response.location.lat,
          longitude: response.location.lng,
          accuracy: response.accuracy,
          provider: body,
          lastLocationTime: Date.now()
        });
      }
    };
    xhr.onerror = function () {
      reject({
        message: xhr
      });
    };
    xhr.send(body);
  });
}

function manageLocation() {
  return new Promise(function (resolve, reject) {
    getLocation().then(function (location) {
      ApplicationState.location = location;
      resolve(location);
    }).catch(function (error) {
      reject(error);
    });
  });
}

function getLocation() {
  return new Promise(function (resolve, reject) {
    if (native.getName() === 'Android') {
      html5Geolocation().then(function (htmlLocation) {
        if (htmlLocation.accuracy <= 350) return resolve(htmlLocation);
        handleGeoLocationApi().then(function (cellLocation) {
          if (htmlLocation.accuracy < cellLocation.accuracy) {
            return resolve(htmlLocation);
          }
          return resolve(cellLocation);
        }).catch(function (error) {
          return resolve(htmlLocation);
        });
      }).catch(function (htmlError) {
        handleGeoLocationApi().then(function (location) {
          return resolve(location);
        }).catch(function (error) {
          return reject({
            message: 'Both HTML and Geolocation failed to fetch location',
            body: {
              html5: htmlError,
              geolocation: error
            },
            'locationError': true
          });
        });
      });
      return;
    }

    try {
      webkit.messageHandlers.locationService.postMessage('start');
      window.addEventListener('iosLocation', function _iosLocation(e) {
        resolve(e.detail);
        window.removeEventListener('iosLocation', _iosLocation, true);
      }, true);
    } catch (e) {
      resolve({
        latitude: 28.549173600000003,
        longitude: 77.25055569999999,
        accuracy: 24
      });
      // html5Geolocation().then(function (location) {
      //   resolve(location)
      // }).catch(function (error) {
      //   reject(error)
      // })
    }
  });
}

function handleGeoLocationApi() {
  return new Promise(function (resolve, reject) {
    var body = void 0;
    try {
      body = getCellularInformation();
    } catch (e) {
      reject(e.message);
    }
    if (!Object.keys(body).length) {
      reject("empty object from getCellularInformation");
    }
    geolocationApi(JSON.stringify(body)).then(function (cellLocation) {
      return resolve(cellLocation);
    }).catch(function (error) {
      reject(error);
    });
  });
}

function iosLocationError(error) {
  return new Promise(function (resolve, reject) {
    html5Geolocation().then(function (location) {
      ApplicationState.location = location;
      return resolve(location);
    }).catch(reject);
    handleError(error);
  });
}

function html5Geolocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(function (position) {
      return resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        provider: 'HTML5',
        lastLocationTime: Date.now()
      });
    }, function (error) {
      reject({
        message: error.message
      });
    }, {
      maximumAge: 0,
      timeout: 5000,
      enableHighAccuracy: false
    });
  });
}

function toRad(value) {
  return value * Math.PI / 180;
}

function calculateDistanceBetweenTwoPoints(oldLocation, newLocation) {
  var R = 6371; // km
  var dLat = toRad(newLocation.latitude - oldLocation.latitude);
  var dLon = toRad(newLocation.longitude - oldLocation.longitude);
  var lat1 = toRad(newLocation.latitude);
  var lat2 = toRad(oldLocation.latitude);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
}

function isLocationMoreThanThreshold(distance) {
  var THRESHOLD = 1; //km
  if (distance >= THRESHOLD) return true;
  return false;
}

function isLocationStatusWorking() {
  var requiredWifi = {
    'samsung': true,
    'OnePlus': true
  };
  if (native.getName() !== 'Android') return true;

  if (!AndroidInterface.isLocationPermissionGranted()) {
    var alertDialog = new Dialog('LOCATION PERMISSION', 'Please Allow Growthfile location access.').create();
    alertDialog.open();
    return;
  }
  var brand = JSON.parse(localStorage.getItem('deviceInfo')).deviceBrand;
  if (requiredWifi[brand]) {
    if (!AndroidInterface.isWifiOn()) {
      var _alertDialog = new Dialog('TURN ON YOUR WIFI', 'Growthfile requires wi-fi access for improving your location accuracy.').create();
      _alertDialog.open();
      return;
    }
    return true;
  }
  return true;
}

function requestCreator(requestType, requestBody) {

  var auth = firebase.auth().currentUser;
  if (!auth) return;
  var requestGenerator = {
    type: requestType,
    body: '',
    meta: {
      user: {
        token: '',
        uid: auth.uid,
        displayName: auth.displayName,
        photoURL: auth.photoURL,
        phoneNumber: auth.phoneNumber
      },
      apiUrl: appKey.getBaseUrl()
    }
  };

  auth.getIdToken(false).then(function (token) {
    requestGenerator.meta.user.token = token;
    if (requestType === 'instant' || requestType === 'now' || requestType === 'Null' || requestType === 'backblaze' || requestType === 'removeFromOffice') {
      requestGenerator.body = requestBody;
      apiHandler.postMessage(requestGenerator);
    } else {
      getRootRecord().then(function (rootRecord) {
        requestBody['timestamp'] = fetchCurrentTime(rootRecord.serverTime);
        requestGenerator.body = requestBody;
        requestBody['geopoint'] = ApplicationState.location;
        apiHandler.postMessage(requestGenerator);
      });
    }
  }).catch(console.log);
  return new Promise(function (resolve, reject) {
    apiHandler.onmessage = function (event) {
      console.log(event);
      if (!event.data.success) return reject(event.data);
      return resolve(event.data);
    };
    apiHandler.onerror = function (event) {
      console.log(event);
      return reject(event.data);
    };
  });
}

function locationErrorDialog(error) {

  var dialog = new Dialog('Location Error', 'There was a problem in detecting your location. Please try again later').create();
  dialog.open();
  dialog.listen('MDCDialog:closed', function (evt) {
    resetScroll();
    listView();
    handleError(error);
  });
}

function isLastLocationOlderThanThreshold(lastLocationTime, threshold) {
  if (!lastLocationTime) return true;
  var currentTime = moment(moment().valueOf());
  var duration = moment.duration(currentTime.diff(lastLocationTime));
  var difference = duration.asSeconds();
  return difference > threshold;
}

function updateApp() {
  if (native.getName() !== 'Android') return webkit.messageHandlers.updateApp.postMessage('Update App');
  var updateAppDialog = new Dialog('New Update Avaialble', 'Please Install the Latest version from google play store , to Use Growthfile. Click Okay to Install Lastest Version from Google Play Store.').create();

  updateAppDialog.open();
  updateAppDialog.scrimClickAction = '';
  updateAppDialog.listen('MDCDialog:opened', function () {
    var cancelButton = updateAppDialog.buttons_[0];
    cancelButton.setAttribute('disabled', 'true');
  });
  updateAppDialog.listen('MDCDialog:closed', function (evt) {
    if (evt.detail.action !== 'accept') return;
    AndroidInterface.openGooglePlayStore('com.growthfile.growthfileNew');
  });
}

function revokeSession() {
  firebase.auth().signOut().then(function () {}).catch(function (error) {

    handleError({
      message: 'Sign out error',
      body: error
    });
  });
}

function officeRemovalSuccess(data) {
  var officeRemoveDialog = new Dialog('Reminder', 'You have been removed from ' + data.msg.join(' & ')).create();
  officeRemoveDialog.open();
  officeRemoveDialog.listen('MDCDialog:closed', function () {});
  return;
}

function updateIosLocation(geopointIos) {

  ApplicationState.location = geopointIos;
  ApplicationState.lastLocationTime = Date.now();
  var iosLocation = new CustomEvent('iosLocation', {
    "detail": ApplicationState.location
  });
  window.dispatchEvent(iosLocation);
}

function handleComponentUpdation(readResponse) {
  if (!history.state) return;
  switch (history.state[0]) {
    case 'homeView':
      getSuggestions();
      break;
    case 'enterChat':
      dynamicAppendChats(readResponse.response.addendum);
      break;
    default:
      break;
  }
}

function runRead(value) {

  if (!value || value.read) {
    firebase.auth().currentUser.reload();
    requestCreator('Null', value).then(handleComponentUpdation).catch(console.log);
    return;
  }
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function getRootRecord() {
  return new Promise(function (resolve, reject) {
    var record = void 0;
    var rootTx = db.transaction(['root'], 'readwrite');
    var rootStore = rootTx.objectStore('root');
    rootStore.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
      var data = event.target.result;
      record = data;
    };

    rootTx.oncomplete = function () {
      resolve(record);
    };
    rootTx.onerror = function () {
      reject({
        message: rootTx.error.message + ' from getRootRecord'
      });
    };
  });
}

function getSubscription(office, template, status) {
  return new Promise(function (resolve) {
    var tx = db.transaction(['subscriptions']);
    var subscription = tx.objectStore('subscriptions');
    var officeTemplateCombo = subscription.index('validSubscription');
    var range = IDBKeyRange.only([office, template, status]);
    officeTemplateCombo.get(range).onsuccess = function (event) {
      if (!event.target.result) return resolve(null);
      return resolve(event.target.result);
    };
    tx.onerror = function () {
      return reject({
        message: tx.error,
        body: ''
      });
    };
  });
}
