import type { ImageSettings } from '../types'

// Its own leaf module so the GIF worker can import it without dragging in
// image.ts — whose dynamic `heic-to` import an IIFE worker bundle would have
// to inline, all 3 MB of it.

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
