import { existsSync } from 'fs';
import { join } from 'path';
import { AppConfig, ModenaConfig } from './types';

export const defaultConfig = (configParameters: ModenaConfig): ModenaConfig => {
    // When following line is executed, __dirname equals XXX/node_modules/modena/build
    const modenaConfig: ModenaConfig = {
        ...configParameters,
        afterRegisteringApps: configParameters.afterRegisteringApps || null,
        APPS_FOLDER: configParameters.APPS_FOLDER || join(__dirname, '..', '..', '..', 'apps'),
        beforeRegisteringApps: configParameters.beforeRegisteringApps || null,
        DEFAULT_APP: configParameters.DEFAULT_APP || null,
        DISABLE_CONSOLE_LOGS: configParameters.DISABLE_CONSOLE_LOGS == undefined ? 'false' : configParameters.DISABLE_CONSOLE_LOGS,
        LOG_FILENAME: configParameters.LOG_FILENAME || 'logs.txt',
        PORT: configParameters.PORT || '80',
        SESSION_SECRET: configParameters.SESSION_SECRET || null
    };
    return modenaConfig;
};

export const extractAppsConfiguration = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
    appsConfig.forEach(appConfig => {
        const appPrefix = appConfig.name.toUpperCase().replace(/-/g, '_') + '__';
        Object.keys(modenaConfig).forEach(key => {
            if (key.startsWith(appPrefix)) {
                const appPropertyName = key.replace(appPrefix, '');
                appConfig[appPropertyName] = modenaConfig[key];
                delete modenaConfig[key];
            }
        });
    });
};

export const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
    const overrideModenaConfig = { ...modenaConfig };
    Object.keys(process.env).forEach(key => overrideModenaConfig[key] = process.env[key]);
    return overrideModenaConfig;
};

export const readConfigFile = (filepath: string): ModenaConfig => {
    let modenaConfig: ModenaConfig = {};
    if (existsSync(filepath)) {
        modenaConfig = require(filepath);
    }
    else {
        console.error('No configuration file was found at' + filepath);
    }
    return modenaConfig;
};