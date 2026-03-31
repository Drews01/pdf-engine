/**
 * AnnotationManager - Manages annotations and their lifecycle
 * Follows Single Responsibility Principle
 */
import { Config } from '../core/Config.js';

export class AnnotationManager {
  constructor(state) {
    this.state = state;
    this._setupListeners();
  }

  _setupListeners() {
    // Listen for annotation events
    this.state.on(Config.EVENTS.ANNOTATION_ADDED, ({ annotation }) => {
      this._onAnnotationAdded(annotation);
    });

    this.state.on(Config.EVENTS.ANNOTATION_REMOVED, ({ annotation }) => {
      this._onAnnotationRemoved(annotation);
    });
  }

  _onAnnotationAdded(annotation) {
    // Update thumbnail indicator
    this._updateThumbnailBadge(annotation.page);
  }

  _onAnnotationRemoved(annotation) {
    // Update thumbnail indicator
    this._updateThumbnailBadge(annotation.page);
  }

  /**
   * Update thumbnail badge to show if page has annotations
   * @param {number} pageNum - Page number
   */
  _updateThumbnailBadge(pageNum) {
    const canvas = this.state.getFabricCanvas(pageNum);
    const hasAnnotations = canvas && canvas.getObjects().length > 0;
    
    // Update UI through event
    this.state.emit('thumbnail:updateBadge', { pageNum, hasAnnotations });
  }

  /**
   * Get annotation count
   * @returns {number}
   */
  getCount() {
    return this.state.annotations.length;
  }

  /**
   * Get annotations for a specific page
   * @param {number} pageNum - Page number
   * @returns {Array}
   */
  getByPage(pageNum) {
    return this.state.getAnnotationsByPage(pageNum);
  }

  /**
   * Remove an annotation by ID
   * @param {string} id - Annotation ID
   * @returns {boolean}
   */
  remove(id) {
    return this.state.removeAnnotation(id);
  }

  /**
   * Clear all annotations
   */
  clear() {
    const annotations = this.state.annotations;
    [...annotations].forEach(ann => {
      this.state.removeAnnotation(ann.id);
    });
  }
}

export default AnnotationManager;
