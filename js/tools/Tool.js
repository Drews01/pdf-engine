/**
 * Tool - Abstract base class for all tools
 * Follows Interface Segregation Principle
 * Defines the contract that all tools must implement
 */
export class Tool {
  constructor(name, state, options = {}) {
    this.name = name;
    this.state = state;
    this.options = options;
    this.isActive = false;
  }

  /**
   * Get tool cursor style
   * @returns {string} CSS cursor value
   */
  getCursor() {
    return 'default';
  }

  /**
   * Activate the tool
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   */
  activate(canvas) {
    this.isActive = true;
    this.onActivate(canvas);
  }

  /**
   * Deactivate the tool
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   */
  deactivate(canvas) {
    this.isActive = false;
    this.onDeactivate(canvas);
  }

  /**
   * Called when tool is activated
   * Override in subclasses
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   */
  onActivate(canvas) {
    // Override in subclass
  }

  /**
   * Called when tool is deactivated
   * Override in subclasses
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   */
  onDeactivate(canvas) {
    // Override in subclass
  }

  /**
   * Handle mouse down event
   * Override in subclasses
   * @param {Object} event - Fabric event object
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   * @param {Object} pointer - Pointer coordinates {x, y}
   */
  onMouseDown(event, canvas, pointer) {
    // Override in subclass
  }

  /**
   * Handle mouse move event
   * Override in subclasses
   * @param {Object} event - Fabric event object
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   * @param {Object} pointer - Pointer coordinates {x, y}
   */
  onMouseMove(event, canvas, pointer) {
    // Override in subclass
  }

  /**
   * Handle mouse up event
   * Override in subclasses
   * @param {Object} event - Fabric event object
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   * @param {Object} pointer - Pointer coordinates {x, y}
   */
  onMouseUp(event, canvas, pointer) {
    // Override in subclass
  }

  /**
   * Apply current tool settings to canvas
   * @param {fabric.Canvas} canvas - Fabric canvas instance
   */
  applySettings(canvas) {
    // Override in subclass
  }
}

export default Tool;
