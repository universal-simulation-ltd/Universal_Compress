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

  if (kinds.length === 0) return <WaitingCard hasUnsupported={items.length > 0} />

  return (
    <div className="flex flex-col gap-4">
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
 * What sits in the column before anything has been dropped.
 *
 * An empty panel outline would be dead space. This says what the four engines
 * are, which doubles as the answer to "will it take my file?" — asked and
 * answered before anyone has to try it and find out.
 */
function WaitingCard({ hasUnsupported }: { hasUnsupported: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <span className="text-[12.5px] font-bold text-slate-900">
          {hasUnsupported ? 'Nothing here can be compressed' : 'The options appear here'}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          {hasUnsupported
            ? 'Every file in the list is one this app can’t open — the reason is on each row. Drop something below and its settings will appear here.'
            : 'Drop a file into the circle and the settings for that kind of file appear here. Drop several kinds at once and you get one set of settings for each.'}
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
            body="JPEG, PNG, WebP, AVIF, GIF and BMP — re-encoded and optionally resized."
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
 * The one button. It always says what happens next, and what happens next
 * depends only on the state of the queue — so there is never a moment with two
 * plausible primary actions on screen.
 */
export function PrimaryAction() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const compressAll = useCompressStore((s) => s.compressAll)
  const downloadAll = useCompressStore((s) => s.downloadAll)

  const t = totals(items)
  if (t.eligible === 0) return null

  const allDone = t.pending === 0 && t.done > 0

  return (
    <div className="flex w-full max-w-[340px] flex-col gap-2">
      {allDone ? (
        <button
          type="button"
          onClick={() => void downloadAll()}
          className="w-full rounded-xl bg-gradient-to-br from-[#FE8C01] to-[#E05504] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          {t.done === 1 ? 'Save the compressed file' : `Save all ${t.done} files as a ZIP`}
        </button>
      ) : (
        <button
          type="button"
          disabled={running || t.pending === 0}
          onClick={() => void compressAll()}
          className="w-full rounded-xl bg-gradient-to-br from-[#FE8C01] to-[#E05504] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running
            ? 'Compressing…'
            : t.pending === 1
              ? 'Compress 1 file'
              : `Compress ${t.pending} files`}
        </button>
      )}

      {t.done > 0 && !allDone && (
        <button
          type="button"
          disabled={running}
          onClick={() => void downloadAll()}
          className="w-full rounded-xl bg-orange-500/12 px-4 py-2.5 text-[13px] font-bold text-orange-800 transition-colors hover:bg-orange-500/20 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-40"
        >
          Save the {t.done} finished so far
        </button>
      )}

      <p className="text-center text-[10.5px] text-slate-400">
        Compressed files go straight to your downloads. Nothing is uploaded.
      </p>
    </div>
  )
}
