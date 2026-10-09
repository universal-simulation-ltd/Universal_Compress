import { useState } from 'react'
import { PrivacyNote } from '@unisim/sdk'
import DropCircle from '../compress/DropCircle'
import CompressIllustration from './CompressIllustration'
import { CONTAINER } from '../../lib/layout'
import { useThemeStore } from '../../stores/themeStore'
import { useCompressStore } from '../../stores/compressStore'

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
  const theme = useThemeStore((s) => s.effective)
  const addFiles = useCompressStore((s) => s.addFiles)
  const [loadingExample, setLoadingExample] = useState(false)

  // "Try with an example", as Universal Images and the others have it (James,
  // 2026-10-09): the one thing on this page you can press with nothing in
  // hand. The photo is bundled in `public/` (the same one Universal Images
  // ships), fetched from this app's own origin and queued exactly as a drop
  // would be — so the working screen it opens is the real one, not a demo.
  async function loadExample() {
    if (loadingExample) return
    setLoadingExample(true)
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}Example_Image.jpg`)
      if (!res.ok) throw new Error(`Failed to load the example photo (${res.status})`)
      const blob = await res.blob()
      addFiles([new File([blob], 'Example_Image.jpg', { type: blob.type || 'image/jpeg' })])
    } catch (err) {
      console.error(err)
      alert(`Couldn't load the example photo: ${(err as Error).message}`)
    } finally {
      setLoadingExample(false)
    }
  }

  return (
    <div className={`${CONTAINER} flex flex-col gap-4 py-5 lg:py-10`}>
      {/* Kept above the fold on the landing page too, deliberately. It is the
          first question anyone arriving from a search has, and moving it behind
          a drop would answer it only for people who had already taken the risk. */}
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-slate-100">
            Smaller files, <span className="text-orange-600 dark:text-orange-400">same quality</span>.
          </h1>
          {/* What goes in and where it happens, first. "The settings for
              whatever you dropped appear next to it" explained the next
              screen's layout to someone deciding whether to drop anything. */}
          <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
            Make PDFs, videos, photos and audio smaller, right here on your device. Drop one or many.
          </p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <DropCircle />

            <button
              type="button"
              onClick={() => void loadExample()}
              disabled={loadingExample}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-orange-400 hover:bg-orange-50/40 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:bg-orange-500/10"
            >
              <span aria-hidden="true">🧪</span>
              {loadingExample ? 'Loading example…' : 'Try with an example photo'}
            </button>

            <div className="mt-5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              <span>what it takes</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            </div>

            {/* The four engines, which doubles as the answer to "will it take my
                file?" — asked and answered before anyone has to drag a 2 GB
                video across to find out. The working screen's options column
                says the same thing at more length; here it is the short form,
                because the circle above it is the thing to read first. */}
            <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> PDF, scans included</li>
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> MP4, M4V, MOV</li>
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> JPEG, PNG, WebP, HEIC</li>
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> MP3, WAV, M4A, FLAC</li>
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> Mixed drops, one queue</li>
              <li className="flex items-center gap-2"><span className="text-orange-700 dark:text-orange-400">✓</span> Batch ZIP download</li>
            </ul>
          </div>

          {/* ⚠️ Under the card, NOT above the fold. It used to sit at the top of
              this page, and the illustration's compress animation swept its
              orange bars straight across the note — a privacy claim you cannot
              read for two seconds of every loop (James, screenshot, 2026-08-28).
              This is also the suite's placement everywhere else. */}
          <PrivacyNote
            className="mt-4"
            theme={theme}
            repo="https://github.com/universal-simulation-ltd/Universal_Compress"
            proof="https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/PRIVACY.md"
            subject="Your files"
            plural
          />
        </div>
      </div>
    </div>
  )
}
