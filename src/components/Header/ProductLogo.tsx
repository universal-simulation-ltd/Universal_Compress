// GENERATED FILE — do not edit by hand.
// Source: backoffice/universal-platform/scripts/app-marks/marks.mjs
// Regenerate: node scripts/app-marks/build.mjs (from backoffice/universal-platform)
// Mark: Universal Compress — Two arrows pressing in on a bar. Squeeze, not download.
// Hover: The jaws close and the slab gives.
//
// Icon-only by design: the SDK's UniversalAppsNavBar renders the product name
// from its catalogue beside this slot, so a wordmark here would print it twice.

const CSS = `
  /* Resting states */
  .uam-compress-jaws { transform: translateY(0); transition: transform .45s cubic-bezier(0.16,1,0.3,1); }
  .uam-compress-jawsLower { transform: translateY(0); transition: transform .45s cubic-bezier(0.16,1,0.3,1); }
  .uam-compress-slab { transform: scaleY(1); transition: transform .45s cubic-bezier(0.16,1,0.3,1); transform-origin: center; transform-box: fill-box; }

  /* Active states */
  .uam-host-compress:hover .uam-compress-jaws,
  .uam-host-compress:focus-visible .uam-compress-jaws { transform: translateY(5px); }
  .uam-host-compress:hover .uam-compress-jawsLower,
  .uam-host-compress:focus-visible .uam-compress-jawsLower { transform: translateY(-5px); }
  .uam-host-compress:hover .uam-compress-slab,
  .uam-host-compress:focus-visible .uam-compress-slab { transform: scaleY(0.62); }

  @media (prefers-reduced-motion: reduce) {
    .uam-compress-jaws,
    .uam-compress-jawsLower,
    .uam-compress-slab { transition: none !important; }
  }
`

export default function ProductLogo() {
  return (
    <span
      className="uam-host-compress inline-flex h-6 w-6 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <style>{CSS}</style>
      <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
        <rect x="0" y="0" width="64" height="64" rx="14" fill="#0f172a" />
        <g fill="none" strokeWidth={4.8} strokeLinecap="round" strokeLinejoin="round" stroke="#fe8c01" className="uam-compress-jaws">
          <path d="M32 10v12" />
          <path d="M25.2 15.2 32 22l6.8-6.8" />
        </g>
        <g fill="none" strokeWidth={4.8} strokeLinecap="round" strokeLinejoin="round" stroke="#fe8c01" className="uam-compress-jawsLower">
          <path d="M32 54V42" />
          <path d="M25.2 48.8 32 42l6.8 6.8" />
        </g>
        <rect x={13} y={29.2} width={38} height={5.6} rx={2.8} fill="#ff9a1f" className="uam-compress-slab" />
      </svg>
    </span>
  )
}
