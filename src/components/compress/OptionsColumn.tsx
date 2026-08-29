import { formatBytes, savingPercent } from '../../lib/layout'
import { kindLabel } from '../../lib/kinds'
import { useCompressStore, kindsPresent, totals } from '../../stores/compressStore'
import PdfPanel from './panels/PdfPanel'
import VideoPanel from './panels/VideoPanel'
import ImagePanel from './panels/ImagePanel'
import AudioPanel from './panels/AudioPanel'

/**
 * The column that adapts.
 *
 * There are no tabs and no format switcher, because the file already answered
 * that question. Drop a PDF and this column is a PDF panel; drop a PDF and four
 * photos and it is two panels, each governing its own half of the queue. Nothing
 * is on screen that has nothing to act on.
 */
export default function OptionsColumn() {
  const items = useCompressStore((s) => s.items)
  const kinds = kindsPresent(items)

  // Reachable only when everything dropped is a file this app can't open: the
  // queue being empty is the landing page's state now, not this screen's.
  if (kinds.length === 0) return <NothingUsableCard />

  return (
    <div className="flex flex-col gap-4">
      <ActionCard />

      {kinds.map((kind) => {
        const count = kindLabel(kind, items.filter((i) => i.kind === kind).length)
        switch (kind) {
          case 'video':
            return <VideoPanel key={kind} count={count} />
          case 'pdf':
            return <PdfPanel key={kind} count={count} />
          case 'image':
            return <ImagePanel key={kind} count={count} />
          case 'audio':
            return <AudioPanel key={kind} count={count} />
        }
      })}
    </div>
  )
}

/**
 * What sits in the column when a drop landed but none of it can be compressed.
 *
 * It used to double as the before-anything-is-dropped state, saying "the
 * options appear here" — but an empty queue is the landing page now (see
 * `../Landing/LandingPage.tsx`), so this card has one job and can say the one
 * true thing rather than picking between two.
 *
 * It still lists the four engines, which is the answer to the question the
 * person reading it has just been handed: not "will it take my file?" but
 * "what WOULD it have taken?".
 */
function NothingUsableCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <span className="text-[12.5px] font-bold text-slate-900">Nothing here can be compressed</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Every file in the list is one this app can’t open — the reason is on each row. Drop
          something below and its settings will appear here.
        </p>
        <ul className="flex flex-col gap-2">
          <Capability
            label="PDF"
            body="Repack losslessly, or rasterise the pages. Big wins on scans."
          />
          <Capability
            label="Video"
            body="MP4, M4V and MOV re-encoded to H.264 by the browser’s own hardware encoder."
          />
          <Capability
            label="Images"
            body="JPEG, PNG, WebP, AVIF, HEIC, GIF and BMP — re-encoded and optionally resized."
          />
          <Capability
            label="Audio"
            body="MP3, WAV, M4A, FLAC, OGG and AIFF re-encoded to MP3 or M4A."
          />
        </ul>
      </div>
    </div>
  )
}

function Capability({ label, body }: { label: string; body: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex h-5 w-11 shrink-0 items-center justify-center rounded bg-slate-100 text-[9.5px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-[11px] leading-relaxed text-slate-500">{body}</span>
    </li>
  )
}

/**
 * Both actions, in one card at the top of the settings column.
 *
 * ⚠️ **Neither of these lives under the circle any more** (owner asks,
 * 2026-08-29, in two steps). First the download moved off the left button,
 * which used to morph between the two; then Compress followed it across, so the
 * right-hand column owns every action and the left-hand one is purely what you
 * dropped (`DropCircle` + `KindStrip`).
 *
 * One card rather than two stacked ones because at most one thing is worth
 * doing next, and it should look like it: whatever that is takes the orange
 * button, and the other becomes a quiet second row. Two gradient buttons on top
 * of each other is the shape of a screen that cannot decide.
 *
 * Top of the column rather than bottom is a phone decision: below `lg` the two
 * columns stack as circle, tiles, list, settings — so a card at the foot would
 * put the button under every panel, and someone who dropped one photo would
 * have to scroll past settings they never wanted in order to press Compress.
 */
export function ActionCard() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const compressAll = useCompressStore((s) => s.compressAll)
  const requeueAll = useCompressStore((s) => s.requeueAll)
  const downloadAll = useCompressStore((s) => s.downloadAll)

  const t = totals(items)
  if (t.eligible === 0) return null

  // ⚠️ `t.done === t.eligible`, NOT `t.pending === 0`. `pending` counts what is
  // QUEUED — the file currently being compressed is in neither count — so
  // halfway through a two-file run `pending === 0 && done > 0` is true, and a
  // card keyed on it announced "Ready to download" over a run still going.
  const allDone = t.done === t.eligible && t.done > 0
  const saved = savingPercent(t.bytesInDone, t.bytesOutDone)

  const compressLabel = running
    ? 'Compressing…'
    : allDone
      ? 'Compress again'
      : t.pending === 1
        ? 'Compress 1 file'
        : `Compress ${t.pending} files`

  const downloadLabel =
    t.done === 1 ? 'Download the compressed file' : `Download all ${t.done} files as a ZIP`

  const primary =
    'w-full rounded-xl bg-gradient-to-br from-[#FE8C01] to-[#E05504] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40'
  const secondary =
    'w-full rounded-xl bg-orange-500/12 px-4 py-2.5 text-[13px] font-bold text-orange-800 transition-colors hover:bg-orange-500/20 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className={`rounded-xl border ${
        t.done > 0 ? 'border-orange-200 bg-orange-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div
        className={`flex items-center gap-2.5 border-b px-4 py-3 ${
          t.done > 0 ? 'border-orange-200/70' : 'border-slate-200'
        }`}
      >
        <span className="text-[12.5px] font-bold text-slate-900">
          {t.done === 0
            ? 'Ready to compress'
            : allDone
              ? 'Ready to download'
              : `${t.done} ready so far`}
        </span>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-slate-400">
          {t.done > 0
            ? `${formatBytes(t.bytesInDone)} → ${formatBytes(t.bytesOutDone)}`
            : formatBytes(t.bytesIn)}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {/* Whichever is the thing to do next gets the orange. Once anything has
            finished that is the download — the compressing is behind you and
            the file is the reason you came. */}
        {t.done > 0 ? (
          <>
            <button type="button" disabled={running} onClick={() => void downloadAll()} className={primary}>
              {downloadLabel}
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => (allDone ? requeueAll() : void compressAll())}
              className={secondary}
            >
              {compressLabel}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={running || t.pending === 0}
            onClick={() => void compressAll()}
            className={primary}
          >
            {compressLabel}
          </button>
        )}

        <p className="text-center text-[10.5px] text-slate-500">
          {t.done === 0
            ? 'Compressed files go straight to your downloads. Nothing is uploaded.'
            : saved >= 1
              ? `${saved}% smaller than what you dropped.`
              : 'These were already about as small as they go.'}
        </p>
      </div>
    </div>
  )
}
