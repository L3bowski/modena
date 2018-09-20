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

    describe('Error', () => {
        it('should start trace', done => {
            disableLogs(() => {
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.error(message);    
                expect(startTraceSpy).to.have.been.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should log error through winston', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                tracer.error(message);
                expect(winstonErrorSpy).to.have.been.calledOnceWith('', message);
                winstonErrorSpy.restore();
            }, done);
        });

        it('should log error with indentation through winston when called from traced function', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                tracer.trace(() => tracer.error(message))();
                expect(winstonErrorSpy).to.have.been.calledOnceWith('    ', message);
                winstonErrorSpy.restore();
            }, done);
        });
    });

    describe('Info', () => {
        it('should start trace', done => {
            disableLogs(() => {
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.info(message);
                expect(startTraceSpy).to.have.been.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should log message through winston', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.info(message);
                expect(winstonInfoSpy).to.have.been.calledTwice;
                const infoArguments = winstonInfoSpy.getCall(1).args;
                expect(infoArguments[0]).to.equal('');
                expect(infoArguments[1]).to.equal(message);
                winstonInfoSpy.restore();
            }, done);
        });

        it('should log message with indentation through winston when called from traced function', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.trace(() => tracer.info(message))();
                // The trace function calls winston.info twice
                expect(winstonInfoSpy).to.have.been.calledThrice;
                const infoArguments = winstonInfoSpy.getCall(2).args;
                expect(infoArguments[0]).to.equal('    ');
                expect(infoArguments[1]).to.equal(message);
                winstonInfoSpy.restore();
            }, done);
        });
    });

    describe('Instrument function execution', () => {
        it('should start trace', done => {
            disableLogs(() => {
                const functionExpression = () => {};
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.instrumentFunctionExecution(functionExpression, null)();
                expect(startTraceSpy).to.have.been.calledOnce;
                startTraceSpy.restore();
            }, done);
        });

        it('should stringify arguments', done => {
            disableLogs(() => {
                const functionExpression = () => {};
                const stringifyArgumentsSpy = sinon.spy(tracer, 'stringifyArguments');
                tracer.instrumentFunctionExecution(functionExpression, null)(3);
                expect(stringifyArgumentsSpy).to.have.been.calledOnceWith(3);
                stringifyArgumentsSpy.restore();
            }, done);
        });

        it('should log function execution through winston', done => {
            disableLogs(() => {
                const functionExpression = () => {};
                const winstonSpy = sinon.spy(winston, 'info');
                tracer.instrumentFunctionExecution(functionExpression, null)();
                expect(winstonSpy).to.have.been.calledTwice;
                winstonSpy.restore();
            }, done);
        });

        it('should execute the provided function with corresponding parameters', done => {
            disableLogs(() => {
                const providedArgument = 3;
                const spy = sinon.spy();
                tracer.instrumentFunctionExecution(spy, null)(providedArgument);
                expect(spy).to.have.been.calledWith(providedArgument);
            }, done);
        });

        it('should log exceptions raised during function execution', done => {
            disableLogs(() => {
                const error = Error('New exception');
                const functionExpression = () => { throw error; };
                const winstonSpy = sinon.spy(winston, 'error');
                try {
                    tracer.instrumentFunctionExecution(functionExpression, null)();
                }
                catch(error) {
                }
                expect(winstonSpy).to.have.been.calledOnceWith(error);
            }, done);
        });
    });

    describe('Setup tracer', () => {
        it('should remove console logs if DISABLE_CONSOLE_LOGS set to true', () => {
            const modenaConfig: ModenaConfig = {
                DISABLE_CONSOLE_LOGS: 'true'
            };
            const winstonSpy = sinon.spy(winston, 'remove');
            tracer.setUpTracer(modenaConfig);
            expect(winstonSpy).to.have.been.calledOnce;
            winstonSpy.restore();
        });
        it('should not remove console logs if DISABLE_CONSOLE_LOGS is not set', () => {
            const modenaConfig: ModenaConfig = {};
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

    describe('Stringify arguments', () => {
        it('Transform value parameters to their value', () => {
            const valueParameters = tracer.stringifyArguments('text', 100, true, null, undefined, typeof 3);
            expect(valueParameters).to.equal('(text, 100, true, null, undefined, number)');
        });
        it('Transform function parameters to "() => {}"', () => {
            const functionExpression = (parameter: number) => parameter^2;
            const functionParameter = tracer.stringifyArguments(functionExpression, functionExpression);
            expect(functionParameter).to.equal('(() => {}, () => {})');
        });
        it('Transform array parameters to "[...]"', () => {
            const simpleArray = [1,2,3,4];
            const complexArray = [simpleArray];
            const functionParameter = tracer.stringifyArguments(simpleArray, complexArray);
            expect(functionParameter).to.equal('([...], [...])');
        });
        it('Transform object parameters to "{...}"', () => {
            const functionParameter = tracer.stringifyArguments({ property: 'value' }, { what: 'ever' });
            expect(functionParameter).to.equal('({...}, {...})');
        });
    });

    describe('Start trace', () => {
        it('should winston.info trace start if no active trace', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.startTrace();
                expect(winstonInfoSpy).to.have.been.called;
                const message = winstonInfoSpy.getCall(0).args[0];
                expect(message).to.contain('Trace start');
                winstonInfoSpy.restore();
            }, done);
        });

        it('should not winston.info trace start if active trace', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.startTrace();
                tracer.startTrace();
                expect(winstonInfoSpy).to.have.been.calledOnce;
                winstonInfoSpy.restore();
            }, done);
        });

        it('should set and immediate to winston.info trace end', done => {
            disableLogs(() => {
                tracer.startTrace();
                const winstonInfoSpy = sinon.spy(winston, 'info');
                expect(winstonInfoSpy).to.not.have.been.called;
                setImmediate(() => {
                    expect(winstonInfoSpy).to.have.been.calledOnce;
                    const message = winstonInfoSpy.getCall(0).args[0];
                    expect(message).to.contain('Trace end');
                    winstonInfoSpy.restore();
                });
            }, done);
        });
    });

    describe('Trace', () => {
        it('should call tracer.instrumentFunctionExecution with null "this" when invoked with a function', done => {
            disableLogs(() => {
                const functionExpression = () => {};
                const logSpy = sinon.spy(tracer, 'instrumentFunctionExecution');
                tracer.trace(functionExpression)();
                expect(logSpy).to.have.been.calledWith(functionExpression, null);
                logSpy.restore();
            }, done);
        });

        it('should call tracer.instrumentFunctionExecution with corresponding "this" when invoked with a function', done => {
            disableLogs(() => {
                const logSpy = sinon.spy(tracer, 'instrumentFunctionExecution');
                tracer.trace('log', console)();
                expect(logSpy).to.have.been.calledWith(console.log, console);
                logSpy.restore();
            }, done);
        });
    });
});