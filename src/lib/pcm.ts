// The Float32 → Int16 conversion moved to @unisim/media 0.4.0 alongside the MP3
// encoder that was its only consumer here (§10.6). The measured facts that make
// it non-obvious — the asymmetric 32767/32768 scaling, and rounding rather than
// truncating — are documented at packages/media/src/pcm.ts and covered by that
// package's self-tests.
export { toInt16, channelToInt16 } from '@unisim/media'
