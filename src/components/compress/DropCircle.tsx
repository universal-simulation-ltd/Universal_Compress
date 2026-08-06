import { useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const t = totals(items)
  const empty = t.eligible === 0

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) addFiles(files)
  }

  // While the run is going the ring tracks it; once everything has finished it
  // stays full, so a completed batch reads as complete rather than snapping back
  // to empty.
  const fill = running ? t.progress : t.done > 0 && t.pending === 0 ? 1 : t.eligible > 0 ? t.progress : 0

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={empty ? 'Drop a file here, or click to browse' : 'Drop more files here, or click to browse'}
        className={`relative aspect-square w-full max-w-[300px] cursor-pointer rounded-full transition-transform focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 ${
          over ? 'scale-[1.02]' : ''
        }`}
      >
        <Ring empty={empty} fill={fill} over={over} />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-10 text-center">
          {empty ? <EmptyCentre over={over} /> : <LoadedCentre items={items} running={running} />}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) addFiles(files)
          // Reset so re-picking the same file fires change again.
          e.target.value = ''
        }}
      />
    </div>
  )
}

const R = 88
const CIRCUMFERENCE = 2 * Math.PI * R

function Ring({ empty, fill, over }: { empty: boolean; fill: number; over: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FE8C01" />
          <stop offset="100%" stopColor="#E05504" />
        </linearGradient>
      </defs>

      {/* The disc. Tinted orange while a file is hovering over it, so the target
          confirms itself before the mouse button comes up. */}
      <circle cx="100" cy="100" r={R - 6} className={over ? 'fill-orange-50' : 'fill-white'} />

      {/* Track. Dashed while empty — the universal "put something here" — and
          solid the moment there is something to show progress against. */}
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        strokeWidth="10"
        strokeDasharray={empty ? '10 12' : undefined}
        strokeLinecap="round"
        className={over ? 'stroke-orange-400' : empty ? 'stroke-slate-300' : 'stroke-slate-200'}
      />

      {/* Fill. `pathLength` is not used: an exact dash offset against the real
          circumference keeps the cap sitting where the number says it is. */}
      {!empty && fill > 0 && (
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fill)))}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      )}
    </svg>
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
