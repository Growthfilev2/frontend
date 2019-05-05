function initUserSelectorSearch(data, field) {
    const req = indexedDB.open(firebase.auth().currentUser.uid)
    req.onsuccess = function () {
        const db = req.result;
        let objectStore = ''
        field.input_.addEventListener('input', function (e) {
            let searchString = e.target.value
            // listInit.root_.classList.add('hidden')
            listInit.listElements.forEach(function (el) {
                el.classList.add('hidden')
            })
            if (isNumber(searchString)) {
                objectStore = db.transaction('users').objectStore('users')
                searchUsersDB(formatNumber(searchString), objectStore, data)
                return
            }
            frag = document.createDocumentFragment()
            objectStore = db.transaction('users').objectStore('users').index('displayName')
            searchUsersDB(formatName(searchString), objectStore, data)
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

function searchUsersDB(searchTerm, objectStore, data) {
    console.log(searchTerm)
    const bound = IDBKeyRange.bound(searchTerm, searchTerm + '\uffff')

    const assignees = data.record.assignees
    const alreadyPresent = {}
    assignees.forEach(function (assignee) {
        if (typeof assignee === 'string') {
            alreadyPresent[assignee] = true
        } else {
            alreadyPresent[assignee.phoneNumber] = true
        }
    })
    alreadyPresent[firebase.auth().currentUser.phoneNumber] = true
   
    objectStore.openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) return
        const el = document.querySelector(`[data-phone-number="${cursor.value.mobile}"]`)
        if (el) {
            if (el.classList.contains('hidden')) {
                el.classList.remove('hidden')
            } else {
                el.classList.add('hidden')
            }
        }      
       
        cursor.continue()

    }
}