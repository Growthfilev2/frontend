var db;
window.addEventListener('load', function (ev) {
  firebase.auth().onAuthStateChanged(function (user) {
    var req = window.indexedDB.open(user.uid);

    req.onsuccess = function (e) {
      db = req.result;
      getRootRecord().then(function (record) {
        accountList(record);
        requestCreator('now').then(function (res) {
          accountList(res);
        })["catch"](console.error);
      });
    };
  });
});

var accountList = function accountList(rootRecord) {
  if (!hasBankAccount(rootRecord)) return;
  var list = document.getElementById('bank-list');
  if (!list) return;
  var account = rootRecord.linkedAccounts[0];
  window.history.replaceState(account, null, window.location.pathname);
  list.innerHTML = '';
  list.appendChild(createBankAccountLi(account));
  list.appendChild(createElement('li', {
    className: 'mdc-list-divider'
  }));
};

window.addEventListener('popstate', function (ev) {
  console.log(ev);
  document.getElementById('bank-view').innerHTML = "<div  class=\"account-list\">\n    <ul class=\"mdc-list mdc-list--two-line\" id=\"bank-list\">\n    </ul>\n    <ul class=\"mdc-list\" >\n        <a class=\"mdc-list-item mdc-theme--primary\" href=\"./profile_bank_add.html\">\n            <span class=\"mdc-list-item__graphic material-icons\">\n                add_box\n            </span>\n            ADD BANK ACCOUNT\n        </a>\n    </ul>\n</div>";
  document.getElementById('bank-list').appendChild(createBankAccountLi(ev.state));
});

var loadAccountView = function loadAccountView(account) {
  window.history.pushState(null, null, '/bankView');
  document.getElementById('bank-view').innerHTML = "<ul class=\"mdc-list mdc-list--two-line\" id=\"bank-list\">\n    ".concat(createBankAccountLi(account).outerHTML, "\n    <li class='mdc-list-divider'></li>\n    </ul>\n    <div class='p-16'>\n        <div class='mdc-typography--headline6'>Account information</div>\n        <div class='ml-20 mdc-typography--headline6'>\n            <div>").concat(account.name, "</div>\n            <div>").concat(account.bankPhoneNumber, "</div>\n        </div>\n    </div>\n    ");
};

var createBankAccountLi = function createBankAccountLi(account) {
  var li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.innerHTML = "\n    <span class=\"mdc-list-item__graphic material-icons\">\n        account_balance\n    </span>\n    <span class='mdc-list-item__text'>\n        <span class='mdc-list-item__primary-text'>".concat(account.bankAccount, "</span>\n        <span class='mdc-list-item__secondary-text'>IFSC : ").concat(account.ifsc, "</span>\n    </span>\n    <span class='mdc-list-item__meta'>\n        <div class='inline-flex'>\n            <i class='material-icons'>check</i>\n            <span>Primary</span>\n        </div>\n    </span>");
  li.addEventListener('click', function () {
    loadAccountView(account);
  });
  return li;
};