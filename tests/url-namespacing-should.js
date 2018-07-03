const { namespaceUrlByDomain, setNamespace } = require('../lib/app-resolver');

const absoluteDomain = "absolute-domain.com";
const localDomain = "localhost:3000";

const absoluteApp = {
    name: "absolute-app",
    publicDomains: [ absoluteDomain ]
};    

const localApp = {
    name: "local-app"
};
    
const apps = [ localApp, absoluteApp ];

(function prepend_namespace_to_public_domain_app_base_url_without_trailing_slash() {
    const baseUrl = '';
    const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, baseUrl);
    if (resolvedUrl != '/absolute-app')
        throw 'Expected "/absolute-app" but got "' + resolvedUrl + '" instead';
})();

(function prepend_namespace_to_public_domain_app_base_url_with_trailing_slash() {
    const baseUrl = '/';
    const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, baseUrl);
    if (resolvedUrl != '/absolute-app/')
        throw 'Expected "/absolute-app/" but got "' + resolvedUrl + '" instead';
})();

(function prepend_namespace_to_public_domain_app_relative_url() {
    const relativeUrl = '/relative-path';
    const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, relativeUrl);
    if (resolvedUrl != '/absolute-app/relative-path')
        throw 'Expected "/absolute-app/relative-path" but got "' + resolvedUrl + '" instead';
})();

(function prepend_namespace_to_public_domain_app_asset_url() {
    const assetUrl = '/css/style.css';
    const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, assetUrl);
    if (resolvedUrl != '/absolute-app/css/style.css')
        throw 'Expected "/absolute-app/css/style.css" but got "' + resolvedUrl + '" instead';
})();

(function maintain_namespace_to_local_app_base_url_without_trailing_slash() {
    const baseUrl = '/local-app';
    const resolvedUrl = namespaceUrlByDomain(apps, localDomain, baseUrl);
    if (resolvedUrl != '/local-app')
        throw 'Expected "/local-app" but got "' + resolvedUrl + '" instead';
})();

(function maintain_namespace_to_local_app_base_url_with_trailing_slash() {
    const baseUrl = '/local-app/';
    const resolvedUrl = namespaceUrlByDomain(apps, localDomain, baseUrl);
    if (resolvedUrl != '/local-app/')
        throw 'Expected "/local-app/" but got "' + resolvedUrl + '" instead';
})();

(function maintain_namespace_to_local_app_relative_url_without_trailing_slash() {
    const relativeUrl = '/local-app/relative-path';
    const resolvedUrl = namespaceUrlByDomain(apps, localDomain, relativeUrl);
    if (resolvedUrl != '/local-app/relative-path')
        throw 'Expected "/local-app/relative-path" but got "' + resolvedUrl + '" instead';
})();

(function maintain_namespace_to_local_app_relative_url_with_trailing_slash() {
    const relativeUrl = '/local-app/relative-path/';
    const resolvedUrl = namespaceUrlByDomain(apps, localDomain, relativeUrl);
    if (resolvedUrl != '/local-app/relative-path/')
        throw 'Expected "/local-app/relative-path/" but got "' + resolvedUrl + '" instead';
})();

(function maintain_namespace_to_local_app_asset_url() {
    const assetUrl = '/local-app/css/style.css';
    const resolvedUrl = namespaceUrlByDomain(apps, localDomain, assetUrl);
    if (resolvedUrl != '/local-app/css/style.css')
        throw 'Expected "/local-app/css/style.css" but got "' + resolvedUrl + '" instead';
})();

(function resolve_accessed_app_for_base_url_without_trailing_slash() {
    var config = {};
    var req = {
        url: '/local-app'
    };
    setNamespace(config, apps, req);
    if (req._namespace != 'local-app')
        throw 'Expected _namespace to be "local-app" but got "' + req._namespace + '" instead';
})();

(function resolve_accessed_app_for_base_url_with_trailing_slash() {
    var config = {};
    var req = {
        url: '/local-app/'
    };
    setNamespace(config, apps, req);
    if (req._namespace != 'local-app')
        throw 'Expected _namespace to be "local-app" but got "' + req._namespace + '" instead';
})();

(function resolve_accessed_app_for_base_url_with_parameters_and_no_trailing_slash() {
    var config = {};
    var req = {
        url: '/local-app?parameter=value'
    };
    setNamespace(config, apps, req);
    if (req._namespace != 'local-app')
        throw 'Expected _namespace to be "local-app" but got "' + req._namespace + '" instead';
})();

(function resolve_accessed_app_for_base_url_with_parameters_and_no_trailing_slash() {
    var config = {};
    var req = {
        url: '/local-app/?parameter=value'
    };
    setNamespace(config, apps, req);
    if (req._namespace != 'local-app')
        throw 'Expected _namespace to be "local-app" but got "' + req._namespace + '" instead';
})();

(function resolve_accessed_app_for_default_app_base_url() {
    var config = {
        defaultApp: 'absolute-app'
    };
    var req = {
        url: '/'
    };
    setNamespace(config, apps, req);
    if (req._namespace != 'absolute-app')
        throw 'Expected _namespace to be "absolute-app" but got "' + req._namespace + '" instead';
})();

(function maintain_namespace_to_local_app_base_url_when_accessing_through_traversal_domain_app() {
    const traversalApp = {
        name: "traversal-app",
        publicDomains: [ absoluteDomain ],
        allowNamespaceTraversal: true
    };
    const apps = [ traversalApp, localApp ];
    const baseUrl = '/local-app';
    const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, baseUrl);
    if (resolvedUrl != '/local-app')
        throw 'Expected "/local-app" but got "' + resolvedUrl + '" instead';
})();
