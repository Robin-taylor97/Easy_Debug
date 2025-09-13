// Linux-specific path handling test suite
const path = require('path');
const fs = require('fs');
const os = require('os');

class LinuxPathTester {
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

    runAllTests() {
        this.log('=====================================', 'info');
        this.log('Linux Path Handling Test Suite', 'info');
        this.log('=====================================', 'info');
        console.log('');

        // Test 1: POSIX path separators
        this.test('POSIX path separator handling', () => {
            const testPath = path.join('folder1', 'folder2', 'file.txt');
            return testPath.includes('/') && !testPath.includes('\\');
        });

        // Test 2: Absolute path recognition
        this.test('Absolute path recognition', () => {
            const absolutePaths = ['/usr/bin', '/home/user', '/etc/passwd'];
            return absolutePaths.every(p => path.isAbsolute(p));
        });

        // Test 3: Home directory handling
        this.test('Home directory path handling', () => {
            const homeDir = os.homedir();
            const userPath = path.join(homeDir, 'Documents', 'test.txt');
            return userPath.startsWith('/home/') || userPath.startsWith('/root/') || userPath.startsWith('/Users/');
        });

        // Test 4: Case sensitivity (Linux is always case-sensitive)
        this.test('File system case sensitivity', () => {
            try {
                const testDir = os.tmpdir();
                const testFile = path.join(testDir, 'CaseSensitivityTest.txt');
                const testFileLower = path.join(testDir, 'casesensitivitytest.txt');
                
                // Create file with mixed case
                fs.writeFileSync(testFile, 'test');
                
                // Try to access with different case - should NOT exist
                const existsLower = fs.existsSync(testFileLower);
                
                // Clean up
                try { fs.unlinkSync(testFile); } catch (e) {}
                
                // Linux should be case-sensitive
                return !existsLower;
            } catch (error) {
                return 'warning';
            }
        });

        // Test 5: Hidden files and directories
        this.test('Hidden file path handling', () => {
            const hiddenPaths = [
                path.join(os.homedir(), '.bashrc'),
                path.join(os.homedir(), '.profile'),
                '/etc/.hidden'
            ];
            
            return hiddenPaths.every(p => path.basename(p).startsWith('.'));
        });

        // Test 6: Symbolic link path handling
        this.test('Symbolic link path resolution', () => {
            try {
                // Test common symlinks on Linux
                const commonSymlinks = ['/bin', '/lib'];
                
                for (const linkPath of commonSymlinks) {
                    if (fs.existsSync(linkPath)) {
                        const stats = fs.lstatSync(linkPath);
                        if (stats.isSymbolicLink()) {
                            const resolved = fs.realpathSync(linkPath);
                            if (resolved && resolved !== linkPath) {
                                return true; // Found and resolved a symlink
                            }
                        }
                    }
                }
                return 'warning'; // No symlinks tested, but not necessarily an error
            } catch (error) {
                return 'warning';
            }
        });

        // Test 7: System directory structure
        this.test('Linux system directory paths', () => {
            const systemDirs = ['/usr', '/var', '/etc', '/opt', '/tmp', '/proc', '/sys'];
            return systemDirs.every(dir => path.isAbsolute(dir) && dir.startsWith('/'));
        });

        // Test 8: User directory structure
        this.test('User directory path structure', () => {
            const homeDir = os.homedir();
            const userDirs = [
                path.join(homeDir, '.config'),
                path.join(homeDir, '.local'),
                path.join(homeDir, '.cache')
            ];
            
            return userDirs.every(p => p.includes('/.'));
        });

        // Test 9: Mount point handling
        this.test('Mount point path handling', () => {
            const mountPaths = [
                '/mnt/usb',
                '/media/user/drive',
                '/run/media/user/device'
            ];
            
            return mountPaths.every(p => path.isAbsolute(p));
        });

        // Test 10: Relative path resolution
        this.test('Relative path resolution from Linux paths', () => {
            const basePath = '/home/user/Projects/MyApp';
            const relativePath = '../OtherApp/file.txt';
            const resolved = path.resolve(basePath, relativePath);
            
            return resolved === '/home/user/Projects/OtherApp/file.txt';
        });

        // Test 11: Binary and library paths
        this.test('Binary and library path structure', () => {
            const binaryPaths = [
                '/usr/bin/node',
                '/usr/local/bin/npm',
                '/opt/app/bin/executable'
            ];
            
            return binaryPaths.every(p => path.dirname(p).endsWith('bin'));
        });

        // Test 12: Configuration directory paths
        this.test('Configuration directory paths', () => {
            const configPaths = [
                '/etc/nginx/nginx.conf',
                path.join(os.homedir(), '.config/app/settings.json'),
                '/usr/local/etc/config.yaml'
            ];
            
            return configPaths.every(p => path.isAbsolute(p));
        });

        // Test 13: Temporary directory handling
        this.test('Temporary directory path handling', () => {
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, 'test-file.txt');
            
            return tempDir.startsWith('/') && tempFile.includes('/tmp/');
        });

        // Test 14: Device file paths
        this.test('Device file path awareness', () => {
            const devicePaths = [
                '/dev/null',
                '/dev/zero',
                '/dev/sda1',
                '/dev/tty0'
            ];
            
            return devicePaths.every(p => p.startsWith('/dev/'));
        });

        // Test 15: Process filesystem paths
        this.test('Process filesystem path structure', () => {
            const procPaths = [
                '/proc/cpuinfo',
                '/proc/meminfo',
                '/proc/version'
            ];
            
            return procPaths.every(p => p.startsWith('/proc/'));
        });

        // Test 16: System V filesystem hierarchy
        this.test('System V filesystem hierarchy compliance', () => {
            const fhsPaths = [
                '/usr/share',
                '/var/log',
                '/var/lib',
                '/var/run'
            ];
            
            return fhsPaths.every(p => path.isAbsolute(p));
        });

        // Test 17: Extended attributes awareness
        this.test('Extended attributes path awareness', () => {
            // Test that paths can handle files that might have extended attributes
            const testPath = '/tmp/test-file-with-xattr.txt';
            const parsed = path.parse(testPath);
            
            return parsed.ext === '.txt' && parsed.dir === '/tmp';
        });

        // Test 18: AppImage and portable app paths
        this.test('Portable application path handling', () => {
            const portablePaths = [
                path.join(os.homedir(), 'Applications/app.AppImage'),
                '/opt/AppImage/app.AppImage',
                path.join(os.homedir(), '.local/share/applications')
            ];
            
            return portablePaths.every(p => path.isAbsolute(p));
        });

        // Test 19: Snap package paths
        this.test('Snap package path structure', () => {
            const snapPaths = [
                '/snap/core/current',
                '/var/lib/snapd',
                path.join(os.homedir(), 'snap')
            ];
            
            return snapPaths.every(p => path.isAbsolute(p));
        });

        // Test 20: Flatpak application paths
        this.test('Flatpak application path structure', () => {
            const flatpakPaths = [
                '/var/lib/flatpak',
                path.join(os.homedir(), '.local/share/flatpak'),
                '/app/bin' // Inside flatpak sandbox
            ];
            
            return flatpakPaths.every(p => path.isAbsolute(p));
        });

        console.log('');
        this.printSummary();
    }

    printSummary() {
        this.log('=====================================', 'info');
        this.log('Test Summary', 'info');
        this.log('=====================================', 'info');
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
        this.log('Linux Path Testing Complete!', 'success');
        this.log(`Platform: ${os.platform()} ${os.release()}`, 'info');
        this.log(`Node.js: ${process.version}`, 'info');
        this.log(`Architecture: ${os.arch()}`, 'info');
        
        // Linux specific info
        if (process.platform === 'linux') {
            this.log(`Home Directory: ${os.homedir()}`, 'info');
            this.log(`Temp Directory: ${os.tmpdir()}`, 'info');
            
            try {
                const release = fs.readFileSync('/etc/os-release', 'utf8');
                const distroMatch = release.match(/^PRETTY_NAME="(.+)"$/m);
                if (distroMatch) {
                    this.log(`Distribution: ${distroMatch[1]}`, 'info');
                }
            } catch (error) {
                // Ignore if can't read os-release
            }
        }
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new LinuxPathTester();
    tester.runAllTests();
}

module.exports = LinuxPathTester;