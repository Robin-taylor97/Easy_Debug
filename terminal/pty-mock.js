const { spawn } = require('child_process');
const os = require('os');

class MockPtyManager {
  static createPtyProcess(cwd = process.cwd()) {
    const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
    const args = os.platform() === 'win32' ? ['/k'] : [];

    const childProcess = spawn(shell, args, {
      cwd: cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const processWrapper = {
      write(data) {
        if (childProcess.stdin && !childProcess.stdin.destroyed) {
          childProcess.stdin.write(data);
        }
      },
      
      onData(callback) {
        if (childProcess.stdout) {
          childProcess.stdout.on('data', (data) => {
            callback(data.toString());
          });
        }
        if (childProcess.stderr) {
          childProcess.stderr.on('data', (data) => {
            callback(`\x1b[31m${data.toString()}\x1b[0m`);
          });
        }
      },
      
      onExit(callback) {
        childProcess.on('exit', callback);
        childProcess.on('close', callback);
      },
      
      resize(cols, rows) {
        // Mock resize - no-op for basic child_process
      },
      
      kill() {
        if (childProcess && !childProcess.killed) {
          childProcess.kill();
        }
      },
      
      get pid() {
        return childProcess.pid;
      }
    };

    return processWrapper;
  }

  static getShell() {
    if (os.platform() === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  static getDefaultCwd() {
    return os.homedir();
  }
}

module.exports = MockPtyManager;