# Universal Compress

**Drop any file, make it smaller.** PDFs, video, images and audio — compressed
entirely in your browser. Nothing is uploaded.

Live at **[opensource.unisim.co.uk/compress](https://opensource.unisim.co.uk/compress)**.

---

## The idea

Every "compress your PDF online" result is the same site with a different logo:
you upload your file to somebody's server, they squeeze it, and you download it
back. That works, and it means your tax return, your NDA and your kid's birthday
video all sat on a stranger's disk for a while.

This one doesn't upload anything. The four engines it uses are all already in the
browser you are reading this in.

There is one drop target — a circle — and it takes anything. What you dropped
decides what the options column shows: drop a PDF and you get PDF settings, drop
a PDF and four photos and you get one panel for each. There is no format to pick
first and no tab to find.

And there is one control that matters — **Light / Balanced / Maximum** — asked
once, in the same words, for every kind of file. Each engine translates that into
whatever its own knobs happen to be. Everything under *Advanced* is for people
who already know which knob they want; nobody has to open it.

## What it compresses

| Kind | In | Out | Engine |
|---|---|---|---|
| **PDF** | `.pdf` | `.pdf` | `pdf-lib` (lossless repack) or `pdf.js` + JPEG (rasterise) |
| **Video** | `.mp4` `.m4v` `.mov` | `.mp4` (H.264 + AAC) | WebCodecs, via [`@unisim/media`](https://www.npmjs.com/package/@unisim/media) |
| **Images** | `.jpg` `.png` `.webp` `.avif` `.gif` `.bmp` | JPEG / WebP / AVIF | the browser's canvas encoder |
| **Audio** | `.mp3` `.wav` `.m4a` `.flac` `.ogg` `.opus` `.aiff` | `.mp3` / `.m4a` | WebAudio + LAME (JS) or WebCodecs AAC |

Anything else stays in the list with a sentence explaining why it can't be
opened — a `.mkv` is told to remux, a `.zip` is told it is already compressed.
Files are never silently dropped.

### Two things it deliberately will not do

- **It won't trim your video.** Cutting a clip down is
  [Universal Video](https://opensource.unisim.co.uk/video)'s job, and it does it
  properly, with a preview and a timeline. A pair of naked start/end boxes here
  would be the worse half of that feature.
- **It won't hand you back something bigger.** Re-encoding an already-optimised
  JPEG or a tightly-packed PDF routinely produces a *larger* file. When that
  happens the original is returned instead and the row says so.

## Running it locally

```bash
cd D:/Github/UNISIM/Universal_Apps/Universal_Compress   # or the Mac equivalent
npm install
npm run dev -- --port 5200 --strictPort
```

Or `./scripts/preview.sh` / `.\scripts\preview.ps1`, which do the same and
install on first run. Port 5200 is this app's slot in the suite's port registry.

Video compression needs a browser with a **WebCodecs H.264 encoder** — Chrome,
Edge, or Safari 16.4+. Firefox loads the page and says so in the video panel;
PDFs, images and audio work everywhere.

Nothing here needs the internet. There is no engine to download and no file is
ever sent.

```bash
npm run typecheck   # tsc -b --noEmit
npm run build       # tsc -b && vite build
```

## Licence

MIT. See [LICENSE](LICENSE).

Part of the [Universal Simulation](https://www.unisim.co.uk) suite — the
Universal Apps are free forever and open source.
