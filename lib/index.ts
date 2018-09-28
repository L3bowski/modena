import express from 'express';
import { tracedConfigurePassport } from './app-extensions/passport';
import { discoverApps } from './core/app-discovery';
import { configureEndpoints, tracedRegisterApps } from './core/app-register';
import { getAppResolverMiddleware } from './core/app-resolver';
import {
    defaultConfig,
    extractAppsConfiguration,
    overrideEnvironmentParameters,
    readConfigFile
} from './core/configuration';
import { ModenaConfig } from './types';
import tracer from './utils/tracer';

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

    const server: express.Application = express();
    
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
    
        server.listen(modenaConfig.PORT, (error: any) => {
            if (error) {
                tracer.error(error);
            }
            else {
                tracer.info('Express server listening on port ' + modenaConfig.PORT);
            }
        });
    })
    .catch(error => tracer.error(error));
};

export default {
    configureEndpoints,
    express,
    readConfigFile,
    runServer,
    tracer,
};

module.exports = {
    configureEndpoints,
    express,
    readConfigFile,
    runServer,
    tracer
};
