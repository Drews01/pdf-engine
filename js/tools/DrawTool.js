/**
 * DrawTool - Freehand drawing tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class DrawTool extends Tool {
  constructor(state) {
    super('draw', state);
  }

  getCursor() {
    return 'crosshair';
  }

  onActivate(canvas) {
    if (!canvas) return;
    
    this.applySettings(canvas);
    canvas.isDrawingMode = true;
    canvas.selection = false;
    
    // Disable object selection while drawing
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
      brush.color = this.state.currentColor;
      brush.width = this.state.currentSize;
    }
  }
}

export default DrawTool;
