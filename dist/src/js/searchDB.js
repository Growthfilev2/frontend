function initUserSelectorSearch(db, data) {
    var searchField = document.getElementById('search--bar-selector');
    searchField.value = '';
    var objectStore = '';
    var frag = document.createDocumentFragment();
    var alreadyPresntAssigness = {};
    var usersInRecord = data.record.assignees;

    usersInRecord.forEach(function (user) {
        alreadyPresntAssigness[user] = '';
    });

    searchField.addEventListener('input', function (e) {
        var searchString = e.target.value;

        if (isNumber(searchString)) {
            objectStore = db.transaction('users').objectStore('users');
            searchUsersDB(formatNumber(searchString), objectStore, frag, alreadyPresntAssigness, data);
            return;
        }

        frag = document.createDocumentFragment();
        objectStore = db.transaction('users').objectStore('users').index('displayName');
        searchUsersDB(formatName(searchString), objectStore, frag, alreadyPresntAssigness, data);
    });
}

function isNumber(searchTerm) {
    return !isNaN(searchTerm);
}

function formatNumber(numberString) {
    var number = numberString;
    if (number.substring(0, 2) === '91') {
        number = '+' + number;
    } else if (number.substring(0, 3) !== '+91') {
        number = '+91' + number;
    }

    return number;
}

function formatName(name) {
    var nameArr = name.split(" ");
    var length = nameArr.length;
    var result = [];
    var index = 0;
    for (index = 0; index < length; index++) {
        var element = nameArr[index];
        if (element.charAt(0).toUpperCase() === name.charAt(0).toUpperCase) return name;
        result.push(element.charAt(0).toUpperCase() + element.slice(1));
    }
    return result.join(' ');
}

function checkNumber(number) {
    var expression = /^\+[1-9]\d{11,14}$/;
    return expression.test(number);
}

function searchUsersDB(searchTerm, objectStore, frag, alreadyPresntAssigness, data) {
    console.log(searchTerm);
    var bound = IDBKeyRange.bound(searchTerm, searchTerm + '\uFFFF');
    var ul = document.getElementById('data-list--container');

    objectStore.openCursor(bound).onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {

            ul.innerHTML = '';
            if (frag.children.length == 0) {
                var notify = document.createElement('div');
                notify.className = 'data-not-found';
                var textSpan = document.createElement('p');
                textSpan.textContent = 'No Contact Found';
                textSpan.className = 'mdc-typography--headline5';
                notify.appendChild(textSpan);
                if (!document.querySelector('.data-not-found')) {
                    ul.appendChild(notify);
                }
                return;
            }

            ul.appendChild(frag);

            var selectedBoxes = document.querySelectorAll('[data-selected="true"]');
            selectedBoxes.forEach(function (box) {
                var mdcBox = new mdc.checkbox.MDCCheckbox.attachTo(box);
                mdcBox.checked = true;
                box.children[1].style.animation = 'none';
                box.children[1].children[0].children[0].style.animation = 'none';
            });
            return;
        }

        if (data.attachment.present) {
            frag.appendChild(createSimpleAssigneeLi(cursor.value, true, false));
        } else if (!alreadyPresntAssigness.hasOwnProperty(cursor.value.mobile)) {
            frag.appendChild(createSimpleAssigneeLi(cursor.value, true, true));
        }

        cursor.continue();
    };
}