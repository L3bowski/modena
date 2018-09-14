import express from 'express';
import { discoverApps } from './app-discovery';
import { tracedRegisterApps } from './app-register';
import { getAppResolverMiddleware } from './app-resolver';
import {defaultConfig, extractAppsConfiguration, overrideEnvironmentParameters, readConfigFile} from './configuration';
import { tracedConfigurePassport } from './passport';
import tracer from './tracer';
import { ModenaConfig } from './types';

export const runServer = (configuration?: ModenaConfig | string) => {
    let modenaConfig: ModenaConfig = {};
    if (typeof configuration === 'string') {
        modenaConfig = defaultConfig(readConfigFile(configuration));
    } else {
        modenaConfig = defaultConfig(configuration || {});
    }
    modenaConfig = overrideEnvironmentParameters(modenaConfig);
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
    readConfigFile,
    runServer,
    tracer,
};

module.exports = {
    express,
    readConfigFile,
    runServer,
    tracer
};
