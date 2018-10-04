function conversation(id, pushState) {

  if (pushState) {
    history.pushState(['conversation', id], null, null)
  }

  fetchAddendumForComment(id)
}

function fetchAddendumForComment(id) {
  const user = firebase.auth().currentUser
  const req = window.indexedDB.open(user.uid)

  req.onsuccess = function() {
    const db = req.result
    const addendumIndex = db.transaction('addendum', 'readonly').objectStore('addendum').index('activityId')
    createHeaderContent(db, id)
    commentPanel(db, id)
    statusChange(db, id);
    sendCurrentViewNameToAndroid('conversation')
    reinitCount(db, id)
    let commentDom = ''
    addendumIndex.openCursor(id).onsuccess = function(event) {
      const cursor = event.target.result
      if (!cursor) {
        document.querySelector('.activity--chat-card-container').scrollTop = document.querySelector('.activity--chat-card-container').scrollHeight
        return
      }
      if(!document.getElementById(cursor.value.addendumId)) {

        createComment(db, cursor.value, user).then(function(comment) {
          document.getElementById('chat-container').appendChild(comment)
        })
      }  
      
      cursor.continue()
    }
  }
}


function commentPanel(db, id) {
  if (document.querySelector('.activity--chat-card-container')) {
    return
  }

  const commentPanel = document.createElement('div')
  commentPanel.className = 'activity--chat-card-container  mdc-top-app-bar--fixed-adjust panel-card'

  const chatCont = document.createElement('div')
  chatCont.id = 'chat-container'
  chatCont.className = 'mdc-card reverser-parent'


  const userCommentCont = document.createElement('div')
  userCommentCont.className = 'user-comment--container'

  const statusChangeContainer = document.createElement('div')
  statusChangeContainer.className = 'status--change-cont'

  const commentCont = document.createElement('div')
  commentCont.className = 'comment--container'

  const inputField = document.createElement('div')
  inputField.className = 'input--text-padding mdc-text-field mdc-text-field--dense'
  inputField.id = 'write--comment'
  inputField.style.width = '100%';
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input comment-field mdc-elevation--z6'
  input.type = 'text'

  inputField.appendChild(input)

  commentCont.appendChild(inputField)


  const btn = document.createElement('button')
  btn.classList.add('mdc-fab', 'mdc-fab--mini', 'hidden')
  btn.id = 'send-chat--input'

  const btnIcon = document.createElement('span')
  btnIcon.classList.add('mdc-fac__icon', 'material-icons')
  btnIcon.textContent = 'send'
  btn.appendChild(btnIcon)

  commentCont.appendChild(btn)

  commentPanel.appendChild(chatCont)

  userCommentCont.appendChild(commentCont)

  document.getElementById('app-current-panel').innerHTML = commentPanel.outerHTML + statusChangeContainer.outerHTML + userCommentCont.outerHTML

  document.querySelector('.comment-field').oninput = function(evt) {
    if (!evt.target.value || evt.target.value === ' ') {
      document.getElementById('send-chat--input').classList.add('hidden')
      document.getElementById('write--comment').style.width = '100%'
      document.getElementById('write--comment').style.transition = '0.3s ease'
      document.querySelector('.status--change-cont').style.transition = '0.3s ease'
      document.querySelector('.status--change-cont').style.opacity = '1'
    } else {
      document.getElementById('send-chat--input').classList.remove('hidden')
      document.getElementById('write--comment').style.width = '80%'
      document.querySelector('.status--change-cont').style.opacity = '0';
    }

  }

  document.getElementById('send-chat--input').onclick = function() {
    const reqBody = {
      'activityId': id,
      'comment':document.querySelector('.comment-field').value
    }

    requestCreator('comment', reqBody)
    document.querySelector('.comment-field').value = ''
    document.querySelector('.status--change-cont').style.opacity = '1'

  }
}

function statusChange(db, id) {
   
  const label = document.createElement('label')
  label.setAttribute('for', 'toggle-status')
  label.textContent = 'Confirm Completion'

  const activityStore = db.transaction('activity').objectStore('activity');
  activityStore.get(id).onsuccess = function(event) {

    const record = event.target.result;
    if (!record.canEdit || record.status === 'CANCELLED') {
      const statusSpan = document.createElement('span')
      const record = event.target.result
      statusSpan.textContent = 'Activity ' + (record.status.toLowerCase())
      document.querySelector('.status--change-cont').innerHTML = statusSpan.outerHTML
      document.querySelector('.status--change-cont').style.textAlign = 'center'
      return
    }
    if(record.editable == 0) {

      document.querySelector('.status--change-cont').innerHTML= label.outerHTML + loader('status-loader').outerHTML;
      return
    }
            
      const div = document.createElement('div')
      div.className = 'mdc-form-field form-field-status'
      
      const checkbox = document.createElement('div')
      checkbox.className = 'mdc-checkbox'
      
      
      const input = document.createElement("input")
      input.className = 'mdc-checkbox__native-control'
      input.id = 'toggle-status'
      input.type = 'checkbox'
      
      const checkbox_bckg = document.createElement('div')
      checkbox_bckg.className = 'mdc-checkbox__background'
      
      const svg = `<svg class="mdc-checkbox__checkmark"
      viewBox="0 0 24 24">
      <path class="mdc-checkbox__checkmark-path"
      fill="none"
      d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
      </svg>
      <div class="mdc-checkbox__mixedmark"></div>`
      
      const mixedmark = document.createElement('div')
      mixedmark.className = 'mdc-checkbox__mixedmark'
      checkbox_bckg.innerHTML =svg
      checkbox.appendChild(input)
      checkbox.appendChild(checkbox_bckg)
      
      div.appendChild(checkbox)
      
     
      document.querySelector('.status--change-cont').innerHTML = div.outerHTML + label.outerHTML
      const switchControl = new mdc.checkbox.MDCCheckbox.attachTo(document.querySelector('.mdc-checkbox'));
      
      if(record.status === 'CONFIRMED') {
        switchControl.checked = true
      }
      
      document.querySelector('.mdc-checkbox').onclick = function() {
        document.querySelector('.form-field-status').classList.add('hidden');
        
        document.querySelector('.status--change-cont').appendChild(loader('status-loader'));
        
        if (switchControl.checked) {
          requestCreator('statusChange', {
            activityId: record.activityId,
            status: 'CONFIRMED'
          })
        } else {
          requestCreator('statusChange', {
            activityId: record.activityId,
            status: 'PENDING'
          })
        }
      }      
    }
  }
  
function createComment(db, addendum, currentUser) {
  // console.log(addendum)
  let showMap = false
  return new Promise(function(resolve) {
    if (document.getElementById(addendum.addendumId)) {
      resolve(document.getElementById(addendum.addendumId).outerHTML)
    }

    let commentBox = document.createElement('div')

    commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')

    currentUser.phoneNumber === addendum.user ? commentBox.classList.add('current-user--comment', 'secondary-color-light') : commentBox.classList.add('other-user--comment', 'mdc-theme--primary-bg')
    commentBox.id = addendum.addendumId

    let textContainer = document.createElement('div')
    textContainer.classList.add('talktext')

    let user = document.createElement('p')
    user.classList.add('user-name--comment','mdc-typography--subtitle2')

    readNameFromNumber(db, addendum.user).then(function(nameOrNumber) {
      // console.log(nameOrNumber)
      user.textContent = nameOrNumber

      let comment = document.createElement('p')
      comment.classList.add('comment','mdc-typography--subtitle2')
      comment.textContent = addendum.comment

      let commentInfo = document.createElement('span')
      commentInfo.className = 'comment--info'
      const datespan = document.createElement('span')
      datespan.textContent = moment(addendum.timestamp).calendar()
      datespan.classList.add('comment-date','mdc-typography--caption')

      const link = document.createElement('div')
      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))
      
      link.onclick = function(evt) {
        showMap = !showMap;
        const loc = {
          lat :addendum.location['_latitude'],
          lng:addendum.location['_longitude']
        }
        maps(evt,showMap,addendum.addendumId,loc) 
      }

      mapIcon.dataset.latitude = addendum.location['_latitude']
      mapIcon.dataset.longitude = addendum.location['_longitude']
      link.appendChild(mapIcon)

      const mapDom  = document.createElement('div')
      mapDom.className = 'map-convo'
      

      commentInfo.appendChild(datespan)
      commentInfo.appendChild(link)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)

      commentBox.appendChild(textContainer)
      commentBox.appendChild(mapDom);
      resolve(commentBox)
    }).catch(console.log)
  })
}

function readNameFromNumber(db, number) {
  return new Promise(function(resolve, reject) {
    // if (number === firebase.auth().currentUser.phoneNumber) return resolve(firebase.auth().currentUser.displayName)
    const usersObjectStore = db.transaction('users').objectStore('users')
    usersObjectStore.get(number).onsuccess = function(event) {
      const record = event.target.result
      if (!record) return resolve(number)
      if (!record.displayName) {
        resolve(number)
        return
      }
      return resolve(record.displayName)
    }
    usersObjectStore.get(number).onerror = function(event) {
      reject(event)
    }
  })
}

function maps(evt,show,id,location){
  let selector =  ''
  evt ? selector =  document.getElementById(id).querySelector('.map-convo') : selector =  document.querySelector(`.map-detail.${id}`)

  console.log(show)
  if(!show) {
    selector.style.height = '0px'
    evt ? evt.target.textContent = 'location_on' : ''
    return    
  }

  if(selector.children.length !== 0) {
    selector.style.height = '200px'
    evt ? evt.target.textContent = 'arrow_drop_down' : ''
    return;
  }
  
  evt ? evt.target.textContent = 'arrow_drop_down' : ''

  selector.style.height = '200px'

  const map = new google.maps.Map(selector,
   {zoom:16,center:location, disableDefaultUI: true});
  
   if(!evt) {
    var customControlDiv = document.createElement('div');
    var customControl = new MapsCustomControl(customControlDiv, map,location.lat,location.lng);

    customControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);
   }

  const marker = new google.maps.Marker({position:location,map:map});

}

function MapsCustomControl (customControlDiv, map,lat,lng) {
  var controlUI = document.createElement('div');

        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.style.padding = '0px 5px 0px 5px';

        customControlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('a');
        controlText.href = `https://www.google.com/maps?q=${lat},${lng}`
        controlText.className = 'material-icons'
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontSize = '16px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';
        controlText.style.textDecoration = 'none'

        controlText.innerHTML = 'open_in_new';
        controlUI.appendChild(controlText);

}

function createHeaderContent(db, id) {


  const activityObjectStore = db.transaction('activity').objectStore('activity')
  const leftDiv = document.createElement('div')
  // leftDiv.style.display = 'inline-flex'

  const backDiv = document.createElement('div')
  backDiv.className = 'back-icon'
  backDiv.id = 'back-conv'
  backDiv.style.float = 'left'
  const backIcon = document.createElement('i')
  backIcon.style.marginRight = '5px'
  backIcon.className = 'material-icons back-icon--large'
  backIcon.textContent = 'arrow_back'

  backDiv.appendChild(backIcon)


  activityObjectStore.get(id).onsuccess = function(event) {



    const record = event.target.result
    getImageFromNumber(db, record.creator).then(function(uri) {

      console.log(uri)

      const creatorImg = document.createElement("img")
      creatorImg.className = 'header--icon-creator'
      creatorImg.src = uri
      creatorImg.setAttribute('onerror','handleImageError(this)');
      backDiv.appendChild(creatorImg);

      const primarySpan = document.createElement('div')
      primarySpan.className = 'mdc-list-item__text comment-header-primary mdc-typography--subtitle2'
      primarySpan.textContent = record.activityName


      const secondarySpan = document.createElement('span')
      secondarySpan.className = 'mdc-list-item__secondary-text'
      secondarySpan.textContent = 'Click here to see Details'

      primarySpan.appendChild(secondarySpan)

      leftDiv.appendChild(backDiv)
      leftDiv.appendChild(primarySpan)
      header(leftDiv.outerHTML, '')

      document.getElementById('back-conv').addEventListener('click', function() {
        backNav()
      })

      document.querySelector('.comment-header-primary').addEventListener('click', function() {
        updateCreateActivity(record, true)
      })
    })
  }
}

function reinitCount(db, id) {
  const activityCount = db.transaction('activityCount', 'readwrite').objectStore('activityCount')
  activityCount.get(id).onsuccess = function(event) {
    const record = event.target.result
    if(!record) return;
    record.count = 0
    activityCount.put(record)
  }
}

function getImageFromNumber(db, number) {
  return new Promise(function(resolve) {
    const userObjStore = db.transaction('users').objectStore('users')
    userObjStore.get(number).onsuccess = function(event) {
      if(number === firebase.auth().currentUser.phoneNumber) {
        resolve(firebase.auth().currentUser.photoURL || './img/empty-user.jpg')
      }
      else {
        resolve(event.target.result.photoURL || './img/empty-user.jpg')
      }
    }
  })
}

function selectorUI(evt, data) {

  sendCurrentViewNameToAndroid('selector')

  const aside = document.createElement('aside')

  aside.id = 'dialog--component'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const searchIcon = document.createElement('span')
  searchIcon.className = 'material-icons'
  searchIcon.textContent = 'search'
  searchIcon.id = 'selector--search'



  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons dialog--header-back'
  backSpan.textContent = 'arrow_back'


  const section = document.createElement('section')
  section.className = 'mdc-dialog__body--scrollable mdc-top-app-bar--fixed-adjust'

  const ul = document.createElement('ul')
  ul.id = 'data-list--container'
  ul.className = 'mdc-list '

  section.appendChild(ul)
  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'



  const accept = document.createElement('button')
  accept.className = 'mdc-fab mdc-dialog__footer__button mdc-dialog__footer__button--accept selector-send'
  accept.type = 'button'
  const acceptIcon = document.createElement('span')
  acceptIcon.className = 'mdc-fab__icon material-icons'
  acceptIcon.textContent = 'send'
  accept.appendChild(acceptIcon)

  footer.appendChild(accept)

  dialogSurface.appendChild(header(backSpan.outerHTML, searchIcon.outerHTML, 'selector'))
  dialogSurface.appendChild(section)
  dialogSurface.appendChild(footer)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)

  document.querySelector('.dialog--header-back').addEventListener('click', function(e) {
    removeDialog(e)
  })

  initializeSelectorWithData(evt, data)
}

function removeDialog(evt) {
  if (document.getElementById('dialog--component')) {
    if (evt && evt.target.dataset.type === 'back-list') {
      resetSelectorUI()
    } else {
      document.getElementById('dialog--component').remove();
      document.getElementById('growthfile').classList.remove('mdc-dialog-scroll-lock')
    }
  }
}

function initializeSelectorWithData(evt, data) {
  console.log(data)
  //init dialog
  const dialog = new mdc.dialog.MDCDialog(document.querySelector('#dialog--component'))
  let activityRecord = data.record
  let selectorStore;
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    if (data.store === 'map') {
      const objectStore = db.transaction(data.store).objectStore(data.store)
      selectorStore = objectStore.index('location')
      fillMapInSelector(selectorStore, activityRecord, dialog, data)
    }
    if (data.store === 'subscriptions') {
      const selectorStore = db.transaction(data.store).objectStore(data.store)
      fillSubscriptionInSelector(selectorStore, activityRecord, dialog, data)
    }
    if (data.store === 'users') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
        if(data.record.create) {
          fillUsersInSelector(data.record, dialog, data)
          return 
        }
        const activityStore = db.transaction('activity').objectStore('activity');
        activityStore.get(activityRecord.activityId).onsuccess = function(event){
        const record = event.target.result
        fillUsersInSelector(record, dialog, data)
      }
    }

    if (data.store === 'children') {
      selectorStore = db.transaction(data.store).objectStore(data.store)
      fillChildrenInSelector(selectorStore, activityRecord, dialog, data)
    }
  }
  // show dialog
  dialog.lastFocusedTarget = evt.target;
  dialog.show();

}

function fillUsersInSelector(activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  const alreadyPresntAssigness = {}
  const usersInRecord = activityRecord.assignees

  usersInRecord.forEach(function(user) {
    alreadyPresntAssigness[user] = ''
  })

  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function(){
    const db = req.result
    console.log(alreadyPresntAssigness)
    const selectorStore  = db.transaction('users').objectStore('users');
    selectorStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result
      if (!cursor) return
      
      const userRecord = cursor.value

      if (data.attachment.present) {
        ul.appendChild(createSimpleAssigneeLi(userRecord, true))
      } else if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
        ul.appendChild(createSimpleAssigneeLi(userRecord, true))
      }
      
      cursor.continue()
    }
    
    document.getElementById('selector--search').addEventListener('click', function() {
      initSearchForSelectors('users', activityRecord, data)
    })
    
    dialog['acceptButton_'].onclick = function() {
      
      const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
      console.log(radio)
      
      if (data.attachment.present) {
        console.log("run")
        updateDomFromIDB(activityRecord, {
          hash: '',
          key: data.attachment.key
        }, {
        primary: JSON.parse(radio.value)
      })
      removeDialog()
      return;
    }
    if (activityRecord.hasOwnProperty('create')) {
      updateDomFromIDB(activityRecord, {
        hash: 'addOnlyAssignees',
        // key: data.attachment.key
      }, {
        primary: JSON.parse(radio.value)
      })
      removeDialog()
      return
    }
    
    document.getElementById('assignees--list').appendChild(createSimpleLi('empty'))
    document.querySelector('#assignees--list').appendChild(loader('user-loader'));
    
    const reqBody = {
      'activityId': activityRecord.activityId,
      'share': [JSON.parse(radio.value)]
    }
    requestCreator('share', reqBody)
    removeDialog()
    return
    
  }
}
  
}

function fillMapInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  selectorStore.openCursor(null, 'nextunique').onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return
    if (cursor.value.location) {
      ul.appendChild(createVenueLi(cursor.value, false, activityRecord, true));
     
    }
    cursor.continue()
  }

  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('map', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    updateDomFromIDB(activityRecord, {
      hash: 'venue',
      key: data.key
    }, {
      primary: selectedField.location,
      secondary: {
        address: selectedField.address,
        geopoint: selectedField.geopoint
      },
    })
    removeDialog()
  }
}

function fillChildrenInSelector(selectorStore, activityRecord, dialog, data) {
  const ul = document.getElementById('data-list--container')
  console.log(data)
  selectorStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result
    if (!cursor) return;

    if (cursor.value.template === data.attachment.template && cursor.value.office === data.attachment.office && data.attachment.status != 'CANCELLED') {
      ul.appendChild(createSimpleLi('children', cursor.value.attachment.Name.value))
    }
    cursor.continue()
  }

  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('users', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    updateDomFromIDB(activityRecord, {
      hash: 'children',
      key: data.attachment.key
    }, {
      primary: selectedField.name
    })
    removeDialog()
  }
}

function fillSubscriptionInSelector(selectorStore, activityRecord, dialog, data) {
  const mainUL = document.getElementById('data-list--container')
  const grp = document.createElement('div')
  grp.className = 'mdc-list-group'
  const officeIndex = selectorStore.index('office')
  officeIndex.openCursor(null, 'nextunique').onsuccess = function(event) {
    const cursor = event.target.result
    
    if (!cursor) {
      insertTemplateByOffice()
      return;
    }
    
    
    const headline3 = document.createElement('h3')
    headline3.className = 'mdc-list-group__subheader subheader--group-small'
    headline3.textContent = cursor.value.office
    const ul = document.createElement('ul')
    ul.className = 'mdc-list'
    ul.dataset.selection = cursor.value.office
    ul.setAttribute('aria-orientation', 'vertical')

   

    grp.appendChild(headline3)
    grp.appendChild(ul)
    cursor.continue();
  }
  mainUL.appendChild(grp)


  document.getElementById('selector--search').addEventListener('click', function() {
    initSearchForSelectors('users', activityRecord, data)
  })

  dialog['acceptButton_'].onclick = function() {
    const radio = new mdc.radio.MDCRadio(document.querySelector('.mdc-radio.radio-selected'))
    const selectedField = JSON.parse(radio.value)
    document.getElementById('app-current-panel').dataset.view  = 'create'
    createTempRecord(selectedField.office, selectedField.template, data)
  }

}

function insertTemplateByOffice(){
  const req = indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function(){
    const db = req.result
    const subscriotions = db.transaction('subscriptions').objectStore('subscriptions')
    subscriotions.openCursor().onsuccess = function(event){
      const cursor = event.target.result
      if(!cursor) return
      if(cursor.value.template !== 'Subscription' && !document.querySelector(`[data-office="${cursor.value.office}"] [data-template="${cursor.value.template}"] `)) {
        document.querySelector(`[data-selection="${cursor.value.office}"]`).appendChild(createGroupList(cursor.value.office,cursor.value.template))
      }
      cursor.continue()
    }
  }
}

function createTempRecord(office, template, data) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result
    const selectorStore = db.transaction('subscriptions').objectStore('subscriptions')
    const officeTemplateCombo = selectorStore.index('officeTemplate')
    const range = IDBKeyRange.only([office, template])
    officeTemplateCombo.get(range).onsuccess = function(event) {
      const selectedCombo = event.target.result
      const bareBonesVenue = {}
      const bareBonesVenueArray = []

      const bareBonesScheduleArray = []
      selectedCombo.venue.forEach(function(venue) {
        const bareBonesVenue = {}

        bareBonesVenue.venueDescriptor = venue
        bareBonesVenue.location = ''
        bareBonesVenue.address = ''
        bareBonesVenue.geopoint = {
          '_latitude': '',
          '_longitude': ''
        }
        bareBonesVenueArray.push(bareBonesVenue)
      })

      console.log(selectedCombo)
      selectedCombo.schedule.forEach(function(schedule) {
        const bareBonesSchedule = {}
        bareBonesSchedule.name = schedule
        bareBonesSchedule.startTime = ''
        bareBonesSchedule.endTime = ''
        bareBonesScheduleArray.push(bareBonesSchedule)
      })

      const bareBonesRecord = {
        office: selectedCombo.office,
        template: selectedCombo.template,
        venue: bareBonesVenueArray,
        schedule: bareBonesScheduleArray,
        attachment: selectedCombo.attachment,
        timestamp: Date.now(),
        canEdit: true,
        assignees: [],
        activityName: selectedCombo.template.toUpperCase(),
        create: true
      }

      removeDialog()
      updateCreateActivity(bareBonesRecord,true)
      
    }
  }
}



function hasAnyValueInChildren(office, template, status) {
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  return new Promise(function(resolve) {

    req.onsuccess = function() {
      const db = req.result
      const childrenStore = db.transaction('children').objectStore('children')
      let count = 0;
      let result = false
      childrenStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result
        if (!cursor) {
          if (count === 0) {
            result = false
            resolve(result)
          } else {
            result = true
            resolve(result)
          }
          return
        }
        if (cursor.value.template === template && cursor.value.office === office && status != 'CANCELLED') {
          count++
        }
        cursor.continue()
      }

    }
  })
}

function updateDomFromIDB(activityRecord, attr, data) {


  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function(event) {

    let updatedActivity = activityRecord;

    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    if (attr.hash === 'venue') {

      updatedActivity = updateVenue(updatedActivity, attr, data)


      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-primary]`).textContent = data.primary
      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-secondary]`).textContent = data.secondary.address
      document.getElementById('send-activity').classList.remove('hidden')

      if (!activityRecord.hasOwnProperty('create')) {
        activityStore.put(updatedActivity)
      }
      return
    }
    //for create
    if (attr.hash === 'addOnlyAssignees') {
      activityRecord.assignees.push(data.primary)
      console.log(activityRecord)
      readNameAndImageFromNumber([data.primary], db)
      return
    }



    updatedActivity.attachment[attr.key].value = data.primary

    if (!activityRecord.hasOwnProperty('create')) {
      activityStore.put(updatedActivity)
    }
    if (attr.hash === 'weekday') return
    if (!attr.hasOwnProperty('key')) return


    document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-primary]`).textContent = data.primary
    if (data.hasOwnProperty('secondary')) {
      document.getElementById(convertKeyToId(attr.key)).querySelector(`[data-secondary]`).textContent = data.secondary.address
    }
    document.getElementById('send-activity').classList.remove('hidden')

  }

}

function updateVenue(updatedActivity, attr, data) {

  updatedActivity.venue.forEach(function(field) {
    if (field.venueDescriptor === attr.key) {
      field.location = data.primary
      field.address = data.secondary.address
      field.geopoint['_latitude'] = data.secondary.geopoint['_latitude']
      field.geopoint['_longitude'] = data.secondary.geopoint['_longitude']
      console.log(field)
    }
  })
  return updatedActivity
}

function convertKeyToId(key) {
  return key.replace(/\s/g, '-')
}

function convertIdToKey(id) {
  return id.replace(/-/g, ' ')
}

function updateCreateContainer(record) {

  document.body.style.backgroundColor = '#eeeeee'

  const leftHeaderContent = document.createElement('div')
  leftHeaderContent.style.display = 'inline-flex'
  const backSpan = document.createElement('span')
  backSpan.className = 'material-icons'
  backSpan.textContent = 'arrow_back'
  backSpan.id = 'backToConv'
  backSpan.style.paddingLeft = '10px'

  const activityName = document.createElement('span')
  activityName.textContent = record.activityName

  activityName.style.paddingLeft = '10px'
  activityName.style.fontSize = '19px'

  leftHeaderContent.appendChild(backSpan)
  leftHeaderContent.appendChild(activityName)
  header(leftHeaderContent.outerHTML, '')


  document.getElementById('backToConv').addEventListener('click', function() {
    backNav()
  })



  const container = document.createElement('div')
  container.className = 'mdc-top-app-bar--fixed-adjust update-create--activity'

  const TOTAL_LIST_TYPES = ['office', 'venue', 'schedule', 'attachment', 'assignees']

  const LIST_LENGTH = 5
  let i = 0;
  for (i; i < LIST_LENGTH; i++) {
    const containerList = document.createElement('ul')
    containerList.className = 'mdc-list custom--list-margin';

    const listGroup = document.createElement('div')
    switch (TOTAL_LIST_TYPES[i]) {
      case 'office':
        containerList.classList.remove('custom--list-margin')
        break;
      case 'schedule':
        listGroup.className = 'mdc-list-group__subheader'
        listGroup.id = 'schedule--group'
        break;
      case 'venue':
      case 'assignees':
        containerList.classList.add('mdc-list--two-line', 'mdc-list--avatar-list')
        break;

    };

    if (TOTAL_LIST_TYPES[i] === 'schedule') {
      container.appendChild(listGroup)
    } else {

      containerList.id = TOTAL_LIST_TYPES[i] + '--list'
      container.appendChild(containerList)
    }
  }
  if (record.canEdit) {

    const updateBtn = document.createElement('button')
    updateBtn.className = 'mdc-fab send--activity-fab'
    updateBtn.setAttribute('aria-label', 'Send')
    updateBtn.id = 'send-activity'
    if(!record.hasOwnProperty('create')) {
      updateBtn.classList.add('hidden')
    }
    const sendIcon = document.createElement('span')
    sendIcon.className = 'mdc-fab__icon material-icons'
    sendIcon.textContent = 'send'
    updateBtn.appendChild(sendIcon)
    container.appendChild(updateBtn)
  }
  return container
}

function updateCreateActivity(record, pushState) {

  if (pushState) {
    history.pushState(['updateCreateActivity',record], null, null)
  }

  //open indexedDB
  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function() {
    const db = req.result

    // create base container for activity update/create
    const appView = document.getElementById('app-current-panel')
    appView.innerHTML = updateCreateContainer(record).outerHTML
    
 
    const officeSection = document.getElementById('office--list')
    officeSection.appendChild(createSimpleLi('Office', {
      office: record.office,
      showLabel: true
    }))

    if (document.getElementById('send-activity')) {
      document.getElementById('send-activity').addEventListener('click', function() {
        sendActivity(record)
      })
    }

    createVenueSection(record)
    createScheduleTable(record);


    createAttachmentContainer(record)

    const inputFields = document.querySelectorAll('.update-create--activity input');
    for (var i = 0; i < inputFields.length; i++) {
      inputFields[i].addEventListener('input', function(e) {
        if (document.getElementById('send-activity').classList.contains('hidden')) {
          document.getElementById('send-activity').classList.remove('hidden')
        }
      })
    }

    if (document.querySelector('.mdc-select')) {
      const select = new mdc.select.MDCSelect(document.querySelector('.mdc-select'));
      select.listen('change', () => {
        console.log(select)
        updateDomFromIDB(record, {
          hash: 'weekday',
          key: select['root_'].dataset.value
        }, {
          primary: select.value
        })
        if (document.getElementById('send-activity').classList.contains('hidden')) {
          document.getElementById('send-activity').classList.remove('hidden')
        }
      });
    }

    
    createAssigneeList(db, record, true)

    createActivityCancellation(record);

  }
}

function createSimpleLi(key, data) {

  const listItem = document.createElement('li')
  listItem.className = 'mdc-list-item mdc-ripple-upgraded'


  const listItemLabel = document.createElement('span')
  listItemLabel.className = 'detail--static-text'
  const listItemMeta = document.createElement('span')

  const dataVal = document.createElement('span')

  if (key === 'Office') {
    dataVal.className = 'data--value-list'
    dataVal.textContent = data.office
    listItemLabel.textContent = key
    listItem.appendChild(listItemLabel)
    listItem.appendChild(dataVal)
  }
  if (key === 'children') {
    const metaInput = document.createElement('span')
    metaInput.className = 'mdc-list-item__meta'
    metaInput.appendChild(createRadioInput())


    listItem.textContent = data
    listItem.appendChild(metaInput)
    listItem.onclick = function() {

      checkRadioInput(this, {
        name: data
      })
    }
  }
  if(key === 'delete') {
    dataVal.className = 'mdc-list-item__graphic material-icons'
    dataVal.textContent = key
    listItemLabel.classList.remove('detail--static-text')
    listItemLabel.classList.add('delete-activity')
    listItemLabel.textContent = data.text
    listItem.appendChild(dataVal)
    listItem.appendChild(listItemLabel)
  }
  if(key === 'empty'){
    listItem.dataset.prop = 'delete'
  }

  return listItem
}

function createGroupList(office, template) {

  const li = document.createElement('li')
  li.className = 'mdc-list-item'
  li.dataset.template = template
  const span = document.createElement('span')
  span.className = 'mdc-list-item__text'
  span.textContent = template.toUpperCase()

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta'
  metaInput.appendChild(createRadioInput())
  li.onclick = function() {
    checkRadioInput(this, {
      office: office,
      template: template
    })
  }
  li.appendChild(span)
  li.appendChild(metaInput)
  return li
}

function createVenueSection(record) {
  console.log(record)
  const venueSection = document.getElementById('venue--list')

  record.venue.forEach(function(venue) {
    venueSection.appendChild(createVenueLi(venue, true, record))
    const mapDom = document.createElement('div');
    mapDom.className = 'map-detail ' + convertKeyToId(venue.venueDescriptor)
    venueSection.appendChild(mapDom)
  })

  if (record.venue.length === 0) {
    document.getElementById('venue--list').style.display = 'none'
  }
}

function createVenueLi(venue, showVenueDesc, record, showMetaInput) {
  let showMap = false
  const listItem = document.createElement('li')
  listItem.className = 'mdc-list-item mdc-ripple-upgraded'
  listItem.id = convertKeyToId(venue.venueDescriptor)

  const textSpan = document.createElement('div')
  textSpan.className = 'mdc-list-item__text link--span'

  const primarySpan = document.createElement('span')
  primarySpan.className = 'mdc-list-item__primary-text'

  const selectorIcon = document.createElement('span')
  selectorIcon.className = 'mdc-list-item__meta'
  const addLocation = document.createElement('label')
  addLocation.className = 'mdc-fab add--assignee-icon attachment-selector-label'
  const locationBtnSpan = document.createElement('span')
  locationBtnSpan.className = 'mdc-fab__icon material-icons'
  locationBtnSpan.textContent = 'add_location'
  addLocation.appendChild(locationBtnSpan)

  if (showVenueDesc) {
    const listItemLabel = document.createElement('span')
    listItemLabel.className = 'detail--static-text'
    listItemLabel.textContent = venue.venueDescriptor

    const dataValue = document.createElement('span')
    dataValue.className = 'data--value-list'
    dataValue.textContent = venue.location
    dataValue.dataset.primary = ''

    primarySpan.appendChild(listItemLabel)
    primarySpan.appendChild(dataValue)
    textSpan.appendChild(primarySpan)
    
    textSpan.onclick = function(evt){
      showMap = !showMap

      const loc = {
        lat : venue.geopoint['_latitude'],
        lng: venue.geopoint['_longitude']
      }

      maps('',showMap, convertKeyToId(venue.venueDescriptor),loc)
    }

    if (record.canEdit) {
      selectorIcon.setAttribute('aria-hidden', 'true')
      selectorIcon.appendChild(addLocation)
      addLocation.onclick = function(evt) {
        selectorUI(evt, {
          record: record,
          store: 'map',
          attachment: {
            present: false
          },
          key: venue.venueDescriptor
        })
      }
    }
  } else {
    primarySpan.textContent = venue.location
    textSpan.appendChild(primarySpan)

  }

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta material-icons'

  if (showMetaInput) {

    metaInput.appendChild(createRadioInput())
    listItem.onclick = function() {
      console.log(venue)
      checkRadioInput(this, {
        location: venue.location,
        address: venue.address,
        geopoint: {
          '_latitude': venue.latitude,
          '_longitude': venue.longitude
        },
        venueDesc: venue.venueDescriptor
      })
    }
  }

  const secondaryText = document.createElement('span')
  secondaryText.className = 'mdc-list-item__secondary-text'
  secondaryText.textContent = venue.address
  secondaryText.dataset.secondary = ''
  textSpan.appendChild(secondaryText)
  listItem.appendChild(textSpan)
  if (showMetaInput) {
    listItem.appendChild(metaInput)
  } else {
    listItem.appendChild(selectorIcon)
   
  }

  return listItem

}

function createScheduleTable(data) {

  if (!data.schedule.length) {
    document.getElementById('schedule--group').style.display = 'none'
    // return document.createElement('span')
  }



  let count =0;
  data.schedule.forEach(function(schedule) {
    count++
    console.log(schedule.startTime)
    const scheduleName = document.createElement('h5')
    scheduleName.className = 'mdc-list-group__subheader label--text'
    scheduleName.textContent = schedule.name

    const ul = document.createElement('ul')
    ul.className = 'mdc-list mdc-list--dense'

    const divider = document.createElement('li')
    divider.className = 'mdc-list-divider'
    divider.setAttribute('role', 'separator')

    const startLi = document.createElement('li')
    startLi.className = 'mdc-list-item'

    const sdDiv = document.createElement('div')
    sdDiv.className = 'mdc-text-field start--date'+count

    const startDateInput = document.createElement('input')
    startDateInput.value =  moment(schedule.startTime || new Date()).format('YYYY-MM-DD')
    startDateInput.type = 'date'
    startDateInput.disabled = !data.canEdit
    startDateInput.className = 'mdc-text-field__input'

    sdDiv.appendChild(startDateInput)

    const stSpan = document.createElement("span")
    stSpan.className = 'mdc-list-item__meta'

    const stDiv = document.createElement('div')
    stDiv.className = 'mdc-text-field start--time'+count

    const startTimeInput = document.createElement('input')
    startTimeInput.value = moment(schedule.startTime || new Date()).format('HH:mm')
    startTimeInput.type = 'time'
    startTimeInput.className = 'time--input'
    startTimeInput.disabled = !data.canEdit
    startTimeInput.className = 'mdc-text-field__input'
    stDiv.appendChild(startTimeInput)

    stSpan.appendChild(stDiv)


    const endLi = document.createElement('li')
    endLi.className = 'mdc-list-item'

    const edDiv = document.createElement('div')
    edDiv.className = 'mdc-text-field end--date'+count

    const endDateInput = document.createElement('input')
    endDateInput.value = moment(schedule.endTime || new Date()).format('YYYY-MM-DD')
    endDateInput.type = 'date'
    endDateInput.disabled = !data.canEdit
    endDateInput.className = 'mdc-text-field__input'
    edDiv.appendChild(endDateInput)

    const etSpan = document.createElement("span")
    etSpan.className = 'mdc-list-item__meta'

    const etDiv = document.createElement('div')
    etDiv.className = 'mdc-text-field end--time'+count


    const endTimeInput = document.createElement('input')
    endTimeInput.value = moment(schedule.endTime || new Date()).format('HH:mm')
    endTimeInput.type = 'time'
    endTimeInput.disabled = !data.canEdit
    endTimeInput.className = 'mdc-text-field__input'

    etDiv.appendChild(endTimeInput)

    etSpan.appendChild(etDiv)


    startLi.appendChild(sdDiv)
    startLi.appendChild(stSpan)

    endLi.appendChild(edDiv)
    endLi.appendChild(etSpan)

    ul.appendChild(startLi)
    ul.appendChild(divider)
    ul.appendChild(endLi)

    document.getElementById('schedule--group').appendChild(scheduleName)
    document.getElementById('schedule--group').appendChild(ul)
  })
}

function createAttachmentContainer(data) {

  const ordering = ['Name', 'Template','email', 'phoneNumber', 'HHMM', 'weekday', 'number', 'base64', 'string']

  ordering.forEach(function(order) {
    const group = document.createElement("div")
    group.className = `${order}--group`
    document.getElementById('attachment--list').appendChild(group)
  })

  const availTypes = {
    'phoneNumber': '',
    'weekday': '',
    'HH:MM': '',
    'string': '',
    'base64': '',
    'number' : '',
    'email':''
  }


  Object.keys(data.attachment).forEach(function(key) {

    const div = document.createElement('div')
    div.className = `attachment-field ${data.attachment[key].type}`
    div.id = convertKeyToId(key)

    if (data.canEdit) {
      div.classList.add('editable--true')
    }

    const label = document.createElement('span')
    label.className = 'label--text'
    label.textContent = key

    if (key === 'Name') {
      div.appendChild(label)
      const required = true
      div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key,required))
    }

    if (data.attachment[key].type === 'string' && key !== 'Name') {

      div.appendChild(label)
      div.appendChild(createSimpleInput(data.attachment[key].value, data.canEdit, '', key))

    }

    if(data.attachment[key].type === 'number') {
      div.appendChild(label)
      div.appendChild(createNumberInput(data.attachment[key].value,data.canEdit))
    }

    if(data.attachment[key].type === 'email') {
      div.appendChild(label)
      div.appendChild(createEmailInput(data.attachment[key].value,data.canEdit))
    }

    if (data.attachment[key].type === 'phoneNumber') {
      div.classList.add('selector--margin')
      const addButton = document.createElement('label')
      addButton.className = 'mdc-fab add--assignee-icon attachment-selector-label'
      const span = document.createElement('span')
      span.className = 'mdc-fab__icon material-icons'
      span.textContent = 'person_add'
      addButton.appendChild(span)

      const dataVal = document.createElement('span')
      dataVal.className = 'data--value-list'
      dataVal.dataset.primary = ''
      if (data.canEdit) {
        div.appendChild(addButton)
        addButton.onclick = function(evt) {
          selectorUI(evt, {
            record: data,
            store: 'users',
            attachment: {
              present: true,
              key: key
            }
          })
        }
      }
      div.appendChild(label)

      dataVal.textContent = data.attachment[key].value
      div.appendChild(dataVal)
    }

    if (data.attachment[key].type == 'HH:MM') {
      div.appendChild(label)
      div.appendChild(createTimeInput(data.attachment[key].value, data.canEdit, {
        simple: false,
        type: 'time'
      }))
    }

    if (data.attachment[key].type === 'weekday') {
      div.appendChild(label)
      div.appendChild(createSelectMenu(key, data.attachment[key].value, data.canEdit))
      
    }

    if (data.attachment[key].type === 'base64') {
      const addCamera = document.createElement('label')
      addCamera.className = 'mdc-fab attachment-selector-label add--assignee-icon'
      addCamera.id = 'start-camera'

      const span = document.createElement('span')
      span.className = 'mdc-fab__icon material-icons'
      span.textContent = 'add_a_photo'
      addCamera.appendChild(span)

      const imagePreview = document.createElement('ul')
      imagePreview.className = 'image-preview--attachment mdc-image-list standard-image-list mdc-image-list--with-text-protection'
      
      imagePreview.appendChild(setFilePath(data.attachment[key].value,key,true))

     
      div.appendChild(imagePreview)
    

      if (data.canEdit) {

        div.appendChild(addCamera)
        div.appendChild(imagePreview);
        addCamera.onclick = function() {
          readCameraFile()
        }
      }
    }


    if (!availTypes.hasOwnProperty(data.attachment[key].type)) {

      const addButtonName = document.createElement('label')
      addButtonName.className = 'mdc-fab add--assignee-icon attachment-selector-label'
      const spanName = document.createElement('span')
      spanName.className = 'mdc-fab__icon material-icons'
      spanName.textContent = 'add'
      addButtonName.appendChild(spanName)
      div.appendChild(label)
      const valueField = document.createElement('span')
      valueField.textContent = data.attachment[key].value
      valueField.className = 'data--value-list'
      div.appendChild(valueField)
      // div.appendChild(createInput(key, data.attachment[key].type, 'attachment', true))
      if (data.canEdit) {
        hasAnyValueInChildren(data.office, data.attachment[key].type, data.status).then(function(hasValue) {
          if (hasValue) {
            console.log(hasValue)
            div.appendChild(addButtonName);
            div.classList.add('selector--margin')
            addButtonName.onclick = function(evt) {
              valueField.dataset.primary = ''
              selectorUI(evt, {
                record: data,
                store: 'children',
                attachment: {
                  present: true,
                  key: key,
                  office: data.office,
                  template: data.attachment[key].type,
                  status: data.status
                }
              })
            }
          }
        })
      }
    }



    const hr = document.createElement('hr')
    hr.className = 'attachment--divider'
    if (data.attachment[key].type === 'HH:MM') {

      document.querySelector('.HHMM--group').appendChild(div)
      document.querySelector('.HHMM--group').appendChild(hr)
    } else if (key === 'Name') {
      document.querySelector('.Name--group').appendChild(div)
      document.querySelector('.Name--group').appendChild(hr)
    } else if (!availTypes.hasOwnProperty(data.attachment[key].type)) {
      document.querySelector('.Template--group').appendChild(div)
      document.querySelector('.Template--group').appendChild(hr)
    } else {
      document.querySelector(`.${data.attachment[key].type}--group`).appendChild(div)
      document.querySelector(`.${data.attachment[key].type}--group`).appendChild(hr)
    }
  })
}



function createAssigneeList(db, record, showLabel) {
  if (showLabel) {

    const labelAdd = document.createElement('li')
    labelAdd.className = 'mdc-list-item label--text'
    labelAdd.textContent = 'Assignees'



    const labelButton = document.createElement('span')
    labelButton.className = 'mdc-list-item__meta'
    const addButton = document.createElement('div')
    addButton.className = 'mdc-fab add--assignee-icon'
    addButton.onclick = function(evt) {
      selectorUI(evt, {
        record: record,
        store: 'users',
        attachment: {
          present: false
        }
      })
    }
    const span = document.createElement('span')
    span.className = 'mdc-fab__icon material-icons'
    span.textContent = 'person_add'
    addButton.appendChild(span)
    labelButton.appendChild(addButton)


    if (record.canEdit) {
      labelAdd.appendChild(labelButton)
    }

    document.getElementById('assignees--list').appendChild(labelAdd)
  }
  readNameAndImageFromNumber(record.assignees, db)
}

function readNameAndImageFromNumber(assignees, db) {
  const userObjStore = db.transaction('users').objectStore('users')
  assignees.forEach(function(assignee) {
    userObjStore.get(assignee).onsuccess = function(event) {
      const userRecord = event.target.result

      document.getElementById('assignees--list').appendChild(createSimpleAssigneeLi(userRecord))
    }
  })
}

function createSimpleAssigneeLi(userRecord, showMetaInput) {
  const assigneeLi = document.createElement('li')
  assigneeLi.classList.add('mdc-list-item', 'assignee-li')
  if (!userRecord) return assigneeLi
  assigneeLi.dataset.value = userRecord.mobile
  const photoGraphic = document.createElement('img')
  photoGraphic.classList.add('mdc-list-item__graphic')

  if (userRecord.mobile === firebase.auth().currentUser.phoneNumber) {
    photoGraphic.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'
  } else {
    photoGraphic.src = userRecord.photoURL || './img/empty-user.jpg'
  }
  photoGraphic.setAttribute('onerror','handleImageError(this)')

  const assigneeListText = document.createElement('span')
  assigneeListText.classList.add('mdc-list-item__text')
  const assigneeName = document.createElement('span')
  assigneeName.className = 'mdc-list-item__primary-text'

  const assigneeListTextSecondary = document.createElement('span')
  assigneeListTextSecondary.classList.add('mdc-list-item__secondary-text')

  if (!userRecord.displayName) {
    assigneeName.textContent = userRecord.mobile
  } else {
    assigneeName.textContent = userRecord.displayName
    assigneeListTextSecondary.textContent = userRecord.mobile
  }

  assigneeListText.appendChild(assigneeName)
  assigneeListText.appendChild(assigneeListTextSecondary)

  const metaInput = document.createElement('span')
  metaInput.className = 'mdc-list-item__meta material-icons'
  if (showMetaInput) {

    metaInput.appendChild(createRadioInput())
    assigneeLi.onclick = function() {
      checkRadioInput(this, assigneeLi.dataset.value)
    }
  }
  assigneeLi.appendChild(photoGraphic)
  assigneeLi.appendChild(assigneeListText)
  assigneeLi.appendChild(metaInput)
  return assigneeLi
}

function createRadioInput() {
  const div = document.createElement("div")
  div.className = 'mdc-radio radio-control-selector'
  const input = document.createElement('input')
  input.className = 'mdc-radio__native-control'
  input.type = 'radio'
  input.name = 'radio'

  const radioBckg = document.createElement('div')
  radioBckg.className = 'mdc-radio__background'

  const outerRadio = document.createElement('div')
  outerRadio.className = 'mdc-radio__outer-circle'

  const innerRadio = document.createElement("div")
  innerRadio.className = 'mdc-radio__inner-circle'
  radioBckg.appendChild(outerRadio)
  radioBckg.appendChild(innerRadio)

  div.appendChild(input)
  div.appendChild(radioBckg)
  return div

}

function checkRadioInput(inherit, value) {
  const parent = inherit
  const radio = new mdc.radio.MDCRadio(parent.querySelector('.radio-control-selector'))
  radio['root_'].classList.add('radio-selected')
  radio.checked = true
  console.log(value)
  radio.value = JSON.stringify(value)
}

function setFilePath(str,key,show) {
  if(document.querySelector('.image--list-li')) {
    document.getElementById('attachment-picture').src = `data:image/jpeg;base64,${str}`
    document.getElementById('send-activity').classList.remove('hidden')
    return
  }
  const li = document.createElement('li')
  li.className = 'mdc-image-list__item image--list-li'

  const container = document.createElement('div')

  const img = document.createElement('img')
  img.className = 'profile-container--main mdc-image-list__image '
  img.id = 'attachment-picture'
  img.dataset.photoKey = key
  img.setAttribute('onerror','handleImageErrorAttachment(this)')
  if(!str) {
    img.src = './img/placeholder.png'
  }
  else {
    img.src = str;
  }
  img.onclick = function(){
    openImage(this.src)
  }
  container.appendChild(img)
  li.appendChild(container)

  const textCont = document.createElement('div')
  textCont.className = 'mdc-image-list__supporting'

  const span = document.createElement('span')
  span.textContent = key 
  span.className = 'mdc-image-list__label'
  span.id = 'label--image'
  textCont.appendChild(span)
  li.appendChild(textCont)
  if(show) return li


  
}

function readCameraFile() {
  FetchCameraForAttachment.startCamera()
}

function openImage(imageSrc) {
  sendCurrentViewNameToAndroid('selector')

  if (imageSrc.substring(0, 4) !== "data") return

  document.getElementById('viewImage--dialog-component').querySelector("img").src = imageSrc;
  const imageDialog = new mdc.dialog.MDCDialog.attachTo(document.querySelector('#viewImage--dialog-component'));
  imageDialog.show()
}

function createActivityCancellation(record) {

  const StautsCont = document.createElement('div')
  StautsCont.className = 'status--cancel-cont'

  if (record.canEdit && !record.hasOwnProperty('create')) {
    
    StautsCont.appendChild(createSimpleLi('delete',{text:'Delete Activity'}))

  
    document.querySelector('.update-create--activity').appendChild(StautsCont);
    if(!document.getElementById('cancel-alert')) {
      cancelAlertDialog()
    }
    var dialog = new mdc.dialog.MDCDialog(document.querySelector('#cancel-alert'));
    
        dialog.listen('MDCDialog:accept', function() {
        
         requestCreator('statusChange', {
          activityId: record.activityId,
           status: 'CANCELLED',
         })
         
        })
        
        dialog.listen('MDCDialog:cancel', function() {
          console.log('canceled');
        })
    document.querySelector('.delete-activity').addEventListener('click', function (evt) {
      dialog.lastFocusedTarget = evt.target;
      dialog.show();
    })
    
    
   }
    
}

function cancelAlertDialog(){
  const aside = document.createElement('aside')
  aside.className = 'mdc-dialog'
  aside.id = 'cancel-alert'

  const surface = document.createElement('div')
  surface.className = 'mdc-dialog__surface'

  const section = document.createElement('section')
  section.className = 'mdc-dialog__body'

  section.textContent = 'Are you sure you want to delete this activity ? '

  const footer = document.createElement('footer')
  footer.className = 'mdc-dialog__footer'

  const accept = document.createElement('button')
  accept.type = 'button'
  accept.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept delete-btn'
  accept.textContent = 'Delete'

  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel cancel-delete-btn'
  cancel.textContent = 'Cancel'

  footer.appendChild(cancel)
  footer.appendChild(accept)
  surface.appendChild(section)
  surface.appendChild(footer)
  aside.appendChild(surface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)
  document.body.appendChild(aside)

 
}



function sendActivity(record) {

  if (record.hasOwnProperty('create')) {
    insertInputsIntoActivity(record)
    return
  }

  const dbName = firebase.auth().currentUser.uid
  const req = indexedDB.open(dbName)
  req.onsuccess = function(event) {
    const db = req.result
    const activityStore = db.transaction('activity', 'readwrite').objectStore('activity')

    activityStore.get(record.activityId).onsuccess = function(event) {
      const record = event.target.result
      insertInputsIntoActivity(record, activityStore)
    }
  }
}

function concatDateWithTime(date, time) {
  const dateConcat = moment(date + " " + time)
  return moment(dateConcat).valueOf()
}

function insertInputsIntoActivity(record, activityStore) {
  console.log(record)
  const allStringTypes = document.querySelectorAll('.string')
  for (var i = 0; i < allStringTypes.length; i++) {
    let inputValue = allStringTypes[i].querySelector('.mdc-text-field__input').value
 
    if(allStringTypes[i].querySelector('.mdc-text-field__input').required && checkSpacesInString(inputValue)) {
      snacks('Please provide an input for the field “Name” ')
      return;
    } 
    record.attachment[convertIdToKey(allStringTypes[i].id)].value = inputValue
  
  }
  const imagesInAttachments = document.querySelectorAll('.image-preview--attachment  img')
  for (let i = 0; i < imagesInAttachments.length; i++) {
      record.attachment[convertKeyToId(imagesInAttachments[i].dataset.photoKey)].value = imagesInAttachments[i].src
  }

  let sd;
  let st;
  let ed;
  let et
  let allow = true;
  for (var i = 1; i < record.schedule.length +1; i++) {

    sd = getInputText('.start--date'+i).value
    st = getInputText('.start--time'+i).value
    ed = getInputText('.end--date'+i).value
    et = getInputText('.end--time'+i).value

    console.log(concatDateWithTime(sd,st))

    if(!concatDateWithTime(sd,st)  && !concatDateWithTime(ed,et)){
      snacks('Please Select A Start Date and End Date')
      return
    }

    if(sd === "") {
      snacks('Please Select a Start Date')
      return;
    }
    if(ed === "") {
      snacks('Please Select an End Date')
      return;
    }


    if (concatDateWithTime(ed,et) < concatDateWithTime(sd,st)) {
      snacks('The End Date and Time should be greater or equal to the start time')
      return;
    }
      record.schedule[i-1].startTime = concatDateWithTime(sd, st) || ''
      record.schedule[i-1].endTime = concatDateWithTime(ed, et) || ''
  }
  
  for (var i = 0; i < record.venue.length; i++) {
    record.venue[i].geopoint = {
      latitude: record.venue[i].geopoint['_latitude'],
      longitude: record.venue[i].geopoint['_longitude']
    }
  }

  const requiredObject = {
    venue: record.venue,
    schedule: record.schedule,
    attachment: record.attachment
  }



  if (!record.hasOwnProperty('create')) {
    requiredObject.activityId = record.activityId
    document.querySelector('header').appendChild(progressBar())
    document.querySelector('#send-activity').classList.add('hidden')
    requestCreator('update', requiredObject)

    return
  }

  requiredObject.office = record.office
  requiredObject.template = record.template
  requiredObject.share = record.assignees
  document.querySelector('header').appendChild(progressBar())
  document.querySelector('#send-activity').classList.add('hidden')
  requestCreator('create', requiredObject)
}

function checkSpacesInString(input){
  if(!input.replace(/\s/g,'').length) return true
  return false
}

function initSearchForSelectors(type, record, attr) {
  searchBarUI()
  if (type === 'map') {
    let input = document.getElementById('search--bar-selector')
    const options = {
      componentRestrictions: {
        country: "in"
      }
    }
    autocomplete = new google.maps.places.Autocomplete(input, options);
    initializeAutocompleteGoogle(autocomplete, record, attr)
  }

}

function searchBarUI() {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#action-data")
  actionCont.className = 'search--cont'

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.add('search-field-transform')
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = 'white'
  if (!document.getElementById('search--bar--field')) {

    actionCont.appendChild(createSimpleInput('', true, true))

  } else {
    document.getElementById('search--bar--field').style.display = 'block'
  }
  document.getElementById('selector--search').style.display = 'none'
  document.querySelector('.selector-send').style.display = 'none'
  dialogEl.querySelector('#view-type span').dataset.type = 'back-list'
  document.getElementById('data-list--container').style.display = 'none'
}

function resetSelectorUI() {

  const dialogEl = document.getElementById('dialog--component')
  const actionCont = dialogEl.querySelector("#action-data")
  dialogEl.querySelector('#view-type span').dataset.type = ''

  dialogEl.querySelector('.mdc-top-app-bar__section--align-end').classList.remove('search-field-transform')
  actionCont.querySelector('#search--bar--field').classList.remove('field-input')
  actionCont.classList.remove('search--cont')
  document.getElementById('selector--search').style.display = 'block'
  document.querySelector('.selector-send').style.display = 'block'
  document.querySelector('#search--bar--field').style.display = 'none'
  dialogEl.querySelector('.mdc-top-app-bar__section--align-start').style.backgroundColor = '#eeeeee'
  document.getElementById('data-list--container').style.display = 'block'
  document.querySelector('#dialog--component .mdc-dialog__surface').style.width = '-webkit-fill-available'
  document.querySelector('#dialog--component .mdc-dialog__surface').style.height = '-webkit-fill-available'

}

function initializeAutocompleteGoogle(autocomplete, record, attr) {
  document.querySelector('#dialog--component .mdc-dialog__surface').style.width = '100vw'
  document.querySelector('#dialog--component .mdc-dialog__surface').style.height = '100vh'

  autocomplete.addListener('place_changed', function() {
    let place = autocomplete.getPlace();

    if (!place.geometry) {
      snacks("Please select a valid location")
      return
    }
    //  document.getElementById('location--container').style.marginTop = '0px'

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }
    
    console.log(address)
    const selectedAreaAttributes = {
      primary: place.name,
      secondary: {
        address: address,
        geopoint: {
          '_latitude': place.geometry.location.lat(),
          '_longitude': place.geometry.location.lng()
        }
      }
    }
    updateDomFromIDB(record, {
      hash: 'venue',
      key: attr.key
    }, selectedAreaAttributes)
    removeDialog()

    // document.getElementById('location-text-field').dataset.location = place.name
    // document.getElementById('location-text-field').dataset.address = address
    // document.getElementById('location-text-field').dataset.inputlat = place.geometry.location.lat()
    // document.getElementById('location-text-field').dataset.inputlon = place.geometry.location.lng()

    console.log(address)
    console.log(place)
  })
}

function createSimpleInput(value, canEdit, withIcon, key,required) {

  if (!canEdit) {
    const onlyText = document.createElement('span')
    onlyText.className = 'data--value-list'
    onlyText.textContent = value
    return onlyText
  }

  const textField = document.createElement('div')
  if (key && key.length < 15) {

    textField.className = 'mdc-text-field data--value-list'
  } else {
    textField.className = 'mdc-text-field data--value-list-small'
  }

  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--value--update'
  input.style.paddingTop = '0px'
  input.value = value
  input.required = required

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  if (withIcon) {

    textField.id = 'search--bar--field'
    input.id = 'search--bar-selector'
    textField.classList.add('field-input')

  }
  textField.appendChild(input)
  textField.appendChild(ripple)
  const jsTField = new mdc.textField.MDCTextField.attachTo(textField)


  return textField
}

function createNumberInput(value,canEdit){
  if(!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    simeplText.textContent = value
    return simeplText
  }
  const textField = document.createElement('div')
  textField.className = 'mdc-text-field data--value-list'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-number'
  input.type = 'number'
  input.style.paddingTop = '0px'
  input.value = value
  input.setAttribute('onkeypress',"return event.charCode >= 48 && event.charCode <= 57")
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  textField.appendChild(input)
  textField.appendChild(ripple)
 
  return textField
}

function createEmailInput(value,canEdit) {
  if(!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    simeplText.textContent = value
    return simeplText
  }
  const textField = document.createElement('div')
  textField.className = 'mdc-text-field data--value-list'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-email'
  input.type = 'email'
  input.style.paddingTop = '0px'
  input.value = value
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  textField.appendChild(input)
  textField.appendChild(ripple)
 
  return textField
}
function createTimeInput(value, canEdit, attr) {
  if (!canEdit) {
    const simeplText = document.createElement('span')
    simeplText.className = 'data--value-list'
    attr.type === 'date' ? simeplText.textContent = moment(value).calendar() : simeplText.textContent = value

    return simeplText
  }
  console.log(canEdit)

  const textField = document.createElement('div')
  textField.className = 'mdc-text-field'
  const input = document.createElement('input')
  input.className = 'mdc-text-field__input input--type-time'
  input.type = attr.type
  input.style.borderBottom = 'none'

  attr.type === 'date' ? input.value = moment(value).format('YYYY-MM-DD') : input.value = value
  if (attr.type === 'time') {
    textField.classList.add('data--value-list')
    input.style.width = '100%'
    input.value =  moment(value || new Date()).format('HH:mm')
  }
  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'


  textField.appendChild(input)
  textField.appendChild(ripple)
  if (attr.simple) {
    input.classList.remove('mdc-text-field__input')
    return input
  }
  return textField
}

function createSelectMenu(key, value, canEdit) {
  if (!canEdit) {
    const span = document.createElement('span')
    span.className = 'data--value-list'
    span.textContent = value
    return span
  }
  const div = document.createElement('div')
  div.className = 'mdc-select data--value-list'
  div.style.height = '32%;'
  div.id = convertKeyToId(key)
  div.dataset.value = key
  div.dataset.primary = ''
  const select = document.createElement('select')
  select.className = 'mdc-select__native-control'
  select.style.paddingRight = '0px';
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  for (var i = 0; i < weekdays.length; i++) {
    const option = document.createElement('option')
    option.value = weekdays[i]
    option.textContent = weekdays[i]
          if(value === weekdays[i]) {
            option.setAttribute('selected','true')
          }

    select.appendChild(option)
  }
  const label = document.createElement('label')
  label.className = 'mdc-floating-label'
  label.textContent = ''

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'
  div.appendChild(label)
  div.appendChild(select)
  div.appendChild(ripple)
  return div
}



function showSendActivity(evt) {
  console.log(evt)
  const sendActivity = document.getElementById('send-activity')
  const rect1 =sendActivity.getBoundingClientRect();
  const rect2 =  document.querySelector('.status--cancel-cont').getBoundingClientRect()
  var isOverlap = !(rect1.right < rect2.left || 
    rect1.left > rect2.right || 
    rect1.bottom < rect2.top || 
    rect1.top > rect2.bottom)
    console.log(isOverlap)
  if(isOverlap) {
    sendActivity.classList.add('hidden')
    return
  }
  sendActivity.classList.remove('hidden');
}

function toggleActionables(id){
  console.log(id);
  if(!id) return;
  if(document.getElementById('app-current-panel').dataset.view === 'create') return
  const req =indexedDB.open(firebase.auth().currentUser.uid)
  req.onsuccess = function(){
    const db = req.result
    const activityStore = db.transaction('activity').objectStore('activity')
    activityStore.get(id).onsuccess = function(event){
      const record = event.target.result
      const actions =  document.querySelectorAll('.mdc-fab')
 
        if(record.editable) {
          if(document.querySelector('.loader')) {
            document.querySelector('.loader').remove()
          }
          if(document.querySelector('.progress--update')){
            document.querySelector('.progress--update').remove()
          }
        }        
    }
  }
}