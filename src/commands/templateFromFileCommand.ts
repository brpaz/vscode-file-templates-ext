"use strict";

import vscode = require("vscode");
import fs = require("fs");
import path = require("path");
import TemplatesManager from "../templatesManager";

/**
 * This command allows the creation of a new template directly from an existing file.
 * This command can be invoked by the Command Palette or in a folder context menu on the explorer view.
 * @export
 * @param {TemplatesManager} templatesManager
 * @param {*} args
 * @returns
 */
export function run(templatesManager: TemplatesManager, args: any) {

    /**
     * gets the file contents of the current selected file.
     * if this is toggled via context menu, we can get it directly from args,
     * otherwise we will use the current active file in the editor.
     */
    let filePath = args ? args.fsPath : vscode.window.activeTextEditor.document.fileName;
    let fileName = path.basename(filePath);

    // ask for filename
    let inputOptions = <vscode.InputBoxOptions> {
        prompt: "Please enter the desired filename",
        value: fileName
    };

    vscode.window.showInputBox(inputOptions).then(filename => {
        let fileContents = fs.readFileSync(filePath);
        let templateFile = path.join(templatesManager.getTemplatesDir(), path.basename(filePath));

        fs.writeFile(templateFile, fileContents, function (err) {
            if (err) {
                vscode.window.showErrorMessage(err.message);
            } else {
                vscode.window.showQuickPick(["Yes", "No"], { placeHolder: "Edit the new template?" }).then((choice) => {
                    if (choice === "Yes") {
                        vscode.workspace.openTextDocument(templateFile).then((doc) => {
                            const editor = vscode.window.activeTextEditor;
                            const column = editor.viewColumn;
                            vscode.window.showTextDocument(doc, column);
                        });
                    }
                });
            }

        });
    });
}
