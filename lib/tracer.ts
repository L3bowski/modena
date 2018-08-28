import winston from 'winston';
import { digitPrepender } from './format';

let traceLevel = 'log';
let stackLevel = 0;

const formatter = (value: number) => digitPrepender(value, 0, 2);

const getTimestamp = () => {
    const currentDate = new Date();
    const timestamp = formatter(
        currentDate.getHours()) + ':' + formatter(currentDate.getMinutes()) + ':' +
        formatter(currentDate.getSeconds());
    return timestamp;
};

const evaluateArguments = (suppliedArguments: any) => {
    for (const index in suppliedArguments) {
        const argument = suppliedArguments[index];
        if (typeof argument === 'undefined' || argument == null) {
            winston.info('Parameter ' + index + ' is null or undefined...');
        }
    }
};

const logArguments = (suppliedArguments: any) => {
    let stringifiedArguments = '(';
    let keysNumber = Object.keys(suppliedArguments).length;
    for (const index in suppliedArguments) {
        const argument = suppliedArguments[index];
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

const getStackIndentation = (_stackLevel: number) => '\t'.repeat(_stackLevel);

const getLogHeader = (_stackLevel: number) => getTimestamp() + getStackIndentation(_stackLevel) + ' ';

const tracers: any = {
    error: (functionExpression: Function, thisObject: any) => {
        return function() {
            try {
                return functionExpression.apply(thisObject, arguments);
            }
            catch (error) {
                winston.error(functionExpression.name + logArguments(arguments));
                winston.error(error);
                throw error;
            }
        };
    },
    log: (functionExpression: Function, thisObject: any) => {
        return function() {
            try {
                stackLevel++;
                winston.info(getLogHeader(stackLevel) + functionExpression.name + logArguments(arguments));
                evaluateArguments(arguments);
                const result = functionExpression.apply(thisObject, arguments);
                stackLevel--;
                return result;
            }
            catch (error) {
                winston.error(error);
                stackLevel--;
                throw error;
            }
        };
    }
};

export const trace = (functionExpression: Function | string, thisObject?: any) => {
    let tracedFunction;

    if (thisObject == null) {
        tracedFunction = tracers[traceLevel](functionExpression, null);
    }
    else {
        tracedFunction = tracers[traceLevel](thisObject[functionExpression as string], thisObject);
    }

    return tracedFunction;
};

export const setTraceLevel = (level: string) => traceLevel = level;

export const info = (message: string, ...meta: any[]) => {
    winston.info(getLogHeader(stackLevel), message, ...meta);
};

export const error = (message: string, ...meta: any[]) => {
    winston.error(getLogHeader(stackLevel), message, ...meta);
};

export default {
    error,
    info,
    trace,
    setTraceLevel
};
