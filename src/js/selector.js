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
  });

  return data
}

function userSelector(data, container) {
  // to do user
  const parent = document.getElementById('app-current-panel')
  document.getElementById('start-loader').classList.remove('hidden')

  const field = new InputField().withLeadingIcon('search', 'Search Assignee');
  field.root_.id = 'users-selector-search'
  field.root_.classList.add('search-field')
  container.appendChild(field.root_);


  initUserSelectorSearch(data, field, container);

  const ul = createElement('ul', {
    className: 'mdc-list mdc-list--avatar-list  mdc-list--two-line',
    id: 'user-selector-list'
  });

  ul.setAttribute('aria-label', 'User List With Check Box');

  const recordAssignees = data.record.assignees

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
      count++
      if (data.attachment) {
        ul.setAttribute('role', 'radiogroup')

        ul.appendChild(new mdc.ripple.MDCRipple(userList({
          value: cursor.value,
          index: count,
          singleSelection: true
        }, true)).root_)

      } else {
        if (!alreadyPresent.hasOwnProperty(cursor.value.mobile)) {
          ul.setAttribute('role', 'group')
          ul.appendChild(new mdc.ripple.MDCRipple(userList({
            value: cursor.value,
            index: count,
            singleSelection: false
          }, true)).root_)
        }
      }

      cursor.continue()
    }

    transaction.oncomplete = function () {
      if (!count) {
        ul.appendChild(noSelectorResult('No Contact Found'));
        document.getElementById('users-selector-search').style.display = 'none';
        return;
      };

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
        };


        const number = [];
        listINit.selectedIndex.forEach(function (idx) {
          number.push(JSON.parse(listINit.listElements[idx].querySelector('.mdc-checkbox__native-control').value).mobile)
        })
        insertNumberIntoRecord(data, number)

      }

      const listINit = new mdc.list.MDCList(ul);
      data.attachment ? listINit.singleSelection = true : '';
      listINit.listen('MDCList:action', function (evt) {

        if (data.attachment) {

          const value = JSON.parse(listINit.listElements[evt.detail.index].querySelector('.mdc-radio__native-control').value)
          data.record.attachment[data.key].value = value.mobile
          updateCreateActivity(data.record, true)
          return
        }

        if (!listINit.selectedIndex.length) {
          userSubmitButton.root_.dataset.type = 'add-number';
          userSubmitButton.root_.textContent = 'Add new Number';
        } else {
          userSubmitButton.root_.dataset.type = '';
          userSubmitButton.root_.textContent = 'SELECT';
        }
      });

      container.appendChild(ul);
      container.appendChild(userSubmitButton.root_)
      parent.appendChild(container);
      document.getElementById('start-loader').classList.add('hidden')
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
  const panel = document.getElementById('app-current-panel')
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  let index = 0;
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction([data.store], 'readonly');
    const store = tx.objectStore(data.store);
    const statusIndex = store.index('status');
    const officesObject = {}
    const tabBarInit = tabBarBase();
    let tabContentContainer;
    panel.appendChild(tabBarInit);

    statusIndex.openCursor(IDBKeyRange.bound('CONFIRMED', 'PENDING')).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (officesObject[cursor.value.office]) {
        tabContentContainer = panel.querySelector(`[data-office="${cursor.value.office}"]`)
      } else {
        tabBarInit.querySelector('.mdc-tab-scroller__scroll-content').appendChild(addTabs({
          name: cursor.value.office,
          index: index
        }))
        tabContentContainer = createElement('ul', {
          className: 'content mdc-list'
        })
        tabContentContainer.setAttribute('role', 'radiogroup')
        tabContentContainer.dataset.office = cursor.value.office
        index == 0 ? tabContentContainer.classList.add('content--active') : '';
        // new mdc.list.MDCList(tabContentContainer).singleSelection = true
        panel.appendChild(tabContentContainer)
        officesObject[cursor.value.office] = true
      };

      tabContentContainer.appendChild(radioList({
        index: index,
        labelText: cursor.value.template,
        value: cursor.value
      }))
      index++
      cursor.continue();
    }
    tx.oncomplete = function () {
      const tabBar = new mdc.tabBar.MDCTabBar(tabBarInit);

      var contentEls = document.querySelectorAll('.content');
      tabBar.listen('MDCTabBar:activated', function (evt) {
        document.querySelector('.content--active').classList.remove('content--active');
        contentEls[event.detail.index].classList.add('content--active');
      });

      [].map.call(document.querySelectorAll('.mdc-list'), function (el) {
        const ul = new mdc.list.MDCList(el);
        ul.singleSelection = true
        ul.listElements.map(function (listItemEl) {
          listItemEl.onclick = function () {
            progressBar.foundation_.open();
            const value = JSON.parse(this.querySelector('.mdc-radio__native-control').value)
            createTempRecord(value.office, value.template, data)
          }
          return new mdc.ripple.MDCRipple(listItemEl);
        })
      })
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
  progressBar.foundation_.open();
  requestCreator('share', {
    'activityId': data.record.activityId,
    'share': number
  })
}