// Performance-optimized version of app.js
const { ipcRenderer, shell } = require('electron');
const TerminalManager = require('../../terminal/terminal.js');
const fs = require('fs');
const path = require('path');

// Performance-optimized EasyDebugApp
class EasyDebugApp {
    constructor() {
        this.terminalManager = new TerminalManager();
        this.currentProject = null;
        this.currentTheme = 'dark';
        this.isResizing = false;
        this.terminalCounter = 1;
        this.activeTerminals = new Map();
        this.customCommands = [];
        this.editingCommandId = null;
        this.commandHistory = [];
        this.filteredHistory = [];
        
        // Performance utilities
        this.performanceUtils = window.performanceUtils;
        
        // Cached DOM elements to reduce queries
        this.domElements = {};
        
        // Debounced functions
        this.debouncedUpdateVersions = this.performanceUtils.debounce(
            () => this.updateSystemVersions(), 1000
        );
        this.debouncedFilterHistory = this.performanceUtils.debounce(
            (query) => this.filterCommandHistory(query), 300
        );
        this.debouncedSearch = this.performanceUtils.debounce(
            (event) => this.handleHistorySearch(event), 300
        );
        
        // Throttled functions
        this.throttledResizeHandler = this.performanceUtils.throttle(
            (event) => this.handlePanelResize(event), 16
        );
        
        // Cleanup tracking
        this.activeTimeouts = new Set();
        this.activeIntervals = new Set();
        
        this.init();
    }

    // Optimized DOM element caching
    getElement(id, forceRefresh = false) {
        if (!forceRefresh && this.domElements[id]) {
            return this.domElements[id];
        }
        
        const element = document.getElementById(id);
        if (element) {
            this.domElements[id] = element;
        }
        return element;
    }

    // Safe timeout with cleanup tracking
    safeSetTimeout(callback, delay) {
        const timeoutId = this.performanceUtils.setTimeout(callback, delay);
        this.activeTimeouts.add(timeoutId);
        return timeoutId;
    }

    // Safe interval with cleanup tracking  
    safeSetInterval(callback, interval) {
        const intervalId = this.performanceUtils.setInterval(callback, interval);
        this.activeIntervals.add(intervalId);
        return intervalId;
    }

    // Clear timeout safely
    safeClearTimeout(timeoutId) {
        this.performanceUtils.clearTimeout(timeoutId);
        this.activeTimeouts.delete(timeoutId);
    }

    // Clear interval safely
    safeClearInterval(intervalId) {
        this.performanceUtils.clearInterval(intervalId);
        this.activeIntervals.delete(intervalId);
    }

    async init() {
        try {
            // Pre-cache frequently used DOM elements
            this.cacheMainElements();
            
            // Initialize components with performance measurement
            await this.performanceUtils.measureAsyncPerformance('App Init', async () => {
                await this.loadTheme();
                await this.loadCustomCommands();
                await this.loadCommandHistory();
                this.setupEventListeners();
                this.initializeComponents();
                this.debouncedUpdateVersions();
            });
            
            this.performanceUtils.logMemoryUsage('App Initialized');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    cacheMainElements() {
        // Cache frequently accessed elements
        const elementIds = [
            'folder-picker-btn',
            'current-folder',
            'project-types',
            'system-versions',
            'terminal-container', 
            'terminal-tabs',
            'toast-container',
            'custom-command-modal',
            'commit-message-modal',
            'history-modal',
            'history-search',
            'history-list',
            'theme-toggle'
        ];

        elementIds.forEach(id => {
            this.getElement(id);
        });
    }

    setupEventListeners() {
        // Use cached elements and add proper cleanup
        const folderBtn = this.getElement('folder-picker-btn');
        const themeToggle = this.getElement('theme-toggle');
        const historySearch = this.getElement('history-search');

        if (folderBtn) {
            const folderHandler = () => this.selectFolder();
            folderBtn.addEventListener('click', folderHandler);
            
            // Store handler for cleanup
            folderBtn._handler = folderHandler;
        }

        if (themeToggle) {
            const themeHandler = () => this.toggleTheme();
            themeToggle.addEventListener('click', themeHandler);
            themeToggle._handler = themeHandler;
        }

        if (historySearch) {
            historySearch.addEventListener('input', this.debouncedSearch);
            historySearch._handler = this.debouncedSearch;
        }

        // Panel resizer with throttling
        this.setupPanelResizer();
        
        // Window cleanup
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupPanelResizer() {
        const resizer = document.querySelector('.panel-resizer');
        if (resizer) {
            let isResizing = false;
            
            const startResize = () => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
            };
            
            const stopResize = () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                }
            };
            
            const handleResize = this.performanceUtils.throttle((e) => {
                if (isResizing) {
                    const leftPanel = this.getElement('left-panel');
                    if (leftPanel) {
                        const newWidth = e.clientX;
                        if (newWidth > 200 && newWidth < 600) {
                            leftPanel.style.width = `${newWidth}px`;
                        }
                    }
                }
            }, 16); // 60fps
            
            resizer.addEventListener('mousedown', startResize);
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
            
            // Store handlers for cleanup
            resizer._handlers = {
                mousedown: startResize,
                mousemove: handleResize,
                mouseup: stopResize
            };
        }
    }

    // Optimized toast notifications with cleanup
    showToast(message, type = 'info') {
        const container = this.getElement('toast-container');
        if (!container) return;

        // Use performanceUtils for batch DOM updates
        this.performanceUtils.batchDomUpdates(() => {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);

            // Trigger animation
            this.safeSetTimeout(() => toast.classList.add('show'), 10);

            // Remove toast after 3 seconds with proper cleanup
            this.safeSetTimeout(() => {
                toast.classList.remove('show');
                this.safeSetTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        });
    }

    // Optimized system versions update with async operations
    async updateSystemVersions() {
        try {
            const versions = await ipcRenderer.invoke('get-system-versions');
            const container = this.getElement('system-versions');
            
            if (!container) return;

            // Batch DOM updates for better performance  
            await this.performanceUtils.batchDomUpdates(() => {
                Object.entries(versions).forEach(([tool, version]) => {
                    const element = container.querySelector(`[data-tool="${tool}"]`);
                    if (element) {
                        element.textContent = version;
                        
                        // Color coding
                        element.className = version.includes('Not') || 
                                          version === 'Error' || 
                                          version === 'Timeout' 
                                          ? 'text-red-400' 
                                          : 'text-green-400';
                    }
                });
            });
        } catch (error) {
            console.error('Error updating system versions:', error);
        }
    }

    // Optimized command history filtering
    handleHistorySearch(event) {
        const query = event.target.value.toLowerCase();
        this.filterCommandHistory(query);
    }

    filterCommandHistory(query) {
        if (!query.trim()) {
            this.filteredHistory = [...this.commandHistory];
        } else {
            this.filteredHistory = this.commandHistory.filter(item =>
                item.command.toLowerCase().includes(query) ||
                item.projectPath.toLowerCase().includes(query)
            );
        }
        this.renderCommandHistory();
    }

    // Optimized history rendering with virtual scrolling for large lists
    renderCommandHistory() {
        const historyList = this.getElement('history-list');
        if (!historyList) return;

        // Use virtual scrolling for large lists
        if (this.filteredHistory.length > 100) {
            this.setupVirtualScrolling(historyList);
        } else {
            this.renderHistoryDirect(historyList);
        }
    }

    renderHistoryDirect(container) {
        // Batch DOM updates
        this.performanceUtils.batchDomUpdates(() => {
            container.innerHTML = '';
            
            this.filteredHistory.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div class="history-command">${this.escapeHtml(item.command)}</div>
                    <div class="history-meta">${item.projectPath} - ${item.formattedTime}</div>
                `;
                
                div.addEventListener('click', () => {
                    this.executeCommand(item.command);
                    this.hideHistoryModal();
                });
                
                container.appendChild(div);
            });
        });
    }

    setupVirtualScrolling(container) {
        const itemHeight = 60; // Approximate height of history item
        
        this.virtualScroller = this.performanceUtils.virtualScrollSetup(
            container,
            itemHeight,
            this.filteredHistory.length,
            (index) => {
                const item = this.filteredHistory[index];
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div class="history-command">${this.escapeHtml(item.command)}</div>
                    <div class="history-meta">${item.projectPath} - ${item.formattedTime}</div>
                `;
                
                div.addEventListener('click', () => {
                    this.executeCommand(item.command);
                    this.hideHistoryModal();
                });
                
                return div;
            }
        );
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Rest of the methods remain the same but with performance optimizations...
    async loadTheme() {
        try {
            const theme = await ipcRenderer.invoke('get-theme');
            this.currentTheme = theme || 'dark';
            this.applyTheme(this.currentTheme);
        } catch (error) {
            console.error('Error loading theme:', error);
            this.currentTheme = 'dark';
            this.applyTheme(this.currentTheme);
        }
    }

    applyTheme(theme) {
        this.performanceUtils.batchDomUpdates(() => {
            const body = document.body;
            const themeToggle = this.getElement('theme-toggle');
            
            if (theme === 'light') {
                body.classList.add('light-theme');
                if (themeToggle) themeToggle.innerHTML = '🌞';
            } else {
                body.classList.remove('light-theme');
                if (themeToggle) themeToggle.innerHTML = '🌙';
            }
        });
    }

    async toggleTheme() {
        try {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            await ipcRenderer.invoke('set-theme', newTheme);
            this.currentTheme = newTheme;
            this.applyTheme(newTheme);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    // Cleanup method to prevent memory leaks
    cleanup() {
        // Clear all timeouts and intervals
        this.activeTimeouts.forEach(id => this.safeClearTimeout(id));
        this.activeIntervals.forEach(id => this.safeClearInterval(id));
        
        // Cleanup virtual scroller if exists
        if (this.virtualScroller) {
            this.virtualScroller.destroy();
        }
        
        // Remove event listeners
        Object.values(this.domElements).forEach(element => {
            if (element && element._handler) {
                element.removeEventListener('click', element._handler);
                element.removeEventListener('input', element._handler);
            }
        });
        
        // Cleanup panel resizer
        const resizer = document.querySelector('.panel-resizer');
        if (resizer && resizer._handlers) {
            Object.entries(resizer._handlers).forEach(([event, handler]) => {
                if (event === 'mousemove' || event === 'mouseup') {
                    document.removeEventListener(event, handler);
                } else {
                    resizer.removeEventListener(event, handler);
                }
            });
        }
        
        // Use performanceUtils cleanup
        this.performanceUtils.cleanup();
        
        this.performanceUtils.logMemoryUsage('App Cleanup Complete');
    }

    // Stub methods - implement as needed with performance optimizations
    async selectFolder() {
        // Implementation with caching and debouncing
    }
    
    async loadCustomCommands() {
        // Implementation with async operations
    }
    
    async loadCommandHistory() {
        // Implementation with lazy loading
    }
    
    executeCommand(command) {
        // Implementation with performance monitoring
    }
    
    hideHistoryModal() {
        const modal = this.getElement('history-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    initializeComponents() {
        // Component initialization with performance monitoring
    }
}

// Export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyDebugApp;
} else if (typeof window !== 'undefined') {
    window.EasyDebugApp = EasyDebugApp;
}