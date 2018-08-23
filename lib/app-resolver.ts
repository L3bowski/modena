import { ModenaConfig, AppConfig } from './types';
import { info } from './tracer';
import { join } from 'path';

const getAppByNamespaceMatch = (appsConfig: AppConfig[], relativeUrl: string) => {
	var matchingApp = appsConfig.find(appConfig => {
		var regexBase = "\\/" + appConfig.name + "(\\/|\\?|$)"
		var regex = new RegExp(regexBase, "g");
		return relativeUrl.match(regex) ? true : false;
	});
	return matchingApp;
};

const isolateViewsAccess = (namespace: string, res: any) => {
	res._render = res.render;
	res.render = function(viewName: string, parameters: any) {
		var isolateView = join(namespace, 'views', viewName);
		this._render(isolateView, parameters);
	};
};

const namespaceRelativeUrl = (namespace: string, relativeUrl: string) => {
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

const namespaceUrlByQueryParameters = (relativeUrl: string, queryString: any) => {
	if (queryString.$modena) {
		relativeUrl = namespaceRelativeUrl(queryString.$modena, relativeUrl)
	}
	return relativeUrl;
};

export const namespaceUrlByDomain = (appsConfig: AppConfig[], domain: string, relativeUrl: string) => {
	var domainAppAccess = appsConfig.find(appConfig =>
		(appConfig.publicDomains != null &&
		appConfig.publicDomains.find(d => domain.indexOf(d) > -1) != null));
	
	if (domainAppAccess &&
		(!domainAppAccess.allowNamespaceTraversal ||
			getAppByNamespaceMatch(appsConfig, relativeUrl) == null)) {
				relativeUrl = namespaceRelativeUrl(domainAppAccess.name, relativeUrl);
	}

	return relativeUrl;
};

export const setNamespace = (modenaConfig: ModenaConfig, appsConfig: AppConfig[], req: any) => {
	var accessedApp = getAppByNamespaceMatch(appsConfig, req.url);

	if (accessedApp) {
		req._namespace = accessedApp.name;
	}
	else if (modenaConfig.defaultApp) {
		req.url = namespaceRelativeUrl(modenaConfig.defaultApp, req.url);
		req._namespace = modenaConfig.defaultApp;
	}

	// TODO Review what happens when !accessedApp & !defaultApp

	info('Accessed app: ' + req._namespace);
};

export const getAppResolverMiddleware = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => 
	function resolvingApp(req: any, res: any, next: any) {
		info('Relative url:' + req.url);

		req.url = namespaceUrlByQueryParameters(req.url, req.query);
		req.url = namespaceUrlByDomain(appsConfig, req.headers.host, req.url);

		setNamespace(modenaConfig, appsConfig, req);
		isolateViewsAccess(req._namespace, res);
		return next();
	};
