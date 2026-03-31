/**
 * TypeScript Type Definitions for PDF Annotator
 * 
 * Import these types in your Angular application for full type support.
 * 
 * Usage:
 *   import { PDFAnnotator, User, Annotation, PdfAnnotatorConfig } from './pdf-annotator';
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role?: string;
  [key: string]: any;
}

export interface Author {
  id: string | null;
  username: string;
  fullName: string;
  email?: string | null;
}

// ============================================
// Annotation Types
// ============================================

export interface Annotation {
  id: string;
  type: string;
  icon: string;
  content?: string;
  page: number;
  timestamp: number;
  author: Author;
  fabricObject?: any;
  fabricData?: any;
}

export interface AnnotationMetadata {
  exportDate: string;
  exportedBy: User | null;
  totalAnnotations: number;
  authors: Author[];
  annotationsByPage: Record<string, Annotation[]>;
}

export interface AnnotationExport {
  fileName: string;
  totalPages: number;
  exportDate: string;
  exportedBy: User | null;
  totalAnnotations: number;
  authors: Author[];
  annotationsByPage: Record<string, Annotation[]>;
  annotations: Annotation[];
}

// ============================================
// PDF Annotator Configuration
// ============================================

export interface PdfAnnotatorConfig {
  state?: State;
  onAnnotationAdded?: (annotation: Annotation) => void;
  onAnnotationRemoved?: (annotation: Annotation) => void;
  onPdfLoaded?: (data: PdfLoadedEvent) => void;
  onError?: (error: Error) => void;
}

export interface PdfWorkspaceConfig {
  pdfUrl?: string;
  pdfFile?: File;
  user?: User;
  readOnly?: boolean;
  allowDownload?: boolean;
}

export interface PdfLoadedEvent {
  document: any;
  totalPages: number;
  fileName: string;
}

// ============================================
// State Types
// ============================================

export interface StateConfig {
  pdfDocument: any | null;
  currentPage: number;
  totalPages: number;
  fileName: string;
  currentTool: string;
  currentColor: string;
  currentSize: number;
  currentStamp: string;
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  isLoading: boolean;
  textPopupPosition: { x: number; y: number } | null;
  textPopupPage: number | null;
  currentUser: User | null;
}

// ============================================
// Classes
// ============================================

export declare class State {
  constructor();
  
  // Getters
  readonly pdfDocument: any;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly fileName: string;
  readonly currentTool: string;
  readonly currentColor: string;
  readonly currentSize: number;
  readonly currentStamp: string;
  readonly annotations: Annotation[];
  readonly selectedAnnotation: Annotation | null;
  readonly isLoading: boolean;
  readonly hasPdf: boolean;
  readonly currentUser: User | null;
  
  // Methods
  setPdfDocument(doc: any, fileName?: string): void;
  setCurrentPage(page: number): void;
  setTool(tool: string): void;
  setColor(color: string): void;
  setSize(size: number): void;
  setStamp(stamp: string): void;
  setLoading(loading: boolean): void;
  setCurrentUser(user: User | null): void;
  
  getCurrentUserId(): string | null;
  getCurrentUsername(): string;
  isUserAuthenticated(): boolean;
  
  addAnnotation(annotation: Partial<Annotation>): Annotation;
  removeAnnotation(id: string): boolean;
  getAnnotationsByPage(page: number): Annotation[];
  
  setFabricCanvas(page: number, canvas: any): void;
  getFabricCanvas(page: number): any;
  hasFabricCanvas(page: number): boolean;
  
  showTextPopup(x: number, y: number, page: number): void;
  hideTextPopup(): void;
  
  nextPage(): void;
  previousPage(): void;
  canGoNext(): boolean;
  canGoPrevious(): boolean;
  
  on(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
}

export declare const state: State;

export declare class PDFAnnotator {
  constructor(container: HTMLElement, options?: PdfAnnotatorConfig);
  
  readonly container: HTMLElement;
  readonly options: PdfAnnotatorConfig;
  readonly state: State;
  readonly pdfService: PDFService;
  readonly annotationManager: AnnotationManager;
  readonly toolFactory: ToolFactory;
  readonly canvasManager: CanvasManager | null;
  
  open(source: string | File): Promise<void>;
  setUser(user: User): void;
  getUser(): User | null;
  setTool(toolName: string): void;
  setColor(color: string): void;
  setSize(size: number): void;
  goToPage(pageNum: number): void;
  nextPage(): void;
  previousPage(): void;
  getAnnotations(): Annotation[];
  getAnnotationMetadata(): AnnotationMetadata;
  exportAnnotationsForAPI(): AnnotationExport;
  exportPDF(onProgress?: (page: number, total: number) => void): Promise<Blob>;
  downloadPDF(filename?: string): Promise<void>;
  clearAnnotations(): void;
  getCurrentPage(): number;
  getTotalPages(): number;
  hasPdf(): boolean;
  destroy(): void;
}

export declare class PDFService {
  constructor(state: State);
  loadPDF(file: File): Promise<any>;
  renderPage(pageNum: number, canvas: HTMLCanvasElement, scale?: number): Promise<any>;
  renderThumbnail(pageNum: number, canvas: HTMLCanvasElement): Promise<any>;
  exportPDF(onProgress?: (page: number, total: number) => void): Promise<Blob>;
  getAnnotationMetadata(): AnnotationMetadata;
  exportAnnotationsForAPI(): AnnotationExport;
}

export declare class AnnotationManager {
  constructor(state: State);
  getCount(): number;
  getByPage(pageNum: number): Annotation[];
  remove(id: string): boolean;
  clear(): void;
}

export declare class ToolFactory {
  constructor(state: State);
  getTool(name: string): any;
}

export declare class CanvasManager {
  constructor(state: State, pdfService: PDFService, toolFactory: ToolFactory);
}

export declare class Toolbar {
  constructor(state: State, toolFactory: ToolFactory);
}

export declare class PropertiesBar {
  constructor(state: State, pdfService: PDFService);
}

export declare class AnnotationsPanel {
  constructor(state: State);
}

export declare class TextPopup {
  constructor(state: State, textTool: any);
}

export declare class Toast {
  constructor(state: State);
}

export declare class UploadOverlay {
  constructor(state: State, onFileSelect: (file: File) => void);
  hide(): void;
}

export declare class UserContext {
  setUser(user: User): void;
  clearUser(): void;
  getCurrentUser(): User | null;
  getAnnotationsForExport(): AnnotationExport;
  notifyParent(event: string, data: any): void;
  setAllowedOrigins(origins: string[]): void;
  registerHandler(type: string, handler: Function): void;
}

export declare const userContext: UserContext;

// ============================================
// Configuration
// ============================================

export interface Config {
  SCALE: number;
  DEFAULT_TOOL: string;
  DEFAULT_COLOR: string;
  DEFAULT_SIZE: number;
  COLORS: {
    RED: string;
    BLACK: string;
    BLUE: string;
    GREEN: string;
    ORANGE: string;
  };
  SIZES: {
    THIN: number;
    MEDIUM: number;
    THICK: number;
    EXTRA_THICK: number;
  };
  STAMPS: {
    CHECK: string;
    CROSS: string;
    DOT: string;
    CIRCLE: string;
    CROSSOUT: string;
  };
  EVENTS: {
    PDF_LOADED: string;
    PDF_ERROR: string;
    PAGE_CHANGED: string;
    TOOL_CHANGED: string;
    COLOR_CHANGED: string;
    SIZE_CHANGED: string;
    ANNOTATION_ADDED: string;
    ANNOTATION_REMOVED: string;
    ANNOTATION_SELECTED: string;
    USER_CHANGED: string;
    SHOW_TEXT_POPUP: string;
    HIDE_TEXT_POPUP: string;
    SHOW_PROGRESS: string;
    HIDE_PROGRESS: string;
    SHOW_TOAST: string;
  };
  THUMBNAIL_SCALE: number;
  EXPORT: {
    JPEG_QUALITY: number;
    POINTS_PER_PIXEL: number;
  };
}

export declare const Config: Config;

// ============================================
// Tools
// ============================================

export declare abstract class Tool {
  constructor(name: string, state: State);
  getCursor(): string;
  activate(canvas: any): void;
  deactivate(canvas: any): void;
  onMouseDown(event: any, canvas: any, pointer: { x: number; y: number }): void;
  onMouseMove(event: any, canvas: any, pointer: { x: number; y: number }): void;
  onMouseUp(event: any, canvas: any, pointer: { x: number; y: number }): void;
  applySettings(canvas: any): void;
}

export declare class SelectTool extends Tool {}
export declare class HandTool extends Tool {}
export declare class DrawTool extends Tool {}
export declare class TextTool extends Tool {
  createText(text: string, x: number, y: number, page: number): any;
}
export declare class StampTool extends Tool {}
export declare class LineTool extends Tool {}
export declare class ArrowTool extends Tool {}
export declare class RectangleTool extends Tool {}
export declare class CircleTool extends Tool {}
export declare class HighlighterTool extends Tool {}
export declare class DeleteTool extends Tool {}

// ============================================
// Global Declarations (for libraries loaded via script tags)
// ============================================

declare global {
  interface Window {
    pdfjsLib: any;
    fabric: any;
    jspdf: any;
    jsPDF: any;
  }
}

// Default export
export default PDFAnnotator;
