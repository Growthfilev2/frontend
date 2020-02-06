# Front End application for Growthfile

## File structure
```
|   index.html
|   .gitignore
|   package.json
|   README.md
|
+---css
|   |   conversation.css
|
+---js
|   |   apiHandler.js
|   |   conversation.js
|   |   init.js
|   |   panel.js
|   |   services.js
|
```

## Installation

1. ```cd``` into the localhost directory of your system
    * Linux
    ``` cd /var/www/html ```
    * Windows   
    ``` cd C:\Users\${accountName}\inetpub\wwwroot\ ```
     * MAC
    ```cd /Library/Webserver/Documents/```

2. Create a new folder and cd into it 
    * ``` mkdir frontend && cd frontend```

3. Clone the repo
```
git clone https://github.com/Growthfilev2/frontend.git
```

4. install dependencies
```
npm install
```

## Requirements 
* Web worker

    The apiHandler is spawned from ``` services.js``` . Since there is no native support in firebase for web workers, the firebase app is reinitialized in the worker. This is done to get the ```auth.uid``` and ```tokenId``` to perform IDB and ```XMLHTTPRequests``` operations.

* IndexedDB

    The indexedDB is initialized inside the apiHandler. ```requestCreator()``` is called from ```init.js``` with a message passed as its parameter. The ```requestCreator()``` passes the parameter into the apiHandler which performs a 
    dictionary operation to call the required function.


