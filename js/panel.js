function listView (dbName) {
  const req = window.indexedDB.open(dbName)
  req.onerror = function (event) {
    console.log(event)
  }

  req.onsuccess = function () {
    const db = req.result
    const activityStoreTx = db.transaction('activity')
    const activityObjectStore = activityStoreTx.objectStore('activity')
    const activityObjectStoreIndex = activityObjectStore.index('timestamp')

    activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
      let cursor = event.target.result
      if (!cursor) {
        console.log('all enteries displayed')

        return
      }

      listViewUI(cursor)
      cursor.continue()
    }
  }
}

function listViewUI (cursor) {
  const li = document.createElement('li')
  li.classList.add('mdc-list-item')
  li.dataset.id = cursor.value.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id)')

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  leftTextContainer.textContent = cursor.value.title

  const leftTextSecondaryContainer = document.createElement('span')
  leftTextSecondaryContainer.classList.add('mdc-list-item__secondary-text')
  leftTextSecondaryContainer.textContent = cursor.value.office

  leftTextContainer.appendChild(leftTextSecondaryContainer)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')
  metaTextContainer.textContent = new Date(cursor.value.timestamp).toDateString()

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text')
  metaTextActivityStatus.textContent = cursor.value.status
  metaTextContainer.appendChild(metaTextActivityStatus)
  li.innerHTML += leftTextContainer.outerHTML + metaTextContainer.outerHTML

  document.getElementById('activity--list').appendChild(li)
}

document.getElementById('map-drawer--icon').addEventListener('click', function () {
  const user = firebase.auth().currentUser
  mapView(user.uid)
})

function mapView (dbName) {
  // initialize mdc instance for map drawer

  const mdcMapDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('map-drawer'))
  // open map drawer

  mdcMapDrawer.open = true

  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const mapRecords = []

    const db = req.result

    const mapObjectStore = db.transaction('map').objectStore('map')
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    mapObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result

      if (!cursor) {
        mapRecords.push({
          location: 'your location',

          geopoint: {
            '_latitude': 28.6667,
            '_longitude': 77.2167
          }
        })
        initMap(dbName, mapRecords)
        return
      }

      mapRecords.push(cursor.value)
      cursor.continue()
    }
  }
}

function initMap (dbName, mapRecord) {
  // user current geolocation  is set as map center
  const centerGeopoints = mapRecord[mapRecord.length - 1]

  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: new google.maps.LatLng(centerGeopoints.geopoint['_latitude'],
      centerGeopoints.geopoint['_longitude']),

    mapTypeId: google.maps.MapTypeId.ROADMAP

  })

  displayMarkers(dbName, map, mapRecord)
}

function displayMarkers (dbName, map, locationData) {
  const markers = []
  for (let i = 0; i < locationData.length; i++) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(locationData[i].geopoint['_latitude'], locationData[i].geopoint['_longitude']),

      title: locationData[i].location,
      customInfo: locationData[i].activityId

    })

    marker.setMap(map)
    markers.push(marker)
  }

  google.maps.event.addListener(map, 'idle', function () {
    showVisibleMarkers(dbName, map, markers)
  })
}

function showVisibleMarkers (dbName, map, markers) {
  let bounds = map.getBounds()

  for (let i = 0; i < markers.length; i++) {
    const currentMarker = markers[i]

    if (bounds.contains(currentMarker.getPosition())) {
      console.log(Array.isArray(currentMarker.customInfo))
    }
  }
}

function calendarView () {

}

function profileView () {

}
