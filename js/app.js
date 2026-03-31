/**
 * PDF Annotator Application
 * 
 * Architecture based on SOLID principles:
 * - Single Responsibility: Each class has one reason to change
 * - Open/Closed: Tools are open for extension, closed for modification
 * - Liskov Substitution: All tools can be used interchangeably
 * - Interface Segregation: Tool interface is minimal and focused
 * - Dependency Inversion: High-level modules depend on abstractions
 * 
 * Folder Structure:
 * js/
 * ├── core/           # Core infrastructure (EventEmitter, Config, State)
 * ├── services/       # Business logic services (PDFService)
 * ├── tools/          # Tool implementations following Strategy pattern
 * ├── annotations/    # Annotation management
 * ├── ui/             # UI components
 * └── app.js          # Main application entry point
 */

// Core modules
import { state } from './core/State.js';
import { Config } from './core/Config.js';
import { userContext } from './core/UserContext.js';

// Services
import { PDFService } from './services/PDFService.js';

// Tools
import { ToolFactory } from './tools/ToolFactory.js';
import { TextTool } from './tools/TextTool.js';

// Annotations
import { AnnotationManager } from './annotations/AnnotationManager.js';

// UI Components
import { Toolbar } from './ui/Toolbar.js';
import { PropertiesBar } from './ui/PropertiesBar.js';
import { AnnotationsPanel } from './ui/AnnotationsPanel.js';
import { CanvasManager } from './ui/CanvasManager.js';
import { TextPopup } from './ui/TextPopup.js';
import { Toast } from './ui/Toast.js';
import { UploadOverlay } from './ui/UploadOverlay.js';

/**
 * Main Application Class
 * Coordinates all components without containing business logic
 */
class PDFAnnotatorApp {
  constructor() {
    // State is already a singleton
    this.state = state;
    
    // Services
    this.pdfService = new PDFService(this.state);
    
    // Tool factory
    this.toolFactory = new ToolFactory(this.state);
    
    // Get text tool reference for popup
    this.textTool = this.toolFactory.getTool('text');
    
    // Annotation manager
    this.annotationManager = new AnnotationManager(this.state);
    
    // UI Components
    this.uploadOverlay = new UploadOverlay(this.state, this.handleFileSelect.bind(this));
    this.toolbar = new Toolbar(this.state, this.toolFactory);
    this.propertiesBar = new PropertiesBar(this.state, this.pdfService);
    this.annotationsPanel = new AnnotationsPanel(this.state);
    this.canvasManager = new CanvasManager(this.state, this.pdfService, this.toolFactory);
    this.textPopup = new TextPopup(this.state, this.textTool);
    this.toast = new Toast(this.state);
    
    // User context for Angular integration
    this.userContext = userContext;
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Set initial tool
    this.state.setTool(Config.DEFAULT_TOOL);
    
    // Initialize user context
    this._initUserContext();
    
    console.log('PDF Annotator initialized');
  }

  /**
   * Initialize user context for Angular integration
   * Sets up listener for user data from parent window
   */
  _initUserContext() {
    // UserContext is already initialized via import
    // This method is available for any additional setup
    
    // Log current user context status
    if (this.state.currentUser) {
      console.log('User authenticated:', this.state.currentUser.username);
    } else {
      console.log('No user set - waiting for authentication from parent');
    }
  }

  /**
   * Set current user (called by Angular app via postMessage or directly)
   * @param {Object} user - User object
   */
  setUser(user) {
    this.userContext.setUser(user);
  }

  /**
   * Clear current user (logout)
   */
  clearUser() {
    this.userContext.clearUser();
  }

  /**
   * Handle file selection
   * @param {File} file - Selected PDF file
   */
  async handleFileSelect(file) {
    try {
      this.state.setLoading(true);
      
      await this.pdfService.loadPDF(file);
      
      this.uploadOverlay.hide();
      this.state.setLoading(false);
      
      this.state.emit(Config.EVENTS.SHOW_TOAST, { 
        message: `Loaded ${this.state.totalPages} page${this.state.totalPages > 1 ? 's' : ''}` 
      });
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.state.setLoading(false);
      this.state.emit(Config.EVENTS.SHOW_TOAST, { 
        message: error.message || 'Failed to load PDF'
      });
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PDFAnnotatorApp();
});

export default PDFAnnotatorApp;
