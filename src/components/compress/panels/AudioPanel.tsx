import { useCompressStore } from '../../../stores/compressStore'
import { LEVELS, LEVEL_BLURB, type AudioFormat } from '../../../lib/types'
import { Blurb, Collapsible, Field, Hint, LevelPicker, Panel, Segmented, Toggle } from '../PanelParts'

const FORMATS: { value: AudioFormat; label: string }[] = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A (AAC)' },
]

const BITRATES: { value: number; label: string }[] = [
  { value: 64, label: '64' },
  { value: 96, label: '96' },
  { value: 128, label: '128' },
  { value: 192, label: '192' },
]

export default function AudioPanel({ count }: { count: string }) {
  const settings = useCompressStore((s) => s.audio)
  const running = useCompressStore((s) => s.running)
  const setLevel = useCompressStore((s) => s.setLevel)
  const update = useCompressStore((s) => s.updateAudio)

  const advanced = [
    settings.format === 'mp3' ? 'MP3' : 'M4A',
    `${settings.bitrateKbps} kbps`,
    settings.mono ? 'mono' : 'stereo',
  ].join(' · ')

  return (
    <Panel title="Audio" count={count}>
      <Field label="How hard to squeeze">
        <LevelPicker
          options={LEVELS}
          value={settings.level}
          disabled={running}
          onChange={(next) => setLevel('audio', next)}
        />
        <Blurb>{LEVEL_BLURB.audio[settings.level]}</Blurb>
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
            MP3 plays on everything ever made. M4A is the better codec at the same bitrate, and uses
            the browser’s own encoder rather than a downloaded one.
          </Hint>
        </Field>

        <Field label="Bitrate">
          <Segmented
            options={BITRATES}
            value={settings.bitrateKbps}
            disabled={running}
            onChange={(bitrateKbps) => update({ bitrateKbps })}
          />
          <Hint>
            kbps, constant. This is the whole size of the output: an hour at 128 kbps is about 58 MB,
            whatever went in.
          </Hint>
        </Field>

        <Toggle
          label="Mix down to mono"
          hint="Halves the size. Right for speech, wrong for music"
          on={settings.mono}
          disabled={running}
          onChange={(mono) => update({ mono })}
        />
      </Collapsible>

      <p className="text-[10.5px] leading-relaxed text-slate-400">
        Everything here is re-encoded, so a file that is already an MP3 at this bitrate will not get
        meaningfully smaller — and this app will hand you the original back rather than a slightly
        worse copy of the same size.
      </p>
    </Panel>
  )
}
