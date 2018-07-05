
function listView (dbName) {
  var req = window.indexedDB.open(dbName, 1)
  req.onerror = function (event) {
    console.log(event)
  }

  req.onsuccess = function () {
    const db = req.result
    const activityStoreTx = db.transaction('activity')
    const activityObjectStore = activityStoreTx.objectStore('activity')
    const activityObjectStoreIndex = activityObjectStore.index('timestamp')
    const recordCount = activityObjectStoreIndex.count()

    recordCount.onsuccess = function () {
      if (!recordCount.result) return

      activityObjectStoreIndex.openCursor(null, 'prev').onsuccess = function (event) {
        let cursor = event.target.result

        if (!cursor) { console.log('all enteries displayed'); return }

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

        document.getElementById('activity--list').innerHTML = li.outerHTML

        cursor.continue()
      }
    }
  }
}

function mapView (dbName) {
}

function calendarView () {

}

function profileView () {

}
