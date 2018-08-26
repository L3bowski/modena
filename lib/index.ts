import { configureWinston } from './winston-config';
import tracer from './tracer';
import express from 'express';
import { join } from 'path';
import { configurePassport } from './passport';
import { discoverApps } from './app-discovery';
import { getAppResolverMiddleware } from './app-resolver';
import { registerApps } from './app-register';
import { ModenaConfig, AppConfig } from './types';

const server = express();
const defaultConfig = (modenaConfig: ModenaConfig) => {
	// When following line is executed, __dirname equals:
	// project/node_modules/modena/build
	modenaConfig.appsFolder = modenaConfig.appsFolder || join(__dirname, '..', '..', '..', 'apps');
	modenaConfig.enableConsoleLogs = modenaConfig.enableConsoleLogs || 'false';
	modenaConfig.logFilename = modenaConfig.logFilename || 'logs.txt';
	modenaConfig.tracerLevel = modenaConfig.tracerLevel || 'error';
	modenaConfig.PORT = modenaConfig.PORT || 80;
};

const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
	const configProperties = Object.keys(modenaConfig);
	const overridenPropeties = Object.keys(process.env).filter(p => configProperties.includes(p));
	overridenPropeties.forEach(p => modenaConfig[p] = process.env[p]);
};

const extractAppsConfiguration = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
	appsConfig.forEach(appConfig => {
		const appPropertiesKey = [];
		for (const key in modenaConfig) {
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

export const runServer = (modenaConfig: ModenaConfig) => {
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
		tracedServerListen(modenaConfig.PORT, function (error: any) {
			if (error) {
				tracer.error(error);
			}
			else {
				tracer.info('Express server listening on port ' + modenaConfig.PORT);
			}
		});
	});
};

export default {
	express,
	runServer,
	tracer
};

module.exports = {
	express,
	runServer,
	tracer
};
