import { encodeAac } from '@unisim/media'
import { channelToInt16 } from '../pcm'
import { compressedName } from '../layout'
import type { AudioSettings, CompressedFile } from '../types'

// Audio: decode with the browser, re-render at the target channel count, then
// re-encode at the chosen bitrate.
//
// MP3 goes through LAME compiled to JavaScript (@breezystack/lamejs). Why not
// ffmpeg.wasm: the only published @ffmpeg/core build is GPL-2.0-or-later (it
// bundles libx264), which would relicense this app. LAME's JS port is LGPL-3.0 —
// a dependency licence, not a project one — so the app stays MIT, and the
// download is ~100× smaller than the 31 MB core.
//
// M4A goes through WebCodecs' own AAC encoder via @unisim/media, so it costs no
// download at all.

/** LAME only accepts a fixed set of sample rates. */
const LAME_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]

/** The rate LAME will accept that's closest to (and no higher than) the source. */
export function nearestLameRate(sampleRate: number): number {
  if (LAME_RATES.includes(sampleRate)) return sampleRate
  const below = LAME_RATES.filter((r) => r < sampleRate)
  return below.length > 0 ? Math.max(...below) : Math.min(...LAME_RATES)
}

/** Samples per encodeBuffer call — ~1152-frame MP3 granules, 1152 × 100. */
const CHUNK = 115200

export async function compressAudio(
  file: File,
  settings: AudioSettings,
  onProgress: (fraction: number) => void = () => {},
): Promise<CompressedFile> {
  const bytes = await file.arrayBuffer()
  onProgress(0.08)

  const decoded = await decode(bytes)
  onProgress(0.3)

  const rendered = await render(decoded, settings)
  onProgress(0.5)

  const channels: Float32Array[] = []
  for (let c = 0; c < rendered.numberOfChannels; c++) channels.push(rendered.getChannelData(c))

  const half = (fraction: number) => onProgress(0.5 + fraction * 0.5)

  if (settings.format === 'm4a') {
    const blob = await encodeAac(channels, rendered.sampleRate, settings.bitrateKbps, half)
    return { blob, name: compressedName(file.name, 'm4a') }
  }

  const blob = await encodeMp3(channels, rendered.sampleRate, settings.bitrateKbps, half)
  return { blob, name: compressedName(file.name, 'mp3') }
}

// A throwaway context purely for decoding — its own rate doesn't affect the
// decoded buffer, which keeps the file's native sample rate.
async function decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, 1, 44100)
  try {
    return await ctx.decodeAudioData(bytes)
  } catch {
    throw new Error(
      'This file couldn’t be decoded — it may be corrupt, or use a codec this browser can’t read',
    )
  }
}

// Re-channel (and, for MP3, resample to a rate LAME accepts) in one offline
// render. The destination's channel count does the downmix, so stereo→mono
// comes for free and correctly.
async function render(decoded: AudioBuffer, settings: AudioSettings): Promise<AudioBuffer> {
  // A 96 kHz source resamples on the way in rather than failing at the encoder.
  const sampleRate =
    settings.format === 'mp3' ? nearestLameRate(decoded.sampleRate) : decoded.sampleRate
  const channelCount = settings.mono ? 1 : Math.min(2, decoded.numberOfChannels)
  const frames = Math.max(1, Math.ceil(decoded.duration * sampleRate))

  const ctx = new OfflineAudioContext(channelCount, frames, sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = decoded
  source.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

async function encodeMp3(
  channels: Float32Array[],
  sampleRate: number,
  bitrateKbps: number,
  onProgress: (fraction: number) => void,
): Promise<Blob> {
  if (channels.length === 0) throw new Error('There is no audio in this file to encode')

  // Loaded on first use so LAME never lands in the initial bundle.
  const { Mp3Encoder } = await import('@breezystack/lamejs')

  // LAME takes mono or stereo; anything wider was downmixed by the render above.
  const numChannels = Math.min(2, channels.length)
  const encoder = new Mp3Encoder(numChannels, sampleRate, bitrateKbps)

  const left = channelToInt16(channels[0])
  const right = numChannels === 2 ? channelToInt16(channels[1]) : undefined
  const parts: Uint8Array[] = []

  for (let offset = 0; offset < left.length; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, left.length)
    const block = right
      ? encoder.encodeBuffer(left.subarray(offset, end), right.subarray(offset, end))
      : encoder.encodeBuffer(left.subarray(offset, end))
    if (block.length > 0) parts.push(block)
    onProgress(end / left.length)
    // Yield between chunks so the progress ring actually repaints.
    await Promise.resolve()
  }

  const tail = encoder.flush()
  if (tail.length > 0) parts.push(tail)

  return new Blob(parts as BlobPart[], { type: 'audio/mpeg' })
}

/** "3:42 · stereo" for the file row. Costs a decode, so it is not run on drop. */
export function probeDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), 5000)
    audio.onloadedmetadata = () => {
      const total = Math.round(audio.duration)
      if (!Number.isFinite(total)) return finish(null)
      const mins = Math.floor(total / 60)
      const secs = total % 60
      finish(`${mins}:${String(secs).padStart(2, '0')}`)
    }
    audio.onerror = () => finish(null)
    audio.src = url
  })
}
