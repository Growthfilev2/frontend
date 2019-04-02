function createElement(tagName, attrs) {
    const el = document.createElement(tagName)
    Object.keys(attrs).forEach(function (attr) {
        el[attr] = attrs[attr]
    })
    return el;
}

function InputField() {}
InputField.prototype.base = function () {
    return createElement('div', {
        className: 'mdc-text-field filled-background data--value-list mdc-text-field--fullwidth',
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
InputField.prototype.label = function(labelName){
    return createElement('label',{className:'mdc-floating-label',textContent:labelName})
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
InputField.prototype.withLeadingIcon = function(iconName,labelName){
    const field = this.base();
    field.classList.remove('data--value-list', 'mdc-text-field--fullwidth')
    field.classList.add('mdc-text-field--with-leading-icon')
    const icon = createElement('i',{className:'material-icons mdc-text-field__icon',textContent:iconName})
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
        className: 'mdc-select data--value-list'
    })
    div.id = attr.id
    const select = createElement('select', {
        className: 'mdc-select__native-control'
    })

    for (var i = 0; i < attr.data.length; i++) {
        select.appendChild(createElement('option', {
            textContent: attr.data[i],
            vale: attr.data[i]
        }));
    }
    const label = createElement('label', {
        className: 'mdc-floating-label'
    })
    label.textContent = ''
    div.appendChild(label)
    div.appendChild(select)
    const rippleField =  new InputField();
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
function Button(name){
    this.name = name
    var button = createElement('button',{className:'mdc-button'})
    button.appendChild(createElement('span',{className:'mdc-button__label',textContent:this.name}))
    this.base = button;
}
Button.prototype.getButton = function(){
    return new mdc.ripple.MDCRipple(this.base)
}
Button.prototype.disabled = function(value){
    this.base.disabled = value
}
Button.prototype.raised = function(){
    this.base.classList.add('mdc-button--raised');
}
Button.prototype.shaped = function(){
    this.base.classList.add('shaped')
}
Button.prototype.selectorButton = function(){
    this.base.classList.add('selector-send','selector-submit--button')
}

function Fab(name){
    this.fabName = name
    var button = createElement('button',{className:'mdc-fab'})
    this.span = createElement('span',{className:'mdc-fab__icon material-icons',textContent:this.fabName})
    button.appendChild(this.span)
    this.base = button;
}
Fab.prototype = Object.create(new Button())
Fab.prototype.extended = function(labelName){
    this.base.classList.add('mdc-fab--extended')
    const label = createElement('label',{className:'mdc-fab__label',textContent:labelName})
    this.base.appendChild(label);
    return this.getButton();   
}

function AppendMap(location, el,zoom) {
    this.location = location
    this.options = {
        zoom: zoom || 16,
        center: this.location,
        disableDefaultUI: true,
    };
    this.map = new google.maps.Map(el, this.options);
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
        map: this.map,
    }
    if(extras){

        Object.keys(extras).forEach(function (extra) {
            markerConfig[extra] = extras[extra]
        })
    }
    return new google.maps.Marker(markerConfig);
}

function radioList(attr) {
    const li = document.createElement('li')
    li.className = `mdc-list-item mdc-ripple-surface--secondary`
    li.setAttribute('role', 'radio');
    li.setAttribute('tabindex',"-1")
    li.textContent = attr.labelText.charAt(0).toUpperCase() + attr.labelText.slice(1);
    li.appendChild(createRadioInput(JSON.stringify(attr.value)))
    return li;
}

function createRadioInput(value) {
    const div = createElement('div',{className:'mdc-radio radio-control-selector mdc-list-item__meta'})
    const input = createElement('input',{className:'mdc-radio__native-control'})
    input.setAttribute('tabindex','-1');
    input.checked;
    input.setAttribute('name','listDemoRadioGroup')
    input.setAttribute('tabindex','-1')
    input.type = 'radio'
    input.value = value
    input.setAttribute('aria-labelledby','grp1')
    const radioBckg = createElement('div',{className:'mdc-radio__background'})
    const outerRadio = createElement('div',{className:'mdc-radio__outer-circle'})
    const innerRadio = createElement('div',{className:'mdc-radio__inner-circle'})
    radioBckg.appendChild(outerRadio)
    radioBckg.appendChild(innerRadio)
    div.appendChild(input)
    div.appendChild(radioBckg)
    return div;
  
  }
  function createCheckBox(attr) {
    console.log(attr)
    const checkbox = createElement('div',{className:'mdc-checkbox mdc-list-item__meta'});
    const input = createElement('input',{className:'mdc-checkbox__native-control',type:'checkbox',value:JSON.stringify(attr.value)})
    input.setAttribute('tabindex','-1')
    const checkbox_bckg = createElement('div',{className:'mdc-checkbox__background'})
  
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
  
    return new mdc.checkbox.MDCCheckbox(checkbox)
  }

  function chipSet(text,canEdit){
      const div = createElement('div',{className:'mdc-chip-set'});

        const chip = createElement('div',{className:'mdc-chip mdc-chip--selected'})
        
        const textEl = createElement("div",{className:'mdc-chip__text chip-text',textContent:text})
        chip.appendChild(textEl)
        if(canEdit) {
            const icon = createElement('i',{className:'material-icons mdc-chip__icon mdc-chip__icon--trailing',textContent:'cancel'})
            icon.setAttribute('tabindex','0')
            icon.setAttribute('role','button')
            chip.appendChild(icon)
        }
        div.appendChild(chip)
      return div;
  }