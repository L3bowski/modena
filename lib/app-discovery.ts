import tracer from './tracer';
import { lstatSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ModenaConfig, AppConfig } from './types';

const isDirectory = (path: string) => lstatSync(path).isDirectory();

const getDirectoriesName = (path: string) =>
	readdirSync(path).filter(name => isDirectory(join(path, name)));

export const discoverApps = (modenaConfig: ModenaConfig) => {
	var appsFolderName = tracer.trace(getDirectoriesName)(modenaConfig.appsFolder);
	
	tracer.info('Discovered ' + appsFolderName.length + ' folders');

	var appsConfig = appsFolderName.map((appName: string) => {
		const appPath = join(modenaConfig.appsFolder, appName);

		let appConfig: AppConfig = {
			name: appName,
			path: appPath,
			assetsFolder: 'public'
		};

		var configFilePath = join(appPath, 'modena-config.json');
		if (existsSync(configFilePath)) {
			tracer.info(appName + ': Loading additional configuration');
			var localConfig = require(configFilePath);
			Object.assign(appConfig, localConfig);
		}

		var modenaSetupPath = join(appPath, 'modena-setup.js');
		if (existsSync(modenaSetupPath)) {
			appConfig.modenaSetupPath = modenaSetupPath;
			tracer.info(appName + ': Loading router configuration');
		}
		else {
			tracer.info(appName + ': No router configuration found');
		}

		return appConfig;
	});

	tracer.info('Discovered ' + appsConfig.length + ' apps');

	return appsConfig;
}