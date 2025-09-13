// const pty = require('node-pty'); // Temporarily disabled due to build issues
const os = require('os');
const path = require('path');

class PtyManager {
  static createPtyProcess(cwd = process.cwd()) {
    // Mock implementation for now - will show a simple message
    const mockProcess = {
      write(data) {
        console.log('Mock terminal input:', data);
      },
      
      onData(callback) {
        // Send a welcome message
        setTimeout(() => {
          callback('\r\n\x1b[32mEasy Debug Terminal (Mock Mode)\x1b[0m\r\n');
          callback('\x1b[33mNote: Full terminal integration requires node-pty\x1b[0m\r\n');
          callback(`\x1b[36mCurrent directory: ${cwd}\x1b[0m\r\n`);
          callback('\x1b[37m> \x1b[0m');
        }, 100);
      },
      
      onExit(callback) {
        // Mock - won't actually exit
      },
      
      resize(cols, rows) {
        console.log('Mock resize:', cols, rows);
      },
      
      kill() {
        console.log('Mock terminal killed');
      },
      
      get pid() {
        return 12345; // Mock PID
      }
    };

    return mockProcess;
  }

  static getShell() {
    if (os.platform() === 'win32') {
      return process.env.SHELL || 'powershell.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  static getDefaultCwd() {
    return os.homedir();
  }
}

module.exports = PtyManager;