// Windows Electron application compatibility test
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class WindowsAppTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',      // Cyan
            success: '\x1b[32m',   // Green
            error: '\x1b[31m',     // Red
            warning: '\x1b[33m',   // Yellow
            reset: '\x1b[0m'       // Reset
        };
        
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    test(description, testFn) {
        try {
            const result = testFn();
            if (result === true) {
                this.results.passed++;
                this.log(`✓ ${description}`, 'success');
                this.results.tests.push({ description, status: 'passed' });
            } else if (result === 'warning') {
                this.results.warnings++;
                this.log(`⚠ ${description}`, 'warning');
                this.results.tests.push({ description, status: 'warning' });
            } else {
                this.results.failed++;
                this.log(`✗ ${description}`, 'error');
                this.results.tests.push({ description, status: 'failed', error: result });
            }
        } catch (error) {
            this.results.failed++;
            this.log(`✗ ${description} - ${error.message}`, 'error');
            this.results.tests.push({ description, status: 'failed', error: error.message });
        }
    }

    async testAsync(description, testFn) {
        try {
            const result = await testFn();
            if (result === true) {
                this.results.passed++;
                this.log(`✓ ${description}`, 'success');
                this.results.tests.push({ description, status: 'passed' });
            } else if (result === 'warning') {
                this.results.warnings++;
                this.log(`⚠ ${description}`, 'warning');
                this.results.tests.push({ description, status: 'warning' });
            } else {
                this.results.failed++;
                this.log(`✗ ${description}`, 'error');
                this.results.tests.push({ description, status: 'failed', error: result });
            }
        } catch (error) {
            this.results.failed++;
            this.log(`✗ ${description} - ${error.message}`, 'error');
            this.results.tests.push({ description, status: 'failed', error: error.message });
        }
    }

    async runAllTests() {
        this.log('========================================', 'info');
        this.log('Windows Electron App Compatibility Test', 'info');
        this.log('========================================', 'info');
        console.log('');

        // Test 1: Package.json exists and is valid
        this.test('package.json exists and is valid', () => {
            if (!fs.existsSync('package.json')) {
                return 'package.json not found';
            }
            
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                return pkg.name === 'easy-debug' && pkg.main === 'main.js';
            } catch (error) {
                return `Invalid package.json: ${error.message}`;
            }
        });

        // Test 2: Main process file exists
        this.test('Electron main process file exists', () => {
            return fs.existsSync('main.js');
        });

        // Test 3: Renderer files exist
        this.test('Renderer process files exist', () => {
            const requiredFiles = [
                'renderer/index.html',
                'renderer/styles/main.css',
                'renderer/scripts/app.js'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    return `Missing file: ${file}`;
                }
            }
            return true;
        });

        // Test 4: Terminal integration files exist
        this.test('Terminal integration files exist', () => {
            const terminalFiles = [
                'terminal/terminal.js',
                'terminal/pty.js'
            ];
            
            for (const file of terminalFiles) {
                if (!fs.existsSync(file)) {
                    return `Missing file: ${file}`;
                }
            }
            return true;
        });

        // Test 5: Node modules dependencies
        this.test('Required dependencies are installed', () => {
            if (!fs.existsSync('node_modules')) {
                return 'node_modules directory not found - run npm install';
            }
            
            const criticalDeps = ['electron', 'xterm', 'electron-store'];
            for (const dep of criticalDeps) {
                if (!fs.existsSync(path.join('node_modules', dep))) {
                    return `Missing dependency: ${dep}`;
                }
            }
            return true;
        });

        // Test 6: Windows-specific file paths in code
        this.test('Code handles Windows paths correctly', () => {
            try {
                const mainJS = fs.readFileSync('main.js', 'utf8');
                const appJS = fs.readFileSync('renderer/scripts/app.js', 'utf8');
                
                // Check for proper path.join usage
                const hasPathJoin = mainJS.includes('path.join') && appJS.includes('path.join');
                if (!hasPathJoin) {
                    return 'warning'; // May work but could have issues
                }
                
                // Check for hardcoded forward slashes that might break on Windows
                const hasHardcodedPaths = mainJS.includes("'/") || appJS.includes("'/");
                if (hasHardcodedPaths) {
                    return 'Possible hardcoded Unix paths found';
                }
                
                return true;
            } catch (error) {
                return `Error reading source files: ${error.message}`;
            }
        });

        // Test 7: Electron executable exists
        this.test('Electron executable exists', () => {
            const electronPaths = [
                'node_modules/.bin/electron.cmd',    // Windows npm
                'node_modules/.bin/electron',        // Unix-style
                'node_modules/electron/dist/electron.exe' // Direct executable
            ];
            
            for (const electronPath of electronPaths) {
                if (fs.existsSync(electronPath)) {
                    return true;
                }
            }
            return 'Electron executable not found';
        });

        // Test 8: Windows-specific features in main.js
        this.test('Windows-specific Electron features', () => {
            try {
                const mainJS = fs.readFileSync('main.js', 'utf8');
                
                // Check for Windows-specific considerations
                const hasWindowsConsiderations = 
                    mainJS.includes('win32') || 
                    mainJS.includes('platform') || 
                    mainJS.includes('process.platform');
                
                return hasWindowsConsiderations ? true : 'warning';
            } catch (error) {
                return `Error reading main.js: ${error.message}`;
            }
        });

        // Test 9: Check for Windows environment variables
        this.test('Windows environment variables accessible', () => {
            const winEnvVars = ['USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMFILES'];
            const missingVars = winEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingVars.length > 0) {
                return `Missing Windows env vars: ${missingVars.join(', ')}`;
            }
            return true;
        });

        // Test 10: Test spawning processes (simulate terminal functionality)
        await this.testAsync('Process spawning works on Windows', async () => {
            return new Promise((resolve) => {
                try {
                    const child = spawn('echo', ['test'], {
                        shell: true,
                        stdio: 'pipe'
                    });
                    
                    let output = '';
                    child.stdout.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    child.on('close', (code) => {
                        if (code === 0 && output.trim() === 'test') {
                            resolve(true);
                        } else {
                            resolve(`Process spawn failed: code ${code}, output: ${output}`);
                        }
                    });
                    
                    child.on('error', (error) => {
                        resolve(`Process spawn error: ${error.message}`);
                    });
                    
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        child.kill();
                        resolve('Process spawn timeout');
                    }, 5000);
                } catch (error) {
                    resolve(`Process spawn exception: ${error.message}`);
                }
            });
        });

        // Test 11: Test file system operations
        this.test('File system operations work correctly', () => {
            try {
                const testFile = path.join(process.env.TEMP || 'C:\\temp', 'easy-debug-test.txt');
                const testContent = 'Easy Debug Windows Test';
                
                // Write test file
                fs.writeFileSync(testFile, testContent, 'utf8');
                
                // Read test file
                const readContent = fs.readFileSync(testFile, 'utf8');
                
                // Clean up
                fs.unlinkSync(testFile);
                
                return readContent === testContent;
            } catch (error) {
                return `File system test failed: ${error.message}`;
            }
        });

        // Test 12: JSON parsing (for settings/config)
        this.test('JSON configuration handling', () => {
            try {
                const testConfig = {
                    theme: 'dark',
                    recentProjects: ['C:\\Projects\\Test'],
                    customCommands: []
                };
                
                const jsonString = JSON.stringify(testConfig, null, 2);
                const parsedConfig = JSON.parse(jsonString);
                
                return parsedConfig.theme === 'dark' && 
                       Array.isArray(parsedConfig.recentProjects) &&
                       parsedConfig.recentProjects[0].includes('C:\\');
            } catch (error) {
                return `JSON handling failed: ${error.message}`;
            }
        });

        console.log('');
        this.printSummary();
    }

    printSummary() {
        this.log('========================================', 'info');
        this.log('Test Summary', 'info');
        this.log('========================================', 'info');
        this.log(`✓ Passed: ${this.results.passed}`, 'success');
        this.log(`⚠ Warnings: ${this.results.warnings}`, 'warning');
        this.log(`✗ Failed: ${this.results.failed}`, 'error');
        this.log(`Total Tests: ${this.results.tests.length}`, 'info');
        
        const successRate = ((this.results.passed + this.results.warnings) / this.results.tests.length * 100).toFixed(1);
        this.log(`Success Rate: ${successRate}%`, successRate > 80 ? 'success' : 'warning');

        if (this.results.failed > 0) {
            console.log('');
            this.log('Failed Tests:', 'error');
            this.results.tests
                .filter(test => test.status === 'failed')
                .forEach(test => {
                    this.log(`  • ${test.description}`, 'error');
                    if (test.error) {
                        this.log(`    Error: ${test.error}`, 'error');
                    }
                });
        }

        console.log('');
        this.log('Windows App Compatibility Test Complete!', 'success');
        
        if (this.results.failed === 0) {
            this.log('✅ Easy Debug is ready to run on Windows!', 'success');
            this.log('💡 Run "npm start" to launch the application', 'info');
        } else {
            this.log('⚠️  Some issues found - check failed tests above', 'warning');
        }
        
        console.log('');
        this.log(`Test Environment:`, 'info');
        this.log(`  Platform: ${process.platform}`, 'info');
        this.log(`  Node.js: ${process.version}`, 'info');
        this.log(`  Architecture: ${process.arch}`, 'info');
        this.log(`  Working Directory: ${process.cwd()}`, 'info');
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new WindowsAppTester();
    tester.runAllTests().catch(console.error);
}

module.exports = WindowsAppTester;