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

export interface ModenaConfig {
    appsFolder: string;
    enableConsoleLogs: any;
    logFilename: any;
    tracerLevel: any;
    PORT: any;
    defaultApp?: string;
    beforeRegisteringApps?: (server: Express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    afterRegisteringApps?: (server: Express.Application, tracer: any, modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => void;
    [key: string]: any;
}