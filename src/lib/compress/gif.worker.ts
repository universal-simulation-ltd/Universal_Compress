/// <reference lib="webworker" />
import { readGifInfo } from '../gif/decode'
import { encodeAnimatedGif } from './gifCore'
import type { ImageSettings } from '../types'
import type { GifWorkerReply } from './gif'

// The animated-GIF re-encode, off the main thread. Both passes are tight
// synchronous loops over every pixel of every frame — seconds, on a long
// screen recording — and on the main thread the progress bar could not move
// and the tab looked hung. Here the page stays live and the bar is real.

declare const self: DedicatedWorkerGlobalScope

function reply(message: GifWorkerReply, transfer: Transferable[] = []) {
  self.postMessage(message, transfer)
}

self.onmessage = async (event: MessageEvent<{ bytes: Uint8Array; settings: ImageSettings }>) => {
  const { bytes, settings } = event.data
  try {
    const info = readGifInfo(bytes)
    if (!info || info.frames < 2) throw new Error('This GIF has no animation to compress')
    // Progress at most every 50 ms: a 1,000-frame GIF would otherwise post
    // two thousand messages for a bar that is a few hundred pixels wide.
    let last = 0
    const parts = await encodeAnimatedGif(bytes, info, settings, (fraction) => {
      const now = performance.now()
      if (fraction < 1 && now - last < 50) return
      last = now
      reply({ type: 'progress', fraction })
    })
    // Chunks can be views onto one buffer, and a buffer listed twice makes
    // postMessage throw — so each distinct buffer once.
    reply({ type: 'done', parts }, [...new Set(parts.map((p) => p.buffer as ArrayBuffer))])
  } catch (err) {
    reply({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
