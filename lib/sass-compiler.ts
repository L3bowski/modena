import { existsSync, mkdirSync, writeFile, readdirSync } from 'fs';
import { join } from 'path';
import { render } from 'node-sass';
import { AppConfig } from './types';

const ensureDirectory = (directoryPath: string) => {
	if (!existsSync(directoryPath)){
		mkdirSync(directoryPath);
	}
};

const compileSassFile = (inputFile: string, outputFile: string) => {
	if (existsSync(inputFile)) {
		var input = {
			file: inputFile
		};
		var callback = function(error: any, result: any) {
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

const compileSassFiles = (inputDirectory: string, outputDirectory: string) => {
	var filenames = readdirSync(inputDirectory);
	filenames.forEach(filename => {
		var inputFile = join(inputDirectory, filename);
		var outputFile = join(outputDirectory, filename.replace('.scss', '.css'));
		compileSassFile(inputFile, outputFile);
	});
};

export const compileAppSass = (appConfig: AppConfig) => {
	var inputDirectory = join(appConfig.path, 'sass');
	var assetsDirectory = join(appConfig.path, appConfig.assetsFolder);
	var outputDirectory = join(assetsDirectory, 'css');

	if (existsSync(inputDirectory)) {
		ensureDirectory(assetsDirectory);
		ensureDirectory(outputDirectory);
		compileSassFiles(inputDirectory, outputDirectory);
	}
};
