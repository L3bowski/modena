import { join } from 'path';
import { info } from './tracer';
import tracer from './tracer';
import { AppConfig, ModenaConfig } from './types';

const isolateViewsAccess = (namespace: string, res: any) => {
    res._render = res.render;
    res.render = function(viewName: string, parameters: any) {
        const isolateView = join(namespace, 'views', viewName);
        this._render(isolateView, parameters);
    };
};

export const updateUrlPathname = (namespace: string, relativeUrl: string) => {
    const namespacePrefix = '/' + namespace;
    let namespacedUrl = relativeUrl;

    if (relativeUrl == null || relativeUrl === '') {
        namespacedUrl = namespacePrefix;
    }
    else if (relativeUrl === '/') {
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
            appConfig.publicDomains.find(domain => domain === urlDomain) != null;
    });

    // Apps exposed to a public domain might allow accessing other apps from the domain by app name
    // (e.g. app1 is exposed at http://domain.com along with http://domain.com/app1-endpoint, but still
    // http://domain.com/app2 and http://domain.com?$modena=app2 are accessible).
    // In that case (allowNamespaceTraversal), the actual accessedApp might be a another one
    if (!accessedApp || accessedApp.allowNamespaceTraversal) {

        // 2) Match by query string parameters (e.g: http://localhost?$modena=app-name)
        let queryStringMatchingApp: AppConfig;
        if (queryParameters.$modena) {
            queryStringMatchingApp = appsConfig.find(appConfig => appConfig.name === queryParameters.$modena);
            accessedApp = queryStringMatchingApp || accessedApp;
        }

        // 3) Match by app name (e.g: http://localhost/app-name)
        let appNameMatchingName: AppConfig;
        if (!queryStringMatchingApp) {
            appNameMatchingName = appsConfig.find(appConfig => {
                const regexBase = '\\/' + appConfig.name + '(\\/|\\?|$)';
                const regex = new RegExp(regexBase);
                return regex.test(urlPathname);
            });
            accessedApp = appNameMatchingName || accessedApp;
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

        const accessedApp = getAccessedAppConfig(req.headers.host, req.url, req.query, appsConfig, modenaConfig.DEFAULT_APP);
        if (accessedApp) {
            req._namespace = accessedApp.name;
            req.url = updateUrlPathname(accessedApp.name, req.url);
            isolateViewsAccess(accessedApp.name, res);
            info('Accessed app: ' + accessedApp.name);
            info('Updated url pathname: ' + req.url);
        }
        else {
            info('Could not resolve the url to any of the existing apps...');
        }

        return next();
    };
    return tracer.trace(appResolverMiddleware);
};
