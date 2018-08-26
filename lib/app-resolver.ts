import { ModenaConfig, AppConfig } from './types';
import { info } from './tracer';
import { join } from 'path';

const isolateViewsAccess = (namespace: string, res: any) => {
	res._render = res.render;
	res.render = function(viewName: string, parameters: any) {
		const isolateView = join(namespace, 'views', viewName);
		this._render(isolateView, parameters);
	};
};

export const updateUrlPathname = (namespace: string, relativeUrl: string) => {
	var namespacePrefix = '/' + namespace;
	var namespacedUrl = relativeUrl;

	if (relativeUrl == null || relativeUrl == '') {
		namespacedUrl = namespacePrefix;
	}
	else if (relativeUrl == '/') {
		namespacedUrl = namespacePrefix + '/';
	}
	else if (!relativeUrl.startsWith(namespacePrefix)) {
		namespacedUrl = namespacePrefix + relativeUrl;
	}
	
	return namespacedUrl;
};

export const getAccessedAppConfig = (
	urlDomain: string,
	urlPathname: string,
	queryParameters: any,
	appsConfig: AppConfig[],
	defaultApp?: string) => {
	
	let accessedApp: AppConfig;
		
	// 1) Match by public domain (e.g.: appConfig.publicDomains.includes('http://public-domain.com'))
	accessedApp = appsConfig.find(appConfig => {
		return appConfig.publicDomains != null &&
			appConfig.publicDomains.find(domain => domain == urlDomain) != null;
	});

	// Apps exposed to a public domain might allow accessing other apps from the domain by app name
	// (e.g. app1 is exposed at http://domain.com along with http://domain.com/app1-endpoint, but still
	// http://domain.com/app2 and http://domain.com?$modena=app2 are accessible).
	// In that case (allowNamespaceTraversal), the actual accessedApp might be a another one

	if (!accessedApp || accessedApp.allowNamespaceTraversal) {

		// 2) Match by query string parameters (e.g: http://localhost?$modena=app-name)
		if (queryParameters.$modena) {
			accessedApp = appsConfig.find(appConfig => appConfig.name === queryParameters.$modena);
		}

		if (!accessedApp) {
			// 3) Match by app name (e.g: http://localhost/app-name)
			accessedApp = appsConfig.find(appConfig => {
				var regexBase = "\\/" + appConfig.name + "(\\/|\\?|$)"
				var regex = new RegExp(regexBase, "g");
				return urlPathname.match(regex) ? true : false;
			});
		}
	}

	if (!accessedApp && defaultApp) {
		accessedApp = appsConfig.find(appConfig => appConfig.name === defaultApp);
	}

	return accessedApp;
};

export const getAppResolverMiddleware = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => {
	const appResolverMiddleware = (req: any, res: any, next: any) => {
		info('Relative url:' + req.url);

		const accessedApp = getAccessedAppConfig(req.headers.host, req.url, req.query, appsConfig, modenaConfig.defaultApp);
		if (accessedApp) {
			info('Accessed app: ' + accessedApp.name);
			req._namespace = accessedApp.name;
			req.url = updateUrlPathname(accessedApp.name, req.url);
			isolateViewsAccess(accessedApp.name, res);
		}
		else {
			info('Could not resolve the url to any of the existing apps...');
		}

		return next();
	};
	return appResolverMiddleware;
}
