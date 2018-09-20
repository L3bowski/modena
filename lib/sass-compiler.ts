import { existsSync, readdirSync, writeFile } from 'fs';
import { render, Result, SassError } from 'node-sass';
import { join } from 'path';
import tracer from './tracer';
import { AppConfig } from './types';
import { ensureDirectory } from './utils';

const compileSassFile = (inputFile: string, outputFile: string) => {
    if (existsSync(inputFile)) {
        const input = {
            file: inputFile
        };
        const callback = function(renderError: SassError, result: Result) {
            if (renderError) {
                tracer.error(renderError);
            }
            else {
                writeFile(outputFile, result.css.toString(), fileError => {
                    if (fileError) {
                        tracer.error(fileError);
                    }
                });
            }
        };
        render(input, callback);
    }
};

const compileSassFiles = (inputDirectory: string, outputDirectory: string) => {
    const filenames = readdirSync(inputDirectory);
    filenames.forEach(filename => {
        const inputFile = join(inputDirectory, filename);
        const outputFile = join(outputDirectory, filename.replace('.scss', '.css'));
        compileSassFile(inputFile, outputFile);
    });
};

export const compileAppSass = function _compileAppSass(appConfig: AppConfig) {
    const inputDirectory = join(appConfig.path, 'sass');
    const assetsDirectory = join(appConfig.path, appConfig.assetsFolder);
    const outputDirectory = join(assetsDirectory, 'css');

    if (existsSync(inputDirectory)) {
        ensureDirectory(assetsDirectory);
        ensureDirectory(outputDirectory);
        compileSassFiles(inputDirectory, outputDirectory);
    }
};
