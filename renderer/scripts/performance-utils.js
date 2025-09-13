// Performance utilities for Easy Debug
class PerformanceUtils {
    constructor() {
        this.domCache = new Map();
        this.intervals = new Set();
        this.timeouts = new Set();
        this.observers = new Set();
    }

    // DOM Element Caching
    getElement(id, forceRefresh = false) {
        if (!forceRefresh && this.domCache.has(id)) {
            return this.domCache.get(id);
        }
        
        const element = document.getElementById(id);
        if (element) {
            this.domCache.set(id, element);
        }
        return element;
    }

    querySelector(selector, context = document, cache = false) {
        const cacheKey = `${selector}:${context === document ? 'document' : context.id || 'context'}`;
        
        if (cache && this.domCache.has(cacheKey)) {
            return this.domCache.get(cacheKey);
        }
        
        const element = context.querySelector(selector);
        if (cache && element) {
            this.domCache.set(cacheKey, element);
        }
        return element;
    }

    querySelectorAll(selector, context = document) {
        return context.querySelectorAll(selector);
    }

    clearDomCache() {
        this.domCache.clear();
    }

    // Safe Timer Management
    setTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            callback();
        }, delay);
        
        this.timeouts.add(timeoutId);
        return timeoutId;
    }

    setInterval(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this.intervals.add(intervalId);
        return intervalId;
    }

    clearTimeout(timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(timeoutId);
    }

    clearInterval(intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
    }

    // Observer Management
    createObserver(callback, options) {
        const observer = new MutationObserver(callback);
        this.observers.add(observer);
        return observer;
    }

    createIntersectionObserver(callback, options) {
        const observer = new IntersectionObserver(callback, options);
        this.observers.add(observer);
        return observer;
    }

    disconnectObserver(observer) {
        observer.disconnect();
        this.observers.delete(observer);
    }

    // Cleanup all resources
    cleanup() {
        // Clear all intervals
        this.intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.intervals.clear();

        // Clear all timeouts
        this.timeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.timeouts.clear();

        // Disconnect all observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();

        // Clear DOM cache
        this.clearDomCache();
    }

    // Debounce utility
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle utility
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Performance measurement
    measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    async measureAsyncPerformance(name, func) {
        const start = performance.now();
        const result = await func();
        const end = performance.now();
        console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Memory usage monitoring
    logMemoryUsage(label) {
        if (performance.memory) {
            console.log(`Memory Usage [${label}]:`, {
                used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
            });
        }
    }

    // Batch DOM operations
    batchDomUpdates(updates) {
        // Use requestAnimationFrame to batch DOM updates
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates();
                resolve();
            });
        });
    }

    // Virtual scrolling helper for large lists
    virtualScrollSetup(container, itemHeight, totalItems, renderItem) {
        const containerHeight = container.offsetHeight;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 1;
        let startIndex = 0;

        const updateView = () => {
            const scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleItems, totalItems);

            // Clear container
            container.innerHTML = '';

            // Create spacer for items above viewport
            if (startIndex > 0) {
                const topSpacer = document.createElement('div');
                topSpacer.style.height = `${startIndex * itemHeight}px`;
                container.appendChild(topSpacer);
            }

            // Render visible items
            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(i);
                container.appendChild(item);
            }

            // Create spacer for items below viewport
            if (endIndex < totalItems) {
                const bottomSpacer = document.createElement('div');
                bottomSpacer.style.height = `${(totalItems - endIndex) * itemHeight}px`;
                container.appendChild(bottomSpacer);
            }
        };

        // Throttled scroll handler
        const throttledUpdate = this.throttle(updateView, 16); // ~60fps
        container.addEventListener('scroll', throttledUpdate);

        // Initial render
        updateView();

        return {
            update: updateView,
            destroy: () => {
                container.removeEventListener('scroll', throttledUpdate);
            }
        };
    }
}

// Create global instance
const performanceUtils = new PerformanceUtils();

// Auto-cleanup on window unload
window.addEventListener('beforeunload', () => {
    performanceUtils.cleanup();
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
} else if (typeof window !== 'undefined') {
    window.PerformanceUtils = PerformanceUtils;
    window.performanceUtils = performanceUtils;
}