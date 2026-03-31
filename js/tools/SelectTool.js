/**
 * SelectTool - Selection tool implementation
 * Follows Open/Closed Principle - extends Tool without modifying it
 */
import { Tool } from './Tool.js';

export class SelectTool extends Tool {
  constructor(state) {
    super('select', state);
  }

  getCursor() {
    return 'default';
  }

  onActivate(canvas) {
    if (!canvas) return;
    
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.forEachObject(obj => {
      obj.selectable = true;
      obj.evented = true;
    });
  }

  onDeactivate(canvas) {
    if (!canvas) return;
    
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}

export default SelectTool;
