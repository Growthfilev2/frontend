function initUserSelectorSearch(data,field,container) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function(){
        const db = req.result;
        let objectStore = ''
        let frag = document.createDocumentFragment()
        field.input_.addEventListener('input', function (e) {
            let searchString = e.target.value
            
            if (isNumber(searchString)) {
                objectStore = db.transaction('users').objectStore('users')
                searchUsersDB(formatNumber(searchString), objectStore, frag, data,container)
                return
            }
            frag = document.createDocumentFragment()
            objectStore = db.transaction('users').objectStore('users').index('displayName')
            searchUsersDB(formatName(searchString), objectStore, frag, data,container)
        })
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

function formatName(name) {
    const nameArr = name.split(" ")
    const length = nameArr.length
    const result = []
    let index = 0;
    for (index = 0; index < length; index++) {
        const element = nameArr[index];
        if (element.charAt(0).toUpperCase() === name.charAt(0).toUpperCase) return name
        result.push(element.charAt(0).toUpperCase() + element.slice(1))
    }
    return result.join(' ')
}

function checkNumber(number) {
    const expression = /^\+[1-9]\d{11,14}$/
    return expression.test(number)
}

function searchUsersDB(searchTerm, objectStore, frag, data,container) {
    console.log(searchTerm)
    const bound = IDBKeyRange.bound(searchTerm, searchTerm + '\uffff')
    const ul = document.getElementById('user-selector-list')
    const assignees = data.record.assignees
    const alreadyPresent = {}
    assignees.forEach(function(assignee){
        if(typeof assignee === 'string'){
            alreadyPresent[assignee] = true
        }
        else {
            alreadyPresent[assignee.phoneNumber] = true
        }
    })
    alreadyPresent[firebase.auth().currentUser.phoneNumber] = true
    objectStore.openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {

            ul.innerHTML = ''
            if (frag.children.length ==0) {
                const notify = document.createElement('div')
                notify.className = 'data-not-found'
                const textSpan = document.createElement('p')
                textSpan.textContent = 'No Contact Found'
                textSpan.className = 'mdc-typography--headline5'                
                notify.appendChild(textSpan)
                if(!document.querySelector('.data-not-found')) {
                    ul.appendChild(notify)
                }
                return
            }

            ul.appendChild(frag)

            return
        }
        
        if(data.attachment) {
            const radioButton = new mdc.radio.MDCRadio(createRadioInput({value:cursor.value.mobile}))
            frag.appendChild(createSimpleAssigneeLi(cursor.value, radioButton))
        }
        else {
            if(!alreadyPresent.hasOwnProperty(cursor.value.mobile)) {
                const checkbox = createCheckBox({value:cursor.value.mobile});
                checkbox.root_.onclick = function(){
                  container.querySelector('#selector-submit-send').dataset.type = '';
                  container.querySelector('#selector-submit-send').textContent = 'SELECT';
                }
                frag.appendChild(createSimpleAssigneeLi(cursor.value,checkbox))
            }
        }
        cursor.continue()

    }
}
