/**
 * ArrowTool - Arrow drawing tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class ArrowTool extends Tool {
  constructor(state) {
    super('arrow', state);
    this.isDrawing = false;
    this.startPoint = null;
    this.line = null;
    this.head = null;
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
    this.canvas = canvas;

    // Create line
    this.line = new fabric.Line(
      [pointer.x, pointer.y, pointer.x, pointer.y],
      {
        stroke: this.state.currentColor,
        strokeWidth: this.state.currentSize,
        selectable: false,
        evented: false
      }
    );

    // Create arrow head (triangle)
    this.head = new fabric.Triangle({
      left: pointer.x,
      top: pointer.y,
      originX: 'center',
      originY: 'center',
      width: this.state.currentSize * 3,
      height: this.state.currentSize * 3,
      fill: this.state.currentColor,
      angle: 0,
      selectable: false,
      evented: false
    });

    canvas.add(this.line);
    canvas.add(this.head);
  }

  onMouseMove(event, canvas, pointer) {
    if (!this.isDrawing || !this.line || !this.head) return;

    const dx = pointer.x - this.startPoint.x;
    const dy = pointer.y - this.startPoint.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Update line
    this.line.set({
      x2: pointer.x,
      y2: pointer.y
    });

    // Update arrow head position and rotation
    this.head.set({
      left: pointer.x,
      top: pointer.y,
      angle: angle + 90
    });

    canvas.renderAll();
  }

  onMouseUp(event, canvas, pointer) {
    if (!this.isDrawing || !this.line || !this.head) return;

    const pageNum = this._getPageFromCanvas(canvas);

    // Remove preview objects
    canvas.remove(this.line);
    canvas.remove(this.head);

    // Calculate final dimensions
    const dx = pointer.x - this.startPoint.x;
    const dy = pointer.y - this.startPoint.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Create final line (horizontal, will be rotated by group)
    const newLine = new fabric.Line(
      [0, 0, length, 0],
      {
        stroke: this.state.currentColor,
        strokeWidth: this.state.currentSize,
        selectable: true,
        hasControls: false,
        hasBorders: true,
        evented: true
      }
    );

    // Create final arrow head
    const newHead = new fabric.Triangle({
      left: length,
      top: 0,
      originX: 'center',
      originY: 'center',
      width: this.state.currentSize * 3,
      height: this.state.currentSize * 3,
      fill: this.state.currentColor,
      angle: 90,
      selectable: true,
      hasControls: false,
      hasBorders: true,
      evented: true
    });

    // Create group with proper positioning
    const finalGroup = new fabric.Group([newLine, newHead], {
      left: this.startPoint.x,
      top: this.startPoint.y,
      angle: angle,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      evented: true
    });

    canvas.add(finalGroup);
    canvas.setActiveObject(finalGroup);
    canvas.renderAll();

    // Add annotation record
    if (pageNum) {
      this.state.addAnnotation({
        type: 'arrow',
        icon: '➡️',
        content: '',
        page: pageNum,
        fabricObject: finalGroup
      });
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.line = null;
    this.head = null;
  }

  _getPageFromCanvas(canvas) {
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default ArrowTool;
