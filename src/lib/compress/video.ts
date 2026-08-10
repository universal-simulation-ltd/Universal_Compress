import { convertVideo, probeVideoFile, videoSupported } from '@unisim/media'
import { outputName } from '../layout'
import type { CompressedFile, VideoCompressSettings } from '../types'

// Video runs on WebCodecs — the browser's own hardware H.264 decoder and
// encoder — with @unisim/media supplying the MP4 demuxer and muxer around them.
// No ffmpeg, no GPL, no 30 MB wasm download, and the frames never leave the tab.
//
// The whole job is delegated: this file exists to translate this app's settings
// into the package's `VideoSettings` and to say "no" in a sentence when the
// browser has no encoder.

export async function compressVideo(
  file: File,
  settings: VideoCompressSettings,
  onProgress: (fraction: number) => void = () => {},
): Promise<CompressedFile> {
  if (!(await videoSupported())) {
    throw new Error(
      'This browser has no WebCodecs H.264 encoder, so video can’t be compressed here — Chrome, Edge and Safari 16.4+ have one. PDFs, images and audio still work.',
    )
  }

  const result = await convertVideo(
    file,
    {
      format: 'mp4',
      maxHeight: settings.maxHeight,
      quality: settings.quality,
      keepAudio: settings.keepAudio,
      audioBitrateKbps: settings.audioBitrateKbps,
      // Compressing is not editing — see the note on VideoCompressSettings.
      trim: { enabled: false, startSec: 0, endSec: null },
    },
    onProgress,
  )

  // convertVideo names the output for a *conversion* (same stem, .mp4). This app
  // has to guarantee it never collides with an .mp4 source, so the name is
  // rebuilt with the -compressed suffix every other kind uses.
  return { blob: result.blob, name: outputName(file.name, 'mp4') }
}

/** "1920 × 1080 · 2:14" for the file row, read from the header alone. */
export async function probeVideo(file: File): Promise<string | null> {
  try {
    const probe = await probeVideoFile(file)
    const total = Math.round(probe.duration)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${probe.width} × ${probe.height} · ${mins}:${String(secs).padStart(2, '0')}`
  } catch {
    // An unreadable header is not a reason to refuse the file here — the run
    // will say so properly, with the package's own message.
    return null
  }
}

export { videoSupported }
