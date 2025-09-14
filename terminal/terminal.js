const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');
const { WebLinksAddon } = require('xterm-addon-web-links');
const { ipcRenderer } = require('electron');

// Import renderer logger for terminal logging
const logger = require('../utils/renderer-logger');

class TerminalManager {
  constructor() {
    logger.info('TerminalManager constructor started', {}, 'terminal');

    this.terminals = new Map();
    this.activeTerminalId = null;
    this.terminalCounter = 0;

    logger.info('TerminalManager initialized', {
      terminalCount: this.terminals.size,
      activeTerminalId: this.activeTerminalId,
      terminalCounter: this.terminalCounter
    }, 'terminal');
  }

  async createTerminal(containerId, workingDirectory = process.cwd()) {
    const terminalId = `terminal-${++this.terminalCounter}`;
    const timer = logger.startTimer('create-terminal');

    logger.terminalOperation('create-terminal', {
      containerId,
      terminalId,
      workingDirectory,
      terminalCounter: this.terminalCounter
    });

    try {
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

      logger.debug('Terminal instance created', { terminalId }, 'terminal');

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      logger.debug('Terminal addons loaded', { terminalId }, 'terminal');

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with id ${containerId} not found`);
      }

      terminal.open(container);
      fitAddon.fit();
      logger.debug('Terminal opened in container', { containerId, terminalId }, 'terminal');

      // Create PTY process via IPC
      const ptyResult = await ipcRenderer.invoke('create-pty', { workingDirectory });
      if (!ptyResult.success) {
        throw new Error(`Failed to create PTY: ${ptyResult.error}`);
      }

      const ptyTerminalId = ptyResult.terminalId;
      logger.debug('PTY process created via IPC', { terminalId, ptyTerminalId, workingDirectory }, 'terminal');

      // Set up PTY handlers via IPC
      await ipcRenderer.invoke('pty-setup-handlers', { terminalId: ptyTerminalId });

      // Terminal state management for cursor control
      let inputBuffer = '';
      let promptEndCol = 0;
      let promptEndRow = 0;
      let isInInputMode = false;

      // Handle terminal input with cursor control - send to PTY via IPC
      terminal.onData(async (data) => {
        logger.debug('Terminal data input', { terminalId, dataLength: data.length }, 'terminal');

        // Handle special keys
        const keyCode = data.charCodeAt(0);
        const currentBuffer = terminal.buffer.active;
        const currentRow = currentBuffer.cursorY;
        const currentCol = currentBuffer.cursorX;

        // Prevent cursor from going above prompt line
        if (isInInputMode && currentRow < promptEndRow) {
          terminal.write(`\x1b[${promptEndRow + 1};${promptEndCol + inputBuffer.length + 1}H`);
          return;
        }

        // Handle Enter key (13) - submit command
        if (keyCode === 13) {
          inputBuffer = '';
          isInInputMode = false;
          try {
            await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
          } catch (error) {
            logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
          }
          return;
        }

        // Handle Backspace (127 or 8)
        if (keyCode === 127 || keyCode === 8) {
          if (isInInputMode && currentCol > promptEndCol && inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            try {
              await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
            } catch (error) {
              logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
            }
          }
          return;
        }

        // Handle Arrow Keys
        if (data === '\x1b[A' || data === '\x1b[B') { // Up/Down arrows
          // Allow command history navigation
          try {
            await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
          } catch (error) {
            logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
          }
          return;
        }

        if (data === '\x1b[C' || data === '\x1b[D') { // Left/Right arrows
          // Constrain horizontal movement to current input line
          if (isInInputMode) {
            if (data === '\x1b[D' && currentCol <= promptEndCol) { // Left arrow at prompt start
              return; // Don't allow moving left past prompt
            }
            if (data === '\x1b[C' && currentCol >= promptEndCol + inputBuffer.length) { // Right arrow at input end
              return; // Don't allow moving right past input
            }
          }
          try {
            await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
          } catch (error) {
            logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
          }
          return;
        }

        // Handle regular character input
        if (keyCode >= 32 && keyCode <= 126) { // Printable characters
          if (isInInputMode) {
            inputBuffer += data;
          }
          try {
            await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
          } catch (error) {
            logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
          }
          return;
        }

        // Handle other control characters
        try {
          await ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data });
        } catch (error) {
          logger.error('Error writing to PTY via IPC', error, { terminalId }, 'terminal');
        }
      });

      // Listen for PTY data from main process
      const ptyDataHandler = (event, { terminalId: responseTerminalId, data }) => {
        if (responseTerminalId === ptyTerminalId) {
          logger.debug('PTY data output', { terminalId, dataLength: data.length }, 'terminal');

          // Detect new prompt to update cursor constraints
          if (data.includes('>') || data.includes('$')) {
            const buffer = terminal.buffer.active;
            // Set input mode when we detect a new prompt
            setTimeout(() => {
              promptEndRow = buffer.cursorY;
              promptEndCol = buffer.cursorX;
              isInInputMode = true;
              inputBuffer = '';
            }, 10);
          }

          terminal.write(data);
        }
      };

      // Listen for PTY exit from main process
      const ptyExitHandler = (event, { terminalId: responseTerminalId, code, signal }) => {
        if (responseTerminalId === ptyTerminalId) {
          logger.info('PTY process exited', { terminalId, code, signal }, 'terminal');
          terminal.write('\r\n\x1b[31mProcess exited\x1b[0m\r\n');
          // Clean up listeners
          ipcRenderer.removeListener('pty-data', ptyDataHandler);
          ipcRenderer.removeListener('pty-exit', ptyExitHandler);
        }
      };

      // Register IPC listeners
      ipcRenderer.on('pty-data', ptyDataHandler);
      ipcRenderer.on('pty-exit', ptyExitHandler);

      // Add copy/paste functionality
      const setupClipboardHandlers = () => {
        // Handle copy operation (Ctrl+C when text is selected)
        terminal.onSelectionChange(() => {
          if (terminal.hasSelection()) {
            logger.debug('Terminal text selected for copy', { terminalId }, 'terminal');
          }
        });

        // Keyboard shortcuts handler
        terminal.attachCustomKeyEventHandler((event) => {
          // Handle Ctrl+C for copy (only when text is selected)
          if (event.ctrlKey && event.key === 'c' && terminal.hasSelection()) {
            event.preventDefault();
            const selectedText = terminal.getSelection();
            if (selectedText) {
              navigator.clipboard.writeText(selectedText).then(() => {
                logger.info('Text copied to clipboard', { terminalId, textLength: selectedText.length }, 'terminal');
                // Clear selection after copy
                terminal.clearSelection();
              }).catch(error => {
                logger.error('Failed to copy text to clipboard', error, { terminalId }, 'terminal');
              });
            }
            return false;
          }

          // Handle Ctrl+V for paste
          if (event.ctrlKey && event.key === 'v') {
            event.preventDefault();
            navigator.clipboard.readText().then(text => {
              if (text && isInInputMode) {
                // Only paste printable characters and handle line breaks
                const sanitizedText = text.replace(/[\r\n]/g, ' ').replace(/[^\x20-\x7E]/g, '');
                if (sanitizedText) {
                  inputBuffer += sanitizedText;
                  // Send text to PTY
                  ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data: sanitizedText })
                    .then(() => {
                      logger.info('Text pasted from clipboard', { terminalId, textLength: sanitizedText.length }, 'terminal');
                    })
                    .catch(error => {
                      logger.error('Failed to paste text to terminal', error, { terminalId }, 'terminal');
                    });
                }
              }
            }).catch(error => {
              logger.error('Failed to read from clipboard', error, { terminalId }, 'terminal');
            });
            return false;
          }

          // Handle Ctrl+A for select all
          if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            terminal.selectAll();
            logger.debug('Terminal select all triggered', { terminalId }, 'terminal');
            return false;
          }

          return true;
        });

        // Add context menu for right-click copy/paste
        const terminalElement = terminal.element;
        if (terminalElement) {
          terminalElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();

            // Create context menu
            const contextMenu = document.createElement('div');
            contextMenu.className = 'terminal-context-menu';
            contextMenu.innerHTML = `
              <div class="context-menu-item" data-action="copy" ${!terminal.hasSelection() ? 'disabled' : ''}>Copy</div>
              <div class="context-menu-item" data-action="paste">Paste</div>
              <div class="context-menu-item" data-action="selectall">Select All</div>
            `;

            // Position menu
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = event.clientX + 'px';
            contextMenu.style.top = event.clientY + 'px';
            contextMenu.style.zIndex = '1000';
            contextMenu.style.background = '#2d2d30';
            contextMenu.style.border = '1px solid #3e3e42';
            contextMenu.style.borderRadius = '3px';
            contextMenu.style.padding = '4px 0';
            contextMenu.style.minWidth = '120px';

            // Add menu item styles
            const menuItems = contextMenu.querySelectorAll('.context-menu-item');
            menuItems.forEach(item => {
              item.style.padding = '6px 12px';
              item.style.cursor = 'pointer';
              item.style.color = '#cccccc';
              item.style.fontSize = '13px';

              if (item.hasAttribute('disabled')) {
                item.style.color = '#666666';
                item.style.cursor = 'default';
              } else {
                item.addEventListener('mouseover', () => {
                  item.style.background = '#094771';
                });
                item.addEventListener('mouseout', () => {
                  item.style.background = 'transparent';
                });
              }
            });

            document.body.appendChild(contextMenu);

            // Handle menu clicks
            contextMenu.addEventListener('click', (e) => {
              const action = e.target.dataset.action;

              if (action === 'copy' && terminal.hasSelection()) {
                const selectedText = terminal.getSelection();
                navigator.clipboard.writeText(selectedText);
                terminal.clearSelection();
              } else if (action === 'paste') {
                navigator.clipboard.readText().then(text => {
                  if (text && isInInputMode) {
                    const sanitizedText = text.replace(/[\r\n]/g, ' ').replace(/[^\x20-\x7E]/g, '');
                    if (sanitizedText) {
                      inputBuffer += sanitizedText;
                      ipcRenderer.invoke('pty-write', { terminalId: ptyTerminalId, data: sanitizedText });
                    }
                  }
                });
              } else if (action === 'selectall') {
                terminal.selectAll();
              }

              document.body.removeChild(contextMenu);
            });

            // Remove menu on outside click
            const removeMenu = (e) => {
              if (!contextMenu.contains(e.target)) {
                if (document.body.contains(contextMenu)) {
                  document.body.removeChild(contextMenu);
                }
                document.removeEventListener('click', removeMenu);
              }
            };

            setTimeout(() => {
              document.addEventListener('click', removeMenu);
            }, 10);
          });
        }
      };

      // Setup clipboard handlers after terminal is ready
      setupClipboardHandlers();

      const terminalInstance = {
        id: terminalId,
        terminal,
        fitAddon,
        ptyTerminalId,
        workingDirectory,
        isActive: false,
        createdAt: new Date().toISOString(),
        ptyDataHandler,
        ptyExitHandler
      };

      this.terminals.set(terminalId, terminalInstance);
      this.setActiveTerminal(terminalId);

      // Log terminal resize events
      const resizeHandler = () => {
        if (this.activeTerminalId === terminalId) {
          logger.debug('Terminal resize triggered', { terminalId }, 'terminal');
          setTimeout(() => fitAddon.fit(), 100);
        }
      };
      window.addEventListener('resize', resizeHandler);

      logger.endTimer(timer, { success: true, terminalId });
      logger.info('Terminal created successfully', {
        terminalId,
        containerId,
        workingDirectory,
        totalTerminals: this.terminals.size
      }, 'terminal');

      return terminalId;
    } catch (error) {
      logger.error('Error creating terminal', error, {
        terminalId,
        containerId,
        workingDirectory
      }, 'terminal');
      logger.endTimer(timer, { success: false, error: error.message });
      throw error;
    }
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

  async executeCommand(command, terminalId = null) {
    const targetId = terminalId || this.activeTerminalId;

    logger.terminalOperation('execute-command', {
      command,
      terminalId: targetId,
      activeTerminalId: this.activeTerminalId,
      totalTerminals: this.terminals.size
    });

    const terminal = this.terminals.get(targetId);

    if (terminal && terminal.ptyTerminalId) {
      try {
        await ipcRenderer.invoke('pty-write', {
          terminalId: terminal.ptyTerminalId,
          data: command + '\r\n'
        });
        logger.info('Command executed in terminal', {
          command,
          terminalId: targetId,
          workingDirectory: terminal.workingDirectory
        }, 'terminal');
        return true;
      } catch (error) {
        logger.error('Error executing command', error, {
          command,
          terminalId: targetId
        }, 'terminal');
        return false;
      }
    }

    logger.warn('Cannot execute command - terminal not found or no PTY', {
      command,
      terminalId: targetId,
      terminalExists: !!terminal,
      hasPtyTerminalId: terminal ? !!terminal.ptyTerminalId : false
    }, 'terminal');

    return false;
  }

  async closeTerminal(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      // Kill PTY process via IPC
      if (terminal.ptyTerminalId) {
        try {
          await ipcRenderer.invoke('pty-kill', { terminalId: terminal.ptyTerminalId });
        } catch (error) {
          logger.error('Error killing PTY via IPC', error, { terminalId }, 'terminal');
        }
      }

      // Clean up IPC listeners
      if (terminal.ptyDataHandler) {
        ipcRenderer.removeListener('pty-data', terminal.ptyDataHandler);
      }
      if (terminal.ptyExitHandler) {
        ipcRenderer.removeListener('pty-exit', terminal.ptyExitHandler);
      }

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