// Performance analysis tool for Easy Debug
const fs = require('fs');
const path = require('path');
const util = require('util');

class PerformanceAnalyzer {
    constructor() {
        this.results = {
            bundleSize: {},
            dependencies: {},
            fileAnalysis: {},
            recommendations: []
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

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async analyzeBundleSize() {
        this.log('🔍 Analyzing Bundle Size...', 'info');
        
        try {
            // Analyze node_modules size
            const nodeModulesPath = 'node_modules';
            if (fs.existsSync(nodeModulesPath)) {
                const nodeModulesSize = this.getDirectorySize(nodeModulesPath);
                this.results.bundleSize.nodeModules = nodeModulesSize;
                this.log(`  node_modules: ${this.formatBytes(nodeModulesSize)}`, 'info');
            }

            // Analyze source code size
            const sourceDirectories = ['renderer', 'terminal', 'tests'];
            let totalSourceSize = 0;
            
            sourceDirectories.forEach(dir => {
                if (fs.existsSync(dir)) {
                    const size = this.getDirectorySize(dir);
                    this.results.bundleSize[dir] = size;
                    totalSourceSize += size;
                    this.log(`  ${dir}/: ${this.formatBytes(size)}`, 'info');
                }
            });

            // Analyze main files
            const mainFiles = ['main.js', 'package.json'];
            mainFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const size = fs.statSync(file).size;
                    this.results.bundleSize[file] = size;
                    this.log(`  ${file}: ${this.formatBytes(size)}`, 'info');
                }
            });

            this.results.bundleSize.totalSource = totalSourceSize;
            
            // Check for large files
            this.findLargeFiles();
            
        } catch (error) {
            this.log(`Bundle size analysis failed: ${error.message}`, 'error');
        }
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                try {
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isFile()) {
                        totalSize += stats.size;
                    } else if (stats.isDirectory()) {
                        totalSize += this.getDirectorySize(filePath);
                    }
                } catch (error) {
                    // Skip files that can't be accessed
                }
            });
        } catch (error) {
            // Skip directories that can't be read
        }
        
        return totalSize;
    }

    findLargeFiles(threshold = 1024 * 100) { // Files larger than 100KB
        this.log('🔍 Finding Large Files...', 'info');
        const largeFiles = [];
        
        const scanDirectory = (dir) => {
            try {
                const files = fs.readdirSync(dir);
                
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        
                        if (stats.isFile() && stats.size > threshold) {
                            largeFiles.push({
                                path: filePath,
                                size: stats.size
                            });
                        } else if (stats.isDirectory() && !filePath.includes('node_modules')) {
                            scanDirectory(filePath);
                        }
                    } catch (error) {
                        // Skip files that can't be accessed
                    }
                });
            } catch (error) {
                // Skip directories that can't be read
            }
        };

        // Scan source directories only (excluding node_modules for now)
        ['renderer', 'terminal', 'tests'].forEach(dir => {
            if (fs.existsSync(dir)) {
                scanDirectory(dir);
            }
        });

        if (largeFiles.length > 0) {
            this.log('  Large files found:', 'warning');
            largeFiles.forEach(file => {
                this.log(`    ${file.path}: ${this.formatBytes(file.size)}`, 'warning');
            });
            this.results.fileAnalysis.largeFiles = largeFiles;
        } else {
            this.log('  No large files found in source code', 'success');
        }
    }

    async analyzeDependencies() {
        this.log('📦 Analyzing Dependencies...', 'info');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Analyze production dependencies
            const deps = packageJson.dependencies || {};
            const devDeps = packageJson.devDependencies || {};
            
            this.log(`  Production dependencies: ${Object.keys(deps).length}`, 'info');
            this.log(`  Development dependencies: ${Object.keys(devDeps).length}`, 'info');
            
            this.results.dependencies.production = deps;
            this.results.dependencies.development = devDeps;
            
            // Analyze dependency sizes
            const heavyDependencies = [];
            
            Object.keys(deps).forEach(dep => {
                const depPath = path.join('node_modules', dep);
                if (fs.existsSync(depPath)) {
                    const size = this.getDirectorySize(depPath);
                    if (size > 1024 * 1024) { // Larger than 1MB
                        heavyDependencies.push({ name: dep, size });
                    }
                }
            });
            
            if (heavyDependencies.length > 0) {
                this.log('  Heavy dependencies (>1MB):', 'warning');
                heavyDependencies.forEach(dep => {
                    this.log(`    ${dep.name}: ${this.formatBytes(dep.size)}`, 'warning');
                });
                this.results.dependencies.heavy = heavyDependencies;
            }
            
            // Check for unused dependencies
            this.checkUnusedDependencies(deps);
            
        } catch (error) {
            this.log(`Dependency analysis failed: ${error.message}`, 'error');
        }
    }

    checkUnusedDependencies(deps) {
        this.log('🔍 Checking for unused dependencies...', 'info');
        const unusedDeps = [];
        
        // Read all source files to check for imports/requires
        const sourceContent = this.getAllSourceContent();
        
        Object.keys(deps).forEach(dep => {
            // Check if dependency is referenced in source code
            const isUsed = sourceContent.some(content => 
                content.includes(`require('${dep}')`) ||
                content.includes(`require("${dep}")`) ||
                content.includes(`import`) && content.includes(dep) ||
                content.includes(`from '${dep}'`) ||
                content.includes(`from "${dep}"`)
            );
            
            if (!isUsed) {
                unusedDeps.push(dep);
            }
        });
        
        if (unusedDeps.length > 0) {
            this.log('  Potentially unused dependencies:', 'warning');
            unusedDeps.forEach(dep => {
                this.log(`    ${dep}`, 'warning');
            });
            this.results.dependencies.unused = unusedDeps;
        } else {
            this.log('  All dependencies appear to be used', 'success');
        }
    }

    getAllSourceContent() {
        const sourceContent = [];
        
        const readDirectory = (dir) => {
            try {
                const files = fs.readdirSync(dir);
                
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        
                        if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.html'))) {
                            const content = fs.readFileSync(filePath, 'utf8');
                            sourceContent.push(content);
                        } else if (stats.isDirectory()) {
                            readDirectory(filePath);
                        }
                    } catch (error) {
                        // Skip files that can't be read
                    }
                });
            } catch (error) {
                // Skip directories that can't be read
            }
        };

        // Read main file
        if (fs.existsSync('main.js')) {
            sourceContent.push(fs.readFileSync('main.js', 'utf8'));
        }
        
        // Read source directories
        ['renderer', 'terminal'].forEach(dir => {
            if (fs.existsSync(dir)) {
                readDirectory(dir);
            }
        });
        
        return sourceContent;
    }

    analyzeRuntimePerformance() {
        this.log('⚡ Analyzing Runtime Performance Patterns...', 'info');
        
        const sourceContent = this.getAllSourceContent();
        const issues = [];
        
        sourceContent.forEach((content, index) => {
            // Check for performance anti-patterns
            
            // 1. Excessive DOM queries
            const domQueries = content.match(/document\.getElementById|document\.querySelector|document\.querySelectorAll/g);
            if (domQueries && domQueries.length > 10) {
                issues.push({
                    type: 'excessive_dom_queries',
                    count: domQueries.length,
                    fileIndex: index,
                    recommendation: 'Cache DOM elements instead of querying repeatedly'
                });
            }
            
            // 2. Synchronous file operations
            const syncOps = content.match(/fs\.readFileSync|fs\.writeFileSync|fs\.existsSync/g);
            if (syncOps && syncOps.length > 5) {
                issues.push({
                    type: 'sync_file_operations',
                    count: syncOps.length,
                    fileIndex: index,
                    recommendation: 'Consider using async file operations for better performance'
                });
            }
            
            // 3. Memory leaks potential
            const intervals = content.match(/setInterval|setTimeout/g);
            const clearIntervals = content.match(/clearInterval|clearTimeout/g);
            if (intervals && intervals.length > (clearIntervals ? clearIntervals.length : 0)) {
                issues.push({
                    type: 'potential_memory_leaks',
                    intervals: intervals.length,
                    clears: clearIntervals ? clearIntervals.length : 0,
                    fileIndex: index,
                    recommendation: 'Ensure all intervals and timeouts are properly cleared'
                });
            }
            
            // 4. Large string operations
            const stringOps = content.match(/\.split\(|\.join\(|\.replace\(/g);
            if (stringOps && stringOps.length > 20) {
                issues.push({
                    type: 'heavy_string_operations',
                    count: stringOps.length,
                    fileIndex: index,
                    recommendation: 'Consider caching results of heavy string operations'
                });
            }
        });
        
        if (issues.length > 0) {
            this.log('  Performance issues found:', 'warning');
            issues.forEach(issue => {
                this.log(`    ${issue.type}: ${JSON.stringify(issue)}`, 'warning');
            });
            this.results.fileAnalysis.performanceIssues = issues;
        } else {
            this.log('  No major performance issues detected', 'success');
        }
    }

    generateRecommendations() {
        this.log('💡 Generating Performance Recommendations...', 'info');
        
        const recommendations = [];
        
        // Bundle size recommendations
        if (this.results.bundleSize.nodeModules > 100 * 1024 * 1024) { // > 100MB
            recommendations.push({
                category: 'bundle_size',
                priority: 'high',
                issue: 'Large node_modules size',
                recommendation: 'Consider using electron-builder to exclude dev dependencies from production build'
            });
        }
        
        if (this.results.dependencies.heavy && this.results.dependencies.heavy.length > 0) {
            recommendations.push({
                category: 'dependencies',
                priority: 'medium',
                issue: 'Heavy dependencies detected',
                recommendation: 'Review heavy dependencies and consider lighter alternatives',
                details: this.results.dependencies.heavy.map(d => d.name)
            });
        }
        
        if (this.results.dependencies.unused && this.results.dependencies.unused.length > 0) {
            recommendations.push({
                category: 'dependencies',
                priority: 'medium',
                issue: 'Unused dependencies detected',
                recommendation: 'Remove unused dependencies to reduce bundle size',
                details: this.results.dependencies.unused
            });
        }
        
        if (this.results.fileAnalysis.largeFiles && this.results.fileAnalysis.largeFiles.length > 0) {
            recommendations.push({
                category: 'file_size',
                priority: 'medium',
                issue: 'Large source files detected',
                recommendation: 'Consider splitting large files into smaller modules',
                details: this.results.fileAnalysis.largeFiles.map(f => f.path)
            });
        }
        
        // Runtime performance recommendations
        if (this.results.fileAnalysis.performanceIssues && this.results.fileAnalysis.performanceIssues.length > 0) {
            this.results.fileAnalysis.performanceIssues.forEach(issue => {
                recommendations.push({
                    category: 'runtime_performance',
                    priority: issue.type === 'potential_memory_leaks' ? 'high' : 'medium',
                    issue: issue.type,
                    recommendation: issue.recommendation
                });
            });
        }
        
        // General recommendations
        recommendations.push({
            category: 'optimization',
            priority: 'low',
            issue: 'General optimization',
            recommendation: 'Enable JavaScript minification in production builds'
        });
        
        recommendations.push({
            category: 'optimization',
            priority: 'low',
            issue: 'General optimization',
            recommendation: 'Use Electron builder with asar packaging for better performance'
        });
        
        this.results.recommendations = recommendations;
        
        // Display recommendations
        recommendations.forEach(rec => {
            const priority = rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info';
            this.log(`  [${rec.priority.toUpperCase()}] ${rec.issue}: ${rec.recommendation}`, priority);
            if (rec.details) {
                this.log(`    Details: ${Array.isArray(rec.details) ? rec.details.join(', ') : rec.details}`, 'info');
            }
        });
    }

    async runAnalysis() {
        this.log('🚀 Starting Performance Analysis...', 'success');
        console.log('');
        
        await this.analyzeBundleSize();
        console.log('');
        
        await this.analyzeDependencies();
        console.log('');
        
        this.analyzeRuntimePerformance();
        console.log('');
        
        this.generateRecommendations();
        console.log('');
        
        this.printSummary();
        
        return this.results;
    }

    printSummary() {
        this.log('📊 Performance Analysis Summary', 'success');
        this.log('================================', 'success');
        
        const totalBundleSize = Object.values(this.results.bundleSize)
            .filter(size => typeof size === 'number')
            .reduce((total, size) => total + size, 0);
            
        this.log(`Total Bundle Size: ${this.formatBytes(totalBundleSize)}`, 'info');
        
        if (this.results.bundleSize.nodeModules) {
            this.log(`Node Modules: ${this.formatBytes(this.results.bundleSize.nodeModules)}`, 'info');
        }
        
        if (this.results.bundleSize.totalSource) {
            this.log(`Source Code: ${this.formatBytes(this.results.bundleSize.totalSource)}`, 'info');
        }
        
        const prodDeps = Object.keys(this.results.dependencies.production || {}).length;
        const devDeps = Object.keys(this.results.dependencies.development || {}).length;
        this.log(`Dependencies: ${prodDeps} production, ${devDeps} development`, 'info');
        
        const highPriorityRecs = this.results.recommendations.filter(r => r.priority === 'high').length;
        const mediumPriorityRecs = this.results.recommendations.filter(r => r.priority === 'medium').length;
        
        this.log(`Recommendations: ${highPriorityRecs} high priority, ${mediumPriorityRecs} medium priority`, 
                highPriorityRecs > 0 ? 'warning' : 'success');
        
        console.log('');
        this.log('Analysis complete! Review recommendations above for optimization opportunities.', 'success');
    }
}

// Run analysis if this file is executed directly
if (require.main === module) {
    const analyzer = new PerformanceAnalyzer();
    analyzer.runAnalysis().catch(console.error);
}

module.exports = PerformanceAnalyzer;