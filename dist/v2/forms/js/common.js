let deviceType = ''
const parentOrigin = new URL(document.referrer).origin;
const allowedOrigins = {
    'https://growthfile.com': true,
    'https://growthfile-207204.firebaseapp.com': true
}

function sendFrameDimensions() {
    if (!allowedOrigins[parentOrigin]) return;
    parent.postMessage({
        name: 'resizeFrame',
        body: {
            width: document.body.offsetWidth,
            height: document.body.offsetHeight
        }
    }, parentOrigin)
}


window.addEventListener('load', function () {
    sendFrameDimensions()
    initMutation()
})

window.addEventListener('resize', function () {
    sendFrameDimensions()
})

window.addEventListener('message', function (event) {
    if (!allowedOrigins[event.origin]) return;
    if (!deviceType) {
        deviceType = event.data.deviceType
    }

    if (event.data.template) {
        window[event.data.name](event.data.template, event.data.body)
    } else {
        window[event.data.name](event.data.body)
    }
})

function initMutation() {
    const currentWidth = document.body.offsetWidth;
    const currentHeight = document.body.offsetHeight;

    const form = document.querySelector('form');
    const config = {
        attributes: true,
        attributeFilter: ['hidden'],
        childList: true,
        subtree: true
    }

    const callback = function (mutationsList, observer) {
        let resizeWindow = false
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                resizeWindow = true
            }
        }
        if (currentWidth === document.body.offsetWidth && currentHeight === document.body.offsetHeight) return;
        if (resizeWindow) sendFrameDimensions()
    };
    const observer = new MutationObserver(callback);
    observer.observe(form, config);
}



function callContact(functionName) {
    switch (deviceType) {
        case 'Android':
            parent.AndroidInterface.getContact(functionName);
            break;
        case 'Ios':
            parent.webkit.messageHandlers.getContact.postMessage(functionName);
            break;
        default:
            return textFieldRemovable('tel', '', 'Secondary contact');
    }
}

function textFieldRemovable(type, label, placeholder) {
    const cont = createElement('div', {
        className: 'inline-flex mt-10'
    })
    let field;
    if (type === 'tel') {
        field = textFieldTelephoneWithHelper({
            placeholder: placeholder,
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




function toggleSubmit() {
    var submit = document.querySelector('form input[type="submit"]');
    if (submit.disabled) {
        submit.disabled = false;
    } else {
        submit.disabled = true
    }
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
    event.target.setAttribute('hidden', true)
    document.querySelector('.' + className).removeAttribute('hidden');

    document.querySelector(`[data-name="${dataName}"]`).removeEventListener('change', startDateListen)
}


function initializeDates(subscriptionTemplate, defaultDateString, defaultTimeString) {

    subscriptionTemplate.schedule.forEach(function (name) {
        const startfield = document.querySelector(`[data-name="${name} start date"]`);
        const endField = document.querySelector(`[data-name="${name} end date"]`);
        const startTime = document.querySelector(`[data-name="${name} start time"]`);
        const endTime = document.querySelector(`[data-name="${name} end time"]`);
        if(startTime && endTime) {
            startTime.value = endTime.value = defaultTimeString;
        }
        startfield.addEventListener('change', function (evt) {
            endField.value = evt.target.value
            endField.min = evt.target.value
        });
        startfield.value = endField.value = endField.min = defaultDateString
    });
}

function createEmptySchedule(subscriptionTemplate) {
    const newSchedules = []
    let index = 0;
    const length = subscriptionTemplate.schedule.length;
    for (index; index < length; index++) {
        const name = subscriptionTemplate.schedule[index];

        newSchedules.push({
            name: name,
            startTime: '',
            endTime: '',
        })
    }
    return newSchedules;
}

function getNewSchedule(subscriptionTemplate) {
    const newSchedules = []
    let index = 0;
    let isScheduleValid = false;
    const length = subscriptionTemplate.schedule.length;
    for (index; index < length; index++) {
        const name = subscriptionTemplate.schedule[index];

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
      
        const startTime = document.querySelector(`[data-name="${name} start time"]`)
        const endTime = document.querySelector(`[data-name="${name} end time"]`);
        
        const startDate_UTS = Date.parse(startDate+' ' +(startTime ? startTime.value : ''));
        const endDate_UTS = Date.parse(endDate+' '+(endTime ? endTime.value : ''))
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

function createSelectOptions(data) {
    let string;
    data.forEach(function (value) {
        string += ` <option value="${value}">
    ${value}
  </option>`
    })
    return string;
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



function setHelperInvalid(field, message) {
    field.focus();
    field.foundation_.setValid(false);
    field.foundation_.adapter_.shakeLabel(true);
    field.helperTextContent = message
}

function setHelperValid(field) {
    field.focus();
    field.foundation_.setValid(true);
    field.helperTextContent = ''

}

const phoneFieldInit = (input, dropEl, hiddenInput) => {

    return intlTelInput(input, {
        initialCountry: "IN",
        formatOnDisplay: true,
        separateDialCode: true,
        dropdownContainer: dropEl || null,
        hiddenInput: hiddenInput || "",
        nationalMode: false
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
    }, {
        name: 'Rate',
        icon: 'add',
        type: 'rate'
    }, {
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
        id: 'remove-card'
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
    productFields.forEach(function (type) {
        chipSet.appendChild(createChip(type))
    })

    chipCont.appendChild(chipSet);

    const chipSetInit = new mdc.chips.MDCChipSet(chipSet);
    chipSetInit.listen('MDCChip:interaction', function (event) {
        event.preventDefault();
        console.log(chipSetInit)
        console.log(event);
        const selectedChip = document.getElementById(event.detail.chipId)
        selectedChip.setAttribute('hidden', true)
        let field;


        if (selectedChip.dataset.type === 'quantity') {
            field = textFieldRemovable('number', 'Quantity');
        }
        if (selectedChip.dataset.type === 'rate') {
            field = textFieldRemovable('number', 'Rate');
            field.querySelector('input').setAttribute('min', 1);
            field.querySelector('input').setAttribute('step', 'any');
            field.querySelector('input').onkeydown = function (evt) {
                console.log(evt.keyCode)
                if (evt.keyCode == 190) return true;
                if (!((evt.keyCode > 95 && evt.keyCode < 106) ||
                        (evt.keyCode > 47 && evt.keyCode < 58) ||
                        evt.keyCode == 8)) {
                    return false;
                }
            }
        }
        if (selectedChip.dataset.type === 'date') {
            field = textFieldRemovable('date', 'Date');
            field.querySelector('input').value = createDate(new Date())
        };

        field.querySelector('.mdc-icon-button').addEventListener('click', function (e) {
            e.preventDefault();
            selectedChip.removeAttribute('hidden')
            field.remove();
        })
        fieldCont.appendChild(field);
        const fieldInit = new mdc.textField.MDCTextField(field.querySelector('.mdc-text-field'));
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
        message: '',
        valid: false
    }
    if (errorCode) {
        result.message = getPhoneFieldErrorMessage(errorCode);
        return result
    }
    if (!iti.isValidNumber()) {
        result.message = 'Invalid number';
        return result
    }
    result.valid = true;
    return result;
}



function checkboxLi(label, id, value) {
    const li = createElement('li', {
        className: 'mdc-list-item'
    })
    li.setAttribute('role', 'checkbox')
    li.setAttribute('aria-checked', 'false');
    li.innerHTML = ` <span class="mdc-list-item__graphic">
    <div class="mdc-checkbox">
      <input type="checkbox"
              class="mdc-checkbox__native-control"
              id="checkbox-item-${id}" value="${value}" />
      <div class="mdc-checkbox__background">
        <svg class="mdc-checkbox__checkmark"
              viewBox="0 0 24 24">
          <path class="mdc-checkbox__checkmark-path"
                fill="none"
                d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
        </svg>
        <div class="mdc-checkbox__mixedmark"></div>
      </div>
    </div>
  </span>
  <span class='mdc-list-item__text' for="checkbox-item-${id}">
    <span class='mdc-list-item__primary-text'>${label}</span>
    <span class='mdc-list-item__secondary-text mdc-theme--primary'>${value}</span>
  </span>`
    return li;
}

function radioLi(label, id, value) {
    const li = createElement('li', {
        className: 'mdc-list-item'
    })
    li.setAttribute('role', 'radio')
    li.setAttribute('aria-checked', 'false');
    li.innerHTML = `
    <span class="mdc-list-item__graphic">
      <div class="mdc-radio">
        <input class="mdc-radio__native-control"
              type="radio"
              id="radio-${id}"
              name="demo-list-radio-item-group"
              value="1">
        <div class="mdc-radio__background">
          <div class="mdc-radio__outer-circle"></div>
          <div class="mdc-radio__inner-circle"></div>
        </div>
      </div>
    </span>
    <span class='mdc-list-item__text' for="radio-${id}">
        <span class='mdc-list-item__primary-text'>${label}</span>
        <span class='mdc-list-item__secondary-text mdc-theme--primary'>${value}</span>
    </span>
  </li>`
    return li
}

function createTime(dateObject) {
    let hours = dateObject.getHours();
    let minutes = dateObject.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes
    }
    return `${hours}:${minutes}`
}


function showSnacksApiResponse(message, buttonText = 'OK') {
    const sb = snackBar(message, buttonText);
    sb.open();

}

const snackBar = (labelText, buttonText) => {

    const container = createElement('div', {
        className: 'mdc-snackbar'
    })
    const surface = createElement('div', {
        className: 'mdc-snackbar__surface'
    })
    const label = createElement('div', {
        className: 'mdc-snackbar__label',
        role: 'status',
        'aria-live': 'polite',
        textContent: labelText
    })
    surface.appendChild(label)
    if (buttonText) {
        const actions = createElement('div', {
            className: 'mdc-snackbar__actions'
        })
        const button = createElement('button', {
            type: 'button',
            className: 'mdc-button mdc-snackbar__action',
            textContent: buttonText
        })
        actions.appendChild(button)
        surface.appendChild(actions)
    }

    container.appendChild(surface)
    const el = document.getElementById("snackbar-container")
    el.innerHTML = '';
    el.appendChild(container)
    const sb = new mdc.snackbar.MDCSnackbar(container);
    return sb;

}


function createButton(name, id, icon) {
    const button = createElement('button', {
        className: 'mdc-button',
        id: id || ''
    })
    const span = createElement('span', {
        className: 'mdc-button__label',
        textContent: name
    })

    if (icon) {
        const i = createElement('i', {
            className: 'material-icons mdc-button__icon',
            textContent: icon
        })
        button.appendChild(i)
    }
    button.appendChild(span)
    return button
}

function Dialog(title, content, id) {
    this.title = title;
    this.content = content;
    this.id = id;

}

Dialog.prototype.create = function (type) {
    const parent = createElement('div', {
        className: 'mdc-dialog',
        role: 'alertDialog',
        id: this.id
    })
    parent.setAttribute('aria-modal', 'true')
    parent.setAttribute('aria-labelledby', 'Title')
    parent.setAttribute('aria-describedby', 'content')
    const container = createElement('div', {
        className: 'mdc-dialog__container'
    })
    const surface = createElement('div', {
        className: 'mdc-dialog__surface'
    })
    const h2 = createElement('h2', {
        className: 'mdc-dialog__title',
    })
    h2.innerHTML = this.title
    this.footer = createElement('footer', {
        className: 'mdc-dialog__actions'
    })
    const contentContainer = createElement('div', {
        className: 'mdc-dialog__content'
    });

    if (this.content instanceof HTMLElement) {
        contentContainer.appendChild(this.content)
    } else {
        contentContainer.innerHTML = this.content
    }

    if (this.title) {
        surface.appendChild(h2)
    }
    surface.appendChild(contentContainer);
    if (type !== 'simple') {

        this.cancelButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Close'
        })
        this.cancelButton.setAttribute('data-mdc-dialog-action', 'close');
        this.cancelButton.style.marginRight = 'auto';

        this.okButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Okay'
        });


        this.okButton.setAttribute('data-mdc-dialog-action', 'accept')
        this.footer.appendChild(this.cancelButton)
        this.footer.appendChild(this.okButton);
        surface.appendChild(this.footer)
    }

    container.appendChild(surface)
    parent.appendChild(container);
    parent.appendChild(createElement('div', {
        className: 'mdc-dialog__scrim'
    }))

    const dialogParent = document.getElementById('dialog-container')
    dialogParent.innerHTML = ''
    dialogParent.appendChild(parent)
    return new mdc.dialog.MDCDialog(parent);
}

function dialogButton(name, action) {
    const button = createElement('button', {
        className: 'mdc-button mdc-dialog__button',
        type: 'button',
        textContent: name
    });
    button.setAttribute('data-mdc-dialog-action', action)
    return button;
}



function convertNumberToINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount)
}