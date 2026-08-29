import { PDFDocument } from 'pdf-lib'
import { pdfjsLib, type PDFDocumentProxy } from '../pdfjs'
import { outputName } from '../layout'
import type { CompressedFile, Level, PdfSettings } from '../types'

// PDF compression, in two quite different modes.
//
// 'light' is lossless: pdf-lib re-saves the document with object streams, which
// packs the cross-reference table and any repeated objects. Text stays text —
// selectable, searchable, copyable — and the saving is whatever slack the
// producing application left behind. On a well-made PDF that is a few percent;
// on one exported by an office suite it can be a third.
//
// 'balanced' and 'maximum' rasterise: every page is rendered by pdf.js and
// re-embedded as a single JPEG. This is a large, reliable saving on scans and
// image-heavy documents — and it destroys the text layer. That trade is stated
// plainly in the UI (see LEVEL_BLURB) rather than buried, because a searchable
// contract silently turning into a stack of pictures is the kind of thing people
// discover months later.
//
// Ported from Universal PDF's `compressPdf`, which has been in production since
// its Compress toolbar item shipped.

const RASTER: Record<Exclude<Level, 'light'>, { renderScale: number; jpegQuality: number }> = {
  balanced: { renderScale: 1.5, jpegQuality: 0.7 },
  maximum: { renderScale: 1.0, jpegQuality: 0.45 },
}

export async function compressPdf(
  file: File,
  settings: PdfSettings,
  onProgress: (fraction: number) => void = () => {},
): Promise<CompressedFile> {
  const sourceBytes = await file.arrayBuffer()
  const name = outputName(file.name, 'pdf')
  onProgress(0.05)

  if (settings.level === 'light') {
    const pdf = await PDFDocument.load(sourceBytes, { updateMetadata: false })
    onProgress(0.5)
    const bytes = await pdf.save({ useObjectStreams: true })
    onProgress(1)
    return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), name }
  }

  const { renderScale, jpegQuality } = RASTER[settings.level]
  // pdf.js detaches the buffer it is handed, so give it a copy and keep the
  // original for pdf-lib (which we use only to read each page's size).
  const pdfjsDoc = await pdfjsLib.getDocument({ data: sourceBytes.slice(0) }).promise
  const srcPdf = await PDFDocument.load(sourceBytes)
  const out = await PDFDocument.create()
  const pageCount = srcPdf.getPageCount()

  for (let i = 0; i < pageCount; i++) {
    const { width, height } = srcPdf.getPage(i).getSize()
    const imgBytes = await rasterizePageToJpeg(pdfjsDoc, i, renderScale, jpegQuality)
    const img = await out.embedJpg(imgBytes)
    const page = out.addPage([width, height])
    page.drawImage(img, { x: 0, y: 0, width, height })
    // Rendering is nearly all the wall-clock, so the bar is the page counter.
    onProgress(0.05 + ((i + 1) / pageCount) * 0.9)
  }

  const bytes = await out.save({ useObjectStreams: true })
  onProgress(1)
  return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), name }
}

// Render one source page through pdf.js at the given scale and return JPEG bytes.
async function rasterizePageToJpeg(
  pdfjsDoc: PDFDocumentProxy,
  pageIndex: number,
  renderScale: number,
  jpegQuality: number,
): Promise<Uint8Array> {
  const page = await pdfjsDoc.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale: renderScale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser wouldn’t give us a canvas to draw on')
  // JPEG has no alpha — paint white first so transparent regions don't go black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', jpegQuality)
  })
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * How many pages. Cheap — the header alone answers it.
 *
 * Returns the number rather than the "12 pages" string it used to: the row still
 * shows the string, but the size estimate multiplies one measured page by this.
 */
export async function probePageCount(file: File): Promise<number | null> {
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false })
    return pdf.getPageCount()
  } catch {
    return null
  }
}

/**
 * What this file would come out as at `level`, in bytes — without compressing
 * the whole thing.
 *
 * The two modes need two different answers, and neither is a guessed ratio:
 *
 *   • **light** is a lossless repack, and how much slack a producer left behind
 *     is not predictable from anything in the header — a well-made PDF gives up
 *     a few percent and an office-suite export can give up a third. So this
 *     mode is simply RUN. It is the cheap mode (pdf-lib parses and re-saves;
 *     nothing is rendered), and the number it returns is therefore exact.
 *   • **balanced / maximum** replace every page with one JPEG, so the output is
 *     essentially the sum of those JPEGs. Three pages are rendered for real at
 *     the level's own settings and the mean is multiplied by the page count.
 *
 * ⚠️ **The sample points avoid the covers, and that is not fussiness.** Sampling
 * page 1 and the middle page of a 60-page report predicted 2.2 MB against a real
 * 3.0 MB — 32% low — because a title page is nearly white and a white page
 * JPEGs to almost nothing. Taking the sixth, the half and the five-sixths puts
 * every sample in the body, and the same document then came in a few percent
 * out. Three rather than all of them because rendering is the entire cost of the
 * real run, and an estimate that costs what it estimates is not an estimate.
 */
export async function samplePdfBytes(file: File, level: Level): Promise<number | null> {
  try {
    const sourceBytes = await file.arrayBuffer()

    if (level === 'light') {
      const pdf = await PDFDocument.load(sourceBytes, { updateMetadata: false })
      const bytes = await pdf.save({ useObjectStreams: true })
      return bytes.byteLength
    }

    const { renderScale, jpegQuality } = RASTER[level]
    const pdfjsDoc = await pdfjsLib.getDocument({ data: sourceBytes.slice(0) }).promise
    const pageCount = pdfjsDoc.numPages
    if (pageCount === 0) return null

    // Evenly spread through the BODY: for three samples that is the sixth, the
    // half and the five-sixths, so neither cover can be one of them.
    const wanted = Math.min(3, pageCount)
    const indices = [...new Set(
      Array.from({ length: wanted }, (_, k) =>
        Math.min(pageCount - 1, Math.floor((pageCount * (k + 0.5)) / wanted)),
      ),
    )]
    let sampled = 0
    for (const i of indices) {
      sampled += (await rasterizePageToJpeg(pdfjsDoc, i, renderScale, jpegQuality)).length
    }
    // ~2 KB of page object, xref and image dictionary per page on top of the
    // JPEG itself, plus the file's own fixed boxes.
    const perPage = sampled / indices.length + 2048
    return Math.round(perPage * pageCount) + 4096
  } catch {
    // No estimate is better than a wrong one — the caller shows nothing.
    return null
  }
}
