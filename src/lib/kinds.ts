// What kind of file was dropped — and, when the answer is "one we can't do",
// why not.
//
// The whole app hangs off this one function. The circle takes anything; the
// options column is drawn from the kinds the circle found. A file that lands in
// `unsupported` is NOT silently dropped: it stays in the list with the sentence
// explaining itself, because "I dragged eight files in and six appeared" is a
// worse experience than a clear no.

export type FileKind = 'pdf' | 'video' | 'image' | 'audio'
export type DetectedKind = FileKind | 'unsupported'

/**
 * Extensions each engine will take.
 *
 * Extension first, MIME type second. Windows Explorer and Android's file
 * pickers both hand over `application/octet-stream` often enough that trusting
 * `File.type` refuses files that work perfectly.
 */
export const PDF_EXTS = ['pdf']
/** ISO-BMFF only — @unisim/media's demuxer reads MP4 boxes, nothing else. */
export const VIDEO_EXTS = ['mp4', 'm4v', 'mov']
// `heic`/`heif` are here rather than in KNOWN_REFUSALS below, where they used
// to sit saying "HEIC needs Apple's decoder, which browsers don't expose". That
// was true when it was written and is not any more: the app carries libheif now
// (see `compress/image.ts`), so the format an iPhone hands you compresses like
// anything else.
export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'heic', 'heif']
export const AUDIO_EXTS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'oga', 'opus', 'aiff', 'aif']

/**
 * Containers we can name but not open, with the reason. Saying "MKV needs a
 * demuxer this app doesn't have" beats "unsupported file" — one tells you to go
 * and remux, the other tells you nothing.
 */
const KNOWN_REFUSALS: Record<string, string> = {
  mkv: 'MKV needs a demuxer this app doesn’t carry — remux to MP4 first and it will compress fine.',
  webm: 'WebM isn’t an MP4 container, so the demuxer here can’t open it. MP4, M4V and MOV all work.',
  avi: 'AVI is an older container this app can’t open. Remux to MP4 first.',
  wmv: 'WMV is a Windows-only container with no browser decoder. Remux to MP4 first.',
  flv: 'FLV has no browser decoder. Remux to MP4 first.',
  zip: 'A ZIP is already compressed — squeezing it again would only make it bigger.',
  rar: 'A RAR is already compressed — squeezing it again would only make it bigger.',
  '7z': 'A 7z archive is already compressed — squeezing it again would only make it bigger.',
  gz: 'A .gz is already compressed — squeezing it again would only make it bigger.',
  docx: 'Office files are ZIPs of XML — already compressed, and re-packing them risks the document. Export to PDF and compress that.',
  xlsx: 'Office files are ZIPs of XML — already compressed, and re-packing them risks the document. Export to PDF and compress that.',
  pptx: 'Office files are ZIPs of XML — already compressed. Export to PDF and compress that, which is usually a big win for slide decks.',
  svg: 'An SVG is text, not pixels — there is nothing here to re-encode. Minify it instead.',
}

export interface Detection {
  kind: DetectedKind
  /** Present only when `kind` is 'unsupported'. A sentence, not a code. */
  reason?: string
}

export function detectKind(file: File): Detection {
  const ext = extensionOf(file.name)
  const mime = file.type.toLowerCase()

  if (PDF_EXTS.includes(ext) || mime === 'application/pdf') return { kind: 'pdf' }
  if (VIDEO_EXTS.includes(ext)) return { kind: 'video' }
  if (IMAGE_EXTS.includes(ext)) return { kind: 'image' }
  if (AUDIO_EXTS.includes(ext)) return { kind: 'audio' }

  const refusal = KNOWN_REFUSALS[ext]
  if (refusal) return { kind: 'unsupported', reason: refusal }

  // No extension we know. Fall back to the MIME type, which is right often
  // enough to be worth asking — but only for the families we can actually
  // handle. `image/heic` used to be excluded here because it would have reached
  // a decoder that failed; it is a first-class image now.
  if (mime.startsWith('image/')) return { kind: 'image' }
  if (mime.startsWith('audio/')) return { kind: 'audio' }
  if (mime === 'video/mp4' || mime === 'video/quicktime') return { kind: 'video' }

  return {
    kind: 'unsupported',
    reason: ext
      ? `.${ext} isn’t a format this app can open. It handles PDF, MP4/M4V/MOV, JPEG/PNG/WebP/AVIF/HEIC/GIF/BMP and the common audio formats.`
      : 'This file has no extension and no recognisable type, so there is nothing to tell us how to open it.',
  }
}

/** The `accept` attribute for the file picker — the union of all four engines. */
export const ACCEPT = [
  ...PDF_EXTS,
  ...VIDEO_EXTS,
  ...IMAGE_EXTS,
  ...AUDIO_EXTS,
]
  .map((e) => `.${e}`)
  .join(',')

/** Lower-cased extension without the dot; '' when the name has none. */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot < 1 || dot === filename.length - 1) return ''
  return filename.slice(dot + 1).toLowerCase()
}

/** Plural-aware label for a group of files of one kind — "3 images", "1 PDF". */
export function kindLabel(kind: FileKind, count: number): string {
  const one = count === 1
  switch (kind) {
    case 'pdf':
      return one ? '1 PDF' : `${count} PDFs`
    case 'video':
      return one ? '1 video' : `${count} videos`
    case 'image':
      return one ? '1 image' : `${count} images`
    case 'audio':
      return one ? '1 audio file' : `${count} audio files`
  }
}

/** Order the option panels appear in — heaviest job first, so it reads top-down. */
export const KIND_ORDER: FileKind[] = ['video', 'pdf', 'image', 'audio']
