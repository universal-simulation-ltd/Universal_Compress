// Universal Compress brand icon — icon-only by design. The SDK's
// UniversalAppsNavBar renders the product name from its catalogue beside this
// slot, so a wordmark here would duplicate it.
//
// The mark: two arrows pressing in on a bar from above and below — squeeze, not
// download. It is the same drawing as the empty circle's glyph and the app icon;
// keep all three in sync.
export default function ProductLogo() {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-orange-600 text-white"
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-4.5 w-4.5" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4v6" />
          <path d="M12.5 6.5 16 10l3.5-3.5" />
          <path d="M16 28v-6" />
          <path d="M12.5 25.5 16 22l3.5 3.5" />
        </g>
        <rect x="6" y="14.4" width="20" height="3.2" rx="1.6" fill="currentColor" />
      </svg>
    </span>
  )
}
