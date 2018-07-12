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
  const li = document.createElement('li')
  li.classList.add('mdc-list-item', 'activity--list-item')
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

const drawerIcons = ['map-drawer--icon', 'calendar-drawer--icon']
drawerIcons.forEach(function (selector) {
  document.getElementById(selector).addEventListener('click', function () {
    const user = firebase.auth().currentUser
    console.log(selector)
    switch (selector) {
      case 'map-drawer--icon':
        mapView(user.uid)
        break

      case 'calendar-drawer--icon':
        calendarView(user.uid)
        break
    }
  })
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
    // create marker
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(locationData[i].geopoint['_latitude'], locationData[i].geopoint['_longitude']),

      title: locationData[i].location,
      customInfo: locationData[i].activityId

    })
    // set bounds to extend to a marker
    bounds.extend(marker.getPosition())

    // set marker to map
    marker.setMap(map)

    // push marker to allMarkers array
    allMarkers.push(marker)

    // add click listener on each marker , to zoom on marker when clicked
    marker.addListener('click', function () {
      map.setZoom(14)
      map.setCenter(marker.getPosition())
      generateActivityFromMarker(dbName, map, allMarkers)
    })
  }

  // fit all markers to default view of map
  map.fitBounds(bounds)

  // add zoom_changed listener on map ,so that when zoom changes, markers will give the acitivtyId attached to them

  google.maps.event.addListener(map, 'zoom_changed', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })

  // add drag_end listener on map ,so that when draggins is done , markers will give the acitivtyId attached to them

  google.maps.event.addListener(map, 'dragend', function () {
    generateActivityFromMarker(dbName, map, allMarkers)
  })
}

function generateActivityFromMarker (dbName, map, markers) {
  const PARENT_EL_SELECTOR = 'list-view--map'
  const target = document.getElementById(PARENT_EL_SELECTOR)

  // remove dom when zoom,drag or click events are fired, to remove previous listview inside the map drawer

  while (target.lastChild) {
    target.removeChild(target.lastChild)
  }

  let bounds = map.getBounds()

  // open IndexedDB
  let req = indexedDB.open(dbName)

  req.onsuccess = function () {
    const db = req.result
    const activityObjectStore = db.transaction('activity').objectStore('activity')

    for (let i = 0; i < markers.length; i++) {
      // marker.customInfo is the activityId related to a marker
      // if marker is in current bound area and activityId is not undefined then get the activityId related to that marker and get the record for that activityId

      if (bounds.contains(markers[i].getPosition()) && markers[i].customInfo) {
        activityObjectStore.openCursor(markers[i].customInfo).onsuccess = function (event) {
          const cursor = event.target.result

          if (!cursor) return

          // call listViewUI to render listView
          listViewUI(cursor.value, 'list-view--map')
        }
      }
    }
  }
}

function calendarView (dbName) {
  const mdcCalendarDrawer = mdc
    .drawer
    .MDCTemporaryDrawer
    .attachTo(document.getElementById('calendar-drawer'))

  mdcCalendarDrawer.open = true

  // open IDB
  const req = window.indexedDB.open(dbName)
  req.onsuccess = function () {
    const db = req.result
    const calendarTx = db.transaction(['calendar'], 'readonly')
    const calendarObjectStore = calendarTx.objectStore('calendar')
    const calendarDateIndex = calendarObjectStore.index('date')

    calendarDateIndex.openCursor().onsuccess = function (event) {
      const cursor = event.target.result

      if (cursor) {
        getActivityForDate(db, cursor.value)
        cursor.continue()
      }
    }
  }

  req.onerror = function (event) {
    console.log(event.target.result)
  }
}

function getActivityForDate (db, data) {
  const commonDate = data.date.toDateString()
  const commonParsedDate = Date.parse(commonDate)

  // ISO string converts the date to yyyy-mm-dd format with time
  // splitting the date from 'T' and removed the hyphen  will give only yyyy-mm-dd
  // commonIsoDate will be the ul element's className where list will be inserted
  // const commonIsoDate = data.date.toISOString().split('T')[0].replace(/-/g, '')
  if (!document.getElementById(commonParsedDate)) {
    const dateDiv = document.createElement('div')
    dateDiv.id = commonParsedDate
    dateDiv.className = 'date-container'

    const span = document.createElement('span')
    span.className = 'date-col'
    span.textContent = commonDate

    const activityRow = document.createElement('div')
    activityRow.className = 'activity--row'
    activityRow.id = `row-${commonParsedDate}`

    dateDiv.appendChild(span)
    dateDiv.appendChild(activityRow)

    document.getElementById('calendar-view--container').appendChild(dateDiv)
    getActivity(db, data)
  }

  getActivity(db, data, `row-${commonParsedDate}`)
  document.querySelector('.activity--row li').classList.add('calendar-activity--list-item')
}

function getActivity (db, data, target) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  activityObjectStore.openCursor(data.activityId).onsuccess = function (event) {
    const cursor = event.target.result

    listViewUI(cursor.value, target)
  }
}

function profileView (dbName) {

}
