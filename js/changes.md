# Changelog
All changes to js/  will be documented in this file.
## init.js
##### Changed
- changed signout method to only handle error case by using a callback  
- ```firebase.initializeApp``` now directly passes the firebase config object to the method
##### Removed
- removed ```defaultNationalNumber``` in ```firebaseUIConfig``` 
## service.js
##### Changed
- changed ```onmessage``` & ```onerror``` function events to use a callback flow
##### Added 
- added flow for calling ```listView()``` after getting success response from apiHandler 
## apiHandler
##### Changed
- responseObject from global scope to local scope.
- reduced parameters to ```addAttachment()```
##### Removed
- control flow logic to check for empty ```schedule``` & ```venue``` array
