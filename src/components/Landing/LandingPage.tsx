import { PrivacyNote } from '@unisim/sdk'
import DropCircle from '../compress/DropCircle'
import CompressIllustration from './CompressIllustration'
import { CONTAINER } from '../../lib/layout'

/**
 * What the app opens on, before anything has been dropped.
 *
 * The same shape Universal PDF and Universal Images land on: the animated
 * illustration on the left, the headline and the drop circle on the right. It
 * replaced the working two-column screen — circle on the left, an outline of a
 * settings column on the right — which was the right layout for someone WITH
 * files and an odd first impression for someone without, because half the page
 * was a panel explaining that a panel would appear there later.
 *
 * ⚠️ It is the empty state, not a separate route. `CompressApp` swaps to the
 * working layout the moment the queue is non-empty, and the circle here is the
 * SAME `DropCircle` component that lives in that layout — not a copy of it — so
 * the front door cannot drift between the two screens, and a drop does not have
 * to be handled twice.
 */
export default function LandingPage() {
  return (
    <div className={`${CONTAINER} flex flex-col gap-4 py-5 lg:py-10`}>
      {/* Kept above the fold on the landing page too, deliberately. It is the
          first question anyone arriving from a search has, and moving it behind
          a drop would answer it only for people who had already taken the risk. */}
      <PrivacyNote
        repo="https://github.com/universal-simulation-ltd/Universal_Compress"
        subject="Your files"
        plural
        badge="on-device · works offline"
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Desktop keeps the illustration as its own column. On a phone it is
            hidden rather than stacked: as a block above or below it is a full
            screen-height of scrolling on either side of the primary action,
            which is what stops a landing page fitting on one screen. */}
        <div className="order-2 hidden min-w-0 flex-col items-center gap-4 lg:order-1 lg:flex lg:items-start">
          <CompressIllustration />
        </div>

        {/* ⚠️ min-w-0 is load-bearing, not tidying. A grid item defaults to
            `min-width: auto`, so its min-content width becomes a floor the
            track cannot go below — one long unbreakable word would otherwise
            lay the whole column out wider than the phone. */}
        <div className="order-1 min-w-0 lg:order-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Smaller files, <span className="text-orange-600">same quality</span>.
          </h1>
          <p className="mt-3 max-w-md text-slate-600">
            Drop one or many, of any kind. The settings for whatever you dropped appear next to it.
          </p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <DropCircle />

            <div className="mt-5 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
              <span>what it takes</span>
              <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            </div>

            {/* The four engines, which doubles as the answer to "will it take my
                file?" — asked and answered before anyone has to drag a 2 GB
                video across to find out. The working screen's options column
                says the same thing at more length; here it is the short form,
                because the circle above it is the thing to read first. */}
            <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> PDF — repack or rasterise</li>
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> MP4, M4V, MOV</li>
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> JPEG, PNG, WebP, AVIF</li>
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> MP3, WAV, M4A, FLAC</li>
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> Mixed drops, one queue</li>
              <li className="flex items-center gap-2"><span className="text-orange-700">✓</span> Batch ZIP download</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
