const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const os = require('os');

const store = new Store();

// Global error handling for main process
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in main process:', error);
  logError(error, 'uncaughtException');
  
  // Show error dialog to user
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox('Unexpected Error', 
      `An unexpected error occurred: ${error.message}\n\nThe application will continue running, but you may want to restart it.`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in main process:', reason);
  logError(reason, 'unhandledRejection');
});

// Error logging function
function logError(error, type = 'error') {
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: type,
      message: error.message || String(error),
      stack: error.stack || 'No stack trace',
      platform: process.platform,
      nodeVersion: process.version,
      electronVersion: process.versions.electron
    };

    const logDir = path.join(os.homedir(), '.easy-debug', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'error.log');
    const logEntry = JSON.stringify(errorLog) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

let mainWindow;
let isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupIpcHandlers();
}

function setupIpcHandlers() {
  ipcMain.handle('select-folder', async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available');
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        
        // Validate folder path
        if (!fs.existsSync(folderPath)) {
          throw new Error(`Selected folder does not exist: ${folderPath}`);
        }
        
        const recentProjects = store.get('recentProjects', []);
        const updatedProjects = [folderPath, ...recentProjects.filter(p => p !== folderPath)].slice(0, 10);
        store.set('recentProjects', updatedProjects);
        
        return folderPath;
      }
      
      return null;
    } catch (error) {
      console.error('Error in select-folder handler:', error);
      logError(error, 'select-folder-handler');
      throw error;
    }
  });

  ipcMain.handle('get-recent-projects', async () => {
    try {
      const recentProjects = store.get('recentProjects', []);
      
      // Validate that all projects still exist
      const validProjects = recentProjects.filter(projectPath => {
        try {
          return fs.existsSync(projectPath);
        } catch (error) {
          console.warn(`Cannot access project path: ${projectPath}`, error);
          return false;
        }
      });
      
      // Update store if some projects were removed
      if (validProjects.length !== recentProjects.length) {
        store.set('recentProjects', validProjects);
      }
      
      return validProjects;
    } catch (error) {
      console.error('Error in get-recent-projects handler:', error);
      logError(error, 'get-recent-projects-handler');
      return [];
    }
  });

  ipcMain.handle('open-in-editor', async (event, projectPath, editor = 'code') => {
    const { spawn } = require('child_process');
    
    try {
      // Input validation
      if (!projectPath || typeof projectPath !== 'string') {
        throw new Error('Invalid project path provided');
      }
      
      if (!fs.existsSync(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }
      
      if (!['code', 'studio', 'explorer'].includes(editor)) {
        console.warn(`Unknown editor type: ${editor}, defaulting to file explorer`);
        editor = 'explorer';
      }
      switch (editor) {
        case 'code':
          // Try to open in VS Code
          try {
            spawn('code', [projectPath], { detached: true });
            return { success: true, message: 'Opening in VS Code' };
          } catch (codeError) {
            // Fallback to file explorer if VS Code not found
            await shell.openPath(projectPath);
            return { success: true, message: 'VS Code not found, opened in file explorer' };
          }
          
        case 'studio':
          // Try to open in Android Studio
          const studioPath = process.platform === 'win32' 
            ? 'studio64.exe' 
            : process.platform === 'darwin' 
              ? 'studio' 
              : 'android-studio';
          
          try {
            spawn(studioPath, [projectPath], { detached: true });
            return { success: true, message: 'Opening in Android Studio' };
          } catch (studioError) {
            await shell.openPath(projectPath);
            return { success: true, message: 'Android Studio not found, opened in file explorer' };
          }
          
        case 'explorer':
          await shell.openPath(projectPath);
          return { success: true, message: 'Opened in file explorer' };
          
        default:
          await shell.openPath(projectPath);
          return { success: true, message: 'Opened in default application' };
      }
    } catch (error) {
      console.error('Error in open-in-editor handler:', error);
      logError(error, 'open-in-editor-handler');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-theme', async () => {
    try {
      const theme = store.get('theme', 'dark');
      
      // Validate theme value
      if (!['light', 'dark'].includes(theme)) {
        console.warn(`Invalid theme value: ${theme}, defaulting to dark`);
        return 'dark';
      }
      
      return theme;
    } catch (error) {
      console.error('Error in get-theme handler:', error);
      logError(error, 'get-theme-handler');
      return 'dark';
    }
  });

  ipcMain.handle('set-theme', async (event, theme) => {
    try {
      // Input validation
      if (!theme || !['light', 'dark'].includes(theme)) {
        throw new Error(`Invalid theme value: ${theme}. Must be 'light' or 'dark'`);
      }
      
      store.set('theme', theme);
      return theme;
    } catch (error) {
      console.error('Error in set-theme handler:', error);
      logError(error, 'set-theme-handler');
      throw error;
    }
  });

  ipcMain.handle('minimize-window', async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for minimizing');
      }
      
      mainWindow.minimize();
      return { success: true };
    } catch (error) {
      console.error('Error in minimize-window handler:', error);
      logError(error, 'minimize-window-handler');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('maximize-window', async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for maximizing');
      }
      
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      
      return { success: true, maximized: mainWindow.isMaximized() };
    } catch (error) {
      console.error('Error in maximize-window handler:', error);
      logError(error, 'maximize-window-handler');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('close-window', async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for closing');
      }
      
      mainWindow.close();
      return { success: true };
    } catch (error) {
      console.error('Error in close-window handler:', error);
      logError(error, 'close-window-handler');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-system-versions', async () => {
    const { spawn } = require('child_process');
    
    const checkVersion = (command, args = ['--version']) => {
      return new Promise((resolve) => {
        const process = spawn(command, args, { 
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let error = '';
        
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        process.on('close', (code) => {
          if (code === 0 && output.trim()) {
            resolve(output.trim().split('\n')[0]);
          } else if (error.trim()) {
            resolve('Not installed');
          } else {
            resolve('Not found');
          }
        });
        
        process.on('error', () => {
          resolve('Not found');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          process.kill();
          resolve('Timeout');
        }, 5000);
      });
    };

    try {
      const [node, git, flutter, python, vscode] = await Promise.all([
        checkVersion('node'),
        checkVersion('git'),
        checkVersion('flutter'),
        checkVersion('python'),
        checkVersion('code', ['--version'])
      ]);

      return {
        node: node.replace('v', ''),
        git: git.replace('git version ', ''),
        flutter: flutter.includes('Flutter') ? flutter : 'Not installed',
        python: python.includes('Python') ? python : 'Not installed',
        vscode: vscode.includes('.') ? vscode : 'Not installed'
      };
    } catch (error) {
      console.error('Error in get-system-versions handler:', error);
      logError(error, 'get-system-versions-handler');
      return {
        node: 'Error',
        git: 'Error',
        flutter: 'Error',
        python: 'Error',
        vscode: 'Error'
      };
    }
  });

  // Custom Commands handlers
  ipcMain.handle('get-custom-commands', () => {
    try {
      const commands = store.get('customCommands', []);
      
      // Validate command structure
      const validCommands = commands.filter(cmd => {
        return cmd && typeof cmd === 'object' && cmd.name && cmd.command;
      });
      
      if (validCommands.length !== commands.length) {
        console.warn('Some invalid custom commands were filtered out');
        store.set('customCommands', validCommands);
      }
      
      return validCommands;
    } catch (error) {
      console.error('Error in get-custom-commands handler:', error);
      logError(error, 'get-custom-commands-handler');
      return [];
    }
  });

  ipcMain.handle('save-custom-commands', (event, commands) => {
    try {
      // Input validation
      if (!Array.isArray(commands)) {
        throw new Error('Commands must be an array');
      }
      
      // Validate each command
      const validCommands = commands.filter(cmd => {
        if (!cmd || typeof cmd !== 'object') return false;
        if (!cmd.name || typeof cmd.name !== 'string') return false;
        if (!cmd.command || typeof cmd.command !== 'string') return false;
        return true;
      });
      
      if (validCommands.length !== commands.length) {
        console.warn(`${commands.length - validCommands.length} invalid commands were filtered out`);
      }
      
      store.set('customCommands', validCommands);
      return { success: true, savedCount: validCommands.length };
    } catch (error) {
      console.error('Error in save-custom-commands handler:', error);
      logError(error, 'save-custom-commands-handler');
      throw error;
    }
  });

  // Command History handlers
  ipcMain.handle('get-command-history', () => {
    try {
      const history = store.get('commandHistory', []);
      
      // Validate history structure
      const validHistory = history.filter(entry => {
        return entry && typeof entry === 'object' && entry.command && entry.timestamp;
      });
      
      if (validHistory.length !== history.length) {
        console.warn('Some invalid history entries were filtered out');
        store.set('commandHistory', validHistory);
      }
      
      return validHistory;
    } catch (error) {
      console.error('Error in get-command-history handler:', error);
      logError(error, 'get-command-history-handler');
      return [];
    }
  });

  ipcMain.handle('save-command-history', (event, history) => {
    try {
      // Input validation
      if (!Array.isArray(history)) {
        throw new Error('History must be an array');
      }
      
      // Validate each history entry
      const validHistory = history.filter(entry => {
        if (!entry || typeof entry !== 'object') return false;
        if (!entry.command || typeof entry.command !== 'string') return false;
        if (!entry.timestamp) return false;
        return true;
      });
      
      if (validHistory.length !== history.length) {
        console.warn(`${history.length - validHistory.length} invalid history entries were filtered out`);
      }
      
      store.set('commandHistory', validHistory);
      return { success: true, savedCount: validHistory.length };
    } catch (error) {
      console.error('Error in save-command-history handler:', error);
      logError(error, 'save-command-history-handler');
      throw error;
    }
  });

  ipcMain.handle('export-history', async (event, csvContent) => {
    try {
      // Input validation
      if (!csvContent || typeof csvContent !== 'string') {
        throw new Error('Invalid CSV content provided');
      }
      
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for file dialog');
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Command History',
        defaultPath: 'easy-debug-history.csv',
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        try {
          const fs = require('fs');
          
          // Validate file path
          const path = require('path');
          const dir = path.dirname(result.filePath);
          
          if (!fs.existsSync(dir)) {
            throw new Error(`Directory does not exist: ${dir}`);
          }
          
          fs.writeFileSync(result.filePath, csvContent);
          return { success: true, filePath: result.filePath };
        } catch (error) {
          console.error('Error saving file:', error);
          logError(error, 'export-history-file-save');
          return { success: false, error: error.message };
        }
      }

      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Error in export-history handler:', error);
      logError(error, 'export-history-handler');
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});