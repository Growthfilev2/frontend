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
    return JSON.stringify(body)
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
    Object.keys(attrs).forEach(function (attr) {
        el[attr] = attrs[attr]
    })
    return el;
}

function Dialog(title, content) {
    this.title = title;
    this.content = content;

}
Dialog.prototype.create = function () {
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
        contentContainer.textContent = this.content
    }
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
        textContent: 'okay'
    })
    okButton.setAttribute('data-mdc-dialog-action', 'accept')
    footer.appendChild(cancelButton)
    footer.appendChild(okButton);
    surface.appendChild(h2)
    surface.appendChild(contentContainer)
    surface.appendChild(footer)
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

function tabBarBase() {
    const parent = createElement('div', {
        className: 'mdc-tab-bar'
    });
    parent.setAttribute('role', 'tablist');
    const scroller = createElement('div', {
        className: 'mdc-tab-scroller'
    });
    const area = createElement('div', {
        className: 'mdc-tab-scroller__scroll-area'
    });
    const content = createElement('div', {
        className: 'mdc-tab-scroller__scroll-content',

    });
    area.appendChild(content)
    scroller.appendChild(area)
    parent.appendChild(scroller)
    return parent;

}

function addTabs(headerData) {
    const button = createElement('button', {
        className: 'mdc-tab'
    })
    button.setAttribute('role', 'tab');
    const indicator = createElement('span', {
        className: 'mdc-tab-indicator'
    })
    indicator.appendChild(createElement('span', {
        className: 'mdc-tab-indicator__content mdc-tab-indicator__content--underline'
    }))
    if (!headerData.index) {
        button.setAttribute("aria-selected", "true")
        button.setAttribute("tabindex", "0")
        button.classList.add('mdc-tab--active')
        indicator.classList.add('mdc-tab-indicator--active')
    }
    const buttonContent = createElement('div', {
        className: 'mdc-tab__content'
    })
    const label = createElement('span', {
        className: 'mdc-tab__text-label',
        textContent: headerData.name
    })
    buttonContent.appendChild(label)

    const ripple = createElement('span', {
        className: 'mdc-tab__ripple'
    })

    button.appendChild(buttonContent)
    button.appendChild(indicator)
    button.appendChild(ripple);
    return button;
}

function InputField() {}
InputField.prototype.base = function () {
    return createElement('div', {
        className: 'mdc-text-field filled-background  mdc-text-field--fullwidth',
    });
}
InputField.prototype.input = function () {
    return createElement('input', {
        className: 'mdc-text-field__input'
    });
}
InputField.prototype.ripple = function () {
    return createElement('div', {
        className: 'mdc-line-ripple'
    })
}
InputField.prototype.label = function (labelName) {
    return createElement('label', {
        className: 'mdc-floating-label',
        textContent: labelName
    })
}
InputField.prototype.withoutLabel = function () {
    const field = this.base();
    const input = this.input();
    field.appendChild(input);
    field.appendChild(this.ripple())
    return new mdc.textField.MDCTextField(field)
}
InputField.prototype.withLabel = function (labelName) {
    const field = this.base();
    const input = this.input();
    field.appendChild(input);
    field.appendChild(this.label(labelName))
    field.appendChild(this.ripple())
    return new mdc.textField.MDCTextField(field)
}
InputField.prototype.withLeadingIcon = function (iconName, labelName) {
    const field = this.base();
    field.classList.remove('data--value-list', 'mdc-text-field--fullwidth')
    field.classList.add('mdc-text-field--with-leading-icon')
    const icon = createElement('i', {
        className: 'material-icons mdc-text-field__icon',
        textContent: iconName
    })
    field.appendChild(icon)
    field.appendChild(this.input())
    field.appendChild(this.label(labelName))
    field.appendChild(this.ripple())
    return new mdc.textField.MDCTextField(field);

}

function textAreaField(attrs) {
    const textArea = createElement('textarea', {
        className: 'text-area-basic mdc-text-field__input',
        rows: attrs.rows
    })
    textArea.value = attrs.value
    if (!attrs.readonly) {
        textArea.setAttribute('readonly', 'true');
    }
    return textArea
}

function selectMenu(attr) {
    const div = createElement('div', {
        className: 'mdc-select'
    });
    const icon = createElement('i', {
        className: 'mdc-select__dropdown-icon'
    })

    const select = createElement('select', {
        className: 'mdc-select__native-control'
    })

    for (var i = 0; i < attr.data.length; i++) {
        select.appendChild(createElement('option', {
            textContent: attr.data[i],
            value: attr.data[i],
            selected: attr.data[i] === attr.selected ? true : false
        }));
    }
    const label = createElement('label', {
        className: 'mdc-floating-label',
        textContent: attr.labelText
    });

    div.appendChild(icon)
    div.appendChild(select)

    div.appendChild(label)
    const rippleField = new InputField();
    div.appendChild(rippleField.ripple())
    return new mdc.select.MDCSelect(div)
}

function notchedOultine() {
    const outline = createElement('div', {
        className: 'mdc-notched-outline'
    })
    const leading = createElement('div', {
        className: 'mdc-notched-outline__leading'
    })
    const trialing = createElement('div', {
        className: 'mdc-notched-outline__trailing'
    })
    outline.appendChild(leading)
    outline.appendChild(trialing)
    return outline
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
    console.log(this)
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


function AppendMap(el) {
    this.el = el;
    this.options = {
        zoom: 16,
        disableDefaultUI: true
    }
    this.location = ''
}
AppendMap.prototype.setLocation = function (location) {
    this.options.center = location
    this.location = location
}
AppendMap.prototype.setZoom = function (zoom) {
    this.options.zoom = zoom
}

AppendMap.prototype.map = function () {

    return new google.maps.Map(this.el, this.options);

}

AppendMap.prototype.withCustomControl = function () {
    var customControlDiv = document.createElement('div');
    var customControl = new MapsCustomControl(customControlDiv, map, this.location.lat, this.location.lng);
    customControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);
}
AppendMap.prototype.getMarker = function (extras) {
    var markerConfig = {
        position: this.location,
        map: this.map(),
    }
    if (extras) {
        Object.keys(extras).forEach(function (extra) {
            markerConfig[extra] = extras[extra]
        })
    }
    this.el.style.height = '400px';

    return new google.maps.Marker(markerConfig);
}
AppendMap.prototype.geocodeCustomerMarker = function (marker) {
    return new Promise(function (resolve, reject) {

        google.maps.event.addListener(marker, 'dragend', function () {
            geocodePosition(marker.getPosition(), data).then(function (updatedRecord) {
                if (updatedRecord.customerRecord) {
                    addressField.value = updatedRecord.customerRecord.venue[0].address
                } else {
                    addressField.value = updatedRecord.venue[0].address
                }
            }).catch(function (error) {
                handleError({
                    message: 'geocode Error in autocomplete listener for' + data.template,
                    body: JSON.stringify(error)
                })
                locationErrorText.textContent = 'Failed to detect your current Location. Search For A new Location or choose existing'
            })
        });
    });
}

function radioList(attr) {
    const li = document.createElement('li')
    li.className = `mdc-list-item`
    li.setAttribute('role', 'radio');

    if (attr.index) {
        li.setAttribute('tabindex', "0");
    }
    if (attr.selected) {
        li.setAttribute('aria-checked', "true")

    }
    const itemGraphic = createElement('span', {
        className: 'mdc-list-item__graphic'
    })
    itemGraphic.appendChild(createRadioInput(attr))

    li.appendChild(itemGraphic);
    const label = createElement('label', {
        className: 'mdc-list-item__text',
        textContent: attr.labelText.charAt(0).toUpperCase() + attr.labelText.slice(1)
    })

    li.appendChild(label)
    label.setAttribute('for', 'list-radio-item-' + attr.index);

    return li;
}

function userList(attr, actionable) {
    const li = document.createElement('li')
    li.className = `mdc-list-item`
    li.dataset.phoneNumber = attr.value.mobile

    if (attr.index) {
        li.setAttribute('tabindex', "0");
    }
    if (attr.selected) {
        li.setAttribute('aria-checked', "true")
    }

    const dataObject = createElement('object', {
        className: 'mdc-list-item__graphic',
        data: attr.value.photoURL || './img/empty-user.jpg',
        type: 'image/jpeg'
    })
    const photoGraphic = createElement('img', {
        className: 'empty-user-assignee',
        src: './img/empty-user.jpg'
    })
    dataObject.appendChild(photoGraphic)
    li.appendChild(dataObject);

    const text = createElement('span', {
        className: 'mdc-list-item__text'
    })
    text.appendChild(createElement('span', {
        className: 'mdc-list-item__primary-text',
        textContent: attr.value.displayName || attr.value.mobile
    }))
    text.appendChild(createElement('span', {
        className: 'mdc-list-item__secondary-text',
        textContent: attr.value.mobile
    }))

    li.appendChild(text);
    if(actionable) {
        const itemGraphic = createElement('span', {
            className: 'mdc-list-item__meta'
        })
        if(attr.singleSelection) {
            li.setAttribute('role', 'radio');
            itemGraphic.appendChild(createRadioInput(attr))
        }
        else {
            li.setAttribute('role', 'checkbox');
            attr.disabled = true
            itemGraphic.appendChild(createCheckBox(attr))
        }
        li.appendChild(itemGraphic);
    }
    return li
}



function createRadioInput(attr) {
    const div = createElement('div', {
        className: 'mdc-radio'
    })
    const input = createElement('input', {
        className: 'mdc-radio__native-control'
    });
    input.setAttribute('name', 'listDemoRadioGroup')
    input.type = 'radio'
    input.value = JSON.stringify(attr.value),
        input.id = 'list-radio-item-' + attr.index
    const radioBckg = createElement('div', {
        className: 'mdc-radio__background'
    })
    const outerRadio = createElement('div', {
        className: 'mdc-radio__outer-circle'
    })
    const innerRadio = createElement('div', {
        className: 'mdc-radio__inner-circle'
    })
    radioBckg.appendChild(outerRadio)
    radioBckg.appendChild(innerRadio)
    div.appendChild(input)
    div.appendChild(radioBckg)
    return div;

}

function createCheckBox(attr) {
     const checkbox = createElement('div', {
        className: 'mdc-checkbox mdc-list-item__meta'
    });
    if(attr.disabled) {
        checkbox.classList.add('mdc-checkbox--disabled')
    }
    const input = createElement('input', {
        className: 'mdc-checkbox__native-control',
        type: 'checkbox',
        value: JSON.stringify(attr.value)
    })
    input.setAttribute('tabindex', '-1')
    const checkbox_bckg = createElement('div', {
        className: 'mdc-checkbox__background'
    })

    const svg = `<svg class="mdc-checkbox__checkmark"
      viewBox="0 0 24 24">
      <path class="mdc-checkbox__checkmark-path"
      fill="none"
      d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
      </svg>
      <div class="mdc-checkbox__mixedmark"></div>`

    checkbox_bckg.innerHTML = svg;
    checkbox.appendChild(input)
    checkbox.appendChild(checkbox_bckg);

    return checkbox
}

function chipSet(text, canEdit) {
    const div = createElement('div', {
        className: 'mdc-chip-set'
    });

    const chip = createElement('div', {
        className: 'mdc-chip mdc-chip--selected'
    })

    const textEl = createElement("div", {
        className: 'mdc-chip__text chip-text',
        textContent: text
    })
    chip.appendChild(textEl)
    if (canEdit) {
        const icon = createElement('i', {
            className: 'material-icons mdc-chip__icon mdc-chip__icon--trailing',
            textContent: 'cancel'
        })
        icon.setAttribute('tabindex', '0')
        icon.setAttribute('role', 'button')
        chip.appendChild(icon)
    }
    div.appendChild(chip)
    return div;
}