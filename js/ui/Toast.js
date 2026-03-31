/**
 * Toast - Handles toast notifications
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class Toast {
  constructor(state) {
    this.state = state;
    this.element = document.getElementById('toast');
    this.timer = null;
    
    this._setupListeners();
  }

  _setupListeners() {
    this.state.on(Config.EVENTS.SHOW_TOAST, ({ message, duration = 2500 }) => {
      this.show(message, duration);
    });
  }

  /**
   * Show a toast message
   * @param {string} message - Message to display
   * @param {number} duration - Display duration in ms
   */
  show(message, duration = 2500) {
    // Clear existing timer
    clearTimeout(this.timer);

    // Set message and show
    this.element.textContent = message;
    this.element.classList.add('show');

    // Hide after duration
    this.timer = setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Hide the toast
   */
  hide() {
    this.element.classList.remove('show');
  }
}

export default Toast;
