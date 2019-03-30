function selectorUI(data) {

  const parent = document.getElementById('app-current-panel');

  const sectionStart = document.getElementById('section-start');
  sectionStart.innerHTML = ''
  sectionStart.appendChild(headerBackIcon(data.store))
  const container = document.createElement('div')
  container.className = 'selector-container mdc-top-app-bar--fixed-adjust'

  if (data.store === 'map') {
    container.appendChild(createSeachInput('map-selector-search', 'Search For Location'));
  }

  if (data.store === 'users') {
    container.appendChild(createSeachInput('users-selector-search', 'Search Users'));
  }

  const ul = document.createElement('ul')
  ul.id = 'data-list--container'
  ul.className = 'mdc-list'
  container.appendChild(ul)
  const warning = document.createElement('span')
  warning.className = 'selector-warning-text'
  warning.id = 'selector-warning'
  container.appendChild(warning);

  const submit = new Button('SELECT');
  submit.raised()

  submit.selectorButton();
  const submitButton = submit.getButton();
  submitButton.root_.id = 'selector-submit-send'
  container.appendChild(submitButton.root_)

  parent.innerHTML = container.outerHTML;

  window.scrollTo(0, 0);
  let activityRecord = data.record
  let selectorStore;

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result;
    if (data.store === 'map') {

      const mapSeachInit = new mdc.textField.MDCTextField.attachTo(document.querySelector('#map-selector-search'));

      const tx = db.transaction([data.store]);
      let input = mapSeachInit['input_'];
      const options = {
        componentRestrictions: {
          country: "in"
        }
      }

      autocomplete = new google.maps.places.Autocomplete(input, options);
      input.placeholder = ''
      initializeAutocompleteGoogle(autocomplete, data)
      getLocationForMapSelector(tx, data).then(function (count) {
        if (!count) {
          document.getElementById('selector-submit-send').textContent = 'CANCEL'
          document.getElementById('data-list--container').appendChild(noSelectorResult('No Location Found'))
        }
        handleClickListnersForMap(data, count)
      }).catch(console.log)
    }
    if (data.store === 'subscriptions') {

      fillSubscriptionInSelector(db, data)
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      const userSearchInit = new mdc.textField.MDCTextField.attachTo(document.getElementById('users-selector-search'));
      initUserSelectorSearch(data, userSearchInit);
      resetSelectedContacts().then(function () {
        fillUsersInSelector(data)
      })
    }

    if (data.store === 'children') {
      const tx = db.transaction([data.store])
      const store = tx.objectStore(data.store).index('templateStatus')
      fillChildrenInSelector(store, data, tx)
    }
  }
}



function getLocationForMapSelector(tx, data) {
  return new Promise(function (resolve, reject) {
    let count = 0;
    const ul = document.getElementById('data-list--container')
    const store = tx.objectStore('map');
    const office = data.record.office;
    const range = IDBKeyRange.bound([office, ''], [office, '\uffff']);
    store.index('byOffice').openCursor(range, 'nextunique').onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      if (cursor.value.office !== data.record.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.location) {
        count++
        ul.appendChild(createVenueLi(cursor.value, false, data.record, true));
      }
      cursor.continue()
    }
    tx.oncomplete = function () {

      resolve(count)
    }
    tx.onerror = function () {
      reject(tx.error)
    }
  })
}


function createSeachInput(id, labelText) {
  const search = document.createElement('div')
  search.id = id
  search.className = 'mdc-text-field mdc-text-field--with-leading-icon search-field'
  const icon = document.createElement('i')
  icon.className = 'material-icons mdc-text-field__icon'
  icon.textContent = 'search'
  const input = document.createElement("input")
  input.className = 'mdc-text-field__input'
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'
  const label = document.createElement('label')
  label.className = 'mdc-floating-label'

  label.textContent = labelText
  search.appendChild(icon)
  search.appendChild(input)
  search.appendChild(ripple)
  search.appendChild(label)
  return search
}


function handleClickListnersForMap(data, count) {


  document.querySelector('#selector-submit-send').onclick = function () {
    if (!count) {
      updateCreateActivity(data.record, true)
      return
    }
    const selected = document.querySelector('.mdc-radio.radio-selected');
    if (!selected) {
      document.getElementById('selector-warning').textContent = '* Please Choose A Location'
      return;
    };
    const radio = new mdc.radio.MDCRadio(selected);
    const selectedField = JSON.parse(radio.value)

    updateDomFromIDB(data.record, {
      hash: 'venue',
      key: data.key
    }, {
      primary: selectedField.location,
      secondary: {
        address: selectedField.address,
        geopoint: selectedField.geopoint
      },
    }).then(function (activity) {

      updateCreateActivity(activity, true)
    }).catch(function (error) {
      console.log(error);
    })
  }
}



function fillChildrenInSelector(selectorStore, data, tx) {
  const ul = document.getElementById('data-list--container')
  const bound = IDBKeyRange.bound([data.attachment.template, 'CONFIRMED'], [data.attachment.template, 'PENDING'])
  let count = 0;
  selectorStore.openCursor(bound).onsuccess = function (event) {
    const cursor = event.target.result
    if (!cursor) return;
    if (data.attachment.office !== cursor.value.office) {
      cursor.continue();
      return;
    }
    if (cursor.value.attachment.Name) {
      count++
      ul.appendChild(createSimpleLi('children', cursor.value.attachment.Name.value))
    }
    if (cursor.value.attachment.Number) {
      count++
      ul.appendChild(createSimpleLi('children', cursor.value.attachment.Number.value))
    }
    cursor.continue()
  }
  tx.oncomplete = function () {
    const btn = document.getElementById('selector-submit-send')
    if (!count) {
      ul.appendChild(noSelectorResult('No Values Found'))
      btn.textContent = 'CANCEL'
      btn.onclick = function () {
        updateCreateActivity(data.record, true);
      }
      return;
    }
    // document.querySelector('.selector-send').classList.remove('hidden')
    // document.getElementById('selector-submit-send').onclick = function () {
    //   const selector = document.querySelector('.mdc-radio.radio-selected');
    //   if (!selector) {
    //     document.getElementById('selector-warning').textContent = '* Please Select a Value'
    //     return;
    //   }
    //   const radio = new mdc.radio.MDCRadio(selector)
    //   const selectedField = JSON.parse(radio.value)
    //   updateDomFromIDB(data.record, {
    //     hash: 'children',
    //     key: data.attachment.key
    //   }, {
    //     primary: selectedField.name
    //   }).then(function (activity) {
    //     updateCreateActivity(activity, true)
    //   }).catch(function (error) {
    //     console.log(error)
    //   })
    // }
  }
}



function fillSubscriptionInSelector(db, data) {
  const mainUL = document.getElementById('data-list--container')
  const grp = document.createElement('div')
  grp.className = 'mdc-list-group'

  const tx = db.transaction(['subscriptions'])
  const store = tx.objectStore('subscriptions');
  const officeIndex = store.index('office')
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
    cursor.continue();
  }

  tx.oncomplete = function () {

    mainUL.appendChild(grp)
    insertTemplateByOffice().then(function () {
      document.getElementById('selector-submit-send').onclick = function () {

        if (!isLocationStatusWorking()) return;
        const selectorWarning = document.getElementById('selector-warning');

        const checked = [].map.call(document.querySelectorAll('.mdc-radio'), function (el) {
          return new mdc.radio.MDCRadio(el);
        });
        const filter = checked.filter(function (el) {
          return el.checked;
        })
        if(!filter.length) {
          selectorWarning.textContent = 'Please Select A Subscription'
          return;
        }
        selectorWarning.textContent = ''
        const value = JSON.parse(filter[0].value);
        createTempRecord(value.office, value.template, data);
      }
    })
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



function createGroupList(office, template) {

  const li = document.createElement('li')
  li.className = 'mdc-list-item transition-ease'
  li.dataset.template = template
  const span = document.createElement('span')
  span.className = 'mdc-list-item__text'
  span.textContent = template.toUpperCase()

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta'
  metaInput.appendChild(createRadioInput({
    office: office,
    template: template
  }).root_)

  li.onclick = function () {
    checkRadioInput(this, {
      office: office,
      template: template
    })
  }
  li.appendChild(span)
  li.appendChild(metaInput)
  return li
}