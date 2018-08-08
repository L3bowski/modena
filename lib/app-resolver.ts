import { ModenaConfig, AppConfig } from "./types";

var tracer = require('./tracer');
var { join } = require('path');

const getAppByNamespaceMatch = (appsConfig: AppConfig[], relativeUrl: string) => {
	var matchingApp = appsConfig.find(appConfig => {
		var regexBase = "\\/" + appConfig.name + "(\\/|\\?|$)"
		var regex = new RegExp(regexBase, "g");
		return relativeUrl.match(regex) ? appConfig : null;
	});
	return matchingApp;
};

const isolateViewsAccess = (namespace: string, res: any) => {
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

export const setNamespace = (modenConfig: ModenaConfig, appsConfig: AppConfig[], req: any) => {
	var accessedApp = getAppByNamespaceMatch(appsConfig, req.url);

	if (accessedApp) {
		req._namespace = accessedApp.name;
	}
	else if (modenConfig.defaultApp) {
		req.url = namespaceRelativeUrl(modenConfig.defaultApp, req.url);
		req._namespace = modenConfig.defaultApp;
	}

	// TODO Review what happens when !accessedApp & !defaultApp

	tracer.info('Accessed app: ' + req._namespace);
};

export const getAppResolverMiddleware = (modenaConfig: ModenaConfig, appsConfig: AppConfig[]) => 
	function resolvingApp(req: any, res: any, next: any) {
		tracer.info('Relative url:' + req.url);

		res._render = res.render;
		req.url = namespaceUrlByQueryParameters(req.url, req.query);
		req.url = namespaceUrlByDomain(appsConfig, req.headers.host, req.url);

		setNamespace(modenaConfig, appsConfig, req);
		isolateViewsAccess(req._namespace, res);
		return next();
	};
