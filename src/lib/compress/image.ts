import { outputName } from '../layout'
import { isHeicFile } from './heicSniff'
import { extensionOf } from '../kinds'
import type { CompressedFile, ImageSettings } from '../types'

// Images go through the browser's own decoder and canvas encoder: decode →
// (optional) downscale → re-encode. No library, no download, nothing leaves the
// tab.

/** What `format: 'keep'` resolves to for a given source. */
function targetFormat(file: File, settings: ImageSettings): { mime: string; ext: string; lossy: boolean } {
  if (settings.format === 'jpeg') return { mime: 'image/jpeg', ext: 'jpg', lossy: true }
  if (settings.format === 'webp') return { mime: 'image/webp', ext: 'webp', lossy: true }

  // 'keep'. PNG is the interesting case: it is lossless, so re-encoding a PNG as
  // a PNG usually saves nothing at all (and the canvas encoder often makes it
  // BIGGER, because it throws away whatever the original optimiser did). A PNG
  // that is really a photo shrinks by 80% as a JPEG. So "keep" keeps the format
  // for everything that is already lossy, and sends PNG/GIF/BMP to WebP — which
  // is lossless-capable, supports alpha, and is the one format that is always
  // the right answer for "make this smaller without me thinking about it".
  const ext = extensionOf(file.name)
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return { mime: 'image/jpeg', ext: 'jpg', lossy: true }
    // No browser can ENCODE HEIC, so "keep" cannot mean keep here. WebP is the
    // closest thing: lossy like the source, smaller than JPEG at the same
    // quality, and openable everywhere. Pick JPEG explicitly if the photo is
    // going somewhere old.
    case 'heic':
    case 'heif':
      return { mime: 'image/webp', ext: 'webp', lossy: true }
    case 'avif':
      return { mime: 'image/avif', ext: 'avif', lossy: true }
    case 'webp':
      return { mime: 'image/webp', ext: 'webp', lossy: true }
    default:
      return { mime: 'image/webp', ext: 'webp', lossy: true }
  }
}

export async function compressImage(
  file: File,
  settings: ImageSettings,
  onProgress: (fraction: number) => void = () => {},
): Promise<CompressedFile> {
  // ⚠️ **Before anything else, and never reorder this below the decode.**
  //
  // `createImageBitmap` on an animated GIF returns frame one and says nothing
  // about the frames it dropped. Everything after this point is built on that
  // call, so an animation reaching it does not fail — it succeeds, at producing
  // a still. That is how this app used to turn a 4.2 MB animation into a 2 KB
  // WebP and report "−100%", the biggest saving on the screen, for having
  // destroyed the file. The animated path is in `./gif` and keeps it a GIF.
  //
  // Dynamic, and only entered for a file that already looks like a GIF: the
  // reader, the palette builder and the LZW coder are ~15 KB that nobody who
  // drops a photograph should download. See the note in `./index.ts`.
  if (looksLikeGif(file)) {
    const { compressIfAnimatedGif } = await import('./gif')
    const animated = await compressIfAnimatedGif(file, settings, onProgress)
    if (animated) return animated
    // A still GIF falls through: it has no animation to protect, and the canvas
    // path turns it into a much smaller WebP.
  }

  let target = targetFormat(file, settings)
  // AVIF encoding is not in every browser's canvas. Rather than fail at the very
  // end of the job, check first and fall back to WebP, which is everywhere that
  // matters and lands in the same size ballpark.
  if (target.mime === 'image/avif' && !(await canEncode('image/avif'))) {
    target = { mime: 'image/webp', ext: 'webp', lossy: true }
  }

  const bitmap = await decode(file)
  onProgress(0.4)

  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height, settings.maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser wouldn’t give us a canvas to draw on')

    // JPEG has no alpha: without a white ground, transparent pixels come out
    // black instead of the white everyone expects.
    if (target.mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)
    onProgress(0.7)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, target.mime, target.lossy ? settings.quality : undefined),
    )
    if (!blob) throw new Error('The image couldn’t be re-encoded')
    onProgress(1)

    return { blob, name: outputName(file.name, target.ext) }
  } finally {
    bitmap.close()
  }
}

/** Longest edge capped at `maxEdge`, aspect preserved. Never scales UP. */
export function targetSize(
  width: number,
  height: number,
  maxEdge: ImageSettings['maxEdge'],
): { width: number; height: number } {
  if (maxEdge === 'source') return { width, height }
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Worth opening to see whether it is an animation?
 *
 * Deliberately generous: it costs a read of the file to find out for certain,
 * and the cost of a false NO is silently destroying someone's animation, while
 * the cost of a false yes is one wasted header check. So a `.gif` with no MIME
 * type and an `image/gif` with no extension both qualify — the same reasoning
 * `kinds.ts` gives for putting the extension ahead of `File.type`.
 */
function looksLikeGif(file: File): boolean {
  return file.type.toLowerCase() === 'image/gif' || extensionOf(file.name) === 'gif'
}

/**
 * Frames, if this file is an ANIMATED GIF. `null` for everything else,
 * including a still GIF.
 *
 * Read on drop, alongside the dimensions, because the row's caption and the
 * size estimate both want it and neither should pay for its own pass over the
 * file — the same argument the other probes make in `fillDetail`. Dynamic, so
 * the codec still isn't downloaded by anyone who never drops a GIF.
 */
export async function probeGifFrames(file: File): Promise<number | null> {
  if (!looksLikeGif(file)) return null
  const { probeGif } = await import('./gif')
  const info = await probeGif(file)
  return info && info.frames > 1 ? info.frames : null
}

// Is this the thing a phone hands you? Name, MIME *and* the file's own first
// bytes — see heicSniff.ts, which explains why the first two are not enough on
// Android and is the same file in Converter and PDF.

/**
 * HEIC/HEIF → an ImageBitmap, so the rest of this file can treat an iPhone
 * photo as any other raster.
 *
 * This is the only input in the app that needs a decoder shipped with it, and
 * it is ~3MB, so it is dynamic-imported on the first HEIC and costs nothing to
 * anyone who never drops one.
 *
 * ⚠️ **`heic-to` (libheif 1.19), NOT `heic2any`.** heic2any's last release
 * bundles a libheif from 2019, which fails on every photo a current iPhone
 * takes — they store the main image as a `grid` of HEVC tiles with an HDR gain
 * map and a `tmap` item beside it, and a 2019 build handles none of that. It
 * decodes a synthetic single-item fixture perfectly, which is exactly how a
 * test goes green on something the app cannot do. **A generated HEIC does not
 * test HEIC.** Same call as Universal Converter and Universal Images; the long
 * version is in the Universal Images section of `Docs_UNI_SIM/landmines.md`.
 */
async function heicToBitmap(file: File): Promise<ImageBitmap> {
  const { heicTo } = await import('heic-to')
  try {
    return await heicTo({ blob: file, type: 'bitmap' })
  } catch (e) {
    // Name the cause. A friendly sentence that hides the decoder's own words
    // blames the file for something the library did.
    const why = e instanceof Error ? e.message : String(e)
    throw new Error(`This HEIC couldn’t be decoded — ${why}`)
  }
}

// createImageBitmap covers PNG/JPEG/WebP/GIF/AVIF wherever the browser can
// decode them at all.
async function decode(file: File): Promise<ImageBitmap> {
  // Before the try, not inside its catch: on Safari `createImageBitmap` would
  // succeed on a HEIC and never reach a fallback, so Safari and everything else
  // would take different paths and only one of them would be the tested one.
  if (await isHeicFile(file)) return await heicToBitmap(file)

  try {
    return await createImageBitmap(file)
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.decoding = 'async'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('decode failed'))
        img.src = url
      })
      return await createImageBitmap(img)
    } catch {
      throw new Error(
        'This image couldn’t be decoded — it may be corrupt, or use a format this browser can’t read',
      )
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

const encoderCache = new Map<string, Promise<boolean>>()

/** Whether canvas.toBlob will actually produce this type here, asked once. */
function canEncode(mime: string): Promise<boolean> {
  const cached = encoderCache.get(mime)
  if (cached) return cached
  const probe = new Promise<boolean>((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    // A browser without the encoder silently hands back a PNG rather than
    // failing, so the type of what comes out is the only honest test.
    canvas.toBlob((blob) => resolve(blob?.type === mime), mime, 0.8)
  })
  encoderCache.set(mime, probe)
  return probe
}

/**
 * The source's pixel dimensions, read without decoding the whole image.
 *
 * Returns the numbers rather than the "1920 × 1080" string it used to: the row
 * still needs the string, but the size estimate needs the pixel count to scale
 * one measured sample encode across the rest of the queue. The store formats.
 */
export function probeDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    let settled = false
    const finish = (value: { width: number; height: number } | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), 5000)
    img.onload = () => finish({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => finish(null)
    img.src = url
  })
}
