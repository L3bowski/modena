# modena

Express server wrapper that allows exposing multiple express web applications with in the same express instance, while keeping them isolated from each other.

## Usage

To use modena to host one or more apps a new app must be created (let's call it host-app). All the web applications that need to be exposed from the host-app (let's call them guest-apps) must be placed in the apps folder. Also, all the additional dependencies (i.e. anyone not included in modena dependencies) used in the guest-apps need to be installed in the host-app.

Each guest-app will be exposed in the url of the host-app plus the name of the folder in which it is located under apps. For example, in the following example (file structure of a sample host-app), if the host-app is published at 'localhost:3000', the kinder guest-app will be available at 'localhost:3000/kinder'.

.
+-- apps
|   +-- kidner
|   |   +-- public
|   |   +-- views
|   |   +-- index.js
|   |   +-- package.json
|   |   +-- package-lock.json
+-- index.js
+-- package.json
+-- package-lock.json