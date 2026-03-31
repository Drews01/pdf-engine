/**
 * PropertiesBar - Handles properties bar UI (color, size, save)
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class PropertiesBar {
  constructor(state, pdfService) {
    this.state = state;
    this.pdfService = pdfService;
    this.elements = {};
    
    this._cacheElements();
    this._setupListeners();
    this._bindEvents();
  }

  _cacheElements() {
    this.elements = {
      colorButtons: document.querySelectorAll('.color-btn'),
      sizeSelect: document.getElementById('sizeSelect'),
      saveBtn: document.getElementById('saveBtn'),
      progressOverlay: document.getElementById('progressOverlay'),
      progressLabel: document.getElementById('progressLabel'),
      progressSub: document.getElementById('progressSub')
    };
  }

  _setupListeners() {
    // Update UI when state changes
    this.state.on(Config.EVENTS.COLOR_CHANGED, ({ color }) => {
      this._updateColorSelection(color);
    });

    this.state.on(Config.EVENTS.SIZE_CHANGED, ({ size }) => {
      this.elements.sizeSelect.value = size;
    });
  }

  _bindEvents() {
    // Color selection
    this.elements.colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        this.state.setColor(color);
      });
    });

    // Size selection
    this.elements.sizeSelect.addEventListener('change', (e) => {
      this.state.setSize(e.target.value);
    });

    // Save button
    this.elements.saveBtn.addEventListener('click', () => this._handleSave());
  }

  _updateColorSelection(color) {
    this.elements.colorButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  async _handleSave() {
    if (!this.state.hasPdf) {
      this.state.emit(Config.EVENTS.SHOW_TOAST, { message: 'No PDF loaded' });
      return;
    }

    this.elements.saveBtn.disabled = true;
    this._showProgress('Preparing PDF...');

    try {
      const blob = await this.pdfService.exportPDF((page, total) => {
        this._updateProgress(`Processing page ${page} of ${total}...`);
      });

      this._updateProgress('Generating download...');

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = this.state.fileName.replace(/\.pdf$/i, '');
      
      a.href = url;
      a.download = `${fileName}_annotated.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      this._showSuccess();

    } catch (error) {
      console.error('Save error:', error);
      this.state.emit(Config.EVENTS.SHOW_TOAST, { 
        message: 'Save failed: ' + error.message 
      });
      this._hideProgress();
    }

    this.elements.saveBtn.disabled = false;
  }

  _showProgress(message) {
    this.elements.progressLabel.textContent = message;
    this.elements.progressSub.textContent = '';
    this.elements.progressOverlay.classList.add('show');
  }

  _updateProgress(message) {
    this.elements.progressSub.textContent = message;
  }

  _showSuccess() {
    // Replace spinner with checkmark
    const spinner = document.querySelector('.progress-spinner');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: none;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: none;
    `;
    spinner.textContent = '✅';

    this.elements.progressLabel.textContent = 'PDF Downloaded!';
    this.elements.progressSub.textContent = 'Check your downloads folder';

    setTimeout(() => {
      this._hideProgress();
      // Reset spinner
      spinner.textContent = '';
      spinner.style.cssText = '';
    }, 2200);
  }

  _hideProgress() {
    this.elements.progressOverlay.classList.remove('show');
  }
}

export default PropertiesBar;
