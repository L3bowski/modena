import { expect, use } from 'chai';
import fs from 'fs';
import { describe, it } from 'mocha';
import mock from 'mock-require';
import path from 'path';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import * as fsUtils from '../utils/fs-utils';
import tracer from '../utils/tracer';
import { discoverApps} from './app-discovery';
 
use(sinonChai);

// TODO Try catch
// TODO Disable console.logs

describe('App discovery', () => {
    it('should log tracer error on missing APPS_FOLDER property and return no apps', () => {
        const tracerSpy = sinon.spy(tracer, 'error');

        const appsConfig = discoverApps({});

        expect(appsConfig.length).to.equal(0);
        const tracerMessage = tracerSpy.getCall(0).args[0];
        expect(tracerMessage).to.contain('APPS_FOLDER');

        tracerSpy.restore();
    });

    it('should log discovered folders number through tracer', () => {
        const appFolders = ['app-1', 'app-2'];
        const directoriesNameStub = sinon.stub(fsUtils, 'getDirectoriesName').returns(appFolders);
        const tracerSpy = sinon.spy(tracer, 'info');

        discoverApps({ APPS_FOLDER: '/apps-folder'});

        const tracerMessage = tracerSpy.getCall(0).args[0];
        expect(tracerMessage).to.contain(`${appFolders.length} folders`);

        directoriesNameStub.restore();
        tracerSpy.restore();
    });

    it('should return an AppConfig object for each folder', () => {
        const directoriesNameStub = sinon.stub(fsUtils, 'getDirectoriesName').returns(['app-1', 'app-2']);
        const joinStub = sinon.stub(path, 'join');
        joinStub.withArgs('/apps-folder', 'app-1').returns('/apps-folder/app-1');

        const appsConfig = discoverApps({ APPS_FOLDER: '/apps-folder'});

        expect(appsConfig.length).to.equal(2);
        const appConfig = appsConfig[0];
        expect(appConfig.name).to.equal('app-1');
        expect(appConfig.path).to.equal('/apps-folder/app-1');
        expect(appConfig.assetsFolder).to.equal('public');

        directoriesNameStub.restore();
        joinStub.restore();
    });

    it('should include modena-config.json properties to the AppConfig if the file exists', () => {
        const directoriesNameStub = sinon.stub(fsUtils, 'getDirectoriesName').returns(['app-1', 'app-2']);
        const existsSyncStub = sinon.stub(fs, 'existsSync').callsFake((filePath: string) => 
            filePath && filePath.endsWith('modena-config.json') ? true : false);
        const joinStub = sinon.stub(path, 'join');
            joinStub.withArgs('/apps-folder', 'app-1').returns('/apps-folder/app-1');
            joinStub.withArgs('/apps-folder/app-1', 'modena-config.json').returns('/apps-folder/app-1/modena-config.json');

        mock('/apps-folder/app-1/modena-config.json', {
            someProperty: 'someValue'
        });

        const appsConfig = discoverApps({ APPS_FOLDER: '/apps-folder'});
        const appConfig = appsConfig[0];

        expect(appConfig.someProperty).to.equal('someValue');

        directoriesNameStub.restore();
        existsSyncStub.restore();
        joinStub.restore();
    });

    it('should define modenaSetupPath if modena-setup.js exists', () => {
        const directoriesNameStub = sinon.stub(fsUtils, 'getDirectoriesName').returns(['app-1', 'app-2']);
        const existsSyncStub = sinon.stub(fs, 'existsSync').callsFake((filePath: string) => 
            filePath && filePath.endsWith('modena-setup.js') ? true : false);
        const joinStub = sinon.stub(path, 'join');
            joinStub.withArgs('/apps-folder', 'app-1').returns('/apps-folder/app-1');
            joinStub.withArgs('/apps-folder/app-1', 'modena-setup.js').returns('/apps-folder/app-1/modena-setup.js');

        const appsConfig = discoverApps({ APPS_FOLDER: '/apps-folder'});
        const appConfig = appsConfig[0];

        expect(appConfig.modenaSetupPath).to.equal('/apps-folder/app-1/modena-setup.js');

        directoriesNameStub.restore();
        existsSyncStub.restore();
        joinStub.restore();});
});