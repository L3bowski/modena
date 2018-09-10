import { join } from 'path';
import { AppConfig, ModenaConfig } from './types';

export const defaultConfig = (configParameters: any): ModenaConfig => {
    // When following line is executed, __dirname equals XXX/node_modules/modena/build
    const modenaConfig: ModenaConfig = {
        afterRegisteringApps: configParameters.afterRegisteringApps || null,
        APPS_FOLDER: configParameters.APPS_FOLDER || join(__dirname, '..', '..', '..', 'apps'),
        beforeRegisteringApps: configParameters.beforeRegisteringApps || null,
        DEFAULT_APP: configParameters.DEFAULT_APP || null,
        ENABLE_CONSOLE_LOGS: configParameters.ENABLE_CONSOLE_LOGS || 'false',
        LOG_FILENAME: configParameters.LOG_FILENAME || 'logs.txt',
        PORT: configParameters.PORT || 80,
        SESSION_SECRET: configParameters.SESSION_SECRET || null
    };
    return modenaConfig;
};

export const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
    const overrideModenaConfig = { ...modenaConfig };
    Object.keys(process.env).forEach(key => overrideModenaConfig[key] = process.env[key]);
    return overrideModenaConfig;
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