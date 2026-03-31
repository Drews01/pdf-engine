/**
 * TextPopup - Handles text input popup
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class TextPopup {
  constructor(state, textTool) {
    this.state = state;
    this.textTool = textTool;
    this.elements = {};
    
    this._cacheElements();
    this._setupListeners();
    this._bindEvents();
  }

  _cacheElements() {
    this.elements = {
      popup: document.getElementById('textPopup'),
      input: document.getElementById('textInput'),
      confirm: document.getElementById('textConfirm'),
      cancel: document.getElementById('textCancel')
    };
  }

  _setupListeners() {
    this.state.on(Config.EVENTS.SHOW_TEXT_POPUP, ({ x, y, page }) => {
      this._show(x, y, page);
    });

    this.state.on(Config.EVENTS.HIDE_TEXT_POPUP, () => {
      this._hide();
    });
  }

  _bindEvents() {
    // Confirm button
    this.elements.confirm.addEventListener('click', () => {
      this._confirm();
    });

    // Cancel button
    this.elements.cancel.addEventListener('click', () => {
      this._hide();
    });

    // Enter key to confirm, Escape to cancel
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._confirm();
      } else if (e.key === 'Escape') {
        this._hide();
      }
    });
  }

  _show(x, y, page) {
    this.currentX = x;
    this.currentY = y;
    this.currentPage = page;

    // Position popup near click, keeping it on screen
    const popupWidth = 280;
    const popupHeight = 140;
    
    let left = x + 20;
    let top = y - 50;

    // Keep on screen
    if (left + popupWidth > window.innerWidth) {
      left = x - popupWidth - 10;
    }
    if (top + popupHeight > window.innerHeight) {
      top = window.innerHeight - popupHeight - 20;
    }
    if (top < 0) top = 20;

    this.elements.popup.style.left = `${left}px`;
    this.elements.popup.style.top = `${top}px`;
    this.elements.popup.classList.add('show');
    
    this.elements.input.value = '';
    this.elements.input.focus();
  }

  _hide() {
    this.elements.popup.classList.remove('show');
    this.currentX = null;
    this.currentY = null;
    this.currentPage = null;
  }

  _confirm() {
    const text = this.elements.input.value.trim();
    if (text && this.currentPage) {
      this.textTool.createText(text, this.currentX, this.currentY, this.currentPage);
    }
    this._hide();
  }
}

export default TextPopup;
