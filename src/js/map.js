var map;
var globMark;
let o;
let selectedSubs;

function handleNav(evt) {
  const state = history.state[0]


  if (state === 'homeView') {
    drawer.open = true
    return;
  }

  return history.back();
}

function mapView() {
  history.pushState(['mapView'], null, null);
  document.getElementById('start-load').classList.add('hidden');

  document.getElementById('app-current-panel').innerHTML = mapDom();
  document.getElementById('app-current-panel').classList.remove('user-detail-bckg')
  document.getElementById('app-current-panel').classList.remove('mdc-top-app-bar--fixed-adjust')

  document.getElementById('map-view').style.height = '100%';

  manageLocation().then(function (location) {

    document.getElementById('start-load').classList.add('hidden');

    const latLng = {
      lat: location.latitude,
      lng: location.longitude
    }
    console.log(latLng)
    const offsetBounds = new GetOffsetBounds(location, 0.5);


    o = {
      north: offsetBounds.north(),
      south: offsetBounds.south(),
      east: offsetBounds.east(),
      west: offsetBounds.west()
    };
    if (!document.getElementById('map')) return;
    map = new google.maps.Map(document.getElementById('map'), {
      center: latLng,
      zoom: 18,
      // maxZoom:18,
      disableDefaultUI: true,

      restriction: {
        latLngBounds: {
          north: offsetBounds.north(),
          south: offsetBounds.south(),
          east: offsetBounds.east(),
          west: offsetBounds.west()
        },
        strictBounds: true,
        // strictBounds: false,
      },
      // mapTypeId: google.maps.MapTypeId.ROADMAP
    })

    var marker = new google.maps.Marker({
      position: latLng,
      icon: 'https://www.robotwoods.com/dev/misc/bluecircle.png'
    });
    marker.setMap(map);

    var radiusCircle = new google.maps.Circle({
      strokeColor: '#89273E',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#89273E',
      fillOpacity: 0.35,
      map: map,
      center: latLng,
      radius: location.accuracy
    });


    google.maps.event.addListenerOnce(map, 'idle', function () {
      console.log('idle_once');
      // createForm('Puja Capital', 'customer','',location)
      // return

      // map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();
      loadCardData(o, map, location)
    });


  }).catch(function (error) {
    console.log(error);
    // document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
    document.getElementById('start-load').classList.add('hidden')

    document.getElementById('map').innerHTML = '<div class="center-abs"><p>Failed To Detect You Location</p><button class="mdc-button" id="try-again">Try Again</button></div>'
    const btn = new mdc.ripple.MDCRipple(document.getElementById('try-again'))
    btn.root_.onclick = function () {
      document.getElementById('start-load').classList.remove('hidden')
      mapView();
    }
  })
}

function createForm(office, template, venue, location) {

  const submitCont = document.getElementById('submit-cont')
  submitCont.innerHTML = `<button class='mdc-button' id='create-form'>Create ${template}</button>`
  const btn = new mdc.ripple.MDCRipple(document.getElementById('create-form'))
  btn.root_.addEventListener('click', function () {

    // history.pushState(['cardView'], null, null);

    getSubscription(office, template).then(function (subscription) {
      const duplicate = JSON.parse(JSON.stringify(subscription));
      const random = Math.floor(Math.random() * Math.floor(100000));
      if (template === 'customer') {

        const dialog = new Dialog('Customer', customer(subscription, random)).create();
        dialog.open();
        dialog.listen('MDCDialog:closed', function (evt) {
          if (evt.detail.action !== 'accept') return;
          duplicate.venue = [{
            geopoint: {
              latitude: location.latitude,
              longitude: location.longitude
            },
            location: 'Dummy Location ' + random,
            address: 'Dummy Location ' + random,
            venueDescriptor: 'Customer Office'
          }]

          duplicate.attachment.Name.value = 'Dummy Name ' + random;
          duplicate.share = []
          console.log(duplicate);

          requestCreator('create', duplicate).then(function () {

            successDialog();
            // document.getElementById('selection-box').querySelector('aside').classList.add('large')
            history.pushState(['mapView'], null, null)
            loadCardData(o, map, location, {
              latitude: location.latitude,
              longitude: location.longitude,
              location: 'Dummy Location ' + random,
              address: 'Dummy Location ' + random,
              venueDescriptor: 'Customer Office',
              office: duplicate.office,
              template: duplicate.template
            })
          }).catch(function (error) {
            snacks(error.message)
          })
        })

      }
      if (template === 'dsr' || template === 'tour plan' || template === 'duty roster') {

        const dialog = new Dialog(template, common(subscription)).create();
        dialog.open();
        dialog.listen('MDCDialog:closed', function (evt) {
          if (evt.detail.action !== 'accept') return;

          if (duplicate.attachment.Name) {
            duplicate.attachment.Name.value = 'sample name' + random;
          }

          const scheules = []
          duplicate.schedule.forEach(function (value) {
            scheules.push({
              name: value,
              startTime: Date.now(),
              endTime: Date.now()
            })
          })
          duplicate.schedule = scheules;
          duplicate.share = []
          console.log(duplicate);

          requestCreator('create', duplicate).then(function () {
            successDialog();
            history.pushState(['mapView'], null, null)

          });
        })

      }
      [].map.call(document.querySelectorAll('.mdc-text-field'), function (el) {
        // fields[el.dataset[Object.keys(el.dataset)]] =  new mdc.textField.MDCTextField(el);
        new mdc.textField.MDCTextField(el);
      });
    })
  })
  // })
}



function loadCardData(o, map, location) {
  loadNearByLocations(o, map, location).then(function (markers) {

    const el = document.getElementById('selection-box');
    const aside = el.querySelector('aside');

    const contentBody = el.querySelector('.content-body');
    contentBody.innerHTML = '';

    const header = document.getElementById('card-primary');
    const cardProd = new mdc.linearProgress.MDCLinearProgress(document.getElementById('check-in-prog'));
    header.textContent = `Hello, ${firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber }`;
    el.classList.remove('hidden');

    contentBody.innerHTML = `<div>
    ${mdcSelectVenue(markers, 'Where Are You ?','select-venue')}
    <div id='office-cont' class='pt-10'></div>
    <div id='subs-cont' class='pt-10'></div>
    <div id='submit-cont' class='pt-10'></div>
    </div>`
    selectVenue = new mdc.select.MDCSelect(document.getElementById('select-venue'));

    selectVenue.listen('MDCSelect:change', (evt) => {
      console.log(evt.detail.value)
      aside.classList.add('open')
      if (!evt.detail.value) return;
      const value = JSON.parse(evt.detail.value)

      if (value === 1) {

        document.getElementById('office-cont').innerHTML = ''
        document.getElementById('subs-cont').innerHTML = ''
        document.getElementById('submit-cont').innerHTML = ''

        getUniqueOfficeCount().then(function (offices) {
          if (!offices.length) return;

          document.getElementById('office-cont').innerHTML = `${mdcDefaultSelect(offices,'Choose Office','choose-office')}`
          const selectOfficeInit = new mdc.select.MDCSelect(document.getElementById('choose-office'));
          selectOfficeInit.listen('MDCSelect:change', function (evt) {
            getSubscription(evt.detail.value, 'check-in').then(function (checkInSub) {
              if (!checkInSub) return;
              cardProd.open()
              // requestCreator('create', setVenueForCheckIn('', checkInSub)).then(function () {
                snacks('Check-in created');
                isCheckInCreated = true
                checkForVenueSubs(evt.detail.value).then(function (subs) {
                  cardProd.close()
                  selectedSubs = subs
                  homeView(subs)
                })
              // }).catch(function (error) {
              //   snacks('Please Try again later');
              //   cardProd.close()
              // })
            });
          });
          if (offices.length == 1) {
            selectOfficeInit.selectedIndex = 0
          }
          if (offices.length > 1) {
            selectOfficeInit.selectedIndex = -1
            header.textContent = 'Choose Office'
          }
        })
        return;
      }

      document.getElementById('office-cont').innerHTML = ''
      document.getElementById('subs-cont').innerHTML = ''
      document.getElementById('submit-cont').innerHTML = ''

      getSubscription(value.office, 'check-in').then(function (result) {


        document.getElementById('submit-cont').innerHTML = `<button id='confirm' class='mdc-button mdc-theme--primary-bg mdc-theme--text-primary-on-light'>
        <span class='mdc-button__label'>Confirm</span>
        </button>`
        const confirm = new mdc.ripple.MDCRipple(document.getElementById('confirm'));

        confirm.root_.onclick = function () {

          confirm.root_.classList.add('hidden')
          cardProd.open();

          requestCreator('create', setVenueForCheckIn(value, result)).then(function () {
            snacks('Check-in created');
            isCheckInCreated = true
            getAvailbleSubs(value).then(function (subs) {
              cardProd.close();
              selectedSubs = subs
              homeView(subs)
            })

          }).catch(function (error) {
            console.log(error)
            confirm.root_.classList.remove('hidden');
            snacks('Please Try Again');
            cardProd.close()
          })
        }

      })
    });



    if (!markers.length) {
      selectVenue.selectedIndex = 0
    };
    if (markers.length == 1) {
      selectVenue.selectedIndex = 1
    };

    if (markers.length > 1) {
      selectVenue.selectedIndex = -1
      header.textContent = 'Where Are You ?'
    }
  })
};

function homeView(subs) {
  document.querySelector('.mdc-bottom-navigation').classList.remove('hidden');
  document.getElementById('app-header').classList.remove('hidden')
  navList.selectedIndex = 1;
  // document.querySelector(`[data-state="homeView"]`).classList.add('mdc-bottom-navigation__list-item--activated')
  const headerImage = `<img  class="mdc-top-app-bar__navigation-icon mdc-theme--secondary header-photo" src='./img/empty-user.jpg'>`

  const header = getHeader('app-header', headerImage, '');
  header.setScrollTarget(document.getElementById('main-content'));
  header.navIcon_.src = firebase.auth().currentUser.photoURL;

  header.listen('MDCTopAppBar:nav', handleNav);
  document.getElementById('growthfile').classList.add('mdc-top-app-bar--fixed-adjust')
  document.getElementById('app-current-panel').innerHTML = `
  <div class="mdc-list-group" id='subscription-list-group'>
  ${subs.pending ? `  <h3 class="mdc-list-group__subheader mdc-typography--headline5 mdc-theme--primary">Pending Tasks</h3>
  <ul class="mdc-list";
  left: 0;'>
    <li class="mdc-list-item" tabindex="0">
      <span class="mdc-list-item__text">line item</span>
    </li>
    <li class="mdc-list-item">
      <span class="mdc-list-item__text">line item</span>
    </li>
    <li class="mdc-list-item">
      <span class="mdc-list-item__text">line item</span>
    </li>
  </ul>`:''}
  <h3 class="mdc-list-group__subheader mdc-typography--headline6">What do you want to do ? </h3>
  ${subs.suggested.length ? ` <h3 class="mdc-list-group__subheader">Suggestions</h3>
  <ul class="mdc-list subscription-list" id='suggested-list'>
  ${subs.suggested.map(function(sub){
    return `<li class='mdc-list-item' data-value='${JSON.stringify(sub)}'>
    ${sub.template}
    <span class='mdc-list-item__meta material-icons'>
    keyboard_arrow_right
    </span>
    </li>`
  }).join("")}
  </ul>` :''}
 ${subs.other.length ? ` <h3 class="mdc-list-group__subheader">Recently used</h3>
 <ul class="mdc-list subscription-list" id='other-list'>
 ${subs.other.map(function(sub){
   return `<li class='mdc-list-item'>
   ${sub.template}
   <span class='mdc-list-item__meta material-icons'>
   keyboard_arrow_right
   </span>
   </li>`
 }).join("")}
 </ul>`:''}
 
</div>`
  history.pushState(['homeView'], null, null)
  if (subs.suggested.length) {
    const suggestedInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
    suggestedInit.singleSelection = true;
    suggestedInit.selectedIndex = 0
    suggestedInit.listen('MDCList:action', function (evt) {
      console.log(suggestedInit.listElements[evt.detail.index].dataset)
      addView(JSON.parse(suggestedInit.listElements[evt.detail.index].dataset.value))
    })
  }
  if (subs.other.length) {
    const otherInit = new mdc.list.MDCList(document.getElementById('other-list'))
    otherInit.singleSelection = true;
  }
}



function hideBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.add('hidden');
}

function showBottomNav() {
  document.querySelector('.mdc-bottom-navigation').classList.remove('hidden');
}



function toggleCardHeight(toggle, cardSelector) {
  const el = document.getElementById('map-view');
  const card = document.getElementById(cardSelector);
  if (toggle) {
    el.classList.add('hidden')
    card.classList.remove('hidden');
    card.style.height = '100%';
    document.getElementById('app-header').classList.add('hidden')

  } else {
    el.classList.remove('hidden');
    document.getElementById('selection-box').classList.remove('hidden');
    card.classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden')

  }
}

function addSnapControl(map, office) {
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();

  var snapControlDiv = document.createElement('div');
  var snapControl = new TakeSnap(snapControlDiv, office);
  snapControlDiv.index = 2;
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(snapControlDiv);


  var addControlDiv = document.createElement('div');
  var addControl = new Add(addControlDiv);
  addControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(addControlDiv);

}

function Add(el) {
  const add = new Fab('add').getButton();
  add.root_.id = 'add';
  add.root_.classList.add('custom-control', 'right', 'mdc-theme--primary-bg', 'mb-10')
  el.appendChild(add.root_);
  add.root_.addEventListener('click', function () {
    console.log('clicked')
    // localStorage.setItem('snap_office', office)
    // AndroidInterface.startCamera();
    // setFilePath();
  });

}

function getAvailbleSubs(venue) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['subscriptions']);
    const store = tx.objectStore('subscriptions');
    const index = store.index('count');
    const result = {
      suggested: [],
      other: []
    };
    index.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.office !== venue.office) {
        cursor.continue();
        return;
      }
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      let found = false;
      Object.keys(cursor.value.attachment).forEach(function (attachmentName) {
        if (cursor.value.attachment[attachmentName].type === venue.template) {
          result.suggested.push(cursor.value)
          found = true;
        }
      })
      if (!found) {
        result.other.push(cursor.value)
      }
      cursor.continue();
    }
    tx.oncomplete = function () {
      resolve(result)
    }

  })
}

function checkForVenueSubs(office) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['subscriptions']);
    const store = tx.objectStore('subscriptions');
    const index = store.index('count')
    const result = {
      suggested: [],
      other: []
    };

    index.openCursor(null, 'prev').onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return
      if (cursor.value.template === 'check-in') {
        cursor.continue();
        return;
      }
      if (cursor.value.office !== office) {
        cursor.continue();
        return;
      }

      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      if (!cursor.value.venue.length) {
        result.other.push(cursor.value);
      } else {
        result.suggested.push(cursor.value)
      }
      cursor.continue();
    }
    tx.oncomplete = function () {

      resolve(result)
    }


  })
}

function mapDom() {
  return `
  <div id='map-view' class=''>
    <div id='map'></div>
    <div  class="overlay selection-box-auto hidden" id='selection-box'>
              <aside class="social" tabindex="-1" role="dialog" aria-labelledby="modal-label" aria-hidden="true">
                <div class="card__primary">
                  <h2 class="demo-card__title mdc-typography mdc-typography--headline6 margin-auto" id='card-primary'>
                  </h2>

                </div>
                <div role="progressbar"
                  class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed"
                  id='check-in-prog'>
                  <div class="mdc-linear-progress__buffering-dots"></div>
                  <div class="mdc-linear-progress__buffer"></div>
                  <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
                    <span class="mdc-linear-progress__bar-inner"></span>
                  </div>
                  <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
                    <span class="mdc-linear-progress__bar-inner"></span>
                  </div>
                </div>

                <div class="content-body">

                </div>
                <div id='submit-cont'>
                </div>
              </aside>
            </div>

  `
}






function snapView() {
  // localStorage.setItem('snap_office', office)
  AndroidInterface.startCamera();
}


function setFilePath(base64) {
  document.querySelector('.mdc-bottom-navigation').classList.add('hidden');
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  const header = getHeader('app-header', backIcon, '');
  history.pushState(['snapView'], null, null)
  const url = `data:image/jpg;base64,${base64}`
  document.getElementById('app-current-panel').innerHTML = `
  
<div id='snap' class="snap-bckg" style="background-image: url(${url}); padding: 0px; overflow: hidden; background-size: cover;">
<div class="form-meta snap-form">
  <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
      <textarea
      class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100" autofocus="true"></textarea></div>
      <button id='snap-submit' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"
    style="z-index: 9;">
    <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    </button>
</div>
</div>
  `

  const content = document.getElementById('snap')
  const textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'))
  const submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'))


  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px'
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = (this.scrollHeight - 20) + "px";
    }
  });
  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;
    getUniqueOfficeCount().then(function (offices) {
      if (!offices.length) return;
      if (offices.length == 1) {
        getSubscription(offices[0], 'check-in').then(function (sub) {
          sub.attachment.Photo.value = url
          sub.attachment.Comment.value = textValue;
          progressBar.open();
          requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
            homeView(selectedSubs)
            snacks('Check-In Created')
          }).catch(function () {
            snacks(error.message)

          })
        })
        return
      }
      if (offices.length > 1) {
        const template = `<ul class='mdc-list' role='radiogroup' id='dialog-office'>
              ${offices.map(function(office,idx){
                return ` <li class="mdc-list-item" role="radio" aria-checked="${idx ? 'false':'true'}" tabindex=${idx ? '':'0'}>
                <span class="mdc-list-item__graphic">
                  <div class="mdc-radio">
                    <input class="mdc-radio__native-control"
                          type="radio"
                          id='demo-list-radio-item-${idx}'
                          name="demo-list-radio-item-group"
                          value="1">
                    <div class="mdc-radio__background">
                      <div class="mdc-radio__outer-circle"></div>
                      <div class="mdc-radio__inner-circle"></div>
                    </div>
                  </div>
                </span>
                <label class="mdc-list-item__text" for="demo-list-radio-item-${idx}">${office}</label>
              </li>`
              }).join("")}
            
            <ul>`
        const dialog = new Dialog('Choose Office', template).create();
        const list = new mdc.list.MDCList(document.getElementById('dialog-office'))
        dialog.open();
        dialog.listen('MDCDialog:opened', () => {
          list.layout();
          list.singleSelection = true
        });
        dialog.listen('MDCDialog:closed', function (evt) {
          if (evt.detail.action !== 'accept') return;

          getSubscription(offices[list.selectedIndex], 'check-in').then(function (sub) {
            sub.attachment.Photo.value = url
            sub.attachment.Comment.value = textValue;
            progressBar.open();
            requestCreator('create', setVenueForCheckIn('', sub)).then(function () {
              homeView(selectedSubs)
              snacks('Check-In Created')

            }).catch(function () {
              snacks(error.message)
            })
          })
        })
      }
    })

  })


  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    content.style.padding = '0px'
    content.style.overflow = 'hidden'
    content.classList.add('snap-bckg');

    if (orientation == 'potrait') {
      content.style.backgroundSize = 'cover'
    }
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;

}

function mdcDefaultSelect(data, label, id, option) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  ${data.map(function(value){
    return ` <option value='${value}'>
    ${value}
    </option>`
}).join("")}
${option}

  </select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}


function mdcSelectVenue(venues, label, id) {
  let float;
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">

  <option value=${JSON.stringify('1')}>New Venue</option>
  ${venues.map(function(value){
    return ` <option value='${JSON.stringify(value)}'>
    ${value.location}
    </option>`
}).join("")}
  </select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}



function getOrientation(image) {
  if (image.width > image.height) return 'landscape'
  if (image.height > image.width) return 'potrait'
  if (image.width == image.height) return 'square'
}

function focusMarker(map, latLng, zoom) {
  map.setZoom(zoom);
  map.panTo(latLng);
}

function GetOffsetBounds(latlng, offset) {
  const radius = 6378
  const d = (180 / Math.PI);
  this.latLng = latlng
  this.ratio = (offset / radius) * d;
  this.radioLon = (this.ratio) / Math.cos(this.latLng.latitude * Math.PI / 180)
}

GetOffsetBounds.prototype.north = function () {
  return this.latLng.latitude + this.ratio
}
GetOffsetBounds.prototype.south = function () {
  return this.latLng.latitude - this.ratio
}
GetOffsetBounds.prototype.east = function () {
  return this.latLng.longitude + this.radioLon
}
GetOffsetBounds.prototype.west = function () {
  return this.latLng.longitude - this.radioLon
}

function getMapBounds(map) {
  const northEast = map.getBounds().getNorthEast()
  const southWest = map.getBounds().getSouthWest()

  return {
    ne: [northEast.lat(), northEast.lng()],
    sw: [southWest.lat(), southWest.lng()]
  }
}

function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {
    var markerImage = new google.maps.MarkerImage(
      './img/m.png',
      new google.maps.Size(30, 30), //size
      null, //origin
      null, //anchor
      new google.maps.Size(30, 30) //scale
    );
    var infowindow = new google.maps.InfoWindow();
    const result = []
    const req = indexedDB.open(firebase.auth().currentUser.uid);
    let lastOpen;
    let lastCursor;
    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
    const bounds = map.getBounds()
    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!cursor.value.location || !cursor.value.latitude || !cursor.value.longitude) {
        cursor.continue();
        return;
      };
      if (lastCursor) {
        if (lastCursor.lat === cursor.value.latitude && lastCursor.lng === cursor.value.longitude && lastCursor.location === cursor.value.location) {
          cursor.continue();
          return;
        }
      }

      var marker = new google.maps.Marker({
        position: {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        },

        icon: {
          url: './img/m.png',
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        },
        id: cursor.value.activityId,
        value: JSON.stringify(cursor.value)
      });
      if (calculateDistanceBetweenTwoPoints(location, {
          latitude: cursor.value.latitude,
          longitude: cursor.value.longitude
        }) < 0.5) {
        marker.setMap(map);
        const content = `<span>${cursor.value.activityId}</span>`
        google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
          return function () {
            if (lastOpen) {
              lastOpen.close();
            };
            infowindow.setContent(content);
            infowindow.open(map, marker);
            lastOpen = infowindow;
          };
        })(marker, content, infowindow));
        result.push(cursor.value)
        bounds.extend(marker.getPosition())
      } else {
        console.log(calculateDistanceBetweenTwoPoints({
          latitude: location.latitude,
          longitude: location.longitude
        }, {
          latitude: cursor.value.latitude,
          longitude: cursor.value.longitude
        }))
        console.log(cursor.value)
      }
      lastCursor = {
        lat: cursor.value.latitude,
        lng: cursor.value.longitude,
        location: cursor.value.location
      };
      cursor.continue();
    }
    tx.oncomplete = function () {
      map.fitBounds(bounds);
      return resolve(result)
    }
  })
}