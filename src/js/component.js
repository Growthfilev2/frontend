
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

function Dialog(title, content,id) {
    this.title = title;
    this.content = content;
    this.id = id;
   
}

Dialog.prototype.create = function (type) {
    const parent = createElement('div', {
        className: 'mdc-dialog',
        role: 'alertDialog',
        id:this.id
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
    const h2 = createElement('h2',{
        className:'mdc-dialog__title',
    })
    h2.innerHTML = this.title
    const footer = createElement('footer', {
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


function getHeader(parentSelector,sectionStart,sectionEnd){
    const el = document.getElementById(parentSelector);
    el.querySelector('#section-start').innerHTML = sectionStart;
    el.querySelector('#section-end').innerHTML = sectionEnd;
    el.querySelector('#tabs').innerHTML = '';
    topAppBar = new mdc.topAppBar.MDCTopAppBar(el)
    // topAppBar.foundation_.adapter_.deregisterNavigationIconInteractionHandler('MDCTopAppBar:nav',handleNav);
    return topAppBar;
    
}

function createSimpleRadio(id,label){
    return `<div class='mdc-radio'>
    <input class="mdc-radio__native-control" type="radio" name="demo-radio-set" id=${id}>
    <div class="mdc-radio__background">
    <div class="mdc-radio__outer-circle">
    </div>
    <div class="mdc-radio__inner-circle">
    </div>
    </div>
    </div>
    <label for=${id}>${label}</label>
    `
}

function createSimpleToggle(id) {
    return `<div class="mdc-switch mdc-list-item__meta" id=${id}>
    <div class="mdc-switch__track"></div>
    <div class="mdc-switch__thumb-underlay">
      <div class="mdc-switch__thumb">
          <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch">
      </div>
    </div>
  </div>`
}

function createSimpleMenu(items,id){
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

function menuItemMap(item,geopoint){
    const li = createElement('li',{className:'mdc-list-item map-menu-item'})
    li.setAttribute('role','menuitem');
    let spanTag = `<a target="_blank") href='comgooglemaps://?center=${geopoint._latitude},${geopoint._longitude}' class="mdc-list-item__text" on>${item.name}</span>`
    if(native.getName() === 'Android') {
        spanTag = `<a href='geo:${geopoint._latitude},${geopoint._longitude}' class="mdc-list-item__text">${item.name}</a>`
    }
    
    li.innerHTML = `<span class="mdc-list-item__graphic mdc-menu__selection-group-icon">
    <i class='material-icons'>${item.icon}</i>
    </span>
    ${spanTag}`
    return li
}