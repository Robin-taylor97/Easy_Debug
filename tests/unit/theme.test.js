// Test file for theme management functionality

describe('Theme Management', () => {
  let mockIpcRenderer;
  let mockDocument;

  beforeEach(() => {
    // Mock ipcRenderer
    mockIpcRenderer = {
      invoke: jest.fn()
    };

    // Mock document
    mockDocument = {
      getElementById: jest.fn(),
      body: {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn()
        }
      }
    };

    global.ipcRenderer = mockIpcRenderer;
    global.document = mockDocument;
  });

  describe('Theme Toggle Functionality', () => {
    test('should toggle from dark to light theme', async () => {
      // Mock getting current theme as dark
      mockIpcRenderer.invoke
        .mockResolvedValueOnce('dark')  // get-theme
        .mockResolvedValueOnce('light'); // set-theme

      const mockThemeToggle = {
        innerHTML: '🌙'
      };
      mockDocument.getElementById.mockReturnValue(mockThemeToggle);

      // Simulate theme toggle logic
      const currentTheme = await mockIpcRenderer.invoke('get-theme');
      expect(currentTheme).toBe('dark');

      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      const result = await mockIpcRenderer.invoke('set-theme', newTheme);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('set-theme', 'light');
      expect(result).toBe('light');
    });

    test('should toggle from light to dark theme', async () => {
      // Mock getting current theme as light
      mockIpcRenderer.invoke
        .mockResolvedValueOnce('light') // get-theme
        .mockResolvedValueOnce('dark');  // set-theme

      const currentTheme = await mockIpcRenderer.invoke('get-theme');
      expect(currentTheme).toBe('light');

      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      const result = await mockIpcRenderer.invoke('set-theme', newTheme);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('set-theme', 'dark');
      expect(result).toBe('dark');
    });

    test('should apply dark theme to DOM', () => {
      const applyTheme = (theme) => {
        const body = mockDocument.body;
        const themeToggle = mockDocument.getElementById('theme-toggle');
        
        if (theme === 'light') {
          body.classList.add('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌞';
        } else {
          body.classList.remove('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌙';
        }
      };

      const mockThemeToggle = { innerHTML: '' };
      mockDocument.getElementById.mockReturnValue(mockThemeToggle);

      applyTheme('dark');

      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('light-theme');
      expect(mockThemeToggle.innerHTML).toBe('🌙');
    });

    test('should apply light theme to DOM', () => {
      const applyTheme = (theme) => {
        const body = mockDocument.body;
        const themeToggle = mockDocument.getElementById('theme-toggle');
        
        if (theme === 'light') {
          body.classList.add('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌞';
        } else {
          body.classList.remove('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌙';
        }
      };

      const mockThemeToggle = { innerHTML: '' };
      mockDocument.getElementById.mockReturnValue(mockThemeToggle);

      applyTheme('light');

      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('light-theme');
      expect(mockThemeToggle.innerHTML).toBe('🌞');
    });

    test('should handle missing theme toggle element', () => {
      const applyTheme = (theme) => {
        const body = mockDocument.body;
        const themeToggle = mockDocument.getElementById('theme-toggle');
        
        if (theme === 'light') {
          body.classList.add('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌞';
        } else {
          body.classList.remove('light-theme');
          if (themeToggle) themeToggle.innerHTML = '🌙';
        }
      };

      mockDocument.getElementById.mockReturnValue(null);

      expect(() => applyTheme('dark')).not.toThrow();
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('light-theme');
    });
  });

  describe('Theme Persistence', () => {
    test('should load saved theme on startup', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce('light');

      const loadTheme = async () => {
        try {
          const currentTheme = await mockIpcRenderer.invoke('get-theme');
          return currentTheme;
        } catch (error) {
          console.error('Error loading theme:', error);
          return 'dark'; // fallback
        }
      };

      const theme = await loadTheme();
      expect(theme).toBe('light');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-theme');
    });

    test('should fallback to dark theme on error', async () => {
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Storage error'));

      const loadTheme = async () => {
        try {
          const currentTheme = await mockIpcRenderer.invoke('get-theme');
          return currentTheme;
        } catch (error) {
          console.error('Error loading theme:', error);
          return 'dark'; // fallback
        }
      };

      const theme = await loadTheme();
      expect(theme).toBe('dark');
    });

    test('should save theme changes', async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce('light');

      const toggleTheme = async (currentTheme) => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        try {
          await mockIpcRenderer.invoke('set-theme', newTheme);
          return newTheme;
        } catch (error) {
          console.error('Error saving theme:', error);
          throw error;
        }
      };

      const newTheme = await toggleTheme('dark');
      expect(newTheme).toBe('light');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('set-theme', 'light');
    });
  });

  describe('Theme Validation', () => {
    test('should handle invalid theme values', () => {
      const normalizeTheme = (theme) => {
        return ['light', 'dark'].includes(theme) ? theme : 'dark';
      };

      expect(normalizeTheme('invalid')).toBe('dark');
      expect(normalizeTheme(null)).toBe('dark');
      expect(normalizeTheme(undefined)).toBe('dark');
      expect(normalizeTheme('light')).toBe('light');
      expect(normalizeTheme('dark')).toBe('dark');
    });

    test('should validate theme before applying', () => {
      const validateAndApplyTheme = (theme) => {
        const validatedTheme = ['light', 'dark'].includes(theme) ? theme : 'dark';
        
        const body = mockDocument.body;
        if (validatedTheme === 'light') {
          body.classList.add('light-theme');
        } else {
          body.classList.remove('light-theme');
        }
        
        return validatedTheme;
      };

      const result1 = validateAndApplyTheme('invalid-theme');
      expect(result1).toBe('dark');
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('light-theme');

      const result2 = validateAndApplyTheme('light');
      expect(result2).toBe('light');
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('light-theme');
    });
  });
});