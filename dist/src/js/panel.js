function listView(pushState) {
  // document.body.style.backgroundColor = 'white'

  if (document.querySelector('.init-loader')) {
    document.querySelector('.init-loader').remove();
  }

  if (pushState) {
    history.pushState(['listView'], null, null);
  }

  listPanel();

  var dbName = localStorage.getItem('dbexist');

  var req = indexedDB.open(dbName);

  req.onsuccess = function () {
    var db = req.result;
    var rootTx = db.transaction(['root'], 'readwrite');
    var rootStore = rootTx.objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      var officeRecord = event.target.result;

      if (!document.querySelector('.mdc-drawer--temporary')) {
        initMenu(db, officeRecord.offices);
      }
      creatListHeader('Recent');
      fetchDataForActivityList(db);
    };
  };
}

function fetchDataForActivityList(db) {
  var activityDom = '';
  var activityStoreTx = db.transaction('activity');
  var activityObjectStore = activityStoreTx.objectStore('activity');
  var activityVisibleIndex = activityObjectStore.index('timestamp');
  var currOffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice;
  activityVisibleIndex.openCursor(null, 'prev').onsuccess = function (event) {
    var cursor = event.target.result;
    if (!cursor) {
      var yOffset = window.pageYOffset;
      setTimeout(function () {
        appendActivityListToDom(activityDom, true);
        createActivityIcon(db);
        scrollToActivity(yOffset);
      }, 1500);
      return;
    }

    if (currOffice === 'all') {
      if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
        createActivityList(db, cursor.value).then(function (li) {
          activityDom += li;
        });
      }
    } else if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0 && cursor.value.office === currOffice) {

      createActivityList(db, cursor.value).then(function (li) {

        activityDom += li;
      });
    }

    cursor.continue();
  };
}

function createActivityList(db, data, append) {
  return new Promise(function (resolve) {
    getCount(db, data.activityId).then(function (count) {
      getCommentUndUser(db, data.activityId, data.creator).then(function (meta) {
        getCreatorDetails(db, meta).then(function (metaWiwthData) {
          metaWiwthData.count = count;
          resolve(activityListUI(data, metaWiwthData, append));
        });
      });
    });
  });
}

function getCount(db, id) {
  return new Promise(function (resolve) {
    var activityCount = db.transaction('activityCount', 'readonly').objectStore('activityCount');
    activityCount.get(id).onsuccess = function (event) {
      var record = event.target.result;
      if (!record) {
        resolve(0);
      } else {
        resolve(record.count);
      }
    };
  });
}

function getCommentUndUser(db, id, creator) {
  var meta = {
    creator: creator,
    comment: '',
    commentUser: ''
  };

  return new Promise(function (resolve) {

    var addendumObjStore = db.transaction('addendum').objectStore('addendum').index('activityId');

    addendumObjStore.openCursor(id, 'prev').onsuccess = function (addendumstore) {
      var addendumCursor = addendumstore.target.result;
      if (!addendumCursor) {
        resolve(meta);
      } else if (addendumCursor.value.isComment) {
        meta.comment = addendumCursor.value.comment;
        readNameFromNumber(db, addendumCursor.value.user).then(function (nameOrNum) {
          meta.commentUser = nameOrNum;
          resolve(meta);
        });
      } else {
        meta.comment = addendumCursor.value.comment;
        resolve(meta);
      }
    };
  });
}

function getCreatorDetails(db, meta) {

  return new Promise(function (resolve) {

    if (meta.creator === firebase.auth().currentUser.phoneNumber) {
      meta.creator = {
        photo: firebase.auth().currentUser.photoURL || './img/empty-user.jpg',
        number: meta.creator
      };
      resolve(meta);
    } else {

      var userObjStore = db.transaction('users').objectStore('users');

      userObjStore.get(meta.creator).onsuccess = function (userstore) {
        var record = userstore.target.result;

        if (record && record.hasOwnProperty('photoURL')) {
          meta.creator = {
            photo: userstore.target.result.photoURL || './img/empty-user.jpg',
            number: meta.creator
          };
        } else {
          meta.creator = {
            photo: './img/empty-user.jpg',
            number: meta.creator
          };
        }

        resolve(meta);
      };
    }
  });
}

function activityListUI(data, metaData, append) {

  var li = document.createElement('li');
  li.dataset.id = data.activityId;
  li.setAttribute('onclick', 'localStorage.setItem(\'clickedActivity\',this.dataset.id);conversation(this.dataset.id,true)');

  var creator = document.createElement("img");
  creator.dataset.number = metaData.creator.number;
  creator.className = 'mdc-list-item__graphic material-icons';
  creator.setAttribute('onerror', 'handleImageError(this)');
  creator.src = metaData.creator.photo;

  var leftTextContainer = document.createElement('span');
  leftTextContainer.classList.add('mdc-list-item__text');
  var activityNameText = document.createElement('span');

  activityNameText.className = 'mdc-list-item__primary-text bigBlackBold';

  activityNameText.textContent = data.activityName;
  var lastComment = document.createElement('span');
  lastComment.className = 'mdc-list-item__secondary-text';
  if (metaData.commentUser) {

    lastComment.textContent = metaData.commentUser + ' : ' + metaData.comment;
  } else {
    lastComment.textContent = '' + metaData.comment;
  }

  leftTextContainer.appendChild(activityNameText);
  leftTextContainer.appendChild(lastComment);

  var metaTextContainer = document.createElement('span');
  metaTextContainer.classList.add('mdc-list-item__meta');
  if (metaData.count !== 0) {

    var countDiv = document.createElement('div');

    var countSpan = document.createElement('span');
    countSpan.textContent = metaData.count;
    countSpan.className = 'count mdc-meta__custom-text';
    countDiv.appendChild(countSpan);
    li.classList.add('mdc-list-item', 'activity--list-item', 'count-active', 'mdc-elevation--z1');
    metaTextContainer.appendChild(countDiv);
  } else {

    var timeCustomText = document.createElement('div');
    timeCustomText.className = 'mdc-meta__custom-text';
    timeCustomText.style.width = '80px';
    timeCustomText.style.fontSize = '14px';
    timeCustomText.textContent = moment(data.timestamp).calendar();
    li.classList.add('mdc-list-item', 'activity--list-item', 'mdc-elevation--z1');
    metaTextContainer.appendChild(timeCustomText);
  }

  var metaTextActivityStatus = document.createElement('span');
  metaTextActivityStatus.classList.add('mdc-list-item__secondary-text', 'status-in-activity', '' + data.status);
  var statusIcon = document.createElement('i');
  statusIcon.className = 'material-icons';

  var cancelIcon = document.createElement('i');
  cancelIcon.classList.add('status-cancel', 'material-icons');
  cancelIcon.appendChild(document.createTextNode('clear'));

  var confirmedIcon = document.createElement('i');
  confirmedIcon.classList.add('status-confirmed', 'material-icons');
  confirmedIcon.appendChild(document.createTextNode('check'));

  if (data.status === 'CONFIRMED') {
    metaTextActivityStatus.appendChild(confirmedIcon);
  }
  if (data.status === 'CANCELLED') {
    metaTextActivityStatus.appendChild(cancelIcon);
  }

  metaTextContainer.appendChild(metaTextActivityStatus);

  if (append) {

    li.appendChild(creator);
    li.appendChild(leftTextContainer);
    li.appendChild(metaTextContainer);
    return li;
  }

  li.innerHTML += creator.outerHTML + leftTextContainer.outerHTML + metaTextContainer.outerHTML;
  return li.outerHTML;
}

function appendActivityListToDom(activityDom, hasHeaderAndCard, headerName) {
  if (!hasHeaderAndCard) {
    listPanel();
    creatListHeader(headerName, !hasHeaderAndCard);
  }
  if (document.getElementById('activity--list')) {
    document.getElementById('activity--list').innerHTML = activityDom;
  }
}

function createActivityIcon(db) {
  var subscriptionObjectStore = db.transaction(['subscriptions']).objectStore('subscriptions');
  var subscriptionCount = subscriptionObjectStore.count();
  subscriptionCount.onsuccess = function () {
    if (subscriptionCount.result) {
      var fab = document.createElement('button');
      fab.className = 'mdc-fab create-activity';
      fab.setAttribute('aria-label', 'Add');
      var span = document.createElement('span');
      span.className = 'mdc-fab_icon material-icons';
      span.textContent = 'add';
      fab.appendChild(span);
      if (document.getElementById('activity--list')) {
        document.getElementById('activity--list').appendChild(fab);
        document.querySelector('.create-activity').addEventListener('click', function (evt) {
          selectorUI(evt, {
            record: '',
            store: 'subscriptions'
          });
        });
      }
    }
  };
}

function listPanel() {
  if (document.getElementById('activity-list-main')) return;

  var listCard = document.createElement('div');
  listCard.className = 'mdc-card panel-card mdc-top-app-bar--fixed-adjust';
  listCard.id = 'activity-list-main';
  var listUl = document.createElement('ul');
  listUl.className = 'mdc-list mdc-list--two-line mdc-list--avatar-list';
  listUl.id = 'activity--list';

  listCard.appendChild(listUl);

  document.getElementById('app-current-panel').innerHTML = listCard.outerHTML;
}

function creatListHeader(headerName, backIcon) {
  var parentIconDiv = document.createElement('div');
  parentIconDiv.className = 'drawer--icons';

  var menuIcon = document.createElement('span');
  menuIcon.id = 'menu--panel';
  var icon = document.createElement('i');
  icon.className = 'material-icons';
  if (backIcon) {
    icon.textContent = 'keyboard_backspace';
  } else {

    icon.textContent = 'menu';
  }

  var menuSpan = document.createElement('span');
  menuSpan.className = 'current--selcted-filter';
  headerName === 'Cancelled' ? menuSpan.textContent = 'Trash' : menuSpan.textContent = headerName;

  menuIcon.appendChild(icon);
  menuIcon.appendChild(menuSpan);

  parentIconDiv.appendChild(menuIcon);

  var searchIcon = document.createElement('span');
  searchIcon.id = 'search--panel';
  var sicon = document.createElement('i');
  sicon.className = 'material-icons';
  sicon.textContent = 'search';
  searchIcon.appendChild(sicon);

  header(parentIconDiv.outerHTML, '', 'list');

  var drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));

  document.getElementById('menu--panel').addEventListener('click', function () {
    if (backIcon) {
      backNav();
      return;
    }

    drawer.open = true;
    sendCurrentViewNameToAndroid('drawer');
  });
}

function scrollToActivity(yOffset) {
  if (localStorage.getItem('clickedActivity')) {
    if (document.querySelector('[data-id="' + localStorage.getItem('clickedActivity') + '"]')) {

      document.querySelector('[data-id="' + localStorage.getItem('clickedActivity') + '"]').scrollIntoView({
        behavior: "instant",
        block: "center",
        "inline": "center"
      });
      localStorage.removeItem('clickedActivity');
    }
    return;
  }

  if (yOffset === 0) {
    localStorage.removeItem('clickedActivity');
    window.scrollTo(0, 0);
    return;
  }

  if (yOffset > 0) {
    window.scrollTo(0, yOffset);
  }
}

function initMenu(db, officeRecord) {
  console.log(officeRecord);
  var filters = [{
    type: 'Incoming',
    icon: 'call_received'
  }, {
    type: 'Outgoing',
    icon: 'call_made'
  }, {
    type: 'Urgent',
    icon: 'star_rate'
  }, {
    type: 'Recent',
    icon: 'watch_later'
  }, {
    type: 'Nearby',
    icon: 'near_me'
  }, {
    type: 'Pending',
    icon: ''
  }, {
    type: 'Cancelled',
    icon: 'delete'
  }];

  var aside = document.createElement('aside');
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography';
  if (officeRecord) {
    aside.dataset.currentOffice = officeRecord.allOffices[0];
  } else {
    aside.dataset.currentOffice = 'all';
  }

  var nav = document.createElement('nav');
  nav.className = 'mdc-drawer__drawer';

  var header = document.createElement('header');
  header.className = 'mdc-drawer__header drawer--header';

  var headerContent = document.createElement('div');
  headerContent.className = 'mdc-drawer__header-content';

  var ImageDiv = document.createElement('div');
  ImageDiv.className = 'drawer--header-div';
  ImageDiv.onclick = function () {
    profileView(true);
  };
  var headerIcon = document.createElement('img');
  headerIcon.className = 'drawer-header-icon';

  headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg';

  var headerDetails = document.createElement('div');
  headerDetails.className = 'header--details';

  var name = document.createElement('div');
  name.className = 'mdc-typography--subtitle';
  name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber;

  var officeName = document.createElement('div');
  if (!officeRecord) {
    officeName.textContent = '';
  } else {
    officeName.textContent = officeRecord.allOffices[0];
  }

  officeName.className = 'mdc-typography--caption current--office-name';

  var changeOfficeIon = document.createElement('div');
  headerDetails.appendChild(changeOfficeIon);

  headerDetails.appendChild(name);
  headerDetails.appendChild(officeName);

  if (officeRecord && officeRecord.hasMultipleOffice) {
    changeOfficeIon.className = 'material-icons';
    changeOfficeIon.style.float = 'right';
    changeOfficeIon.textContent = 'arrow_drop_down';
    changeOfficeIon.onclick = function () {
      if (document.querySelector('.office-selection-lists')) return;

      createOfficeSelectionUI(officeRecord.allOffices, db);
    };
  }

  ImageDiv.appendChild(headerIcon);
  headerContent.appendChild(ImageDiv);
  headerContent.appendChild(headerDetails);
  header.appendChild(headerContent);

  var navContent = document.createElement('nav');

  navContent.className = 'mdc-drawer__content mdc-list filter-sort--list';

  if (officeRecord && officeRecord.hasMultipleOffice) {
    var all = document.createElement('div');
    all.className = 'mdc-list-item mdc-list-item--activated';

    var i = document.createElement('i');
    i.className = 'material-icons mdc-list-item__graphic drawer--icons';
    i.setAttribute('aria-hidden', 'true');
    i.textContent = 'all_inbox';
    var textSpan = document.createElement('span');
    textSpan.textContent = 'All offices';
    all.onclick = function () {
      var drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      allOffices('All Offices', true);
      drawer.open = false;
    };
    all.appendChild(i);
    all.appendChild(textSpan);
    navContent.appendChild(all);
  }

  filters.forEach(function (filter) {

    var a = document.createElement('div');
    a.className = 'mdc-list-item mdc-list-item--activated';

    var i = document.createElement('i');
    i.className = 'material-icons mdc-list-item__graphic drawer--icons';
    i.setAttribute('aria-hidden', 'true');
    i.textContent = filter.icon;
    var textSpan = document.createElement('span');
    filter.type === 'Cancelled' ? textSpan.textContent = 'Trash' : textSpan.textContent = filter.type;

    a.appendChild(i);
    a.appendChild(textSpan);
    a.onclick = function () {

      window.scrollTo(0, 0);
      if (filter.type === 'Pending' || filter.type === 'Cancelled') {
        filterActivities(filter.type, true);
      }
      if (filter.type === 'Incoming' || filter.type === 'Outgoing') {
        sortByCreator(filter.type, true);
      }
      if (filter.type === 'Urgent') {
        sortByDates(filter.type, true);
      }
      if (filter.type === 'Nearby') {
        sortByLocation(filter.type, true);
      }
      if (filter.type === 'Recent') {
        listView();
      }

      var drawer = new mdc.drawer.MDCTemporaryDrawer(document.querySelector('.mdc-drawer--temporary'));
      drawer.open = false;
      sendCurrentViewNameToAndroid('listView');
      document.querySelector('.current--selcted-filter').textContent = filter.type;
    };

    navContent.appendChild(a);
  });
  nav.appendChild(header);
  nav.appendChild(navContent);
  aside.appendChild(nav);
  document.body.appendChild(aside);
}

function createOfficeSelectionUI(allOffices) {

  document.querySelector('.filter-sort--list').classList.add('hidden');
  var navContent = document.createElement('nav');

  navContent.className = 'mdc-drawer__content mdc-list office-selection-lists';
  document.querySelector('.mdc-drawer__drawer').appendChild(navContent);

  allOffices.forEach(function (office) {
    console.log(office);
    if (office !== document.querySelector(".mdc-drawer--temporary").dataset.currentOffice) {

      var a = document.createElement('div');
      a.className = 'mdc-list-item mdc-list-item--activated different-office-link';
      var textSpan = document.createElement('span');
      textSpan.textContent = office;
      a.appendChild(textSpan);
      a.onclick = function () {
        document.querySelector('.filter-sort--list').classList.remove('hidden');
        navContent.remove();
        var drawer = new mdc.drawer.MDCTemporaryDrawer.attachTo(document.querySelector('.mdc-drawer--temporary'));
        drawer['root_'].dataset.currentOffice = office;
        document.querySelector('.current--office-name').textContent = office;
        listView();
        drawer.open = false;
      };
      navContent.appendChild(a);
    }
  });
}

function allOffices(type, pushState) {
  if (pushState) {

    history.pushState(["allOffices", type], null, null);
  }
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;

    var activityStore = db.transaction('activity').objectStore('activity').index('timestamp');
    var activityDom = '';
    activityStore.openCursor(null, 'prev').onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        appendActivityListToDom(activityDom, false, type);
        createActivityIcon(db);
        return;
      }

      if (cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
        createActivityList(db, cursor.value).then(function (li) {

          activityDom += li;
        });
      }
      cursor.continue();
    };
  };
}

function filterActivities(type, pushState) {
  if (pushState) {

    history.pushState(["filterActivities", type], null, null);
  } else {
    history.replaceState(["filterActivities", type], null, null);
  }

  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;
    var activityStore = db.transaction('activity').objectStore('activity').index('timestamp');
    var Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice;

    var activityDom = '';
    activityStore.openCursor(null, 'prev').onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        var yOffset = window.pageYOffset;
        setTimeout(function () {

          appendActivityListToDom(activityDom, false, type);
          createActivityIcon(db);
          scrollToActivity(yOffset);
        }, 300);
        return;
      }

      if (cursor.value.status === type.toUpperCase() && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
        createActivityList(db, cursor.value).then(function (li) {

          activityDom += li;
        });
      }
      cursor.continue();
    };
  };
}

function sortByCreator(type, pushState) {

  if (pushState) {
    history.pushState(["sortByCreator", type], null, null);
  } else {
    history.replaceState(["sortByCreator", type], null, null);
  }
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;

    var activityStore = db.transaction('activity').objectStore('activity').index('timestamp');
    var Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice;

    var activityDom = '';
    var me = firebase.auth().currentUser.phoneNumber;
    activityStore.openCursor(null, 'prev').onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        var yOffset = window.pageYOffset;
        setTimeout(function () {

          appendActivityListToDom(activityDom, false, type);
          createActivityIcon(db);
          scrollToActivity(yOffset);
        }, 200);
        return;
      }
      if (type === 'Incoming') {
        if (cursor.value.creator !== me && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
          createActivityList(db, cursor.value).then(function (li) {

            activityDom += li;
          });
        }
      }
      if (type === 'Outgoing') {
        if (cursor.value.creator === me && cursor.value.office === Curroffice && cursor.value.template !== 'subscription' && cursor.value.hidden === 0) {
          createActivityList(db, cursor.value).then(function (li) {
            activityDom += li;
          });
        }
      }

      cursor.continue();
    };
  };
}

function sortByDates(type, pushState) {
  if (pushState) {
    history.pushState(["sortByDates", type], null, null);
  } else {
    history.replaceState(["sortByDates", type], null, null);
  }
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;

    var Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice;

    var today = moment().format('YYYY-MM-DD');
    var sortingOrder = {
      HIGH: [],
      LOW: []
    };
    var calendar = db.transaction('calendar').objectStore('calendar').index('range');
    calendar.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (!cursor) {
        sortingOrder['HIGH'].sort(function (a, b) {
          return moment(b.start).valueOf() - moment(a.start).valueOf();
        });

        sortingOrder['LOW'].sort(function (a, b) {
          return moment(b.end).valueOf() - moment(a.end).valueOf();
        });

        generateActivitiesByDate(sortBykeys(sortingOrder));
        return;
      }

      if (today >= cursor.value.start && today <= cursor.value.end && cursor.value.office === Curroffice) {
        sortingOrder['HIGH'].push(cursor.value);
      } else {
        sortingOrder['LOW'].push(cursor.value);
      }

      cursor.continue();
    };
  };
}

function generateActivitiesByDate(sortingOrder) {
  var dbName = firebase.auth().currentUser.uid;
  var req = indexedDB.open(dbName);
  var activityDom = '';
  req.onsuccess = function () {
    var db = req.result;
    var activityObjectStore = db.transaction('activity').objectStore('activity');

    Object.keys(sortingOrder['HIGH']).forEach(function (key) {
      activityObjectStore.get(key).onsuccess = function (event) {
        var activity = event.target.result;
        createActivityList(db, activity).then(function (li) {

          activityDom += li;
        });
      };
    });
    Object.keys(sortingOrder['LOW']).forEach(function (key) {
      activityObjectStore.get(key).onsuccess = function (event) {
        var activity = event.target.result;
        createActivityList(db, activity).then(function (li) {
          activityDom += li;
        });
      };
    });

    setTimeout(function () {
      var yOffset = window.pageYOffset;
      appendActivityListToDom(activityDom, false, 'Urgent');
      createActivityIcon(db);
      scrollToActivity(yOffset);
    }, 600);
  };
}

function sortBykeys(data) {
  console.log(data);
  var lowerOrder = data['LOW'];
  var higherOrder = data['HIGH'];
  var holder = {
    'LOW': {},
    'HIGH': {}
  };

  var lowerOrderLength = lowerOrder.length;
  for (var iterator = 0; iterator < lowerOrderLength; iterator++) {
    key = lowerOrder[iterator];
    if (!holder['LOW'].hasOwnProperty(key.activityId)) {
      holder['LOW'][key.activityId] = key;
    }
  }

  var higherOrderLength = higherOrder.length;
  for (var _iterator = 0; _iterator < higherOrderLength; _iterator++) {
    key = higherOrder[_iterator];
    if (!holder['HIGH'].hasOwnProperty(key.activityId)) {
      holder['HIGH'][key.activityId] = key;
    }
  }

  return holder;
}

function sortByLocation(type, pushState) {
  if (pushState) {
    history.pushState(['sortByLocation', type], null, null);
  } else {
    history.replaceState(['sortByLocation', type], null, null);
  }
  var dbName = firebase.auth().currentUser.uid;
  var nearestLocationHandler = new Worker('src/js/nearestLocationHandler.js');

  nearestLocationHandler.postMessage({

    dbName: dbName
  });

  nearestLocationHandler.onmessage = function (records) {
    sortActivitiesByLocation(records.data);
  };
  nearestLocationHandler.onerror = locationSortError;
}

function sortActivitiesByLocation(distanceArr) {
  var req = indexedDB.open(firebase.auth().currentUser.uid);
  req.onsuccess = function () {
    var db = req.result;

    var activityDom = '';
    var Curroffice = document.querySelector('.mdc-drawer--temporary').dataset.currentOffice;

    var activityObjectStore = db.transaction('activity').objectStore('activity');
    for (var i = 0; i < distanceArr.length; i++) {

      activityObjectStore.get(distanceArr[i].activityId).onsuccess = function (event) {
        if (event.target.result.office === Curroffice && event.target.result !== 'CANCELLED') {

          createActivityList(db, event.target.result).then(function (li) {
            activityDom += li;
          });
        }
      };
    }
    setTimeout(function () {
      var yOffset = window.pageYOffset;
      appendActivityListToDom(activityDom, false, 'Nearby');
      createActivityIcon(db);
      scrollToActivity(yOffset);
    }, 500);
  };
}

function locationSortError(error) {
  console.log(error);
}

function header(contentStart, contentEnd, headerType) {

  var header = document.createElement('header');
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1';
  if (headerType === 'list') {
    header.classList.add('header-list--gray');
  }
  var row = document.createElement('div');
  row.className = 'mdc-top-app-bar__row';

  var sectionStart = document.createElement('section');
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start';

  var leftUI = document.createElement('div');
  leftUI.id = 'view-type';
  leftUI.innerHTML = contentStart;

  sectionStart.appendChild(leftUI);

  var sectionEnd = document.createElement('div');
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end';

  var rightUI = document.createElement('div');
  rightUI.id = 'action-data';
  if (contentEnd) {
    rightUI.innerHTML = contentEnd;
  }
  sectionEnd.appendChild(rightUI);
  row.appendChild(sectionStart);
  row.appendChild(sectionEnd);
  header.innerHTML = row.outerHTML;
  if (headerType === 'selector') {
    return header;
  } else {
    document.getElementById('header').innerHTML = header.outerHTML;
  }
}

function createInputForProfile(key, type, classtype) {
  var mainTextField = document.createElement('div');
  mainTextField.className = 'mdc-text-field mdc-text-field--dense ' + classtype + ' attachment--text-field';

  mainTextField.dataset.key = key;
  mainTextField.dataset.type = type;
  mainTextField.id = key.replace(/\s/g, '');
  var mainInput = document.createElement('input');
  mainInput.className = 'mdc-text-field__input';

  if (type && key === 'displayName') {
    mainInput.placeholder = 'Your Name';
  }
  if (type && key === 'email') {
    mainInput.placeholder = 'Your Email';
  }

  var ripple = document.createElement('div');
  ripple.className = 'mdc-line-ripple';

  mainTextField.appendChild(mainInput);
  mainTextField.appendChild(ripple);
  return mainTextField;
}