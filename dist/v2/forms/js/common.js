let deviceType = ''
let parentOrigin = ''

function callContact(functionName) {
    switch (deviceType) {
        case 'Android':
            parent.AndroidInterface.getContact(functionName);
            break;
        case 'Ios':
            parent.webkit.messageHandlers.getContact.postMessage(functionName);
            break;
        default:
            return textFieldRemovable('tel','','Secondary contact');
    }
}

function textFieldRemovable(type, label,placeholder) {
    const cont = createElement('div', {
        className: 'inline-flex mt-10'
    })
    let field;
    if (type === 'tel') {
        field = textFieldTelephoneWithHelper({
            placeholder:placeholder,
            customClass: 'contact-field'
        })
    } else {
        field = textField({
            label: label,
            type: type
        })
    }
    cont.appendChild(field)
    const button = createElement('button', {
        className: 'mdc-icon-button material-icons mdc-theme--error',
        textContent: 'remove'
    })
    new mdc.ripple.MDCRipple(button);
    cont.appendChild(button);
    return cont
}

function originMatch(origin) {
    const origins = ['https://growthfile-207204.firebaseapp.com', 'https://growthfile.com', 'https://growthfile-testing.firebaseapp.com', 'http://localhost:5000', 'http://localhost','https://growthfilev2-0.firebaseapp.com']
    return origins.indexOf(origin) > -1;
}

window.addEventListener('message', function (event) {
    if (!originMatch(event.origin)) return;
    if (!deviceType) {
        deviceType = event.data.deviceType
    }
    parentOrigin = event.origin
    window[event.data.name](event.data.template,event.data.body)
})


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
            if (name_object[value]) {
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

function createPhoneNumberLi(contactObject, withoutIcon, callback) {

    const li = createElement('li', {
        className: 'mdc-list-item',
    })
    li.dataset.number = contactObject.phoneNumber;

    li.innerHTML = `<span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">${contactObject.displayName}</span>
        <span class="mdc-list-item__secondary-text">${contactObject.phoneNumber}</span>
    </span>`
    if (withoutIcon) {
        return li;
    }
    const clearIcon = createElement('span', {
        className: 'mdc-list-item__meta material-icons mdc-theme--error',
        textContent: 'clear'
    })
    clearIcon.addEventListener('click', function (e) {
        e.preventDefault();
        li.remove();
        if (callback) {
            callback();
        }
    })
    li.appendChild(clearIcon);
    return li
}



function setHelperInvalid(field, shouldShake = true) {
    field.focus();
    field.foundation_.setValid(false);
    field.foundation_.adapter_.shakeLabel(shouldShake);
}

function setHelperValid(field) {
    field.focus();
    field.foundation_.setValid(true);
}

const phoneFieldInit = (input,dropEl,hiddenInput) => {
  
    return intlTelInput(input, {
        initialCountry: "IN",
        formatOnDisplay: true,
        separateDialCode: true,
        dropdownContainer:dropEl || null,
        hiddenInput:hiddenInput || "",
        nationalMode:false
    });
  };

  const getPhoneFieldErrorMessage = (code) => {
    let message = ''
    switch (code) {
        case 1:
            message = 'Please enter a correct country code';
            break;

        case 2:
            message = 'Number is too short';
            break;
        case 3:
            message = 'Number is too long';
            break;
        case 4:
            message = 'Invalid Number'
            break;

        default:
            message = ''
            break
    }
    return message;
}
  

function textFieldTelephone(attr) {
    const textField = createElement('div', {
        className: `${attr.customClass ? attr.customClass :''} mdc-text-field mdc-text-field--outlined ${attr.disabled ? 'mdc-text-field--disabled' :''} ${attr.label ? '' :'mdc-text-field--no-label'}`,
        id: attr.id
    })
    textField.innerHTML = `<input placeholder="${attr.placeholder || 'Phone number'}" class="mdc-text-field__input" value='${attr.value || ''}' type='tel' ${attr.disabled ? 'disabled':''} ${attr.required ? 'required':''}>
    <div class="mdc-notched-outline">
    <div class="mdc-notched-outline__leading"></div>
    ${attr.label ?`<div class="mdc-notched-outline__notch">
    <label for='tel' class="mdc-floating-label">${attr.label}</label>
    </div>`  :''}
    <div class="mdc-notched-outline__trailing"></div>
    </div>`
    return textField
}


function textField(attr) {
    const div = createElement('div', {
        className: `mdc-text-field mdc-text-field--outlined full-width ${attr.leadingIcon ? 'mdc-text-field--with-leading-icon' :''} ${attr.trailingIcon ? 'mdc-text-field--with-trailing-icon' :''} ${attr.disabled ? 'mdc-text-field--disabled' :''}`,
        id: attr.id
    })
    div.innerHTML = `
    ${attr.leadingIcon ? `<i class="material-icons mdc-text-field__icon" tabindex="0" role="button">${attr.leadingIcon}</i>`:''}
    <input autocomplete=${attr.autocomplete ? attr.autocomplete : 'off'} type="${attr.type || 'text'}" class="mdc-text-field__input" value="${attr.value || ''}"  ${attr.required ? 'required' :''}  ${attr.disabled ? 'disabled':''} >
    ${attr.trailingIcon ? `<i class="material-icons mdc-text-field__icon" tabindex="0" role="button">${attr.trailingIcon}</i>` :''}
    
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label  class="mdc-floating-label">${attr.label}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  `
    return div
}

function productCard(productName) {
    const productFields = [{
        name: 'Quantity',
        icon: 'add',
        type: 'quantity'
    },{
        name: 'Rate',
        icon: 'add',
        type: 'rate'
    },{
        name: 'Date',
        icon: 'event',
        type: 'date'
    }];

    const card = createElement('div', {
        className: 'mdc-card mdc-card--outlined product-card mt-10'
    })
    card.dataset.productName = productName;
    const heading = createElement('div', {
        className: 'inline-flex'
    })
    heading.appendChild(createElement('h1', {
        className: 'mdc-typography--headline6 mt-0 mb-0',
        textContent: productName
    }))
    const removeCardIcon = createElement('button', {
        className: 'mdc-icon-button material-icons mdc-theme--error',
        textContent: 'delete',
        style: 'margin-left:auto',
        id:'remove-card'
    });

    heading.appendChild(removeCardIcon);
    const primary = createElement('div', {
        className: ''
    })
    const chipCont = createElement('div', {
        className: 'chip-cont'
    })
    const fieldCont = createElement('div', {
        className: 'field-cont'
    })



 
    const chipSet = createElement('div', {
        className: 'mdc-chip-set mdc-chip-set--choice'
    })
    chipSet.role = 'grid';
    productFields.forEach(function(type){
        chipSet.appendChild(createChip(type))
    })
    
    chipCont.appendChild(chipSet);

    const chipSetInit = new mdc.chips.MDCChipSet(chipSet);
    chipSetInit.listen('MDCChip:interaction', function (event) {
        event.preventDefault();
        console.log(chipSetInit)
        console.log(event);
        const selectedChip = document.getElementById(event.detail.chipId)
        selectedChip.classList.add('hidden')
        let field;
        
        
        if (selectedChip.dataset.type === 'quantity') {
            field = textFieldRemovable('number', 'Quantity');
        }
        if (selectedChip.dataset.type === 'rate') {
            field = textFieldRemovable('number', 'Rate');
            field.querySelector('input').setAttribute('min',1);
            field.querySelector('input').setAttribute('step','any');
            field.querySelector('input').onkeydown = function(evt){
                console.log(evt.keyCode)
                if(evt.keyCode == 190) return true;
                if (!((evt.keyCode > 95 && evt.keyCode < 106) ||
                        (evt.keyCode > 47 && evt.keyCode < 58) ||
                        evt.keyCode == 8)) {
                    return false;
                }
            }
        }
        if (selectedChip.dataset.type === 'date') {
            field = textFieldRemovable('date', 'Date');
        };

        field.querySelector('.mdc-icon-button').addEventListener('click',function(e){
            e.preventDefault();
            selectedChip.classList.remove('hidden')
            field.remove();
        })
        fieldCont.appendChild(field);
        const fieldInit =  new mdc.textField.MDCTextField(field.querySelector('.mdc-text-field'));
        fieldInit.root_.dataset.productDetail = selectedChip.dataset.type;
        fieldInit.focus();

    });


    card.appendChild(heading)
    primary.appendChild(chipCont)
    primary.appendChild(fieldCont)
    card.appendChild(primary);
    return card;
}

function createChip(attr) {
    const chip = createElement('div', {
        className: 'mdc-chip'
    })
    chip.role = 'row';
    chip.dataset.type = attr.type
    chip.innerHTML = `<div class="mdc-chip__ripple"></div>
    <i class="material-icons mdc-chip__icon mdc-chip__icon--leading">${attr.icon}</i>
    <span role="gridcell">
      <span role="button" tabindex="0" class="mdc-chip__text">${attr.name}</span>
    </span>`
    return chip
}


function textFieldTelephoneWithHelper(attr) {
    const cont = createElement('div', {
        className: 'text-field-container'
    })
    if (attr.classList) {
        attr.classList.forEach(function (name) {
            cont.classList.add(name)
        });
    }
    cont.innerHTML = `
    ${textFieldTelephone(attr).outerHTML}
    <div class="mdc-text-field-helper-line">
      <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg"></div>
    </div>
`
    return cont
}

function isPhoneNumberValid(iti) {
    var errorCode = iti.getValidationError();
    
    const result = {
        message:'',
        valid:false
    }
    if(errorCode)  {
        result.message = getPhoneFieldErrorMessage(errorCode);
        return result
    }
    if(!iti.isValidNumber()){
        result.message = 'Invalid number';
        return result
    }
    result.valid = true;
    return result;
}