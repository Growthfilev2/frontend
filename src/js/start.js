var placeService;
var placeResult;
var searchPlaceMarkers = [];
var placeSearchField;
var map;

function newUserLandingpage(geopoint = history.state[1]) {
 
    const header = getHeader('app-header', '', '');
    header.root_.classList.remove('hidden');
    document.getElementById('step-ui').innerHTML = ''
    header.listen('MDCTopAppBar:nav', handleNav);
    progressBar.close();
    const appEl = document.getElementById('app-current-panel');
    appEl.innerHTML = '';

    const container = createElement('div', {
        className: 'landing-page-container text-center'
    })
    container.innerHTML = `<div class='text-box'>
    <p class='mdc-typography--headline5 mt-0'>Welcome to GROWTHFILE, Lorem ipsum</p>
  </div>`

    const cardBoxCont = createElement('div', {
        className: 'card-box-container'
    })

    const card = createElement('div', {
        className: 'selection-box mdc-card  mdc-card--outlined'
    })
    card.innerHTML = `<div class='content'>
    <div class='icon-container'>
      <i class='material-icons mdc-theme--primary'>search</i>
    </div>
    <div class='text'>
      <p class='mdc-typography--body1 mt-10 mb-0'>Search Office</p>
    </div>
  </div>`

    card.addEventListener('click', function () {
        history.pushState(['searchOffice', geopoint], null, null)
        searchOffice(geopoint);
    });

    cardBoxCont.appendChild(card)
    container.appendChild(cardBoxCont)
    appEl.appendChild(container);

}

function searchOffice(geopoint = history.state[1]) {
    const appEl = document.getElementById('app-current-panel');
    appEl.innerHTML = `<div class='search-map-cont mdc-top-app-bar--fixed-adjust'>

     <div class='search-container'>
        ${textField({
            id: 'search-address',
            label: 'Search',
            leadingIcon:'search',
            trailingIcon:'clear',
            autocomplete:'organization'
        })}
      <div class='search-result-container'>
        <div role="progressbar" id='search-progress-bar' class="mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed">
          <div class="mdc-linear-progress__buffering-dots"></div>
          <div class="mdc-linear-progress__buffer"></div>
          <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
            <span class="mdc-linear-progress__bar-inner"></span>
          </div>
          <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
            <span class="mdc-linear-progress__bar-inner"></span>
          </div>
        </div>
        
         <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list' id='place-query-ul'>
         </ul>
      </div>
     </div>
    <div id='map-search'></div>
     
    </div>`;


    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">Search Office</span>
    `
    const header = getHeader('app-header', backIcon, '');
    header.root_.classList.remove('hidden');

    const center = {
        lat: geopoint.latitude,
        lng: geopoint.longitude
    }

    map = new google.maps.Map(document.getElementById('map-search'), {
        zoom: 15,
        center: center,
        disableDefaultUI: true
    });

    var marker = new google.maps.Marker({
        position: center,
        icon: './img/bluecircle.png',
        map: map
    });

    var radiusCircle = new google.maps.Circle({
        strokeColor: '#89273E',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#89273E',
        fillOpacity: 0.35,
        map: map,
        center: center,
        radius: geopoint.accuracy < 100 ? geopoint.accuracy * 2 : geopoint.accuracy
    });

    placeSearchField = new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'));
    placeSearchField.focus();
    placeSearchField.trailingIcon_.root_.addEventListener('click', function () {
        placeSearchField.value = ''
        placeSearchField.trailingIcon_.root_.classList.add('hidden')
        document.getElementById('place-query-ul').innerHTML = ''
        placeSearchField.focus();
        map.setCenter(center)
        clearPlaceMarkers();
        clearPlaceCustomControl();
    });

    placeSearchField.trailingIcon_.root_.classList.add('hidden')
    const placeRequesParam = {
        query: '',
        fields: ['name', 'geometry', 'place_id', 'formatted_address', 'types', 'icon']
    }

    placeSearchField.input_.addEventListener('input', function (event) {
        if (!event.target.value.trim()) return
        placeSearchField.trailingIcon_.root_.classList.remove('hidden')
        var searchEvent = new CustomEvent('searchPlaces', {
            detail: {
                value: event.target.value,
                placeRequesParam: placeRequesParam,
                geopoint: geopoint
            }
        });
        window.dispatchEvent(searchEvent);
    });
}

var searchDebounde = debounce(function (event) {

    const placeRequesParam = event.detail.placeRequesParam;
    const value = event.detail.value;
    const geopoint = event.detail.geopoint
    placeRequesParam.query = value;
    const ul = new mdc.list.MDCList(document.getElementById('place-query-ul'))
    var infowindow = new google.maps.InfoWindow();
    const searchProgress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('search-progress-bar'))
    searchProgress.open();

    placeService = new google.maps.places.PlacesService(map)
    placeService.findPlaceFromQuery(placeRequesParam, function (results, status) {
        ul.root_.innerHTML = ''
        searchProgress.close();
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            if (results.length == 1) {
                placeResult = results[0]
                createPlaceMarker(infowindow);
                showPlaceBox(map);
                return;
            }

            results.forEach(function (resultVal) {

                const li = searchPlaceResultList(resultVal.name, resultVal.formatted_address);
                li.addEventListener('click', function () {
                    placeResult = resultVal
                    ul.root_.innerHTML = ''
                    placeSearchField.value = placeResult.name
                    showPlaceBox(map);
                    createPlaceMarker(infowindow)

                });
                ul.root_.appendChild(li);
            });
            // map.setCenter(results[0].geometry.location);
            return;
        }

        clearPlaceCustomControl();
        clearPlaceMarkers()
        map.setCenter({
            lat: geopoint.latitude,
            lng: geopoint.longitude
        });
        ul.root_.appendChild(createLi(`No result found for "${value}"`));
    })
}, 1000, false)

window.addEventListener('searchPlaces', searchDebounde)

function CenterControl(controlDiv) {

    var controlUI = createElement('div', {
        className: 'mdc-card place-box'
    });
    controlUI.innerHTML = `
    <div class='mdc-card__primary-action'>
      <div class='demo-card__primary'>
      <ul class='mdc-list'>
        <li class='mdc-list-item pl-0 pr-0'>
          <h2 class='demo-card__title mdc-typography mdc-typography--headline6'>${placeResult.name}</h2>
          <span class='mdc-list-item__meta material-icons'>keyboard_arrow_up</span
        </li>
      </ul>  
        <div class='mdc-typography mdc-typography--body2 pt-0 pb-20 mb-10'>
            ${placeResult.formatted_address}
        </div>
      </div>
    </div>`

    controlDiv.appendChild(controlUI);
}

function expandPlaceBox() {

    placeService.getDetails({
        placeId: placeResult.place_id,
        fields: ['international_phone_number', 'photos']
    }, function (placeDetail, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            placeResult.international_phone_number = placeDetail.international_phone_number || ''
            placeResult.photos = placeDetail.photos || []
        }
        const parentEl = document.getElementById('app-current-panel');
        const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">${placeResult.name}</span>
        `
        const header = getHeader('app-header', backIcon, '');
        header.root_.classList.remove('hidden');
        // header.listen('MDCTopAppBar:nav', handleNav);

        parentEl.innerHTML = `<div class='expand-box mdc-top-app-bar--fixed-adjust'>
        <div class='mdc-card'>
            <div class='mdc-card__primary-action'>
               <div class='mdc-card__media mdc-card__media--16-9' style='background-image:url("${placeResult.photos.length ? placeResult.photos[0].getUrl() : './img/business.svg'}")'>
                ${placeResult.photos.length > 1 ? ` <span class="prev material-icons" id='prev-image'>navigate_before</span>
                <span class="next material-icons" id='next-image'>navigate_next</span>` :'' }
            </div>
                
                <div class='demo-card__primary'>
                  <h2 class='demo-card__title mdc-typography mdc-typography--headline6'>${placeResult.name}</h2>
                </div>
                <div class="mdc-chip-set" role="grid"> 
                  ${placeResult.types.map(function(type){
                    return `<div class="mdc-chip" role="row">
                    <div class="mdc-chip__ripple"></div>
                    <span role="gridcell">
                      <span role="button" tabindex="0" class="mdc-chip__text">${type}</span>
                    </span>
                  </div>`
                  }).join("")} 
                </div>
                <li class='mdc-list-item address-list'>
                  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">room</span>
                  ${placeResult.formatted_address}
                </li>
                <ul class='mdc-list'>
                  ${placeResult.international_phone_number ? ` <li class='mdc-list-item'>
                    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">phone</span>
                      ${placeResult.international_phone_number}
                    </li>` : ''}
                    <li class='mdc-list-divider'></li>
                </ul>
                  <div class='owner-confirm' id='owner-action-cont'>


                  </div>
                  </div>
                  </div>
                  ${createExtendedFab('check','CONFIRM','confirm-btn',true).outerHTML}
      </div>`


        const confirmFab = document.getElementById('confirm-btn');
        confirmFab.addEventListener('click', function () {
            progressBar.open();
            confirmFab.classList.add('mdc-fab--exited')
            // requestCreator('search', {
            //     query: `template=office&attachmentName=${placeResult.name}`
            // }).then(function (searchResponse) {
            progressBar.close();
            // if (true) {
            //     giveSubscriptionInit();
            //     return;
            // }
            
            const ownerCont = document.getElementById("owner-action-cont");
            ownerCont.innerHTML = `
            <div class='text-center'>
                <h3 class='mdc-typography--headline6 mt-0'>Do you want to create a company ? </h3>
                    ${createButton('Create office','business','create-office-btn').outerHTML}
            </div>
            `
            ownerCont.classList.add('pb-20')
            document.getElementById('create-office-btn').classList.add('mdc-button--raised')
            document.getElementById('create-office-btn').addEventListener('click',function(){
                firebase.auth().currentUser.getIdTokenResult().then(function(idTokenResult){
                    console.log(idTokenResult);
                    const isUserAdminOfOffice = isAdmin(idTokenResult,placeResult.name);
                    createOfficeInit(isUserAdminOfOffice);
                }).catch(function(error){
                    createOfficeInit();
                })
            })
            window.scrollTo(0,document.body.scrollHeight);
            
            // }).catch(function (error) {
            //     console.log(error)
            //     progressBar.close();
            // })
        })

        const nextImageEl = document.getElementById('next-image')
        const prevImageEl = document.getElementById('prev-image');
        if (nextImageEl && prevImageEl) {
            let index = 0;
            nextImageEl.addEventListener('click', function () {
                index++
                if (index >= placeResult.photos.length) {
                    index = 0
                }
                loadImageInPlaceBox(placeResult.photos[index].getUrl())
            })
            prevImageEl.addEventListener('click', function () {
                index--
                if (index < 0) {
                    index = placeResult.photos.length - 1
                }
                loadImageInPlaceBox(placeResult.photos[index].getUrl())
            })
        };
    });
}

function isAdmin(idTokenResult,officeName){
    if(!idTokenResult.claims.hasOwnProperty('admin')) return;
    if(!Array.isArray(idTokenResult.claims.admin)) return;
    if(!idTokenResult.claims.admin.length) return;
    if(idTokenResult.claims.admin.indexOf(officeName) == -1) return;
    return true;
}


function createOfficeInit(isAdmin) {

    const template = {
        "user": {
            details:{
                photoURL: firebase.auth().currentUser.photoURL,
                displayName: firebase.auth().currentUser.displayName,
                phoneNumber: firebase.auth().currentUser.phoneNumber
            },
            isAdmin:true
        },
        "hidden": 0,
        "canEditRule": "NONE",
        "schedule": [
            "Date Of Establishment",
            "Trial Period"
        ],
        "attachment": {
            "Registered Office Address": {
                "type": "string",
                "value": placeResult.formatted_address
            },
            "Company Logo": {
                "value": "",
                "type": "string"
            },
            "Youtube ID": {
                "type": "string",
                "value": ""
            },
            "Usage": {
                "type": "string",
                "value": ""
            },
            "Branch Place Supported Types": {
                "type": "string",
                "value": ""
            },
            "First Day Of Monthly Cycle": {
                "type": "number",
                "value": ""
            },
            "Timezone": {
                "type": "string",
                "value": ""
            },
            "Second Contact": {
                "type": "phoneNumber",
                "value": ""
            },
            "First Day Of Reimbursement Cycle": {
                "type": "number",
                "value": ""
            },
            "GST Number": {
                "type": "string",
                "value": ""
            },
            "Description": {
                "type": "string",
                "value": ""
            },
            "Short Description": {
                "type": "string",
                "value": ""
            },
            "First Contact": {
                "type": "phoneNumber",
                "value": ""
            },
            "Name": {
                "type": "string",
                "value": placeResult.name
            },
            "Customer Place Supported Types": {
                "value": "",
                "type": "string"
            }
        },
        "template": "office",
     
        "venue": []
    }
    history.pushState(['addView'], null, null);
    addView(template);
}

function giveSubscriptionInit() {

    const template = {
        "schedule": [],
        "assigness": [],
        "attachment": {
            "Subscriber": {
                "value": firebase.auth().currentUser.phoneNumber,
                "type": "phoneNumber"
            },
            "Template": {
                "value": "check-in",
                "type": "string"
            }
        },
        "template": "subscription",
        "venue": [],
        "meta": {
            "subscriberDetails": {
                photoURL: firebase.auth().currentUser.photoURL,
                displayName: firebase.auth().currentUser.displayName,
                phoneNumber: firebase.auth().currentUser.phoneNumber
            }
        }
    };

    history.pushState(['addView'], null, null);
    addView(template);

}

function loadImageInPlaceBox(src) {
    const el = document.querySelector('.expand-box .mdc-card__media');
    if (el) {
        el.style.backgroundImage = `url("${src}")`
    }
}

function clearPlaceCustomControl() {
    if (map.controls[google.maps.ControlPosition.BOTTOM_CENTER].length) {
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].clear();
    }
}


function showPlaceBox() {
    clearPlaceCustomControl()
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, placeResult);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
    placeSearchField.input_.blur()
    centerControlDiv.addEventListener('click', function () {
        history.pushState(['expandPlaceBox'], null, null);
        expandPlaceBox();
    })
}

function searchPlaceResultList(primaryText, secondaryText, icon) {
    const li = createElement('li', {
        className: 'mdc-list-item'
    });
    li.innerHTML = `<span class='mdc-list-item__graphic material-icons'>${icon ? icon :'location_on'}</span>
      <span class='mdc-list-item__text'>
          <span class='mdc-list-item__primary-text'>${primaryText}</span>
          <span class='mdc-list-item__secondary-text'>${secondaryText}</span>
      </span>`
    return li;

}

function clearPlaceMarkers() {
    searchPlaceMarkers.forEach(function (oldMarker) {
        oldMarker.setMap(null);
    });
    searchPlaceMarkers = [];
}

function createPlaceMarker(infowindow) {
    clearPlaceMarkers()
    var marker = new google.maps.Marker({
        map: map,
        position: placeResult.geometry.location
    });

    map.setCenter(new google.maps.LatLng(placeResult.geometry.location.lat(), placeResult.geometry.location.lng()))
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(placeResult.name);
        infowindow.open(map, this);
    });
    searchPlaceMarkers.push(marker);
}