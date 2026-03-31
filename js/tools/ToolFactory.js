/**
 * ToolFactory - Factory pattern for creating tools
 * Follows Factory Pattern and Dependency Inversion Principle
 * Single Responsibility: Create tool instances
 */
import { SelectTool } from './SelectTool.js';
import { HandTool } from './HandTool.js';
import { DrawTool } from './DrawTool.js';
import { TextTool } from './TextTool.js';
import { StampTool } from './StampTool.js';
import { LineTool } from './LineTool.js';
import { ArrowTool } from './ArrowTool.js';
import { RectangleTool } from './RectangleTool.js';
import { CircleTool } from './CircleTool.js';
import { HighlighterTool } from './HighlighterTool.js';
import { DeleteTool } from './DeleteTool.js';

export class ToolFactory {
  constructor(state) {
    this.state = state;
    this.tools = new Map();
    this._registerTools();
  }

  /**
   * Register all available tools
   * @private
   */
  _registerTools() {
    const toolDefinitions = [
      { name: 'select', ToolClass: SelectTool },
      { name: 'hand', ToolClass: HandTool },
      { name: 'draw', ToolClass: DrawTool },
      { name: 'text', ToolClass: TextTool },
      { name: 'stamp', ToolClass: StampTool },
      { name: 'line', ToolClass: LineTool },
      { name: 'arrow', ToolClass: ArrowTool },
      { name: 'rectangle', ToolClass: RectangleTool },
      { name: 'circle', ToolClass: CircleTool },
      { name: 'highlighter', ToolClass: HighlighterTool },
      { name: 'delete', ToolClass: DeleteTool }
    ];

    toolDefinitions.forEach(({ name, ToolClass }) => {
      this.tools.set(name, new ToolClass(this.state));
    });
  }

  /**
   * Get a tool by name
   * @param {string} name - Tool name
   * @returns {Tool|null} Tool instance or null if not found
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Check if a tool exists
   * @param {string} name - Tool name
   * @returns {boolean}
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Get all available tool names
   * @returns {string[]}
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools that have submenus
   * @returns {string[]}
   */
  getToolsWithSubmenus() {
    return ['draw', 'stamp'];
  }
}

export default ToolFactory;
