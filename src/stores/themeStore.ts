import { createThemeStore, type ThemePref } from '@unisim/sdk'

// The light/dark/system preference. The store itself lives in @unisim/sdk
// (createThemeStore, since 0.140.0) — this file only names the key. It opens
// LIGHT and stays light until the user chooses otherwise (the suite rule), even
// on a device set to dark: only an explicit Dark or System changes it.
//
// Since SDK 0.143 the key holds this app's OVERRIDE, chosen in App preferences
// (App.tsx passes this store to the navbar as `themeStore`). Absent — "Follow
// global" — the app uses the suite-wide colour scheme from Global preferences,
// `universal:color-scheme`, which is light until chosen.
//
// ⚠️ The key is every user's saved choice for this app. Renaming it silently
// puts them all back to following global. It is also written a second time, in the pre-paint script in
// `index.html` — `src/lib/theme.test.ts` fails if the two ever drift.
export type { ThemePref }

export const useThemeStore = createThemeStore('unisim-compress-theme')
