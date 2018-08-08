import { join } from 'path';
import express from 'express';
import assets from 'express-asset-versions';
import { compileAppSass } from './sass-compiler';
import session from 'express-session';
import bodyParser from 'body-parser';
import passport from 'passport';
import tracer from './tracer';
import { getUserManagementUtils } from './passport';
import { ModenaConfig, AppConfig, AppMiddleware, AppUtils } from './types';

const registerApp = (server: express.Application, modenaConfig: ModenaConfig, appConfig: AppConfig) => {
	tracer.info('App name: ' + appConfig.name);

	const jsonMiddleware = bodyParser.json();
	const sessionMiddleware = session({
		secret: modenaConfig.sessionSecret,
		resave: false,
		saveUninitialized: true,
		name: appConfig.name
	});

	let appMiddleware: AppMiddleware = {
		bodyParser: jsonMiddleware,
		session: sessionMiddleware,
	};
	let appUtils: AppUtils = {};

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
				const appRouter: any = tracedConfigureRoute(appMiddleware, appUtils, appConfig);
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

export const registerApps = (server: express.Application, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
	const tracedRegisterApp = tracer.trace(registerApp);
	const registerPromises = appsConfig.map(appConfig => tracedRegisterApp(server, modenaConfig, appConfig));
	return Promise.all(registerPromises);
};
