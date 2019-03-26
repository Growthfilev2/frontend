function selectorUI(data) {

  const parent = document.getElementById('app-current-panel');

  const sectionStart = document.getElementById('section-start');
  sectionStart.innerHTML = ''
  sectionStart.appendChild(headerBackIcon(data.store))
  const container = document.createElement('div')
  container.className = 'selector-container mdc-top-app-bar--fixed-adjust'
  
  if(data.store === 'map') {
    container.appendChild(createSeachInput('map-selector-search','Search For Location'));
  }

  if(data.store === 'users'){
    container.appendChild(createSeachInput('users-selector-search','Search Users'));
  }

  const ul = document.createElement('ul')
  ul.id = 'data-list--container'
  ul.className = 'mdc-list'
  container.appendChild(ul)
  const warning = document.createElement('span')
  warning.className = 'selector-warning-text'
  warning.id = 'selector-warning'
  container.appendChild(warning);

  
  const submitButton = document.createElement('button')
  submitButton.textContent = 'SELECT'
  submitButton.id = 'selector-submit-send'
  submitButton.className = 'mdc-button selector-submit--button selector-send'
  container.appendChild(submitButton)
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
        if(!count) {
          document.getElementById('map-selector-search').style.display = 'none'
          document.getElementById('selector-submit-send').textContent = 'CANCEL'
          document.getElementById('data-list--container').appendChild(noSelectorResult('No Location Found'))
 
        }
        handleClickListnersForMap(data,count)
      }).catch(console.log)
    }
    if (data.store === 'subscriptions') {

      fillSubscriptionInSelector(db, data)
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      const userSearchInit = new mdc.textField.MDCTextField.attachTo(document.getElementById('users-selector-search'));
      initUserSelectorSearch(data,userSearchInit);
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
    document.getElementById('selector-submit-send').onclick = function () {
      const selector = document.querySelector('.mdc-radio.radio-selected');
      if (!selector) {
        document.getElementById('selector-warning').textContent = '* Please Select a Value'
        return;
      }
      const radio = new mdc.radio.MDCRadio(selector)
      const selectedField = JSON.parse(radio.value)
      updateDomFromIDB(data.record, {
        hash: 'children',
        key: data.attachment.key
      }, {
        primary: selectedField.name
      }).then(function (activity) {
        updateCreateActivity(activity, true)
      }).catch(function (error) {
        console.log(error)
      })
    }
  }
}



function fillSubscriptionInSelector(db, data) {
  const mainUL = document.getElementById('data-list--container')
  const grp = document.createElement('div')
  grp.className = 'mdc-list-group'
  const offices = []
  const tx = db.transaction(['subscriptions'])
  const store = tx.objectStore('subscriptions');
  const officeIndex = store.index('office')
  officeIndex.openCursor(null, 'nextunique').onsuccess = function (event) {
    const cursor = event.target.result

    if (!cursor) return;

    const headline3 = document.createElement('h3')
    headline3.className = 'mdc-list-group__subheader subheader--group-small'
    headline3.textContent = cursor.value.office
    headline3.dataset.groupOffice = cursor.value.office
    const ul = document.createElement('ul')
    ul.className = 'mdc-list'
    ul.dataset.selection = cursor.value.office
    ul.setAttribute('aria-orientation', 'vertical')

    offices.push(cursor.value.office)

    grp.appendChild(headline3)
    grp.appendChild(ul)
    cursor.continue();
  }

  tx.oncomplete = function () {
    if (data.suggestCheckIn) {
      const parent = document.getElementById('data-list--container')
      const suggestion = document.createElement('div')
      suggestion.className = 'suggest-checkin--view'
      const icon = document.createElement('span')
      icon.className = 'material-icons suggestion-icon'
      icon.textContent = 'add_alert'
      suggestion.appendChild(icon)

      const text = document.createElement('span')
      text.textContent = 'Check-In ?'
      text.className = 'suggest-checkin--text'
      suggestion.appendChild(icon)
      suggestion.appendChild(text)
      parent.insertBefore(suggestion, parent.childNodes[0]);
    }
    insertTemplateByOffice(offices, data.suggestCheckIn);

    mainUL.appendChild(grp)

    document.getElementById('selector-submit-send').onclick = function () {
      if (isLocationStatusWorking()) {

        if (document.querySelector('.mdc-radio.radio-selected')) {
          document.getElementById('selector-warning').textContent = ''
          const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
          const selectedField = JSON.parse(radio.value);
          document.getElementById('app-current-panel').dataset.view = 'create';
          createTempRecord(selectedField.office, selectedField.template, data);
        } else {
          document.getElementById('selector-warning').textContent = 'Please Select a Template';
        }
      }
    }
  }
}




function insertTemplateByOffice(offices, showCheckInFirst) {

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  const frag = document.createDocumentFragment()
  const checkInTemplate = []
  req.onsuccess = function () {
    const db = req.result
    const tx = db.transaction(['subscriptions'], 'readonly');
    const subscriptionObjectStore = tx.objectStore('subscriptions').index('office');

    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) {
        return
      }

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue()
        return
      }

      if (document.querySelector(`[data-selection="${cursor.value.office}"] [data-template="${cursor.value.template}"]`)) {
        cursor.continue()
        return
      }
      if (showCheckInFirst && cursor.value.template === 'check-in') {
        checkInTemplate.push({
          [cursor.value.office]: createGroupList(cursor.value.office, cursor.value.template)
        })
        cursor.continue();
        return;
      }
      document.querySelector(`[data-selection="${cursor.value.office}"]`).appendChild(createGroupList(cursor.value.office, cursor.value.template))

      cursor.continue()
    }
    tx.oncomplete = function () {

      checkInTemplate.forEach(function (li) {
        const keys = Object.keys(li);
        keys.forEach(function (key) {
          const el = document.querySelector(`[data-selection="${key}"]`);
          el.insertBefore(li[key], el.childNodes[0])
        })
      });
      document.querySelector('.selector-send').classList.remove('hidden');

    }
  }
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
  metaInput.appendChild(createRadioInput())
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
