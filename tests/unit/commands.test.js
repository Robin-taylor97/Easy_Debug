// Test file for custom command management

describe('Custom Command Management', () => {
  let mockIpcRenderer;
  let customCommands;

  beforeEach(() => {
    mockIpcRenderer = {
      invoke: jest.fn()
    };

    customCommands = [];
    global.ipcRenderer = mockIpcRenderer;
  });

  describe('Command Creation', () => {
    test('should create a valid custom command', () => {
      const createCommand = (name, description, shellCommand, icon = '⚡') => {
        return {
          id: Date.now().toString(),
          name: name.trim(),
          description: description.trim(),
          shellCommand: shellCommand.trim(),
          icon: icon.trim() || '⚡'
        };
      };

      const command = createCommand('Run Tests', 'Execute unit tests', 'npm test', '🧪');
      
      expect(command.name).toBe('Run Tests');
      expect(command.description).toBe('Execute unit tests');
      expect(command.shellCommand).toBe('npm test');
      expect(command.icon).toBe('🧪');
      expect(command.id).toBeDefined();
    });

    test('should use default icon when not provided', () => {
      const createCommand = (name, description, shellCommand, icon = '⚡') => {
        return {
          id: Date.now().toString(),
          name: name.trim(),
          description: description.trim(),
          shellCommand: shellCommand.trim(),
          icon: icon.trim() || '⚡'
        };
      };

      const command = createCommand('Build App', 'Build application', 'npm run build');
      expect(command.icon).toBe('⚡');
    });

    test('should use default icon for empty string', () => {
      const createCommand = (name, description, shellCommand, icon = '⚡') => {
        return {
          id: Date.now().toString(),
          name: name.trim(),
          description: description.trim(),
          shellCommand: shellCommand.trim(),
          icon: icon.trim() || '⚡'
        };
      };

      const command = createCommand('Deploy', 'Deploy to server', 'npm run deploy', '');
      expect(command.icon).toBe('⚡');
    });

    test('should trim whitespace from inputs', () => {
      const createCommand = (name, description, shellCommand, icon = '⚡') => {
        return {
          id: Date.now().toString(),
          name: name.trim(),
          description: description.trim(),
          shellCommand: shellCommand.trim(),
          icon: icon.trim() || '⚡'
        };
      };

      const command = createCommand('  Test  ', '  Run tests  ', '  npm test  ', '  🧪  ');
      
      expect(command.name).toBe('Test');
      expect(command.description).toBe('Run tests');
      expect(command.shellCommand).toBe('npm test');
      expect(command.icon).toBe('🧪');
    });
  });

  describe('Command Validation', () => {
    test('should validate required fields', () => {
      const validateCommand = (command) => {
        const errors = [];
        
        if (!command.name || command.name.trim() === '') {
          errors.push('Command name is required');
        }
        
        if (!command.shellCommand || command.shellCommand.trim() === '') {
          errors.push('Shell command is required');
        }
        
        return errors;
      };

      const validCommand = {
        name: 'Test',
        shellCommand: 'npm test',
        description: 'Run tests',
        icon: '🧪'
      };

      expect(validateCommand(validCommand)).toHaveLength(0);

      const invalidCommand = {
        name: '',
        shellCommand: '',
        description: 'Invalid command'
      };

      const errors = validateCommand(invalidCommand);
      expect(errors).toContain('Command name is required');
      expect(errors).toContain('Shell command is required');
    });

    test('should validate command uniqueness', () => {
      const existingCommands = [
        { id: '1', name: 'Test', shellCommand: 'npm test' },
        { id: '2', name: 'Build', shellCommand: 'npm run build' }
      ];

      const checkDuplicate = (newCommand, existingCommands, excludeId = null) => {
        return existingCommands.some(cmd => 
          cmd.name.toLowerCase() === newCommand.name.toLowerCase() && 
          cmd.id !== excludeId
        );
      };

      expect(checkDuplicate({ name: 'Test' }, existingCommands)).toBe(true);
      expect(checkDuplicate({ name: 'Deploy' }, existingCommands)).toBe(false);
      expect(checkDuplicate({ name: 'Test' }, existingCommands, '1')).toBe(false); // Excluding self
    });

    test('should validate dangerous commands', () => {
      const validateCommandSafety = (shellCommand) => {
        const dangerousPatterns = [
          /rm\s+-rf\s+\//,
          /format\s+[c-z]:/i,
          /del\s+\/[sq]/i,
          /shutdown/i,
          /reboot/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(shellCommand));
      };

      expect(validateCommandSafety('npm test')).toBe(true);
      expect(validateCommandSafety('rm -rf /')).toBe(false);
      expect(validateCommandSafety('shutdown now')).toBe(false);
      expect(validateCommandSafety('del /s *')).toBe(false);
    });
  });

  describe('Command Storage', () => {
    test('should save commands to storage', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, savedCount: 2 });

      const saveCommands = async (commands) => {
        return await mockIpcRenderer.invoke('save-custom-commands', commands);
      };

      const commands = [
        { id: '1', name: 'Test', shellCommand: 'npm test' },
        { id: '2', name: 'Build', shellCommand: 'npm run build' }
      ];

      const result = await saveCommands(commands);
      
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-custom-commands', commands);
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(2);
    });

    test('should load commands from storage', async () => {
      const mockCommands = [
        { id: '1', name: 'Test', shellCommand: 'npm test' },
        { id: '2', name: 'Build', shellCommand: 'npm run build' }
      ];

      mockIpcRenderer.invoke.mockResolvedValueOnce(mockCommands);

      const loadCommands = async () => {
        return await mockIpcRenderer.invoke('get-custom-commands');
      };

      const commands = await loadCommands();
      
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-custom-commands');
      expect(commands).toEqual(mockCommands);
      expect(commands).toHaveLength(2);
    });

    test('should handle storage errors gracefully', async () => {
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Storage error'));

      const loadCommands = async () => {
        try {
          return await mockIpcRenderer.invoke('get-custom-commands');
        } catch (error) {
          console.error('Failed to load commands:', error);
          return [];
        }
      };

      const commands = await loadCommands();
      expect(commands).toEqual([]);
    });
  });

  describe('Command Operations', () => {
    let commands;

    beforeEach(() => {
      commands = [
        { id: '1', name: 'Test', shellCommand: 'npm test', description: 'Run tests', icon: '🧪' },
        { id: '2', name: 'Build', shellCommand: 'npm run build', description: 'Build app', icon: '🏗️' }
      ];
    });

    test('should add new command', () => {
      const addCommand = (commands, newCommand) => {
        return [...commands, { ...newCommand, id: Date.now().toString() }];
      };

      const newCommand = { name: 'Deploy', shellCommand: 'npm run deploy', description: 'Deploy app', icon: '🚀' };
      const updatedCommands = addCommand(commands, newCommand);

      expect(updatedCommands).toHaveLength(3);
      expect(updatedCommands[2].name).toBe('Deploy');
      expect(updatedCommands[2].id).toBeDefined();
    });

    test('should update existing command', () => {
      const updateCommand = (commands, commandId, updates) => {
        return commands.map(cmd => 
          cmd.id === commandId ? { ...cmd, ...updates } : cmd
        );
      };

      const updatedCommands = updateCommand(commands, '1', { name: 'Unit Tests', icon: '✅' });

      expect(updatedCommands[0].name).toBe('Unit Tests');
      expect(updatedCommands[0].icon).toBe('✅');
      expect(updatedCommands[0].shellCommand).toBe('npm test'); // Unchanged
    });

    test('should delete command', () => {
      const deleteCommand = (commands, commandId) => {
        return commands.filter(cmd => cmd.id !== commandId);
      };

      const updatedCommands = deleteCommand(commands, '1');

      expect(updatedCommands).toHaveLength(1);
      expect(updatedCommands[0].id).toBe('2');
      expect(updatedCommands.some(cmd => cmd.id === '1')).toBe(false);
    });

    test('should find command by id', () => {
      const findCommand = (commands, commandId) => {
        return commands.find(cmd => cmd.id === commandId);
      };

      const command = findCommand(commands, '2');
      expect(command).toBeDefined();
      expect(command.name).toBe('Build');

      const nonExistentCommand = findCommand(commands, '999');
      expect(nonExistentCommand).toBeUndefined();
    });

    test('should search commands by name', () => {
      const searchCommands = (commands, query) => {
        return commands.filter(cmd => 
          cmd.name.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
        );
      };

      const testResults = searchCommands(commands, 'test');
      expect(testResults).toHaveLength(1);
      expect(testResults[0].name).toBe('Test');

      const buildResults = searchCommands(commands, 'build');
      expect(buildResults).toHaveLength(1);
      expect(buildResults[0].name).toBe('Build');

      const appResults = searchCommands(commands, 'app');
      expect(appResults).toHaveLength(1);
      expect(appResults[0].name).toBe('Build'); // Matches description "Build app"
    });
  });

  describe('Command Execution', () => {
    test('should prepare command for execution', () => {
      const prepareCommand = (command, projectPath) => {
        const workingDirectory = projectPath || process.cwd();
        return {
          command: command.shellCommand,
          workingDirectory,
          name: command.name,
          icon: command.icon
        };
      };

      const command = { 
        name: 'Test', 
        shellCommand: 'npm test', 
        icon: '🧪' 
      };

      const prepared = prepareCommand(command, '/project/path');
      
      expect(prepared.command).toBe('npm test');
      expect(prepared.workingDirectory).toBe('/project/path');
      expect(prepared.name).toBe('Test');
      expect(prepared.icon).toBe('🧪');
    });

    test('should use current directory when no project path', () => {
      const prepareCommand = (command, projectPath) => {
        const workingDirectory = projectPath || process.cwd();
        return {
          command: command.shellCommand,
          workingDirectory,
          name: command.name,
          icon: command.icon
        };
      };

      const command = { 
        name: 'Test', 
        shellCommand: 'npm test', 
        icon: '🧪' 
      };

      const prepared = prepareCommand(command);
      expect(prepared.workingDirectory).toBe(process.cwd());
    });

    test('should validate command before execution', () => {
      const canExecuteCommand = (command, hasProject) => {
        if (!command || !command.shellCommand) {
          return { canExecute: false, reason: 'Invalid command' };
        }

        const requiresProject = ['npm', 'flutter', 'python', 'git'].some(tool => 
          command.shellCommand.startsWith(tool)
        );

        if (requiresProject && !hasProject) {
          return { canExecute: false, reason: 'Command requires a project to be selected' };
        }

        return { canExecute: true };
      };

      const npmCommand = { shellCommand: 'npm test' };
      const genericCommand = { shellCommand: 'echo hello' };

      expect(canExecuteCommand(npmCommand, true).canExecute).toBe(true);
      expect(canExecuteCommand(npmCommand, false).canExecute).toBe(false);
      expect(canExecuteCommand(genericCommand, false).canExecute).toBe(true);
      expect(canExecuteCommand(null, true).canExecute).toBe(false);
    });
  });
});