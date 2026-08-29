import { formatBytes, savingPercent } from '../../lib/layout'
import type { FileKind } from '../../lib/kinds'
import { useCompressStore } from '../../stores/compressStore'
import type { Level } from '../../lib/types'
import { useLevelEstimates } from './useLevelEstimates'

/**
 * The predicted sizes, in the two places a panel shows them: one on each level
 * button, and one sentence underneath comparing the chosen level with what was
 * dropped.
 *
 * Both come from the same estimate. The button answers "which of these three",
 * the sentence answers "is this worth doing at all" — and that second question
 * is the one an already-optimised file gets wrong, so it says *"already about
 * as small as it goes"* rather than reporting a proud 0%.
 */
export function useLevelSizes(kind: FileKind) {
  const items = useCompressStore((s) => s.items)
  const estimates = useLevelEstimates(kind)
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

  return { sub, note }
}
