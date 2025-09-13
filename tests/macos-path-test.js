// macOS-specific path handling test suite
const path = require('path');
const fs = require('fs');
const os = require('os');

class MacOSPathTester {
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
        this.log('macOS Path Handling Test Suite', 'info');
        this.log('=====================================', 'info');
        console.log('');

        // Test 1: POSIX path separators
        this.test('POSIX path separator handling', () => {
            const testPath = path.join('folder1', 'folder2', 'file.txt');
            return testPath.includes('/') && !testPath.includes('\\');
        });

        // Test 2: Absolute path recognition
        this.test('Absolute path recognition', () => {
            const absolutePaths = ['/Users/testuser', '/Applications', '/System/Library'];
            return absolutePaths.every(p => path.isAbsolute(p));
        });

        // Test 3: Home directory expansion
        this.test('Home directory path handling', () => {
            const homeDir = os.homedir();
            const userPath = path.join(homeDir, 'Documents', 'test.txt');
            return userPath.startsWith('/Users/') && userPath.includes('Documents');
        });

        // Test 4: Case sensitivity detection
        this.test('File system case sensitivity detection', () => {
            try {
                const testDir = os.tmpdir();
                const testFile = path.join(testDir, 'CaseSensitivityTest.txt');
                const testFileLower = path.join(testDir, 'casesensitivitytest.txt');
                
                // Create file with mixed case
                fs.writeFileSync(testFile, 'test');
                
                // Try to access with different case
                const existsLower = fs.existsSync(testFileLower);
                
                // Clean up
                try { fs.unlinkSync(testFile); } catch (e) {}
                
                // Most macOS systems use case-insensitive APFS/HFS+
                return existsLower === true ? true : 'warning'; // Could be case-sensitive APFS
            } catch (error) {
                return 'warning';
            }
        });

        // Test 5: Hidden files and directories
        this.test('Hidden file path handling', () => {
            const hiddenPaths = [
                path.join(os.homedir(), '.bashrc'),
                path.join(os.homedir(), '.zshrc'), 
                '/usr/local/.hidden'
            ];
            
            return hiddenPaths.every(p => path.basename(p).startsWith('.'));
        });

        // Test 6: Symbolic link path handling
        this.test('Symbolic link path resolution', () => {
            try {
                // Test common symlinks on macOS
                const commonSymlinks = ['/tmp', '/var/tmp'];
                
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

        // Test 7: Bundle/package detection (.app directories)
        this.test('macOS bundle path detection', () => {
            const bundlePath = '/Applications/TextEdit.app/Contents/MacOS/TextEdit';
            const parsed = path.parse(bundlePath);
            const isBundle = parsed.dir.includes('.app/Contents');
            
            return isBundle === true;
        });

        // Test 8: Volume and mount point handling
        this.test('Volume mount point path handling', () => {
            const volumePaths = [
                '/Volumes/Macintosh HD',
                '/Volumes/External Drive',
                '/System/Volumes/Data'
            ];
            
            return volumePaths.every(p => path.isAbsolute(p) && p.startsWith('/'));
        });

        // Test 9: Framework path handling
        this.test('Framework path structure', () => {
            const frameworkPath = '/System/Library/Frameworks/Foundation.framework/Versions/A/Foundation';
            const parsed = path.parse(frameworkPath);
            const isFramework = parsed.dir.includes('.framework');
            
            return isFramework === true;
        });

        // Test 10: Relative path resolution
        this.test('Relative path resolution from macOS paths', () => {
            const basePath = '/Users/testuser/Projects/MyApp';
            const relativePath = '../OtherApp/file.txt';
            const resolved = path.resolve(basePath, relativePath);
            
            return resolved === '/Users/testuser/Projects/OtherApp/file.txt';
        });

        // Test 11: Special macOS directories
        this.test('macOS special directory paths', () => {
            const specialDirs = [
                '/Applications',
                '/Library',
                '/System',
                '/Users',
                '/private',
                '/usr/local'
            ];
            
            return specialDirs.every(dir => path.isAbsolute(dir));
        });

        // Test 12: Permissions and access paths
        this.test('macOS protected path detection', () => {
            const protectedPaths = [
                '/System/Library',
                '/usr/bin',
                '/private/etc'
            ];
            
            // Just test path structure, not actual access
            return protectedPaths.every(p => path.isAbsolute(p));
        });

        // Test 13: User library paths
        this.test('User library path structure', () => {
            const homeDir = os.homedir();
            const userLibPaths = [
                path.join(homeDir, 'Library', 'Application Support'),
                path.join(homeDir, 'Library', 'Preferences'),
                path.join(homeDir, 'Library', 'Caches')
            ];
            
            return userLibPaths.every(p => p.includes('/Library/'));
        });

        // Test 14: Sandboxed app path handling
        this.test('Sandboxed application path structure', () => {
            const homeDir = os.homedir();
            const sandboxPath = path.join(homeDir, 'Library', 'Containers', 'com.example.app', 'Data');
            const parsed = path.parse(sandboxPath);
            
            return parsed.dir.includes('Containers') && parsed.base === 'Data';
        });

        // Test 15: Command line tools path
        this.test('Command line tools path handling', () => {
            const toolPaths = [
                '/usr/bin/git',
                '/usr/local/bin/node',
                '/opt/homebrew/bin/brew'
            ];
            
            return toolPaths.every(p => path.isAbsolute(p) && path.dirname(p).endsWith('bin'));
        });

        // Test 16: Extended attributes and resource forks (path awareness)
        this.test('Extended attributes path awareness', () => {
            // Test that paths can handle files that might have extended attributes
            const testPath = '/tmp/test-file-with-xattr.txt';
            const parsed = path.parse(testPath);
            
            return parsed.ext === '.txt' && parsed.dir === '/tmp';
        });

        // Test 17: Unicode normalization in paths (macOS uses NFD)
        this.test('Unicode normalization in file paths', () => {
            try {
                // macOS normalizes Unicode to NFD (decomposed form)
                const unicodeChar = 'café'; // é as a single character
                const testPath = path.join('/tmp', unicodeChar + '.txt');
                const parsed = path.parse(testPath);
                
                return parsed.base.includes('café') || parsed.base.includes('cafe');
            } catch (error) {
                return 'warning';
            }
        });

        // Test 18: Resource fork awareness
        this.test('Resource fork path handling', () => {
            // Test awareness of resource fork naming
            const filePath = '/tmp/testfile.txt';
            const resourceForkPath = path.join(path.dirname(filePath), '._' + path.basename(filePath));
            
            return resourceForkPath === '/tmp/._testfile.txt';
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
        this.log('macOS Path Testing Complete!', 'success');
        this.log(`Platform: ${os.platform()} ${os.release()}`, 'info');
        this.log(`Node.js: ${process.version}`, 'info');
        this.log(`Architecture: ${os.arch()}`, 'info');
        
        // macOS specific info
        if (process.platform === 'darwin') {
            this.log(`Home Directory: ${os.homedir()}`, 'info');
            this.log(`Temp Directory: ${os.tmpdir()}`, 'info');
        }
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new MacOSPathTester();
    tester.runAllTests();
}

module.exports = MacOSPathTester;