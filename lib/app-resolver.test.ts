import { namespaceUrlByDomain, setNamespace } from '../lib/app-resolver';
import { AppConfig, ModenaConfig } from '../lib/types';
import { describe, it } from 'mocha';
import { expect } from 'chai';

// TODO Disable console logs for the tests
// TODO Use mocha.beforeEach

const absoluteDomain = 'absolute-domain.com';
const localDomain = 'localhost:3000';

const absoluteApp: AppConfig = {
    name: 'absolute-app',
    publicDomains: [ absoluteDomain ],
    path: 'not-used',
    assetsFolder: 'not-used'
};    

const localApp: AppConfig = {
    name: 'local-app',
    publicDomains: [ ],
    path: 'not-used',
    assetsFolder: 'not-used'
};
    
const apps = [ localApp, absoluteApp ];

describe('App resolver', () => {

    it('should prepend namespace to public domain app base url without trailing slash', () => {
        const baseUrl = '';
        const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, baseUrl);
        expect(resolvedUrl).to.equal('/absolute-app');
    });

    it('should prepend namespace to public domain app relative url', () => {
        const relativeUrl = '/relative-path';
        const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, relativeUrl);
        expect(resolvedUrl).to.equal('/absolute-app/relative-path');
    });
    
    it('should prepend namespace to public domain app asset url', () => {
        const assetUrl = '/css/style.css';
        const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, assetUrl);
        expect(resolvedUrl).to.equal('/absolute-app/css/style.css');
    });
    
    it('should maintain namespace to local app base url without trailing slash', () => {
        const baseUrl = '/local-app';
        const resolvedUrl = namespaceUrlByDomain(apps, localDomain, baseUrl);
        expect(resolvedUrl).to.equal('/local-app');
    });
    
    it('should maintain namespace to local app base url with trailing slash', () => {
        const baseUrl = '/local-app/';
        const resolvedUrl = namespaceUrlByDomain(apps, localDomain, baseUrl);
        expect(resolvedUrl).to.equal('/local-app/');
    });
    
    it('should maintain namespace to local app relative url without trailing slash', () => {
        const relativeUrl = '/local-app/relative-path';
        const resolvedUrl = namespaceUrlByDomain(apps, localDomain, relativeUrl);
        expect(resolvedUrl).to.equal('/local-app/relative-path');
    });
    
    it('should maintain namespace to local app relative url with trailing slash', () => {
        const relativeUrl = '/local-app/relative-path/';
        const resolvedUrl = namespaceUrlByDomain(apps, localDomain, relativeUrl);
        expect(resolvedUrl).to.equal('/local-app/relative-path/');
    });
    
    it('should maintain namespace to local app asset url', () => {
        const assetUrl = '/local-app/css/style.css';
        const resolvedUrl = namespaceUrlByDomain(apps, localDomain, assetUrl);
        expect(resolvedUrl).to.equal('/local-app/css/style.css');
    });
    
    it('should resolve accessed app for base url without trailing slash', () => {
        var config: ModenaConfig = {
            appsFolder: 'not-used',
            enableConsoleLogs: false,
            logFilename: 'not-used',
            tracerLevel: 'not-used',
            PORT: 0
        };
        var req: any = {
            url: '/local-app'
        };
        setNamespace(config, apps, req);
        expect(req._namespace).to.equal('local-app');
    });
    
    it('should resolve accessed app for base url with trailing slash', () => {
        var config: ModenaConfig = {
            appsFolder: 'not-used',
            enableConsoleLogs: false,
            logFilename: 'not-used',
            tracerLevel: 'not-used',
            PORT: 0
        };
        var req: any = {
            url: '/local-app/'
        };
        setNamespace(config, apps, req);
        expect(req._namespace).to.equal('local-app');
    });
    
    it('should resolve accessed app for base url with parameters and no trailing slash', () => {
        var config: ModenaConfig = {
            appsFolder: 'not-used',
            enableConsoleLogs: false,
            logFilename: 'not-used',
            tracerLevel: 'not-used',
            PORT: 0
        };
        var req: any = {
            url: '/local-app?parameter=value'
        };
        setNamespace(config, apps, req);
        expect(req._namespace).to.equal('local-app');
    });
    
    it('should resolve accessed app for base url with parameters and no trailing slash', () => {
        var config: ModenaConfig = {
            appsFolder: 'not-used',
            enableConsoleLogs: false,
            logFilename: 'not-used',
            tracerLevel: 'not-used',
            PORT: 0
        };
        var req: any = {
            url: '/local-app/?parameter=value'
        };
        setNamespace(config, apps, req);
        expect(req._namespace).to.equal('local-app');
    });
    
    it('should resolve accessed app for default app base url', () => {
        var config: ModenaConfig = {
            defaultApp: 'absolute-app',
            appsFolder: 'not-used',
            enableConsoleLogs: false,
            logFilename: 'not-used',
            tracerLevel: 'not-used',
            PORT: 0
        };
        var req: any = {
            url: '/'
        };
        setNamespace(config, apps, req);
        expect(req._namespace).to.equal('absolute-app');
    });
    
    it('should maintain namespace to local app base url when accessing through traversal domain app', () => {
        const traversalApp: AppConfig = {
            name: "traversal-app",
            publicDomains: [ absoluteDomain ],
            allowNamespaceTraversal: true,
            path: 'not-used',
            assetsFolder: 'not-used'
        };
        const apps = [ traversalApp, localApp ];
        const baseUrl = '/local-app';
        const resolvedUrl = namespaceUrlByDomain(apps, absoluteDomain, baseUrl);
        expect(resolvedUrl).to.equal('/local-app');
    });
  
});
