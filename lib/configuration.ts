import { join } from 'path';
import { AppConfig, ModenaConfig } from './types';

export const defaultConfig = (modenaConfig: ModenaConfig) => {
    // When following line is executed, __dirname equals XXX/node_modules/modena/build
    modenaConfig.afterRegisteringApps = modenaConfig.afterRegisteringApps || null;
    modenaConfig.APPS_FOLDER = modenaConfig.APPS_FOLDER || join(__dirname, '..', '..', '..', 'apps');
    modenaConfig.beforeRegisteringApps = modenaConfig.beforeRegisteringApps || null;
    modenaConfig.DEFAULT_APP = modenaConfig.DEFAULT_APP || null;
    modenaConfig.ENABLE_CONSOLE_LOGS = modenaConfig.ENABLE_CONSOLE_LOGS || 'false';
    modenaConfig.LOG_FILENAME = modenaConfig.LOG_FILENAME || 'logs.txt';
    modenaConfig.PORT = modenaConfig.PORT || 80;
    modenaConfig.SESSION_SECRET = modenaConfig.SESSION_SECRET || null;
};

export const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
    Object.keys(process.env).forEach(key => modenaConfig[key] = process.env[key]);
};

export const extractAppsConfiguration = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
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