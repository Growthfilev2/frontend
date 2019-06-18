function addView(sub){
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>`
    const header = getHeader('app-header', backIcon,'');

    history.pushState(['addView'],null,null);
    hideBottomNav();
    document.getElementById('app-current-panel').innerHTML = `<iframe id='form-iframe' src="https://growthfile-testing.firebaseapp.com/forms/customer/edit.html"></iframe>
    `
    console.log(db)
    document.getElementById('form-iframe').addEventListener("load", ev => {
        // your stuff
        document.getElementById('form-iframe').contentWindow.init(sub.office);
    })
}