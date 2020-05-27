function jobView() {
    const geopoint = ApplicationState.location;

    createTimeLapse();
}

function constructJoBView(activity) {
    return `<div class='mdc-layout-grid'>
        <div class='duty-container'>

        </div>
    </div>`
}


function createTimeLapse() {
    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');
    //    const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(),moment().endOf('day').valueOf())
    // const bound = IDBKeyRange.bound(1565549625746, 1580385787130)
    const timeLine = createElement('div', {
        className: 'timeline'
    })
    const historyCont = createElement('div', {
        className: 'history-tl-container'
    })

    const ul = createElement('ul', {
        className: 'tl'
    })
    let firstActivityTimestamp;
    let lastActivityTimestamp;
    let totalCheckins = 0;
    let totalPhotoCheckins = 0;
    const dutyTemplates = {
        'duty':true,
        'customer':true,
        'check-in':true,
        'product':true,
        'employee':true,
        'duty-type':true
    }
    store.index("timestamp").openCursor(null,'prev').onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (!cursor) return;
        if(!dutyTemplates[cursor.value.template]) {
            cursor.continue();
            return;
        }
        if (!firstActivityTimestamp) {
            firstActivityTimestamp = cursor.value.timestamp
        }
        if (cursor.value.template === 'check-in') {
            totalCheckins++
            if (cursor.value.attachment.Photo.value) {
                totalPhotoCheckins++
            }
        }
        ul.appendChild(createTimelineLi(cursor.value))
        lastActivityTimestamp = cursor.value.timestamp;
        cursor.continue();
    }
    tx.oncomplete = function () {
        const timelineDuration = moment.duration(moment(lastActivityTimestamp).diff(moment(firstActivityTimestamp)))
        
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
       
        if(totalCheckins) {
            // ul.style.paddingTop = '80px';
        }
        if(timelineDuration.asMilliseconds()) {
            historyCont.appendChild(ul);
        }
        else {
            const emptyCont = createElement('div',{
                className:'width-100 veritical-horizontal-center'
            }) 
            historyCont.classList.add('empty-list')

            emptyCont.appendChild(createElement('img',{
                src:'./img/empty-list.svg',
                className:'svg-list-empty'
            }))
            emptyCont.appendChild(createElement('p',{
                className:'text-center  mdc-typography--headline5',
                textContent:'No details found'
            }))
            
            historyCont.appendChild(emptyCont)
        }
        timeLine.appendChild(historyCont);
    
        document.getElementById('app-current-panel').innerHTML = '';
        screen.appendChild(timeLine);
        const bottomContainer = createElement('div',{
            className:'timeline--footer'
        })

        const close = createButton('close')
        close.classList.add("mdc-button--raised");
        close.addEventListener('click',function(){
            history.back();
        })
        bottomContainer.appendChild(close);
        screen.appendChild(bottomContainer)

        document.getElementById('app-current-panel').appendChild(screen);
    }
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
    const span = createElement('span',{
        className:'event-time mdc-typography--caption',
        textContent:moment(activity.timestamp).format('hh:mm A')
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