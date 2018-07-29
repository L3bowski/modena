var winston = require('winston');

const configureWinston = modenaConfig => {
	if (modenaConfig.enableConsoleLogs == 'false') {
		winston.remove(winston.transports.Console);	
	}
	
	if (modenaConfig.logFilename && modenaConfig.logFilename.length > 0) {
		winston.add(winston.transports.File, {
			filename: modenaConfig.logFilename
		});
	}
};

module.exports = { configureWinston };
