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

            let expression = /#{(\w+)}/g;

            let placeholders = [];
            let matches = expression.exec(fileContents);
            while (matches) {
                if (placeholders.indexOf(matches[0]) === -1) {
                    placeholders.push(matches[0]);
                }
                matches = expression.exec(fileContents);
            }

            placeholders.forEach(function (placeholder) {
                const variableName = /#{(\w+)}/.exec(placeholder)[1];
                const search = new RegExp(placeholder, "g");

                switch (variableName) {
                    case "filename":
                        fileContents = fileContents.replace(search, className);
                        break;
                    case "filepath":
                        let workspaceRoot = vscode.workspace.rootPath;
                        fileContents = fileContents.replace(search, targetFolder.replace(`${workspaceRoot}/`, ""));
                        break;
                    case "year":
                        fileContents = fileContents.replace(search, moment().format("YYYY"));
                        break;
                    case "date":
                        fileContents = fileContents.replace(search, moment().format("D MMM YYYY"));
                        break;
                    default:
                        if (workspaceSettings && workspaceSettings[variableName]) {
                            fileContents = fileContents.replace(search, workspaceSettings[variableName]);
                        } else {
                            let variableInput = <vscode.InputBoxOptions> {
                                prompt: `Please enter the desired value for "${variableName}"`
                            };
                            let variablePromise = new Promise((resolve, reject) => {
                                vscode.window.showInputBox(variableInput).then(value => {
                                    let replacement;
                                    if (!value) {
                                        replacement = variableName.toUpperCase();
                                    } else {
                                        replacement = value;
                                    }

                                    fileContents = fileContents.replace(search, replacement);
                                    resolve(fileContents);
                                });
                            });
                            resultsPromise.push(variablePromise);
                        }
                        break;
                }
            });

            Promise.all(resultsPromise).then(() => {
                const fullname = path.join(targetFolder, filename);
                fs.writeFile(path.join(targetFolder, filename), fileContents, function (err) {
                    if (err) {
                        vscode.window.showErrorMessage(err.message);
                    }

                    vscode.workspace.openTextDocument(fullname).then((doc) => {
                        const editor = vscode.window.activeTextEditor;

                        vscode.window.showTextDocument(doc, editor.viewColumn);
                    });
                });
            });
        });
    });
}
