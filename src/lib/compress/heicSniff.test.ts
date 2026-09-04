import { describe, expect, it } from 'vitest'
import { heicByName, heicFromBytes } from './heicSniff'

/**
 * What a file IS, when what it's called cannot be trusted.
 *
 * On Android the picker hands the page a display name that may have no
 * extension and a MIME from whichever app owns the file, so name-and-type alone
 * lets an iPhone photo through to die at `createImageBitmap` — in an app that
 * appears to support HEIC already.
 *
 * ⚠️ None of this tests the DECODE. `heic-to` is the only thing that can answer
 * for that, and it cannot be tested from a made-up file anyway: a generated
 * HEIC does not test HEIC (see the HEIC section of Docs_UNI_SIM/landmines.md).
 * These are header shapes, nothing more.
 *
 * Negative controls (2026-09-04, both run): dropping the AVIF exclusion reddens
 * the two avif cases; accepting any `ftyp` reddens the MP4.
 */

/** An ISO-BMFF head: a box length, `ftyp`, a major brand, then compatibles. */
function ftyp(major: string, ...compatible: string[]): Uint8Array {
  const brands = [major, ...compatible].join('')
  const head = `\0\0\0${String.fromCharCode(8 + brands.length)}ftyp${brands}`
  return Uint8Array.from(head, (c) => c.charCodeAt(0))
}

const bytes = (...nums: number[]) => Uint8Array.from(nums)

describe('heicFromBytes', () => {
  it('recognises what an iPhone writes', () => {
    expect(heicFromBytes(ftyp('heic', 'mif1', 'MiHB', 'MiHE', 'MiPr', 'miaf', 'tmap'))).toBe(true)
  })

  it('recognises the other HEIC brands phones use', () => {
    for (const brand of ['heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1']) {
      expect(heicFromBytes(ftyp(brand)), brand).toBe(true)
    }
  })

  it('recognises a HEIC whose major brand is generic', () => {
    // Samsung's "high efficiency" pictures lead with the container brand and
    // only say `heic` further down the compatible list.
    expect(heicFromBytes(ftyp('mif1', 'heic'))).toBe(true)
  })

  it('leaves AVIF alone', () => {
    expect(heicFromBytes(ftyp('avif', 'mif1', 'miaf'))).toBe(false)
    expect(heicFromBytes(ftyp('avis', 'avif', 'msf1'))).toBe(false)
  })

  it('says no to an MP4, which is the same container and not a photo', () => {
    expect(heicFromBytes(ftyp('isom', 'iso2', 'avc1', 'mp41'))).toBe(false)
  })

  it('says no to the formats a browser can already draw', () => {
    expect(heicFromBytes(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1))).toBe(
      false,
    ) // JPEG
    expect(heicFromBytes(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13))).toBe(
      false,
    ) // PNG
    expect(heicFromBytes(Uint8Array.from('RIFF\0\0\0\0WEBPVP8 ', (c) => c.charCodeAt(0)))).toBe(false)
  })

  it('answers rather than throwing on a file too short to have a header', () => {
    expect(heicFromBytes(bytes())).toBe(false)
    expect(heicFromBytes(bytes(0, 0, 0, 24, 0x66, 0x74))).toBe(false)
  })
})

describe('heicByName', () => {
  it('still carries Windows, where a .heic has no MIME registered', () => {
    expect(heicByName(new File([], 'photo.HEIC'))).toBe(true)
    expect(heicByName(new File([], 'photo.heif', { type: '' }))).toBe(true)
  })

  it('is not fooled by an ordinary photo', () => {
    expect(heicByName(new File([], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false)
  })

  it('cannot answer for what Android hands over — which is why the bytes exist', () => {
    expect(heicByName(new File([], '1000012345', { type: 'image/*' }))).toBe(false)
    expect(heicByName(new File([], '1000012345', { type: 'application/octet-stream' }))).toBe(false)
  })
})
