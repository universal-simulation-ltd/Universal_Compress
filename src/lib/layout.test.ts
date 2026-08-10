import { describe, expect, it } from 'vitest'
import { outputName, savingPercent } from './layout'

describe('the output filename', () => {
  it('versions a plain file rather than describing what happened to it', () => {
    expect(outputName('photo.png', 'jpg')).toBe('photo-v1.jpg')
    expect(outputName('report.pdf', 'pdf')).toBe('report-v1.pdf')
  })

  it('INCREMENTS instead of stacking — the whole reason this changed', () => {
    // The old `-compressed` suffix was appended, so compressing the output
    // again gave `photo-compressed-compressed.jpg`. Put v1 back in and you get
    // v2: the tail is parsed and replaced, not added to.
    expect(outputName('photo-v1.jpg', 'jpg')).toBe('photo-v2.jpg')
    expect(outputName('photo-v2.jpg', 'jpg')).toBe('photo-v3.jpg')
    expect(outputName('photo-v9.jpg', 'jpg')).toBe('photo-v10.jpg')
  })

  it('cleans up names the old version produced, however many it stacked', () => {
    expect(outputName('photo-compressed.jpg', 'jpg')).toBe('photo-v1.jpg')
    expect(outputName('photo-compressed-compressed.jpg', 'jpg')).toBe('photo-v1.jpg')
    expect(outputName('report-annotated-annotated.pdf', 'pdf')).toBe('report-v1.pdf')
  })

  it('leaves a word alone when it is not a suffix of ours', () => {
    // The match is anchored to a hyphen and to the end, so a file somebody
    // named themselves keeps its name.
    expect(outputName('uncompressed.png', 'jpg')).toBe('uncompressed-v1.jpg')
    expect(outputName('roundup.png', 'jpg')).toBe('roundup-v1.jpg')
  })

  it('keeps the rest of a hyphenated name', () => {
    expect(outputName('annual-report-2026.pdf', 'pdf')).toBe('annual-report-2026-v1.pdf')
    expect(outputName('annual-report-compressed.pdf', 'pdf')).toBe('annual-report-v1.pdf')
  })

  it('changes the extension when the format changes', () => {
    expect(outputName('clip.mov', 'mp4')).toBe('clip-v1.mp4')
    expect(outputName('song.flac', 'mp3')).toBe('song-v1.mp3')
  })

  it('copes with names that have no extension or only a dot', () => {
    expect(outputName('README', 'txt')).toBe('README-v1.txt')
    // A dotfile is all stem — `.gitignore` is not a file called "" of type
    // "gitignore".
    expect(outputName('.gitignore', 'txt')).toBe('.gitignore-v1.txt')
  })

  it('never returns a name that would overwrite the input', () => {
    for (const name of ['photo.png', 'photo-v1.png', 'photo-compressed.png', 'a.b.c.png']) {
      expect(outputName(name, 'png')).not.toBe(name)
    }
  })
})

describe('savingPercent', () => {
  it('reports a real increase rather than rounding it to a cheerful zero', () => {
    expect(savingPercent(100, 120)).toBe(-20)
    expect(savingPercent(100, 40)).toBe(60)
    expect(savingPercent(0, 40)).toBe(0)
  })
})
