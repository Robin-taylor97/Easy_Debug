// Test setup and global configurations

// Mock DOM elements that might be needed in tests
global.document = {
  getElementById: jest.fn(() => ({
    value: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    addEventListener: jest.fn(),
    focus: jest.fn()
  })),
  body: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    }
  },
  createElement: jest.fn(() => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    style: {},
    appendChild: jest.fn()
  }))
};

global.window = {
  addEventListener: jest.fn()
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Set up Jest to clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});