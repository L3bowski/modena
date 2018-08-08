import winston from 'winston';
import { ModenaConfig } from './types';

export const configureWinston = (modenaConfig: ModenaConfig) => {
	if (modenaConfig.enableConsoleLogs == 'false') {
		winston.remove(winston.transports.Console);	
	}
	
	if (modenaConfig.logFilename && modenaConfig.logFilename.length > 0) {
		winston.add(winston.transports.File, {
			filename: modenaConfig.logFilename
		});
	}
};
