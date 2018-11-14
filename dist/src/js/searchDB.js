function initUserSelectorSearch(db, data) {
    const searchField = document.getElementById('search--bar-selector');
    searchField.value = ''
    let objectStore = ''
    let frag = document.createDocumentFragment()
    const alreadyPresntAssigness = {}
    const usersInRecord = data.record.assignees

    usersInRecord.forEach(function (user) {
        alreadyPresntAssigness[user] = ''
    })

    searchField.addEventListener('input', function (e) {
        let searchString = e.target.value

        if (isNumber(searchString)) {
            objectStore = db.transaction('users').objectStore('users')
            searchUsersDB(formatNumber(searchString), objectStore, frag, alreadyPresntAssigness, data)
            return
        }

        frag = document.createDocumentFragment()
        objectStore = db.transaction('users').objectStore('users').index('displayName')
        searchUsersDB(formatName(searchString), objectStore, frag, alreadyPresntAssigness, data)
    })
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

function searchUsersDB(searchTerm, objectStore, frag, alreadyPresntAssigness, data) {
    console.log(searchTerm)
    const bound = IDBKeyRange.bound(searchTerm, searchTerm + '\uffff')
    const ul = document.getElementById('data-list--container')



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

            const selectedBoxes = document.querySelectorAll('[data-selected="true"]');
            selectedBoxes.forEach(function (box) {
                const mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
                mdcBox.checked = true
                box.children[1].style.animation = 'none'
                box.children[1].children[0].children[0].style.animation = 'none'
            })
            return
        }


        if (data.attachment.present) {
            frag.appendChild(createSimpleAssigneeLi(cursor.value, true, false))
        } else if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
            frag.appendChild(createSimpleAssigneeLi(cursor.value, true, true))
        }

        cursor.continue()

    }
}
