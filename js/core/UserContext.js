/**
 * UserContext - Service for managing user context across iframe boundaries
 * Designed for Angular integration via postMessage API
 * 
 * This module allows an Angular parent application to communicate
 * user authentication data to the PDF annotator running in an iframe
 */

import { state } from './State.js';
import { Config } from './Config.js';

/**
 * UserContext class - Manages user state and cross-frame communication
 */
export class UserContext {
  constructor(stateInstance = state) {
    this.state = stateInstance;
    this.allowedOrigins = ['*']; // Configure this for production
    this.messageHandlers = new Map();
    
    this._setupMessageListener();
  }

  /**
   * Set up the postMessage event listener for receiving user data from Angular
   */
  _setupMessageListener() {
    window.addEventListener('message', (event) => {
      this._handleMessage(event);
    });
  }

  /**
   * Handle incoming postMessage events
   * @param {MessageEvent} event - The message event
   */
  _handleMessage(event) {
    // Security check - verify origin in production
    if (!this._isAllowedOrigin(event.origin)) {
      console.warn('Message received from unauthorized origin:', event.origin);
      return;
    }

    const { type, payload } = event.data;

    switch (type) {
      case 'SET_USER':
        this.setUser(payload);
        this._sendResponse(event.source, { type: 'USER_SET', success: true });
        break;

      case 'CLEAR_USER':
        this.clearUser();
        this._sendResponse(event.source, { type: 'USER_CLEARED', success: true });
        break;

      case 'GET_ANNOTATIONS':
        this._sendResponse(event.source, {
          type: 'ANNOTATIONS_DATA',
          payload: this.getAnnotationsForExport()
        });
        break;

      case 'SAVE_PDF_REQUEST':
        this._handleSaveRequest(event.source, payload);
        break;

      default:
        // Forward to custom handlers if registered
        if (this.messageHandlers.has(type)) {
          this.messageHandlers.get(type)(payload, event);
        }
    }
  }

  /**
   * Check if origin is allowed
   * @param {string} origin - The origin to check
   * @returns {boolean}
   */
  _isAllowedOrigin(origin) {
    if (this.allowedOrigins.includes('*')) return true;
    return this.allowedOrigins.includes(origin);
  }

  /**
   * Send response back to parent window
   * @param {Window} source - The source window
   * @param {Object} data - The data to send
   */
  _sendResponse(source, data) {
    // If we have a reference to the parent, use it
    if (source && source !== window) {
      source.postMessage(data, '*');
    }
  }

  /**
   * Set the current user from Angular app
   * @param {Object} user - User object from Angular
   * @param {string} user.id - User ID
   * @param {string} user.username - Username
   * @param {string} [user.email] - User email
   * @param {string} [user.fullName] - User's full name
   * @param {string} [user.role] - User role
   * @param {Object} [user.metadata] - Additional user metadata
   */
  setUser(user) {
    if (!user || !user.id || !user.username) {
      console.warn('Invalid user object. Required: id, username');
      return;
    }

    this.state.setCurrentUser(user);
    console.log('User context set:', user.username);
  }

  /**
   * Clear the current user (logout)
   */
  clearUser() {
    this.state.setCurrentUser(null);
    console.log('User context cleared');
  }

  /**
   * Get current user info
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.state.currentUser;
  }

  /**
   * Get annotations with author info for export
   * @returns {Object}
   */
  getAnnotationsForExport() {
    // Get the PDFService instance from the app
    const app = window.app;
    if (app && app.pdfService) {
      return app.pdfService.exportAnnotationsForAPI();
    }
    
    // Fallback: return basic annotation data
    return {
      exportDate: new Date().toISOString(),
      exportedBy: this.state.currentUser,
      totalAnnotations: this.state.annotations.length,
      annotations: this.state.annotations
    };
  }

  /**
   * Handle save PDF request from Angular
   * @param {Window} source - Source window
   * @param {Object} options - Save options
   */
  async _handleSaveRequest(source, options = {}) {
    try {
      const app = window.app;
      if (!app || !app.pdfService) {
        throw new Error('PDF service not available');
      }

      // Trigger save
      const blob = await app.pdfService.exportPDF((page, total) => {
        // Send progress updates
        this._sendResponse(source, {
          type: 'SAVE_PROGRESS',
          payload: { page, total }
        });
      });

      // Convert blob to base64 for transmission
      const base64 = await this._blobToBase64(blob);

      this._sendResponse(source, {
        type: 'SAVE_COMPLETE',
        payload: {
          pdfData: base64,
          metadata: this.getAnnotationsForExport()
        }
      });

    } catch (error) {
      this._sendResponse(source, {
        type: 'SAVE_ERROR',
        payload: { error: error.message }
      });
    }
  }

  /**
   * Convert blob to base64 string
   * @param {Blob} blob - The blob to convert
   * @returns {Promise<string>}
   */
  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Register a custom message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Set allowed origins for security
   * @param {string[]} origins - Array of allowed origins
   */
  setAllowedOrigins(origins) {
    this.allowedOrigins = origins;
  }

  /**
   * Notify Angular parent of annotation events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyParent(event, data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: `PDF_ANNOTATOR_${event}`,
        payload: data
      }, '*');
    }
  }
}

// Create singleton instance
export const userContext = new UserContext();

// Auto-notify parent when annotations change
state.on(Config.EVENTS.ANNOTATION_ADDED, ({ annotation }) => {
  userContext.notifyParent('ANNOTATION_ADDED', { annotation });
});

state.on(Config.EVENTS.ANNOTATION_REMOVED, ({ annotation }) => {
  userContext.notifyParent('ANNOTATION_REMOVED', { annotation });
});

export default userContext;
