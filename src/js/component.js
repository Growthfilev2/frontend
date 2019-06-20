function getCellularInformation() {
    let cellTowerQueryString;
    const mcc = AndroidInterface.getMobileCountryCode()
    const mnc = AndroidInterface.getMobileNetworkCode()
    const radioType = AndroidInterface.getRadioType()
    const carrier = AndroidInterface.getCarrier()
    const wifiQueryString = AndroidInterface.getWifiAccessPoints()
    try {
        cellTowerQueryString = AndroidInterface.getCellTowerInformation();
    } catch (e) {
        console.log(e)
    }
    let wifiAccessPointsArray = [];
    let cellTowerArray = [];
    if (wifiQueryString) {
        wifiAccessPointsArray = parseQuery(wifiQueryString)
    };
    if (cellTowerQueryString) {
        cellTowerArray = removeFalseCellIds(parseQuery(cellTowerQueryString))
    }
    const body = {}

    if (mcc) {
        body.homeMobileCountryCode = Number(mcc)
    }
    if (mnc) {
        body.homeMobileNetworkCode = Number(mnc)
    }
    if (carrier) {
        body.carrier = carrier
    }
    if (radioType) {
        body.radioType = radioType
    }

    if (wifiAccessPointsArray.length) {
        body.wifiAccessPoints = wifiAccessPointsArray
    }
    if (cellTowerArray.length) {
        body.cellTowers = cellTowerArray;
    }
    if (wifiAccessPointsArray.length && cellTowerArray.length) {
        body.considerIp = false
    } else {
        body.considerIp = true
    }

    return body
}

function removeFalseCellIds(cellTowers) {
    const max_value = 2147483647
    const filtered = cellTowers.filter(function (tower) {
        return tower.cellId > 0 && tower.cellId < max_value && tower.locationAreaCode > 0 && tower.locationAreaCode < max_value;
    });

    return filtered
}

function parseQuery(queryString) {

    var array = [];
    const splitBySeperator = queryString.split(",")
    splitBySeperator.forEach(function (value) {
        const url = new URLSearchParams(value);
        array.push(queryPatramsToObject(url))
    })
    return array;
}

function queryPatramsToObject(url) {
    let result = {};
    url.forEach(function (value, key) {
        if (key === 'macAddress') {
            result[key] = value
        } else {
            result[key] = Number(value)
        }
    })

    return result;
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

function createHeader(startContent, endContent, id) {
    const header = createElement('header', {
        className: 'mdc-top-app-bar',
        id: id
    });
    const div = createElement('div', {
        className: 'mdc-top-app-bar__row'
    })
    const start = createElement('section', {
        className: 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start'
    })

    startContent.forEach(function (label) {
        const a = createElement('a', {
            className: 'material-icons mdc-top-app-bar__navigation-icon',
            textContent: label
        })
        start.appendChild(a)
    })
    div.appendChild(start)

    if (endContent.length) {
        const end = createElement('section', {
            className: 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end'
        })
        end.setAttribute('role', 'toolbar')
        endContent.forEach(function (label) {
            const a = createElement('a', {
                className: 'material-icons mdc-top-app-bar__action-item',
                textContent: label
            })
            end.appendChild(a)
        })
        div.appendChild(end);
    }


    header.appendChild(div)
    return new mdc.topAppBar.MDCTopAppBar(header);
}


function Dialog(title, content) {
    this.title = title;
    this.content = content;

}

Dialog.prototype.create = function (type) {
    const parent = createElement('div', {
        className: 'mdc-dialog',
        role: 'alertDialog'
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
        className: `mdc-dialog__title ${this.title ? '':'hidden'}`,
        textContent: this.title
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
        const footer = createElement('footer', {
            className: 'mdc-dialog__actions'
        })
        const cancelButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'cancel'
        })
        cancelButton.setAttribute('data-mdc-dialog-action', 'close')
        const okButton = createElement('button', {
            className: 'mdc-button mdc-dialog__button',
            type: 'button',
            textContent: 'Create'
        });

        okButton.setAttribute('data-mdc-dialog-action', 'accept')
        footer.appendChild(cancelButton)
        footer.appendChild(okButton);
        surface.appendChild(footer)
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

function Button(name) {
    this.name = name
    var button = createElement('button', {
        className: 'mdc-button'
    })
    button.appendChild(createElement('span', {
        className: 'mdc-button__label',
        textContent: this.name
    }))
    this.base = button;
}
Button.prototype.getButton = function () {

    return new mdc.ripple.MDCRipple(this.base)
}
Button.prototype.disabled = function (value) {
    this.base.disabled = value
}
Button.prototype.raised = function () {
    this.base.classList.add('mdc-button--raised');
}
Button.prototype.shaped = function () {
    this.base.classList.add('shaped')
}
Button.prototype.selectorButton = function () {
    this.base.classList.add('selector-send', 'selector-submit--button')
}

function iconButton(attr) {
    this.base = createElement('button', {
        className: 'mdc-icon-button ' + attr.className,
        id: attr.id
    });
    this.base.setAttribute('aria-label', attr.label);
    this.base.setAttribute('aria-hidden', 'true')
    this.base.setAttribute('aria-pressed', 'false');
    this.base.appendChild(createElement('i', {
        className: 'material-icons mdc-icon-button__icon mdc-icon-button__icon--on',
        textContent: attr.initialState
    }))
    this.base.appendChild(createElement('i', {
        className: 'material-icons mdc-icon-button__icon',
        textContent: attr.finalState
    }))
    return new mdc.iconButton.MDCIconButtonToggle(this.base)
}

function Fab(name) {
    this.fabName = name
    var button = createElement('button', {
        className: 'mdc-fab'
    })
    this.span = createElement('span', {
        className: 'mdc-fab__icon material-icons',
        textContent: this.fabName
    })
    button.appendChild(this.span)
    this.base = button;
}
Fab.prototype = Object.create(new Button())
Fab.prototype.extended = function (labelName) {
    this.base.classList.add('mdc-fab--extended')
    const label = createElement('label', {
        className: 'mdc-fab__label',
        textContent: labelName
    })
    this.base.appendChild(label);
    return this.getButton();
}


function getHeader(parentSelector,sectionStart,sectionEnd){
    const el = document.getElementById(parentSelector);
    el.querySelector('#section-start').innerHTML = sectionStart;
    el.querySelector('#section-end').innerHTML = sectionEnd;
    topAppBar = new mdc.topAppBar.MDCTopAppBar(el)
    topAppBar.foundation_.adapter_.deregisterNavigationIconInteractionHandler('MDCTopAppBar:nav',handleNav);
    return topAppBar;
    
}