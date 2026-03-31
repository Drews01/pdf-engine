/**
 * StampTool - Stamp/mark annotation tool
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';
import { Config } from '../core/Config.js';

export class StampTool extends Tool {
  constructor(state) {
    super('stamp', state);
    this.stampChars = {
      check: { char: '✓', name: 'Checkmark', icon: '✓' },
      cross: { char: '✕', name: 'Crossmark', icon: '✕' },
      dot: { char: '●', name: 'Dot', icon: '●' },
      circle: { char: '○', name: 'Circle', icon: '○' },
      crossout: { char: '—', name: 'Cross out', icon: '—' }
    };
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
    // Don't create stamp if clicked on an existing object
    if (event.target) return;

    const pageNum = this._getPageFromCanvas(canvas);
    if (!pageNum) return;

    this._createStamp(canvas, pointer.x, pointer.y, pageNum);
  }

  _createStamp(canvas, x, y, page) {
    const stampType = this.state.currentStamp || 'check';
    const stampInfo = this.stampChars[stampType] || this.stampChars.check;
    const size = 20 + (this.state.currentSize * 2);

    let stampObj;

    if (stampType === 'crossout') {
      // Cross out is a line
      stampObj = new fabric.Line([x - size, y, x + size, y], {
        stroke: this.state.currentColor,
        strokeWidth: this.state.currentSize,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
    } else if (stampType === 'dot') {
      // Dot is a circle
      stampObj = new fabric.Circle({
        left: x - size / 2,
        top: y - size / 2,
        radius: size / 2,
        fill: this.state.currentColor,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
    } else {
      // Other stamps are text
      stampObj = new fabric.Text(stampInfo.char, {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        fontSize: size,
        fill: this.state.currentColor,
        fontWeight: 'bold',
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
    }

    canvas.add(stampObj);
    canvas.setActiveObject(stampObj);
    canvas.renderAll();

    // Add annotation record
    this.state.addAnnotation({
      type: stampInfo.name,
      icon: stampInfo.icon,
      content: '',
      page: page,
      fabricObject: stampObj
    });

    return stampObj;
  }

  _getPageFromCanvas(canvas) {
    const canvasEl = canvas.lowerCanvasEl;
    const match = canvasEl.id.match(/fc-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

export default StampTool;
