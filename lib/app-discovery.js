const tracer = require('./tracer');
const { lstatSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');

const isDirectory = path => lstatSync(path).isDirectory();

const getDirectoriesName = path => readdirSync(path).filter(name => isDirectory(join(path, name)));

const discoverApps = config => {
	var appsFolderName = tracer.trace(getDirectoriesName)(config.appsFolder);
	
	tracer.info('Discovered ' + appsFolderName.length + ' folders');

	var appsConfig = appsFolderName.map(appName => {
		var appPath = join(config.appsFolder, appName);

		var appConfig = {
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

module.exports = { discoverApps };
