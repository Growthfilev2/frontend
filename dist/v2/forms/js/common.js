function callContact(functionName) {    

    if (parent.native.getName() === 'Android') {
        AndroidInterface.getContact(functionName);
        return
    }
    
    webkit.messageHandlers.getContact.postMessage(functionName);
}


function originMatch(origin) {
    const origins = ['https://growthfile-207204.firebaseapp.com','https://growthfile.com','https://growthfile-testing.firebaseapp.com','http://localhost:5000','https://localhost']
    return origins.indexOf(origin) > -1;
}
function createDate(dateObject) {
    console.log(dateObject)
    let month = dateObject.getMonth() + 1;
    let date = dateObject.getDate()
    if (month < 10) {
        month = '0' + month
    }
    if (date < 10) {
        date = '0' + date
    };

    return `${dateObject.getFullYear()}-${month}-${date}`
}

function getTommorowDate() {
    const today = new Date();
    const tomorrow = new Date();
    return new Date(tomorrow.setDate(today.getDate() + 1))
}

function showSecondDate(event, className, dataName) {
    event.target.classList.add('hidden')
    document.querySelector('.' + className).classList.remove('hidden');

    document.querySelector(`[data-name="${dataName}"]`).removeEventListener('change', startDateListen)
}


function initializeDates(subscriptionTemplate, defaultDateString) {
    
    subscriptionTemplate.schedule.forEach(function (name) {
        const startfield = document.querySelector(`[data-name="${name} start date"]`);
        const endField = document.querySelector(`[data-name="${name} end date"]`);
        startfield.addEventListener('change', function (evt) {
            endField.value = evt.target.value
            endField.min = evt.target.value
        });
        startfield.value = endField.value = endField.min = defaultDateString
    });
}


function getNewSchedule(subscriptionTemplate) {
    const newSchedules = []
    let index = 0;
    let isScheduleValid = false;
    const length = subscriptionTemplate.schedule.length;
    for (index; index < length; index++) {
        const name = subscriptionTemplate.schedule[index]

        const startDate = document.querySelector(`[data-name="${name} start date"]`).value;
        const endDate = document.querySelector(`[data-name="${name} end date"]`).value;
        if (!startDate) {
            parent.snacks(name + ' start date cannot be blank')
            break;
        }
        if (!endDate) {
            parent.snacks(name + ' end date cannot be blank')
            break;
        }
        const startDate_UTS = Date.parse(startDate);
        const endDate_UTS = Date.parse(endDate)
        if (startDate_UTS > endDate_UTS) {
            parent.snacks('start date in ' + name + ' cannot be greater than end date');
            break;
        }
        isScheduleValid = true;
        newSchedules.push({
            name: name,
            startTime: startDate_UTS,
            endTime: endDate_UTS,
        })
    }
    if (isScheduleValid) return newSchedules;

    return;

}

function getDropDownContent(office, template, indexName) {
    return new Promise(function (resolve, reject) {
        const result = {
            data: [],
            string: ''
        }
        const name_object = {}
        const tx = parent.db.transaction(['children'])
        const keyRange = IDBKeyRange.only([office, template])
        tx.objectStore('children').index(indexName).openCursor(keyRange).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
            const value = cursor.value.attachment.Name.value
            if(name[value]) {
                cursor.continue();
                return;
            }
            name_object[value] = true;
            result.string += ` <option value="${value}">
                    ${value}
                  </option>`
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(result)
        }

    })
}

function removeList(event) {

    event.target.parentNode.remove();

}

function createProductAmount(product) {
    const li = parent.createElement('li', {
        className: 'mdc-list-item'
    })
    li.dataset.product = product;

    li.innerHTML = `<span class="mdc-list-item__graphic material-icons" aria-hidden="true" style="
    margin-right: 10px;
    color:red
    ">clear</span>
    ${product}
    <input class="mdc-list-item__meta amount-input" aria-hidden="true" placeholder="Add Amount" type='number'>
    `
    return li;
}

function createElement(tagName, attrs) {
    const el = document.createElement(tagName)
    if (attrs) {
        Object.keys(attrs).forEach(function (attr) {
            el[attr] = attrs[attr]
        })
    }
    return el;
}

function createPhoneNumberLi(contactObject,withoutIcon,callback) {

    const li = createElement('li', {
        className: 'mdc-list-item',
    })
    li.dataset.number = contactObject.phoneNumber;

    li.innerHTML = `<span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">${contactObject.displayName}</span>
        <span class="mdc-list-item__secondary-text">${contactObject.phoneNumber}</span>
    </span>`
    if(withoutIcon) {
        return li;
    }
    const clearIcon = createElement('span',{
        className:'mdc-list-item__meta material-icons mdc-theme--error',
        textContent:'clear'
    })
    clearIcon.addEventListener('click',function(){
        li.remove();
        if(callback) {
            callback();
        }
    })
    li.appendChild(clearIcon);    
    return li
}



function setHelperInvalid(field,shouldShake = true) {
    field.focus();
    field.foundation_.setValid(false);
    field.foundation_.adapter_.shakeLabel(shouldShake);
  }
  
  function setHelperValid(field) {
    field.focus();
    field.foundation_.setValid(true);
  }