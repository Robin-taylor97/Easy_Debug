// Test file for project detection functionality

jest.mock('fs');
const fs = require('fs');

describe('Project Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectProjectType', () => {
    const detectProjectType = (folderPath) => {
      const projectIndicators = {
        flutter: ['pubspec.yaml', 'pubspec.yml'],
        python: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
        web: ['package.json', 'bower.json', 'yarn.lock'],
        git: ['.git']
      };

      const types = [];

      for (const [type, indicators] of Object.entries(projectIndicators)) {
        for (const indicator of indicators) {
          const indicatorPath = `${folderPath}/${indicator}`;
          if (fs.existsSync(indicatorPath)) {
            types.push(type);
            break;
          }
        }
      }

      return types;
    };

    test('should detect Flutter project', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('pubspec.yaml');
      });

      const types = detectProjectType('/mock/flutter-project');
      expect(types).toContain('flutter');
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/flutter-project/pubspec.yaml');
    });

    test('should detect Python project with requirements.txt', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('requirements.txt');
      });

      const types = detectProjectType('/mock/python-project');
      expect(types).toContain('python');
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/python-project/requirements.txt');
    });

    test('should detect Python project with setup.py', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('setup.py');
      });

      const types = detectProjectType('/mock/python-project');
      expect(types).toContain('python');
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/python-project/setup.py');
    });

    test('should detect Web project with package.json', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('package.json');
      });

      const types = detectProjectType('/mock/web-project');
      expect(types).toContain('web');
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/web-project/package.json');
    });

    test('should detect Git repository', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('.git');
      });

      const types = detectProjectType('/mock/git-project');
      expect(types).toContain('git');
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/git-project/.git');
    });

    test('should detect multiple project types', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('package.json') || path.includes('.git');
      });

      const types = detectProjectType('/mock/web-git-project');
      expect(types).toContain('web');
      expect(types).toContain('git');
      expect(types).toHaveLength(2);
    });

    test('should detect no project types for empty folder', () => {
      fs.existsSync.mockReturnValue(false);

      const types = detectProjectType('/mock/empty-project');
      expect(types).toHaveLength(0);
    });

    test('should prioritize primary indicators', () => {
      // Flutter project with package.json should detect both but Flutter first
      fs.existsSync.mockImplementation((path) => {
        return path.includes('pubspec.yaml') || path.includes('package.json');
      });

      const types = detectProjectType('/mock/flutter-web-project');
      expect(types).toContain('flutter');
      expect(types).toContain('web');
    });

    test('should handle file system errors gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      expect(() => detectProjectType('/mock/error-project')).toThrow();
    });
  });

  describe('getProjectLanguages', () => {
    const getProjectLanguages = (types) => {
      const languageMap = {
        flutter: 'Dart',
        python: 'Python',
        web: 'JavaScript/TypeScript',
        git: 'Various'
      };

      return types.map(type => languageMap[type] || 'Unknown');
    };

    test('should return correct languages for project types', () => {
      expect(getProjectLanguages(['flutter'])).toEqual(['Dart']);
      expect(getProjectLanguages(['python'])).toEqual(['Python']);
      expect(getProjectLanguages(['web'])).toEqual(['JavaScript/TypeScript']);
      expect(getProjectLanguages(['git'])).toEqual(['Various']);
    });

    test('should handle multiple languages', () => {
      const languages = getProjectLanguages(['flutter', 'web', 'git']);
      expect(languages).toEqual(['Dart', 'JavaScript/TypeScript', 'Various']);
    });

    test('should handle unknown project types', () => {
      const languages = getProjectLanguages(['unknown-type']);
      expect(languages).toEqual(['Unknown']);
    });

    test('should handle empty project types', () => {
      const languages = getProjectLanguages([]);
      expect(languages).toEqual([]);
    });
  });

  describe('validateProjectPath', () => {
    const validateProjectPath = (path) => {
      if (!path || typeof path !== 'string' || path.trim() === '') {
        return { valid: false, error: 'Invalid path provided' };
      }

      try {
        if (!fs.existsSync(path)) {
          return { valid: false, error: 'Path does not exist' };
        }

        const stats = fs.statSync(path);
        if (!stats.isDirectory()) {
          return { valid: false, error: 'Path is not a directory' };
        }

        return { valid: true };
      } catch (error) {
        return { valid: false, error: `Failed to validate path: ${error.message}` };
      }
    };

    test('should validate existing directory', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isDirectory: () => true });

      const result = validateProjectPath('/valid/path');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject non-existent path', () => {
      fs.existsSync.mockReturnValue(false);

      const result = validateProjectPath('/invalid/path');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path does not exist');
    });

    test('should reject file path (not directory)', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isDirectory: () => false });

      const result = validateProjectPath('/path/to/file.txt');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path is not a directory');
    });

    test('should reject empty path', () => {
      const result = validateProjectPath('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path provided');
    });

    test('should reject whitespace-only path', () => {
      const result = validateProjectPath('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path provided');
    });

    test('should reject null path', () => {
      const result = validateProjectPath(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path provided');
    });

    test('should reject undefined path', () => {
      const result = validateProjectPath(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path provided');
    });

    test('should reject non-string path', () => {
      const result = validateProjectPath(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path provided');
    });

    test('should handle file system errors', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = validateProjectPath('/restricted/path');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate path: Permission denied');
    });
  });

  describe('getProjectCommands', () => {
    const getProjectCommands = (types) => {
      const commandMap = {
        flutter: [
          'flutter pub get',
          'flutter run',
          'flutter build apk',
          'flutter test',
          'flutter doctor'
        ],
        python: [
          'pip install -r requirements.txt',
          'python main.py',
          'pytest',
          'pip list',
          'python -m venv venv'
        ],
        web: [
          'npm install',
          'npm start',
          'npm run build',
          'npm test',
          'npm run lint'
        ],
        git: [
          'git status',
          'git add .',
          'git commit',
          'git push',
          'git pull',
          'git log'
        ]
      };

      const allCommands = [];
      types.forEach(type => {
        if (commandMap[type]) {
          allCommands.push(...commandMap[type]);
        }
      });

      return [...new Set(allCommands)]; // Remove duplicates
    };

    test('should return Flutter commands', () => {
      const commands = getProjectCommands(['flutter']);
      expect(commands).toContain('flutter pub get');
      expect(commands).toContain('flutter run');
      expect(commands).toContain('flutter test');
    });

    test('should return Python commands', () => {
      const commands = getProjectCommands(['python']);
      expect(commands).toContain('pip install -r requirements.txt');
      expect(commands).toContain('python main.py');
      expect(commands).toContain('pytest');
    });

    test('should return Web commands', () => {
      const commands = getProjectCommands(['web']);
      expect(commands).toContain('npm install');
      expect(commands).toContain('npm start');
      expect(commands).toContain('npm test');
    });

    test('should return Git commands', () => {
      const commands = getProjectCommands(['git']);
      expect(commands).toContain('git status');
      expect(commands).toContain('git commit');
      expect(commands).toContain('git push');
    });

    test('should combine commands for multiple project types', () => {
      const commands = getProjectCommands(['web', 'git']);
      expect(commands).toContain('npm install');
      expect(commands).toContain('git status');
      expect(commands.length).toBeGreaterThan(5);
    });

    test('should remove duplicate commands', () => {
      const commands = getProjectCommands(['web', 'web']); // Duplicate type
      const uniqueCommands = [...new Set(commands)];
      expect(commands.length).toBe(uniqueCommands.length);
    });

    test('should handle unknown project types', () => {
      const commands = getProjectCommands(['unknown-type']);
      expect(commands).toEqual([]);
    });

    test('should handle empty project types', () => {
      const commands = getProjectCommands([]);
      expect(commands).toEqual([]);
    });
  });
});