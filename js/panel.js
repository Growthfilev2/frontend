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

      listViewUI(cursor.value, 'activity--list')
      cursor.continue()
    }
  }
}

function listViewUI (data, target) {
  console.log('run')
  const li = document.createElement('li')
  li.classList.add('mdc-list-item', 'insert-slow')
  li.dataset.id = data.activityId
  li.setAttribute('onclick', 'conversation(this.dataset.id)')

  const leftTextContainer = document.createElement('span')
  leftTextContainer.classList.add('mdc-list-item__text')
  leftTextContainer.textContent = data.title

  const leftTextSecondaryContainer = document.createElement('span')
  leftTextSecondaryContainer.classList.add('mdc-list-item__secondary-text')
  leftTextSecondaryContainer.textContent = data.office

  leftTextContainer.appendChild(leftTextSecondaryContainer)

  const metaTextContainer = document.createElement('span')
  metaTextContainer.classList.add('mdc-list-item__meta')
  metaTextContainer.textContent = new Date(data.timestamp).toDateString()

  const metaTextActivityStatus = document.createElement('span')
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text')
  metaTextActivityStatus.textContent = data.status
  metaTextContainer.appendChild(metaTextActivityStatus)
  li.innerHTML += leftTextContainer.outerHTML + metaTextContainer.outerHTML

  document.getElementById(target).appendChild(li)
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
  document.getElementById('close-map--drawer').addEventListener('click', function () {
    mdcMapDrawer.open = false
  })

  const req = window.indexedDB.open(dbName)

  req.onsuccess = function () {
    const mapRecords = []

    const db = req.result

    const mapObjectStore = db.transaction('map').objectStore('map')
    const mapLocationIndex = mapObjectStore.index('location')
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    mapLocationIndex.openCursor().onsuccess = function (event) {
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
    center: new google.maps.LatLng(
      centerGeopoints.geopoint['_latitude'],
      centerGeopoints.geopoint['_longitude']
    ),

    streetViewControl: false,
    mapTypeControl: false,
    rotateControl: false,
    fullscreenControl: false,

    mapTypeId: google.maps.MapTypeId.ROADMAP
  })

  displayMarkers(dbName, map, mapRecord)
}

function displayMarkers (dbName, map, locationData) {
  let bounds = new google.maps.LatLngBounds()
  const allMarkers = []
  for (let i = 0; i < locationData.length; i++) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(locationData[i].geopoint['_latitude'], locationData[i].geopoint['_longitude']),

      title: locationData[i].location,
      customInfo: locationData[i].activityId

    })
    bounds.extend(marker.getPosition())

    marker.setMap(map)
    allMarkers.push(marker)

    marker.addListener('click', function () {
      map.setZoom(14)
      map.setCenter(marker.getPosition())
      generateActivityFromMarker(dbName, map, allMarkers)
    })
  }

  map.fitBounds(bounds)

  google.maps.event.addListener(map, 'zoom_changed', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })

  google.maps.event.addListener(map, 'dragend', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })
}

function generateActivityFromMarker (dbName, map, markers) {
  const PARENT_EL_SELECTOR = 'list-view--map'
  const target = document.getElementById(PARENT_EL_SELECTOR)
  while (target.lastChild) {
    target.removeChild(target.lastChild)
  }

  let bounds = map.getBounds()

  let req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const activityObjectStore = db.transaction('activity').objectStore('activity')
    for (let i = 0; i < markers.length; i++) {
      console.log(markers[i])
      if (bounds.contains(markers[i].getPosition()) && markers[i].customInfo) {
        activityObjectStore.openCursor(markers[i].customInfo).onsuccess = function (event) {
          const cursor = event.target.result

          if (!cursor) return

          listViewUI(cursor.value, 'list-view--map')
        }
      }
    }
  }
}

function calendarView () {

}

function profileView () {

}
