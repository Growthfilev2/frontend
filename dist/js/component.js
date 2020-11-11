function createFab(icon) {
  var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var absolute = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var button = createElement('button', {
    className: 'mdc-fab  mdc-button--raised',
    id: id
  });

  if (absolute) {
    button.classList.add('app-fab--absolute');
  }

  var span = createElement('span', {
    className: 'mdc-fab__icon material-icons',
    textContent: icon
  });
  button.appendChild(span);
  new mdc.ripple.MDCRipple(button);
  setTimeout(function () {
    button.classList.remove('mdc-fab--exited');
  }, 200);
  return button;
}

function actionButton(name) {
  var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var link = arguments.length > 2 ? arguments[2] : undefined;
  var actionContainer = createElement('div', {
    className: 'action-button-container'
  });
  var submitContainer = createElement('div', {
    className: 'submit-button-cont'
  });
  var button;

  if (link) {
    button = createElement("a", {
      href: link,
      target: '_blank',
      textContent: name,
      className: 'mdc-button mdc-button--raised submit-btn',
      id: id
    });
  } else {
    button = createButton(name, id);
  }

  button.classList.add('submit-btn', 'mdc-button--raised');
  new mdc.ripple.MDCRipple(button);
  submitContainer.appendChild(button);
  actionContainer.appendChild(submitContainer);
  return actionContainer;
}

function createExtendedFab(icon, name, id, absolute, link) {
  var button = createElement(link ? 'a' : 'button', {
    className: 'mdc-fab mdc-fab--extended mdc-button--raised mdc-fab-custom',
    id: id
  });

  if (link) {
    button.href = link;
  }

  if (absolute) {
    button.classList.add('app-fab--absolute');
  }

  button.innerHTML = "\n                   <span class=\"material-icons mdc-fab__icon\">".concat(icon, "</span>\n                   <span class=\"mdc-fab__label\">").concat(name, "</span>\n                   <div class=\"mdc-fab__ripple\"></div>\n                   ");
  new mdc.ripple.MDCRipple(button);
  return button;
}

function createButton(name, id, icon) {
  var button = createElement('button', {
    className: 'mdc-button',
    id: id || ''
  });
  var span = createElement('span', {
    className: 'mdc-button__label',
    textContent: name
  });

  if (icon) {
    var i = createElement('i', {
      className: 'material-icons mdc-button__icon',
      textContent: icon
    });
    button.appendChild(i);
  }

  button.appendChild(span);
  return button;
}

function createLi(itemName) {
  var li = createElement('li', {
    className: 'mdc-list-item',
    textContent: itemName
  });
  return li;
}

function setHeader(sectionStart, sectionEnd) {
  var el = document.getElementById('app-header');
  el.querySelector('#section-start').innerHTML = sectionStart;
  el.querySelector('#section-end').innerHTML = sectionEnd;
  var tabBarEl = document.getElementById('navigation-tabs');

  if (history.state && history.state[0] === 'appView') {
    if (!tabBarEl) {
      var tabs = [{
        id: 'home-icon',
        icon: 'home',
        name: 'Home'
      }, {
        id: 'inbox-icon',
        icon: 'inbox',
        name: 'Inbox'
      }];
      var tabBar = showTabs(tabs, 'navigation-tabs');
      el.insertBefore(tabBar, el.querySelector('#main-progress-bar'));
      appTabBar = new mdc.tabBar.MDCTabBar(tabBar);
      updateTotalCount();
    }

    var selectedIndex = appTabBar.foundation_.adapter_.getFocusedTabIndex();
    switchTabs(selectedIndex);
    return new mdc.topAppBar.MDCTopAppBar(el);
  }

  if (tabBarEl) {
    tabBarEl.remove();
  }

  el.querySelector('.mdc-top-app-bar__row').classList.remove('hidden');
  return new mdc.topAppBar.MDCTopAppBar(el);
}

function updateTotalCount() {
  db.transaction('users').objectStore('users').index('count').getAll().onsuccess = function (e) {
    var users = e.target.result;
    var total = 0;
    users.forEach(function (user) {
      total += user.count;
    });
    if (total <= 0) return;
    var parent = document.querySelector('#inbox-icon .mdc-tab__content');
    if (!parent) return;

    if (parent.querySelector('.tab-notification')) {
      parent.querySelector('.tab-notification').remove();
    }

    var tabIcon = createElement('span', {
      className: 'mdc-tab__icon tab-notification'
    });
    var div = createElement('div', {
      textContent: total
    });
    tabIcon.appendChild(div);
    parent.insertBefore(tabIcon, parent.firstElementChild);
  };
}

function createSimpleMenu(items, id) {
  return "\n    <div class=\"mdc-menu mdc-menu-surface\" id=\"".concat(id, "\">\n    <ul class=\"mdc-list\" role=\"menu\" aria-hidden=\"true\" aria-orientation=\"vertical\" tabindex=\"-1\">\n    ").concat(items.map(function (item) {
    return " <li class=\"mdc-list-item\" role=\"menuitem\">\n        <span class=\"mdc-list-item__graphic mdc-menu__selection-group-icon\">\n        <i class='material-icons'>".concat(item.icon, "</i>\n        </span>\n        <span class=\"mdc-list-item__text\">").concat(item.name, "</span>\n        </li>");
  }).join(""), "\n    </ul>\n    </div>\n  ");
}

function menuItemMap(item, geopoint) {
  var li = createElement('li', {
    className: 'mdc-list-item map-menu-item'
  });
  li.setAttribute('role', 'menuitem');
  var spanTag = "<a target=\"_blank\") href='comgooglemaps://?center=".concat(geopoint._latitude, ",").concat(geopoint._longitude, "' class=\"mdc-list-item__text\" on>").concat(item.name, "</span>");

  if (_native.getName() === 'Android') {
    spanTag = "<a href='geo:".concat(geopoint._latitude, ",").concat(geopoint._longitude, "?q=").concat(geopoint._latitude, ",").concat(geopoint._longitude, "' class=\"mdc-list-item__text\">").concat(item.name, "</a>");
  }

  li.innerHTML = "<span class=\"mdc-list-item__graphic mdc-menu__selection-group-icon\">\n    <i class='material-icons'>".concat(item.icon, "</i>\n    </span>\n    ").concat(spanTag);
  return li;
}

function textFieldTelephone(attr) {
  return "\n    <div class=\"".concat(attr.customClass ? attr.customClass : '', " mdc-text-field mdc-text-field--outlined  mt-10 ").concat(attr.disabled ? 'mdc-text-field--disabled' : '', " ").concat(attr.label ? '' : 'mdc-text-field--no-label', "\" id='").concat(attr.id, "'>\n    <input class=\"mdc-text-field__input\" value='").concat(attr.value || '', "' type='tel' ").concat(attr.disabled ? 'disabled' : '', " ").concat(attr.required ? 'required' : '', ">\n    <div class=\"mdc-notched-outline\">\n    <div class=\"mdc-notched-outline__leading\"></div>\n    ").concat(attr.label ? "<div class=\"mdc-notched-outline__notch\">\n    <label for='email' class=\"mdc-floating-label mdc-floating-label--float-above \">".concat(attr.label, "</label>\n    </div>") : '', "\n    <div class=\"mdc-notched-outline__trailing\"></div>\n    </div>\n    </div>\n    ");
}

function textField(attr) {
  var div = createElement('div', {
    className: 'mdc-text-field mdc-text-field--outlined full-width',
    id: attr.id
  });

  if (attr.trailingIcon) {
    div.classList.add('mdc-text-field--with-trailing-icon');
  }

  if (attr.leadingIcon) {
    div.classList.add('mdc-text-field--with-leading-icon');
  }

  div.innerHTML = "\n    ".concat(attr.leadingIcon ? "<i class=\"material-icons mdc-text-field__icon\" tabindex=\"0\" role=\"button\">".concat(attr.leadingIcon, "</i>") : '', "\n    <input autocomplete=").concat(attr.autocomplete ? attr.autocomplete : 'off', " type=\"").concat(attr.type || 'text', "\" class=\"mdc-text-field__input\" value=\"").concat(attr.value || '', "\" ").concat(attr.required ? 'required' : '', " ").concat(attr.disabled ? 'disabled' : '', " ").concat(attr.readonly ? 'readonly' : '', " >\n    ").concat(attr.trailingIcon ? "<i class=\"material-icons mdc-text-field__icon\" tabindex=\"0\" role=\"button\">".concat(attr.trailingIcon, "</i>") : '', "\n    \n    <div class=\"mdc-notched-outline ").concat(attr.label ? '' : 'mdc-notched-outline--no-label', "\">\n      <div class=\"mdc-notched-outline__leading\"></div>\n      <div class=\"mdc-notched-outline__notch\">\n        <label  class=\"mdc-floating-label\">").concat(attr.label ? attr.label : '', "</label>\n      </div>\n      <div class=\"mdc-notched-outline__trailing\"></div>\n    </div>\n  ");
  return div;
}

function textFieldWithHelper(attr) {
  var cont = createElement('div', {
    className: 'text-field-container'
  });

  if (attr.classList) {
    attr.classList.forEach(function (name) {
      cont.classList.add(name);
    });
  }

  cont.appendChild(textField(attr));
  var helper = createElement('div', {
    className: 'mdc-text-field-helper-line'
  });
  helper.innerHTML = "  <div class=\"mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg\"></div>";
  cont.appendChild(helper);
  return cont;
}

function textAreaWithHelper(attr) {
  var cont = createElement('div', {
    className: 'text-field-container'
  });

  if (attr.classList) {
    attr.classList.forEach(function (name) {
      cont.classList.add(name);
    });
  }

  cont.innerHTML = "\n    ".concat(textArea(attr), "\n    <div class=\"mdc-text-field-helper-line\">\n      <div class=\"mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg\"></div>\n    </div>\n");
  return cont;
}

function textArea(attr) {
  return "<div class=\"mdc-text-field mdc-text-field--textarea\" id=\"".concat(attr.id, "\">\n    <textarea  class=\"mdc-text-field__input\" rows=\"4\" cols=\"40\" required=\"").concat(attr.required, "\"></textarea>\n    <div class=\"mdc-notched-outline\">\n      <div class=\"mdc-notched-outline__leading\"></div>\n      <div class=\"mdc-notched-outline__notch\">\n        <label for=\"textarea\" class=\"mdc-floating-label\">").concat(attr.label, "</label>\n      </div>\n      <div class=\"mdc-notched-outline__trailing\"></div>\n    </div>\n  </div>");
}

function createRadio(radioId, inputId) {
  var div = createElement('div', {
    className: 'mdc-radio',
    id: radioId
  });
  div.innerHTML = "<input class=\"mdc-radio__native-control\" type=\"radio\" id=\"".concat(inputId, "\" name=\"radios\">\n    <div class=\"mdc-radio__background\">\n        <div class=\"mdc-radio__outer-circle\"></div>\n        <div class=\"mdc-radio__inner-circle\"></div>\n    </div>\n    <div class=\"mdc-radio__ripple\"></div>\n    ");
  new mdc.radio.MDCRadio(div);
  return div;
}

function createCheckBox(id) {
  var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return "\n    <div class=\"mdc-form-field\">\n  <div class=\"mdc-checkbox\">\n    <input type=\"checkbox\"\n           class=\"mdc-checkbox__native-control\"\n           id=".concat(id, "/>\n    <div class=\"mdc-checkbox__background\">\n      <svg class=\"mdc-checkbox__checkmark\"\n           viewBox=\"0 0 24 24\">\n        <path class=\"mdc-checkbox__checkmark-path\"\n              fill=\"none\"\n              d=\"M1.73,12.91 8.1,19.28 22.79,4.59\"/>\n      </svg>\n      <div class=\"mdc-checkbox__mixedmark\"></div>\n    </div>\n    <div class=\"mdc-checkbox__ripple\"></div>\n  </div>\n  <label for=\"").concat(id, "\">").concat(label, "</label>\n</div>");
}

var xStart = null;
var yStart = null;
var sliderElement;
var sliderCallback = null;

function swipe(el, callback) {
  if (!el) return;
  sliderElement = el;
  sliderCallback = callback;
  el.addEventListener('touchstart', handleTouchStart, false); // el.addEventListener('touchmove', handleTouchMove, false);

  el.addEventListener('touchend', handleTouchEnd, false);
}

function removeSwipe() {
  if (!sliderElement) return;
  sliderElement.removeEventListener('touchstart', handleTouchStart, false);
  sliderElement.removeEventListener('touchend', handleTouchEnd, false);
  sliderElement = null;
  sliderCallback = null;
}

function handleTouchStart(evt) {
  var firstTouch = evt.touches[0];
  xStart = firstTouch.clientX;
  yStart = firstTouch.clientY;
}

function handleTouchMove(evt) {
  if (!xStart) return;
  var xEnd = evt.touches[0].clientX;
  var yEnd = evt.touches[0].clientY;
  var xAxisDiff = xEnd - xStart;
  var yAxisDiff = yEnd - yStart;
  var direction = '';

  if (Math.abs(xAxisDiff) > Math.abs(yAxisDiff)) {
    if (xAxisDiff > 0) {
      direction = 'left'; // left
    } else {
      direction = 'right'; //right
    }
  } else {
    if (yAxisDiff > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }
  }

  xStart = null;
  yStart = null;
  sliderCallback(direction);
}

function handleTouchEnd(evt) {
  var xEnd = evt.changedTouches[0].clientX;
  var yEnd = evt.changedTouches[0].clientY;
  var xAxisDiff = xEnd - xStart;
  var yAxisDiff = yEnd - yStart;
  var direction = '';
  if (xAxisDiff == 0 && yAxisDiff == 0) return;

  if (Math.abs(xAxisDiff) > Math.abs(yAxisDiff)) {
    if (xAxisDiff > 0) {
      direction = 'left'; // left
    } else {
      direction = 'right'; //right
    }
  } else {
    if (yAxisDiff > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }
  }

  xStart = null;
  yStart = null;
  sliderCallback(direction);
}

function createCheckBoxList(attr) {
  return "<li class='mdc-list-item checkbox-list' tabindex=\"-1\">\n    <span class='mdc-list-item__text'>\n        <span class='mdc-list-item__primary-text'>".concat(attr.primaryText.trim(), "</span>\n        <span class='mdc-list-item__secondary-text mdc-theme--primary'>").concat(attr.secondaryText.trim(), "</span>\n    </span>\n    <span class=\"mdc-list-item__graphic mdc-list-item__meta\">\n    <div class=\"mdc-checkbox\">\n        <input type=\"checkbox\"\n                class=\"mdc-checkbox__native-control\"\n                id=\"demo-list-checkbox-item-").concat(attr.index, "\" />\n        <div class=\"mdc-checkbox__background\">\n          <svg class=\"mdc-checkbox__checkmark\"\n                viewBox=\"0 0 24 24\">\n            <path class=\"mdc-checkbox__checkmark-path\"\n                  fill=\"none\"\n                  d=\"M1.73,12.91 8.1,19.28 22.79,4.59\"/>\n          </svg>\n          <div class=\"mdc-checkbox__mixedmark\"></div>\n        </div>\n      </div>\n</span>\n</li>");
}

function textFieldTelephoneWithHelper(attr) {
  var cont = createElement('div', {
    className: 'text-field-container'
  });

  if (attr.classList) {
    attr.classList.forEach(function (name) {
      cont.classList.add(name);
    });
  }

  cont.innerHTML = "\n    ".concat(textFieldTelephone(attr), "\n    <div class=\"mdc-text-field-helper-line\">\n      <div class=\"mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg\"></div>\n    </div>\n");
  return cont;
}

var shareWidget = function shareWidget(link, office) {
  var auth = firebase.auth().currentUser;
  var shareText = "Hi ".concat(auth.displayName, "  wants you to use Growthfile to Check-in & collect proof of work without any effort. Download app & login now ");
  var el = createElement('div', {
    className: 'share-widget'
  });
  var widgetMessage = createElement('div', {
    className: 'mdc-typography--body1 mb-10 mt-0',
    innerHTML: "Invite users to join <span class='mdc-theme--primary bold'>".concat(office, "</span>")
  });
  el.appendChild(widgetMessage);
  var linkManager = createElement('div', {
    className: 'link-manager'
  });
  linkManager.appendChild(textField({
    value: link,
    trailingIcon: 'share',
    readonly: true
  }));
  var field = new mdc.textField.MDCTextField(linkManager.querySelector('.mdc-text-field'));
  field.trailingIcon_.root_.addEventListener('click', function () {
    field.focus();
    callShareInterface(link, shareText);
  });
  var tempInput = createElement('input', {
    value: shareText + link
  });
  document.body.appendChild(tempInput); // copyRegionToClipboard(tempInput)

  tempInput.remove();
  el.appendChild(linkManager);
  return el;
};

var parseURL = function parseURL() {
  var search = window.location.search;
  if (!search) return;
  var param = new URLSearchParams(search);
  return param;
};

var encodeString = function encodeString(string) {
  return encodeURIComponent(string);
};

var callShareInterface = function callShareInterface(link, shareText) {
  var shareObject = {
    link: link,
    shareText: shareText + link,
    type: 'text/plain',
    email: {
      cc: '',
      subject: 'Welcome to Growthfile - Here’s your link to download the app',
      body: ''
    }
  };

  if (_native.getName() === 'Android') {
    AndroidInterface.share(JSON.stringify(shareObject));
    return;
  }

  webkit.messageHandlers.share.postMessage(shareObject);
};

var copyRegionToClipboard = function copyRegionToClipboard(el) {
  el.select();
  el.setSelectionRange(0, 9999);
  document.execCommand("copy");
  snacks('Link copied', 'OKay', null, 8000);
};

var linearProgress = function linearProgress(id) {
  var div = createElement('div', {
    className: 'mdc-linear-progress mdc-linear-progress--indeterminate mdc-linear-progress--closed',
    id: id
  });
  div.setAttribute('role', 'progressbar');
  div.innerHTML = " <div class=\"mdc-linear-progress__buffering-dots\"></div>\n    <div class=\"mdc-linear-progress__buffer\"></div>\n    <div class=\"mdc-linear-progress__bar mdc-linear-progress__primary-bar\">\n      <span class=\"mdc-linear-progress__bar-inner\"></span>\n    </div>\n    <div class=\"mdc-linear-progress__bar mdc-linear-progress__secondary-bar\">\n      <span class=\"mdc-linear-progress__bar-inner\"></span>\n    </div>";
  return new mdc.linearProgress.MDCLinearProgress(div);
};

var mdcSelect = function mdcSelect(values) {
  var div = createElement('div', {
    className: 'mdc-select mdc-select--no-label'
  });
  div.innerHTML = "<div class=\"mdc-select__anchor demo-width-class\">\n        <i class=\"mdc-select__dropdown-icon\"></i>\n        <div class=\"mdc-select__selected-text\"></div>\n        <div class=\"mdc-line-ripple\"></div>\n    </div>\n    <div class=\"mdc-select__menu mdc-menu mdc-menu-surface demo-width-class\">\n    <ul class=\"mdc-list\">\n        ".concat(values.map(function (value, index) {
    return "<li class=\"mdc-list-item ".concat(index == 0 ? 'mdc-list-item--selected' : '', "\" data-value=\"").concat(value, "\" aria-selected=\"").concat(index == 0 ? 'true' : 'false', "\">").concat(value, "</li>");
  }).join(""), "\n    </ul>");
  return new mdc.select.MDCSelect(div);
};