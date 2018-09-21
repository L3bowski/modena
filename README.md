# modena

Express server wrapper that allows exposing multiple express applications (**hosted-apps**) inside the same express instance while keeping them isolated from each other.

## Usage

A new node project (**wrapper-app**) must be created in order to expose any number of applications. The wrapper-app contains the entry file from which express will be started, is responsible for setting environment variables configuration and installs all the dependencies required by the hosted-apps.

A usual wrapper-app folder structure looks like this:

```bash
.  
├── _apps  
│   ├── _kinder  
|   |    ├── public  
|   |    ├── views  
|   |    ├── index.js
|   |    ├── package.json  
|   |    └── package-lock.json  
|   └──_(...)
├── index.js  
├── package.json  
└── package-lock.json  
```

The entry file (index.js) just loads the configuration if required and starts the express server:

```javascript
const { runServer } = require('modena');

/* Configuration should be stored in a separate file not tracked by git */
const config = { ... };

runServer(config);
```

Finally, the wrapper-app can be run as per usual:

```bash
npm install

node index.js # or 'npm start' if the start script has been defined in the package.json
```

## App discovery

Modena scans the **apps** folder (the folder name can be changed through modena configuration options) and expose each folder using the folder name as the relative URL. In the example above, the kinder application would be exposed at **localhost/kinder**.

By default, modena exposes the **public** folder for each hosted-app through express static built-in middleware (the name of the public folder can be changed through configuration). Additionally, modena will search for the following two files inside each hosted-app:

- **modena-setup.js**: Must export a function tant returns an express Router or Promise<Router>. The router will be used to expose additional endpoints from the app relative url. (TODO Explain the configureRouter parameters in the next section)

- **modena-config.json**: Contains a JSON object with modena app-configuration options and any other property that might be used during the modena-setup (see app-configuration TODO)

The recommended case for folder names is kebab-case (e.g. valid-folder-name); it results in nicer URLs and is required for the environment variables transformation if using Docker (TODO include link to global app- configuration section)

## App registering

TODO Explain it from the point of view of the one who registers

For each folder found in the apps folder, modena exposes the assets folder (named public by default). If the app contains a **modena-setup.js** file, it will also require it and execute the default function it exports with the following parameters

- router: express.Router
- config: AppConfig
- middleware: AppMiddleware
- utils: AppUtils

TODO Continue from here

For examples of applications that can run on modena see [modena-examples](https://github.com/L3bowski/modena-examples). Currently there are two ways to expose a web application with modena:

- Defining and index.js that exports a function that returns an express router (or a Promise returning and express router)
- Placing static files in a folder called public inside the hosted-app folder (the public folder name can be customized through a modena-config.json file in the root folder of the hosted-app)

TODO Congifuration options