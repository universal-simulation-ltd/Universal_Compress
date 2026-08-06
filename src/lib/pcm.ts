/**
 * Float32 → Int16, for the LAME encoder.
 *
 * The scaling is asymmetric on purpose, and that isn't a stylistic choice: it
 * inverts what the browser's decoder does. Measured on Chrome by decoding known
 * int16 values — a positive sample comes back as `v / 32767` (32767 → exactly
 * 1.0) while a negative comes back as `v / 32768` (−16384 → exactly −0.5).
 * Scaling both by 32768 makes every positive sample land one LSB low.
 *
 * Round, don't truncate: `v/32767 × 32767` lands a hair under `v` in float32,
 * and truncation toward zero then loses a bit on roughly a quarter of samples.
 *
 * Clipping first keeps anything beyond ±1.0 from wrapping.
 */
export function toInt16(sample: number): number {
  const clipped = sample < -1 ? -1 : sample > 1 ? 1 : sample
  return Math.round(clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff)
}

/** A whole channel at once — what the MP3 encoder wants. */
export function channelToInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) out[i] = toInt16(samples[i])
  return out
}
