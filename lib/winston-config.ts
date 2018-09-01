import winston from 'winston';
import { ModenaConfig } from './types';

export const configureWinston = (modenaConfig: ModenaConfig) => {
    if (modenaConfig.ENABLE_CONSOLE_LOGS === 'false') {
        winston.remove(winston.transports.Console);    
    }
    
    if (modenaConfig.LOG_FILENAME && modenaConfig.LOG_FILENAME.length > 0) {
        winston.add(winston.transports.File, {
            filename: modenaConfig.LOG_FILENAME
        });
    }
};
