import { expect, use } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import winston from 'winston';
import * as tracer from './tracer';
import { ModenaConfig } from './types';

use(sinonChai);

const disableLogs = (callback: Function, done: MochaDone) => {
    const consoleLog = console.log;
    const winstonLog = winston.log;
    const winstonInfo = winston.info;
    const winstonError = winston.error;
    console.log = () => {};
    winston.log = ((): winston.LoggerInstance => ({} as any)) as winston.LogMethod;
    winston.info = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
    winston.error = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
    try {
        callback();
    }
    finally {
        setImmediate(() => {
            console.log = consoleLog;
            winston.log = winstonLog;
            winston.info = winstonInfo;
            winston.error = winstonError;
            done();
        });
    }
};

describe('Tracer', () => {
    const message = 'Log message';

    describe('Info', () => {
        it('should start trace', done => {
            disableLogs(() => {
                winston.info('Wtf -------------------------');
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.info(message);
                expect(startTraceSpy).to.have.been.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should call winston.info', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.info(message);
                expect(winstonErrorSpy).not.to.have.been.called;
                expect(winstonInfoSpy).to.have.been.calledOnceWith('', message);
                winstonErrorSpy.restore();
                winstonInfoSpy.restore();
            }, done);
        });

        it('should call winston.info with indentation when called from traced function', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.trace(() => tracer.info(message))();
                // The trace function calls winston.info
                expect(winstonInfoSpy).to.have.been.calledTwice;
                const infoArguments = winstonInfoSpy.getCall(1).args;
                expect(infoArguments[0]).to.equal('    ');
                expect(infoArguments[1]).to.equal(message);
                winstonInfoSpy.restore();
            }, done);
        });
    });

    describe('Error', () => {
        it('should start trace', done => {
            disableLogs(() => {
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.error(message);    
                expect(startTraceSpy).to.have.been.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should call winston.error', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.error(message);
                expect(winstonErrorSpy).to.have.been.calledOnceWith('', message);
                expect(winstonInfoSpy).not.to.have.been.called;
                winstonErrorSpy.restore();
                winstonInfoSpy.restore();
            }, done);
        });

        it('should call winston.error with indentation when called from traced function', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                tracer.trace(() => tracer.error(message))();
                expect(winstonErrorSpy).to.have.been.calledOnceWith('    ', message);
                winstonErrorSpy.restore();
            }, done);
        });
    });

    describe('Start Trace', () => {
        it('should console.log trace start if no active trace', done => {
            disableLogs(() => {
                const consoleSpy = sinon.spy(console, 'log');
                tracer.startTrace();
                expect(consoleSpy).to.have.been.called;
                const message = consoleSpy.getCall(0).args[0];
                expect(message).to.contain('Trace start');
                consoleSpy.restore();
            }, done);
        });

        it('should not console.log trace start if active trace', done => {
            disableLogs(() => {
                const consoleSpy = sinon.spy(console, 'log');
                tracer.startTrace();
                tracer.startTrace();
                expect(consoleSpy).to.have.been.calledOnce;
                consoleSpy.restore();
            }, done);
        });

        it('should set and immediate to console.log trace end', done => {
            disableLogs(() => {
                tracer.startTrace();
                const consoleSpy = sinon.spy(console, 'log');
                expect(consoleSpy).to.not.have.been.called;
                setImmediate(() => {
                    expect(consoleSpy).to.have.been.calledOnce;
                    const message = consoleSpy.getCall(0).args[0];
                    expect(message).to.contain('Trace end');
                    consoleSpy.restore();
                });
            }, done);
        });
    });

    describe('Setup Tracer', () => {
        it('should remove console logs if ENABLE_CONSOLE_LOGS set to false', () => {
            const modenaConfig: ModenaConfig = {
                ENABLE_CONSOLE_LOGS: 'false'
            };
            const winstonSpy = sinon.spy(winston, 'remove');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.have.been.calledOnce;
            winstonSpy.restore();
        });
        it('should not remove console logs if ENABLE_CONSOLE_LOGS is not set to false', () => {
            const modenaConfig: ModenaConfig = {
                ENABLE_CONSOLE_LOGS: 'true'
            };
            const winstonSpy = sinon.spy(winston, 'remove');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.not.have.been.called;
            winstonSpy.restore();
        });
        it('should not add logs file when no LOG_FILENAME is provided', () => {
            const modenaConfig: ModenaConfig = {};
            const winstonSpy = sinon.spy(winston, 'add');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.not.have.been.called;
            winstonSpy.restore();
        });
        it('should not add logs file when invalid LOG_FILENAME is provided', () => {
            const modenaConfig: ModenaConfig = {
                LOG_FILENAME: ''
            };
            const winstonSpy = sinon.spy(winston, 'add');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.not.have.been.called;
            winstonSpy.restore();
        });
        it('should add logs file when valid LOG_FILENAME is provided', () => {
            const modenaConfig: ModenaConfig = {
                LOG_FILENAME: 'production.logs'
            };
            const winstonSpy = sinon.spy(winston, 'add');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.have.been.calledOnce;
            winstonSpy.restore();
        });
    });

    describe('Trace', () => {
        it('should call tracer.log with null "this" when invoked with a function', () => {
            const functionExpression = () => {};
            const logSpy = sinon.spy(tracer, 'log');
            tracer.trace(functionExpression);
            expect(logSpy).to.have.been.calledWith(functionExpression, null);
            logSpy.restore();
        });

        it('should call tracer.log with corresponding "this" when invoked with a function', () => {
            const logSpy = sinon.spy(tracer, 'log');
            tracer.trace('log', console);
            expect(logSpy).to.have.been.calledWith(console.log, console);
            logSpy.restore();
        });
    });
});