function jobView() {
    const parent = document.getElementById('app-current-panel')
    parent.innerHTML = '';
    parent.classList.remove('mdc-top-app-bar--fixed-adjust')
    document.getElementById('app-header').classList.add('hidden')
    getTimelineAddendum(ApplicationState.location).then(function (addendums) {
           console.log(addendums)
            return getTimelineActivityData(addendums)
        })
        .then(function (timelineData) {
            const auth = firebase.auth().currentUser
            const duty = {
                attachment: {
                    'Duty Type': {
                        value: '',
                        type: 'duty'
                    },
                    'Location': {
                        value: ''
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
                supervisior: null
            }
            // db.transaction('activity').objectStore('activity').index('timestamp').getAll(bound).onsuccess = function (e) {
            //     console.log(e.target.result)
            //     if (!e.target.result) return;
            //     const filtered = e.target.result.sort(function (a, b) {
            //         return a.timestamp - b.timestamp;
            //     })
                parent.appendChild(constructJobView(timelineData, duty));
            // }
        }).catch(console.error)

    // if (newJob) {
    //     showPreviousJobPopUp(oldJob)
    //     return
    // }
    // parent.appendChild(constructJoBView(oldJob));
}

function showPreviousJobPopUp(oldJo) {
    const heading = createElement('div', {
        className: 'mdc-typography--headline5',
        textContent: 'Your last job is not finished. Please finish or skip it now'
    })
    getTimelineAddendum(oldJob.geopoint).then(function (addendums) {
        return getTimelineActivityData(addendums, oldJob.geopoint)
    }).then(function (timelineData) {
        const dialog = new Dialog(heading, constructJoBView(timelineData), 'job-popup').create('simple');
        dialog.open();
        //dialog button click;
        //new job start

        //skip

    });



}

function getOldLocation() {
    return JSON.parse(localStorage.getItem('ApplicationState')).location
}

function getDutyCoordinates(location) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('map');
        const store = tx.objectStore('map');
        let record;
        store.index('location').get(location).onsuccess = function (evt) {
            record = evt.target.result;
        }
        tx.oncomplete = function () {
            resolve(record)
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

function showUpcomingDuty(duty, currentGeopoint) {

    const cont = createElement("div", {
        className: 'duty-pop--container'
    })
    const heading = createElement('div', {
        className: 'inline-flex'
    })
    const reject = createElement("button", {
        className: 'mdc-theme--error',
        textContent: 'Reject',
        style: 'margin-left:auto'
    })
    const close = createElement('i', {
        className: 'material-icons',
        textContent: 'close'
    })
    heading.appendChild(reject)
    heading.appendChild(close)

    const details = createElement('div', {
        className: 'duty-popup--details'
    })
    details.innerHTML = `
    <div class='details'>
        <span>
            <i class='material-icons'>bike</i>
            <span>${calculateDistanceBetweenTwoPoints(duty.dutyGeopoint,currentGeopoint)}</span>
        </span>
        <hr>
        <div class='customer'>
            ${duty.attachment['Duty Type'].value ?`<span>
                <i class='material-icons'>assignment</i>
                <span>${duty.attachment['Duty Type'].value} </span>
            </span>` :''}
            <span>
                <i class='material-icons'>location_on</i>
                <span>${duty.attachment.Location.value} </span>
             </span>
        </div>
        <hr>
        <div class='supervisior'>
            <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list'>
                <li class='mdc-list-item'>
                    <span class='mdc-list-item__graphic'>
                        <img src='${duty.supervisior.photoURL || './img/empty-user.jpg'}'>
                        <span class='mdc-list-item__text'>
                            <span class='mdc-list-item__primary-text'>${duty.supervisior.displayName}</span>
                            <span class='mdc-list-item__secondary-text'>Customer</span>
                        </span>
                    </span>
                </li>
            </ul>
            <span>
                <i class='material-icons'>time</i>
                <span>${moment(duty.schedule[0].startTime).format('hh:mm A')} To ${moment(duty.schedule[0].endTime).format('hh:mm A')} </span>
            </span>
            <hr>
        </div>
        <div class='staff'>
            <span>
                <i class='material-icons'>people_add</i>
                <span>Staffs</span>
            </span>
            <div class='mdc-chip-set'>
                ${duty.assigness.map(function(contact,index){
                    const image = createElement('img', {
                        className: 'mdc-chip__icon mdc-chip__icon--leading',
                        src: contact.photoURL || './img/empty-user.jpg'
                    })
                    returncreateDynamicChips(contact.displayName || contact.mobile, index, image).outerHTML;
                }).join("")}
            </div>
        </div>
        <hr>
        <div class='products'>
            <span>
                <i class='material-icons'>settings</i>
                <span>Products</span>
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
            </ul>
        </div>
    </div>
    <div class='navigate'>
        ${createExtendedFab('navigation','Navigate','navigate').outerHTML}
    </div>
    `
    cont.appendChild(heading)
    cont.appendChild(details)

    const dialog = new Dialog('', cont, 'duty-dialog').create('simple')
    dialog.open();
}




function constructJobView(timelineData, duty) {

    const el = createElement('div', {
        className: 'mdc-layout-grid job-screen'
    })
    el.innerHTML = `
        <div class='duty-container'>
             <div class='mdc-card duty-overview'>
                <div class='duty-details'>
                    <div class='customer'>
                        <div class='location full-width mb-10'>
                            <div class='icon mdc-theme--primary' style='float:left;'>
                                <i class='material-icons'>location_on</i>
                            </div>
                            <div class='text mdc-typography--headline6 ml-10'>
                               ${ApplicationState.venue ? ApplicationState.venue.location : '-'}
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
                        <span class='inline-flex mdc-theme--primary'>
                            <i class='material-icons'>settings</i>
                            <span class='mdc-typography--headline6 ml-10'>Products</span>
                        </span>
                        <ul class='mdc-list mdc-list--two-line'>
                            ${checkProductLength(duty.attachment.Products.value) ?  duty.attachment.Products.value.map(function(product){
                                return `<li class='mdc-list-item'>
                                    <span class='mdc-list-item__text'>
                                        <span class='mdc-list-item__primary-text'>${product.name}</span>
                                        <span class='mdc-list-item__secondary-text'>Quantity : ${product.quanity}</span>
                                    </span>
                                    <span class='mdc-list-item__meta'>${convertNumberToInr(Number(product.rate))}</span>
                                </li>`
                            }) : '<div class="mdc-typography--caption1 text-center">No products found</div>'}
                        </ul>
                    </div>
                    <div class='expanded-details hidden'>
                        <hr>
                        <div class='supervisor'>
                            <span class='inline-flex mdc-theme--primary'>
                                <i class='material-icons'>supervisor_account</i>
                                <span class='mdc-typography--headline6 ml-10'>Supervisor</span>
                            </span>
                            ${duty.attachment.Supervisor.value ? `<ul class='mdc-list mdc-list--two-line mdc-list--avatar-list'>
                            <li class='mdc-list-item'>
                                <span class='mdc-list-item__graphic'>
                                    <img src='${duty.supervisior.photoURL || './img/empty-user.jpg'}'>
                                    <span class='mdc-list-item__text'>
                                        <span class='mdc-list-item__primary-text'>${duty.supervisior.displayName}</span>
                                        <span class='mdc-list-item__secondary-text'>Customer</span>
                                    </span>
                                </span>
                            </li>
                        </ul>` : '<div class="mdc-typography--caption1 text-center">No supervisor found</div>'}
                            
                        </div>
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
                        </div>
                    </div>
                    <div class='expand text-center'>
                        <i class='material-icons' id='expand'>expand_more</i>
                    </div>
                </div>
            </div>
            <div class='mdc-card timeline-overview mt-20'>
                      
                <div class="c100 p100 big center orange" id='pie'>
                    <div class="slice"><div class="bar"></div><div class="fill"></div></div>
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



    const photoBtn = el.querySelector('#take-job-photo');
    const skip = el.querySelector('#skip');
    skip.classList.add("mdc-button--outlined")
    const finish = el.querySelector('#finish');
    finish.classList.add('mdc-button--raised')
    const pie = el.querySelector('#pie');
    const expand = el.querySelector('#expand');
    let firstActivityTimestamp;
    let lastActivityTimestamp;
    photoBtn.addEventListener('click', function () {
        history.pushState(['cameraView'], null, null)
        openCamera()
    });
    skip.addEventListener('click', function () {
        history.pushState(['comingSoong'], null, null);
        comingSoon();
    })
    finish.addEventListener('click', function () {
        getRatingSubsription(ApplicationState.venue ? ApplicationState.venue.office : '')
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
    if (timelineData.length) {
        firstActivityTimestamp = timelineData[timelineData.length -1].timestamp;
        lastActivityTimestamp = timelineData[0].timestamp;
        console.log('fat', new Date(firstActivityTimestamp))
        console.log('lat', new Date(lastActivityTimestamp))
        const fillValue = getTimelineFillValue(firstActivityTimestamp, lastActivityTimestamp);
        if (fillValue <= 180) {
            pie.classList.replace('p100', 'p0')
        }
        el.querySelector('#pie .bar').style.transform = `rotate(${fillValue}deg)`;
    }
    el.querySelector('#pie').addEventListener('click', function () {
        history.pushState(['timeLapse'],null,null);
        createTimeLapse(timelineData,firstActivityTimestamp,lastActivityTimestamp)
    })
    return el;
}

function getRatingSubsription(office) {
    getSubscription(office, 'call').then(function (subs) {
     
        if (!subs.length) return comingSoon();
        if (subs.length == 1) return showRating(subs[0]);
        const officeDialog = new Dialog('Choose office', officeSelectionList(subs), 'choose-office-subscription').create('simple');
        const officeList = new mdc.list.MDCList(document.getElementById('dialog-office'))
        bottomDialog(officeDialog, officeList)
        officeList.listen('MDCList:action', function (officeEvent) {
            officeDialog.close();
            const selectedSubscription = subs[officeEvent.detail.index];
            showRating(selectedSubscription);
        })
    })
}

function checkProductLength(products) {
    return products.filter(function (product) {
        return product.name
    }).length
}

function getTimelineFillValue(firstActivityTimestamp, lastActivityTimestamp) {
    const diff = moment(lastActivityTimestamp).diff(moment(firstActivityTimestamp))
    const duration = moment.duration(diff).asHours();
    const timePercentage = (duration / 12) * 100;
    return (360 * timePercentage) / 100
}

function getTimelineAddendum(geopoint) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('addendum');
        const store = tx.objectStore('addendum');

        const result = []
        const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(),moment().endOf('day').valueOf())
        // const bound = IDBKeyRange.bound(1565549625746, 1580385787130)
        store.index('timestamp').openCursor(null,'prev').onsuccess = function (evt) {
            const cursor = evt.target.result;
            if (!cursor) return;
            if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints({latitude:cursor.value.location._latitude,longitude:cursor.value.location._longitude}, geopoint))) {
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
        const filteredResult = [];
        const dutyTemplates = {
            'check-in': true
        }
        addendums.forEach(function (addendum) {
            store.get(addendum.activityId).onsuccess = function (evt) {
                const record = evt.target.result;
                if (!record) return;
                if (dutyTemplates[record.template]) {
                    record.geopoint = addendum.geopoint
                    filteredResult.push(record);
                }
            }
        })
        tx.oncomplete = function () {
            resolve(filteredResult)
        }
    })
}

function createTimeLapse(timelineData,fat,lat) {

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

    Promise.all([getDutyCoordinates(duty.attachment.Location.value), getSupervisorContact(duty.attachment.Supervisor.value)]).then(function (response) {
        let dutyGeopoint;
        if (response[0]) {
            dutyGeopoint = {
                latitude: response[0].latitude,
                longitude: response[0].longitude
            }
        }
        duty.dutyGeopoint = dutyGeopoint;
        duty.supervisiorContact = response[1]
        showUpcomingDuty(duty, ApplicationState.location)
    })
}

function comingSoon() {
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">Upcoming duties</span>
        `
    const header = setHeader(backIcon, '');
    header.root_.classList.remove('hidden')
    const el = document.getElementById('app-current-panel')
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

function getProdcuts(office) {
    return new Promise(function(resolve,reject){

        const tx = db.transaction('children');
        const store = tx.objectStore("children");
        const products = [];
        store.index('officeTemplate').openCursor([office,'product']).onsuccess = function(evt){
            const cursor = evt.target.result;
            if(!cursor) return;
            if(cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return
            }
            products.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function(){
            resolve(products)
        }
    })
}
function getActivity(activityId) {
    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');
    store.get(activityId).onsuccess = function(evt){
        Promise.resolve(evt.target.result)
    }
}
function showRating(callSubscription) {
   
    const el = document.getElementById("app-current-panel");

    el.innerHTML = `
    <div id='rating-view'></div>
    <iframe id='form-iframe' src='${window.location.origin}/dist/v2/forms/rating/index.html'></iframe>`;
    Promise.all([getProdcuts(callSubscription.office),getSubscription(callSubscription.office,'product'),getSubscription(callSubscription.office,'customer'),getActivity(ApplicationState.venue ? ApplicationState.venue.activityId : '')]).then(function(response){
        const products = response[0];
        const customer = ApplicationState.venue;
        const productSubscription = response[1];
        const customerSubscription = response[2];
        customer.phoneNumber = response[3] ? response[3].attachment['First Contact'].value || '' : ''
        document.getElementById('form-iframe').addEventListener("load", ev => {
            passFormData({
                name: 'init',
                template: callSubscription,
                body: {
                    products:products,
                    customer:customer,
                    canEditProduct:productSubscription ? productSubscription.canEdit : '',
                    canEditCustomer:customerSubscription ? customerSubscription.canEdit : ''
                },
                deviceType: native.getName()
            });
        })
    })

}



function skippedRating() {
    history.pushState(['comingSoon'], null, null);
    comingSoon();
}