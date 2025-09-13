const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');
const { WebLinksAddon } = require('xterm-addon-web-links');
const PtyManager = require('./pty');

class TerminalManager {
  constructor() {
    this.terminals = new Map();
    this.activeTerminalId = null;
    this.terminalCounter = 0;
  }

  createTerminal(containerId, workingDirectory = process.cwd()) {
    const terminalId = `terminal-${++this.terminalCounter}`;
    
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#ffffff40',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      allowTransparency: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    terminal.open(container);
    fitAddon.fit();

    const ptyProcess = PtyManager.createPtyProcess(workingDirectory);
    
    terminal.onData((data) => {
      ptyProcess.write(data);
    });

    ptyProcess.onData((data) => {
      terminal.write(data);
    });

    ptyProcess.onExit(() => {
      terminal.write('\r\n\x1b[31mProcess exited\x1b[0m\r\n');
    });

    const terminalInstance = {
      id: terminalId,
      terminal,
      fitAddon,
      ptyProcess,
      workingDirectory,
      isActive: false
    };

    this.terminals.set(terminalId, terminalInstance);
    this.setActiveTerminal(terminalId);

    window.addEventListener('resize', () => {
      if (this.activeTerminalId === terminalId) {
        setTimeout(() => fitAddon.fit(), 100);
      }
    });

    return terminalId;
  }

  setActiveTerminal(terminalId) {
    if (this.activeTerminalId) {
      const currentActive = this.terminals.get(this.activeTerminalId);
      if (currentActive) {
        currentActive.isActive = false;
      }
    }

    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.isActive = true;
      this.activeTerminalId = terminalId;
      terminal.terminal.focus();
      setTimeout(() => terminal.fitAddon.fit(), 100);
    }
  }

  getTerminal(terminalId) {
    return this.terminals.get(terminalId);
  }

  getActiveTerminal() {
    return this.activeTerminalId ? this.terminals.get(this.activeTerminalId) : null;
  }

  executeCommand(command, terminalId = null) {
    const targetId = terminalId || this.activeTerminalId;
    const terminal = this.terminals.get(targetId);
    
    if (terminal && terminal.ptyProcess) {
      terminal.ptyProcess.write(command + '\r\n');
      return true;
    }
    
    return false;
  }

  closeTerminal(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.ptyProcess.kill();
      terminal.terminal.dispose();
      this.terminals.delete(terminalId);
      
      if (this.activeTerminalId === terminalId) {
        const remainingTerminals = Array.from(this.terminals.keys());
        if (remainingTerminals.length > 0) {
          this.setActiveTerminal(remainingTerminals[0]);
        } else {
          this.activeTerminalId = null;
        }
      }
    }
  }

  updateTheme(theme) {
    const colors = theme === 'dark' ? {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
      selection: '#ffffff40'
    } : {
      background: '#ffffff',
      foreground: '#000000',
      cursor: '#000000',
      selection: '#00000040'
    };

    this.terminals.forEach(terminal => {
      terminal.terminal.options.theme = { ...terminal.terminal.options.theme, ...colors };
    });
  }

  resizeAll() {
    this.terminals.forEach(terminal => {
      terminal.fitAddon.fit();
    });
  }

  clear(terminalId = null) {
    const targetId = terminalId || this.activeTerminalId;
    const terminal = this.terminals.get(targetId);
    
    if (terminal) {
      terminal.terminal.clear();
    }
  }

  getAllTerminals() {
    return Array.from(this.terminals.entries()).map(([id, terminal]) => ({
      id,
      workingDirectory: terminal.workingDirectory,
      isActive: terminal.isActive
    }));
  }
}

module.exports = TerminalManager;