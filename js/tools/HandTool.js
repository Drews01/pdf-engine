/**
 * HandTool - Hand/pan tool for scrolling
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';

export class HandTool extends Tool {
  constructor(state) {
    super('hand', state);
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.scrollContainer = null;
  }

  getCursor() {
    return 'grab';
  }

  onActivate(canvas) {
    if (!canvas) return;
    
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = this.getCursor();
    canvas.hoverCursor = 'grab';
    
    // Find scroll container
    const canvasEl = canvas.lowerCanvasEl;
    this.scrollContainer = canvasEl?.closest('.canvas-area');
  }

  onDeactivate(canvas) {
    if (!canvas) return;
    
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    this.isDragging = false;
  }

  onMouseDown(event, canvas, pointer) {
    this.isDragging = true;
    this.lastX = event.e.clientX;
    this.lastY = event.e.clientY;
    
    if (canvas) {
      canvas.defaultCursor = 'grabbing';
      canvas.hoverCursor = 'grabbing';
    }
  }

  onMouseMove(event, canvas, pointer) {
    if (!this.isDragging || !this.scrollContainer) return;

    const deltaX = this.lastX - event.e.clientX;
    const deltaY = this.lastY - event.e.clientY;

    this.scrollContainer.scrollLeft += deltaX;
    this.scrollContainer.scrollTop += deltaY;

    this.lastX = event.e.clientX;
    this.lastY = event.e.clientY;
  }

  onMouseUp(event, canvas, pointer) {
    this.isDragging = false;
    
    if (canvas) {
      canvas.defaultCursor = this.getCursor();
      canvas.hoverCursor = 'grab';
    }
  }
}

export default HandTool;
