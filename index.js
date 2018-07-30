const { configureWinston } = require('./lib/winston-config');
const tracer = require('./lib/tracer');
const express = require('express');
const server = express();
const { join } = require('path');
const { configurePassport } = require('./lib/passport');
const { discoverApps } = require('./lib/app-discovery');
const { getAppResolverMiddleware } = require('./lib/app-resolver');
const { registerApps } = require('./lib/app-register');

const defaultConfig = modenaConfig => {
	modenaConfig.appsFolder = modenaConfig.appsFolder || join(__dirname, '..', '..', 'apps');
	modenaConfig.enableConsoleLogs = modenaConfig.enableConsoleLogs || 'false';
	modenaConfig.logFilename = modenaConfig.logFilename || 'logs.txt';
	modenaConfig.tracerLevel = modenaConfig.tracerLevel || 'error';
	modenaConfig.PORT = modenaConfig.PORT || 80;
};

const overrideEnvironmentParameters = modenaConfig => {
	const configProperties = Object.keys(modenaConfig);
	const overridenPropeties = Object.keys(process.env).filter(p => configProperties.includes(p));
	overridenPropeties.forEach(p => modenaConfig[p] = process.env[p]);
};

const extractAppsConfiguration = (modenaConfig, appsConfig) => {
	appsConfig.forEach(appConfig => {
		const appPropertiesKey = [];
		for (key in modenaConfig) {
			if (key.startsWith(appConfig.name)) {
				appPropertiesKey.push(key);
			}
		}
		appPropertiesKey.forEach(key => {
			const appKey = key.replace(appConfig.name + '_', '');
			appConfig[appKey] = modenaConfig[key];
			delete modenaConfig[key];
		});
	});
};

const runServer = modenaConfig => {
	defaultConfig(modenaConfig);
	overrideEnvironmentParameters(modenaConfig);

	configureWinston(modenaConfig);

	tracer.setTraceLevel(modenaConfig.tracerLevel);
	
	server.set('view engine', 'ejs');
	
	server.set('views', modenaConfig.appsFolder);

	const tracedConfigurePassport = tracer.trace(configurePassport);
	tracedConfigurePassport(server);

	const tracedDiscoverApps = tracer.trace(discoverApps);
	const appsConfig = tracedDiscoverApps(modenaConfig);
	extractAppsConfiguration(modenaConfig, appsConfig);

	if (typeof modenaConfig.beforeRegisteringApps == 'function') {
		modenaConfig.beforeRegisteringApps(server, tracer, modenaConfig, appsConfig);
	}

	const tracedAppResolverMiddleware = tracer.trace(getAppResolverMiddleware(modenaConfig, appsConfig));
	server.use(tracedAppResolverMiddleware);

	const tracedRegisterApps = tracer.trace(registerApps);
	tracedRegisterApps(server, modenaConfig, appsConfig)
	.then(() => {
		if (typeof modenaConfig.afterRegisteringApps == 'function') {
			modenaConfig.afterRegisteringApps(server, tracer, modenaConfig, appsConfig);
		}
	
		const tracedServerListen = tracer.trace('listen', server);
		tracedServerListen(modenaConfig.PORT, function (error) {
			if (error) {
				tracer.error(error);
			}
			else {
				tracer.info('Express server listening on port ' + modenaConfig.PORT);
			}
		});
	});
};

module.exports = {
	express,
	runServer,
	tracer
};
