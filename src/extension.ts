'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import commands = require("./commands");
import TemplatesManager from './templatesManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  let templatesManager = new TemplatesManager(vscode.workspace.getConfiguration('fileFromTemplate'));
  templatesManager.createTemplatesDirIfNotExists();

  // TemplatesManager.createFileTemplatesIfNotExists()
  // register extension commands  
  context.subscriptions.push(vscode.commands.registerCommand('extension.newFileFromTemplate', commands.createFromTemplate.bind(undefined, templatesManager)));
}

// this method is called when your extension is deactivated
export function deactivate() {
}