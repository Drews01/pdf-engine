/**
 * RectangleTool - Rectangle drawing tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class RectangleTool extends Tool {
  constructor(state) {
    super('rectangle', state);
    this.isDrawing = false;
    this.startPoint = null;
    this.currentRect = null;
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
    if (event.target) return;

    this.isDrawing = true;
    this.startPoint = pointer;

    this.currentRect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: this.state.currentColor,
      strokeWidth: this.state.currentSize,
      selectable: false,
      evented: false
    });

    canvas.add(this.currentRect);
  }

  onMouseMove(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentRect) return;

    const width = pointer.x - this.startPoint.x;
    const height = pointer.y - this.startPoint.y;

    this.currentRect.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width > 0 ? this.startPoint.x : pointer.x,
      top: height > 0 ? this.startPoint.y : pointer.y
    });

    canvas.renderAll();
  }

  onMouseUp(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentRect) return;

    const pageNum = this._getPageFromCanvas(canvas);

    this.currentRect.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
      evented: true
    });

    canvas.setActiveObject(this.currentRect);
    canvas.renderAll();

    // Add annotation record
    if (pageNum) {
      this.state.addAnnotation({
        type: 'rectangle',
        icon: '⬜',
        content: '',
        page: pageNum,
        fabricObject: this.currentRect
      });
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.currentRect = null;
  }

  _getPageFromCanvas(canvas) {
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default RectangleTool;
