import express from 'express';

export interface AppConfig {
    name: string;
    modenaSetupPath?: string;
    path: string;
    assetsFolder: string;
    publicDomains?: string[];
    allowNamespaceTraversal?: boolean;
    [key: string]: any;
}

export interface AppMiddleware {
    passport?: any;
    bodyParser?: any;
    session?: any;
}

export interface AppRouterPromise {
    hasError: boolean;
    appRouter?: express.Router;
}

export interface AppUtils {
    userManagementUtils?: any;
}

export type ConfigureEndpoints = (router: express.Router, config: AppConfig, middleware: AppMiddleware, utils: AppUtils) => void | Promise<void>;

export interface IsolatedResponse extends express.Response {
    _render?(view: string, options?: Object, callback?: (err: Error, html: string) => void): void;
}

// The ModenaConfig properties use SNAKE_CASE for Docker compatibility
export interface ModenaConfig {
    APPS_FOLDER?: string;
    DEFAULT_APP?: string;
    DISABLE_CONSOLE_LOGS?: string;
    LOG_FILENAME?: string;
    PORT?: string;
    SESSION_SECRET?: string;
    ENABLE_HTTPS?: boolean;
    HTTPS_KEY_PATH?: string;
    HTTPS_CERT_PATH?: string;
    HTTPS_PASSPHRASE?: string;
    HTTPS_REDIRECTION?: boolean;
    afterRegisteringApps?: (server: express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    beforeRegisteringApps?: (server: express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    [key: string]: any;
}

export interface ModenaQueryParameters extends Object {
    $modena?: string;
}