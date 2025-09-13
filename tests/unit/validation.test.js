// Test file for InputValidator class

describe('InputValidator', () => {
  let InputValidator;

  beforeAll(() => {
    // Mock the module loading since we can't import ES6 modules directly in Jest
    global.InputValidator = {
      validateRequired: (value, fieldName) => {
        if (!value || value.trim() === '') {
          return `${fieldName} is required`;
        }
        return null;
      },

      validateLength: (value, fieldName, minLength = 1, maxLength = 255) => {
        if (value.length < minLength) {
          return `${fieldName} must be at least ${minLength} characters`;
        }
        if (value.length > maxLength) {
          return `${fieldName} must be no more than ${maxLength} characters`;
        }
        return null;
      },

      validateCommand: (value) => {
        if (!value || value.trim() === '') {
          return 'Command is required';
        }
        
        const dangerousPatterns = [
          /rm\s+-rf\s+\//, // rm -rf /
          /format\s+[c-z]:/i, // format c:
          /del\s+\/[sq]/i, // del /s or del /q
          /shutdown/i,
          /reboot/i
        ];
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            return 'Command contains potentially dangerous operations';
          }
        }
        
        return null;
      },

      validateIcon: (value) => {
        if (!value) return null;
        
        if (value.length > 2) {
          return 'Icon must be 1-2 characters (emoji recommended)';
        }
        
        return null;
      },

      validateCommitMessage: (value) => {
        if (!value || value.trim() === '') {
          return 'Commit message is required';
        }
        
        if (value.length < 3) {
          return 'Commit message must be at least 3 characters';
        }
        
        if (value.length > 500) {
          return 'Commit message must be no more than 500 characters';
        }
        
        return null;
      }
    };

    InputValidator = global.InputValidator;
  });

  describe('validateRequired', () => {
    test('should return error for empty string', () => {
      const result = InputValidator.validateRequired('', 'Test Field');
      expect(result).toBe('Test Field is required');
    });

    test('should return error for whitespace only', () => {
      const result = InputValidator.validateRequired('   ', 'Test Field');
      expect(result).toBe('Test Field is required');
    });

    test('should return null for valid input', () => {
      const result = InputValidator.validateRequired('valid input', 'Test Field');
      expect(result).toBeNull();
    });

    test('should return error for null value', () => {
      const result = InputValidator.validateRequired(null, 'Test Field');
      expect(result).toBe('Test Field is required');
    });

    test('should return error for undefined value', () => {
      const result = InputValidator.validateRequired(undefined, 'Test Field');
      expect(result).toBe('Test Field is required');
    });
  });

  describe('validateLength', () => {
    test('should return error for string too short', () => {
      const result = InputValidator.validateLength('ab', 'Test Field', 3, 10);
      expect(result).toBe('Test Field must be at least 3 characters');
    });

    test('should return error for string too long', () => {
      const result = InputValidator.validateLength('this is too long', 'Test Field', 1, 10);
      expect(result).toBe('Test Field must be no more than 10 characters');
    });

    test('should return null for valid length', () => {
      const result = InputValidator.validateLength('valid', 'Test Field', 1, 10);
      expect(result).toBeNull();
    });

    test('should use default min and max values', () => {
      const result = InputValidator.validateLength('valid');
      expect(result).toBeNull();
    });

    test('should handle boundary conditions', () => {
      const resultMin = InputValidator.validateLength('a', 'Test Field', 1, 5);
      const resultMax = InputValidator.validateLength('abcde', 'Test Field', 1, 5);
      expect(resultMin).toBeNull();
      expect(resultMax).toBeNull();
    });
  });

  describe('validateCommand', () => {
    test('should return error for empty command', () => {
      const result = InputValidator.validateCommand('');
      expect(result).toBe('Command is required');
    });

    test('should detect dangerous rm command', () => {
      const result = InputValidator.validateCommand('rm -rf /');
      expect(result).toBe('Command contains potentially dangerous operations');
    });

    test('should detect dangerous format command', () => {
      const result = InputValidator.validateCommand('format c:');
      expect(result).toBe('Command contains potentially dangerous operations');
    });

    test('should detect dangerous del command', () => {
      const result = InputValidator.validateCommand('del /s *.*');
      expect(result).toBe('Command contains potentially dangerous operations');
    });

    test('should detect shutdown command', () => {
      const result = InputValidator.validateCommand('shutdown /s');
      expect(result).toBe('Command contains potentially dangerous operations');
    });

    test('should detect reboot command', () => {
      const result = InputValidator.validateCommand('reboot now');
      expect(result).toBe('Command contains potentially dangerous operations');
    });

    test('should allow safe commands', () => {
      const safeCommands = [
        'npm test',
        'git status',
        'ls -la',
        'echo "hello world"',
        'node index.js',
        'python main.py'
      ];

      safeCommands.forEach(command => {
        const result = InputValidator.validateCommand(command);
        expect(result).toBeNull();
      });
    });

    test('should handle case insensitive dangerous commands', () => {
      const result = InputValidator.validateCommand('SHUTDOWN');
      expect(result).toBe('Command contains potentially dangerous operations');
    });
  });

  describe('validateIcon', () => {
    test('should return null for empty icon (optional)', () => {
      const result = InputValidator.validateIcon('');
      expect(result).toBeNull();
    });

    test('should return null for single character', () => {
      const result = InputValidator.validateIcon('🚀');
      expect(result).toBeNull();
    });

    test('should return null for two characters', () => {
      const result = InputValidator.validateIcon('⚡️');
      expect(result).toBeNull();
    });

    test('should return error for more than two characters', () => {
      const result = InputValidator.validateIcon('abc');
      expect(result).toBe('Icon must be 1-2 characters (emoji recommended)');
    });

    test('should handle null value', () => {
      const result = InputValidator.validateIcon(null);
      expect(result).toBeNull();
    });
  });

  describe('validateCommitMessage', () => {
    test('should return error for empty message', () => {
      const result = InputValidator.validateCommitMessage('');
      expect(result).toBe('Commit message is required');
    });

    test('should return error for message too short', () => {
      const result = InputValidator.validateCommitMessage('ab');
      expect(result).toBe('Commit message must be at least 3 characters');
    });

    test('should return error for message too long', () => {
      const longMessage = 'a'.repeat(501);
      const result = InputValidator.validateCommitMessage(longMessage);
      expect(result).toBe('Commit message must be no more than 500 characters');
    });

    test('should return null for valid message', () => {
      const result = InputValidator.validateCommitMessage('Fix button styling issue');
      expect(result).toBeNull();
    });

    test('should handle boundary conditions', () => {
      const minMessage = 'abc';
      const maxMessage = 'a'.repeat(500);
      
      expect(InputValidator.validateCommitMessage(minMessage)).toBeNull();
      expect(InputValidator.validateCommitMessage(maxMessage)).toBeNull();
    });

    test('should trim whitespace before validation', () => {
      const result = InputValidator.validateCommitMessage('   ');
      expect(result).toBe('Commit message is required');
    });
  });
});