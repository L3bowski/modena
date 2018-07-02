var tracer = require('./tracer');
var { join } = require('path');

const getAppByNamespaceMatch = (apps, relativeUrl) => {
	var matchingApp = apps.find(app => {
		var regexBase = "\\/" + app.name + "(\\/|\\?|$)"
		var regex = new RegExp(regexBase, "g");
		return relativeUrl.match(regex);
	});
	return matchingApp;
};

const isolateViewsAccess = (namespace, res) => {
	res.render = function(viewName, parameters) {
		var isolateView = join(namespace, 'views', viewName);
		this._render(isolateView, parameters);
	};
};

const namespaceRelativeUrl = (namespace, relativeUrl) => {
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

const namespaceUrlByQueryParameters = (relativeUrl, queryString) => {
	if (queryString.namespace) {
		relativeUrl = namespaceRelativeUrl(queryString.namespace, relativeUrl)
	}
	return relativeUrl;
};

const namespaceUrlByDomain = (apps, domain, relativeUrl) => {
	var domainAppAccess = apps.find(app =>
		(app.publicDomains != null &&
		app.publicDomains.find(d => domain.indexOf(d) > -1) != null));
	
	if (domainAppAccess &&
		(!domainAppAccess.allowNamespaceTraversal ||
			getAppByNamespaceMatch(apps, relativeUrl) == null)) {
				relativeUrl = namespaceRelativeUrl(domainAppAccess.name, relativeUrl);
	}

	return relativeUrl;
};

const setNamespace = (config, apps, req) => {
	var accessedApp = getAppByNamespaceMatch(apps, req.url);

	if (!accessedApp) {
		req.url = namespaceRelativeUrl(config.defaultApp, req.url);
		req._namespace = config.defaultApp;
	}
	else {
		req._namespace = accessedApp.name;
	}

	tracer.info('Accessed app: ' + req._namespace);
};

const getAppResolverMiddleware = (config, apps) => 
	function resolvingApp(req, res, next) {
		tracer.info('Relative url:' + req.url);

		res._render = res.render;
		req.url = namespaceUrlByQueryParameters(req.url, req.query);

		if (req.url.startsWith('/plugins')) {
			return next();
		}
		req.url = namespaceUrlByDomain(apps, req.headers.host, req.url);

		setNamespace(config, apps, req);
		isolateViewsAccess(req._namespace, res);
		return next();
	};

module.exports = { getAppResolverMiddleware, namespaceUrlByDomain, setNamespace };
