function selectorUI(data) {
  document.body.style.backgroundColor = 'white';
  document.body.classList.remove('mdc-dialog-scroll-lock')

  const parent = document.getElementById('app-current-panel');
  parent.innerHTML = ''
  const sectionStart = document.getElementById('section-start');
  sectionStart.innerHTML = ''
  sectionStart.appendChild(headerBackIcon(data.store))

  const container = createElement('div', {
    className: 'selector-container'
  })

  const warning = createElement('span', {
    className: 'selector-warning-text',
    id: 'selector-warning'
  })
  container.appendChild(warning);
  let buttonText = 'SELECT'
  if (data.store === 'users') {
    buttonText = 'Add New Number'
  }
  const submit = new Button(buttonText);
  submit.raised()
  submit.selectorButton();
  const submitButton = submit.getButton();
  submitButton.root_.id = 'selector-submit-send'
  if (data.store === 'users') {
    submitButton.root_.dataset.type = 'add-number'
  }
  submitButton.root_.onclick = function () {
    if (!isLocationStatusWorking()) return;
    const selectorWarning = container.querySelector('#selector-warning');
    let filterClass = '.mdc-radio'
    const filtered = getSelectedList(filterClass);
    if (!filtered.length) {
      selectorWarning.textContent = 'Please Select An Option'
      return;
    }
    selectorWarning.textContent = ''
    const value = JSON.parse(filtered[0].value);
    if (data.store === 'subscriptions') {
      if (value.template === 'dsr' || value.template === 'duty roster' || value.template === 'tour plan') {
        document.querySelector('header').appendChild(progressBar())
      }
      if (!isLocationStatusWorking()) return;
      createTempRecord(value.office, value.template, data);
    }
    return;
  }
  const radioListType = {
    users: true,
    children: true,
    map: true
  }
  if (!radioListType[data.store]) {
    container.appendChild(submitButton.root_)
  }
  window.scrollTo(0, 0);
  const types = {
    map: mapSelector,
    users: userSelector,
    subscriptions: fillSubscriptionInSelector,
    children: fillChildrenInSelector
  }

  types[data.store](data, container);
}

function mapSelector(data, container) {
  const parent = document.getElementById('app-current-panel')
  const field = new InputField().withLeadingIcon('search', 'Search Location');
  field.root_.id = 'map-selector-search'
  field.root_.classList.add('search-field')
  container.appendChild(field.root_);

  let input = field['input_'];
  input.placeholder = ''

  autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: {
      country: "in"
    }
  });
  autocomplete.addListener('place_changed', function () {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }
    const value = {
      location: place.name,
      address: formAddressComponent(place),
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    }
    updateCreateActivity(updateVenue(data, value).record, true)
    return;
  })

  console.log(data)
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction([data.store], 'readonly')
    const store = tx.objectStore('map');
    const office = data.record.office;
    const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
    const ul = createElement('ul', {
      className: 'mdc-list mdc-list--avatar-list map-selector-list'
    });
    ul.setAttribute('role', 'radiogroup');
    let index = 0;
    store.index('byOffice').openCursor(range, 'nextunique').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      if (cursor.value.office !== data.record.office) {
        cursor.continue();
        return;
      }
      if (!cursor.value.location) {
        cursor.continue();
        return;
      };
      if (!cursor.value.latitude || !cursor.value.longitude) {
        cursor.continue();
        return;
      };
      if (ul.querySelector(`[data-name="${cursor.value.location}"]`)) {
        cursor.continue();
        return;
      }
      const radioListMap = radioList({
        value: cursor.value,
        labelText: cursor.value.location,
        index: index
      })
      radioListMap.dataset.name = cursor.value.location
      new mdc.ripple.MDCRipple.attachTo(radioListMap);
      ul.appendChild(radioListMap)
      index++
      cursor.continue()
    }
    tx.oncomplete = function () {
      const mapListInit = new mdc.list.MDCList(ul)
      mapListInit.singleSelection = true;
      mapListInit.listen('MDCList:action', function (evt) {

        const value = JSON.parse(ul.querySelector('#list-radio-item-' + evt.detail.index).value)
        updateCreateActivity(updateVenue(data, value).record, true)

      })
      container.appendChild(ul);
      parent.appendChild(container);
    }
  }
};

function updateVenue(data, value) {
  data.record.venue.forEach(function (venue) {
    if (venue.venueDescriptor === data.key) {
      venue.address = value.address;
      venue.location = value.location;
      venue.geopoint._latitude = value.latitude;
      venue.geopoint._longitude = value.longitude;
    }
  })
  return data
}

function userSelector(data, container) {
  // to do user
  const parent = document.getElementById('app-current-panel')
  const field = new InputField().withLeadingIcon('search', 'Search Assignee');
  field.root_.id = 'users-selector-search'
  field.root_.classList.add('search-field')
  container.appendChild(field.root_);

  parent.appendChild(container);
  initUserSelectorSearch(data, field, container);

  const ul = createElement('ul', {
    className: 'mdc-list mdc-list--avatar-list  mdc-list--two-line',
    id: 'user-selector-list'
  });

  ul.setAttribute('role', 'group');
  ul.setAttribute('aria-label', 'User List With Check Box');
  container.appendChild(ul);
  const recordAssignees = data.record.assignees
  const userSubmit = new Button('Add New Number');
  userSubmit.raised();
  userSubmit.selectorButton();
  const userSubmitButton = userSubmit.getButton();
  userSubmitButton.root_.dataset.type = 'add-number';
  userSubmitButton.root_.id = 'selector-submit-send'
  userSubmitButton.root_.onclick = function () {
    if (userSubmitButton.root_.dataset.type === 'add-number') {
      addNewNumber(data, container);
      return;
    }
    let filterClassName = '.mdc-radio'
    if (!data.attachment) {
      filterClassName = '.mdc-checkbox'
    }
    const filtered = getSelectedList(filterClassName)
    if (!filtered) {
      container.querySelector('#selector-warning').textContent = 'Please Choose An Option'
      return;
    }
    const numbers = [];
    filtered.forEach(function (el) {
      numbers.push(JSON.parse(el.value))
    })
    console.log(numbers);
    insertNumberIntoRecord(data, numbers);


  }
  container.appendChild(userSubmitButton.root_)
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['users']);
    const store = transaction.objectStore('users');
    let count = 0;
    let alreadyPresent = {}

    recordAssignees.forEach(function (assignee) {
      if (typeof assignee === 'string') {
        alreadyPresent[assignee] = true;
      } else {
        alreadyPresent[assignee.phoneNumber] = true
      }
    })
    alreadyPresent[firebase.auth().currentUser.phoneNumber] = true

    store.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      if (ul.querySelector(`[data-number="${cursor.value.mobile}"]`)) {
        cursor.continue();
        return;
      }
      if (data.attachment) {
        count++
        const radioButton = new mdc.radio.MDCRadio(createRadioInput(JSON.stringify(cursor.value.mobile)))
        radioButton.root_.onclick = function () {
          data.record.attachment[data.key].value = JSON.parse(radioButton.value)
          updateCreateActivity(data.record, true)
        }
        const assigneeLi = createSimpleAssigneeLi(cursor.value, radioButton)
        assigneeLi.dataset.number = cursor.value.mobile
        ul.appendChild(assigneeLi)
      } else {
        if (!alreadyPresent.hasOwnProperty(cursor.value.mobile)) {
          count++
          const checkbox = createCheckBox({
            value: cursor.value.mobile
          });
          checkbox.root_.onclick = function () {
            container.querySelector('#selector-submit-send').dataset.type = '';
            container.querySelector('#selector-submit-send').textContent = 'SELECT';
          }
          const assigneeLi = createSimpleAssigneeLi(cursor.value, checkbox)
          assigneeLi.dataset.number = cursor.value.mobile
          ul.appendChild(assigneeLi)
        }
      }
      cursor.continue()
    }

    transaction.oncomplete = function () {
      if (!count) {
        ul.appendChild(noSelectorResult('No Contact Found'));
        document.getElementById('users-selector-search').style.display = 'none';
      };

      document.getElementById('app-current-panel').appendChild(container);
    }
  }
}


function addNewNumber(data, container) {
  document.body.style.backgroundColor = 'white';
  removeChildNodes(container)
  const newNumberCont = createElement('div', {
    className: 'new-number-container'
  })
  const headline = createElement('h2', {
    className: 'mdc-typography--headline5 new-contact-headline',
    textContent: 'Add a new Phone Number'
  })
  const message = createElement('p', {
    className: 'mdc-typography--subtitle2 message-field',
    textContent: 'Enter new phone contact without country code',
    id: 'helper-message'
  })

  const newContact = new Fab('add').extended('Add Contact');
  newContact.root_.id = 'new-contact';

  const newNumberField = new InputField().withoutLabel();
  newNumberField.root_.id = 'number-field'
  newNumberField.root_.type = 'number'
  newNumberField.input_.placeholder = 'Enter A New Phone Number'
  newNumberField.input_.setAttribute('maxlength', '10')
  newNumberField.input_.setAttribute('size', '10')
  newNumberField.input_.required = true
  newNumberField.input_.onkeypress = function (event) {
    return event.charCode >= 48 && event.charCode <= 57
  }

  newNumberField.input_.oninput = function () {

    if (this.value.length > this.maxLength) {
      this.value = this.value.slice(0, this.maxLength)

    } else if (this.value.length === this.maxLength) {
      message.classList.remove('error-message')
      this.classList.add('valid-input')
      message.textContent = ''
    } else {
      message.classList.add('error-message')
      message.textContent = '* Please Enter a valid Number'
    }
  }

  newContact.root_.onclick = function () {
    const number = newNumberField.value
    const formattedNumber = formatNumber(number)

    if (!checkNumber(formattedNumber)) {

      message.classList.add('error-message')
      message.textContent = '* Please Enter a valid Number'
      newNumberField.disabled(true);
      return;
    }
    insertNumberIntoRecord(data, [formattedNumber]);
    return;
  }
  newNumberCont.appendChild(headline);
  newNumberCont.appendChild(newNumberField.root_)
  newNumberCont.appendChild(message)
  newNumberCont.appendChild(newContact.root_)
  container.appendChild(newNumberCont)
  document.getElementById('app-current-panel').appendChild(container)
}

function insertNumberIntoRecord(data, number) {

  if (data.attachment) {
    data.record.attachment[data.key].value = number[0]
    updateCreateActivity(data.record, true)
    return
  }

  if (data.record.hasOwnProperty('create')) {
    data.record.assignees.push.apply(data.record.assignees, number);
    updateCreateActivity(data.record, true)
    return
  };
  shareReq(data, number)

}

function fillSubscriptionInSelector(data, container) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction([data.store], 'readonly');
    const store = tx.objectStore(data.store);
    const officeIndex = store.index('office');
    const offices = [];
    officeIndex.openCursor(null,'nextunique').onsuccess = function(event){
      const cursor = event.target.result;
      if(!cursor) return;
      // if(cursor.value.status === 'CANCELLED') {
      //   cursor.continue();
      //   return;
      // }
      offices.push(cursor.value.office);
      cursor.continue();
    }
    tx.oncomplete = function(){
      console.log(offices)
      console.log(tabBar(offices))
      document.getElementById('app-current-panel').appendChild(tabBar(offices).root_);
    }
    
  }
}


function fillChildrenInSelector(data, container) {
  const ul = createElement('ul', {
    className: 'mdc-list'
  });
  data.results.forEach(function (value, idx) {
    const radioListEl = radioList({
      labelText: value.attachment.Name.value || value.attachment.Number.value,
      value: value.attachment.Name.value || value.attachment.Number.value,
      index: idx
    });

    radioListEl.dataset.value = value.attachment.Name.value || value.attachment.Number.value
    if (!ul.querySelector(`[data-value="${radioListEl.dataset.value}"]`)) {
      ul.appendChild(radioListEl)
      new mdc.ripple.MDCRipple.attachTo(radioListEl);
    }
  })
  const listInit = new mdc.list.MDCList(ul)
  listInit.singleSelection = true
  listInit.listen('MDCList:action', function (evt) {
    data.record.attachment[data.key].value = JSON.parse(ul.querySelector('#list-radio-item-' + evt.detail.index).value);
    updateCreateActivity(data.record, true);
  })
  container.appendChild(ul)
  document.getElementById('app-current-panel').appendChild(container);
}



function getSelectedList(className) {

  const checked = [].map.call(document.querySelectorAll(className), function (el) {
    if (className === '.mdc-radio') {
      return new mdc.radio.MDCRadio(el);
    }
    if (className === '.mdc-checkbox') {
      return new mdc.checkbox.MDCCheckbox(el);
    }
  });
  const filter = checked.filter(function (el) {
    return el.checked;
  })
  return filter;
}

function shareReq(data, number) {
  if (!isLocationStatusWorking()) return;
  document.querySelector('header').appendChild(progressBar())
  requestCreator('share', {
    'activityId': data.record.activityId,
    'share': number
  })
}