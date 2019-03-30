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
  initializeAutocompleteGoogle(autocomplete, data);
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
      if(!cursor.value.latitude || !cursor.value.longitude) {
        cursor.continue();
        return;
      };
      ul.appendChild(radioList({value:cursor.value,labelText:cursor.value.location}))
      cursor.continue()
    }
    tx.oncomplete = function () {
      container.appendChild(ul);
      parent.appendChild(container);
      const btn = document.querySelector('#selector-submit-send');
      btn.onclick = function () {
        const filtered = getSelectedRadio()
        if(!filtered.length){
          document.getElementById('selector-warning').textContent = '* Please Choose A Location'
          return;
        }
        // handle for multiple venue :/
        const value = JSON.parse(filtered[0].value);
        
        updateDomFromIDB(data.record, {
          hash: 'venue',
          key: data.key
        }, {
          primary: value.location,
          secondary: {
            address: value.address,
            geopoint:{
              _latitude:value.latitude,
              _longitude:value.longitude
            }
          },
        }).then(function (activity) {
          updateCreateActivity(activity, true)
        }).catch(function (error) {
          console.log(error);
        })
      };
    }
  }
};

function initializeAutocompleteGoogle(autocomplete, attr) {

  autocomplete.addListener('place_changed', function () {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }

    const selectedAreaAttributes = {
      primary: place.name,
      secondary: {
        address: formAddressComponent(place),
        geopoint: {
          '_latitude': place.geometry.location.lat(),
          '_longitude': place.geometry.location.lng()
        }
      }
    }
    updateDomFromIDB(attr.record, {
      hash: 'venue',
      key: attr.key
    }, selectedAreaAttributes).then(function (activity) {

      updateCreateActivity(activity, true);
    }).catch(handleError)
  })
}
function userSelector(data, container) {
  // to do user
  const parent = document.getElementById('app-current-panel')
  const field = new InputField().withLeadingIcon('search', 'Search Assignee');
  field.root_.id = 'users-selector-search'
  field.root_.classList.add('search-field')
  container.appendChild(field.root_);
  parent.appendChild(container);
  initUserSelectorSearch(data, field);
  
}

function fillUsersInSelector(data) {
  const ul = document.getElementById('data-list--container')
  const recordAssignees = data.record.assignees

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    const transaction = db.transaction(['users']);
    const store = transaction.objectStore('users')
    document.querySelector('.selector-send').classList.remove('hidden');
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

      if (data.attachment.present) {
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

function addNewNumber(data) {
  const container = document.createElement('div')
  container.className = 'custom-number--container'


  const input = document.createElement('input')
  input.className = 'mdc-text-field__input'
  input.id = 'number-field'
  input.type = 'number'
  input.setAttribute('maxlength', '10')
  input.setAttribute('size', '10')
  input.required = true
  input.onkeypress = function (event) {
    return event.charCode >= 48 && event.charCode <= 57
  }

  input.oninput = function () {
    if (this.value.length > this.maxLength) {
      this.value = this.value.slice(0, this.maxLength)

    } else if (this.value.length === this.maxLength) {
      document.querySelector('.message-field').classList.remove('error-message')
      this.classList.add('valid-input')
      document.querySelector('.message-field').textContent = ''
      document.getElementById('new-contact').disabled = false

    } else {
      document.querySelector('.message-field').classList.add('error-message')
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number'
      document.getElementById('new-contact').disabled = true
    }

  }


  const createButton = document.createElement('button')
  createButton.className = 'mdc-button'
  createButton.textContent = 'Add Contact'
  createButton.id = 'new-contact'

  createButton.onclick = function () {
    const number = document.getElementById('number-field').value

    const formattedNumber = formatNumber(number)
    if (checkNumber(formattedNumber)) {

      numberNotExist(formattedNumber).then(function (exist) {
        if (exist) {
          document.getElementById('new-contact').disabled = true
          document.querySelector('.message-field').classList.add('error-message')
          document.querySelector('.message-field').textContent = '* Contact already exist'
          return
        }

        if (data.attachment.present) {
          updateDomFromIDB(data.record, {
            hash: '',
            key: data.attachment.key
          }, {
            primary: formattedNumber
          }).then(function (activity) {
            console.log(activity);
            updateCreateActivity(activity, true)
          }).catch(handleError)
          return
        }

        if (data.record.hasOwnProperty('create')) {
          updateDomFromIDB(data.record, {
            hash: 'addOnlyAssignees',
          }, {
            primary: [formattedNumber]
          }).then(function (activity) {

            updateCreateActivity(activity, true)
          }).catch(handleError)
          return
        }
        if (isLocationStatusWorking()) {

          newNumberReq(data, formattedNumber)
        }
      })

    } else {
      document.querySelector('.message-field').classList.add('error-message')
      document.querySelector('.message-field').textContent = '* Please Enter a valid Number'
      document.getElementById('new-contact').disabled = true

    }

  }

  const message = document.createElement('p')
  message.className = 'mdc-typography--subtitle2 message-field'
  message.textContent = 'Enter new phone contact without country code'
  message.id = 'helper-message'

  container.appendChild(input)
  container.appendChild(message)
  container.appendChild(createButton)
  document.querySelector('#data-list--container').appendChild(container)
  const getNumber = new mdc.ripple.MDCRipple.attachTo(document.getElementById('new-contact'))

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

      insertTemplateByOffice().then(function () {

        document.getElementById('selector-submit-send').onclick = function () {

          if (!isLocationStatusWorking()) return;
          const selectorWarning = document.getElementById('selector-warning');

          const filtered = getSelectedRadio();
          if (!filtered.length) {
            selectorWarning.textContent = 'Please Select A Subscription'
            return;
          }
          selectorWarning.textContent = ''
          const value = JSON.parse(filtered[0].value);
          createTempRecord(value.office, value.template, data);
        }
      })
    }
  }
}
function insertTemplateByOffice() {
  return new Promise(function (resolve, reject) {
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

      tx.oncomplete = function () {
        resolve(true)
      }
    }
  })
}
function fillChildrenInSelector(data) {
  const req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    const db = req.result;
    const tx = db.transaction([data.store], 'readonly');
    const store = tx.objectStore(data.store)
    const ul = document.getElementById('data-list--container')
    const bound = IDBKeyRange.bound([data.attachment.template, 'CONFIRMED'], [data.attachment.template, 'PENDING'])
    store.openCursor(bound).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return;
      if (data.attachment.office !== cursor.value.office) {
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
      const btn = document.getElementById('selector-submit-send')
      btn.onclick = function () {

        if (!isLocationStatusWorking()) return;
        const selectorWarning = document.getElementById('selector-warning');

        const filtered = getSelectedRadio();

        if (!filtered.length) {
          selectorWarning.textContent = 'Please Select A Subscription'
          return;
        }
        selectorWarning.textContent = ''
        const value = JSON.parse(filtered[0].value);
        updateDomFromIDB(data.record, {
          hash: 'children',
          key: data.attachment.key
        }, {
          primary: value.name
        }).then(function (activity) {
          updateCreateActivity(activity, true)
        }).catch(function (error) {
          console.log(error)
        })
      }
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
function updateDomFromIDB(activityRecord, attr, data) {
  return new Promise(function (resolve, reject) {
    const dbName = firebase.auth().currentUser.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result;
      let thisActivity = activityRecord;
  
      if (attr.hash === 'venue') {
        thisActivity = updateVenue(thisActivity, attr, data);
        updateLocalRecord(thisActivity, db).then(function (message) {
          resolve(thisActivity)
        }).catch(function (error) {
          console.log(error)
          reject(error)
        })
        return
      }
      //for create
      if (attr.hash === 'addOnlyAssignees') {
        if (!data.primary.length) return
        data.primary.forEach(function (number) {
          if (thisActivity.assignees.indexOf(number) > -1) return
          thisActivity.assignees.push(number)
        })
        resolve(thisActivity);
        return
      }

      if (!attr.hasOwnProperty('key')) return

      thisActivity.attachment[attr.key].value = data.primary;

      updateLocalRecord(thisActivity, db).then(function (message) {
        resolve(thisActivity);
      }).catch(function (error) {
        reject(error)
      })
    }
  })
}
function updateVenue(updatedActivity, attr, data) {

  updatedActivity.venue.forEach(function (field) {
    if (field.venueDescriptor === attr.key) {
      field.location = data.primary
      field.address = data.secondary.address
      field.geopoint['_latitude'] = data.secondary.geopoint['_latitude']
      field.geopoint['_longitude'] = data.secondary.geopoint['_longitude']
    }
  })
  return updatedActivity
}