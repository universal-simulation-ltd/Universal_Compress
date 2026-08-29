import { formatBytes, savingPercent } from '../../lib/layout'
import type { FileKind } from '../../lib/kinds'
import { useCompressStore } from '../../stores/compressStore'
import { LEVELS, type Level } from '../../lib/types'
import { useLevelEstimates } from './useLevelEstimates'

/**
 * The predicted sizes, in the three places a panel shows them: one on each level
 * button, one sentence underneath comparing the chosen level with what was
 * dropped, and — when the panel is shut — the one line that has to carry both.
 *
 * All three come from the same estimate. The button answers "which of these
 * three", the sentence answers "is this worth doing at all" — and that second
 * question is the one an already-optimised file gets wrong, so it says *"already
 * about as small as it goes"* rather than reporting a proud 0%.
 *
 * `expanded` is passed straight through to the estimator: a shut panel shows one
 * number and should pay for one, not three. See `useLevelEstimates`.
 */
export function useLevelSizes(kind: FileKind, expanded = true) {
  const items = useCompressStore((s) => s.items)
  const estimates = useLevelEstimates(kind, expanded)
  const settings = useCompressStore((s) => s[kind])

  const mine = items.filter((i) => i.kind === kind)
  const sourceBytes = mine.reduce((sum, i) => sum + i.file.size, 0)

  const sub = (level: Level): string | null => {
    const e = estimates[level]
    if (e.state === 'ready') return `≈ ${formatBytes(e.bytes)}`
    if (e.state === 'working') return '…'
    return null
  }

  const selected = estimates[settings.level]
  const note =
    selected.state === 'ready' && sourceBytes > 0 ? (
      <p className="text-[11px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-700">≈ {formatBytes(selected.bytes)}</span>{' '}
        from {formatBytes(sourceBytes)}
        {savingPercent(sourceBytes, selected.bytes) >= 3 ? (
          <>
            {' — '}
            <span className="font-semibold text-[#166534]">
              {savingPercent(sourceBytes, selected.bytes)}% smaller
            </span>
          </>
        ) : (
          <> — already about as small as it goes</>
        )}
      </p>
    ) : null

  // The shut panel's whole account of itself: what it is set to, what that
  // costs, and what it saves. LEVELS holds the capitalised label so this cannot
  // drift from the buttons underneath.
  const levelLabel = LEVELS.find((l) => l.value === settings.level)?.label ?? settings.level
  const saved = selected.state === 'ready' ? savingPercent(sourceBytes, selected.bytes) : 0
  const summary = (
    <>
      <span className="font-semibold text-slate-600">{levelLabel}</span>
      {selected.state === 'ready' && (
        <>
          {' · '}
          <span className="tabular-nums">≈ {formatBytes(selected.bytes)}</span>
          {saved >= 3 && (
            <>
              {' · '}
              <span className="font-semibold text-[#166534]">{saved}% smaller</span>
            </>
          )}
        </>
      )}
      {selected.state === 'working' && ' · working out the size…'}
    </>
  )

  return { sub, note, summary }
}
