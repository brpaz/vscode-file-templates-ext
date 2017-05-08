"use strict";

import vscode = require("vscode");
import fs = require("fs");
import path = require("path");
import TemplatesManager from "../templatesManager";
import helpers = require("../helpers");
import moment = require("moment");

/**
 * Main command to create a file from a template.
 * This command can be invoked by the Command Palette or in a folder context menu on the explorer view.
 * @export
 * @param {TemplatesManager} templatesManager
 * @param {*} args
 * @returns
 */
export function run(templatesManager: TemplatesManager, args: any) {

    let templates = templatesManager.getTemplates();

    // gets the target folder. if its invoked from a context menu,
    // we use that reference, otherwise we use the file system path
    let targetFolder = args ? args.fsPath : vscode.workspace.rootPath;

    if (templates.length === 0) {
        let optionGoToTemplates = <vscode.MessageItem> {
            title: "Open Templates Folder"
        };

        vscode.window.showInformationMessage("No templates found!", optionGoToTemplates).then(option => {

            // nothing selected
            if (!option) {
                return;
            }

            helpers.openFolderInExplorer(templatesManager.getTemplatesDir());

        });

        return;
    }

    // show the list of available templates.
    vscode.window.showQuickPick(templates).then(selection => {

        // nothing selected. cancel
        if (!selection) {
            return;
        }

        // ask for filename
        let inputOptions = <vscode.InputBoxOptions> {
            prompt: "Please enter the desired file name",
            value: selection,
        };

        vscode.window.showInputBox(inputOptions).then(filename => {
            let workspaceSettings = vscode.workspace.getConfiguration("fileTemplates");

            let fileContents = templatesManager.getTemplate(selection);
            const className = filename.replace(/\.[^/.]+$/, "");
            const resultsPromise = [];

            let regexResult = /#{(\w+)}/g.exec(fileContents);
            while (regexResult) {
                const variableName = regexResult[1];
                const regex = new RegExp(`#{${variableName}}`, "g");

                switch (variableName) {
                    case "filename":
                        fileContents = fileContents.replace(regex, className);
                        break;

                    case "filepath":
                        let workspaceRoot = vscode.workspace.rootPath;
                        fileContents = fileContents.replace(regex, targetFolder.replace(`${workspaceRoot}/`, ""));
                        break;

                    case "year":
                        fileContents = fileContents.replace(regex, moment().format("YYYY"));
                        break;

                    case "date":
                        fileContents = fileContents.replace(regex, moment().format("D MMM YYYY"));
                        break;

                    default:
                        if (workspaceSettings && workspaceSettings[variableName]) {
                            fileContents = fileContents.replace(regex, workspaceSettings[variableName]);
                        } else {
                            fileContents = fileContents.replace(regex, variableName.toUpperCase());
                        }
                        break;
                }

                regexResult = /#{(\w+)}/g.exec(fileContents);
            }

            fs.writeFile(path.join(targetFolder, filename), fileContents, function (err) {
                if (err) {
                    vscode.window.showErrorMessage(err.message);
                }
                vscode.window.showInformationMessage(filename + " created");
            });
        });
    });
}
