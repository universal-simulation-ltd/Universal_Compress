import { useEffect, useState } from 'react'
import { estimateKind, type EstimateItem, type LevelSettings } from '../../lib/estimate'
import type { FileKind } from '../../lib/kinds'
import { useCompressStore } from '../../stores/compressStore'
import {
  LEVELS,
  audioPreset,
  imagePreset,
  pdfPreset,
  videoPreset,
  type Level,
} from '../../lib/types'

export type LevelEstimate =
  | { state: 'working' }
  /** Nothing honest to say — a probe failed, or the queue is too big to sample. */
  | { state: 'none' }
  | { state: 'ready'; bytes: number }

export type LevelEstimates = Record<Level, LevelEstimate>

const WORKING: LevelEstimates = {
  light: { state: 'working' },
  balanced: { state: 'working' },
  maximum: { state: 'working' },
}

/**
 * Results survive a level change, a panel re-render and a re-drop of the same
 * files. Without it, clicking between Light and Balanced would re-encode the
 * sample image every time — the answer for a level that has not changed is the
 * answer it already gave.
 */
const cache = new Map<string, number | null>()

/**
 * A predicted output size for each of the three levels of one kind.
 *
 * ⚠️ **The selected level is priced from the LIVE settings; the other two from
 * their presets.** That asymmetry is the point. Someone who opens Advanced and
 * drags quality to 40% must see the number under the button they are on follow
 * the slider — while the other two keep meaning "what you would get if you
 * pressed this", which is a preset, not the overridden state.
 *
 * The three run one after another rather than at once, for the same reason the
 * queue does (see `compressAll`): the image and PDF samples are real encodes,
 * and three of them in parallel on a phone is how a tab gets killed.
 */
export function useLevelEstimates(kind: FileKind): LevelEstimates {
  const items = useCompressStore((s) => s.items)
  const pdf = useCompressStore((s) => s.pdf)
  const video = useCompressStore((s) => s.video)
  const image = useCompressStore((s) => s.image)
  const audio = useCompressStore((s) => s.audio)

  const mine = items.filter((i) => i.kind === kind)
  const settings: LevelSettings = { pdf, video, image, audio }
  const selected = settings[kind].level

  // Identity of the inputs, flattened to a string so the effect re-runs when the
  // queue or the settings actually change — not on every progress tick, which
  // replaces the items array many times a second during a run.
  const queueSig = mine.map((i) => `${i.id}:${i.file.size}:${JSON.stringify(i.meta ?? null)}`).join('|')
  const liveSig = JSON.stringify(settings[kind])

  const [estimates, setEstimates] = useState<LevelEstimates>(WORKING)

  useEffect(() => {
    if (mine.length === 0) return
    let alive = true

    // Debounced: dragging the quality slider fires this on every tick, and each
    // tick would otherwise start a real encode.
    const timer = window.setTimeout(async () => {
      const input: EstimateItem[] = mine.map((i) => ({ file: i.file, meta: i.meta }))

      for (const { value: level } of LEVELS) {
        const forLevel = settingsFor(kind, level, selected, settings)
        const key = `${kind}|${queueSig}|${JSON.stringify(forLevel[kind])}`

        const hit = cache.get(key)
        if (!alive) return
        if (hit !== undefined) {
          setEstimates((e) => ({ ...e, [level]: toState(hit) }))
          continue
        }

        setEstimates((e) => ({ ...e, [level]: { state: 'working' } }))
        const bytes = await estimateKind(kind, input, forLevel).catch(() => null)
        cache.set(key, bytes)
        if (!alive) return
        setEstimates((e) => ({ ...e, [level]: toState(bytes) }))
      }
    }, 300)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // `mine` and `settings` are rebuilt every render; the two signature strings
    // are their stable identity, which is what this should actually depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, queueSig, liveSig, selected])

  if (mine.length === 0) return WORKING
  return estimates
}

function toState(bytes: number | null): LevelEstimate {
  return bytes === null ? { state: 'none' } : { state: 'ready', bytes }
}

/**
 * The settings one level would run with. For the level the user is on that is
 * whatever is on screen, overrides and all; for the others it is the preset,
 * because pressing them is exactly what writes the preset.
 *
 * The format argument mirrors `setLevel` in the store: changing strength has
 * never reset a chosen output format, and the estimate must price the same.
 */
function settingsFor(
  kind: FileKind,
  level: Level,
  selected: Level,
  live: LevelSettings,
): LevelSettings {
  if (level === selected) return live
  switch (kind) {
    case 'pdf':
      return { ...live, pdf: pdfPreset(level) }
    case 'video':
      return { ...live, video: videoPreset(level) }
    case 'image':
      return { ...live, image: imagePreset(level, live.image.format) }
    case 'audio':
      return { ...live, audio: audioPreset(level, live.audio.format) }
  }
}
