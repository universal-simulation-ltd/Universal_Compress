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
 *     rest are scaled from it by output pixel count. Animated GIFs are sampled
 *     and scaled **separately from stills**, because they are not the same job:
 *     a GIF is a palette and an LZW coder over hundreds of frames, a JPEG is
 *     one pass of a DCT, and pricing either from the other is a number that
 *     would be wrong by a multiple.
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

/**
 * The most decoding work an animated GIF's estimate will do, in source pixels —
 * frames multiplied by frame size. The GIF twin of the limit above.
 *
 * ⚠️ This bounds the ESTIMATE, never the job. Pressing Compress on a huge GIF
 * does the work however long it takes, with a progress bar; predicting its size
 * beforehand means doing that same work, unasked, while somebody watches a
 * spinner. Past this the panel shows nothing.
 *
 * 100 megapixels is about two seconds, measured rather than guessed: 20 ms per
 * megapixel across the two real GIFs in `scripts/gif-selftest.mjs` — a
 * 14-frame 1430x338 screen recording and a 300-frame 800x220 one.
 *
 * ⚠️ It lives HERE, not in `compress/gif.ts` where the cost is incurred, and
 * that is deliberate: this module is in the main bundle, so importing anything
 * from `compress/gif.ts` would pull the reader, the palette builder and the LZW
 * coder in with it and undo the dynamic import in `compress/image.ts` that
 * keeps them away from everyone who never drops a GIF.
 */
const GIF_ESTIMATE_LIMIT_PIXELS = 100_000_000

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
 * The sample is the LARGEST source in its group, and that choice is the whole
 * accuracy argument: the biggest file dominates the total, so measuring it
 * exactly leaves the approximation only on the files that move the answer least.
 * Content still varies — a flat screenshot and a photograph do not cost the same
 * per pixel — which is why the number is shown as "≈".
 *
 * ⚠️ **Animated GIFs are their own group.** One sample for the whole queue was
 * right while every image took the same canvas path; it stopped being right
 * when GIFs got a codec of their own. A 300-frame GIF and a JPEG have no ratio
 * in common, and whichever happened to be the largest file would have set the
 * price for the other.
 */
async function estimateImage(items: EstimateItem[], settings: ImageSettings): Promise<number | null> {
  const usable = items.filter((i) => i.meta?.kind === 'image')
  if (usable.length !== items.length) return null

  const animated = usable.filter((i) => frameCount(i) > 1)
  const stills = usable.filter((i) => frameCount(i) === 1)

  // Sampling a GIF means decoding and re-encoding every frame of it — the whole
  // job, done twice, before anyone has pressed anything. Past the budget the
  // panel says nothing at all.
  if (animated.length > 0) {
    const biggest = largest(animated)
    const meta = imageMeta(biggest)
    if (meta.width * meta.height * frameCount(biggest) > GIF_ESTIMATE_LIMIT_PIXELS) return null
  }

  let total = 0
  for (const group of [stills, animated]) {
    if (group.length === 0) continue
    const bytes = await sampleGroup(group, settings)
    if (bytes === null) return null
    total += bytes
  }
  return total
}

/** One real encode, scaled across the group by output frame-pixels. */
async function sampleGroup(group: EstimateItem[], settings: ImageSettings): Promise<number | null> {
  const sample = largest(group)

  let sampleBytes: number
  try {
    sampleBytes = (await compressImage(sample.file, settings)).blob.size
  } catch {
    return null
  }

  // Frames multiplied by output pixels. For a still that is just the pixels, so
  // this is the same arithmetic it always was; for a GIF it is the unit that
  // actually scales, since doubling the frames roughly doubles the file.
  const work = (item: EstimateItem) => {
    const meta = imageMeta(item)
    const out = targetSize(meta.width, meta.height, settings.maxEdge)
    return Math.max(1, out.width * out.height * frameCount(item))
  }
  const perUnit = sampleBytes / work(sample)

  let total = 0
  for (const item of group) {
    total +=
      item === sample
        ? capped(sampleBytes, item.file.size)
        : capped(Math.round(perUnit * work(item)), item.file.size)
  }
  return total
}

function largest(group: EstimateItem[]): EstimateItem {
  return group.reduce((a, b) => (b.file.size > a.file.size ? b : a))
}

function imageMeta(item: EstimateItem): Extract<ProbeMeta, { kind: 'image' }> {
  return item.meta as Extract<ProbeMeta, { kind: 'image' }>
}

/** 1 for anything that isn't an animated GIF — see `ProbeMeta`. */
function frameCount(item: EstimateItem): number {
  return imageMeta(item).frames ?? 1
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
