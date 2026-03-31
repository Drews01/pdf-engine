/**
 * State - Centralized application state management
 * Follows Single Responsibility Principle
 * Uses immutable state updates
 */
import { EventEmitter } from './EventEmitter.js';
import { Config } from './Config.js';

export class State extends EventEmitter {
  constructor() {
    super();
    
    this._state = {
      // PDF state
      pdfDocument: null,
      currentPage: 1,
      totalPages: 0,
      fileName: 'No file loaded',
      
      // Tool state
      currentTool: Config.DEFAULT_TOOL,
      currentColor: Config.DEFAULT_COLOR,
      currentSize: Config.DEFAULT_SIZE,
      currentStamp: 'check',
      
      // Annotation state
      annotations: [],
      selectedAnnotation: null,
      
      // UI state
      isLoading: false,
      textPopupPosition: null,
      textPopupPage: null,
      
      // User context for annotation tracking
      currentUser: null
    };
    
    // Fabric canvas instances per page
    this._fabricCanvases = new Map();
    
    // PDF canvases per page
    this._pdfCanvases = new Map();
  }

  // ============================================
  // Getters
  // ============================================
  
  get pdfDocument() { return this._state.pdfDocument; }
  get currentPage() { return this._state.currentPage; }
  get totalPages() { return this._state.totalPages; }
  get fileName() { return this._state.fileName; }
  get currentTool() { return this._state.currentTool; }
  get currentColor() { return this._state.currentColor; }
  get currentSize() { return this._state.currentSize; }
  get currentStamp() { return this._state.currentStamp; }
  get annotations() { return [...this._state.annotations]; }
  get selectedAnnotation() { return this._state.selectedAnnotation; }
  get isLoading() { return this._state.isLoading; }
  get hasPdf() { return this._state.pdfDocument !== null; }
  get currentUser() { return this._state.currentUser; }

  // ============================================
  // State Setters (with events)
  // ============================================

  setPdfDocument(doc, fileName) {
    this._state.pdfDocument = doc;
    this._state.totalPages = doc ? doc.numPages : 0;
    this._state.currentPage = 1;
    this._state.fileName = fileName || 'No file loaded';
    this._state.annotations = [];
    this._fabricCanvases.clear();
    this._pdfCanvases.clear();
    
    this.emit(Config.EVENTS.PDF_LOADED, {
      document: doc,
      totalPages: this._state.totalPages,
      fileName: this._state.fileName
    });
  }

  setCurrentPage(page) {
    if (page < 1 || page > this._state.totalPages) return;
    if (page === this._state.currentPage) return;
    
    this._state.currentPage = page;
    this.emit(Config.EVENTS.PAGE_CHANGED, {
      page,
      previousPage: this._state.currentPage
    });
  }

  setTool(tool) {
    if (tool === this._state.currentTool) return;
    
    this._state.currentTool = tool;
    this.emit(Config.EVENTS.TOOL_CHANGED, { tool });
  }

  setColor(color) {
    if (color === this._state.currentColor) return;
    
    this._state.currentColor = color;
    this.emit(Config.EVENTS.COLOR_CHANGED, { color });
  }

  setSize(size) {
    const sizeNum = parseInt(size, 10);
    if (sizeNum === this._state.currentSize) return;
    
    this._state.currentSize = sizeNum;
    this.emit(Config.EVENTS.SIZE_CHANGED, { size: sizeNum });
  }

  setStamp(stamp) {
    if (stamp === this._state.currentStamp) return;
    this._state.currentStamp = stamp;
  }

  setLoading(loading) {
    this._state.isLoading = loading;
  }

  // ============================================
  // User Context Management (for Angular integration)
  // ============================================

  /**
   * Set the current user context for annotation tracking
   * @param {Object|null} user - User object with at least { id, username } or null to clear
   */
  setCurrentUser(user) {
    this._state.currentUser = user ? {
      id: user.id || null,
      username: user.username || 'Anonymous',
      email: user.email || null,
      fullName: user.fullName || user.username || 'Anonymous',
      role: user.role || null,
      ...user
    } : null;
    
    this.emit(Config.EVENTS.USER_CHANGED, { user: this._state.currentUser });
  }

  /**
   * Get the current user ID
   * @returns {string|null}
   */
  getCurrentUserId() {
    return this._state.currentUser ? this._state.currentUser.id : null;
  }

  /**
   * Get the current username
   * @returns {string}
   */
  getCurrentUsername() {
    return this._state.currentUser ? this._state.currentUser.username : 'Anonymous';
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isUserAuthenticated() {
    return this._state.currentUser !== null && this._state.currentUser.id !== null;
  }

  // ============================================
  // Annotation Management
  // ============================================

  addAnnotation(annotation) {
    const currentUser = this._state.currentUser;
    
    const newAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      // Author information
      author: currentUser ? {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName || currentUser.username,
        email: currentUser.email
      } : {
        id: null,
        username: 'Anonymous',
        fullName: 'Anonymous',
        email: null
      },
      ...annotation
    };
    
    this._state.annotations.push(newAnnotation);
    this.emit(Config.EVENTS.ANNOTATION_ADDED, { annotation: newAnnotation });
    return newAnnotation;
  }

  removeAnnotation(id) {
    const index = this._state.annotations.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    const removed = this._state.annotations.splice(index, 1)[0];
    this.emit(Config.EVENTS.ANNOTATION_REMOVED, { annotation: removed });
    return true;
  }

  getAnnotationsByPage(page) {
    return this._state.annotations.filter(a => a.page === page);
  }

  // ============================================
  // Canvas Management
  // ============================================

  setFabricCanvas(page, canvas) {
    this._fabricCanvases.set(page, canvas);
  }

  getFabricCanvas(page) {
    return this._fabricCanvases.get(page);
  }

  hasFabricCanvas(page) {
    return this._fabricCanvases.has(page);
  }

  setPdfCanvas(page, canvas) {
    this._pdfCanvases.set(page, canvas);
  }

  getPdfCanvas(page) {
    return this._pdfCanvases.get(page);
  }

  getAllFabricCanvases() {
    return Array.from(this._fabricCanvases.values());
  }

  // ============================================
  // Text Popup State
  // ============================================

  showTextPopup(x, y, page) {
    this._state.textPopupPosition = { x, y };
    this._state.textPopupPage = page;
    this.emit(Config.EVENTS.SHOW_TEXT_POPUP, { x, y, page });
  }

  hideTextPopup() {
    this._state.textPopupPosition = null;
    this._state.textPopupPage = null;
    this.emit(Config.EVENTS.HIDE_TEXT_POPUP);
  }

  // ============================================
  // Navigation
  // ============================================

  nextPage() {
    if (this._state.currentPage < this._state.totalPages) {
      this.setCurrentPage(this._state.currentPage + 1);
    }
  }

  previousPage() {
    if (this._state.currentPage > 1) {
      this.setCurrentPage(this._state.currentPage - 1);
    }
  }

  canGoNext() {
    return this._state.currentPage < this._state.totalPages;
  }

  canGoPrevious() {
    return this._state.currentPage > 1;
  }
}

// Export singleton instance
export const state = new State();
export default state;
