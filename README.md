# modena

Express server wrapper that allows exposing multiple express web applications with in the same express instance, while keeping them isolated from each other.

## Usage

To use modena to host one or more apps a new app must be created (let's call it host-app). All the web applications that need to be exposed from the host-app (let's call them guest-apps) must be placed in the apps folder. Also, all the additional dependencies (i.e. anyone not included in modena dependencies) used in the guest-apps need to be installed in the host-app.

Each guest-app will be exposed in the url of the host-app plus the name of the folder in which it is located under apps. For example, in the following example (file structure of a sample host-app), if the host-app is published at **localhost:3000**, the kinder guest-app will be available at **localhost:3000/kinder**. Any other folder located inside the apps folder will be also exposed in the corresponding url.

```bash
.  
├── _apps  
│   └── _kinder  
|       ├── public  
|       ├── views  
|       ├── index.js  
|       ├── package.json  
|       └── package-lock.json  
├── index.js  
├── package.json  
└── package-lock.json  
```

Also if kinder guest-app is using, let's say, sequelize (or any other dependency not included in modena), sequelize will need to be installed in the host-app as well. This must be done for each guest-app hosted in the host-app.

The host-app index.js looks like this

```javascript
const { runServer } = require('modena');

/* Configuration should be stored in a separate file not tracked by git */
const config = { ... };

runServer(config);
```

and it gets up and running in the usual way

```bash
npm install

node index.js # or 'npm start' if the start script has been defined in the package.json
```

For examples of applications that can run on modena see [modena-examples](https://github.com/L3bowski/modena-examples). Currently there are two ways to expose a web application with modena:

- Defining and index.js that exports a function that returns an express router (or a Promise returning and express router)
- Placing static files in a folder called public inside the guest-app folder (the public folder name can be customized through a modena-config.json file in the root folder of the guest-app)

