/**
 * CircleTool - Circle/ellipse drawing tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class CircleTool extends Tool {
  constructor(state) {
    super('circle', state);
    this.isDrawing = false;
    this.startPoint = null;
    this.currentCircle = null;
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

    this.currentCircle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 0,
      fill: 'transparent',
      stroke: this.state.currentColor,
      strokeWidth: this.state.currentSize,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(this.currentCircle);
  }

  onMouseMove(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentCircle) return;

    const dx = pointer.x - this.startPoint.x;
    const dy = pointer.y - this.startPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy) / 2;

    this.currentCircle.set({
      radius: radius,
      left: this.startPoint.x + dx / 2,
      top: this.startPoint.y + dy / 2
    });

    canvas.renderAll();
  }

  onMouseUp(event, canvas, pointer) {
    if (!this.isDrawing || !this.currentCircle) return;

    const pageNum = this._getPageFromCanvas(canvas);

    this.currentCircle.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
      evented: true
    });

    canvas.setActiveObject(this.currentCircle);
    canvas.renderAll();

    // Add annotation record
    if (pageNum) {
      this.state.addAnnotation({
        type: 'circle',
        icon: '⭕',
        content: '',
        page: pageNum,
        fabricObject: this.currentCircle
      });
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.currentCircle = null;
  }

  _getPageFromCanvas(canvas) {
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default CircleTool;
