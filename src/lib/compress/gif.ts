import { outputName } from '../layout'
import { readGifInfo, type GifInfo } from '../gif/decode'
import { encodeAnimatedGif } from './gifCore'
import GifWorker from './gif.worker?worker'
import type { CompressedFile, ImageSettings } from '../types'

// The codec itself lives in ./gifCore (see the long note there). This file
// decides WHERE it runs: in a worker when the browser can give one a canvas,
// so a big animation no longer freezes the tab for seconds, and on the main
// thread otherwise — the path it always took, kept as the fallback.

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

  const parts =
    (await encodeInWorker(bytes, settings, onProgress)) ??
    (await encodeAnimatedGif(bytes, info, settings, onProgress))
  return {
    blob: new Blob(parts as BlobPart[], { type: 'image/gif' }),
    name: outputName(file.name, 'gif'),
  }
}

/** Messages the worker posts back. */
export type GifWorkerReply =
  | { type: 'progress'; fraction: number }
  | { type: 'done'; parts: Uint8Array[] }
  | { type: 'error'; message: string }

/**
 * Whether a worker can do the job here. The scaler needs a 2D OffscreenCanvas
 * inside the worker, which Safari only grew in 16.4; asked once, on the main
 * thread, as a stand-in for the worker's own answer.
 */
let workerUsable: boolean | null = null
function canUseWorker(): boolean {
  if (workerUsable !== null) return workerUsable
  try {
    workerUsable =
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      new OffscreenCanvas(1, 1).getContext('2d') !== null
  } catch {
    workerUsable = false
  }
  return workerUsable
}

/**
 * Runs `encodeAnimatedGif` in a worker. `null` means "couldn't use one" —
 * no support, or the worker script failed to load — and the caller runs the
 * same code on the main thread. A failure INSIDE the encode is a real answer
 * about the file, and rejects exactly as the main-thread path would.
 */
function encodeInWorker(
  bytes: Uint8Array,
  settings: ImageSettings,
  onProgress: (fraction: number) => void,
): Promise<Uint8Array[] | null> {
  if (!canUseWorker()) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new GifWorker()
    } catch {
      resolve(null)
      return
    }
    worker.onmessage = (event: MessageEvent<GifWorkerReply>) => {
      const reply = event.data
      if (reply.type === 'progress') {
        onProgress(reply.fraction)
        return
      }
      worker.terminate()
      if (reply.type === 'done') resolve(reply.parts)
      else reject(new Error(reply.message))
    }
    // The worker catches everything it runs and posts it as 'error', so an
    // error EVENT means the script itself never ran: fall back, don't fail.
    worker.onerror = (event) => {
      event.preventDefault()
      worker.terminate()
      resolve(null)
    }
    // Copied, not transferred: the main thread keeps `bytes` for the fallback.
    worker.postMessage({ bytes, settings })
  })
}
