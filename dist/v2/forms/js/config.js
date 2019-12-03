function AppKeys() {
    this.mode = 'dev'
}
AppKeys.prototype.getMode = function () {
    return this.mode
}
AppKeys.prototype.getMapKey = function () {
    if (this.mode === 'production') {
        return "AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo";
    }
    return "AIzaSyCadBqkHUJwdcgKT11rp_XWkbQLFAy80JQ";
}
AppKeys.prototype.getKeys = function () {
    if (this.mode === 'production') {
        return {
            apiKey: this.getMapKey(),
            authDomain: 'growthfile-207204.firebaseapp.com',
            databaseURL: 'https://growthfile-207204.firebaseio.com',
            projectId: 'growthfile-207204',
            storageBucket: 'growthfile-207204.appspot.com',
            messagingSenderId: '701025551237'

        }
    }
    return {
        apiKey: this.getMapKey(),
        authDomain: "growthfilev2-0.firebaseapp.com",
        projectId: "growthfilev2-0",
        messagingSenderId: "1011478688238"
    }
}
AppKeys.prototype.getBaseUrl = function () {
    return this.mode === 'production' ? 'https://api2.growthfile.com/api/' : 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'

}
