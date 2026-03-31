/**
 * LineTool - Line drawing tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class LineTool extends Tool {
  constructor(state) {
    super('line', state);
    this.isDrawing = false;
    this.startPoint = null;
    this.currentLine = null;
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

    this.currentLine = new fabric.Line(
      [pointer.x, pointer.y, pointer.x, pointer.y],
      {
        stroke: this.state.currentColor,
        strokeWidth: this.state.currentSize,
        selectable: false,
        evented: false
      }
    );

    canvas.add(this.currentLine);
  }

  onMouseMove(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentLine) return;

    this.currentLine.set({
      x2: pointer.x,
      y2: pointer.y
    });

    canvas.renderAll();
  }

  onMouseUp(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentLine) return;

    const pageNum = this._getPageFromCanvas(canvas);
    
    this.currentLine.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
      evented: true
    });

    canvas.setActiveObject(this.currentLine);
    canvas.renderAll();

    // Add annotation record
    if (pageNum) {
      this.state.addAnnotation({
        type: 'line',
        icon: '📏',
        content: '',
        page: pageNum,
        fabricObject: this.currentLine
      });
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.currentLine = null;
  }

  _getPageFromCanvas(canvas) {
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default LineTool;
