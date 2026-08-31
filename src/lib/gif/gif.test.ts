import { describe, expect, it } from 'vitest'
import { decodeGif, isGif, readGifInfo } from './decode'
import {
  ALPHA_THRESHOLD,
  ColourCube,
  GifWriter,
  MAX_COLOURS,
  PaletteMap,
  TRANSPARENT_INDEX,
  lzwEncode,
  quantiseFrame,
} from './encode'

/**
 * These are the regression net, not the proof.
 *
 * The proof that this codec is right is `scripts/gif-selftest.mjs`, which
 * decodes real GIFs written by other tools and compares every pixel to ffmpeg's
 * answer. That needs ffmpeg on PATH, so it cannot be the thing CI runs on every
 * commit. What is here is what survives without it: the behaviours that would
 * be quietly reverted by someone tidying, each with the failure it prevents.
 */

/** A GIF's bytes, from frames of RGBA. */
function write(
  frames: Uint8ClampedArray[],
  width: number,
  height: number,
  options: { mode?: 'diff' | 'full'; loop?: boolean | number; delayCs?: number } = {},
): Uint8Array {
  const cube = new ColourCube()
  for (const frame of frames) cube.addFrame(frame)
  const colours = cube.palette(MAX_COLOURS)
  const map = new PaletteMap(colours)

  const writer = new GifWriter(width, height, colours, options.loop ?? 0, options.mode ?? 'diff')
  for (const frame of frames) {
    writer.addFrame(quantiseFrame(frame, width, height, map), options.delayCs ?? 10)
  }
  const chunks = writer.finish()
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

/**
 * A GIF assembled byte by byte.
 *
 * Needed because our own writer cannot produce the two things worth testing
 * here: it never interlaces, and it floors every delay at 2. A fixture built
 * with the writer would quietly assert that the reader agrees with the writer,
 * which is the one thing a codec test must not do. The palette's red channel
 * encodes the index, so a pixel says where it came from.
 */
function handBuilt(
  width: number,
  height: number,
  indices: Uint8Array,
  options: { interlaced?: boolean; delayCs?: number } = {},
): Uint8Array {
  const palette = new Uint8Array(768)
  for (let i = 0; i < 256; i++) palette[i * 3] = i

  const head = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, width, 0, height, 0, 0xf7, 0, 0]
  const gce =
    options.delayCs === undefined
      ? []
      : [0x21, 0xf9, 0x04, 0x00, options.delayCs & 0xff, (options.delayCs >> 8) & 0xff, 0x00, 0x00]
  const descriptor = [
    0x2c, 0, 0, 0, 0, width, 0, height, 0,
    options.interlaced ? 0x40 : 0x00,
    8,
  ]
  const data = lzwEncode(indices, 8)

  const parts = [head, palette, gce, descriptor, data, [0x3b]]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

function solid(width: number, height: number, r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = r
    rgba[p * 4 + 1] = g
    rgba[p * 4 + 2] = b
    rgba[p * 4 + 3] = a
  }
  return rgba
}

function frames(bytes: Uint8Array) {
  const out: { rgba: Uint8ClampedArray; delayCs: number }[] = []
  decodeGif(bytes, (f) => out.push({ rgba: f.rgba.slice(), delayCs: f.delayCs }))
  return out
}

describe('reading a GIF', () => {
  it('counts frames without decoding any of them', () => {
    // `readGifInfo` runs on every dropped file, for the row caption and the
    // size estimate. If it ever starts decompressing pixels, dropping a folder
    // of GIFs stops being instant.
    const bytes = write([solid(4, 4, 200, 0, 0), solid(4, 4, 0, 200, 0), solid(4, 4, 0, 0, 200)], 4, 4)
    expect(readGifInfo(bytes)).toEqual({ width: 4, height: 4, frames: 3, loop: 0 })
  })

  it('knows a GIF by its bytes, not its name', () => {
    expect(isGif(write([solid(2, 2, 1, 2, 3)], 2, 2))).toBe(true)
    expect(isGif(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false)
  })

  it('returns null rather than throwing on something that is not a GIF', () => {
    // The probe runs on files the user chose, which includes the wrong ones.
    expect(readGifInfo(new Uint8Array([1, 2, 3]))).toBeNull()
  })

  it('reads a delay of 0 as the 10 hundredths every browser actually plays', () => {
    // ⚠️ The bug this prevents is subtle and unrecoverable: read 0 as 0, write
    // it as the 2 the encoder floors at, and a ten-second animation comes back
    // playing in two. Vast numbers of real GIFs are written with delay 0.
    expect(frames(handBuilt(2, 1, new Uint8Array([1, 2]), { delayCs: 0 }))[0].delayCs).toBe(10)
    expect(frames(handBuilt(2, 1, new Uint8Array([1, 2]), { delayCs: 1 }))[0].delayCs).toBe(10)
    // 2 and above mean what they say.
    expect(frames(handBuilt(2, 1, new Uint8Array([1, 2]), { delayCs: 2 }))[0].delayCs).toBe(2)
    expect(frames(handBuilt(2, 1, new Uint8Array([1, 2]), { delayCs: 33 }))[0].delayCs).toBe(33)
  })

  it('de-interlaces a frame stored in the four passes', () => {
    // Rows are stored every 8th from 0, every 8th from 4, every 4th from 2,
    // then every 2nd from 1. Reading them in storage order is the classic
    // "venetian blind" corruption — and nothing else in this suite writes an
    // interlaced GIF, so this is the only place the path is exercised at all.
    //
    // ⚠️ Heights that are not multiples of 8 are the ones that matter. Each
    // pass counts its rows from its OWN starting row, so at height 8 several
    // wrong formulas still add up to 8 and only the ordering betrays them; at
    // height 11 or 5 they produce different totals as well.
    for (const height of [8, 11, 5, 1, 2]) {
      const order: number[] = []
      for (let row = 0; row < height; row += 8) order.push(row)
      for (let row = 4; row < height; row += 8) order.push(row)
      for (let row = 2; row < height; row += 4) order.push(row)
      for (let row = 1; row < height; row += 2) order.push(row)
      expect(order).toHaveLength(height)

      // Storage row `at` holds the number of the row it belongs on.
      const indices = new Uint8Array(order)
      const decoded = frames(handBuilt(1, height, indices, { interlaced: true }))[0]

      for (let row = 0; row < height; row++) {
        expect(decoded.rgba[row * 4]).toBe(row)
      }
    }
  })
})

describe('writing a GIF', () => {
  it('round-trips pixels through both halves unchanged', () => {
    const source = [solid(6, 3, 240, 20, 20), solid(6, 3, 20, 240, 20), solid(6, 3, 20, 20, 240)]
    const decoded = frames(write(source, 6, 3))
    expect(decoded).toHaveLength(3)
    for (let i = 0; i < source.length; i++) {
      // Three flat colours fit a 255-entry palette exactly, so this is equality
      // rather than a tolerance.
      expect([...decoded[i].rgba]).toEqual([...source[i]])
    }
  })

  it('keeps a loop count of 0 meaning FOREVER, not falsy', () => {
    // ⚠️ `if (loop)` here would silently turn every looping GIF in the world
    // into one that plays once — 0 is both the commonest value and the falsy one.
    expect(readGifInfo(write([solid(2, 2, 1, 1, 1)], 2, 2, { loop: 0 }))?.loop).toBe(0)
    expect(readGifInfo(write([solid(2, 2, 1, 1, 1)], 2, 2, { loop: 5 }))?.loop).toBe(5)
    expect(readGifInfo(write([solid(2, 2, 1, 1, 1)], 2, 2, { loop: false }))?.loop).toBeNull()
  })
})

describe('transparency', () => {
  it('spends no palette entry on colours nobody can see', () => {
    // A sticker on a transparent ground carries an RGB behind the alpha —
    // usually black. Counting it lets it push real colours out of a 255-entry
    // palette to make room for something that is never drawn.
    const rgba = new Uint8ClampedArray(4 * 4)
    rgba.set([255, 0, 0, 255], 0)
    rgba.set([0, 0, 0, 0], 4) // transparent black
    rgba.set([0, 0, 0, 0], 8)
    rgba.set([0, 0, 0, 0], 12)

    const cube = new ColourCube()
    cube.addFrame(rgba)
    const palette = cube.palette(MAX_COLOURS)
    expect(palette.length / 3).toBe(1)
    expect([...palette]).toEqual([255, 0, 0])
  })

  it('quantises a transparent pixel to the reserved index, not to a colour', () => {
    const map = new PaletteMap(new Uint8Array([255, 255, 255]))
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, ALPHA_THRESHOLD - 1])
    expect([...quantiseFrame(rgba, 2, 1, map)]).toEqual([0, TRANSPARENT_INDEX])
  })

  it('declares transparency on the FIRST frame too', () => {
    // It used to be hard-coded off, which was right when the only transparency
    // in a file was the differencing kind — the first frame has nothing to
    // difference against. A source GIF's own transparency reaches it as well,
    // and without the flag it draws as palette entry 255.
    const rgba = new Uint8ClampedArray(2 * 1 * 4)
    rgba.set([10, 20, 30, 255], 0)
    rgba.set([0, 0, 0, 0], 4)
    const [frame] = frames(write([rgba], 2, 1))
    expect(frame.rgba[3]).toBe(255)
    expect(frame.rgba[7]).toBe(0)
  })

  it('erases with "full" mode where differencing cannot', () => {
    // ⚠️ The single most common way a hand-rolled GIF re-encoder is broken.
    // Disposal 1 can add a pixel but never take one away, so a shape moving
    // across a transparent ground smears across the frame. It looks perfect on
    // every opaque test file, which is why this fixture is not opaque.
    const width = 4
    const height = 1
    const at = (x: number) => {
      const rgba = new Uint8ClampedArray(width * height * 4)
      rgba.set([200, 40, 160, 255], x * 4)
      return rgba
    }
    const source = [at(0), at(1), at(2), at(3)]

    const last = frames(write(source, width, height, { mode: 'full' })).at(-1)!
    const opaque = [...last.rgba].filter((_, i) => i % 4 === 3).filter((a) => a >= ALPHA_THRESHOLD)
    expect(opaque).toHaveLength(1)

    // And the proof that the mode is load-bearing rather than decorative:
    // the same frames differenced leave a trail of all four.
    const smeared = frames(write(source, width, height, { mode: 'diff' })).at(-1)!
    const stuck = [...smeared.rgba].filter((_, i) => i % 4 === 3).filter((a) => a >= ALPHA_THRESHOLD)
    expect(stuck).toHaveLength(4)
  })
})
