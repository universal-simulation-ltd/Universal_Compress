import { useState } from 'react'
import { useCompressStore } from '../../../stores/compressStore'
import { LEVELS, LEVEL_BLURB, type ImageFormat, type MaxEdge } from '../../../lib/types'
import { Blurb, Collapsible, Field, Hint, LevelPicker, Panel, Segmented, Select } from '../PanelParts'
import { useLevelSizes } from '../LevelSizes'

const FORMATS: { value: ImageFormat; label: string }[] = [
  { value: 'keep', label: 'Automatic' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
]

const EDGES: { value: MaxEdge; label: string }[] = [
  { value: 'source', label: 'Keep the original size' },
  { value: 3840, label: '3840 px — 4K' },
  { value: 2560, label: '2560 px' },
  { value: 1920, label: '1920 px — Full HD' },
  { value: 1600, label: '1600 px' },
  { value: 1280, label: '1280 px' },
  { value: 800, label: '800 px' },
]

export default function ImagePanel({ count }: { count: string }) {
  const settings = useCompressStore((s) => s.image)
  const running = useCompressStore((s) => s.running)
  // Shown only to somebody who actually has an animation in the queue. The
  // rules below are real and worth stating, and they are also noise on a panel
  // holding four photographs — which is what putting them in the level blurbs,
  // where every image user reads them, would have done.
  const animated = useCompressStore((s) =>
    s.items.some((i) => i.meta?.kind === 'image' && (i.meta.frames ?? 1) > 1),
  )
  const setLevel = useCompressStore((s) => s.setLevel)
  const update = useCompressStore((s) => s.updateImage)

  const advanced = [
    FORMATS.find((f) => f.value === settings.format)?.label ?? '',
    `${Math.round(settings.quality * 100)}% quality`,
    settings.maxEdge === 'source' ? 'original size' : `${settings.maxEdge} px`,
  ].join(' · ')

  // Shut by default — see `Panel`. The estimate for the other two levels is
  // only worth paying for once somebody has opened it.
  const [open, setOpen] = useState(false)
  const { sub, note, summary } = useLevelSizes('image', open)

  return (
    <Panel title="Images" count={count} summary={summary} open={open} onToggle={() => setOpen((o) => !o)}>
      <Field label="How hard to squeeze">
        <LevelPicker
          options={LEVELS}
          value={settings.level}
          disabled={running}
          onChange={(next) => setLevel('image', next)}
          sub={sub}
        />
        <Blurb>{LEVEL_BLURB.image[settings.level]}</Blurb>
        {animated && (
          <Hint>
            Animated GIFs stay animated: they are re-encoded frame by frame with a
            single shared palette, and only what changes between frames is stored.
            {settings.level === 'maximum'
              ? ' At Maximum every second frame is also dropped, so the animation keeps its length but plays at half the frame rate.'
              : ' Maximum also halves the frame rate.'}
          </Hint>
        )}
        {note}
      </Field>

      <Collapsible label="Advanced" summary={advanced}>
        <Field label="Download as">
          <Segmented
            options={FORMATS}
            value={settings.format}
            disabled={running}
            onChange={(format) => update({ format })}
          />
          <Hint>
            Automatic keeps JPEGs as JPEGs and sends PNG, still GIFs and BMP to
            WebP — re-encoding a PNG as a PNG usually makes it <em>bigger</em>,
            because it throws away whatever the original optimiser did.
            {animated && (
              <>
                {' '}
                An <em>animated</em> GIF is left as a GIF whichever of these you
                pick: WebP and JPEG here are single images, so converting one
                would quietly throw the animation away.
              </>
            )}
          </Hint>
        </Field>

        <Field label={`Quality — ${Math.round(settings.quality * 100)}%`}>
          <input
            type="range"
            min={30}
            max={95}
            step={5}
            value={Math.round(settings.quality * 100)}
            disabled={running}
            onChange={(e) => update({ quality: Number(e.target.value) / 100 })}
            className="w-full accent-orange-600 disabled:opacity-50"
            aria-label="Image quality"
          />
          <Hint>
            Below about 60% the softness starts to show on photographs.
            {animated && ' For an animated GIF this sets the size of the colour palette instead — 70% is 179 of the 255 colours the format allows.'}
          </Hint>
        </Field>

        <Field label="Longest edge">
          <Select
            options={EDGES}
            value={settings.maxEdge}
            disabled={running}
            onChange={(maxEdge) => update({ maxEdge })}
          />
          <Hint>Aspect ratio is preserved, and an image already smaller than this is left alone.</Hint>
        </Field>
      </Collapsible>
    </Panel>
  )
}
