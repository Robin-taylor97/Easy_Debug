module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  collectCoverageFrom: [
    'renderer/scripts/**/*.js',
    'main.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^electron$': '<rootDir>/tests/mocks/electron.js'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 10000
};