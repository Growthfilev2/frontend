let worker;


function jobView() {
    progressBar.close();
    let duty;
    dom_root.classList.add('mdc-top-app-bar--fixed-adjust')
    dom_root.innerHTML = '';
    const header = setHeader(`<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a><span class="mdc-top-app-bar__title">Duty</span>`, ``);
    header.root_.classList.remove("hidden");
    getCurrentJob().then(function (currentDuty) {
        duty = currentDuty;
        duty.isActive = true
        return getCustomerPhoneNumber(currentDuty.attachment.Location.value)
    }).then(function (customerPhonenumber) {
        console.log(duty);
        duty.customerPhonenumber = customerPhonenumber;
        dom_root.appendChild(constructJobView(duty));
    
        if (duty.activityId) {
            updateTimer(duty.activityId)
            return
        }
        if (worker) {
            worker.terminate();
            worker = null;
        }
    });
};




function getCurrentJob() {
    return new Promise(function (resolve, reject) {
        const office = ApplicationState.selectedOffice;
        const tx = db.transaction('activity');
        const store = tx.objectStore('activity');
        const auth = firebase.auth().currentUser;

        let record = {
            attachment: {
                'Duty Type': {
                    value: '',
                    type: 'duty'
                },
                'Location': {
                    value: ApplicationState.venue ? ApplicationState.venue.location : ''
                },
                'Include': {
                    value: ''
                },
                'Supervisor': {
                    value: ''
                },
                'Products': {
                    value: [{
                        name: '',
                        rate: '',
                        date: '',
                        quanity: ''
                    }]
                }
            },
            "checkins": [],
            "calls": [],
            creator: {
                phoneNumber: '',
                displayName:'',
                photoURL:''
            },
            office: ApplicationState.selectedOffice,
            template: 'duty',
            schedule: [{
                startTime: Date.now(),
                endTime: Date.now(),
                name: 'Date'
            }],
            assignees: [{
                displayName: auth.displayName,
                photoURL: auth.photoURL,
                phoneNumber: auth.phoneNumber
            }],
            venue: [],
            canEdit: false,
            supervisior: null,
            isActive:false,
            timestamp: Date.now(),
        };
        const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(),moment().endOf('day').valueOf())
        store.index('timestamp').openCursor(bound).onsuccess = function (e) {
            const cursor = e.target.result;
            if (!cursor) return;
            if (cursor.value.office !== office) {
                cursor.continue();
                return;
            }
            if (cursor.value.template !== 'duty') {
                cursor.continue();
                return;
            };
            if(!isToday(cursor.value.schedule[0].startTime)) {
                cursor.continue();
                return;
            }
            if(!ApplicationState.venue) {
                cursor.continue();
                return
            }
            if(cursor.value.attachment.Location.value !== ApplicationState.venue.location)  {
                cursor.continue();
                return
            };
            console.log('matched location with duty location')
            console.log(record);
            record = cursor.value;
            cursor.continue();
        }
        tx.oncomplete = function () {
            resolve(record)
        }
    })
}


function handleFinishedDuty(duty) {
    const el = document.querySelector('#time-clock');
    el.innerHTML = duty.timer.time
}

function createAppHeader() {

    const header = setHeader(`
    <span class="mdc-top-app-bar__title">OnDuty</span>
    `, `<div class="mdc-menu-surface--anchor">
        <button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="Profile" id='settings-icon'>more_vert</button>
        <div class="mdc-menu mdc-menu-surface">
            <ul class="mdc-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
                <li class="mdc-list-item" role="menuitem">
                    <span class="mdc-list-item__text">Settings</span>
                </li>
            </ul>
        </div>
    </div>`);
    header.root_.classList.remove('hidden');
    const menu = new mdc.menu.MDCMenu(header.root_.querySelector('.mdc-menu-surface'));
    document.getElementById('settings-icon').addEventListener('click', function () {
        menu.open = true;
        menu.listen('MDCMenu:selected', function () {
            history.pushState(['profileScreen'], null, null);
            profileScreen();
        })
    });
    return header;
}

function updateTimer(activityId) {
    if (!worker) {
        worker = new Worker('js/timer-worker.js');
    }
    worker.onmessage = function (e) {
        const time = e.data;
        const el = document.querySelector('#time-clock');
        
        if (!el) return;
        // if(el.dataset.id !== activityId) return;
        el.innerHTML = time;
    }
    worker.postMessage({
        name: 'startTimer',
        uid: firebase.auth().currentUser.uid,
        dutyId: activityId,

    });
}


function getCustomerPhoneNumber(location) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction(['map', 'activity']);
        const mapStore = tx.objectStore('map');
        let activity;
        mapStore.index('location').get(location).onsuccess = function (e) {
            const record = e.target.result;
            if (!record) return resolve('');
            const activityStore = tx.objectStore('activity');
            activityStore.get(record.activityId).onsuccess = function (evt) {
                activity = evt.target.result;
                if (activity) {
                    resolve(activity.attachment['First Contact'].value || activity.attachment['Second Contact'].value)
                    return
                }
                resolve('')
            }
        }
    })
}

function getSupervisorContact(phoneNumber) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction('users');
        const store = tx.objectStore('users');

        store.get(phoneNumber).onsuccess = function (evt) {
            record = evt.target.result;
        }
        tx.oncomplete = function () {
            resolve(record)
        }
    })
}

function createDutyRejection() {
    const container = createElement("div", {
        className: 'full-width'
    })
    const textField = textAreaWithHelper({
        label: 'Reason',
        required: true
    });
    const field = new mdc.textField.MDCTextField(textField.querySelector('.mdc-text-field'))
    field.root_.classList.add('full-width');
    const reasonSubmit = createButton('submit');
    reasonSubmit.classList.add("mdc-button--raised", 'full-width');
    reasonSubmit.addEventListener('click', function () {
        reasonSubmit.toggleAttribute('disabled')
        if (!field.value.trim()) {
            setHelperInvalid(field, 'Please give a reason')
            return
        };
        setHelperValid(field);

        appLocation(3).then(function (geopoint) {
            return requestCreator('comment', {
                comment: field.value.trim()
            }, geopoint)
        }).then(function () {
            document.getElementById('dialog-container').innerHTML = ''
            reasonSubmit.toggleAttribute('disabled')
        }).catch(function () {
            reasonSubmit.toggleAttribute('disabled')
        })
    })

    container.appendChild(textField);
    container.appendChild(reasonSubmit);
    return container;
}

function showUpcomingDuty(duty) {

    const cont = createElement("div", {
        className: 'duty-pop--container'
    })
    const heading = createElement('div', {
        className: 'inline-flex full-width'
    })
    const reasonContainer = createElement('div', {
        className: 'reason--container mt-20 hidden'
    })
    // const reject = createButton('REJECT', '', 'close');
    // reject.classList.add('reject-duty');
    // reject.addEventListener('click',function(){
    //     reasonContainer.classList.remove('hidden')
    //     reasonContainer.appendChild(createDutyRejection());
    // })
    const close = createElement('i', {
        className: 'material-icons close-popup',
        textContent: 'close',
        style: 'margin-left:auto'
    })
    close.setAttribute('data-mdc-dialog-action', 'close')
    // heading.appendChild(reject)
    heading.appendChild(close)
    cont.appendChild(heading);
    cont.appendChild(reasonContainer);

    const details = createElement('div', {
        className: 'duty-popup--details'
    })
    details.innerHTML = `
    <div class='details'>
        <span class='inline-flex mb-10 mt-20'>
            <i class='material-icons mdc-theme--primary'>directions_bike</i>
            <span class='ml-10'>${duty.distance} Km</span>
        </span>
        <span class='inline-flex mb-10 mt-20'>
            <i class='material-icons mdc-theme--primary'>hourglass_top</i>
            <span class='ml-10'>${getTimeToReach(duty.distance,20)}</span>
        </span>
        <hr>
        <div class='customer mt-10'>
            <div class='inline-flex mt-10 mb-10 full-width mdc-theme--primary'>
                <i class='material-icons'>location_on</i>
                <span class='ml-10'>${duty.attachment.Location.value} </span>
            </div>
            ${duty.attachment['Duty Type'].value ?`<div class='inline-flex mt-10 mb-10 full-width mdc-theme--primary'>
                <i class='material-icons'>assignment</i>
                <span class='ml-10'>${duty.attachment['Duty Type'].value} </span>
            </div>` :''}
        </div>
        <hr>
        <div class='supervisior'>
            ${duty.supervisiorContact ? `<ul class='mdc-list mdc-list--two-line mdc-list--avatar-list'>
            <li class='mdc-list-item pl-0'>
               
                    <img class='mdc-list-item__graphic' src='${duty.supervisiorContact.photoURL || './img/empty-user.jpg'}'>
                    
                    <span class='mdc-list-item__text'>
                        <span class='mdc-list-item__primary-text'>${duty.supervisiorContact.displayName || duty.supervisiorContact.mobile}</span>
                        <span class="mdc-list-item__secondary-text">Supervisor</span>
                    </span>
                    <a class='mdc-list-item__meta material-icons' href='tel:${duty.supervisiorContact.mobile}'>phone</a>
            </li>
        </ul>` :''}
           
            <span class='inline-flex mt-10 mb-10 full-width'>
                <i class='material-icons mdc-theme--primary'>access_time</i>
                <span class='ml-10'>${moment(duty.schedule[0].startTime).format('hh:mm A')} to ${moment(duty.schedule[0].endTime).format('hh:mm A')} </span>
            </span>
        </div>
        ${duty.assignees.length ? ` <hr><div class='staff mdc-theme--primary'>
            <span class='inline-flex mt-10 mb-10 full-width'>
                <i class='material-icons'>group</i>
                <span class='ml-10'>Staffs</span>
            </span>
            <div class='mdc-chip-set'>
                ${duty.assignees.map(function(contact,index){
                    const image = createElement('img', {
                        className: 'mdc-chip__icon mdc-chip__icon--leading',
                        src: contact.photoURL || './img/empty-user.jpg'
                    })
                    return createDynamicChips(contact.displayName || contact.mobile, index, image).outerHTML;
                }).join("")}
                </div>
            </div>` :''}
        
        ${checkProductLength(duty.attachment.Products.value) ? `<hr><div class='products'>
            <span class='inline-flex mt-10 mb-10 full-width'>
                <i class='material-icons'>settings</i>
                <span class='ml-10'>Products</span>
            </span>
            <ul class='mdc-list mdc-list--two-line'>
            ${duty.attachment.Products.value.map(function(product){
                return `<li class='mdc-list-item'>
                    <span class='mdc-list-item__text'>
                        <span class='mdc-list-item__primary-text'>${product.name}</span>
                        <span class='mdc-list-item__secondary-text'>Quantity : ${product.quanity}</span>
                    </span>
                    <span class='mdc-list-item__meta'>${convertNumberToINR(Number(product.rate))}</span>
                </li>`
            })}
            </ul>
        </div>` :''}
    </div>
    <div class='navigate text-center mt-10'>
        ${createExtendedFab('navigation','Navigate','navigate','',`https://www.google.com/maps/dir/?api=1&origin=${ApplicationState.location.latitude}%2C${ApplicationState.location.longitude}&destination=${duty.coords.latitude}%2C${duty.coords.longitude}`).outerHTML}
    </div>
    `

    cont.appendChild(details)

    const dialog = new Dialog('', cont, 'duty-dialog').create('simple')
    dialog.open();
    dialog.scrimClickAction = '';
    dialog.content_.querySelector('#navigate').setAttribute('data-mdc-dialog-action', 'accept')
    console.log(dialog);
}

function getTimeToReach(distance, speed) {

    const time = distance / speed;
    if (time < 1) return `${(time.toFixed(1) * 40)} minutes`;
    return `${time.toFixed(1)} Hours`
}

function dutyScreen(duty) {
    const container = createElement('div', {
        className: 'duty-container'
    })
    container.innerHTML = `<div class='mdc-card duty-overview'>
       <div class='duty-details pt-10'>
           <div class='customer'>
               <div class='location full-width mb-10'>
                   <div class='icon' style='float:left;'>
                       <i class='material-icons mdc-theme--primary'>location_on</i>
                   </div>
                   <div class='text mdc-typography--headline6 ml-10'>
                      ${duty.attachment.Location.value || '-'}
                    </div>
                </div>
                ${duty.customerPhonenumber ?`
                    <span class='inline-flex mb-10 customer-contact'>
                    <i class='material-icons mdc-theme--secondary'>phone</i>
                    <span class='mdc-typography--headline6 ml-10'>
                        <a href='tel:${duty.customerPhonenumber}'>${duty.customerPhonenumber}</a>
                    </span>
                </span>` :''}            
           </div>
           <div class='full-width mb-10 mt-10 counter-container text-center'>
                
        
                ${duty.isActive ? `
                <div class='mdc-typography--headline6 bold' style='color:#7C909E;'>Duty started ${duty.creator.phoneNumber ? '' :`at ${formatCreatedTime(duty.schedule[0].startTime)}`}</div>
                <div id='time-clock' class='mdc-typography--headline3 bold mb-10' data-id="${duty.activityId}"></div>
                <div class='finish-button--container mt-20'>
                        ${createExtendedFab('check','finish job','finish').outerHTML}
                </div>` :''}

                ${duty.creator.phoneNumber || !duty.isActive ?`<div class='schedule mt-10 text-left'>
                    <span class='inline-flex'>
                        <i class='material-icons  mdc-theme--secondary'>access_time</i>
                        <span class='mdc-typography--headline6 ml-10'>${showDutySchedule(duty)}</span>
                    </span>
                </div>` :''}
           </div>
           ${duty.attachment['Duty Type'].value ? `<div class='duty-type'>
                <span class='inline-flex mb-10'>
                    <i class='material-icons mdc-theme--secondary'>assignment</i>
                    <span class='mdc-typography--headline6 ml-10'>${duty.attachment['Duty Type'].value || '-'} </span>
                </span>
            </div>` :''}
           <div class='staff mt-10'>
                <span class='inline-flex'>
                    <i class='material-icons mdc-theme--secondary'>group_add</i>
                    <span class='mdc-typography--headline6 ml-10'>Staff</span>
                </span>
                <div class="mdc-chip-set" role="grid">
                    ${viewAssignee(duty)}
                </div>
            </div>

           <div class='products'>
           ${checkProductLength(duty.attachment.Products.value) ? `
               <span class='inline-flex'>
                   <i class='material-icons mdc-theme--secondary'>settings</i>
                   <span class='mdc-typography--headline6 ml-10'>Products</span>
               </span>
               <ul class='mdc-list mdc-list--two-line'>
                    ${duty.attachment.Products.value.map(function(product){
                       return `<li class='mdc-list-item'>
                           <span class='mdc-list-item__text'>
                               <span class='mdc-list-item__primary-text'>${product.name}</span>
                               <span class='mdc-list-item__secondary-text'>Quantity : ${product.quanity}</span>
                           </span>
                           <span class='mdc-list-item__meta'>${convertNumberToINR(Number(product.rate))}</span>
                       </li>`
                   })}
               </ul>`
               :''}
           </div>
       </div>
   </div>`
    return container;
}

function showDutySchedule(duty) {

    return `${moment(duty.schedule[0].startTime).format('hh:mm A')} to ${moment(duty.schedule[0].endTime).format('hh:mm A')}`
}


const createImageLi = (url, supportingText) => {
    const li = createElement('li', {
        className: 'mdc-image-list__item'
    })
    li.innerHTML = `<div class="mdc-image-list__image-aspect-container">
                <img class="mdc-image-list__image" src="${url}" alt="Text label">
        </div>
        <div class="mdc-image-list__supporting">
            <span class="mdc-image-list__label">${supportingText}</span>
        </div>`;
    return li;
}

function constructJobView(duty) {
    if (duty.canEdit && duty.isActive) {
        const editBtn = createElement('button', {
            className: 'material-icons mdc-top-app-bar__action-item mdc-icon-button',
            textContent: 'edit',
            id: 'edit-duty'
        })
        editBtn.addEventListener('click', function () {
            history.pushState(['updateDuty'], null, null);
            updateDuty(duty);
        })
        document.getElementById('section-end').insertBefore(editBtn, document.getElementById('section-end').firstChild)
    }
    const el = createElement('div', {
        className: 'mdc-layout-grid job-screen'
    })
    
    el.appendChild(dutyScreen(duty));
    const timeline = createElement('div', {
        className: 'mdc-card timeline-overview mt-10'
    })
    const imageList = createElement('ul', {
        className: 'mdc-image-list standard-image-list mdc-image-list--with-text-protection'
    })
    if (duty.hasOwnProperty('checkins')) {
        duty.checkins.forEach(function (activity) {
            if (activity.attachment.Photo.value) {

                const imageLi = createImageLi(activity.attachment.Photo.value, formatCreatedTime(activity.timestamp))
                imageLi.addEventListener('click', function () {
                    const cont = createElement('div', {
                        className: 'full-width'
                    })
                    const ul = createElement('ul', {
                        className: 'mdc-list mdc-list--two-line mdc-list--avatar-list pt-0'
                    })
                    const creatorLi = createElement('li', {
                        className: 'mdc-list-item pl-0 pr-0'
                    })
                    creatorLi.innerHTML = `<img src="${activity.creator.photoURL || './img/empty-user.jpg'}" class="mdc-list-item__graphic">
                    <span class="mdc-list-item__text">
                           <span class="mdc-list-item__primary-text">${activity.creator.displayName || activity.creator.phoneNumber}</span>
                           <span class="mdc-list-item__secondary-text">${formatCreatedTime(activity.timestamp)}</span>
                       </span>`
                    ul.appendChild(creatorLi);

                    cont.appendChild(ul);
                    if (activity.attachment.Comment.value) {
                        cont.appendChild(createElement('p', {
                            className: 'mdc-typography--body1 mt-0',
                            textContent: activity.attachment.Comment.value
                        }));
                    }
                    cont.appendChild(createElement('img', {
                        src: activity.attachment.Photo.value,
                        style: 'width:100%'
                    }))
                    const dialog = new Dialog('', cont).create('')
                    dialog.open();
                })

                imageList.appendChild(imageLi);
            }
        });
    };

    if (imageList.childElementCount) {
        timeline.appendChild(imageList);
    };

    if(duty.isActive) {
        const finish = el.querySelector('#finish');
        finish.classList.add('mdc-button--raised');
        finish.addEventListener('click', function () {
            getRatingSubsription(duty)
        });
        const photoBtn = createExtendedFab('add_a_photo', 'Upload photo', '', true);
        photoBtn.style.zIndex = '99'
        photoBtn.addEventListener('click', function () {
            history.pushState(['cameraView'], null, null)
            openCamera()
        });
        el.appendChild(photoBtn);

    }

    el.appendChild(timeline)
    return el;
}

function getRatingSubsription(duty) {
    getSubscription(duty.office, 'call').then(function (subs) {
        console.log(subs)
        if (!subs.length) {

            markDutyFinished({
                dutyId: duty.activityId,
                office: duty.office
            });
            return
        }
        const tx = db.transaction('map');
        const store = tx.objectStore('map');
        let customer;
        store.index('location').get(duty.attachment.Location.value).onsuccess = function (evt) {
            customer = evt.target.result;
        }
        tx.oncomplete = function () {
            if (!customer) {
                customer = {
                    location: '',
                    address: '',
                    latitude: '',
                    longitude: ''
                }
            }
            if (subs.length == 1) return showRating(subs[0], customer, duty.activityId);
            const officeDialog = new Dialog('Choose office', officeSelectionList(subs), 'choose-office-subscription').create('simple');
            const officeList = new mdc.list.MDCList(document.getElementById('dialog-office'))
            bottomDialog(officeDialog, officeList)
            officeList.listen('MDCList:action', function (officeEvent) {
                officeDialog.close();
                const selectedSubscription = subs[officeEvent.detail.index];
                showRating(selectedSubscription, customer, duty.activityId);
            })
        }
    })
}

function checkProductLength(products) {
    return products.filter(function (product) {
        return product.name
    }).length
}

// function getTimelineFillValue(firstActivityTimestamp, lastActivityTimestamp) {
//     if (lastActivityTimestamp) {
//         const diff = moment(lastActivityTimestamp).diff(moment(firstActivityTimestamp))
//         const duration = moment.duration(diff).asHours();
//         const timePercentage = (duration / 12) * 100;
//         return (360 * timePercentage) / 100
//     }
//     return 1;
// }

function getTimelineAddendum(geopoint) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction('addendum');
        const store = tx.objectStore('addendum');
        const unique = {}

        const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(), moment().endOf('day').valueOf())
        store.index('timestamp').openCursor(bound).onsuccess = function (evt) {
            const cursor = evt.target.result;
            if (!cursor) return;
            if (typeof cursor.value.location !== 'object') {
                cursor.continue();
                return
            }
            if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints({
                    latitude: cursor.value.location._latitude,
                    longitude: cursor.value.location._longitude
                }, geopoint))) {

                cursor.continue();
                return
            }
            unique[cursor.value.activityId] = cursor.value;
            cursor.continue();
        }
        tx.oncomplete = function () {
            const result = []
            console.log(result);
            Object.keys(unique).forEach(function (id) {
                result.push(unique[id])
            })
            const sorted = result.sort(function (first, second) {
                return second.timestamp - first.timestamp
            })
            resolve(sorted)
        }
    })
}


function getTimelineActivityData(addendums, office) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction('activity');
        const store = tx.objectStore('activity');
        const filteredResult = {
            currentDuty: '',
            timelineData: []
        };
        addendums.forEach(function (addendum) {
            if (!addendum.activityId) return;
            store.get(addendum.activityId).onsuccess = function (evt) {
                const record = evt.target.result;
                if (!record) return;
                if (record.office !== office) return;
                if (addendum.timestamp === ApplicationState.lastCheckInCreated && record.template === 'duty') {
                    filteredResult.currentDuty = record;
                }
                record.geopoint = addendum.geopoint
                filteredResult.timelineData.push(record)
            }
        })
        tx.oncomplete = function () {
            resolve(filteredResult)
        }
    })
}

function createTimeLapse(timeLineUl) {
    const header = setHeader(`<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">History</span>
    `, '');
    const timeLine = createElement('div', {
        className: 'timeline'
    })
    const historyCont = createElement('div', {
        className: 'history-tl-container'
    })
    historyCont.appendChild(timeLineUl);

    const screen = createElement('div', {
        className: 'timeline--container',
    })
    timeLine.appendChild(historyCont);

    dom_root.innerHTML = '';
    screen.appendChild(timeLine);
    const bottomContainer = createElement('div', {
        className: 'timeline--footer'
    })

    const close = createButton('close')
    close.classList.add("mdc-button--raised", 'rounded-close');
    close.addEventListener('click', function () {
        history.back();
    })
    bottomContainer.appendChild(close);
    screen.appendChild(bottomContainer)

    dom_root.appendChild(screen);

}




function createTimelineLi(activity) {
    const eventName = mapTemplateNameToTimelineEvent(activity)
    const li = createElement("li", {
        className: `tl-item ${activity.template}`
    })
    li.dataset.activity = JSON.stringify(activity);

    const div = createElement('div', {
        className: 'item-title',
        textContent: eventName
    })
    const span = createElement('span', {
        className: 'event-time mdc-typography--caption',
        textContent: moment(activity.timestamp).format('hh:mm A')
    })
    li.addEventListener('click', function () {
        const activity = JSON.parse(li.dataset.activity)
        const heading = createActivityHeading(activity)
        showViewDialog(heading, activity, 'view-form')
    })
    li.appendChild(div);
    li.appendChild(span);
    return li
}

function mapTemplateNameToTimelineEvent(activity) {

    if (activity.template === 'check-in') {
        if (activity.attachment.Photo.value) return 'Uploaded photo'
        return 'Check-In'
    }

    if (activity.template === 'leave') {
        return "On leave"
    }
    return 'Created ' + activity.template;
}

function checkForDuty(duty) {
    // db.transaction('activity').objectStore('activity').get('d1EbIdtHvw1x51yAcbFd').onsuccess = function(e){
    //     const duty = e.target.result;
    // if (duty.schedule[0].startTime <= Date.now()) return;
    if (duty.schedule[0].endTime < Date.now()) return;

    const tx = db.transaction('map');
    const store = tx.objectStore('map');
    store.index('location').get(duty.attachment.Location.value).onsuccess = function (evt) {
        const record = evt.target.result;
        if (!record) return;
        duty.distance = calculateDistanceBetweenTwoPoints(record, ApplicationState.location).toFixed(1)
        duty.coords = record;
    }
    tx.oncomplete = function () {
        getSupervisorContact(duty.attachment.Supervisor.value).then(function (supervisiorContact) {

            duty.supervisiorContact = supervisiorContact;
            showUpcomingDuty(duty);
        })
    }

    // }
}


function getAllCustomer(office) {
    return new Promise(function (resolve, reject) {


        const tx = db.transaction('map');
        const store = tx.objectStore('map');
        const result = []
        store.index('office').openCursor(office).onsuccess = function (evt) {
            const cursor = evt.target.result;
            if (!cursor) return;
            if (!cursor.value.location || !cursor.value.address) {
                cursor.continue();
                return;
            }
            if (cursor.value.template !== 'customer') {
                cursor.continue();
                return;
            }
            result.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function () {
            resolve(result)
        }
    })
}

function getChildrenActivity(office, template) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('children');
        const store = tx.objectStore("children");
        const result = [];
        store.index('officeTemplate').openCursor([office, template]).onsuccess = function (evt) {
            const cursor = evt.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return
            }
            result.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function () {
            resolve(result)
        }
    })
}


function showRating(callSubscription, customer, dutyId) {
    history.pushState(['showRating'], null, null);

    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title mdc-typography--headline5 bold">How was your job ?</span>
    `
    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden');
    dom_root.innerHTML = `
    <div id='rating-view'>
        <iframe id='rating-form' src='${window.location.origin}/v2/forms/rating/index.html'></iframe>;
    </div>`
    Promise.all([getChildrenActivity(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'customer'), getAllCustomer(callSubscription.office)]).then(function (response) {
        const products = response[0];
        const productSubscription = response[1];
        const customerSubscription = response[2];
        const customers = response[3];
        document.getElementById('rating-form').addEventListener("load", ev => {
            passFormData({
                name: 'init',
                template: callSubscription,
                body: {
                    products: products,
                    customers: customers,
                    customer: customer,
                    canEditProduct: productSubscription,
                    canEditCustomer: customerSubscription,
                    dutyId: dutyId
                },
                deviceType: native.getName()
            });
        })
    })

}


function convertNumberToINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount)
}




function updateDuty(duty) {
    const header = setHeader(`<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a><span class="mdc-top-app-bar__title">Edit duty</span>`,``)
    const container = createElement('div', {
        className: 'update-duty--container'
    })
    const progressBarCard = linearProgress();
    container.appendChild(progressBarCard.root_)
    const customerCard = createElement('div', {
        className: 'mdc-card customer-card'
    })
    customerCard.appendChild(createElement('h1', {
        className: 'mdc-typography--headline5 mdc-theme--primary',
        textContent: 'Customer'
    }))
    const customerName = new mdc.textField.MDCTextField(textField({
        label: 'Name',
        value: duty.attachment.Location.value
    }))

    customerCard.appendChild(customerName.root_);
    customerName.focus();
    const productsCard = createElement('div', {
        className: 'mdc-card product-card  mt-10'
    })
    productsCard.appendChild(createElement('h1', {
        className: 'mdc-typography--headline5 mdc-theme--primary',
        textContent: 'Products'
    }))

    const ul = createElement('ul', {
        className: 'mdc-list',
        id: 'product-list'
    })
    getChildrenActivity(duty.office, 'product').then(function (products) {
        if (checkProductLength(duty.attachment.Products.value)) {
            duty.attachment.Products.value.forEach(function (product) {
                createProductLi(products, product)
            })
        }
        productsCard.appendChild(ul)
        if (!products.length) return
        const addMore = createFab('add', '', false);
        addMore.classList.add('add-more--products')
        addMore.addEventListener('click', function () {
            openProductScreen(products);
        })
        const addMoreWrapper = createElement('div', {
            className: 'add-more--wrapper',
        })
        addMoreWrapper.appendChild(addMore)
        productsCard.appendChild(addMoreWrapper)
    })

    const cancel = createButton('cancel');
    cancel.classList.add('mdc-button--outlined')
    const save = createButton('save');
    save.classList.add('mdc-button--raised');
    cancel.addEventListener('click', function () {
        history.back();
    })
    save.addEventListener('click', function () {
        console.log('saved click');
        progressBarCard.open()
        duty.attachment.Location.value = customerName.value;
        const choosenProducts = [];
        [...ul.querySelectorAll('li')].forEach(function (li) {
            choosenProducts.push({
                name: li.dataset.name,
                rate: Number(li.dataset.rate) || '',
                quanity: Number(li.dataset.quanity) || '',
                date: li.dataset.date
            })
        });
        duty.attachment.Products.value = choosenProducts;
        appLocation(3).then(function (geopoint) {
            return requestCreator('update', duty, geopoint)
        }).then(function () {
            progressBarCard.close()
            history.back();
        }).catch(handleLocationError)
    })

    const fixed = createElement('div', {
        className: 'full-width bottom-buttons'
    })
    const actionButtons = createElement('div', {
        className: 'action-buttons'
    })
    fixed.appendChild(actionButtons);
    actionButtons.appendChild(cancel)
    actionButtons.appendChild(save);

    container.appendChild(customerCard)
    container.appendChild(productsCard);
    container.appendChild(fixed);
    dom_root.innerHTML = '';
    dom_root.appendChild(container)
}

function createProductLi(products, product) {
    const li = createElement('li', {
        className: 'mdc-list-item',
        textContent: product.name
    })

    li.dataset.name = product.name;
    li.dataset.date = product.date;
    li.dataset.quantity = product.quantity;
    li.dataset.rate = product.rate;

    const edit = createElement('span', {
        className: 'mdc-list-item__meta material-icons mdc-theme--primary',
        textContent: 'edit'
    });
    edit.addEventListener('click', function () {
        openProductScreen(products, product)
    })
    const remove = createElement('span', {
        className: 'mdc-list-item__meta material-icons mdc-theme--error ml-20',
        textContent: 'delete'
    })
    remove.addEventListener('click', function () {
        li.remove();
    })
    li.appendChild(edit)
    li.appendChild(remove)
    return li;
}

function openProductScreen(products, selectedProduct) {
    productDialog = new Dialog("New product", createProductScreen(products, selectedProduct)).create('simple')
    productDialog.open();
}

function createProductScreen(products, savedProduct = {
    rate: '',
    date: '',
    quantity: '',
    name: ''
}) {
    const div = createElement('div', {
        className: 'product-choose-container'
    })
    const name = createProductSelect(products);
    if (savedProduct.name) {
        name.value = savedProduct.name
    }
    const rate = new mdc.textField.MDCTextField(textField({
        id: 'rate',
        label: 'Rate',
        type: 'number',
        value: savedProduct.rate || ''
    }));
    const quantity = new mdc.textField.MDCTextField(textField({
        id: 'quantity',
        label: 'Quantity',
        type: 'number',
        value: savedProduct.quantity || ''
    }));
    const date = new mdc.textField.MDCTextField(textField({
        id: 'date',
        type: 'date',
        label: 'Date',
        value: savedProduct.data || createDate(new Date())
    }));
    div.appendChild(name.root_);
    div.appendChild(rate.root_);
    div.appendChild(quantity.root_);
    div.appendChild(date.root_);
    const actionButtons = createElement('div', {
        className: 'dialog-action-buttons'
    })
    const cancel = createButton('cancel');
    cancel.addEventListener('click', function (e) {
        e.preventDefault();
        productDialog.close();
    })
    const save = createButton('save');
    save.classList.add("mdc-button--raised");
    actionButtons.appendChild(cancel);
    actionButtons.appendChild(save);
    save.addEventListener('click', function (e) {
        e.preventDefault();

        productDialog.close();
        if (!name.value) {
            showSnacksApiResponse('Please select a product name');
            return
        }
        if (document.querySelector(`[data-product-name="${name.value}"]`)) {
            document.querySelector(`[data-product-name="${name.value}"]`).remove()
        }
        const selectedProduct = {
            rate: Number(rate.value),
            date: date.value,
            quantity: Number(quantity.value),
            name: name.value
        }
        const ul = document.getElementById('product-list');
        [...ul.querySelectorAll('li')].forEach(function (li) {
            if (li.dataset.name === name.value) {
                li.remove();
            }
        })
        ul.appendChild(createProductLi(products, selectedProduct))

    })
    div.appendChild(actionButtons)
    return div;

}


function appView() {
    createAppHeader();
    const tabs = [{
        id: 'home-icon',
        icon: 'home',
        name: 'Home'
    }, {
        id: 'contacts-icon',
        icon: 'contacts',
        name: 'Contacts'
    }]
    dom_root.classList.add('mdc-top-app-bar--fixed-adjust')
    dom_root.innerHTML = `
      <div class='tabs-section app-tabs'>
          ${showTabs(tabs)}
          <div id='app-tab-content'></div>
      </div>`
    appTabBar = new mdc.tabBar.MDCTabBar(document.querySelector('.mdc-tab-bar'))
    appTabBar.listen('MDCTabBar:activated', function (evt) {
        if (document.getElementById('search-btn')) {
            document.getElementById('search-btn').remove();
        }
        if (evt.detail.index == 0) {
            showAllDuties();
            return
        }
        if (evt.detail.index == 1) {
            chatView()
            return
        }
    });
    appTabBar.activateTab(0)
}






function showAllDuties() {
    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');

    const dutiesCont = createElement('div', {
        className: 'all-duties'
    })
    const dutiesUl = createElement('ul', {
        className: 'mdc-list mdc-list--two-line mdc-list--avatar-list duties--ul'
    })

    const activities = []
    store.index('template').openCursor('duty').onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (!cursor) return;

        if (!Array.isArray(cursor.value.schedule)) {
            cursor.continue();
            return
        }
        if (!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
            cursor.continue();
            return
        }
        activities.push(cursor.value)
        cursor.continue()
    }
    tx.oncomplete = function () {

        const sortedDates = activities.sort(function (a, b) {
            return b.timestamp - a.timestamp;
        })
        const hasMultipleOffice = Object.keys(ApplicationState.officeWithCheckInSubs).length > 1;
        sortedDates.forEach(function (activity) {

            const li = dutyDateList(activity, hasMultipleOffice);
            li.addEventListener('click', function () {
                if (activity.timestamp === ApplicationState.lastCheckInCreated) {
                    history.pushState(['jobView'],null,null)
                    jobView();
                    return
                }
                getCustomerPhoneNumber(activity.attachment.Location.value).then(function (customerPhonenumber) {
                    history.pushState(['jobView'],null,null)
                    const header = setHeader(`<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a><span class="mdc-top-app-bar__title">Duty</span>`, ``);
                    activity.customerPhonenumber = customerPhonenumber;
                    dom_root.innerHTML = '';
                    if (worker) {
                        worker.terminate();
                        worker = null;
                    }
                    activity.isActive = false;
                    dom_root.appendChild(constructJobView(activity));
                })
            })
            dutiesUl.appendChild(li);
            dutiesUl.appendChild(createElement('li', {
                className: 'mdc-list-divider'
            }))
        })
        dutiesCont.appendChild(dutiesUl);
        new mdc.list.MDCList(dutiesUl)
        getReportSubscriptions('attendance').then(function (subs) {
            if (!subs.length) return;
            dutiesCont.appendChild(createTemplateButton(subs))
        })
        const el = document.getElementById('app-tab-content');
        el.innerHTML = ``;
        el.appendChild(dutiesCont);
    }
}



function dutyDateList(duty, multipleOffice) {
    const li = createElement('li', {
        className: 'mdc-list-item'
    })

    if (multipleOffice) {
        li.classList.add('mdc-list--with-office')
    }
    li.innerHTML = `<span class="mdc-list-item__text">
      
        <span class="mdc-list-item__primary-text">
            ${duty.timestamp === ApplicationState.lastCheckInCreated ? `<span class='active'>●</span>`:''}
            ${duty.attachment.Location.value}
        </span>
        <span class="mdc-list-item__secondary-text bold">
            ${formatCreatedTime(duty.schedule[0].startTime)} - ${formatCreatedTime(duty.schedule[0].endTime)}
        </span>
        ${multipleOffice ?  `<span class="mdc-list-item__secondary-text">
            ${duty.office}
        </span>` :''}
        
    </span>`
    new mdc.ripple.MDCRipple(li);
    return li
}

function createProductSelect(products) {

    const select = createElement('div', {
        className: 'mdc-select full-width',

    })
    select.innerHTML = `<i class="mdc-select__dropdown-icon"></i>
                        <select class="mdc-select__native-control">
                            ${products.map(function(product){
                                return `<option value="${product.attachment.Name.value}">${product.attachment.Name.value}</option>`
                            }).join("")}
                        </select>
                        <label class="mdc-floating-label">Choose product</label>
                        <div class="mdc-line-ripple"></div>`;

    return new mdc.select.MDCSelect(select);
}

function createDate(dateObject) {
    console.log(dateObject)
    let month = dateObject.getMonth() + 1;
    let date = dateObject.getDate()
    if (month < 10) {
        month = '0' + month
    }
    if (date < 10) {
        date = '0' + date
    };

    return `${dateObject.getFullYear()}-${month}-${date}`
}

function getDutyStatus(duty) {
    const currentTimestamp = Date.now()
    if (duty.schedule[0].endTime < currentTimestamp) return 'Finished';
    if (duty.schedule[0].startTime > currentTimestamp) return 'Upcoming';
    if (duty.schedule[0].startTime <= currentTimestamp && currentTimestamp <= duty.schedule[0].endTime) return 'Open';
}



function createTemplateButton(subs) {

    const button = createFab('add')
    button.addEventListener('click', function () {
        if (subs.length == 1) {
            history.pushState(['addView'], null, null);
            addView(subs[0])
            return
        }

        const uniqueSubs = {}
        subs.forEach(function (sub) {
            if (!uniqueSubs[sub.template]) {
                uniqueSubs[sub.template] = [sub]
            } else {
                uniqueSubs[sub.template].push(sub)
            }
        })

        const dialog = new Dialog('', templateSelectionList(uniqueSubs), 'choose-office-subscription').create('simple');
        const ul = new mdc.list.MDCList(document.getElementById('dialog-office'))
        bottomDialog(dialog, ul)

        ul.listen('MDCList:action', function (subscriptionEvent) {
            const selectedSubscriptions = uniqueSubs[Object.keys(uniqueSubs)[subscriptionEvent.detail.index]];
            dialog.close()
            if (selectedSubscriptions.length == 1) {
                history.pushState(['addView'], null, null);
                addView(selectedSubscriptions[0])
                return
            }
            const officeDialog = new Dialog('Choose office', officeSelectionList(selectedSubscriptions), 'choose-office-subscription').create('simple');
            const officeList = new mdc.list.MDCList(document.getElementById('dialog-office'))
            bottomDialog(officeDialog, officeList)
            officeList.listen('MDCList:action', function (officeEvent) {
                const selectedSubscription = selectedSubscriptions[officeEvent.detail.index];
                officeDialog.close();
                history.pushState(['addView'], null, null);
                addView(selectedSubscription)
            })
        })
    })
    return button;

}



function getReportSubscriptions(name) {
    return new Promise(function (resolve, reject) {
        const result = []
        const tx = db.transaction('subscriptions');
        const store = tx.objectStore('subscriptions').index('report');
        store.openCursor(name).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
            if (cursor.value.template === 'attendance regularization') {
                cursor.continue();
                return;
            }
            result.forEach(function (sub, index, object) {
                if (sub.office === cursor.value.office && sub.template === cursor.value.template) {
                    if (!sub.hasOwnProperty('timestamp') || !cursor.value.hasOwnProperty('timestamp')) {
                        object.splice(index, 1)
                    } else {
                        if (sub.timestamp < cursor.value.timestamp) {
                            object.splice(index, 1)
                        }
                    }
                }
            })
            result.push(cursor.value);
            cursor.continue();
        }
        tx.oncomplete = function () {
            console.log(result)
            resolve(result);
        }
    });
}


function showTabs(tabs) {

    return `<div class="mdc-tab-bar" role="tablist">
      <div class="mdc-tab-scroller">
        <div class="mdc-tab-scroller__scroll-area">
          <div class="mdc-tab-scroller__scroll-content">
        
            ${tabs.map(function(tab){
                return `
                <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1" id=${tab.id || ''}>
                <span class="mdc-tab__content">
                  <span class="mdc-tab__text-label">${tab.name}</span>
                  <span class="mdc-tab-indicator">
                    <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
                  </span>
                </span>
                <span class="mdc-tab__ripple"></span>
              </button>`
            }).join("")}
          </div>
        </div>
      </div>
    </div>`
}