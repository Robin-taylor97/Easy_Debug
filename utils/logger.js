const log = require('electron-log');
const path = require('path');
const os = require('os');

// Configure electron-log
class Logger {
    constructor() {
        this.setupLogging();
        this.sessionStart = new Date();
    }

    setupLogging() {
        // Configure log file locations
        const logDir = path.join(os.homedir(), '.easy-debug', 'logs');

        // Main log file
        log.transports.file.level = 'info';
        log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
        log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
        log.transports.file.file = path.join(logDir, 'easy-debug.log');

        // Console output (for development)
        log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
        log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';

        // Error-specific log file
        log.transports.file.level = 'error';
        log.transports.file.file = path.join(logDir, 'errors.log');
    }

    // Enhanced logging methods with context
    debug(message, data = {}, category = 'general') {
        const logData = this.formatLogData(message, data, category);
        log.debug(logData);
    }

    info(message, data = {}, category = 'general') {
        const logData = this.formatLogData(message, data, category);
        log.info(logData);
    }

    warn(message, data = {}, category = 'general') {
        const logData = this.formatLogData(message, data, category);
        log.warn(logData);
    }

    error(message, error = null, data = {}, category = 'general') {
        const logData = this.formatLogData(message, data, category);

        if (error) {
            logData.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }

        log.error(logData);
    }

    // Performance logging
    startTimer(operation) {
        const timer = {
            operation,
            startTime: Date.now(),
            startMemory: process.memoryUsage()
        };

        this.debug(`Starting operation: ${operation}`, {
            memory: timer.startMemory
        }, 'performance');

        return timer;
    }

    endTimer(timer, data = {}) {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - timer.startTime;

        const performanceData = {
            operation: timer.operation,
            duration: `${duration}ms`,
            memoryDelta: {
                rss: `${((endMemory.rss - timer.startMemory.rss) / 1024 / 1024).toFixed(2)}MB`,
                heapUsed: `${((endMemory.heapUsed - timer.startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`
            },
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
                tagName: element.tagName
            } : null,
            ...details
        };

        this.info(`User action: ${action}`, actionData, 'user-interaction');
    }

    // System information logging
    systemInfo(data = {}) {
        const sysInfo = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            electronVersion: process.versions.electron,
            memory: process.memoryUsage(),
            uptime: `${process.uptime()}s`,
            sessionDuration: `${((Date.now() - this.sessionStart.getTime()) / 1000).toFixed(1)}s`,
            ...data
        };

        this.info('System information', sysInfo, 'system');
    }

    // IPC operation logging
    ipcOperation(operation, channel, data = {}, direction = 'unknown') {
        const ipcData = {
            operation,
            channel,
            direction, // 'main-to-renderer', 'renderer-to-main'
            timestamp: new Date().toISOString(),
            ...data
        };

        this.debug(`IPC ${operation}: ${channel}`, ipcData, 'ipc');
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

    // Project operation logging
    projectOperation(operation, projectPath = null, details = {}) {
        const projectData = {
            operation,
            projectPath: projectPath ? path.basename(projectPath) : null,
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
            projectPath: projectPath ? path.basename(projectPath) : null,
            fullPath: projectPath,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`Command execution: ${command}`, commandData, 'command');
    }

    // Application lifecycle logging
    appLifecycle(event, details = {}) {
        const lifecycleData = {
            event,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info(`App lifecycle: ${event}`, lifecycleData, 'lifecycle');
    }

    // Helper method to format log data
    formatLogData(message, data, category) {
        return {
            message,
            category,
            timestamp: new Date().toISOString(),
            process: process.type || 'main',
            pid: process.pid,
            ...data
        };
    }

    // Log rotation helper
    rotateLogs() {
        try {
            const logDir = path.join(os.homedir(), '.easy-debug', 'logs');
            const fs = require('fs');

            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // Archive old logs if they exist and are large
            const mainLogFile = path.join(logDir, 'easy-debug.log');
            const errorLogFile = path.join(logDir, 'errors.log');

            [mainLogFile, errorLogFile].forEach(logFile => {
                if (fs.existsSync(logFile)) {
                    const stats = fs.statSync(logFile);
                    const maxSize = 10 * 1024 * 1024; // 10MB

                    if (stats.size > maxSize) {
                        const archiveName = logFile.replace('.log', `-${Date.now()}.log`);
                        fs.renameSync(logFile, archiveName);
                        this.info('Log file rotated', {
                            originalFile: logFile,
                            archiveFile: archiveName,
                            size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`
                        }, 'system');
                    }
                }
            });

        } catch (error) {
            console.error('Failed to rotate logs:', error);
        }
    }

    // Get log file paths for external access
    getLogFilePaths() {
        const logDir = path.join(os.homedir(), '.easy-debug', 'logs');
        return {
            main: path.join(logDir, 'easy-debug.log'),
            errors: path.join(logDir, 'errors.log'),
            directory: logDir
        };
    }
}

// Create and export singleton instance
const logger = new Logger();

// Perform initial log rotation
logger.rotateLogs();

// Log initialization
logger.appLifecycle('logger-initialized', {
    logFiles: logger.getLogFilePaths(),
    environment: process.env.NODE_ENV || 'development'
});

module.exports = logger;