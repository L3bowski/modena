import { expect, use } from 'chai';
import fs from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { ensureDirectory, getDirectoriesName } from './fs-utils';

use(sinonChai);

describe('Utils', () => {

    describe('Ensure directory', () => {
        it('should create a directory that does not exist', () => {
            const nonExistingFolderPath = join(__dirname, 'non-existing-folder');
            const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false);
            const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
            ensureDirectory(nonExistingFolderPath);
            expect(existsSyncStub).to.have.been.calledWith(nonExistingFolderPath);
            expect(mkdirSyncStub).to.have.been.calledWith(nonExistingFolderPath);
            existsSyncStub.restore();
            mkdirSyncStub.restore();
        });

        it('should not create a directory that does already exist', () => {
            const existingFolderPath = join(__dirname, '..', 'lib');
            const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true);
            const mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
            ensureDirectory(existingFolderPath);
            expect(existsSyncStub).to.have.been.calledWith(existingFolderPath);
            expect(mkdirSyncStub).not.to.have.been.called;
            existsSyncStub.restore();
            mkdirSyncStub.restore();
        });
    });

    describe('Get Directories Name', () => {
        it('should retrieve all directory names', () => {
            const folderPath = join(__dirname, '..');
            const readdirSyncStub = sinon.stub(fs, 'readdirSync').returns(['folder1', 'folder2']);
            const lstatSyncStub = sinon.stub(fs, 'lstatSync').returns({ isDirectory: () => true });
            const directoriesName = getDirectoriesName(folderPath);
            expect(directoriesName.length).to.equal(2);
            readdirSyncStub.restore();
            lstatSyncStub.restore();
        });

        it('should not retrieve elements other than directories', () => {
            const folderPath = join(__dirname, '..');
            const readdirSyncStub = sinon.stub(fs, 'readdirSync').returns(['file1', 'file2']);
            const lstatSyncStub = sinon.stub(fs, 'lstatSync').returns({ isDirectory: () => false });
            const directoriesName = getDirectoriesName(folderPath);
            expect(directoriesName.length).to.equal(0);
            readdirSyncStub.restore();
            lstatSyncStub.restore();
        });
    });
});