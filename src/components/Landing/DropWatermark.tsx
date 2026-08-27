/**
 * The drop circle's backdrop — a file, pressed.
 *
 * Companion to Universal PDF's, Universal Images' and the Converter's versions
 * of this, and built to the same rule: STROKE ONLY, no fills. The ring's
 * interior is an opaque white circle, so a drawing with white or pale fills has
 * nothing left to show once it is knocked back to a fraction of full opacity —
 * thin lines are what survive.
 *
 * ⚠️ It must be rendered as a CHILD of <DropRing>, not behind it. DropRing
 * paints that white interior itself, so anything positioned behind the ring is
 * simply covered. As a child it lands above the fill and below the ring's own
 * copy, which follows it in the DOM.
 *
 * Deliberately empty through the middle band: the ring's four lines of copy sit
 * on top and have to stay the first thing read. Everything here is in the band
 * ABOVE them.
 */

/** One pass: the file, then the plates closing on it. */
const LOOP_MS = 9000

// ⚠️ pathLength={100} on every animated path, so the dash numbers below are
// PERCENTAGES of each stroke rather than measured lengths. Without it every
// value here would need re-deriving whenever a curve moved, and a wrong one
// does not error — it just leaves the stroke half-drawn.
const CSS = `
  .cw-file, .cw-fold, .cw-top, .cw-bottom {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation-duration: ${LOOP_MS}ms;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }
  @keyframes cw-draw {
    0%        { stroke-dashoffset: 100; opacity: 0; }
    4%        { opacity: 1; }
    22%, 82%  { stroke-dashoffset: 0; opacity: 1; }
    94%, 100% { stroke-dashoffset: 0; opacity: 0; }
  }
  .cw-file   { animation-name: cw-draw; animation-delay: 0ms; }
  .cw-fold   { animation-name: cw-draw; animation-delay: 400ms; }
  .cw-top    { animation-name: cw-draw; animation-delay: 1500ms; }
  .cw-bottom { animation-name: cw-draw; animation-delay: 1900ms; }

  /* ⚠️ Reduced motion gets the FINISHED drawing, not a slower loop and not
     frame 0 — frame 0 is an empty circle, the least useful still of the set.
     Same rule the other apps' watermarks follow. */
  @media (prefers-reduced-motion: reduce) {
    .cw-file, .cw-fold, .cw-top, .cw-bottom {
      animation: none;
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }
`

const INK = '#94a3b8' // slate-400 — the file
const ACCENT = '#f97316' // orange-500 — the press, which is what this app does

export default function DropWatermark() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true" focusable="false">
      <style>{CSS}</style>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* A page with its corner turned, portrait — "a file", the thing being
            pressed. Small and high, because the ring's own glyph and copy own
            the middle. */}
        <path
          className="cw-file"
          pathLength={100}
          d="M66 14 H50 a3 3 0 0 0-3 3 v22 a3 3 0 0 0 3 3 h20 a3 3 0 0 0 3-3 V21 Z"
          stroke={INK}
          strokeWidth="1.6"
        />
        <path className="cw-fold" pathLength={100} d="M66 14 v7 h7" stroke={INK} strokeWidth="1.6" />

        {/* The two plates closing on it — the accent, because the squeeze is the
            verb. Drawn as a bar plus a chevron each, so the direction is
            unmistakable at the size this is actually seen at. */}
        <path className="cw-top" pathLength={100} d="M38 6 H82 M55 8 l5 4 l5 -4" stroke={ACCENT} strokeWidth="2" />
        <path className="cw-bottom" pathLength={100} d="M38 50 H82 M55 48 l5 -4 l5 4" stroke={ACCENT} strokeWidth="2" />
      </g>
    </svg>
  )
}
