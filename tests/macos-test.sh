#!/bin/bash
# macOS-specific testing script for Easy Debug

echo "======================================="
echo "Easy Debug - macOS Testing Suite"
echo "======================================="
echo ""

# Test macOS environment
echo "1. Testing macOS Environment..."
echo "OS Version: $(sw_vers -productName) $(sw_vers -productVersion)"
echo "Build Version: $(sw_vers -buildVersion)"
echo "Architecture: $(uname -m)"
echo "Kernel: $(uname -s) $(uname -r)"
echo ""

# Test shell environment
echo "2. Testing Shell Environment..."
echo "Current Shell: $SHELL"
echo "Available Shells:"
cat /etc/shells | grep -E "(zsh|bash|fish)" | head -5
echo ""

# Test Node.js and npm
echo "3. Testing Node.js Installation..."
if command -v node >/dev/null 2>&1; then
    echo "✓ Node.js Version: $(node --version)"
else
    echo "✗ Node.js not found"
fi

if command -v npm >/dev/null 2>&1; then
    echo "✓ npm Version: $(npm --version)"
else
    echo "✗ npm not found"
fi
echo ""

# Test Git installation
echo "4. Testing Git Installation..."
if command -v git >/dev/null 2>&1; then
    echo "✓ Git Version: $(git --version)"
else
    echo "✗ Git not found"
fi
echo ""

# Test Python installation (both python and python3)
echo "5. Testing Python Installation..."
if command -v python >/dev/null 2>&1; then
    echo "✓ Python Version: $(python --version)"
elif command -v python3 >/dev/null 2>&1; then
    echo "✓ Python3 Version: $(python3 --version)"
else
    echo "⚠ Python not found (may use system Python)"
fi
echo ""

# Test Flutter installation
echo "6. Testing Flutter Installation..."
if command -v flutter >/dev/null 2>&1; then
    echo "✓ Flutter Version: $(flutter --version | head -1)"
else
    echo "ℹ Flutter not installed (optional)"
fi
echo ""

# Test VS Code installation
echo "7. Testing VS Code Installation..."
VSCODE_FOUND=false

# Check different VS Code installations
if command -v code >/dev/null 2>&1; then
    echo "✓ VS Code CLI available: code"
    VSCODE_FOUND=true
elif [ -d "/Applications/Visual Studio Code.app" ]; then
    echo "✓ VS Code.app found in Applications"
    VSCODE_FOUND=true
elif [ -d "/Applications/Visual Studio Code - Insiders.app" ]; then
    echo "✓ VS Code Insiders.app found"
    VSCODE_FOUND=true
fi

if [ "$VSCODE_FOUND" = false ]; then
    echo "ℹ VS Code not found (optional)"
fi
echo ""

# Test macOS path handling
echo "8. Testing macOS Path Handling..."
TEST_PATHS=(
    "/System/Library"
    "/Applications"
    "/Users/$USER"
    "/Users/$USER/Desktop"
    "/Users/$USER/Documents"
    "/tmp"
)

for path in "${TEST_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "✓ Path exists: $path"
    else
        echo "✗ Path missing: $path"
    fi
done
echo ""

# Test file system case sensitivity
echo "9. Testing File System Case Sensitivity..."
TEST_FILE="/tmp/EasyDebugCaseTest.txt"
TEST_FILE_LOWER="/tmp/easydebugcasetest.txt"

echo "test content" > "$TEST_FILE"
if [ -f "$TEST_FILE_LOWER" ]; then
    echo "✓ File system is case-insensitive (HFS+/APFS)"
    CASE_SENSITIVE=false
else
    echo "✓ File system is case-sensitive (APFS case-sensitive)"
    CASE_SENSITIVE=true
fi
rm -f "$TEST_FILE" 2>/dev/null
echo ""

# Test project directory structure
echo "10. Testing Easy Debug Project Structure..."
PROJECT_ROOT="$(pwd)"
REQUIRED_FILES=(
    "package.json"
    "main.js"
    "renderer/index.html"
    "renderer/styles/main.css"
    "renderer/scripts/app.js"
    "terminal/terminal.js"
    "terminal/pty.js"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ File exists: $file"
    else
        echo "✗ File missing: $file"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✓ All required project files are present!"
else
    echo "✗ Some project files are missing!"
fi
echo ""

# Test npm dependencies
echo "11. Testing npm Dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules directory exists"
    
    # Check critical dependencies
    CRITICAL_DEPS=("electron" "xterm" "electron-store")
    for dep in "${CRITICAL_DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo "✓ Dependency installed: $dep"
        else
            echo "✗ Dependency missing: $dep"
        fi
    done
else
    echo "✗ node_modules directory missing - run 'npm install'"
fi
echo ""

# Test macOS-specific commands
echo "12. Testing macOS Command Compatibility..."
MACOS_COMMANDS=(
    "ls:Directory listing"
    "ps:Process list"  
    "top:System monitor"
    "which:Command locator"
    "launchctl:Launch daemon controller"
    "security:Keychain access"
)

for cmd_desc in "${MACOS_COMMANDS[@]}"; do
    cmd="${cmd_desc%%:*}"
    desc="${cmd_desc##*:}"
    
    if command -v "$cmd" >/dev/null 2>&1; then
        echo "✓ Command available: $cmd ($desc)"
    else
        echo "✗ Command not available: $cmd"
    fi
done
echo ""

# Test Homebrew (common macOS package manager)
echo "13. Testing Homebrew Installation..."
if command -v brew >/dev/null 2>&1; then
    echo "✓ Homebrew installed: $(brew --version | head -1)"
    echo "  Homebrew prefix: $(brew --prefix)"
else
    echo "ℹ Homebrew not installed (optional but recommended)"
fi
echo ""

# Test Xcode Command Line Tools
echo "14. Testing Xcode Command Line Tools..."
if command -v xcode-select >/dev/null 2>&1; then
    XCODE_PATH=$(xcode-select -p 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✓ Xcode Command Line Tools installed: $XCODE_PATH"
    else
        echo "⚠ Xcode Command Line Tools not installed"
    fi
else
    echo "✗ xcode-select not available"
fi
echo ""

# Test terminal capabilities
echo "15. Testing Terminal Capabilities..."
echo "Terminal: $TERM"
echo "Colors: $(tput colors 2>/dev/null || echo 'unknown')"

# Test ANSI color support
echo -n "Testing ANSI colors: "
echo -e "\033[32mSUCCESS\033[0m"

# Test Unicode support  
echo "Testing Unicode: 🚀 ⚡️ 🌙 🌞"

# Test special characters
echo "Testing special chars: │ ├ └ ┌ ┐"
echo ""

# Test security features
echo "16. Testing macOS Security Features..."

# Test System Integrity Protection
if command -v csrutil >/dev/null 2>&1; then
    SIP_STATUS=$(csrutil status 2>/dev/null | grep -o "enabled\|disabled" | head -1)
    echo "✓ System Integrity Protection: ${SIP_STATUS:-unknown}"
else
    echo "ℹ SIP status unknown"
fi

# Test app sandbox/entitlements (if applicable)
echo "ℹ Gatekeeper and app signing will be tested during app launch"
echo ""

# Performance test
echo "17. Testing Application Performance..."
if [ -f "main.js" ]; then
    if [ -f "node_modules/.bin/electron" ]; then
        echo "✓ Electron executable found"
        echo "✓ Ready for performance testing (manual launch required)"
    else
        echo "✗ Electron executable not found"
    fi
else
    echo "✗ main.js not found"
fi
echo ""

# Summary
echo "======================================="
echo "macOS Testing Complete!"
echo "======================================="
echo "Test completed at: $(date)"
echo ""
echo "System Summary:"
echo "  OS: $(sw_vers -productName) $(sw_vers -productVersion)"
echo "  Architecture: $(uname -m)"
echo "  Shell: $SHELL"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "  Git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' if dependencies are missing"
echo "2. Run 'npm start' to launch the application"  
echo "3. Test all UI functionality manually"
echo "4. Test project detection with real projects"
echo "5. Test Gatekeeper behavior on first launch"