// Linux Electron application compatibility test
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class LinuxAppTester {
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
        this.log('Linux Electron App Compatibility Test', 'info');
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

        // Test 2: Linux environment variables
        this.test('Linux environment variables accessible', () => {
            const linuxEnvVars = ['HOME', 'USER', 'PATH', 'SHELL'];
            const missingVars = linuxEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingVars.length > 0) {
                return `Missing Linux env vars: ${missingVars.join(', ')}`;
            }
            return true;
        });

        // Test 3: Home directory access
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

        // Test 4: XDG Base Directory specification
        this.test('XDG Base Directory support', () => {
            const homeDir = os.homedir();
            const configDir = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
            const dataDir = process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
            const cacheDir = process.env.XDG_CACHE_HOME || path.join(homeDir, '.cache');
            
            return path.isAbsolute(configDir) && path.isAbsolute(dataDir) && path.isAbsolute(cacheDir);
        });

        // Test 5: Display server detection
        this.test('Display server availability', () => {
            const hasWayland = !!process.env.WAYLAND_DISPLAY;
            const hasX11 = !!process.env.DISPLAY;
            
            if (hasWayland || hasX11) {
                return true;
            } else {
                return 'warning'; // Might be running headless
            }
        });

        // Test 6: File permissions handling
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

        // Test 7: Process spawning
        await this.testAsync('Shell process spawning works on Linux', async () => {
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
                'node_modules/.bin/electron',       // Standard location
                'node_modules/electron/dist/electron' // Direct binary
            ];
            
            for (const electronPath of electronPaths) {
                if (fs.existsSync(electronPath)) {
                    // Check if it's executable
                    try {
                        const stats = fs.statSync(electronPath);
                        const isExecutable = stats.mode & parseInt('100', 8);
                        return isExecutable ? true : 'warning';
                    } catch (error) {
                        continue;
                    }
                }
            }
            return 'Electron executable not found';
        });

        // Test 9: System libraries for Electron
        await this.testAsync('Required system libraries available', async () => {
            const requiredLibs = ['libgtk-3', 'libnss3', 'libasound2'];
            
            for (const lib of requiredLibs) {
                try {
                    await new Promise((resolve, reject) => {
                        const child = spawn('ldconfig', ['-p'], { stdio: 'pipe' });
                        let output = '';
                        
                        child.stdout.on('data', (data) => {
                            output += data.toString();
                        });
                        
                        child.on('close', (code) => {
                            if (code === 0 && output.includes(lib)) {
                                resolve();
                            } else {
                                reject(new Error(`Library ${lib} not found`));
                            }
                        });
                        
                        child.on('error', reject);
                    });
                } catch (error) {
                    return `Required library missing: ${lib}`;
                }
            }
            return true;
        });

        // Test 10: Audio system availability
        await this.testAsync('Audio system available', async () => {
            const audioSystems = ['pulseaudio', 'pipewire', 'alsa'];
            
            for (const system of audioSystems) {
                try {
                    await new Promise((resolve, reject) => {
                        const child = spawn('which', [system], { stdio: 'pipe' });
                        child.on('close', (code) => {
                            if (code === 0) {
                                resolve();
                            } else {
                                reject(new Error(`${system} not found`));
                            }
                        });
                        child.on('error', reject);
                    });
                    return true; // Found at least one audio system
                } catch (error) {
                    continue;
                }
            }
            return 'warning'; // No audio systems found, but app might still work
        });

        // Test 11: Font rendering support
        this.test('Font rendering libraries available', () => {
            try {
                // Test if fontconfig is available (common on Linux)
                const fontDirs = ['/usr/share/fonts', '/etc/fonts'];
                return fontDirs.some(dir => fs.existsSync(dir));
            } catch (error) {
                return 'warning';
            }
        });

        // Test 12: Desktop integration
        this.test('Desktop integration capabilities', () => {
            const homeDir = os.homedir();
            const desktopDirs = [
                path.join(homeDir, '.local/share/applications'),
                '/usr/share/applications',
                path.join(homeDir, 'Desktop')
            ];
            
            // Check if at least one desktop integration directory exists
            return desktopDirs.some(dir => {
                try {
                    return fs.existsSync(dir);
                } catch (error) {
                    return false;
                }
            });
        });

        // Test 13: Notification system
        await this.testAsync('Notification system available', async () => {
            try {
                await new Promise((resolve, reject) => {
                    const child = spawn('which', ['notify-send'], { stdio: 'pipe' });
                    child.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error('notify-send not found'));
                        }
                    });
                    child.on('error', reject);
                });
                return true;
            } catch (error) {
                return 'warning'; // Notifications are optional
            }
        });

        // Test 14: Terminal capabilities
        this.test('Terminal ANSI color support', () => {
            const colorTerms = ['xterm-256color', 'screen-256color', 'linux'];
            const currentTerm = process.env.TERM;
            
            return currentTerm && (currentTerm.includes('color') || currentTerm === 'linux') ? true : 'warning';
        });

        // Test 15: Package manager detection
        await this.testAsync('Package manager available', async () => {
            const packageManagers = ['apt', 'yum', 'dnf', 'pacman', 'zypper'];
            
            for (const pm of packageManagers) {
                try {
                    await new Promise((resolve, reject) => {
                        const child = spawn('which', [pm], { stdio: 'pipe' });
                        child.on('close', (code) => {
                            if (code === 0) {
                                resolve();
                            } else {
                                reject(new Error(`${pm} not found`));
                            }
                        });
                        child.on('error', reject);
                    });
                    return true; // Found at least one package manager
                } catch (error) {
                    continue;
                }
            }
            return 'warning'; // No standard package managers found
        });

        // Test 16: Security framework compatibility
        this.test('Security framework compatibility', () => {
            // Test basic security-related paths that might affect app execution
            const securityPaths = ['/etc/apparmor.d', '/etc/selinux'];
            
            // Just test awareness, not actual configuration
            const hasAppArmor = fs.existsSync('/etc/apparmor.d');
            const hasSELinux = fs.existsSync('/etc/selinux');
            
            if (hasAppArmor || hasSELinux) {
                return 'warning'; // Security frameworks present, may need configuration
            }
            return true;
        });

        // Test 17: Snap/Flatpak sandbox awareness
        this.test('Containerized app environment detection', () => {
            const snapEnv = process.env.SNAP;
            const flatpakId = process.env.FLATPAK_ID;
            const appImageEnv = process.env.APPIMAGE;
            
            if (snapEnv || flatpakId || appImageEnv) {
                return 'warning'; // Running in sandboxed environment
            }
            return true;
        });

        // Test 18: System resources
        this.test('System resource availability', () => {
            try {
                const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
                const memTotalMatch = memInfo.match(/MemTotal:\s+(\d+)\s+kB/);
                
                if (memTotalMatch) {
                    const memTotalMB = parseInt(memTotalMatch[1]) / 1024;
                    return memTotalMB > 512; // At least 512MB RAM
                }
                return 'warning';
            } catch (error) {
                return 'warning';
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
        this.log('Linux App Compatibility Test Complete!', 'success');
        
        if (this.results.failed === 0) {
            this.log('✅ Easy Debug is ready to run on Linux!', 'success');
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
        this.log(`  Desktop: ${process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || 'unknown'}`, 'info');
        this.log(`  Display: ${process.env.WAYLAND_DISPLAY ? 'Wayland' : process.env.DISPLAY ? 'X11' : 'none'}`, 'info');
        
        // Try to detect distribution
        try {
            if (fs.existsSync('/etc/os-release')) {
                const release = fs.readFileSync('/etc/os-release', 'utf8');
                const distroMatch = release.match(/^PRETTY_NAME="(.+)"$/m);
                if (distroMatch) {
                    this.log(`  Distribution: ${distroMatch[1]}`, 'info');
                }
            }
        } catch (error) {
            // Ignore if can't read os-release
        }
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new LinuxAppTester();
    tester.runAllTests().catch(console.error);
}

module.exports = LinuxAppTester;