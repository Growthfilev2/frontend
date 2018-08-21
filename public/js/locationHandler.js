const array = []
const twoGeopointsDiff = []
let iterator = '';
self.onmessage = function(event) {

  array.push(event.data)

  let geoObjects = {}


  if (iterator == '') {

    geoObjects.latitude = array[0].latitude - 0
    geoObjects.longitude = array[0].longitude - 0
    twoGeopointsDiff.push(geoObjects);
    iterator++
  } else {
    iterator = 0
    iterator++
    // console.log(array)
    // console.log(iterator)
    const subtractedLat = Math.abs(array[iterator].latitude.toFixed(10) - array[iterator - 1].latitude.toFixed(10))
    const subtractedLon = Math.abs(array[iterator].longitude.toFixed(10) - array[iterator - 1].longitude.toFixed(10))

    if(parseFloat(subtractedLat.toFixed(6)) > 0 && parseFloat(subtractedLat.toFixed(6)) <= .0009 && parseFloat(subtractedLon.toFixed(6)) > 0 && parseFloat(subtractedLon.toFixed(6)) <= .0009 ){
      geoObjects.lat = subtractedLat
      geoObjects.lon = subtractedLon
      // twoGeopointsDiff.push(geoObjects)
      self.postMessage({stream:geoObjects,value:true,count:iterator});
    }
    else {
      geoObjects.lat = subtractedLat
      geoObjects.lon = subtractedLon
      // twoGeopointsDiff.push(geoObjects)
      self.postMessage({stream:geoObjects,value:false});
    }
  }

}
