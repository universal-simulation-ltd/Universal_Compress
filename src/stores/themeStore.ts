import { createThemeStore, type ThemePref } from '@unisim/sdk'

// The light/dark/system preference. The store itself lives in @unisim/sdk
// (createThemeStore, since 0.140.0) — this file only names the key. It opens
// LIGHT and stays light until the user chooses otherwise (the suite rule), even
// on a device set to dark: only an explicit Dark or "Match my device" changes it.
//
// ⚠️ The key is every user's saved choice. Renaming it silently resets them all
// to light. It is also written a second time, in the pre-paint script in
// `index.html` — `src/lib/theme.test.ts` fails if the two ever drift.
export type { ThemePref }

export const useThemeStore = createThemeStore('unisim-compress-theme')
