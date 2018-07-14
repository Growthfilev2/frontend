function conversation (id) {
  removeDom('chat-container')

  const currentUser = firebase.auth().currentUser

  const req = window.indexedDB.open(currentUser.uid)
  req.onsuccess = function () {
    const db = req.result
    fillActivityDetailPage(db, id)

    const addendumIndex = db.transaction('addendum', 'readonly').objectStore('addendum').index('activityId')

    addendumIndex.openCursor(id).onsuccess = function (event) {
      const cursor = event.target.result
      if (!cursor) return
      let commentBox = document.createElement('div')
      commentBox.classList.add('comment-box', 'talk-bubble', 'tri-right', 'round', 'btm-left')
      currentUser.phoneNumber === cursor.value.user ? commentBox.classList.add('current-user--comment') : commentBox.classList.add('other-user--comment')

      let textContainer = document.createElement('div')
      textContainer.classList.add('talktext')

      let user = document.createElement('p')
      user.classList.add('user-name--comment')
      user.appendChild(document.createTextNode(cursor.value.user))

      let comment = document.createElement('p')
      comment.classList.add('comment')
      comment.appendChild(document.createTextNode(cursor.value.comment))

      let commentInfo = document.createElement('span')
      commentInfo.style.float = 'right'
      commentInfo.appendChild(document.createTextNode(cursor.value.timestamp.split('T')[1].split('.')[0]))

      let mapIcon = document.createElement('i')
      mapIcon.classList.add('user-map--span', 'material-icons')
      mapIcon.appendChild(document.createTextNode('location_on'))

      commentInfo.appendChild(mapIcon)
      textContainer.appendChild(user)
      textContainer.appendChild(comment)
      textContainer.appendChild(commentInfo)

      commentBox.appendChild(textContainer)
      document.getElementById('chat-container').appendChild(commentBox)
      cursor.continue()
    }

    document.getElementById('send-chat--input').addEventListener('click', function () {
      fetchCurrentLocation().then(function (geopoints) {
        const reqBody = {
          'activityId': id,
          'comment': getInputText('write--comment').value,
          'timestamp': fetchCurrentTime(),
          'geopoint': geopoints
        }

        requestCreator('comment', reqBody)
      })
    })
  }
}

function fillActivityDetailPage (db, id) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')
  activityObjectStore.get(id).onsuccess = function (event) {
    const record = event.target.result

    getInputText('activity--title-input').value = record.title
    getInputText('activity--desc-input').value = record.description
    // getInputText('current-status').value = record.status
  }
}
