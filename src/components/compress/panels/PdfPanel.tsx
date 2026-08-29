import { useCompressStore } from '../../../stores/compressStore'
import { LEVELS, LEVEL_BLURB } from '../../../lib/types'
import { Blurb, Field, LevelPicker, Panel } from '../PanelParts'
import { useLevelSizes } from '../LevelSizes'

export default function PdfPanel({ count }: { count: string }) {
  const level = useCompressStore((s) => s.pdf.level)
  const running = useCompressStore((s) => s.running)
  const setLevel = useCompressStore((s) => s.setLevel)

  const { sub, note } = useLevelSizes('pdf')

  return (
    <Panel title="PDF" count={count}>
      <Field label="How hard to squeeze">
        <LevelPicker
          options={LEVELS}
          value={level}
          disabled={running}
          onChange={(next) => setLevel('pdf', next)}
          sub={sub}
        />
        <Blurb>{LEVEL_BLURB.pdf[level]}</Blurb>
        {note}
      </Field>

      {/* No Advanced section here, and that is deliberate. A PDF has exactly one
          real decision — keep the text layer or turn the pages into pictures —
          and the three buttons above already are that decision. Exposing render
          DPI and JPEG quality as separate dials would offer two numbers whose
          effect nobody can predict without trying it, which is what the three
          presets exist to spare people. */}
      {level !== 'light' && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-800">
          Text stops being selectable at this setting — each page becomes a
          picture of itself. Choose <strong>Light</strong> if the document needs
          to stay searchable.
        </p>
      )}
    </Panel>
  )
}
