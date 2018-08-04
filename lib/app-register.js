const { join } = require('path');
const express = require('express');
const assets = require('express-asset-versions');
const { compileAppSass } = require('./sass-compiler');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const tracer = require('./tracer');
const { getUserManagementUtils } = require('./passport');

const registerApp = (server, modenaConfig, appConfig) => {
	tracer.info('App name: ' + appConfig.name);

	const jsonMiddleware = bodyParser.json();
	const sessionMiddleware = session({
		secret: modenaConfig.sessionSecret,
		resave: false,
		saveUninitialized: true,
		name: appConfig.name
	});

	let appMiddleware = {
		bodyParser: jsonMiddleware,
		session: sessionMiddleware,
	};
	let appUtils = {};

	if (appConfig.enableAuthentication) {
		const passportInitialize = passport.initialize();
		const passportSession = passport.session();
		appMiddleware.passport = [sessionMiddleware, jsonMiddleware, passportInitialize, passportSession];
		appUtils.userManagementUtils = tracer.trace(getUserManagementUtils)(appConfig.name);
	}

	if (appConfig.enableSassCompilation) {
		tracer.trace(compileAppSass)(appConfig);
	}

	let assetsPath = join(appConfig.path, appConfig.assetsFolder);
	let routerPromise = Promise.resolve();

	if (appConfig.modenaSetupPath != null) {
		const { configureRouter } = require(appConfig.modenaSetupPath);
		const tracedConfigureRoute = tracer.trace(configureRouter);

		routerPromise = new Promise((resolve, reject) => {
			try
			{
				const appRouter = tracedConfigureRoute(appMiddleware, appUtils, appConfig);
				resolve(appRouter);
			}
			catch(error)
			{
				reject(error);
			}
		});
	}

	return routerPromise
	.then(appRouter => {
		tracer.info(`Registering ${appConfig.name} routes`);
		server.use('/' + appConfig.name, express.static(assetsPath));
		server.use(assets('/' + appConfig.name, assetsPath));
		if (appRouter) {
			server.use('/' + appConfig.name, appRouter);
		}
	})
	.catch(error => {
		tracer.error('An error occurred when trying to register ' + appConfig.name);
		tracer.error(error);
	});	
};

const registerApps = (server, modenaConfig, appsConfig) => {
	const tracedRegisterApp = tracer.trace(registerApp);
	const registerPromises = appsConfig.map(appConfig => tracedRegisterApp(server, modenaConfig, appConfig));
	return Promise.all(registerPromises);
};

module.exports = { registerApps };
