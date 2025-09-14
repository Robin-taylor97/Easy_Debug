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
    }

    // Spawn the shell process
    let childProcess;
    try {
      childProcess = spawn(shell, shellArgs, {
        cwd: cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'xterm-256color' },
        windowsHide: false,
        detached: false
      });
    } catch (error) {
      console.error('Failed to spawn shell:', error);
      return PtyManager._createFallbackProcess(cwd);
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
            // Echo input back to terminal for immediate feedback
            if (data === '\r' || data === '\r\n') {
              // Send command to shell
              childProcess.stdin.write('\r\n');
              // Echo newline back to terminal
              ptyProcess._dataCallbacks.forEach(callback => {
                callback('\r\n');
              });
            } else if (data === '\x7f') { // Backspace
              // Echo backspace to terminal
              ptyProcess._dataCallbacks.forEach(callback => {
                callback('\b \b');
              });
            } else {
              childProcess.stdin.write(data);
              // Echo character back to terminal
              ptyProcess._dataCallbacks.forEach(callback => {
                callback(data);
              });
            }

            // Ensure data is flushed immediately for interactive shell
            if (childProcess.stdin.flush) {
              childProcess.stdin.flush();
            }
          } catch (error) {
            console.error('Error writing to shell:', error);
          }
        }
      },

      onData(callback) {
        this._dataCallbacks.push(callback);

        // Send welcome message and initial prompt
        setTimeout(() => {
          callback('\r\n\x1b[32mEasy Debug Terminal\x1b[0m\r\n');
          callback(`\x1b[36m${shell} - ${cwd || process.cwd()}\x1b[0m\r\n\r\n`);

          // Show initial prompt
          if (isWindows) {
            const currentDir = cwd || process.cwd();
            const prompt = `${currentDir}>`;
            callback(`\x1b[37m${prompt}\x1b[0m `);
          } else {
            const currentDir = cwd || process.cwd();
            const shortDir = currentDir.split('/').pop() || currentDir;
            const prompt = `${shortDir}$`;
            callback(`\x1b[37m${prompt}\x1b[0m `);
          }
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

  // Fallback implementation if shell spawning fails
  static _createFallbackProcess(cwd) {
    return {
      write(data) {
        console.log('Fallback terminal input:', data);
      },

      onData(callback) {
        setTimeout(() => {
          callback('\r\n\x1b[33mTerminal Fallback Mode\x1b[0m\r\n');
          callback('\x1b[31mShell process could not be started\x1b[0m\r\n');
          callback(`\x1b[36mDirectory: ${cwd}\x1b[0m\r\n`);
          callback('\x1b[37m> \x1b[0m');
        }, 100);
      },

      onExit(callback) {},
      resize(cols, rows) {},
      kill() {},
      get pid() { return null; }
    };
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