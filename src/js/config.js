function AppKeys() {
    this.mode = 'dev'
}
AppKeys.prototype.getMode = function () {
    return this.mode
}

AppKeys.prototype.getMapKey = function () {
    if (this.mode === 'dev') {
        return "AIzaSyB2SuCoyi9ngRIy6xZRYuzxoQJDtOheiUM"
    }
    return "AIzaSyBl6SlzDCW51UEYudI8kFwG41KePOjW7xI";
}
AppKeys.prototype.getKeys = function () {
    if (this.mode === 'production') {
        return {
            apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
            authDomain: 'growthfile-207204.firebaseapp.com',
            databaseURL: 'https://growthfile-207204.firebaseio.com',
            projectId: 'growthfile-207204',
            storageBucket: 'growthfile-207204.appspot.com',
            messagingSenderId: '701025551237'
        }
    }
    return {
        apiKey: "AIzaSyB2SuCoyi9ngRIy6xZRYuzxoQJDtOheiUM",
        authDomain: "growthfilev2-0.firebaseapp.com",
        databaseURL: "https://growthfilev2-0.firebaseio.com",
        projectId: "growthfilev2-0",
        storageBucket: "growthfilev2-0.appspot.com",
        messagingSenderId: "1011478688238",
        appId: "1:1011478688238:web:707166c5b9729182d81eff",
        measurementId: "G-R2K1J16PTW"
    }
}
AppKeys.prototype.getBaseUrl = function () {
    return this.mode === 'production' ? 'https://api2.growthfile.com/api/' : 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'
}

AppKeys.prototype.dynamicLinkUriPrefix = function () {
    return this.mode === 'production' ? 'https://growthfile.page.link' : 'https://growthfileanalytics.page.link'
}
const appKey = new AppKeys();
firebase.initializeApp(appKey.getKeys())
if (appKey.getMode() === 'dev') {
    firebase.auth().settings.appVerificationDisabledForTesting = true
}