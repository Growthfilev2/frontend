function initUserSelectorSearch(db){
const searchField = document.getElementById('search--bar-selector');    
searchField.value = ''
let objectStore = ''
let frag = document.createDocumentFragment()

searchField.addEventListener('input',function(e){
    let searchString = e.target.value
    
    if(isNumber(searchString)){
        objectStore = db.transaction('users').objectStore('users')
        searchDB(formatNumber(searchString),objectStore,frag)
        return
    }

    frag = document.createDocumentFragment()
    objectStore = db.transaction('users').objectStore('users').index('displayName')
    searchDB(formatName(searchString),objectStore,frag)
})
}

function isNumber(searchTerm){
    return !isNaN(searchTerm)
}

function formatNumber(numberString) {
    let number = numberString;
    if (number.substring(0,2) === '91') {
        number = '+'+number
    }
    else if(number.substring(0,3) !== '+91'){
        number = '+91'+number
    }
    
    return number
}

function formatName(name) {
   const nameArr  = name.split(" ")
   const length = nameArr.length
   const result = []
   let index = 0;
   for (index = 0; index < length; index++) {
       const element = nameArr[index];
       if(element.charAt(0).toUpperCase() === name.charAt(0).toUpperCase) return name
       result.push(element.charAt(0).toUpperCase()+element.slice(1))
       
   } 
   return result.join(' ')
}

function checkNumber(number){
    const expression = /^\+[1-9]\d{5,14}$/
    return expression.test(number)
}

function searchDB(searchTerm,objectStore,frag){
    console.log(searchTerm)
    const bound = IDBKeyRange.bound(searchTerm,searchTerm+'\uffff')
    const ul = document.getElementById('data-list--container')



    objectStore.openCursor(bound).onsuccess = function(event){
        const cursor = event.target.result
        if(!cursor) {

            if(checkNumber(searchTerm) && ul.children.length == 0){
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
            selectedBoxes.forEach(function(box){
                const mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
                mdcBox.checked = true
                box.children[1].style.animation = 'none'
                box.children[1].children[0].children[0].style.animation = 'none'
            })
            return
        }
        
        frag.appendChild(createSimpleAssigneeLi(cursor.value, true,true))
        cursor.continue()

    }
}