import { DEFAULT_UNIVERSAL_APPS_PRODUCTS, type SuiteProduct } from '@unisim/sdk'

/**
 * The suite-switcher catalogue, with Universal Compress spliced in.
 *
 * The navbar reads the product's DISPLAY NAME from this list — pass a catalogue
 * without a `compress` entry and the bar renders the logo with no name beside
 * it. The SDK's own `DEFAULT_UNIVERSAL_APPS_PRODUCTS` will carry this entry once
 * a release ships it; until then it is added here, so the app looks finished
 * from the first deploy rather than after an SDK round-trip.
 *
 * ⚠️ When the SDK does ship a `compress` entry, DELETE this file and drop the
 * `products` prop in App.tsx. Two catalogues that disagree is how a product ends
 * up with one name in the navbar and another in the switcher.
 */
const COMPRESS: SuiteProduct = {
  id: 'compress',
  name: 'Universal Compress',
  desc: 'Make any file smaller, on your device',
  href: 'https://opensource.unisim.co.uk/compress',
  category: 'everyday',
  glyph: (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4v6" />
        <path d="M12.5 6.5 16 10l3.5-3.5" />
        <path d="M16 28v-6" />
        <path d="M12.5 25.5 16 22l3.5 3.5" />
      </g>
      <rect x="6" y="14.5" width="20" height="3" rx="1.5" fill="currentColor" />
    </svg>
  ),
}

export const PRODUCTS: SuiteProduct[] = DEFAULT_UNIVERSAL_APPS_PRODUCTS.some((p) => p.id === 'compress')
  ? DEFAULT_UNIVERSAL_APPS_PRODUCTS
  : [...DEFAULT_UNIVERSAL_APPS_PRODUCTS, COMPRESS]
