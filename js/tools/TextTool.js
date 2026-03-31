/**
 * TextTool - Text annotation tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';
import { Config } from '../core/Config.js';

export class TextTool extends Tool {
  constructor(state) {
    super('text', state);
  }

  getCursor() {
    return 'crosshair';
  }

  onActivate(canvas) {
    if (!canvas) return;
    
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = this.getCursor();
  }

  onMouseDown(event, canvas, pointer) {
    // Don't create text if clicked on an existing object
    if (event.target) return;

    const pageNum = this._getPageFromCanvas(canvas);
    if (!pageNum) return;

    // Show text popup at click position
    this.state.showTextPopup(pointer.x, pointer.y, pageNum);
  }

  /**
   * Create text object from popup input
   * @param {string} text - Text content
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} page - Page number
   */
  createText(text, x, y, page) {
    const canvas = this.state.getFabricCanvas(page);
    if (!canvas || !text.trim()) return;

    const textObj = new fabric.IText(text.trim(), {
      left: x,
      top: y,
      fontSize: 16,
      fill: this.state.currentColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '400',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 6,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      borderColor: this.state.currentColor,
      cornerColor: this.state.currentColor,
      cornerSize: 8,
      transparentCorners: false
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();

    // Add annotation record
    this.state.addAnnotation({
      type: 'text',
      icon: '📝',
      content: text.length > 45 ? text.slice(0, 45) + '...' : text,
      page: page,
      fabricObject: textObj
    });

    return textObj;
  }

  _getPageFromCanvas(canvas) {
    // Find page number from canvas element ID
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default TextTool;
