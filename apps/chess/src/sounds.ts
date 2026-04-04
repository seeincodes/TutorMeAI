/**
 * Sound effects for the chess app using Web Audio API.
 * No audio files needed — all tones are synthesized.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // AudioContext not available
  }
}

/** Soft click when player places a piece */
export function playMove() {
  playTone(800, 0.06, 0.3, 'triangle')
}

/** Slightly deeper click when AI moves */
export function playAIMove() {
  playTone(600, 0.08, 0.25, 'triangle')
}

/** Heavier thud when a piece is captured */
export function playCapture() {
  playTone(300, 0.1, 0.35, 'triangle')
  setTimeout(() => playTone(200, 0.08, 0.2, 'sine'), 40)
}

/** Alert tone when king is in check */
export function playCheck() {
  playTone(880, 0.1, 0.3, 'square')
  setTimeout(() => playTone(880, 0.1, 0.3, 'square'), 150)
}

/** Victory fanfare — ascending major chord */
export function playWin() {
  playTone(523, 0.2, 0.3, 'sine')      // C5
  setTimeout(() => playTone(659, 0.2, 0.3, 'sine'), 150)   // E5
  setTimeout(() => playTone(784, 0.2, 0.3, 'sine'), 300)   // G5
  setTimeout(() => playTone(1047, 0.4, 0.25, 'sine'), 450)  // C6
}

/** Gentle descending tone for a loss */
export function playLoss() {
  playTone(440, 0.2, 0.2, 'sine')      // A4
  setTimeout(() => playTone(349, 0.2, 0.2, 'sine'), 200)   // F4
  setTimeout(() => playTone(294, 0.3, 0.15, 'sine'), 400)   // D4
}

/** Neutral tone for a draw */
export function playDraw() {
  playTone(440, 0.15, 0.2, 'sine')
  setTimeout(() => playTone(440, 0.15, 0.2, 'sine'), 200)
}

/** Illegal move buzz */
export function playIllegal() {
  playTone(200, 0.08, 0.25, 'sawtooth')
}
