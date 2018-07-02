var { existsSync, mkdirSync, writeFile, readdirSync } = require('fs');
var { join } = require('path');
var { render } = require('node-sass');

const ensureDirectory = directoryPath => {
	if (!existsSync(directoryPath)){
		mkdirSync(directoryPath);
	}
};

const compileSassFile = (inputFile, outputFile) => {
	if (existsSync(inputFile)) {
		var input = {
			file: inputFile
		};
		var callback = function(error, result) {
			if (error) {
				console.log(error);
			}
			else {
				writeFile(outputFile, result.css.toString(), error => {
					if (error) {
						console.log(error);
					}
				})
			}
		};
		render(input, callback);
	}
};

const compileSassFiles = (inputDirectory, outputDirectory) => {
	var filenames = readdirSync(inputDirectory);
	filenames.forEach(filename => {
		var inputFile = join(inputDirectory, filename);
		var outputFile = join(outputDirectory, filename.replace('.scss', '.css'));
		compileSassFile(inputFile, outputFile);
	});
};

const compileAppSass = appConfig => {
	var inputDirectory = join(appConfig.path, 'sass');
	var assetsDirectory = join(appConfig.path, appConfig.assetsFolder);
	var outputDirectory = join(assetsDirectory, 'css');

	if (existsSync(inputDirectory)) {
		ensureDirectory(assetsDirectory);
		ensureDirectory(outputDirectory);
		compileSassFiles(inputDirectory, outputDirectory);
	}
};

module.exports = { compileAppSass };
