function jobView() {
    const geopoint = ApplicationState.location;

    createTimeLapse();
}


function createTimeLapse() {
    const tx = db.transaction('activity');
    const store = tx.objectStore('activity');
    //    const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(),moment().endOf('day').valueOf())
    const bound = IDBKeyRange.bound(1565549625746, 1580385787130)
    const timeLine = createElement('div', {
        className: 'timeline'
    })
    const historyCont = createElement('div', {
        className: 'history-tl-container'
    })
    const ul = createElement('ul', {
        className: 'tl'
    })
    let firstActivity;
    let lastActivity;
    let totalCheckins = 0;
    let totalPhotoCheckins = 0
    store.index("timestamp").openCursor(bound).onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (!cursor) return;
        if (!firstActivity) {
            firstActivity = cursor.value
        }
        if (cursor.value.template === 'check-in') {
            totalCheckins++
            if (cursor.value.attachment.Photo.value) {
                totalPhotoCheckins++
            }
        }
        ul.appendChild(createTimelineLi(cursor.value))
        lastActivity = cursor.value;
        cursor.continue();
    }
    tx.oncomplete = function () {
        const timelineDuration = moment.duration(moment(lastActivity.timestamp).diff(moment(firstActivity.timestamp)))
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
                        `<li class='mdc-list-item'>
                            <span class='mdc-list-item__graphic material-icons'>done</span>
                                ${totalCheckins} Check-Ins
                        </li>` 
                    :''}
                    ${totalPhotoCheckins  ? 
                        `<li class='mdc-list-item'>
                                <span class='mdc-list-item__graphic material-icons'>done</span>
                                ${totalPhotoCheckins} Photos uploaded
                        </li>`
                    :''}
                </ul>`
                : '' } 
        </div>
        `
       

        historyCont.appendChild(ul);
        timeLine.appendChild(historyCont);
        // const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        // <span class="mdc-top-app-bar__title">History</span>
        // `
        // const header = setHeader(backIcon, '');
        // header.root_.classList.remove('hidden')
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
    li.addEventListener('click', function () {
        const activity = JSON.parse(li.dataset.activity)
        const heading = createActivityHeading(activity)
        showViewDialog(heading, activity, 'view-form')
    })
    li.appendChild(div);
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