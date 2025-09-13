const { ipcRenderer } = require('electron');

// Renderer-specific logger that forwards logs to main process
class RendererLogger {
    constructor() {
        this.sessionStart = new Date();
        this.init();
    }

    init() {
        // Set up console.log interception for development
        if (process.env.NODE_ENV === 'development') {
            this.interceptConsole();
        }

        // Log renderer initialization
        this.info('Renderer logger initialized', {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled
        }, 'renderer-init');
    }

    // Sanitize data for IPC transmission (prevents cloning errors)
    sanitizeForIPC(obj, depth = 0) {
        if (depth > 3) return '[Max Depth Reached]';
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
        if (obj instanceof Date) return obj.toISOString();
        if (typeof obj === 'function') return '[Function]';
        if (obj instanceof Error) return { message: obj.message, stack: obj.stack, name: obj.name };

        if (Array.isArray(obj)) {
            return obj.slice(0, 10).map(item => this.sanitizeForIPC(item, depth + 1));
        }

        if (typeof obj === 'object') {
            const sanitized = {};
            let count = 0;
            for (const key in obj) {
                if (count >= 20) break; // Limit object properties
                try {
                    sanitized[key] = this.sanitizeForIPC(obj[key], depth + 1);
                    count++;
                } catch (e) {
                    sanitized[key] = '[Unserializable]';
                }
            }
            return sanitized;
        }

        return String(obj);
    }

    // Forward logs to main process via IPC
    async forwardToMain(level, message, data = {}, category = 'general', error = null) {
        try {
            const logData = {
                level,
                message,
                data: this.sanitizeForIPC({
                    ...data,
                    timestamp: new Date().toISOString(),
                    category,
                    process: 'renderer',
                    url: window.location.href,
                    sessionDuration: `${((Date.now() - this.sessionStart.getTime()) / 1000).toFixed(1)}s`
                }),
                error: error ? this.sanitizeForIPC(error) : null
            };

            // Use IPC to send log to main process
            await ipcRenderer.invoke('log-message', logData);
        } catch (ipcError) {
            // Fallback to console if IPC fails
            console.error('Failed to forward log to main process:', ipcError);
            console[level] || console.log(message, data);
        }
    }

    // Enhanced logging methods
    debug(message, data = {}, category = 'general') {
        this.forwardToMain('debug', message, data, category);
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[RENDERER] ${message}`, data);
        }
    }

    info(message, data = {}, category = 'general') {
        this.forwardToMain('info', message, data, category);
        console.info(`[RENDERER] ${message}`, data);
    }

    warn(message, data = {}, category = 'general') {
        this.forwardToMain('warn', message, data, category);
        console.warn(`[RENDERER] ${message}`, data);
    }

    error(message, error = null, data = {}, category = 'general') {
        this.forwardToMain('error', message, data, category, error);
        console.error(`[RENDERER] ${message}`, error || '', data);
    }

    // Performance logging
    startTimer(operation) {
        const timer = {
            operation,
            startTime: Date.now()
        };

        this.debug(`Starting operation: ${operation}`, {}, 'performance');
        return timer;
    }

    endTimer(timer, data = {}) {
        const endTime = Date.now();
        const duration = endTime - timer.startTime;

        const performanceData = {
            operation: timer.operation,
            duration: `${duration}ms`,
            ...data
        };

        this.info(`Completed operation: ${timer.operation}`, performanceData, 'performance');
        return duration;
    }

    // User interaction logging
    userAction(action, details = {}, element = null) {
        const actionData = {
            action,
            timestamp: new Date().toISOString(),
            element: element ? {
                id: element.id,
                className: element.className,
                tagName: element.tagName,
                textContent: element.textContent ? element.textContent.substring(0, 100) : null
            } : null,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            ...details
        };

        this.info(`User action: ${action}`, actionData, 'user-interaction');
    }

    // UI state logging
    uiStateChange(component, oldState, newState, details = {}) {
        const stateData = {
            component,
            oldState,
            newState,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.debug(`UI state change: ${component}`, stateData, 'ui-state');
    }

    // DOM operation logging
    domOperation(operation, details = {}) {
        const domData = {
            operation,
            timestamp: new Date().toISOString(),
            documentReady: document.readyState,
            elementsCount: document.querySelectorAll('*').length,
            ...details
        };

        this.debug(`DOM operation: ${operation}`, domData, 'dom');
    }

    // Project operation logging
    projectOperation(operation, projectPath = null, details = {}) {
        const projectData = {
            operation,
            projectPath: projectPath ? this.getBaseName(projectPath) : null,
            fullPath: projectPath,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`Project operation: ${operation}`, projectData, 'project');
    }

    // Command execution logging
    commandExecution(command, projectPath = null, details = {}) {
        const commandData = {
            command,
            projectPath: projectPath ? this.getBaseName(projectPath) : null,
            fullPath: projectPath,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`Command execution: ${command}`, commandData, 'command');
    }

    // Terminal operation logging
    terminalOperation(operation, details = {}) {
        const terminalData = {
            operation,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`Terminal operation: ${operation}`, terminalData, 'terminal');
    }

    // Theme operation logging
    themeOperation(operation, details = {}) {
        const themeData = {
            operation,
            timestamp: new Date().toISOString(),
            currentTheme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
            ...details
        };

        this.info(`Theme operation: ${operation}`, themeData, 'theme');
    }

    // Modal operation logging
    modalOperation(operation, modalId, details = {}) {
        const modalData = {
            operation,
            modalId,
            timestamp: new Date().toISOString(),
            isVisible: !document.getElementById(modalId)?.classList.contains('hidden'),
            ...details
        };

        this.debug(`Modal operation: ${operation}`, modalData, 'modal');
    }

    // Form validation logging
    formValidation(formId, field, validationResult, details = {}) {
        const validationData = {
            formId,
            field,
            isValid: !validationResult,
            validationError: validationResult,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.debug(`Form validation: ${formId}.${field}`, validationData, 'validation');
    }

    // Notification logging
    notification(type, message, details = {}) {
        const notificationData = {
            type,
            message,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`Notification: ${type}`, notificationData, 'notification');
    }

    // Helper methods
    getBaseName(path) {
        if (!path) return null;
        return path.split(/[\\/]/).pop();
    }

    // Console interception for development
    interceptConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.forwardToMain('debug', 'Console log', { arguments: args }, 'console');
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.forwardToMain('error', 'Console error', { arguments: args }, 'console');
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.forwardToMain('warn', 'Console warn', { arguments: args }, 'console');
        };
    }

    // Page lifecycle logging
    pageLifecycle(event, details = {}) {
        const lifecycleData = {
            event,
            timestamp: new Date().toISOString(),
            readyState: document.readyState,
            ...details
        };

        this.info(`Page lifecycle: ${event}`, lifecycleData, 'lifecycle');
    }

    // Error boundary logging
    errorBoundary(error, errorInfo = {}) {
        this.error('Error boundary caught error', error, {
            errorInfo,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            timestamp: new Date().toISOString()
        }, 'error-boundary');
    }
}

// Create singleton instance
const rendererLogger = new RendererLogger();

// Set up page lifecycle logging
document.addEventListener('DOMContentLoaded', () => {
    rendererLogger.pageLifecycle('dom-content-loaded');
});

window.addEventListener('load', () => {
    rendererLogger.pageLifecycle('window-load');
});

window.addEventListener('beforeunload', () => {
    rendererLogger.pageLifecycle('before-unload');
});

window.addEventListener('error', (event) => {
    rendererLogger.error('Window error event', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
    }, 'window-error');
});

window.addEventListener('unhandledrejection', (event) => {
    rendererLogger.error('Unhandled promise rejection', event.reason, {
        promise: event.promise.toString()
    }, 'unhandled-rejection');
});

module.exports = rendererLogger;