function validateIFSC(string) {
    return /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/.test(string)
  }

  function bank_validation() {
    var IFSCNumber = document.getElementById("ifsc_code").value;
    var alert_text = document.getElementById("alert_message");
    if (!validateIFSC(IFSCNumber.trim())) {
      alert_text.style.display="block";
        return;
      }else{
        alert_text.style.display="none";
    }}