function jobView() {
    const parent = document.getElementById('app-current-panel')
    parent.innerHTML = '';
    parent.classList.remove('mdc-top-app-bar--fixed-adjust')
    document.getElementById('app-header').classList.add('hidden')
    getTimelineAddendum(ApplicationState.location).then(function (addendums) {
            return getTimelineActivityData(addendums)
        })
        .then(function (result) {
            if (!result.currentDuty) {
                const auth = firebase.auth().currentUser
                result.currentDuty = {
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
                    office:'Puja Capital',
                    template:'duty',
                    activityId:'AF1Pa6h3BTPYGnHdfLIK',
                    schedule: [{
                        startTime: '',
                        endTime: '',
                        name: 'Date'
                    }],
                    assignees: [{
                        displayName: auth.displayName,
                        photoURL: auth.photoURL,
                        phoneNumber: auth.phoneNumber
                    }],
                    venue: [],
                    canEdit: true,
                    supervisior: null
                }
            }

            parent.appendChild(constructJobView(result));
        }).catch(console.error)

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

function createDutyRejection(){
    const container = createElement("div",{
        className:'full-width'
    })
    const textField  = textAreaWithHelper({
        label:'Reason',
        required:true
    });
    const field = new mdc.textField.MDCTextField(textField.querySelector('.mdc-text-field'))
    field.root_.classList.add('full-width');
    const reasonSubmit = createButton('submit');
    reasonSubmit.classList.add("mdc-button--raised",'full-width');
    reasonSubmit.addEventListener('click',function(){
        reasonSubmit.toggleAttribute('disabled')
        if(!field.value.trim()) {
            setHelperInvalid(field,'Please give a reason')
            return
        };
        setHelperValid(field);

        appLocation(3).then(function(geopoint){
            return  requestCreator('comment',{
                comment:field.value.trim()
            },geopoint)
        }).then(function(){
            document.getElementById('dialog-container').innerHTML = ''
            reasonSubmit.toggleAttribute('disabled')
        }).catch(function(){
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
    const reasonContainer = createElement('div',{
        className:'reason--container mt-20 hidden'
    })
    const reject = createButton('REJECT', '', 'close');
    reject.classList.add('reject-duty');
    reject.addEventListener('click',function(){
        reasonContainer.classList.remove('hidden')
        reasonContainer.appendChild(createDutyRejection());
    })
    const close = createElement('i', {
        className: 'material-icons close-popup',
        textContent: 'close',
        style: 'margin-left:auto'
    })
    close.setAttribute('data-mdc-dialog-action', 'close')
    heading.appendChild(reject)
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
                    <a class='mdc-list-item__meta material-icons' href='${duty.supervisiorContact.mobile}'>phone</a>
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

function getTimeToReach(distance,speed) {

    const time = distance/speed;
    if(time < 1) return `${(time.toFixed(1) * 40)} minutes`;
    return `${time.toFixed(1)} Hours`
}

function dutyScreen(duty) {
    const container = createElement('div', {
        className: 'duty-container'
    })
    container.innerHTML = `<div class='mdc-card duty-overview'>
      ${duty.canEdit ? `<i class='material-icons mdc-theme--primary text-right' id='edit'>edit</i>` :''}
       <div class='duty-details'>
           <div class='customer'>
               <div class='location full-width mb-10'>
                   <div class='icon mdc-theme--primary' style='float:left;'>
                       <i class='material-icons'>location_on</i>
                   </div>
                   <div class='text mdc-typography--headline6 ml-10'>
                      ${duty.attachment.Location.value || '-'}
                      <a href=''></a>
                   </div>
               </div>
           </div>
           <div class='duty-type mb-10'>
               <span class='inline-flex mdc-theme--primary mb-10'>
                   <i class='material-icons'>assignment</i>
                   <span class='mdc-typography--headline6 ml-10'>${duty.attachment['Duty Type'].value || '-'} </span>
               </span>
           </div>
           <div class='products'>
           ${checkProductLength(duty.attachment.Products.value) ? `
               <span class='inline-flex mdc-theme--primary'>
                   <i class='material-icons'>settings</i>
                   <span class='mdc-typography--headline6 ml-10'>Products</span>
               </span>
               <ul class='mdc-list mdc-list--two-line'>
                    ${duty.attachment.Products.value.map(function(product){
                       return `<li class='mdc-list-item'>
                           <span class='mdc-list-item__text'>
                               <span class='mdc-list-item__primary-text'>${product.name}</span>
                               <span class='mdc-list-item__secondary-text'>Quantity : ${product.quanity}</span>
                           </span>
                           <span class='mdc-list-item__meta'>${convertNumberToInr(Number(product.rate))}</span>
                       </li>`
                   })}
               </ul>`
               :''}
           </div>
           <div class='expanded-details hidden'>
               <hr>
               <span class='inline-flex mdc-theme--primary'>
                   <i class='material-icons'>access_time</i>
                   <span class='mdc-typography--headline6 ml-10'>${duty.schedule[0].startTime ? `${moment(duty.schedule[0].startTime).format('hh:mm A')} to ${moment(duty.schedule[0].endTime).format('hh:mm A')}` : '-'} </span>
               </span>
               <hr>
               <div class='staff'>
                   <span class='inline-flex mdc-theme--primary'>
                       <i class='material-icons'>group_add</i>
                       <span class='mdc-typography--headline6 ml-10'>Staff</span>
                   </span>
                   <div class="mdc-chip-set" role="grid">
                       ${viewAssignee(duty)}
                   </div>
                   ${createButton('Add','add-more--users','add').outerHTML}
               </div>
           </div>
           <div class='expand text-center'>
               <i class='material-icons' id='expand'>expand_more</i>
           </div>
       </div>
   </div>`
    return container;
}


function constructJobView(result) {

    const el = createElement('div', {
        className: 'mdc-layout-grid job-screen'
    })
    el.appendChild(dutyScreen(result.currentDuty));
    const timeline = createElement('div', {
        className: 'mdc-card timeline-overview mt-20'
    })
    timeline.innerHTML = `        
            <div class='mdc-card timeline-overview mt-20'>
                <div class='startTime text-center mb-10'>${result.timelineData.length ? moment(result.timelineData[result.timelineData.length -1].timestamp).format('hh:mm A'):''}</div>
                <div class="c100 p100 big center orange" id='pie'>
                <span>${result.timelineData.length ? moment(result.timelineData[0].timestamp).format('hh:mm A') :''}</span>
                    <div class="slice"><div class="bar">
                    </div><div class="fill"></div></div>
                </div>
            
                <div class='photo-button--container'>
                    ${createExtendedFab('add_a_photo','Take  photo','take-job-photo').outerHTML}
                </div>

            </div>
            <div class='action-buttons'>
                ${createButton('SKIP','skip','').outerHTML}
                ${createButton('finish job','finish','arrow_right_alt').outerHTML}
            </div>
        </div>`
    el.appendChild(timeline)


    const photoBtn = el.querySelector('#take-job-photo');
    const skip = el.querySelector('#skip');
    const finish = el.querySelector('#finish');
    const pie = el.querySelector('#pie');
    const expand = el.querySelector('#expand');
    const editIcon = el.querySelector('#edit');
    const addMoreUsers = el.querySelector('#add-more--users');

    finish.classList.add('mdc-button--raised')
    skip.classList.add("mdc-button--outlined")
    let firstActivityTimestamp;
    let lastActivityTimestamp;
    photoBtn.addEventListener('click', function () {
        history.pushState(['cameraView'], null, null)
        openCamera()
    });
    skip.addEventListener('click', function () {
        // history.pushState(['reportView'], null, null);
        // comingSoon();
        let office = result.currentDuty.office;
        if(office) {
            jobs(office);
            return
        }
        if(ApplicationState.venue.office) {
            jobs(office);
            return
        }
       jobs();
    })
    finish.addEventListener('click', function () {
        getRatingSubsription(result.currentDuty)
    })
    expand.addEventListener('click', function () {
        const details = el.querySelector(".expanded-details")
        details.classList.toggle('hidden');
        if (expand.textContent === 'expand_more') {
            expand.textContent = 'expand_less'
        } else {
            expand.textContent = 'expand_more'
        }
    })
    if(editIcon) {
        editIcon.addEventListener('click', function () {
            updateDuty(result.currentDuty);  
        })
    }
    addMoreUsers.addEventListener('click',function(){
        history.pushState(['share'],null,null);
        share(result.currentDuty,document.getElementById('app-current-panel'))
    });

    if (result.timelineData.length) {
        firstActivityTimestamp = result.timelineData[result.timelineData.length - 1].timestamp;
        lastActivityTimestamp = result.timelineData[0].timestamp;
        console.log('fat', new Date(firstActivityTimestamp))
        console.log('lat', new Date(lastActivityTimestamp))
        const fillValue = getTimelineFillValue(firstActivityTimestamp, lastActivityTimestamp);
        if (fillValue <= 180) {
            pie.classList.replace('p100', 'p0')
        }
        el.querySelector('#pie .bar').style.transform = `rotate(${fillValue}deg)`;
    }
    el.querySelector('#pie').addEventListener('click', function () {
        history.pushState(['timeLapse'], null, null);
        createTimeLapse(result.timelineData, firstActivityTimestamp, lastActivityTimestamp)
    })
    return el;
}

function getRatingSubsription(duty) {
    getSubscription(duty.office, 'call').then(function (subs) {

        if (!subs.length) return jobs();
        const customer = duty.attachment.Location.value;
        if (subs.length == 1) return showRating(subs[0],customer);
        const officeDialog = new Dialog('Choose office', officeSelectionList(subs), 'choose-office-subscription').create('simple');
        const officeList = new mdc.list.MDCList(document.getElementById('dialog-office'))
        bottomDialog(officeDialog, officeList)
        officeList.listen('MDCList:action', function (officeEvent) {
            officeDialog.close();
            const selectedSubscription = subs[officeEvent.detail.index];
            showRating(selectedSubscription,customer);
        })
    })
}

function checkProductLength(products) {
    return products.filter(function (product) {
        return product.name
    }).length
}

function getTimelineFillValue(firstActivityTimestamp, lastActivityTimestamp) {
    if (lastActivityTimestamp) {
        const diff = moment(lastActivityTimestamp).diff(moment(firstActivityTimestamp))
        const duration = moment.duration(diff).asHours();
        const timePercentage = (duration / 12) * 100;
        return (360 * timePercentage) / 100
    }
    return 1;
}

function getTimelineAddendum(geopoint) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('addendum');
        const store = tx.objectStore('addendum');

        const result = []
        const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(), moment().endOf('day').valueOf())
        // const bound = IDBKeyRange.bound(1565549625746, 1580385787130)
        store.index('timestamp').openCursor(bound).onsuccess = function (evt) {
            const cursor = evt.target.result;
            if (!cursor) return;
            if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints({
                    latitude: cursor.value.location._latitude,
                    longitude: cursor.value.location._longitude
                }, geopoint))) {
                cursor.continue();
                return
            }
            result.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function () {
            const sorted = result.sort(function (first, second) {
                return second.timestamp - first.timestamp
            })
            resolve(sorted)
        }
    })
}


function getTimelineActivityData(addendums) {
    return new Promise(function (resolve, reject) {


        const tx = db.transaction('activity');
        const store = tx.objectStore('activity');
        const filteredResult = {
            currentDuty: '',
            timelineData: []
        };
        addendums.forEach(function (addendum) {
            store.get(addendum.activityId).onsuccess = function (evt) {
                const record = evt.target.result;
                if (!record) return;

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

function createTimeLapse(timelineData, fat, lat) {

    const timeLine = createElement('div', {
        className: 'timeline'
    })
    const historyCont = createElement('div', {
        className: 'history-tl-container'
    })

    const ul = createElement('ul', {
        className: 'tl'
    })


    let totalCheckins = 0;
    let totalPhotoCheckins = 0;

    timelineData.forEach(function (activity) {
        if (activity.template === 'check-in') {
            totalCheckins++
            if (activity.attachment.Photo.value) {
                totalPhotoCheckins++
            }
        }
        ul.appendChild(createTimelineLi(activity))
    })


    const timelineDuration = moment.duration(moment(lat).diff(moment(fat)))
    console.log(timelineDuration)
    const screen = createElement('div', {
        className: 'timeline--container',
    })
    screen.innerHTML = `
        <div class='timeline--header'>
            <h3 class='mdc-typography--headline5 mdc-theme--primary mb-0 mt-10'>
                ${timelineDuration._data.hours} Hours ${timelineDuration._data.minutes} Minutes worked
            </h3>
            ${totalCheckins ? 
                `<ul class='mdc-list'>
                    ${totalCheckins ? 
                        `<li class='mdc-list-item  pl-0 pr-0 mdc-typography--headline6'>
                            <span class='mdc-list-item__graphic material-icons mdc-theme--primary'>check_circle</span>
                                ${totalCheckins} Check-Ins
                        </li>` 
                    :''}
                    ${totalPhotoCheckins  ? 
                        `<li class='mdc-list-item pl-0 pr-0 mdc-typography--headline6'>
                                <span class='mdc-list-item__graphic material-icons'>done</span>
                                ${totalPhotoCheckins} Photos uploaded
                        </li>`
                    :''}
                </ul>`
                : '' } 
        </div>
        `

    if (totalCheckins) {
        // ul.style.paddingTop = '80px';
    }
    if (fat && lat) {
        historyCont.appendChild(ul);
    } else {
        const emptyCont = createElement('div', {
            className: 'width-100 veritical-horizontal-center'
        })
        historyCont.classList.add('empty-list')

        emptyCont.appendChild(createElement('img', {
            src: './img/empty-list.svg',
            className: 'svg-list-empty'
        }))
        emptyCont.appendChild(createElement('p', {
            className: 'text-center  mdc-typography--headline5',
            textContent: 'No details found'
        }))

        historyCont.appendChild(emptyCont)
    }
    timeLine.appendChild(historyCont);

    document.getElementById('app-current-panel').innerHTML = '';
    screen.appendChild(timeLine);
    const bottomContainer = createElement('div', {
        className: 'timeline--footer'
    })

    const close = createButton('close')
    close.classList.add("mdc-button--raised");
    close.addEventListener('click', function () {
        history.back();
    })
    bottomContainer.appendChild(close);
    screen.appendChild(bottomContainer)

    document.getElementById('app-current-panel').appendChild(screen);

}




function createTimelineLi(activity) {
    const li = createElement("li", {
        className: 'tl-item ' + activity.template
    })
    li.dataset.activity = JSON.stringify(activity);

    const div = createElement('div', {
        className: 'item-title',
        textContent: mapTemplateNameToTimelineEvent(activity)
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
    if (activity.template === 'Customer') {
        return "Reached customer's location";
    }
    if (activity.template === 'leave') {
        return "On leave"
    }
    return 'Created ' + activity.template;
}

function checkForDuty(duty) {
    // db.transaction('activity').objectStore('activity').get('d1EbIdtHvw1x51yAcbFd').onsuccess = function(e){
    //     const duty = e.target.result;
    if (duty.schedule[0].startTime <= Date.now()) return;
    if (duty.schedule[0].endTime > Date.now()) return;

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

function comingSoon(id) {
  
    const el = document.getElementById(id)
    el.innerHTML = ``

    const cont = createElement('div', {
        className: 'coming--soon-container mdc-top-app-bar--fixed-adjust'
    })

    const img = createElement('img', {
        src: './img/coming-soon.svg',
    })
    const div = createElement('div', {
        className: 'mdc-typography--headline4 bold text-center mt-20',
        textContent: "Coming soon"
    })
    cont.appendChild(img)
    cont.appendChild(div)
    el.appendChild(cont);
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




function getActivity(activityId) {
    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');
    store.get(activityId).onsuccess = function (evt) {
        Promise.resolve(evt.target.result)
    }
}

function showRating(callSubscription,customer) {

    const el = document.getElementById("app-current-panel");

    el.innerHTML = `
    <div id='rating-view'></div>
    <iframe id='form-iframe' src='${window.location.origin}/frontend/dist/v2/forms/rating/index.html'></iframe>`;
    Promise.all([getChildrenActivity(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'product'), getSubscription(callSubscription.office, 'customer'), getActivity(ApplicationState.venue ? ApplicationState.venue.activityId : ''), getAllCustomer(callSubscription.office)]).then(function (response) {
        const products = response[0];
     
        const productSubscription = response[1];
        const customerSubscription = response[2];
        customer.phoneNumber = response[3] ? response[3].attachment['First Contact'].value || '' : '';
        const customers = response[4];
        document.getElementById('form-iframe').addEventListener("load", ev => {
            passFormData({
                name: 'init',
                template: callSubscription,
                body: {
                    products: products,
                    customers: customers,
                    customer: customer,
                    canEditProduct: productSubscription ? productSubscription.canEdit : '',
                    canEditCustomer: customerSubscription ? customerSubscription.canEdit : ''
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
    customerName.focus();
    customerCard.appendChild(customerName.root_);
    const productsCard = createElement('div', {
        className: 'mdc-card product-card  mt-10'
    })
    productsCard.appendChild(createElement('h1', {
        className: 'mdc-typography--headline5 mdc-theme--primary',
        textContent: 'Products'
    }))



    const ul = createElement('ul', {
        className: 'mdc-list',
        id:'product-list'
    })
    getChildrenActivity(duty.office, 'product').then(function (products) {

        if (checkProductLength(duty.attachment.Products.value)) {
            duty.attachment.Products.value.forEach(function (product) {
                createProductLi(products,product)
                
            })

        }
        productsCard.appendChild(ul)
        if (!products.length) return
        const addMore = createFab('add', '', false);
        addMore.classList.add('add-more--products')
        addMore.addEventListener('click', function () {
            openProductScreen(products);
        })
        const addMoreWrapper = createElement('div',{
            className:'add-more--wrapper',
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
        progressBarCard.open()
        duty.attachment.Location.value = customerName.value;
        const choosenProducts = [];
        [...ul.querySelectorAll('li')].forEach(function(li){
            choosenProducts.push({
                name:li.dataset.name,
                rate:Number(li.dataset.rate) || '',
                quanity:Number(li.dataset.quanity) || '',
                date:li.dataset.date
            })
        });
        duty.attachment.Products.value = choosenProducts;
        appLocation(3).then(function(geopoint) {
            return  requestCreator('update',duty,geopoint)
        }).then(function(){
            progressBarCard.close()
            history.back();
        }).catch(function (error) {
            progressBarCard.close();
        })
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
    document.getElementById('app-current-panel').innerHTML = '';
    document.getElementById('app-current-panel').appendChild(container)
}

function createProductLi(products,product) {
    const li = createElement('li', {
        className: 'mdc-list-item',
        textContent: product.name
    })  

    li.dataset.name = product.name;
    li.dataset.date = product.date;
    li.dataset.quanity = product.quanity;
    li.dataset.rate = product.date;

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
        [...ul.querySelectorAll('li')].forEach(function(li){
            if(li.dataset.name === name.value) {
                li.remove();
            }
        })
        ul.appendChild(createProductLi(products,selectedProduct))

    })
    div.appendChild(actionButtons)
    return div;

}


function jobs(office) {
    history.pushState(['jobs'],null,null);

    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');
    const dateObject = {}
    
    const header = setHeader(`
    <span class="mdc-top-app-bar__title">All duties</span>
    `,`<img class="mdc-icon-button image" id='profile-header-icon' onerror="imgErr(this)" src=${firebase.auth().currentUser.photoURL || './img/src/empty-user.jpg'}>`);
    header.root_.classList.remove('hidden');
    
    document.getElementById('profile-header-icon').addEventListener('click',function(){
        history.pushState(['profileScreen'], null, null);
        profileScreen();
    });

    store.index('template').openCursor('duty').onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (!cursor) return;
        if(office && cursor.value.office !== office) {
            cursor.continue();
            return
        } 
        if(!Array.isArray(cursor.value.schedule)) {
            cursor.continue();
            return
        }
        if(!cursor.value.schedule[0].startTime || !cursor.value.schedule[0].endTime) {
            cursor.continue();
            return
        }
        const dutyStartDate = moment(cursor.value.schedule[0].startTime).startOf('day').valueOf()
      
        if(!dateObject[dutyStartDate]) {
            dateObject[dutyStartDate] = [cursor.value]
        }
        else {
            dateObject[dutyStartDate].push(cursor.value)
        }
        cursor.continue()
    }
    tx.oncomplete = function () {
   
        const sortedDates = Object.keys(dateObject).sort(function(a,b){
            return Number(b) - Number(a);
        })
        let month;
        console.log(sortedDates);
        const frag = document.createDocumentFragment();
        sortedDates.forEach(function(timestamp){
            const dutyDate = new Date(Number(timestamp));
            console.log(dutyDate)
            if(month !== dutyDate.getMonth() +1) {
                const sect = createElement('div',{
                    className:'hr-sect mdc-theme--primary mdc-typography--headline5',
                    textContent:`${moment(`${dutyDate.getMonth() + 1}-${dutyDate.getFullYear()}`,'MM-YYYY').format('MMMM YYYY')}`
                })
                month = dutyDate.getMonth() +1
                frag.appendChild(sect)
            }
            const li = dutyDateList(dateObject[timestamp],dutyDate);
            li.querySelector('.dropdown').addEventListener('click',function(){
                li.querySelector('.detail-container').classList.toggle('hidden')
            })
            frag.appendChild(li);
        })
        document.getElementById('app-current-panel').classList.add('mdc-top-app-bar--fixed-adjust')
        document.getElementById('app-current-panel').innerHTML = ``;
        document.getElementById('app-current-panel').appendChild(frag);
    }
}

function dutyDateList(duties,dutyDate) {
   
    const card = createElement('div',{
        className:'mdc-card report-card job-card mdc-card--outlined attendance-card mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-8-tablet'
    })
  
    card.innerHTML = `<div class='mdc-card__primary-action'>
    <div class="demo-card__primary">
        <div class='left'>
            <div class="month-date-cont">
                <div class="day">${moment(`${dutyDate.getDate()}-${dutyDate.getMonth() + 1}-${dutyDate.getFullYear()}`, 'DD-MM-YYYY').format('ddd')}</div>
                <div class="date">${dutyDate.getDate()}</div>
            </div>
            <div class='heading-container mdc-theme--primary'>
                <h1 class='mdc-typography--headline5'>${duties.length == 1 ? `1 Duty` : `${duties.length} Duties`}</h3>
            </div>
        </div>
        <div class='right'>
                <div class="dropdown-container dropdown">
                    <i class="material-icons">keyboard_arrow_down</i>
                </div>
        </div>
    </div>
    <div class='detail-container hidden'>
        <ul class='mdc-list mdc-list--two-line'>
            ${duties.map(function(duty){
                return `<li class='mdc-list-item'>
                    <span class='mdc-list-item__text'>
                        <span class='mdc-list-item__primary-text'>${duty.activityName}</span>
                        <span class='mdc-list-item__secondary-text'>${moment(duty.schedule[0].startTime).format('hh:mm A')} To ${moment(duty.schedule[0].endTime).format('hh:mm A')}</span>
                    </span>
                    <span class='mdc-list-item__meta'>${getDutyStatus(duty)}</span>
                </li>`
            }).join("")}
        </ul>
    </div>
</div>`
   return card;
    
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
    if(duty.schedule[0].endTime <  currentTimestamp) return 'Finished';
    if(duty.schedule[0].startTime > currentTimestamp) return 'Upcoming';
    if(duty.schedule[0].startTime <= currentTimestamp  && currentTimestamp <= duty.schedule[0].endTime) return 'Open';
}