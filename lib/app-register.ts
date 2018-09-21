import bodyParser from 'body-parser';
import express from 'express';
import assets from 'express-asset-versions';
import session from 'express-session';
import passport from 'passport';
import { join } from 'path';
import { getUserManagementUtils } from './passport';
import { compileAppSass } from './sass-compiler';
import tracer from './tracer';
import { AppConfig, AppMiddleware, AppUtils, ModenaConfig } from './types';

type ConfigureEndpoints = (router: express.Router, config: AppConfig, middleware: AppMiddleware, utils: AppUtils) => void | Promise<void>;

export const configureEndpoints =
    (callback: ConfigureEndpoints) => {
        const _configureEndpoints: ConfigureEndpoints = (_router, _config, _middleware, _utils) => {
            return callback(_router, _config, _middleware, _utils);
        }
        return tracer.trace(_configureEndpoints);
    };

const getErrorHandler= (appName: string) => (error: any) => {
    tracer.error('An error occurred when trying to register ' + appName);
    tracer.error(error);
};

const registerApp = (server: express.Application, modenaConfig: ModenaConfig, appConfig: AppConfig) => {
    tracer.info(`Registering app ${appConfig.name} with following configuration`);
    Object.keys(appConfig).forEach(key => tracer.info(key + ': ' + appConfig[key]));

    const jsonMiddleware = bodyParser.json();
    const sessionMiddleware = session({
        secret: modenaConfig.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        name: appConfig.name
    });

    const appMiddleware: AppMiddleware = {
        bodyParser: jsonMiddleware,
        session: sessionMiddleware,
    };
    const appUtils: AppUtils = {};

    if (appConfig.enableAuthentication) {
        const passportInitialize = passport.initialize();
        const passportSession = passport.session();
        appMiddleware.passport = [sessionMiddleware, jsonMiddleware, passportInitialize, passportSession];
        appUtils.userManagementUtils = tracer.trace(getUserManagementUtils)(appConfig.name);
    }

    if (appConfig.enableSassCompilation) {
        tracer.trace(compileAppSass)(appConfig);
    }

    tracer.info(`Registering ${appConfig.name} routes`);

    const assetsPath = join(appConfig.path, appConfig.assetsFolder);
    server.use('/' + appConfig.name, express.static(assetsPath));
    server.use(assets('/' + appConfig.name, assetsPath));        

    if (appConfig.modenaSetupPath != null) {
        try
        {
            const appRouter = express.Router();
            const configureEndpoints: ConfigureEndpoints = require(appConfig.modenaSetupPath);
            Promise.resolve(configureEndpoints(appRouter, appConfig, appMiddleware, appUtils))
                .then(_ => server.use('/' + appConfig.name, appRouter))
                .catch(getErrorHandler(appConfig.name));
        }
        catch(error)
        {
            getErrorHandler(appConfig.name)(error);
        }
    }
};

const tracedRegisterApp = tracer.trace(registerApp);

export const registerApps = (server: express.Application, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
    const registerPromises = appsConfig.map(appConfig => tracedRegisterApp(server, modenaConfig, appConfig));
    return Promise.all(registerPromises);
};

export const tracedRegisterApps = tracer.trace(registerApps);
