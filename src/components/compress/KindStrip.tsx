import { APP_MARKS, useFileDrop } from '@unisim/sdk'
import { ACCEPT, kindLabel, type DetectedKind, type FileKind } from '../../lib/kinds'
import { formatBytes } from '../../lib/layout'
import { useCompressStore, type Item } from '../../stores/compressStore'

/**
 * What you dropped, under the circle — one tile per kind, wearing the mark of
 * the Universal App that owns that format.
 *
 * A PDF gets Universal PDF's folded page, a video gets Universal Video's film
 * frame, a photo gets Universal Images' sun over hills, audio gets Universal
 * Recorder's microphone. That is the point: this app is the suite's compressor,
 * and a mixed drop is easier to read as "the PDF one and the photo one" than as
 * four coloured letter-badges nobody has been taught yet.
 *
 * ⚠️ **The marks come from `@unisim/sdk`'s `APP_MARKS`, never a hand-drawn
 * copy.** They are generated from one source
 * (`backoffice/universal-platform/scripts/app-marks/marks.mjs`) for all
 * nineteen apps, and a mark redrawn here would drift from the one in the app
 * switcher two rows above it with nothing to catch the difference.
 */

/** Which app in the suite owns this kind of file. */
const MARK_FOR: Record<FileKind, string> = {
  pdf: 'pdf',
  video: 'video',
  image: 'images',
  audio: 'recorder',
}

/**
 * ⚠️ Undo the marks' RESTING state.
 *
 * `APP_MARKS` is drawn to be animated: `SuiteSwitcher` injects `APP_MARK_CSS`
 * into `<head>` on mount — which happens here, because the navbar is on this
 * page — and those rules are global. The resting halves (`.uam-pdf-fold` at
 * `scale(0.55)`, `.uam-images-sun` at `opacity: 0.35`, `.uam-recorder-level` at
 * `opacity: 0`) therefore apply to any mark anywhere, while the hover halves
 * that complete them are scoped to `.unisim-suite-row` and can never fire here.
 * Left alone these tiles would show permanently half-drawn marks — the sun
 * sunk into the hills, the fold shrunk, the PDF label faded.
 *
 * The attribute selector rather than forty class names on purpose: it covers
 * the marks that exist now and any part added to any of them later.
 */
const RESOLVE_MARKS = `
  .ucs-mark [class*="uam-"] {
    transform: none !important;
    opacity: 1 !important;
    stroke-dashoffset: 0 !important;
  }
`

export default function KindStrip() {
  const items = useCompressStore((s) => s.items)
  const addFiles = useCompressStore((s) => s.addFiles)

  // The "+" tile is a drop target as well as a button, so a file dragged onto
  // the row of tiles lands where it looks like it should. `pageWide` is OFF
  // here — the circle owns the whole-page listener, and two page-wide zones
  // would hand the page back and forth for no gain (see the SDK's note: they
  // register on a stack and the last mounted wins).
  const add = useFileDrop({
    onFiles: addFiles,
    accept: ACCEPT,
    clickToBrowse: true,
    label: 'Add more files',
  })

  if (items.length === 0) return null

  const groups = groupByKind(items)

  return (
    <div className="flex w-full max-w-[460px] flex-wrap items-stretch justify-center gap-2">
      <style>{RESOLVE_MARKS}</style>
      {groups.map((g) => (
        <div
          key={g.kind}
          // A fixed width, not `flex-1`: with five tiles the row wraps 3 + 2,
          // and flexible children make the second row's two stretch to twice
          // the width of the first row's three. Same size always, centred.
          className={`flex w-[108px] flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 ${
            g.kind === 'unsupported'
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          {g.kind === 'unsupported' ? (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-[12px] font-bold text-slate-500"
              aria-hidden="true"
            >
              ?
            </span>
          ) : (
            // The mark ships at 22px with width/height baked onto the <svg>;
            // CSS on the child beats those presentation attributes.
            <span className="ucs-mark [&>svg]:h-8 [&>svg]:w-8" aria-hidden="true">
              {APP_MARKS[MARK_FOR[g.kind]]}
            </span>
          )}
          <span className="text-center text-[11.5px] font-bold leading-tight text-slate-800">
            {g.kind === 'unsupported'
              ? g.count === 1 ? '1 not supported' : `${g.count} not supported`
              : kindLabel(g.kind, g.count)}
          </span>
          {g.kind !== 'unsupported' && (
            <span className="text-[10.5px] tabular-nums text-slate-400">{formatBytes(g.bytes)}</span>
          )}
        </div>
      ))}

      {/* Add more, from the file picker — the same job the circle does, put
          where the eye already is once there is something in the queue. */}
      <div
        {...add.dropzoneProps}
        title="Add more files"
        className={`flex w-[108px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-2 py-2.5 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
          add.over
            ? 'border-orange-400 bg-orange-50'
            : 'border-slate-300 bg-white hover:border-orange-400 hover:bg-orange-50/40'
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            add.over ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </span>
        <span className="text-center text-[11.5px] font-bold leading-tight text-slate-700">Add more</span>
        <span className="text-[10.5px] text-slate-400">or drop</span>
      </div>

      <input {...add.inputProps} className="hidden" />
    </div>
  )
}

interface Group {
  kind: DetectedKind
  count: number
  bytes: number
}

/**
 * One entry per kind present, in the options column's order so the tile and the
 * panel it corresponds to are in the same sequence. Unsupported files come last
 * — they are in the list and should be visible here too, but they are not part
 * of what is about to be compressed.
 */
function groupByKind(items: Item[]): Group[] {
  const order: DetectedKind[] = ['video', 'pdf', 'image', 'audio', 'unsupported']
  const by = new Map<DetectedKind, Group>()
  for (const i of items) {
    const g = by.get(i.kind) ?? { kind: i.kind, count: 0, bytes: 0 }
    g.count += 1
    g.bytes += i.file.size
    by.set(i.kind, g)
  }
  return order.filter((k) => by.has(k)).map((k) => by.get(k)!)
}
