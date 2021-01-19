/**
 * 1) don't mix es6 and es5
 * 2) what is the use of getParameterByName() ?
 * 3) unnecessary try catch block  in const response func
 * 4) try to minimize use of else block . 
 * 5) Wherever you creating large html strings, decouple html string creation from logic . Instead put the html creation logic in a seperate  function.
 *  instead of doing like this: 
 *   const  show() {
 *      const value = 'Hello World!'
 *      document.geElementById("show").innerHTML = `<........> large html string with ${value} <........>`
 *      document.geElementById("view").addEventListener('click,()=>{...})
 *      ... rest of the code
 *   }
 *  do it like this:
 *  
 *  const createShowView(value) => {
 *    return `<........>$large html string with {value}<........>`
 *  }
 *  const  show() { 
 *      document.geElementById("show").innerHTML = createShowView('Hello World!')
 *      document.geElementById("view").addEventListener('click,()=>{...})
 *      ... rest of the code
 *  }
 *   
 *  6) too much code repetition
 *  7) no use of jquery
 *  
 *   
*/


const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get("id");
console.log(myParam);
let resolveFirstImages = "";
let photo = [];


function getImage(base64) {
  resolveFirstImages = base64;
  photo.push(resolveFirstImages);
}
const reloadPage = (token, latitude, longitude) => {
  if (window.AndroidInterface && window.AndroidInterface.loadQRPage) {
    AndroidInterface.loadQRPage(
      token,
      latitude,
      longitude,
      window.location.href
    );
    return;
  }
  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.openPage
  ) {
    window.webkit.messageHandlers.openPage.postMessage({
      token,
      latitude,
      longitude,
      url: window.location.href,
    });
    return;
  }
  window.location.reload();
};
function getParameterByName(name, url = localStorage.getItem("url")) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const token = getParameterByName("token");
const longitudeParam = getParameterByName("longitude");
const latitudeParam = getParameterByName("latitude");
const checklist = getParameterByName("checklist");
const response = async () => {
  try {
    console.log(localStorage.getItem("url"));

    console.log(checklist);
    const my = "1lcMdXKDI2rKz0AMTGhl";
    var raw = undefined;

    var requestOptions = {
      method: "GET",
      body: raw,
      redirect: "follow",
    };
    const result = await fetch(
      `https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan?qrId=${my}`,
      requestOptions
    );
    let response = await result.json();

    console.log(response);
    const video = response.demoVideoUrl.split("/").pop();

    /**
     * Instead of doing this create the iframe element in html only without src and make it hidden by default
     * When you get the video url, set the src of the iframe to the video 
     *  const iframeVideo = document.getElementById("iframeVideo");
     *  if (response.demoVideoUrl) {
     *      iframeVideo.classList.remove('hidden')
     *      iframeVideo.src = 'https://www.youtube.com/embed/${video}'
     *  }
     */
    const iframeVideo = document.getElementById("iframeVideo");
    if (response.demoVideoUrl !== undefined && response.demoVideoUrl !== "") {
    
      iframeVideo.innerHTML = `  <iframe
      width="500"
      height="315"
      src="https://www.youtube.com/embed/${video}"
      frameborder="0"
      allowfullscreen

    ></iframe>`;
    } else {
      iframeVideo.style.display = "none";
    }

    document.getElementById("location").innerHTML = response.location;
    document.getElementById("property").innerHTML = response.property;
    if (response.verifyLocation === true) {
      const locationApprove = document.getElementById("locationApprove");
      locationApprove.innerHTML = `<span class="material-icons"id="reject" style="color:#219653">
          check_circle
          </span>`;
    } else {
      const locationReject = document.getElementById("locationReject");
      locationReject.innerHTML = `<span class="material-icons" id="reject"style="color:red;">
          error
          </span>`;
    }

    /** no need to check for both "" && undefined since both are false values
     *  simple check like:
     *  if(response.section) {
     *  }
     *  else {
     *  }
     * 
     *  
     */
    if (response.section !== "" && response.section !== undefined) {
      const section = document.getElementById("section");
      section.innerText = `${response.section}`;
    } else {
      const sectionDetail = document.getElementById("sectionDetail");
      sectionDetail.style.display = "none";
    }
    if (response.floor !== "" && response.floor !== undefined) {
      const floor = document.getElementById("floor");
      floor.innerText = `${response.floor}`;
      document.getElementById("locationSection").style.marginTop = "-15px";
    } else {
      const floor = document.getElementById("floorDetail");
      floor.style.display = "none";
      document.getElementById("locationSection").style.marginTop = "-31px";
    }

    /**
     * if(response.radioButton.length) will also be true , no need to check if length > 0 
     * since 0 is also a false value in if condition
     */
    // if (checklist === null || (checklist !== null && checklist === "false")) {
    const radioIdArray = [];
    if (response.radioButton.length > 0) {
      const step2 = document.getElementById("step2");
      step2.style.display = "block";
      const radioButton = document.getElementById("radioButton");
      response.radioButton.forEach((doc) => {
        const radioDiv = document.createElement("div");
        radioDiv.classList.add("question");
        radioDiv.innerHTML = `
                
                <div class="mdc-layout-grid">
                <p style="text-align:left;color:#333">${doc}</p>
                <div class="mdc-layout-grid__inner">
                
                <div class="mdc-layout-grid__cell--span-2-phone">
                    <input type="radio" id="${doc}no" name="${doc}no" value="yes">
          <label for="${doc}" style="color:#333">Yes</label>
          </div>
          <div class="mdc-layout-grid__cell--span-2-phone">
          <input type="radio" id="${doc}no" name="${doc}no" value="no"class="no>
          <label for="${doc}"style="color:#333">No</label><br>
          </div>
                    </div>
                    </div>
                `;
        radioButton.appendChild(radioDiv);
        radioIdArray.push(`${doc}no`);
      });
    } else {
      console.log("no radioButton Ui");
      const step2 = document.getElementById("step2");
      step2.style.display = "none";
      const card2 = document.getElementById("card2");
      card2.style.display = "none";
      const card3 = document.getElementById("card3");
      card3.style.marginTop = "-25px";
    }
    const textFieldId = [];
    if (response.textField.length > 0) {
      const textField = document.getElementById("textField");
      const three = document.getElementById("three");
      three.style.display = "block";
      response.textField.forEach((doc) => {
        const divTextField = document.createElement("div");
        divTextField.innerHTML = `<label class="mdc-text-field mdc-text-field--filled mdc-text-field--no-label inline mdc-text-field--invalid" style="width:100%;margin-top:10px;background-color:#fff;border-bottom:1px solid #333">
          <input type="${doc.type}" class="mdc-text-field__input textField" aria-labelledby="my-label-id" id="${doc.label}" placeholder="${doc.label}" required="true">
          <span class="mdc-notched-outline mdc-notched-outline--no-label">
                     
                      
                      </span>
                      
        </label>
        `;

        textField.appendChild(divTextField);
        textFieldId.push(doc.label);
      });
    } else {
      const three = document.getElementById("three");
      three.style.display = "none";
      console.log("no text field");
      const card3 = document.getElementById("card3");
      card3.style.display = "none";
      const card4 = document.getElementById("card4");
      card4.style.marginTop = "-25px";
    }
    const selectArray = [];
    if (response.select.length > 0) {
      console.log("select available");
      const selectField = document.getElementById("selctField");
      response.select.forEach((doc) => {
        console.log(doc.question);
        const selectDiv = document.createElement("div");
        const p = document.createElement("p");
        p.id = "selctedFieldQuestion";
        p.innerHTML = `${doc.question}`;
        selectDiv.innerHTML = `<select name ="issue" id ="${doc.question}"  style="width: 100%; height: 40px; padding: 2px;border:0px;border-bottom:1px solid #000;background-color:#fff">
          </select>`;
        selectField.appendChild(p);
        selectField.appendChild(selectDiv);
        selectArray.push(doc.question);
        const selectFields = document.getElementById(doc.question);
        doc.selectField.forEach((doc) => {
          console.log(doc);
          selectFields.innerHTML += `<option value='${doc}' id=${doc} style="color:#333">${doc}</option>`;
        });
      });
    } else {
      console.log("no select option");
      const card4 = document.getElementById("card4");
      card4.style.display = "none";
    }
    const toggleResponse = [];

    if (response.toggle.length > 0) {
      const toggleDiv = document.getElementById("toggle");
      response.toggle.forEach((doc) => {
        console.log(doc);
        const switchDiv = document.createElement("div");
        switchDiv.innerHTML = ` <label for="${doc.question}">${doc.question}</label>
        <div class="mdc-switch" style="float: right">
          <div class="mdc-switch__track"></div>
          <div class="mdc-switch__thumb-underlay">
            <div class="mdc-switch__thumb"></div>
            <input
              type="checkbox"
              id="${doc.question}"
              class="mdc-switch__native-control"
              role="switch"
              aria-checked="false"
            />
          </div>
        </div>`;

        toggleDiv.appendChild(document.createElement("br"));
        toggleDiv.appendChild(switchDiv);
        toggleResponse.push(doc.question);
      });
      [].slice
        .call(document.querySelectorAll(".mdc-switch"))
        .forEach(function (ele) {
          mdc.switchControl.MDCSwitch.attachTo(ele);
        });
    } else {
      document.getElementById("card5").style.display = "none";
    }
    // document.getElementById("locationVerification").innerHTML =
    //   response.verifyLocation;

    const toggleResponseArray = [];
    if (toggleResponse.length > 0) {
      toggleResponse.forEach((doc) => {
        const docs = document.getElementById(doc);
        console.log(docs);
        docs.addEventListener("click", () => {
          const responseToggle = {
            question: doc,
            response: docs.checked,
          };
          console.log(responseToggle);
          toggleResponseArray.push(responseToggle);
        });
      });
    } else {
      console.log("no toggle");
    }

    const checkboxList = response.checkbox;

    if (checkboxList.length > 0) {
      const checkboxArray = [];
      checkboxList.forEach((checkboxes) => {
        const checklist = document.getElementById("checklist");
        checklist.style.display = "inline-block";
        checklist.style.alignItems = "center";
        checklist.style.flexDirection = "row";
        const inputCheckbox = document.createElement("input");
        inputCheckbox.type = "checkbox";
        inputCheckbox.name = "checklist";
        inputCheckbox.id = checkboxes;

        let label = document.createElement("label");
        label.classList.add("checkboxLabel");
        label.style.paddingLeft = "10px";

        // inputCheckbox.style.backgroundColor = "#219653 !important";

        let text = document.createTextNode(checkboxes);
        label.htmlFor = checkboxes;

        label.appendChild(text);
        checklist.appendChild(inputCheckbox);
        checklist.appendChild(label);
        checklist.appendChild(document.createElement("br"));
        checkboxArray.push(inputCheckbox.id);
      });
      console.log(checkboxArray);
      const checklistSubmitButtons = document.getElementById(
        "checklistSubmitButton"
      );
      checklistSubmitButtons.addEventListener("click", () => {
        const checklistResponse = [];
        checkboxArray.forEach((doc) => {
          const ids = document.getElementById(doc);
          if (true === ids.checked) {
            console.log("checked", doc);
            checklistResponse.push({
              type: doc,
              response: true,
            });
          } else {
            checklistResponse.push({
              type: doc,
              response: false,
            });
          }
        });
        const textFieldResponse = [];
        const text = document.getElementsByClassName("textField");
        console.log(text.id);
        console.log(textFieldId);
        textFieldId.forEach((doc) => {
          const docs = document.getElementById(doc);
          console.log(docs.value);
          if (docs.value !== "") {
            textFieldResponse.push({ textField: doc, response: docs.value });
          } else {
            textFieldResponse.push({ textField: doc, response: docs.value });
          }
        });
        const radioButtonResponse = [];
        radioIdArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            question: doc,
            response: docs.checked,
          };
          radioButtonResponse.push(response);
        });
        const selectFieldResponse = [];
        selectArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            questions: doc,
            response: docs.value,
          };
          console.log(response);
          selectFieldResponse.push(response);
        });
        console.log(checklistResponse);
        console.log(textFieldResponse);
        console.log(radioButtonResponse);

        // let myHeaders = new Headers();
        // myHeaders.append("Content-Type", "application/json");
        let raws;
        let url = ``;
        if (
          response.bearerToken !== "" ||
          response.bearerToken !== null ||
          response.bearerToken !== undefined
        ) {
          console.log("token back");
          raws = JSON.stringify({
            checkbox: checklistResponse,
            textField: textFieldResponse,
            radioButton: radioButtonResponse,
            select: selectFieldResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: response.longitude,
            latitude: response.latitude,
            bearerToken: response.bearerToken,
            toggle: toggleResponseArray,
          });
          url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=true`;
        } else {
          console.log("queryParams");
          raws = JSON.stringify({
            toggle: toggleResponseArray,
            checkbox: checklistResponse,
            textField: textFieldResponse,
            radioButton: radioButtonResponse,
            select: selectFieldResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: longitudeParam,
            latitude: latitudeParam,
            bearerToken: token,
          });
          url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=true`;
        }
        console.log(raws);

        const requestOption = {
          method: "PUT",
          // headers: myHeaders,
          body: raws,
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            // localStorage.setItem("url", url);
            console.log(url);
            const radioButton = document.getElementById("radioButton");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = false;
            });
            console.log(result);
            document.getElementById("button").style.display = "none";
            document.getElementById("beforeCreationIssue").style.marginTop =
              "-21%";
            const textField = document.getElementById("textField");
            textField.style.display = "none";

            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
            const selectField = document.getElementById("selctField");
            selectField.style.display = "none";
            const idToken = response.bearerToken.split(" ")[1];
            document.getElementById("checklistSubmitButton").style.display =
              "none";
            // AndroidInterface.loadQRPage(
            //   idToken,
            //   String(response.latitude),
            //   String(response.longitude)
            // );
          })
          .catch((error) => {
            console.log(error);

            const radioButton = document.getElementById("radioButton");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = "";
            });
            document.getElementById("textField").style.display = "none";
            document.getElementById("selctField").style.display = "none";
            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
            document.getElementById("checklistSubmitButton").style.display =
              "none";
          });
        const checkboxDiv = document.getElementById("checkboxDiv");
        checkboxDiv.style.display = "none";
        const formSubmitResponse = document.getElementById(
          "formSubmitResponse"
        );
        formSubmitResponse.innerHTML = `<div class="image-txt-container">
            <img src="https://firebasestorage.googleapis.com/v0/b/growthfilepractice.appspot.com/o/Group%20999.svg?alt=media&token=fdd4f084-660b-47b7-b941-e7afc548ab76">
           &nbsp; &nbsp; <h2 style="font-family: Roboto;
           font-style: normal;
           font-weight: 500;
           font-size: 24px;
           line-height: 28px;
           
           /* Gray 1 */
           
           color: #333333;">
           Checklist Completed
            </h2>
          </div>`;
      });
    } else {
      const checkboxDiv = document.getElementById("checkboxDiv");
      checkboxDiv.style.display = "none";
      document.getElementById("card1").style.display = "none";
      const noCheckList = document.getElementById("noCheckList");
      // noCheckList.innerHTML = ` <h2>No Checklist Available</h2>`;
      const checklistSubmitButtons = document.getElementById(
        "checklistSubmitButton"
      );
      checklistSubmitButtons.addEventListener("click", () => {
        const checklistResponse = [];

        const textFieldResponse = [];
        const text = document.getElementsByClassName("textField");
        console.log(text.id);
        console.log(textFieldId);
        textFieldId.forEach((doc) => {
          const docs = document.getElementById(doc);
          console.log(docs.value);
          if (docs.value !== "") {
            textFieldResponse.push({ textField: doc, response: docs.value });
          } else {
            textFieldResponse.push({ textField: doc, response: docs.value });
          }
        });

        const radioButtonResponse = [];
        radioIdArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            question: doc,
            response: docs.checked,
          };
          radioButtonResponse.push(response);
        });
        const selectFieldResponse = [];
        selectArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            questions: doc,
            response: docs.value,
          };
          console.log(response);
          selectFieldResponse.push(response);
        });

        // let myHeaders = new Headers();
        // myHeaders.append("Content-Type", "application/json");
        let raws;
        let url = ``;
        if (
          response.bearerToken !== "" ||
          response.bearerToken !== null ||
          response.bearerToken !== undefined
        ) {
          console.log("token back");
          raws = JSON.stringify({
            checkbox: [],
            textField: textFieldResponse,
            radioButton: radioButtonResponse,
            select: selectFieldResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: response.longitude,
            latitude: response.latitude,
            bearerToken: response.bearerToken,
            toggle: toggleResponseArray,
          });
          url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=true`;
        } else {
          console.log("queryParams");
          raws = JSON.stringify({
            toggle: toggleResponseArray,
            checkbox: [],
            textField: textFieldResponse,
            radioButton: radioButtonResponse,
            select: selectFieldResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: longitudeParam,
            latitude: latitudeParam,
            bearerToken: token,
          });
          url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=true`;
        }
        console.log(raws);

        const requestOption = {
          method: "PUT",
          // headers: myHeaders,
          body: raws,
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            // localStorage.setItem("url", url);

            const radioButton = document.getElementById("radioButton");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = false;
            });
            console.log(result);
            document.getElementById("button").style.display = "none";
            document.getElementById("beforeCreationIssue").style.marginTop =
              "-21%";
            const textField = document.getElementById("textField");
            textField.style.display = "none";

            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
            const selectField = document.getElementById("selctField");
            selectField.style.display = "none";
            const idToken = response.bearerToken.split(" ")[1];
            document.getElementById("checklistSubmitButton").style.display =
              "none";
            // AndroidInterface.loadQRPage(
            //   idToken,
            //   String(response.latitude),
            //   String(response.longitude)
            // );
          })
          .catch((error) => {
            console.log(error);
            document.getElementById("checklistSubmitButton").style.display =
              "none";
            const radioButton = document.getElementById("radioButton");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = "";
            });
            document.getElementById("textField").style.display = "none";
            document.getElementById("selctField").style.display = "none";
            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
          });
        const checkboxDiv = document.getElementById("checkboxDiv");
        checkboxDiv.style.display = "none";
        const formSubmitResponse = document.getElementById(
          "formSubmitResponse"
        );
        formSubmitResponse.innerHTML = `<div class="image-txt-container">
            <img src="https://firebasestorage.googleapis.com/v0/b/growthfilepractice.appspot.com/o/Group%20999.svg?alt=media&token=fdd4f084-660b-47b7-b941-e7afc548ab76">
           &nbsp; &nbsp; <h2 style="font-family: Roboto;
           font-style: normal;
           font-weight: 500;
           font-size: 24px;
           line-height: 28px;
           
           /* Gray 1 */
           
           color: #333333;">
           Checklist Completed
            </h2>
          </div>`;
      });
    }
    // } else {
    //   console.log("no checklist will be shown");
    //   const checkbox = document.getElementById("checkbox");
    //   checkbox.style.display = "none";
    // }

    const pendingIssue = response.pendingIssue;
    const issueType = response.issueTypes;

    // filter button dialog
    const issueCardMainDiv = document.getElementById("issueFilter");
    const filterDialog = document.getElementById("filterDialog");
    dialogPolyfill.registerDialog(filterDialog);
    const filterDialogButton = document.getElementById("show-filter-dialog");
    const dialogClose = document.getElementById("dialogClose");
    const filterArray = [];
    if (issueType.length > 0) {
      issueType.forEach((doc) => {
        const divCol = document.createElement("div");
        divCol.classList.add("mdc-layout-grid__cell--span-2-phone");
        const divCard = document.createElement("div");
        divCard.classList.add("mdc-card");
        divCard.classList.add("actives");
        divCard.id = `${doc.type}1`;
        // <img src ="${doc.icon}" ></img>
        divCard.innerHTML = `<p style="display:block;margin:25px auto;font-size:35px">${doc.icon}</p>
            <h3 style="text-align:center;font-size:15px">${doc.type}</h3>`;
        divCol.appendChild(divCard);
        issueCardMainDiv.appendChild(divCol);
        filterArray.push(divCard.id);
      });
    } else {
      const beforeCreationIssue = document.getElementById(
        "beforeCreationIssue"
      );
      beforeCreationIssue.style.display = "none";
    }
    const pendingIssueApplyButton = document.getElementById(
      "pendingIssueApplyButton"
    );
    filterArray.forEach((id) => {
      console.log(id);
      const type = document.getElementById(id);
      type.addEventListener("click", () => {
        console.log("id is clicked", id);
        const t = document.getElementById(id);
        const activeFilter = document.querySelector(".filter-active");
        if (activeFilter) {
          activeFilter.classList.remove("filter-active");
        }
        t.classList.add("filter-active");
        filterPendingIssues(id);
      });
    });
    function filterPendingIssues(id) {
      const firstPendingIssueCard = document.getElementById(
        "firstPendingIssueCard"
      );
      const showMoreCard = document.getElementById("show-more-card");
      const filteredIssue = document.getElementById("filteredIssue");
      const filterIssueSection = document.getElementById("filterIssueSection");
      const filteredUl = document.getElementById("filteredUl");
      console.log(filteredUl);
      showMoreCard.style.display = "none";
      firstPendingIssueCard.style.display = "none";
      console.log(`${id.slice(0, -1)}`);
      pendingIssueApplyButton.addEventListener("click", () => {
        filteredIssue.style.display = "block";
        console.log(id);
        console.log(document.getElementById(id));
        document
          .querySelector(".filter-active")
          .setAttribute(
            "style",
            "background-color: white !important;color: #333 !important"
          );

        filterDialog.close();

        const pendingIssue = response.pendingIssue.filter((obj) => {
          return obj.issueType === id.slice(0, -1);
        });

        const afterFilterResolveCheckArray = [];
        const afterFilterDetailArray = [];
        filteredUl.innerHTML = "";
        if (pendingIssue.length > 0) {
          const nofound = document.getElementById("noFound");
          nofound.style.display = "none";
          console.log(pendingIssue);
          pendingIssue.forEach((issue) => {
            console.log(issue);
            li = document.createElement("li");

            li.classList.add("mdc-ripple-upgraded");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.paddingLeft = "16px";
            li.style.paddingRight = "16px";
            li.tabIndex = "-1";
            li.innerHTML = `
            <span class="mdc-list-item__graphic" role="presentation">
            <span style="font-size:35px">${issue.icon}</span>

              <br />
            </span>
            <span class="mdc-list-item__text">
              <span
                class="mdc-list-item__primary-text"
                id="issueCreationHeading"
              >${issue.issueType}</span>
              <span class="mdc-list-item__secondary-text"
                >${issue.comment}</span
              >
            
              <span class="mdc-list-item__secondary-text"
              id="${issue.issueId}DetailFilterIssue"
              >More Details</span
            >
            </span>
            <p
            
                class="mdc-list-item__meta material-icons"
                aria-label="View more information"
                title="More info"
                tabindex="-1"
                style="text-decoration: none"
                id="${issue.issueId}Filter"
              >
              check_circle_outline
              </p>
              <br>
              

        `;
            console.log(filteredUl);
            afterFilterResolveCheckArray.push(`${issue.issueId}Filter`);
            afterFilterDetailArray.push(`${issue.issueId}DetailFilterIssue`);
            filteredUl.appendChild(li);
            filteredUl.appendChild(document.createElement("hr"));
          });
        } else {
          const noPendingIssue = document.getElementById("noPendingIssue");
          noPendingIssue.style.display = "none";
          const nofound = document.getElementById("noFound");
          nofound.style.textAlign = "center";
          nofound.style.height = "50px";
          nofound.textContent = "No issue found";

          filteredIssue.appendChild(noFound);
        }
        const afterFilterResolveCheck = document.getElementById(
          "afterFilterResolveCheck"
        );
        const showFilterDetails = document.getElementById("showFilterDetails");
        afterFilterDetailArray.forEach((doc) => {
          let obj = response.pendingIssue.find(
            (o) => o.issueId === doc.replace("DetailFilterIssue", "")
          );
          console.log(obj);
          const details = document.getElementById(doc);

          const detailsDialogFilter = document.createElement("dialog");
          detailsDialogFilter.classList.add("mdl-dialog");
          detailsDialogFilter.id = doc;
          console.log(detailsDialogFilter);
          if (obj.photo[0] !== "") {
            detailsDialogFilter.innerHTML = `<h4 class="mdl-dialog__title">
          <span
          class="material-icons"
          style="float: right"
          id="${doc}close">
          cancel
        </span>
  </h4>
  <div class="mdl-dialog__content">
                <section class="hero">
                  <ul
                    class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                    aria-orientation="vertical"
                  >
                    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                      <span class="mdc-list-item__graphic" role="presentation">
                      <p style="font-size:35px;text-align:center">${
                        obj.icon
                      }</p>
      
                        <br />
                      </span>
                      <span class="mdc-list-item__text"style="margin-top:9px">
                        <span
                          class="mdc-list-item__primary-text"
                          id="firstIssueHeadingResolve"
                        >${obj.issueType}</span>
                        <span
                          class="mdc-list-item__secondary-text"
                          id="firstIssueContentResolve"
                        >${obj.comment}</span>
                      </span>
                    </li>
                  </ul>
                </section>
                <div style="margin-top:-20px">
                <p style="margin-top:-14px">Created on <span id="">${new Date(
                  obj.timestamp
                ).toDateString()}</span></p>
                <p>By ${obj.displayName}<span >
                <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
               <img src="data:image/png;base64,${
                 obj.photo[0]
               }"style="width:80px;height:80px;"/>
                </div>
                </div>
                </div>`;
          } else {
            detailsDialogFilter.innerHTML = `<h4 class="mdl-dialog__title">
            <span
            class="material-icons"
            style="float: right"
            id="${doc}close">
            cancel
          </span>
    </h4>
    <div class="mdl-dialog__content">
                  <section class="hero">
                    <ul
                      class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                      aria-orientation="vertical"
                    >
                      <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                        <span class="mdc-list-item__graphic" role="presentation">
                        <p style="font-size:35px;text-align:center">${
                          obj.icon
                        }</p>
        
                          <br />
                        </span>
                        <span class="mdc-list-item__text"style="margin-top:9px">
                          <span
                            class="mdc-list-item__primary-text"
                            id="firstIssueHeadingResolve"
                          >${obj.issueType}</span>
                          <span
                            class="mdc-list-item__secondary-text"
                            id="firstIssueContentResolve"
                          >${obj.comment}</span>
                        </span>
                      </li>
                    </ul>
                  </section>
                  <p style="margin-top:-14px">Created on <span id="">${new Date(
                    obj.timestamp
                  ).toDateString()}</span></p>
                  <p>By ${obj.displayName}<span >
                  <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
                
                  </div>
                  </div>`;
          }
          showFilterDetails.appendChild(detailsDialogFilter);
          console.log(showFilterDetails);
          console.log(detailsDialogFilter.id);

          details.addEventListener("click", () => {
            console.log("more details filter");
            dialogPolyfill.registerDialog(detailsDialogFilter);
            const detailDialogClose = document.getElementById(`${doc}close`);
            detailDialogClose.addEventListener("click", () => {
              detailsDialogFilter.close();
            });
            detailsDialogFilter.showModal();
          });

          // details.addEventListener("click", () => {
          //   console.log("show more");

          //   detailsDialogFilter.showModal();
          // });
        });
        afterFilterResolveCheckArray.forEach((doc) => {
          const check = document.getElementById(doc);

          check.addEventListener("click", () => {
            const issues = doc.replace("Filter", "");
            console.log(issues);
            showFilterIssueResolve(response, issues, doc);
          });
        });
      });
    }

    filterDialogButton.addEventListener("click", () => {
      filterDialog.showModal();
    });
    dialogClose.addEventListener("click", () => {
      filterDialog.close();
    });
    //   firstPendingIssueCard
    if (pendingIssue.length > 0) {
      const firstPendingIssue = pendingIssue[0];
      console.log(firstPendingIssue);
      const firstPendingIssueCard = document.getElementById(
        "firstPendingIssueCard"
      );
      firstPendingIssueCard.innerHTML = `<section class="hero">
        <ul
          class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
          aria-orientation="vertical"
        >
          <li class=" mdc-ripple-upgraded" tabindex="-1" style="  display: flex;
          align-items: center;
          padding-left: 16px;
          padding-right: 16px;">
            <span class="mdc-list-item__graphic" role="presentation">
            <p style="display:block;margin:25px auto;font-size:50px">${firstPendingIssue.icon}</p>
            
  
              <br />
            </span>
            <span class="mdc-list-item__text">
              <span
                class="mdc-list-item__primary-text"
                id="firstIssueHeading"
              ></span>
              <span
                class="mdc-list-item__secondary-text"
                id="firstIssueContent"
              ></span>
              <span
                class="mdc-list-item__secondary-text"
                id="moreDetails"
              >More Details</span>
            </span>
            <a
              class="mdc-list-item__meta material-icons"
              aria-label="View more information"
              title="More info"
              tabindex="-1"
              style="text-decoration: none"
              id="firstPendingIssueResolve"
            >
              check_circle_outline
            </a>
          </li>
          <hr />
        </ul>
      </section>
  
      <p style="text-align: center; margin-top: 0">
        <button class="mdc-button" id="showPendingIssue">
          <div class="mdc-button__ripple"></div>
  
          <span class="mdc-button__label" style="color: black"
            >Show More</span
          >
          <i
            class="material-icons mdc-button__icon"
            aria-hidden="true"
            style="color: black"
            >keyboard_arrow_down</i
          >
        </button>
      </p>`;

      const firstIssueHeading = document.getElementById("firstIssueHeading");
      const firstIssueContent = document.getElementById("firstIssueContent");
      firstIssueHeading.innerHTML = firstPendingIssue.issueType;
      firstIssueContent.innerHTML = firstPendingIssue.comment;
      const moreDetails = document.getElementById("moreDetails");
      console.log(moreDetails);
      const showFirstIssueDetails = document.getElementById(
        "showFirstIssueDetails"
      );
      const detailsDialogFilter = document.createElement("dialog");
      detailsDialogFilter.classList.add("mdl-dialog");
      detailsDialogFilter.id = firstPendingIssue.issueId;
      if (firstPendingIssue.photo[0] !== "") {
        detailsDialogFilter.innerHTML = `<h4 class="mdl-dialog__title">
          <span
          class="material-icons"
          style="float: right"
          id="${firstPendingIssue.issueId}closeFirstIssue">
          cancel
        </span>
  </h4>
  <div class="mdl-dialog__content">
                <section class="hero">
                  <ul
                    class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                    aria-orientation="vertical"
                  >
                    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                      <span class="mdc-list-item__graphic" role="presentation">
                      <p style="font-size:35px;text-align:center">${
                        firstPendingIssue.icon
                      }</p>
      
                        <br />
                      </span>
                      <span class="mdc-list-item__text"style="margin-top:9px">
                        <span
                          class="mdc-list-item__primary-text"
                          id="firstIssueHeadingResolve"
                        >${firstPendingIssue.issueType}</span>
                        <span
                          class="mdc-list-item__secondary-text"
                          id="firstIssueContentResolve"
                        >${firstPendingIssue.comment}</span>
                      </span>
                    </li>
                  </ul>
                </section>
                <p style="margin-top:-14px">Created on <span id="">${new Date(
                  firstPendingIssue.timestamp
                ).toDateString()}</span></p>
                <p>By name<span >
                <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
                <img src="data:image/png;base64,${
                  firstPendingIssue.photo[0]
                }"style="width:80px;height:80px;"/>
                </div>
                </div>`;
      } else {
        detailsDialogFilter.innerHTML = `<h4 class="mdl-dialog__title">
          <span
          class="material-icons"
          style="float: right"
          id="${firstPendingIssue.issueId}closeFirstIssue">
          cancel
        </span>
  </h4>
  <div class="mdl-dialog__content">
                <section class="hero">
                  <ul
                    class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                    aria-orientation="vertical"
                  >
                    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                      <span class="mdc-list-item__graphic" role="presentation">
                      <p style="font-size:35px;text-align:center">${
                        firstPendingIssue.icon
                      }</p>
      
                        <br />
                      </span>
                      <span class="mdc-list-item__text" style="margin-top:9px">
                        <span
                          class="mdc-list-item__primary-text"
                          id="firstIssueHeadingResolve"
                        >${firstPendingIssue.issueType}</span>
                        <span
                          class="mdc-list-item__secondary-text"
                          id="firstIssueContentResolve"
                        >${firstPendingIssue.comment}</span>
                      </span>
                    </li>
                  </ul>
                </section>
                <p style="margin-top:-14px">Created on <span id="">${new Date(
                  firstPendingIssue.timestamp
                ).toDateString()}</span></p>
                <p>By name<span >
                <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
              
                </div>
                </div>`;
      }
      showFirstIssueDetails.appendChild(detailsDialogFilter);
      moreDetails.addEventListener("click", () => {
        dialogPolyfill.registerDialog(detailsDialogFilter);
        const close = document.getElementById(
          `${firstPendingIssue.issueId}closeFirstIssue`
        );
        close.addEventListener("click", () => {
          detailsDialogFilter.close();
        });
        detailsDialogFilter.showModal();
      });

      const firstPendingIssueResolve = document.getElementById(
        "firstPendingIssueResolve"
      );
      const firstIssueResolveDialog = document.getElementById(
        "firstIssueResolveDialog"
      );
      dialogPolyfill.registerDialog(firstIssueResolveDialog);
      const firstIssueHeadingResolve = document.getElementById(
        "firstIssueHeadingResolve"
      );
      const firstIssueContentResolve = document.getElementById(
        "firstIssueContentResolve"
      );
      document.getElementById("issueFirstImageResolve").innerHTML =
        firstPendingIssue.icon;
      firstIssueHeadingResolve.innerHTML = firstPendingIssue.issueType;
      firstIssueContentResolve.innerHTML = firstPendingIssue.comment;

      firstPendingIssueResolve.addEventListener("click", () => {
        console.log("issue resolve");
        firstIssueResolveDialog.showModal();
      });
      const firstPendingDialogClose = document.getElementById(
        "firstPendingDialogClose"
      );
      firstPendingDialogClose.addEventListener("click", () => {
        firstIssueResolveDialog.close();
      });
      const firstIssueResolveSubmit = document.getElementById(
        "firstIssueResolveSubmit"
      );
      const firstPendingIssueResolveCheck = document.getElementById(
        "firstPendingIssueResolve"
      );
      const remarkInput = document.getElementById("remarkInput");

      // document
      //   .getElementById("camera-button-resolve")
      //   .addEventListener("change", (evt) => {
      //     getImageBase64(evt)
      //       .then((base) => {
      //         resolveFirstImage = base;
      //       })
      //       .catch((error) => {
      //         console.log(error);
      //       });
      //   });
      document
        .getElementById("camera-button-resolve")
        .addEventListener("click", () => {
          if (
            window.webkit &&
            window.webkit.messageHandlers &&
            window.webkit.messageHandlers.openNativeCamera
          ) {
            window.webkit.messageHandlers.openNativeCamera.postMessage(
              "getImage"
            );
          }
        });

      firstIssueResolveSubmit.addEventListener("click", () => {
        // const file = imagefile.value.split("\\");
        // const fileName = file[file.length - 1];

        console.log("issue resolved logs sending logic");
        console.log(remarkInput.value);
        let issueResolveResponse;
        let url = "";
        console.log(firstPendingIssue.issueType);
        if (response.bearerToken !== null) {
          issueResolveResponse = JSON.stringify({
            issueType: firstPendingIssue.issueType,
            comment: remarkInput.value,
            issue: firstPendingIssue.comment,
            section: "issue",
            type: "resolve",
            timestamp: Date.now(),
            photo: photo,
            issueId: firstPendingIssue.issueId,
            propertyId: response.propertyId,
            longitude: response.longitude,
            latitude: response.latitude,
            qrId: response.qrId,
            location: response.location,
            geoPoint: response.geoPoint,
            property: response.property,
            bearerToken: response.bearerToken,
          });
          console.log(issueResolveResponse);
          url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=false`;
        } else {
          issueResolveResponse = JSON.stringify({
            issueType: firstPendingIssue.issueType,
            comment: remarkInput.value,
            issue: firstPendingIssue.comment,
            section: "issue",
            type: "resolve",
            timestamp: Date.now(),
            photo: photo,
            issueId: firstPendingIssue.issueId,
            propertyId: response.propertyId,
            longitude: longitudeParam,
            latitude: latitudeParam,
            qrId: response.qrId,
            location: response.location,
            geoPoint: response.geoPoint,
            property: response.property,
            bearerToken: token,
          });
          console.log(issueResolveResponse);
          url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=false`;
        }

        const requestOption = {
          method: "PUT",
          body: issueResolveResponse,
          redirect: "follow",
        };
        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            var x = new mdc.snackbar.MDCSnackbar(
              document.getElementById("snackResolve")
            );
            x.open();
            console.log(result);
            localStorage.setItem("url", url);

            resolveFirstImages = "";
            photo = "";
            const idToken = response.bearerToken.split(" ")[1];

            // reloadPage(
            //   idToken,
            //   String(response.latitude),
            //   String(response.longitude),
            //   window.location.href
            // );
          })
          .catch((error) => {
            console.log("error", error);
          });

        firstPendingIssueResolve.style.color = "#219653";
        firstIssueResolveDialog.close();
      });

      const showPendingIssueButton = document.getElementById(
        "showPendingIssue"
      );
      showPendingIssueButton.addEventListener("click", () => {
        console.log("show more button clicked");
        const firstPendingIssueCard = document.getElementById(
          "firstPendingIssueCard"
        );
        firstPendingIssueCard.style.display = "none";

        showPendingIssue(response);
      });
    } else {
      const firstPendingIssueCard = document.getElementById(
        "firstPendingIssueCard"
      );
      firstPendingIssueCard.style.display = "none";
      //
      const noPendingIssue = document.getElementById("noPendingIssue");
      noPendingIssue.innerHTML = `<h2 style="text-align:center;display:block;margin:auto;height:50px;color: #333;font-weight: 500;font-size: 18px;">No pending Issue</h2>`;
      const x = document.getElementById("afterissueCreateSection");
      x.style.display = "none";
    }
    const createAnIssue = document.getElementById("show-dialog");
    const issueDialog = document.getElementById("issueDialog");
    const issueDialogClose = document.getElementById("issueDialogClose");
    createAnIssue.addEventListener("click", () => {
      // issueDialog.setAttribute("style", "display:block ");
      dialogPolyfill.registerDialog(issueDialog);
      issueDialog.showModal();
    });
    issueDialogClose.addEventListener("click", () => {
      // issueDialog.setAttribute("style", "display:none !important");
      dialogPolyfill.registerDialog(issueDialog);
      issueDialog.close();
    });
    const issueRaiseArray = [];
    const issueraiseIcon = [];
    const issueCategory = [];
    const issueRaiseMainDiv = document.getElementById("issueRaise");
    issueType.forEach((doc) => {
      const divColIssueRaise = document.createElement("div");
      divColIssueRaise.classList.add("mdc-layout-grid__cell--span-2-phone");
      const divCardIssueRaise = document.createElement("div");
      divCardIssueRaise.classList.add("mdc-card");
      divCardIssueRaise.classList.add("issueCreate");
      divCardIssueRaise.id = `${doc.type}`;

      divCardIssueRaise.innerHTML = `<p style="display:block;margin:25px auto;font-size:35px">${doc.icon}</p>
                  <h3 style="text-align:center;font-size:15px">${doc.type}</h3>`;
      divColIssueRaise.appendChild(divCardIssueRaise);
      issueRaiseMainDiv.appendChild(divColIssueRaise);
      issueRaiseArray.push(divCardIssueRaise.id);
      issueraiseIcon.push(doc.icon);
      issueCategory.push(doc.issue);
    });
    console.log(issueRaiseArray);
    let selectedId = "";
    issueRaiseArray.forEach((ids) => {
      console.log(ids);
      const types = document.getElementById(ids);
      console.log(types);
      types.addEventListener("click", () => {
        selectedId = ids;

        const activeCard = document.querySelector(".active");
        if (activeCard) {
          activeCard.classList.remove("active");
        }
        types.classList.add("active");
      });
    });
    const issueRaiseNextButton = document.getElementById(
      "issueRaiseNextButton"
    );
    const changeArray = [];
    let imageBase64 = "";
    issueRaiseNextButton.addEventListener("click", () => {
      // issueDialog.setAttribute("style", "display:none ");
      console.log("next button is clicked with ", selectedId);
      const issueDialogCreation = document.getElementById(
        "issueDialogCreation"
      );
      dialogPolyfill.registerDialog(issueDialogCreation);
      // issueDialogCreation.setAttribute("style", "display:block");
      document.getElementById(selectedId).style.backgroundColor = "#fff";
      document.getElementById(selectedId).style.color = "#333";
      const issueCreationClose = document.getElementById("issueCreationClose");
      const issueCreationCard = document.getElementById("issueCreationCard");
      dialogPolyfill.registerDialog(issueDialog);
      issueDialog.close();
      // const issueType = response.issueTypes;
      const image = issueType.filter((doc) => {
        return doc.type === selectedId;
      });
      let changeId = "change";

      const issueCreationUl = document.getElementById("issueCreationUl");
      issueCreationUl.innerHTML = `<li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                  <span class="mdc-list-item__graphic" role="presentation">
                   
                    <p style="font-size:35px">${image[0].icon}</p>
                  </span>
                  <span class="mdc-list-item__text">
                  <span class="mdc-list-item__secondary-text"
                  >Select Category</span
                >
                    <span
                      class="mdc-list-item__primary-text"
                      id="issueCreationHeading"
                    >${selectedId}</span>
                  
                  </span>
                  <p
                      class="mdc-list-item__meta "
                      aria-label="View more information"
                      title="More info"
                      tabindex="-1"
                      style="text-decoration: none;font-size:15px"
                      id="change"
                    >
                    change
                    </p>
                    <br>
      
                </li>
                <div>
                  <div id="selectIssue">
                  
                  <label for="issue">Select Issue</label>
                  <br>
                  <select name ="issue" id ="issues"  style="width: 100%; height: 40px; padding: 2px;border:0px;border-bottom:1px solid #000;background-color:#fff">
                  </select>
                  </div>
      
                  <br/>
                  <div id="otherInput"></div>
                  <br/>
                  <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
                  <label for="camera-button">
                      <i class="material-icons" style="font-size:35px;color:#fff;text-align:center;padding-top:20px">add_a_photo</i>
                      <input   id="camera-button" style="display:none;" capture>
                  </label>
                  </div>
                </div>
                `;
      changeArray.push(`${selectedId}1`);
      console.log(changeArray);
      document.getElementById("camera-button").addEventListener("click", () => {
        if (
          window.webkit &&
          window.webkit.messageHandlers &&
          window.webkit.messageHandlers.openNativeCamera
        ) {
          window.webkit.messageHandlers.openNativeCamera.postMessage(
            "getImage"
          );
        }
        // function getImage(base64) {
        //   imageBase64 = base64;
        // }
        // getImage();
      });
      // document
      //   .getElementById("camera-button")
      //   .addEventListener("change", (ev) => {
      //     getImageBase64(ev)
      //       .then((base) => {
      //         imageBase64 = base;
      //         console.log(imageBase64);
      //       })
      //       .catch(console.error);
      //   });
      const issueTypeWithOthers = response.issueTypes;

      issueTypeWithOthers.map((doc) => {
        doc.issue.push("others");
      });

      const issueTypeId = [];
      const issue = issueTypeWithOthers.filter((doc) => {
        return doc.type === selectedId;
      });
      console.log(issue);

      const selectedArray = [];
      const selectIssueId = document.getElementById("issues");
      issue.forEach((doc) => {
        const uniqueArray = [...new Set(doc.issue)];
        uniqueArray.forEach((doc) => {
          selectIssueId.innerHTML += `<option value='${doc}' id=${doc}>${doc}</option>`;
        });
      });
      selectIssueId.addEventListener("change", (evt) => {
        console.log(selectIssueId.value);
        if (selectIssueId.value === "others") {
          const otherInput = document.getElementById("otherInput");
          otherInput.innerHTML = `   <label class="mdc-text-field mdc-text-field--filled mdc-text-field--no-label inline mdc-text-field--invalid" style="width:100%;margin-top:10px;">
            <input type="text" class="mdc-text-field__input textField" aria-labelledby="my-label-id" id="otherRemarks" placeholder="Remarks" required="">
            <span class="mdc-notched-outline mdc-notched-outline--no-label">
                       
                        
                        </span>
                        
          </label>`;
        }
      });
      const changes = document.getElementById(changeId);
      console.log(changes);
      changes.addEventListener("change", () => {
        console.log("change");
      });

      // cameraButton.addEventListener("change", (evt) => {
      //   console.log("hello");
      //   getImageBase64(evt).then(function (dataURL) {
      //     console.log(dataURL);
      //     alert(dataURL);
      //   });
      // });
      issueDialogCreation.showModal();
      issueCreationClose.addEventListener("click", () => {
        issueDialogCreation.close();
      });
    });

    // const selectIssueId = document.getElementById("issues");

    // console.log(selectIssueId.value);
    // if (selectIssueId.value === "others") {
    //   console.log("others is selected");
    // }
    let url = ``;

    /**
     * no need for let here , use const
     */
    let issueResponse;
    
    /**
     *  This could be reduced to simply:
     *  let url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitude}&checklist=false`;

     * const issueResponse = {
        longitude: longitudeParam,
        latitude: latitudeParam,
        geoPoint: response.geoPoint,
        qrId: response.qrId,
        propertyId: response.propertyId,
        property: response.property,
        bearerToken: response.bearerToken,
        location: response.location,
      };

      if(response.bearerToken) {
         issueResponse.longitude = response.longitude
         issueResponse.latitude = response.latitude
        url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=false`;
      }

     *  
     * 
     */
    if (response.bearerToken !== null) {
      issueResponse = {
        longitude: response.longitude,
        latitude: response.latitude,
        geoPoint: response.geoPoint,
        qrId: response.qrId,
        propertyId: response.propertyId,
        property: response.property,
        bearerToken: response.bearerToken,
        location: response.location,
      };
      url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=false`;
    } else {
      issueResponse = {
        longitude: longitudeParam,
        latitude: latitudeParam,
        geoPoint: response.geoPoint,
        qrId: response.qrId,
        propertyId: response.propertyId,
        property: response.property,
        bearerToken: response.bearerToken,
        location: response.location,
      };
      url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitude}&checklist=false`;
    }

    const issueSubmitButton = document.getElementById("issueSubmitButton");
    issueSubmitButton.addEventListener("click", () => {
      // issueDialogCreation.setAttribute("style", "display:none");
      console.log("logic to send the issue in the logs");
      const selectIssueId = document.getElementById("issues");
      const image = issueType.filter((doc) => {
        return doc.type === selectedId;
      });
      console.log(image[0].icon);
      if (selectIssueId.value !== "others") {
        issueResponse.type = "create";
        issueResponse.section = "issue";
        issueResponse.issueType = selectedId;
        issueResponse.comment = selectIssueId.value;
        issueResponse.photo = photo;
        issueResponse.icon = image[0].icon;

        console.log(issueResponse);
        const requestOption = {
          method: "PUT",
          // headers: myHeaders,
          body: JSON.stringify(issueResponse),
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            resolveFirstImages = "";
            photo = [];
            var x = new mdc.snackbar.MDCSnackbar(
              document.getElementById("snack")
            );
            x.open();
            localStorage.setItem("url", url);

            const idToken = response.bearerToken.split(" ")[1];

            reloadPage(
              idToken,
              String(response.latitude),
              String(response.longitude),
              window.location.href
            );
          })
          .catch((error) => {
            console.log("error", error);
          });
        issueDialogCreation.close();
      } else {
        const otherRemarks = document.getElementById("otherRemarks");
        console.log(otherRemarks.value);
        issueResponse.type = "create";
        issueResponse.section = "issue";
        issueResponse.issueType = selectedId;
        issueResponse.comment = otherRemarks.value;
        issueResponse.photo = [imageBase64];
        issueResponse.icon = image[0].icon;
        console.log(issueResponse);
        const requestOption = {
          method: "PUT",
          // headers: myHeaders,
          body: JSON.stringify(issueResponse),
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            resolveFirstImages = "";
            photo = [];
            var x = new mdc.snackbar.MDCSnackbar(
              document.getElementById("snack")
            );
            x.open();
            localStorage.setItem("url", url);
            const idToken = response.bearerToken.split(" ")[1];

            // reloadPage(
            //   idToken,
            //   String(response.latitude),
            //   String(response.longitude),
            //   window.location.href
            // );
          })
          .catch((error) => {
            console.log("error", error);
          });
        issueDialogCreation.close();
      }
    });
  } catch (error) {
    console.log(error);
  }
};
response();

async function showPendingIssue(query) {
  const showMoreSection = document.getElementById("show-more-section");
  const showMoreUl = document.getElementById("show-more");
  const pendingIssue = query.pendingIssue;
  const showMoreCard = document.getElementById("show-more-card");

  showMoreCard.style.display = "block";

  console.log(pendingIssue);
  const pendingIssueResolveArray = [];
  const pendingDetails = [];
  pendingIssue.forEach((issue) => {
    console.log(issue);
    const li = document.createElement("li");
    li.classList.add("mdc-list-item");
    li.classList.add("mdc-ripple-upgraded");

    li.innerHTML = `
                        <span class="mdc-list-item__graphic" role="presentation">
                        <span style="font-size:35px">${issue.icon}</span>
      
                          <br />
                        </span>
                        <span class="mdc-list-item__text">
                          <span
                            class="mdc-list-item__primary-text"
                            id="issueCreationHeading"
                          >${issue.issueType}</span>
                          <span class="mdc-list-item__secondary-text"
                            >${issue.comment}</span
                          >
                        
                          <span class="mdc-list-item__secondary-text"
                          id="${issue.issueId}Details"
                          >More Details</span
                        >
                        </span>
                        <p
                        
                            class="mdc-list-item__meta material-icons"
                            aria-label="View more information"
                            title="More info"
                            tabindex="-1"
                            style="text-decoration: none"
                            id="${issue.issueId}"
                          >
                          check_circle_outline
                          </p>
                          <br>
                          
      
                    `;
    pendingIssueResolveArray.push({
      issueType: issue.issueType,
      issueId: issue.issueId,
    });
    pendingDetails.push({
      issueType: issue.issueType,
      issueId: `${issue.issueId}Details`,
    });
    showMoreUl.appendChild(li);
    showMoreUl.appendChild(document.createElement("hr"));

    // pendingIssueResolveArray.push(resolveAnchor.id);
  });
  showMoreSection.appendChild(showMoreUl);
  console.log(pendingIssueResolveArray);
  const issueResolveCheck = document.getElementById("issueResolveCheck");
  const showDetails = document.getElementById("showDetails");
  pendingDetails.forEach((detail) => {
    console.log(detail);
    let obj = query.pendingIssue.find(
      (o) => o.issueId === detail.issueId.replace("Details", "")
    );
    console.log(obj);
    const details = document.getElementById(detail.issueId);
    const detailsDialog = document.createElement("dialog");
    detailsDialog.classList.add("mdl-dialog");
    detailsDialog.id = detail.issueId;
    console.log(detailsDialog);
    if (obj.photo[0] !== "") {
      detailsDialog.innerHTML = `<h4 class="mdl-dialog__title">
    <span
      class="material-icons"
      style="float: right"
      id="${detail.issueId}close"
    >
      cancel
    </span>
  </h4>
  <div class="mdl-dialog__content">
                <section class="hero">
                  <ul
                    class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                    aria-orientation="vertical"
                  >
                    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                      <span class="mdc-list-item__graphic" role="presentation">
                      <p style="font-size:35px;text-align:center">${
                        obj.icon
                      }</p>
      
                        <br />
                      </span>
                      <span class="mdc-list-item__text" style="margin-top:9px">
                        <span
                          class="mdc-list-item__primary-text"
                          id="firstIssueHeadingResolve"
                        >${obj.issueType}</span>
                        <span
                          class="mdc-list-item__secondary-text"
                          id="firstIssueContentResolve"
                        >${obj.comment}</span>
                      </span>
                    </li>
                  </ul>
                </section>
                <p style="margin-top:-14px">Created on <span id="">${new Date(
                  obj.timestamp
                ).toDateString()}</span></p>
                <p>By ${obj.displayName}</p>
                <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
                <img src="data:image/png;base64,${
                  obj.photo[0]
                }"style="width:80px;height:80px;"/>
                </div>

                </div>`;
    } else {
      detailsDialog.innerHTML = `<h4 class="mdl-dialog__title">
                <span
                  class="material-icons"
                  style="float: right"
                  id="${detail.issueId}close"
                >
                  cancel
                </span>
              </h4>
              <div class="mdl-dialog__content">
                            <section class="hero">
                              <ul
                                class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                                aria-orientation="vertical"
                              >
                                <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                                  <span class="mdc-list-item__graphic" role="presentation">
                                  <p style="font-size:35px;text-align:center">${
                                    obj.icon
                                  }</p>
                  
                                    <br />
                                  </span>
                                  <span class="mdc-list-item__text" style="margin-top:9px">
                                    <span
                                      class="mdc-list-item__primary-text"
                                      id="firstIssueHeadingResolve"
                                    >${obj.issueType}</span>
                                    <span
                                      class="mdc-list-item__secondary-text"
                                      id="firstIssueContentResolve"
                                    >${obj.comment}</span>
                                  </span>
                                </li>
                              </ul>
                            </section>
                            <p style="margin-top:-14px">Created on <span id="">${new Date(
                              obj.timestamp
                            ).toDateString()}</span></p>
                            <p>By ${obj.displayName}</p>
                            <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
                            <img src="data:image/png;base64,${
                              obj.photo[0]
                            }"style="width:80px;height:80px;"/>
                            </div>
            
                            </div>`;
    }
    showDetails.appendChild(detailsDialog);
    details.addEventListener("click", () => {
      const detailDialogClose = document.getElementById(
        `${detail.issueId}close`
      );

      dialogPolyfill.registerDialog(detailsDialog);
      detailDialogClose.addEventListener("click", () => {
        detailsDialog.close();
      });

      detailsDialog.showModal();
    });
  });
  pendingIssueResolveArray.forEach((ids) => {
    console.log(ids);
    let obj = query.pendingIssue.find((o) => o.issueId === ids.issueId);
    console.log(obj);
    const Resolve = document.getElementById(ids.issueId);

    const issueresolveDialog = document.createElement("dialog");
    issueresolveDialog.classList.add("mdl-dialog");
    issueresolveDialog.id = ids.issueId;
    console.log(issueresolveDialog);
    issueresolveDialog.innerHTML = `<h4 class="mdl-dialog__title">
                <button class="mdc-button" disabled>
                  <div class="mdc-button__ripple"></div>
                  <i
                    class="material-icons mdc-button__icon"
                    aria-hidden="true"
                    style="color: #219653"
                    >check_circle_outline</i
                  >
                  <span class="mdc-button__label" style="color: #000"
                    >Issue Resolved</span
                  >
                </button>
                <span
                  class="material-icons"
                  style="float: right"
                  id="${ids.issueId}close"
                >
                  cancel
                </span>
              </h4>
              <div class="mdl-dialog__content">
                <section class="hero">
                  <ul
                    class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                    aria-orientation="vertical"
                  >
                    <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                      <span class="mdc-list-item__graphic" role="presentation">
                      <p style="font-size:35px">${obj.icon}</p>
      
                        <br />
                      </span>
                      <span class="mdc-list-item__text">
                        <span
                          class="mdc-list-item__primary-text"
                          id="firstIssueHeadingResolve"
                        >${obj.issueType}</span>
                        <span
                          class="mdc-list-item__secondary-text"
                          id="firstIssueContentResolve"
                        >${obj.comment}</span>
                      </span>
                    </li>
                  </ul>
                </section>
                <p>Remarks</p>
                <label class="mdc-text-field mdc-text-field--filled" style="width:100% ">
                  <span class="mdc-text-field__ripple"></span>
                  <input
                    class="mdc-text-field__input"
                    type="text"
                    aria-labelledby="my-label-id"
                   
                    id="${ids.issueId}1111"
                  />
                  <span class="mdc-line-ripple"></span>
                </label>
              <br>
              <br>
              <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
              <label for="${ids.issueId}camera-button-issue-resolve">
                  <i class="material-icons" style="font-size:35px;color:#fff;text-align:center;padding-top:20px">add_a_photo</i>
                  <input   id="${ids.issueId}camera-button-issue-resolve" style="display:none;" capture>
              </label>
              </div>
            
       
              </div>
              <div class="mdl-dialog__actions">
                <p style="text-align: center">
                  <button
                    class="mdc-button what-we-do-button resolve-button"
                    style="
                      background-color: #184466;
                      color: #f2f2f2;
                      font-weight: bold;
                      font-size: 24px;
                      line-height: 28px;
                      text-transform: uppercase;
                      width: 320px;
                      height: 50px;
      
                      margin-top: 5%;
                      border: 1px solid #184466;
                    "
                   id ="${ids.issueId}111"
                  >
                    <div class="mdc-button__ripple"></div>
                    <span
                      class="mdc-button__label"
                      style="
                        margin: 5px 2px;
                        font-weight: 700;
                        font-family: Roboto !important;
                      "
                      >SUBMIT</span
                    >
                  </button>
                </p>
              </div>`;

    issueResolveCheck.appendChild(issueresolveDialog);
    // const camera = document.getElementById("camera");
    // camera.addEventListener("click", () => {
    //   console.log("camera is clicked");
    //   const input = document.createElement("INPUT");
    //   input.type = "file";
    //   camera.appendChild(input);
    // });
    Resolve.addEventListener("click", () => {
      console.log("click to resolve");
      const issueResolveCheck = document.getElementById("issueResolveCheck");
      const PendingDialogClose = document.getElementById(`${ids.issueId}close`);
      console.log(PendingDialogClose);
      const pendingIssueResolve = document.getElementById(`${ids.issueId}111`);
      console.log(pendingIssueResolve);
      let resolveFirstImage = "";
      // document
      //   .getElementById("camera-button-issue-resolve")
      //   .addEventListener("change", (evt) => {
      //     getImageBase64(evt)
      //       .then((base) => {
      //         resolveFirstImage = base;
      //       })
      //       .catch((error) => {
      //         console.log(error);
      //       });
      //   });
      document
        .getElementById(`${ids.issueId}camera-button-issue-resolve`)
        .addEventListener("click", () => {
          if (
            window.webkit &&
            window.webkit.messageHandlers &&
            window.webkit.messageHandlers.openNativeCamera
          ) {
            window.webkit.messageHandlers.openNativeCamera.postMessage(
              "getImage"
            );
          }
          // function getImage(base64) {
          //   resolveFirstImage = base64;
          // }
          // getImage();
        });
      pendingIssueResolve.addEventListener("click", () => {
        console.log("xyz");
        console.log(`${ids.issueId}1111`);

        const issueResolveRemarks = document.getElementById(
          `${ids.issueId}1111`
        );
        console.log(issueResolveRemarks);
        let url = "";
        let issueResolve;
        /**
         * Same here as well , try to minimize use of else block
         */
        if (query.bearerToken !== null) {
          issueResolve = JSON.stringify({
            issueType: obj.issueType,
            section: "issue",
            type: "resolve",
            comment: issueResolveRemarks.value || "",
            qrId: query.qrId,
            propertyId: query.propertyId,
            longitude: query.longitude,
            latitude: query.latitude,
            bearerToken: query.bearerToken,
            issueId: obj.issueId,
            qrId: query.qrId,
            location: query.location,
            geoPoint: query.geoPoint,
            property: query.property,
            photo: photo,
          });
          console.log(issueResolve);
          url = `https://growthfile.com/qr?token=${query.bearerToken}&longitude=${query.longitude}&latitude=${query.latitude}&checklist=false`;
        } else {
          issueResolve = JSON.stringify({
            issueType: obj.issueType,
            section: "issue",
            type: "resolve",
            comment: issueResolveRemarks.value || "",
            qrId: query.qrId,
            propertyId: query.propertyId,
            longitude: longitudeParam,
            latitude: latitudeParam,
            bearerToken: token,
            issueId: obj.issueId,
            qrId: query.qrId,
            location: query.location,
            geoPoint: query.geoPoint,
            property: query.property,
            photo: photo,
          });
          console.log(issueResolve);
          url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=false`;
        }

        const requestOption = {
          method: "PUT",
          body: issueResolve,
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            resolveFirstImages = "";
            photo = [];
            console.log(result);
            var x = new mdc.snackbar.MDCSnackbar(
              document.getElementById("snackResolve")
            );
            x.open();
            localStorage.setItem("url", url);
            const idToken = query.bearerToken.split(" ")[1];

            reloadPage(
              idToken,
              String(query.latitude),
              String(query.longitude),
              window.location.href
            );
          })
          .catch((error) => {
            console.log("error", error);
          });
        issueresolveDialog.close();
        Resolve.style.color = "#219653";
      });
      dialogPolyfill.registerDialog(issueresolveDialog);
      issueresolveDialog.showModal();

      PendingDialogClose.addEventListener("click", () => {
        console.log("close ");
        issueresolveDialog.close();
      });
      const pendingResolveSubmit = document.getElementById(
        "pendingResolveSubmit"
      );
    });
  });
}
// const showfirstIssueButton = document.getElementById("showfirstIssue");
const showMoreCard = document.getElementById("show-more-card");
const showMoreSection = document.getElementById("show-more-section");
const showMoreUl = document.getElementById("show-more");
// showfirstIssueButton.addEventListener("click", () => {
//   const firstCard = document.getElementById("firstPendingIssueCard");
//   firstCard.style.display = "block";
//   showMoreCard.style.display = "none";
//   showMoreSection.removeChild(showMoreUl);

//   // showMoreSection.appendChild(showMoreUl);
// });

async function showFilterIssueResolve(query, issues, checkId) {
  const obj = query.pendingIssue.find(
    (o) => o.issueId === checkId.replace("Filter", "")
  );
  const resolveStatus = document.getElementById(`${checkId}`);
  console.log(obj);
  const issueresolveDialog = document.createElement("dialog");
  issueresolveDialog.classList.add("mdl-dialog");
  issueresolveDialog.id = issues;
  issueresolveDialog.innerHTML = `<h4 class="mdl-dialog__title">
              <button class="mdc-button" disabled>
                <div class="mdc-button__ripple"></div>
                <i
                  class="material-icons mdc-button__icon"
                  aria-hidden="true"
                  style="color: #fff; color: #219653"
                  >check_circle_outline</i
                >
                <span class="mdc-button__label" style="color: #000"
                  >Issue Resolved</span
                >
              </button>
              <span
                class="material-icons"
                style="float: right"
                id="${issues}FilterClose"
              >
                cancel
              </span>
            </h4>
            <div class="mdl-dialog__content">
              <section class="hero">
                <ul
                  class="mdc-list mdc-list--two-line mdc-list--avatar-list demo-list demo-list--with-avatars"
                  aria-orientation="vertical"
                >
                  <li class="mdc-list-item mdc-ripple-upgraded" tabindex="-1">
                    <span class="mdc-list-item__graphic" role="presentation">
  <span style="font-size:35px">${obj.icon}</span>
                   
      
                      <br />
                    </span>
                    <span class="mdc-list-item__text">
                      <span
                        class="mdc-list-item__primary-text"
                        id="firstIssueHeadingResolve"
                      >${obj.issueType}</span>
                      <span
                        class="mdc-list-item__secondary-text"
                        id="firstIssueContentResolve"
                      >${obj.comment}</span>
                    </span>
                  </li>
                </ul>
              </section>
              <p>Remarks</p>
              <label class="mdc-text-field mdc-text-field--filled"style="width:100%">
                <span class="mdc-text-field__ripple"></span>
                
                <input class="mdc-text-field__input" type="text" aria-labelledby="my-label-id" id="issueResolveRemarks">
                <span class="mdc-line-ripple"></span>
              </label>
            <br>
            <br>
            <div style="width:80px;height:80px;background-color:#f2f2f2;text-align:center;">
            <label for="camera-button-issue-resolved">
                <i class="material-icons" style="font-size:35px;color:#fff;text-align:center;padding-top:20px">add_a_photo</i>
                <input   id="camera-button-issue-resolved" style="display:none;" capture>
            </label>
            </div>
            </div>
            <div class="mdl-dialog__actions">
              <p style="text-align: center">
                <button
                  class="mdc-button what-we-do-button resolve-button"
                  style="
                    background-color: #184466;
                    color: #f2f2f2;
                    font-weight: bold;
                    font-size: 24px;
                    line-height: 28px;
                    text-transform: uppercase;
                    width: 320px;
                    height: 50px;
      
                    margin-top: 5%;
                    border: 1px solid #184466;
                  "
                 id ='${issues}Submit'
                >
                  <div class="mdc-button__ripple"></div>
                  <span
                    class="mdc-button__label"
                    style="
                      margin: 5px 2px;
                      font-weight: 700;
                      font-family: Roboto !important;
                    "
                    >SUBMIT</span
                  >
                </button>
              </p>
            </div>`;

  issueResolveCheck.appendChild(issueresolveDialog);
  dialogPolyfill.registerDialog(issueresolveDialog);
  issueresolveDialog.showModal();
  const FilterCloseDialogButton = document.getElementById(
    `${issues}FilterClose`
  );

  const remarkInput = document.getElementById("issueResolveRemarks");
  let resolveFirstImage = "";
  document
    .getElementById("camera-button-issue-resolved")
    .addEventListener("click", () => {
      if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.openNativeCamera
      ) {
        window.webkit.messageHandlers.openNativeCamera.postMessage("getImage");
      }

      // function getImage(base64) {
      //   resolveFirstImage = base64;
      // }
      // getImage();
    });
  FilterCloseDialogButton.addEventListener("click", () => {
    issueresolveDialog.close();
  });
  // document
  //   .getElementById("camera-button-issue-resolve")
  //   .addEventListener("change", (evt) => {
  //     getImageBase64(evt)
  //       .then((base) => {
  //         resolveFirstImage = base;
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //       });
  //   });
  document.getElementById(`${issues}Submit`).addEventListener("click", () => {
    console.log("filter issue resolve button");

    console.log("issue resolved logs sending logic");
    console.log(remarkInput.value);
    let url = "";
    let issueResolveResponse;
    if (query.bearerToken !== null) {
      issueResolveResponse = JSON.stringify({
        issueType: issues,
        comment: remarkInput.value,
        section: "issue",
        type: "resolve",
        timestamp: Date.now(),
        photo: photo,
        propertyId: query.propertyId,
        longitude: query.longitude,
        latitude: query.latitude,
        issueId: obj.issueId,
        qrId: query.qrId,
        location: query.location,
        geoPoint: query.geoPoint,
        property: query.property,
        bearerToken: query.bearerToken,
      });
      url = `https://growthfile.com/qr?token=${query.bearerToken}&longitude=${query.longitude}&latitude=${query.latitude}&checklist=false`;
    } else {
      issueResolveResponse = JSON.stringify({
        issueType: issues,
        comment: remarkInput.value,
        section: "issue",
        type: "resolve",
        timestamp: Date.now(),
        photo: photo,
        propertyId: query.propertyId,
        longitude: longitudeParam,
        latitude: latitudeParam,
        issueId: obj.issueId,
        qrId: query.qrId,
        location: query.location,
        geoPoint: query.geoPoint,
        property: query.property,
        bearerToken: token,
      });
      url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=false`;
    }

    console.log(issueResolveResponse);
    const requestOption = {
      method: "PUT",
      body: issueResolveResponse,
      redirect: "follow",
    };

    fetch(
      "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
      requestOption
    )
      .then((response) => response.text())
      .then((result) => {
        var x = new mdc.snackbar.MDCSnackbar(
          document.getElementById("snackResolve")
        );
        x.open();
        localStorage.setItem("url", url);
        const idToken = query.bearerToken.split(" ")[1];

        reloadPage(
          idToken,
          String(query.latitude),
          String(query.longitude),
          window.location.href
        );
      })
      .catch((error) => {
        console.log("error", error);
      });
    resolveStatus.style.color = "#219653";
    issueresolveDialog.close();
  });
}
function getImageBase64(evt, compressionFactor = 0.5) {
  return new Promise(function (resolve, reject) {
    const files = evt.target.files;
    if (!files.length) return;
    const file = files[0];
    var fileReader = new FileReader();
    fileReader.onload = function (fileLoadEvt) {
      const srcData = fileLoadEvt.target.result;
      const image = new Image();
      image.src = srcData;
      image.onload = function () {
        const newDataUrl = resizeAndCompressImage(image, compressionFactor);
        return resolve(newDataUrl);
      };
    };
    fileReader.readAsDataURL(file);
  });
}

function resizeAndCompressImage(image, compressionFactor) {
  var canvas = document.createElement("canvas");
  const canvasDimension = new CanvasDimension(image.width, image.height);
  canvasDimension.setMaxHeight(screen.height);
  canvasDimension.setMaxWidth(screen.width);
  const newDimension = canvasDimension.getNewDimension();
  canvas.width = newDimension.width;
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  const newDataUrl = canvas.toDataURL("image/jpeg", compressionFactor);
  return newDataUrl;
}

function CanvasDimension(width, height) {
  this.MAX_HEIGHT = "";
  this.MAX_WIDTH = "";
  this.width = width;
  this.height = height;
}
CanvasDimension.prototype.setMaxWidth = function (MAX_WIDTH) {
  this.MAX_WIDTH = MAX_WIDTH;
};
CanvasDimension.prototype.setMaxHeight = function (MAX_HEIGHT) {
  this.MAX_HEIGHT = MAX_HEIGHT;
};
CanvasDimension.prototype.getNewDimension = function () {
  if (this.width > this.height) {
    if (this.width > this.MAX_WIDTH) {
      this.height *= this.MAX_WIDTH / this.width;
      this.width = this.MAX_WIDTH;
    }
  } else {
    if (this.height > this.MAX_HEIGHT) {
      this.width *= this.MAX_HEIGHT / this.height;
      this.height = this.MAX_HEIGHT;
    }
  }

  return {
    width: this.width,
    height: this.height,
  };
};

async function toggle(source) {
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  if (source.checked === true) {
    const checklistResponse = [];
    for (var i = 0; i < checkboxes.length; i++) {
      const t = checkboxes[i].id;
      checklistResponse.push({
        type: checkboxes[i].id,
        response: source.checked,
      });

      if (checkboxes[i] != source) checkboxes[i].checked = source.checked;
    }
    console.log(checklistResponse);
    const my = "1lcMdXKDI2rKz0AMTGhl";
    const raw = undefined;

    const requestOptions = {
      method: "GET",
      body: raw,
      redirect: "follow",
    };
    const result = await fetch(
      `https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan?qrId=${my}`,
      requestOptions
    );
    const response = await result.json();
    const texts = document.getElementById("textField");
    texts.style.display = "none";
    const radios = document.getElementById("radioButton");
    radios.style.display = "none";
    document.getElementById("selctField").style.display = "none";

    const t = checklistResponse.shift();
    const checklistSubmitButton = document.getElementById(
      "checklistSubmitSelectAll"
    );
    const checklistSubmitButtons = document.getElementById(
      "checklistSubmitButton"
    );
    checklistSubmitButtons.style.display = "none";
    checklistSubmitButton.style.display = "block";
    checklistSubmitButton.style.margin = "auto";
    console.log(checklistResponse.length);
    if (checklistResponse.length > 0) {
      const radioIdArray = [];
      const textFieldId = [];
      if (response.radioButton.length > 0) {
        const radioButton = document.getElementById("radioButtonAll");
        radioButton.style.display = "block";
        response.radioButton.forEach((doc) => {
          const radioDiv = document.createElement("div");
          radioDiv.classList.add("question");
          radioDiv.innerHTML = `
              
              <div class="mdc-layout-grid">
              <p style="text-align:left;color:#333">${doc}</p>
              <div class="mdc-layout-grid__inner">
              
              <div class="mdc-layout-grid__cell--span-2-phone">
                  <input type="radio" id="${doc}" name="${doc}no" value="yes">
        <label for="${doc}" style="color:#333">Yes</label>
        </div>
        <div class="mdc-layout-grid__cell--span-2-phone">
        <input type="radio" id="${doc}no" name="${doc}no" value="no">
        <label for="${doc}"style="color:#333">No</label><br>
        </div>
                  </div>
                  </div>
              `;

          radioButton.appendChild(radioDiv);
          radioIdArray.push(doc);
        });
      } else {
        console.log("no radioButton Ui");
        const step2 = document.getElementById("step2");
        step2.style.display = "none";
        const card2 = document.getElementById("card2");
        card2.style.display = "none";
        const card3 = document.getElementById("card3");
        card3.style.marginTop = "-25px";
      }
      if (response.textField.length > 0) {
        //
        const textField = document.getElementById("textFieldSelectAll");
        textField.style.display = "block";
        response.textField.forEach((doc) => {
          console.log(doc);
          const divTextField = document.createElement("div");
          divTextField.innerHTML = `<label class="mdc-text-field mdc-text-field--filled mdc-text-field--no-label inline mdc-text-field--invalid" style="width:100%;margin-top:10px;background-color:#fff;border-bottom:1px solid #333">
        <input type="${doc.type}" class="mdc-text-field__input textField" aria-labelledby="my-label-id" id="${doc.label}1" placeholder="${doc.label}" required="">
        <span class="mdc-notched-outline mdc-notched-outline--no-label">
                   
                    
                    </span>
                    
      </label>
      `;

          textField.appendChild(divTextField);
          textFieldId.push(`${doc.label}1`);
        });
      } else {
        console.log("no text field");
        const card3 = document.getElementById("card3");
        card3.style.display = "none";
        const card4 = document.getElementById("card4");
        card4.style.marginTop = "-25px";
      }
      const selectArray = [];
      if (response.select.length >= 1) {
        console.log("select available");
        const selectField = document.getElementById("selectFieldAll");
        selectField.style.display = "block";
        response.select.forEach((doc) => {
          console.log(doc.question);
          const selectDiv = document.createElement("div");
          const p = document.createElement("p");
          p.id = "selctedFieldQuestion";
          p.innerHTML = `${doc.question}`;
          selectDiv.innerHTML = `<select name ="issue" id ="${doc.question}1"  style="width: 100%; height: 40px; padding: 2px;border:0px;border-bottom:1px solid #000;background-color:#fff">
        </select>`;
          selectField.appendChild(p);
          selectField.appendChild(selectDiv);
          selectArray.push(`${doc.question}1`);
          const selectFields = document.getElementById(`${doc.question}1`);
          doc.selectField.forEach((doc) => {
            selectFields.innerHTML += `<option value='${doc}1' id=${doc} style="color:#333">${doc}</option>`;
          });
        });
      } else {
        console.log("no select option");
        const card4 = document.getElementById("card4");
        card4.style.display = "none";
      }
      const toggleResponse = [];
      document.getElementById("toggle").style.display = "none";
      if (response.toggle.length > 0) {
        const toggleDiv = document.getElementById("toggleAll");
        response.toggle.forEach((doc) => {
          console.log(doc);
          const switchDiv = document.createElement("div");
          switchDiv.innerHTML = ` <label for="${doc.question}">${doc.question}</label>
          <div class="mdc-switch" style="float: right">
            <div class="mdc-switch__track"></div>
            <div class="mdc-switch__thumb-underlay">
              <div class="mdc-switch__thumb"></div>
              <input
                type="checkbox"
                id="${doc.question}"
                class="mdc-switch__native-control"
                role="switch"
                aria-checked="false"
              />
            </div>
          </div>`;

          toggleDiv.appendChild(document.createElement("br"));
          toggleDiv.appendChild(switchDiv);
          toggleResponse.push(doc.question);
        });
        [].slice
          .call(document.querySelectorAll(".mdc-switch"))
          .forEach(function (ele) {
            mdc.switchControl.MDCSwitch.attachTo(ele);
          });
      } else {
        document.getElementById("card5").style.display = "none";
      }
      // document.getElementById("locationVerification").innerHTML =
      //   response.verifyLocation;

      const toggleResponseArray = [];
      if (toggleResponse.length > 0) {
        toggleResponse.forEach((doc) => {
          const docs = document.getElementById(doc);
          console.log(docs);
          docs.addEventListener("click", () => {
            const responseToggle = {
              question: doc,
              response: docs.checked,
            };
            console.log(responseToggle);
            toggleResponseArray.push(responseToggle);
          });
        });
      } else {
        console.log("no toggle");
      }
      checklistSubmitButton.addEventListener("click", async () => {
        const selectFieldResponse = [];
        selectArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            questions: doc.slice(0, -1),
            response: docs.value.slice(0, -1),
          };
          console.log(response);
          selectFieldResponse.push(response);
        });
        console.log(selectFieldResponse);
        const textFieldResponse = [];
        textFieldId.forEach((doc) => {
          const docs = document.getElementById(doc);
          console.log(docs);

          if (docs.value !== "") {
            textFieldResponse.push({
              textField: doc.slice(0, -1),
              response: docs.value,
            });
          } else {
            textFieldResponse.push({
              textField: doc.slice(0, -1),
              response: docs.value,
            });
          }
        });
        const radioButtonResponse = [];
        radioIdArray.forEach((doc) => {
          const docs = document.getElementById(doc);
          const response = {
            question: doc,
            response: docs.checked,
          };
          radioButtonResponse.push(response);
        });
        console.log(textFieldResponse);
        console.log(radioButtonResponse);
        const checkboxDiv = document.getElementById("checkboxDiv");
        checkboxDiv.style.display = "none";
        const formSubmitResponse = document.getElementById(
          "formSubmitResponse"
        );
        formSubmitResponse.innerHTML = `<div class="image-txt-container">
            <img src="https://firebasestorage.googleapis.com/v0/b/growthfilepractice.appspot.com/o/Group%20999.svg?alt=media&token=fdd4f084-660b-47b7-b941-e7afc548ab76">
           &nbsp; &nbsp; <h2 style="font-family: Roboto;
           font-style: normal;
           font-weight: 500;
           font-size: 24px;
           line-height: 28px;
           
           /* Gray 1 */
           
           color: #333333;">
           Checklist Completed
            </h2>
          </div>`;
        let raws;
        let url = ``;
        if (response.bearerToken !== null) {
          raws = JSON.stringify({
            checkbox: checklistResponse,
            textField: textFieldResponse,
            bearerToken: response.bearerToken,
            select: selectFieldResponse,
            radioButton: radioButtonResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: response.longitude,
            latitude: response.latitude,
            toggle: toggleResponseArray,
          });
          url = `https://growthfile.com/qr?token=${response.bearerToken}&longitude=${response.longitude}&latitude=${response.latitude}&checklist=true`;
        } else {
          raws = JSON.stringify({
            toggle: toggleResponseArray,
            checkbox: checklistResponse,
            textField: textFieldResponse,
            bearerToken: token,
            select: selectFieldResponse,
            radioButton: radioButtonResponse,
            property: response.property,
            propertyId: response.propertyId,
            location: response.location,
            qrId: response.qrId,
            section: "checklist",
            type: "fill",
            geoPoint: response.geoPoint,
            longitude: longitudeParam,
            latitude: latitudeParam,
          });
          url = `https://growthfile.com/qr?token=${token}&longitude=${longitudeParam}&latitude=${latitudeParam}&checklist=true`;
        }

        console.log(raws);
        const requestOption = {
          method: "PUT",
          // headers: myHeaders,
          body: raws,
          redirect: "follow",
        };

        fetch(
          "https://us-central1-growthfilepractice.cloudfunctions.net/reportsApi/api/qrscan",
          requestOption
        )
          .then((response) => response.text())
          .then((result) => {
            localStorage.setItem("url", url);
            document.getElementById("buttonAll").style.display = "none";
            document.getElementById("beforeCreationIssue").style.marginTop =
              "-21%";
            document.getElementById("checklistSubmitSelectAll").style.display =
              "none";
            const radioButton = document.getElementById("radioButtonAll");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = "";
            });
            document.getElementById("textFieldSelectAll").style.display =
              "none";
            document.getElementById("selectFieldAll").style.display = "none";
            document.querySelectorAll("cards").style.display = "none";
            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
            const idToken = response.bearerToken.split(" ")[1];
          })
          .catch((error) => {
            const radioButton = document.getElementById("radioButtonAll");
            radioButton.style.display = "none";
            textFieldId.forEach((doc) => {
              document.getElementById(doc).value = "";
            });
            document.getElementById("textFieldSelectAll").style.display =
              "none";
            document.getElementById("selectFieldAll").style.display = "none";
            document.getElementById("card1").style.display = "none";
            document.getElementById("card2").style.display = "none";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            document.getElementById("card5").style.display = "none";
            document.getElementById("checklistSubmitSelectAll").style.display =
              "none";
          });
        for (var i = 0; i < checkboxes.length; i++) {
          if (checkboxes[i] != source) checkboxes[i].checked = false;
        }
        document.getElementById("selectAll").checked = false;
      });
    } else {
      checklistSubmitButton.addEventListener("click", () => {
        console.log("no checklist is selected");
      });
    }
  } else {
    console.log("checkbox unchecked");
    const checklistResponse = [];
    for (var i = 0; i < checkboxes.length; i++) {
      const t = checkboxes[i].id;
      checklistResponse.push({
        type: checkboxes[i].id,
        response: source.checked,
      });

      if (checkboxes[i] != source) checkboxes[i].checked = source.checked;
    }
    console.log(checklistResponse);
  }
}
function changeColor(id, color) {
  console.log(id, color);
  document.getElementById(id).style.backgroundColor = "green";
}

// u+26A1