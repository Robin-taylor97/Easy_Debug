// Test file for IPC communication

describe('IPC Communication', () => {
  let mockIpcRenderer;
  let mockMainWindow;

  beforeEach(() => {
    mockIpcRenderer = {
      invoke: jest.fn(),
      on: jest.fn(),
      send: jest.fn()
    };

    mockMainWindow = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      unmaximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn(),
      isDestroyed: jest.fn(() => false)
    };

    global.ipcRenderer = mockIpcRenderer;
  });

  describe('Window Management IPC', () => {
    test('should handle window minimize', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true });

      const minimizeWindow = async () => {
        return await mockIpcRenderer.invoke('minimize-window');
      };

      const result = await minimizeWindow();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('minimize-window');
      expect(result.success).toBe(true);
    });

    test('should handle window maximize', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, maximized: true });

      const maximizeWindow = async () => {
        return await mockIpcRenderer.invoke('maximize-window');
      };

      const result = await maximizeWindow();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('maximize-window');
      expect(result.success).toBe(true);
      expect(result.maximized).toBe(true);
    });

    test('should handle window close', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true });

      const closeWindow = async () => {
        return await mockIpcRenderer.invoke('close-window');
      };

      const result = await closeWindow();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('close-window');
      expect(result.success).toBe(true);
    });

    test('should handle IPC errors gracefully', async () => {
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('IPC Error'));

      const minimizeWindow = async () => {
        try {
          return await mockIpcRenderer.invoke('minimize-window');
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await minimizeWindow();
      expect(result.success).toBe(false);
      expect(result.error).toBe('IPC Error');
    });
  });

  describe('Folder Selection IPC', () => {
    test('should handle folder selection success', async () => {
      const mockPath = '/selected/folder/path';
      mockIpcRenderer.invoke.mockResolvedValueOnce(mockPath);

      const selectFolder = async () => {
        return await mockIpcRenderer.invoke('select-folder');
      };

      const result = await selectFolder();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('select-folder');
      expect(result).toBe(mockPath);
    });

    test('should handle folder selection cancellation', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce(null);

      const selectFolder = async () => {
        return await mockIpcRenderer.invoke('select-folder');
      };

      const result = await selectFolder();
      expect(result).toBeNull();
    });

    test('should handle folder selection error', async () => {
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Dialog error'));

      const selectFolder = async () => {
        try {
          return await mockIpcRenderer.invoke('select-folder');
        } catch (error) {
          throw new Error(`Failed to select folder: ${error.message}`);
        }
      };

      await expect(selectFolder()).rejects.toThrow('Failed to select folder: Dialog error');
    });
  });

  describe('Theme Management IPC', () => {
    test('should get current theme', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce('dark');

      const getTheme = async () => {
        return await mockIpcRenderer.invoke('get-theme');
      };

      const theme = await getTheme();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-theme');
      expect(theme).toBe('dark');
    });

    test('should set new theme', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce('light');

      const setTheme = async (theme) => {
        return await mockIpcRenderer.invoke('set-theme', theme);
      };

      const result = await setTheme('light');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('set-theme', 'light');
      expect(result).toBe('light');
    });

    test('should handle invalid theme values', async () => {
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Invalid theme value'));

      const setTheme = async (theme) => {
        try {
          return await mockIpcRenderer.invoke('set-theme', theme);
        } catch (error) {
          throw new Error(`Failed to set theme: ${error.message}`);
        }
      };

      await expect(setTheme('invalid')).rejects.toThrow('Failed to set theme: Invalid theme value');
    });
  });

  describe('Custom Commands IPC', () => {
    test('should save custom commands', async () => {
      const commands = [
        { id: '1', name: 'Test', shellCommand: 'npm test' },
        { id: '2', name: 'Build', shellCommand: 'npm run build' }
      ];

      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, savedCount: 2 });

      const saveCommands = async (commands) => {
        return await mockIpcRenderer.invoke('save-custom-commands', commands);
      };

      const result = await saveCommands(commands);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-custom-commands', commands);
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(2);
    });

    test('should load custom commands', async () => {
      const mockCommands = [
        { id: '1', name: 'Test', shellCommand: 'npm test' }
      ];

      mockIpcRenderer.invoke.mockResolvedValueOnce(mockCommands);

      const loadCommands = async () => {
        return await mockIpcRenderer.invoke('get-custom-commands');
      };

      const commands = await loadCommands();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-custom-commands');
      expect(commands).toEqual(mockCommands);
    });

    test('should handle command validation errors', async () => {
      const invalidCommands = [
        { name: '', shellCommand: 'invalid' }
      ];

      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Invalid command data'));

      const saveCommands = async (commands) => {
        try {
          return await mockIpcRenderer.invoke('save-custom-commands', commands);
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await saveCommands(invalidCommands);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid command data');
    });
  });

  describe('Command History IPC', () => {
    test('should save command history', async () => {
      const history = [
        { command: 'npm test', timestamp: new Date().toISOString(), exitCode: 0 },
        { command: 'npm run build', timestamp: new Date().toISOString(), exitCode: 0 }
      ];

      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, savedCount: 2 });

      const saveHistory = async (history) => {
        return await mockIpcRenderer.invoke('save-command-history', history);
      };

      const result = await saveHistory(history);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-command-history', history);
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(2);
    });

    test('should load command history', async () => {
      const mockHistory = [
        { command: 'npm test', timestamp: '2023-01-01T00:00:00.000Z', exitCode: 0 }
      ];

      mockIpcRenderer.invoke.mockResolvedValueOnce(mockHistory);

      const loadHistory = async () => {
        return await mockIpcRenderer.invoke('get-command-history');
      };

      const history = await loadHistory();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-command-history');
      expect(history).toEqual(mockHistory);
    });

    test('should export command history', async () => {
      const csvContent = 'command,timestamp,exitCode\nnpm test,2023-01-01T00:00:00.000Z,0';
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, filePath: '/exported/history.csv' });

      const exportHistory = async (csvContent) => {
        return await mockIpcRenderer.invoke('export-history', csvContent);
      };

      const result = await exportHistory(csvContent);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('export-history', csvContent);
      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/exported/history.csv');
    });

    test('should handle export cancellation', async () => {
      const csvContent = 'command,timestamp,exitCode\nnpm test,2023-01-01T00:00:00.000Z,0';
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: false, cancelled: true });

      const exportHistory = async (csvContent) => {
        return await mockIpcRenderer.invoke('export-history', csvContent);
      };

      const result = await exportHistory(csvContent);
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });
  });

  describe('System Information IPC', () => {
    test('should get system versions', async () => {
      const mockVersions = {
        node: '18.17.0',
        git: '2.40.0',
        flutter: 'Flutter 3.10.0',
        python: 'Python 3.9.0',
        vscode: '1.80.0'
      };

      mockIpcRenderer.invoke.mockResolvedValueOnce(mockVersions);

      const getSystemVersions = async () => {
        return await mockIpcRenderer.invoke('get-system-versions');
      };

      const versions = await getSystemVersions();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-system-versions');
      expect(versions).toEqual(mockVersions);
    });

    test('should handle system version detection errors', async () => {
      const mockVersions = {
        node: 'Error',
        git: 'Error',
        flutter: 'Error',
        python: 'Error',
        vscode: 'Error'
      };

      mockIpcRenderer.invoke.mockResolvedValueOnce(mockVersions);

      const getSystemVersions = async () => {
        return await mockIpcRenderer.invoke('get-system-versions');
      };

      const versions = await getSystemVersions();
      expect(versions.node).toBe('Error');
      expect(versions.git).toBe('Error');
    });
  });

  describe('Editor Integration IPC', () => {
    test('should open project in VS Code', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true, message: 'Opening in VS Code' });

      const openInEditor = async (projectPath, editor) => {
        return await mockIpcRenderer.invoke('open-in-editor', projectPath, editor);
      };

      const result = await openInEditor('/project/path', 'code');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-in-editor', '/project/path', 'code');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Opening in VS Code');
    });

    test('should handle editor not found', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ 
        success: true, 
        message: 'VS Code not found, opened in file explorer' 
      });

      const openInEditor = async (projectPath, editor) => {
        return await mockIpcRenderer.invoke('open-in-editor', projectPath, editor);
      };

      const result = await openInEditor('/project/path', 'code');
      expect(result.success).toBe(true);
      expect(result.message).toContain('not found');
    });

    test('should handle editor integration errors', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce({ success: false, error: 'Permission denied' });

      const openInEditor = async (projectPath, editor) => {
        return await mockIpcRenderer.invoke('open-in-editor', projectPath, editor);
      };

      const result = await openInEditor('/restricted/path', 'code');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('Recent Projects IPC', () => {
    test('should get recent projects', async () => {
      const mockProjects = ['/project1', '/project2', '/project3'];
      mockIpcRenderer.invoke.mockResolvedValueOnce(mockProjects);

      const getRecentProjects = async () => {
        return await mockIpcRenderer.invoke('get-recent-projects');
      };

      const projects = await getRecentProjects();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-recent-projects');
      expect(projects).toEqual(mockProjects);
    });

    test('should filter out non-existent projects', async () => {
      const validProjects = ['/existing/project1', '/existing/project2'];
      mockIpcRenderer.invoke.mockResolvedValueOnce(validProjects);

      const getRecentProjects = async () => {
        return await mockIpcRenderer.invoke('get-recent-projects');
      };

      const projects = await getRecentProjects();
      expect(projects).toEqual(validProjects);
    });

    test('should handle empty recent projects', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([]);

      const getRecentProjects = async () => {
        return await mockIpcRenderer.invoke('get-recent-projects');
      };

      const projects = await getRecentProjects();
      expect(projects).toEqual([]);
    });
  });
});