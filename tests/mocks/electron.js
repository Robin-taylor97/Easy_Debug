// Mock Electron modules for testing

const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  send: jest.fn(),
  removeAllListeners: jest.fn()
};

const mockShell = {
  openPath: jest.fn().mockResolvedValue('')
};

const mockDialog = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
  showErrorBox: jest.fn()
};

const mockBrowserWindow = {
  getAllWindows: jest.fn(() => []),
  getFocusedWindow: jest.fn(() => null)
};

const mockApp = {
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  on: jest.fn(),
  getPath: jest.fn((name) => {
    const paths = {
      home: '/mock/home',
      userData: '/mock/userdata',
      temp: '/mock/temp'
    };
    return paths[name] || '/mock/default';
  })
};

module.exports = {
  ipcRenderer: mockIpcRenderer,
  shell: mockShell,
  dialog: mockDialog,
  BrowserWindow: mockBrowserWindow,
  app: mockApp
};