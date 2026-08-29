import { estimateOutput } from '@unisim/media'
import { compressImage, targetSize } from './compress/image'
import type { FileKind } from './kinds'
import type {
  AudioSettings,
  ImageSettings,
  PdfSettings,
  ProbeMeta,
  VideoCompressSettings,
} from './types'

/**
 * How big will this be?
 *
 * The point of the strength control is a trade the user cannot see: "Balanced"
 * and "Maximum" are adjectives until there is a number beside each of them. So
 * every level carries its own predicted output size, and the three sit side by
 * side under the picker where the comparison is the whole reason to look.
 *
 * ⚠️ **A guessed ratio was not acceptable here.** A table of "images compress to
 * about 35%" would have been ten lines and would have been wrong per file, per
 * format and per level — and wrong in the direction that matters, because a
 * number on screen is read as a promise. Each kind is answered by the mechanism
 * that will actually produce the file:
 *
 *   • **video** — @unisim/media's own `estimateOutput()`, the bitrate model the
 *     encoder is driven by. Prediction and run cannot drift apart, because they
 *     are the same function.
 *   • **audio** — `bitrate x seconds`. CBR, so this is arithmetic, not a guess.
 *   • **images** — one file is REALLY ENCODED at the level and measured; the
 *     rest are scaled from it by output pixel count.
 *   • **PDF** — the light repack is run (it is the cheap mode); the raster modes
 *     render two real pages and multiply. See `samplePdfBytes`.
 *
 * Where the answer cannot be had honestly — a probe that failed, a queue too
 * big to sample cheaply — this returns `null` and the UI shows nothing at all.
 * A blank is a smaller lie than a number.
 */

/** One queue entry, reduced to what an estimate needs. */
export interface EstimateItem {
  file: File
  meta?: ProbeMeta
}

/** Every kind's settings at the level being priced. */
export interface LevelSettings {
  pdf: PdfSettings
  video: VideoCompressSettings
  image: ImageSettings
  audio: AudioSettings
}

/**
 * Above this, sampling a PDF costs more than it is worth — pdf-lib has to parse
 * the whole document for the light repack, and on a phone that is the kind of
 * pause that reads as a hang. No estimate is shown for these.
 */
const PDF_SAMPLE_LIMIT_BYTES = 60 * 1024 * 1024

export async function estimateKind(
  kind: FileKind,
  items: EstimateItem[],
  settings: LevelSettings,
): Promise<number | null> {
  if (items.length === 0) return null
  switch (kind) {
    case 'video':
      return estimateVideo(items, settings.video)
    case 'audio':
      return estimateAudio(items, settings.audio)
    case 'image':
      return estimateImage(items, settings.image)
    case 'pdf':
      return estimatePdf(items, settings.pdf)
  }
}

/**
 * Never promise a file will grow.
 *
 * `compressAll` hands back the ORIGINAL whenever the compressed output came out
 * bigger — an already-optimised JPEG does this routinely. The estimate has to
 * model that same decision, or the panel predicts 4 MB for a 2 MB photo that the
 * run will then, correctly, leave at 2 MB.
 */
function capped(estimated: number, source: number): number {
  return Math.min(estimated, source)
}

function estimateVideo(items: EstimateItem[], settings: VideoCompressSettings): number | null {
  let total = 0
  for (const item of items) {
    if (item.meta?.kind !== 'video') return null
    // The same translation `compressVideo` performs, so the estimate prices the
    // job that will actually run — including trim being off, which this app
    // never turns on.
    const { bytes } = estimateOutput(item.meta.probe, {
      format: 'mp4',
      maxHeight: settings.maxHeight,
      quality: settings.quality,
      keepAudio: settings.keepAudio,
      audioBitrateKbps: settings.audioBitrateKbps,
      trim: { enabled: false, startSec: 0, endSec: null },
    })
    total += capped(bytes, item.file.size)
  }
  return total
}

function estimateAudio(items: EstimateItem[], settings: AudioSettings): number | null {
  let total = 0
  for (const item of items) {
    if (item.meta?.kind !== 'audio') return null
    // Constant bitrate: the encoder writes `bitrate / 8` bytes for every second,
    // and mixing to mono changes the sound, not the size. The few KB on top are
    // the container's fixed boxes.
    const bytes = Math.round(((settings.bitrateKbps * 1000) / 8) * item.meta.seconds) + 4096
    total += capped(bytes, item.file.size)
  }
  return total
}

/**
 * Encode one image for real, then scale the rest off it.
 *
 * The sample is the LARGEST source in the queue, and that choice is the whole
 * accuracy argument: the biggest file dominates the total, so measuring it
 * exactly leaves the approximation only on the files that move the answer least.
 * Content still varies — a flat screenshot and a photograph do not cost the same
 * per pixel — which is why the number is shown as "≈".
 */
async function estimateImage(items: EstimateItem[], settings: ImageSettings): Promise<number | null> {
  const usable = items.filter((i) => i.meta?.kind === 'image')
  if (usable.length !== items.length) return null

  const sample = usable.reduce((a, b) => (b.file.size > a.file.size ? b : a))
  const sampleMeta = sample.meta as Extract<ProbeMeta, { kind: 'image' }>

  let sampleBytes: number
  try {
    sampleBytes = (await compressImage(sample.file, settings)).blob.size
  } catch {
    return null
  }

  const out = targetSize(sampleMeta.width, sampleMeta.height, settings.maxEdge)
  const perPixel = sampleBytes / Math.max(1, out.width * out.height)

  let total = 0
  for (const item of usable) {
    const meta = item.meta as Extract<ProbeMeta, { kind: 'image' }>
    if (item === sample) {
      total += capped(sampleBytes, item.file.size)
      continue
    }
    const size = targetSize(meta.width, meta.height, settings.maxEdge)
    total += capped(Math.round(perPixel * size.width * size.height), item.file.size)
  }
  return total
}

/**
 * Sample the largest PDF and apply what it says to the rest.
 *
 * The two modes extrapolate differently because they scale with different
 * things. A lossless repack's saving is a property of how the producer wrote the
 * file, so it carries across as a RATIO. A rasterised page's size is a property
 * of the level's DPI and JPEG quality, so it carries across PER PAGE.
 */
async function estimatePdf(items: EstimateItem[], settings: PdfSettings): Promise<number | null> {
  const usable = items.filter((i) => i.meta?.kind === 'pdf')
  if (usable.length !== items.length) return null

  const sample = usable.reduce((a, b) => (b.file.size > a.file.size ? b : a))
  if (sample.file.size > PDF_SAMPLE_LIMIT_BYTES) return null

  const { samplePdfBytes } = await import('./compress/pdf')
  const sampleBytes = await samplePdfBytes(sample.file, settings.level)
  if (sampleBytes === null) return null

  const sampleMeta = sample.meta as Extract<ProbeMeta, { kind: 'pdf' }>

  if (settings.level === 'light') {
    const ratio = sampleBytes / Math.max(1, sample.file.size)
    let total = 0
    for (const item of usable) {
      total += item === sample
        ? capped(sampleBytes, item.file.size)
        : capped(Math.round(item.file.size * ratio), item.file.size)
    }
    return total
  }

  const perPage = sampleBytes / Math.max(1, sampleMeta.pages)
  let total = 0
  for (const item of usable) {
    const meta = item.meta as Extract<ProbeMeta, { kind: 'pdf' }>
    total += item === sample
      ? capped(sampleBytes, item.file.size)
      : capped(Math.round(perPage * meta.pages), item.file.size)
  }
  return total
}
