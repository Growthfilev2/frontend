function createElement(tagName, attrs) {
    const el = document.createElement(tagName)
    if (attrs) {
        Object.keys(attrs).forEach(function (attr) {
            el[attr] = attrs[attr]
        })
    }
    return el;
}




function createFab(icon, id = '') {
    const button = createElement('button', {
        className: 'mdc-fab  mdc-button--raised mdc-fab app-fab--absolute ',
        id: id
    });


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

function actionButton(name, id = '') {
    const actionContainer = createElement('div', {
        className: 'action-button-container'
    })
    const submitContainer = createElement('div', {
        className: 'submit-button-cont'
    })
    const button = createButton(name, id);
    button.classList.add('mdc-button--raised', 'submit-btn');
    new mdc.ripple.MDCRipple(button);
    submitContainer.appendChild(button);
    actionContainer.appendChild(submitContainer);
    return actionContainer;

}

function createExtendedFab(icon, name, id, absolute) {
    const button = createElement('button', {
        className: 'mdc-fab mdc-fab--extended mdc-button--raised mdc-fab-custom',
        id: id
    })
    if (absolute) {
        button.classList.add('app-fab--absolute')
    }
    button.innerHTML = `
                   <span class="material-icons mdc-fab__icon">${icon}</span>
                   <span class="mdc-fab__label">${name}</span>
                   <div class="mdc-fab__ripple"></div>
                   `
    new mdc.ripple.MDCRipple(button);
    return button
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

function setHeader(sectionStart, sectionEnd) {
    const el = document.getElementById('app-header');
    el.querySelector('#section-start').innerHTML = sectionStart;
    el.querySelector('#section-end').innerHTML = sectionEnd;
    return new mdc.topAppBar.MDCTopAppBar(el);
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
    <input class="mdc-text-field__input" value='${attr.value || ''}' type='tel' ${attr.disabled ? 'disabled':''} ${attr.required ? 'required':''}>
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
    <input autocomplete=${attr.autocomplete ? attr.autocomplete : 'off'} type="${attr.type || 'text'}" class="mdc-text-field__input" value="${attr.value || ''}" ${attr.required ? 'required' :''} ${attr.disabled ? 'disabled':''} ${attr.readonly ? 'readonly' :''} >
    ${attr.trailingIcon ? `<i class="material-icons mdc-text-field__icon" tabindex="0" role="button">${attr.trailingIcon}</i>` :''}
    
    <div class="mdc-notched-outline ${attr.label ? '' :'mdc-notched-outline--no-label'}">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label  class="mdc-floating-label">${attr.label ? attr.label : ''}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>`
}

function textFieldWithHelper(attr) {
    const cont = createElement('div', {
        className: 'text-field-container'
    })
    if (attr.classList) {
        attr.classList.forEach(function (name) {
            cont.classList.add(name)
        });
    }
    cont.innerHTML = `
    ${textField(attr)}
    <div class="mdc-text-field-helper-line">
      <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg"></div>
    </div>
`
    return cont
}

function textAreaWithHelper(attr) {
    const cont = createElement('div', {
        className: 'text-field-container'
    })
    if (attr.classList) {

        attr.classList.forEach(function (name) {
            cont.classList.add(name)
        });
    }
    cont.innerHTML = `
    ${textArea(attr)}
    <div class="mdc-text-field-helper-line">
      <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg"></div>
    </div>
`
    return cont
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


function createCheckBox(id, label = '') {
    return `
    <div class="mdc-form-field">
  <div class="mdc-checkbox">
    <input type="checkbox"
           class="mdc-checkbox__native-control"
           id=${id}/>
    <div class="mdc-checkbox__background">
      <svg class="mdc-checkbox__checkmark"
           viewBox="0 0 24 24">
        <path class="mdc-checkbox__checkmark-path"
              fill="none"
              d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
      </svg>
      <div class="mdc-checkbox__mixedmark"></div>
    </div>
    <div class="mdc-checkbox__ripple"></div>
  </div>
  <label for="${id}">${label}</label>
</div>`
}





var xStart = null;
var yStart = null;
var sliderElement;
var sliderCallback = null;

function swipe(el, callback) {
    if (!el) return;
    sliderElement = el;
    sliderCallback = callback;
    el.addEventListener('touchstart', handleTouchStart, false);
    el.addEventListener('touchmove', handleTouchMove, false);
}

function removeSwipe() {
    if (!sliderElement) return;
    sliderElement.removeEventListener('touchstart', handleTouchStart, false);
    sliderElement.removeEventListener('touchmove', handleTouchMove, false);
    sliderElement = null;
    sliderCallback = null;
}

function handleTouchStart(evt) {

    const firstTouch = evt.touches[0];
    xStart = firstTouch.clientX
    yStart = firstTouch.clientY
}

function handleTouchMove(evt) {
    if (!xStart) return

    const xEnd = evt.touches[0].clientX;
    const yEnd = evt.touches[0].clientY;

    const xAxisDiff = xEnd - xStart;
    const yAxisDiff = yEnd - yStart;
    let direction = '';
    

    if (Math.abs(xAxisDiff) > Math.abs(yAxisDiff)) {
        if (xAxisDiff > 0) {

           direction = 'left'
            // left
        } else {

           direction = 'right'
            //right
        }
    } else {
        if (yAxisDiff > 0) {

           direction = 'down'
        } else {

           direction = 'up'
        }
    }
    xStart = null;
    yStart = null;
    sliderCallback(direction);
}


function createCheckBoxList(attr) {
    return `<li class='mdc-list-item checkbox-list' tabindex="-1">
    <span class='mdc-list-item__text'>
        <span class='mdc-list-item__primary-text'>${attr.primaryText.trim()}</span>
        <span class='mdc-list-item__secondary-text mdc-theme--primary'>${attr.secondaryText.trim()}</span>
    </span>
    <span class="mdc-list-item__graphic mdc-list-item__meta">
    <div class="mdc-checkbox">
        <input type="checkbox"
                class="mdc-checkbox__native-control"
                id="demo-list-checkbox-item-${attr.index}" />
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
</li>`
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
    ${textFieldTelephone(attr)}
    <div class="mdc-text-field-helper-line">
      <div class="mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg"></div>
    </div>
`
    console.log(cont)
    return cont
}




const createDynamiclink = (urlParam, socialInfo) => {
    return new Promise((resolve, reject) => {
        const param = new URLSearchParams(urlParam);
        let office;
        console.log(param.get('office'))
        if (param.get('office')) {
            office = decodeURI(param.get('office'))
        }
        const storedLinks = JSON.parse(localStorage.getItem('storedLinks'));
        if (storedLinks && storedLinks[office]) {
            return resolve(storedLinks[office])
        }

        fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${appKey.getKeys().apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                "dynamicLinkInfo": {
                    "domainUriPrefix": appKey.dynamicLinkUriPrefix(),
                    "link": `https://growthfile-207204.firebaseapp.com/v2/${urlParam}`,
                    "androidInfo": {
                        "androidPackageName": "com.growthfile.growthfileNew",
                        "androidMinPackageVersionCode": "15",
                    },
                    "navigationInfo": {
                        "enableForcedRedirect": true,
                    },
                    "iosInfo": {
                        "iosBundleId": "com.Growthfile.GrowthfileNewApp",
                        "iosAppStoreId": "1441388774",
                    },
                    "desktopInfo": {
                        "desktopFallbackLink": "https://www.growthfile.com/welcome.html"
                    },
                    "analyticsInfo": {
                        "googlePlayAnalytics": {
                            "utmSource": "share_link_employee_app",
                            "utmMedium": "share_widget",
                            "utmCampaign": "share_link",
                            "utmTerm": "share_link+create",
                            "utmContent": "Share",
                        }
                    },
                    "socialMetaTagInfo": socialInfo,
                },
                "suffix": {
                    "option": "UNGUESSABLE"
                }
            }),
            headers: {
                'Content-type': 'application/json',
            }
        }).then(response => {
            return response.json()
        }).then(function (url) {
            const linkObject = {}
            linkObject[param.get('office')] = url.shortLink;
            localStorage.setItem('storedLinks', JSON.stringify(linkObject));
            resolve(url.shortLink)
        }).catch(reject)
    });
}



const shareWidget = (link, office) => {
    const auth = firebase.auth().currentUser;
    const shareText = `Hi ${auth.displayName} from ${office} wants you to use Growthfile to mark daily attendance, apply for leave and regularize attendance. To download please click `
    const el = createElement('div', {
        className: 'share-widget'
    })
    const grid = createElement('div',{
        className:'mdc-layout-grid'
    })
   

    grid.appendChild(createElement('h3', {
        className: 'mdc-typography--headline6 mb-10 mt-0 text-center',
        textContent: 'Invite users to join'
    }))
    grid.appendChild(createElement('h3', {
        className: 'mdc-typography--headline5 mt-10 text-center mdc-theme--primary',
        textContent: office
    }))

    const linkManager = createElement('div', {
        className: 'link-manager'
    })
    const shortLinkPath = new URL(link).pathname
    linkManager.innerHTML = textField({
        value:shortLinkPath.slice(1,shortLinkPath.length),
        trailingIcon:'share',
        readonly:true,
    })
    const field = new mdc.textField.MDCTextField(linkManager.querySelector('.mdc-text-field'))
    console.log(field)
    field.trailingIcon_.root_.addEventListener('click',function(){
        field.focus()
        callShareInterface(link,shareText);
    })

    const tempInput = createElement('input', {
        value: shareText + link
    })
    document.body.appendChild(tempInput)
    copyRegionToClipboard(tempInput)
    tempInput.remove();
    
    grid.appendChild(linkManager)
    el.appendChild(grid)
    
    return el;
}

const parseURL = () => {
    const search = window.location.search;
    if (!search) return;
    const param = new URLSearchParams(search);
    return param;

}

const encodeString = (string) => {
    return encodeURIComponent(string)
}

const callShareInterface = (link,shareText) => {
    const shareObject = {
        link: link,
        shareText: shareText+link,
        type: 'text/plain',
        email: {
            cc: 'help@growthfile.com',
            subject: 'Download this app',
            body: ''
        }
    }
    if(native.getName() === 'Android') {
        AndroidInterface.share(JSON.stringify(shareObject))
        return
    }
    webkit.messageHandlers.share.postMessage(shareObject);
}


const copyRegionToClipboard = (el) => {
    el.select();
    el.setSelectionRange(0, 9999);
    document.execCommand("copy")
    snacks('Link copied','OKay',null,8000)
}