import { expect } from 'chai';
import { describe, it } from 'mocha';
import { AppConfig, ModenaConfig } from '../types';
import {
    defaultAppsFolder,
    defaultConfig,
    extractAppsConfiguration,
    overrideEnvironmentParameters
} from './configuration';

describe('Configuration', () => {

    describe('Default config', () => {
        let configParameters: ModenaConfig;
        let modenaConfig: ModenaConfig;

        it('should use default values if no parameters provided', () => {
            configParameters = {};
            modenaConfig = defaultConfig(configParameters);

            expect(modenaConfig.afterRegisteringApps).to.equal(null);
            expect(modenaConfig.APPS_FOLDER).to.equal(defaultAppsFolder);
            expect(modenaConfig.beforeRegisteringApps).to.equal(null);
            expect(modenaConfig.DEFAULT_APP).to.equal(null);
            expect(modenaConfig.DISABLE_CONSOLE_LOGS).to.equal('false');
            expect(modenaConfig.LOG_FILENAME).to.equal('logs.txt');
            expect(modenaConfig.PORT).to.equal('80');
            expect(modenaConfig.SESSION_SECRET).to.equal(null);            
        });

        it('should use configuration parameters if provided', () => {
            configParameters = {
                afterRegisteringApps: () => {},
                APPS_FOLDER: 'test-apps-folder-path',
                beforeRegisteringApps: () => {},
                DEFAULT_APP: 'default-app',
                DISABLE_CONSOLE_LOGS: 'true',
                LOG_FILENAME: 'test.log',
                PORT: '3000',
                SESSION_SECRET: 'dont tell anyone'
            };
            modenaConfig = defaultConfig(configParameters);

            expect(modenaConfig.afterRegisteringApps).to.equal(configParameters.afterRegisteringApps);
            expect(modenaConfig.APPS_FOLDER).to.equal(configParameters.APPS_FOLDER);
            expect(modenaConfig.beforeRegisteringApps).to.equal(configParameters.beforeRegisteringApps);
            expect(modenaConfig.DEFAULT_APP).to.equal(configParameters.DEFAULT_APP);
            expect(modenaConfig.DISABLE_CONSOLE_LOGS).to.equal(configParameters.DISABLE_CONSOLE_LOGS);
            expect(modenaConfig.LOG_FILENAME).to.equal(configParameters.LOG_FILENAME);
            expect(modenaConfig.PORT).to.equal(configParameters.PORT);
            expect(modenaConfig.SESSION_SECRET).to.equal(configParameters.SESSION_SECRET);            
        });
    });

    describe('Environment variables', () => {
        const originalEnv = process.env;
        let existingModenaConfig: ModenaConfig;

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should override the existing modena configuration if provided', () => {
            existingModenaConfig = {};
            process.env = {
                APPS_FOLDER: 'test-apps-folder-path',
                DEFAULT_APP: 'default-app',
                DISABLE_CONSOLE_LOGS: 'true',
                LOG_FILENAME: 'test.log',
                PORT: '3000',
                SESSION_SECRET: 'dont tell anyone'
            };
            const modenaConfig = overrideEnvironmentParameters(existingModenaConfig);

            expect(modenaConfig.APPS_FOLDER).to.equal(process.env.APPS_FOLDER);
            expect(modenaConfig.DEFAULT_APP).to.equal(process.env.DEFAULT_APP);
            expect(modenaConfig.DISABLE_CONSOLE_LOGS).to.equal(process.env.DISABLE_CONSOLE_LOGS);
            expect(modenaConfig.LOG_FILENAME).to.equal(process.env.LOG_FILENAME);
            expect(modenaConfig.PORT).to.equal(process.env.PORT);
            expect(modenaConfig.SESSION_SECRET).to.equal(process.env.SESSION_SECRET);   
        });

        it('should use existing modena configuration if no environment variables provided', () => {
            existingModenaConfig = {
                APPS_FOLDER: 'test-apps-folder-path',
                DEFAULT_APP: 'default-app',
                DISABLE_CONSOLE_LOGS: 'true',
                LOG_FILENAME: 'test.log',
                PORT: '3000',
                SESSION_SECRET: 'dont tell anyone'
            };
            process.env = {};
            const modenaConfig = overrideEnvironmentParameters(existingModenaConfig);

            expect(modenaConfig.APPS_FOLDER).to.equal(existingModenaConfig.APPS_FOLDER);
            expect(modenaConfig.DEFAULT_APP).to.equal(existingModenaConfig.DEFAULT_APP);
            expect(modenaConfig.DISABLE_CONSOLE_LOGS).to.equal(existingModenaConfig.DISABLE_CONSOLE_LOGS);
            expect(modenaConfig.LOG_FILENAME).to.equal(existingModenaConfig.LOG_FILENAME);
            expect(modenaConfig.PORT).to.equal(existingModenaConfig.PORT);
            expect(modenaConfig.SESSION_SECRET).to.equal(existingModenaConfig.SESSION_SECRET);   
        });
    });

    describe('Apps configuration', () => {
        let modenaConfig: ModenaConfig;
        let appsConfig: AppConfig[];

        it('should be moved from modena configuration to the corresponding app configuration', () => {
            const firstApp: AppConfig = {
                name: 'first-app',
                assetsFolder: 'not-used',
                path: 'not-used'
            };
            const secondApp: AppConfig = {
                name: 'second-app',
                assetsFolder: 'not-used',
                path: 'not-used'
            };
            appsConfig = [firstApp, secondApp];
            const appPropertyName = 'ENVIRONMENT_VARIABLE_NAME';
            const appPropertyValue = 'what-ever';
            const globalConfigAppPrefix = 'FIRST_APP__' + appPropertyName;
            modenaConfig = {
                [globalConfigAppPrefix]: appPropertyValue
            };

            extractAppsConfiguration(modenaConfig, appsConfig);

            expect(modenaConfig[globalConfigAppPrefix]).to.equal(undefined);
            expect(firstApp[appPropertyName]).to.equal(appPropertyValue);
            expect(secondApp[appPropertyName]).to.equal(undefined);
        });
    });
});