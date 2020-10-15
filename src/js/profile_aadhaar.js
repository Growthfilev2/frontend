var load_front = function(event) {
    var image_front = document.getElementById('output_front');
    image_front.src = URL.createObjectURL(event.target.files[0]);
    image_front.style.width="100%";
    image_front.style.height= "206px";
    image_front.style.margin="0";
  };

  var load_back = function(event) {
    var image_back = document.getElementById('output_back');
    image_back.src = URL.createObjectURL(event.target.files[0]);
    image_back.style.width="100%";
    image_back.style.height= "206px";
    image_back.style.margin="0";
  };

  function isPossiblyValidAadharNumber(string) {
    return /^\d{4}\d{4}\d{4}$/.test(string)
  }
  
function aadhaar_validation() {
      var aadharNumber = document.getElementById("aadhaar_number").value;
      var alert_text = document.getElementById("alert_message");
      if (!isPossiblyValidAadharNumber(aadharNumber.trim())) {
        alert_text.style.display="block";
        return;
      }else{
        alert_text.style.display="none";
      }}
