# Easy Debug - Complete User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Project Management](#project-management)
4. [Using Commands](#using-commands)
5. [Terminal Integration](#terminal-integration)
6. [Advanced Features](#advanced-features)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Tips and Tricks](#tips-and-tricks)

## Getting Started

### Installation and Setup

#### First Launch
When you first launch Easy Debug, you'll see the main interface with two panels:
- **Left Panel**: Project information and command buttons
- **Right Panel**: Integrated terminal

#### Selecting Your First Project
1. Click the **📁 Select Folder** button in the top-left corner
2. Browse to your project directory (e.g., `C:\Users\YourName\Projects\MyApp`)
3. Select the folder containing your project files
4. Easy Debug will automatically detect the project type

#### Project Auto-Detection
Easy Debug automatically identifies project types based on key files:

| Project Type | Detection Files | Example |
|-------------|-----------------|---------|
| Flutter | `pubspec.yaml`, `pubspec.yml` | Flutter mobile/web apps |
| Python | `requirements.txt`, `setup.py`, `pyproject.toml` | Python applications |
| Web | `package.json`, `bower.json`, `yarn.lock` | React, Vue, Angular projects |
| Git | `.git/` directory | Any Git repository |

## Interface Overview

### Main Window Layout

```
┌─────────────────────────────────────────────────────┐
│ 📁 Select Folder    [Current Project]    🌙 Theme   │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│  Left Panel   │           Right Panel               │
│               │                                     │
│ • Project     │         Terminal                    │
│   Info        │      ┌─ Tab 1 ─┬─ Tab 2 ─┐         │
│ • Command     │      │         │         │         │
│   Groups      │      │ $ npm   │ $ git   │         │
│ • Custom      │      │ start   │ status  │         │
│   Commands    │      │         │         │         │
│ • System      │      │         │         │         │
│   Info        │      └─────────┴─────────┘         │
│               │                                     │
└───────────────┴─────────────────────────────────────┘
```

### Top Bar Elements

- **📁 Select Folder**: Choose project directory
- **Current Project Path**: Shows active project location
- **🌙/🌞 Theme Toggle**: Switch between dark/light themes

### Left Panel Sections

1. **Project Information**
   - Project name and path
   - Detected project types
   - Recent projects quick access

2. **Command Groups**
   - Technology-specific commands (Flutter, Python, Web, Git)
   - Collapsible sections with icons

3. **Custom Commands**
   - User-defined command shortcuts
   - Management buttons (Add, Edit, Delete)

4. **System Information**
   - Installed tool versions
   - System compatibility status

## Project Management

### Working with Projects

#### Opening Projects
There are several ways to open projects in Easy Debug:

1. **Folder Button**: Click 📁 and browse to your project
2. **Recent Projects**: Select from the recent projects list
3. **Drag & Drop**: Drag a folder onto the Easy Debug window
4. **Command Line**: `easy-debug /path/to/project` (if installed globally)

#### Recent Projects
Easy Debug remembers your recently opened projects:
- Automatically saves up to 10 recent projects
- Shows project name, path, and last accessed time
- Click any recent project to switch to it instantly

#### Project Types
Easy Debug supports multiple project types simultaneously. A single project can be:
- Flutter + Git (mobile app with version control)
- Python + Git (Python script with version control)  
- Web + Git (web application with version control)
- Any combination based on detected files

### Project Detection Examples

#### Flutter Project
```
my-flutter-app/
├── pubspec.yaml          ← Detection file
├── lib/
│   └── main.dart
├── android/
├── ios/
└── test/
```
**Detected as**: Flutter project
**Available commands**: Pub Get, Run, Build APK, Test, Doctor

#### Python Project
```
my-python-app/
├── requirements.txt      ← Detection file
├── main.py
├── src/
├── tests/
└── README.md
```
**Detected as**: Python project
**Available commands**: Install Deps, Run Main, Test, List Packages, Create Venv

#### Web Project  
```
my-web-app/
├── package.json          ← Detection file
├── src/
├── public/
├── node_modules/
└── dist/
```
**Detected as**: Web project
**Available commands**: Install, Start, Build, Test, Lint

## Using Commands

### Command Categories

#### Flutter Commands

| Button | Command | Description | Usage |
|--------|---------|-------------|-------|
| 📦 Pub Get | `flutter pub get` | Install dependencies | After changing `pubspec.yaml` |
| ▶️ Run | `flutter run` | Launch app | Start development |
| 🔨 Build APK | `flutter build apk` | Build Android app | Create release build |
| 🧪 Test | `flutter test` | Run tests | Verify code quality |
| 🩺 Doctor | `flutter doctor` | Check setup | Troubleshoot issues |

#### Python Commands

| Button | Command | Description | Usage |
|--------|---------|-------------|-------|
| 📦 Install Deps | `pip install -r requirements.txt` | Install packages | Project setup |
| ▶️ Run Main | `python main.py` | Execute main script | Run application |
| 🧪 Test | `pytest` | Run tests | Code verification |
| 📋 List Packages | `pip list` | Show installed packages | Environment check |
| 🐍 Create Venv | `python -m venv venv` | Create virtual environment | Project isolation |

#### Web Commands

| Button | Command | Description | Usage |
|--------|---------|-------------|-------|
| 📦 Install | `npm install` | Install dependencies | Project setup |
| ▶️ Start | `npm start` | Start dev server | Development |
| 🔨 Build | `npm run build` | Build for production | Deployment prep |
| 🧪 Test | `npm test` | Run tests | Quality assurance |
| ✨ Lint | `npm run lint` | Check code style | Code cleanup |

#### Git Commands

| Button | Command | Description | Usage |
|--------|---------|-------------|-------|
| 📊 Status | `git status` | Check repository status | See changes |
| ➕ Add All | `git add .` | Stage all changes | Prepare commit |
| 💾 Commit | `git commit` | Commit changes | Save changes |
| ⬆️ Push | `git push` | Push to remote | Share changes |
| ⬇️ Pull | `git pull` | Pull from remote | Get updates |
| 📜 Log | `git log` | View commit history | Review changes |

### Command Execution

#### How Commands Work
1. **Click a command button** → Command executes in terminal
2. **Real-time output** → See command progress and results
3. **Interactive prompts** → Respond to command input requests
4. **Completion status** → Visual feedback when commands finish

#### Command States
- **Ready**: Button available for clicking
- **Running**: Command executing (button disabled)
- **Success**: Command completed successfully (green feedback)
- **Error**: Command failed (red feedback with error details)

#### Handling Command Failures
When commands fail, Easy Debug provides:
1. **Error output** in the terminal
2. **Notification** with error summary
3. **Suggestions** for common issues
4. **Debug information** for troubleshooting

## Terminal Integration

### Terminal Features

#### Multiple Tabs
- **Add Tab**: Click ➕ next to terminal tabs
- **Switch Tabs**: Click tab names to switch between terminals
- **Close Tab**: Click ✕ on tab to close
- **Rename Tab**: Right-click tab to rename

#### Terminal Controls
- **Copy**: Ctrl+Shift+C or right-click → Copy
- **Paste**: Ctrl+Shift+V or right-click → Paste
- **Clear**: Type `clear` or Ctrl+L
- **Cancel**: Ctrl+C to stop running commands

#### Shell Compatibility
Easy Debug works with multiple shell types:

| Platform | Default Shell | Alternatives |
|----------|---------------|--------------|
| Windows | PowerShell | Command Prompt, Git Bash |
| macOS | zsh | bash, fish |
| Linux | bash | zsh, fish, dash |

### Advanced Terminal Usage

#### Running Custom Commands
You can type any command directly in the terminal:
```bash
# Node.js commands
node --version
npm list --depth=0

# Git commands  
git branch -a
git diff HEAD~1

# System commands
ls -la          # Linux/macOS
dir             # Windows
```

#### Working Directory
- Terminal starts in the selected project directory
- Use `pwd` (Unix) or `cd` (Windows) to check current directory
- Navigate with `cd path/to/directory`

#### Environment Variables
Easy Debug preserves your system environment:
- PATH variables for development tools
- User-specific settings
- Project-specific configurations

## Advanced Features

### Custom Commands

#### Creating Custom Commands
1. Click **⚙️ Custom Commands** button
2. Click **➕ Add Command**
3. Fill in the form:
   ```
   Name: Deploy to Server
   Command: npm run build && rsync -av dist/ user@server:/var/www/
   Icon: 🚀 (optional)
   ```
4. Click **💾 Save**

#### Custom Command Examples

**Frontend Development**
```
Name: Hot Reload
Command: npm run dev
Icon: 🔥
```

**Backend Development**
```
Name: Start Database
Command: docker-compose up -d database
Icon: 🗄️
```

**Deployment**
```
Name: Deploy Staging
Command: git push staging main
Icon: 🚀
```

**Testing**
```
Name: E2E Tests
Command: npm run test:e2e
Icon: 🎭
```

#### Managing Custom Commands
- **Edit**: Click pencil icon to modify existing commands
- **Delete**: Click trash icon to remove commands
- **Reorder**: Drag commands to rearrange order
- **Export**: Commands are saved automatically

### Command History

#### Using History
1. Click **📜 History** button to open history modal
2. Browse recent commands with timestamps
3. Use search box to filter commands
4. Click any command to re-execute it

#### History Features
- **Search**: Filter by command text or project name
- **Timestamps**: See when each command was executed
- **Project Context**: See which project each command was run in
- **Export**: Export history to CSV for analysis

#### History Management
- Automatically saves last 1000 commands
- Persists across application restarts
- Grouped by project and date
- Can be cleared manually

### System Information

#### Version Detection
Easy Debug automatically detects installed development tools:

| Tool | Detection Method | Status Indicators |
|------|------------------|-------------------|
| Node.js | `node --version` | ✅ Available / ❌ Not Found |
| Git | `git --version` | ✅ Available / ❌ Not Found |
| Flutter | `flutter --version` | ✅ Available / ❌ Not Found |
| Python | `python --version` | ✅ Available / ❌ Not Found |
| VS Code | `code --version` | ✅ Available / ❌ Not Found |

#### Troubleshooting with System Info
Use system information to diagnose issues:
- **Red status**: Tool not installed or not in PATH
- **Green status**: Tool available and working
- **Version numbers**: Check compatibility requirements

## Customization

### Theme System

#### Switching Themes
- **Dark Theme** (default): Click 🌙 to switch to light
- **Light Theme**: Click 🌞 to switch to dark
- Theme preference is saved automatically

#### Theme Differences
| Element | Dark Theme | Light Theme |
|---------|------------|-------------|
| Background | Dark gray (#1a1a1a) | White (#ffffff) |
| Text | Light gray (#e5e5e5) | Dark gray (#2d3748) |
| Panels | Dark slate | Light gray |
| Terminal | Black background | White background |

### Panel Layout

#### Resizing Panels
1. **Hover over panel divider** → Cursor changes to resize ↔️
2. **Click and drag** → Adjust panel widths
3. **Release** → Layout is saved automatically

#### Panel Size Limits
- **Minimum left panel**: 200px (keeps buttons visible)
- **Maximum left panel**: 60% of window (preserves terminal space)
- **Responsive**: Adjusts on window resize

### Keyboard Shortcuts

#### Global Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| Ctrl+Shift+F | Select Folder | Open folder picker |
| Ctrl+Shift+T | New Terminal | Add terminal tab |
| Ctrl+Shift+H | History | Open command history |
| Ctrl+Shift+C | Custom Commands | Open custom commands |
| Ctrl+Shift+D | Toggle Theme | Switch dark/light theme |

#### Terminal Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| Ctrl+C | Cancel | Stop running command |
| Ctrl+Shift+C | Copy | Copy selected text |
| Ctrl+Shift+V | Paste | Paste from clipboard |
| Ctrl+L | Clear | Clear terminal screen |

## Troubleshooting

### Common Issues

#### Application Won't Start

**Problem**: Easy Debug doesn't launch or crashes on startup

**Solutions**:
1. **Check Node.js version**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```
2. **Clear application data**:
   - Windows: Delete `%APPDATA%\easy-debug\`
   - macOS: Delete `~/Library/Application Support/easy-debug/`
   - Linux: Delete `~/.config/easy-debug/`
3. **Reinstall application**:
   - Download latest version from releases
   - Uninstall old version first

#### Commands Not Working

**Problem**: Command buttons don't execute or show errors

**Solutions**:
1. **Check tool installation**:
   ```bash
   flutter --version  # For Flutter projects
   node --version     # For Web projects  
   python --version   # For Python projects
   git --version      # For Git projects
   ```
2. **Verify PATH environment**:
   - Tools must be in system PATH
   - Restart application after installing tools
3. **Check project structure**:
   - Ensure detection files are present
   - Verify project directory permissions

#### Terminal Issues

**Problem**: Terminal doesn't respond or shows errors

**Solutions**:
1. **Try different shell**:
   - Windows: Switch between PowerShell and Command Prompt
   - Unix: Try bash, zsh, or fish
2. **Check permissions**:
   - Ensure terminal has file system access
   - Check project directory permissions
3. **Clear terminal**:
   - Press Ctrl+L to clear screen
   - Close and reopen terminal tab

#### Performance Issues

**Problem**: Application runs slowly or uses excessive memory

**Solutions**:
1. **Close unused tabs**:
   - Each terminal tab uses memory
   - Close tabs when not needed
2. **Clear command history**:
   - History with 1000+ items can slow searches
   - Export and clear history periodically
3. **Restart application**:
   - Clears memory leaks from long sessions
   - Refreshes system resources

### Platform-Specific Issues

#### Windows Issues

**PowerShell Execution Policy**
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Long Path Support**
- Enable in Windows 10/11 settings
- Required for deep node_modules directories

**Antivirus Interference**
- Add Easy Debug to antivirus exceptions
- Allow terminal process execution

#### macOS Issues

**Gatekeeper Warnings**
1. Right-click Easy Debug app
2. Select "Open" from context menu
3. Click "Open" in security dialog
4. Or disable Gatekeeper: `sudo spctl --master-disable`

**Command Line Tools**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Permission Errors**
- Grant Full Disk Access in System Preferences > Security & Privacy

#### Linux Issues

**Missing Dependencies**
```bash
# Ubuntu/Debian
sudo apt install libgtk-3-0 libnss3 libasound2

# Fedora
sudo dnf install gtk3 nss alsa-lib

# Arch
sudo pacman -S gtk3 nss alsa-lib
```

**AppImage Permissions**
```bash
# Make executable
chmod +x Easy-Debug-1.0.0.AppImage

# Run
./Easy-Debug-1.0.0.AppImage
```

## Tips and Tricks

### Productivity Tips

#### Project Workflow
1. **Pin frequently used projects** to recent projects list
2. **Create custom commands** for common development tasks
3. **Use multiple terminal tabs** for parallel development
4. **Set up project-specific custom commands** for each project type

#### Command Efficiency
1. **Use command history** to repeat complex commands
2. **Create aliases** in terminal for frequently used commands
3. **Combine commands** with `&&` for sequential execution
4. **Use background processes** with `&` for long-running tasks

#### Terminal Mastery
```bash
# Navigate quickly
cd -              # Go to previous directory
pushd path        # Save current directory and go to path
popd             # Return to saved directory

# Process management
jobs             # List background jobs
fg %1            # Bring job to foreground
kill %1          # Kill background job

# History shortcuts
!!               # Repeat last command
!n               # Repeat command number n
!string          # Repeat last command starting with string
```

### Advanced Configurations

#### Environment Setup
Create project-specific environment files:

**.env file** (Web projects)
```
NODE_ENV=development
API_URL=http://localhost:3001
DEBUG=true
```

**activate script** (Python projects)
```bash
# Windows
venv\Scripts\activate

# Unix
source venv/bin/activate
```

#### Git Configuration
```bash
# Set up global git config
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up project-specific config
git config user.name "Project Name"
git config user.email "project.email@example.com"
```

#### Custom Command Templates

**Full-Stack Development**
```json
{
  "name": "Full Deploy",
  "command": "npm run build && npm run test && git add . && git commit -m 'Deploy' && git push",
  "icon": "🚀"
}
```

**Database Operations**
```json
{
  "name": "Reset DB",
  "command": "npm run db:drop && npm run db:migrate && npm run db:seed",
  "icon": "🗄️"
}
```

**Code Quality**
```json
{
  "name": "Quality Check",
  "command": "npm run lint && npm run test:coverage && npm run build",
  "icon": "✨"
}
```

### Keyboard Shortcuts Cheat Sheet

Print this reference for quick access:

```
┌─────────────────── EASY DEBUG SHORTCUTS ───────────────────┐
│                                                             │
│ Global Actions:                                             │
│   Ctrl+Shift+F  →  Select project folder                   │
│   Ctrl+Shift+T  →  New terminal tab                        │
│   Ctrl+Shift+H  →  Command history                         │
│   Ctrl+Shift+C  →  Custom commands                         │
│   Ctrl+Shift+D  →  Toggle theme                            │
│                                                             │
│ Terminal Actions:                                           │
│   Ctrl+C        →  Cancel running command                  │
│   Ctrl+L        →  Clear terminal                          │
│   Ctrl+Shift+C  →  Copy selection                          │
│   Ctrl+Shift+V  →  Paste                                   │
│                                                             │
│ Shell Shortcuts:                                            │
│   ↑/↓ arrows    →  Command history                         │
│   Tab           →  Auto-complete                           │
│   Ctrl+A        →  Beginning of line                       │
│   Ctrl+E        →  End of line                             │
│   Ctrl+U        →  Clear line                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

This completes the comprehensive Easy Debug User Guide. For more advanced topics, see the [API Documentation](API_REFERENCE.md) and [Developer Guide](DEVELOPER_GUIDE.md).