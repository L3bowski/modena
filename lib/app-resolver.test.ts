import { getAccessedAppConfig, updateUrlPathname } from '../lib/app-resolver';
import { AppConfig } from '../lib/types';
import { describe, it } from 'mocha';
import { expect } from 'chai';

// TODO Test http://poliester/app2 should be resolving to app1 if no traversal

// TODO Test http://capellas/app2 should be resolving to app2 if traversal

// TODO Test http://local/app1?$modena=app2 should be resolving to app2

const serializeQueryParameters = (queryParameters: any) => queryParameters.$modena ?
    `?$modena=${queryParameters.$modena}` : ``;

const testUrlResolution = (
    urlDomain: string,
    urlPathname: string,
    urlSuffix: string,
    queryParameters: any,
    appsConfig: AppConfig[],
    defaultApp: string,
    expectedAccessedAppConfig: AppConfig,
    expectedResolvedUrl: string) => {

    const suffixedUrlPathname = urlPathname + urlSuffix;
    const suffixedExpectedResolvedUrl = expectedResolvedUrl + urlSuffix;

    const description =
        `http://${urlDomain}${suffixedUrlPathname}${serializeQueryParameters(queryParameters)} ->
          http://${urlDomain}${suffixedExpectedResolvedUrl}`;

    it(description, () => {
        
        const accessedAppConfig =
            getAccessedAppConfig(urlDomain, suffixedUrlPathname, queryParameters, appsConfig, defaultApp);
        expect(accessedAppConfig).to.equal(expectedAccessedAppConfig);

        const resolvedUrl = updateUrlPathname(accessedAppConfig.name, suffixedUrlPathname);
        expect(resolvedUrl).to.equal(suffixedExpectedResolvedUrl);
    });
}

const testSuffixedUrlsResolution = (
    urlDomain: string,
    urlPathname: string,
    queryParameters: any,
    appsConfig: AppConfig[],
    defaultApp: string,
    expectedAccessedAppConfig: AppConfig,
    expectedResolvedUrl: string) => {

    describe('Should resolve app base url (no trailing slash)', () => {
        const urlSuffix = '';
        testUrlResolution(urlDomain, urlPathname, urlSuffix, queryParameters, appsConfig, defaultApp, expectedAccessedAppConfig, expectedResolvedUrl);
    });

    describe('Should resolve app base url (with trailing slash)', () => {
        const urlSuffix = '/';
        testUrlResolution(urlDomain, urlPathname, urlSuffix, queryParameters, appsConfig, defaultApp, expectedAccessedAppConfig, expectedResolvedUrl);
    });

    describe('Should resolve app relative url (no trailing slash)', () => {
        const urlSuffix = '/relative-path';
        testUrlResolution(urlDomain, urlPathname, urlSuffix, queryParameters, appsConfig, defaultApp, expectedAccessedAppConfig, expectedResolvedUrl);
    });

    describe('Should resolve app relative url (with trailing slash)', () => {
        const urlSuffix = '/relative-path/';
        testUrlResolution(urlDomain, urlPathname, urlSuffix, queryParameters, appsConfig, defaultApp, expectedAccessedAppConfig, expectedResolvedUrl);
    });
}

describe('App resolver', () => {
    
    const hostname = 'localhost:3000';
    const publicDomain = 'public-domain-1.com';
    const publicDomainWithTraversal = 'public-domain-2.com';
    const publicDomainAppConfig: AppConfig = {
        name: 'public-domain-app',
        publicDomains: [publicDomain],
        path: 'not-used',
        assetsFolder: 'not-used'
    };
    const publicDomainAppConfigWithTaversal: AppConfig = {
        name: 'public-domain-traversal-app',
        publicDomains: [publicDomainWithTraversal],
        path: 'not-used',
        assetsFolder: 'not-used',
        allowNamespaceTraversal: true,
    };
    const hostnameAppConfig1: AppConfig = {
        name: 'hostname-app-1',
        publicDomains: [],
        path: 'not-used',
        assetsFolder: 'not-used'
    };
    const hostnameAppConfig2: AppConfig = {
        name: 'hostname-app-2',
        publicDomains: [],
        path: 'not-used',
        assetsFolder: 'not-used'
    };
    const defaultAppConfig: AppConfig = {
        name: 'default-app',
        publicDomains: [],
        path: 'not-used',
        assetsFolder: 'not-used'
    };
    const appsConfig = [hostnameAppConfig1, hostnameAppConfig2, publicDomainAppConfig, publicDomainAppConfigWithTaversal, defaultAppConfig];

    describe('Access through app name', () => {
        testSuffixedUrlsResolution(
            hostname,
            `/${hostnameAppConfig1.name}`,
            {},
            appsConfig,
            defaultAppConfig.name,
            hostnameAppConfig1,
            `/${hostnameAppConfig1.name}`);
    });

    describe('Access through query string parameter when exposed as hostname', () => {
        const queryParameters = { $modena: hostnameAppConfig1.name };
        testSuffixedUrlsResolution(
            hostname,
            '',
            queryParameters,
            appsConfig,
            defaultAppConfig.name,
            hostnameAppConfig1,
            `/${hostnameAppConfig1.name}`);
    });

    describe('Not access through app name when exposed as hostname and matching query parameter', () => {
        testSuffixedUrlsResolution(
            hostname,
            `/${hostnameAppConfig1.name}`,
            { $modena: hostnameAppConfig2.name },
            appsConfig,
            defaultAppConfig.name,
            hostnameAppConfig2,
            `/${hostnameAppConfig2.name}/${hostnameAppConfig1.name}`);
    });

    describe('Not access through query string parameter when exposed as public domain and path traversal disabled', () => {
        const queryParameters = { $modena: hostnameAppConfig1.name };
        testSuffixedUrlsResolution(
            publicDomain,
            '',
            queryParameters,
            appsConfig,
            defaultAppConfig.name,
            publicDomainAppConfig,
            `/${publicDomainAppConfig.name}`);
    });

    describe('Access through query string parameter when exposed as public domain and path traversal enabled', () => {
        const queryParameters = { $modena: hostnameAppConfig1.name };
        testSuffixedUrlsResolution(
            publicDomainWithTraversal,
            '',
            queryParameters,
            appsConfig,
            defaultAppConfig.name,
            hostnameAppConfig1,
            `/${hostnameAppConfig1.name}`);
    });

    describe('Access through public domain when path traversal disabled', () => {
        testSuffixedUrlsResolution(
            publicDomain,
            '',
            {},
            appsConfig,
            defaultAppConfig.name,
            publicDomainAppConfig,
            `/${publicDomainAppConfig.name}`);
    });

    describe('Access through public domain when path traversal enabled', () => {
        testSuffixedUrlsResolution(
            publicDomainWithTraversal,
            '',
            {},
            appsConfig,
            defaultAppConfig.name,
            publicDomainAppConfigWithTaversal,
            `/${publicDomainAppConfigWithTaversal.name}`);
    });

    describe('Access through default app', () => {
        testSuffixedUrlsResolution(
            hostname,
            '',
            {},
            appsConfig,
            defaultAppConfig.name,
            defaultAppConfig,
            `/${defaultAppConfig.name}`);
    });

    describe('Keep unmodified an unresolvable url', () => {
        const suffixedUrlPathname = '/non/existing';
        const description = `http://${hostname}${suffixedUrlPathname} -> 
        http://${hostname}${suffixedUrlPathname}`;

        it(description, () => {
            const accessedAppConfig =
                getAccessedAppConfig(hostname, suffixedUrlPathname, {}, appsConfig, undefined);
            expect(accessedAppConfig).to.equal(undefined);
        });
    });
});
