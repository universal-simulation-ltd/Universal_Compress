import { encodeAac, encodeMp3, nearestLameRate } from '@unisim/media'
import { compressedName } from '../layout'
import type { AudioSettings, CompressedFile } from '../types'

// Audio: decode with the browser, re-render at the target channel count, then
// re-encode at the chosen bitrate.
//
// Both encoders now come from @unisim/media (0.4.0). M4A goes through
// WebCodecs' own AAC encoder, so it costs no download at all; MP3 goes through
// LAME compiled to JavaScript, loaded on first use. The licensing argument for
// LAME over ffmpeg.wasm lives with the encoder now — see packages/media/src/mp3.ts.
//
// ⚠️ This file used to carry its own copy of `encodeMp3` and `nearestLameRate`,
// byte-identical to Universal Converter's including the comment. That is what
// §10.6's audio extraction was about.

export { nearestLameRate }

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
