import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'The basics',
    title: 'What compression actually does',
    summary: 'How a file can hold the same thing in fewer bytes.',
    body: `Every file on your device is a long row of numbers called bytes. Compression is the art of describing the same thing with fewer of them.

## Spotting patterns

Most files are full of repetition. A page of text uses the same words again and again. A photo of a blue sky has thousands of neighbouring pixels that are almost the same colour. A recording of someone talking has long stretches of near-silence.

A compressor looks for those patterns and writes them down in shorthand. Instead of storing "blue, blue, blue, blue" a thousand times, it can store "blue, a thousand times". The file that comes out is smaller, and a program that understands the shorthand can rebuild the picture, the sound or the page when you open it.

## Leaving out what you would not notice

Pictures, video and sound can be squeezed much further by also throwing away detail that people are unlikely to notice: tiny shifts of colour, sounds masked by louder ones, fine texture in a fast-moving scene. This is where the really large savings come from, and it is also where quality can suffer if it is pushed too hard.

## Why it matters

Smaller files are quicker to send, fit under email attachment limits, take up less room on your phone and load faster on a web page. The trade-off is always the same question: how much are you willing to give up to get there? Universal Compress asks that question once, as **Light**, **Balanced** or **Maximum**, and works out the details for each kind of file.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'The basics',
    title: 'Lossless and lossy compression',
    summary: 'The difference between repacking a file and re-encoding it.',
    body: `There are two families of compression, and knowing which one is at work tells you what to expect from the result.

## Lossless

Lossless compression keeps every byte of the original. When the file is opened, it is rebuilt exactly as it was, down to the last detail. ZIP archives work this way, and so does the PNG image format.

The catch is that the savings are limited. You can only remove repetition, and once it has been removed there is nothing left to take.

## Lossy

Lossy compression rebuilds something that looks or sounds very close to the original, but not identical. JPEG photos, MP3 and AAC audio, and nearly all video work this way. Because detail is discarded for good, lossy formats can make files many times smaller.

Two things follow from that:

- **The loss is permanent.** Compressing a copy is fine; keep the original if you might need full quality later.
- **Repeating it adds up.** Each round of lossy compression throws a little more away, so compressing an already-compressed file again usually costs quality for a small saving.

## In Universal Compress

- A PDF at **Light** is repacked losslessly. Text stays selectable and searchable, and the saving is usually modest.
- A PDF at **Balanced** or **Maximum** turns each page into a picture. The saving is often large, especially for scans, but the text can no longer be selected or searched.
- Images, video and audio are re-encoded with lossy formats. The level you choose sets how much detail is traded for size, and the options under Advanced let you set the exact values yourself.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'The basics',
    title: 'Why some files barely shrink',
    summary: 'Already-compressed files, and why ZIPs are turned away.',
    body: `Sometimes you compress a file and it comes out almost the same size, or even larger. That is not a fault. It usually means the file was already compressed.

## Compression only works once

Compression works by removing repetition. Once that has been done well, the result looks almost random, and random data has no patterns left to remove. Running it through a second compressor finds nothing to do, and the extra bookkeeping can even make it slightly bigger.

Files that are usually already compressed include:

- **Archives** such as ZIP, RAR, 7z and .gz.
- **Office documents** in the modern Word, Excel and PowerPoint formats, which are ZIP archives inside.
- **Photos and video** straight from a phone, which are already stored in lossy formats.
- **PDFs** made carefully by the program that produced them.

## What Universal Compress does about it

- It does not try to compress ZIP, RAR, 7z or .gz archives, or Word, Excel and PowerPoint files. It keeps them in the list with a sentence explaining why. For a slide deck or a document, exporting it to PDF first and compressing that is often the better route.
- If compressing a file would make it the same size or bigger, the app gives you back **your original file** and says so on its row, rather than handing you something worse.
- Before you start, each level shows an estimate of the size it would produce, so you can see in advance whether a stronger setting is worth it.

## Getting a bigger saving

If a photo or video barely shrinks at Light, try Balanced or Maximum. These also make the picture smaller in pixels, which is usually where the real saving is. For a PDF made of scanned pages, Balanced often makes a large difference.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'How it works',
    title: 'How Universal Compress works',
    summary: 'One strength setting, translated for each kind of file.',
    body: `Drop in any mix of files and the app sorts them by kind: PDFs, videos, images and audio. Each kind gets its own panel of options, but they all share one control.

## Light, Balanced, Maximum

The strength control asks the same question for every file: how hard should it squeeze? Each kind of file then turns your answer into its own settings:

- **PDF.** Light repacks the file losslessly. Balanced turns pages into images at print resolution. Maximum does the same at screen resolution.
- **Video.** Light keeps the original frame size. Balanced limits the picture to 1080p and lowers the bitrate. Maximum limits it to 720p with the lowest bitrate.
- **Images.** Light re-encodes at high quality and full size. Balanced limits the longest edge to 2560 pixels. Maximum limits it to 1600 pixels at lower quality.
- **Audio.** Light is 192 kbps, Balanced 128 kbps, and Maximum 96 kbps mixed down to mono.

For video, images and audio, everything a level chooses is shown under **Advanced**, where you can change any of it.

## A few things worth knowing

- **Output formats.** Video comes out as MP4. Audio comes out as MP3 or M4A. JPEG and WebP photos keep their format by default, and AVIF does too where the browser can write it. PNG, BMP, still GIF and iPhone HEIC images become WebP by default, because that is usually far smaller. You can choose JPEG or WebP instead.
- **Animated GIFs stay animated.** They get their own treatment, and at Maximum every second frame is dropped while the animation keeps its length.
- **Video needs a capable browser.** Video compression uses the browser's built-in video encoder, found in Chrome, Edge and Safari 16.4 or later. PDFs, images and audio work in any modern browser.
- **Some video containers are not supported.** MP4, M4V and MOV work. MKV, WebM, AVI, WMV and FLV need converting to MP4 first.
- **Nothing to hand?** **Try with an example photo**, on the first screen, loads a sample photo that comes with the app, so you can see what it does before using your own files. Like everything else, it never leaves your device.
- **Saving.** Download files one at a time, or all at once as a ZIP. That ZIP only bundles the results together; it does not squeeze them any further.
- **Try again freely.** Change the level and compress the whole list again to compare sizes.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Privacy and security',
    title: 'Your files stay on your device',
    summary: 'What is sent to a server, and what never is.',
    body: `Universal Compress does all of its work on your own device. Your files are not uploaded anywhere to be compressed.

## Where the work happens

When you drop a file in, it is read by the app running on your device. PDFs are handled by open-source PDF libraries running in the app. Images are re-encoded by your browser's own image tools. Video uses your browser's built-in video encoder. Audio is decoded by your browser and encoded by an MP3 or AAC encoder running in the app. The results are saved straight to your device, or passed to the share sheet on a phone.

Your files are held in memory only while the app is open. They are not stored by the app, and they are gone when you close it.

Because nothing is uploaded, there is no file size limit and no daily allowance. The only limit is how much memory your device has.

## What the app does send

The app does make a few small requests that have nothing to do with your files:

- **Signing in**, if you choose to. Nothing in the app requires an account.
- **An "app opened" note** when you are signed in, so your Universal ID activity is accurate. It says nothing about your files.
- **A "this app is in use" signal** every 45 seconds while the app is open and on screen. It contains the app's name, a random ID made on your device, and your account if you are signed in. It is used to show how many people are using the app.
- **Checking for updates** and fetching the list of changes.

There is no advertising and no third-party tracking.

## Check it yourself

The simplest test is to turn off your internet connection and compress something. It still works, because nothing needs to leave your device. The app is also open source, so anyone can read exactly what it does.`,
  },
]

export default articles
