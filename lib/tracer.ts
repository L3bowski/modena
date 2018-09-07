import winston from 'winston';
import { indent, stringifyTo2Digits } from './format';
import { ModenaConfig } from './types';

let activeTrace = false;
let callStackDepth = 0;

export const error = (content: any) => {
    startTrace();
    winston.error(indent(callStackDepth), content);
};

const getTimestamp = () => {
    const currentDate = new Date();
    const timestamp = stringifyTo2Digits(currentDate.getHours()) + ':' +
        stringifyTo2Digits(currentDate.getMinutes()) + ':' +
        stringifyTo2Digits(currentDate.getSeconds());
    return timestamp;
};

export const info = (content: any) => {
    startTrace();
    winston.info(indent(callStackDepth), content);
};

const log = <T>(functionExpression: (...parameters: any[]) => T, thisObject: any) => {
    return (...parameters: any[]) => {
        startTrace();
        try {
            winston.info(indent(callStackDepth) + functionExpression.name + logArguments(...parameters));
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

// TODO Refactor
const logArguments = (...parameters: any[]) => {
    let stringifiedArguments = '(';
    let keysNumber = Object.keys(parameters).length;
    for (const index in parameters) {
        const argument = parameters[index];
        if (typeof argument === 'object') {
            stringifiedArguments += '{}';
        }
        else if (typeof argument === 'function') {
            stringifiedArguments += argument.name + '()';
        }
        else {
            stringifiedArguments += argument;
        }
        keysNumber--;
        if (keysNumber > 0) {
            stringifiedArguments += ', ';
        }
    }
    stringifiedArguments += ')';
    return stringifiedArguments;
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

const startTrace = () => {
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
