# PDF Annotator

A professional PDF annotation tool built with modern JavaScript, following SOLID principles and featuring an Adobe Acrobat-inspired clean white interface.

![PDF Annotator Screenshot](screenshot.png)

## ✨ Features

- 📄 **PDF Upload** - Drag & drop or click to browse PDF files
- ✏️ **Drawing Tools** - Freehand drawing, lines, arrows, rectangles, circles
- 📝 **Text Annotations** - Add text anywhere on the document
- 🎯 **Stamps** - Checkmarks, crosses, dots, circles, cross-out marks
- 🖍️ **Highlighter** - Semi-transparent highlighting for text
- 🖱️ **Hand Tool** - Pan and scroll through documents
- 🎨 **Color Selection** - Multiple colors for annotations
- 📐 **Size Control** - Adjustable line thickness
- 💾 **Export** - Save annotated PDF with all changes
- 📋 **Annotations Panel** - View and navigate all annotations
- 👤 **User Tracking** - Track who made each annotation (Angular integration ready)
- 🔗 **Angular Integration** - Easy integration with Angular apps via postMessage API

## 🚀 Quick Start

### Option 1: Direct Open
Simply open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080/` in your browser.

## 🏗️ Architecture

This project follows **SOLID principles** for maintainable and extensible code:

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each module has one specific job |
| **O**pen/Closed | Tools are open for extension, closed for modification |
| **L**iskov Substitution | All tools implement the same `Tool` interface |
| **I**nterface Segregation | Minimal, focused interfaces |
| **D**ependency Inversion | High-level modules depend on abstractions |

## 📁 Project Structure

```
pdf-annotator/
├── index.html                 # Main entry point
├── README.md                  # This file
├── css/
│   └── styles.css            # Adobe Acrobat white theme
├── js/
│   ├── core/                 # Core infrastructure
│   │   ├── EventEmitter.js   # Pub/sub pattern
│   │   ├── Config.js         # Constants & configuration
│   │   └── State.js          # Centralized state management
│   ├── services/             # Business logic
│   │   └── PDFService.js     # PDF operations
│   ├── tools/                # Tool implementations
│   │   ├── Tool.js           # Abstract base class
│   │   ├── ToolFactory.js    # Factory pattern
│   │   ├── SelectTool.js     # Selection tool
│   │   ├── HandTool.js       # Pan tool
│   │   ├── DrawTool.js       # Freehand drawing
│   │   ├── TextTool.js       # Text annotations
│   │   ├── StampTool.js      # Stamp marks
│   │   ├── LineTool.js       # Line drawing
│   │   ├── ArrowTool.js      # Arrow drawing
│   │   ├── RectangleTool.js  # Rectangle shapes
│   │   ├── CircleTool.js     # Circle/ellipse
│   │   ├── HighlighterTool.js # Highlighter
│   │   └── DeleteTool.js     # Delete selected
│   ├── annotations/          # Annotation system
│   │   └── AnnotationManager.js
│   └── ui/                   # UI components
│       ├── Toolbar.js        # Left sidebar
│       ├── PropertiesBar.js  # Bottom properties
│       ├── AnnotationsPanel.js # Right panel
│       ├── CanvasManager.js  # Canvas coordination
│       ├── TextPopup.js      # Text input modal
│       ├── Toast.js          # Notifications
│       └── UploadOverlay.js  # File upload UI
└── app.js                    # Main application controller
```

## 🛠️ Available Tools

| Tool | Icon | Description | Shortcut |
|------|------|-------------|----------|
| Select | ↖ | Select and move objects | - |
| Hand | ✋ | Pan/scroll document | - |
| Text | T | Add text annotations | - |
| Draw | ✏️ | Freehand drawing | - |
| Line | ➖ | Straight lines | - |
| Arrow | ➡️ | Arrows with heads | - |
| Rectangle | ⬜ | Rectangle outlines | - |
| Circle | ⭕ | Circles/ellipses | - |
| Highlighter | 🖍️ | Semi-transparent marker | - |
| Stamp | 🏷️ | Checkmarks, crosses, etc. | - |
| Delete | 🗑️ | Remove selected annotations | - |

## 🔗 Angular Integration

This PDF Annotator is designed to be easily integrated with Angular applications using the **lightest possible approach**:

### Modal-Based Integration (Recommended)

No iframe. No postMessage. Just a simple modal component:

```typescript
// In your table component
openPreview(doc: any) {
  this.pdfWorkspace.open({
    pdfUrl: doc.url,
    user: this.currentUser  // Track who annotates
  });
}
```

**Features:**
- ✅ **Direct Method Calls** - No iframe or postMessage overhead
- ✅ **Load Libraries Once** - PDF.js, Fabric.js, jsPDF loaded in index.html
- ✅ **User Tracking** - Each annotation automatically tagged with author
- ✅ **Export with Metadata** - PDF contains annotation author info
- ✅ **TypeScript Support** - Full type definitions included

See [ANGULAR_INTEGRATION.md](ANGULAR_INTEGRATION.md) for the complete implementation guide.

## 🎨 Color Palette

- 🔴 Red (#E31937)
- ⚫ Black (#000000)
- 🔵 Blue (#0066CC)
- 🟢 Green (#00AA00)
- 🟠 Orange (#FF9500)

## 🧰 Technologies

- **PDF.js** (v3.11.174) - PDF rendering and parsing
- **Fabric.js** (v5.3.1) - Interactive canvas and annotations
- **jsPDF** (v2.5.1) - PDF generation and export
- **Vanilla JavaScript** - ES6+ modules, no build step required

## 📖 Usage Guide

### Uploading a PDF
1. Click "Drop PDF file here" area or drag & drop a PDF file
2. The document will load and display page 1

### Adding Annotations
1. Select a tool from the left sidebar
2. For tools with submenus (Draw, Stamp), click to expand options
3. Click and drag on the document to create annotations
4. Use the properties bar to change color and size

### Navigating Pages
- Use arrow buttons in the top bar
- Or scroll through the document

### Saving
- Click "Save PDF" in the bottom right
- The annotated PDF will download to your computer

### Deleting Annotations
1. Select the annotation with the Select tool
2. Click the Delete tool or press Delete key

## 🧪 Development

### Adding a New Tool

1. Create a new file in `js/tools/`:
```javascript
import { Tool } from './Tool.js';

export class MyTool extends Tool {
  constructor(state) {
    super('mytool', state);
  }

  getCursor() {
    return 'crosshair';
  }

  onActivate(canvas) {
    // Setup when tool is selected
  }

  onMouseDown(event, canvas, pointer) {
    // Handle mouse down
  }
}
```

2. Register in `js/tools/ToolFactory.js`:
```javascript
import { MyTool } from './MyTool.js';

this.tools.set('mytool', new MyTool(this.state));
```

3. Add UI button in `index.html`

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and ensure new features maintain SOLID principles.

## 🔮 Future Improvements

- [ ] Undo/Redo functionality
- [ ] Image annotations
- [ ] Signature support
- [ ] Cloud storage integration
- [ ] Multi-page thumbnail view
- [ ] Search within PDF
- [ ] Comment threads/replies
- [ ] Mobile touch support optimization
- [x] User tracking for annotations (✅ Implemented)
- [x] Angular integration support (✅ Implemented)

---

Built with ❤️ following clean code principles.
