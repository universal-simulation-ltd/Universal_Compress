import type { TouchEvent } from 'react'
import { Button, SelectCheckbox, SelectionBar, SwipeGroup, SwipeRow, ValueChip, buttonClass } from '@unisim/sdk'
import { removeSwipe, selectSwipe, useListSelect } from '../../native/listGestures'
import { PHONE } from '../../native/shell'
import { useNT } from '../../native/strings'
import { offerUndo } from '../../native/undo'
import { formatBytes, savingPercent } from '../../lib/layout'
import { totals, useCompressStore, type Item } from '../../stores/compressStore'
import type { DetectedKind } from '../../lib/kinds'

/** The queue, under the circle. One row per dropped file, whatever became of it. */
export default function FileList() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const t = useNT()
  // The phone app's list gestures (BRANDING.md ▸ "A deletable row swipes"):
  // swipe a file left to take it off the list (with Undo), right to select
  // it; hold to select. Selection mode waits for a batch to finish.
  const pick = useListSelect(items.map((i) => i.id), PHONE && !running)
  if (items.length === 0) return null

  const swipeOff = (item: Item) => {
    const { takeItem, restoreItem } = useCompressStore.getState()
    const taken = takeItem(item.id)
    if (taken) offerUndo({ name: item.file.name, restore: () => restoreItem(taken) })
  }

  return (
    <div className="flex flex-col gap-2">
      {pick.selecting && (
        // The suite's select-several bar: Remove selected (the files leave the
        // list, nothing is deleted), Clear, and Done to leave.
        <SelectionBar
          sel={pick.sel}
          action="remove"
          noun={{ one: t('app.noun_one'), other: t('app.noun_other') }}
          onDelete={(ids) => {
            const { removeItem } = useCompressStore.getState()
            for (const id of ids) removeItem(id)
            pick.leave()
          }}
          extra={
            <Button size="sm" onClick={pick.leave} data-select-done>
              {t('app.select_done')}
            </Button>
          }
          className="flex-wrap"
        />
      )}
      <SwipeGroup>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {items.map((item) => (
            <FileRow
              key={item.id}
              item={item}
              phone={
                PHONE
                  ? {
                      t,
                      selecting: pick.selecting,
                      checked: pick.sel.has(item.id),
                      canSelect: !running,
                      onToggle: () => pick.sel.toggle(item.id),
                      onHold: pick.holdStart(item.id),
                      onSwipeOff: () => swipeOff(item),
                      onSelect: () => pick.start(item.id),
                    }
                  : null
              }
            />
          ))}
        </ul>
      </SwipeGroup>
    </div>
  )
}

/** The phone app's swipes, hold and selection mode for one row. */
interface PhoneRow {
  t: ReturnType<typeof useNT>
  selecting: boolean
  checked: boolean
  /** Selection mode can start (not while a batch runs). */
  canSelect: boolean
  onToggle: () => void
  onHold: (e: TouchEvent) => void
  onSwipeOff: () => void
  onSelect: () => void
}

/**
 * What a screen reader hears while the batch runs. ALWAYS mounted — a live
 * region that appears together with its first message is often not announced
 * at all — and fed per file rather than per percent, so it says something
 * worth hearing instead of reading out a counter.
 */
export function StatusAnnouncer() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const t = totals(items)
  let message = ''
  if (running) {
    message = `Compressing… ${t.done} of ${t.eligible} done`
  } else if (t.done > 0 && t.pending === t.failed) {
    const saved = savingPercent(t.bytesInDone, t.bytesOutDone)
    message =
      `Finished. ${t.done} ${t.done === 1 ? 'file' : 'files'} ready to download` +
      (saved > 0 ? `, ${saved}% smaller` : '') +
      (t.failed > 0 ? `. ${t.failed} couldn’t be compressed` : '') +
      '.'
  }
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  )
}

function FileRow({ item, phone }: { item: Item; phone: PhoneRow | null }) {
  const running = useCompressStore((s) => s.running)
  const removeItem = useCompressStore((s) => s.removeItem)
  const downloadItem = useCompressStore((s) => s.downloadItem)

  const unsupported = item.kind === 'unsupported'
  const saved = item.result ? savingPercent(item.file.size, item.result.blob.size) : 0
  const selecting = phone?.selecting ?? false
  // As the ✕: anything but the file being compressed right now.
  const removable = !(running && item.status === 'running')

  const body = (
    <div className={`relative flex items-center gap-3 px-3.5 py-3 ${unsupported ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
      {selecting && phone ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <SelectCheckbox
            checked={phone.checked}
            onChange={phone.onToggle}
            label={phone.t('app.swipe_select_named', { name: item.file.name })}
          />
        </span>
      ) : (
        <KindIcon kind={item.kind} />
      )}

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[12.5px] font-semibold ${unsupported ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
          {item.file.name}
        </p>

        {unsupported ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.reason}</p>
        ) : item.status === 'failed' ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-red-700 dark:text-red-400">{item.error}</p>
        ) : (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            <span>{formatBytes(item.file.size)}</span>
            {item.detail && <span className="text-slate-400">· {item.detail}</span>}
            {item.result && !item.keptOriginal && (
              <>
                <span aria-hidden className="text-slate-300 dark:text-slate-600">→</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatBytes(item.result.blob.size)}</span>
                <ValueChip size="sm" tone="good">
                  −{saved}%
                </ValueChip>
              </>
            )}
            {item.keptOriginal && (
              <span className="text-slate-500 dark:text-slate-400">· already as small as it goes — kept the original</span>
            )}
          </p>
        )}

        {item.status === 'running' && (
          <div
            role="progressbar"
            aria-label={`Compressing ${item.file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(item.progress * 100)}
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FE8C01] to-[#E05504] transition-[width] duration-200"
              style={{ width: `${Math.round(item.progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      {item.result && !selecting && (
        <button
          type="button"
          onClick={() => downloadItem(item.id)}
          aria-label={`Download ${item.result.name}`}
          className={`${buttonClass('soft', 'sm')} shrink-0`}
        >
          Download
        </button>
      )}

      {!selecting && <button
        type="button"
        disabled={!removable}
        onClick={() => removeItem(item.id)}
        aria-label={`Remove ${item.file.name}`}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600 disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>}
    </div>
  )

  if (!phone) return <li>{body}</li>

  return (
    <li
      // A hold selects: no system menu under the finger.
      style={{ WebkitTouchCallout: 'none' }}
      onTouchStart={selecting || !phone.canSelect ? undefined : phone.onHold}
      // In selection mode a tap anywhere on the row ticks it.
      onClick={selecting ? (e) => { if (!(e.target as Element).closest('input,button')) phone.onToggle() } : undefined}
      data-file-row={item.id}
    >
      <SwipeRow
        id={item.id}
        left={phone.canSelect ? selectSwipe(phone.t, item.file.name, phone.onSelect) : undefined}
        right={removeSwipe(phone.t, item.file.name, phone.onSwipeOff)}
        disabled={selecting || !removable}
        actionWidth={88}
        frontClassName="bg-white dark:bg-slate-900"
      >
        {body}
      </SwipeRow>
    </li>
  )
}

/** A glyph per engine, so a mixed batch is readable without reading filenames. */
function KindIcon({ kind }: { kind: DetectedKind }) {
  const shell =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide'
  switch (kind) {
    case 'pdf':
      return <span className={`${shell} bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300`}>PDF</span>
    case 'video':
      return <span className={`${shell} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300`}>VID</span>
    case 'image':
      return <span className={`${shell} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300`}>IMG</span>
    case 'audio':
      return <span className={`${shell} bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300`}>AUD</span>
    default:
      return <span className={`${shell} bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300`}>?</span>
  }
}
