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

- **modena-setup.js**: Must export a function to configure an express router that will be exposed at the app name relative URL. See [app registering](#app-registering) section for more details

- **modena-config.json**: Must contain an object with app configuration parameters. The object will be injected as an argument to the function exported by modena-setup.js.

The recommended case for folder names is kebab-case (e.g. valid-folder-name); it results in nicer URLs and is required for the environment variables transformation when using Docker (see [defining app environment variables](#defining-app-environment-variables)).

## App registering

For each folder found in the apps folder, modena exposes the assets folder (named public by default) using the folder name as the relative URL. Additionally, if the app contains a **modena-setup.js** file, it will also require it and execute the default function it exports with the following parameters:

- router: express.Router that will be exposed at the app name relative URL
- config: Configuration parameters including the ones defined in modena-config.json and the app environment variables defined in the modena configuration (see defining app environment variables)
- middleware: An AppMiddleware instance that includes json parsing middleware (through body-parser), session middleware (through express-session), etc.
- utils: An AppUtils instance containing, for now, a function to define passport authentication strategies and get passport logging middleware

If the endpoint configuration is asynchronous (e.g., it requires database synchronization on application start up), the exported function must return a promise. If no promise is returned, modena might start the express server without registering the application routes.

_**Tip**_: When using modena with Typescript, the exported function can passed as a parameter to the configureEndpoints method to get parameters typing information:

```javascript
module.exports = configureEndpoints((router, config, middleware, utils) => {
    /// ...
});
```

## App URL resolver

## Defining app environment variables

## Application examples

For examples of applications that can run on modena see [modena-examples](https://github.com/L3bowski/modena-examples)