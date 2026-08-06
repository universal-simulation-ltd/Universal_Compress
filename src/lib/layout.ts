// The single page container. The navbar (via the SDK's `contentClassName`), the
// circle, the options column and the footer all share it, so the suite switcher
// lines up with the circle and the file list with the footer's GitHub link — at
// every breakpoint. Change it here or not at all.
export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

/** "14.2 MB" — file sizes, always one decimal above a kilobyte. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

/**
 * How much smaller, as a whole percent. Negative when the output grew — which
 * is a real outcome for an already-optimised file, and the UI says so rather
 * than rounding it away to a cheerful 0%.
 */
export function savingPercent(before: number, after: number): number {
  if (before <= 0) return 0
  return Math.round(((before - after) / before) * 100)
}

/** `photo.png` + 'jpg' → `photo-compressed.jpg`. Never overwrites the original. */
export function compressedName(filename: string, ext: string): string {
  const dot = filename.lastIndexOf('.')
  const stem = dot > 0 ? filename.slice(0, dot) : filename
  return `${stem}-compressed.${ext}`
}
