# Angular Integration Guide for PDF Annotator

This guide explains how to integrate the PDF Annotator directly into your Angular application as a modal component - the lightest possible approach.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Implementation](#implementation)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Complete Example](#complete-example)

---

## Overview

This integration uses the **direct modal approach** - no iframes, no postMessage. The PDF annotator runs as a native Angular component.

### Why This Approach?

- ✅ **Lightest possible** - No iframe overhead
- ✅ **No duplicate libraries** - Load PDF.js, Fabric.js, jsPDF once
- ✅ **Direct communication** - Call methods directly, no postMessage
- ✅ **Native Angular** - Uses Angular's component lifecycle
- ✅ **Easier debugging** - Everything in one context

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Application                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Global Libraries (loaded once in index.html)           │   │
│  │  • PDF.js                                               │   │
│  │  • Fabric.js                                            │   │
│  │  • jsPDF                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┼─────────────────────────────┐   │
│  │                           ▼                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  PdfWorkspaceComponent (Modal)                  │   │   │
│  │  │  ┌─────────────────────────────────────────┐     │   │   │
│  │  │  │  • State                                │     │   │   │
│  │  │  │  • PDFService                           │     │   │   │
│  │  │  │  • AnnotationManager                    │     │   │   │
│  │  │  │  • Tools                                │     │   │   │
│  │  │  └─────────────────────────────────────────┘     │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Your Table Component                           │   │   │
│  │  │  <button (click)="openPdf(doc)">Preview</button>│   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation

### Step 1: Copy PDF Annotator Files

Copy the PDF annotator source files to your Angular project:

```
src/
  app/
    pdf-workspace/
      ├── pdf-workspace.component.ts
      ├── pdf-workspace.component.html
      ├── pdf-workspace.component.scss
      └── pdf-annotator/           # Copy from this repo
            ├── core/
            │   ├── State.js
            │   ├── Config.js
            │   ├── EventEmitter.js
            │   └── UserContext.js
            ├── services/
            │   └── PDFService.js
            ├── annotations/
            │   └── AnnotationManager.js
            ├── tools/
            │   ├── Tool.js
            │   ├── ToolFactory.js
            │   ├── SelectTool.js
            │   ├── HandTool.js
            │   ├── DrawTool.js
            │   ├── TextTool.js
            │   ├── StampTool.js
            │   ├── LineTool.js
            │   ├── ArrowTool.js
            │   ├── RectangleTool.js
            │   ├── CircleTool.js
            │   ├── HighlighterTool.js
            │   └── DeleteTool.js
            └── ui/
                ├── Toolbar.js
                ├── PropertiesBar.js
                ├── AnnotationsPanel.js
                ├── CanvasManager.js
                ├── TextPopup.js
                ├── Toast.js
                └── UploadOverlay.js
```

### Step 2: Add Libraries to index.html

Add these to your `src/index.html` **once** (in the `<head>`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... your existing head content ... -->
  
  <!-- PDF Annotator Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Configure PDF.js -->
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  </script>
  
  <!-- PDF Annotator Styles -->
  <link rel="stylesheet" href="assets/pdf-annotator/styles.css">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### Step 3: Copy CSS

Copy `css/styles.css` to `src/assets/pdf-annotator/styles.css`

---

## Implementation

### Step 1: Create the PDF Workspace Component

```typescript
// pdf-workspace/pdf-workspace.component.ts
import { 
  Component, 
  ElementRef, 
  ViewChild, 
  OnInit, 
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';

// Import PDF Annotator modules (adjust paths as needed)
import { state, State } from './pdf-annotator/core/State';
import { Config } from './pdf-annotator/core/Config';
import { PDFService } from './pdf-annotator/services/PDFService';
import { AnnotationManager } from './pdf-annotator/annotations/AnnotationManager';
import { ToolFactory } from './pdf-annotator/tools/ToolFactory';
import { Toolbar } from './pdf-annotator/ui/Toolbar';
import { PropertiesBar } from './pdf-annotator/ui/PropertiesBar';
import { AnnotationsPanel } from './pdf-annotator/ui/AnnotationsPanel';
import { CanvasManager } from './pdf-annotator/ui/CanvasManager';
import { TextPopup } from './pdf-annotator/ui/TextPopup';
import { Toast } from './pdf-annotator/ui/Toast';
import { UploadOverlay } from './pdf-annotator/ui/UploadOverlay';

// Type declarations for global libraries
declare const pdfjsLib: any;

export interface PdfWorkspaceConfig {
  pdfUrl?: string;
  pdfFile?: File;
  user?: {
    id: string;
    username: string;
    email?: string;
    fullName?: string;
    role?: string;
  };
  readOnly?: boolean;
  allowDownload?: boolean;
}

@Component({
  selector: 'app-pdf-workspace',
  templateUrl: './pdf-workspace.component.html',
  styleUrls: ['./pdf-workspace.component.scss']
})
export class PdfWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('pagesContainer') pagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  @Output() saved = new EventEmitter<{
    blob: Blob;
    annotations: any;
    metadata: any;
  }>();
  
  @Output() annotationsChanged = new EventEmitter<any[]>();
  
  @Output() closed = new EventEmitter<void>();

  // PDF Annotator instances
  private state: State = state;
  private pdfService!: PDFService;
  private annotationManager!: AnnotationManager;
  private toolFactory!: ToolFactory;
  
  // UI components
  private toolbar!: Toolbar;
  private propertiesBar!: PropertiesBar;
  private annotationsPanel!: AnnotationsPanel;
  private canvasManager!: CanvasManager;
  private textPopup!: TextPopup;
  private toast!: Toast;
  private uploadOverlay!: UploadOverlay;

  // Component state
  isVisible = false;
  isLoading = false;
  currentUser: any = null;
  fileName = 'No file loaded';
  annotationCount = 0;
  
  // Configuration
  private config: PdfWorkspaceConfig = {};

  constructor() {}

  ngOnInit() {
    this.initializeAnnotator();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  /**
   * Initialize the PDF annotator
   */
  private initializeAnnotator() {
    // Create services
    this.pdfService = new PDFService(this.state);
    this.annotationManager = new AnnotationManager(this.state);
    this.toolFactory = new ToolFactory(this.state);

    // Create UI components
    this.toolbar = new Toolbar(this.state, this.toolFactory);
    this.propertiesBar = new PropertiesBar(this.state, this.pdfService);
    this.annotationsPanel = new AnnotationsPanel(this.state);
    this.textPopup = new TextPopup(this.state, this.toolFactory.getTool('text'));
    this.toast = new Toast(this.state);

    // Listen for annotation changes
    this.state.on(Config.EVENTS.ANNOTATION_ADDED, () => {
      this.annotationCount = this.state.annotations.length;
      this.annotationsChanged.emit(this.state.annotations);
    });

    this.state.on(Config.EVENTS.ANNOTATION_REMOVED, () => {
      this.annotationCount = this.state.annotations.length;
      this.annotationsChanged.emit(this.state.annotations);
    });

    // Set default tool
    this.state.setTool(Config.DEFAULT_TOOL);
  }

  /**
   * Open the PDF workspace modal
   */
  open(config: PdfWorkspaceConfig = {}) {
    this.config = config;
    this.isVisible = true;

    // Set user if provided
    if (config.user) {
      this.setUser(config.user);
      this.currentUser = config.user;
    }

    // Load PDF if URL or File provided
    if (config.pdfUrl) {
      this.loadPdfFromUrl(config.pdfUrl);
    } else if (config.pdfFile) {
      this.loadPdfFromFile(config.pdfFile);
    }

    // Initialize canvas manager after view is ready
    setTimeout(() => {
      this.canvasManager = new CanvasManager(
        this.state, 
        this.pdfService, 
        this.toolFactory
      );
      
      this.uploadOverlay = new UploadOverlay(
        this.state, 
        this.handleFileSelect.bind(this)
      );
    }, 0);
  }

  /**
   * Close the modal
   */
  close() {
    this.isVisible = false;
    this.cleanup();
    this.closed.emit();
  }

  /**
   * Set the current user for annotation tracking
   */
  setUser(user: any) {
    this.state.setCurrentUser({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      role: user.role
    });
    this.currentUser = user;
  }

  /**
   * Load PDF from URL
   */
  async loadPdfFromUrl(url: string) {
    this.isLoading = true;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
      await this.loadPdfFromFile(file);
    } catch (error) {
      console.error('Error loading PDF from URL:', error);
      this.showToast('Failed to load PDF');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load PDF from File
   */
  async loadPdfFromFile(file: File) {
    this.isLoading = true;
    try {
      await this.pdfService.loadPDF(file);
      this.fileName = file.name;
      this.uploadOverlay?.hide();
      this.showToast(`Loaded ${this.state.totalPages} page(s)`);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      this.showToast(error.message || 'Failed to load PDF');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle file selection from upload
   */
  private async handleFileSelect(file: File) {
    await this.loadPdfFromFile(file);
  }

  /**
   * Trigger file input click
   */
  triggerFileUpload() {
    this.fileInput?.nativeElement?.click();
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.loadPdfFromFile(input.files[0]);
    }
  }

  /**
   * Save the annotated PDF
   */
  async savePdf() {
    if (!this.state.hasPdf) {
      this.showToast('No PDF loaded');
      return;
    }

    this.isLoading = true;
    try {
      const blob = await this.pdfService.exportPDF();
      const annotations = this.pdfService.exportAnnotationsForAPI();
      const metadata = this.pdfService.getAnnotationMetadata();

      this.saved.emit({
        blob,
        annotations,
        metadata
      });

      this.showToast('PDF saved successfully');
    } catch (error: any) {
      console.error('Error saving PDF:', error);
      this.showToast('Failed to save PDF');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get current annotations data
   */
  getAnnotations() {
    return {
      annotations: this.state.annotations,
      metadata: this.pdfService?.getAnnotationMetadata(),
      exportedBy: this.currentUser
    };
  }

  /**
   * Download PDF to local machine
   */
  async downloadPdf() {
    const blob = await this.pdfService.exportPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotated-${this.fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Show toast notification
   */
  private showToast(message: string) {
    this.state.emit(Config.EVENTS.SHOW_TOAST, { message });
  }

  /**
   * Cleanup when closing
   */
  private cleanup() {
    // Clear state
    this.state.setPdfDocument(null, '');
    
    // Clear file input
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
```

### Step 2: Create the Template

```html
<!-- pdf-workspace/pdf-workspace.component.html -->
<div class="pdf-modal-overlay" *ngIf="isVisible" (click)="close()">
  <div class="pdf-modal-content" (click)="$event.stopPropagation()">
    
    <!-- Header -->
    <header class="pdf-modal-header">
      <div class="header-left">
        <h3>📄 PDF Annotator</h3>
        <span class="filename">{{ fileName }}</span>
      </div>
      
      <div class="header-right">
        <!-- User Badge -->
        <div class="user-badge" *ngIf="currentUser">
          👤 {{ currentUser.username }}
        </div>
        
        <!-- Page Navigation -->
        <div class="page-nav" *ngIf="state.hasPdf">
          <button class="btn-icon" (click)="state.previousPage()" [disabled]="!state.canGoPrevious()">
            ←
          </button>
          <span>{{ state.currentPage }} / {{ state.totalPages }}</span>
          <button class="btn-icon" (click)="state.nextPage()" [disabled]="!state.canGoNext()">
            →
          </button>
        </div>
        
        <!-- Actions -->
        <button class="btn-save" (click)="savePdf()" [disabled]="!state.hasPdf || isLoading">
          💾 Save
        </button>
        <button class="btn-close" (click)="close()">✕</button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="pdf-modal-body">
      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Processing...</p>
      </div>

      <!-- Upload Area (when no PDF loaded) -->
      <div class="upload-area" *ngIf="!state.hasPdf && !isLoading" (click)="triggerFileUpload()">
        <div class="upload-box">
          <div class="upload-icon">📄</div>
          <h3>Drop PDF file here</h3>
          <p>or click to browse</p>
        </div>
        <input 
          type="file" 
          #fileInput
          accept=".pdf" 
          style="display: none"
          (change)="onFileSelected($event)"
        >
      </div>

      <!-- PDF Canvas Area -->
      <div class="canvas-container" *ngIf="state.hasPdf">
        <!-- Left Toolbar -->
        <aside class="toolbar-sidebar" id="toolbarSidebar">
          <div class="tool-group">
            <button class="tool-btn active" data-tool="select" title="Select">↖</button>
            <button class="tool-btn" data-tool="hand" title="Hand">✋</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button class="tool-btn" data-tool="text" title="Text">T</button>
            <button class="tool-btn" data-tool="draw" title="Draw">✏️</button>
            <button class="tool-btn" data-tool="line" title="Line">➖</button>
            <button class="tool-btn" data-tool="arrow" title="Arrow">➡️</button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle">⬜</button>
            <button class="tool-btn" data-tool="circle" title="Circle">⭕</button>
            <button class="tool-btn" data-tool="highlighter" title="Highlighter">🖍️</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button class="tool-btn" data-tool="stamp" title="Stamp">🏷️</button>
            <button class="tool-btn" data-tool="delete" title="Delete">🗑️</button>
          </div>
        </aside>

        <!-- Canvas -->
        <main class="canvas-area">
          <div class="pages-container" #pagesContainer id="pagesContainer"></div>
        </main>

        <!-- Right Annotations Panel -->
        <aside class="annotations-sidebar">
          <div class="annotations-header">
            <span>Annotations</span>
            <span class="annotation-count">{{ annotationCount }}</span>
          </div>
          <div class="annotations-list" id="annotationsList">
            <div class="annotations-empty" *ngIf="annotationCount === 0">
              <p>No annotations yet</p>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Footer / Properties Bar -->
    <footer class="pdf-modal-footer" *ngIf="state.hasPdf">
      <div class="property-group">
        <label>Color</label>
        <div class="color-picker">
          <button class="color-btn active" data-color="#E31937" style="background: #E31937;"></button>
          <button class="color-btn" data-color="#000000" style="background: #000000;"></button>
          <button class="color-btn" data-color="#0066CC" style="background: #0066CC;"></button>
          <button class="color-btn" data-color="#00AA00" style="background: #00AA00;"></button>
          <button class="color-btn" data-color="#FF9500" style="background: #FF9500;"></button>
        </div>
      </div>
      <div class="property-group">
        <label>Size</label>
        <select class="size-select" id="sizeSelect">
          <option value="2">Thin</option>
          <option value="4" selected>Medium</option>
          <option value="8">Thick</option>
          <option value="12">Extra Thick</option>
        </select>
      </div>
    </footer>
  </div>
</div>

<!-- Toast Notification -->
<div class="toast" id="toast"></div>
```

### Step 3: Add Styles

```scss
/* pdf-workspace/pdf-workspace.component.scss */

// Modal Overlay
.pdf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

// Modal Content
.pdf-modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

// Header
.pdf-modal-header {
  height: 56px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .filename {
      font-size: 13px;
      color: #666;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-badge {
      padding: 6px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .page-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      &:hover:not(:disabled) {
        background: #e0e0e0;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .btn-save {
      padding: 8px 16px;
      background: #1473E6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #0d62c9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #666;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #e0e0e0;
        color: #333;
      }
    }
  }
}

// Body
.pdf-modal-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

// Loading Overlay
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 100;

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e0e0e0;
    border-top-color: #1473E6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    color: #666;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Upload Area
.upload-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .upload-box {
    border: 2px dashed #ccc;
    border-radius: 16px;
    padding: 60px 80px;
    text-align: center;
    transition: all 0.2s;

    &:hover {
      border-color: #1473E6;
      background: #f8f9fa;
    }

    .upload-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }

    p {
      color: #666;
      font-size: 14px;
    }
  }
}

// Canvas Container
.canvas-container {
  display: flex;
  height: 100%;
}

// Toolbar Sidebar
.toolbar-sidebar {
  width: 60px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  overflow-y: auto;

  .tool-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 0 8px;
  }

  .tool-divider {
    width: 32px;
    height: 1px;
    background: #e0e0e0;
    margin: 12px 0;
  }

  .tool-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;

    &:hover {
      background: #e0e0e0;
    }

    &.active {
      background: #e3f2fd;
      color: #1976d2;
    }
  }
}

// Canvas Area
.canvas-area {
  flex: 1;
  overflow: auto;
  background: #e5e5e5;
  padding: 24px;

  .pages-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
}

// Annotations Sidebar
.annotations-sidebar {
  width: 280px;
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;

  .annotations-header {
    height: 48px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-weight: 500;

    .annotation-count {
      background: #e0e0e0;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }
  }

  .annotations-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .annotations-empty {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
  }
}

// Footer
.pdf-modal-footer {
  height: 56px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;

  .property-group {
    display: flex;
    align-items: center;
    gap: 12px;

    label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
  }

  .color-picker {
    display: flex;
    gap: 8px;

    .color-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;

      &.active {
        border-color: white;
        box-shadow: 0 0 0 2px #1473E6;
      }
    }
  }

  .size-select {
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: white;
  }
}
```

### Step 4: Use in Your Table Component

```typescript
// your-table.component.ts
import { Component, ViewChild } from '@angular/core';
import { PdfWorkspaceComponent } from '../pdf-workspace/pdf-workspace.component';

@Component({
  selector: 'app-document-table',
  template: `
    <table>
      <thead>
        <tr>
          <th>Document Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let doc of documents">
          <td>{{ doc.name }}</td>
          <td>{{ doc.status }}</td>
          <td>
            <button (click)="openPreview(doc)">👁 Preview</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PDF Workspace Modal (lives once in your app) -->
    <app-pdf-workspace 
      #pdfWorkspace
      (saved)="onPdfSaved($event)"
      (annotationsChanged)="onAnnotationsChanged($event)"
      (closed)="onPdfClosed()">
    </app-pdf-workspace>
  `
})
export class DocumentTableComponent {
  @ViewChild('pdfWorkspace') pdfWorkspace!: PdfWorkspaceComponent;

  documents = [
    { id: 1, name: 'Contract.pdf', url: '/api/documents/1.pdf', status: 'Pending' },
    { id: 2, name: 'Report.pdf', url: '/api/documents/2.pdf', status: 'Reviewed' }
  ];

  currentUser = {
    id: 'user123',
    username: 'john_doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'editor'
  };

  openPreview(doc: any) {
    this.pdfWorkspace.open({
      pdfUrl: doc.url,
      user: this.currentUser,
      readOnly: false,
      allowDownload: true
    });
  }

  onPdfSaved(event: { blob: Blob; annotations: any; metadata: any }) {
    console.log('PDF saved:', event);
    
    // Upload to your API
    // this.http.post('/api/documents/save', formData).subscribe(...)
  }

  onAnnotationsChanged(annotations: any[]) {
    console.log('Annotations changed:', annotations);
  }

  onPdfClosed() {
    console.log('PDF workspace closed');
  }
}
```

---

## Save & Restore Annotations

### The Problem

PDF files don't natively store annotation metadata (who created what, when, etc.). When you save a PDF and reload it, the annotations appear as flat images - you lose:
- Author information
- Annotation types
- Timestamps
- Editability

### The Solution

Embed the JSON metadata **inside** the PDF as a file attachment! This way you only deal with **ONE file**.

### How It Works

```
When Saving:
┌─────────────────────────────────────────────────────────────┐
│  PDF File                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Visual Pages (with annotations as images)          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📎 Embedded Attachment: annotations.json           │   │
│  │     - Author info (who)                             │   │
│  │     - Timestamps (when)                             │   │
│  │     - Annotation data (what, where)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

When Loading:
1. PDF renders visually ✓
2. Extract annotations.json attachment ✓
3. Restore editable annotations ✓
4. Show author information ✓
```

### Implementation

#### Save (Export)

```typescript
async saveDocument() {
  // Export PDF with embedded metadata
  const blob = await this.pdfService.exportPDF();
  
  // Upload to your server (just ONE file!)
  const formData = new FormData();
  formData.append('pdf', blob, 'document.pdf');
  
  await this.http.post('/api/documents/save', formData).toPromise();
}
```

#### Restore (Import)

```typescript
async loadDocument(documentId: string) {
  // Fetch PDF from server
  const pdfBlob = await this.http.get(
    `/api/documents/${documentId}/pdf`, 
    { responseType: 'blob' }
  ).toPromise();
  
  // Load PDF - metadata is automatically extracted!
  const pdfFile = new File([pdfBlob], 'document.pdf');
  await this.annotator.open(pdfFile);
  
  // Annotations are automatically restored with full metadata
  const metadata = this.pdfService.getAnnotationMetadata();
  console.log('Restored annotations by:', metadata.authors);
}
```

#### Manual Extraction (if needed)

```typescript
// If you need to extract metadata separately
const arrayBuffer = await pdfBlob.arrayBuffer();
const metadata = await this.pdfService.extractMetadataFromPDF(arrayBuffer);

if (metadata) {
  // Restore annotations
  this.pdfService.loadAnnotationsFromJSON(metadata);
}
```

### What's Stored in the PDF

The `annotations.json` attachment contains:

```json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "exportedBy": {
    "id": "user123",
    "username": "john_doe",
    "fullName": "John Doe"
  },
  "fileName": "contract.pdf",
  "totalPages": 5,
  "totalAnnotations": 12,
  "authors": [
    { "id": "user123", "username": "john_doe", "fullName": "John Doe" },
    { "id": "user456", "username": "jane_smith", "fullName": "Jane Smith" }
  ],
  "annotationsByPage": {
    "1": [...],
    "2": [...]
  },
  "annotations": [
    {
      "id": "ann_1234567890",
      "type": "text",
      "page": 1,
      "content": "Important clause!",
      "timestamp": 1705314600000,
      "author": {
        "id": "user123",
        "username": "john_doe",
        "fullName": "John Doe"
      },
      "fabricData": { ... }
    }
  ]
}
```

## API Reference

### PDFService Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `loadPDF(file)` | `File` | Load PDF file |
| `exportPDF(onProgress?)` | `Function` | Export PDF as Blob |
| `exportWithAnnotations()` | - | Export PDF + JSON together |
| `exportAnnotationsToJSON()` | - | Export annotations JSON only |
| `loadAnnotationsFromJSON(data, callback)` | `Object, Function` | Restore annotations |
| `getAnnotationMetadata()` | - | Get current metadata |
| `exportAnnotationsForAPI()` | - | Get data for API submission |

### PDFAnnotator Class Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `open(source)` | `string\|File` | Open PDF from URL or File |
| `setUser(user)` | `User object` | Set current user |
| `exportPDF(onProgress?)` | `Function` | Export PDF |
| `exportWithAnnotations()` | - | Export PDF + JSON |
| `saveAnnotations()` | - | Trigger save event |
| `getAnnotations()` | - | Get all annotations |
| `clearAnnotations()` | - | Remove all annotations |

### PdfWorkspaceComponent Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `open(config)` | `PdfWorkspaceConfig` | Open modal and load PDF |
| `close()` | - | Close modal |
| `savePdf()` | - | Export and emit event |
| `loadPdfFromFile(file)` | `File` | Load PDF file |
| `loadAnnotations(jsonData)` | `Object` | Restore annotations |

### Interfaces

```typescript
interface PdfWorkspaceConfig {
  pdfUrl?: string;
  pdfFile?: File;
  user?: User;
  readOnly?: boolean;
  allowDownload?: boolean;
}

interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role?: string;
}

interface AnnotationExport {
  exportDate: string;
  exportedBy: User;
  fileName: string;
  totalPages: number;
  totalAnnotations: number;
  authors: User[];
  annotations: Annotation[];
  annotationsByPage: Record<string, Annotation[]>;
}
```

### Output Events

| Event | Data | Description |
|-------|------|-------------|
| `(saved)` | `{ blob, jsonBlob, metadata }` | Files ready for upload |
| `(annotationsChanged)` | `Annotation[]` | Annotations modified |
| `(closed)` | - | Modal closed |

---

## Database Schema

See the original integration guide for database schema recommendations.

---

## Complete Example Project Structure

```
src/
  app/
    pdf-workspace/
      ├── pdf-workspace.component.ts      # Main modal component
      ├── pdf-workspace.component.html    # Template
      ├── pdf-workspace.component.scss    # Styles
      └── pdf-annotator/                  # Copy from this repo
            ├── core/
            ├── services/
            ├── annotations/
            ├── tools/
            └── ui/
    documents/
      ├── document-list.component.ts      # Your table/list component
      └── document-list.component.html
    app.component.html
    app.component.ts
    app.module.ts
  assets/
    pdf-annotator/
      └── styles.css                      # Copy from css/styles.css
  index.html                              # Add library scripts here
```

---

## Migration from Iframe Approach

If you were using the iframe approach before, here's how to migrate:

### Before (Iframe)
```typescript
// Old way with iframe
iframe.contentWindow.postMessage({ type: 'SET_USER', payload: user }, '*');
```

### After (Direct Component)
```typescript
// New way - direct method call
pdfWorkspace.setUser(user);
pdfWorkspace.open({ pdfUrl: url, user });
```

---

## License

This integration guide is part of the PDF Annotator project.
