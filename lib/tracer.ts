import winston from 'winston';
import { digitPrepender } from './format';

let stackLevel = 0;

const evaluateArguments = (...parameters: any[]) => {
    for (const index in parameters) {
        const argument = parameters[index];
        if (typeof argument === 'undefined' || argument == null) {
            winston.info('Parameter ' + index + ' is null or undefined...');
        }
    }
};

const formatter = (value: number) => digitPrepender(value, 0, 2);

const getLogHeader = (_stackLevel: number) => getTimestamp() + getStackIndentation(_stackLevel) + ' ';

const getStackIndentation = (_stackLevel: number) => '\t'.repeat(_stackLevel);

const getTimestamp = () => {
    const currentDate = new Date();
    const timestamp = formatter(
        currentDate.getHours()) + ':' + formatter(currentDate.getMinutes()) + ':' +
        formatter(currentDate.getSeconds());
    return timestamp;
};

const log = <T>(functionExpression: (...parameters: any[]) => T, thisObject: any) => {
    return (...parameters: any[]) => {
        try {
            stackLevel++;
            winston.info(getLogHeader(stackLevel) + functionExpression.name + logArguments(...parameters));
            evaluateArguments(...parameters);
            const result: T = functionExpression.call(thisObject, ...parameters);
            stackLevel--;
            return result;
        }
        catch (error) {
            winston.error(error);
            stackLevel--;
            throw error;
        }
    };
};
    
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
};
