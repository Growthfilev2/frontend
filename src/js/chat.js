function conversation(id) {
    document.body.classList.remove('mdc-dialog-scroll-lock')

    window.removeEventListener('scroll', handleScroll, false)
    checkIfRecordExists(id).then(function (record) {
        if (!record) {
            resetScroll()
            listView()
            return;
        }
        history.pushState(['conversation', record.activityId], null, null)
        fetchAddendumForComment(record.activityId)
    })
}

function checkIfRecordExists(id) {
    return new Promise(function (resolve) {
        const user = firebase.auth().currentUser
        const req = window.indexedDB.open(user.uid)

        req.onsuccess = function () {
            const db = req.result;
            const objectStore = db.transaction(['activity']).objectStore('activity');
            objectStore.get(id).onsuccess = function (event) {
                const record = event.target.result;
                resolve(record)
            }
        }
    })
}

function fetchAddendumForComment(id) {
    const user = firebase.auth().currentUser
    const req = window.indexedDB.open(user.uid)
    req.onsuccess = function () {
        const db = req.result
        const transaction = db.transaction(['addendum'], 'readonly');
        const addendumIndex = transaction.objectStore('addendum').index('activityId');
        createHeaderContent(db, id)
        commentPanel(id)
        statusChange(db, id);
        reinitCount(db, id)

        addendumIndex.openCursor(id).onsuccess = function (event) {
            const cursor = event.target.result
            if (!cursor) return;
            if (!document.getElementById(cursor.value.addendumId)) {
                cursor.continue();
                return;
            }
            getUserRecord(db, addendum.user).then(function (userRecord) {
                if (document.getElementById('chat-container')) {
                    createCommentDom(userRecord, addendum)
                    document.getElementById('chat-container').appendChild(comment)
                }
            })
            cursor.continue()
        }
        transaction.oncomplete = function () {
            if (!document.querySelector('.activity--chat-card-container')) return
            document.querySelector('.activity--chat-card-container').scrollTop = document.querySelector('.activity--chat-card-container').scrollHeight
        }
    }
}


function commentPanel(id) {
    if (document.querySelector('.activity--chat-card-container')) {
        return
    }

    const commentPanel = document.createElement('div')
    commentPanel.className = 'activity--chat-card-container  mdc-top-app-bar--fixed-adjust panel-card'

    const chatCont = document.createElement('div')
    chatCont.id = 'chat-container'
    chatCont.className = 'mdc-card reverser-parent'


    const userCommentCont = document.createElement('div')
    userCommentCont.className = 'user-comment--container'

    const statusChangeContainer = document.createElement('div')
    statusChangeContainer.className = 'status--change-cont'

    const commentCont = document.createElement('div')
    commentCont.className = 'comment--container'

    const field = document.createElement('div')
    field.className = 'input--text-padding mdc-text-field mdc-text-field--dense'
    field.id = 'write--comment'
    field.style.width = '100%';
    const input = document.createElement('input')
    input.className = 'mdc-text-field__input comment-field mdc-elevation--z4'
    input.type = 'text'

    field.appendChild(input)

    commentCont.appendChild(field)


    const btn = document.createElement('button')
    btn.classList.add('mdc-fab', 'mdc-fab--mini', 'hidden')
    btn.id = 'send-chat--input'

    const btnIcon = document.createElement('span')
    btnIcon.classList.add('mdc-fac__icon', 'material-icons')
    btnIcon.textContent = 'send'
    btn.appendChild(btnIcon)

    commentCont.appendChild(btn)

    commentPanel.appendChild(chatCont)

    userCommentCont.appendChild(commentCont)

    document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + statusChangeContainer.outerHTML + userCommentCont.outerHTML

    document.querySelector('.comment-field').oninput = function (evt) {
        if (!evt.target.value || !evt.target.value.replace(/\s/g, '').length) {
            toggleCommentButton(false)
        } else {
            toggleCommentButton(true)
        }
    }

    document.getElementById('send-chat--input').onclick = function () {
        if (!isLocationStatusWorking()) return;
        let comment = document.querySelector('.comment-field').value;
        const reqBody = {
            'activityId': id,
            'comment': comment
        }

        requestCreator('comment', reqBody)

        document.querySelector('.comment-field').value = ''
        toggleCommentButton(false)
    }
}


function toggleCommentButton(show) {
    const input = document.getElementById('send-chat--input');
    const writeComment = document.getElementById('write--comment');
    const statusCont = document.querySelector('.status--change-cont');

    if (show) {
        input.classList.remove('hidden')
        writeComment.style.width = '80%'
        statusCont.style.opacity = '0';
    } else {
        input.classList.add('hidden');
        writeComment.style.width = '100%';
        writeComment.style.transition = '0.3s ease'
        statusCont.style.transition = '0.3s ease'
        statusCont.style.opacity = '1'
    }

}

function statusChange(db, id) {

    const label = document.createElement('label')
    label.setAttribute('for', 'toggle-status')
    label.textContent = 'Done'

    const activityStore = db.transaction('activity').objectStore('activity');
    activityStore.get(id).onsuccess = function (event) {
        const container = document.querySelector('.status--change-cont')
        const record = event.target.result;
        if (!record.canEdit || record.status === 'CANCELLED') {
            const statusSpan = document.createElement('span')
            const record = event.target.result
            statusSpan.textContent = 'Activity ' + (record.status.toLowerCase())
            if (container) {
                container.innerHTML = statusSpan.outerHTML
                container.style.textAlign = 'center'
            }
            return
        }
        if (record.editable == 0) {

            container ? container.innerHTML = label.outerHTML + loader('status-loader').outerHTML : ''
            return
        }
        if (!document.querySelector('.status-check')) {
            const div = document.createElement('div')
            div.className = 'mdc-form-field form-field-status'

            const checkbox = document.createElement('div')
            checkbox.className = 'mdc-checkbox status-check'


            const input = document.createElement("input")
            input.className = 'mdc-checkbox__native-control'
            input.id = 'toggle-status'
            input.type = 'checkbox'

            const checkbox_bckg = document.createElement('div')
            checkbox_bckg.className = 'mdc-checkbox__background'

            const svg = `<svg class="mdc-checkbox__checkmark"
        viewBox="0 0 24 24">
        <path class="mdc-checkbox__checkmark-path"
        fill="none"
        d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
        </svg>
        <div class="mdc-checkbox__mixedmark"></div>`

            const mixedmark = document.createElement('div')
            mixedmark.className = 'mdc-checkbox__mixedmark'
            checkbox_bckg.innerHTML = svg
            checkbox.appendChild(input)
            checkbox.appendChild(checkbox_bckg)

            div.appendChild(checkbox)

            if (container) {
                container.innerHTML = div.outerHTML + label.outerHTML
            }
        }

        if (!document.querySelector('.mdc-checkbox')) return;

        switchControl = new mdc.checkbox.MDCCheckbox.attachTo(document.querySelector('.mdc-checkbox'));
        if (record.status === 'CONFIRMED') {
            switchControl.checked = true
        }
        document.querySelector('.mdc-checkbox').onclick = function () {
            if (!isLocationStatusWorking()) {
                record.status === 'CONFIRMED' ? switchControl.checked = true : switchControl.checked = false
                return;
            }
            document.querySelector('.form-field-status').classList.add('hidden');
            document.querySelector('.status--change-cont').appendChild(loader('status-loader'));
            let status;
            switchControl.checked ? status = 'CONFIRMED' : status = 'PENDING';
            requestCreator('statusChange', {
                activityId: record.activityId,
                status: status
            })

        }
    }
}





function createCommentDom(userRecord, addendum) {
    let commentBox = document.createElement('div')

    commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')

    firebase.auth().currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment', 'secondary-color-light') : commentBox.classList.add('other-user--comment', 'mdc-theme--primary-bg')
    commentBox.id = addendum.addendumId

    let textContainer = document.createElement('div')
    textContainer.classList.add('talktext')

    let user = document.createElement('p')
    user.classList.add('user-name--comment', 'mdc-typography--subtitle2')
    userRecord.displayName ? user.textContent = userRecord.displayName : user.textContent = userRecord.phoneNumber

    let comment = document.createElement('p')
    comment.classList.add('comment', 'mdc-typography--subtitle2')
    comment.textContent = addendum.comment

    let commentInfo = document.createElement('span')
    commentInfo.className = 'comment--info'
    const datespan = document.createElement('span')
    datespan.textContent = moment(addendum.timestamp).format('DD-MM-YY H:mm')
    datespan.classList.add('comment-date', 'mdc-typography--caption')

    const link = document.createElement('div')
    let mapIcon = document.createElement('i')
    mapIcon.classList.add('user-map--span', 'material-icons')
    mapIcon.appendChild(document.createTextNode('location_on'))


    mapIcon.dataset.latitude = addendum.location['_latitude']
    mapIcon.dataset.longitude = addendum.location['_longitude']
    link.appendChild(mapIcon)

    const mapDom = document.createElement('div')
    mapDom.className = 'map-convo'

    let showMap = false

    link.onclick = function (evt) {
        if (!hasMapsApiLoaded()) return
        showMap = !showMap;
        const loc = {
            lat: addendum.location['_latitude'],
            lng: addendum.location['_longitude']
        }
        const map = new AppendMap(mapDom)
        map.setLocation(loc)
        map.setZoom(18)

        map.getMarker();
        if (showMap) {
            mapDom.style.height = '200px'
            mapIcon.textContent = 'arrow_drop_down'
        } else {
            mapDom.style.height = '0px'
            mapIcon.textContent = 'location_on'
        }
    }
    commentInfo.appendChild(datespan)
    commentInfo.appendChild(link)
    textContainer.appendChild(user)
    textContainer.appendChild(comment)
    textContainer.appendChild(commentInfo)
    commentBox.appendChild(textContainer)
    commentBox.appendChild(mapDom);
    return commentBox
}

function getUserRecord(db, data) {
    return new Promise(function (resolve, reject) {
        const usersObjectStore = db.transaction('users').objectStore('users');
        let number;
        if (typeof data === 'string') {
            number = data
        } else {
            number = data.phoneNumber;
        }
        usersObjectStore.get(number).onsuccess = function (event) {
            const record = event.target.result
            if (!record) return resolve({
                displayName: '',
                mobile: number,
                photoURL: ''
            })
            return resolve(record)
        }
    })
}

function hasMapsApiLoaded() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        return true
    }
    return false
}


function MapsCustomControl(customControlDiv, map, lat, lng) {
    var controlUI = document.createElement('div');

    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.style.padding = '0px 5px 0px 5px';

    customControlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('a');
    controlText.href = `https://www.google.com/maps?q=${lat},${lng}`
    controlText.className = 'material-icons'
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.style.textDecoration = 'none'

    controlText.innerHTML = 'open_in_new';
    controlUI.appendChild(controlText);

}

function createHeaderContent(db, id) {
    const sectionStart = document.getElementById('section-start');
    sectionStart.innerHTML = ''
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    let leftDiv = headerBackIcon()

    activityObjectStore.get(id).onsuccess = function (event) {

        const record = event.target.result;

        getUserRecord(db, record.creator).then(function (userRecord) {
            const dataObject = document.createElement('object');
            dataObject.data = userRecord.photoURL || './img/empty-user.jpg';
            dataObject.className = 'header--icon-creator';
            dataObject.type = 'image/jpeg';

            var creatorImg = document.createElement("img");
            creatorImg.src = './img/empty-user.jpg';
            creatorImg.className = 'header--icon-creator'
            dataObject.appendChild(creatorImg);

            var primarySpan = document.createElement('div');
            primarySpan.className = 'mdc-top-app-bar__title mdc-typography--subtitle2';
            const name = document.createElement('span')
            name.textContent = record.activityName;
            name.className = ''
            primarySpan.onclick = function () {
                checkIfRecordExists('activity', record.activityId).then(function (id) {
                    if (id) {
                        updateCreateActivity(record);
                    } else {
                        resetScroll()
                        listView();
                    }
                }).catch(handleError);
            }
            var info = document.createElement('span');
            info.textContent = 'Click here to see details';
            sectionStart.appendChild(leftDiv);
            sectionStart.appendChild(dataObject);
            primarySpan.appendChild(name);
            primarySpan.appendChild(document.createElement('br'))
            primarySpan.appendChild(info)
            sectionStart.appendChild(primarySpan)
        });
    }
}

function reinitCount(db, id) {
    const transaction = db.transaction(['list'], 'readwrite');
    const store = transaction.objectStore('list');
    store.get(id).onsuccess = function (event) {
        const record = event.target.result
        if (!record) return;
        record.count = 0
        store.put(record)
    }
}


function noSelectorResult(text) {
    const noResult = document.createElement('div')
    noResult.className = 'data-not-found'
    const p = document.createElement('p')
    p.className = 'mdc-typography--headline5'
    p.textContent = text
    noResult.appendChild(p)
    return noResult
}

function checkMapStoreForNearByLocation(office, currentLocation) {
    return new Promise(function (resolve, reject) {
        const req = indexedDB.open(firebase.auth().currentUser.uid)
        req.onsuccess = function () {
            const results = [];
            const db = req.result;
            const tx = db.transaction(['map'])
            const store = tx.objectStore('map')
            const index = store.index('byOffice')
            const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
            index.openCursor(range).onsuccess = function (event) {
                const cursor = event.target.result;
                if (!cursor) return;

                if (!cursor.value.location) {
                    cursor.continue();
                    return;
                }
                if (!cursor.value.latitude || !cursor.value.longitude) {
                    cursor.continue();
                    return;
                }

                const distanceBetweenBoth = calculateDistanceBetweenTwoPoints(cursor.value, currentLocation);

                if (isLocationLessThanThreshold(distanceBetweenBoth)) {

                    results.push(cursor.value);
                }
                cursor.continue();
            }
            tx.oncomplete = function () {
                const filter = {};
                results.forEach(function (value) {
                    filter[value.location] = value;
                })
                const array = [];
                Object.keys(filter).forEach(function (locationName) {
                    array.push(filter[locationName])
                })
                const nearest = array.sort(function (a, b) {
                    return a.accuracy - b.accuracy
                })
                resolve(nearest)
            }
            tx.onerror = function () {
                reject(tx.error)
            }
        }
    })
}