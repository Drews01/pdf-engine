/**
 * UploadOverlay - Handles file upload UI
 * Follows Single Responsibility Principle
 */
export class UploadOverlay {
  constructor(state, onFileSelect) {
    this.state = state;
    this.onFileSelect = onFileSelect;
    this.elements = {};
    
    this._cacheElements();
    this._bindEvents();
    
    // Setup file input
    this.fileInput = document.getElementById('fileInput');
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.onFileSelect(file);
      }
    });
  }

  _cacheElements() {
    this.elements = {
      overlay: document.getElementById('uploadOverlay'),
      uploadBox: document.getElementById('uploadBox')
    };
  }

  _bindEvents() {
    const box = this.elements.uploadBox;

    // Click to browse
    box.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Drag and drop
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      box.classList.add('drag-over');
    });

    box.addEventListener('dragleave', () => {
      box.classList.remove('drag-over');
    });

    box.addEventListener('drop', (e) => {
      e.preventDefault();
      box.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file?.type === 'application/pdf') {
        this.onFileSelect(file);
      } else {
        this.state.emit('ui:showToast', { message: 'Please drop a PDF file' });
      }
    });
  }

  /**
   * Show the upload overlay
   */
  show() {
    this.elements.overlay.classList.remove('hidden');
  }

  /**
   * Hide the upload overlay
   */
  hide() {
    this.elements.overlay.classList.add('hidden');
  }
}

export default UploadOverlay;
