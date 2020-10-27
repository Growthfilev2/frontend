var db;
var aadharNumberField;

var aadharImages = function aadharImages() {
  var front = document.querySelector('.aadhar-front');
  var back = document.querySelector('.aadhar-back');
  return {
    setFront: function setFront(src) {
      front.src = src;
    },
    setBack: function setBack(src) {
      back.src = src;
    },
    getFront: function getFront() {
      return front.src;
    },
    getBack: function getBack() {
      return back.src;
    }
  };
};

var imageManager = aadharImages();
window.addEventListener('load', function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function (e) {
      db = req.result;
      aadharNumberField = new mdc.textField.MDCTextField(document.getElementById('aadhar-number'));
      getRootRecord().then(loadAadharDetail)["catch"](console.error);
      var submitBtn = document.getElementById('submit-btn');
      document.getElementById('aadhar-front-upload').addEventListener('change', function (evt) {
        getImageBase64(evt).then(function (dataURL) {
          imageManager.setFront("".concat(dataURL));
        });
      });
      document.getElementById('aadhar-back-upload').addEventListener('change', function (evt) {
        getImageBase64(evt).then(function (dataURL) {
          imageManager.setBack("".concat(dataURL));
        });
      });
      document.getElementById('aadhar-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        submitBtn.classList.add('in-progress');

        if (!isPossiblyValidAadharNumber(aadharNumberField.value)) {
          setHelperInvalid(aadharNumberField, 'Enter correct AADHAR Number');
          return;
        }

        requestCreator('idProof', {
          aadhar: {
            number: aadharNumberField.value,
            front: imageManager.getFront(),
            back: imageManager.getBack()
          }
        }).then(function (response) {
          console.log(response);
          var tx = db.transaction('root', 'readwrite');
          var store = tx.objectStore('root');

          store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
            var record = event.target.result;
            record.aadhar.front = response.aadhar.front;
            record.aadhar.back = response.aadhar.back;
            record.aadhar.number = response.aadhar.number;
            store.put(record);
          };

          tx.oncomplete = function () {
            snacks('Aadhar uploaded');
            setTimeout(function () {
              window.history.back();
            }, 3000);
          };
        })["catch"](function (err) {
          console.log(err);
          submitBtn.classList.remove('in-progress');
        });
      });
    };
  });
});

var loadAadharDetail = function loadAadharDetail(rootRecord) {
  var aadharData = rootRecord.aadhar;
  aadharNumberField.value = aadharData ? aadharData.number : '';

  if (aadharData && aadharData.front) {
    imageManager.setFront(aadharData.front);
  }

  if (aadharData && aadharData.back) {
    imageManager.setBack(aadharData.back);
  }
};

var isPossiblyValidAadharNumber = function isPossiblyValidAadharNumber(string) {
  return /^\d{4}\d{4}\d{4}$/.test(string);
};