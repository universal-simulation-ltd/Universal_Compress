import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// Universal Compress is served at opensource.unisim.co.uk/compress in
// production. `base` + PWA scope derive from Vite's `mode`; local dev stays `/`.
//
// ⚠️ Do NOT add cross-origin isolation headers here or in the portal Worker.
// `Cross-Origin-Embedder-Policy: require-corp` blocks the SDK navbar's org
// branding logos (plain <img> loads from Supabase Storage, no CORP header we
// control), so the visible symptom is a paying customer's logo silently
// vanishing. Nothing in this app wants SharedArrayBuffer — every codec here is
// the browser's own.
//
// ⚠️ And do NOT add ffmpeg.wasm. The only published core is GPL-2.0-or-later
// (it bundles libx264) and its .wasm is 30.7 MiB — past Cloudflare Pages'
// 25 MiB per-file limit, so it cannot even be self-hosted. Loading it from a
// CDN instead would put a 10 MB third-party request in the network tab of a
// page whose entire claim is that nothing leaves the device. The four engines
// here are: canvas (images), WebAudio + LAME (audio), WebCodecs via
// @unisim/media (video) and pdf-lib + pdf.js (PDF). None of them downloads a
// codec.
export default defineConfig(({ mode }) => {
  const BASE_PATH = mode === 'production' ? '/compress/' : '/'
  return {
    base: BASE_PATH,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      // Force a single React instance so @unisim/sdk's hooks share the same
      // dispatcher as the host app — without this Vite's dep optimizer can
      // bundle a second copy of React inside the SDK's pre-bundle, which
      // surfaces at runtime as "Invalid hook call".
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      exclude: ['@unisim/sdk']
    },
    // pdf.js's worker is imported with `?worker`; IIFE format gives iOS Safari a
    // classic blob-URL worker instead of an ES module worker, which it cannot
    // import. Same reason Universal PDF sets this.
    worker: {
      format: 'iife'
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'unisim-icon.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'Universal Compress',
          short_name: 'UniCompress',
          description: 'Drop any file, make it smaller — PDF, video, images and audio, compressed in your browser',
          theme_color: '#0f172a',
          background_color: '#f1f5f9',
          display: 'standalone',
          start_url: BASE_PATH,
          scope: BASE_PATH,
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'unisim-icon.png', sizes: '128x128', type: 'image/png', purpose: 'any' }
          ]
        },
        workbox: {
          // SPA navigations under the base path fall back to the prefixed shell.
          navigateFallback: `${BASE_PATH}index.html`,
          // pdf.js ships a ~1 MB worker chunk and LAME is ~250 KB; both are well
          // inside Workbox's 2 MB default, but the mapping files are not worth
          // precaching and nothing here is a wasm engine.
          //
          // ⚠️ The HEIC decoder is the biggest single chunk in the build (~3 MB)
          // and it stays OUT of the install-time precache. Precaching it would
          // hand that download to every visitor and undo the dynamic import in
          // `compress/image.ts`, which exists precisely so that people who never
          // drop an iPhone photo never pay for it. Same bargain, and the same
          // two rules, as Universal Converter.
          globIgnores: ['**/*.wasm', '**/heic-to-*.js'],
          runtimeCaching: [
            {
              // The HEIC decoder — cached after the first iPhone photo, so HEIC
              // input keeps working offline from then on.
              urlPattern: /\/assets\/heic-to-.*\.js$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'heic-to',
                expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
        },
        devOptions: { enabled: false }
      })
    ]
  }
})
