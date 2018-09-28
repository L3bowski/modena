import winston from 'winston';
import { ModenaConfig } from '../types';
import { getTimestamp, indent } from './format';

let activeTrace = false;
let callStackDepth = 0;

export const error = (content: any) => {
    startTrace();
    winston.error(indent(callStackDepth), content);
};

export const info = (content: any) => {
    startTrace();
    winston.info(indent(callStackDepth), content);
};

export const instrumentFunctionExecution = <T>(functionExpression: (...parameters: any[]) => T, thisObject: any) => {
    return (...parameters: any[]) => {
        startTrace();
        try {
            winston.info(indent(callStackDepth) + (functionExpression.name || 'anonymous_function') +
                stringifyArguments(...parameters));
            callStackDepth++;
            const result: T = functionExpression.call(thisObject, ...parameters);
            callStackDepth--;
            return result;
        }
        catch (error) {
            winston.error(error);
            callStackDepth--;
            throw error;
        }
    };
};

export const setUpTracer = (modenaConfig: ModenaConfig) => {
    if (modenaConfig.DISABLE_CONSOLE_LOGS === 'true') {
        winston.remove(winston.transports.Console);    
    }
    
    if (modenaConfig.LOG_FILENAME && modenaConfig.LOG_FILENAME.length > 0) {
        winston.add(winston.transports.File, {
            filename: modenaConfig.LOG_FILENAME
        });
    }
};

export const stringifyArguments = (...parameters: any[]) => {
    const stringifiedArguments = Object.keys(parameters).map(key => {
        const argument = parameters[key as any];
        let stringifiedArgument = argument + '';
        if (argument instanceof Array) {
            stringifiedArgument = '[...]';
        }
        else if (argument instanceof Function) {
            stringifiedArgument = '() => {}';
        }
        else if (argument instanceof Object) {
            stringifiedArgument = '{...}';
        }
        return stringifiedArgument;
    })
    .join(', ');
    return `(${stringifiedArguments})`;
};

export const startTrace = () => {
    if (!activeTrace) {
        winston.info('Trace start: ' + getTimestamp() + '-------------------------');
        activeTrace = true;
        setImmediate(() => {
            activeTrace = false;
            winston.info('Trace end: ' + getTimestamp() + '-------------------------');
        });
    }
};

export const trace = <T>(functionExpression: ((...parameters: any[]) => T) | string, thisObject?: any) => {
    let tracedFunction: (...parameters: any[]) => T;
    if (typeof functionExpression === 'function') {
        tracedFunction = instrumentFunctionExecution(functionExpression, null);
    }
    else {
        tracedFunction = instrumentFunctionExecution(thisObject[functionExpression], thisObject);
    }
    return tracedFunction;
};

export default {
    error,
    info,
    setUpTracer,
    trace
};
