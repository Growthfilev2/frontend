var placeService;
var placeResult;
var searchPlaceMarkers = [];
var placeSearchField;
var map;


function searchOffice(geopoint = history.state[1]) {
    const appEl = document.getElementById('app-current-panel');
    appEl.innerHTML = `<div class='search-map-cont mdc-top-app-bar--fixed-adjust'>

     <div class='search-container'>
        ${textField({
            id: 'search-address',
            label: 'Search for your office location',
            leadingIcon:'search',
            trailingIcon:'clear',
            autocomplete:'organization'
        })}
      <div class='search-result-container'>
        
        
         <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list' id='place-query-ul'>
         </ul>
      </div>
     </div>
    <div id='map-search'></div>
     
    </div>`;


    const header = setHeader('<span class="mdc-top-app-bar__title">Search Office</span>', '');
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
        fields: ['name', 'geometry', 'place_id', 'formatted_address', 'types']
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
    const ulEl = document.getElementById('place-query-ul');
    let ul;
    if(ulEl) {
      ul = new mdc.list.MDCList(ulEl)
    }
    var infowindow = new google.maps.InfoWindow();
    progressBar.open();

    placeService = new google.maps.places.PlacesService(map)
    placeService.findPlaceFromQuery(placeRequesParam, function (results, status) {
        if(ul) {
            ul.root_.innerHTML = ''
        }
        progressBar.close();
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
                    if(ul) {
                        ul.root_.innerHTML = ''
                    }
                    placeSearchField.value = placeResult.name
                    showPlaceBox(map);
                    createPlaceMarker(infowindow)

                });
                if(ul) {
                    ul.root_.appendChild(li);

                }
            });

            return;
        }

        clearPlaceCustomControl();
        clearPlaceMarkers()
        map.setCenter({
            lat: geopoint.latitude,
            lng: geopoint.longitude
        });
        if(ul) {

            ul.root_.appendChild(createLi(`No result found for "${value}"`));
        }
    })
}, 1000, false)

window.addEventListener('searchPlaces', searchDebounde)

function CenterControl(controlDiv) {

    var controlUI = createElement('div', {
        className: 'mdc-card place-box mdc-elevation--z24'
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
        console.log(placeDetail)
        const parentEl = document.getElementById('app-current-panel');
        parentEl.classList.add('mdc-top-app-bar--fixed-adjust')
        const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">${placeResult.name}</span>
        `
        const clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='close-placebox'>clear</button>`
        const header = setHeader(backIcon, clearIcon);
        header.root_.classList.remove('hidden');



        parentEl.innerHTML = `<div class='expand-box up'>
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
                </ul>
                 
                  </div>
                  </div>
                  ${createExtendedFab('check','CONFIRM','confirm-btn',true).outerHTML}
      </div>`

        document.getElementById('close-placebox').addEventListener('click', function () {
            document.querySelector('.expand-box').classList.add('down')
            document.querySelector('.expand-box').classList.remove('up')
            setTimeout(function () {
                history.back();
            }, 500)
        })

        const confirmFab = document.getElementById('confirm-btn');
        new mdc.ripple.MDCRipple(confirmFab);

        confirmFab.addEventListener('click', function () {

            confirmFab.classList.add('mdc-fab--exited')
            requestCreator('searchOffice', {
                query: placeResult.place_id
            }).then(function (searchResponse) {

                if(!searchResponse.length) {
                    var dialog = new Dialog(`${placeResult.name} not found`,'Do you want to create a new office ? ').create();
                    dialog.buttons_[0].textContent = 'cancel'
                    dialog.buttons_[1].textContent = 'create new office';
                    dialog.open();
                    dialog.listen('MDCDialog:closed',function(dialogEvent){
                        if(dialogEvent.detail.action !== 'accept') {
                            confirmFab.classList.remove('mdc-fab--exited')
                            return;
                        }
                        createOfficeInit();
                    })
                    return;
                };

                const officeContent = `<ul class='mdc-list  mdc-list--two-line'  id='office-selection-list'>
                    ${searchResponse.map(function(response,index){
                        return `<li class='mdc-list-item pl-0 pr-0' tabindex="-1">
                            <span class='mdc-list-item__text'>
                                <span class='mdc-list-item__primary-text'>${response.name}</span>
                                <span class='mdc-list-item__secondary-text'>${response.registeredOfficeAddress}</span>
                            </span>
                            <span class="mdc-list-item__graphic mdc-list-item__meta">
                            <div class="mdc-checkbox">
                                <input type="checkbox"
                                        class="mdc-checkbox__native-control"
                                        id="demo-list-checkbox-item-${index}" />
                                <div class="mdc-checkbox__background">
                                  <svg class="mdc-checkbox__checkmark"
                                        viewBox="0 0 24 24">
                                    <path class="mdc-checkbox__checkmark-path"
                                          fill="none"
                                          d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                                  </svg>
                                  <div class="mdc-checkbox__mixedmark"></div>
                                </div>
                              </div>
                        </span>
                        </li>`
                    }).join("")}
                </ul> 
                `

           
    
                var dialog = new Dialog('Choose office', officeContent).create();
                dialog.buttons_[0].textContent = 'cancel'
                dialog.buttons_[1].textContent = 'create new office';
                dialog.open();
                const list = new mdc.list.MDCList(document.getElementById('office-selection-list'));
                list.singleSelection = true;
                let selectedListIndex;
                
                dialog.listen('MDCDialog:opened',function(openEvent){
                    list.layout();
                    list.listen('MDCList:action',function(listEvent){
                        console.log(listEvent);
                        console.log(list)
                        if(!list.selectedIndex.length) {
                            selectedListIndex = null;
                            dialog.buttons_[1].textContent = 'create new office';
                        }
                        else {
                            selectedListIndex = listEvent.detail.index;
                            list.selectedIndex = [listEvent.detail.index]
                            dialog.buttons_[1].textContent = 'JOIN';
                        }
                    });
                })
                dialog.listen('MDCDialog:closed', function (dialogEvent) {
                    if (dialogEvent.detail.action !== 'accept') {
                        confirmFab.classList.remove('mdc-fab--exited')
                        return;
                    }
                    if(list.selectedIndex.length) {
                        giveSubscriptionInit(searchResponse[selectedListIndex].name);
                        return
                    }

                    createOfficeInit();
                })
               
            
            }).catch(function (error) {
                console.log(error)

                confirmFab.classList.remove('mdc-fab--exited')
            })
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

function isAdmin(idTokenResult) {
    if (!idTokenResult.claims.hasOwnProperty('admin')) return;
    if (!Array.isArray(idTokenResult.claims.admin)) return;
    if (!idTokenResult.claims.admin.length) return;
    return true;
}


function createOfficeInit() {
    const template = {
        'template': 'office',
        'firstContact': '',
        'secondContact': '',
        'name': placeResult.name,
        'placeId': placeResult.place_id,
        'registeredOfficeAddress': placeResult.formatted_address,
    }
    history.pushState(['addView'], null, null);
    addView(template);
}

function giveSubscriptionInit(name = placeResult.name) {
    const template = {
        "assignees": [],
        "template": "subscription",
        "office": name
    };
    if(history.state[0] === 'addView') {
          history.replaceState(['addView'],null,null);
    } 
    else {
        history.pushState(['addView'], null, null);
    }
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
    console.log(placeResult)
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
    swipe(centerControlDiv, function (swipeEvent) {
        console.log(swipeEvent)
        if (swipeEvent.direction === 'up') {
            history.pushState(['expandPlaceBox'], null, null);
            expandPlaceBox();
            removeSwipe()
        }
    });
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