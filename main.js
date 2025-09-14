const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const os = require('os');

// Import centralized logger
const logger = require('./utils/logger');

// Import PtyManager for terminal functionality
const PtyManager = require('./terminal/pty.js');

const store = new Store();

// Log application startup
logger.appLifecycle('application-starting', {
  electronVersion: process.versions.electron,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  isDev: process.argv.includes('--dev')
});

// Enhanced global error handling for main process
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in main process', error, {
    location: 'main-process',
    fatal: true
  }, 'error');

  // Show error dialog to user
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox('Unexpected Error',
      `An unexpected error occurred: ${error.message}\n\nThe application will continue running, but you may want to restart it.`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection in main process', reason, {
    location: 'main-process',
    promise: promise.toString()
  }, 'error');
});

// Legacy error logging function (kept for backward compatibility)
function logError(error, type = 'error') {
  logger.error(`Legacy log: ${type}`, error, { legacyCall: true }, 'legacy');
}

let mainWindow;
let isDev = process.argv.includes('--dev');

function createWindow() {
  const timer = logger.startTimer('create-window');

  logger.appLifecycle('creating-main-window', {
    windowConfig: {
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600
    }
  });

  try {
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

    logger.info('BrowserWindow created successfully', {
      windowId: mainWindow.id,
      webContentsId: mainWindow.webContents.id
    }, 'window');

    mainWindow.loadFile('renderer/index.html');
    logger.info('Loading renderer/index.html', {}, 'window');

    // Capture renderer console messages for debugging
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const logLevel = level === 0 ? 'debug' : level === 1 ? 'info' : level === 2 ? 'warn' : 'error';
      logger[logLevel](`[RENDERER CONSOLE] ${message}`, {
        line,
        sourceId,
        consoleLevel: level
      }, 'renderer-console');
    });

    // Capture renderer crashes and errors
    mainWindow.webContents.on('crashed', (event) => {
      logger.error('Renderer process crashed', null, { event: event.toString() }, 'renderer-crash');
    });

    mainWindow.webContents.on('unresponsive', () => {
      logger.warn('Renderer process became unresponsive', {}, 'renderer-performance');
    });

    mainWindow.webContents.on('responsive', () => {
      logger.info('Renderer process became responsive again', {}, 'renderer-performance');
    });

    // Track page loading
    mainWindow.webContents.on('did-start-loading', () => {
      logger.info('Page started loading', {}, 'page-lifecycle');
    });

    mainWindow.webContents.on('did-finish-load', () => {
      logger.info('Page finished loading', {}, 'page-lifecycle');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      logger.error('Page failed to load', null, {
        errorCode,
        errorDescription,
        validatedURL
      }, 'page-lifecycle');
    });

    mainWindow.once('ready-to-show', () => {
      logger.appLifecycle('window-ready-to-show');
      mainWindow.show();

      if (isDev) {
        logger.info('Opening DevTools (development mode)', {}, 'development');
        mainWindow.webContents.openDevTools();
      }

      logger.endTimer(timer, { windowVisible: true });
    });

    mainWindow.on('closed', () => {
      logger.appLifecycle('main-window-closed');
      mainWindow = null;
    });

    // Log window events
    mainWindow.on('focus', () => logger.debug('Main window focused', {}, 'window'));
    mainWindow.on('blur', () => logger.debug('Main window blurred', {}, 'window'));
    mainWindow.on('minimize', () => logger.info('Main window minimized', {}, 'window'));
    mainWindow.on('maximize', () => logger.info('Main window maximized', {}, 'window'));
    mainWindow.on('restore', () => logger.info('Main window restored', {}, 'window'));

    setupIpcHandlers();

  } catch (error) {
    logger.error('Failed to create main window', error, {
      location: 'createWindow'
    }, 'error');
    throw error;
  }
}

function setupIpcHandlers() {
  logger.info('Setting up IPC handlers', {}, 'ipc');

  ipcMain.handle('select-folder', async () => {
    const timer = logger.startTimer('select-folder-dialog');
    logger.ipcOperation('handle', 'select-folder', {}, 'renderer-to-main');

    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available');
      }

      logger.debug('Opening folder selection dialog', {}, 'dialog');
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];

        logger.projectOperation('folder-selected', folderPath, {
          dialogResult: { canceled: result.canceled, pathCount: result.filePaths.length }
        });

        // Validate folder path
        if (!fs.existsSync(folderPath)) {
          throw new Error(`Selected folder does not exist: ${folderPath}`);
        }

        const recentProjects = store.get('recentProjects', []);
        const updatedProjects = [folderPath, ...recentProjects.filter(p => p !== folderPath)].slice(0, 10);
        store.set('recentProjects', updatedProjects);

        logger.info('Recent projects updated', {
          newProject: path.basename(folderPath),
          totalRecentProjects: updatedProjects.length
        }, 'project');

        logger.endTimer(timer, { success: true, folderSelected: true });
        return folderPath;
      }

      logger.info('Folder selection canceled by user', {}, 'dialog');
      logger.endTimer(timer, { success: true, folderSelected: false });
      return null;
    } catch (error) {
      logger.error('Error in select-folder handler', error, {
        location: 'select-folder-ipc'
      }, 'ipc');
      logger.endTimer(timer, { success: false, error: error.message });
      throw error;
    }
  });

  ipcMain.handle('get-recent-projects', async () => {
    logger.ipcOperation('handle', 'get-recent-projects', {}, 'renderer-to-main');

    try {
      const recentProjects = store.get('recentProjects', []);
      logger.debug('Retrieved recent projects from store', {
        count: recentProjects.length
      }, 'project');

      // Validate that all projects still exist
      const validProjects = recentProjects.filter(projectPath => {
        try {
          const exists = fs.existsSync(projectPath);
          if (!exists) {
            logger.warn('Project path no longer exists', {
              path: projectPath,
              basename: path.basename(projectPath)
            }, 'project');
          }
          return exists;
        } catch (error) {
          logger.warn('Cannot access project path', error, {
            path: projectPath
          }, 'project');
          return false;
        }
      });

      // Update store if some projects were removed
      if (validProjects.length !== recentProjects.length) {
        const removedCount = recentProjects.length - validProjects.length;
        store.set('recentProjects', validProjects);
        logger.info('Cleaned up recent projects', {
          removedCount,
          remainingCount: validProjects.length
        }, 'project');
      }

      logger.info('Recent projects retrieved', {
        count: validProjects.length
      }, 'project');

      return validProjects;
    } catch (error) {
      logger.error('Error in get-recent-projects handler', error, {
        location: 'get-recent-projects-ipc'
      }, 'ipc');
      return [];
    }
  });

  ipcMain.handle('open-in-editor', async (event, projectPath, editor = 'code') => {
    const { spawn } = require('child_process');
    logger.ipcOperation('handle', 'open-in-editor', { editor, projectPath: path.basename(projectPath || '') }, 'renderer-to-main');

    try {
      // Input validation
      if (!projectPath || typeof projectPath !== 'string') {
        throw new Error('Invalid project path provided');
      }

      if (!fs.existsSync(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }

      if (!['code', 'studio', 'explorer'].includes(editor)) {
        logger.warn('Unknown editor type, defaulting to file explorer', {
          requestedEditor: editor,
          defaultEditor: 'explorer'
        }, 'editor');
        editor = 'explorer';
      }

      logger.info(`Opening project in ${editor}`, {
        editor,
        project: path.basename(projectPath),
        platform: process.platform
      }, 'editor');

      switch (editor) {
        case 'code':
          // Try to open in VS Code
          try {
            const codeProcess = spawn('code', [projectPath], { detached: true });
            codeProcess.on('error', (codeError) => {
              logger.warn('VS Code not available, fallback will be handled', codeError, { projectPath: path.basename(projectPath) }, 'editor');
            });
            logger.info('Successfully launched VS Code', { projectPath: path.basename(projectPath) }, 'editor');
            return { success: true, message: 'Opening in VS Code' };
          } catch (codeError) {
            logger.warn('VS Code not available, falling back to file explorer', codeError, { projectPath: path.basename(projectPath) }, 'editor');
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
            const studioProcess = spawn(studioPath, [projectPath], { detached: true });
            studioProcess.on('error', (studioError) => {
              logger.warn('Android Studio not available, fallback will be handled', studioError, { projectPath: path.basename(projectPath), studioPath }, 'editor');
            });
            logger.info('Successfully launched Android Studio', { projectPath: path.basename(projectPath), studioPath }, 'editor');
            return { success: true, message: 'Opening in Android Studio' };
          } catch (studioError) {
            logger.warn('Android Studio not available, falling back to file explorer', studioError, { projectPath: path.basename(projectPath) }, 'editor');
            await shell.openPath(projectPath);
            return { success: true, message: 'Android Studio not found, opened in file explorer' };
          }

        case 'explorer':
          await shell.openPath(projectPath);
          logger.info('Opened project in file explorer', { projectPath: path.basename(projectPath) }, 'editor');
          return { success: true, message: 'Opened in file explorer' };

        default:
          await shell.openPath(projectPath);
          logger.info('Opened project in default application', { projectPath: path.basename(projectPath) }, 'editor');
          return { success: true, message: 'Opened in default application' };
      }
    } catch (error) {
      logger.error('Error in open-in-editor handler', error, {
        location: 'open-in-editor-ipc',
        editor,
        projectPath: projectPath ? path.basename(projectPath) : 'undefined'
      }, 'ipc');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-theme', async () => {
    logger.ipcOperation('handle', 'get-theme', {}, 'renderer-to-main');

    try {
      const theme = store.get('theme', 'dark');

      // Validate theme value
      if (!['light', 'dark'].includes(theme)) {
        logger.warn('Invalid theme value, defaulting to dark', {
          invalidTheme: theme,
          defaultTheme: 'dark'
        }, 'theme');
        return 'dark';
      }

      logger.debug('Theme retrieved from store', { theme }, 'theme');
      return theme;
    } catch (error) {
      logger.error('Error in get-theme handler', error, {
        location: 'get-theme-ipc'
      }, 'ipc');
      return 'dark';
    }
  });

  ipcMain.handle('set-theme', async (event, theme) => {
    logger.ipcOperation('handle', 'set-theme', { theme }, 'renderer-to-main');

    try {
      // Input validation
      if (!theme || !['light', 'dark'].includes(theme)) {
        throw new Error(`Invalid theme value: ${theme}. Must be 'light' or 'dark'`);
      }

      const previousTheme = store.get('theme', 'dark');
      store.set('theme', theme);

      logger.info('Theme updated', {
        previousTheme,
        newTheme: theme,
        changed: previousTheme !== theme
      }, 'theme');

      return theme;
    } catch (error) {
      logger.error('Error in set-theme handler', error, {
        location: 'set-theme-ipc',
        requestedTheme: theme
      }, 'ipc');
      throw error;
    }
  });

  ipcMain.handle('minimize-window', async () => {
    logger.ipcOperation('handle', 'minimize-window', {}, 'renderer-to-main');

    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for minimizing');
      }

      mainWindow.minimize();
      logger.info('Main window minimized', {}, 'window');
      return { success: true };
    } catch (error) {
      logger.error('Error in minimize-window handler', error, {
        location: 'minimize-window-ipc'
      }, 'ipc');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('maximize-window', async () => {
    logger.ipcOperation('handle', 'maximize-window', {}, 'renderer-to-main');

    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for maximizing');
      }

      const wasMaximized = mainWindow.isMaximized();
      if (wasMaximized) {
        mainWindow.unmaximize();
        logger.info('Main window unmaximized', {}, 'window');
      } else {
        mainWindow.maximize();
        logger.info('Main window maximized', {}, 'window');
      }

      return { success: true, maximized: mainWindow.isMaximized() };
    } catch (error) {
      logger.error('Error in maximize-window handler', error, {
        location: 'maximize-window-ipc'
      }, 'ipc');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('close-window', async () => {
    logger.ipcOperation('handle', 'close-window', {}, 'renderer-to-main');

    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window is not available for closing');
      }

      logger.info('Closing main window via IPC', {}, 'window');
      mainWindow.close();
      return { success: true };
    } catch (error) {
      logger.error('Error in close-window handler', error, {
        location: 'close-window-ipc'
      }, 'ipc');
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

  // Add IPC handler for renderer process logs
  ipcMain.handle('log-message', async (event, logData) => {
    try {
      const { level, message, data, error } = logData;

      // Forward renderer log to main process logger
      switch (level) {
        case 'debug':
          logger.debug(`[RENDERER] ${message}`, data, data.category || 'renderer');
          break;
        case 'info':
          logger.info(`[RENDERER] ${message}`, data, data.category || 'renderer');
          break;
        case 'warn':
          logger.warn(`[RENDERER] ${message}`, data, data.category || 'renderer');
          break;
        case 'error':
          logger.error(`[RENDERER] ${message}`, error, data, data.category || 'renderer');
          break;
        default:
          logger.info(`[RENDERER] ${message}`, data, data.category || 'renderer');
      }

      return { success: true };
    } catch (logError) {
      console.error('Error processing renderer log:', logError);
      return { success: false, error: logError.message };
    }
  });

  // Terminal IPC handlers
  const terminalProcesses = new Map();

  ipcMain.handle('create-pty', async (event, { workingDirectory = process.cwd() } = {}) => {
    try {
      logger.info('Creating PTY process', { workingDirectory }, 'terminal');

      const ptyProcess = PtyManager.createPtyProcess(workingDirectory);
      const terminalId = `pty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      terminalProcesses.set(terminalId, ptyProcess);

      logger.info('PTY process created successfully', { terminalId, workingDirectory, pid: ptyProcess.pid }, 'terminal');

      return {
        success: true,
        terminalId,
        pid: ptyProcess.pid
      };
    } catch (error) {
      logger.error('Error creating PTY process', error, { workingDirectory }, 'terminal');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('pty-write', async (event, { terminalId, data }) => {
    try {
      const ptyProcess = terminalProcesses.get(terminalId);
      if (!ptyProcess) {
        throw new Error(`PTY process ${terminalId} not found`);
      }

      ptyProcess.write(data);
      logger.debug('Data written to PTY', { terminalId, dataLength: data.length }, 'terminal');

      return { success: true };
    } catch (error) {
      logger.error('Error writing to PTY', error, { terminalId }, 'terminal');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('pty-resize', async (event, { terminalId, cols, rows }) => {
    try {
      const ptyProcess = terminalProcesses.get(terminalId);
      if (!ptyProcess) {
        throw new Error(`PTY process ${terminalId} not found`);
      }

      ptyProcess.resize(cols, rows);
      logger.debug('PTY resized', { terminalId, cols, rows }, 'terminal');

      return { success: true };
    } catch (error) {
      logger.error('Error resizing PTY', error, { terminalId, cols, rows }, 'terminal');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('pty-kill', async (event, { terminalId }) => {
    try {
      const ptyProcess = terminalProcesses.get(terminalId);
      if (!ptyProcess) {
        throw new Error(`PTY process ${terminalId} not found`);
      }

      ptyProcess.kill();
      terminalProcesses.delete(terminalId);
      logger.info('PTY process killed', { terminalId }, 'terminal');

      return { success: true };
    } catch (error) {
      logger.error('Error killing PTY', error, { terminalId }, 'terminal');
      return { success: false, error: error.message };
    }
  });

  // Set up PTY data handlers
  ipcMain.handle('pty-setup-handlers', async (event, { terminalId }) => {
    try {
      const ptyProcess = terminalProcesses.get(terminalId);
      if (!ptyProcess) {
        throw new Error(`PTY process ${terminalId} not found`);
      }

      // Set up data handler
      ptyProcess.onData((data) => {
        // Send data back to renderer
        event.sender.send('pty-data', { terminalId, data });
      });

      // Set up exit handler
      ptyProcess.onExit((code, signal) => {
        event.sender.send('pty-exit', { terminalId, code, signal });
        terminalProcesses.delete(terminalId);
      });

      logger.info('PTY handlers set up', { terminalId }, 'terminal');
      return { success: true };
    } catch (error) {
      logger.error('Error setting up PTY handlers', error, { terminalId }, 'terminal');
      return { success: false, error: error.message };
    }
  });

  // File Explorer IPC handlers
  ipcMain.handle('get-directory-contents', async (event, { path }) => {
    try {
      logger.info('Getting directory contents', { path }, 'explorer');

      const fs = require('fs');
      const pathModule = require('path');

      const stats = await fs.promises.stat(path);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      const entries = await fs.promises.readdir(path, { withFileTypes: true });
      const contents = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        path: pathModule.join(path, entry.name)
      }));

      logger.info('Directory contents retrieved', { path, itemCount: contents.length }, 'explorer');
      return { success: true, contents };
    } catch (error) {
      logger.error('Error getting directory contents', error, { path }, 'explorer');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-file', async (event, { filePath }) => {
    try {
      logger.info('Opening file', { filePath }, 'explorer');

      const { shell } = require('electron');
      await shell.openPath(filePath);

      logger.info('File opened successfully', { filePath }, 'explorer');
      return { success: true };
    } catch (error) {
      logger.error('Error opening file', error, { filePath }, 'explorer');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-file', async (event, { dirPath, fileName }) => {
    try {
      logger.info('Creating file', { dirPath, fileName }, 'explorer');

      const fs = require('fs');
      const pathModule = require('path');

      const filePath = pathModule.join(dirPath, fileName);

      // Check if file already exists
      try {
        await fs.promises.access(filePath);
        throw new Error('File already exists');
      } catch (accessError) {
        // File doesn't exist, continue with creation
      }

      // Create empty file
      await fs.promises.writeFile(filePath, '');

      logger.info('File created successfully', { filePath }, 'explorer');
      return { success: true, filePath };
    } catch (error) {
      logger.error('Error creating file', error, { dirPath, fileName }, 'explorer');
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-folder', async (event, { dirPath, folderName }) => {
    try {
      logger.info('Creating folder', { dirPath, folderName }, 'explorer');

      const fs = require('fs');
      const pathModule = require('path');

      const folderPath = pathModule.join(dirPath, folderName);

      // Create directory
      await fs.promises.mkdir(folderPath, { recursive: false });

      logger.info('Folder created successfully', { folderPath }, 'explorer');
      return { success: true, folderPath };
    } catch (error) {
      logger.error('Error creating folder', error, { dirPath, folderName }, 'explorer');
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(() => {
  logger.appLifecycle('app-ready', {
    versions: process.versions,
    resourcesPath: process.resourcesPath,
    execPath: process.execPath
  });
  logger.systemInfo();
  createWindow();
});

app.on('window-all-closed', () => {
  logger.appLifecycle('window-all-closed', {
    platform: process.platform,
    willQuit: process.platform !== 'darwin'
  });

  if (process.platform !== 'darwin') {
    logger.appLifecycle('app-quitting', { reason: 'window-all-closed' });
    app.quit();
  }
});

app.on('activate', () => {
  const windowCount = BrowserWindow.getAllWindows().length;
  logger.appLifecycle('app-activate', {
    existingWindows: windowCount,
    willCreateWindow: windowCount === 0
  });

  if (windowCount === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  logger.appLifecycle('before-quit', {
    hasMainWindow: !!mainWindow,
    uptime: process.uptime()
  });

  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});

// Additional app event logging
app.on('ready', () => {
  logger.appLifecycle('app-ready-event');
});

app.on('quit', (event, exitCode) => {
  logger.appLifecycle('app-quit', {
    exitCode,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Log unhandled browser window crashes
app.on('render-process-gone', (event, webContents, details) => {
  logger.error('Render process gone', null, {
    reason: details.reason,
    exitCode: details.exitCode,
    webContentsId: webContents.id
  }, 'crash');
});

app.on('child-process-gone', (event, details) => {
  logger.error('Child process gone', null, {
    type: details.type,
    reason: details.reason,
    exitCode: details.exitCode,
    name: details.name
  }, 'crash');
});