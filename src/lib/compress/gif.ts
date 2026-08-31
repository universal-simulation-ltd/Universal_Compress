import { outputName } from '../layout'
import { ColourCube, GifWriter, PaletteMap, quantiseFrame, ALPHA_THRESHOLD, MAX_COLOURS } from '../gif/encode'
import { decodeGif, readGifInfo, type GifInfo } from '../gif/decode'
import { targetSize } from './image'
import type { CompressedFile, ImageSettings, Level } from '../types'

/**
 * Compressing an animated GIF — the one image on this app's list the browser
 * can neither read past frame one nor write at all.
 *
 * ⚠️ **This exists because the canvas path silently destroyed animations.**
 * `compressImage` decodes with `createImageBitmap`, which returns frame one of
 * an animated GIF and gives no indication it did — so a 4.2 MB animation came
 * out as a 2 KB still WebP and the app reported "−100%", the largest saving on
 * the screen, for having thrown the file away. Anything routed here must never
 * go back through that path.
 *
 * The savings come from four places, in roughly this order of size:
 *
 *   • **Frame differencing.** Most large GIFs in the wild are written as whole
 *     frames — every exporter that values speed does this — so sending only the
 *     rectangle that changed, with the pixels inside it that didn't marked
 *     transparent, is the single biggest win available. `GifWriter` does it.
 *   • **One global palette** instead of a 768-byte local table per frame, and a
 *     palette narrowed from 256 colours to what the quality slider asks for.
 *   • **Downscaling**, when the longest edge is over the limit.
 *   • **Dropping frames**, at Maximum only, where it is a visible trade.
 */

/** One surviving frame: which source frame it is, and how long it is then held. */
interface KeptFrame {
  index: number
  delayCs: number
}

/**
 * Is this file an animated GIF, and how many frames has it?
 *
 * `null` for anything that is not a GIF, and `1` for a still one — a still GIF
 * has no animation to protect and goes through the ordinary canvas path, where
 * it becomes a much smaller WebP.
 */
export async function probeGif(file: File): Promise<GifInfo | null> {
  try {
    return readGifInfo(new Uint8Array(await file.arrayBuffer()))
  } catch {
    return null
  }
}

/**
 * Compress `file` if it is an animated GIF; return `null` if it isn't one.
 *
 * The null is the whole interface. `compressImage` has to know the answer
 * before it decides anything, and the answer costs a read of the file — so
 * asking and doing are one call rather than two, and a still GIF falls through
 * to the ordinary canvas path where it becomes a far smaller WebP.
 */
export async function compressIfAnimatedGif(
  file: File,
  settings: ImageSettings,
  onProgress: (fraction: number) => void = () => {},
): Promise<CompressedFile | null> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const info = readGifInfo(bytes)
  if (!info || info.frames < 2) return null

  const { width, height } = targetSize(info.width, info.height, settings.maxEdge)
  // Which frames survive is decided by the level and the frame count alone, so
  // it is known before a pixel is read — but how long each surviving frame is
  // then HELD depends on the delays of the ones dropped around it, and those
  // only arrive with the frames themselves. Pass one collects them.
  const kept = keptIndices(info.frames, settings.level)
  const keep: KeptFrame[] = []

  // ── Pass one: the palette, and how the frames relate to one another ────────
  //
  // Two passes over the file rather than one, and the reason is memory, not
  // tidiness: the palette is chosen from the WHOLE animation (see `ColourCube`
  // — a per-frame palette makes the picture shimmer and costs 768 bytes a
  // frame), so nothing can be written until every frame has been seen. Holding
  // them instead of re-reading them would be 44 MB of live pixels for the file
  // in the bug report and near a gigabyte for a long one. Decoding is cheap;
  // keeping is not.
  //
  // ⚠️ The histogram is built from the frames at their ORIGINAL size, before
  // any downscale. Scaling blends new intermediate colours into the edges that
  // the histogram then hasn't seen — but they land in the same 5-5-5 bins as
  // the colours they were blended from, so median cut still spends the palette
  // in the right places, and `PaletteMap` finds each blend its nearest entry.
  // Scaling in both passes to avoid that would double the canvas work for a
  // difference no one can see.
  const cube = new ColourCube()
  let previousAlpha: Uint8Array | null = null
  let erases = false
  let transparent = false

  decodeGif(bytes, (frame) => {
    if (!kept.has(frame.index)) {
      // ⚠️ A dropped frame's time is added to the frame BEFORE it. Without
      // this the animation keeps its per-frame timings and loses half its
      // length, so a ten-second clip plays in five — the one change here a
      // user would notice at once and could not undo.
      if (keep.length > 0) keep[keep.length - 1].delayCs += frame.delayCs
      return
    }
    keep.push({ index: frame.index, delayCs: frame.delayCs })
    cube.addFrame(frame.rgba)

    // Does anything ever get RUBBED OUT? A pixel that was opaque and becomes
    // transparent cannot be expressed by differencing, which can only add — see
    // the two-modes note on `GifWriter`. One such pixel anywhere in the file
    // decides how all of it is written, so this is asked here, once, rather
    // than guessed at.
    const alpha = new Uint8Array(frame.rgba.length / 4)
    for (let i = 0, p = 3; i < alpha.length; i++, p += 4) {
      const on = frame.rgba[p] >= ALPHA_THRESHOLD ? 1 : 0
      alpha[i] = on
      if (!on) transparent = true
      if (!erases && previousAlpha && previousAlpha[i] === 1 && on === 0) erases = true
    }
    previousAlpha = alpha

    onProgress(0.45 * ((frame.index + 1) / info.frames))
  })

  // ⚠️ The one repaint in the whole job. Both passes are synchronous — the
  // decoder hands frames to a plain callback, which is what lets it be a leaf
  // module the self-test can drive in Node — so the progress bar cannot move
  // while either is running, and the tab looks hung rather than busy. Yielding
  // here at least gets "45%" onto the screen before the second pass starts.
  // Measured at roughly 20 ms per megapixel of source frames, so a 300-frame
  // 800x220 GIF is about 0.8 s and the pause is not worth a Worker.
  await new Promise((resolve) => setTimeout(resolve, 0))

  const colours = cube.palette(paletteSize(settings.quality))
  const map = new PaletteMap(colours)

  // A source with no transparency at all can always be differenced; one that
  // only ever ADDS transparent area can too. Only rubbing out forces whole
  // frames.
  const mode = transparent && erases ? 'full' : 'diff'

  // ── Pass two: quantise and write ──────────────────────────────────────────
  const writer = new GifWriter(width, height, colours, info.loop ?? false, mode)
  const scale =
    width === info.width && height === info.height
      ? null
      : makeScaler(info.width, info.height, width, height)
  const delays = new Map(keep.map((f) => [f.index, f.delayCs]))
  let done = 0

  decodeGif(bytes, (frame) => {
    const delayCs = delays.get(frame.index)
    if (delayCs === undefined) return
    const pixels = scale ? scale(frame.rgba) : frame.rgba
    writer.addFrame(quantiseFrame(pixels, width, height, map), delayCs)
    done++
    onProgress(0.45 + 0.55 * (done / keep.length))
  })

  onProgress(1)
  return {
    blob: new Blob(writer.finish() as BlobPart[], { type: 'image/gif' }),
    name: outputName(file.name, 'gif'),
  }
}

/**
 * How many colours the quality slider is asking for.
 *
 * The slider runs 30–95% and means something different for a GIF than it does
 * for a JPEG: there is no quantiser to loosen, only a palette to narrow. 95%
 * spends the full 255 the format allows; 30% comes down to 76, which is where a
 * photograph starts to band and a screen recording still looks untouched.
 *
 * Floored at 32, because below that the picture stops being the picture, and a
 * palette that small saves very little anyway — LZW is compressing runs of
 * indices, and it is the runs that matter, not how wide each index is.
 */
function paletteSize(quality: number): number {
  return Math.max(32, Math.min(MAX_COLOURS, Math.round(quality * MAX_COLOURS)))
}

/**
 * Which source frames survive.
 *
 * Only Maximum drops any, and only when there are enough left afterwards to
 * still read as motion. Halving the frame rate of a twelve-frame loading
 * spinner does not compress it, it breaks it.
 */
function keptIndices(frames: number, level: Level): Set<number> {
  const thin = level === 'maximum' && frames >= MIN_FRAMES_TO_THIN
  const kept = new Set<number>()
  for (let i = 0; i < frames; i++) if (!thin || i % 2 === 0) kept.add(i)
  return kept
}

/**
 * Below this many frames, thinning is destructive rather than economical — see
 * `keptIndices`. Twelve is two turns of a typical spinner.
 */
const MIN_FRAMES_TO_THIN = 12

/**
 * A reusable full-size → output-size scaler.
 *
 * Two canvases, made once and reused for every frame: `putImageData` ignores
 * transforms, so the pixels have to land on a canvas at their own size before
 * anything can draw them smaller. Making a pair per frame instead is how a
 * 500-frame GIF allocates a thousand canvases and the tab dies.
 *
 * ⚠️ `clearRect` before each `drawImage` is load-bearing. The destination is
 * reused, and a frame with transparent areas composites OVER whatever the last
 * frame left there — so without it the scaled output accumulates every frame of
 * the animation on top of one another.
 */
function makeScaler(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
): (rgba: Uint8ClampedArray) => Uint8ClampedArray {
  const source = document.createElement('canvas')
  source.width = sourceWidth
  source.height = sourceHeight
  const sourceCtx = source.getContext('2d', { willReadFrequently: true })
  const target = document.createElement('canvas')
  target.width = width
  target.height = height
  const targetCtx = target.getContext('2d', { willReadFrequently: true })
  if (!sourceCtx || !targetCtx) throw new Error('This browser wouldn’t give us a canvas to draw on')

  targetCtx.imageSmoothingQuality = 'high'
  const image = sourceCtx.createImageData(sourceWidth, sourceHeight)

  return (rgba) => {
    image.data.set(rgba)
    sourceCtx.putImageData(image, 0, 0)
    targetCtx.clearRect(0, 0, width, height)
    targetCtx.drawImage(source, 0, 0, width, height)
    return targetCtx.getImageData(0, 0, width, height).data
  }
}
