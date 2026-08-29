import type { MaxHeight, VideoProbe, VideoQuality } from '@unisim/media'
import type { FileKind } from './kinds'

/**
 * One strength control, spoken the same way for every kind of file.
 *
 * This is the design. A PDF, an MP4, a PNG and an MP3 have nothing in common
 * technically — different codecs, different failure modes, different knobs — but
 * the question the user is asking is identical every time: *how hard should I
 * squeeze?* So that question is asked once, in one vocabulary, and each engine
 * translates it into whatever its own controls happen to be (see `presetFor`).
 *
 * Everything below Advanced is the escape hatch for someone who knows exactly
 * which knob they want. Nobody has to open it.
 */
export type Level = 'light' | 'balanced' | 'maximum'

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'maximum', label: 'Maximum' },
]

/** What each level means, per kind, in one line a non-expert can act on. */
export const LEVEL_BLURB: Record<FileKind, Record<Level, string>> = {
  pdf: {
    light: 'Repacks the file losslessly. Text stays selectable and searchable; the saving is modest.',
    balanced: 'Pages become images at print resolution. Big saving on scans and image-heavy files — text stops being selectable.',
    maximum: 'Pages become images at screen resolution. The smallest a PDF gets here, and the most visible loss.',
  },
  video: {
    light: 'Keeps the original frame size and encodes generously. Good when the file is only a little too big.',
    balanced: 'Caps the picture at 1080p and drops the bitrate. The setting for most "too big to email" videos.',
    maximum: 'Caps at 720p with the lowest bitrate. Small enough to message; visibly softer on a big screen.',
  },
  image: {
    light: 'Re-encodes at high quality, original dimensions. Usually invisible.',
    balanced: 'Longest edge capped at 2560 px and quality reduced. Right for anything going on a web page.',
    maximum: 'Longest edge capped at 1600 px, quality low. Right for thumbnails and email attachments.',
  },
  audio: {
    light: '192 kbps — transparent for speech, near-transparent for music.',
    balanced: '128 kbps — the usual choice, and about a third the size of most sources.',
    maximum: '96 kbps and mixed to mono. Fine for voice notes and interviews, thin for music.',
  },
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export interface PdfSettings {
  level: Level
}

export const DEFAULT_PDF_SETTINGS: PdfSettings = { level: 'balanced' }

// ── Video ────────────────────────────────────────────────────────────────────

/**
 * A subset of @unisim/media's `VideoSettings`. Trim is deliberately absent: this
 * app compresses, it doesn't edit. Cutting a clip down is Universal Video's job
 * and it does it properly, with a preview and a timeline; a pair of naked
 * start/end boxes here would be the worse half of that feature.
 */
export interface VideoCompressSettings {
  level: Level
  maxHeight: MaxHeight
  quality: VideoQuality
  keepAudio: boolean
  audioBitrateKbps: number
}

export const DEFAULT_VIDEO_SETTINGS: VideoCompressSettings = {
  level: 'balanced',
  maxHeight: 1080,
  quality: 'balanced',
  keepAudio: true,
  audioBitrateKbps: 128,
}

// ── Image ────────────────────────────────────────────────────────────────────

/** 'keep' re-encodes into whatever the source already was (PNG stays PNG). */
export type ImageFormat = 'keep' | 'jpeg' | 'webp'
export type MaxEdge = 'source' | 3840 | 2560 | 1920 | 1600 | 1280 | 800

export interface ImageSettings {
  level: Level
  format: ImageFormat
  quality: number
  maxEdge: MaxEdge
}

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  level: 'balanced',
  format: 'keep',
  quality: 0.7,
  maxEdge: 2560,
}

// ── Audio ────────────────────────────────────────────────────────────────────

export type AudioFormat = 'mp3' | 'm4a'

export interface AudioSettings {
  level: Level
  format: AudioFormat
  bitrateKbps: number
  mono: boolean
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  level: 'balanced',
  format: 'mp3',
  bitrateKbps: 128,
  mono: false,
}

// ── Level → the knobs, per kind ──────────────────────────────────────────────

/**
 * The translation table. Moving the one strength control writes these values
 * into the Advanced fields — it does not hide them, so whatever the level chose
 * is visible and can be overridden straight afterwards.
 */
export function pdfPreset(level: Level): PdfSettings {
  return { level }
}

export function videoPreset(level: Level): VideoCompressSettings {
  const base = { level, keepAudio: true, audioBitrateKbps: 128 }
  switch (level) {
    case 'light':
      return { ...base, maxHeight: 'source', quality: 'high' }
    case 'balanced':
      return { ...base, maxHeight: 1080, quality: 'balanced' }
    case 'maximum':
      return { ...base, maxHeight: 720, quality: 'small', audioBitrateKbps: 96 }
  }
}

export function imagePreset(level: Level, format: ImageFormat = 'keep'): ImageSettings {
  switch (level) {
    case 'light':
      return { level, format, quality: 0.85, maxEdge: 'source' }
    case 'balanced':
      return { level, format, quality: 0.7, maxEdge: 2560 }
    case 'maximum':
      return { level, format, quality: 0.55, maxEdge: 1600 }
  }
}

export function audioPreset(level: Level, format: AudioFormat = 'mp3'): AudioSettings {
  switch (level) {
    case 'light':
      return { level, format, bitrateKbps: 192, mono: false }
    case 'balanced':
      return { level, format, bitrateKbps: 128, mono: false }
    case 'maximum':
      return { level, format, bitrateKbps: 96, mono: true }
  }
}

/** What one file came out as. Same shape @unisim/media returns. */
export interface CompressedFile {
  blob: Blob
  name: string
}

// ── What the header said, as numbers ─────────────────────────────────────────

/**
 * The probe result for one dropped file, kept alongside the sentence shown on
 * its row. The size estimate needs the numbers — a bitrate is bytes per second,
 * a rasterised PDF is bytes per page — and re-reading them later would mean a
 * second decode per file for a fact already in hand. See `fillDetail`.
 */
export type ProbeMeta =
  | { kind: 'image'; width: number; height: number }
  | { kind: 'video'; probe: VideoProbe }
  | { kind: 'audio'; seconds: number }
  | { kind: 'pdf'; pages: number }
