let db;
let aadharNumberField;
const aadharImages = () => {
  const front = document.querySelector('.aadhar-front');
  const back = document.querySelector('.aadhar-back');
  return {
    setFront: (src = '../img/aadhaar_front.png') => {
      front.src = src
    },
    setBack: (src = '../img/aadhaar_back.png') => {
      back.src = src
    },
    getFront: () => {
      return front.src
    },
    getBack: () => {
      return back.src
    }
  }
}
const imageManager = aadharImages();

window.addEventListener('load', (ev) => {
  firebase.auth().onAuthStateChanged(user => {
    const req = window.indexedDB.open(user.uid);
    req.onsuccess = function (e) {
      db = req.result;
      aadharNumberField = new mdc.textField.MDCTextField(document.getElementById('aadhar-number'));

      getRootRecord().then(loadAadharDetail).catch(console.error);

      const submitBtn = document.getElementById('submit-btn');
      document.getElementById('aadhar-front-upload').addEventListener('change', (evt) => {
        getImageBase64(evt).then(function (dataURL) {
          imageManager.setFront(`${dataURL}`)
        });
      })
      document.getElementById('aadhar-back-upload').addEventListener('change', (evt) => {
        getImageBase64(evt).then(function (dataURL) {
          imageManager.setBack(`${dataURL}`)
        });
      })

      document.getElementById('aadhar-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        submitBtn.classList.add('in-progress');
        if (!isPossiblyValidAadharNumber(aadharNumberField.value)) {
          setHelperInvalid(aadharNumberField, 'Enter correct AADHAR Number');
          return
        }

        requestCreator('idProof', {
          aadhar: {
            number: aadharNumberField.value,
            front: imageManager.getFront(),
            back: imageManager.getBack()
          }
        }).then(function (response) {
          console.log(response)
          const tx = db.transaction('root', 'readwrite');
          const store = tx.objectStore('root');

          store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
            const record = event.target.result;
            record.aadhar.front = response.aadhar.front;
            record.aadhar.back = response.aadhar.back;
            store.put(record);
          }
          tx.oncomplete = function () {
            setTimeout(()=>{
              snacks('Aadhar uploaded');
              window.history.back();
            },3000)
          }
        }).catch(function (err) {
          console.log(err)
          submitBtn.classList.remove('in-progress');
        });
      })
    }
  })
})

const loadAadharDetail = (rootRecord) => {
  const aadharData = rootRecord.aadhar;
  aadharNumberField.value = aadharData.number;
  imageManager.setFront(aadharData.front)
  imageManager.setBack(aadharData.back)

}



const isPossiblyValidAadharNumber = (string) => {
  return /^\d{4}\d{4}\d{4}$/.test(string)
}