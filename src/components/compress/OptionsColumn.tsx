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
      <ReadyCard />

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
 * The button under the circle. One job: run the queue.
 *
 * ⚠️ **It used to morph into the download when the run finished**, on the rule
 * that there is never a moment with two plausible primary actions on screen.
 * The download now lives in the settings column instead (owner ask, 2026-08-29
 * — see `ReadyCard`), and the rule it broke is paid for rather than ignored:
 * this button is never a download, so the two actions are never in the same
 * place at different times, and when the queue is empty it offers the one thing
 * that IS worth doing again — another run at a different strength, which is a
 * real choice now that each level shows the size it would produce.
 */
export function PrimaryAction() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const compressAll = useCompressStore((s) => s.compressAll)
  const requeueAll = useCompressStore((s) => s.requeueAll)

  const t = totals(items)
  if (t.eligible === 0) return null

  // ⚠️ `t.done === t.eligible`, NOT `t.pending === 0`. `pending` counts what is
  // QUEUED — the file currently being compressed is in neither count — so
  // halfway through a two-file run `pending === 0 && done > 0` is true and this
  // button announced "Compress again" over a run that was still going.
  const nothingLeft = t.done === t.eligible && t.done > 0

  return (
    <div className="flex w-full max-w-[340px] flex-col gap-2">
      <button
        type="button"
        disabled={running || (t.pending === 0 && t.done === 0)}
        onClick={() => (nothingLeft ? requeueAll() : void compressAll())}
        className="w-full rounded-xl bg-gradient-to-br from-[#FE8C01] to-[#E05504] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running
          ? 'Compressing…'
          : nothingLeft
            ? 'Compress again'
            : t.pending === 1
              ? 'Compress 1 file'
              : `Compress ${t.pending} files`}
      </button>

      <p className="text-center text-[10.5px] text-slate-400">
        {nothingLeft
          ? 'Change a strength above and run it again — nothing is uploaded.'
          : 'Compressed files go straight to your downloads. Nothing is uploaded.'}
      </p>
    </div>
  )
}

/**
 * The download, at the TOP of the settings column.
 *
 * Top rather than bottom for one reason, and it is the phone: below `lg` the
 * two columns stack as circle, button, list, settings — so a download card at
 * the foot of the column would sit under every panel, and finishing a run would
 * mean scrolling past the settings you already made to reach the file you came
 * for. At the top it lands directly after the list on a phone and directly
 * beside the finished rows on a desktop.
 *
 * It only exists once something has finished, so nothing is pushed down until
 * there is a reason to push it.
 */
function ReadyCard() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const downloadAll = useCompressStore((s) => s.downloadAll)

  const t = totals(items)
  if (t.done === 0) return null

  const saved = savingPercent(t.bytesInDone, t.bytesOutDone)

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60">
      <div className="flex items-center gap-2.5 border-b border-orange-200/70 px-4 py-3">
        <span className="text-[12.5px] font-bold text-slate-900">
          {t.done === t.eligible ? 'Ready to download' : `${t.done} ready so far`}
        </span>
        <span className="ml-auto font-mono text-[11px] text-slate-500 tabular-nums">
          {formatBytes(t.bytesInDone)} → {formatBytes(t.bytesOutDone)}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <button
          type="button"
          disabled={running}
          onClick={() => void downloadAll()}
          className="w-full rounded-xl bg-gradient-to-br from-[#FE8C01] to-[#E05504] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.done === 1 ? 'Download the compressed file' : `Download all ${t.done} files as a ZIP`}
        </button>
        <p className="text-center text-[10.5px] text-slate-500">
          {saved >= 1
            ? `${saved}% smaller than what you dropped.`
            : 'These were already about as small as they go.'}
        </p>
      </div>
    </div>
  )
}
