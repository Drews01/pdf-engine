/**
 * PDF Annotator - Library Entry Point
 * 
 * This is the main entry point when using PDF Annotator as a library
 * in Angular or other frameworks.
 * 
 * Usage:
 *   import { PDFAnnotator, State, Config, PDFService } from './pdf-annotator.js';
 * 
 *   const annotator = new PDFAnnotator(containerElement, config);
 *   annotator.open(pdfUrl);
 *   annotator.setUser({ id: '123', username: 'john' });
 */

// Core
export { State, state } from './core/State.js';
export { Config } from './core/Config.js';
export { EventEmitter } from './core/EventEmitter.js';
export { UserContext } from './core/UserContext.js';

// Services
export { PDFService } from './services/PDFService.js';

// Annotations
export { AnnotationManager } from './annotations/AnnotationManager.js';

// Tools
export { Tool } from './tools/Tool.js';
export { ToolFactory } from './tools/ToolFactory.js';
export { SelectTool } from './tools/SelectTool.js';
export { HandTool } from './tools/HandTool.js';
export { DrawTool } from './tools/DrawTool.js';
export { TextTool } from './tools/TextTool.js';
export { StampTool } from './tools/StampTool.js';
export { LineTool } from './tools/LineTool.js';
export { ArrowTool } from './tools/ArrowTool.js';
export { RectangleTool } from './tools/RectangleTool.js';
export { CircleTool } from './tools/CircleTool.js';
export { HighlighterTool } from './tools/HighlighterTool.js';
export { DeleteTool } from './tools/DeleteTool.js';

// UI Components
export { Toolbar } from './ui/Toolbar.js';
export { PropertiesBar } from './ui/PropertiesBar.js';
export { AnnotationsPanel } from './ui/AnnotationsPanel.js';
export { CanvasManager } from './ui/CanvasManager.js';
export { TextPopup } from './ui/TextPopup.js';
export { Toast } from './ui/Toast.js';
export { UploadOverlay } from './ui/UploadOverlay.js';

/**
 * PDFAnnotator - Main class for library usage
 * Provides a simplified API for integrating with frameworks
 */
import { state as defaultState } from './core/State.js';
import { Config } from './core/Config.js';
import { PDFService } from './services/PDFService.js';
import { AnnotationManager } from './annotations/AnnotationManager.js';
import { ToolFactory } from './tools/ToolFactory.js';
import { CanvasManager } from './ui/CanvasManager.js';

export class PDFAnnotator {
  /**
   * Create a PDF Annotator instance
   * @param {HTMLElement} container - The container element for the annotator
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      state: null,  // Use custom state or default
      onAnnotationAdded: null,
      onAnnotationRemoved: null,
      onPdfLoaded: null,
      onError: null,
      ...options
    };

    // Use provided state or create new one
    this.state = this.options.state || defaultState;
    
    // Initialize services
    this.pdfService = new PDFService(this.state);
    this.annotationManager = new AnnotationManager(this.state);
    this.toolFactory = new ToolFactory(this.state);
    
    // UI components (initialized later)
    this.canvasManager = null;
    
    // Bind methods
    this._setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    // Forward events to callbacks
    if (this.options.onAnnotationAdded) {
      this.state.on(Config.EVENTS.ANNOTATION_ADDED, ({ annotation }) => {
        this.options.onAnnotationAdded(annotation);
      });
    }

    if (this.options.onAnnotationRemoved) {
      this.state.on(Config.EVENTS.ANNOTATION_REMOVED, ({ annotation }) => {
        this.options.onAnnotationRemoved(annotation);
      });
    }

    if (this.options.onPdfLoaded) {
      this.state.on(Config.EVENTS.PDF_LOADED, (data) => {
        this.options.onPdfLoaded(data);
      });
    }
  }

  /**
   * Open/load a PDF
   * @param {string|File} source - URL string or File object
   * @returns {Promise<void>}
   */
  async open(source) {
    // Initialize canvas manager if not already done
    if (!this.canvasManager) {
      this.canvasManager = new CanvasManager(
        this.state,
        this.pdfService,
        this.toolFactory
      );
    }

    try {
      if (typeof source === 'string') {
        // Load from URL
        const response = await fetch(source);
        const blob = await response.blob();
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        await this.pdfService.loadPDF(file);
      } else if (source instanceof File) {
        // Load from File
        await this.pdfService.loadPDF(source);
      } else {
        throw new Error('Invalid source. Expected URL string or File object.');
      }
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error);
      }
      throw error;
    }
  }

  /**
   * Set the current user for annotation tracking
   * @param {Object} user - User object
   * @param {string} user.id - User ID
   * @param {string} user.username - Username
   * @param {string} [user.email] - Email
   * @param {string} [user.fullName] - Full name
   * @param {string} [user.role] - Role
   */
  setUser(user) {
    this.state.setCurrentUser(user);
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getUser() {
    return this.state.currentUser;
  }

  /**
   * Set the active tool
   * @param {string} toolName - Tool name (select, hand, draw, text, etc.)
   */
  setTool(toolName) {
    this.state.setTool(toolName);
  }

  /**
   * Set the drawing color
   * @param {string} color - Hex color code
   */
  setColor(color) {
    this.state.setColor(color);
  }

  /**
   * Set the drawing size
   * @param {number} size - Line thickness
   */
  setSize(size) {
    this.state.setSize(size);
  }

  /**
   * Go to a specific page
   * @param {number} pageNum - Page number
   */
  goToPage(pageNum) {
    this.state.setCurrentPage(pageNum);
  }

  /**
   * Go to next page
   */
  nextPage() {
    this.state.nextPage();
  }

  /**
   * Go to previous page
   */
  previousPage() {
    this.state.previousPage();
  }

  /**
   * Get current annotations
   * @returns {Array}
   */
  getAnnotations() {
    return this.state.annotations;
  }

  /**
   * Get annotation metadata for API export
   * @returns {Object}
   */
  getAnnotationMetadata() {
    return this.pdfService.getAnnotationMetadata();
  }

  /**
   * Export annotations for API submission
   * @returns {Object}
   */
  exportAnnotationsForAPI() {
    return this.pdfService.exportAnnotationsForAPI();
  }

  /**
   * Export the annotated PDF as a Blob
   * @param {Function} onProgress - Progress callback (page, total)
   * @returns {Promise<Blob>}
   */
  async exportPDF(onProgress) {
    return await this.pdfService.exportPDF(onProgress);
  }

  /**
   * Download the PDF to local machine
   * @param {string} [filename] - Optional filename
   */
  async downloadPDF(filename) {
    const blob = await this.exportPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `annotated-${this.state.fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all annotations
   */
  clearAnnotations() {
    this.annotationManager.clear();
  }

  /**
   * Get current page number
   * @returns {number}
   */
  getCurrentPage() {
    return this.state.currentPage;
  }

  /**
   * Get total pages
   * @returns {number}
   */
  getTotalPages() {
    return this.state.totalPages;
  }

  /**
   * Check if PDF is loaded
   * @returns {boolean}
   */
  hasPdf() {
    return this.state.hasPdf;
  }

  /**
   * Destroy the annotator instance
   */
  destroy() {
    // Clean up state
    this.state.setPdfDocument(null, '');
    
    // Remove from container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default PDFAnnotator;
