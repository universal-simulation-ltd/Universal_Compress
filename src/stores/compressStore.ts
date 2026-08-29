import { create } from 'zustand'
import { detectKind, type DetectedKind, type FileKind } from '../lib/kinds'
import { compressFile, type AllSettings } from '../lib/compress'
import { probeDimensions } from '../lib/compress/image'
import { probeVideo } from '../lib/compress/video'
import { probeDuration } from '../lib/compress/audio'
import { saveBlob } from '../lib/download'
import { createZip } from '@unisim/media'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_PDF_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  audioPreset,
  imagePreset,
  pdfPreset,
  videoPreset,
  type AudioSettings,
  type ImageSettings,
  type Level,
  type PdfSettings,
  type ProbeMeta,
  type VideoCompressSettings,
} from '../lib/types'

export type ItemStatus = 'queued' | 'running' | 'done' | 'failed' | 'unsupported'

export interface Item {
  id: string
  file: File
  kind: DetectedKind
  /** Only for `kind: 'unsupported'` — the sentence explaining why. */
  reason?: string
  status: ItemStatus
  progress: number
  /** "1920 × 1080", "12 pages", "3:42" — filled in asynchronously after the drop. */
  detail?: string
  /** The same header read, as numbers, for the size estimate. See `fillDetail`. */
  meta?: ProbeMeta
  result?: { blob: Blob; name: string }
  error?: string
  /**
   * Set when compressing made the file BIGGER and the original was kept
   * instead. An already-optimised JPEG or a tightly-packed PDF does this
   * routinely, and quietly handing back a larger file would make the product a
   * liar.
   */
  keptOriginal?: boolean
}

interface CompressState {
  items: Item[]
  running: boolean
  /** Only ever holds settings for kinds actually in the queue — see `kindsPresent`. */
  pdf: PdfSettings
  video: VideoCompressSettings
  image: ImageSettings
  audio: AudioSettings

  addFiles(files: File[]): void
  removeItem(id: string): void
  clearQueue(): void
  resetSettings(): void

  setLevel(kind: FileKind, level: Level): void
  updatePdf(patch: Partial<PdfSettings>): void
  updateVideo(patch: Partial<VideoCompressSettings>): void
  updateImage(patch: Partial<ImageSettings>): void
  updateAudio(patch: Partial<AudioSettings>): void

  compressAll(): Promise<void>
  requeueAll(): void
  downloadItem(id: string): void
  downloadAll(): Promise<void>
}

let nextId = 1

export const useCompressStore = create<CompressState>((set, get) => ({
  items: [],
  running: false,
  pdf: DEFAULT_PDF_SETTINGS,
  video: DEFAULT_VIDEO_SETTINGS,
  image: DEFAULT_IMAGE_SETTINGS,
  audio: DEFAULT_AUDIO_SETTINGS,

  addFiles(files) {
    const added: Item[] = files.map((file) => {
      const { kind, reason } = detectKind(file)
      return {
        id: `f${nextId++}`,
        file,
        kind,
        reason,
        status: kind === 'unsupported' ? ('unsupported' as const) : ('queued' as const),
        progress: 0,
      }
    })
    set((s) => ({ items: [...s.items, ...added] }))
    // Detail (dimensions, page count, duration) is read in the background: it
    // needs a decode or a header parse, and blocking the drop on it would make
    // dragging in twenty photos feel broken.
    for (const item of added) void fillDetail(item, set)
  },

  removeItem(id) {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  clearQueue() {
    set({ items: [] })
  },

  resetSettings() {
    set({
      pdf: DEFAULT_PDF_SETTINGS,
      video: DEFAULT_VIDEO_SETTINGS,
      image: DEFAULT_IMAGE_SETTINGS,
      audio: DEFAULT_AUDIO_SETTINGS,
    })
  },

  // Moving the strength control rewrites that kind's Advanced fields. It does
  // not lock them: whatever the level chose stays visible and editable, and
  // editing one simply leaves the level where it is.
  setLevel(kind, level) {
    switch (kind) {
      case 'pdf':
        return set({ pdf: pdfPreset(level) })
      case 'video':
        return set({ video: videoPreset(level) })
      case 'image':
        return set((s) => ({ image: imagePreset(level, s.image.format) }))
      case 'audio':
        return set((s) => ({ audio: audioPreset(level, s.audio.format) }))
    }
  },

  updatePdf(patch) {
    set((s) => ({ pdf: { ...s.pdf, ...patch } }))
  },
  updateVideo(patch) {
    set((s) => ({ video: { ...s.video, ...patch } }))
  },
  updateImage(patch) {
    set((s) => ({ image: { ...s.image, ...patch } }))
  },
  updateAudio(patch) {
    set((s) => ({ audio: { ...s.audio, ...patch } }))
  },

  /**
   * Run the queue, one file at a time.
   *
   * Sequential rather than parallel, deliberately. A video job holds every
   * decoded frame it is working on and a rasterised PDF page is a full-page
   * bitmap; two of those at once on a phone is how a tab gets killed by the OS
   * with no error anyone can act on. One at a time is slower on a workstation
   * and it is the difference between finishing and dying everywhere else.
   */
  async compressAll() {
    if (get().running) return
    set({ running: true })

    try {
      // Snapshot the ids up front: `items` changes on every progress tick, and
      // iterating the live array would re-run whatever the user dropped mid-run.
      const queued = get()
        .items.filter((i) => i.status === 'queued' || i.status === 'failed')
        .map((i) => i.id)

      for (const id of queued) {
        const item = get().items.find((i) => i.id === id)
        if (!item || item.kind === 'unsupported') continue

        patch(set, id, { status: 'running', progress: 0, error: undefined })

        try {
          const settings: AllSettings = {
            pdf: get().pdf,
            video: get().video,
            image: get().image,
            audio: get().audio,
          }
          const result = await compressFile(item.file, item.kind, settings, (fraction) =>
            patch(set, id, { progress: Math.max(0, Math.min(1, fraction)) }),
          )

          // The output grew. That is a genuine result for an already-optimised
          // file, not a failure — so hand back the ORIGINAL and say so. The
          // alternative is a "compressor" that quietly returns something bigger
          // than what went in.
          if (result.blob.size >= item.file.size) {
            patch(set, id, {
              status: 'done',
              progress: 1,
              keptOriginal: true,
              result: { blob: item.file, name: item.file.name },
            })
          } else {
            patch(set, id, { status: 'done', progress: 1, keptOriginal: false, result })
          }
        } catch (err) {
          patch(set, id, {
            status: 'failed',
            progress: 0,
            error: err instanceof Error ? err.message : 'Something went wrong compressing this file',
          })
        }
      }
    } finally {
      set({ running: false })
    }
  },

  /**
   * Put everything back in the queue so it can be compressed again.
   *
   * This exists because the settings are now worth changing AFTER a run: each
   * level shows the size it would produce, so "Balanced was 4 MB, let me see
   * Maximum" is a thing somebody will actually do. Results are cleared rather
   * than kept beside the new ones — two versions of the same file with no way
   * to tell which download is which is worse than losing the first.
   */
  requeueAll() {
    set((s) => ({
      items: s.items.map((i) =>
        i.kind === 'unsupported'
          ? i
          : { ...i, status: 'queued' as const, progress: 0, result: undefined, error: undefined, keptOriginal: undefined },
      ),
    }))
  },

  downloadItem(id) {
    const item = get().items.find((i) => i.id === id)
    if (!item?.result) return
    saveBlob(item.result.blob, item.result.name)
  },

  async downloadAll() {
    const done = get()
      .items.filter((i) => i.result)
      .map((i) => ({ name: i.result!.name, blob: i.result!.blob }))
    if (done.length === 0) return
    if (done.length === 1) return saveBlob(done[0].blob, done[0].name)
    saveBlob(await createZip(done), 'compressed-files.zip')
  },
}))

type Setter = (fn: (state: CompressState) => Partial<CompressState>) => void

function patch(set: Setter, id: string, changes: Partial<Item>) {
  set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...changes } : i)) }))
}

/**
 * Read what the header says, once, in the background.
 *
 * This fills TWO things from one read, which is why the probes return numbers
 * rather than the strings they used to: `detail` is the sentence on the file
 * row, and `meta` is the same fact in the shape the size estimate needs. A
 * second pass to re-read a duration the row already displayed would be a decode
 * per file for a number we had and threw away.
 */
async function fillDetail(item: Item, set: Setter) {
  switch (item.kind) {
    case 'image': {
      const size = await probeDimensions(item.file)
      if (!size) return
      return patch(set, item.id, {
        detail: `${size.width} × ${size.height}`,
        meta: { kind: 'image', width: size.width, height: size.height },
      })
    }
    case 'pdf': {
      // Dynamic for the same reason the compressor is — see compress/index.ts.
      // Dropping a PDF is the moment it becomes worth a megabyte of pdf-lib.
      const { probePageCount } = await import('../lib/compress/pdf')
      const pages = await probePageCount(item.file)
      if (pages === null) return
      return patch(set, item.id, {
        detail: pages === 1 ? '1 page' : `${pages} pages`,
        meta: { kind: 'pdf', pages },
      })
    }
    case 'video': {
      const probe = await probeVideo(item.file)
      if (!probe) return
      return patch(set, item.id, {
        detail: `${probe.width} × ${probe.height} · ${clock(probe.duration)}`,
        meta: { kind: 'video', probe },
      })
    }
    case 'audio': {
      const seconds = await probeDuration(item.file)
      if (seconds === null) return
      return patch(set, item.id, {
        detail: clock(seconds),
        meta: { kind: 'audio', seconds },
      })
    }
    default:
      return
  }
}

/** Seconds as "3:42". */
function clock(seconds: number): string {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// ── Derived views ────────────────────────────────────────────────────────────
//
// These are plain functions over an items array, NOT zustand selectors. A
// selector that builds a new array or object on every call fails zustand's
// snapshot-identity check and spins React into an infinite re-render — the exact
// trap Universal Converter's StudioShell carries a comment about. Components
// select `items` (a stable reference) and call these during render.

/** Which engines the current queue actually needs a panel for, in display order. */
export function kindsPresent(items: Item[]): FileKind[] {
  const seen = new Set<FileKind>()
  for (const i of items) if (i.kind !== 'unsupported') seen.add(i.kind)
  return (['video', 'pdf', 'image', 'audio'] as FileKind[]).filter((k) => seen.has(k))
}

export interface Totals {
  /** Files that can actually be compressed — the unsupported ones are excluded. */
  eligible: number
  pending: number
  done: number
  failed: number
  unsupported: number
  bytesIn: number
  /** Only counts files that have finished, so it is comparable with `bytesIn`. */
  bytesOutDone: number
  bytesInDone: number
  /** 0–1 across the whole run, weighted by nothing — file count is close enough. */
  progress: number
}

export function totals(items: Item[]): Totals {
  const eligibleItems = items.filter((i) => i.kind !== 'unsupported')
  let bytesIn = 0
  let bytesInDone = 0
  let bytesOutDone = 0
  let progress = 0

  for (const i of eligibleItems) {
    bytesIn += i.file.size
    progress += i.status === 'done' ? 1 : i.progress
    if (i.result) {
      bytesInDone += i.file.size
      bytesOutDone += i.result.blob.size
    }
  }

  return {
    eligible: eligibleItems.length,
    pending: eligibleItems.filter((i) => i.status === 'queued' || i.status === 'failed').length,
    done: eligibleItems.filter((i) => i.status === 'done').length,
    failed: eligibleItems.filter((i) => i.status === 'failed').length,
    unsupported: items.length - eligibleItems.length,
    bytesIn,
    bytesInDone,
    bytesOutDone,
    progress: eligibleItems.length === 0 ? 0 : progress / eligibleItems.length,
  }
}
