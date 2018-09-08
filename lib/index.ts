import express from 'express';
import { join } from 'path';
import { discoverApps } from './app-discovery';
import { tracedRegisterApps } from './app-register';
import { getAppResolverMiddleware } from './app-resolver';
import { tracedConfigurePassport } from './passport';
import tracer from './tracer';
import { AppConfig, ModenaConfig } from './types';

const defaultConfig = (modenaConfig: ModenaConfig) => {
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

const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
    Object.keys(process.env).forEach(key => modenaConfig[key] = process.env[key]);
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
    tracer.setUpTracer(modenaConfig);

    tracer.info('Starting modena with following configuration');
    Object.keys(modenaConfig).forEach(key => tracer.info(key + ': ' + modenaConfig[key]));

    const server = express();
    
    server.set('view engine', 'ejs');
    
    server.set('views', modenaConfig.APPS_FOLDER);

    tracedConfigurePassport(server);

    const appsConfig = discoverApps(modenaConfig);

    extractAppsConfiguration(modenaConfig, appsConfig);

    if (modenaConfig.beforeRegisteringApps) {
        modenaConfig.beforeRegisteringApps(server, tracer, modenaConfig, appsConfig);
    }

    server.use(getAppResolverMiddleware(modenaConfig, appsConfig));

    tracedRegisterApps(server, modenaConfig, appsConfig)
    .then(() => {
        if (modenaConfig.afterRegisteringApps) {
            modenaConfig.afterRegisteringApps(server, tracer, modenaConfig, appsConfig);
        }
    
        server.listen(modenaConfig.PORT, function (error: any) {
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
