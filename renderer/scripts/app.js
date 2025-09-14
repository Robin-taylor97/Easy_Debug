// DEBUG: Track bundle execution immediately
console.log('[DEBUG] ==== app.js bundle execution starting ====');
console.log('[DEBUG] Module system check: typeof require =', typeof require);
console.log('[DEBUG] Node environment: typeof process =', typeof process);

// Test each module loading individually
let ipcRenderer, shell, TerminalManager, fs, path, logger, FileExplorer;

console.log('[DEBUG] Loading electron module...');
try {
    const electronModule = require('electron');
    ipcRenderer = electronModule.ipcRenderer;
    shell = electronModule.shell;
    console.log('[DEBUG] ✓ electron module loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load electron module:', error);
}

console.log('[DEBUG] Loading TerminalManager...');
try {
    TerminalManager = require('../../terminal/terminal.js');
    console.log('[DEBUG] ✓ TerminalManager loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load TerminalManager:', error);
    // Create fallback TerminalManager class
    TerminalManager = class FallbackTerminalManager {
        constructor() {
            console.log('[FALLBACK] TerminalManager constructor called');
            this.terminals = new Map();
        }

        createTerminal(containerId) {
            console.log('[FALLBACK] Creating mock terminal for container:', containerId);
            const terminal = {
                write: (data) => console.log('[FALLBACK] Terminal write:', data),
                dispose: () => console.log('[FALLBACK] Terminal disposed'),
                fit: () => console.log('[FALLBACK] Terminal fit'),
                focus: () => console.log('[FALLBACK] Terminal focus')
            };
            this.terminals.set(containerId, terminal);
            return terminal;
        }

        disposeTerminal(id) {
            console.log('[FALLBACK] Disposing terminal:', id);
            this.terminals.delete(id);
        }

        writeToTerminal(id, data) {
            console.log('[FALLBACK] Writing to terminal:', id, data);
        }

        resizeTerminal(id, cols, rows) {
            console.log('[FALLBACK] Resizing terminal:', id, cols, rows);
        }

        updateTheme(theme) {
            console.log('[FALLBACK] Updating theme to:', theme);
        }

        setActiveTerminal(id) {
            console.log('[FALLBACK] Setting active terminal to:', id);
        }

        resizeAll() {
            console.log('[FALLBACK] Resizing all terminals');
        }

        executeCommand(command, terminalId) {
            console.log('[FALLBACK] Executing command:', command, 'in terminal:', terminalId);
            return Promise.resolve({ success: true, output: 'Mock command execution' });
        }
    };
    console.log('[DEBUG] ✓ Fallback TerminalManager created successfully');
}

console.log('[DEBUG] Loading fs module...');
try {
    fs = require('fs');
    console.log('[DEBUG] ✓ fs module loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load fs module:', error);
}

console.log('[DEBUG] Loading path module...');
try {
    path = require('path');
    console.log('[DEBUG] ✓ path module loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load path module:', error);
}

console.log('[DEBUG] Loading renderer logger...');
try {
    logger = require('../../utils/renderer-logger');
    console.log('[DEBUG] ✓ renderer logger loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load renderer logger:', error);
    // Create fallback logger with all required methods
    logger = {
        info: (msg, data, category) => console.log('[FALLBACK LOGGER]', msg, data),
        debug: (msg, data, category) => console.log('[FALLBACK LOGGER]', msg, data),
        warn: (msg, data, category) => console.warn('[FALLBACK LOGGER]', msg, data),
        error: (msg, error, data, category) => console.error('[FALLBACK LOGGER]', msg, error, data),
        userAction: (action, details, element) => console.log('[FALLBACK LOGGER] User action:', action, details),
        projectOperation: (op, path, details) => console.log('[FALLBACK LOGGER] Project op:', op, path, details),
        commandExecution: (cmd, path, details) => console.log('[FALLBACK LOGGER] Command:', cmd, path, details),
        terminalOperation: (op, details) => console.log('[FALLBACK LOGGER] Terminal:', op, details),
        themeOperation: (op, details) => console.log('[FALLBACK LOGGER] Theme:', op, details),
        modalOperation: (op, modalId, details) => console.log('[FALLBACK LOGGER] Modal:', op, modalId, details),
        formValidation: (formId, field, result, details) => console.log('[FALLBACK LOGGER] Validation:', formId, field, result, details),
        notification: (type, msg, details) => console.log('[FALLBACK LOGGER] Notification:', type, msg, details),
        startTimer: (operation) => {
            const timer = { operation, startTime: Date.now() };
            console.log('[FALLBACK LOGGER] Timer started:', operation);
            return timer;
        },
        endTimer: (timer, data = {}) => {
            const duration = Date.now() - timer.startTime;
            console.log('[FALLBACK LOGGER] Timer ended:', timer.operation, `${duration}ms`, data);
            return duration;
        }
    };
    console.log('[DEBUG] ✓ Fallback logger created successfully');
}

console.log('[DEBUG] Loading FileExplorer...');
try {
    FileExplorer = require('./file-explorer.js');
    console.log('[DEBUG] ✓ FileExplorer loaded successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to load FileExplorer:', error);
    // Create fallback FileExplorer class
    FileExplorer = class FallbackFileExplorer {
        constructor() {
            console.log('[FALLBACK] FileExplorer constructor called');
            this.currentPath = '';
        }

        updatePath(newPath) {
            console.log('[FALLBACK] File explorer path updated:', newPath);
            this.currentPath = newPath;
        }

        refreshExplorer() {
            console.log('[FALLBACK] File explorer refresh');
        }

        syncWithTerminal(path) {
            console.log('[FALLBACK] Sync with terminal:', path);
        }
    };
    console.log('[DEBUG] ✓ Fallback FileExplorer created successfully');
}

class InputValidator {
    static validateRequired(value, fieldName) {
        if (!value || value.trim() === '') {
            return `${fieldName} is required`;
        }
        return null;
    }

    static validateLength(value, fieldName, minLength = 1, maxLength = 255) {
        if (value.length < minLength) {
            return `${fieldName} must be at least ${minLength} characters`;
        }
        if (value.length > maxLength) {
            return `${fieldName} must be no more than ${maxLength} characters`;
        }
        return null;
    }

    static validateCommand(value) {
        if (!value || value.trim() === '') {
            return 'Command is required';
        }
        
        // Check for potentially dangerous commands
        const dangerousPatterns = [
            /rm\s+-rf\s+\//, // rm -rf /
            /format\s+[c-z]:/i, // format c:
            /del\s+\/[sq]/i, // del /s or del /q
            /shutdown/i,
            /reboot/i
        ];
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
                return 'Command contains potentially dangerous operations';
            }
        }
        
        return null;
    }

    static validateIcon(value) {
        if (!value) return null; // Icon is optional
        
        if (value.length > 2) {
            return 'Icon must be 1-2 characters (emoji recommended)';
        }
        
        return null;
    }

    static validateCommitMessage(value) {
        if (!value || value.trim() === '') {
            return 'Commit message is required';
        }
        
        if (value.length < 3) {
            return 'Commit message must be at least 3 characters';
        }
        
        if (value.length > 500) {
            return 'Commit message must be no more than 500 characters';
        }
        
        return null;
    }
}

console.log('[DEBUG] Defining EasyDebugApp class...');

class EasyDebugApp {
    constructor() {
        console.log('[DEBUG] EasyDebugApp constructor called');
        console.log('[DEBUG] Logger available:', !!logger);
        logger.info('EasyDebugApp constructor started', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        }, 'app-init');

        const timer = logger.startTimer('app-initialization');

        this.terminalManager = new TerminalManager();
        this.fileExplorer = new FileExplorer();
        this.currentProject = null;
        this.currentTheme = 'dark';
        this.isResizing = false;
        this.terminalCounter = 1;
        this.activeTerminals = new Map();
        this.customCommands = [];
        this.editingCommandId = null;
        this.commandHistory = [];
        this.filteredHistory = [];
        this.isHistoryVisible = false;

        logger.info('App properties initialized', {
            terminalCounter: this.terminalCounter,
            activeTerminalsSize: this.activeTerminals.size,
            currentTheme: this.currentTheme
        }, 'app-init');

        this.init().then(() => {
            logger.endTimer(timer, { success: true });
            logger.info('EasyDebugApp fully initialized', {}, 'app-init');
        }).catch(error => {
            logger.error('Error during app initialization', error, {}, 'app-init');
            logger.endTimer(timer, { success: false, error: error.message });
        });
    }

    async init() {
        logger.info('Starting app initialization sequence', {}, 'app-init');

        try {
            logger.debug('Setting up error handling', {}, 'app-init');
            this.setupErrorHandling();

            logger.debug('Loading theme', {}, 'app-init');
            await this.loadTheme();

            logger.debug('Setting up event listeners', {}, 'app-init');
            this.setupEventListeners();

            logger.debug('Setting up terminal', {}, 'app-init');
            this.setupTerminal();

            logger.debug('Loading recent projects', {}, 'app-init');
            this.loadRecentProjects();

            logger.debug('Loading custom commands', {}, 'app-init');
            this.loadCustomCommands();

            logger.debug('Loading command history', {}, 'app-init');
            this.loadCommandHistory();

            logger.debug('Setting up resizer', {}, 'app-init');
            this.setupResizer();

            logger.debug('Refreshing system versions', {}, 'app-init');
            this.refreshSystemVersions();

            logger.info('App initialization sequence completed', {}, 'app-init');
        } catch (error) {
            logger.error('Error in init sequence', error, {}, 'app-init');
            throw error;
        }
    }

    setupErrorHandling() {
        logger.info('Setting up error handling', {}, 'error-handling');

        // Global error handler for uncaught exceptions
        window.addEventListener('error', (event) => {
            logger.error('Uncaught error in renderer process', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                message: event.message
            }, 'error-handling');
            this.showNotification('An unexpected error occurred', 'error');
        });

        // Global handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Unhandled promise rejection in renderer process', event.reason, {
                promise: event.promise.toString()
            }, 'error-handling');
            this.showNotification('An operation failed unexpectedly', 'error');
        });

        // IPC error handler
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception in renderer process', error, {
                location: 'process-uncaught-exception'
            }, 'error-handling');
        });

        logger.info('Error handling setup completed', {}, 'error-handling');
    }

    async loadTheme() {
        const timer = logger.startTimer('load-theme');
        logger.debug('Loading theme from storage', {}, 'theme');

        try {
            this.currentTheme = await ipcRenderer.invoke('get-theme');
            logger.info('Theme loaded successfully', { theme: this.currentTheme }, 'theme');
            this.applyTheme(this.currentTheme);
            logger.endTimer(timer, { success: true, theme: this.currentTheme });
        } catch (error) {
            logger.error('Error loading theme', error, {}, 'theme');
            this.currentTheme = 'dark'; // fallback to dark theme
            this.applyTheme(this.currentTheme);
            this.showNotification('Failed to load theme, using default', 'warning');
            logger.endTimer(timer, { success: false, fallbackTheme: 'dark' });
        }
    }

    applyTheme(theme) {
        logger.themeOperation('apply-theme', { theme, previousTheme: this.currentTheme });

        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');

        if (theme === 'light') {
            body.classList.add('light-theme');
            themeToggle.textContent = '☀️';
            logger.debug('Applied light theme', { bodyClasses: body.className }, 'theme');
        } else {
            body.classList.remove('light-theme');
            themeToggle.textContent = '🌙';
            logger.debug('Applied dark theme', { bodyClasses: body.className }, 'theme');
        }

        // Update terminal theme
        if (this.terminalManager) {
            logger.debug('Updating terminal theme', { theme }, 'theme');
            this.terminalManager.updateTheme(theme);
        }

        this.currentTheme = theme;
        logger.info('Theme applied successfully', {
            newTheme: theme,
            terminalUpdated: !!this.terminalManager
        }, 'theme');
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Window controls
        document.getElementById('minimize-btn').addEventListener('click', () => {
            ipcRenderer.invoke('minimize-window');
        });

        document.getElementById('maximize-btn').addEventListener('click', () => {
            ipcRenderer.invoke('maximize-window');
        });

        document.getElementById('close-btn').addEventListener('click', () => {
            ipcRenderer.invoke('close-window');
        });

        // Project folder selection
        document.getElementById('select-folder-btn').addEventListener('click', () => {
            this.selectProjectFolder();
        });

        // Command group toggles
        document.querySelectorAll('.command-group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                this.toggleCommandGroup(e.currentTarget);
            });
        });

        // Command buttons
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.currentTarget.getAttribute('data-command');
                if (command) {
                    this.executeCommand(command);
                }
            });
        });

        // Special command handlers
        document.getElementById('git-commit-btn').addEventListener('click', () => {
            this.showCommitModal();
        });

        document.getElementById('open-browser-btn').addEventListener('click', () => {
            this.openInBrowser();
        });

        // Editor integration buttons
        document.getElementById('open-vscode-btn').addEventListener('click', () => {
            this.openInEditor('code');
        });

        document.getElementById('open-studio-btn').addEventListener('click', () => {
            this.openInEditor('studio');
        });

        document.getElementById('open-explorer-btn').addEventListener('click', () => {
            this.openInEditor('explorer');
        });

        // System info refresh button
        document.getElementById('refresh-versions-btn').addEventListener('click', () => {
            this.refreshSystemVersions();
        });

        // Terminal controls
        document.getElementById('new-terminal-btn').addEventListener('click', () => {
            this.createNewTerminal();
        });

        document.getElementById('clear-terminal-btn').addEventListener('click', () => {
            this.terminalManager.clear();
        });

        // Terminal tab management
        this.setupTerminalTabs();

        // Modal handlers
        document.getElementById('cancel-commit').addEventListener('click', () => {
            this.hideCommitModal();
        });

        document.getElementById('confirm-commit').addEventListener('click', () => {
            this.performCommit();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        // Click outside modal to close
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                this.hideCommitModal();
                this.hideCustomCommandModal();
            }
        });

        // Custom command handlers
        document.getElementById('add-custom-command-btn').addEventListener('click', () => {
            this.showCustomCommandModal();
        });

        document.getElementById('cancel-custom-command').addEventListener('click', () => {
            this.hideCustomCommandModal();
        });

        document.getElementById('confirm-custom-command').addEventListener('click', () => {
            this.saveCustomCommand();
        });

        // Command history handlers
        document.getElementById('show-history-btn').addEventListener('click', () => {
            this.toggleHistoryPanel();
        });

        document.getElementById('toggle-history-btn').addEventListener('click', () => {
            this.toggleHistoryPanel();
        });

        document.getElementById('clear-history-btn').addEventListener('click', () => {
            this.clearCommandHistory();
        });

        document.getElementById('export-history-btn').addEventListener('click', () => {
            this.exportCommandHistory();
        });

        document.getElementById('history-search').addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        // Real-time validation for custom command form
        this.setupFormValidation();
    }

    setupFormValidation() {
        const inputs = [
            { id: 'command-name', validator: (value) => InputValidator.validateRequired(value, 'Command name') || InputValidator.validateLength(value, 'Command name', 1, 50) },
            { id: 'command-description', validator: (value) => value ? InputValidator.validateLength(value, 'Description', 0, 200) : null },
            { id: 'command-shell', validator: (value) => InputValidator.validateCommand(value) },
            { id: 'command-icon', validator: (value) => InputValidator.validateIcon(value) },
            { id: 'commit-message', validator: (value) => value ? InputValidator.validateCommitMessage(value) : null }
        ];

        inputs.forEach(({ id, validator }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = e.target.value.trim();
                    const error = validator(value);
                    
                    if (error) {
                        element.classList.add('input-error');
                    } else {
                        element.classList.remove('input-error');
                    }
                });

                element.addEventListener('blur', (e) => {
                    const value = e.target.value.trim();
                    const error = validator(value);
                    
                    if (error) {
                        element.classList.add('input-error');
                    } else {
                        element.classList.remove('input-error');
                    }
                });
            }
        });
    }

    async toggleTheme() {
        const oldTheme = this.currentTheme;
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

        logger.userAction('theme-toggle', {
            oldTheme,
            newTheme
        }, document.getElementById('theme-toggle'));

        const timer = logger.startTimer('theme-toggle');

        try {
            await ipcRenderer.invoke('set-theme', newTheme);
            this.applyTheme(newTheme);
            this.showToast('Theme updated', 'success');

            logger.endTimer(timer, { success: true, theme: newTheme });
            logger.themeOperation('theme-toggled', { oldTheme, newTheme });
        } catch (error) {
            logger.error('Error updating theme', error, { attemptedTheme: newTheme }, 'theme');
            this.showToast('Error updating theme', 'error');
            logger.endTimer(timer, { success: false, error: error.message });
        }
    }

    async selectProjectFolder() {
        logger.userAction('select-project-folder', {}, document.getElementById('select-folder-btn'));
        const timer = logger.startTimer('select-project-folder');

        try {
            logger.debug('Opening folder selection dialog', {}, 'project');
            const folderPath = await ipcRenderer.invoke('select-folder');

            if (folderPath) {
                logger.projectOperation('folder-selected', folderPath, {
                    hasCurrentProject: !!this.currentProject,
                    previousProject: this.currentProject
                });

                this.setCurrentProject(folderPath);
                this.detectProjectType(folderPath);
                this.loadRecentProjects();
                this.showToast('Project folder selected', 'success');

                logger.endTimer(timer, { success: true, projectSelected: true });
            } else {
                logger.info('Project folder selection cancelled', {}, 'project');
                logger.endTimer(timer, { success: true, projectSelected: false });
            }
        } catch (error) {
            logger.error('Error selecting folder', error, {}, 'project');
            this.showToast(`Error selecting folder: ${error.message}`, 'error');
            logger.endTimer(timer, { success: false, error: error.message });
        }
    }

    setCurrentProject(folderPath) {
        this.currentProject = folderPath;

        const currentProjectDiv = document.getElementById('current-project');
        const projectPathDiv = document.getElementById('project-path');
        const editorSection = document.getElementById('editor-section');

        currentProjectDiv.classList.remove('hidden');
        projectPathDiv.textContent = folderPath;
        projectPathDiv.title = folderPath;

        // Show editor integration buttons when project is selected
        editorSection.classList.remove('hidden');

        // Update file explorer with the new project path
        if (this.fileExplorer) {
            this.fileExplorer.updatePath(folderPath);
        }
    }

    detectProjectType(folderPath) {
        const projectTypeDiv = document.getElementById('project-type');
        let projectType = 'Unknown';
        
        try {
            // Check for Flutter
            if (fs.existsSync(path.join(folderPath, 'pubspec.yaml'))) {
                projectType = '📱 Flutter Project';
            }
            // Check for Python
            else if (fs.existsSync(path.join(folderPath, 'requirements.txt')) || 
                     fs.existsSync(path.join(folderPath, 'main.py'))) {
                projectType = '🐍 Python Project';
            }
            // Check for Web/Node.js
            else if (fs.existsSync(path.join(folderPath, 'package.json'))) {
                projectType = '🌐 Web Project';
            }
            // Check for basic HTML
            else if (fs.existsSync(path.join(folderPath, 'index.html'))) {
                projectType = '🌐 HTML Project';
            }
        } catch (error) {
            console.error('Error detecting project type:', error);
        }
        
        projectTypeDiv.textContent = projectType;
    }

    async loadRecentProjects() {
        try {
            const recentProjects = await ipcRenderer.invoke('get-recent-projects');
            const recentDiv = document.getElementById('recent-projects');
            const recentList = document.getElementById('recent-list');
            
            if (recentProjects && recentProjects.length > 0) {
                recentDiv.classList.remove('hidden');
                recentList.innerHTML = '';
                
                recentProjects.slice(0, 5).forEach(projectPath => {
                    const item = document.createElement('div');
                    item.className = 'recent-project-item';
                    item.innerHTML = `
                        <div class="font-medium text-sm">${path.basename(projectPath)}</div>
                        <div class="recent-project-path text-xs">${projectPath}</div>
                    `;
                    item.addEventListener('click', () => {
                        this.setCurrentProject(projectPath);
                        this.detectProjectType(projectPath);
                        this.terminalManager.executeCommand(`cd "${projectPath}"`);
                        this.showToast('Project loaded', 'success');
                    });
                    recentList.appendChild(item);
                });
            } else {
                recentDiv.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading recent projects:', error);
        }
    }

    toggleCommandGroup(header) {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('.expand-arrow');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            header.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            header.classList.add('expanded');
        }
    }

    executeCommand(command) {
        logger.userAction('execute-command', {
            command,
            hasProject: !!this.currentProject,
            project: this.currentProject ? path.basename(this.currentProject) : null
        });

        const timer = logger.startTimer('execute-command');

        if (!this.currentProject) {
            logger.warn('Command execution attempted without project', { command }, 'command');
            this.showToast('Please select a project folder first', 'warning');
            logger.endTimer(timer, { success: false, reason: 'no-project' });
            return;
        }

        logger.commandExecution(command, this.currentProject, {
            terminalCount: this.activeTerminals.size
        });

        // Add to command history
        this.addToCommandHistory(command, this.currentProject);

        // Change to project directory first, then execute command
        const fullCommand = `cd "${this.currentProject}" && ${command}`;

        logger.debug('Executing command in terminal', {
            command,
            fullCommand,
            projectPath: this.currentProject
        }, 'command');

        if (this.terminalManager.executeCommand(fullCommand)) {
            this.showToast(`Executing: ${command}`, 'info');
            logger.info('Command sent to terminal successfully', {
                command,
                project: path.basename(this.currentProject)
            }, 'command');

            // Check if it's a directory change command and sync file explorer
            this.handleDirectoryChange(command);

            logger.endTimer(timer, { success: true });
        } else {
            logger.error('No active terminal found for command execution', null, {
                command,
                activeTerminals: this.activeTerminals.size
            }, 'command');
            this.showToast('No active terminal found', 'error');
            logger.endTimer(timer, { success: false, reason: 'no-terminal' });
        }
    }

    handleDirectoryChange(command) {
        // Check if the command is a directory change command
        const cdRegex = /^cd\s+(.+)$/i;
        const match = command.match(cdRegex);

        if (match) {
            let targetPath = match[1].trim();

            // Remove quotes if present
            targetPath = targetPath.replace(/^["']|["']$/g, '');

            logger.debug('Directory change command detected', {
                command,
                targetPath,
                currentProject: this.currentProject
            }, 'explorer-sync');

            try {
                // Resolve the path relative to current project
                let resolvedPath;

                if (path.isAbsolute(targetPath)) {
                    resolvedPath = targetPath;
                } else {
                    resolvedPath = path.resolve(this.currentProject, targetPath);
                }

                // Verify the directory exists
                if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                    logger.info('Syncing file explorer with directory change', {
                        oldPath: this.currentProject,
                        newPath: resolvedPath
                    }, 'explorer-sync');

                    // Update file explorer with new directory
                    if (this.fileExplorer) {
                        this.fileExplorer.syncWithTerminal(resolvedPath);
                    }

                    // Update current project if we've moved to a different project root
                    // This helps maintain consistency when navigating between projects
                    if (resolvedPath !== this.currentProject) {
                        // Don't change the main project, just update the explorer view
                        logger.debug('Terminal working directory changed', {
                            projectRoot: this.currentProject,
                            workingDirectory: resolvedPath
                        }, 'explorer-sync');
                    }
                } else {
                    logger.warn('Target directory does not exist', {
                        targetPath,
                        resolvedPath
                    }, 'explorer-sync');
                }
            } catch (error) {
                logger.error('Error processing directory change', error, {
                    command,
                    targetPath
                }, 'explorer-sync');
            }
        }
    }

    setupTerminal() {
        try {
            const terminalId = this.terminalManager.createTerminal('default-terminal', this.currentProject);
            this.activeTerminals.set('default-terminal', {
                id: 'default-terminal',
                title: 'Terminal 1',
                terminalId
            });
            this.showToast('Terminal initialized', 'success');
        } catch (error) {
            console.error('Error setting up terminal:', error);
            this.showToast('Error initializing terminal', 'error');
        }
    }

    createNewTerminal() {
        try {
            this.terminalCounter++;
            const terminalElementId = `terminal-${this.terminalCounter}`;
            const terminalTitle = `Terminal ${this.terminalCounter}`;
            
            // Create terminal container element
            const terminalContainer = document.getElementById('terminal-container');
            const newTerminalDiv = document.createElement('div');
            newTerminalDiv.id = terminalElementId;
            newTerminalDiv.className = 'h-full hidden';
            terminalContainer.appendChild(newTerminalDiv);
            
            // Create terminal instance
            const terminalId = this.terminalManager.createTerminal(terminalElementId, this.currentProject);
            
            // Store terminal info
            this.activeTerminals.set(terminalElementId, {
                id: terminalElementId,
                title: terminalTitle,
                terminalId
            });
            
            // Create tab
            this.addTerminalTab(terminalElementId, terminalTitle);
            
            // Switch to new terminal
            this.switchToTerminal(terminalElementId);
            
            this.showToast(`Created ${terminalTitle}`, 'success');
        } catch (error) {
            console.error('Error creating terminal:', error);
            this.showToast('Error creating terminal', 'error');
        }
    }

    showCommitModal() {
        if (!this.currentProject) {
            this.showToast('Please select a project folder first', 'warning');
            return;
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('commit-modal').classList.remove('hidden');
        document.getElementById('commit-message').focus();
    }

    hideCommitModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('commit-modal').classList.add('hidden');
        document.getElementById('commit-message').value = '';
    }

    performCommit() {
        const message = document.getElementById('commit-message').value.trim();
        const commitTextarea = document.getElementById('commit-message');
        
        // Remove existing error styling
        commitTextarea.classList.remove('input-error');
        
        // Validate commit message
        const validationError = InputValidator.validateCommitMessage(message);
        if (validationError) {
            commitTextarea.classList.add('input-error');
            this.showToast(validationError, 'error');
            return;
        }
        
        const commitCommand = `git add . && git commit -m "${message}"`;
        this.executeCommand(commitCommand);
        this.hideCommitModal();
        this.showToast('Commit executed', 'success');
    }

    openInBrowser() {
        if (!this.currentProject) {
            this.showToast('Please select a project folder first', 'warning');
            return;
        }
        
        const indexPath = path.join(this.currentProject, 'index.html');
        if (fs.existsSync(indexPath)) {
            shell.openPath(indexPath);
            this.showToast('Opening in browser', 'success');
        } else {
            this.showToast('index.html not found in project', 'error');
        }
    }

    async openInEditor(editor) {
        if (!this.currentProject) {
            this.showToast('Please select a project folder first', 'warning');
            return;
        }

        try {
            const result = await ipcRenderer.invoke('open-in-editor', this.currentProject, editor);
            
            if (result.success) {
                this.showToast(result.message, 'success');
            } else {
                this.showToast(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showToast('Failed to open in editor', 'error');
        }
    }

    setupResizer() {
        const resizer = document.getElementById('resizer');
        const leftPanel = document.getElementById('left-panel');
        
        resizer.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            document.addEventListener('mousemove', this.handleResize);
            document.addEventListener('mouseup', this.stopResize);
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
    }

    handleResize = (e) => {
        if (!this.isResizing) return;
        
        const leftPanel = document.getElementById('left-panel');
        const newWidth = e.clientX;
        
        if (newWidth >= 250 && newWidth <= 500) {
            leftPanel.style.width = `${newWidth}px`;
        }
    };

    stopResize = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
        document.body.style.cursor = '';
        
        // Resize terminal after panel resize
        setTimeout(() => {
            if (this.terminalManager) {
                this.terminalManager.resizeAll();
            }
        }, 100);
    };

    handleKeyboardShortcut(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'r':
                    e.preventDefault();
                    this.executeCommand('npm run dev');
                    break;
                case 'c':
                    if (e.shiftKey) {
                        e.preventDefault();
                        this.showCommitModal();
                    }
                    break;
                case 't':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
    }

    setupTerminalTabs() {
        const tabsContainer = document.getElementById('tabs-container');
        
        // Handle tab clicks
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('terminal-tab-close')) {
                const terminalId = e.target.getAttribute('data-close');
                this.closeTerminal(terminalId);
            } else {
                const tab = e.target.closest('.terminal-tab');
                if (tab) {
                    const terminalId = tab.getAttribute('data-terminal');
                    this.switchToTerminal(terminalId);
                }
            }
        });
        
        // Initialize first terminal as active
        this.activeTerminals.set('default-terminal', {
            id: 'default-terminal',
            title: 'Terminal 1',
            terminalId: null
        });
    }

    addTerminalTab(terminalId, title) {
        const tabsContainer = document.getElementById('tabs-container');
        const tab = document.createElement('div');
        tab.className = 'terminal-tab';
        tab.setAttribute('data-terminal', terminalId);
        tab.innerHTML = `
            <span class="tab-title">${title}</span>
            <span class="terminal-tab-close" data-close="${terminalId}">×</span>
        `;
        
        tabsContainer.appendChild(tab);
    }

    switchToTerminal(terminalId) {
        // Hide all terminals
        document.querySelectorAll('#terminal-container > div').forEach(terminal => {
            terminal.classList.add('hidden');
        });
        
        // Show selected terminal
        const targetTerminal = document.getElementById(terminalId);
        if (targetTerminal) {
            targetTerminal.classList.remove('hidden');
        }
        
        // Update tab states
        document.querySelectorAll('.terminal-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-terminal="${terminalId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update terminal manager active terminal
        const terminalInfo = this.activeTerminals.get(terminalId);
        if (terminalInfo && terminalInfo.terminalId) {
            this.terminalManager.setActiveTerminal(terminalInfo.terminalId);
        }
        
        // Resize terminal after switch
        setTimeout(() => {
            if (this.terminalManager) {
                this.terminalManager.resizeAll();
            }
        }, 100);
    }

    closeTerminal(terminalId) {
        if (this.activeTerminals.size <= 1) {
            this.showToast('Cannot close the last terminal', 'warning');
            return;
        }
        
        const terminalInfo = this.activeTerminals.get(terminalId);
        if (terminalInfo) {
            // Close terminal in manager
            if (terminalInfo.terminalId) {
                this.terminalManager.closeTerminal(terminalInfo.terminalId);
            }
            
            // Remove terminal element
            const terminalElement = document.getElementById(terminalId);
            if (terminalElement) {
                terminalElement.remove();
            }
            
            // Remove tab
            const tab = document.querySelector(`[data-terminal="${terminalId}"]`);
            if (tab) {
                tab.remove();
            }
            
            // Remove from active terminals
            this.activeTerminals.delete(terminalId);
            
            // Switch to first available terminal
            const remainingTerminals = Array.from(this.activeTerminals.keys());
            if (remainingTerminals.length > 0) {
                this.switchToTerminal(remainingTerminals[0]);
            }
            
            this.showToast(`Closed ${terminalInfo.title}`, 'info');
        }
    }

    async refreshSystemVersions() {
        try {
            // Show loading state
            const versionElements = {
                'node-version': 'Checking...',
                'git-version': 'Checking...',
                'flutter-version': 'Checking...',
                'python-version': 'Checking...',
                'vscode-version': 'Checking...'
            };

            Object.entries(versionElements).forEach(([id, text]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = text;
                    element.className = 'text-yellow-400';
                }
            });

            const versions = await ipcRenderer.invoke('get-system-versions');
            
            // Update UI with results
            this.updateVersionDisplay('node-version', versions.node);
            this.updateVersionDisplay('git-version', versions.git);
            this.updateVersionDisplay('flutter-version', versions.flutter);
            this.updateVersionDisplay('python-version', versions.python);
            this.updateVersionDisplay('vscode-version', versions.vscode);
            
            this.showToast('System versions updated', 'success');
        } catch (error) {
            console.error('Error checking system versions:', error);
            this.showToast('Error checking system versions', 'error');
        }
    }

    updateVersionDisplay(elementId, version) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = version;
        
        // Color code based on status
        if (version.includes('Not') || version === 'Error' || version === 'Timeout') {
            element.className = 'text-red-400';
        } else {
            element.className = 'text-green-400';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    showNotification(message, type = 'info') {
        logger.notification(type, message, { source: 'showNotification' }, 'notification');
        this.showToast(message, type);
    }

    // Command History Management
    async loadCommandHistory() {
        try {
            const history = await ipcRenderer.invoke('get-command-history');
            this.commandHistory = history || [];
            this.filteredHistory = [...this.commandHistory];
            this.renderCommandHistory();
        } catch (error) {
            console.error('Error loading command history:', error);
            this.commandHistory = [];
            this.filteredHistory = [];
        }
    }

    async addToCommandHistory(command, projectPath) {
        const historyItem = {
            id: Date.now().toString(),
            command: command,
            projectPath: path.basename(projectPath),
            fullProjectPath: projectPath,
            timestamp: new Date().toISOString(),
            formattedTime: new Date().toLocaleString()
        };

        // Add to beginning of array (most recent first)
        this.commandHistory.unshift(historyItem);
        
        // Keep only last 100 commands
        if (this.commandHistory.length > 100) {
            this.commandHistory = this.commandHistory.slice(0, 100);
        }

        // Update filtered history if no search filter active
        const searchValue = document.getElementById('history-search').value;
        if (!searchValue) {
            this.filteredHistory = [...this.commandHistory];
        } else {
            this.filterHistory(searchValue);
        }

        // Save to storage
        try {
            await ipcRenderer.invoke('save-command-history', this.commandHistory);
        } catch (error) {
            console.error('Error saving command history:', error);
        }

        // Update UI
        this.renderCommandHistory();
    }

    toggleHistoryPanel() {
        const panel = document.getElementById('history-panel');
        const toggleBtn = document.getElementById('toggle-history-btn');
        
        this.isHistoryVisible = !this.isHistoryVisible;
        
        if (this.isHistoryVisible) {
            panel.classList.remove('hidden');
            toggleBtn.textContent = 'Hide';
        } else {
            panel.classList.add('hidden');
            toggleBtn.textContent = 'Show';
        }
    }

    filterHistory(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredHistory = [...this.commandHistory];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredHistory = this.commandHistory.filter(item => 
                item.command.toLowerCase().includes(term) ||
                item.projectPath.toLowerCase().includes(term)
            );
        }
        this.renderCommandHistory();
    }

    async clearCommandHistory() {
        if (!confirm('Are you sure you want to clear all command history?')) {
            return;
        }

        try {
            this.commandHistory = [];
            this.filteredHistory = [];
            await ipcRenderer.invoke('save-command-history', this.commandHistory);
            this.renderCommandHistory();
            this.showToast('Command history cleared', 'success');
        } catch (error) {
            console.error('Error clearing command history:', error);
            this.showToast('Error clearing history', 'error');
        }
    }

    async exportCommandHistory() {
        if (this.commandHistory.length === 0) {
            this.showToast('No history to export', 'warning');
            return;
        }

        try {
            const csvContent = this.generateHistoryCSV();
            const result = await ipcRenderer.invoke('export-history', csvContent);
            
            if (result.success) {
                this.showToast(`History exported to ${result.filePath}`, 'success');
            } else {
                this.showToast('Export cancelled', 'info');
            }
        } catch (error) {
            console.error('Error exporting history:', error);
            this.showToast('Error exporting history', 'error');
        }
    }

    generateHistoryCSV() {
        const headers = ['Timestamp', 'Command', 'Project', 'Full Path'];
        const rows = this.commandHistory.map(item => [
            item.formattedTime,
            `"${item.command.replace(/"/g, '""')}"`,
            item.projectPath,
            `"${item.fullProjectPath.replace(/"/g, '""')}"`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    renderCommandHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = '';

        if (this.filteredHistory.length === 0) {
            const searchValue = document.getElementById('history-search').value;
            const emptyText = searchValue ? 'No commands match your search' : 'No commands executed yet';
            container.innerHTML = `<div class="history-empty">${emptyText}</div>`;
            return;
        }

        this.filteredHistory.forEach(item => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.innerHTML = `
                <div class="history-item-content">
                    <div class="history-command">${this.escapeHtml(item.command)}</div>
                    <div class="history-meta">
                        <span class="history-timestamp">${item.formattedTime}</span>
                        <span class="history-project">📁 ${this.escapeHtml(item.projectPath)}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn run" data-run="${item.id}">▶️ Run</button>
                    <button class="history-action-btn copy" data-copy="${item.id}">📋 Copy</button>
                    <button class="history-action-btn delete" data-delete="${item.id}">🗑️ Delete</button>
                </div>
            `;

            // Add click handler for re-execution (excluding action buttons)
            historyElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-action-btn')) {
                    this.reExecuteCommand(item);
                }
            });

            // Add action button handlers
            const runBtn = historyElement.querySelector('.run');
            const copyBtn = historyElement.querySelector('.copy');
            const deleteBtn = historyElement.querySelector('.delete');

            runBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reExecuteCommand(item);
            });

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyCommandToClipboard(item.command);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(item.id);
            });

            container.appendChild(historyElement);
        });
    }

    reExecuteCommand(historyItem) {
        // Set the project if it still exists
        if (this.currentProject !== historyItem.fullProjectPath) {
            if (fs.existsSync(historyItem.fullProjectPath)) {
                this.setCurrentProject(historyItem.fullProjectPath);
                this.detectProjectType(historyItem.fullProjectPath);
            } else {
                this.showToast('Original project path no longer exists', 'warning');
                // Continue with current project
            }
        }
        
        this.executeCommand(historyItem.command);
        this.showToast(`Re-executing: ${historyItem.command}`, 'info');
    }

    async copyCommandToClipboard(command) {
        try {
            await navigator.clipboard.writeText(command);
            this.showToast('Command copied to clipboard', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showToast('Error copying to clipboard', 'error');
        }
    }

    async deleteHistoryItem(itemId) {
        try {
            this.commandHistory = this.commandHistory.filter(item => item.id !== itemId);
            this.filteredHistory = this.filteredHistory.filter(item => item.id !== itemId);
            
            await ipcRenderer.invoke('save-command-history', this.commandHistory);
            this.renderCommandHistory();
            this.showToast('History item deleted', 'success');
        } catch (error) {
            console.error('Error deleting history item:', error);
            this.showToast('Error deleting item', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Custom Commands Management
    async loadCustomCommands() {
        try {
            const commands = await ipcRenderer.invoke('get-custom-commands');
            this.customCommands = commands || [];
            this.renderCustomCommands();
        } catch (error) {
            console.error('Error loading custom commands:', error);
            this.customCommands = [];
        }
    }

    async saveCustomCommand() {
        const name = document.getElementById('command-name').value.trim();
        const description = document.getElementById('command-description').value.trim();
        const shellCommand = document.getElementById('command-shell').value.trim();
        const icon = document.getElementById('command-icon').value.trim() || '⚡';

        // Validate all inputs
        const validationErrors = [];
        
        const nameError = InputValidator.validateRequired(name, 'Command name');
        if (nameError) validationErrors.push(nameError);
        
        const nameLengthError = InputValidator.validateLength(name, 'Command name', 1, 50);
        if (nameLengthError) validationErrors.push(nameLengthError);
        
        const shellError = InputValidator.validateCommand(shellCommand);
        if (shellError) validationErrors.push(shellError);
        
        const descLengthError = description ? InputValidator.validateLength(description, 'Description', 0, 200) : null;
        if (descLengthError) validationErrors.push(descLengthError);
        
        const iconError = InputValidator.validateIcon(icon);
        if (iconError) validationErrors.push(iconError);
        
        // Check for duplicate command names (excluding the one being edited)
        const existingCommand = this.customCommands.find(cmd => 
            cmd.name.toLowerCase() === name.toLowerCase() && 
            cmd.id !== this.editingCommandId
        );
        if (existingCommand) {
            validationErrors.push('A command with this name already exists');
        }

        if (validationErrors.length > 0) {
            this.showToast(validationErrors[0], 'error');
            this.highlightInvalidFields();
            return;
        }

        const command = {
            id: this.editingCommandId || Date.now().toString(),
            name,
            description,
            shellCommand,
            icon
        };

        try {
            if (this.editingCommandId) {
                // Update existing command
                const index = this.customCommands.findIndex(cmd => cmd.id === this.editingCommandId);
                if (index !== -1) {
                    this.customCommands[index] = command;
                }
                this.editingCommandId = null;
            } else {
                // Add new command
                this.customCommands.push(command);
            }

            await ipcRenderer.invoke('save-custom-commands', this.customCommands);
            this.renderCustomCommands();
            this.hideCustomCommandModal();
            this.showToast('Custom command saved', 'success');
        } catch (error) {
            console.error('Error saving custom command:', error);
            this.showToast('Error saving command', 'error');
        }
    }

    highlightInvalidFields() {
        // Remove existing error styling
        const inputs = ['command-name', 'command-description', 'command-shell', 'command-icon'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('input-error');
            }
        });

        // Add error styling to invalid fields
        const name = document.getElementById('command-name').value.trim();
        const description = document.getElementById('command-description').value.trim();
        const shellCommand = document.getElementById('command-shell').value.trim();
        const icon = document.getElementById('command-icon').value.trim();

        if (InputValidator.validateRequired(name, 'Command name')) {
            document.getElementById('command-name').classList.add('input-error');
        }
        
        if (InputValidator.validateCommand(shellCommand)) {
            document.getElementById('command-shell').classList.add('input-error');
        }
        
        if (description && InputValidator.validateLength(description, 'Description', 0, 200)) {
            document.getElementById('command-description').classList.add('input-error');
        }
        
        if (InputValidator.validateIcon(icon)) {
            document.getElementById('command-icon').classList.add('input-error');
        }
    }

    showCustomCommandModal(commandId = null) {
        this.editingCommandId = commandId;
        const modal = document.getElementById('custom-command-modal');
        const title = document.getElementById('custom-command-modal-title');
        const overlay = document.getElementById('modal-overlay');

        if (commandId) {
            // Edit mode
            const command = this.customCommands.find(cmd => cmd.id === commandId);
            if (command) {
                title.textContent = 'Edit Custom Command';
                document.getElementById('command-name').value = command.name;
                document.getElementById('command-description').value = command.description;
                document.getElementById('command-shell').value = command.shellCommand;
                document.getElementById('command-icon').value = command.icon;
            }
        } else {
            // Add mode
            title.textContent = 'Add Custom Command';
            document.getElementById('command-name').value = '';
            document.getElementById('command-description').value = '';
            document.getElementById('command-shell').value = '';
            document.getElementById('command-icon').value = '';
        }

        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        document.getElementById('command-name').focus();
    }

    hideCustomCommandModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('custom-command-modal').classList.add('hidden');
        this.editingCommandId = null;
    }

    async deleteCustomCommand(commandId) {
        if (!confirm('Are you sure you want to delete this custom command?')) {
            return;
        }

        try {
            this.customCommands = this.customCommands.filter(cmd => cmd.id !== commandId);
            await ipcRenderer.invoke('save-custom-commands', this.customCommands);
            this.renderCustomCommands();
            this.showToast('Custom command deleted', 'success');
        } catch (error) {
            console.error('Error deleting custom command:', error);
            this.showToast('Error deleting command', 'error');
        }
    }

    renderCustomCommands() {
        const container = document.getElementById('custom-commands-list');
        container.innerHTML = '';

        if (this.customCommands.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-400">No custom commands added yet</div>';
            return;
        }

        this.customCommands.forEach(command => {
            const commandElement = document.createElement('div');
            commandElement.className = 'custom-command-btn';
            commandElement.innerHTML = `
                <div class="command-info">
                    <div class="command-name">${command.icon} ${command.name}</div>
                    <div class="command-desc">${command.description || command.shellCommand}</div>
                </div>
                <div class="command-actions">
                    <button class="action-btn edit-btn" data-edit="${command.id}">✏️</button>
                    <button class="action-btn delete-btn" data-delete="${command.id}">🗑️</button>
                </div>
            `;

            // Add click handler for execution (excluding action buttons)
            commandElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    this.executeCommand(command.shellCommand);
                }
            });

            // Add action button handlers
            const editBtn = commandElement.querySelector('.edit-btn');
            const deleteBtn = commandElement.querySelector('.delete-btn');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCustomCommandModal(command.id);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCustomCommand(command.id);
            });

            container.appendChild(commandElement);
        });
    }
}

console.log('[DEBUG] Class definition complete, setting up global references...');

// Make classes available globally for webpack
try {
    window.EasyDebugApp = EasyDebugApp;
    window.InputValidator = InputValidator;
    console.log('[DEBUG] ✓ Global classes set successfully');
} catch (error) {
    console.error('[DEBUG] ✗ FAILED to set global classes:', error);
}

console.log('[DEBUG] Setting up DOM initialization...');
console.log('[DEBUG] Current DOM readyState:', document.readyState);
console.log('[DEBUG] document object available:', !!document);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] ==== DOMContentLoaded EVENT FIRED ====');
    console.log('[DEBUG] DOM loaded, initializing EasyDebugApp...');
    try {
        const app = new EasyDebugApp();
        window.easyDebugApp = app; // Store reference globally for debugging
        console.log('[DEBUG] ✓ EasyDebugApp initialized successfully from DOMContentLoaded');
    } catch (error) {
        console.error('[DEBUG] ✗ FAILED to initialize EasyDebugApp from DOMContentLoaded:', error);
    }
});

console.log('[DEBUG] DOMContentLoaded listener attached');

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
    console.log('[DEBUG] DOM still loading, waiting for DOMContentLoaded...');
} else {
    // DOM is already loaded
    console.log('[DEBUG] DOM already loaded (' + document.readyState + '), initializing immediately...');
    try {
        const app = new EasyDebugApp();
        window.easyDebugApp = app;
        console.log('[DEBUG] ✓ EasyDebugApp initialized immediately');
    } catch (error) {
        console.error('[DEBUG] ✗ FAILED to initialize EasyDebugApp immediately:', error);
    }
}

console.log('[DEBUG] ==== app.js bundle execution completed ====');