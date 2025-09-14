const { ipcRenderer } = require('electron');
const logger = require('../../utils/renderer-logger');

class FileExplorer {
  constructor() {
    this.currentPath = '';
    this.isVisible = true;
    this.expandedFolders = new Set();

    logger.info('FileExplorer constructor started', {}, 'explorer');
    this.initializeEventListeners();
    logger.info('FileExplorer initialized', {}, 'explorer');
  }

  initializeEventListeners() {
    // Toggle explorer visibility
    const toggleBtn = document.getElementById('toggle-explorer-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleVisibility();
      });
    }

    // Refresh explorer
    const refreshBtn = document.getElementById('refresh-explorer-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshExplorer();
      });
    }

    // New file button
    const newFileBtn = document.getElementById('new-file-btn');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        this.createNewFile();
      });
    }

    // New folder button
    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        this.createNewFolder();
      });
    }

    logger.debug('File explorer event listeners initialized', {}, 'explorer');
  }

  async updatePath(newPath) {
    if (!newPath) return;

    logger.info('Updating file explorer path', { newPath, oldPath: this.currentPath }, 'explorer');
    this.currentPath = newPath;
    await this.loadDirectory(newPath);
  }

  async loadDirectory(path = this.currentPath) {
    if (!path) {
      this.showEmpty('No project selected');
      return;
    }

    const timer = logger.startTimer('load-directory');

    try {
      logger.debug('Loading directory contents', { path }, 'explorer');

      // Request directory contents from main process
      const result = await ipcRenderer.invoke('get-directory-contents', { path });

      if (result.success) {
        await this.renderTree(result.contents, path);
        logger.info('Directory loaded successfully', {
          path,
          itemCount: result.contents.length
        }, 'explorer');
      } else {
        throw new Error(result.error || 'Failed to load directory');
      }

      logger.endTimer(timer, { success: true, path, itemCount: result.contents.length });
    } catch (error) {
      logger.error('Error loading directory', error, { path }, 'explorer');
      this.showEmpty('Error loading directory');
      logger.endTimer(timer, { success: false, error: error.message });
    }
  }

  async renderTree(contents, basePath) {
    const treeContainer = document.getElementById('explorer-tree');
    if (!treeContainer) return;

    treeContainer.innerHTML = '';

    if (!contents || contents.length === 0) {
      this.showEmpty('Directory is empty');
      return;
    }

    // Sort contents: folders first, then files, both alphabetically
    const sortedContents = contents.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    const fragment = document.createDocumentFragment();

    for (const item of sortedContents) {
      const element = this.createTreeItem(item, basePath);
      fragment.appendChild(element);
    }

    treeContainer.appendChild(fragment);
    logger.debug('File tree rendered', { itemCount: sortedContents.length, basePath }, 'explorer');
  }

  createTreeItem(item, parentPath) {
    const itemPath = `${parentPath}\\${item.name}`;
    const isExpanded = this.expandedFolders.has(itemPath);

    if (item.isDirectory) {
      return this.createFolderItem(item, itemPath, isExpanded);
    } else {
      return this.createFileItem(item, itemPath);
    }
  }

  createFolderItem(folder, folderPath, isExpanded) {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-container';

    // Folder header
    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-item';
    folderHeader.dataset.path = folderPath;

    // Toggle arrow
    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';
    toggle.innerHTML = isExpanded ? '▼' : '▶';

    // Folder icon
    const icon = document.createElement('span');
    icon.className = `folder-icon ${isExpanded ? 'open' : ''}`;
    icon.innerHTML = isExpanded ? '📂' : '📁';

    // Folder name
    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folder.name;

    folderHeader.appendChild(toggle);
    folderHeader.appendChild(icon);
    folderHeader.appendChild(name);

    // Click handler for folder
    folderHeader.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleFolder(folderPath, folderHeader);
    });

    folderDiv.appendChild(folderHeader);

    // Children container
    const childrenDiv = document.createElement('div');
    childrenDiv.className = `file-children ${isExpanded ? '' : 'hidden'}`;
    childrenDiv.dataset.path = folderPath;

    if (isExpanded) {
      this.loadFolderContents(folderPath, childrenDiv);
    }

    folderDiv.appendChild(childrenDiv);

    return folderDiv;
  }

  createFileItem(file, filePath) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-item';
    fileDiv.dataset.path = filePath;

    // Get file extension for icon
    const ext = file.name.split('.').pop().toLowerCase();
    fileDiv.dataset.ext = ext;

    // File icon
    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.innerHTML = this.getFileIcon(ext);

    // File name
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;

    fileDiv.appendChild(icon);
    fileDiv.appendChild(name);

    // Click handler for file
    fileDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectFile(fileDiv, filePath);
    });

    // Double-click handler for opening file
    fileDiv.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.openFile(filePath);
    });

    return fileDiv;
  }

  getFileIcon(extension) {
    const icons = {
      'js': '📄',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'py': '🐍',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'pdf': '📕',
      'zip': '📦',
      'exe': '⚙️'
    };

    return icons[extension] || '📄';
  }

  async toggleFolder(folderPath, folderElement) {
    const isExpanded = this.expandedFolders.has(folderPath);
    const childrenDiv = folderElement.parentElement.querySelector('.file-children');
    const toggle = folderElement.querySelector('.folder-toggle');
    const icon = folderElement.querySelector('.folder-icon');

    if (isExpanded) {
      // Collapse folder
      this.expandedFolders.delete(folderPath);
      childrenDiv.classList.add('hidden');
      toggle.innerHTML = '▶';
      icon.innerHTML = '📁';
      icon.classList.remove('open');

      logger.debug('Folder collapsed', { folderPath }, 'explorer');
    } else {
      // Expand folder
      this.expandedFolders.add(folderPath);
      childrenDiv.classList.remove('hidden');
      toggle.innerHTML = '▼';
      icon.innerHTML = '📂';
      icon.classList.add('open');

      await this.loadFolderContents(folderPath, childrenDiv);
      logger.debug('Folder expanded', { folderPath }, 'explorer');
    }
  }

  async loadFolderContents(folderPath, container) {
    try {
      const result = await ipcRenderer.invoke('get-directory-contents', { path: folderPath });

      if (result.success && result.contents) {
        container.innerHTML = '';

        // Sort contents
        const sortedContents = result.contents.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
          }
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        const fragment = document.createDocumentFragment();

        for (const item of sortedContents) {
          const element = this.createTreeItem(item, folderPath);
          fragment.appendChild(element);
        }

        container.appendChild(fragment);
      } else {
        container.innerHTML = '<div class="explorer-empty">Error loading folder</div>';
      }
    } catch (error) {
      logger.error('Error loading folder contents', error, { folderPath }, 'explorer');
      container.innerHTML = '<div class="explorer-empty">Error loading folder</div>';
    }
  }

  selectFile(fileElement, filePath) {
    // Remove previous selection
    const previousSelected = document.querySelector('.file-item.selected, .folder-item.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Select current file
    fileElement.classList.add('selected');

    logger.debug('File selected', { filePath }, 'explorer');
  }

  async openFile(filePath) {
    try {
      logger.info('Opening file', { filePath }, 'explorer');

      // Request to open file with system default application
      const result = await ipcRenderer.invoke('open-file', { filePath });

      if (result.success) {
        logger.info('File opened successfully', { filePath }, 'explorer');
      } else {
        throw new Error(result.error || 'Failed to open file');
      }
    } catch (error) {
      logger.error('Error opening file', error, { filePath }, 'explorer');
      // Show toast notification
      if (window.showToast) {
        window.showToast(`Error opening file: ${error.message}`, 'error');
      }
    }
  }

  toggleVisibility() {
    const panel = document.getElementById('file-explorer-panel');
    const toggleBtn = document.getElementById('toggle-explorer-btn');

    if (this.isVisible) {
      panel.style.display = 'none';
      toggleBtn.textContent = 'Show';
      this.isVisible = false;
      logger.debug('File explorer hidden', {}, 'explorer');
    } else {
      panel.style.display = 'flex';
      toggleBtn.textContent = 'Hide';
      this.isVisible = true;
      logger.debug('File explorer shown', {}, 'explorer');
    }
  }

  refreshExplorer() {
    logger.info('Refreshing file explorer', { currentPath: this.currentPath }, 'explorer');

    if (this.currentPath) {
      this.loadDirectory(this.currentPath);
    } else {
      this.showEmpty('No project selected');
    }
  }

  async createNewFile() {
    if (!this.currentPath) {
      if (window.showToast) {
        window.showToast('Please select a project first', 'warning');
      }
      return;
    }

    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const result = await ipcRenderer.invoke('create-file', {
        dirPath: this.currentPath,
        fileName
      });

      if (result.success) {
        await this.refreshExplorer();
        logger.info('File created successfully', { fileName, path: this.currentPath }, 'explorer');

        if (window.showToast) {
          window.showToast(`File "${fileName}" created successfully`, 'success');
        }
      } else {
        throw new Error(result.error || 'Failed to create file');
      }
    } catch (error) {
      logger.error('Error creating file', error, { fileName, path: this.currentPath }, 'explorer');

      if (window.showToast) {
        window.showToast(`Error creating file: ${error.message}`, 'error');
      }
    }
  }

  async createNewFolder() {
    if (!this.currentPath) {
      if (window.showToast) {
        window.showToast('Please select a project first', 'warning');
      }
      return;
    }

    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const result = await ipcRenderer.invoke('create-folder', {
        dirPath: this.currentPath,
        folderName
      });

      if (result.success) {
        await this.refreshExplorer();
        logger.info('Folder created successfully', { folderName, path: this.currentPath }, 'explorer');

        if (window.showToast) {
          window.showToast(`Folder "${folderName}" created successfully`, 'success');
        }
      } else {
        throw new Error(result.error || 'Failed to create folder');
      }
    } catch (error) {
      logger.error('Error creating folder', error, { folderName, path: this.currentPath }, 'explorer');

      if (window.showToast) {
        window.showToast(`Error creating folder: ${error.message}`, 'error');
      }
    }
  }

  showEmpty(message) {
    const treeContainer = document.getElementById('explorer-tree');
    if (treeContainer) {
      treeContainer.innerHTML = `<div class="explorer-empty">${message}</div>`;
    }
  }

  // Method to sync with terminal working directory
  syncWithTerminal(terminalWorkingDirectory) {
    if (terminalWorkingDirectory && terminalWorkingDirectory !== this.currentPath) {
      logger.info('Syncing file explorer with terminal directory', {
        terminalPath: terminalWorkingDirectory,
        currentPath: this.currentPath
      }, 'explorer');

      this.updatePath(terminalWorkingDirectory);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileExplorer;
}