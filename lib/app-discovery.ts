import { existsSync } from 'fs';
import { join } from 'path';
import tracer from './tracer';
import { AppConfig, ModenaConfig } from './types';
import { getDirectoriesName } from './utils';

export const discoverApps = (modenaConfig: ModenaConfig) => {
    const appsFolderName = tracer.trace(getDirectoriesName)(modenaConfig.APPS_FOLDER);
    
    tracer.info('Discovered ' + appsFolderName.length + ' folders');

    const appsConfig = appsFolderName.map((appName: string) => {
        const appPath = join(modenaConfig.APPS_FOLDER, appName);

        const appConfig: AppConfig = {
            name: appName,
            path: appPath,
            assetsFolder: 'public'
        };

        const configFilePath = join(appPath, 'modena-config.json');
        if (existsSync(configFilePath)) {
            tracer.info(appName + ': Loading additional configuration');
            const localConfig = require(configFilePath);
            Object.assign(appConfig, localConfig);
        }

        const modenaSetupPath = join(appPath, 'modena-setup.js');
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
};
