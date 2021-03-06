var db;
var panNumberField;
window.addEventListener('load', function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function (e) {
      db = req.result;
      panNumberField = new mdc.textField.MDCTextField(document.getElementById('pan-number'));
      getRootRecord().then(loadPanDetail)["catch"](console.error);
      var submitBtn = document.getElementById('submit-btn');
      document.getElementById('pan-upload').addEventListener('change', function (evt) {
        getImageBase64(evt).then(function (dataURL) {
          loadImage("".concat(dataURL));
        });
      });
      document.getElementById('pan-form').addEventListener('submit', function (ev) {
        ev.preventDefault();

        if (!isPossiblyValidPan(panNumberField.value)) {
          setHelperInvalid(panNumberField, 'Enter correct PAN Number');
          return;
        }

        submitBtn.classList.add('in-progress');
        requestCreator('idProof', {
          pan: {
            number: panNumberField.value,
            front: document.querySelector('.upload-image').src
          }
        }).then(function (response) {
          console.log(response);
          var tx = db.transaction('root', 'readwrite');
          var store = tx.objectStore('root');

          store.get(firebase.auth().currentUser.uid).onsuccess = function (event) {
            var record = event.target.result;
            var panRecord = record.pan || {};

            try {
              panRecord.front = response.pan.front;
              panRecord.number = response.pan.number;
              record.pan = panRecord;
              store.put(record);
            } catch (e) {
              handleError({
                message: 'Pan response',
                body: JSON.stringify(response)
              });
            }
          };

          tx.oncomplete = function () {
            snacks('PAN uploaded');
            setTimeout(function () {
              window.history.back();
            }, 3000);
          };
        })["catch"](function (err) {
          submitBtn.classList.remove('in-progress');
        });
      });
    };
  });
});

var loadPanDetail = function loadPanDetail(rootRecord) {
  var panData = rootRecord.pan;
  panNumberField.value = panData ? panData.number : '';

  if (panData && panData.front) {
    loadImage(panData.front);
  }
};

var loadImage = function loadImage(src) {
  document.querySelector('.upload-image').src = src;
};

var isPossiblyValidPan = function isPossiblyValidPan(string) {
  return /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(string);
};