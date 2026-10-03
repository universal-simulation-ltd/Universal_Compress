import { versionedName } from '@unisim/sdk'
// The single page container. The navbar (via the SDK's `contentClassName`), the
// circle, the options column and the footer all share it, so the suite switcher
// lines up with the circle and the file list with the footer's GitHub link — at
// every breakpoint. Change it here or not at all.
export const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

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

/**
 * `photo.png` + 'jpg' → `photo-v1.jpg`. Never overwrites the original.
 *
 * Was `-compressed`, which was fine exactly once: compressing the output again
 * gave `photo-compressed-compressed.jpg`, and the name then recorded how many
 * times it had been round-tripped rather than what it was. `versionedName`
 * PARSES the tail and replaces it, so a second pass is v2 — and it strips the
 * old `-compressed` names on the way, so files made before this change tidy
 * themselves up the next time they go through.
 */
export function outputName(filename: string, ext: string): string {
  return versionedName(filename, { ext })
}

/**
 * A zip holds one entry per name: `a.png` and a still `a.gif` both come out as
 * `a-v1.webp`, and the second used to land on top of the first. Number the
 * repeats instead — `a-v1 (2).webp` — the way a file manager would.
 */
export function uniqueNames<T extends { name: string }>(files: T[]): T[] {
  const seen = new Set<string>()
  return files.map((file) => {
    const key = (n: string) => n.toLowerCase()
    if (!seen.has(key(file.name))) {
      seen.add(key(file.name))
      return file
    }
    const dot = file.name.lastIndexOf('.')
    const stem = dot > 0 ? file.name.slice(0, dot) : file.name
    const ext = dot > 0 ? file.name.slice(dot) : ''
    let n = 2
    while (seen.has(key(`${stem} (${n})${ext}`))) n++
    const name = `${stem} (${n})${ext}`
    seen.add(key(name))
    return { ...file, name }
  })
}
