let db;
window.addEventListener('load', (ev) => {
  firebase.auth().onAuthStateChanged(user => {
    const req = window.indexedDB.open(user.uid);
    req.onsuccess = function (e) {
      db = req.result;
      getRootRecord().then(loadPanDetail).catch(console.error);
      const submitBtn = document.getElementById('submit-btn');
      document.getElementById('pan-upload').addEventListener('change',(evt)=>{
        getImageBase64(evt).then(function (dataURL) {
          loadImage(`${dataURL}`)
        });
      })
      document.getElementById('pan-form').addEventListener('submit',(ev)=>{
        ev.preventDefault();
        submitBtn.classList.add('in-progress');
        
      })
    }
  })
})

const loadPanDetail = (rootRecord) => {
  const panTextField = new mdc.textField.MDCTextField(document.getElementById('pan-number'))
  const panData = rootRecord.pan;
  panTextField.value = panData.number;
    loadImage(panData.front)
}

const loadImage = (src = './img/pan_sample.png') => {
  document.querySelector('.upload-image').src = src;

}