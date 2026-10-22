import type { AboutAppConfig } from '@unisim/sdk'
// Generated — `npm run credits` after any dependency change. Never edit it by
// hand: it is read off the installed tree, so a hand-kept list drifts from the
// lockfile the first time anyone upgrades anything, and a credits list naming a
// package we removed is worse than no list at all.
import credits from '../generated/credits.json'

export const REPO_URL = 'https://github.com/universal-simulation-ltd/Universal_Compress'

// "About this app": drawn by the SDK at the foot of "Tune this app" on the
// website (SDK 0.161.0), and as a page of its own on the phone
// (`src/native/screens.tsx`).
export const ABOUT: AboutAppConfig = {
  repo:    REPO_URL,
  proof:   'https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/PRIVACY.md',
  subject: 'Your files',
  plural:  true,
  version: __APP_VERSION__,
  credits,
  noticesHref: 'https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/THIRD-PARTY-NOTICES.md',
}
