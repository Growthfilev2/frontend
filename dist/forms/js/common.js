function createDate(dateObject) {
    console.log(dateObject)
    let month = dateObject.getMonth() +1;
    let date = dateObject.getDate()
    if(month < 10) {
        month = '0'+month
    }
    if(date < 10) {
        date = '0'+date
    }
    return `${dateObject.getFullYear()}-${month}-${date}`
}

function getTommorowDate(){
    const today = new Date();
    const tomorrow = new Date();
    return  new Date(tomorrow.setDate(today.getDate() +1))
}

function showSecondDate(event) {
    event.target.classList.add('hidden')
    document.querySelector('.end-date-container').classList.remove('hidden');
    
}


function getDropDownContent(office,template,indexName){
    return new Promise(function(resolve,reject){
        const result = {
            data:[],
            string:''
        }
        const tx = parent.db.transaction(['children'])
        const keyRange = IDBKeyRange.only([office, template])
        tx.objectStore('children').index(indexName).openCursor(keyRange).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
          
            result.string += ` <option value="${cursor.value.attachment.Name.value}">
                    ${cursor.value.attachment.Name.value}
                  </option>`
            cursor.continue();
        }
        tx.oncomplete = function () {
          return resolve(result)
        }
     
    })
}