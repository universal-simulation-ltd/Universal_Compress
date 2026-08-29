import { PrivacyNote } from '@unisim/sdk'
import { CONTAINER } from '../../lib/layout'
import { useCompressStore } from '../../stores/compressStore'
import LandingPage from '../Landing/LandingPage'
import DropCircle from './DropCircle'
import FileList from './FileList'
import KindStrip from './KindStrip'
import OptionsColumn, { ActionCard } from './OptionsColumn'

/**
 * Two screens, and the queue picks which one.
 *
 * With nothing dropped it is the landing page — illustration on the left,
 * headline and drop circle on the right, the same shape Universal PDF and
 * Universal Images open on. The working layout below used to serve as the empty
 * state as well, which meant a first-time visitor's whole right-hand column was
 * an outline explaining that settings would appear there once they did
 * something. See `../Landing/LandingPage.tsx`.
 *
 * THE WORKING SCREEN: one screen, two columns.
 *
 * Left is the circle and whatever has been dropped into it; right is the
 * settings for whatever that turned out to be, and every button. There is no
 * mode to choose and no tab to find — the file picks the tools, which is the
 * entire idea.
 *
 * ⚠️ **The left column answers "what have I got"; the right one is everything
 * that happens** (owner asks, 2026-08-29, over three passes). Left is the kind
 * tiles and the file list. Right is the settings — shut, one line each — then
 * the drop circle, then Compress and Download. The circle is DOWN there rather
 * than at the top left because "drop more" and "go" are the two things anyone
 * does from this screen twice, and they had ended up at opposite corners.
 *
 * At `lg` and below the two columns stack: tiles, list, settings, circle,
 * button. That order only works because the panels are shut by default — four
 * open ones would put the circle and the button below a screen of controls
 * nobody asked for.
 */
export default function CompressApp() {
  // The whole queue, not a derived count: a selector returning `items.length`
  // is fine, but every other component here already subscribes to `items`, so
  // this adds no extra subscription and keeps one thing to reason about.
  const items = useCompressStore((s) => s.items)

  if (items.length === 0) return <LandingPage />

  return (
    <div className={`${CONTAINER} flex flex-col gap-4 py-5`}>
      <PrivacyNote
        repo="https://github.com/universal-simulation-ltd/Universal_Compress"
        proof="https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/PRIVACY.md"
        subject="Your files"
        plural
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        {/* Left: what you dropped. The tiles wear the marks of the Universal
            Apps that own those formats, with a "+" tile that opens the picker;
            the list under them is the same queue file by file. */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-4 py-6 sm:px-8">
            <KindStrip />
          </div>
          <FileList />
        </div>

        {/* Right: what will happen to it, and the button that does it. The
            circle sits directly above the button (owner ask, 2026-08-29) —
            "drop more" and "go" are the two things anyone does from here, and
            they were at opposite ends of the page. */}
        <div className="flex flex-col gap-4">
          <OptionsColumn />
          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-4 py-6">
            <DropCircle />
          </div>
          <ActionCard />
        </div>
      </div>
    </div>
  )
}
