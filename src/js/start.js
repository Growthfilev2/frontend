function showUserDetails() {
    const auth = firebase.auth().currentUser;
    return auth.displayName && auth.photoURL && auth.email && auth.emailVerified;
}

function userDetails() {
    const auth = firebase.auth().currentUser;
    const parent = document.getElementById('app-current-panel');
    parent.innerHTML = userDom();
    if (!auth.photoURL) {
        // document.getElementById('photo-container')
    }
    if (!auth.displayName) {

    }
    getEmployeeDetails(IDBKeyRange.lowerBound(['recipient', 'PENDING'], ['recipient', 'CONFIRMED']), 'templateStatus').then(function (result) {
        if (!result.length) return;
    
        if (!auth.email) {

        }
        if (!auth.emailVerified) {

        }
    })

};

function userDom() {
    return `<div class="mdc-card" id='user-fill'>
    <div class="mdc-card__primary-action user-card">
    
    <div id='photo-container'></div>
    <div id='user-container'></div>
    <div id='email-container'></div>
    </div>
    `
}