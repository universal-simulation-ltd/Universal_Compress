import React from 'react'
import ReactDOM from 'react-dom/client'
import { UniversalProvider } from '@unisim/sdk'
import App from './App'
import { useCompressStore } from './stores/compressStore'
import './index.css'

if (import.meta.env.DEV) {
  ;(window as unknown as { __stores: unknown }).__stores = { compress: useCompressStore }
}

// Universal Compress never sends a byte of anyone's file anywhere. We still
// mount <UniversalProvider> so the shared navbar works and, when the visitor is
// signed in on .unisim.co.uk, the navbar shows their profile/avatar and their
// suite-wide language choice.
//
// The fallback is the REAL public suite project (publishable anon key — safe to
// ship; RLS is the security boundary). Env vars override.
//
// ⚠️ 'compress' AND THE product_code ENUM — read before changing `product`.
//
// `useUsageTracker()` inserts into usage_events with `product: config.product`,
// and product_code is a Postgres ENUM. A value the enum doesn't have makes every
// insert FAIL — silently, and only for SIGNED-IN visitors, so a no-signup app
// looks perfectly healthy in exactly the state most people use it in. Universal
// Converter and Universal USB both shipped that way and lost every usage event
// from launch until migration 0107 caught it, months later.
//
// DONE 2026-08-06, both halves:
//
//   1. Migration `0114_product_code_compress.sql` is APPLIED to prod.
//   2. 'compress' is in `ProductCode` (packages/sdk/src/types.ts), in
//      `SuiteProductId` + the catalogue (SuiteSwitcher.tsx) and in
//      `UNIVERSAL_APP_PRODUCTS` (provider.tsx) — shipped in @unisim/sdk 0.87.0.
//
// So `product: 'compress'` below type-checks **because the union really contains
// it**, not because a cast talked the compiler out of an objection. Never write
// `as ProductCode` here: that cast is exactly what let the Converter/USB bug
// survive to production. If the type ever fights you, it is telling you the enum
// is missing a value — go and add it.
const universalConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://rygfxgalojojppxmhddo.supabase.co',
  supabaseAnonKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Z2Z4Z2Fsb2pvanBweG1oZGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTY4MjUsImV4cCI6MjA5NDMzMjgyNX0.hLy_vt9vY_rdPKF3nL32yAuMCD604E3CH5VM7D7CaNE',
  product: 'compress' as const,
  cookieDomain: import.meta.env.PROD ? '.unisim.co.uk' : undefined,
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UniversalProvider config={universalConfig}>
      <App />
    </UniversalProvider>
  </React.StrictMode>,
)
