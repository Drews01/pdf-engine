/**
 * Config - Application configuration constants
 * Follows Single Responsibility Principle
 */
export const Config = {
  // PDF rendering scale (1.0 = 100%, lower = smaller)
  SCALE: 1.2,
  
  // Default tool settings
  DEFAULT_TOOL: 'select',
  DEFAULT_COLOR: '#E31937',
  DEFAULT_SIZE: 4,
  
  // Color palette
  COLORS: {
    RED: '#E31937',
    BLACK: '#000000',
    BLUE: '#0066CC',
    GREEN: '#00AA00',
    ORANGE: '#FF9500'
  },
  
  // Tool sizes
  SIZES: {
    THIN: 2,
    MEDIUM: 4,
    THICK: 8,
    EXTRA_THICK: 12
  },
  
  // Stamp characters
  STAMPS: {
    CHECK: '✓',
    CROSS: '✕',
    DOT: '●',
    CIRCLE: '○',
    CROSSOUT: '—'
  },
  
  // Event names
  EVENTS: {
    // PDF events
    PDF_LOADED: 'pdf:loaded',
    PDF_ERROR: 'pdf:error',
    PAGE_CHANGED: 'page:changed',
    
    // Tool events
    TOOL_CHANGED: 'tool:changed',
    COLOR_CHANGED: 'color:changed',
    SIZE_CHANGED: 'size:changed',
    
    // Annotation events
    ANNOTATION_ADDED: 'annotation:added',
    ANNOTATION_REMOVED: 'annotation:removed',
    ANNOTATION_SELECTED: 'annotation:selected',
    
    // User context events
    USER_CHANGED: 'user:changed',
    
    // UI events
    SHOW_TEXT_POPUP: 'ui:showTextPopup',
    HIDE_TEXT_POPUP: 'ui:hideTextPopup',
    SHOW_PROGRESS: 'ui:showProgress',
    HIDE_PROGRESS: 'ui:hideProgress',
    SHOW_TOAST: 'ui:showToast'
  },
  
  // Thumbnail settings
  THUMBNAIL_SCALE: 0.18,
  
  // Export settings
  EXPORT: {
    JPEG_QUALITY: 0.92,
    POINTS_PER_PIXEL: 72 / 96
  }
};

export default Config;
