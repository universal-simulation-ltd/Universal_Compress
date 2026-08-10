import { DropRing, useFileDrop } from '@unisim/sdk'
import { ACCEPT } from '../../lib/kinds'
import { formatBytes, savingPercent } from '../../lib/layout'
import { useCompressStore, totals, type Item } from '../../stores/compressStore'

/**
 * The circle. It is the whole front of the app.
 *
 * One target that takes anything, and one place that answers the only question
 * anyone has: *how much smaller did it get?* So the same ring is, in order:
 *
 *   empty   — a dashed circle saying "drop a file"
 *   loaded  — a solid ring showing what is queued and how big it is
 *   running — the ring fills as the queue runs
 *   done    — the ring is full, and the middle reads "−62%"
 *
 * It never stops accepting a drop, at any of those four stages, because
 * "compress these, and now these as well" is what people actually do.
 */
export default function DropCircle() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const addFiles = useCompressStore((s) => s.addFiles)

  const t = totals(items)
  const empty = t.eligible === 0

  // The mechanics — drag depth, the hidden input, click and Enter and Space,
  // resetting the value so the same file can be picked twice — now live in the
  // SDK, shared with Universal Video. What stays here is everything that is
  // actually about compressing: the four states, and what the middle says.
  const drop = useFileDrop({
    onFiles: addFiles,
    accept: ACCEPT,
    label: empty ? 'Drop a file here, or click to browse' : 'Drop more files here, or click to browse',
  })

  // While the run is going the ring tracks it; once everything has finished it
  // stays full, so a completed batch reads as complete rather than snapping back
  // to empty.
  const fill = running ? t.progress : t.done > 0 && t.pending === 0 ? 1 : t.eligible > 0 ? t.progress : 0

  return (
    <div className="flex flex-col items-center">
      <div
        {...drop.dropzoneProps}
        className={`relative w-full max-w-[300px] cursor-pointer rounded-full transition-transform focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 ${
          drop.over ? 'scale-[1.02]' : ''
        }`}
      >
        {/* `still` while files are queued but nothing is running: neither the
            idle twinkle ("alive and waiting") nor the busy chase ("working")
            is true then, so the ring says nothing. */}
        <DropRing
          size="100%"
          over={drop.over}
          motion={empty ? 'idle' : running ? 'busy' : 'still'}
          fill={empty ? 0 : fill}
        >
          {empty ? <EmptyCentre over={drop.over} /> : <LoadedCentre items={items} running={running} />}
        </DropRing>
      </div>

      <input {...drop.inputProps} className="hidden" />
    </div>
  )
}

function EmptyCentre({ over }: { over: boolean }) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        className={`mb-1 h-9 w-9 ${over ? 'text-orange-500' : 'text-slate-400'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Two arrows squeezing inward — the mark of the app, not a download
            arrow. What happens here is compression, not saving. */}
        <path d="M12 3v5" />
        <path d="M9.5 5.5 12 8l2.5-2.5" />
        <path d="M12 21v-5" />
        <path d="M9.5 18.5 12 16l2.5 2.5" />
        <path d="M4 12h16" />
      </svg>
      <span className="text-[15px] font-bold text-slate-900">Drop any file here</span>
      <span className="text-[11.5px] leading-relaxed text-slate-500">
        PDF · MP4 · MOV · JPEG · PNG · WebP · MP3 · WAV · M4A
      </span>
      <span className="mt-1 text-[11px] text-slate-400">or click to browse</span>
    </>
  )
}

function LoadedCentre({ items, running }: { items: Item[]; running: boolean }) {
  const t = totals(items)
  const finished = t.done > 0 && t.pending === 0 && !running

  if (running) {
    const pct = Math.round(t.progress * 100)
    return (
      <>
        <span className="text-[34px] font-bold leading-none tabular-nums text-slate-900">{pct}%</span>
        <span className="mt-1.5 text-[12px] font-semibold text-slate-600">Compressing…</span>
        <span className="text-[11px] tabular-nums text-slate-400">
          {t.done} of {t.eligible} done
        </span>
      </>
    )
  }

  if (finished) {
    const saved = savingPercent(t.bytesInDone, t.bytesOutDone)
    // A batch that got no smaller says so. Rounding a 0.4% saving up to a
    // triumphant number is exactly the kind of thing that makes a tool feel like
    // it is selling you something.
    const grew = saved <= 0
    return (
      <>
        <span
          className={`text-[38px] font-bold leading-none tabular-nums ${grew ? 'text-slate-400' : 'text-[#2F9E57]'}`}
        >
          {grew ? '—' : `−${saved}%`}
        </span>
        <span className="mt-1.5 text-[12px] font-semibold tabular-nums text-slate-700">
          {formatBytes(t.bytesInDone)} → {formatBytes(t.bytesOutDone)}
        </span>
        <span className="text-[11px] text-slate-400">
          {grew ? 'already as small as it goes' : `${t.done} file${t.done === 1 ? '' : 's'} compressed`}
        </span>
      </>
    )
  }

  return (
    <>
      <span className="text-[30px] font-bold leading-none tabular-nums text-slate-900">
        {t.eligible}
      </span>
      <span className="mt-1 text-[12px] font-semibold text-slate-600">
        file{t.eligible === 1 ? '' : 's'} ready
      </span>
      <span className="text-[11px] tabular-nums text-slate-400">{formatBytes(t.bytesIn)}</span>
      <span className="mt-1.5 text-[10.5px] text-slate-400">drop more, or press Compress</span>
    </>
  )
}
