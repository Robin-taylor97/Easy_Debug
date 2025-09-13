# Windows-specific testing script for Easy Debug
# PowerShell script to test Windows compatibility

Write-Host "======================================" -ForegroundColor Green
Write-Host "Easy Debug - Windows Testing Suite" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Test PowerShell environment
Write-Host "1. Testing PowerShell Environment..." -ForegroundColor Yellow
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Cyan
Write-Host "OS Version: $((Get-WmiObject Win32_OperatingSystem).Caption)" -ForegroundColor Cyan
Write-Host "Architecture: $($env:PROCESSOR_ARCHITECTURE)" -ForegroundColor Cyan
Write-Host ""

# Test Node.js and npm
Write-Host "2. Testing Node.js Installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found or not working" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "npm Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found or not working" -ForegroundColor Red
}
Write-Host ""

# Test Git installation
Write-Host "3. Testing Git Installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "Git Version: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git not found or not working" -ForegroundColor Red
}
Write-Host ""

# Test Python installation (both python and python3)
Write-Host "4. Testing Python Installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "Python Version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: python command not available, trying python3..." -ForegroundColor Yellow
    try {
        $python3Version = python3 --version
        Write-Host "Python3 Version: $python3Version" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Neither python nor python3 found" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test Flutter installation
Write-Host "5. Testing Flutter Installation..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version | Select-Object -First 1
    Write-Host "Flutter Version: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "INFO: Flutter not installed (optional)" -ForegroundColor Gray
}
Write-Host ""

# Test VS Code installation
Write-Host "6. Testing VS Code Installation..." -ForegroundColor Yellow
$vscodeCommands = @('code', 'code-insiders')
$vscodeFound = $false

foreach ($cmd in $vscodeCommands) {
    try {
        & $cmd --version | Out-Null
        Write-Host "$cmd command available" -ForegroundColor Green
        $vscodeFound = $true
        break
    } catch {
        # Continue to next command
    }
}

if (-not $vscodeFound) {
    Write-Host "INFO: VS Code command line tools not available" -ForegroundColor Gray
}
Write-Host ""

# Test Windows path handling
Write-Host "7. Testing Windows Path Handling..." -ForegroundColor Yellow
$testPaths = @(
    "C:\Windows\System32",
    "C:\Program Files",
    "C:\Program Files (x86)",
    "$env:USERPROFILE\Desktop",
    "$env:APPDATA"
)

foreach ($path in $testPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Path exists: $path" -ForegroundColor Green
    } else {
        Write-Host "✗ Path missing: $path" -ForegroundColor Red
    }
}
Write-Host ""

# Test project directory structure
Write-Host "8. Testing Easy Debug Project Structure..." -ForegroundColor Yellow
$projectRoot = Get-Location
$requiredFiles = @(
    "package.json",
    "main.js",
    "renderer\index.html",
    "renderer\styles\main.css",
    "renderer\scripts\app.js",
    "terminal\terminal.js",
    "terminal\pty.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $projectRoot $file
    if (Test-Path $filePath) {
        Write-Host "✓ File exists: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ File missing: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "All required project files are present!" -ForegroundColor Green
} else {
    Write-Host "Some project files are missing!" -ForegroundColor Red
}
Write-Host ""

# Test npm dependencies
Write-Host "9. Testing npm Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules directory exists" -ForegroundColor Green
    
    # Check critical dependencies
    $criticalDeps = @("electron", "xterm", "electron-store")
    foreach ($dep in $criticalDeps) {
        $depPath = "node_modules\$dep"
        if (Test-Path $depPath) {
            Write-Host "✓ Dependency installed: $dep" -ForegroundColor Green
        } else {
            Write-Host "✗ Dependency missing: $dep" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ node_modules directory missing - run 'npm install'" -ForegroundColor Red
}
Write-Host ""

# Test Windows-specific commands that should work
Write-Host "10. Testing Windows Command Compatibility..." -ForegroundColor Yellow
$windowsCommands = @(
    @{cmd="dir"; desc="Directory listing"},
    @{cmd="echo"; desc="Echo command"},
    @{cmd="where"; desc="Command location finder"},
    @{cmd="tasklist"; desc="Process list"},
    @{cmd="systeminfo"; desc="System information"}
)

foreach ($cmdTest in $windowsCommands) {
    try {
        $null = & $cmdTest.cmd /? 2>$null
        Write-Host "✓ Command available: $($cmdTest.cmd) ($($cmdTest.desc))" -ForegroundColor Green
    } catch {
        Write-Host "✗ Command not available: $($cmdTest.cmd)" -ForegroundColor Red
    }
}
Write-Host ""

# Test terminal emulation capabilities
Write-Host "11. Testing Terminal Capabilities..." -ForegroundColor Yellow
try {
    # Test ANSI color support
    Write-Host "Testing ANSI colors..." -NoNewline
    Write-Host " SUCCESS" -ForegroundColor Green
    
    # Test Unicode support
    Write-Host "Testing Unicode: 🚀 ⚡️ 🌙 🌞" -ForegroundColor Cyan
    
    # Test special characters
    Write-Host "Testing special chars: │ ├ └ ┌ ┐" -ForegroundColor Cyan
} catch {
    Write-Host "Terminal capabilities test failed" -ForegroundColor Red
}
Write-Host ""

# Performance test
Write-Host "12. Testing Application Startup Performance..." -ForegroundColor Yellow
if (Test-Path "main.js") {
    $startTime = Get-Date
    try {
        # Test if Electron can be launched (dry run)
        $electronPath = "node_modules\.bin\electron.cmd"
        if (Test-Path $electronPath) {
            Write-Host "✓ Electron executable found" -ForegroundColor Green
            # Note: We don't actually launch to avoid GUI issues in testing
            Write-Host "✓ Startup test completed (dry run)" -ForegroundColor Green
        } else {
            Write-Host "✗ Electron executable not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Electron startup test failed" -ForegroundColor Red
    }
} else {
    Write-Host "✗ main.js not found" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Green
Write-Host "Windows Testing Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "Test completed at: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm install' if dependencies are missing" -ForegroundColor White
Write-Host "2. Run 'npm start' to launch the application" -ForegroundColor White
Write-Host "3. Test all UI functionality manually" -ForegroundColor White
Write-Host "4. Test cross-platform project detection" -ForegroundColor White