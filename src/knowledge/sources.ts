import type { Source } from './types'

// The research, standards and reports behind each article, keyed by article
// id. The same in every language, so kept once here and attached by index.ts.
//
// Original research papers first, then the standards, then guidance — and
// only sources for what the app really does (checked against src/ on
// 2026-09-29: pdf-lib re-saves a PDF with object streams at Light, pdf.js
// renders pages to JPEG at Balanced and Maximum; images are re-encoded through
// the browser's canvas, HEIC decoded by heic-to (libheif); animated GIFs go
// through our own GIF89a writer — median-cut palette plus LZW — in
// lib/gif/encode.ts; video is H.264 through WebCodecs with @unisim/media's MP4
// demuxer and muxer; audio is MP3 from lamejs or AAC from the WebCodecs
// AudioEncoder, both via @unisim/media; the "all as a ZIP" download is
// @unisim/media's STORED-only writer, which is why the article says it does
// not squeeze further).
//
// ⚠️ `pdf` (our hosted copy at opensource.unisim.co.uk/kb/papers/) ONLY where
// the licence allows redistribution — here, only the IETF's DEFLATE RFC. The
// IEEE, ACM, AES, ISO, W3C, Ecma and PKWARE documents link to the publisher's
// or the authors' own free copy instead. The Brandenburg paper's university
// host timed out on every attempt, so it links to the Wayback Machine's
// capture of the same PDF. Adobe took its free ISO 32000-1 copy offline in
// 2026, so it links to the Wayback snapshot too. ACM's landing page for
// Heckbert bot-blocks curl; the DOI was confirmed through doi.org's handle API
// and a Wayback capture.

const SHANNON: Source = {
  kind: 'paper',
  title: 'A Mathematical Theory of Communication',
  authors: 'Claude E. Shannon',
  publisher: 'Bell System Technical Journal',
  year: 1948,
  href: 'https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf',
}

const MP3_AAC: Source = {
  kind: 'paper',
  title: 'MP3 and AAC Explained',
  authors: 'Karlheinz Brandenburg',
  publisher: 'AES International Conference on High-Quality Audio Coding',
  year: 1999,
  href: 'https://web.archive.org/web/20170808182543/http://www.lpi.tel.uva.es/~nacho/docencia/ing_ond_1/trabajos_01_02/formatos_audio_digital/archivos/3-1.pdf',
}

const DEFLATE: Source = {
  kind: 'standard',
  title: 'DEFLATE Compressed Data Format Specification version 1.3 (RFC 1951)',
  authors: 'L. Peter Deutsch',
  publisher: 'IETF',
  year: 1996,
  href: 'https://www.rfc-editor.org/rfc/rfc1951.html',
  pdf: 'papers/rfc-1951-deflate.pdf',
  licence: 'IETF Trust — RFC, freely redistributable unmodified',
}

const WEBCODECS: Source = {
  kind: 'standard',
  title: 'WebCodecs — the browser\'s built-in video and audio encoders',
  publisher: 'W3C',
  year: 2026,
  href: 'https://www.w3.org/TR/webcodecs/',
}

export const SOURCES: Record<string, Source[]> = {
  'what-is-compression': [
    SHANNON,
    {
      kind: 'paper',
      title: 'A Method for the Construction of Minimum-Redundancy Codes',
      authors: 'David A. Huffman',
      publisher: 'Proceedings of the I.R.E.',
      year: 1952,
      href: 'http://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf',
    },
    {
      kind: 'paper',
      title: 'A Universal Algorithm for Sequential Data Compression',
      authors: 'Jacob Ziv, Abraham Lempel',
      publisher: 'IEEE Transactions on Information Theory',
      year: 1977,
      href: 'https://courses.cs.duke.edu/spring03/cps296.5/papers/ziv_lempel_1977_universal_algorithm.pdf',
    },
    MP3_AAC,
  ],
  'lossless-and-lossy': [
    DEFLATE,
    {
      kind: 'paper',
      title: 'The JPEG Still Picture Compression Standard',
      authors: 'Gregory K. Wallace',
      publisher: 'IEEE Transactions on Consumer Electronics',
      year: 1992,
      href: 'https://www.ijg.org/files/Wallace.JPEG.pdf',
    },
    MP3_AAC,
  ],
  'why-some-files-barely-shrink': [
    SHANNON,
    { ...DEFLATE, title: 'DEFLATE Compressed Data Format Specification version 1.3 (RFC 1951), §3.2.4: non-compressed blocks' },
    {
      kind: 'standard',
      title: 'APPNOTE.TXT — .ZIP File Format Specification, version 6.3.10',
      publisher: 'PKWARE',
      year: 2022,
      href: 'https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT',
    },
    {
      kind: 'standard',
      title: 'ECMA-376: Office Open XML File Formats (Part 2: Open Packaging Conventions — a Word, Excel or PowerPoint file is a ZIP)',
      publisher: 'Ecma International',
      href: 'https://ecma-international.org/publications-and-standards/standards/ecma-376/',
    },
  ],
  'how-universal-compress-works': [
    {
      kind: 'standard',
      title: 'ISO 32000-1:2008 — PDF 1.7, §7.5.7: object streams (Adobe\'s free copy)',
      publisher: 'Adobe Systems / ISO',
      year: 2008,
      href: 'https://web.archive.org/web/20260827044602/https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
    },
    {
      kind: 'paper',
      title: 'Overview of the H.264/AVC Video Coding Standard',
      authors: 'Thomas Wiegand, Gary J. Sullivan, Gisle Bjøntegaard, Ajay Luthra',
      publisher: 'IEEE Transactions on Circuits and Systems for Video Technology',
      year: 2003,
      href: 'https://www.csd.uoc.gr/~hy474/bibliography/AVC_OverviewH.264.pdf',
    },
    WEBCODECS,
    {
      kind: 'paper',
      title: 'Color Image Quantization for Frame Buffer Display (median cut — how an animated GIF\'s palette is chosen)',
      authors: 'Paul Heckbert',
      publisher: 'ACM SIGGRAPH',
      year: 1982,
      href: 'https://doi.org/10.1145/965145.801294',
    },
  ],
  'your-files-stay-on-your-device': [
    {
      kind: 'paper',
      title: 'Local-first software: You own your data, in spite of the cloud',
      authors: 'Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan',
      publisher: 'ACM Onward!',
      year: 2019,
      href: 'https://www.inkandswitch.com/local-first/static/local-first.pdf',
    },
    WEBCODECS,
  ],
}
