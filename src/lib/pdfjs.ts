import * as pdfjsLib from 'pdfjs-dist'
// Imported with `?worker` (IIFE format, see vite.config.ts) so iOS Safari gets a
// classic blob-URL worker instead of an ES module worker, which it cannot
// import. Same arrangement as Universal PDF.
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker()

export { pdfjsLib }
export type { PDFDocumentProxy } from 'pdfjs-dist'
