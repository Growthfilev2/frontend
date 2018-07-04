function getTextInput (currentActivityId) {

}
function getTimeInput (currentActivityId) {

}

function selectForm (currentActivityId) {

}

function requestCreator (requestType, requestBody) {
  // A request generator body with type of request to perform and the body/data to send to the api handler.

  const requestGenerator = {
    type: requestType,
    body: requestBody
  }

  // spawn a new worker called apiHandler.

  const apiHandler = new Worker('js/apiHandler.js')

  // post the requestGenerator object to the apiHandler to perform IDB and api
  // operations

  apiHandler.postMessage(requestGenerator)

  // handle the response from apiHandler when operation is completed

  apiHandler.onmessage = function (response) {

  }

  apiHandler.onerror = function (error) {
    console.log(error)
  }
}
