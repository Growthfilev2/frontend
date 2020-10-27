let db;
let panNumberField;
window.addEventListener('load', (ev) => {
  firebase.auth().onAuthStateChanged(user => {
    const req = window.indexedDB.open(user.uid);
    req.onsuccess = function (e) {
      db = req.result;
      panNumberField = new mdc.textField.MDCTextField(document.getElementById('pan-number'));

      getRootRecord().then(loadPanDetail).catch(console.error);
      const submitBtn = document.getElementById('submit-btn');
      document.getElementById('pan-upload').addEventListener('change', (evt) => {
        getImageBase64(evt).then(function (dataURL) {
          loadImage(`${dataURL}`)
        });
      })
      document.getElementById('pan-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
       
        if (!isPossiblyValidPan(panNumberField.value)) {
          setHelperInvalid(panNumberField, 'Enter correct PAN Number');
          return
        }
        submitBtn.classList.add('in-progress');
        requestCreator('idProof', {
          pan: {
            number: panNumberField.value,
            front: document.querySelector('.upload-image').src
          }
        }).then(function (response) {
          console.log(response)
          const tx = db.transaction('root', 'readwrite');
          const store = tx.objectStore('root');

          store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
            const record = event.target.result;
            record.pan.front = response.pan.front;
            record.pan.number = response.pan.number
            store.put(record);
          }
          tx.oncomplete = function () {
            snacks('PAN uploaded');
            setTimeout(() => {
              window.history.back();
            }, 3000)
          }
        }).catch(function (err) {
          submitBtn.classList.remove('in-progress');
        });
      })
    }
  })
})

const loadPanDetail = (rootRecord) => {
  const panData = rootRecord.pan;
  panNumberField.value = panData ? panData.number : '';
  if(panData && panData.front) {
    loadImage(panData.front)
  }
}

const loadImage = (src) => {
  document.querySelector('.upload-image').src = src;

}



const isPossiblyValidPan = (string) => {
  return /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(string)
}