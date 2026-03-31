/**
 * AnnotationsPanel - Handles annotations sidebar UI
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class AnnotationsPanel {
  constructor(state) {
    this.state = state;
    this.elements = {};
    
    this._cacheElements();
    this._setupListeners();
    
    // Initial render
    this._render();
  }

  _cacheElements() {
    this.elements = {
      list: document.getElementById('annotationsList'),
      count: document.getElementById('annotationCount')
    };
  }

  _setupListeners() {
    this.state.on(Config.EVENTS.ANNOTATION_ADDED, () => {
      this._render();
    });

    this.state.on(Config.EVENTS.ANNOTATION_REMOVED, () => {
      this._render();
    });

    this.state.on(Config.EVENTS.PDF_LOADED, () => {
      this._render();
    });

    this.state.on(Config.EVENTS.USER_CHANGED, () => {
      this._renderUserInfo();
    });
  }

  _render() {
    const annotations = this.state.annotations;
    const count = annotations.length;
    
    console.log('AnnotationsPanel._render called, count:', count, 'annotations:', annotations);
    console.log('Elements:', this.elements);

    // Check if elements exist
    if (!this.elements.list || !this.elements.count) {
      console.error('AnnotationsPanel: Missing elements!', this.elements);
      return;
    }

    // Update count
    this.elements.count.textContent = count;

    // Render list
    if (count === 0) {
      this.elements.list.innerHTML = `
        <div class="annotations-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <p>No annotations yet</p>
        </div>
      `;
      return;
    }

    // Sort by page, then by timestamp
    const sortedAnnotations = [...annotations].sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return a.timestamp - b.timestamp;
    });

    const html = sortedAnnotations.map(ann => `
      <div class="annotation-item" data-id="${ann.id}">
        <div class="annotation-type">
          <span>${ann.icon || '📌'}</span>
          <span>${ann.type}</span>
          <span class="annotation-page">p.${ann.page}</span>
        </div>
        ${ann.content ? `<div class="annotation-content">${this._escapeHtml(ann.content)}</div>` : ''}
        ${ann.author ? `<div class="annotation-author">👤 ${this._escapeHtml(ann.author.fullName || ann.author.username)}</div>` : ''}
      </div>
    `).join('');
    
    console.log('Setting list HTML:', html);
    this.elements.list.innerHTML = html;

    // Add click handlers
    this.elements.list.querySelectorAll('.annotation-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const annotation = annotations.find(a => a.id === id);
        if (annotation) {
          this._onAnnotationClick(annotation);
        }
      });
    });
  }

  _onAnnotationClick(annotation) {
    // Navigate to the page
    this.state.setCurrentPage(annotation.page);
    
    // Select the object if it exists
    if (annotation.fabricObject) {
      const canvas = this.state.getFabricCanvas(annotation.page);
      if (canvas) {
        canvas.setActiveObject(annotation.fabricObject);
        canvas.renderAll();
      }
    }
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render user info in the panel header
   */
  _renderUserInfo() {
    const user = this.state.currentUser;
    
    // Check if user info element exists, create if not
    let userInfoEl = document.getElementById('annotationUserInfo');
    
    if (!userInfoEl) {
      const header = document.querySelector('.annotations-header');
      if (header) {
        userInfoEl = document.createElement('div');
        userInfoEl.id = 'annotationUserInfo';
        userInfoEl.className = 'annotation-user-info';
        header.appendChild(userInfoEl);
      }
    }

    if (userInfoEl) {
      if (user) {
        userInfoEl.innerHTML = `
          <span class="user-badge" title="${this._escapeHtml(user.email || '')}">
            👤 ${this._escapeHtml(user.username)}
          </span>
        `;
        userInfoEl.style.display = 'block';
      } else {
        userInfoEl.innerHTML = `
          <span class="user-badge anonymous">👤 Anonymous</span>
        `;
        userInfoEl.style.display = 'block';
      }
    }
  }
}

export default AnnotationsPanel;
