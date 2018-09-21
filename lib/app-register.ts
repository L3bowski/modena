import bodyParser from 'body-parser';
import express from 'express';
import assets from 'express-asset-versions';
import session from 'express-session';
import passport from 'passport';
import { join } from 'path';
import { getUserManagementUtils } from './passport';
import { compileAppSass } from './sass-compiler';
import tracer from './tracer';
import { AppConfig, AppMiddleware, AppRouterPromise, AppUtils, ConfigureEndpoints, ModenaConfig } from './types';

export const configureEndpoints =
    (callback: ConfigureEndpoints) => {
        const _configureEndpoints: ConfigureEndpoints = (_router, _config, _middleware, _utils) => {
            return callback(_router, _config, _middleware, _utils);
        }
        return tracer.trace(_configureEndpoints);
    };

const errorHandler= (appName: string, error: any) => {
    tracer.error('An error occurred when trying to register ' + appName);
    tracer.error(error);
};

const getAppMiddleware = (modenaConfig: ModenaConfig, appConfig: AppConfig) => {
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
    return appMiddleware;
}

const getAppRouter = (appConfig: AppConfig, appMiddleware: AppMiddleware, appUtils: AppUtils) => {
    return new Promise<AppRouterPromise>(resolve => {
        if (appConfig.modenaSetupPath == null) resolve({hasError: false});
        else {
            try
            {
                const appRouter = express.Router();
                const configureEndpoints: ConfigureEndpoints = require(appConfig.modenaSetupPath);
                const appPromise = configureEndpoints(appRouter, appConfig, appMiddleware, appUtils);
                if (!appPromise) {
                    // Means the configureEndpoints is synchronous;
                    // The routerPromise can be resolved straight away
                    resolve({hasError: false, appRouter});
                }
                else {
                    tracer.info(`Waiting for ${appConfig.name} asynchronous endpoints configuration...`);
                    // Means the configureEndpoints is asynchronous;
                    // The routerPromise must be resolved on appPromise completion
                    appPromise
                    .then(_ => resolve({hasError: false, appRouter}))
                    .catch(error => {
                        // If an exception is caught here will be due to a appPromise rejection
                        errorHandler(appConfig.name, error);
                        resolve({hasError: true});
                    });
                }
            }
            catch (error)
            {
                // If an exception is caught here it will likely be due to configureEndpoints not found
                // or not being a function
                errorHandler(appConfig.name, error);
                resolve({hasError: true});
            }
        } 
    });
}

const getAppUtils = (appConfig: AppConfig, appMiddleware: AppMiddleware) => {
    const appUtils: AppUtils = {};

    if (appConfig.enableAuthentication) {
        const passportInitialize = passport.initialize();
        const passportSession = passport.session();
        appMiddleware.passport = [
            appMiddleware.session,
            appMiddleware.bodyParser,
            passportInitialize,
            passportSession];
        appUtils.userManagementUtils = tracer.trace(getUserManagementUtils)(appConfig.name);
    }

    return appUtils;
}

const registerApp = (server: express.Application, modenaConfig: ModenaConfig, appConfig: AppConfig) => {
    tracer.info(`Registering app ${appConfig.name} with following configuration`);
    Object.keys(appConfig).forEach(key => tracer.info(key + ': ' + appConfig[key]));

    const appMiddleware = getAppMiddleware(modenaConfig, appConfig);
    const appUtils = getAppUtils(appConfig, appMiddleware);

    if (appConfig.enableSassCompilation) {
        tracer.trace(compileAppSass)(appConfig);
    }

    getAppRouter(appConfig, appMiddleware, appUtils)
    .then(routerResult => {
        if (routerResult.hasError) tracer.info(`Partially registering ${appConfig.name} routes`);
        else tracer.info(`Registering ${appConfig.name} routes`);

        const assetsPath = join(appConfig.path, appConfig.assetsFolder);
        server.use('/' + appConfig.name, express.static(assetsPath));
        server.use(assets('/' + appConfig.name, assetsPath));        
    
        if (routerResult.appRouter) server.use('/' + appConfig.name, routerResult.appRouter);
    })
};

export const registerApps = (server: express.Application, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
    const registerPromises = appsConfig.map(appConfig => tracedRegisterApp(server, modenaConfig, appConfig));
    return Promise.all(registerPromises);
};

const tracedRegisterApp = tracer.trace(registerApp);

export const tracedRegisterApps = tracer.trace(registerApps);
