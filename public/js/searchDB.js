function initUserSelectorSearch(db,record){
const searchField = document.getElementById('search--bar-selector');    
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

function searchDB(searchTerm,objectStore,frag){
    console.log(searchTerm)
    const bound = IDBKeyRange.bound(searchTerm,searchTerm+'\uffff')
    const ul = document.getElementById('data-list--container')
    
    objectStore.openCursor(bound).onsuccess = function(event){
        const cursor = event.target.result
        if(!cursor) {
            ul.innerHTML = ''
            ul.appendChild(frag)
            return
        }
        frag.appendChild(createSimpleAssigneeLi(cursor.value, true))
        cursor.continue()
    }
}