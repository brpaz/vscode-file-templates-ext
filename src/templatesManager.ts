'use strict';
import {WorkspaceConfiguration} from 'vscode';
import fs = require('fs');
import path = require('path');
import os = require('os');

/**
 * Main class to handle the logic of the File Templates
 * @export
 * @class TemplatesManager
 */
export default class TemplatesManager {

    config: WorkspaceConfiguration;

    constructor(config: WorkspaceConfiguration) {
        this.config = config;
    }

    /**
     * Returns a list of available templates by reading the Templates Directory.
     * @returns string[]
     */
    public getTemplates(): string[] {
        // @TODO make this async (use promises ???)
        return fs.readdirSync(this.getTemplatesDir());
    }

    /**
     * Read the contents of a templates
     * @param filename The name of the template file.
     * @return Buffer
     */
    public getTemplate(filename): Buffer {
        return fs.readFileSync(path.join(this.getTemplatesDir(), filename));
    }

    /**
     * Returns the templates directory location.
     * If no user configuration is found, the extension will look for
     * templates in USER_DATA_DIR/Code/FileTemplates.
     * Otherwise it will look for the path defined in the extension configuration.
     * @return {string}
     */
    public getTemplatesDir(): string {
        return this.config.get('templates_dir', this.getDefaultTemplatesDir());
    }

    /**
     * Returns the default templates location based on the user OS.
     * @returns {string}
     */
    private getDefaultTemplatesDir(): string {
        let userDataDir = null;

        switch (process.platform) {
            case 'linux':
                userDataDir = path.join(os.homedir(), '.config');
                break;
            case 'darwin':
                userDataDir = path.join(os.homedir(), 'Library', 'Application Support');
                break;
            case 'win32':
                userDataDir = process.env.APPDATA;
                break;
            default:
                throw Error("Unrecognizable operative system");
        }

        return path.join(userDataDir, 'Code', 'User', 'FileTemplates');
    }

    /**
     * Creates the templates dir if not exists
     * @throw Error
     */
    public createTemplatesDirIfNotExists() {
        let templatesDir = this.getTemplatesDir();
        fs.mkdir(templatesDir, '0755', function (err) {
            if (err && err.code != 'EEXIST') {
                throw Error("Failed to created templates directory " + templatesDir);
            }
        });
    }
}
