import { useCompressStore } from '../../../stores/compressStore'
import { LEVELS, LEVEL_BLURB, type ImageFormat, type MaxEdge } from '../../../lib/types'
import { Blurb, Collapsible, Field, Hint, LevelPicker, Panel, Segmented, Select } from '../PanelParts'

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
  const setLevel = useCompressStore((s) => s.setLevel)
  const update = useCompressStore((s) => s.updateImage)

  const advanced = [
    FORMATS.find((f) => f.value === settings.format)?.label ?? '',
    `${Math.round(settings.quality * 100)}% quality`,
    settings.maxEdge === 'source' ? 'original size' : `${settings.maxEdge} px`,
  ].join(' · ')

  return (
    <Panel title="Images" count={count}>
      <Field label="How hard to squeeze">
        <LevelPicker
          options={LEVELS}
          value={settings.level}
          disabled={running}
          onChange={(next) => setLevel('image', next)}
        />
        <Blurb>{LEVEL_BLURB.image[settings.level]}</Blurb>
      </Field>

      <Collapsible label="Advanced" summary={advanced}>
        <Field label="Save as">
          <Segmented
            options={FORMATS}
            value={settings.format}
            disabled={running}
            onChange={(format) => update({ format })}
          />
          <Hint>
            Automatic keeps JPEGs as JPEGs and sends PNG, GIF and BMP to WebP —
            re-encoding a PNG as a PNG usually makes it <em>bigger</em>, because it
            throws away whatever the original optimiser did.
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
          <Hint>Below about 60% the softness starts to show on photographs.</Hint>
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
