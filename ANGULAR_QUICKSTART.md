# Angular Quick Start Guide

Get PDF Annotator running in your Angular app in 5 minutes.

## Step 1: Copy Files (30 seconds)

```bash
# Copy PDF annotator files to your Angular project
cp -r js/* src/app/pdf-workspace/pdf-annotator/
cp css/styles.css src/assets/pdf-annotator/
cp pdf-annotator.d.ts src/app/pdf-workspace/
```

## Step 2: Add Libraries to index.html (30 seconds)

```html
<!-- src/index.html -->
<head>
  <!-- Add these 3 lines before closing </head> -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  </script>
  <link rel="stylesheet" href="assets/pdf-annotator/styles.css">
</head>
```

## Step 3: Create Component (2 minutes)

```typescript
// src/app/pdf-workspace/pdf-workspace.component.ts
import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { state, PDFService, AnnotationManager, ToolFactory } from './pdf-annotator/core/State';
import { Config } from './pdf-annotator/core/Config';
import { CanvasManager } from './pdf-annotator/ui/CanvasManager';

@Component({
  selector: 'app-pdf-workspace',
  template: `
    <div class="pdf-modal" *ngIf="isOpen" (click)="close()">
      <div class="pdf-content" (click)="$event.stopPropagation()">
        <header>
          <h3>PDF Annotator</h3>
          <span *ngIf="currentUser">👤 {{currentUser.username}}</span>
          <button (click)="save()">💾 Save</button>
          <button (click)="close()">✕</button>
        </header>
        
        <div class="pdf-body">
          <!-- Upload -->
          <div *ngIf="!hasPdf" class="upload" (click)="fileInput.click()">
            <p>📄 Drop PDF or click to browse</p>
            <input type="file" #fileInput hidden accept=".pdf" (change)="onFile($event)">
          </div>
          
          <!-- Canvas -->
          <div *ngIf="hasPdf" class="canvas-wrapper">
            <aside class="toolbar"><!-- tools --></aside>
            <main #pagesContainer class="pages"></main>
            <aside class="annotations">Annotations: {{annotationCount}}</aside>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pdf-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
                 display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .pdf-content { background: white; width: 90vw; height: 90vh; border-radius: 12px; 
                   display: flex; flex-direction: column; overflow: hidden; }
    header { padding: 16px; background: #f5f5f5; display: flex; align-items: center; gap: 12px; }
    .pdf-body { flex: 1; overflow: hidden; position: relative; }
    .upload { height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .canvas-wrapper { display: flex; height: 100%; }
    .toolbar { width: 60px; background: #f5f5f5; }
    .pages { flex: 1; overflow: auto; background: #e5e5e5; padding: 20px; }
    .annotations { width: 250px; background: #f5f5f5; padding: 16px; }
  `]
})
export class PdfWorkspaceComponent {
  @ViewChild('pagesContainer') pagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @Output() saved = new EventEmitter<any>();
  
  isOpen = false;
  hasPdf = false;
  annotationCount = 0;
  currentUser: any = null;
  
  private pdfService = new PDFService(state);
  private toolFactory = new ToolFactory(state);
  private canvasManager: any = null;

  open(config: { pdfUrl?: string; pdfFile?: File; user?: any }) {
    this.isOpen = true;
    this.currentUser = config.user;
    
    if (config.user) {
      state.setCurrentUser(config.user);
    }
    
    if (config.pdfFile) {
      this.loadPdf(config.pdfFile);
    } else if (config.pdfUrl) {
      fetch(config.pdfUrl)
        .then(r => r.blob())
        .then(b => this.loadPdf(new File([b], 'doc.pdf')));
    }
    
    setTimeout(() => {
      this.canvasManager = new CanvasManager(state, this.pdfService, this.toolFactory);
    }, 0);
    
    state.on(Config.EVENTS.ANNOTATION_ADDED, () => {
      this.annotationCount = state.annotations.length;
    });
  }

  close() { this.isOpen = false; state.setPdfDocument(null, ''); }

  async loadPdf(file: File) {
    await this.pdfService.loadPDF(file);
    this.hasPdf = true;
  }

  onFile(e: any) {
    if (e.target.files[0]) this.loadPdf(e.target.files[0]);
  }

  async save() {
    const blob = await this.pdfService.exportPDF();
    const metadata = this.pdfService.getAnnotationMetadata();
    this.saved.emit({ blob, metadata, annotations: state.annotations });
  }
}
```

## Step 4: Use in Your Component (1 minute)

```typescript
// your-table.component.ts
import { Component, ViewChild } from '@angular/core';
import { PdfWorkspaceComponent } from './pdf-workspace/pdf-workspace.component';

@Component({
  template: `
    <table>
      <tr *ngFor="let doc of documents">
        <td>{{doc.name}}</td>
        <td><button (click)="preview(doc)">Preview</button></td>
      </tr>
    </table>
    <app-pdf-workspace #workspace (saved)="onSave($event)"></app-pdf-workspace>
  `
})
export class TableComponent {
  @ViewChild('workspace') workspace!: PdfWorkspaceComponent;
  
  documents = [{ name: 'Contract.pdf', url: '/api/contract.pdf' }];
  
  currentUser = { id: 'u1', username: 'john', fullName: 'John Doe' };
  
  preview(doc: any) {
    this.workspace.open({ pdfUrl: doc.url, user: this.currentUser });
  }
  
  onSave(data: any) {
    console.log('PDF saved with annotations by:', data.metadata.exportedBy);
    // Upload to your API
  }
}
```

## Step 5: Save & Restore (Single File!)

The JSON metadata is embedded **inside** the PDF as an attachment. Just **ONE file**!

### Save

```typescript
async save() {
  // PDF with embedded metadata (single file!)
  const blob = await this.annotator.exportPDF();
  
  // Upload to your API (just one file)
  const formData = new FormData();
  formData.append('pdf', blob, 'doc.pdf');
  
  await this.http.post('/api/save', formData).toPromise();
}
```

### Restore

```typescript
async load(documentId: string) {
  // Fetch PDF
  const pdfBlob = await this.http.get(`/api/pdf/${documentId}`, { responseType: 'blob' }).toPromise();
  
  // Load PDF - metadata is automatically extracted!
  const file = new File([pdfBlob], 'doc.pdf');
  await this.annotator.open(file);
  
  // Annotations restored automatically with author info
  const metadata = this.pdfService.getAnnotationMetadata();
  console.log('Annotations by:', metadata.authors.map(a => a.username));
}
```

**Result:** All annotations restored with original author info, timestamps, and editability!

---

## Done! 🎉

Click "Preview" → Modal opens → Annotate → Save (single PDF) → Reload same PDF → Annotations restored with username!

---

## Key Points

1. **Libraries loaded once** in `index.html` - no duplicates
2. **Direct method calls** - no iframe, no postMessage
3. **User tracking automatic** - just pass `user` to `open()`
4. **Single file** - JSON embedded inside PDF as attachment
5. **Full type support** - see `pdf-annotator.d.ts`

## Demo Files

- `demo-single-file.html` - Shows single-file save/restore
- See [ANGULAR_INTEGRATION.md](ANGULAR_INTEGRATION.md) for complete docs
