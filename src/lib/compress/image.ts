import { compressedName } from '../layout'
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

    return { blob, name: compressedName(file.name, target.ext) }
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

// createImageBitmap covers PNG/JPEG/WebP/GIF/AVIF wherever the browser can
// decode them at all.
async function decode(file: File): Promise<ImageBitmap> {
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

/** "1920 × 1080" for the file row, read without decoding the whole image. */
export function probeDimensions(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), 5000)
    img.onload = () => finish(`${img.naturalWidth} × ${img.naturalHeight}`)
    img.onerror = () => finish(null)
    img.src = url
  })
}
