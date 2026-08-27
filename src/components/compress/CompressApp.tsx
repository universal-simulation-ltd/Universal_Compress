import { CONTAINER } from '../../lib/layout'
import { useCompressStore } from '../../stores/compressStore'
import LandingPage from '../Landing/LandingPage'
import DropCircle from './DropCircle'
import FileList from './FileList'
import OptionsColumn, { PrimaryAction } from './OptionsColumn'
import PrivacyStrip from './PrivacyStrip'

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
 * settings for whatever that turned out to be. There is no mode to choose and
 * no tab to find — the file picks the tools, which is the entire idea.
 *
 * At `lg` and below the two columns stack, and the order is already right:
 * circle, button, list, settings. Somebody who drops one photo and presses the
 * orange button never scrolls at all.
 */
export default function CompressApp() {
  // The whole queue, not a derived count: a selector returning `items.length`
  // is fine, but every other component here already subscribes to `items`, so
  // this adds no extra subscription and keeps one thing to reason about.
  const items = useCompressStore((s) => s.items)

  if (items.length === 0) return <LandingPage />

  return (
    <div className={`${CONTAINER} flex flex-col gap-4 py-5`}>
      <PrivacyStrip />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-5 rounded-xl border border-slate-200 bg-white px-4 py-8 sm:px-8">
            <DropCircle />
            {/* PrimaryAction owns its own wrapper so that when it renders
                nothing — the empty state — it contributes no flex child and no
                gap, and the card closes up under the circle. */}
            <PrimaryAction />
          </div>
          <FileList />
        </div>

        <OptionsColumn />
      </div>
    </div>
  )
}
