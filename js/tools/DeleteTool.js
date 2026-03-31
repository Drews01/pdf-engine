/**
 * DeleteTool - Delete selected objects
 * Follows Open/Closed Principle
 */
import { Tool } from './Tool.js';
import { Config } from '../core/Config.js';

export class DeleteTool extends Tool {
  constructor(state) {
    super('delete', state);
  }

  getCursor() {
    return 'default';
  }

  onActivate(canvas) {
    // Delete selected objects on current page
    this._deleteSelected();
    
    // Switch back to select tool after deletion
    setTimeout(() => {
      this.state.setTool('select');
    }, 0);
  }

  _deleteSelected() {
    const canvas = this.state.getFabricCanvas(this.state.currentPage);
    if (!canvas) {
      this._showToast('No page loaded');
      return;
    }

    // Get the active object (could be a single object, group, or active selection)
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      this._showToast('Select an annotation to delete');
      return;
    }

    // Get all objects to delete
    // If it's an ActiveSelection (multi-select), get the objects inside
    // Otherwise, it's a single object or group
    const objectsToDelete = activeObject.type === 'activeSelection' 
      ? activeObject.getObjects() 
      : [activeObject];

    console.log('DeleteTool: deleting', objectsToDelete.length, 'object(s)');

    let deletedCount = 0;
    
    objectsToDelete.forEach(obj => {
      console.log('DeleteTool: removing obj', obj.type, obj);
      
      // Remove from canvas
      canvas.remove(obj);
      
      // Find and remove associated annotation record
      const annotation = this.state.annotations.find(a => a.fabricObject === obj);
      
      if (annotation) {
        console.log('DeleteTool: removing annotation', annotation.id);
        this.state.removeAnnotation(annotation.id);
        deletedCount++;
      }
    });

    canvas.discardActiveObject();
    canvas.renderAll();
    
    if (deletedCount > 0) {
      this._showToast(`Deleted ${deletedCount} item${deletedCount > 1 ? 's' : ''}`);
    } else if (objectsToDelete.length > 0) {
      this._showToast('Deleted');
    }
  }

  _showToast(message) {
    // Emit toast event through state
    this.state.emit(Config.EVENTS.SHOW_TOAST, { message });
  }
}

export default DeleteTool;
