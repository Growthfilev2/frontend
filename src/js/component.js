function createElement(tagName, attrs) {
    const el = document.createElement(tagName)
    if (attrs) {
        Object.keys(attrs).forEach(function (attr) {
            el[attr] = attrs[attr]
        })
    }
    return el;
}

// to do make visible on scroll only
function createFab(icon) {
    const button = createElement('button', {
        className: 'mdc-fab mdc-fab--without-icon app-fab--absolute mdc-button--raised mdc-fab--exited'
    })
    const span = createElement('span', {
        className: 'mdc-fab__icon material-icons',
        textContent: icon
    })
    button.appendChild(span)
    new mdc.ripple.MDCRipple(button);
    setTimeout(function () {
        button.classList.remove('mdc-fab--exited')
    }, 200)
    return button;
}

function createExtendedFab(icon, name, id, absolute) {
    const button = createElement('button', {
        className: 'mdc-fab mdc-fab--extended mdc-theme--primary-bg mdc-theme--on-primary',
        id: id
    })
    if (absolute) {
        button.classList.add('app-fab--absolute')
    }
    button.innerHTML = `<div class="mdc-fab__ripple"></div>
                   <span class="material-icons mdc-fab__icon">${icon}</span>
                   <span class="mdc-fab__label">${name}</span>`
    new mdc.ripple.MDCRipple(button);
    return button
}

function createButton(name, icon, id) {
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

function createLi(itemName) {
    const li = createElement('li', {
        className: 'mdc-list-item',
        textContent: itemName
    })
    return li
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


    surface.appendChild(h2)
    surface.appendChild(contentContainer);
    if (type !== 'simple') {

        const cancelButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Close'
        })
        cancelButton.setAttribute('data-mdc-dialog-action', 'close');


        const okButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Okay'
        });


        okButton.setAttribute('data-mdc-dialog-action', 'accept')
        this.footer.appendChild(cancelButton)
        this.footer.appendChild(okButton);
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




function getHeader(parentSelector, sectionStart, sectionEnd) {
    const el = document.getElementById(parentSelector);
    el.querySelector('#section-start').innerHTML = sectionStart;
    el.querySelector('#section-end').innerHTML = sectionEnd;

    topAppBar = new mdc.topAppBar.MDCTopAppBar(el)

    // topAppBar.foundation_.adapter_.deregisterNavigationIconInteractionHandler('MDCTopAppBar:nav',handleNav);
    return topAppBar;

}





function createSimpleMenu(items, id) {
    return `
    <div class="mdc-menu mdc-menu-surface" id="${id}">
    <ul class="mdc-list" role="menu" aria-hidden="true" aria-orientation="vertical" tabindex="-1">
    ${items.map(function(item){
        return ` <li class="mdc-list-item" role="menuitem">
        <span class="mdc-list-item__graphic mdc-menu__selection-group-icon">
        <i class='material-icons'>${item.icon}</i>
        </span>
        <span class="mdc-list-item__text">${item.name}</span>
        </li>`
    }).join("")}
    </ul>
    </div>
  `
}

function menuItemMap(item, geopoint) {
    const li = createElement('li', {
        className: 'mdc-list-item map-menu-item'
    })
    li.setAttribute('role', 'menuitem');
    let spanTag = `<a target="_blank") href='comgooglemaps://?center=${geopoint._latitude},${geopoint._longitude}' class="mdc-list-item__text" on>${item.name}</span>`
    if (native.getName() === 'Android') {
        spanTag = `<a href='geo:${geopoint._latitude},${geopoint._longitude}?q=${geopoint._latitude},${geopoint._longitude}' class="mdc-list-item__text">${item.name}</a>`
    }

    li.innerHTML = `<span class="mdc-list-item__graphic mdc-menu__selection-group-icon">
    <i class='material-icons'>${item.icon}</i>
    </span>
    ${spanTag}`
    return li
}

function textFieldTelephone(attr) {
    return `
    <div class="${attr.customClass ? attr.customClass :''} mdc-text-field mdc-text-field--outlined  mt-10 ${attr.disabled ? 'mdc-text-field--disabled' :''} ${attr.label ? '' :'mdc-text-field--no-label'}" id='${attr.id}'>
    <input class="mdc-text-field__input" value='${attr.value}' type='tel' ${attr.disabled ? 'disabled':''}>
    <div class="mdc-notched-outline">
    <div class="mdc-notched-outline__leading"></div>
    ${attr.label ?`<div class="mdc-notched-outline__notch">
    <label for='email' class="mdc-floating-label mdc-floating-label--float-above ">${attr.label}</label>
    </div>`  :''}
    <div class="mdc-notched-outline__trailing"></div>
    </div>
    </div>
    `
}

function textField(attr) {
    return `<div class="mdc-text-field mdc-text-field--outlined full-width ${attr.leadingIcon ? 'mdc-text-field--with-leading-icon' :''} ${attr.trailingIcon ? 'mdc-text-field--with-trailing-icon' :''} ${attr.disabled ? 'mdc-text-field--disabled' :''}" id='${attr.id}'>
    ${attr.leadingIcon ? `<i class="material-icons mdc-text-field__icon" tabindex="0" role="button">${attr.leadingIcon}</i>`:''}
    <input autocomplete=${attr.autocomplete ? attr.autocomplete : 'off'} type="text" class="mdc-text-field__input" value="${attr.value || ''}" type="${attr.type}" required="${attr.required || 'false'}" ${attr.disabled ? 'disabled':''}>
    ${attr.trailingIcon ? `<i class="material-icons mdc-text-field__icon" tabindex="0" role="button">${attr.trailingIcon}</i>` :''}
    
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label  class="mdc-floating-label">${attr.label}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>`
}

function textArea(attr) {
    return `<div class="mdc-text-field mdc-text-field--textarea" id="${attr.id}">
    <textarea  class="mdc-text-field__input" rows="4" cols="40" required="${attr.required}"></textarea>
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label for="textarea" class="mdc-floating-label">${attr.label}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>`
}


function createRadio(radioId, inputId) {
    const div = createElement('div', {
        className: 'mdc-radio',
        id: radioId
    })
    div.innerHTML = `<input class="mdc-radio__native-control" type="radio" id="${inputId}" name="radios">
    <div class="mdc-radio__background">
        <div class="mdc-radio__outer-circle"></div>
        <div class="mdc-radio__inner-circle"></div>
    </div>
    <div class="mdc-radio__ripple"></div>
    `
    new mdc.radio.MDCRadio(div);
    return div;
}






var xStart = null;
var yStart = null;

function swipe(el) {
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, false);
    el.addEventListener('touchmove', function(evt){
        handleTouchMove(evt,el)
    }, false);
}

function handleTouchStart(evt) {

    const firstTouch = evt.touches[0];
    xStart = firstTouch.clientX
    yStart = firstTouch.clientY
}

function handleTouchMove(evt,el) {
    if (!xStart) return

    const xEnd = evt.touches[0].clientX;
    const yEnd = evt.touches[0].clientY;

    const xAxisDiff = xEnd - xStart;
    const yAxisDiff = yEnd - yStart;

    const listenerDetail =  {
        direction:''
    }
    
   
    if (Math.abs(xAxisDiff) > Math.abs(yAxisDiff)) {
        if (xAxisDiff > 0) {
           
            listenerDetail.direction = 'left'
            // left
        } else {
           
            listenerDetail.direction = 'right'
            //right
        }
    } else {
        if (yAxisDiff > 0) {
           
            listenerDetail.direction = 'up'
        } else {
            
            listenerDetail.direction = 'down'
        }
    }
    xStart = null;
    yStart = null;
    var swipeEvent = new CustomEvent('siwpe', {
        detail: listenerDetail
    });
    el.dispatchEvent(swipeEvent);
}