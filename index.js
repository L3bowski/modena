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
	modenaConfig.tracerLevel = modenaConfig.tracerLevel || 'error';
	modenaConfig.PORT = modenaConfig.PORT || 80;
}

const runServer = modenaConfig => {
	defaultConfig(modenaConfig);

	configureWinston(modenaConfig);

	tracer.setTraceLevel(modenaConfig.tracerLevel);
	
	server.set('view engine', 'ejs');
	
	server.set('views', modenaConfig.appsFolder);

	const tracedConfigurePassport = tracer.trace(configurePassport);
	tracedConfigurePassport(server);

	const tracedDiscoverApps = tracer.trace(discoverApps);
	const appsConfig = tracedDiscoverApps(modenaConfig);

	const tracedAppResolverMiddleware = tracer.trace(getAppResolverMiddleware(modenaConfig, appsConfig));
	server.use(tracedAppResolverMiddleware);

	if (typeof modenaConfig.beforeRegisterApps == 'function') {
		modenaConfig.beforeRegisterApps(server, modenaConfig, appsConfig, express);
	}

	const tracedRegisterApps = tracer.trace(registerApps);
	tracedRegisterApps(server, modenaConfig, appsConfig);

	const tracedServerListen = tracer.trace('listen', server);
	tracedServerListen(modenaConfig.PORT, function (error) {
		if (error) {
			tracer.error(error);
		}
		else {
			tracer.info('Express server listening on port ' + modenaConfig.PORT);
		}
	});
};

module.exports = {
	express,
	runServer,
	tracer
};
