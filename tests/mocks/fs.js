// Mock fs module for testing

const mockFs = {
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => 'mock file content'),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({
    isDirectory: () => false,
    isFile: () => true
  }))
};

module.exports = mockFs;