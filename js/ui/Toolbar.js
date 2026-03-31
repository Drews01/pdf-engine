/**
 * Toolbar - Handles toolbar UI interactions
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class Toolbar {
  constructor(state, toolFactory) {
    this.state = state;
    this.toolFactory = toolFactory;
    this.elements = {};
    this.activeSubmenu = null;
    
    this._cacheElements();
    this._setupListeners();
    this._bindEvents();
  }

  _cacheElements() {
    this.elements = {
      toolbarSidebar: document.getElementById('toolbarSidebar'),
      toolButtons: document.querySelectorAll('.tool-btn'),
      submenus: document.querySelectorAll('.submenu'),
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      pageNum: document.getElementById('pageNum'),
      totalPg: document.getElementById('totalPg'),
      filename: document.getElementById('filename')
    };
  }

  _setupListeners() {
    // State change listeners
    this.state.on(Config.EVENTS.TOOL_CHANGED, ({ tool }) => {
      this._updateToolSelection(tool);
    });

    this.state.on(Config.EVENTS.PAGE_CHANGED, ({ page }) => {
      this._updatePageDisplay(page);
    });

    this.state.on(Config.EVENTS.PDF_LOADED, ({ fileName, totalPages }) => {
      this._updatePdfInfo(fileName, totalPages);
    });

    // Close submenus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tool-btn') && !e.target.closest('.submenu')) {
        this._closeAllSubmenus();
      }
    });
  }

  _bindEvents() {
    // Tool button clicks
    this.elements.toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = btn.dataset.tool;
        
        if (btn.classList.contains('has-submenu')) {
          this._toggleSubmenu(tool);
        } else {
          this._closeAllSubmenus();
          this.state.setTool(tool);
        }
      });
    });

    // Submenu item clicks
    document.querySelectorAll('.submenu-item').forEach(item => {
      item.addEventListener('click', () => {
        const tool = item.dataset.tool;
        const stamp = item.dataset.stamp;

        if (tool) {
          this.state.setTool(tool);
          this._updateSubmenuSelection(item.parentElement, item);
        } else if (stamp) {
          this.state.setStamp(stamp);
          this.state.setTool('stamp');
          this._updateSubmenuSelection(item.parentElement, item);
        }

        this._closeAllSubmenus();
      });
    });

    // Navigation buttons
    this.elements.prevBtn.addEventListener('click', () => {
      this.state.previousPage();
    });

    this.elements.nextBtn.addEventListener('click', () => {
      this.state.nextPage();
    });
  }

  _toggleSubmenu(toolName) {
    const submenuMap = {
      'draw': 'drawSubmenu',
      'stamp': 'stampSubmenu'
    };

    const submenuId = submenuMap[toolName];
    if (!submenuId) return;

    const submenu = document.getElementById(submenuId);
    const isOpen = submenu.classList.contains('show');

    // Close all submenus first
    this._closeAllSubmenus();

    // Toggle the clicked submenu
    if (!isOpen) {
      // Get the button position to position the submenu correctly
      const btn = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        submenu.style.top = `${rect.top}px`;
        submenu.style.left = `${rect.right + 4}px`;
      }
      submenu.classList.add('show');
      this.activeSubmenu = submenu;
    }
  }

  _closeAllSubmenus() {
    this.elements.submenus.forEach(submenu => {
      submenu.classList.remove('show');
    });
    this.activeSubmenu = null;
  }

  _updateToolSelection(toolName) {
    this.elements.toolButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
  }

  _updateSubmenuSelection(submenu, selectedItem) {
    submenu.querySelectorAll('.submenu-item').forEach(item => {
      item.classList.remove('active');
    });
    selectedItem.classList.add('active');
  }

  _updatePageDisplay(page) {
    this.elements.pageNum.textContent = page;
    this.elements.prevBtn.disabled = !this.state.canGoPrevious();
    this.elements.nextBtn.disabled = !this.state.canGoNext();
  }

  _updatePdfInfo(fileName, totalPages) {
    this.elements.filename.textContent = fileName;
    this.elements.totalPg.textContent = totalPages;
    this.elements.pageNum.textContent = '1';
    this.elements.prevBtn.disabled = true;
    this.elements.nextBtn.disabled = totalPages <= 1;
  }

  /**
   * Disable all tools
   */
  disable() {
    this.elements.toolButtons.forEach(btn => {
      btn.disabled = true;
    });
  }

  /**
   * Enable all tools
   */
  enable() {
    this.elements.toolButtons.forEach(btn => {
      btn.disabled = false;
    });
  }
}

export default Toolbar;
