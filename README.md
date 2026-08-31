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
| **Images** | `.jpg` `.png` `.webp` `.avif` `.heic` `.gif` `.bmp` | JPEG / WebP / AVIF | the browser's canvas encoder |
| **Animated GIF** | `.gif` | `.gif`, still animated | ours — `src/lib/gif/`, no dependency |
| **Audio** | `.mp3` `.wav` `.m4a` `.flac` `.ogg` `.opus` `.aiff` | `.mp3` / `.m4a` | WebAudio + LAME (JS) or WebCodecs AAC |

Anything else stays in the list with a sentence explaining why it can't be
opened — a `.mkv` is told to remux, a `.zip` is told it is already compressed.
Files are never silently dropped.

### Animated GIFs

An animated GIF gets its own codec rather than the canvas path, because the
canvas path **destroyed it**: `createImageBitmap()` returns frame one of an
animation and gives no indication it dropped the rest, so a 4.2 MB animation
came out as a 2 KB still and the app reported "−100%" — its biggest saving — for
having thrown the file away.

No browser will read past frame one or write a GIF at all, so both halves are
here and neither has a dependency: `src/lib/gif/decode.ts` (block chain, LZW,
compositing, disposal methods, interlacing) and `src/lib/gif/encode.ts` (median-
cut palette, quantiser, LZW, frame differencing — forked from Universal
Converter's, which had no reader). The saving comes from a single global palette
narrowed by the quality slider, from sending only the rectangle that changes
between frames, from the longest-edge cap, and at Maximum from dropping every
second frame while keeping the animation's length.

Measured on two real screen recordings: 13% and 34% at Balanced, 15% and 44% at
Maximum. Both were already optimised; a GIF exported as whole frames does far
better.

**`npm run test:gif` is the check that matters** — it decodes real GIFs written
by other tools and compares every pixel against ffmpeg, then has ffmpeg read
back what we write. `npm test` covers the same code without needing ffmpeg
installed, but a reader and a writer that share a misunderstanding round-trip
perfectly and produce files nothing else can open, so an outside reader is the
only honest test.

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
