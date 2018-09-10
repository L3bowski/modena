import { expect } from 'chai';
import { describe, it } from 'mocha';
import { join } from 'path';
import { defaultConfig } from './configuration';
import { ModenaConfig } from './types';

describe('Configuration', () => {

    describe('default config', () => {
        let configParameters: any;
        let modenaConfig: ModenaConfig;

        it('should use default values if no parameters are provided', () => {
            configParameters = {};
            modenaConfig = defaultConfig(configParameters);

            expect(modenaConfig.afterRegisteringApps).to.equal(null);
            expect(modenaConfig.APPS_FOLDER).to.equal(join(__dirname, '..', '..', '..', 'apps'));
            expect(modenaConfig.beforeRegisteringApps).to.equal(null);
            expect(modenaConfig.DEFAULT_APP).to.equal(null);
            expect(modenaConfig.ENABLE_CONSOLE_LOGS).to.equal('false');
            expect(modenaConfig.LOG_FILENAME).to.equal('logs.txt');
            expect(modenaConfig.PORT).to.equal(80);
            expect(modenaConfig.SESSION_SECRET).to.equal(null);            
        });

        it('should use configuration parameters if they are provided', () => {
            configParameters = {
                afterRegisteringApps: () => {},
                APPS_FOLDER: 'test-apps-folder-path',
                beforeRegisteringApps: () => {},
                DEFAULT_APP: 'default-app',
                ENABLE_CONSOLE_LOGS: 'true',
                LOG_FILENAME: 'test.log',
                PORT: 3000,
                SESSION_SECRET: 'dont tell anyone'
            };
            modenaConfig = defaultConfig(configParameters);

            expect(modenaConfig.afterRegisteringApps).to.equal(configParameters.afterRegisteringApps);
            expect(modenaConfig.APPS_FOLDER).to.equal(configParameters.APPS_FOLDER);
            expect(modenaConfig.beforeRegisteringApps).to.equal(configParameters.beforeRegisteringApps);
            expect(modenaConfig.DEFAULT_APP).to.equal(configParameters.DEFAULT_APP);
            expect(modenaConfig.ENABLE_CONSOLE_LOGS).to.equal(configParameters.ENABLE_CONSOLE_LOGS);
            expect(modenaConfig.LOG_FILENAME).to.equal(configParameters.LOG_FILENAME);
            expect(modenaConfig.PORT).to.equal(configParameters.PORT);
            expect(modenaConfig.SESSION_SECRET).to.equal(configParameters.SESSION_SECRET);            
        });
    });

    describe('environment variables', () => {

    });

    describe('apps configuration', () => {

    });
});