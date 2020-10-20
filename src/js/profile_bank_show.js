let db;
window.addEventListener('load', (ev) => {
    firebase.auth().onAuthStateChanged(user => {
        const req = window.indexedDB.open(user.uid);
        req.onsuccess = function (e) {
            db = req.result;
            getRootRecord().then(record => {
                if (!hasBankAccount(record)) {
                    return
                }
                window.history.replaceState(record.linkedAccount[0], null, window.location.pathname)
                document.getElementById('bank-list').appendChild(createBankAccountLi(record.linkedAccount[0]));
                document.getElementById('bank-list').appendChild(createElement('li', {
                    className: 'mdc-list-divider'
                }))
            })
        }
    })
})

window.addEventListener('popstate', (ev) => {
    console.log(ev)
    document.getElementById('bank-view').innerHTML = `<div  class="account-list">
    <ul class="mdc-list mdc-list--two-line" id="bank-list">
    </ul>
    <ul class="mdc-list" >
        <a class="mdc-list-item mdc-theme--primary" href="./profile_bank_add.html">
            <span class="mdc-list-item__graphic material-icons">
                add_box
            </span>
            ADD BANK ACCOUNT
        </a>
    </ul>
</div>`
    document.getElementById('bank-list').appendChild(createBankAccountLi(ev.state));
})


const loadAccountView = (account) => {
    window.history.pushState(null, null, '/bankView')
    document.getElementById('bank-view').innerHTML = `<ul class="mdc-list mdc-list--two-line" id="bank-list">
    ${createBankAccountLi(account).outerHTML}
    <li class='mdc-list-divider'></li>
    </ul>
    <div class='p-16'>
        <div class='mdc-typography--headline6'>Account information</div>
        <div class='ml-20 mdc-typography--headline6'>
            <div>${account.name}</div>
            <div>${account.phonenumber}</div>
        </div>
    </div>
    `;
}

const hasBankAccount = (record) => {
    if (!record.linkedAccount) return;
    if (!Array.isArray(record.linkedAccount)) return;
    if (!record.linkedAccount[0]) return;

    return true
}

const createBankAccountLi = (account) => {
    const li = createElement('li', {
        className: 'mdc-list-item'
    })
    li.innerHTML = `
    <span class="mdc-list-item__graphic material-icons">
        account_balance
    </span>
    <span class='mdc-list-item__text'>
        <span class='mdc-list-item__primary-text'>${account.bankAccount}</span>
        <span class='mdc-list-item__secondary-text'>IFSC : ${account.ifsc}</span>
    </span>
    <span class='mdc-list-item__meta'>
        <div class='inline-flex'>
            <i class='material-icons'>check</i>
            <span>Primary</span>
        </div>
    </span>`
    li.addEventListener('click', () => {
        loadAccountView(account)
    })
    return li;
}