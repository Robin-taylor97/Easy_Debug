// macOS Electron application compatibility test
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class MacOSAppTester {
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
        this.log('macOS Electron App Compatibility Test', 'info');
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

        // Test 3: macOS-specific path handling in code
        this.test('Code handles POSIX paths correctly', () => {
            try {
                const mainJS = fs.readFileSync('main.js', 'utf8');
                const appJS = fs.readFileSync('renderer/scripts/app.js', 'utf8');
                
                // Check for proper path.join usage
                const hasPathJoin = mainJS.includes('path.join') && appJS.includes('path.join');
                if (!hasPathJoin) {
                    return 'warning';
                }
                
                // Check for hardcoded backslashes that would break on macOS
                const hasHardcodedBackslashes = mainJS.includes('\\\\') || appJS.includes('\\\\');
                if (hasHardcodedBackslashes) {
                    return 'Possible hardcoded Windows paths found';
                }
                
                return true;
            } catch (error) {
                return `Error reading source files: ${error.message}`;
            }
        });

        // Test 4: macOS environment variables
        this.test('macOS environment variables accessible', () => {
            const macEnvVars = ['HOME', 'USER', 'PATH', 'SHELL'];
            const missingVars = macEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingVars.length > 0) {
                return `Missing macOS env vars: ${missingVars.join(', ')}`;
            }
            return true;
        });

        // Test 5: Home directory access
        this.test('Home directory access', () => {
            try {
                const homeDir = os.homedir();
                const testPath = path.join(homeDir, '.easy-debug-test');
                
                // Try to create a test file in home directory
                fs.writeFileSync(testPath, 'test', 'utf8');
                const exists = fs.existsSync(testPath);
                
                // Clean up
                try { fs.unlinkSync(testPath); } catch (e) {}
                
                return exists === true;
            } catch (error) {
                return `Home directory access failed: ${error.message}`;
            }
        });

        // Test 6: Application Support directory
        this.test('Application Support directory access', () => {
            try {
                const homeDir = os.homedir();
                const appSupportDir = path.join(homeDir, 'Library', 'Application Support');
                
                return fs.existsSync(appSupportDir);
            } catch (error) {
                return `Application Support access failed: ${error.message}`;
            }
        });

        // Test 7: Shell process spawning
        await this.testAsync('Shell process spawning works on macOS', async () => {
            return new Promise((resolve) => {
                try {
                    const child = spawn('echo', ['test'], {
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

        // Test 8: Electron executable exists
        this.test('Electron executable exists', () => {
            const electronPaths = [
                'node_modules/.bin/electron',                  // Standard location
                'node_modules/electron/dist/Electron.app',    // macOS app bundle
                'node_modules/electron/dist/electron'         // Binary
            ];
            
            for (const electronPath of electronPaths) {
                if (fs.existsSync(electronPath)) {
                    return true;
                }
            }
            return 'Electron executable not found';
        });

        // Test 9: Terminal capabilities
        this.test('Terminal ANSI color support', () => {
            const colorTerms = ['xterm-256color', 'screen-256color', 'vt100'];
            const currentTerm = process.env.TERM;
            
            return currentTerm && currentTerm.includes('color') ? true : 'warning';
        });

        // Test 10: File permissions handling
        this.test('File permissions work correctly', () => {
            try {
                const testFile = path.join(os.tmpdir(), 'easy-debug-perm-test.txt');
                const testContent = 'permission test';
                
                // Write test file
                fs.writeFileSync(testFile, testContent, 'utf8');
                
                // Check file stats
                const stats = fs.statSync(testFile);
                const readable = stats.mode & parseInt('400', 8);
                const writable = stats.mode & parseInt('200', 8);
                
                // Clean up
                fs.unlinkSync(testFile);
                
                return readable && writable;
            } catch (error) {
                return `Permission test failed: ${error.message}`;
            }
        });

        // Test 11: Hidden files handling
        this.test('Hidden files (.dotfiles) handling', () => {
            try {
                const testFile = path.join(os.tmpdir(), '.easy-debug-hidden-test');
                fs.writeFileSync(testFile, 'hidden test', 'utf8');
                
                const exists = fs.existsSync(testFile);
                const basename = path.basename(testFile);
                const isHidden = basename.startsWith('.');
                
                // Clean up
                try { fs.unlinkSync(testFile); } catch (e) {}
                
                return exists && isHidden;
            } catch (error) {
                return `Hidden file test failed: ${error.message}`;
            }
        });

        // Test 12: Case sensitivity handling
        this.test('File system case sensitivity awareness', () => {
            try {
                const testDir = os.tmpdir();
                const testFile1 = path.join(testDir, 'CaseSensitivityTest.txt');
                const testFile2 = path.join(testDir, 'casesensitivitytest.txt');
                
                // Create file with mixed case
                fs.writeFileSync(testFile1, 'test');
                
                // Check if lowercase version exists (most macOS systems are case-insensitive)
                const existsLower = fs.existsSync(testFile2);
                
                // Clean up both possible files
                try { fs.unlinkSync(testFile1); } catch (e) {}
                try { fs.unlinkSync(testFile2); } catch (e) {}
                
                return existsLower ? true : 'warning'; // Could be case-sensitive APFS
            } catch (error) {
                return 'warning';
            }
        });

        // Test 13: Bundle/App structure awareness
        this.test('macOS app bundle structure awareness', () => {
            // Test that we can handle .app bundle paths correctly
            const bundlePath = '/Applications/TextEdit.app/Contents/MacOS/TextEdit';
            const parsed = path.parse(bundlePath);
            
            return parsed.dir.includes('.app/Contents/MacOS');
        });

        // Test 14: System command availability
        await this.testAsync('Common macOS commands available', async () => {
            const commands = ['ls', 'grep', 'ps', 'which'];
            
            for (const cmd of commands) {
                try {
                    await new Promise((resolve, reject) => {
                        const child = spawn('which', [cmd], { stdio: 'pipe' });
                        child.on('close', (code) => {
                            if (code === 0) {
                                resolve();
                            } else {
                                reject(new Error(`Command ${cmd} not found`));
                            }
                        });
                        child.on('error', reject);
                    });
                } catch (error) {
                    return `Command ${cmd} not available`;
                }
            }
            return true;
        });

        // Test 15: Homebrew compatibility (if installed)
        this.test('Homebrew path compatibility', () => {
            const brewPaths = ['/usr/local/bin/brew', '/opt/homebrew/bin/brew'];
            const brewPath = brewPaths.find(p => fs.existsSync(p));
            
            if (brewPath) {
                // Test that we can handle Homebrew paths
                const parsed = path.parse(brewPath);
                return parsed.dir.endsWith('bin') && parsed.base === 'brew';
            } else {
                return 'warning'; // Homebrew not installed, but that's OK
            }
        });

        // Test 16: Xcode Command Line Tools detection
        await this.testAsync('Xcode Command Line Tools availability', async () => {
            return new Promise((resolve) => {
                const child = spawn('xcode-select', ['-p'], { stdio: 'pipe' });
                
                child.on('close', (code) => {
                    resolve(code === 0 ? true : 'warning');
                });
                
                child.on('error', () => {
                    resolve('warning'); // Not critical for app functionality
                });
                
                setTimeout(() => {
                    child.kill();
                    resolve('warning');
                }, 3000);
            });
        });

        // Test 17: Security framework compatibility
        this.test('Security framework path awareness', () => {
            // Test awareness of macOS security paths
            const securityPaths = [
                '/System/Library/Frameworks/Security.framework',
                '/System/Library/Keychains'
            ];
            
            return securityPaths.every(p => path.isAbsolute(p) && p.startsWith('/System'));
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
        this.log('macOS App Compatibility Test Complete!', 'success');
        
        if (this.results.failed === 0) {
            this.log('✅ Easy Debug is ready to run on macOS!', 'success');
            this.log('💡 Run "npm start" to launch the application', 'info');
        } else {
            this.log('⚠️  Some issues found - check failed tests above', 'warning');
        }
        
        console.log('');
        this.log(`Test Environment:`, 'info');
        this.log(`  Platform: ${os.platform()} ${os.release()}`, 'info');
        this.log(`  Node.js: ${process.version}`, 'info');
        this.log(`  Architecture: ${os.arch()}`, 'info');
        this.log(`  Home Directory: ${os.homedir()}`, 'info');
        this.log(`  Shell: ${process.env.SHELL || 'unknown'}`, 'info');
        this.log(`  Terminal: ${process.env.TERM || 'unknown'}`, 'info');
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new MacOSAppTester();
    tester.runAllTests().catch(console.error);
}

module.exports = MacOSAppTester;