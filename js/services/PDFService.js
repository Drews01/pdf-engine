/**
 * PDFService - Handles PDF operations
 * Follows Single Responsibility Principle
 * Acts as a service layer between the app and PDF.js
 */
import { Config } from '../core/Config.js';

export class PDFService {
  constructor(state) {
    this.state = state;
  }

  /**
   * Load a PDF file
   * @param {File} file - PDF file
   * @param {boolean} extractMetadata - Whether to extract embedded annotation metadata
   * @returns {Promise<Object>} PDF document
   */
  async loadPDF(file, extractMetadata = true) {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Please provide a valid PDF file');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to extract embedded annotation metadata FIRST (before ArrayBuffer is consumed)
      if (extractMetadata) {
        try {
          const metadata = await this.extractMetadataFromPDF(arrayBuffer);
          if (metadata) {
            console.log('Found embedded annotations, will restore after PDF loads');
            this._pendingMetadata = metadata;
          }
        } catch (metaError) {
          console.warn('Could not extract metadata:', metaError);
        }
      }
      
      // Load the PDF (this consumes the ArrayBuffer)
      const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      this.state.setPdfDocument(pdfDocument, file.name);
      
      return pdfDocument;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw new Error('Failed to load PDF: ' + error.message);
    }
  }

  /**
   * Get and clear pending metadata (called after UI initialization)
   * @returns {Object|null}
   */
  getPendingMetadata() {
    const metadata = this._pendingMetadata;
    this._pendingMetadata = null;
    return metadata;
  }

  /**
   * Render a PDF page to a canvas
   * @param {number} pageNum - Page number
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @param {number} scale - Render scale
   * @returns {Promise<Object>} Rendered page info
   */
  async renderPage(pageNum, canvas, scale = Config.SCALE) {
    const pdfDocument = this.state.pdfDocument;
    if (!pdfDocument) {
      throw new Error('No PDF loaded');
    }

    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);
    
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    
    // White background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return { width, height, viewport };
  }

  /**
   * Render a thumbnail for a page
   * @param {number} pageNum - Page number
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @returns {Promise<Object>} Thumbnail info
   */
  async renderThumbnail(pageNum, canvas) {
    const pdfDocument = this.state.pdfDocument;
    if (!pdfDocument) return null;

    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: Config.THUMBNAIL_SCALE });
    
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);
    
    canvas.width = width;
    canvas.height = height;
    
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    }).promise;

    return { width, height, pageNum };
  }

  /**
   * Export the PDF with annotations
   * @param {Function} onProgress - Progress callback (page, total)
   * @returns {Promise<Blob>} PDF blob
   */
  async exportPDF(onProgress = () => {}) {
    const { jsPDF } = window.jspdf;
    const pdfDocument = this.state.pdfDocument;
    
    if (!pdfDocument) {
      throw new Error('No PDF loaded');
    }

    const numPages = pdfDocument.numPages;
    let pdf = null;
    const annotationMetadata = this._buildAnnotationMetadata();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress(pageNum, numPages);
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));

      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: Config.SCALE });
      
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      // Create offscreen canvas
      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = width;
      mergedCanvas.height = height;
      
      const ctx = mergedCanvas.getContext('2d');
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw PDF page
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // Draw annotations
      const fabricCanvas = this.state.getFabricCanvas(pageNum);
      if (fabricCanvas && fabricCanvas.getObjects().length > 0) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        ctx.drawImage(fabricCanvas.lowerCanvasEl, 0, 0, width, height);
      }

      // Convert to image
      const imgData = mergedCanvas.toDataURL('image/jpeg', Config.EXPORT.JPEG_QUALITY);
      
      // Convert to PDF points
      const pxToPt = Config.EXPORT.POINTS_PER_PIXEL;
      const widthPt = width * pxToPt;
      const heightPt = height * pxToPt;

      // Create or add page to PDF
      if (!pdf) {
        pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [widthPt, heightPt],
          compress: true
        });
      } else {
        pdf.addPage([widthPt, heightPt], width > height ? 'landscape' : 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, `page_${pageNum}`, 'FAST');
    }

    // Embed annotation metadata as PDF attachment
    this._embedMetadataAsAttachment(pdf, annotationMetadata);

    return pdf.output('blob');
  }

  /**
   * Build annotation metadata for export
   * @returns {Object} Annotation metadata
   */
  _buildAnnotationMetadata() {
    const annotations = this.state.annotations;
    const currentUser = this.state.currentUser;
    
    // Group annotations by author
    const authors = {};
    const annotationsByPage = {};
    
    annotations.forEach(ann => {
      // Track authors
      if (ann.author && ann.author.id) {
        authors[ann.author.id] = {
          id: ann.author.id,
          username: ann.author.username,
          fullName: ann.author.fullName,
          email: ann.author.email
        };
      }
      
      // Group by page
      if (!annotationsByPage[ann.page]) {
        annotationsByPage[ann.page] = [];
      }
      
      annotationsByPage[ann.page].push({
        id: ann.id,
        type: ann.type,
        content: ann.content,
        timestamp: ann.timestamp,
        author: ann.author
      });
    });

    return {
      exportDate: new Date().toISOString(),
      exportedBy: currentUser ? {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName
      } : null,
      totalAnnotations: annotations.length,
      authors: Object.values(authors),
      annotationsByPage
    };
  }

  /**
   * Embed annotation metadata into the PDF
   * @param {jsPDF} pdf - jsPDF instance
   * @param {Object} metadata - Annotation metadata
   */
  _embedMetadataAsAttachment(pdf, metadata) {
    try {
      // Set PDF document properties with author information
      if (metadata.exportedBy) {
        pdf.setProperties({
          title: this.state.fileName || 'Annotated PDF',
          author: metadata.exportedBy.fullName || metadata.exportedBy.username,
          creator: `PDF Annotator - Annotated by ${metadata.exportedBy.username}`,
          subject: 'PDF with annotations'
        });
      }

      // Convert metadata to compact JSON string and then base64
      const metadataJson = JSON.stringify(metadata);
      const base64Metadata = btoa(unescape(encodeURIComponent(metadataJson)));
      
      // Store in document properties with a special prefix
      // This is a workaround since jsPDF doesn't support file attachments natively
      // We'll store it in the 'keywords' field which can hold more data
      const chunks = base64Metadata.match(/.{1,500}/g) || []; // Split into chunks
      pdf.setProperties({
        keywords: `PDF_ANNOTATOR_META:${chunks.length}:${chunks.join('|')}`
      });
      
      console.log('Metadata embedded in PDF properties');
      
    } catch (error) {
      console.warn('Failed to embed annotation metadata:', error);
    }
  }

  /**
   * Extract embedded annotation metadata from a PDF file
   * @param {ArrayBuffer} arrayBuffer - The PDF file as ArrayBuffer
   * @returns {Promise<Object|null>} The extracted metadata or null
   */
  async extractMetadataFromPDF(arrayBuffer) {
    let pdf = null;
    try {
      // Clone the ArrayBuffer to avoid detachment issues
      const bufferClone = arrayBuffer.slice(0);
      
      // Use PDF.js to read the PDF
      pdf = await pdfjsLib.getDocument({ data: bufferClone }).promise;
      
      // Get metadata from PDF
      const metadata = await pdf.getMetadata();
      
      if (metadata && metadata.info) {
        const keywords = metadata.info.Keywords || metadata.info.keywords;
        
        if (keywords && keywords.includes('PDF_ANNOTATOR_META:')) {
          // Extract the base64 encoded metadata
          const match = keywords.match(/PDF_ANNOTATOR_META:(\d+):(.+)/);
          if (match) {
            const chunkCount = parseInt(match[1]);
            const chunks = match[2].split('|');
            
            if (chunks.length === chunkCount) {
              const base64Metadata = chunks.join('');
              const jsonString = decodeURIComponent(escape(atob(base64Metadata)));
              const annotationData = JSON.parse(jsonString);
              console.log('Extracted metadata from PDF properties:', annotationData);
              return annotationData;
            }
          }
        }
      }
      
      console.log('No annotation metadata found in PDF');
      return null;
      
    } catch (error) {
      console.warn('Failed to extract metadata from PDF:', error);
      return null;
    } finally {
      // Clean up PDF document if created
      if (pdf && pdf.destroy) {
        try {
          pdf.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Get annotation metadata for external use (e.g., Angular app)
   * @returns {Object} Current annotation metadata
   */
  getAnnotationMetadata() {
    return this._buildAnnotationMetadata();
  }

  /**
   * Export annotations as JSON for database storage
   * @returns {Object} Annotations data ready for API submission
   */
  exportAnnotationsForAPI() {
    const metadata = this._buildAnnotationMetadata();
    
    return {
      ...metadata,
      fileName: this.state.fileName,
      totalPages: this.state.totalPages,
      annotations: this.state.annotations.map(ann => ({
        id: ann.id,
        type: ann.type,
        page: ann.page,
        content: ann.content,
        timestamp: ann.timestamp,
        author: ann.author,
        // Include fabric object data for reconstruction
        fabricData: ann.fabricObject ? ann.fabricObject.toObject() : null
      }))
    };
  }

  /**
   * Export annotations to a JSON file (to save alongside PDF)
   * @returns {Blob} JSON blob containing all annotation data
   */
  exportAnnotationsToJSON() {
    const data = this.exportAnnotationsForAPI();
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Load annotations from JSON data
   * @param {Object} annotationData - The annotation data to load
   * @param {Function} onAnnotationLoaded - Callback for each loaded annotation
   */
  loadAnnotationsFromJSON(annotationData, onAnnotationLoaded = () => {}) {
    if (!annotationData || !annotationData.annotations) {
      console.warn('No annotation data to load');
      return;
    }

    // Set current user if available in the data
    if (annotationData.exportedBy) {
      this.state.setCurrentUser(annotationData.exportedBy);
    }

    // Load each annotation
    annotationData.annotations.forEach(ann => {
      if (ann.fabricData) {
        // Restore fabric object from saved data
        this._restoreAnnotation(ann, onAnnotationLoaded);
      }
    });

    console.log(`Loaded ${annotationData.annotations.length} annotations`);
  }

  /**
   * Restore a single annotation from saved data
   * @param {Object} ann - Annotation data
   * @param {Function} callback - Callback when restored
   */
  _restoreAnnotation(ann, callback) {
    const canvas = this.state.getFabricCanvas(ann.page);
    if (!canvas || !ann.fabricData) return;

    let fabricObj;

    try {
      // Create fabric object based on type
      switch (ann.fabricData.type) {
        case 'i-text':
        case 'text':
          fabricObj = new fabric.IText(ann.fabricData.text || '', {
            ...ann.fabricData,
            selectable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
          
        case 'path':
          fabricObj = new fabric.Path(ann.fabricData.path, {
            ...ann.fabricData,
            selectable: true
          });
          break;
          
        case 'line':
          fabricObj = new fabric.Line([
            ann.fabricData.x1 || ann.fabricData.left,
            ann.fabricData.y1 || ann.fabricData.top,
            ann.fabricData.x2 || (ann.fabricData.left + ann.fabricData.width),
            ann.fabricData.y2 || (ann.fabricData.top + ann.fabricData.height)
          ], {
            ...ann.fabricData,
            selectable: true
          });
          break;
          
        case 'rect':
          fabricObj = new fabric.Rect({
            ...ann.fabricData,
            selectable: true
          });
          break;
          
        case 'circle':
          fabricObj = new fabric.Circle({
            ...ann.fabricData,
            selectable: true
          });
          break;
          
        default:
          // Try generic object creation
          fabricObj = fabric.util.enlivenObjects([ann.fabricData], (objects) => {
            if (objects && objects[0]) {
              this._addRestoredObject(objects[0], ann, canvas, callback);
            }
          });
          return;
      }

      if (fabricObj) {
        this._addRestoredObject(fabricObj, ann, canvas, callback);
      }
    } catch (error) {
      console.warn('Failed to restore annotation:', ann.id, error);
    }
  }

  /**
   * Add restored object to canvas and state
   */
  _addRestoredObject(fabricObj, ann, canvas, callback) {
    canvas.add(fabricObj);
    canvas.renderAll();

    // Add to state with original metadata
    const restoredAnnotation = {
      id: ann.id,
      type: ann.type,
      icon: ann.icon || this._getIconForType(ann.type),
      content: ann.content,
      page: ann.page,
      timestamp: ann.timestamp,
      author: ann.author,
      fabricObject: fabricObj
    };

    this.state._state.annotations.push(restoredAnnotation);
    
    // Emit event so UI updates
    this.state.emit(Config.EVENTS.ANNOTATION_ADDED, { annotation: restoredAnnotation });
    
    callback(restoredAnnotation);
  }

  /**
   * Get icon for annotation type
   */
  _getIconForType(type) {
    const icons = {
      'text': '📝',
      'draw': '✏️',
      'line': '➖',
      'arrow': '➡️',
      'rectangle': '⬜',
      'circle': '⭕',
      'highlighter': '🖍️',
      'stamp': '🏷️',
      'check': '✓',
      'cross': '✕',
      'dot': '●',
      'circle-stamp': '○',
      'crossout': '—'
    };
    return icons[type] || '📌';
  }

  /**
   * Download both PDF and annotations JSON
   * @returns {Object} Object with pdfBlob and jsonBlob
   */
  async exportWithAnnotations() {
    const pdfBlob = await this.exportPDF();
    const jsonBlob = this.exportAnnotationsToJSON();
    
    return {
      pdfBlob,
      jsonBlob,
      metadata: this.getAnnotationMetadata()
    };
  }
}

export default PDFService;
