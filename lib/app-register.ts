import bodyParser from 'body-parser';
import express, { Handler } from 'express';
import assets from 'express-asset-versions';
import session from 'express-session';
import passport from 'passport';
import { join } from 'path';
import { getUserManagementUtils } from './passport';
import { compileAppSass } from './sass-compiler';
import tracer from './tracer';
import { AppConfig, AppMiddleware, AppUtils, ModenaConfig } from './types';

const registerApp = (server: express.Application, modenaConfig: ModenaConfig, appConfig: AppConfig) => {
    tracer.info('App name: ' + appConfig.name);

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

    const assetsPath = join(appConfig.path, appConfig.assetsFolder);
    let routerPromise: Promise<Handler | void> = Promise.resolve();

    if (appConfig.modenaSetupPath != null) {
        const { configureRouter } = require(appConfig.modenaSetupPath);
        const tracedConfigureRoute = tracer.trace(configureRouter);

        routerPromise = new Promise((resolve, reject) => {
            try
            {
                const appRouter: Handler = tracedConfigureRoute(appMiddleware, appUtils, appConfig);
                resolve(appRouter);
            }
            catch(error)
            {
                reject(error);
            }
        });
    }

    return routerPromise
    .then(appRouter => {
        tracer.info(`Registering ${appConfig.name} routes`);
        server.use('/' + appConfig.name, express.static(assetsPath));
        server.use(assets('/' + appConfig.name, assetsPath));
        if (appRouter) {
            server.use('/' + appConfig.name, appRouter);
        }
    })
    .catch(error => {
        tracer.error('An error occurred when trying to register ' + appConfig.name);
        tracer.error(error);
    });    
};

export const registerApps = (server: express.Application, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
    const tracedRegisterApp = tracer.trace(registerApp);
    const registerPromises = appsConfig.map(appConfig => tracedRegisterApp(server, modenaConfig, appConfig));
    return Promise.all(registerPromises);
};
