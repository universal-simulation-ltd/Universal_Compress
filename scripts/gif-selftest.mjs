// GIF codec self-test.
//
// The reader and the writer in src/lib/gif/ are checked against ffmpeg, which
// is a GIF implementation that is not ours. "Our reader agrees with our writer"
// proves nothing — a decoder and an encoder that share a misunderstanding of
// the LZW code-width rule round-trip perfectly and produce files that no other
// program can open.
//
// Run: node scripts/gif-selftest.mjs
//
// Needs ffmpeg on PATH. Both leaf modules are imported as .ts directly, which
// Node does by stripping the types — the reason neither file may import
// anything, use a parameter property, or touch the DOM.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { decodeGif, readGifInfo, isGif } from '../src/lib/gif/decode.ts'
import { ColourCube, GifWriter, PaletteMap, quantiseFrame, ALPHA_THRESHOLD } from '../src/lib/gif/encode.ts'

const dir = mkdtempSync(join(tmpdir(), 'gif-selftest-'))
let failures = 0

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 1 << 30 })
}

/** Every frame ffmpeg sees in `file`, as raw RGBA — the reference to compare against. */
function ffmpegFrames(file, width, height) {
  const raw = join(dir, 'ref.raw')
  ffmpeg(['-i', file, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgba', raw])
  const bytes = readFileSync(raw)
  const stride = width * height * 4
  assert.equal(bytes.length % stride, 0, 'ffmpeg returned a partial frame')
  const frames = []
  for (let at = 0; at < bytes.length; at += stride) frames.push(bytes.subarray(at, at + stride))
  return frames
}

function ffprobeSize(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,nb_frames',
    '-of', 'csv=p=0', file,
  ]).toString().trim().split(',')
  return { width: Number(out[0]), height: Number(out[1]), frames: Number(out[2]) }
}

function check(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (e) {
    failures++
    console.error(`✗ ${name}\n    ${e.message.split('\n')[0]}`)
  }
}

/**
 * How far apart two RGBA buffers are.
 *
 * Transparent pixels are compared on their ALPHA ONLY: a pixel nobody can see
 * has an RGB, and ffmpeg's is not obliged to be the same as ours. Comparing it
 * fails a decoder that is completely correct.
 */
function difference(a, b) {
  let worst = 0
  let differing = 0
  for (let p = 0; p < a.length; p += 4) {
    if (a[p + 3] < ALPHA_THRESHOLD || b[p + 3] < ALPHA_THRESHOLD) {
      if ((a[p + 3] < ALPHA_THRESHOLD) !== (b[p + 3] < ALPHA_THRESHOLD)) {
        differing++
        worst = 255
      }
      continue
    }
    const d = Math.max(
      Math.abs(a[p] - b[p]),
      Math.abs(a[p + 1] - b[p + 1]),
      Math.abs(a[p + 2] - b[p + 2]),
    )
    if (d > 0) differing++
    if (d > worst) worst = d
  }
  return { worst, differing, pixels: a.length / 4 }
}

// ── 1. The reader, against ffmpeg ────────────────────────────────────────────
//
// Pixel for pixel, on every frame. This is the test that matters: compositing,
// disposal methods, local colour tables, transparency and the LZW decoder are
// all exercised at once, and any one of them being wrong shows up here as a
// difference no tolerance would forgive.

function readerMatchesFfmpeg(label, file) {
  check(`reader — ${label}`, () => {
    const bytes = new Uint8Array(readFileSync(file))
    assert.ok(isGif(bytes), 'recognised as a GIF')

    const info = readGifInfo(bytes)
    assert.ok(info, 'the header scan read it')

    const probe = ffprobeSize(file)
    assert.equal(info.width, probe.width, 'width agrees with ffprobe')
    assert.equal(info.height, probe.height, 'height agrees with ffprobe')
    assert.equal(info.frames, probe.frames, 'frame count agrees with ffprobe')

    const reference = ffmpegFrames(file, info.width, info.height)
    assert.equal(reference.length, info.frames, 'ffmpeg decoded the same number of frames')

    let index = 0
    decodeGif(bytes, (frame) => {
      const { worst, differing, pixels } = difference(frame.rgba, reference[index])
      assert.equal(
        worst,
        0,
        `frame ${index}: ${differing}/${pixels} pixels differ from ffmpeg, worst by ${worst}`,
      )
      index++
    })
    assert.equal(index, info.frames, 'every frame was handed to the callback')
  })
}

// ── 2. The writer, read back by ffmpeg ───────────────────────────────────────
//
// Encode a known animation, then make ffmpeg decode it and compare. The
// tolerance is the palette's, not the coder's: 255 colours cannot reproduce
// arbitrary RGB, so what is asserted is that every pixel is within reach of the
// palette we chose — and, crucially, that the frame COUNT, SIZE and DELAYS
// survive, which is where a broken differencing implementation shows itself.

function writerReadBackByFfmpeg(label, frames, width, height, mode) {
  check(`writer — ${label}`, () => {
    const cube = new ColourCube()
    for (const f of frames) cube.addFrame(f)
    const colours = cube.palette(255)
    const map = new PaletteMap(colours)

    const writer = new GifWriter(width, height, colours, 0, mode)
    for (const f of frames) writer.addFrame(quantiseFrame(f, width, height, map), 10)
    const gif = Buffer.concat(writer.finish().map(Buffer.from))

    const file = join(dir, `written-${label.replace(/\W+/g, '-')}.gif`)
    writeFileSync(file, gif)

    const probe = ffprobeSize(file)
    assert.equal(probe.width, width, 'ffprobe reads back the width')
    assert.equal(probe.height, height, 'ffprobe reads back the height')
    assert.equal(probe.frames, frames.length, 'ffprobe reads back every frame')

    const decoded = ffmpegFrames(file, width, height)
    for (let i = 0; i < frames.length; i++) {
      // What we ASKED for: the source frame put through our own palette. The
      // encoder is not responsible for the palette being lossy, only for
      // delivering the indices it was handed.
      const wanted = quantiseFrame(frames[i], width, height, map)
      const expected = new Uint8ClampedArray(width * height * 4)
      for (let p = 0; p < wanted.length; p++) {
        const index = wanted[p]
        if (index === 255) continue // transparent — alpha stays 0
        expected[p * 4] = colours[index * 3]
        expected[p * 4 + 1] = colours[index * 3 + 1]
        expected[p * 4 + 2] = colours[index * 3 + 2]
        expected[p * 4 + 3] = 255
      }
      const { worst, differing, pixels } = difference(expected, decoded[i])
      assert.equal(
        worst,
        0,
        `frame ${i}: ffmpeg read back ${differing}/${pixels} pixels differently, worst by ${worst}`,
      )
    }
  })
}

// ── 3. Round trip through both halves ────────────────────────────────────────
//
// Our writer's output, read by our reader. On its own this proves nothing (see
// the note at the top), but AFTER ffmpeg has agreed with each half separately
// it is the cheap check that catches a regression in either.

function roundTrip(label, frames, width, height, mode) {
  check(`round trip — ${label}`, () => {
    const cube = new ColourCube()
    for (const f of frames) cube.addFrame(f)
    const colours = cube.palette(255)
    const map = new PaletteMap(colours)

    const writer = new GifWriter(width, height, colours, 0, mode)
    const indices = frames.map((f) => quantiseFrame(f, width, height, map))
    for (const i of indices) writer.addFrame(i, 7)
    const gif = new Uint8Array(Buffer.concat(writer.finish().map(Buffer.from)))

    const info = readGifInfo(gif)
    assert.equal(info.frames, frames.length, 'the frame count survives')
    assert.equal(info.loop, 0, 'the loop-forever flag survives')

    let index = 0
    decodeGif(gif, (frame) => {
      assert.equal(frame.delayCs, 7, `frame ${index} kept its delay`)
      const wanted = indices[index]
      for (let p = 0; p < wanted.length; p++) {
        const transparent = wanted[p] === 255
        const alpha = frame.rgba[p * 4 + 3]
        if (transparent) {
          assert.ok(alpha < ALPHA_THRESHOLD, `frame ${index} pixel ${p} should be transparent`)
          continue
        }
        assert.ok(alpha >= ALPHA_THRESHOLD, `frame ${index} pixel ${p} should be opaque`)
        assert.equal(frame.rgba[p * 4], colours[wanted[p] * 3], `frame ${index} pixel ${p} red`)
        assert.equal(frame.rgba[p * 4 + 1], colours[wanted[p] * 3 + 1], `frame ${index} pixel ${p} green`)
        assert.equal(frame.rgba[p * 4 + 2], colours[wanted[p] * 3 + 2], `frame ${index} pixel ${p} blue`)
      }
      index++
    })
    assert.equal(index, frames.length, 'every frame came back')
  })
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** A moving opaque square — the ordinary case, and the one differencing loves. */
function movingSquare(width, height, count) {
  const frames = []
  for (let i = 0; i < count; i++) {
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let p = 0; p < width * height; p++) {
      rgba[p * 4] = 20
      rgba[p * 4 + 1] = 30 + ((p % width) % 200)
      rgba[p * 4 + 2] = 90
      rgba[p * 4 + 3] = 255
    }
    const left = i * 3
    for (let y = 5; y < 20; y++) {
      for (let x = left; x < left + 15 && x < width; x++) {
        const p = (y * width + x) * 4
        rgba[p] = 240
        rgba[p + 1] = 120
        rgba[p + 2] = 10
        rgba[p + 3] = 255
      }
    }
    frames.push(rgba)
  }
  return frames
}

/**
 * A square that MOVES ACROSS A TRANSPARENT GROUND — the case differencing
 * cannot express, because the square's old position has to be erased and
 * disposal method 1 can only add. This is the fixture that fails if 'full' mode
 * is wrong, and it is the failure that would ship as a smear trailing behind
 * every animated sticker.
 */
function movingSquareOnTransparent(width, height, count) {
  const frames = []
  for (let i = 0; i < count; i++) {
    const rgba = new Uint8ClampedArray(width * height * 4) // all zero = transparent
    const left = i * 4
    for (let y = 4; y < 18; y++) {
      for (let x = left; x < left + 12 && x < width; x++) {
        const p = (y * width + x) * 4
        rgba[p] = 200
        rgba[p + 1] = 40
        rgba[p + 2] = 160
        rgba[p + 3] = 255
      }
    }
    frames.push(rgba)
  }
  return frames
}

// ── Run ──────────────────────────────────────────────────────────────────────

try {
  // Real GIFs, written by tools that are not ours, before anything synthetic.
  const real = [
    ['tesseract demo.gif (screen recording)', new URL('../../Universal_PDF/node_modules/tesseract.js/docs/images/demo.gif', import.meta.url).pathname],
    ['tesseract video-demo.gif (screen recording)', new URL('../../Universal_PDF/node_modules/tesseract.js/docs/images/video-demo.gif', import.meta.url).pathname],
  ]
  for (const [label, file] of real) {
    if (existsSync(file)) readerMatchesFfmpeg(label, file)
    else console.warn(`! skipped ${label} — not on this machine`)
  }

  // ffmpeg's own encoder, which uses local colour tables and its own
  // differencing — a shape our writer never produces, so only the reader is
  // being tested here and that is the point.
  const generated = join(dir, 'ffmpeg.gif')
  ffmpeg([
    '-f', 'lavfi', '-i', 'testsrc=size=160x120:rate=10:duration=2',
    '-vf', 'split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse',
    generated,
  ])
  readerMatchesFfmpeg('ffmpeg testsrc (local palettes, its own differencing)', generated)

  const opaque = movingSquare(120, 60, 12)
  writerReadBackByFfmpeg('moving square, differenced', opaque, 120, 60, 'diff')
  roundTrip('moving square, differenced', opaque, 120, 60, 'diff')

  const erasing = movingSquareOnTransparent(120, 60, 10)
  writerReadBackByFfmpeg('square on transparent ground, full frames', erasing, 120, 60, 'full')
  roundTrip('square on transparent ground, full frames', erasing, 120, 60, 'full')

  // ⚠️ The same fixture in 'diff' mode SHOULD be wrong — the square smears.
  // Asserting that it is proves the two modes are not interchangeable and that
  // choosing between them in compress/gif.ts is load-bearing rather than
  // decorative.
  check('differencing genuinely cannot erase (the reason "full" mode exists)', () => {
    const cube = new ColourCube()
    for (const f of erasing) cube.addFrame(f)
    const colours = cube.palette(255)
    const map = new PaletteMap(colours)
    const writer = new GifWriter(120, 60, colours, 0, 'diff')
    for (const f of erasing) writer.addFrame(quantiseFrame(f, 120, 60, map), 10)
    const gif = new Uint8Array(Buffer.concat(writer.finish().map(Buffer.from)))

    let last = null
    decodeGif(gif, (frame) => { last = frame.rgba.slice() })
    let opaquePixels = 0
    for (let p = 3; p < last.length; p += 4) if (last[p] >= ALPHA_THRESHOLD) opaquePixels++
    // One 12x14 square is 168 px. A smear of ten of them is far more.
    assert.ok(opaquePixels > 168 * 3, `expected a smear, got ${opaquePixels} opaque pixels`)
  })
} finally {
  rmSync(dir, { recursive: true, force: true })
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll GIF codec checks passed.')
