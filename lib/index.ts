import express from 'express';
import { join } from 'path';
import { discoverApps } from './app-discovery';
import { registerApps } from './app-register';
import { getAppResolverMiddleware } from './app-resolver';
import { configurePassport } from './passport';
import tracer from './tracer';
import { AppConfig, ModenaConfig } from './types';
import { configureWinston } from './winston-config';

const defaultConfig = (modenaConfig: ModenaConfig) => {
    // When following line is executed, __dirname equals XXX/node_modules/modena/build
    modenaConfig.afterRegisteringApps = modenaConfig.afterRegisteringApps || null;
    modenaConfig.APPS_FOLDER = modenaConfig.APPS_FOLDER || join(__dirname, '..', '..', '..', 'apps');
    modenaConfig.beforeRegisteringApps = modenaConfig.beforeRegisteringApps || null;
    modenaConfig.DEFAULT_APP = modenaConfig.DEFAULT_APP || null;
    modenaConfig.ENABLE_CONSOLE_LOGS = modenaConfig.ENABLE_CONSOLE_LOGS || 'false';
    modenaConfig.LOG_FILENAME = modenaConfig.LOG_FILENAME || 'logs.txt';
    modenaConfig.TRACER_LEVEL = modenaConfig.TRACER_LEVEL || 'error';
    modenaConfig.PORT = modenaConfig.PORT || 80;
};

const overrideEnvironmentParameters = (modenaConfig: ModenaConfig) => {
    const configProperties = Object.keys(modenaConfig);
    const overridenProperties = Object.keys(process.env).filter(p => configProperties.includes(p));
    overridenProperties.forEach(p => modenaConfig[p] = process.env[p]);
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
    tracer.setTraceLevel(modenaConfig.TRACER_LEVEL);

    tracer.info('Starting modena with following configuration');
    // TODO Update after tracer simplification
    Object.keys(modenaConfig).forEach(key => console.log(key +':', modenaConfig[key]));

    const server = express();
    
    server.set('view engine', 'ejs');
    
    server.set('views', modenaConfig.APPS_FOLDER);

    const tracedConfigurePassport = tracer.trace(configurePassport);
    tracedConfigurePassport(server);

    const tracedDiscoverApps = tracer.trace(discoverApps);
    const appsConfig = tracedDiscoverApps(modenaConfig);
    extractAppsConfiguration(modenaConfig, appsConfig);

    if (modenaConfig.beforeRegisteringApps) {
        modenaConfig.beforeRegisteringApps(server, tracer, modenaConfig, appsConfig);
    }

    const tracedAppResolverMiddleware = tracer.trace(getAppResolverMiddleware(modenaConfig, appsConfig));
    server.use(tracedAppResolverMiddleware);

    const tracedRegisterApps = tracer.trace(registerApps);
    tracedRegisterApps(server, modenaConfig, appsConfig)
    .then(() => {
        if (modenaConfig.afterRegisteringApps) {
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
