import { existsSync, lstatSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export const ensureDirectory = (directoryPath: string) => {
    if (!existsSync(directoryPath)) {
        mkdirSync(directoryPath);
    }
};

export const getDirectoriesName = (path: string) =>
    readdirSync(path).filter(name => lstatSync(join(path, name)).isDirectory());