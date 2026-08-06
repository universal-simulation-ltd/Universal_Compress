import { useEffect, useState } from 'react'
import type { MaxHeight, VideoQuality } from '@unisim/media'
import { videoSupported } from '../../../lib/compress/video'
import { useCompressStore } from '../../../stores/compressStore'
import { LEVELS, LEVEL_BLURB } from '../../../lib/types'
import { Blurb, Collapsible, Divider, Field, Hint, LevelPicker, Panel, Segmented, Select, Toggle } from '../PanelParts'

const HEIGHTS: { value: MaxHeight; label: string }[] = [
  { value: 'source', label: 'Keep the original size' },
  { value: 2160, label: '4K — 2160p' },
  { value: 1440, label: '1440p' },
  { value: 1080, label: 'Full HD — 1080p' },
  { value: 720, label: 'HD — 720p' },
  { value: 480, label: '480p' },
]

const QUALITIES: { value: VideoQuality; label: string }[] = [
  { value: 'small', label: 'Smaller' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'high', label: 'Best' },
]

const AUDIO_BITRATES: { value: number; label: string }[] = [
  { value: 96, label: '96' },
  { value: 128, label: '128' },
  { value: 192, label: '192' },
  { value: 256, label: '256' },
]

export default function VideoPanel({ count }: { count: string }) {
  const settings = useCompressStore((s) => s.video)
  const running = useCompressStore((s) => s.running)
  const setLevel = useCompressStore((s) => s.setLevel)
  const update = useCompressStore((s) => s.updateVideo)

  // H.264 through WebCodecs isn't everywhere, so support is probed rather than
  // assumed — a Firefox visitor is told before they press the button, not after
  // sitting through a run that was never going to work.
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    void videoSupported().then((ok) => {
      if (live) setSupported(ok)
    })
    return () => {
      live = false
    }
  }, [])

  const advanced: string[] = []
  if (settings.maxHeight !== 'source') {
    advanced.push(HEIGHTS.find((h) => h.value === settings.maxHeight)?.label ?? '')
  }
  advanced.push(QUALITIES.find((q) => q.value === settings.quality)?.label ?? '')
  if (!settings.keepAudio) advanced.push('Silent')

  return (
    <Panel title="Video" count={count}>
      <Field label="How hard to squeeze">
        <LevelPicker
          options={LEVELS}
          value={settings.level}
          disabled={running}
          onChange={(next) => setLevel('video', next)}
        />
        <Blurb>{LEVEL_BLURB.video[settings.level]}</Blurb>
      </Field>

      {supported === false && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-800">
          This browser has no WebCodecs H.264 encoder, so video can’t be
          compressed here — Chrome, Edge and Safari 16.4+ have one. PDFs, images
          and audio still work.
        </p>
      )}

      <Divider />

      <Collapsible label="Advanced" summary={advanced.filter(Boolean).join(' · ')}>
        <Field label="Resolution">
          <Select
            options={HEIGHTS}
            value={settings.maxHeight}
            disabled={running}
            onChange={(maxHeight) => update({ maxHeight })}
          />
          <Hint>
            Names the shorter edge, so a clip filmed upright stays upright. Never scaled up — a 720p
            source capped at 1080p is left alone.
          </Hint>
        </Field>

        <Field label="Quality">
          <Segmented
            options={QUALITIES}
            value={settings.quality}
            disabled={running}
            onChange={(quality) => update({ quality })}
          />
          <Hint>
            Sets the bitrate from the frame size and rate, so 4K and 720p each get a budget that suits
            them.
          </Hint>
        </Field>

        <Divider />

        <Toggle
          label="Keep the audio"
          hint="Re-encoded to AAC alongside the picture. Off writes a silent file"
          on={settings.keepAudio}
          disabled={running}
          onChange={(keepAudio) => update({ keepAudio })}
        />

        {settings.keepAudio && (
          <Field label="Audio bitrate">
            <Segmented
              options={AUDIO_BITRATES}
              value={settings.audioBitrateKbps}
              disabled={running}
              onChange={(audioBitrateKbps) => update({ audioBitrateKbps })}
            />
            <Hint>kbps, constant. 128 is plenty for anything but music.</Hint>
          </Field>
        )}
      </Collapsible>

      {/* Trimming is not here on purpose — see the note on VideoCompressSettings. */}
      <p className="text-[10.5px] leading-relaxed text-slate-400">
        Need to cut the clip down as well?{' '}
        <a
          href="https://opensource.unisim.co.uk/video"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-slate-500 underline-offset-2 hover:text-orange-600 hover:underline"
        >
          Universal Video
        </a>{' '}
        does that, with a preview.
      </p>
    </Panel>
  )
}
