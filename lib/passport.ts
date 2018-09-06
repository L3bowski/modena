import express from 'express';
import passport from 'passport';
// tslint:disable-next-line:variable-name
const LocalStrategy = require('passport-local').Strategy;
import tracer from './tracer';

const userPrefixSeparator = '||->';
const deserializers: any = {};

export const configurePassport = (server: express.Application) => {

    const userSerializer = (user: any, doneCallback: Function) => {
        const namespace = user._namespace;
        delete user._namespace;
        const serializedUserId = namespace + userPrefixSeparator + user.id;
        return doneCallback(null, serializedUserId);
    };
    
    const userDeserializer = (serializedUserId: string, doneCallback: Function) => {
        const parts = serializedUserId.split(userPrefixSeparator);
        const namespace = parts[0];
        const userId = parts[1];
        return deserializers[namespace](userId)
        .then((user: any) => {
            if (!user) {
                const error = {
                    message: 'Incorrect username or password'
                };
                return doneCallback(error, null);
            }
            return doneCallback(null, user);
        });
    };

    passport.serializeUser(tracer.trace(userSerializer));
    passport.deserializeUser(tracer.trace(userDeserializer));
};

const getStrategyCreator = (namespace: string) => {
    if (namespace.indexOf(userPrefixSeparator) > -1) {
        tracer.error('Namespaces containing ' + userPrefixSeparator + ' are not valid');
        return;
    }
    
    return function createAuthenticationStrategy(handlers: any) {
        deserializers[namespace] = handlers.userDeserializer;

        const localStrategy = new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        }, (username: string, password: string, doneCallback: Function) => {
            return handlers.userAuthenticator(username, password)
            .then((user: any) => {
                if (!user) {
                    const error = {
                        message: 'Incorrect username or password'
                    };
                    return doneCallback(error, null);
                }
                
                user._namespace = namespace;
                return doneCallback(null, user);
            });
        });

        passport.use(namespace, localStrategy);
    };
};

const getLogInMiddleware = (namespace: string) => {
    return function logInMiddleware(req: any, res: any, next: Function) {

        function doneCallback(authError: any, user: any, info: any) { 
            if (authError) {
                return res.status(401).json(authError);
            }

            req.logIn(user, function (logInError: any) {
                if (logInError) {
                    return res.send(logInError);
                }
                return next();
            });
        }

        passport.authenticate(namespace, doneCallback)(req, res, next);
    };
};

const logOutMiddleware = (req: any, res: any, next: Function) => {
    delete req.session.passport;
    return next();
};

export const tracedConfigurePassport = tracer.trace(configurePassport);

export const getUserManagementUtils = (namespace: string) => {
    const userManagementUtils = {
        createStrategy: tracer.trace(getStrategyCreator(namespace)),
        logInMiddleware: tracer.trace(getLogInMiddleware(namespace)),
        logOutMiddleware: tracer.trace(logOutMiddleware)
    };
    return userManagementUtils;
};
