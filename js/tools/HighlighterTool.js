/**
 * HighlighterTool - Highlighter/marker tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class HighlighterTool extends Tool {
  constructor(state) {
    super('highlighter', state);
  }

  getCursor() {
    return 'crosshair';
  }

  onActivate(canvas) {
    if (!canvas) return;
    
    this.applySettings(canvas);
    canvas.isDrawingMode = true;
    canvas.selection = false;
    
    canvas.forEachObject(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
  }

  onDeactivate(canvas) {
    if (!canvas) return;
    
    canvas.isDrawingMode = false;
  }

  applySettings(canvas) {
    if (!canvas) return;
    
    const brush = canvas.freeDrawingBrush;
    if (brush) {
      // Highlighter uses semi-transparent color
      const baseColor = this.state.currentColor;
      brush.color = this._hexToRgba(baseColor, 0.4);
      brush.width = this.state.currentSize * 4; // Thicker for highlighter effect
    }
  }

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

export default HighlighterTool;
