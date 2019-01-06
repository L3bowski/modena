import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
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

    let isHttpsEnabled = false;
    if (modenaConfig.ENABLE_HTTPS) {
        if (!modenaConfig.HTTPS_KEY_PATH) {
            tracer.error('The HTTPS_KEY_PATH needs to be provided in order to enable HTTPS');
        }
        else if (!modenaConfig.HTTPS_CERT_PATH) {
            tracer.error('The HTTPS_CERT_PATH needs to be provided in order to enable HTTPS');        
        }
        else {
            isHttpsEnabled = true;
        }
    }

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

    if (modenaConfig.HTTPS_REDIRECTION) {
        server.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (req.secure) {
                next();
            }
            else {
                res.redirect('https://' + req.headers.host + req.url);
            }
        });
    }

    server.use(getAppResolverMiddleware(modenaConfig, appsConfig));

    tracedRegisterApps(server, modenaConfig, appsConfig)
    .then(() => {
        if (modenaConfig.afterRegisteringApps) {
            modenaConfig.afterRegisteringApps(server, tracer, modenaConfig, appsConfig);
        }
    
        const listenHandler = (portNumber: string, protocol: string) => (error: any) => {
            if (error) {
                tracer.error(error);
            }
            else {
                tracer.info(`Modena ${protocol} server listening on port ${portNumber}`);
            }
        };

        http.createServer(server).listen(modenaConfig.PORT, listenHandler(modenaConfig.PORT, 'HTTP'));

        try {
            if (isHttpsEnabled) {
                const credentials = {
                    key: fs.readFileSync(modenaConfig.HTTPS_KEY_PATH),
                    cert: fs.readFileSync(modenaConfig.HTTPS_CERT_PATH),
                    passphrase: modenaConfig.HTTPS_PASSPHRASE
                };
                const httpsPort = '443';
                https.createServer(credentials, server).listen(httpsPort,  listenHandler(httpsPort, 'HTTPS'));
            }
        }
        catch(error) {
            tracer.error(error);
        }
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
