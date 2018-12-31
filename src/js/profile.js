function profileView(pushState) {
    if (pushState) {
      history.pushState(['profileView'], null, null)
    }
  
    const drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'))
    drawer.open = false;
  
    document.body.style.backgroundColor = '#eeeeee'
    const user = firebase.auth().currentUser
    const dbName = user.uid
    const req = indexedDB.open(dbName)
    req.onsuccess = function () {
      const db = req.result
      const rootTx = db.transaction(['root'], 'readwrite')
      const rootObjectStore = rootTx.objectStore('root')
      rootObjectStore.get(dbName).onsuccess = function (event) {
        const record = event.target.result
        record.view = 'profile'
        rootObjectStore.put(record)
        rootTx.oncomplete = function () {
          createProfileHeader()
          createProfilePanel()
          disableInputs()
          document.getElementById('close-profile--panel').addEventListener('click', function () {
            backNav()
          })
  
          showProfilePicture(firebase.auth().currentUser.photoURL)
  
          inputFile('uploadProfileImage').addEventListener('change', readUploadedFile)
  
          changeDisplayName(user)
          changeEmailAddress(user)
        }
      }
    }
    sendCurrentViewNameToAndroid('profile')
  }
  
  function createProfileHeader() {
  
    const backSpan = document.createElement('span')
    backSpan.id = 'close-profile--panel'
    const backIcon = document.createElement('i')
    backIcon.className = 'material-icons'
  
  
    backIcon.textContent = 'arrow_back'
    backSpan.appendChild(backIcon)
    modifyHeader({id:'app-main-header',left:backSpan.outerHTML})
  
  
  }
  
  function createProfilePanel() {
    const profileView = document.createElement('div')
    profileView.id = 'profile-view--container'
    profileView.className = 'mdc-top-app-bar--fixed-adjust mdc-theme--background'
  
    const uploadBtn = document.createElement('button')
    uploadBtn.className = 'mdc-fab'
  
    const label = document.createElement('label')
    label.setAttribute('for', 'uploadProfileImage')
    const btnText = document.createElement('span')
    btnText.className = 'mdc-fab__icon material-icons'
    btnText.textContent = 'add_a_photo'
  
    label.appendChild(btnText)
    uploadBtn.appendChild(label)
  
    const fileInput = document.createElement('input')
  
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.id = 'uploadProfileImage'
    fileInput.accept = 'accept="image/png,image/jpeg;capture=camera'
    const profileImgCont = document.createElement('div')
    profileImgCont.id = 'profile--image-container'
    profileImgCont.className = 'profile-container--main'
  
    const profileImg = document.createElement('img')
  
    profileImg.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg';
    profileImg.id = 'user-profile--image'
  
    const overlay = document.createElement('div')
    overlay.className = 'insert-overlay'
  
    profileImgCont.appendChild(profileImg)
    profileImgCont.appendChild(overlay)
    profileImgCont.appendChild(uploadBtn)
    profileImgCont.appendChild(fileInput)
  
    const nameChangeCont = document.createElement('div')
    nameChangeCont.id = 'name--change-container'
    nameChangeCont.className = 'profile-psuedo-card'
  
    const toggleBtnName = document.createElement('button')
    toggleBtnName.className = 'mdc-icon-button material-icons'
    toggleBtnName.id = 'edit--name'
  
    toggleBtnName.setAttribute('aria-hidden', 'true')
    toggleBtnName.setAttribute('aria-pressed', 'false')
    toggleBtnName.setAttribute('data-toggle-on-content', 'check')
    toggleBtnName.setAttribute('data-toggle-on-label', 'check')
    toggleBtnName.setAttribute('data-toggle-off-content', 'edit')
    toggleBtnName.setAttribute('data-toggle-off-label', 'displayName')
  
    toggleBtnName.textContent = 'edit'
  
    nameChangeCont.appendChild(createInputForProfile('displayName', 'Name'))
    nameChangeCont.appendChild(toggleBtnName)
  
    const emailCont = document.createElement('div')
    emailCont.id = 'email--change-container'
    emailCont.className = 'profile-psuedo-card'
  
    const toggleBtnEmail = document.createElement('button')
    toggleBtnEmail.className = 'mdc-icon-button material-icons'
    toggleBtnEmail.id = 'edit--email'
    toggleBtnEmail.setAttribute('aria-hidden', 'true')
    toggleBtnEmail.setAttribute('aria-pressed', 'false')
    toggleBtnEmail.setAttribute('data-toggle-on-content', 'check')
    toggleBtnEmail.setAttribute('data-toggle-on-label', 'check')
    toggleBtnEmail.setAttribute('data-toggle-off-content', 'edit')
    toggleBtnEmail.setAttribute('data-toggle-off-label', 'updateEmail')
  
    toggleBtnEmail.textContent = 'email'
  
    emailCont.appendChild(createInputForProfile('email', 'Email'))
    emailCont.appendChild(toggleBtnEmail)
  
    const refreshAuth = document.createElement('div')
    refreshAuth.id = 'ui-auth'
    refreshAuth.className = ''
  
    const changeNumCont = document.createElement('div')
    changeNumCont.id = 'change--number-container'
  
    const mainChange = document.createElement('div')
    mainChange.id = 'phone-number--change-container'
    mainChange.className = 'mdc-layout-grid__inner'
  
    changeNumCont.appendChild(mainChange)
    // changeNumCont.appendChild(submitCont)
  
    profileView.appendChild(profileImgCont)
    profileView.appendChild(nameChangeCont)
    profileView.appendChild(emailCont)
    profileView.appendChild(refreshAuth)
    profileView.appendChild(changeNumCont)
  
    document.getElementById('app-current-panel').innerHTML = profileView.outerHTML
  }
  
  function toggleIconData(icon, inputField) {
    const iconEl = document.getElementById(icon)
  
    var toggleButton = new mdc.iconButton.MDCIconButtonToggle(iconEl)
    toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function ({
      detail
    }) {
      if (!detail.isOn) {
        inputField['input_'].disabled = true
        inputField['input_'].style.borderBottom = 'none'
        const key = this.dataset.toggleOffLabel
        const text = inputField.value
        handleFieldInput(key, text)
        inputField['lineRipple_'].deactivate()
      } else {
        console.log(inputField)
        inputField['input_'].style.borderBottom = '1px solid rgba(0,0,0,.42)'
        inputField['input_'].disabled = false
        inputField['lineRipple_'].activate()
        
        localStorage.getItem('deviceType') === 'Android' ?  openAndroidKeyboard.startKeyboard() :''
        inputField['input_'].focus()
      }
    })
  }
  
  function handleFieldInput(key, value) {
    const user = firebase.auth().currentUser
    console.log(typeof value)
    if (key === 'displayName') {
      user.updateProfile({
        [key]: value
      }).then(function () {
        successDialog()
      }).catch(authUpdatedError)
    }
  
    if (key === 'updateEmail') {
      if (value === firebase.auth().currentUser.email) {
        snacks('This email address already exists')
        return
      }
      if (timeDiff(firebase.auth().currentUser.metadata.lastSignInTime) <= 5) {
        console.log('less than 5')
        updateEmail(firebase.auth().currentUser, value)
      } else {
        newSignIn(value)
      }
    }
  }
  
  function timeDiff(lastSignInTime) {
    const currentDate = moment().format('YYY-MM-DD HH:mm')
    const authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm')
  
    return moment(currentDate).diff(moment(authSignInTime), 'minutes')
  }
  
  function newSignIn(value) {
    const login = document.createElement('div')
    login.id = 'refresh-login'
    login.className = 'mdc-elevation--z3'
  
    document.getElementById('ui-auth').innerHTML = login.outerHTML
  
    // document.querySelector('.app').style.display = 'none'
  
    const ui = new firebaseui.auth.AuthUI(firebase.auth())
  
    // DOM element to insert firebaseui login UI
    ui.start('#refresh-login', firebaseUiConfig(value))
    setTimeout(function () {
      document.querySelector('.firebaseui-id-phone-number').value = firebase.auth().currentUser.phoneNumber
      document.querySelector('.firebaseui-id-phone-number').disabled = true
      document.querySelector('.firebaseui-label').remove()
    }, 300)
  }
  
  function readUploadedFile(event) {
    console.log(event)
    const file = event.target.files[0]
  
    const reader = new FileReader()
  
    if (file) {
      reader.readAsDataURL(file)
      processImage(file)
    }
  }
  
  function processImage(image) {
    const metadata = {
      cacheControl: 'public,max-age=31536000',
      contentType: 'image/jpeg'
    }
  
    const uid = firebase.auth().currentUser.uid
    const storageRef = firebase.storage().ref(`ProfileImage/${uid}`)
    const uploadTask = storageRef.put(image, metadata)
  
    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      snapshotHandler,
      storageErrorHandler,
      storageSuccessHandler
    )
  
    function snapshotHandler(snapshot) {
      if (firebase.storage.TaskState.RUNNING) {
        if (document.querySelector('#profile--image-container .loader')) return
  
        document.querySelector('.insert-overlay').classList.add('middle')
        document.getElementById('profile--image-container').appendChild(loader())
        document.querySelector('#profile--image-container .loader').classList.add('profile--loader')
        // show gola
      }
    }
  
    function storageErrorHandler(error) {
     
      console.log(error)
      const log = {
        message : error
      }
      requestCreator('instant',JSON.stringify(log))
    }
  
    function storageSuccessHandler() {
      uploadTask.snapshot.ref.getDownloadURL().then(updateAuth)
    }
  }
  
  function updateAuth(url) {
    console.log(url)
    const user = firebase.auth().currentUser
    user.updateProfile({
      photoURL: url
    }).then(function () {
      removeLoader(url)
    }).catch(authUpdatedError)
  }
  
  function removeLoader(url) {
    document.querySelector('.insert-overlay').classList.remove('middle')
    const container = document.getElementById('profile--image-container')
    container.children[0].classList.add('reset-opacity')
  
    container.removeChild(container.lastChild)
    showProfilePicture(url)
  }
  
  function showProfilePicture(url) {
    document.getElementById('user-profile--image').src = url || './img/empty-user.jpg'
    document.querySelector('.drawer-header-icon').src = url  || './img/empty-user.jpg'
  }
  
  function authUpdatedError(error) {
        snacks(error.message)
  }
  
  function changeDisplayName(user) {
    const displayNameField = getInputText('#displayName')
  
    if (user.displayName) {
      displayNameField.value = user.displayName
    }
  
    toggleIconData('edit--name', displayNameField)
  }
  
  function changeEmailAddress(user) {
    const emailField = getInputText('#email')
    if (user.email) {
      emailField.value = user.email
    }
  
    toggleIconData('edit--email', emailField)
  }
  
  function updateEmail(user, email) {
    console.log(email)
    user.updateEmail(email).then(emailUpdateSuccess).catch(authUpdatedError)
  }
  
  function emailUpdateSuccess() {
    const user = firebase.auth().currentUser
    console.log(user)
    user.sendEmailVerification().then(emailVerificationSuccess).catch(emailVerificationError)
  }
  
  function emailVerificationSuccess() {
    successDialog()
    snacks('Verification link has been send to your email address')
  }
  
  function emailVerificationError(error) {
    snacks(error.message)
  }
  
  function handleReauthError(error) {
    console.log(error)
  }
  
  
  function disableInputs() {
    getInputText('#displayName')['input_'].disabled = true
    getInputText('#email')['input_'].disabled = true
  }
  