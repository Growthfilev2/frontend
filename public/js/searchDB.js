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

function initSubscriptionSelectorSearch(db, data) {
    const searchField = document.getElementById('search--bar-selector');
    searchField.value = ''
    let frag = document.createDocumentFragment()
    searchField.addEventListener('input', function (e) {
        let searchedTemp = []
         document.querySelectorAll(`[data-selection] li`).forEach(function (li) {
                    li.style.display = 'none'
                })
        const objectStore = db.transaction('subscriptions').objectStore('subscriptions').index('template')
        let searchString = e.target.value.toLowerCase()
        searchTemplatesDB(searchString, objectStore, searchedTemp)
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

            if (checkNumber(searchTerm) && ul.children.length == 0) {
                const notify = document.createElement('div')
                notify.className = 'data-not-found'
                const textSpan = document.createElement('span')
                textSpan.textContent = 'Not found'
                const addNumber = document.createElement('button')
                addNumber.className = 'mdc-button'
                notify.appendChild(textSpan)
                notify.appendChild(addNumber)
                ul.appendChild(notify)
                return
            }

            ul.innerHTML = ''
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

function searchTemplatesDB(searchTerm, os, searchedTemp) {
    const avoid = {
        'admin': '',
        'recipient': '',
        'employee': '',
        'subscription': '',

    }
    const bound = IDBKeyRange.bound(searchTerm, searchTerm + '\uffff')

    const grp = document.createElement('div')
    grp.className = 'mdc-list-group'

    os.openCursor(bound).onsuccess = function (event) {
        const cursor = event.target.result
        if (!cursor) {
            if(searchedTemp.length ==0){
                const notify = document.createElement('div')
                notify.className = 'data-not-found'
                const textSpan = document.createElement('p')
                textSpan.textContent = 'No Results Found'
                textSpan.className = 'mdc-typography--headline5'
                notify.appendChild(textSpan)
                document.getElementById('data-list--container').style.display = 'none'
                document.querySelector('.selector-send').style.display = 'none'
                if(!document.querySelector('.data-not-found')) {
                    document.querySelector('.mdc-dialog__body--scrollable').appendChild(notify)
                }
                return
            }

            if(document.querySelector('.data-not-found')) {
                document.querySelector('.data-not-found').remove()
                document.querySelector('.selector-send').style.display = 'block'
                document.getElementById('data-list--container').style.display = 'block'


            }
            
            console.log(searchedTemp)
            searchedTemp.forEach(function (selection) {
                
                document.querySelector(`[data-selection="${selection.office}"] [data-template="${selection.template}"]`).style.display = 'flex'
               
            })
            document.querySelectorAll(`[data-selection]`).forEach(function(ul){
                let hiddenCount = 0;
                const childrenLength = ul.children.length;
                ul.childNodes.forEach(function(li){
                    if(li.style.display === 'none'){
                        hiddenCount++
                    }
                })

                if(hiddenCount === childrenLength) {
                    ul.previousSibling.style.display = 'none'
                }
                else {
                    ul.previousSibling.style.display = 'block'

                }
            })
                   
            return
        }
        if (cursor.value.status === 'CANCELLED') {
            cursor.continue()
            return
        }

        if (avoid.hasOwnProperty(cursor.value.template)) {
            cursor.continue()
            return
        }
            
        searchedTemp.push({office:cursor.value.office,template:cursor.value.template})
        cursor.continue()
        
    }
}