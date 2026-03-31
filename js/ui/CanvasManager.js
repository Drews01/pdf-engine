/**
 * CanvasManager - Manages PDF pages and Fabric.js canvases
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class CanvasManager {
  constructor(state, pdfService, toolFactory) {
    this.state = state;
    this.pdfService = pdfService;
    this.toolFactory = toolFactory;
    this.currentTool = null;
    
    this.elements = {};
    this._cacheElements();
    this._setupListeners();
    
    // If PDF is already loaded, render it now
    if (this.state.hasPdf) {
      console.log('CanvasManager: PDF already loaded, rendering...');
      this._renderAllPages();
    }
  }

  _cacheElements() {
    this.elements = {
      pagesContainer: document.getElementById('pagesContainer'),
      thumbsContainer: document.getElementById('thumbs')
    };
  }

  _setupListeners() {
    // PDF loaded - render all pages
    this.state.on(Config.EVENTS.PDF_LOADED, async () => {
      await this._renderAllPages();
    });

    // Page changed - show current page
    this.state.on(Config.EVENTS.PAGE_CHANGED, ({ page }) => {
      this._showPage(page);
    });

    // Tool changed - update canvases
    this.state.on(Config.EVENTS.TOOL_CHANGED, ({ tool }) => {
      this._switchTool(tool);
    });

    // Settings changed - update canvases
    this.state.on(Config.EVENTS.COLOR_CHANGED, () => {
      this._updateToolSettings();
    });

    this.state.on(Config.EVENTS.SIZE_CHANGED, () => {
      this._updateToolSettings();
    });

    // Keyboard events for delete/backspace
    this._setupKeyboardEvents();
  }

  _setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Delete or Backspace key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        
        this._deleteSelectedObjects();
      }
    });
  }

  _deleteSelectedObjects() {
    const canvas = this.state.getFabricCanvas(this.state.currentPage);
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    
    if (activeObjects.length === 0) return;

    activeObjects.forEach(obj => {
      // Remove from canvas
      canvas.remove(obj);
      
      // Find and remove associated annotation record
      const annotation = this.state.annotations.find(a => a.fabricObject === obj);
      if (annotation) {
        this.state.removeAnnotation(annotation.id);
      }
    });

    canvas.discardActiveObject();
    canvas.renderAll();
  }

  async _renderAllPages() {
    this.elements.pagesContainer.innerHTML = '';
    
    const totalPages = this.state.totalPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      await this._createPage(pageNum);
    }

    // Show all pages
    document.querySelectorAll('.page-wrapper').forEach(wrapper => {
      wrapper.classList.remove('hidden');
    });
    
    // Apply tool to first page
    this._applyToolToPage(1);
  }
  
  _applyToolToPage(pageNum) {
    const canvas = this.state.getFabricCanvas(pageNum);
    if (canvas && this.currentTool) {
      this.currentTool.activate(canvas);
      this.currentTool.applySettings(canvas);
    }
  }

  async _createPage(pageNum) {
    // Create page wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';
    wrapper.id = `pw-${pageNum}`;
    wrapper.dataset.page = pageNum;

    // Create PDF canvas
    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.className = 'pdf-canvas';
    wrapper.appendChild(pdfCanvas);

    // Render PDF page
    const { width, height } = await this.pdfService.renderPage(pageNum, pdfCanvas);

    // Set wrapper size
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;

    // Create Fabric.js wrapper
    const fabricWrapper = document.createElement('div');
    fabricWrapper.className = 'fabric-wrapper';
    fabricWrapper.style.width = `${width}px`;
    fabricWrapper.style.height = `${height}px`;

    // Create Fabric canvas element
    const fabricCanvasEl = document.createElement('canvas');
    fabricCanvasEl.id = `fc-${pageNum}`;
    fabricWrapper.appendChild(fabricCanvasEl);
    wrapper.appendChild(fabricWrapper);

    this.elements.pagesContainer.appendChild(wrapper);

    // Initialize Fabric.js canvas
    const fabricCanvas = new fabric.Canvas(fabricCanvasEl.id, {
      width: width,
      height: height,
      backgroundColor: null,
      enableRetinaScaling: false,
      preserveObjectStacking: true
    });

    // Fix positioning
    [fabricCanvas.wrapperEl, fabricCanvas.lowerCanvasEl, fabricCanvas.upperCanvasEl].forEach(el => {
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
    });

    fabricCanvas.wrapperEl.style.width = `${width}px`;
    fabricCanvas.wrapperEl.style.height = `${height}px`;
    fabricCanvas.lowerCanvasEl.style.background = 'transparent';

    // Store canvas reference
    this.state.setFabricCanvas(pageNum, fabricCanvas);
    this.state.setPdfCanvas(pageNum, pdfCanvas);

    // Setup event handlers
    this._setupCanvasEvents(fabricCanvas, pageNum);

    // Apply current tool
    this._applyTool(fabricCanvas);
  }

  _setupCanvasEvents(canvas, pageNum) {
    // Mouse down
    canvas.on('mouse:down', (opt) => {
      if (!this.currentTool) return;
      
      const pointer = canvas.getPointer(opt.e);
      this.currentTool.onMouseDown(opt, canvas, pointer);
    });

    // Mouse move
    canvas.on('mouse:move', (opt) => {
      if (!this.currentTool) return;
      
      const pointer = canvas.getPointer(opt.e);
      this.currentTool.onMouseMove(opt, canvas, pointer);
    });

    // Mouse up
    canvas.on('mouse:up', (opt) => {
      if (!this.currentTool) return;
      
      const pointer = canvas.getPointer(opt.e);
      this.currentTool.onMouseUp(opt, canvas, pointer);
    });

    // Object added/removed - update thumbnail badge
    canvas.on('object:added', () => {
      this._updateThumbnailBadge(pageNum);
    });

    canvas.on('object:removed', () => {
      this._updateThumbnailBadge(pageNum);
    });
  }

  _showPage(pageNum) {
    // Show all pages (for multi-page view)
    document.querySelectorAll('.page-wrapper').forEach(wrapper => {
      wrapper.classList.remove('hidden');
    });

    // Apply current tool to this canvas
    const canvas = this.state.getFabricCanvas(pageNum);
    if (canvas) {
      this._applyTool(canvas);
    }
  }

  _switchTool(toolName) {
    // Deactivate current tool on all canvases
    if (this.currentTool) {
      this.state.getAllFabricCanvases().forEach(canvas => {
        this.currentTool.deactivate(canvas);
      });
    }

    // Get new tool
    this.currentTool = this.toolFactory.getTool(toolName);

    // Activate new tool on current canvas
    if (this.currentTool) {
      const currentCanvas = this.state.getFabricCanvas(this.state.currentPage);
      if (currentCanvas) {
        this._applyTool(currentCanvas);
      }
    }
  }

  _applyTool(canvas) {
    if (!this.currentTool || !canvas) return;

    this.currentTool.activate(canvas);
    this.currentTool.applySettings(canvas);
  }

  _updateToolSettings() {
    if (!this.currentTool) return;

    const currentCanvas = this.state.getFabricCanvas(this.state.currentPage);
    if (currentCanvas) {
      this.currentTool.applySettings(currentCanvas);
    }
  }

  _updateThumbnailBadge(pageNum) {
    // Find thumbnail and update badge
    const thumb = document.getElementById(`thumb-${pageNum}`);
    if (thumb) {
      const canvas = this.state.getFabricCanvas(pageNum);
      const hasAnnotations = canvas && canvas.getObjects().length > 0;
      thumb.classList.toggle('has-annotations', hasAnnotations);
    }
  }
}

export default CanvasManager;
