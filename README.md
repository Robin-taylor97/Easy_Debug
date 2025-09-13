# Easy Debug

> A modern cross-platform Electron desktop application for debugging and managing development projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-blue.svg)](https://electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

![Easy Debug Screenshot](docs/images/easy-debug-screenshot.png)

## ✨ Features

### 🚀 **Multi-Technology Support**
- **Flutter Development**: Complete toolkit with pub get, run, build, test, and doctor commands
- **Python Projects**: Requirements management, virtual environments, testing, and execution
- **Web Development**: npm/yarn workflows, building, testing, and linting
- **Git Integration**: Full git workflow with status, commit, push, pull, and log operations

### 🖥️ **Cross-Platform Terminal**
- Integrated terminal with xterm.js
- Multiple terminal tabs support
- Real-time command execution
- Cross-platform shell compatibility (PowerShell, bash, zsh, fish)

### 🎨 **Modern Interface**
- Dark/Light theme toggle
- Resizable panels with drag-to-resize
- System tray integration
- Toast notifications
- Responsive design

### 🛠️ **Developer Tools**
- Project type auto-detection
- Recent projects quick access
- Custom command management
- Command history with search
- System version detection
- VS Code integration

### ⚡ **Performance Optimized**
- Memory leak prevention
- DOM caching and virtual scrolling
- Debounced user interactions
- Webpack bundling for production
- Cross-platform testing framework

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM
- **Storage**: 500MB available space
- **Node.js**: 18.0.0 or higher

### Recommended
- **Memory**: 8GB RAM
- **Storage**: 1GB available space
- **Display**: 1920x1080 resolution

### Supported Platforms
- **Windows**: 10, 11 (x64, ARM64)
- **macOS**: 10.15+ (Intel, Apple Silicon)
- **Linux**: Ubuntu, Debian, Fedora, Arch Linux, openSUSE

## 🚀 Quick Start

### Installation

#### Option 1: Download Pre-built Binaries
1. Visit the [Releases page](https://github.com/your-username/easy-debug/releases)
2. Download the appropriate installer for your platform:
   - **Windows**: `Easy-Debug-Setup-1.0.0.exe`
   - **macOS**: `Easy-Debug-1.0.0.dmg`
   - **Linux**: `Easy-Debug-1.0.0.AppImage`
3. Run the installer and follow the setup wizard

#### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/your-username/easy-debug.git
cd easy-debug

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

### First Launch
1. **Select a Project Folder**: Click the folder icon to browse and select your project directory
2. **Project Detection**: Easy Debug automatically detects project types (Flutter, Python, Web, Git)
3. **Start Debugging**: Use the command buttons in the left panel or the integrated terminal

## 📖 User Guide

### Getting Started

#### Project Selection
1. Click the **📁 Select Folder** button in the top-left corner
2. Navigate to your project directory
3. Easy Debug will automatically detect the project type based on files:
   - **Flutter**: `pubspec.yaml` or `pubspec.yml`
   - **Python**: `requirements.txt`, `setup.py`, `pyproject.toml`, or `Pipfile`
   - **Web**: `package.json`, `bower.json`, or `yarn.lock`
   - **Git**: `.git` directory

#### Using Command Buttons

##### Flutter Commands
- **📦 Pub Get**: Install dependencies (`flutter pub get`)
- **▶️ Run**: Launch the app (`flutter run`)
- **🔨 Build APK**: Build Android APK (`flutter build apk`)
- **🧪 Test**: Run tests (`flutter test`)
- **🩺 Doctor**: Check setup (`flutter doctor`)

##### Python Commands
- **📦 Install Deps**: Install requirements (`pip install -r requirements.txt`)
- **▶️ Run Main**: Execute main script (`python main.py`)
- **🧪 Test**: Run pytest (`pytest`)
- **📋 List Packages**: Show installed packages (`pip list`)
- **🐍 Create Venv**: Create virtual environment (`python -m venv venv`)

##### Web Commands
- **📦 Install**: Install dependencies (`npm install`)
- **▶️ Start**: Start development server (`npm start`)
- **🔨 Build**: Build for production (`npm run build`)
- **🧪 Test**: Run tests (`npm test`)
- **✨ Lint**: Run linting (`npm run lint`)

##### Git Commands
- **📊 Status**: Check repository status (`git status`)
- **➕ Add All**: Stage all changes (`git add .`)
- **💾 Commit**: Commit changes (opens commit dialog)
- **⬆️ Push**: Push to remote (`git push`)
- **⬇️ Pull**: Pull from remote (`git pull`)
- **📜 Log**: View commit history (`git log`)

### Advanced Features

#### Custom Commands
1. Click the **⚙️ Custom Commands** button
2. Click **➕ Add Command** to create a new custom command
3. Fill in the details:
   - **Name**: Display name for the command
   - **Shell Command**: The actual command to execute
   - **Icon**: Optional emoji icon (1-2 characters)
4. Click **💾 Save** to add the command
5. Your custom command will appear in the left panel

#### Command History
1. Click the **📜 History** button to view command history
2. Use the search box to filter commands
3. Click any history item to re-execute the command
4. Export history to CSV for analysis

#### Terminal Usage
1. The right panel contains an integrated terminal
2. Click **➕** to add new terminal tabs
3. Use **Ctrl+C** to cancel running commands
4. Terminal supports full color output and interactive commands

#### Theme Toggle
- Click the **🌙/🌞** button in the top-right to switch between dark and light themes
- Theme preference is automatically saved

#### Panel Resizing
- Drag the vertical separator between panels to resize
- Layout preferences are automatically saved

### Keyboard Shortcuts

#### Global Shortcuts
- **Ctrl+Shift+T**: Open new terminal tab
- **Ctrl+Shift+H**: Open command history
- **Ctrl+Shift+C**: Open custom commands
- **Ctrl+Shift+F**: Select project folder
- **Ctrl+Shift+D**: Toggle theme

#### Terminal Shortcuts
- **Ctrl+C**: Cancel current command
- **Ctrl+V**: Paste in terminal
- **Ctrl+Shift+C**: Copy from terminal
- **Ctrl+Shift+V**: Paste in terminal

## 🔧 Configuration

### Settings Location
Settings are automatically saved to:
- **Windows**: `%APPDATA%\easy-debug\`
- **macOS**: `~/Library/Application Support/easy-debug/`
- **Linux**: `~/.config/easy-debug/`

### Configuration Files
- `config.json`: Application settings
- `recent-projects.json`: Recent project list
- `custom-commands.json`: User-defined commands
- `command-history.json`: Command execution history

### Customization Options
- **Theme**: Dark/Light mode
- **Panel Layout**: Resizable panel widths
- **Custom Commands**: User-defined command shortcuts
- **Recent Projects**: Quick access to frequently used projects

## 🛠️ Development

### Project Structure
```
easy-debug/
├── main.js                 # Electron main process
├── renderer/               # Frontend application
│   ├── index.html         # Main UI
│   ├── styles/            # CSS styles
│   └── scripts/           # JavaScript logic
├── terminal/              # Terminal integration
├── tests/                 # Test suites
├── tools/                 # Development tools
└── docs/                  # Documentation
```

### Development Scripts
```bash
# Development
npm start                   # Start in development mode
npm run dev                 # Start with nodemon
npm run webpack:watch       # Webpack development build

# Testing
npm test                    # Run unit tests
npm run test:watch          # Watch mode testing
npm run test:coverage       # Coverage report

# Performance
npm run analyze             # Performance analysis
npm run webpack:prod        # Production webpack build

# Building
npm run build               # Build for all platforms
npm run build:win           # Windows build
npm run build:mac           # macOS build
npm run build:linux         # Linux build
```

### Testing Framework
- **Unit Tests**: 112 comprehensive test cases
- **Cross-Platform Testing**: Windows, macOS, Linux compatibility
- **Performance Testing**: Bundle size and runtime optimization
- **Integration Testing**: IPC communication and file system operations

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
1. **Check Node.js version**: Ensure Node.js 18+ is installed
2. **Clear cache**: Run `npm run clean && npm install`
3. **Permissions**: Ensure the application has proper file system permissions

#### Commands Not Working
1. **Check PATH**: Ensure development tools are in your system PATH
2. **Project Detection**: Verify project has required configuration files
3. **Shell Issues**: Try switching terminal shells (bash, PowerShell, etc.)

#### Performance Issues
1. **Memory Usage**: Close unused terminal tabs
2. **Large Projects**: Use project filtering for better performance
3. **System Resources**: Ensure adequate RAM and storage space

#### Platform-Specific Issues

##### Windows
- **PowerShell Execution Policy**: Run `Set-ExecutionPolicy RemoteSigned`
- **Long Path Support**: Enable long path support in Windows
- **Antivirus**: Add Easy Debug to antivirus exceptions

##### macOS
- **Gatekeeper**: Allow the app in System Preferences > Security
- **Code Signing**: Trust the developer certificate
- **Command Line Tools**: Install Xcode Command Line Tools

##### Linux
- **Dependencies**: Install required system libraries
- **Permissions**: Ensure executable permissions on AppImage
- **Desktop Integration**: Install .desktop file for proper integration

### Getting Help

#### Documentation
- **User Guide**: Complete usage documentation
- **API Reference**: Developer API documentation
- **Cross-Platform Guide**: Platform-specific setup instructions
- **Performance Guide**: Optimization recommendations

#### Support Channels
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-username/easy-debug/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/your-username/easy-debug/discussions)
- **Wiki**: [Community-maintained documentation](https://github.com/your-username/easy-debug/wiki)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 **Bug Reports**: Found a bug? Please report it!
- ✨ **Feature Requests**: Have an idea? We'd love to hear it!
- 📝 **Documentation**: Help improve our docs
- 🧪 **Testing**: Help test new features and platforms
- 💻 **Code**: Submit pull requests for bug fixes and features

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/easy-debug.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature-name`
5. Make your changes and add tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron**: Cross-platform desktop framework
- **xterm.js**: Terminal emulator component
- **electron-store**: Settings persistence
- **Contributors**: Thank you to all contributors who made this project possible

## 📊 Project Status

- **Version**: 1.0.0
- **Status**: Stable Release
- **Platforms**: Windows ✅ | macOS ✅ | Linux ✅
- **Last Updated**: December 2024

---

Made with ❤️ for developers, by developers.