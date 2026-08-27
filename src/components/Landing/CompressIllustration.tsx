import { useEffect, useRef } from 'react'

/** One sweep of the loop, frame 0 → frame 10, in ms. It runs straight back down. */
const SWEEP_MS = 5200
/** The glide back to frame 0 when the pointer arrives. */
const RETURN_MS = 480

/** Ease in and out. Used on the clock, and again per element inside the CSS. */
const smoothstep = (x: number) => x * x * (3 - 2 * x)

/**
 * Its exact inverse — needed when the pointer leaves mid-glide. The clock is
 * the thing that keeps running, so resuming means asking "which clock position
 * shows the frame currently on screen?"; without it the illustration snaps.
 */
const unSmoothstep = (y: number) => 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3)

/**
 * The landing illustration: a small pile of files — a PDF, a photo and a video —
 * fans out, two press plates come down on it, the pile is squeezed to a bit over
 * a third of its size, and the line underneath drops from 14.2 MB to 5.4 MB.
 * Then it unwinds and does it again.
 *
 * WHY A PRESS AND NOT A CORNER HANDLE
 * -----------------------------------
 * Universal Images' illustration is a resize: a cursor takes a corner handle and
 * drags the picture smaller, and the numbers under it are PIXELS. This app never
 * changes the size of anything you can see — it changes the number of bytes. So
 * the gesture here is a press with no cursor in it at all (nobody drags a file
 * smaller), the three cards are three different KINDS of file, and the readout
 * is megabytes. Two sibling apps, two different verbs, one visual language.
 *
 * ONE CLOCK, NOT SIX ANIMATIONS
 * -----------------------------
 * Copied from `ImageIllustration.tsx`, deliberately: everything is a window on
 * a single `--t`, 0 → 1, set here and read by `index.css`. Separate
 * `@keyframes`/transitions cannot do what this needs — an element part way
 * through a `@keyframes` cannot be told to return to its own first frame
 * (`animation-play-state: paused` freezes it wherever it stands, and removing
 * the animation snaps it). With one number, "return to frame 0" is one glide.
 *
 * ⚠️ This clock is now written FOUR times — here, Universal Converter, Universal
 * Images and Universal PDF. It should go to `@unisim/sdk` as a hook rather than
 * be pasted a fifth time: the mechanics (the rAF, the park, the mid-glide
 * resume) are identical and only the scene each one drives is per-app. Left
 * backlogged rather than done here, because it means a package publish and four
 * dependency bumps to land a refactor with no user-visible change.
 *
 * WHY HOVER STOPS IT RATHER THAN STARTING IT
 * ------------------------------------------
 * This sits beside the drop circle, so the pointer arriving means the user is
 * reading or aiming, and a picture that keeps moving under the cursor competes
 * with the thing they came to click. It settles on frame 0 and stays there.
 */
export default function CompressIllustration() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = (t: number) => el.style.setProperty('--t', t.toFixed(4))

    // ⚠️ Reduced motion gets the FINISHED frame, not frame 0 and not a slower
    // loop. An infinite animation has no honest "reduced" version, and frame 0
    // is just a stack of files — the still that says least about what the app
    // does.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      set(1)
      return
    }

    let raf = 0
    let clock = 0 // 0 → 2. 0–1 squeezes the pile, 1–2 puts it back.
    let shown = 0 // the eased value last written, so a mid-glide exit can resume from it
    let last = 0
    let hovering = false
    let from = 0 // where the glide back to frame 0 started
    let since = 0 // ms into that glide

    function frame(now: number) {
      // A backgrounded tab stops firing rAF entirely; the first frame back
      // would otherwise carry the whole gap and jump the loop forward.
      const dt = Math.min(now - last, 100)
      last = now

      if (hovering) {
        since += dt
        shown = from * (1 - smoothstep(Math.min(since / RETURN_MS, 1)))
        set(shown)
        // Parked on frame 0 — stop asking for frames until the pointer leaves.
        if (since >= RETURN_MS) {
          raf = 0
          return
        }
      } else {
        clock = (clock + dt / SWEEP_MS) % 2
        shown = smoothstep(clock <= 1 ? clock : 2 - clock)
        set(shown)
      }
      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    function onEnter() {
      if (hovering) return
      hovering = true
      from = shown
      since = 0
      start()
    }

    function onLeave() {
      if (!hovering) return
      hovering = false
      // Pick up the clock wherever the glide left the picture, on the way up.
      clock = unSmoothstep(Math.min(Math.max(shown, 0), 1))
      start()
    }

    // Only on a real pointer. On a touch screen `pointerenter` fires on a tap
    // and there is no matching leave, which would park the loop for good.
    const canHover = window.matchMedia('(hover: hover)').matches
    if (canHover) {
      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerleave', onLeave)
    }
    start()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (canHover) {
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerleave', onLeave)
      }
    }
  }, [])

  return (
    <div ref={ref} className="cmp-illu relative w-full max-w-md aspect-square select-none">
      <svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cmp-plate-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FE8C01" />
            <stop offset="100%" stopColor="#E05504" />
          </linearGradient>
          <filter id="cmp-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.16" />
          </filter>
          {/* Shared by all three cards. They have identical local geometry — the
              fan is a transform on each card's own group, and a userSpaceOnUse
              clip travels with it — so one clip is enough for three. */}
          <clipPath id="cmp-card-clip">
            <rect x="145" y="155" width="210" height="150" rx="14" />
          </clipPath>
        </defs>

        {/* Where the pile started. It appears just before the press lands, so
            the squeeze has something to be smaller *than* — without it the
            cards only move, and a picture of a compression that shows no size
            change is the one thing this illustration must not be. */}
        <rect
          className="cmp-ghost"
          x="121"
          y="127"
          width="234"
          height="178"
          rx="16"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          strokeDasharray="7 7"
        />

        {/* The pile. One group, so the press acts on all three at once: this app
            takes a mixed drop and compresses the lot, which is the whole reason
            there are three cards and not one. */}
        <g className="cmp-stack" style={{ transformOrigin: '250px 230px' }}>
          <Card className="cmp-back cmp-back-2" chip="MP4" chipFill="#ede9fe" chipInk="#6d28d9" />
          <Card className="cmp-back cmp-back-1" chip="JPG" chipFill="#e0f2fe" chipInk="#0369a1" />
          <Card className="cmp-front" chip="PDF" chipFill="#fee2e2" chipInk="#b91c1c" front />
        </g>

        {/* The press. Three nested groups per plate, each a window on its own
            slice of the clock: arrive, squeeze, leave. One group cannot do it —
            the three moves overlap the pile's own window differently, and a
            single transform would have to be authored as their sum. */}
        <g className="cmp-plate-out cmp-plate-out-top">
          <g className="cmp-plate-in cmp-plate-in-top">
            <g className="cmp-plate-press cmp-plate-press-top">
              <rect x="112" y="76" width="276" height="24" rx="8" fill="url(#cmp-plate-fill)" />
              <g fill="none" stroke="#c2410c" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M178 106 l12 10 l12 -10" />
                <path d="M238 106 l12 10 l12 -10" />
                <path d="M298 106 l12 10 l12 -10" />
              </g>
            </g>
          </g>
        </g>

        <g className="cmp-plate-out cmp-plate-out-bottom">
          <g className="cmp-plate-in cmp-plate-in-bottom">
            <g className="cmp-plate-press cmp-plate-press-bottom">
              <rect x="112" y="336" width="276" height="24" rx="8" fill="url(#cmp-plate-fill)" />
              <g fill="none" stroke="#c2410c" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M178 330 l12 -10 l12 10" />
                <path d="M238 330 l12 -10 l12 10" />
                <path d="M298 330 l12 -10 l12 10" />
              </g>
            </g>
          </g>
        </g>

        {/* −62%, stamped into the space the pile just gave back. */}
        <g className="cmp-badge" style={{ transformOrigin: '378px 172px' }}>
          <rect x="330" y="150" width="96" height="44" rx="22" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <text x="378" y="180" textAnchor="middle" fontSize="21" fontWeight="700" fill="#059669" fontFamily="ui-sans-serif, system-ui">
            −62%
          </text>
        </g>

        {/* Before and after, in the same place, with a beat of nothing between
            them: crossfading two lines of text on top of each other is
            unreadable for the whole overlap. Megabytes, not pixels — nothing
            about the file you get back is any smaller to look at. */}
        <text className="cmp-size-before" x="250" y="402" textAnchor="middle" fontSize="17" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
          3 files · 14.2 MB
        </text>
        <text className="cmp-size-after" x="250" y="402" textAnchor="middle" fontSize="17" fontWeight="600" fill="#0f172a" fontFamily="ui-sans-serif, system-ui">
          3 files · 5.4 MB
        </text>
      </svg>
    </div>
  )
}

/**
 * One file in the pile. The two behind it carry a different type badge and
 * nothing else — they are read as "and these as well", not as documents in
 * their own right, and detail on them only competes with the front one.
 */
function Card({
  className,
  chip,
  chipFill,
  chipInk,
  front = false,
}: {
  className: string
  chip: string
  chipFill: string
  chipInk: string
  front?: boolean
}) {
  return (
    <g className={className} style={{ transformOrigin: '250px 230px' }}>
      <rect x="145" y="155" width="210" height="150" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" filter="url(#cmp-shadow)" />
      {/* A coloured band across the top, clipped to the card's rounded corners.
          It is what the fan actually REVEALS: the cards behind are otherwise
          three white slivers, and "a few files" is a weaker thing to say than
          "a video, a photo and a PDF, all at once". A type chip cannot do this
          job — the fan is nowhere near wide enough to clear one, and half a word
          of clipped text reads as a bug. */}
      <g clipPath="url(#cmp-card-clip)">
        <rect x="145" y="155" width="210" height="16" fill={chipInk} />
      </g>
      <rect x="163" y="185" width="60" height="26" rx="7" fill={chipFill} />
      <text x="193" y="204" textAnchor="middle" fontSize="15" fontWeight="700" fill={chipInk} fontFamily="ui-sans-serif, system-ui">
        {chip}
      </text>
      {front && (
        <>
          <rect x="235" y="192" width="102" height="11" rx="5.5" fill="#cbd5e1" />
          <rect x="163" y="234" width="174" height="11" rx="5.5" fill="#e2e8f0" />
          <rect x="163" y="256" width="174" height="11" rx="5.5" fill="#e2e8f0" />
          <rect x="163" y="278" width="118" height="11" rx="5.5" fill="#e2e8f0" />
        </>
      )}
    </g>
  )
}
