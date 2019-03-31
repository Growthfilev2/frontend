function selectorUI(data) {

  const parent = document.getElementById('app-current-panel');
  parent.innerHTML = ''
  const sectionStart = document.getElementById('section-start');
  sectionStart.innerHTML = ''
  sectionStart.appendChild(headerBackIcon(data.store))

  const container = createElement('div', {
    className: 'selector-container mdc-top-app-bar--fixed-adjust'
  })

  const warning = createElement('span', {
    className: 'selector-warning-text',
    id: 'selector-warning'
  })
  container.appendChild(warning);

  const submit = new Button('SELECT');
  submit.raised()
  submit.selectorButton();
  const submitButton = submit.getButton();
  submitButton.root_.id = 'selector-submit-send'
  submitButton.root_.onclick = function () {
    if (!isLocationStatusWorking()) return;
    const selectorWarning = document.getElementById('selector-warning');

    const filtered = getSelectedRadio();

    if (!filtered.length) {
      selectorWarning.textContent = 'Please Select An Option'
      return;
    }
    selectorWarning.textContent = ''
    const value = JSON.parse(filtered[0].value);
    modifyRecordWithValues(data, value);
  }

  container.appendChild(submitButton.root_)
  window.scrollTo(0, 0);
  const types = {
    map: mapSelector,
    users: userSelector,
    subscriptions: fillSubscriptionInSelector,
    children: fillChildrenInSelector
  }

  types[data.store](data, container);
}

function modifyRecordWithValues(data, value) {
  if (data.store === 'map') {
    data.record.venue.forEach(function (venue) {
      if (venue.venueDescriptor === data.key) {
        venue.address = value.address;
        venue.location = value.location;
        venue.geopoint.latitude = value.latitude;
        venue.geopoint.longitude = value.longitude;
      }
    })
    updateCreateActivity(data.record)
  }
  if (data.store === 'subscriptions') {
    createTempRecord(value.office, value.template, data);
  }
  if (data.store === 'children') {
    data.record.attachment[data.key].value = value
    updateCreateActivity(data.record)
  };

  if (data.store === 'users') {
    if (btn.dataset.type === 'add-number') {
      removeChildNodes(ul)
      btn.remove();
      addNewNumber(data)
      return
    }
    debugger;
   return insertNumberIntoRecord(data,value);
  }
  return;
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
      geopoint: {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }
    }
    modifyRecordWithValues(data, value)
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
      className: 'mdc-list mdc-list--avatar-list'
    });
    ul.setAttribute('role', 'radiogroup');
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
      ul.appendChild(radioList({
        value: cursor.value,
        labelText: cursor.value.location
      }))
      cursor.continue()
    }
    tx.oncomplete = function () {
      container.appendChild(ul);
      parent.appendChild(container);
    }
  }
};


function userSelector(data, container) {
  // to do user
  const parent = document.getElementById('app-current-panel')
  const field = new InputField().withLeadingIcon('search', 'Search Assignee');
  field.root_.id = 'users-selector-search'
  field.root_.classList.add('search-field')
  container.appendChild(field.root_);
  parent.appendChild(container);
  initUserSelectorSearch(data, field);
  // fillUsersInSelector(data)
}

function fillUsersInSelector(data) {
  const ul = document.getElementById('data-list--container')
  const recordAssignees = data.record.assignees

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['users']);
    const store = transaction.objectStore('users')
    const btn = document.getElementById('selector-submit-send')
    btn.textContent = 'Add New Number';
    btn.dataset.type = 'add-number'
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

      if (data.attachment) {
        count++

        ul.appendChild(createSimpleAssigneeLi(cursor.value, true, false))
      } else {
        if (!alreadyPresent.hasOwnProperty(cursor.value.mobile)) {
          count++
          ul.appendChild(createSimpleAssigneeLi(cursor.value, true, true))
        }
      }
      cursor.continue()
    }

    transaction.oncomplete = function () {
      if (!count) {
        ul.appendChild(noSelectorResult('No Contact Found'));
        document.getElementById('users-selector-search').style.display = 'none';
      }
      btn.onclick = function () {
        if (btn.dataset.type === 'add-number') {
          document.getElementById('users-selector-search').style.display = 'none';
          removeChildNodes(ul)
          btn.remove();
          addNewNumber(data)
          return
        }

        if (data.attachment.present) {
          const selector = document.querySelector('.mdc-radio.radio-selected');
          if (!selector) {
            document.getElementById('selector-warning').textContent = '* Please Select A Contact'
            return
          }
          const radio = new mdc.radio.MDCRadio(selector)
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: JSON.parse(radio.value)
          }).then(function (activity) {

            updateCreateActivity(activity, true)
          }).catch(handleError)
          return;
        }

        if (data.record.hasOwnProperty('create')) {
          if (!selectedPeople.length) {
            document.getElementById('selector-warning').textContent = '* Please Select A Contact'
            return
          }

          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees',
          }, {
            primary: selectedPeople
          }).then(function (activity) {
            document.body.classList.remove('mdc-dialog-scroll-lock');
            updateCreateActivity(activity, true)
          }).catch(handleError)
          return
        }
        if (isLocationStatusWorking()) {
          shareReq(data)
        }
      }


      const selectedBoxes = document.querySelectorAll('[data-selected="true"]');
      selectedBoxes.forEach(function (box) {
        if (box) {
          const mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
          mdcBox.checked = true
          box.children[1].style.animation = 'none'
          box.children[1].children[0].children[0].style.animation = 'none'
        }
      })
    }
  }

}

function addNewNumber(data,container) {
  const message = createElement('p', {
    className: 'mdc-typography--subtitle2 message-field',
    textContent: 'Enter new phone contact without country code',
    id: 'helper-message'
  })

  const newContact = new Fab('add').extended('Add Contact');
  newContact.root_.id = 'new-contact';

  const newNumberField = new InputField().withLabel('New Contact Number');
  newNumberField.root_.id = 'number-field'
  newNumberField.root_.type = 'number'
  newNumberField.root_.setAttribute('maxlength', '10')
  newNumberField.root_.setAttribute('size', '10')
  newNumberField.root_.required = true
  newNumberField.root_.onkeypress = function (event) {
    return event.charCode >= 48 && event.charCode <= 57
  }


  newNumberField.root_.oninput = function () {
    if (this.value.length > this.maxLength) {
      this.value = this.value.slice(0, this.maxLength)

    } else if (this.value.length === this.maxLength) {
      message.classList.remove('error-message')
      this.classList.add('valid-input')
      message.textContent = ''
      newContact.disabled(false)
    } else {
      message.classList.add('error-message')
      message.textContent = '* Please Enter a valid Number'
      newContact.disabled(true)
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
    insertNumberIntoRecord(data,formattedNumber);
    return;
  }

  container.appendChild(newNumberField.root_)
  container.appendChild(message)
  container.appendChild(newContact.root_)
  document.getElementById('data-list--container').appendChild(container)
}

function insertNumberIntoRecord(data,number){

  if (data.attachment) {
    data.record.attachment[data.key].value = formattedNumber
    updateCreateActivity(data.record)
    return
  }

  data.record.share.apply(data.record.share,number);
  if (data.record.hasOwnProperty('create')) {
    debugger;
    updateCreateActivity(data.record, true)
    return
 }

shareReq(data)

}

function fillSubscriptionInSelector(data, container) {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction([data.store], 'readonly');
    const store = tx.objectStore(data.store)
    const officeIndex = store.index('office');

    const grp = createElement('div', {
      className: 'mdc-list-group',
      id: 'data-list--container'
    })

    officeIndex.openCursor(null, 'nextunique').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;

      const ul = createElement('ul', {
        className: 'mdc-list mdc-list--avatar-list'
      });
      ul.setAttribute('role', 'radiogroup');
      ul.dataset.groupName = cursor.value.office
      const headline3 = createElement('h3', {
        className: 'mdc-list-group__subheader subheader--group-small',
        textContent: cursor.value.office
      })
      grp.appendChild(headline3)
      grp.appendChild(ul)
      container.appendChild(grp)
      cursor.continue();
    }

    tx.oncomplete = function () {
      document.getElementById('app-current-panel').appendChild(container);
      insertTemplateByOffice()
    }
  }
}

function insertTemplateByOffice() {
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['subscriptions'], 'readonly');
    const subscriptionObjectStore = tx.objectStore('subscriptions').index('office');

    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue()
        return
      }
      document.querySelector(`[data-group-name="${cursor.value.office}"]`).appendChild(radioList({
        value: cursor.value,
        labelText: cursor.value.template
      }))
      cursor.continue()
    }
    tx.oncomplete = function () {}
  }
}

function fillChildrenInSelector(data, container) {
  const req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction([data.store], 'readonly');
    const store = tx.objectStore(data.store).index('templateStatus')
    const bound = IDBKeyRange.bound([data.key.toLowerCase(), 'CONFIRMED'], [data.key.toLowerCase(), 'PENDING'])
    const ul = createElement('ul', {
      className: 'mdc-list'
    });

    store.openCursor(bound).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;
      if (data.record.office !== cursor.value.office) {
        cursor.continue();
        return;
      }

      if (cursor.value.attachment.Name) {
        ul.appendChild(radioList({
          labelText: cursor.value.attachment.Name.value,
          value: cursor.value.attachment.Name.value
        }))
      }
      if (cursor.value.attachment.Number) {
        ul.appendChild(radioList({
          labelText: cursor.value.attachment.Number.value,
          value: cursor.value.attachment.Number.value
        }))
      }
      cursor.continue()
    }
    tx.oncomplete = function () {
      container.appendChild(ul)
      document.getElementById('app-current-panel').appendChild(container);
    }
  }

}

function getSelectedRadio() {
  const checked = [].map.call(document.querySelectorAll('.mdc-radio'), function (el) {
    return new mdc.radio.MDCRadio(el);
  });
  const filter = checked.filter(function (el) {
    return el.checked;
  })
  return filter;

}


function shareReq(data) {
  if (!isLocationStatusWorking()) return;
  document.querySelector('header').appendChild(progressBar())
  requestCreator('share', {
    'activityId': data.record.activityId,
    'share': data.record.share
  })
}