# modena

Express server wrapper that allows exposing multiple express applications, **hosted-apps**, inside the same express instance while keeping them isolated from each other.

## Usage

A new node project, **wrapper-app**, must be created in order to expose any number of applications. The wrapper-app contains the entry file from which express will be started, is responsible for setting environment variables configuration and installs all the dependencies required by the hosted-apps.

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

The entry file just loads the configuration if required and starts the express server:

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

The recommended case for folder names is kebab-case (e.g. valid-folder-name); it results in nicer URLs and is required for the environment variables transformation when using Docker (see [defining app-specific environment variables](#defining-app-specific-environment-variables)).

## App registering

For each folder found in the apps folder, modena exposes the assets folder (named public by default) using the folder name as the relative URL. Additionally, if the app contains a **modena-setup.js** file, it will also require it and execute the default function it exports with the following parameters:

- **router**: express.Router that will be exposed at the app name relative URL
- **config**: Configuration parameters including the ones defined in modena-config.json and the app environment variables defined in the modena configuration (see defining app-specific environment variables)
- **middleware**: An AppMiddleware instance that includes json parsing middleware (through body-parser), session middleware (through express-session), etc.
- **utils**: An AppUtils instance containing, for now, a function to define passport authentication strategies and get passport logging middleware

If the endpoint configuration is asynchronous (e.g., it requires database synchronization on application start up), the exported function must return a promise. If no promise is returned, modena might start the express server without registering the application routes.

_**Tip**_: When using modena with Typescript, the exported function can passed as a parameter to the configureEndpoints method to get parameters typing information:

```javascript
module.exports = configureEndpoints((router, config, middleware, utils) => {
    /// ...
});
```

## App URLs resolving

TODO Explain the core idea of app access (always by pathname)

Modena evaluates each incoming Http request and tries to resolve it to the corresponding hosted-app based on the url domain, the pathname, the query parameters and modena configuration. The following rules will be applied in order for each request and, if a match is found, the request url will be adapted so that matches the corresponding hosted-app:

1. **Domain**: Hosted-apps can be configured to match a public domain (e.g. www.example.com) by setting the publicDomains property in the modena-config.json file (TODO Link to the config documentation). If a request url domain matches any of the public domains of a hosted-app, the hosted-app name will be prepended to the request url pathname, and thus the request will match the hosted-app.

    kinder > modena-config.json
    ```javascript
    {
        "publicDomains": [ "my-website.xyz" ]
    }
    ```

    - http://my-website.xyz will be internally transformed to http://my-website.xyz/kinder
    - http://my-website.xyz/about will be internally transformed to http://my-website.xyz/kinder/about

    Be aware that if same domain is being configured in more than one app, the requests will always be matched against the first hosted-app in alphabetical order.

    TODO Mention the allowNamespaceTraversal property

2. **Query parameters**: TODO
3. **Url pathname**: TODO. In this case, the URL is not modified
4. **Modena default app**: (TODO Link to the config)

## Defining global environment variables

TODO runServer can receive an string

## Defining app-specific environment variables

Some application settings can not be hardcoded in the code (e.g. passwords, database connection strings, api keys, etc.). For that purpose, modena allows defining parameters in the **wrapper-app** configuration that will then be passed to a **hosted-app** configuration object.

For modena to know that a parameter needs to be transfered to an application, the parameter name must begin with the application name in SNAKE_CASE (capitalized and replacing the dashes with underscores) followed by two underscores and then the parameter name in SNAKE_CASE too. Notice that any parameter that match this criteria will be removed from the global configuration and transfered to the matching application configuration.

The restriction on the parameter names is due to the fact that docker environment variables must be defined in SNAKE_CASE and, therefore, this is the only way to make modena docker-compatible.

In the following example, the KINDER_APP__DATABASE_PASSWORD parameter will be passed to the kinder-app application and hence removed from the global configuration:

```javascript
const { runServer } = require('modena');

const config = {
    PORT: '3000',
    KINDER_APP__DATABASE_PASSWORD: 'top_secret'
};

runServer(config);
```

Later on, the kinder-app will receive the parameter when configuring the endpoints:

```javascript
module.exports = configureEndpoints((router, config, middleware, utils) => {
    /// ...
    config.DATABASE_PASSWORD == 'top_secret'; // true
    /// ...
});
```

## Application examples

For examples of applications that can run on modena see [modena-examples](https://github.com/L3bowski/modena-examples)