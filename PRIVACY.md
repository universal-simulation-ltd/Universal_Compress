# What Universal Compress does with your files

You landed here from the word **Guaranteed**, so this page owes you something
better than a privacy policy. It is written to be checked: every claim below
names the file in this repository that makes it true, and you are welcome to
go and read it.

The short version: **your files are compressed by your own browser.** There is
no upload, no queue, no server doing the work, and no account required. This
app has no button that sends your files anywhere, which is why the note on the
landing page carries no exceptions.

That is the whole reason to prefer it. Every "free online compressor" is free
because your file is the product: it goes to their machine, it is opened there,
and what it contains is worth something to somebody. A PDF is a contract, a
payslip, a scan of a passport. Compressing one should not mean handing it over.

---

## What happens when you drop files in

| Step | Where it happens | The code |
|---|---|---|
| Working out what each file is | your browser | [`src/lib/kinds.ts`](src/lib/kinds.ts) |
| Compressing a PDF | your browser, via Mozilla's PDF.js and pdf-lib | [`src/lib/compress/pdf.ts`](src/lib/compress/pdf.ts) |
| Compressing a video | your browser's **built-in** WebCodecs encoder | [`src/lib/compress/video.ts`](src/lib/compress/video.ts) |
| Compressing an image | your browser's own canvas | [`src/lib/compress/image.ts`](src/lib/compress/image.ts) |
| Compressing audio | your browser, via LAME compiled to WASM | [`src/lib/compress/audio.ts`](src/lib/compress/audio.ts) |
| Saving the results | your browser's download | [`src/lib/download.ts`](src/lib/download.ts) |

Nothing in that table is a network call. The files you dropped are held in the
tab you dropped them into — see
[`src/stores/compressStore.ts`](src/stores/compressStore.ts) — and they are gone
when you close it.

**There is no size limit and no daily quota**, and that is a consequence rather
than a generosity: limits and quotas exist to ration someone's server, and
there isn't one. The only ceiling is your own computer's memory.

---

## What the app talks to a server for, even though your files don't

If you open your browser's Network tab you will see a few requests, and a
privacy page that pretended otherwise would look like a lie.

- **Signing in.** Only if you choose to. Nothing in this app requires it.
- **"You opened the app".** When you are signed in, the app records one event
  saying the app was opened, so your account's activity page is accurate. It
  does not include anything about your files — not their names, not their
  sizes, not what kind they were. See [`src/UsageTracker.tsx`](src/UsageTracker.tsx).
- **The changelog and update notice.**

**There is no third-party analytics, no tracking pixel, and no advertising
script.** You can check that without reading any code: view the page source of
[the live app](https://opensource.unisim.co.uk/compress/) and look at what it
loads. Everything comes from our own domain.

---

## How to prove it to yourself in about a minute

**Turn off your Wi-Fi and compress something.** It works. That is conclusive in
a way that reading a policy never is, and it takes ten seconds.

If you'd rather watch than disconnect: developer tools (F12) → **Network**,
then drop a file in and compress it. Your file is never in the list.

---

## If you find this page is wrong

That is worth more to us than it costs. Open an issue on
[the repository](https://github.com/universal-simulation-ltd/Universal_Compress/issues).
A claim nobody can correct isn't a guarantee either.
