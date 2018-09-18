import winston from 'winston';
import { getTimestamp, indent } from './format';
import { ModenaConfig } from './types';

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

const log = <T>(functionExpression: (...parameters: any[]) => T, thisObject: any) => {
    return (...parameters: any[]) => {
        startTrace();
        try {
            winston.info(indent(callStackDepth) + (functionExpression.name || 'anonymous_function') + logArguments(...parameters));
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

export const logArguments = (...parameters: any[]) => {
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

export const trace = <T>(functionExpression: ((...parameters: any[]) => T) | string, thisObject?: any) => {
    let tracedFunction: (...parameters: any[]) => T;
    if (typeof functionExpression === 'function') {
        tracedFunction = log(functionExpression, null);
    }
    else {
        tracedFunction = log(thisObject[functionExpression], thisObject);
    }
    return tracedFunction;
};

export const setUpTracer = (modenaConfig: ModenaConfig) => {
    if (modenaConfig.ENABLE_CONSOLE_LOGS === 'false') {
        winston.remove(winston.transports.Console);    
    }
    
    if (modenaConfig.LOG_FILENAME && modenaConfig.LOG_FILENAME.length > 0) {
        winston.add(winston.transports.File, {
            filename: modenaConfig.LOG_FILENAME
        });
    }
};

export const startTrace = () => {
    if (!activeTrace) {
        console.log('Trace start: ' + getTimestamp() + '-------------------------');
        activeTrace = true;
        setImmediate(() => {
            activeTrace = false;
            console.log('Trace end: ' + getTimestamp() + '-------------------------');
        });
    }
};

export default {
    error,
    info,
    setUpTracer,
    trace
};
