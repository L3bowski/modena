const { join } = require('path');
const express = require('express');
const assets = require('express-asset-versions');
var { compileAppSass } = require('./sass-compiler');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var tracer = require('./tracer');
var { getUserManagementUtils } = require('./passport');

const registerApp = (server, config, appConfig) => {
	tracer.info('App name: ' + appConfig.name);

	const jsonMiddleware = bodyParser.json();
	const sessionMiddleware = session({
		secret: config.sessionSecret,
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

	try
	{
		var assetsPath = join(appConfig.path, appConfig.assetsFolder);
		server.use('/' + appConfig.name, express.static(assetsPath));
		server.use(assets('/' + appConfig.name, assetsPath));

		if (appConfig.indexFilePath != null) {
			var { configureRouter } = require(appConfig.indexFilePath);
			var appRouter = tracer.trace(configureRouter)(appMiddleware, appUtils);
			server.use('/' + appConfig.name, appRouter);
		}
	}
	catch(exception)
	{
		tracer.error('An error occurred when trying to register ' + appConfig.name);
	}
};

const registerApps = (server, config, appsConfig) => {
	appsConfig.forEach(app => tracer.trace(registerApp)(server, config, app));

	server.use((req, res, next) => {
		tracer.info('Url ' + req.url + ' was not found');

		return res.status(404)._render('error-page', {
			title: "Not found",
			statusCode: 404,
			message: "The url you are looking for does not exist"
		});
	});

	server.use((err, req, res, next) => {
		tracer.error('Unhandled exception was raised');
		tracer.error(err);

		return res.status(500)._render('error-page', {
			title: "Error",
			statusCode: 500,
			message: "There is some error in the code :/"
		});
	});
};

module.exports = { registerApps };
