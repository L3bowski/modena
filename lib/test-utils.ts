import winston from 'winston';

interface LoggingMocks {
    consoleLog: (message?: string, ...optionalParameters: any[]) => void;
    winstonLog: winston.LogMethod;
    winstonInfo: winston.LeveledLogMethod;
    winstonError: winston.LeveledLogMethod;
}

let loggingMocks: LoggingMocks;

export const disableLogs = (callback: Function, done: MochaDone) => {
    setLoggingMocks();
    try {
        callback();
    }
    finally {
        setImmediate(() => {
            restoreLoggingMocks();
            done();
        });
    }
};

const restoreLoggingMocks = () => {
    console.log = loggingMocks.consoleLog;
    winston.log = loggingMocks.winstonLog;
    winston.info = loggingMocks.winstonInfo;
    winston.error = loggingMocks.winstonError;
};

const setLoggingMocks = () => {
    loggingMocks = {
        consoleLog: console.log,
        winstonLog: winston.log,
        winstonInfo: winston.info,
        winstonError: winston.error
    };
    console.log = () => {};
    winston.log = ((): winston.LoggerInstance => ({} as any)) as winston.LogMethod;
    winston.info = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
    winston.error = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
};