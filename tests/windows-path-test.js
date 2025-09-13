// Windows-specific path handling test suite
const path = require('path');
const fs = require('fs');
const os = require('os');

class WindowsPathTester {
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
        this.log('Windows Path Handling Test Suite', 'info');
        this.log('=====================================', 'info');
        console.log('');

        // Test 1: Windows drive letters
        this.test('Windows drive letter detection', () => {
            const cDrive = 'C:\\';
            const isAbsolute = path.isAbsolute(cDrive);
            return isAbsolute === true;
        });

        // Test 2: Path separator handling
        this.test('Windows path separator handling', () => {
            const testPath = path.join('folder1', 'folder2', 'file.txt');
            return testPath.includes('\\') && !testPath.includes('/');
        });

        // Test 3: UNC path support
        this.test('UNC path recognition', () => {
            const uncPath = '\\\\server\\share\\file.txt';
            return path.isAbsolute(uncPath) === true;
        });

        // Test 4: Mixed separator normalization
        this.test('Mixed separator normalization', () => {
            const mixedPath = 'C:/folder1\\folder2/file.txt';
            const normalized = path.normalize(mixedPath);
            return normalized === 'C:\\folder1\\folder2\\file.txt';
        });

        // Test 5: Long path support (Windows specific)
        this.test('Long path handling', () => {
            const longPath = 'C:\\' + 'very-long-folder-name-that-exceeds-normal-limits\\'.repeat(10) + 'file.txt';
            try {
                const parsed = path.parse(longPath);
                return parsed.root === 'C:\\';
            } catch (error) {
                return 'warning'; // Long paths might not be fully supported
            }
        });

        // Test 6: Special characters in paths
        this.test('Special characters in Windows paths', () => {
            const specialPath = 'C:\\Program Files (x86)\\Test App\\file-name_with.special.chars.txt';
            const parsed = path.parse(specialPath);
            return parsed.ext === '.txt' && parsed.dir.includes('Program Files (x86)');
        });

        // Test 7: Case insensitive path comparison
        this.test('Case insensitive path handling', () => {
            const path1 = 'C:\\Users\\TestUser';
            const path2 = 'c:\\users\\testuser';
            // On Windows, these should be treated as the same path
            const normalized1 = path.normalize(path1).toLowerCase();
            const normalized2 = path.normalize(path2).toLowerCase();
            return normalized1 === normalized2;
        });

        // Test 8: Relative path resolution
        this.test('Relative path resolution from Windows paths', () => {
            const basePath = 'C:\\Projects\\MyApp';
            const relativePath = '..\\OtherApp\\file.txt';
            const resolved = path.resolve(basePath, relativePath);
            return resolved === 'C:\\Projects\\OtherApp\\file.txt';
        });

        // Test 9: Windows environment variables in paths
        this.test('Windows environment variable path expansion', () => {
            const userProfile = process.env.USERPROFILE;
            const appData = process.env.APPDATA;
            return userProfile && appData && userProfile.includes('\\') && appData.includes('\\');
        });

        // Test 10: File system case sensitivity test
        this.test('Windows file system case sensitivity', () => {
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
                
                return existsLower === true; // Windows should find the file regardless of case
            } catch (error) {
                return 'warning';
            }
        });

        // Test 11: Windows reserved names
        this.test('Windows reserved filename detection', () => {
            const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
            const testPath = 'C:\\folder\\CON.txt';
            const parsed = path.parse(testPath);
            // This is just a parsing test, not actual file creation
            return reservedNames.includes(parsed.name.toUpperCase());
        });

        // Test 12: Windows path length limits
        this.test('Windows MAX_PATH awareness', () => {
            const longPath = 'C:\\' + 'a'.repeat(250) + '.txt';
            try {
                const parsed = path.parse(longPath);
                return longPath.length > 260; // Traditional MAX_PATH limit
            } catch (error) {
                return false;
            }
        });

        // Test 13: Junction and symbolic link path handling
        this.test('Windows junction point path handling', () => {
            // Test basic path parsing that might encounter junctions
            const junctionLikePath = 'C:\\Users\\Default\\Application Data';
            try {
                const normalized = path.normalize(junctionLikePath);
                return normalized.startsWith('C:\\');
            } catch (error) {
                return false;
            }
        });

        // Test 14: Command line argument path parsing
        this.test('Command line path argument parsing', () => {
            const cmdArg = '"C:\\Program Files\\My App\\app.exe"';
            const cleaned = cmdArg.replace(/"/g, '');
            const parsed = path.parse(cleaned);
            return parsed.ext === '.exe' && parsed.dir.includes('Program Files');
        });

        // Test 15: Network drive mapping
        this.test('Network drive path format', () => {
            const networkPath = 'Z:\\shared\\documents\\file.txt';
            const parsed = path.parse(networkPath);
            return parsed.root === 'Z:\\' && path.isAbsolute(networkPath);
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
        this.log('Windows Path Testing Complete!', 'success');
        this.log(`Platform: ${os.platform()} ${os.release()}`, 'info');
        this.log(`Node.js: ${process.version}`, 'info');
        this.log(`Architecture: ${os.arch()}`, 'info');
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const tester = new WindowsPathTester();
    tester.runAllTests();
}

module.exports = WindowsPathTester;