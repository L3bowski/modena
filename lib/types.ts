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

export interface AppUtils {
    userManagementUtils?: any;
}

// The ModenaConfig properties use SNAKE_CASE for Docker compatibility
export interface ModenaConfig {
    APPS_FOLDER?: string;
    DEFAULT_APP?: string;
    DISABLE_CONSOLE_LOGS?: string;
    LOG_FILENAME?: string;
    PORT?: string;
    SESSION_SECRET?: string;
    afterRegisteringApps?: (server: express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    beforeRegisteringApps?: (server: express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    [key: string]: any;
}

export interface IsolatedResponse extends express.Response {
    _render?(view: string, options?: Object, callback?: (err: Error, html: string) => void): void;
}

export interface ModenaQueryParameters extends Object {
    $modena?: string;
}