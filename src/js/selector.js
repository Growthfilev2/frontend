function selectorUI(data) {

  const parent = document.getElementById('app-current-panel');

  createSelectorHeader(data);
  const container = document.createElement('div')
  container.className = 'selector-container mdc-top-app-bar--fixed-adjust'

  if (data.store === 'map') {
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
  submitButton.textContent = 'Submit'
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
      const tx = db.transaction([data.store]);
      const mapSeachInit = new mdc.textField.MDCTextField.attachTo(document.querySelector('#map-selector-search'));
      let input = mapSeachInit['input_'];
      const options = {
        componentRestrictions: {
          country: "in"
        }
      }
    
      autocomplete = new google.maps.places.Autocomplete(input, options);
      input.placeholder = ''
      initializeAutocompleteGoogle(autocomplete, data)
      getLocationForMapSelector(tx, data).then(function () {
        handleClickListnersForMap(data)
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
      selectorStore = db.transaction(data.store).objectStore(data.store)
      fillChildrenInSelector(selectorStore, activityRecord, data)
    }
  }
}

function createSelectorHeader(data) {

  const backDiv = document.createElement('div')
  backDiv.className = 'back-icon'
  backDiv.id = 'back-selector'
  backDiv.style.float = 'left'
  const backIcon = document.createElement('i')
  backIcon.style.marginRight = '5px'
  backIcon.className = 'material-icons back-icon--large'
  backIcon.textContent = 'arrow_back'

  backDiv.appendChild(backIcon)

  modifyHeader({
    id: 'app-main-header',
    left: backDiv.outerHTML
  })

  document.querySelector('#back-selector').addEventListener('click', function (e) {
    if (data.store === 'subscriptions') {
      backNav()
    } else {
      document.querySelector('.mdc-top-app-bar__section--align-end').classList.remove('search-field-transform')
      updateCreateActivity(history.state[1], true);
    }
  })
}