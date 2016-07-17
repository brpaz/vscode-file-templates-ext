
import child_process = require('child_process');

/**
 * Helper funcion for open a folder in Explorer
 * @export
 * @param {string} folder
 */
export function openFolderInExplorer(folder)
{
     let command = null;
     switch (process.platform) {
        case 'linux':
            command = 'xdg-open ' + folder;
            break;
        case 'darwin':
            command = 'open ' + folder;
            break;
        case 'win32': 
            command = 'start ' + folder;;
            break;    
     }

     if (command != null) {
        child_process.exec(command);
     }  
}