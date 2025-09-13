# API Reference - Easy Debug

This document provides comprehensive API documentation for developers working with or extending Easy Debug.

## Table of Contents

1. [Main Process APIs](#main-process-apis)
2. [Renderer Process APIs](#renderer-process-apis)
3. [IPC Communication](#ipc-communication)
4. [Terminal Integration](#terminal-integration)
5. [Storage APIs](#storage-apis)
6. [Command System](#command-system)
7. [Project Detection](#project-detection)
8. [Performance Utilities](#performance-utilities)
9. [Testing APIs](#testing-apis)
10. [Configuration](#configuration)

## Main Process APIs

### App Class (`main.js`)

The main Electron process handler with comprehensive IPC communication.

```javascript
// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in main process:', error);
  logError(error, 'uncaughtException');
});

// Window creation
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
}
```

#### IPC Handlers

##### File System Operations
```javascript
// Select folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

// Check if path exists
ipcMain.handle('path-exists', async (event, path) => {
  return fs.existsSync(path);
});

// Read directory contents
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});
```

##### Settings Management
```javascript
// Get application setting
ipcMain.handle('get-setting', async (event, key) => {
  return store.get(key);
});

// Set application setting
ipcMain.handle('set-setting', async (event, key, value) => {
  store.set(key, value);
});

// Get all settings
ipcMain.handle('get-all-settings', async () => {
  return store.store;
});
```

##### Custom Commands
```javascript
// Get custom commands
ipcMain.handle('get-custom-commands', async () => {
  return customCommandsStore.get('commands', []);
});

// Save custom commands
ipcMain.handle('save-custom-commands', async (event, commands) => {
  customCommandsStore.set('commands', commands);
});
```

##### System Information
```javascript
// Get system platform
ipcMain.handle('get-platform', async () => {
  return process.platform;
});

// Open external URL
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});
```

#### Error Logging
```javascript
function logError(error, context = 'unknown') {
  const logDir = path.join(os.homedir(), '.easy-debug', 'logs');
  const logFile = path.join(logDir, 'error.log');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${context}] ${error.stack || error.message}\n`;
  
  fs.appendFileSync(logFile, logEntry);
}
```

## Renderer Process APIs

### App Class (`renderer/scripts/app.js`)

Main application controller managing UI interactions and state.

```javascript
class App {
  constructor() {
    this.currentProjectPath = null;
    this.currentProjectType = null;
    this.customCommands = [];
    this.commandHistory = [];
    this.theme = 'dark';
  }

  // Initialize application
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.loadRecentProjects();
    this.loadCustomCommands();
    this.updateSystemVersions();
  }

  // Project management
  async selectProjectFolder() {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      await this.setCurrentProject(folderPath);
    }
  }

  async setCurrentProject(projectPath) {
    this.currentProjectPath = projectPath;
    this.currentProjectType = this.detectProjectType(projectPath);
    this.updateProjectDisplay();
    this.saveRecentProject(projectPath);
    this.updateCommandVisibility();
  }

  // Theme management
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', this.theme === 'light');
    this.saveSettings();
  }
}
```

#### Event Handlers
```javascript
// Setup event listeners
setupEventListeners() {
  document.getElementById('selectFolder').addEventListener('click', () => {
    this.selectProjectFolder();
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    this.toggleTheme();
  });

  // Command button listeners
  this.setupCommandListeners();
  
  // Panel resize listeners
  this.setupPanelResize();
}

// Setup command button listeners
setupCommandListeners() {
  const commandButtons = document.querySelectorAll('[data-command]');
  commandButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const command = e.target.dataset.command;
      this.executeCommand(command);
    });
  });
}
```

#### Command Execution
```javascript
// Execute system command
async executeCommand(command) {
  if (!this.currentProjectPath) {
    this.showNotification('Please select a project folder first', 'warning');
    return;
  }

  this.addToHistory(command);
  this.showNotification(`Executing: ${command}`, 'info');
  
  try {
    await this.terminalManager.executeCommand(command, this.currentProjectPath);
  } catch (error) {
    this.showNotification(`Error: ${error.message}`, 'error');
  }
}
```

### InputValidator Class

Real-time form validation with security checks.

```javascript
class InputValidator {
  // Validate command input
  static validateCommand(value) {
    if (!value || value.trim() === '') {
      return 'Command is required';
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,
      /shutdown/i,
      /reboot/i,
      /format/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        return 'Potentially dangerous command detected';
      }
    }
    
    return null;
  }

  // Validate file path
  static validatePath(value) {
    if (!value || value.trim() === '') {
      return 'Path is required';
    }
    
    // Check for invalid path characters
    const invalidChars = /[<>"|*?]/;
    if (invalidChars.test(value)) {
      return 'Path contains invalid characters';
    }
    
    return null;
  }

  // Real-time validation
  static setupRealTimeValidation(inputElement, validationFunction) {
    const errorElement = document.getElementById(`${inputElement.id}-error`);
    
    inputElement.addEventListener('input', () => {
      const error = validationFunction(inputElement.value);
      
      if (error) {
        inputElement.classList.add('error');
        if (errorElement) {
          errorElement.textContent = error;
          errorElement.style.display = 'block';
        }
      } else {
        inputElement.classList.remove('error');
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }
    });
  }
}
```

## IPC Communication

### Available Channels

#### File System
- `select-folder`: Open folder selection dialog
- `path-exists`: Check if file/directory exists
- `read-directory`: Read directory contents
- `get-home-directory`: Get user home directory

#### Settings
- `get-setting`: Retrieve application setting
- `set-setting`: Store application setting
- `get-all-settings`: Get all settings

#### Custom Commands
- `get-custom-commands`: Load user commands
- `save-custom-commands`: Save user commands

#### System
- `get-platform`: Get operating system platform
- `open-external`: Open URL in default browser
- `show-item-in-folder`: Show file in file manager

### Usage Examples

```javascript
// Renderer process
const folderPath = await window.electronAPI.selectFolder();
const exists = await window.electronAPI.pathExists('/some/path');
const setting = await window.electronAPI.getSetting('theme');
await window.electronAPI.setSetting('theme', 'dark');
```

## Terminal Integration

### TerminalManager Class (`terminal/terminal.js`)

Manages xterm.js terminal instances with tab support.

```javascript
class TerminalManager {
  constructor() {
    this.terminals = new Map();
    this.activeTerminal = null;
    this.terminalCounter = 0;
  }

  // Create new terminal tab
  createTerminal() {
    const terminalId = `terminal-${++this.terminalCounter}`;
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff'
      }
    });

    this.terminals.set(terminalId, terminal);
    this.activeTerminal = terminalId;
    
    return terminalId;
  }

  // Execute command in terminal
  async executeCommand(command, workingDir) {
    const terminal = this.terminals.get(this.activeTerminal);
    if (!terminal) return;

    terminal.writeln(`$ ${command}`);
    
    try {
      const result = await this.pty.executeCommand(command, workingDir);
      terminal.write(result.output);
    } catch (error) {
      terminal.writeln(`Error: ${error.message}`);
    }
  }
}
```

### PTY Integration (`terminal/pty.js`)

Mock PTY implementation for command execution.

```javascript
class MockPTY {
  constructor() {
    this.processes = new Map();
  }

  // Execute command with spawn
  async executeCommand(command, workingDir) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      
      const process = spawn(cmd, args, {
        cwd: workingDir,
        shell: true
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ output, exitCode: code });
        } else {
          reject(new Error(errorOutput || `Process exited with code ${code}`));
        }
      });
    });
  }
}
```

## Storage APIs

### Settings Storage

Using `electron-store` for persistent configuration.

```javascript
// Main process
const Store = require('electron-store');
const store = new Store({
  defaults: {
    theme: 'dark',
    windowBounds: { width: 1400, height: 900 },
    recentProjects: [],
    panelSizes: { left: 300, right: null }
  }
});

// Available methods
store.get(key)              // Get setting value
store.set(key, value)       // Set setting value
store.has(key)              // Check if key exists
store.delete(key)           // Delete setting
store.clear()               // Clear all settings
store.store                 // Get all settings object
```

### Custom Commands Storage

Separate store for user-defined commands.

```javascript
const customCommandsStore = new Store({
  name: 'custom-commands',
  defaults: {
    commands: []
  }
});

// Command structure
const customCommand = {
  id: 'unique-id',
  name: 'Display Name',
  command: 'shell-command',
  icon: '🚀',
  createdAt: new Date().toISOString()
};
```

### Command History Storage

Persistent command execution history.

```javascript
const historyStore = new Store({
  name: 'command-history',
  defaults: {
    history: []
  }
});

// History entry structure
const historyEntry = {
  command: 'npm install',
  timestamp: new Date().toISOString(),
  projectPath: '/path/to/project',
  projectType: 'web',
  exitCode: 0,
  duration: 1234
};
```

## Command System

### Command Categories

Commands are organized by project type and functionality.

```javascript
const COMMANDS = {
  flutter: [
    { id: 'flutter-pub-get', name: 'Pub Get', command: 'flutter pub get', icon: '📦' },
    { id: 'flutter-run', name: 'Run', command: 'flutter run', icon: '▶️' },
    { id: 'flutter-build-apk', name: 'Build APK', command: 'flutter build apk', icon: '🔨' },
    { id: 'flutter-test', name: 'Test', command: 'flutter test', icon: '🧪' },
    { id: 'flutter-doctor', name: 'Doctor', command: 'flutter doctor', icon: '🩺' }
  ],
  python: [
    { id: 'python-install', name: 'Install Deps', command: 'pip install -r requirements.txt', icon: '📦' },
    { id: 'python-run', name: 'Run Main', command: 'python main.py', icon: '▶️' },
    { id: 'python-test', name: 'Test', command: 'pytest', icon: '🧪' },
    { id: 'python-list', name: 'List Packages', command: 'pip list', icon: '📋' },
    { id: 'python-venv', name: 'Create Venv', command: 'python -m venv venv', icon: '🐍' }
  ],
  web: [
    { id: 'web-install', name: 'Install', command: 'npm install', icon: '📦' },
    { id: 'web-start', name: 'Start', command: 'npm start', icon: '▶️' },
    { id: 'web-build', name: 'Build', command: 'npm run build', icon: '🔨' },
    { id: 'web-test', name: 'Test', command: 'npm test', icon: '🧪' },
    { id: 'web-lint', name: 'Lint', command: 'npm run lint', icon: '✨' }
  ],
  git: [
    { id: 'git-status', name: 'Status', command: 'git status', icon: '📊' },
    { id: 'git-add', name: 'Add All', command: 'git add .', icon: '➕' },
    { id: 'git-commit', name: 'Commit', command: 'git commit', icon: '💾' },
    { id: 'git-push', name: 'Push', command: 'git push', icon: '⬆️' },
    { id: 'git-pull', name: 'Pull', command: 'git pull', icon: '⬇️' },
    { id: 'git-log', name: 'Log', command: 'git log --oneline -10', icon: '📜' }
  ]
};
```

### Command Execution Flow

```javascript
// 1. User clicks command button
button.addEventListener('click', (e) => {
  const commandId = e.target.dataset.command;
  app.executeCommand(commandId);
});

// 2. App processes command
async executeCommand(commandId) {
  const command = this.findCommandById(commandId);
  this.addToHistory(command);
  await this.terminalManager.executeCommand(command.command, this.currentProjectPath);
}

// 3. Terminal executes command
async executeCommand(command, workingDir) {
  const result = await this.pty.executeCommand(command, workingDir);
  this.displayOutput(result);
}
```

## Project Detection

### Detection Logic

Automatic project type detection based on configuration files.

```javascript
class ProjectDetector {
  static detectProjectType(projectPath) {
    const files = fs.readdirSync(projectPath);
    
    // Flutter detection
    if (files.includes('pubspec.yaml') || files.includes('pubspec.yml')) {
      return 'flutter';
    }
    
    // Python detection
    if (files.includes('requirements.txt') || 
        files.includes('setup.py') || 
        files.includes('pyproject.toml') ||
        files.includes('Pipfile')) {
      return 'python';
    }
    
    // Web detection
    if (files.includes('package.json') || 
        files.includes('bower.json') ||
        files.includes('yarn.lock')) {
      return 'web';
    }
    
    // Git detection
    if (files.includes('.git')) {
      return 'git';
    }
    
    return 'unknown';
  }

  static getProjectInfo(projectPath) {
    const projectType = this.detectProjectType(projectPath);
    const projectName = path.basename(projectPath);
    
    return {
      name: projectName,
      path: projectPath,
      type: projectType,
      detectedAt: new Date().toISOString()
    };
  }
}
```

### File Pattern Detection

```javascript
const PROJECT_PATTERNS = {
  flutter: [
    'pubspec.yaml',
    'pubspec.yml',
    'android/app/build.gradle',
    'ios/Runner.xcodeproj'
  ],
  python: [
    'requirements.txt',
    'setup.py',
    'pyproject.toml',
    'Pipfile',
    'main.py',
    '__init__.py'
  ],
  web: [
    'package.json',
    'bower.json',
    'yarn.lock',
    'webpack.config.js',
    'gulpfile.js'
  ],
  git: [
    '.git',
    '.gitignore',
    '.gitmodules'
  ]
};
```

## Performance Utilities

### PerformanceUtils Class

Comprehensive performance optimization utilities.

```javascript
class PerformanceUtils {
  constructor() {
    this.elementCache = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.observers = new Set();
  }

  // DOM element caching
  getElement(id, forceRefresh = false) {
    if (forceRefresh || !this.elementCache.has(id)) {
      const element = document.getElementById(id);
      if (element) {
        this.elementCache.set(id, element);
      }
      return element;
    }
    return this.elementCache.get(id);
  }

  // Safe timer management
  setTimeout(callback, delay) {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    this.timers.add(timerId);
    return timerId;
  }

  setInterval(callback, interval) {
    const intervalId = window.setInterval(callback, interval);
    this.intervals.add(intervalId);
    return intervalId;
  }

  // Debouncing
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttling
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Performance measurement
  measurePerformance(name, func) {
    const startTime = performance.now();
    const result = func();
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }

  async measureAsyncPerformance(name, func) {
    const startTime = performance.now();
    const result = await func();
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }

  // Memory usage logging
  logMemoryUsage(label = 'Memory Usage') {
    if (performance.memory) {
      console.log(`${label}:`, {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
      });
    }
  }

  // Cleanup all resources
  cleanup() {
    // Clear all timers
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();
    
    // Clear all intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear element cache
    this.elementCache.clear();
  }
}
```

## Testing APIs

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'renderer/scripts/**/*.js',
    'terminal/**/*.js',
    'main.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Test Utilities

```javascript
// tests/test-utils.js
class TestUtils {
  // Create mock IPC
  static createMockIPC() {
    return {
      selectFolder: jest.fn(),
      pathExists: jest.fn(),
      getSetting: jest.fn(),
      setSetting: jest.fn()
    };
  }

  // Create mock terminal
  static createMockTerminal() {
    return {
      write: jest.fn(),
      writeln: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    };
  }

  // Create test project structure
  static createTestProject(type) {
    const tempDir = require('os').tmpdir();
    const projectDir = path.join(tempDir, `test-project-${Date.now()}`);
    
    fs.mkdirSync(projectDir);
    
    switch (type) {
      case 'flutter':
        fs.writeFileSync(path.join(projectDir, 'pubspec.yaml'), 'name: test');
        break;
      case 'python':
        fs.writeFileSync(path.join(projectDir, 'requirements.txt'), 'django==3.2');
        break;
      case 'web':
        fs.writeFileSync(path.join(projectDir, 'package.json'), '{"name":"test"}');
        break;
    }
    
    return projectDir;
  }
}
```

## Configuration

### Default Settings

```javascript
const DEFAULT_SETTINGS = {
  // Appearance
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Monaco, Consolas, monospace',
  
  // Window
  windowBounds: { width: 1400, height: 900 },
  panelSizes: { left: 300, right: null },
  
  // Behavior
  autoSaveHistory: true,
  maxHistoryEntries: 1000,
  showNotifications: true,
  
  // Terminal
  terminalTheme: {
    background: '#1e1e1e',
    foreground: '#ffffff',
    cursor: '#ffffff'
  },
  
  // Projects
  recentProjects: [],
  maxRecentProjects: 10,
  autoDetectProjects: true
};
```

### Environment Variables

```javascript
// Available environment variables
process.env.NODE_ENV          // Development/production mode
process.env.EASY_DEBUG_LOG    // Log level (debug, info, warn, error)
process.env.EASY_DEBUG_DATA   // Custom data directory
```

## Error Handling

### Error Categories

```javascript
class ErrorHandler {
  static handleError(error, context = 'unknown') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version
    };
    
    // Log to file
    this.logError(errorInfo);
    
    // Show user notification
    this.showErrorNotification(error.message);
    
    // Report to analytics (if enabled)
    this.reportError(errorInfo);
  }
}
```

---

This API reference provides comprehensive documentation for developers working with Easy Debug. For additional examples and usage patterns, see the source code and test files.