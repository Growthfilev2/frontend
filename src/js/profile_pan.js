var load_front = function(event) {
    var image = document.getElementById('output_pan');
    image.src = URL.createObjectURL(event.target.files[0]);
    image.style.width="100%";
    image.style.height= "206px";
    image.style.margin="0";
    
  };

  function isPossiblyValidPan(string) {
    return /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(string)
  }

    
function pan_validation() {
  var panNumber = document.getElementById("pan_card").value;
  var alert_text = document.getElementById("alert_message");
  if (!isPossiblyValidPan(panNumber.trim())) {
    alert_text.style.display="block";
        return;
      }else{
        alert_text.style.display="none";
  }
  }
  