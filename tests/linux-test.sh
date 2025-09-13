#!/bin/bash
# Linux distribution testing script for Easy Debug

echo "======================================="
echo "Easy Debug - Linux Testing Suite"
echo "======================================="
echo ""

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$NAME $VERSION"
    elif [ -f /etc/redhat-release ]; then
        cat /etc/redhat-release
    elif [ -f /etc/debian_version ]; then
        echo "Debian $(cat /etc/debian_version)"
    else
        echo "Unknown Linux Distribution"
    fi
}

# Test Linux environment
echo "1. Testing Linux Environment..."
DISTRO=$(detect_distro)
echo "Distribution: $DISTRO"
echo "Kernel: $(uname -s) $(uname -r)"
echo "Architecture: $(uname -m)"
echo "CPU Info: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs || echo 'Unknown')"
echo "Memory: $(grep MemTotal /proc/meminfo | awk '{print $2 " " $3}' || echo 'Unknown')"
echo ""

# Test desktop environment
echo "2. Testing Desktop Environment..."
if [ -n "$XDG_CURRENT_DESKTOP" ]; then
    echo "Desktop Environment: $XDG_CURRENT_DESKTOP"
elif [ -n "$DESKTOP_SESSION" ]; then
    echo "Desktop Session: $DESKTOP_SESSION"
elif [ -n "$KDE_FULL_SESSION" ]; then
    echo "Desktop Environment: KDE"
elif [ -n "$GNOME_DESKTOP_SESSION_ID" ]; then
    echo "Desktop Environment: GNOME"
else
    echo "Desktop Environment: Unknown or None (CLI)"
fi

# Test display server
if [ -n "$WAYLAND_DISPLAY" ]; then
    echo "Display Server: Wayland"
elif [ -n "$DISPLAY" ]; then
    echo "Display Server: X11 ($DISPLAY)"
else
    echo "Display Server: None (headless)"
fi
echo ""

# Test shell environment
echo "3. Testing Shell Environment..."
echo "Current Shell: $SHELL"
echo "Available Shells:"
grep -E "(bash|zsh|fish|dash)" /etc/shells | head -5
echo ""

# Test Node.js and npm
echo "4. Testing Node.js Installation..."
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
echo "5. Testing Git Installation..."
if command -v git >/dev/null 2>&1; then
    echo "✓ Git Version: $(git --version)"
else
    echo "✗ Git not found"
fi
echo ""

# Test Python installation
echo "6. Testing Python Installation..."
if command -v python3 >/dev/null 2>&1; then
    echo "✓ Python3 Version: $(python3 --version)"
elif command -v python >/dev/null 2>&1; then
    echo "✓ Python Version: $(python --version)"
else
    echo "⚠ Python not found"
fi

# Test pip
if command -v pip3 >/dev/null 2>&1; then
    echo "✓ pip3 available"
elif command -v pip >/dev/null 2>&1; then
    echo "✓ pip available"
else
    echo "⚠ pip not found"
fi
echo ""

# Test Flutter installation
echo "7. Testing Flutter Installation..."
if command -v flutter >/dev/null 2>&1; then
    echo "✓ Flutter Version: $(flutter --version | head -1)"
else
    echo "ℹ Flutter not installed (optional)"
fi
echo ""

# Test VS Code installation
echo "8. Testing VS Code Installation..."
VSCODE_FOUND=false

# Check different VS Code installations
if command -v code >/dev/null 2>&1; then
    echo "✓ VS Code CLI available: code"
    VSCODE_FOUND=true
elif command -v code-insiders >/dev/null 2>&1; then
    echo "✓ VS Code Insiders CLI available"
    VSCODE_FOUND=true
elif [ -f "/usr/bin/code" ]; then
    echo "✓ VS Code found in /usr/bin"
    VSCODE_FOUND=true
elif [ -f "/snap/bin/code" ]; then
    echo "✓ VS Code Snap package found"
    VSCODE_FOUND=true
fi

if [ "$VSCODE_FOUND" = false ]; then
    echo "ℹ VS Code not found (optional)"
fi
echo ""

# Test package managers
echo "9. Testing Package Managers..."
if command -v apt >/dev/null 2>&1; then
    echo "✓ APT (Debian/Ubuntu): $(apt --version | head -1)"
fi

if command -v yum >/dev/null 2>&1; then
    echo "✓ YUM (RHEL/CentOS): $(yum --version | head -1)"
fi

if command -v dnf >/dev/null 2>&1; then
    echo "✓ DNF (Fedora): $(dnf --version | head -1)"
fi

if command -v pacman >/dev/null 2>&1; then
    echo "✓ Pacman (Arch): $(pacman --version | head -1)"
fi

if command -v zypper >/dev/null 2>&1; then
    echo "✓ Zypper (openSUSE): $(zypper --version | head -1)"
fi

if command -v snap >/dev/null 2>&1; then
    echo "✓ Snap packages: $(snap version | grep snapd)"
fi

if command -v flatpak >/dev/null 2>&1; then
    echo "✓ Flatpak: $(flatpak --version)"
fi

if command -v appimage >/dev/null 2>&1; then
    echo "✓ AppImage support available"
fi
echo ""

# Test Linux path handling
echo "10. Testing Linux Path Handling..."
TEST_PATHS=(
    "/usr/bin"
    "/usr/local/bin"
    "/etc"
    "/var/log"
    "/tmp"
    "$HOME"
    "/proc"
    "/sys"
)

for path in "${TEST_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "✓ Path exists: $path"
    else
        echo "✗ Path missing: $path"
    fi
done
echo ""

# Test file system permissions
echo "11. Testing File System Permissions..."
# Test creating files in writable directories
TEST_FILE="/tmp/easy-debug-test-$(date +%s).txt"
if touch "$TEST_FILE" 2>/dev/null; then
    echo "✓ Can create files in /tmp"
    rm -f "$TEST_FILE"
else
    echo "✗ Cannot create files in /tmp"
fi

# Test home directory access
HOME_TEST_FILE="$HOME/.easy-debug-test"
if touch "$HOME_TEST_FILE" 2>/dev/null; then
    echo "✓ Can create files in home directory"
    rm -f "$HOME_TEST_FILE"
else
    echo "✗ Cannot create files in home directory"
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠ Running as root (not recommended for desktop apps)"
else
    echo "✓ Running as regular user"
fi
echo ""

# Test project directory structure
echo "12. Testing Easy Debug Project Structure..."
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
echo "13. Testing npm Dependencies..."
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

# Test Linux-specific commands
echo "14. Testing Linux Command Compatibility..."
LINUX_COMMANDS=(
    "ls:Directory listing"
    "ps:Process list"
    "grep:Text search"
    "find:File search"
    "which:Command locator"
    "lscpu:CPU information"
    "lsblk:Block devices"
    "df:Disk usage"
    "free:Memory usage"
    "systemctl:System services"
)

for cmd_desc in "${LINUX_COMMANDS[@]}"; do
    cmd="${cmd_desc%%:*}"
    desc="${cmd_desc##*:}"
    
    if command -v "$cmd" >/dev/null 2>&1; then
        echo "✓ Command available: $cmd ($desc)"
    else
        echo "✗ Command not available: $cmd"
    fi
done
echo ""

# Test system libraries for Electron
echo "15. Testing System Libraries..."
REQUIRED_LIBS=(
    "libgtk-3"
    "libgconf-2"
    "libxss1"
    "libnss3"
    "libasound2"
)

for lib in "${REQUIRED_LIBS[@]}"; do
    if ldconfig -p | grep -q "$lib" 2>/dev/null; then
        echo "✓ Library available: $lib"
    elif find /usr/lib* /lib* -name "*$lib*" 2>/dev/null | head -1 | grep -q "$lib"; then
        echo "✓ Library found: $lib"
    else
        echo "⚠ Library may be missing: $lib"
    fi
done
echo ""

# Test audio system
echo "16. Testing Audio System..."
if command -v pulseaudio >/dev/null 2>&1; then
    echo "✓ PulseAudio available"
elif command -v alsamixer >/dev/null 2>&1; then
    echo "✓ ALSA available"
elif command -v pactl >/dev/null 2>&1; then
    echo "✓ PipeWire/PulseAudio available"
else
    echo "⚠ No audio system detected"
fi
echo ""

# Test terminal capabilities
echo "17. Testing Terminal Capabilities..."
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

# Test process limits
echo "18. Testing Process Limits..."
echo "Max processes: $(ulimit -u)"
echo "Max open files: $(ulimit -n)"
echo "Max memory (KB): $(ulimit -m)"
echo ""

# Test network connectivity
echo "19. Testing Network Connectivity..."
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✓ Internet connectivity available"
else
    echo "⚠ Internet connectivity limited or unavailable"
fi
echo ""

# Performance test
echo "20. Testing Application Performance Setup..."
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

# Test distribution-specific features
echo "21. Testing Distribution-Specific Features..."
if command -v systemd-detect-virt >/dev/null 2>&1; then
    VIRT=$(systemd-detect-virt 2>/dev/null || echo "none")
    echo "Virtualization: $VIRT"
fi

if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
        ubuntu|debian)
            echo "✓ Debian-based system detected"
            if command -v snap >/dev/null 2>&1; then
                echo "  - Snap support available"
            fi
            ;;
        fedora|rhel|centos)
            echo "✓ Red Hat-based system detected"
            if command -v dnf >/dev/null 2>&1; then
                echo "  - DNF package manager available"
            fi
            ;;
        arch|manjaro)
            echo "✓ Arch-based system detected"
            if command -v pacman >/dev/null 2>&1; then
                echo "  - Pacman package manager available"
            fi
            ;;
        opensuse*)
            echo "✓ openSUSE system detected"
            ;;
        *)
            echo "ℹ Generic Linux system"
            ;;
    esac
fi
echo ""

# Summary
echo "======================================="
echo "Linux Testing Complete!"
echo "======================================="
echo "Test completed at: $(date)"
echo ""
echo "System Summary:"
echo "  Distribution: $DISTRO"
echo "  Kernel: $(uname -r)"
echo "  Architecture: $(uname -m)"
echo "  Desktop: ${XDG_CURRENT_DESKTOP:-${DESKTOP_SESSION:-Unknown}}"
echo "  Display: ${WAYLAND_DISPLAY:+Wayland}${DISPLAY:+X11}${WAYLAND_DISPLAY}${DISPLAY}"
echo "  Shell: $SHELL"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "  Git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')"
echo ""
echo "Next steps:"
echo "1. Install missing dependencies using your package manager"
echo "2. Run 'npm install' if node_modules are missing"
echo "3. Run 'npm start' to launch the application"  
echo "4. Test all UI functionality manually"
echo "5. Test project detection with real projects"
echo "6. Verify desktop integration works properly"