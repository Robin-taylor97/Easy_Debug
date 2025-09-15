const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

class PtyManager {
  static createPtyProcess(cwd = process.cwd()) {
    const shell = PtyManager.getShell();
    const isWindows = os.platform() === 'win32';

    // Windows-specific shell arguments for interactive session
    let shellArgs = [];
    if (isWindows) {
      if (shell.includes('powershell')) {
        // Use interactive mode without -Command
        shellArgs = ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass'];
      } else if (shell.includes('cmd')) {
        shellArgs = ['/k']; // Keep cmd open after commands
      }
    } else {
      // Unix-like systems
      shellArgs = ['-i']; // Interactive mode
    }

    // Spawn the shell process
    let childProcess;
    try {
      childProcess = spawn(shell, shellArgs, {
        cwd: cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLUMNS: '80',
          LINES: '24'
        },
        windowsHide: false,
        detached: false
      });

      console.log(`Shell process spawned successfully: ${shell} (PID: ${childProcess.pid})`);
    } catch (error) {
      console.error('Failed to spawn shell:', error);
      throw new Error(`Failed to create shell process: ${error.message}`);
    }

    // Create our PTY-like interface
    const ptyProcess = {
      _process: childProcess,
      _dataCallbacks: [],
      _exitCallbacks: [],
      _buffer: '',

      write(data) {
        if (childProcess && childProcess.stdin && childProcess.stdin.writable) {
          try {
            // Send data directly to shell without echo
            childProcess.stdin.write(data);

            // Ensure data is flushed immediately for interactive shell
            if (childProcess.stdin.flush) {
              childProcess.stdin.flush();
            }
          } catch (error) {
            console.error('Error writing to shell:', error);
            // Notify callbacks of error
            ptyProcess._dataCallbacks.forEach(callback => {
              callback(`\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`);
            });
          }
        } else {
          console.warn('Shell process not available for writing');
          ptyProcess._dataCallbacks.forEach(callback => {
            callback('\r\n\x1b[31mShell not ready\x1b[0m\r\n');
          });
        }
      },

      onData(callback) {
        this._dataCallbacks.push(callback);

        // Send welcome message
        setTimeout(() => {
          callback('\r\n\x1b[32mEasy Debug Terminal\x1b[0m\r\n');
          callback(`\x1b[36mShell: ${shell} | Directory: ${cwd || process.cwd()}\x1b[0m\r\n`);
          callback('\x1b[90mType commands below. Press Ctrl+C to interrupt running processes.\x1b[0m\r\n\r\n');
        }, 100);
      },

      onExit(callback) {
        this._exitCallbacks.push(callback);
      },

      resize(cols, rows) {
        // Terminal resizing not fully supported with basic child_process
        // but we can log it for debugging
        console.log(`Terminal resize: ${cols}x${rows}`);
      },

      kill() {
        if (childProcess) {
          try {
            if (isWindows) {
              // Force kill on Windows
              spawn('taskkill', ['/pid', childProcess.pid.toString(), '/f', '/t']);
            } else {
              childProcess.kill('SIGTERM');
            }
          } catch (error) {
            console.error('Error killing process:', error);
          }
        }
      },

      get pid() {
        return childProcess ? childProcess.pid : null;
      }
    };

    // Set up data handlers
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        let output = data.toString();

        ptyProcess._dataCallbacks.forEach(callback => {
          try {
            callback(output);
          } catch (error) {
            console.error('Error in data callback:', error);
          }
        });
      });
    }

    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        ptyProcess._dataCallbacks.forEach(callback => {
          try {
            // Stderr in red color
            callback(`\x1b[31m${output}\x1b[0m`);
          } catch (error) {
            console.error('Error in stderr callback:', error);
          }
        });
      });
    }

    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      ptyProcess._exitCallbacks.forEach(callback => {
        try {
          callback(code, signal);
        } catch (error) {
          console.error('Error in exit callback:', error);
        }
      });
    });

    childProcess.on('error', (error) => {
      console.error('Shell process error:', error);
      ptyProcess._dataCallbacks.forEach(callback => {
        try {
          callback(`\r\n\x1b[31mShell error: ${error.message}\x1b[0m\r\n`);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      });
    });

    return ptyProcess;
  }


  static getShell() {
    if (os.platform() === 'win32') {
      // Use CMD by default on Windows as it's more compatible with stdio pipes
      return process.env.SHELL || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  static getDefaultCwd() {
    return os.homedir();
  }
}

module.exports = PtyManager;