import type { FileKind } from '../kinds'
import type {
  AudioSettings,
  CompressedFile,
  ImageSettings,
  PdfSettings,
  VideoCompressSettings,
} from '../types'
import { compressAudio } from './audio'
import { compressImage } from './image'
import { compressVideo } from './video'

/** Every kind's settings, as the store holds them. */
export interface AllSettings {
  pdf: PdfSettings
  video: VideoCompressSettings
  image: ImageSettings
  audio: AudioSettings
}

/**
 * The one seam. Four engines with nothing in common behind a single call, so the
 * queue that drives them doesn't have to know which is which.
 *
 * The heavy engines load on first use, and the split is worth stating because it
 * is measured, not guessed:
 *
 *   • **PDF** is dynamic. pdf-lib and pdf.js together are ~1 MB of JavaScript
 *     plus a 1.3 MB worker. Importing them statically put every one of those
 *     bytes in front of somebody who dropped a photo — nearly tripling the
 *     initial download of an app whose entire subject is file size.
 *   • **Audio** pulls LAME in dynamically from inside `audio.ts` (~170 KB).
 *   • **Images** and **video** are static: canvas and WebCodecs are the
 *     browser's own, and @unisim/media is kilobytes of container code. Making
 *     those dynamic would buy nothing and add a spinner.
 */
export async function compressFile(
  file: File,
  kind: FileKind,
  settings: AllSettings,
  onProgress: (fraction: number) => void,
): Promise<CompressedFile> {
  switch (kind) {
    case 'pdf': {
      const { compressPdf } = await import('./pdf')
      return compressPdf(file, settings.pdf, onProgress)
    }
    case 'video':
      return compressVideo(file, settings.video, onProgress)
    case 'image':
      return compressImage(file, settings.image, onProgress)
    case 'audio':
      return compressAudio(file, settings.audio, onProgress)
  }
}

export { compressAudio, compressImage, compressVideo }
