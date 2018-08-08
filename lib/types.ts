export interface AppConfig {
	name: string;
	modenaSetupPath?: string;
	path: string;
	assetsFolder: string;
	publicDomains?: string[];
	[key: string]: any;
}

export interface AppMiddleware {
	passport?: any;
	bodyParser?: any;
	session?: any
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
	[key: string]: any;
}