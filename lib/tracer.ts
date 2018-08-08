import winston from 'winston';
import { digitPrepender } from './format';

let traceLevel = 'log';
let stackLevel = 0;

const formatter = (value: number) => digitPrepender(value, 0, 2);

const getTimestamp = () => {
    var currentDate = new Date();
    var timestamp = formatter(
        currentDate.getHours()) + ':' + formatter(currentDate.getMinutes()) + ':' +
        formatter(currentDate.getSeconds());
    return timestamp;
};

const evaluateArguments = (suppliedArguments: any) => {
    for (var index in suppliedArguments) {
        var argument = suppliedArguments[index];
        if (typeof argument === "undefined" || argument == null) {
            winston.info('Parameter ' + index + ' is null or undefined...');
        }
    }
};

const logArguments = (suppliedArguments: any) => {
    var stringifiedArguments = '(';
    var keysNumber = Object.keys(suppliedArguments).length;
    for (var index in suppliedArguments) {
        var argument = suppliedArguments[index];
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

const getStackIndentation = (stackLevel: number) => '\t'.repeat(stackLevel);

const getLogHeader = (stackLevel: number) => getTimestamp() + getStackIndentation(stackLevel) + ' ';

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
                var result = functionExpression.apply(thisObject, arguments);
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
    var tracedFunction;

    if (thisObject == null) {
        tracedFunction = tracers[traceLevel](functionExpression, null);
    }
    else {
        tracedFunction = tracers[traceLevel](thisObject[functionExpression as string], thisObject);
    }

    return tracedFunction;
}

export const setTraceLevel = (level: string) => traceLevel = level;

export const info = (message: string) => {
    winston.info(getLogHeader(stackLevel) + message);
};

export const error = (message: string) => {
    winston.error(getLogHeader(stackLevel) + message);
};

export default {
    error,
    info,
    trace,
    setTraceLevel
};
