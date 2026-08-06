import { formatBytes, savingPercent } from '../../lib/layout'
import { useCompressStore, type Item } from '../../stores/compressStore'
import type { DetectedKind } from '../../lib/kinds'

/** The queue, under the circle. One row per dropped file, whatever became of it. */
export default function FileList() {
  const items = useCompressStore((s) => s.items)
  if (items.length === 0) return null

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((item) => (
        <FileRow key={item.id} item={item} />
      ))}
    </ul>
  )
}

function FileRow({ item }: { item: Item }) {
  const running = useCompressStore((s) => s.running)
  const removeItem = useCompressStore((s) => s.removeItem)
  const downloadItem = useCompressStore((s) => s.downloadItem)

  const unsupported = item.kind === 'unsupported'
  const saved = item.result ? savingPercent(item.file.size, item.result.blob.size) : 0

  return (
    <li className={`relative flex items-center gap-3 px-3.5 py-3 ${unsupported ? 'bg-slate-50' : ''}`}>
      <KindIcon kind={item.kind} />

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[12.5px] font-semibold ${unsupported ? 'text-slate-500' : 'text-slate-900'}`}>
          {item.file.name}
        </p>

        {unsupported ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.reason}</p>
        ) : item.status === 'failed' ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-red-700">{item.error}</p>
        ) : (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-slate-500">
            <span>{formatBytes(item.file.size)}</span>
            {item.detail && <span className="text-slate-400">· {item.detail}</span>}
            {item.result && !item.keptOriginal && (
              <>
                <span aria-hidden className="text-slate-300">→</span>
                <span className="font-semibold text-slate-700">{formatBytes(item.result.blob.size)}</span>
                <span className="rounded-full bg-[#2F9E57]/12 px-1.5 py-0.5 text-[10px] font-bold text-[#166534]">
                  −{saved}%
                </span>
              </>
            )}
            {item.keptOriginal && (
              <span className="text-slate-500">· already as small as it goes — kept the original</span>
            )}
          </p>
        )}

        {item.status === 'running' && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FE8C01] to-[#E05504] transition-[width] duration-200"
              style={{ width: `${Math.round(item.progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      {item.result && (
        <button
          type="button"
          onClick={() => downloadItem(item.id)}
          className="shrink-0 rounded-lg bg-orange-500/12 px-2.5 py-1.5 text-[11.5px] font-bold text-orange-800 transition-colors hover:bg-orange-500/20 focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600"
        >
          Save
        </button>
      )}

      <button
        type="button"
        disabled={running && item.status === 'running'}
        onClick={() => removeItem(item.id)}
        aria-label={`Remove ${item.file.name}`}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600 disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </li>
  )
}

/** A glyph per engine, so a mixed batch is readable without reading filenames. */
function KindIcon({ kind }: { kind: DetectedKind }) {
  const shell =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide'
  switch (kind) {
    case 'pdf':
      return <span className={`${shell} bg-red-50 text-red-700`}>PDF</span>
    case 'video':
      return <span className={`${shell} bg-indigo-50 text-indigo-700`}>VID</span>
    case 'image':
      return <span className={`${shell} bg-emerald-50 text-emerald-700`}>IMG</span>
    case 'audio':
      return <span className={`${shell} bg-amber-50 text-amber-700`}>AUD</span>
    default:
      return <span className={`${shell} bg-slate-200 text-slate-500`}>?</span>
  }
}
